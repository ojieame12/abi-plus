/**
 * Deep Research Intent Scoring
 *
 * Analyzes user queries to detect "deep research-worthy" requests and either
 * auto-triggers (with confirmation) or suggests Deep Research in follow-ups.
 *
 * Thresholds:
 * - >= 0.75 → Show interstitial with [Start] / [Skip]
 * - 0.45-0.74 → Add deep_research_suggestion to follow-up suggestions
 * - < 0.45 → Normal flow, no changes
 */

import type { ChatMessage } from '../types/chat';
import type { StudyType } from '../types/deepResearch';

// ============================================
// TYPES
// ============================================

export interface ChatContext {
  /** Number of messages in the conversation */
  messageCount: number;
  /** Number of follow-up questions asked by user */
  followUpCount: number;
  /** Categories/topics discussed (for category boosting) */
  topicsDiscussed: string[];
  /** Whether user has asked complexity-indicating questions */
  hasComplexityIndicators: boolean;
  /** Previous queries in the conversation */
  previousQueries: string[];
}

export interface SignalMatch {
  pattern: string;
  weight: number;
  category: 'high' | 'medium' | 'negative';
}

export interface DeepResearchScore {
  /** Final score (0-1) */
  score: number;
  /** Signals that contributed to the score */
  matchedSignals: SignalMatch[];
  /** Inferred study type based on query content */
  inferredStudyType: StudyType;
  /** Human-readable reason for the score */
  reason: string;
  /** Whether this should trigger the interstitial (score >= 0.75) */
  shouldTriggerInterstitial: boolean;
  /** Whether this should show as a suggestion (0.45 <= score < 0.75) */
  shouldSuggest: boolean;
  /** Estimated credits for this type of research */
  estimatedCredits: number;
  /** Estimated time for this type of research */
  estimatedTime: string;
}

// ============================================
// SIGNAL PATTERNS
// ============================================

interface SignalPattern {
  pattern: RegExp;
  weight: number;
  label: string;
}

/** HIGH signals (0.25-0.35 weight) - Strong indicators of research intent */
const HIGH_SIGNALS: SignalPattern[] = [
  // Comprehensive analysis terms
  { pattern: /comprehensive\s+(analysis|study|report|review|assessment)/i, weight: 0.35, label: 'comprehensive analysis' },
  { pattern: /deep\s+dive/i, weight: 0.30, label: 'deep dive' },
  { pattern: /full\s+market\s+analysis/i, weight: 0.35, label: 'full market analysis' },
  { pattern: /in[-\s]?depth\s+(analysis|study|research|report)/i, weight: 0.30, label: 'in-depth analysis' },
  { pattern: /thorough\s+(analysis|study|research|review)/i, weight: 0.28, label: 'thorough analysis' },

  // Study types
  { pattern: /sourcing\s+study/i, weight: 0.35, label: 'sourcing study' },
  { pattern: /cost\s+model(ing)?/i, weight: 0.32, label: 'cost model' },
  { pattern: /cost\s+breakdown/i, weight: 0.28, label: 'cost breakdown' },

  // Forecasting with timeframes
  { pattern: /(forecast|outlook|projection).*(\d+[-\s]?year|Q[1-4]\s*\d{4}|2025|2026|2027|2028|2029|2030)/i, weight: 0.32, label: 'forecast with timeframe' },
  { pattern: /(\d+[-\s]?year|Q[1-4]\s*\d{4}|2025|2026|2027|2028|2029|2030).*(forecast|outlook|projection)/i, weight: 0.32, label: 'timeframe with forecast' },
  { pattern: /5[-\s]?year\s+(outlook|forecast|plan|projection)/i, weight: 0.35, label: '5-year outlook' },

  // Supplier landscape
  { pattern: /supplier\s+(landscape|assessment|evaluation|analysis)/i, weight: 0.30, label: 'supplier landscape' },
  { pattern: /vendor\s+(landscape|assessment|analysis)/i, weight: 0.28, label: 'vendor landscape' },

  // Multi-factor analysis
  { pattern: /risk\s+assessment/i, weight: 0.28, label: 'risk assessment' },
  { pattern: /market\s+intelligence\s+report/i, weight: 0.32, label: 'market intelligence report' },
  { pattern: /industry\s+analysis/i, weight: 0.28, label: 'industry analysis' },

  // Explicit research requests
  { pattern: /prepare\s+(a\s+)?(research|report|analysis|study)/i, weight: 0.30, label: 'prepare research' },
  { pattern: /generate\s+(a\s+)?(comprehensive|detailed|full)\s+report/i, weight: 0.32, label: 'generate report' },
];

