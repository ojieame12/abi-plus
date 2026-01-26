// Hybrid Response Synthesizer
// Combines Beroe and Web data into a unified narrative with inline citations

import type {
  HybridDataResult,
  HybridResponse,
  Citation,
  CitationMap,
  SynthesisMetadata,
} from '../types/hybridResponse';
import type { DetectedIntent } from '../types/intents';
import { buildHybridSources } from './hybridDataFetcher';

// ============================================
// GEMINI API CONFIGURATION
// ============================================

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
// Use stable model for reliable JSON mode support
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================
// SYNTHESIS PROMPT TEMPLATE
// ============================================

const SYNTHESIS_PROMPT = `Synthesize procurement intelligence into a unified narrative.

BEROE DATA:
{beroeContent}

WEB RESEARCH:
{webContent}

CITATIONS (use these IDs only):
{evidencePool}

RULES:
- 3-5 paragraphs, 400-600 words minimum
- Use ALL available citations: every [B#] and [W#] from the list
- Place citations IMMEDIATELY after claims: "Prices rose 6.2% [B1] amid constraints [W2]"
- Structure: Opening insight → Analysis with data → Market drivers → Procurement implications
- Blend Beroe (pricing, benchmarks, risk) with web (news, trends)

OUTPUT: Return ONLY valid JSON with this exact format:
{"content": "your narrative here with [B1] [W1] citations...", "agreementLevel": "high|medium|low", "keyInsight": "one sentence summary"}`;

// Repair prompt for when JSON parsing fails
const REPAIR_PROMPT = `Convert this text into valid JSON with this exact structure:
{"content": "...", "agreementLevel": "high|medium|low", "keyInsight": "..."}

Text to convert:
{text}

Return ONLY the JSON object. No explanation.`;

// Minimum thresholds for quality synthesis
const MIN_CONTENT_LENGTH = 400;
const MIN_BEROE_CITATIONS = 2;
const MIN_WEB_CITATIONS = 1;

// ============================================
// SYNTHESIZER
// ============================================

interface SynthesizeOptions {
  managedCategories?: string[];
}

/**
 * Synthesize hybrid data into a unified response with inline citations
 */
