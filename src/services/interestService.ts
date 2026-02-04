// Interest Service
// CRUD operations for user interests
// Set USE_REAL_API = true when backend is ready

import type { Interest, InterestSource, InterestCoverage, MatchedCategoryInfo } from '../types/interests';
import { createInterest, MAX_INTERESTS, canonicalKey } from '../types/interests';
import { matchCategory } from './categoryMatcher';
import { MOCK_MANAGED_CATEGORIES, MOCK_ACTIVATED_CATEGORIES } from './mockCategories';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = '/api/interests';

// Feature flag: use real API or mock data
const USE_REAL_API = true;

// ============================================================================
// API HELPERS
// ============================================================================

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/abi_csrf=([^;]+)/);
  return match ? match[1] : null;
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (options.method && options.method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
    if (!options.headers || !(options.headers as Record<string, string>)['Content-Type']) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as { error?: string; message?: string };
    const message = errorBody.message || errorBody.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

// ============================================================================
// MOCK DATA
// ============================================================================

const SEED_INTERESTS: Interest[] = [
  {
    id: 'seed_1',
    text: 'Steel',
    canonicalKey: 'europe|hrc|steel',
    source: 'manual',
    region: 'Europe',
    grade: 'HRC',
    coverage: computeCoverage('Steel', 'Europe', 'HRC'),
    savedAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'seed_2',
    text: 'Corrugated Packaging',
    canonicalKey: 'america|corrugated|north|packaging',
    source: 'chat_inferred',
    region: 'North America',
    coverage: computeCoverage('Corrugated Packaging', 'North America'),
    savedAt: '2025-01-20T14:30:00.000Z',
    conversationId: 'conv_demo_001',
  },
  {
    id: 'seed_3',
    text: 'Aluminum Pricing Volatility',
    canonicalKey: 'aluminum|pricing|volatility',
    source: 'manual',
    coverage: computeCoverage('Aluminum Pricing Volatility'),
    savedAt: '2025-01-22T09:15:00.000Z',
  },
];

// Module-scoped mock storage
const mockInterests: Map<string, Interest> = new Map(
  SEED_INTERESTS.map(i => [i.id, i])
);

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all interests for the current user
 */
export async function getInterests(): Promise<Interest[]> {
  if (USE_REAL_API) {
    try {
      return await apiRequest<Interest[]>(API_BASE);
    } catch {
      // Fall back to mock on API failure
      return Array.from(mockInterests.values());
    }
  }

  return Array.from(mockInterests.values());
}

/**
 * Add a new interest
 */
export async function addInterest(input: {
  text: string;
  source: InterestSource;
  region?: string;
  grade?: string;
  conversationId?: string;
  searchContext?: string;
}): Promise<Interest> {
  // Check limit
  const existing = await getInterests();
  if (existing.length >= MAX_INTERESTS) {
    throw new Error(`Maximum of ${MAX_INTERESTS} interests reached. Remove some before adding new ones.`);
  }

  // Check duplicates (using canonical key + token overlap)
  if (isDuplicate(existing, input.text, { region: input.region, grade: input.grade })) {
    throw new Error(`Interest "${input.text}" already exists.`);
  }

  if (USE_REAL_API) {
    try {
      return await apiRequest<Interest>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (err) {
      // If API fails, fall through to mock
      if (err instanceof Error && (err.message.includes('Maximum') || err.message.includes('already exists'))) {
        throw err;
      }
      // Fall back to mock for network errors
    }
  }

  // Mock implementation — auto-compute coverage if not provided
  const coverage = computeCoverage(input.text, input.region, input.grade);
  const interest = createInterest({ ...input, coverage });
  mockInterests.set(interest.id, interest);
  return interest;
}

/**
 * Remove an interest by id
 */
export async function removeInterest(interestId: string): Promise<void> {
  if (USE_REAL_API) {
    try {
      await apiRequest<void>(`${API_BASE}/${interestId}`, {
        method: 'DELETE',
      });
      return;
    } catch {
      // Fall back to mock
    }
  }

  // Mock implementation
  mockInterests.delete(interestId);
}

/**
 * Update an existing interest
 */
export async function updateInterest(
  interestId: string,
  updates: Partial<Pick<Interest, 'text' | 'region' | 'grade'>>
): Promise<Interest> {
  if (USE_REAL_API) {
    try {
      return await apiRequest<Interest>(`${API_BASE}/${interestId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch {
      // Fall back to mock
    }
  }

  // Mock implementation
  const existing = mockInterests.get(interestId);
  if (!existing) {
    throw new Error(`Interest ${interestId} not found`);
  }
  const mergedText = updates.text ?? existing.text;
  const mergedRegion = updates.region !== undefined ? updates.region : existing.region;
  const mergedGrade = updates.grade !== undefined ? updates.grade : existing.grade;
  const updated: Interest = {
    ...existing,
    ...updates,
    canonicalKey: canonicalKey(mergedText, { region: mergedRegion, grade: mergedGrade }),
    coverage: computeCoverage(mergedText, mergedRegion, mergedGrade),
  };
  mockInterests.set(interestId, updated);
  return updated;
}

/**
 * Check if an interest already exists using canonical key match or token overlap.
 *
 * Matches when:
 * 1. Exact canonical key match (handles "Steel EU" vs "EU Steel" vs "Steel - Europe")
 * 2. Token overlap >= 80% (handles partial reformulations)
 *
 * Also accepts optional region/grade to build a proper canonical key for the candidate.
 */
export function isDuplicate(
  existing: Interest[],
  newText: string,
  opts?: { region?: string; grade?: string },
): boolean {
  const candidateKey = canonicalKey(newText, opts);
  const candidateTokens = new Set(candidateKey.split('|'));

  return existing.some(i => {
    // Use stored canonical key if available, otherwise compute on the fly
    const existingKey = i.canonicalKey || canonicalKey(i.text, { region: i.region, grade: i.grade });

    // 1. Exact canonical key match
    if (existingKey === candidateKey) return true;

    // 2. Token overlap — check if >= 80% of tokens in the smaller set are shared
    const existingTokens = new Set(existingKey.split('|'));
    const smaller = candidateTokens.size <= existingTokens.size ? candidateTokens : existingTokens;
    const larger = candidateTokens.size > existingTokens.size ? candidateTokens : existingTokens;

    let shared = 0;
    for (const token of smaller) {
      if (larger.has(token)) shared++;
    }

    const overlap = smaller.size > 0 ? shared / smaller.size : 0;
    return overlap >= 0.8;
  });
}

/** Structured extraction result from AI response content */
export interface ExtractedInterestContext {
  text: string;      // Commodity/topic name: "Steel"
  region?: string;   // Detected region: "Europe"
  grade?: string;    // Detected grade/spec: "HRC"
}

/**
 * Heuristic extraction of procurement topic from AI response content.
 * Returns structured { text, region?, grade? } or null.
 */
export function extractTopicFromResponse(responseContent: string, query: string): string | null {
  const result = extractInterestContext(responseContent, query);
  if (!result) return null;
  // Return combined string for backward compat (used by hasInterest check)
  const parts = [result.text];
  if (result.grade) parts.push(result.grade);
  if (result.region) parts.push(result.region);
  return parts.join(' - ');
}

/**
 * Extract structured interest context from AI response + query.
 * Returns { text, region?, grade? } for prefilling the save prompt,
 * or null for greetings/general responses.
 */
export function extractInterestContext(responseContent: string, query: string): ExtractedInterestContext | null {
  if (!responseContent || !query) return null;

  // Skip greetings/general responses
  const GENERAL_PATTERNS = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
    /^(sure|of course|certainly|I'd be happy to)/i,
    /^(how can I help|what can I do for you)/i,
  ];
  if (GENERAL_PATTERNS.some(p => p.test(responseContent.trim()))) {
    return null;
  }

  // Skip very short responses (likely acknowledgements)
  if (responseContent.length < 100) return null;

  // Extract commodity/category keywords from the query
  const COMMODITY_PATTERNS = [
    // Metals
    /\b(steel|aluminum|aluminium|copper|zinc|nickel|titanium|cobalt|lithium|rare earth)\b/i,
    // Packaging
    /\b(corrugated|packaging|cardboard|paper|pulp|plastic|resin|polyethylene|polypropylene)\b/i,
    // Energy
    /\b(crude oil|natural gas|petroleum|diesel|gasoline|LNG|coal)\b/i,
    // Agriculture
    /\b(wheat|corn|soybean|cotton|sugar|coffee|cocoa|palm oil|rubber)\b/i,
    // Chemicals
    /\b(caustic soda|ethylene|propylene|methanol|ammonia|sulfuric acid)\b/i,
    // Electronics
    /\b(semiconductor|chip|PCB|display|battery|capacitor)\b/i,
    // Logistics
    /\b(freight|shipping|logistics|container|trucking|warehousing)\b/i,
  ];

  // Extract from query first
  for (const pattern of COMMODITY_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      // Capitalize first letter
      const commodity = match[1].charAt(0).toUpperCase() + match[1].slice(1);

      // Try to extract region context
      const regionMatch = query.match(/\b(Europe|Asia|North America|South America|Africa|Middle East|Asia Pacific|APAC|EMEA|LATAM|global)\b/i);
      const region = regionMatch ? regionMatch[1] : undefined;

      // Try to extract grade/type context
      const gradeMatch = query.match(/\b(HRC|CRC|HDG|rebar|billet|scrap|prime|secondary|virgin|recycled)\b/i);
      const grade = gradeMatch ? gradeMatch[1].toUpperCase() : undefined;

      return { text: commodity, region, grade };
    }
  }

  return null;
}

// ============================================================================
// COVERAGE COMPUTATION
// ============================================================================

/**
 * Compute coverage level for an interest by fuzzy-matching against
 * the managed category catalog. Replaces the former hardcoded commodity sets.
 */
export function computeCoverage(text: string, region?: string, grade?: string): InterestCoverage {
  const activatedIds = new Set(MOCK_ACTIVATED_CATEGORIES.map(ac => ac.categoryId));
  const match = matchCategory(text, MOCK_MANAGED_CATEGORIES, activatedIds, { region, grade });

  if (!match) {
    return { level: 'web_only', gapReason: 'No Beroe coverage; using web sources' };
  }

  const matchedCategory: MatchedCategoryInfo = {
    categoryId: match.category.id,
    categoryName: match.category.name,
    domain: match.category.domain,
    subDomain: match.category.subDomain,
    isActivated: match.isActivated,
    hasMarketReport: match.category.hasMarketReport,
    hasPriceIndex: match.category.hasPriceIndex,
    hasSupplierData: match.category.hasSupplierData,
    hasNewsAlerts: match.category.hasNewsAlerts,
    hasCostModel: match.category.hasCostModel,
    analystName: match.category.leadAnalyst.name,
    updateFrequency: match.category.updateFrequency,
  };

  if (match.isActivated) {
    // Grade specificity affects coverage level
    if (grade && match.score < 0.7) {
      return { level: 'partial', gapReason: 'Grade-level data not available; using category-level', matchedCategory };
    }
    return { level: 'decision_grade', matchedCategory };
  }

  // In catalog but not activated
  return {
    level: 'available',
    gapReason: `${match.category.name} is available in the Beroe catalog but not activated`,
    matchedCategory,
  };
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Normalize legacy string[] interests to Interest[] format.
 * Used for backward compatibility with old profile data.
 * Adds canonical key and default coverage to legacy entries.
 */
export function normalizeLegacyInterests(raw: unknown): Interest[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    // Already an Interest object
    if (typeof item === 'object' && item !== null && 'id' in item && 'text' in item) {
      const interest = item as Interest;
      // Backfill canonical key if missing
      if (!interest.canonicalKey) {
        interest.canonicalKey = canonicalKey(interest.text, { region: interest.region, grade: interest.grade });
      }
      return interest;
    }
    // Legacy string format
    if (typeof item === 'string') {
      return {
        id: `legacy_${index}_${Date.now()}`,
        text: item,
        canonicalKey: canonicalKey(item),
        source: 'manual' as InterestSource,
        coverage: { level: 'web_only' as const },
        savedAt: new Date().toISOString(),
      };
    }
    return null;
  }).filter((i): i is Interest => i !== null);
}
