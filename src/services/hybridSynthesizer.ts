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
const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================
// SYNTHESIS PROMPT TEMPLATE
// ============================================

const SYNTHESIS_PROMPT = `You are synthesizing information from two authoritative sources into ONE unified response with proper citations.

## BEROE INTELLIGENCE (Internal, decision-grade procurement data):
{beroeContent}

## WEB RESEARCH (Recent market news and industry analysis):
{webContent}

## AVAILABLE CITATIONS (Use ONLY these - do NOT invent citation IDs):
{evidencePool}

## SYNTHESIS RULES:
1. Write ONE cohesive narrative that combines insights from both sources
2. CITE EVERY factual claim with the appropriate [B1], [W1] citation markers
3. Place citations IMMEDIATELY after the claim they support, e.g., "Steel prices rose 3% [B1]"
4. PRIORITIZE Beroe data for decision-grade claims (pricing, risk scores, benchmarks)
5. USE web data for market context, recent news, and validation
6. NOTE where sources AGREE or CONFLICT
7. Keep response concise but comprehensive (2-4 paragraphs)
8. Do NOT include citations not in the evidence pool above

## RESPONSE FORMAT (JSON):
{
  "content": "Your synthesized narrative with [B1][W2] citations inline throughout the text...",
  "agreementLevel": "high|medium|low",
  "keyInsight": "One-sentence headline summarizing the main finding"
}`;

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

  // Build synthesis prompt
  const prompt = SYNTHESIS_PROMPT
    .replace('{beroeContent}', data.beroe.content || 'No Beroe data available.')
    .replace('{webContent}', data.web.content || 'No web data available.')
    .replace('{evidencePool}', evidencePoolText);

  console.log('[HybridSynthesizer] Synthesizing response with LLM...');

  // Call LLM to synthesize, with fallback to simple merge
  let synthesizedContent: string;
  let agreementLevel: SynthesisMetadata['agreementLevel'] = 'medium';

  try {
    const llmResponse = await callSynthesisLLM(prompt, data.evidencePool);
    synthesizedContent = llmResponse.content;
    agreementLevel = (llmResponse.agreementLevel as SynthesisMetadata['agreementLevel']) || 'medium';
    console.log('[HybridSynthesizer] LLM synthesis successful, content length:', synthesizedContent.length);
  } catch (error) {
    console.warn('[HybridSynthesizer] LLM synthesis failed, using simple merge:', error);
    synthesizedContent = simpleMerge(data);
    console.log('[HybridSynthesizer] Simple merge fallback, content length:', synthesizedContent.length);
  }

  // Ensure we have content - use Beroe content directly as last resort
  if (!synthesizedContent || synthesizedContent.trim().length === 0) {
    console.warn('[HybridSynthesizer] No content from synthesis or merge, using Beroe content directly');
    synthesizedContent = data.beroe.content || 'Analysis based on available data.';
  }

  // Build citation map
  const citations: CitationMap = {};
  for (const c of data.evidencePool) {
    citations[c.id] = c;
  }

  // Validate citations - remove any that don't exist in pool
  const validCitationIds = new Set(data.evidencePool.map(c => c.id));
  console.log('[HybridSynthesizer] Valid citation IDs:', Array.from(validCitationIds));
  console.log('[HybridSynthesizer] Synthesized content preview:', synthesizedContent.slice(0, 200));

  const { text: validatedContent, unknownCitations } = validateCitations(
    synthesizedContent,
    validCitationIds
  );
  if (unknownCitations.length > 0) {
    console.warn('[HybridSynthesizer] Removed unknown citations:', unknownCitations);
  }
  console.log('[HybridSynthesizer] Validated content has citations:', /\[[BW]\d+\]/.test(validatedContent));
  console.log('[HybridSynthesizer] Citations map size:', Object.keys(citations).length);

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
      temperature: 0.3, // Lower temperature for factual synthesis
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
  };

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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

    // Parse the JSON response
    return parseJsonResponse(textContent);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Synthesis LLM call timed out after 15 seconds');
    }
    throw error;
  }
}

/**
 * Simple merge when both sources are available
 * Adds citation markers to key claims
 */
function simpleMerge(data: HybridDataResult): string {
  const beroe = data.beroe;
  const web = data.web;
  const parts: string[] = [];

  // Add Beroe content with citations
  if (beroe.content && beroe.content.trim().length > 0) {
    if (beroe.sources.length > 0) {
      // Add first Beroe citation to the content
      const citationId = beroe.sources[0].citationId || 'B1';
      parts.push(`${beroe.content} [${citationId}]`);
    } else {
      parts.push(beroe.content);
    }
  }

  // Add web content with citations if available
  if (web && web.content && web.content.trim().length > 0 && web.sources.length > 0) {
    const citationId = web.sources[0].citationId || 'W1';
    // Add a transition and web insight
    parts.push(`\n\nRecent market research indicates: ${extractKeyInsight(web.content)} [${citationId}]`);
  } else if (web && web.content && web.content.trim().length > 0) {
    // Web content but no sources
    parts.push(`\n\n${extractKeyInsight(web.content)}`);
  }

  // Always return something
  if (parts.length === 0) {
    return 'Analysis based on available data.';
  }

  return parts.join('');
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
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/^`json\s*/i, '')  // Single backtick variant
    .replace(/^`\s*/i, '')
    .replace(/`\s*$/i, '')
    .trim();

  try {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.content === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[HybridSynthesizer] Failed to parse JSON response:', e);
  }

  // Fallback: try to extract just the content field value
  const contentMatch = text.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
  if (contentMatch) {
    // Unescape the content
    const extractedContent = contentMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    console.log('[HybridSynthesizer] Extracted content from partial JSON');
    return { content: extractedContent };
  }

  // Final fallback: clean any JSON-like prefixes from raw text
  const cleanedFallback = cleaned
    .replace(/^\s*\{\s*"content"\s*:\s*"?/i, '')
    .replace(/"?\s*,?\s*"agreementLevel".*$/s, '')
    .trim();

  console.warn('[HybridSynthesizer] Using cleaned text as fallback content');
  return { content: cleanedFallback || text };
}
