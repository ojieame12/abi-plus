// DeepSeek R1 API Service for deep reasoning and synthesis
// Used for synthesizing research findings into comprehensive reports
// Gemini Flash used for structured JSON extraction (visual data, titles)

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
// Must match the working model in gemini.ts — preview model gemini-2.5-flash-preview-05-20 is deprecated (404)
const GEMINI_FLASH_MODEL = 'gemini-3-flash-preview';
const GEMINI_FLASH_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH_MODEL}:generateContent`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeminiSchema = Record<string, any>;

/**
 * Call Gemini Flash for schema-enforced JSON extraction.
 * Uses responseMimeType + responseSchema for guaranteed valid JSON.
 * Falls back to DeepSeek V3 if Gemini fails.
 */
const callGeminiJSON = async <T>(
  prompt: string,
  schema: GeminiSchema,
  options?: { maxTokens?: number; temperature?: number; timeoutMs?: number }
): Promise<T | null> => {
  const { maxTokens = 2000, temperature = 0.2, timeoutMs = 30000 } = options || {};

  if (!GEMINI_API_KEY) {
    console.warn('[GeminiJSON] ⚠️ VITE_GOOGLE_AI_API_KEY not configured — visual extraction & title rewrite will fall back to DeepSeek V3 (less reliable JSON output)');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GEMINI_FLASH_URL + `?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[GeminiJSON] API error: ${response.status}`, errText.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      console.warn('[GeminiJSON] Empty response from Gemini');
      return null;
    }

    // Try direct parse first
    try {
      return JSON.parse(textContent) as T;
    } catch {
      // JSON repair: Gemini schema enforcement can still produce malformed JSON
      console.warn('[GeminiJSON] Direct parse failed, attempting repair. Raw (first 300 chars):', textContent.slice(0, 300));
      const repaired = repairJSON(textContent);
      if (repaired) {
        console.log('[GeminiJSON] JSON repair succeeded');
        return repaired as T;
      }
      console.warn('[GeminiJSON] JSON repair also failed');
      return null;
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[GeminiJSON] Request timed out');
    } else {
      console.warn('[GeminiJSON] Request failed:', err);
    }
    return null;
  }
};

/** Attempt to repair malformed JSON from LLM output */
const repairJSON = (raw: string): unknown | null => {
  // Strategy 1: Remove trailing commas before } or ]
  let attempt = raw.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(attempt); } catch { /* continue */ }

  // Strategy 2: Close truncated JSON — find last valid position and close open brackets
  const openBraces = (attempt.match(/\{/g) || []).length;
  const closeBraces = (attempt.match(/\}/g) || []).length;
  const openBrackets = (attempt.match(/\[/g) || []).length;
  const closeBrackets = (attempt.match(/\]/g) || []).length;

  // Trim to last complete value (before trailing incomplete key/value)
  attempt = attempt.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
  // Also trim incomplete array element
  attempt = attempt.replace(/,\s*\{[^}]*$/, '');

  // Close missing brackets/braces
  const needClose = ']'.repeat(Math.max(0, openBrackets - closeBrackets)) +
    '}'.repeat(Math.max(0, openBraces - closeBraces));
  if (needClose) {
    try { return JSON.parse(attempt + needClose); } catch { /* continue */ }
  }

  // Strategy 3: Extract first complete JSON object
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continue */ }
  }

  return null;
};

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  content: string;
  reasoning?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekStreamCallback {
  onContent?: (content: string) => void;
  onReasoning?: (reasoning: string) => void;
  onComplete?: (response: DeepSeekResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Call DeepSeek R1 API for deep reasoning tasks
 * R1 excels at complex reasoning, synthesis, and analysis
 */
export const callDeepSeek = async (
  messages: DeepSeekMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    onStream?: DeepSeekStreamCallback;
    /** Use 'deepseek-chat' (V3) for structured JSON extraction, 'deepseek-reasoner' (R1) for prose synthesis */
    model?: 'deepseek-reasoner' | 'deepseek-chat';
    /** Custom timeout in milliseconds. Default: 120000 (2 min). Use lower values for section synthesis. */
    timeoutMs?: number;
  }
): Promise<DeepSeekResponse> => {
  const { maxTokens = 4000, temperature = 0.3, stream = false, onStream, model = 'deepseek-reasoner', timeoutMs = 120000 } = options || {};

  if (!DEEPSEEK_API_KEY) {
    console.warn('[DeepSeek] API key not configured');
    throw new Error('DeepSeek API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream,
        // Note: V3 supports response_format but it enforces JSON *object* (not arrays).
        // We rely on prompt instructions instead since visual extraction needs arrays.
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DeepSeek:${model}] API error:`, response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    if (stream && onStream) {
      return handleStreamResponse(response, onStream);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const reasoning = data.choices?.[0]?.message?.reasoning_content || '';

    return {
      content,
      reasoning,
      usage: data.usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[DeepSeek:${model}] API call timed out`);
      throw new Error('DeepSeek API request timed out');
    }
    throw error;
  }
};

/**
 * Handle streaming response from DeepSeek
 */
const handleStreamResponse = async (
  response: Response,
  callbacks: DeepSeekStreamCallback
): Promise<DeepSeekResponse> => {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let fullReasoning = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            fullContent += delta.content;
            callbacks.onContent?.(delta.content);
          }
          if (delta?.reasoning_content) {
            fullReasoning += delta.reasoning_content;
            callbacks.onReasoning?.(delta.reasoning_content);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const result: DeepSeekResponse = {
    content: fullContent,
    reasoning: fullReasoning,
  };

  callbacks.onComplete?.(result);
  return result;
};

/**
 * Synthesize research findings into a structured report using DeepSeek R1
 */
export const synthesizeResearchReport = async (
  query: string,
  webFindings: string,
  sources: { name: string; url?: string; snippet?: string }[],
  studyType: string,
  onProgress?: (status: string) => void
): Promise<{
  title: string;
  summary: string;
  sections: { id: string; title: string; content: string }[];
  keyFindings: string[];
}> => {
  onProgress?.('Synthesizing findings with DeepSeek R1...');

  const systemPrompt = `You are a senior procurement intelligence analyst creating a comprehensive research report.

STUDY TYPE: ${studyType}
ORIGINAL QUERY: ${query}

Your task is to synthesize the provided web research findings into a well-structured, actionable report.

OUTPUT FORMAT (JSON):
{
  "title": "Clear, descriptive report title",
  "summary": "2-3 paragraph executive summary with key insights and recommendations",
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Detailed markdown content with **bold** for emphasis, bullet points, and data"
    }
  ],
  "keyFindings": [
    "Key finding 1 with specific data point",
    "Key finding 2 with actionable insight"
  ]
}

GUIDELINES:
- Be specific with numbers, percentages, and data points from the research
- Include actionable recommendations for procurement teams
- Highlight risks and opportunities
- Use markdown formatting for readability
- Cite sources inline where relevant (e.g., "According to [Source Name]...")
- Keep sections focused and scannable`;

  const userPrompt = `WEB RESEARCH FINDINGS:
${webFindings}

SOURCES CONSULTED (${sources.length}):
${sources.map((s, i) => `${i + 1}. ${s.name}${s.url ? ` - ${s.url}` : ''}`).join('\n')}