export async function synthesizeHybridResponse(
  data: HybridDataResult,
  intent: DetectedIntent,
  options?: SynthesizeOptions
): Promise<HybridResponse> {
  const { managedCategories } = options || {};

  // Build the evidence pool text for the prompt
  const evidencePoolText = formatEvidencePool(data.evidencePool);

  // If no web data, use simpler approach (no synthesis needed)
  if (!data.web || data.web.sources.length === 0) {
    return buildBeroeOnlyResponse(data, intent, managedCategories);
  }

  // Count available citations for guardrails
  const availableBeroeCitations = data.beroe.sources.filter(s => s.citationId).length;
  const availableWebCitations = data.web?.sources.filter(s => s.citationId).length || 0;

  // Build synthesis prompt
  const prompt = SYNTHESIS_PROMPT
    .replace('{beroeContent}', data.beroe.content || 'No Beroe data available.')
    .replace('{webContent}', data.web.content || 'No web data available.')
    .replace('{evidencePool}', evidencePoolText);

  console.log('[HybridSynthesizer] Starting synthesis with', availableBeroeCitations, 'Beroe and', availableWebCitations, 'Web citations');

  // Call LLM to synthesize, with fallback to deterministic synthesis
  let synthesizedContent: string;
  let agreementLevel: SynthesisMetadata['agreementLevel'] = 'medium';
  let usedDeterministicFallback = false;

  try {
    const llmResponse = await callSynthesisLLM(prompt, data.evidencePool);
    synthesizedContent = llmResponse.content;
    agreementLevel = (llmResponse.agreementLevel as SynthesisMetadata['agreementLevel']) || 'medium';

    // === QUALITY GUARDRAILS ===

    // Check 1: Content length threshold
    if (synthesizedContent.length < MIN_CONTENT_LENGTH) {
      console.warn('[HybridSynthesizer] Content too short:', synthesizedContent.length, '< threshold', MIN_CONTENT_LENGTH);
      synthesizedContent = deterministicSynthesis(data);
      usedDeterministicFallback = true;
    }

    // Check 2: Citation coverage
    const beroeCitCount = countCitations(synthesizedContent, 'B');
    const webCitCount = countCitations(synthesizedContent, 'W');
    const minBeroeRequired = Math.min(MIN_BEROE_CITATIONS, availableBeroeCitations);
    const minWebRequired = Math.min(MIN_WEB_CITATIONS, availableWebCitations);

    if (!usedDeterministicFallback && (beroeCitCount < minBeroeRequired || webCitCount < minWebRequired)) {
      console.warn('[HybridSynthesizer] Insufficient citations - B:', beroeCitCount, '/', minBeroeRequired, 'W:', webCitCount, '/', minWebRequired);

      // Try citation augmentation before full fallback
      synthesizedContent = augmentCitations(synthesizedContent, data);
      const newBeroeCount = countCitations(synthesizedContent, 'B');
      const newWebCount = countCitations(synthesizedContent, 'W');

      // If still insufficient, use deterministic fallback
      if (newBeroeCount < minBeroeRequired || newWebCount < minWebRequired) {
        console.warn('[HybridSynthesizer] Citation augmentation insufficient, using deterministic fallback');
        synthesizedContent = deterministicSynthesis(data);
        usedDeterministicFallback = true;
      }
    }

    console.log('[HybridSynthesizer] LLM synthesis', usedDeterministicFallback ? 'used fallback' : 'successful', '- length:', synthesizedContent.length);
  } catch (error) {
    console.warn('[HybridSynthesizer] LLM synthesis failed, using deterministic fallback:', error);
    synthesizedContent = deterministicSynthesis(data);
    usedDeterministicFallback = true;
  }

  // Ensure we have content - use Beroe content directly as last resort
  if (!synthesizedContent || synthesizedContent.trim().length === 0) {
    console.warn('[HybridSynthesizer] No content from synthesis, using Beroe content directly');
    synthesizedContent = data.beroe.content || 'Analysis based on available data.';
  }

  // Build citation map
  const citations: CitationMap = {};
  for (const c of data.evidencePool) {
    citations[c.id] = c;
  }

  // Validate citations - remove any that don't exist in pool
  const validCitationIds = new Set(data.evidencePool.map(c => c.id));

  const { text: validatedContent, unknownCitations } = validateCitations(
    synthesizedContent,
    validCitationIds
  );
  if (unknownCitations.length > 0) {
    console.warn('[HybridSynthesizer] Removed unknown citations:', unknownCitations);
  }

  // Final telemetry
  const finalBeroeCitations = countCitations(validatedContent, 'B');
  const finalWebCitations = countCitations(validatedContent, 'W');
  console.log('[HybridSynthesizer] Final output - length:', validatedContent.length, 'B citations:', finalBeroeCitations, 'W citations:', finalWebCitations);

  // Build sources with confidence
  const sources = buildHybridSources(
    data.beroe,
    data.web,
    data.evidencePool,
    intent.extractedEntities?.category || intent.extractedEntities?.commodity,
    managedCategories
  );

  // Calculate synthesis metadata
  const synthesisMetadata = calculateSynthesisMetadata(validatedContent, data);
  synthesisMetadata.agreementLevel = agreementLevel;

  return {
    content: validatedContent,
    citations,
    confidence: sources.confidence!,
    widget: data.beroe.structuredData,
    insight: data.beroe.insight,
    synthesisMetadata,
  };
}

/**
 * Format evidence pool for inclusion in synthesis prompt
 */
function formatEvidencePool(pool: Citation[]): string {
  if (pool.length === 0) return 'No citations available.';

  return pool.map(c => {
    const parts = [`[${c.id}] ${c.name}`];
    if (c.snippet) parts.push(`"${c.snippet}"`);
    if (c.category) parts.push(`(${c.category})`);
    return parts.join(' - ');
  }).join('\n');
}

// ============================================
// LLM SYNTHESIS CALL
// ============================================

/**
 * Call Gemini to synthesize the hybrid response with timeout
 * Uses JSON mode for structured output
 */
async function callSynthesisLLM(
  prompt: string,
  evidencePool: Citation[]
): Promise<{ content: string; agreementLevel?: string; keyInsight?: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!textContent) {
      throw new Error('Empty response from Gemini');
    }

    // With JSON mode, should parse directly, but still use fallback parser
    const parsed = parseJsonResponse(textContent);

    // If parsing succeeded but content is weak, try repair
    if (!parsed.content || parsed.content.length < 100) {
      console.warn('[HybridSynthesizer] Weak content from JSON mode, attempting repair');
      return await repairJsonResponse(textContent);
    }

    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Synthesis LLM call timed out after 20 seconds');
    }
    throw error;
  }
}

/**
 * Repair pass: convert malformed response to valid JSON
 */
