// Widget Data Transformers
// Centralized service for transforming domain data into widget-compatible shapes

import type { Supplier, RiskChange, RiskLevel } from '../types/supplier';
import type { Portfolio } from '../types/data';
import type {
  SupplierRiskCardData,
  SupplierTableData,
  ComparisonTableData,
  AlertCardData,
  RiskDistributionData,
  EventsFeedData,
} from '../types/widgets';

// ============================================
// SUPPLIER TRANSFORMERS
// ============================================

/**
 * Transform a Supplier to SupplierRiskCardData (flat props)
 * Fixes Issue #3, #6: componentSelector and gemini.ts emit wrong shapes
 */
export const transformSupplierToRiskCardData = (supplier: Supplier): SupplierRiskCardData => {
  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    riskScore: supplier.srs?.score ?? 0,
    riskLevel: (supplier.srs?.level ?? 'unrated') as SupplierRiskCardData['riskLevel'],
    trend: (supplier.srs?.trend ?? 'stable') as SupplierRiskCardData['trend'],
    category: supplier.category,
    location: {
      city: supplier.location?.city ?? '',
      country: supplier.location?.country ?? '',
      region: supplier.location?.region ?? 'North America',
    },
    spend: supplier.spend ?? 0,
    spendFormatted: supplier.spendFormatted ?? formatSpend(supplier.spend ?? 0),
    lastUpdated: supplier.srs?.lastUpdated ?? new Date().toISOString(),
    keyFactors: supplier.srs?.factors?.slice(0, 4).map(f => ({
      name: f.name,
      impact: mapRatingToImpact(f.rating),
    })),
  };
};

/**
 * Transform Suppliers to SupplierTableData
 * Fixes Issue #8: ai.ts passes raw Supplier[]
 */
export const transformSuppliersToTableData = (
  suppliers: Supplier[],
  filters?: Record<string, string>
): SupplierTableData => {
  return {
    suppliers: suppliers.map(s => ({
      id: s.id,
      name: s.name,
      riskScore: s.srs?.score ?? 0,
      riskLevel: s.srs?.level ?? 'unrated',
      trend: s.srs?.trend ?? 'stable',
      category: s.category,
      country: s.location?.country ?? '',
      spend: s.spendFormatted ?? formatSpend(s.spend ?? 0),
    })),
    totalCount: suppliers.length,
    filters,
  };
};

/**
 * Transform Suppliers to ComparisonTableData
 * Fixes Issue #4: componentSelector uses wrong field names
 */
export const transformSuppliersToComparisonData = (
  suppliers: Supplier[],
  recommendation?: string
): ComparisonTableData => {
  return {
    suppliers: suppliers.slice(0, 4).map(s => ({
      id: s.id,
      name: s.name,
      riskScore: s.srs?.score ?? 0, // Correct: s.srs.score, not s.srsScore
      riskLevel: s.srs?.level ?? 'unrated',
      category: s.category,
      location: s.location?.country ?? '',
      spend: s.spendFormatted ?? formatSpend(s.spend ?? 0),
      trend: s.srs?.trend ?? 'stable',
      strengths: extractStrengths(s),
      weaknesses: extractWeaknesses(s),
    })),
    comparisonDimensions: ['riskScore', 'spend', 'location', 'category'], // Correct: comparisonDimensions, not dimensions
    recommendation: recommendation ?? generateRecommendation(suppliers),
  };
};

// ============================================
// ALERT/TREND TRANSFORMERS
// ============================================

/**
 * Transform RiskChanges to AlertCardData
 * Fixes Issue #7: gemini.ts emits {changes, suppliers}
 */
export const transformRiskChangesToAlertData = (
  riskChanges: RiskChange[]
): AlertCardData => {
  const worsenedCount = riskChanges.filter(c => c.direction === 'worsened').length;
  const hasCritical = riskChanges.some(c =>
    c.direction === 'worsened' && (c.currentScore - c.previousScore) > 10
  );

  return {
    alertType: worsenedCount > 0 ? 'risk_increase' : 'risk_decrease',
    severity: hasCritical ? 'critical' : worsenedCount > 0 ? 'warning' : 'info',
    title: `${riskChanges.length} supplier${riskChanges.length !== 1 ? 's' : ''} with risk changes`,
    affectedSuppliers: riskChanges.slice(0, 5).map(c => ({
      name: c.supplierName,
      previousScore: c.previousScore,
      currentScore: c.currentScore,
      change: `${c.currentScore > c.previousScore ? '+' : ''}${c.currentScore - c.previousScore}`,
    })),
    timestamp: new Date().toISOString(),
    actionRequired: worsenedCount > 0,
    suggestedAction: worsenedCount > 0
      ? 'Review affected suppliers and consider risk mitigation strategies.'
      : 'Risk improvements detected. Consider updating your risk assessment.',
  };
};

// ============================================
// PORTFOLIO TRANSFORMERS
// ============================================

/**
 * Transform Portfolio to RiskDistributionData
 * Fixes Issue #8: distribution needs {count} objects
 */