Please synthesize these findings into a comprehensive ${studyType.replace('_', ' ')} report.`;

  try {
    const response = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      maxTokens: 4000,
      temperature: 0.3,
    });

    onProgress?.('Parsing report structure...');

    // Parse the JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse report JSON');
    }

    const report = JSON.parse(jsonMatch[0]);
    return {
      title: report.title || `${query} Analysis`,
      summary: report.summary || 'Report summary unavailable.',
      sections: report.sections || [],
      keyFindings: report.keyFindings || [],
    };
  } catch (error) {
    console.error('[DeepSeek] Synthesis failed:', error);
    // Return a basic structure on error
    return {
      title: `${query} Analysis`,
      summary: webFindings.slice(0, 500),
      sections: [{
        id: 'findings',
        title: 'Research Findings',
        content: webFindings,
      }],
      keyFindings: ['Research completed - see findings above'],
    };
  }
};

/**
 * Check if DeepSeek API is configured
 */
export const isDeepSeekConfigured = (): boolean => {
  return Boolean(DEEPSEEK_API_KEY);
};

/**
 * Quick reasoning call for simpler synthesis tasks
 */
export const quickReason = async (
  prompt: string,
  context?: string
): Promise<string> => {
  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: context || 'You are a helpful assistant that provides clear, concise analysis.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await callDeepSeek(messages, {
    maxTokens: 1000,
    temperature: 0.2,
    timeoutMs: 30000, // 30s for quick reasoning
  });

  return response.content;
};

// ============================================
// TEMPLATE-DRIVEN REPORT SYNTHESIS
// ============================================

import type { ReportTemplate, ReportSectionTemplate, VisualizationSlot } from './reportTemplates';
import type { ReportSection, ReportCitation, TocEntry, DeepResearchReport, StudyType, IntakeAnswers, ReportVisual } from '../types/deepResearch';
import type { Source } from '../types/chat';
import type { EnrichedCommodity } from '../types/enrichedData';
import { STRUCTURED_ADAPTERS } from '../utils/structuredDataAdapters';

/** Source with citation tracking */
export interface SourceWithCitation extends Source {
  citationId: string;
  snippet?: string;
}

// ============================================
// SMART TITLE HELPERS
// ============================================

/** Generate a report number like ABI-2026-0142 */
const generateReportNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(year, 0, 0).getTime()) / 86400000
  );
  const seq = dayOfYear * 100 + Math.floor(Math.random() * 100);
  return `ABI-${year}-${String(seq).padStart(4, '0')}`;
};

/** Extract the domain/commodity subject from intake answers or query */
const extractDomainSubject = (context: SynthesisContext): string | null => {
  const categoryKeys = ['category', 'commodity', 'product', 'service', 'subject', 'material'];
  for (const key of categoryKeys) {
    const val = context.intakeAnswers[key];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
    if (Array.isArray(val) && val.length > 0) {
      return val.join(', ');
    }
  }
  const cleaned = context.query
    .replace(/^(analyze|analyse|research|study|assess|evaluate|investigate|compare|review|tell me about|what is|how does)\s+/i, '')
    .replace(/\s+(market|industry|sector|landscape|analysis|report|study|assessment)$/i, '')
    .trim();
  if (cleaned.length > 0 && cleaned.length < 80) {
    return cleaned;
  }
  return null;
};

// ── Title signals extractor ──

interface TitleSignals {
  subject: string;                // domain/commodity subject
  region: string | null;          // geographic context
  timeframe: string | null;       // temporal context
  topNumericFact: string | null;  // e.g. "$4.2B market", "+12.3% CAGR"
  topTrend: string | null;        // e.g. "prices rising", "supply tightening"
  studyType: StudyType;
}

/** Extract structured signals from report content for title generation */
const extractTitleSignals = (
  sections: SectionSynthesisResult[],
  execSummary: string,
  context: SynthesisContext
): TitleSignals => {
  const subject = extractDomainSubject(context) || context.query.slice(0, 50);

  // Region from intake or context
  const region = context.regions?.[0]
    ? context.regions[0].replace(/^(na|eu|apac|latam|global)$/i, m => ({
        na: 'North America', eu: 'Europe', apac: 'Asia Pacific',
        latam: 'Latin America', global: 'Global',
      }[m.toLowerCase()] || m))
    : null;

  // Timeframe from intake
  const rawTf = context.timeframe || (context.intakeAnswers?.timeframe as string);
  const timeframe = rawTf
    ? rawTf.replace(/^(\d+)m$/, '$1 Months').replace(/^(\d+)y$/, '$1 Years')
    : null;

  // Extract top numeric fact from exec summary + first 2 section contents
  const searchText = [
    execSummary,
    ...sections.slice(0, 2).map(s => s.content),
  ].join(' ').slice(0, 5000);

  let topNumericFact: string | null = null;
  let topTrend: string | null = null;

  // Look for dollar amounts with context (e.g. "$4.2 billion market")
  const dollarMatch = searchText.match(/\$[\d,.]+\s*(?:billion|million|trillion|B|M|T)\b[^.]{0,40}/i);
  if (dollarMatch) {
    topNumericFact = dollarMatch[0].trim().replace(/[,.]$/, '');
  }

  // Look for percentages with context (e.g. "12.3% CAGR", "+7.2% year-over-year")
  if (!topNumericFact) {
    const pctMatch = searchText.match(/[+-]?[\d,.]+%\s*(?:CAGR|growth|increase|decrease|YoY|year-over-year|annually|MoM)[^.]{0,30}/i);
    if (pctMatch) {
      topNumericFact = pctMatch[0].trim().replace(/[,.]$/, '');
    }
  }

  // Extract trend direction from exec summary
  const trendPatterns = [
    /prices?\s+(?:are\s+)?(?:rising|increasing|surging|climbing)/i,
    /prices?\s+(?:are\s+)?(?:falling|declining|dropping|decreasing)/i,
    /supply\s+(?:is\s+)?(?:tightening|constrained|disrupted|shrinking)/i,
    /demand\s+(?:is\s+)?(?:growing|surging|expanding|accelerating)/i,
    /market\s+(?:is\s+)?(?:consolidating|fragmenting|maturing|emerging)/i,
    /(?:costs?\s+(?:are\s+)?(?:rising|escalating|declining|stabilizing))/i,
  ];
  for (const pat of trendPatterns) {
    const m = execSummary.match(pat);
    if (m) {
      topTrend = m[0].trim();
      break;
    }
  }

  return {
    subject,
    region,
    timeframe,
    topNumericFact,
    topTrend,
    studyType: context.studyType,
  };
};

// ── Format templates per study type ──

const TITLE_FORMAT_TEMPLATES: Record<StudyType, string[]> = {
  market_analysis: [
    '{subject}: {insight} in a {trend} Market',
    '{subject} Market Outlook: {insight}',
    '{subject}: Strategic Market Assessment — {insight}',
  ],
  risk_assessment: [
    '{subject} Risk Landscape: {insight}',
    '{subject}: Navigating {trend} Amid {insight}',
    '{subject} Supply Risk Assessment: {insight}',
  ],
  supplier_assessment: [
    '{subject} Supplier Landscape: {insight}',
    '{subject}: Evaluating Supply Base — {insight}',
    '{subject} Supplier Intelligence: {insight}',
  ],
  sourcing_study: [
    '{subject} Sourcing Strategy: {insight}',
    '{subject}: Strategic Sourcing Assessment — {insight}',
    '{subject} Category Deep Dive: {insight}',
  ],
  cost_model: [
    '{subject} Cost Structure: {insight}',
    '{subject}: Cost Driver Analysis — {insight}',
    '{subject} Cost Intelligence: {insight}',
  ],
  custom: [
    '{subject}: {insight}',
    '{subject} Analysis: {insight}',
  ],
};

// ── Title quality validator ──

interface TitleValidation {
  valid: boolean;
  reason?: string;
}

/** Validate that a generated title meets quality standards */
const validateTitleQuality = (
  title: string,
  query: string,
  signals: TitleSignals
): TitleValidation => {
  // Too short
  if (title.split(/\s+/).length < 5) {
    return { valid: false, reason: 'too_short' };
  }
  // Too long
  if (title.split(/\s+/).length > 18) {
    return { valid: false, reason: 'too_long' };
  }
  // Too similar to raw query (Jaccard > 0.7)
  const titleTokens = new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/));
  const queryTokens = new Set(query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/));
  const intersection = [...titleTokens].filter(t => queryTokens.has(t)).length;
  const union = new Set([...titleTokens, ...queryTokens]).size;
  if (union > 0 && intersection / union > 0.7) {
    return { valid: false, reason: 'too_similar_to_query' };
  }
  // Contains forbidden patterns (LLM slop)
  const forbidden = [
    /comprehensive\s+(analysis|report|study)/i,
    /in-depth\s+(analysis|report|study)/i,
    /^report\s+on\s+/i,
    /^analysis\s+of\s+/i,
    /^a\s+study\s+/i,
  ];
  for (const pat of forbidden) {
    if (pat.test(title)) {
      return { valid: false, reason: 'contains_forbidden_pattern' };
    }
  }
  return { valid: true };
};

// ── Signal-enhanced fallback title builder ──

/** Build a domain-qualified title, injecting numeric signals when available */
const buildDomainQualifiedTitle = (
  context: SynthesisContext,
  templateName: string,
  signals?: TitleSignals
): string => {
  const subject = extractDomainSubject(context);
  const titleCased = (subject || context.query.slice(0, 50)).replace(/\b\w/g, c => c.toUpperCase());

  // If we have signals, build a richer fallback
  if (signals) {
    const regionPart = signals.region && signals.region !== 'Global'
      ? ` ${signals.region}` : '';
    const insightPart = signals.topNumericFact
      ? ` — ${signals.topNumericFact}`
      : signals.topTrend
        ? ` — ${signals.topTrend.charAt(0).toUpperCase() + signals.topTrend.slice(1)}`
        : '';

    if (insightPart) {
      return `${titleCased}${regionPart}${insightPart}`;
    }
  }

  return `${titleCased} — ${templateName}`;
};

/**
 * Tier 2: Post-synthesis title rewrite using LLM.
 * Uses extracted signals + strict JSON enforcement with retry.
 * Falls back to signal-enhanced domain-qualified title on failure.
 */
const rewriteReportTitle = async (
  sections: SectionSynthesisResult[],
  execSummary: string,
  context: SynthesisContext,
  templateName: string,
  signals: TitleSignals,
  fallbackTitle: string,
  onProgress?: (status: string) => void
): Promise<{ title: string; subtitle: string; keyFinding: string }> => {
  onProgress?.('Crafting report title...');

  // Build a focused digest: section headings + first ~200 chars
  const digest = sections
    .map(s => `## ${s.title}\n${s.content.slice(0, 200)}...`)
    .join('\n\n');

  // Pick a format template for this study type
  const formats = TITLE_FORMAT_TEMPLATES[context.studyType] || TITLE_FORMAT_TEMPLATES.custom;
  const formatExamples = formats
    .map(f => `  - "${f}"`)
    .join('\n');

  // Build signal context block for the LLM
  const signalBlock = [
    `SUBJECT: ${signals.subject}`,
    signals.region ? `REGION: ${signals.region}` : null,
    signals.timeframe ? `TIMEFRAME: ${signals.timeframe}` : null,
    signals.topNumericFact ? `KEY NUMERIC: ${signals.topNumericFact}` : null,
    signals.topTrend ? `KEY TREND: ${signals.topTrend}` : null,
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are a senior analyst editor. Given a completed procurement research report and extracted data signals, craft a professional title package.

REQUIREMENTS:
1. "title" — Professional report title (8-14 words, title case, NO quotes)
   - MUST contain the domain subject
   - MUST contain a quantified insight OR strategic framing (not both)
   - MUST NOT just repeat the user's query or add generic words like "Comprehensive", "In-Depth", "Detailed"
   - Preferred formats:
${formatExamples}

2. "subtitle" — One-sentence thesis (max 25 words) answering "so what?" for the reader.

3. "keyFinding" — The single most impactful quantitative data point from the report (one sentence, must include a specific number or percentage).

STUDY TYPE: ${context.studyType.replace(/_/g, ' ')}
ORIGINAL QUERY: ${context.query}

${signalBlock}

You MUST respond with ONLY a valid JSON object, no other text:
{"title": "...", "subtitle": "...", "keyFinding": "..."}`;

  const fullPrompt = `${systemPrompt}\n\nEXECUTIVE SUMMARY:\n${execSummary.slice(0, 800)}\n\nSECTION DIGEST:\n${digest.slice(0, 3000)}`;

  // Schema for Gemini enforcement
  const titleSchema: GeminiSchema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      subtitle: { type: 'STRING' },
      keyFinding: { type: 'STRING' },
    },
    required: ['title', 'subtitle', 'keyFinding'],
  };

  // ── Gemini Flash (primary) ──
  const geminiResult = await callGeminiJSON<{ title: string; subtitle: string; keyFinding: string }>(
    fullPrompt,
    titleSchema,
    { maxTokens: 300, temperature: 0.3 }
  );

  if (geminiResult?.title) {
    const validation = validateTitleQuality(geminiResult.title, context.query, signals);
    if (validation.valid) {
      console.log(`[SmartTitle:Gemini] Title accepted: "${geminiResult.title}"`);
      return {
        title: geminiResult.title,
        subtitle: geminiResult.subtitle || '',
        keyFinding: geminiResult.keyFinding || '',
      };
    }
    console.warn(`[SmartTitle:Gemini] Title rejected — ${validation.reason}: "${geminiResult.title}"`);
  } else {
    console.warn('[SmartTitle:Gemini] No result from Gemini');
  }

  // ── DeepSeek V3 fallback ──
  console.log('[SmartTitle] Trying DeepSeek V3 fallback');
  try {
    const response = await callDeepSeek(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `EXECUTIVE SUMMARY:\n${execSummary.slice(0, 800)}\n\nSECTION DIGEST:\n${digest.slice(0, 3000)}` },
      ],
      { maxTokens: 300, temperature: 0.4, model: 'deepseek-chat', timeoutMs: 30000 }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && typeof parsed.title === 'string') {
        const validation = validateTitleQuality(parsed.title, context.query, signals);
        if (validation.valid) {
          console.log(`[SmartTitle:DeepSeek] Fallback title accepted: "${parsed.title}"`);
          return {
            title: parsed.title,
            subtitle: (typeof parsed.subtitle === 'string' && parsed.subtitle) || '',
            keyFinding: (typeof parsed.keyFinding === 'string' && parsed.keyFinding) || '',
          };
        }
        console.warn(`[SmartTitle:DeepSeek] Fallback title rejected — ${validation.reason}: "${parsed.title}"`);
      }
    }
  } catch (err) {
    console.warn('[SmartTitle:DeepSeek] Fallback failed:', err);
  }

  // All attempts failed — use signal-enhanced fallback
  console.warn('[SmartTitle] All LLM attempts failed, using signal-enhanced fallback');
  return { title: fallbackTitle, subtitle: '', keyFinding: '' };
};

/** Structured data from enriched commodity/supplier databases — bypasses LLM extraction */
export interface StructuredDataContext {
  commodities: EnrichedCommodity[];
  // suppliers: EnrichedSupplier[];  // future expansion
  /** Region context from intake (e.g. "Europe", "Asia Pacific") */
  region?: string;
  /** Timeframe context from intake (e.g. "2024-2026") */
  timeframe?: string;
  /** Match confidence: 'exact' (name/slug match) or 'broad' (category only) */
  matchConfidence?: 'exact' | 'broad';
}

/** Synthesis context passed to each section */
interface SynthesisContext {
  query: string;
  studyType: StudyType;
  regions?: string[];
  timeframe?: string;
  webFindings: string;
  beroeFindings?: string;
  sources: SourceWithCitation[];
  intakeAnswers: IntakeAnswers;
  structuredData?: StructuredDataContext;
}

/** Result of synthesizing a single section */
interface SectionSynthesisResult {
  id: string;
  title: string;
  content: string;
  citationIds: string[];
  level: number;
  visuals?: ReportVisual[];
  missingVisuals?: string[];
  children?: SectionSynthesisResult[];
}

/**
 * Synthesize a single report section
 * Uses targeted prompts based on section template
 */
export const synthesizeReportSection = async (
  sectionTemplate: ReportSectionTemplate,
  context: SynthesisContext,
  level: number = 0,
  onProgress?: (status: string) => void
): Promise<SectionSynthesisResult> => {
  onProgress?.(`Writing section: ${sectionTemplate.title}...`);

  const systemPrompt = `You are a senior procurement intelligence analyst writing a section of a comprehensive research report.

REPORT CONTEXT:
- Study Type: ${context.studyType.replace('_', ' ')}
- Query: ${context.query}
- Regions: ${context.regions?.join(', ') || 'Global'}
- Timeframe: ${context.timeframe || 'Current'}

SECTION TO WRITE:
- Title: ${sectionTemplate.title}
- Purpose: ${sectionTemplate.description}

WRITING GUIDELINES:
${sectionTemplate.promptHints.map(h => `- ${h}`).join('\n')}

CITATION REQUIREMENTS:
- You MUST include at least ${sectionTemplate.minCitations} inline citations
- Use the EXACT citation IDs provided with each source: [B1], [B2] for Beroe/internal sources, [W1], [W2] for web sources
- Match the citation ID exactly as shown (e.g., if source is labeled [B1], use [B1] not [1])
- Every paragraph with factual claims must have at least one citation
- Citations should be placed at the end of the relevant sentence/claim

FORMATTING:
- Use markdown with **bold** for emphasis
- Use bullet points for lists
- Use tables where appropriate (markdown table format)
- Be specific with numbers, percentages, and data points
- Keep paragraphs focused and scannable

OUTPUT FORMAT:
Write the section content directly as prose in markdown. Do NOT include any heading or title line — the section heading "${sectionTemplate.title}" is already set.
Start immediately with the body text. Lead with the most important insight or data point in the opening sentence.
Include [B1], [W1], etc. citations inline where you reference sources, using the exact IDs provided.`;

  const beroeBlock = context.beroeFindings
    ? `\nBEROE / INTERNAL MARKET INTELLIGENCE (cite as [B#]):\n${context.beroeFindings}\n`
    : '';

  const userPrompt = `AVAILABLE SOURCES:
${context.sources.map(s => `[${s.citationId}] ${s.name}${s.url ? ` - ${s.url}` : ''}
   ${s.snippet || 'No snippet available'}`).join('\n\n')}
${beroeBlock}
WEB RESEARCH FINDINGS (cite as [W#]):
${context.webFindings}

USER'S INTAKE ANSWERS:
${Object.entries(context.intakeAnswers).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}

Now write the "${sectionTemplate.title}" section following all guidelines above.`;

  // Per-section timeout: 30 seconds with V3 (faster than R1).
  // V3 (chat) is 3-5x faster than R1 (reasoner) for prose generation.
  const SECTION_TIMEOUT_MS = 30000;

  try {
    const response = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      maxTokens: 2000,
      temperature: 0.3,
      timeoutMs: SECTION_TIMEOUT_MS,
      model: 'deepseek-chat', // V3 is much faster than R1 for prose
    });

    // Use stable template title — never override with LLM output
    const sectionTitle = sectionTemplate.title;
    let sectionContent = response.content;

    // Strip any HEADING/CONTENT wrapper the model may still produce
    const headingMatch = response.content.match(/^HEADING:\s*.+\nCONTENT:\s*\n?([\s\S]*)$/i);
    if (headingMatch) {
      sectionContent = headingMatch[1].trim();
    }

    // Strip rogue markdown headings the LLM produces despite being told not to.
    // Removes lines like "## Market Overview: Key Growth Trends" at the start of content.
    // Also handles ### and #### levels, and optional leading whitespace/newlines.
    sectionContent = sectionContent.replace(/^\s*#{1,4}\s+.+\n*/m, '').trim();

    // Extract citations used in this section (matches [B1], [W1], [1], [2], etc.)
    const citationMatches = sectionContent.match(/\[([BW]?\d+)\]/g) || [];
    const citationIds = [...new Set(citationMatches.map(m => m.replace(/[\[\]]/g, '')))];

    // Synthesize children if any
    let children: SectionSynthesisResult[] | undefined;
    if (sectionTemplate.children && sectionTemplate.children.length > 0) {
      children = [];
      for (const childTemplate of sectionTemplate.children) {
        const childResult = await synthesizeReportSection(
          childTemplate,
          context,
          level + 1,
          onProgress
        );
        children.push(childResult);
      }
    }

    return {
      id: sectionTemplate.id,
      title: sectionTitle,
      content: sectionContent,
      citationIds,
      level,
      children,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.message.includes('timed out');
    console.error(`[DeepSeek] Failed to synthesize section ${sectionTemplate.id}:`, isTimeout ? 'TIMEOUT' : error);
    onProgress?.(`Section ${sectionTemplate.title} ${isTimeout ? 'timed out' : 'failed'}, using fallback...`);
    return {
      id: sectionTemplate.id,
      title: sectionTemplate.title,
      content: isTimeout
        ? `*This section is being generated. The analysis is taking longer than expected — please check back shortly or regenerate the report.*`
        : `*Section content generation failed. Please retry.*`,
      citationIds: [],
      level,
    };
  }
};

/**
 * Validate and selectively regenerate sections with insufficient citations.
 *
 * Guardrails:
 * - Only regenerate a section if its citation count is below 50% of the minimum.
 *   Sections that are "close enough" (≥50% of minCitations) pass through.
 * - Cap total regeneration calls at MAX_REGEN_CALLS to bound tail latency.
 * - Executive summary is always eligible for regeneration (high-value section).
 */
const MAX_REGEN_CALLS = 2;

const validateAndRegenerateSections = async (
  sections: SectionSynthesisResult[],
  template: ReportTemplate,
  context: SynthesisContext,
  onProgress?: (status: string) => void
): Promise<SectionSynthesisResult[]> => {
  const validatedSections: SectionSynthesisResult[] = [];
  let regenCount = 0;

  for (const section of sections) {
    const templateSection = template.sections.find(s => s.id === section.id);
    if (!templateSection) {
      validatedSections.push(section);
      continue;
    }

    const min = templateSection.minCitations;
    const actual = section.citationIds.length;
    const isExecSummary = section.id === 'executive_summary';

    // Only regenerate if citations are below 50% of the minimum (or exec summary with 0)
    const needsRegen = min > 0 && actual < min && (isExecSummary || actual < min * 0.5);

    if (needsRegen && regenCount < MAX_REGEN_CALLS) {
      regenCount++;
      onProgress?.(`Regenerating section with more citations: ${section.title}...`);

      const regenerated = await synthesizeReportSection(
        {
          ...templateSection,
          promptHints: [
            ...templateSection.promptHints,
            `CRITICAL: You MUST include at least ${min} citations. Your previous attempt only had ${actual}.`,
            'Every factual statement must be backed by a citation.',
          ],
        },
        context,
        section.level,
        onProgress
      );
      validatedSections.push(regenerated);
    } else {
      if (needsRegen && regenCount >= MAX_REGEN_CALLS) {
        console.log(`[DeepSeek] Skipping regen for "${section.title}" — regen cap (${MAX_REGEN_CALLS}) reached`);
      }
      validatedSections.push(section);
    }

    // Validate children recursively (shares the same regenCount cap via closure)
    if (section.children && section.children.length > 0) {
      section.children = await validateAndRegenerateSections(
        section.children,
        template,
        context,
        onProgress
      );
    }
  }

  return validatedSections;
};

/**
 * Build citations map from sources
 * Matches citation IDs used in sections to sources by their citationId field
 * Supports both [B1]/[W1] format and numeric [1]/[2] format
 */
const buildCitationsMap = (
  sources: SourceWithCitation[],
  sections: SectionSynthesisResult[]
): Record<string, ReportCitation> => {
  const citations: Record<string, ReportCitation> = {};

  // Build a lookup from citationId → source for O(1) matching
  const sourcesByCitationId = new Map<string, SourceWithCitation>();
  for (const source of sources) {
    if (source.citationId) {
      sourcesByCitationId.set(source.citationId, source);
    }
  }

  // Collect all citation IDs used across sections
  const collectCitationIds = (sectionList: SectionSynthesisResult[]): string[] => {
    return sectionList.reduce((acc, section) => {
      acc.push(...section.citationIds);
      if (section.children) {
        acc.push(...collectCitationIds(section.children));
      }
      return acc;
    }, [] as string[]);
  };

  const usedCitationIds = [...new Set(collectCitationIds(sections))];

  for (const citationId of usedCitationIds) {
    // First try matching by citationId field (handles B1, W1, etc.)
    let source = sourcesByCitationId.get(citationId);

    // Fallback: try numeric index for plain [1], [2] citations
    if (!source) {
      const sourceIndex = parseInt(citationId) - 1;
      if (sourceIndex >= 0 && sourceIndex < sources.length) {
        source = sources[sourceIndex];
      }
    }

    if (source) {
      citations[citationId] = {
        id: citationId,
        source: {
          name: source.name,
          url: source.url,
          type: source.type,
          snippet: source.snippet,
        },
        usedInSections: sections
          .filter(s => s.citationIds.includes(citationId))
          .map(s => s.id),
      };
    }
  }

  return citations;
};

/**
 * Generate table of contents from sections
 */
const generateTocFromSections = (sections: SectionSynthesisResult[]): TocEntry[] => {
  const toc: TocEntry[] = [];

  const addToToc = (sectionList: SectionSynthesisResult[]) => {
    for (const section of sectionList) {
      toc.push({
        id: section.id,
        title: section.title,
        level: section.level,
      });
      if (section.children) {
        addToToc(section.children);
      }
    }
  };

  addToToc(sections);
  return toc;
};

/**
 * Convert synthesis results to report sections
 */
const convertToReportSections = (results: SectionSynthesisResult[]): ReportSection[] => {
  return results.map(result => ({
    id: result.id,
    title: result.title,
    content: result.content,
    level: result.level,
    citationIds: result.citationIds,
    visuals: result.visuals,
    missingVisuals: result.missingVisuals,
    children: result.children ? convertToReportSections(result.children) : undefined,
  }));
};

// ============================================
// VISUALIZATION DATA EXTRACTION
// ============================================

/**
 * Count data points in an extracted visual to check against minDataPoints threshold.
 */
const countDataPoints = (visual: ReportVisual): number => {
  switch (visual.type) {
    case 'line_chart':
      return Math.max(...visual.data.series.map(s => s.points.length), 0);
    case 'bar_chart':
      return visual.data.categories.length;
    case 'pie_chart':
      return visual.data.slices.length;
    case 'table':
      return visual.data.rows.length;
    case 'metric':
      return visual.data.metrics.length;
    default:
      return 0;
  }
};

/**
 * Check whether prose contains enough numeric data to warrant chart extraction.
 * Returns 'rich' (3+ numbers), 'sparse' (1-2 numbers), or 'none'.
 * Ignores citation markers like [B1].
 */
const assessNumericDensity = (content: string): 'rich' | 'sparse' | 'none' => {
  // Strip citation markers [B1], [W2], etc. to avoid false positives
  const stripped = content.replace(/\[[BW]?\d+\]/g, '');
  // Match numbers: integers, decimals, percentages, currency
  const numbers = stripped.match(/\d[\d,.]*%?/g) || [];
  if (numbers.length >= 3) return 'rich';
  if (numbers.length >= 1) return 'sparse';
  return 'none';
};

/**
 * Coerce common LLM output patterns into valid visual data shapes.
 * DeepSeek V3 (no schema enforcement) often returns numbers as strings,
 * uses alternative property names, or produces mismatched array lengths.
 * This normalizer runs BEFORE validation so the validator can stay strict.
 */
const coerceVisualData = (visual: ReportVisual): void => {
  try {
    const d = visual.data as Record<string, unknown>;
    switch (visual.type) {
      case 'line_chart': {
        const series = d.series as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(series)) break;
        for (const s of series) {
          // Ensure name exists
          if (!s.name && (s as Record<string, unknown>).label) s.name = (s as Record<string, unknown>).label;
          if (!s.name) s.name = 'Series';
          const pts = s.points as Array<Record<string, unknown>> | undefined;
          if (!Array.isArray(pts)) continue;
          for (const p of pts) {
            // Coerce y from string to number
            if (typeof p.y === 'string') {
              const parsed = parseFloat(String(p.y).replace(/[,$%]/g, ''));
              if (isFinite(parsed)) p.y = parsed;
            }
            // Some LLMs use "value" instead of "y"
            if (p.y === undefined && p.value !== undefined) {
              const val = typeof p.value === 'string' ? parseFloat(String(p.value).replace(/[,$%]/g, '')) : p.value;
              if (typeof val === 'number' && isFinite(val)) p.y = val;
            }
            // Some LLMs use "label" instead of "x"
            if (p.x === undefined && p.label !== undefined) p.x = String(p.label);
            // Ensure x is a string
            if (typeof p.x === 'number') p.x = String(p.x);
          }
        }
        break;
      }
      case 'bar_chart': {
        const categories = d.categories as string[] | undefined;
        const series = d.series as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(categories) || !Array.isArray(series)) break;
        for (const s of series) {
          if (!s.name && (s as Record<string, unknown>).label) s.name = (s as Record<string, unknown>).label;
          if (!s.name) s.name = 'Series';
          const vals = s.values as unknown[] | undefined;
          if (!Array.isArray(vals)) continue;
          // Coerce string values to numbers
          for (let i = 0; i < vals.length; i++) {
            if (typeof vals[i] === 'string') {
              const parsed = parseFloat(String(vals[i]).replace(/[,$%]/g, ''));
              if (isFinite(parsed)) vals[i] = parsed;
            }
          }
          // Pad or truncate to match categories length
          if (vals.length < categories.length) {
            while (vals.length < categories.length) vals.push(0);
          } else if (vals.length > categories.length) {
            s.values = vals.slice(0, categories.length);
          }
        }
        break;
      }
      case 'pie_chart': {
        const slices = d.slices as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(slices)) break;
        for (const s of slices) {
          if (typeof s.value === 'string') {
            const parsed = parseFloat(String(s.value).replace(/[,$%]/g, ''));
            if (isFinite(parsed)) s.value = parsed;
          }
          if (typeof s.label !== 'string' && s.name) s.label = String(s.name);
        }
        break;
      }
      case 'table': {
        const headers = d.headers as string[] | undefined;
        const rows = d.rows as unknown[][] | undefined;
        if (!Array.isArray(headers) || !Array.isArray(rows)) break;
        // Normalize each row to match headers length
        for (let i = 0; i < rows.length; i++) {
          if (!Array.isArray(rows[i])) {
            // If row is an object, try to extract values in header order
            if (typeof rows[i] === 'object' && rows[i] !== null) {
              const obj = rows[i] as unknown as Record<string, unknown>;
              rows[i] = headers.map(h => String(obj[h] ?? obj[h.toLowerCase()] ?? ''));
            } else {
              rows[i] = headers.map(() => '');
            }
          }
          const row = rows[i] as unknown[];
          // Ensure all cells are strings
          for (let j = 0; j < row.length; j++) {
            if (typeof row[j] !== 'string') row[j] = String(row[j] ?? '');
          }
          // Pad or truncate
          if (row.length < headers.length) {
            while (row.length < headers.length) row.push('');
          } else if (row.length > headers.length) {
            rows[i] = row.slice(0, headers.length);
          }
        }
        break;
      }
      case 'metric': {
        // Already handled in validateVisualShape — no extra coercion needed
        break;
      }
    }
  } catch (err) {
    console.warn('[coerceVisualData] Error during coercion:', err);
  }
};

