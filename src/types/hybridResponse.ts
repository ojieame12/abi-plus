// Hybrid Response Types
// Supports parallel Gemini (Beroe) + Perplexity (Web) data fetching
// and synthesis into unified response with inline citations

import type { InternalSource, WebSource, SourceConfidenceInfo, ResponseInsight } from './aiResponse';
import type { WidgetData } from './widgets';

// ============================================
// CITATION TYPES
// ============================================

/** Citation source type - Beroe internal or Web external */
export type CitationType = 'beroe' | 'web';

/** Individual citation reference */
export interface Citation {
  id: string;           // "B1", "W1", etc.
  type: CitationType;
  name: string;         // "Beroe Steel Report Q4" or "Reuters"
  snippet?: string;     // Preview text for hover tooltip
  url?: string;         // For web sources - external link
  reportId?: string;    // For Beroe sources - internal report ID
  category?: string;    // Source category
}

/** Map of citation ID to citation data for quick lookup */
export interface CitationMap {
  [id: string]: Citation;
}

// ============================================
// DATA RESULT TYPES
// ============================================

/** Result from Beroe/Gemini data fetch */
export interface BeroeDataResult {
  content: string;
  sources: InternalSource[];
  structuredData?: WidgetData;
  insight?: ResponseInsight;
}

/** Result from Web/Perplexity data fetch */
export interface WebDataResult {
  content: string;
  sources: WebSource[];
  rawCitations?: string[];  // Raw URLs from Perplexity response
}

/** Combined data from both providers before synthesis */
export interface HybridDataResult {
  beroe: BeroeDataResult;
  web: WebDataResult | null;  // null if web disabled or failed
  evidencePool: Citation[];   // Merged, numbered citations [B1], [W1], etc.
}

// ============================================
// SYNTHESIS METADATA
// ============================================

/** Level of agreement between Beroe and Web sources */
export type AgreementLevel = 'high' | 'medium' | 'low';

/** Metadata about the synthesis process */
export interface SynthesisMetadata {
  beroeClaimsCount: number;   // Number of [B*] citations used
  webClaimsCount: number;     // Number of [W*] citations used
  agreementLevel: AgreementLevel;
}

// ============================================
// FINAL HYBRID RESPONSE
// ============================================

/** Final synthesized response with inline citations */
export interface HybridResponse {
  /** Narrative content with [B1][W1] citation markers inline */
  content: string;

  /** All citations for hover/click lookup */
  citations: CitationMap;

  /** Source confidence (Decision Grade, etc.) */
  confidence: SourceConfidenceInfo;

  /** Widget data from Beroe response (preserved) */
  widget?: WidgetData;

  /** Insight from Beroe response (preserved) */
  insight?: ResponseInsight;

  /** Synthesis process metadata */
  synthesisMetadata: SynthesisMetadata;
}

// ============================================
// FETCH OPTIONS
// ============================================

/** Options for hybrid data fetching */
export interface FetchHybridDataOptions {
  /** Whether web search is enabled */
  webEnabled: boolean;

  /** Detected intent from query */
  intent: {
    category?: string;
    subIntent?: string;
    extractedEntities?: {
      category?: string;
      commodity?: string;
      supplier?: string;
    };
  };

  /** Conversation history for context */
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;

  /** User's managed categories for confidence calculation */
  managedCategories?: string[];
}
