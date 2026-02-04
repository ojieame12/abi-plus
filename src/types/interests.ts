// Interest System Types
// Free-form procurement interests that feed into Abi's context

export type InterestSource = 'manual' | 'chat_inferred' | 'csm_imported';

export type CoverageLevel = 'decision_grade' | 'available' | 'partial' | 'web_only';

export interface MatchedCategoryInfo {
  categoryId: string;
  categoryName: string;
  domain: string;
  subDomain?: string;
  isActivated: boolean;
  // Capabilities from ManagedCategory
  hasMarketReport: boolean;
  hasPriceIndex: boolean;
  hasSupplierData: boolean;
  hasNewsAlerts: boolean;
  hasCostModel: boolean;
  // Analyst
  analystName: string;
  updateFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
}

export interface InterestCoverage {
  level: CoverageLevel;
  gapReason?: string;  // e.g., "Country not covered; using Continent"
  matchedCategory?: MatchedCategoryInfo;
}

export interface Interest {
  id: string;
  text: string;                // Free-form topic only: "Steel" (no region/grade embedded)
  canonicalKey: string;        // Normalized dedupe key: "steel|hrc|europe"
  source: InterestSource;
  region?: string;             // Optional free-text
  grade?: string;              // Optional free-text
  coverage?: InterestCoverage; // Data availability for this interest
  savedAt: string;             // ISO date
  conversationId?: string;     // If saved from chat
  searchContext?: string;      // Original user query that generated this interest
}

export const MAX_INTERESTS = 50;

// ============================================================================
// CANONICAL KEY
// ============================================================================

/**
 * Build a canonical key for dedupe and alert suppression.
 * Normalizes text: lowercase, strip punctuation, sort tokens, append region/grade.
 *
 * Examples:
 *   canonicalKey("Steel - HRC - Europe") => "europe|hrc|steel"
 *   canonicalKey("Steel", { region: "Europe", grade: "HRC" }) => "steel|europe|hrc"
 *   canonicalKey("EU Steel") => "eu|steel"
 *   canonicalKey("Steel, EU") => "eu|steel"
 */
export function canonicalKey(
  text: string,
  opts?: { region?: string; grade?: string }
): string {
  // Tokenize: lowercase, replace non-alphanumeric with spaces, split, dedupe, sort
  const tokens = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0)
  );

  // Add region/grade tokens if provided
  if (opts?.region) {
    opts.region.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
  }
  if (opts?.grade) {
    opts.grade.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
  }

  return [...tokens].sort().join('|');
}

// ============================================================================
// TEXT / FIELD CONFLICT RESOLUTION
// ============================================================================

/**
 * Strip region and grade substrings from the topic text to avoid duplicate
 * sources of truth.  Returns the cleaned topic.
 *
 * Example: cleanTopicText("Steel - HRC - Europe", "Europe", "HRC") => "Steel"
 */
export function cleanTopicText(
  text: string,
  region?: string,
  grade?: string,
): string {
  let cleaned = text;

  // Remove region/grade substrings (case-insensitive), then separators left behind
  if (region) {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegex(region)}\\b`, 'gi'), '');
  }
  if (grade) {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegex(grade)}\\b`, 'gi'), '');
  }

  // Collapse leftover separators: " - - " → "", leading/trailing separators
  cleaned = cleaned
    .replace(/[\s]*[-–—,/|]+[\s]*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If cleaning emptied the string (e.g., text was exactly "Europe HRC"), keep original
  return cleaned || text.trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Factory function to create an Interest with generated id + timestamp.
 * Automatically resolves text/region/grade conflicts and computes canonical key.
 */
export function createInterest(input: {
  text: string;
  source: InterestSource;
  region?: string;
  grade?: string;
  conversationId?: string;
  coverage?: InterestCoverage;
  searchContext?: string;
}): Interest {
  // Resolve text vs field conflicts
  const cleanedText = cleanTopicText(input.text, input.region, input.grade);

  return {
    id: `interest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text: cleanedText,
    canonicalKey: canonicalKey(cleanedText, { region: input.region, grade: input.grade }),
    source: input.source,
    region: input.region,
    grade: input.grade,
    coverage: input.coverage,
    savedAt: new Date().toISOString(),
    conversationId: input.conversationId,
    searchContext: input.searchContext,
  };
}