/**
 * Validate the shape of extracted visual data.
 * Returns true if the data is structurally sound for rendering.
 */
const validateVisualShape = (visual: ReportVisual): boolean => {
  try {
    switch (visual.type) {
      case 'line_chart': {
        const { series } = visual.data;
        if (!Array.isArray(series) || series.length === 0) return false;
        return series.every(s =>
          s.name && Array.isArray(s.points) && s.points.length > 0 &&
          s.points.every(p => typeof p.x === 'string' && typeof p.y === 'number' && isFinite(p.y))
        );
      }
      case 'bar_chart': {
        const { categories, series } = visual.data;
        if (!Array.isArray(categories) || categories.length === 0) return false;
        if (!Array.isArray(series) || series.length === 0) return false;
        return series.every(s =>
          s.name && Array.isArray(s.values) &&
          s.values.length === categories.length &&
          s.values.every(v => typeof v === 'number' && isFinite(v))
        );
      }
      case 'pie_chart': {
        const { slices } = visual.data;
        if (!Array.isArray(slices) || slices.length === 0) return false;
        return slices.every(s =>
          typeof s.label === 'string' && typeof s.value === 'number' && isFinite(s.value) && s.value >= 0
        );
      }
      case 'table': {
        const { headers, rows } = visual.data;
        if (!Array.isArray(headers) || headers.length === 0) return false;
        if (!Array.isArray(rows) || rows.length === 0) return false;
        return rows.every(row => Array.isArray(row) && row.length === headers.length);
      }
      case 'metric': {
        const { metrics } = visual.data;
        if (!Array.isArray(metrics) || metrics.length === 0) return false;
        return metrics.every(m => {
          if (typeof m.label !== 'string') return false;
          // Accept both string and number values — LLMs sometimes return numbers.
          // Coerce number values to strings for downstream rendering.
          if (typeof m.value === 'number') {
            (m as Record<string, unknown>).value = String(m.value);
          }
          return typeof m.value === 'string' || typeof m.value === 'number';
        });
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
};

/**
 * Extract structured visualization data using a three-tier resolution strategy:
 *   TIER 1 — Structured adapter (from EnrichedCommodity data) → high confidence, zero latency
 *   TIER 2 — (future: parse structured JSON from agent findings)
 *   TIER 3 — LLM prose extraction (DeepSeek R1) → medium confidence, ~4s latency
 * Slots filled by Tier 1 are skipped in Tier 3.
 */
const extractVisualizationData = async (
  sectionId: string,
  sectionTitle: string,
  sectionContent: string,
  slots: VisualizationSlot[],
  citationIds: string[],
  structuredData?: StructuredDataContext,
): Promise<ReportVisual[]> => {
  if (!slots.length || !sectionContent) return [];

  const visuals: ReportVisual[] = [];
  const filledSlotIds = new Set<string>();

  // ── TIER 1: Structured adapters (zero-latency, high confidence) ──
  // Run for both 'exact' and 'broad' matches. Broad matches get 'medium' confidence
  // and a footnote indicating the data is category-representative.
  if (structuredData?.commodities?.length) {
    const isExact = structuredData.matchConfidence === 'exact';
    const regionLabel = structuredData.region || '';
    const timeframeLabel = structuredData.timeframe || '';

    for (const slot of slots) {
      const adapterName = slot.dataSources?.structuredAdapter;
      if (!adapterName) continue;

      const adapterFn = STRUCTURED_ADAPTERS[adapterName];
      if (!adapterFn) continue;

      // Try each commodity — use the first that produces a result
      for (const commodity of structuredData.commodities) {
        try {
          const result = adapterFn(commodity, sectionId);
          if (result) {
            // Merge slot-level overrides
            if (slot.placement) result.placement = slot.placement;
            if (slot.trendSemantics) result.trendSemantics = slot.trendSemantics;
            // Assign the section's citation IDs so the footer shows source badges
            if (result.sourceIds.length === 0 && citationIds.length > 0) {
              result.sourceIds = citationIds;
            }
            // Append region/timeframe context to title and footnote
            if (regionLabel && !result.title.includes(regionLabel)) {
              result.title = `${result.title} (${regionLabel})`;
            }
            if (timeframeLabel && result.footnote) {
              result.footnote = `${result.footnote} · ${timeframeLabel}`;
            } else if (timeframeLabel) {
              result.footnote = timeframeLabel;
            }
            // Broad matches: downgrade confidence and add explanatory footnote
            if (!isExact) {
              result.confidence = 'medium';
              const existing = result.footnote || '';
              result.footnote = existing
                ? `${existing} · Representative data for ${commodity.category || commodity.name} category`
                : `Representative data for ${commodity.category || commodity.name} category`;
            }
            visuals.push(result);
            filledSlotIds.add(slot.slotId);
            console.log(`[DeepSeek] Tier 1 filled slot "${slot.slotId}" from structured data (${commodity.name}, match: ${isExact ? 'exact' : 'broad'})`);
            break; // First commodity match wins
          }
        } catch (err) {
          console.warn(`[DeepSeek] Structured adapter "${adapterName}" failed for ${commodity.name}:`, err);
        }
      }
    }
  }

  // ── TIER 3: Gemini Flash extraction (schema-enforced, DeepSeek fallback) ──
  const remainingSlots = slots.filter(s => !filledSlotIds.has(s.slotId));
  if (!remainingSlots.length) return visuals;

  // Pre-check: filter slots based on numeric density of prose
  const numericDensity = assessNumericDensity(sectionContent);
  let extractableSlots = remainingSlots;

  if (numericDensity === 'none') {
    // No numbers at all: only attempt table/metric extraction (qualitative data)
    extractableSlots = remainingSlots.filter(s => s.type === 'table' || s.type === 'metric');
    if (!extractableSlots.length) {
      console.log(`[Tier3] Skipping extraction for "${sectionId}" — no numeric data and no table/metric slots`);
      return visuals;
    }
    console.log(`[Tier3] No numeric data in "${sectionId}" — limiting to ${extractableSlots.length} table/metric slots`);
  } else if (numericDensity === 'sparse') {
    // 1-2 numbers: skip complex charts (line/bar), keep pie/table/metric
    extractableSlots = remainingSlots.filter(s => s.type !== 'line_chart' && s.type !== 'bar_chart');
    if (!extractableSlots.length) {
      // Fall through to all remaining if filtering removed everything
      extractableSlots = remainingSlots;
    }
    console.log(`[Tier3] Sparse numeric data in "${sectionId}" — targeting ${extractableSlots.length} of ${remainingSlots.length} slots`);
  }

  // Build per-slot extraction prompt
  const slotDescriptions = extractableSlots.map((s, i) =>
    `${i + 1}. [${s.slotId}] (${s.type}) ${s.description}`
  ).join('\n');

  const extractionPrompt = `You are a data extraction specialist. Given a section of a procurement research report, extract structured data for chart visualizations.

RULES:
- Extract data from the prose. Prefer specific numbers when available, but also accept qualitative data for metric and table slots.
- For line_chart and bar_chart: REQUIRE specific numeric values from the text. Set "filled" to false only if no numeric data points exist.
- For pie_chart: REQUIRE numeric values (percentages, market share). Set "filled" to false only if no share/percentage data exists.
- For metric: Accept BOTH numeric AND qualitative values (e.g., "Strong", "High Risk", "Growing"). Fill with key takeaways, KPIs, or summary stats from the prose. ALWAYS try to fill metric slots — even descriptive labels with qualitative values are useful.
- For table: Accept text-based comparison data. Fill with structured comparisons mentioned in the prose.
- Do NOT invent data not supported by the prose. Do NOT hallucinate numbers.
- Set "filled" to true whenever you can extract ANY meaningful data from the prose for that slot type.
- "confidence" should be "high" if all values are directly quoted, "medium" if summarized or qualitative.

SECTION: ${sectionTitle}
CONTENT:
${sectionContent}

Extract data for ${extractableSlots.length} visualization slot(s):
${slotDescriptions}`;

  // Gemini responseSchema — wraps the array in an object for schema enforcement
  const visualItemSchema: GeminiSchema = {
    type: 'OBJECT',
    properties: {
      slots: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            slotId: { type: 'STRING' },
            filled: { type: 'BOOLEAN' },
            type: { type: 'STRING' },
            title: { type: 'STRING' },
            confidence: { type: 'STRING' },
            data: {
              type: 'OBJECT',
              properties: {
                unit: { type: 'STRING' },
                // line_chart
                series: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
                  name: { type: 'STRING' },
                  points: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
                    x: { type: 'STRING' }, y: { type: 'NUMBER' },
                  }}}
                }}},
                // bar_chart
                categories: { type: 'ARRAY', items: { type: 'STRING' } },
                horizontal: { type: 'BOOLEAN' },
                // pie_chart
                slices: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
                  label: { type: 'STRING' }, value: { type: 'NUMBER' },
                }}},
                // table
                headers: { type: 'ARRAY', items: { type: 'STRING' } },
                rows: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } },
                // metric
                metrics: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
                  label: { type: 'STRING' }, value: { type: 'STRING' },
                  subLabel: { type: 'STRING' }, trend: { type: 'STRING' },
                  trendValue: { type: 'STRING' },
                }}},
              },
            },
          },
          required: ['slotId', 'filled'],
        },
      },
    },
    required: ['slots'],
  };

  // Try Gemini first, fall back to DeepSeek
  type SlotResult = { slotId: string; filled: boolean; type?: string; title?: string; confidence?: string; data?: Record<string, unknown> };
  let extractedSlots: SlotResult[] | null = null;

  // ── Gemini Flash (primary) ──
  const geminiResult = await callGeminiJSON<{ slots: SlotResult[] }>(
    extractionPrompt,
    visualItemSchema,
    { maxTokens: 4000, temperature: 0.1 }
  );
  if (geminiResult?.slots) {
    extractedSlots = geminiResult.slots;
    console.log(`[Tier3:Gemini] Extracted ${extractedSlots.length} slot results for "${sectionId}"`);
  }

  // ── DeepSeek V3 fallback ──
  if (!extractedSlots) {
    console.warn(`[Tier3] Gemini failed for "${sectionId}", trying DeepSeek V3 fallback`);
    try {
      const response = await callDeepSeek(
        [
          { role: 'system', content: `${extractionPrompt}

Return ONLY a valid JSON object with this exact structure:
{"slots": [{"slotId":"...","filled":true/false,"type":"...","title":"...","data":{...},"confidence":"high|medium"}]}

CRITICAL — "data" shape depends on "type":
- line_chart: {"series":[{"name":"Price","points":[{"x":"Q1 2024","y":1234.5},{"x":"Q2 2024","y":1300}]}],"unit":"$/MT"}
- bar_chart: {"categories":["Cat A","Cat B"],"series":[{"name":"Values","values":[100,200]}],"unit":"$"}
- pie_chart: {"slices":[{"label":"Segment A","value":45},{"label":"Segment B","value":55}]}
- table: {"headers":["Name","Region","Revenue"],"rows":[["Supplier A","US","$1B"],["Supplier B","EU","$800M"]]}
- metric: {"metrics":[{"label":"Market Size","value":"$50B","subLabel":"2024 est.","trend":"up","trendValue":"+5%"}]}

IMPORTANT: "y" and "value" in charts MUST be numbers (not strings). "x" and "label" MUST be strings.` },
          { role: 'user', content: 'Extract the data now.' },
        ],
        { maxTokens: 4000, temperature: 0.1, model: 'deepseek-chat', timeoutMs: 45000 }
      );
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Try repair on DeepSeek V3 output too
          const repaired = repairJSON(jsonMatch[0]);
          if (!repaired) throw new Error('JSON repair failed for DeepSeek V3 output');
          parsed = repaired as Record<string, unknown>;
          console.log('[Tier3:DeepSeek] JSON repair succeeded for fallback output');
        }
        if (parsed.slots && Array.isArray(parsed.slots)) {
          extractedSlots = parsed.slots;
          console.log(`[Tier3:DeepSeek] Fallback extracted ${extractedSlots!.length} slot results for "${sectionId}"`);
        }
      }
    } catch (err) {
      console.warn(`[Tier3:DeepSeek] Fallback also failed for "${sectionId}":`, err);
    }
  }

  if (!extractedSlots) {
    console.warn(`[Tier3] All extraction failed for "${sectionId}" — returning ${visuals.length} Tier 1 visuals`);
    return visuals;
  }

  // Validate and accept extracted visuals
  for (const extracted of extractedSlots) {
    if (!extracted.filled) {
      console.log(`[Tier3] Slot "${extracted.slotId}" marked as unfilled by LLM — skipping`);
      continue;
    }
    if (!extracted.data || Object.keys(extracted.data).length === 0) {
      console.warn(`[Tier3] Slot "${extracted.slotId}" marked filled but has no data — skipping`);
      continue;
    }

    const slot = extractableSlots.find(s => s.slotId === extracted.slotId);
    if (!slot) {
      console.warn(`[Tier3] Unknown slotId "${extracted.slotId}" — skipping`);
      continue;
    }

    if (extracted.type && extracted.type !== slot.type) {
      console.warn(`[Tier3] Type mismatch for "${slot.slotId}": expected "${slot.type}", got "${extracted.type}" — skipping`);
      continue;
    }

    const visual: ReportVisual = {
      id: `${sectionId}_${slot.slotId}`,
      title: extracted.title || slot.title,
      type: slot.type,
      data: extracted.data,
      sourceIds: citationIds,
      confidence: (extracted.confidence as 'high' | 'medium' | 'low') || 'medium',
      placement: slot.placement,
    } as ReportVisual;

    // Coerce common LLM output variations before strict validation
    coerceVisualData(visual);

    if (!validateVisualShape(visual)) {
      console.warn(`[Tier3] Shape validation failed for slot "${slot.slotId}" (type: ${slot.type}) — skipping. Raw data:`, JSON.stringify(extracted.data).slice(0, 500));
      continue;
    }

    const dpCount = countDataPoints(visual);
    if (dpCount >= slot.minDataPoints) {
      visuals.push(visual);
      console.log(`[Tier3] Accepted slot "${slot.slotId}" (${dpCount} data points, confidence: ${extracted.confidence})`);
    } else {
      console.warn(`[Tier3] Rejected slot "${slot.slotId}" — only ${dpCount} data points (need ${slot.minDataPoints})`);
    }
  }

  // ── METRIC RETRY: If all chart slots failed but section has content, try a simple metric extraction ──
  // This is a last-resort fallback that produces a "Key Takeaways" metric card from any section.
  const tier1Count = slots.filter(s => filledSlotIds.has(s.slotId)).length;
  if (visuals.length <= tier1Count && sectionContent.length > 100) {
    // Only retry if we have no Tier 3 visuals at all (Tier 1 might still have some)
    console.log(`[Tier3] All chart/table slots failed for "${sectionId}" — attempting metric-only retry`);

    const metricRetryPrompt = `Extract 3-4 key metrics or takeaways from this report section as a summary card.
Each metric should have a "label" (short name), "value" (number, percentage, or brief qualitative description), and optionally "trend" (up/down/stable) and "subLabel" (context).

SECTION: ${sectionTitle}
CONTENT:
${sectionContent.slice(0, 2000)}

Return ONLY valid JSON: {"metrics":[{"label":"...","value":"...","subLabel":"...","trend":"up|down|stable","trendValue":"..."}]}`;

    const metricSchema: GeminiSchema = {
      type: 'OBJECT',
      properties: {
        metrics: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              label: { type: 'STRING' },
              value: { type: 'STRING' },
              subLabel: { type: 'STRING' },
              trend: { type: 'STRING' },
              trendValue: { type: 'STRING' },
            },
            required: ['label', 'value'],
          },
        },
      },
      required: ['metrics'],
    };

    const metricResult = await callGeminiJSON<{ metrics: Array<{ label: string; value: string; subLabel?: string; trend?: string; trendValue?: string }> }>(
      metricRetryPrompt,
      metricSchema,
      { maxTokens: 1500, temperature: 0.2 }
    );

    if (metricResult?.metrics?.length && metricResult.metrics.length >= 2) {
      const metricVisual: ReportVisual = {
        id: `${sectionId}_key_takeaways`,
        title: `Key Takeaways — ${sectionTitle}`,
        type: 'metric',
        data: { metrics: metricResult.metrics },
        sourceIds: citationIds,
        confidence: 'medium',
        placement: 'after_prose',
      } as ReportVisual;

      if (validateVisualShape(metricVisual)) {
        visuals.push(metricVisual);
        console.log(`[Tier3:MetricRetry] Accepted fallback metric card for "${sectionId}" (${metricResult.metrics.length} metrics)`);
      }
    } else {
      console.log(`[Tier3:MetricRetry] No usable metrics extracted for "${sectionId}"`);
    }
  }

  console.log(`[Tier3] Extraction for "${sectionId}": ${visuals.length} total visuals produced`);
  return visuals;
};