async function repairJsonResponse(
  malformedText: string
): Promise<{ content: string; agreementLevel?: string; keyInsight?: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const repairPrompt = REPAIR_PROMPT.replace('{text}', malformedText.slice(0, 2000));

  const requestBody = {
    contents: [{ parts: [{ text: repairPrompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Repair call failed');
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseJsonResponse(textContent);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[HybridSynthesizer] Repair pass failed:', error);
    // Return the malformed text as content (last resort before deterministic fallback)
    return { content: malformedText };
  }
}

/**
 * Deterministic synthesis fallback that uses ALL available sources
 * Builds a structured narrative with comprehensive citation coverage
 */
function deterministicSynthesis(data: HybridDataResult): string {
  const beroe = data.beroe;
  const web = data.web;

  // Collect ALL citation IDs
  const beroeCitations = beroe.sources
    .map(s => s.citationId)
    .filter((id): id is string => !!id);

  const webCitations = web?.sources
    .map(s => s.citationId)
    .filter((id): id is string => !!id) || [];

  // Get evidence pool for snippets
  const evidenceMap = new Map(data.evidencePool.map(e => [e.id, e]));

  const sections: string[] = [];

  // === PARAGRAPH 1: Executive Summary with Beroe data ===
  if (beroe.content && beroe.content.trim().length > 0) {
    const sentences = splitIntoSentences(beroe.content);
    let para1 = '';

    // First sentence with [B1]
    if (sentences.length > 0 && beroeCitations.length > 0) {
      para1 = sentences[0] + ` [${beroeCitations[0]}]`;
    } else if (sentences.length > 0) {
      para1 = sentences[0];
    }

    // Second sentence with [B2] if available
    if (sentences.length > 1 && beroeCitations.length > 1) {
      para1 += ' ' + sentences[1] + ` [${beroeCitations[1]}]`;
    } else if (sentences.length > 1) {
      para1 += ' ' + sentences[1];
    }

    // Third sentence with [B3] if available
    if (sentences.length > 2 && beroeCitations.length > 2) {
      para1 += ' ' + sentences[2] + ` [${beroeCitations[2]}]`;
    } else if (sentences.length > 2) {
      para1 += ' ' + sentences[2];
    }

    if (para1) sections.push(para1);
  }

  // === PARAGRAPH 2: Market Context from Web Sources ===
  if (web && web.content && web.content.trim().length > 0) {
    const webSentences = splitIntoSentences(web.content);
    let para2 = 'Market research provides additional context.';

    // Add web sentences with citations round-robin
    for (let i = 0; i < Math.min(webSentences.length, 3); i++) {
      const citationId = webCitations[i % webCitations.length];
      if (citationId) {
        para2 += ' ' + webSentences[i] + ` [${citationId}]`;
      } else {
        para2 += ' ' + webSentences[i];
      }
    }

    sections.push(para2);
  }

  // === PARAGRAPH 3: Key Drivers Bullet List ===
  const drivers: string[] = [];

  // Extract key drivers from evidence snippets
  for (const citation of data.evidencePool.slice(0, 6)) {
    if (citation.snippet && citation.snippet.length > 20) {
      const driverText = citation.snippet.length > 100
        ? citation.snippet.slice(0, 100) + '...'
        : citation.snippet;
      drivers.push(`• ${driverText} [${citation.id}]`);
    }
  }

  // If we don't have enough snippets, create generic drivers
  if (drivers.length < 2) {
    if (beroeCitations.length > 0) {
      drivers.push(`• Pricing intelligence based on Beroe market analysis [${beroeCitations[0]}]`);
    }
    if (webCitations.length > 0) {
      drivers.push(`• Industry trends corroborated by external research [${webCitations[0]}]`);
    }
  }

  if (drivers.length > 0) {
    sections.push('**Key Drivers:**\n' + drivers.join('\n'));
  }

  // === PARAGRAPH 4: Synthesis & Implications ===
  const usedBeroeCitations = beroeCitations.slice(-2).filter(Boolean);
  const usedWebCitations = webCitations.slice(-2).filter(Boolean);

  let conclusion = 'This analysis draws from ';
  if (beroeCitations.length > 0 && webCitations.length > 0) {
    conclusion += `Beroe\'s proprietary intelligence`;
    if (usedBeroeCitations.length > 0) {
      conclusion += ` [${usedBeroeCitations.join('] [')}]`;
    }
    conclusion += ` and external market data`;
    if (usedWebCitations.length > 0) {
      conclusion += ` [${usedWebCitations.join('] [')}]`;
    }
    conclusion += ', providing a comprehensive view for procurement decision-making.';
  } else if (beroeCitations.length > 0) {
    conclusion += `Beroe\'s proprietary market intelligence [${beroeCitations.join('] [')}], offering decision-grade insights for procurement planning.`;
  } else if (webCitations.length > 0) {
    conclusion += `external market research [${webCitations.join('] [')}], providing current market context.`;
  } else {
    conclusion = 'This analysis provides an overview of current market conditions.';
  }

  sections.push(conclusion);

  // Join all sections
  const result = sections.join('\n\n');

  // Ensure minimum content length
  if (result.length < MIN_CONTENT_LENGTH && beroe.content) {
    // Append more Beroe content if too short
    const additionalContent = beroe.content.slice(0, 300);
    return result + '\n\n' + additionalContent;
  }

  return result;
}

/**
 * Split content into clean sentences
 */
function splitIntoSentences(content: string): string[] {
  return content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

/**
 * Augment content with additional citations if coverage is insufficient
 * Appends an "Evidence" paragraph that references unused citations
 */
function augmentCitations(content: string, data: HybridDataResult): string {
  const usedCitations = new Set<string>();
  const citationRegex = /\[([BW]\d+)\]/g;
  let match;
  while ((match = citationRegex.exec(content)) !== null) {
    usedCitations.add(match[1]);
  }

  // Find unused citations
  const unusedBeroCitations: string[] = [];
  const unusedWebCitations: string[] = [];

  for (const citation of data.evidencePool) {
    if (!usedCitations.has(citation.id)) {
      if (citation.id.startsWith('B')) {
        unusedBeroCitations.push(citation.id);
      } else {
        unusedWebCitations.push(citation.id);
      }
    }
  }

  // Build evidence paragraph with unused citations
  const evidenceParts: string[] = [];

  if (unusedBeroCitations.length > 0) {
    const beroeRefs = unusedBeroCitations.slice(0, 3).map(id => `[${id}]`).join(' ');
    evidenceParts.push(`Additional Beroe intelligence ${beroeRefs} supports this analysis.`);
  }

  if (unusedWebCitations.length > 0) {
    const webRefs = unusedWebCitations.slice(0, 3).map(id => `[${id}]`).join(' ');
    evidenceParts.push(`Market research ${webRefs} provides further context.`);
  }

  if (evidenceParts.length > 0) {
    return content + '\n\n**Supporting Evidence:**\n' + evidenceParts.join(' ');
  }

  return content;
}

/**
 * Extract a key insight from web content (first sentence or summary)
 */
function extractKeyInsight(content: string): string {
  // Get first sentence
  const firstSentence = content.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length > 20) {
    return firstSentence.trim() + '.';
  }
  // Fallback to truncated content
  return content.slice(0, 200) + (content.length > 200 ? '...' : '');
}

/**
 * Extract a secondary insight from web content (second or third sentence)
 */
function extractSecondaryInsight(content: string): string {
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 15);
  // Try to get the second or third sentence
  if (sentences.length > 1) {
    const secondSentence = sentences[1].trim();
    if (secondSentence.length > 20) {
      return secondSentence + '.';
    }
  }
  if (sentences.length > 2) {
    const thirdSentence = sentences[2].trim();
    if (thirdSentence.length > 20) {
      return thirdSentence + '.';
    }
  }
  // Fallback: return empty if no good secondary content
  return '';
}

/**
 * Build response when only Beroe data is available
 */
function buildBeroeOnlyResponse(
  data: HybridDataResult,
  intent: DetectedIntent,
  managedCategories?: string[]
): HybridResponse {
  // Build citation map
  const citations: CitationMap = {};
  for (const c of data.evidencePool) {
    citations[c.id] = c;
  }

  // Add citations to content
  let content = data.beroe.content;
  if (data.evidencePool.length > 0) {
    // Add citation at end if not already present
    if (!content.includes('[B1]') && !content.includes('[B2]')) {
      content = `${content} [B1]`;
    }
  }

  // Build sources with confidence
  const sources = buildHybridSources(
    data.beroe,
    null,
    data.evidencePool,
    intent.extractedEntities?.category || intent.extractedEntities?.commodity,
    managedCategories
  );

  return {
    content,
    citations,
    confidence: sources.confidence!,
    widget: data.beroe.structuredData,
    insight: data.beroe.insight,
    synthesisMetadata: {
      beroeClaimsCount: countCitations(content, 'B'),
      webClaimsCount: 0,
      agreementLevel: 'high', // Beroe-only is always consistent
    },
  };
}

/**
 * Calculate synthesis metadata from the response
 */
function calculateSynthesisMetadata(
  content: string,
  data: HybridDataResult
): SynthesisMetadata {
  const beroeClaimsCount = countCitations(content, 'B');
  const webClaimsCount = countCitations(content, 'W');

  // Determine agreement level based on claim ratio
  let agreementLevel: SynthesisMetadata['agreementLevel'] = 'medium';

  if (data.web === null || webClaimsCount === 0) {
    agreementLevel = 'high'; // Single source = consistent
  } else if (beroeClaimsCount > 0 && webClaimsCount > 0) {
    // Both sources cited = some agreement
    agreementLevel = beroeClaimsCount >= webClaimsCount ? 'high' : 'medium';
  } else if (webClaimsCount > beroeClaimsCount * 2) {
    agreementLevel = 'low'; // Web-heavy might indicate Beroe gaps
  }

  return {
    beroeClaimsCount,
    webClaimsCount,
    agreementLevel,
  };
}

/**
 * Count citations with a specific prefix in text
 */
export function countCitations(text: string, prefix: string): number {
  const regex = new RegExp(`\\[${prefix}\\d+\\]`, 'g');
  return (text.match(regex) || []).length;
}

/**
 * Validate that all citations in text exist in the evidence pool
 * Strips or marks unknown citations
 */
export function validateCitations(
  text: string,
  validCitations: Set<string>
): { text: string; unknownCitations: string[] } {
  const unknownCitations: string[] = [];
  const regex = /\[([BW]\d+)\]/g;

  const validatedText = text.replace(regex, (match, citationId) => {
    if (validCitations.has(citationId)) {
      return match; // Keep valid citation
    }
    unknownCitations.push(citationId);
    return ''; // Remove unknown citation
  });

  return { text: validatedText, unknownCitations };
}

/**
 * Parse JSON response from LLM, with fallback
 */
export function parseJsonResponse(text: string): {
  content: string;
  agreementLevel?: string;
  keyInsight?: string;
} {
  // First, strip markdown code fences (both triple and single backticks)
  let cleaned = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .replace(/^`json\s*/im, '')  // Single backtick variant
    .replace(/^`\s*/im, '')
    .replace(/`\s*$/im, '')
    .trim();

  // Method 1: Try direct JSON parse
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.content === 'string' && parsed.content.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Continue to fallback methods
  }

  // Method 2: Try to fix common JSON issues and parse again
  try {
    // Sometimes LLM adds trailing content after JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed.content === 'string' && parsed.content.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Continue to fallback methods
  }

  // Method 3: Extract content field with multi-line support
  // Match "content": "..." where ... can span multiple lines (handles escaped chars)
  const contentStartMatch = cleaned.match(/"content"\s*:\s*"/);
  if (contentStartMatch) {
    const startIdx = cleaned.indexOf(contentStartMatch[0]) + contentStartMatch[0].length;
    let endIdx = startIdx;
    let escaped = false;

    // Manually find the closing quote, handling escapes
    for (let i = startIdx; i < cleaned.length; i++) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (cleaned[i] === '\\') {
        escaped = true;
        continue;
      }
      if (cleaned[i] === '"') {
        endIdx = i;
        break;
      }
    }

    if (endIdx > startIdx) {
      const rawContent = cleaned.slice(startIdx, endIdx);
      const extractedContent = rawContent
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');

      if (extractedContent.length > 50) {
        // Also try to extract agreementLevel
        const agreementMatch = cleaned.match(/"agreementLevel"\s*:\s*"(high|medium|low)"/i);
        return {
          content: extractedContent,
          agreementLevel: agreementMatch?.[1]
        };
      }
    }
  }

  // Method 4: If the text itself looks like a narrative (not JSON), use it directly
  // This handles cases where Gemini ignores the JSON format instruction
  if (!cleaned.startsWith('{') && cleaned.length > 100) {
    // Check if it contains citation markers - if so, it's likely the narrative
    if (/\[[BW]\d+\]/.test(cleaned)) {
      return { content: cleaned };
    }
  }

  // Final fallback: clean any JSON-like prefixes from raw text
  const cleanedFallback = cleaned
    .replace(/^\s*\{\s*"content"\s*:\s*"?/i, '')
    .replace(/"?\s*,?\s*"agreementLevel".*$/s, '')
    .replace(/"\s*\}\s*$/s, '') // Remove trailing "}
    .trim();

  console.warn('[HybridSynthesizer] Using cleaned text as fallback content');
  return { content: cleanedFallback || text };
}
