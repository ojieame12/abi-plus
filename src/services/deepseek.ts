// DeepSeek R1 API Service for deep reasoning and synthesis
// Used for synthesizing research findings into comprehensive reports

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

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
  }
): Promise<DeepSeekResponse> => {
  const { maxTokens = 4000, temperature = 0.3, stream = false, onStream } = options || {};

  if (!DEEPSEEK_API_KEY) {
    console.warn('[DeepSeek] API key not configured');
    throw new Error('DeepSeek API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for deep reasoning

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner', // DeepSeek R1 model
        messages,
        max_tokens: maxTokens,
        temperature,
        stream,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] API error:', response.status, errorText);
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
      console.error('[DeepSeek] API call timed out');
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
  });

  return response.content;
};

// ============================================
// TEMPLATE-DRIVEN REPORT SYNTHESIS
// ============================================

import type { ReportTemplate, ReportSectionTemplate } from './reportTemplates';
import type { ReportSection, ReportCitation, TocEntry, DeepResearchReport, StudyType, IntakeAnswers } from '../types/deepResearch';
import type { Source } from '../types/chat';

/** Source with citation tracking */
export interface SourceWithCitation extends Source {
  citationId: string;
  snippet?: string;
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
}

/** Result of synthesizing a single section */
interface SectionSynthesisResult {
  id: string;
  title: string;
  content: string;
  citationIds: string[];
  level: number;
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
Return ONLY the section content in markdown. Start directly with the content, no title (title is provided separately).
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

  try {
    const response = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      maxTokens: 2000,
      temperature: 0.3,
    });

    // Extract citations used in this section (matches [B1], [W1], [1], [2], etc.)
    const citationMatches = response.content.match(/\[([BW]?\d+)\]/g) || [];
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
      title: sectionTemplate.title,
      content: response.content,
      citationIds,
      level,
      children,
    };
  } catch (error) {
    console.error(`[DeepSeek] Failed to synthesize section ${sectionTemplate.id}:`, error);
    return {
      id: sectionTemplate.id,
      title: sectionTemplate.title,
      content: `*Section content generation failed. Please retry.*`,
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
    children: result.children ? convertToReportSections(result.children) : undefined,
  }));
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

  onProgress?.('Report synthesis complete!');

  return {
    id: `report-${Date.now()}`,
    title: `${context.query} - ${template.name}`,
    summary: execSummary?.content || 'Executive summary not available.',
    studyType: context.studyType,
    metadata: {
      title: `${context.query} - ${template.name}`,
      date: new Date().toISOString().split('T')[0],
      templateId: template.id,
      version: '1.0',
    },
    tableOfContents,
    sections: convertToReportSections(validatedSections),
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