/**
 * Main function: Synthesize a complete report using template
 */
export const synthesizeTemplatedReport = async (
  template: ReportTemplate,
  context: SynthesisContext,
  onProgress?: (status: string) => void
): Promise<DeepResearchReport> => {
  const startTime = Date.now();
  onProgress?.(`Starting ${template.name} synthesis...`);

  // Prepare sources with citation IDs using [B1], [W1] format
  // B = Beroe/internal sources, W = Web sources
  let beroeCount = 0;
  let webCount = 0;
  const sourcesWithCitations: SourceWithCitation[] = context.sources.map((source) => {
    const isBeroe = source.type === 'beroe' || source.type === 'internal_data' || source.type === 'supplier_data';
    const citationId = isBeroe ? `B${++beroeCount}` : `W${++webCount}`;
    return {
      ...source,
      citationId,
    };
  });

  const contextWithCitations: SynthesisContext = {
    ...context,
    sources: sourcesWithCitations,
  };

  // Synthesize top-level sections with concurrency=2 to reduce wall-clock time.
  // Each section is independent (no shared state), so parallel calls are safe.
  const SECTION_CONCURRENCY = 2;
  const sectionTemplates = template.sections.filter(s => s.id !== 'references');
  const sections: SectionSynthesisResult[] = new Array(sectionTemplates.length);

  const sectionQueue = sectionTemplates.map((tpl, idx) => ({ tpl, idx }));
  const executing: Promise<void>[] = [];

  for (const { tpl, idx } of sectionQueue) {
    const p = synthesizeReportSection(tpl, contextWithCitations, 0, onProgress)
      .then(result => { sections[idx] = result; })
      .then(() => { executing.splice(executing.indexOf(p), 1); });
    executing.push(p);
    if (executing.length >= SECTION_CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);

  // Validate and regenerate sections that fail minimum citation requirements
  onProgress?.('Validating citations...');
  const validatedSections = await validateAndRegenerateSections(
    sections,
    template,
    contextWithCitations,
    onProgress
  );

  // ── Extract visualization data for sections with slots ──
  onProgress?.('Extracting visuals: starting...');

  // Tag-based slot filtering: only include slots whose tags match the query.
  // Slots without tags are always included. If filtering would remove ALL tagged
  // slots for a section, keep them all — the template was already chosen to match
  // the study type, so its slots are inherently relevant.
  const queryTokens = new Set(
    context.query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  );
  const filterSlotsByQueryTags = (slots: VisualizationSlot[], sectionTitle: string): VisualizationSlot[] => {
    // Also match against section title tokens
    const sectionTokens = sectionTitle.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const allTokens = new Set([...queryTokens, ...sectionTokens]);

    const filtered = slots.filter(slot => {
      if (!slot.tags || slot.tags.length === 0) return true;
      return slot.tags.some(tag => {
        const tagLower = tag.toLowerCase();
        for (const token of allTokens) {
          if (token.includes(tagLower) || tagLower.includes(token)) return true;
        }
        return false;
      });
    });

    // Fallback: if tag filtering removed ALL tagged slots, include everything.
    // The template was selected to match the study type, so its slots are relevant.
    const taggedSlots = slots.filter(s => s.tags && s.tags.length > 0);
    const taggedSurvived = filtered.filter(s => s.tags && s.tags.length > 0);
    if (taggedSlots.length > 0 && taggedSurvived.length === 0) {
      console.log(`[DeepSeek] Tag filtering removed all tagged slots for "${sectionTitle}" — including all slots as fallback`);
      return slots;
    }

    return filtered;
  };

  const EXTRACT_CONCURRENCY = 3;
  // Use ID-based template lookup instead of index-based to avoid misalignment
  const sectionTemplateMap = new Map(sectionTemplates.map(t => [t.id, t]));
  const sectionsWithSlots = validatedSections
    .map((section) => {
      const tpl = sectionTemplateMap.get(section.id);
      if (!tpl?.visualizationSlots?.length) return null;
      const relevantSlots = filterSlotsByQueryTags(tpl.visualizationSlots, section.title);
      if (relevantSlots.length === 0) return null;
      return { section, slots: relevantSlots };
    })
    .filter((entry): entry is { section: SectionSynthesisResult; slots: VisualizationSlot[] } => entry !== null);

  console.log(`[DeepSeek] Visual extraction: ${sectionsWithSlots.length} sections with slots, query tokens: [${[...queryTokens].join(', ')}]`);
  for (const { section, slots } of sectionsWithSlots) {
    console.log(`[DeepSeek]   ${section.id}: ${slots.map(s => s.slotId).join(', ')}`);
  }

  if (sectionsWithSlots.length > 0) {
    let visualsExtracted = 0;
    const totalSlotSections = sectionsWithSlots.length;
    const extractQueue = [...sectionsWithSlots];
    const extracting: Promise<void>[] = [];

    for (const { section, slots } of extractQueue) {
      onProgress?.(`Extracting visuals: ${section.title}...`);
      const p = extractVisualizationData(
        section.id,
        section.title,
        section.content,
        slots,
        section.citationIds,
        contextWithCitations.structuredData,
      )
        .then(visuals => {
          if (visuals.length > 0) {
            section.visuals = visuals;
          }
          // Log unfilled slots for debugging — don't set missingVisuals on the section
          // since it's never rendered and only creates noise.
          const producedSlotIds = new Set(visuals.map(v => v.id.replace(`${section.id}_`, '')));
          const missing = slots.filter(s => !producedSlotIds.has(s.slotId));
          if (missing.length > 0) {
            console.log(`[DeepSeek] Unfilled visual slots for "${section.id}":`, missing.map(s => s.slotId).join(', '));
          }
          visualsExtracted++;
          onProgress?.(`Extracting visuals: ${visualsExtracted}/${totalSlotSections} sections`);
        })
        .then(() => { extracting.splice(extracting.indexOf(p), 1); });
      extracting.push(p);
      if (extracting.length >= EXTRACT_CONCURRENCY) {
        await Promise.race(extracting);
      }
    }
    await Promise.all(extracting);

    // ── De-duplicate visuals across sections ──
    // Hash by type+title+data to prevent identical charts in different sections.
    const seenVisualHashes = new Set<string>();
    for (const section of validatedSections) {
      if (!section.visuals?.length) continue;
      section.visuals = section.visuals.filter(v => {
        const hash = `${v.type}|${v.title}|${JSON.stringify(v.data)}`;
        if (seenVisualHashes.has(hash)) {
          console.log(`[DeepSeek] Dedup: removed duplicate visual "${v.title}" (${v.type}) from section "${section.id}"`);
          return false;
        }
        seenVisualHashes.add(hash);
        return true;
      });
    }

    onProgress?.('Extracting visuals: complete');
  } else {
    onProgress?.('Extracting visuals: complete');
  }

  onProgress?.('Finalizing report...');

  // Build citations map
  const citations = buildCitationsMap(sourcesWithCitations, validatedSections);

  // Generate table of contents
  const tableOfContents = generateTocFromSections(validatedSections);

  // Build references list — group B citations first, then W, sorted numerically within each group
  const references = Object.values(citations).sort((a, b) => {
    const aPrefix = a.id.match(/^[BW]/)?.[0] || '';
    const bPrefix = b.id.match(/^[BW]/)?.[0] || '';
    if (aPrefix !== bPrefix) {
      // B before W, both before plain numeric
      if (aPrefix === 'B') return -1;
      if (bPrefix === 'B') return 1;
      if (aPrefix === 'W') return -1;
      if (bPrefix === 'W') return 1;
    }
    const aNum = parseInt(a.id.replace(/^[BW]/, '')) || 0;
    const bNum = parseInt(b.id.replace(/^[BW]/, '')) || 0;
    return aNum - bNum;
  });

  // Find executive summary section — regenerate if empty
  let execSummary = validatedSections.find(s => s.id === 'executive_summary');
  if (execSummary && (!execSummary.content || execSummary.content.trim().length < 50 || execSummary.content.includes('*Section content generation failed'))) {
    onProgress?.('Regenerating executive summary...');
    const execTemplate = template.sections.find(s => s.id === 'executive_summary');
    if (execTemplate) {
      try {
        const regenerated = await synthesizeReportSection(execTemplate, contextWithCitations, 0, onProgress);
        if (regenerated.content && regenerated.content.trim().length >= 50) {
          // Replace in validatedSections
          const idx = validatedSections.findIndex(s => s.id === 'executive_summary');
          if (idx >= 0) validatedSections[idx] = regenerated;
          execSummary = regenerated;
        }
      } catch {
        // Keep original if regeneration also fails
      }
    }
    // Final fallback: use first substantial section content
    if (!execSummary?.content || execSummary.content.trim().length < 50) {
      const firstSubstantial = validatedSections.find(s => s.id !== 'executive_summary' && s.content && s.content.trim().length > 100);
      if (firstSubstantial) {
        execSummary = { ...execSummary!, content: firstSubstantial.content.slice(0, 1000) };
      }
    }
  }

  // Calculate quality metrics
  const flatSections = validatedSections.flatMap(s => [s, ...(s.children || [])]);
  const sectionsWithCitations = flatSections.filter(s => s.citationIds.length > 0).length;
  const totalCitations = Object.keys(citations).length;

  const processingTime = Date.now() - startTime;

  // ── Smart title generation ──
  // Step 1: Extract title signals from report content
  const summaryText = execSummary?.content || '';
  const titleSignals = extractTitleSignals(validatedSections, summaryText, context);
  console.log('[SmartTitle] Extracted signals:', JSON.stringify({
    subject: titleSignals.subject,
    region: titleSignals.region,
    timeframe: titleSignals.timeframe,
    topNumericFact: titleSignals.topNumericFact,
    topTrend: titleSignals.topTrend,
  }));

  // Step 2: Signal-enhanced fallback title
  const fallbackTitle = buildDomainQualifiedTitle(context, template.name, titleSignals);
  const reportNumber = generateReportNumber();

  // Step 3: LLM-powered title rewrite with signals + validation + retry
  const { title: smartTitle, subtitle, keyFinding } = await rewriteReportTitle(
    validatedSections,
    summaryText,
    context,
    template.name,
    titleSignals,
    fallbackTitle,
    onProgress
  );

  onProgress?.('Report synthesis complete!');

  return {
    id: `report-${Date.now()}`,
    title: smartTitle,
    subtitle: subtitle || undefined,
    keyFinding: keyFinding || undefined,
    reportNumber,
    summary: summaryText || 'Executive summary not available.',
    studyType: context.studyType,
    metadata: {
      title: smartTitle,
      date: new Date().toISOString().split('T')[0],
      templateId: template.id,
      version: '1.0',
    },
    tableOfContents,
    sections: convertToReportSections(validatedSections.filter(s => s.id !== 'executive_summary')),
    citations,
    references,
    allSources: context.sources,
    generatedAt: new Date().toISOString(),
    queryOriginal: context.query,
    intakeAnswers: context.intakeAnswers,
    totalProcessingTime: processingTime,
    creditsUsed: 500,
    canExport: true,
    qualityMetrics: {
      totalCitations,
      sectionsWithCitations,
      totalSections: flatSections.length,
      completenessScore: Math.round((sectionsWithCitations / flatSections.length) * 100),
    },
  };
};
