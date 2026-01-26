// Source Confidence Service
// Calculates whether a response has "Decision Grade Intelligence" from Beroe sources
// vs requiring web expansion for coverage

import type { ResponseSources, SourceConfidenceInfo, SourceConfidenceLevel } from '../types/aiResponse';

/**
 * Calculate source confidence level based on Beroe coverage and managed categories
 *
 * @param sources - The response sources (web + internal)
 * @param detectedCategory - The category detected from the user's query
 * @param managedCategories - User's managed/premier categories with full Beroe coverage
 * @returns SourceConfidenceInfo with level, reason, and display flags
 */
export function calculateSourceConfidence(
  sources: ResponseSources,
  detectedCategory?: string,
  managedCategories?: string[]
): SourceConfidenceInfo {
  const beroeCount = sources.totalInternalCount;
  const webCount = sources.totalWebCount;

  // Check if the detected category is in the user's managed categories
  const normalizedCategory = detectedCategory?.toLowerCase().trim();
  const normalizedManagedCategories = managedCategories?.map(c => c.toLowerCase().trim()) ?? [];
  const isManagedCategory = normalizedCategory
    ? normalizedManagedCategories.includes(normalizedCategory)
    : false;

  // HIGH: Managed category with 2+ Beroe sources = Decision Grade Intelligence
  if (isManagedCategory && beroeCount >= 2) {
    return {
      level: 'high',
      reason: 'Comprehensive Beroe coverage for this category',
      isManagedCategory: true,
      categoryName: detectedCategory,
      beroeSourceCount: beroeCount,
      webSourceCount: webCount,
      showExpandToWeb: false,
    };
  }

  // HIGH: Even without managed category, 3+ Beroe sources indicates strong coverage
  if (beroeCount >= 3) {
    return {
      level: 'high',
      reason: 'Strong Beroe data coverage',
      isManagedCategory,
      categoryName: detectedCategory,
      beroeSourceCount: beroeCount,
      webSourceCount: webCount,
      showExpandToWeb: false,
    };
  }

  // MEDIUM: Some Beroe sources (1-2) - partial coverage, suggest web expansion
  if (beroeCount >= 1) {
    return {
      level: 'medium',
      reason: 'Partial Beroe data available',
      isManagedCategory,
      categoryName: detectedCategory,
      beroeSourceCount: beroeCount,
      webSourceCount: webCount,
      showExpandToWeb: true, // Suggest expanding to web for more coverage
    };
  }

  // WEB_ONLY: No Beroe sources, only web data
  if (webCount > 0) {
    return {
      level: 'web_only',
      reason: 'Response based on web research',
      isManagedCategory: false,
      categoryName: detectedCategory,
      beroeSourceCount: 0,
      webSourceCount: webCount,
      showExpandToWeb: false,
    };
  }

  // LOW: No sources at all (edge case)
  return {
    level: 'low',
    reason: 'Limited source data available',
    isManagedCategory: false,
    categoryName: detectedCategory,
    beroeSourceCount: 0,
    webSourceCount: 0,
    showExpandToWeb: true,
  };
}

/**
 * Get display label for confidence level
 */
export function getConfidenceLabel(level: SourceConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'Decision Grade';
    case 'medium':
      return 'Partial Coverage';
    case 'low':
      return 'Limited Data';
    case 'web_only':
      return 'Web Research';
    default:
      return '';
  }
}

/**
 * Check if confidence level should show the "Decision Grade" badge
 */
export function shouldShowDecisionGradeBadge(confidence: SourceConfidenceInfo): boolean {
  return confidence.level === 'high';
}

/**
 * Check if we should suggest expanding to web sources
 */
export function shouldSuggestWebExpansion(confidence: SourceConfidenceInfo): boolean {
  return confidence.showExpandToWeb && confidence.level !== 'web_only';
}