/** MEDIUM signals (0.12-0.20 weight) - Moderate indicators */
const MEDIUM_SIGNALS: SignalPattern[] = [
  // Benchmarking
  { pattern: /benchmark(ing)?/i, weight: 0.18, label: 'benchmark' },
  { pattern: /compare\s+(to\s+)?peers/i, weight: 0.16, label: 'compare to peers' },
  { pattern: /competitive\s+analysis/i, weight: 0.18, label: 'competitive analysis' },
  { pattern: /competitive\s+landscape/i, weight: 0.20, label: 'competitive landscape' },

  // Strategy
  { pattern: /strateg(y|ic)\s+(analysis|review|assessment)/i, weight: 0.18, label: 'strategic analysis' },
  { pattern: /strateg(y|ic)\s+recommendation/i, weight: 0.16, label: 'strategic recommendation' },

  // Supply chain
  { pattern: /supply\s+chain\s+analysis/i, weight: 0.20, label: 'supply chain analysis' },
  { pattern: /supply\s+chain\s+risk/i, weight: 0.18, label: 'supply chain risk' },

  // Geographic/scope indicators
  { pattern: /multiple\s+(regions?|suppliers?|markets?)/i, weight: 0.15, label: 'multiple regions/suppliers' },
  { pattern: /(global|worldwide|international)\s+(analysis|overview|perspective)/i, weight: 0.16, label: 'global analysis' },
  { pattern: /across\s+(regions?|countries|markets)/i, weight: 0.14, label: 'across regions' },

  // Trends and dynamics
  { pattern: /market\s+(trends?|dynamics?)/i, weight: 0.16, label: 'market trends' },
  { pattern: /pricing\s+trends?/i, weight: 0.15, label: 'pricing trends' },
  { pattern: /key\s+trends/i, weight: 0.14, label: 'key trends' },

  // Risk indicators
  { pattern: /risk\s+(factors?|drivers?)/i, weight: 0.14, label: 'risk factors' },
  { pattern: /supplier\s+risk/i, weight: 0.16, label: 'supplier risk' },

  // Analysis qualifiers
  { pattern: /detailed\s+(analysis|breakdown|overview)/i, weight: 0.15, label: 'detailed analysis' },
  { pattern: /overview\s+of\s+.{10,}/i, weight: 0.12, label: 'broad overview' },
];

/** NEGATIVE signals (reduce score) - Indicators of simple queries */
const NEGATIVE_SIGNALS: SignalPattern[] = [
  // Simple factual queries
  { pattern: /^what\s+is\s+(the\s+)?(current\s+)?/i, weight: -0.20, label: 'what is query' },
  { pattern: /^(what|when|where|who)\s+/i, weight: -0.10, label: 'simple question' },
  { pattern: /^how\s+much\s+(is|does|are)/i, weight: -0.15, label: 'how much query' },

  // Dashboard/display queries
  { pattern: /show\s+me\s+(my|the|our)/i, weight: -0.25, label: 'show me query' },
  { pattern: /display\s+(my|the|our)/i, weight: -0.20, label: 'display query' },
  { pattern: /list\s+(my|the|our)/i, weight: -0.18, label: 'list query' },

  // Explicit simple request
  { pattern: /\b(quick|brief|short|simple)\b/i, weight: -0.20, label: 'explicit simple' },
  { pattern: /just\s+(tell|show|give)/i, weight: -0.15, label: 'just tell me' },
  { pattern: /in\s+(a\s+)?few\s+words/i, weight: -0.18, label: 'few words' },

  // Conversational
  { pattern: /^(yes|no|ok|okay|sure|thanks|thank\s+you|got\s+it)\.?$/i, weight: -0.50, label: 'conversational' },
  { pattern: /^(hi|hello|hey)(\s|!|,|\.)?$/i, weight: -0.50, label: 'greeting' },

  // Very short queries (< 20 chars after trimming)
  // This is handled specially in the scoring function
];

// ============================================
// STUDY TYPE INFERENCE
// ============================================

interface StudyTypePattern {
  pattern: RegExp;
  studyType: StudyType;
  priority: number;
}