export const transformPortfolioToDistributionData = (
  portfolio: Portfolio
): RiskDistributionData => {
  const total = portfolio.totalSuppliers;
  const dist = portfolio.distribution;

  return {
    totalSuppliers: total,
    totalSpend: portfolio.totalSpend,
    totalSpendFormatted: portfolio.spendFormatted ?? formatSpend(portfolio.totalSpend),
    distribution: {
      high: {
        count: dist.high,
        spend: 0, // Would need spend data per level
        percent: total > 0 ? Math.round((dist.high / total) * 100) : 0,
      },
      mediumHigh: {
        count: dist.mediumHigh,
        spend: 0,
        percent: total > 0 ? Math.round((dist.mediumHigh / total) * 100) : 0,
      },
      medium: {
        count: dist.medium,
        spend: 0,
        percent: total > 0 ? Math.round((dist.medium / total) * 100) : 0,
      },
      low: {
        count: dist.low,
        spend: 0,
        percent: total > 0 ? Math.round((dist.low / total) * 100) : 0,
      },
      unrated: {
        count: dist.unrated,
        spend: 0,
        percent: total > 0 ? Math.round((dist.unrated / total) * 100) : 0,
      },
    },
  };
};

// ============================================
// EVENTS TRANSFORMERS
// ============================================

/**
 * Extract events array from EventsFeedData or return as-is
 * Fixes Issue #2: events_feed double-wrapping
 */
export const extractEventsArray = (
  data: EventsFeedData | { events: EventsFeedData['events'] } | unknown[]
): EventsFeedData['events'] => {
  // If it's an array, return it
  if (Array.isArray(data)) {
    return data as EventsFeedData['events'];
  }

  // If it's an object with events property
  if (data && typeof data === 'object' && 'events' in data) {
    const eventsData = data as { events: unknown };
    // Check if events itself is EventsFeedData (double-wrapped)
    if (eventsData.events && typeof eventsData.events === 'object' && 'events' in eventsData.events) {
      return (eventsData.events as EventsFeedData).events;
    }
    return eventsData.events as EventsFeedData['events'];
  }

  // Fallback: empty array
  return [];
};

// ============================================
// MARKET CONTEXT TRANSFORMERS
// ============================================

/**
 * Map risk level to MarketContextCard's expected values
 * Fixes Issue #5: 'medium' -> 'moderate', 'high' -> 'elevated'
 */
export const mapRiskLevelToMarketContext = (
  riskLevel: RiskLevel | string
): 'elevated' | 'moderate' | 'low' => {
  switch (riskLevel) {
    case 'high':
    case 'medium-high':
      return 'elevated';
    case 'medium':
      return 'moderate';
    case 'low':
    case 'unrated':
    default:
      return 'low';
  }
};

// ============================================
// HELPERS
// ============================================

const formatSpend = (amount: number): string => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
};

const mapRatingToImpact = (rating?: string): 'positive' | 'negative' | 'neutral' => {
  if (!rating) return 'neutral';
  const lower = rating.toLowerCase();
  if (lower === 'high' || lower === 'critical') return 'negative';
  if (lower === 'low' || lower === 'good') return 'positive';
  return 'neutral';
};

const extractStrengths = (supplier: Supplier): string[] => {
  const strengths: string[] = [];

  if (supplier.srs?.level === 'low') strengths.push('Low Risk');
  if (supplier.srs?.trend === 'improving') strengths.push('Improving Trend');

  // Extract positive factors
  supplier.srs?.factors?.forEach(f => {
    if (f.rating === 'Low' || f.rating === 'Good') {
      strengths.push(f.name);
    }
  });

  // Fallback if no strengths found
  if (strengths.length === 0) {
    if (supplier.location?.region) strengths.push(`${supplier.location.region} based`);
    strengths.push('Established supplier');
  }

  return strengths.slice(0, 3);
};

const extractWeaknesses = (supplier: Supplier): string[] => {
  const weaknesses: string[] = [];

  if (supplier.srs?.level === 'high' || supplier.srs?.level === 'medium-high') {
    weaknesses.push('Elevated Risk');
  }
  if (supplier.srs?.trend === 'worsening') weaknesses.push('Worsening Trend');

  // Extract negative factors
  supplier.srs?.factors?.forEach(f => {
    if (f.rating === 'High' || f.rating === 'Critical') {
      weaknesses.push(f.name);
    }
  });

  // Fallback if no weaknesses found
  if (weaknesses.length === 0) {
    weaknesses.push('Limited data');
  }

  return weaknesses.slice(0, 3);
};

const generateRecommendation = (suppliers: Supplier[]): string => {
  if (suppliers.length === 0) return '';

  // Find lowest risk supplier
  const sorted = [...suppliers].sort((a, b) => (a.srs?.score ?? 100) - (b.srs?.score ?? 100));
  const best = sorted[0];

  if (best.srs?.level === 'low') {
    return `${best.name} has the lowest risk profile and is recommended.`;
  }
  if (best.srs?.level === 'medium') {
    return `${best.name} shows moderate risk. Consider additional due diligence.`;
  }
  return `All suppliers show elevated risk. Consider risk mitigation strategies.`;
};
