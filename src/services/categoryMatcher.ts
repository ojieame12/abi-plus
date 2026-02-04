// Category Matcher
// Pure fuzzy-match function to connect free-form interest text to managed categories.
// No side effects — importable from both client and server.

import type { ManagedCategory } from '../types/managedCategories';

export interface CategoryMatchResult {
  category: ManagedCategory;
  isActivated: boolean;
  score: number; // 0-1 match confidence
}

/**
 * Tokenize a string: lowercase, strip non-alphanumeric, split, dedupe.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0)
  );
}

/**
 * Count shared tokens between two sets.
 */
function countSharedTokens(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared++;
  }
  return shared;
}

/**
 * Recall-oriented score: what fraction of the query's tokens appear in the category.
 * High recall means the category "covers" the query well.
 * Used for the match threshold — ensures single-token queries like "Steel"
 * match categories that contain "steel" among other tokens.
 */
function recallScore(queryTokens: Set<string>, categoryTokens: Set<string>): number {
  if (queryTokens.size === 0 || categoryTokens.size === 0) return 0;
  return countSharedTokens(queryTokens, categoryTokens) / queryTokens.size;
}

/**
 * Precision-oriented score: shared / max(sizes) — penalizes large size imbalances.
 * Used for ranking among matches so more specific matches rank higher.
 */
function precisionScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  return countSharedTokens(a, b) / Math.max(a.size, b.size);
}

// Memoized token cache — avoids re-tokenizing categories on every call
const categoryTokenCache = new WeakMap<ManagedCategory, Set<string>>();

/**
 * Build (or retrieve from cache) the token set for a managed category.
 */
function getCategoryTokens(category: ManagedCategory): Set<string> {
  const cached = categoryTokenCache.get(category);
  if (cached) return cached;

  const tokens = tokenize(category.name);
  if (category.keywords) {
    for (const kw of category.keywords) {
      for (const t of tokenize(kw)) {
        tokens.add(t);
      }
    }
  }
  categoryTokenCache.set(category, tokens);
  return tokens;
}

/**
 * Fuzzy-match an interest's text (+ optional region/grade) against the managed
 * category catalog.
 *
 * Scoring strategy: compute base score from topic text only, then apply a small
 * boost if grade/region tokens appear in the category's token set. This avoids
 * diluting the match when region/grade don't appear in category names.
 *
 * Returns the best match if score >= 0.4, or null.
 * Prefers activated categories when scores are close (within 0.1).
 */
export function matchCategory(
  text: string,
  allCategories: ManagedCategory[],
  activatedIds: Set<string>,
  opts?: { region?: string; grade?: string },
): CategoryMatchResult | null {
  const textTokens = tokenize(text);
  if (textTokens.size === 0) return null;

  // Pre-tokenize region/grade for boost scoring
  const regionTokens = opts?.region ? tokenize(opts.region) : null;
  const gradeTokens = opts?.grade ? tokenize(opts.grade) : null;

  let bestResult: CategoryMatchResult | null = null;

  for (const category of allCategories) {
    const catTokens = getCategoryTokens(category);

    // Recall: what fraction of the query tokens are in this category?
    // Threshold check — must cover at least 40% of query tokens.
    const recall = recallScore(textTokens, catTokens);
    if (recall < 0.4) continue;

    // Precision: penalizes size mismatches for ranking
    const precision = precisionScore(textTokens, catTokens);

    // Boost: +0.1 for each region/grade token found in category tokens.
    // This is intentionally strong enough to differentiate among close base scores.
    let boost = 0;
    if (regionTokens) {
      for (const t of regionTokens) {
        if (catTokens.has(t)) boost += 0.1;
      }
    }
    if (gradeTokens) {
      for (const t of gradeTokens) {
        if (catTokens.has(t)) boost += 0.1;
      }
    }

    // Combined score: weighted blend of recall + precision + boost
    const score = Math.min((recall * 0.6 + precision * 0.4) + boost, 1);
    const isActivated = activatedIds.has(category.id);
    const candidate: CategoryMatchResult = { category, isActivated, score };

    if (!bestResult) {
      bestResult = candidate;
      continue;
    }

    // Prefer higher score
    if (score > bestResult.score) {
      bestResult = candidate;
    } else if (Math.abs(score - bestResult.score) < 0.05) {
      // Scores are close — prefer activated category
      if (isActivated && !bestResult.isActivated) {
        bestResult = candidate;
      }
      // Among same activation status, prefer more popular categories
      if (isActivated === bestResult.isActivated) {
        const candidatePopularity = category.clientCount ?? 0;
        const bestPopularity = bestResult.category.clientCount ?? 0;
        if (candidatePopularity > bestPopularity) {
          bestResult = candidate;
        }
      }
    }
  }

  return bestResult;
}