const STUDY_TYPE_PATTERNS: StudyTypePattern[] = [
  // Sourcing study indicators
  { pattern: /sourcing\s+(study|strategy|analysis)/i, studyType: 'sourcing_study', priority: 10 },
  { pattern: /procurement\s+(strategy|analysis)/i, studyType: 'sourcing_study', priority: 8 },
  { pattern: /supplier\s+(selection|sourcing)/i, studyType: 'sourcing_study', priority: 7 },

  // Cost model indicators
  { pattern: /cost\s+(model|breakdown|structure|analysis)/i, studyType: 'cost_model', priority: 10 },
  { pattern: /pricing\s+(model|analysis|breakdown)/i, studyType: 'cost_model', priority: 8 },
  { pattern: /should[-\s]?cost/i, studyType: 'cost_model', priority: 9 },
  { pattern: /total\s+cost\s+of\s+ownership/i, studyType: 'cost_model', priority: 9 },

  // Supplier assessment indicators
  { pattern: /supplier\s+(assessment|evaluation|analysis|landscape)/i, studyType: 'supplier_assessment', priority: 10 },
  { pattern: /vendor\s+(assessment|evaluation|analysis)/i, studyType: 'supplier_assessment', priority: 8 },
  { pattern: /evaluate\s+(suppliers?|vendors?)/i, studyType: 'supplier_assessment', priority: 7 },

  // Risk assessment indicators
  { pattern: /risk\s+(assessment|analysis|evaluation)/i, studyType: 'risk_assessment', priority: 10 },
  { pattern: /supply\s+chain\s+risk/i, studyType: 'risk_assessment', priority: 8 },
  { pattern: /supplier\s+risk/i, studyType: 'risk_assessment', priority: 7 },
  { pattern: /geopolitical\s+risk/i, studyType: 'risk_assessment', priority: 7 },

  // Market analysis (default for general research)
  { pattern: /market\s+(analysis|study|research|intelligence|overview)/i, studyType: 'market_analysis', priority: 8 },
  { pattern: /industry\s+(analysis|overview|research)/i, studyType: 'market_analysis', priority: 7 },
  { pattern: /competitive\s+(landscape|analysis)/i, studyType: 'market_analysis', priority: 6 },
  { pattern: /(forecast|outlook|projection)/i, studyType: 'market_analysis', priority: 5 },
  { pattern: /trends?\s+(analysis|in)/i, studyType: 'market_analysis', priority: 4 },
];

function inferStudyType(query: string): StudyType {
  let bestMatch: { studyType: StudyType; priority: number } | null = null;

  for (const { pattern, studyType, priority } of STUDY_TYPE_PATTERNS) {
    if (pattern.test(query)) {
      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = { studyType, priority };
      }
    }
  }

  return bestMatch?.studyType || 'market_analysis';
}

// ============================================
// CONTEXT BUILDING
// ============================================

/**
 * Build chat context from conversation history for scoring adjustments
 */
export function buildChatContext(messages: ChatMessage[]): ChatContext {
  const userMessages = messages.filter(m => m.role === 'user');
  const previousQueries = userMessages.map(m => m.content);

  // Extract topics discussed (simple keyword extraction)
  const topicsDiscussed = new Set<string>();
  const topicPatterns = [
    /\b(steel|aluminum|copper|lithium|battery|batteries)\b/gi,
    /\b(packaging|corrugated|plastics|chemicals)\b/gi,
    /\b(logistics|freight|shipping|transportation)\b/gi,
    /\b(electronics|semiconductors?|chips?)\b/gi,
    /\b(raw\s+materials?|commodit(y|ies))\b/gi,
  ];

  for (const query of previousQueries) {
    for (const pattern of topicPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        matches.forEach(m => topicsDiscussed.add(m.toLowerCase()));
      }
    }
  }

  // Check for complexity indicators in previous messages
  const complexityIndicators = [
    /compare/i, /analyze/i, /trends?/i, /forecast/i,
    /multiple/i, /across/i, /breakdown/i,
  ];
  const hasComplexityIndicators = previousQueries.some(q =>
    complexityIndicators.some(pattern => pattern.test(q))
  );

  return {
    messageCount: messages.length,
    followUpCount: Math.max(0, userMessages.length - 1),
    topicsDiscussed: Array.from(topicsDiscussed),
    hasComplexityIndicators,
    previousQueries,
  };
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Score a query for deep research intent
 */
