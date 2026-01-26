// Canonical Response Schema - Unified response format across all providers
// This schema is populated alongside existing AIResponse fields for backward compatibility

import type { WidgetType } from './widgets';
import type { DetectedIntent } from './intents';
import type { ValueLadder, SourceEnhancement, SourceConfidenceInfo } from './aiResponse';

// ============================================
// NORMALIZED SOURCES
// ============================================

export interface WebSource {
  title: string;
  url: string;
  favicon?: string;
}

export interface InternalSource {
  title: string;
  type: 'database' | 'report' | 'analysis';

  // === Provider metadata (preserved from source normalization) ===
  /** Provider ID from PROVIDER_REGISTRY (e.g., "beroe", "lme", "moodys") */
  providerId?: string;
  /** Short display name for badges (e.g., "Beroe", "D&B", "LME") */
  providerShortName?: string;
  /** Reliability tier for confidence display (tier1=Beroe, tier2=Premium, tier3=Web) */
  reliabilityTier?: 'tier1' | 'tier2' | 'tier3';
  /** Source category for grouping */
  sourceCategory?: 'intelligence' | 'financial' | 'esg' | 'market_data' | 'trade' | 'regulatory' | 'news' | 'supplier' | 'web';
  /** Provider brand color for badge styling */
  providerColor?: string;

  // === Report metadata (for clickable sources) ===
  reportId?: string;
  reportCategory?: string;
  summary?: string;
  /** Citation ID for inline references (e.g., "B1", "B2") */
  citationId?: string;
}

// Normalized sources - always this shape internally
export interface ResponseSources {
  web: WebSource[];
  internal: InternalSource[];
  totalWebCount: number;
  totalInternalCount: number;
  /** Citation map for inline references (e.g., "B1" -> source data) */
  citations?: Record<string, unknown>;
  /** Decision Grade confidence indicator (Beroe-only calculation) */
  confidence?: SourceConfidenceInfo;
}

// ============================================
// CANONICAL RESPONSE
// ============================================

export interface CanonicalWidget {
  type: WidgetType;
  title?: string;
  data: Record<string, unknown>;
}

export interface CanonicalInsight {
  headline: string;
  summary: string;
  type: 'risk_alert' | 'opportunity' | 'info' | 'action_required';
  sentiment: 'positive' | 'negative' | 'neutral';
  factors?: Array<{
    title: string;
    detail: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

export interface CanonicalArtifact {
  title: string;
  overview: string;       // Markdown, 2-4 paragraphs
  keyPoints: string[];
  recommendations?: string[];
}

export interface CanonicalSuggestion {
  id: string;
  text: string;
  icon?: string;
}

// Strict schema for canonical response layer
export interface CanonicalResponse {
  // Required
  id: string;
  acknowledgement: string;  // 5-10 words, always present
  narrative: string;        // Markdown content, 2-4 paragraphs

  // Optional structured content
  headline?: string;        // Key insight in 5-10 words
  bullets?: string[];       // 3-5 key points

  // Widget slot
  widget?: CanonicalWidget;

  // Insight slot
  insight?: CanonicalInsight;

  // Artifact expansion
  artifactContent?: CanonicalArtifact;

  // Follow-ups
  suggestions?: CanonicalSuggestion[];

  // Normalized sources
  sources?: ResponseSources;

  // Value Ladder - 4-layer system actions (Layer 2, 3, 4)
  valueLadder?: ValueLadder;

  // Source Enhancement - suggestions when using limited sources
  sourceEnhancement?: SourceEnhancement;

  // Source mix metadata - determines what sources were used
  sourceMix?: 'internal_only' | 'internal_plus_partners' | 'internal_plus_web' | 'web_only' | 'all';

  // Metadata
  intent?: DetectedIntent;
  provider: 'gemini' | 'perplexity' | 'local';
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  repaired: boolean;
  original?: unknown;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isCanonicalResponse(obj: unknown): obj is CanonicalResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.acknowledgement === 'string' &&
    typeof r.narrative === 'string' &&
    typeof r.provider === 'string' &&
    ['gemini', 'perplexity', 'local'].includes(r.provider as string)
  );
}

export function isResponseSources(obj: unknown): obj is ResponseSources {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    Array.isArray(s.web) &&
    Array.isArray(s.internal) &&
    typeof s.totalWebCount === 'number' &&
    typeof s.totalInternalCount === 'number'
  );
}