export function scoreDeepResearchIntent(
  query: string,
  chatContext?: ChatContext
): DeepResearchScore {
  const normalizedQuery = query.trim();
  const matchedSignals: SignalMatch[] = [];
  let rawScore = 0;

  // Very short queries are almost never research-worthy
  if (normalizedQuery.length < 15) {
    return {
      score: 0,
      matchedSignals: [],
      inferredStudyType: 'market_analysis',
      reason: 'Query too short',
      shouldTriggerInterstitial: false,
      shouldSuggest: false,
      estimatedCredits: 500,
      estimatedTime: '5-10 minutes',
    };
  }

  // Check HIGH signals
  for (const signal of HIGH_SIGNALS) {
    if (signal.pattern.test(normalizedQuery)) {
      rawScore += signal.weight;
      matchedSignals.push({
        pattern: signal.label,
        weight: signal.weight,
        category: 'high',
      });
    }
  }

  // Check MEDIUM signals
  for (const signal of MEDIUM_SIGNALS) {
    if (signal.pattern.test(normalizedQuery)) {
      rawScore += signal.weight;
      matchedSignals.push({
        pattern: signal.label,
        weight: signal.weight,
        category: 'medium',
      });
    }
  }

  // Check NEGATIVE signals
  for (const signal of NEGATIVE_SIGNALS) {
    if (signal.pattern.test(normalizedQuery)) {
      rawScore += signal.weight; // weight is negative
      matchedSignals.push({
        pattern: signal.label,
        weight: signal.weight,
        category: 'negative',
      });
    }
  }

  // Query length bonus (longer queries tend to be more complex)
  const wordCount = normalizedQuery.split(/\s+/).length;
  if (wordCount > 20) {
    rawScore += 0.10;
  } else if (wordCount > 15) {
    rawScore += 0.05;
  }

  // Chat context adjustments
  let contextBoost = 0;
  if (chatContext) {
    // 3+ follow-ups in same category → +0.15
    if (chatContext.followUpCount >= 3) {
      contextBoost += 0.15;
    } else if (chatContext.followUpCount >= 2) {
      contextBoost += 0.08;
    }

    // Cumulative complexity from conversation → up to +0.15
    if (chatContext.hasComplexityIndicators) {
      contextBoost += 0.10;
    }

    // Multiple topics discussed suggests complex research
    if (chatContext.topicsDiscussed.length >= 2) {
      contextBoost += 0.05;
    }
  }

  rawScore += contextBoost;

  // Clamp score to 0-1
  const score = Math.max(0, Math.min(1, rawScore));

  // Infer study type
  const inferredStudyType = inferStudyType(normalizedQuery);

  // Build reason string
  const reason = buildReason(matchedSignals, contextBoost, score);

  // Estimate credits and time based on study type
  const { estimatedCredits, estimatedTime } = getEstimates(inferredStudyType);

  return {
    score,
    matchedSignals,
    inferredStudyType,
    reason,
    shouldTriggerInterstitial: score >= 0.75,
    shouldSuggest: score >= 0.45 && score < 0.75,
    estimatedCredits,
    estimatedTime,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildReason(
  matchedSignals: SignalMatch[],
  contextBoost: number,
  score: number
): string {
  const highSignals = matchedSignals.filter(s => s.category === 'high');
  const mediumSignals = matchedSignals.filter(s => s.category === 'medium');

  if (highSignals.length > 0) {
    const topSignal = highSignals[0].pattern;
    if (highSignals.length > 1) {
      return `Detected "${topSignal}" and ${highSignals.length - 1} other research indicators`;
    }
    return `Detected "${topSignal}" - this looks like a research request`;
  }

  if (mediumSignals.length >= 2) {
    return `Multiple analysis indicators detected: ${mediumSignals.slice(0, 2).map(s => s.pattern).join(', ')}`;
  }

  if (contextBoost > 0.10) {
    return 'Complex conversation context suggests deeper research may help';
  }

  if (score < 0.45) {
    return 'Standard query - no deep research needed';
  }

  return 'Analysis indicators detected';
}

function getEstimates(studyType: StudyType): { estimatedCredits: number; estimatedTime: string } {
  const estimates: Record<StudyType, { estimatedCredits: number; estimatedTime: string }> = {
    sourcing_study: { estimatedCredits: 750, estimatedTime: '8-12 minutes' },
    cost_model: { estimatedCredits: 600, estimatedTime: '6-10 minutes' },
    market_analysis: { estimatedCredits: 500, estimatedTime: '5-10 minutes' },
    supplier_assessment: { estimatedCredits: 550, estimatedTime: '6-10 minutes' },
    risk_assessment: { estimatedCredits: 500, estimatedTime: '5-8 minutes' },
    custom: { estimatedCredits: 500, estimatedTime: '5-10 minutes' },
  };

  return estimates[studyType] || estimates.market_analysis;
}

// ============================================
// STUDY TYPE DISPLAY HELPERS
// ============================================

export function getStudyTypeLabel(studyType: StudyType): string {
  const labels: Record<StudyType, string> = {
    sourcing_study: 'Sourcing Study',
    cost_model: 'Cost Model',
    market_analysis: 'Market Analysis',
    supplier_assessment: 'Supplier Assessment',
    risk_assessment: 'Risk Assessment',
    custom: 'Custom Research',
  };
  return labels[studyType] || 'Market Analysis';
}

export function getStudyTypeDescription(studyType: StudyType): string {
  const descriptions: Record<StudyType, string> = {
    sourcing_study: 'Comprehensive supplier landscape and sourcing strategy analysis',
    cost_model: 'Detailed cost breakdown and pricing structure analysis',
    market_analysis: 'Market trends, dynamics, and competitive intelligence',
    supplier_assessment: 'In-depth supplier evaluation and risk profiling',
    risk_assessment: 'Supply chain risk identification and mitigation strategies',
    custom: 'Tailored research based on your specific requirements',
  };
  return descriptions[studyType] || descriptions.market_analysis;
}
