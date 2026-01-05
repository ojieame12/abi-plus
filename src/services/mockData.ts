// Mock supplier data for Risk Watch prototype
import type {
  Supplier,
  RiskPortfolio,
  RiskChange,
  RiskLevel,
  RiskFactor,
} from '../types/supplier';
import {
  RISK_FACTORS,
  formatSpend,
} from '../types/supplier';

// Generate score history for trend charts (last 9 data points)
const generateScoreHistory = (currentScore: number, trend: 'improving' | 'worsening' | 'stable'): number[] => {
  const history: number[] = [];
  let score = currentScore;

  // Work backwards from current score
  for (let i = 8; i >= 0; i--) {
    if (i === 8) {
      history.push(currentScore);
    } else {
      // Add variance based on trend
      const variance = Math.floor(Math.random() * 5) + 2;
      if (trend === 'worsening') {
        score = Math.max(20, score - variance); // Score was lower before (worsening = increasing)
      } else if (trend === 'improving') {
        score = Math.min(95, score + variance); // Score was higher before (improving = decreasing)
      } else {
        score = score + (Math.random() > 0.5 ? variance : -variance);
        score = Math.max(20, Math.min(95, score));
      }
      history.unshift(score);
    }
  }

  return history;
};

// Generate previous score based on trend
const generatePreviousScore = (currentScore: number, trend: 'improving' | 'worsening' | 'stable'): number => {
  const change = Math.floor(Math.random() * 10) + 8; // 8-18 point change
  if (trend === 'worsening') {
    return Math.max(20, currentScore - change);
  } else if (trend === 'improving') {
    return Math.min(95, currentScore + change);
  }
  return currentScore + (Math.random() > 0.5 ? 3 : -3);
};

// Generate risk factors for a supplier (respecting data tiers)
const generateRiskFactors = (overallScore: number): RiskFactor[] => {
  const factors: RiskFactor[] = [];
  const factorConfigs = [
    { id: 'financial', weight: 0.20 },
    { id: 'cybersecurity', weight: 0.15 },
    { id: 'esg', weight: 0.10 },
    { id: 'delivery', weight: 0.10 },
    { id: 'quality', weight: 0.15 },
    { id: 'diversity', weight: 0.05 },
    { id: 'scalability', weight: 0.10 },
    { id: 'freight', weight: 0.05 },
  ];

  factorConfigs.forEach(config => {
    const factorDef = RISK_FACTORS[config.id];
    const variance = Math.floor(Math.random() * 30) - 15;
    const score = Math.max(0, Math.min(100, overallScore + variance));

    factors.push({
      id: config.id,
      name: factorDef.name,
      tier: factorDef.tier,
      weight: config.weight,
      // Only include score for non-restricted tiers
      score: factorDef.tier !== 'restricted' ? score : undefined,
      rating: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low',
    });
  });

  return factors;
};

// Mock suppliers matching the spec examples
export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_001',
    name: 'Apple Inc.',
    duns: '372280056',
    category: 'Silicon Metal',
    industry: 'Technology',
    location: { city: 'New York', country: 'USA', region: 'North America' },
    spend: 10000000,
    spendFormatted: '$10.0M',
    criticality: 'high',
    isFollowed: true,
    revenue: '$394B Revenue',
    srs: {
      score: 85,
      previousScore: 72,
      level: 'high',
      trend: 'worsening',
      lastUpdated: '2024-05-03',
      factors: generateRiskFactors(85),
      scoreHistory: generateScoreHistory(85, 'worsening'),
    },
  },
  {
    id: 'sup_002',
    name: 'Flash Cleaning',
    duns: '372280057',
    category: 'Cleaning Services',
    industry: 'Services',
    location: { city: 'Brussels', country: 'Belgium', region: 'Europe' },
    spend: 2100000,
    spendFormatted: '$2.1M',
    criticality: 'medium',
    isFollowed: true,
    revenue: '$45M Revenue',
    srs: {
      score: 68,
      previousScore: 65,
      level: 'medium-high',
      trend: 'stable',
      lastUpdated: '2023-07-23',
      factors: generateRiskFactors(68),
      scoreHistory: generateScoreHistory(68, 'stable'),
    },
  },
  {
    id: 'sup_003',
    name: 'Queen Cleaners',
    duns: '372280058',
    category: 'Glassware',
    industry: 'Manufacturing',
    location: { city: 'Antwerp', country: 'Belgium', region: 'Europe' },
    spend: 450000,
    spendFormatted: '$450K',
    criticality: 'low',
    isFollowed: true,
    revenue: '$12M Revenue',
    srs: {
      score: 41,
      previousScore: 58,
      level: 'medium',
      trend: 'improving',
      lastUpdated: '2024-05-05',
      factors: generateRiskFactors(41),
      scoreHistory: generateScoreHistory(41, 'improving'),
    },
  },
  {
    id: 'sup_004',
    name: 'Coca Cola Corp',
    duns: '828137189',
    category: 'Silicones',
    industry: 'Chemicals',
    location: { city: 'San Francisco', country: 'USA', region: 'North America' },
    spend: 5500000,
    spendFormatted: '$5.5M',
    criticality: 'high',
    isFollowed: true,
    revenue: '$43B Revenue',
    srs: {
      score: 85,
      previousScore: 82,
      level: 'high',
      trend: 'stable',
      lastUpdated: '2024-04-15',
      factors: generateRiskFactors(85),
      scoreHistory: generateScoreHistory(85, 'stable'),
    },
  },
  {
    id: 'sup_005',
    name: 'Acme Corporation',
    duns: '828137190',
    category: 'Cleaning Services',
    industry: 'Services',
    location: { city: 'San Francisco', country: 'USA', region: 'North America' },
    spend: 10000000000, // $10B
    spendFormatted: '$10.0B',
    criticality: 'high',
    isFollowed: true,
    revenue: '$25B Revenue',
    srs: {
      score: 32,
      previousScore: 25,
      level: 'low',
      trend: 'worsening',
      lastUpdated: '2024-05-01',
      factors: generateRiskFactors(32),
      scoreHistory: generateScoreHistory(32, 'worsening'),
    },
  },
  {
    id: 'sup_006',
    name: 'Global Pack Solutions',
    duns: '828137191',
    category: 'Packaging',
    industry: 'Manufacturing',
    location: { city: 'Singapore', country: 'Singapore', region: 'Asia Pacific' },
    spend: 3200000,
    spendFormatted: '$3.2M',
    criticality: 'medium',
    isFollowed: true,
    revenue: '$450M Revenue',
    srs: {
      score: 55,
      previousScore: 52,
      level: 'medium',
      trend: 'stable',
      lastUpdated: '2024-04-20',
      factors: generateRiskFactors(55),
      scoreHistory: generateScoreHistory(55, 'stable'),
    },
  },
  {
    id: 'sup_007',
    name: 'AsiaFlex Packaging',
    duns: '828137192',
    category: 'Packaging',
    industry: 'Manufacturing',
    location: { city: 'Bangkok', country: 'Thailand', region: 'Asia Pacific' },
    spend: 1800000,
    spendFormatted: '$1.8M',
    criticality: 'medium',
    isFollowed: true,
    revenue: '$280M Revenue',
    srs: {
      score: 0,
      level: 'unrated',
      trend: 'stable',
      lastUpdated: '2024-03-01',
      factors: [],
    },
  },
  {
    id: 'sup_008',
    name: 'EcoPack Industries',
    duns: '828137193',
    category: 'Packaging',
    industry: 'Manufacturing',
    location: { city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia Pacific' },
    spend: 950000,
    spendFormatted: '$950K',
    criticality: 'low',
    isFollowed: true,
    revenue: '$380M Revenue',
    srs: {
      score: 0,
      level: 'unrated',
      trend: 'stable',
      lastUpdated: '2024-02-15',
      factors: [],
    },
  },
  // Add more unrated suppliers to match "10 unrated" from spec
  {
    id: 'sup_009',
    name: 'Nordic Chemicals AB',
    duns: '828137194',
    category: 'Chemicals',
    industry: 'Chemicals',
    location: { city: 'Stockholm', country: 'Sweden', region: 'Europe' },
    spend: 780000,
    spendFormatted: '$780K',
    criticality: 'low',
    isFollowed: true,
    srs: { score: 0, level: 'unrated', trend: 'stable', lastUpdated: '2024-01-10', factors: [] },
  },
  {
    id: 'sup_010',
    name: 'MexiSteel SA',
    duns: '828137195',
    category: 'Steel',
    industry: 'Metals',
    location: { city: 'Mexico City', country: 'Mexico', region: 'North America' },
    spend: 2300000,
    spendFormatted: '$2.3M',
    criticality: 'medium',
    isFollowed: true,
    srs: { score: 0, level: 'unrated', trend: 'stable', lastUpdated: '2024-02-20', factors: [] },
  },
  {
    id: 'sup_011',
    name: 'Deutsche Logistics GmbH',
    duns: '828137196',
    category: 'Logistics',
    industry: 'Transportation',
    location: { city: 'Frankfurt', country: 'Germany', region: 'Europe' },
    spend: 1500000,
    spendFormatted: '$1.5M',
    criticality: 'medium',
    isFollowed: true,
    srs: { score: 0, level: 'unrated', trend: 'stable', lastUpdated: '2024-03-05', factors: [] },
  },
  {
    id: 'sup_012',
    name: 'India Pharma Ltd',
    duns: '828137197',
    category: 'Pharmaceuticals',
    industry: 'Healthcare',
    location: { city: 'Mumbai', country: 'India', region: 'Asia Pacific' },
    spend: 4200000,
    spendFormatted: '$4.2M',
    criticality: 'high',
    isFollowed: true,
    srs: { score: 0, level: 'unrated', trend: 'stable', lastUpdated: '2024-01-25', factors: [] },
  },
  {
    id: 'sup_013',
    name: 'BrazilAgro SA',
    duns: '828137198',
    category: 'Agriculture',
    industry: 'Agriculture',
    location: { city: 'Sao Paulo', country: 'Brazil', region: 'Latin America' },
    spend: 890000,
    spendFormatted: '$890K',
    criticality: 'low',
    isFollowed: true,
    srs: { score: 0, level: 'unrated', trend: 'stable', lastUpdated: '2024-02-28', factors: [] },
  },
  {
    id: 'sup_014',
    name: 'UK Components Ltd',
    duns: '828137199',
    category: 'Electronics',
    industry: 'Technology',
    location: { city: 'London', country: 'UK', region: 'Europe' },
    spend: 1100000,
    spendFormatted: '$1.1M',
    criticality: 'medium',
    isFollowed: true,
    srs: { score: 0, level: 'unrated', trend: 'stable', lastUpdated: '2024-03-12', factors: [] },
  },
];

// Recent risk changes
export const MOCK_RISK_CHANGES: RiskChange[] = [
  {
    supplierId: 'sup_001',
    supplierName: 'Apple Inc.',
    previousScore: 72,
    previousLevel: 'medium-high',
    currentScore: 85,
    currentLevel: 'high',
    changeDate: '2024-05-03',
    direction: 'worsened',
  },
  {
    supplierId: 'sup_003',
    supplierName: 'Queen Cleaners',
    previousScore: 58,
    previousLevel: 'medium',
    currentScore: 41,
    currentLevel: 'medium',
    changeDate: '2024-05-05',
    direction: 'improved',
  },
];

// Calculate portfolio summary
export const getPortfolioSummary = (suppliers: Supplier[] = MOCK_SUPPLIERS): RiskPortfolio => {
  const followedSuppliers = suppliers.filter(s => s.isFollowed);
  const totalSpend = followedSuppliers.reduce((sum, s) => sum + s.spend, 0);

  const distribution = {
    high: followedSuppliers.filter(s => s.srs.level === 'high').length,
    mediumHigh: followedSuppliers.filter(s => s.srs.level === 'medium-high').length,
    medium: followedSuppliers.filter(s => s.srs.level === 'medium').length,
    low: followedSuppliers.filter(s => s.srs.level === 'low').length,
    unrated: followedSuppliers.filter(s => s.srs.level === 'unrated').length,
  };

  return {
    totalSuppliers: followedSuppliers.length,
    totalSpend,
    totalSpendFormatted: formatSpend(totalSpend),
    distribution,
    recentChanges: MOCK_RISK_CHANGES,
  };
};

// Filter suppliers
export interface SupplierFilters {
  riskLevel?: RiskLevel | RiskLevel[];
  region?: string;
  category?: string;
  minSpend?: number;
  maxSpend?: number;
  searchQuery?: string;
}

export const filterSuppliers = (
  suppliers: Supplier[] = MOCK_SUPPLIERS,
  filters: SupplierFilters
): Supplier[] => {
  return suppliers.filter(supplier => {
    // Risk level filter
    if (filters.riskLevel) {
      const levels = Array.isArray(filters.riskLevel) ? filters.riskLevel : [filters.riskLevel];
      if (!levels.includes(supplier.srs.level)) return false;
    }

    // Region filter
    if (filters.region && supplier.location.region !== filters.region) {
      return false;
    }

    // Category filter
    if (filters.category && supplier.category !== filters.category) {
      return false;
    }

    // Spend range filter
    if (filters.minSpend && supplier.spend < filters.minSpend) return false;
    if (filters.maxSpend && supplier.spend > filters.maxSpend) return false;

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = `${supplier.name} ${supplier.category} ${supplier.location.country}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
};

// Get supplier by ID
export const getSupplierById = (id: string): Supplier | undefined => {
  return MOCK_SUPPLIERS.find(s => s.id === id);
};

// Get supplier by name (fuzzy match)
export const getSupplierByName = (name: string): Supplier | undefined => {
  const normalizedName = name.toLowerCase();
  return MOCK_SUPPLIERS.find(s =>
    s.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(s.name.toLowerCase())
  );
};

// Get high risk suppliers
export const getHighRiskSuppliers = (): Supplier[] => {
  return filterSuppliers(MOCK_SUPPLIERS, { riskLevel: ['high', 'medium-high'] });
};

// Get suppliers with recent changes
export const getSuppliersWithRecentChanges = (): Supplier[] => {
  const changedIds = MOCK_RISK_CHANGES.map(c => c.supplierId);
  return MOCK_SUPPLIERS.filter(s => changedIds.includes(s.id));
};

// Get unique categories
export const getCategories = (): string[] => {
  return [...new Set(MOCK_SUPPLIERS.map(s => s.category))];
};

// Get unique regions
export const getRegions = (): string[] => {
  return [...new Set(MOCK_SUPPLIERS.map(s => s.location.region))];
};

// ============================================
// MOCK DATA GENERATORS FOR NEW WIDGETS
// ============================================

import type { FactorData } from '../components/widgets/FactorBreakdownCard';
import type { NewsEvent, EventType, EventSentiment, EventImpact } from '../components/widgets/NewsEventsCard';
import type { AlternativeSupplier } from '../components/widgets/AlternativesPreviewCard';
import type { ConcentrationType, SeverityLevel } from '../components/widgets/ConcentrationWarningCard';

// Generate Factor Breakdown data
export const generateFactorBreakdownData = (supplier: Supplier): {
  supplierName: string;
  overallScore: number;
  level: RiskLevel;
  factors: FactorData[];
} => {
  const tierMapping: Record<string, 'tier1' | 'tier2' | 'tier3'> = {
    'freely-displayable': 'tier1',
    'conditionally-displayable': 'tier2',
    'restricted': 'tier3',
  };

  const factors: FactorData[] = supplier.srs.factors.map(f => ({
    id: f.id,
    name: f.name,
    score: f.tier === 'restricted' ? null : (f.score ?? null),
    weight: f.weight,
    tier: tierMapping[f.tier],
    trend: Math.random() > 0.6 ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable',
  }));

  // Add Overall SRS as tier1
  factors.unshift({
    id: 'overall_srs',
    name: 'Overall SRS',
    score: supplier.srs.score,
    weight: 1,
    tier: 'tier1',
    trend: supplier.srs.trend === 'worsening' ? 'up' : supplier.srs.trend === 'improving' ? 'down' : 'stable',
  });

  return {
    supplierName: supplier.name,
    overallScore: supplier.srs.score,
    level: supplier.srs.level,
    factors,
  };
};

// Generate mock news events
const NEWS_HEADLINES = [
  { headline: 'Announces Q4 earnings beat expectations', type: 'financial' as EventType, sentiment: 'positive' as EventSentiment },
  { headline: 'Faces supply chain disruptions due to port congestion', type: 'news' as EventType, sentiment: 'negative' as EventSentiment },
  { headline: 'Receives regulatory approval for new facility', type: 'regulatory' as EventType, sentiment: 'positive' as EventSentiment },
  { headline: 'Data breach exposes customer information', type: 'alert' as EventType, sentiment: 'negative' as EventSentiment },
  { headline: 'Partners with major sustainability initiative', type: 'news' as EventType, sentiment: 'positive' as EventSentiment },
  { headline: 'Faces lawsuit over labor practices', type: 'regulatory' as EventType, sentiment: 'negative' as EventSentiment },
  { headline: 'Credit rating downgraded by Moody\'s', type: 'financial' as EventType, sentiment: 'negative' as EventSentiment },
  { headline: 'Expands operations to new markets', type: 'news' as EventType, sentiment: 'positive' as EventSentiment },
  { headline: 'Factory inspection reveals compliance issues', type: 'alert' as EventType, sentiment: 'negative' as EventSentiment },
  { headline: 'Wins industry award for innovation', type: 'news' as EventType, sentiment: 'positive' as EventSentiment },
];

const NEWS_SOURCES = ['Reuters', 'Bloomberg', 'WSJ', 'Financial Times', 'Industry Week', 'Supply Chain Dive'];

export const generateNewsEventsData = (
  supplierName?: string,
  count: number = 5
): NewsEvent[] => {
  const events: NewsEvent[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const template = NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - daysAgo);

    events.push({
      id: `event_${i}_${Date.now()}`,
      date: eventDate.toISOString(),
      headline: supplierName ? `${supplierName} ${template.headline}` : template.headline,
      source: NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)],
      type: template.type,
      sentiment: template.sentiment,
      impact: template.sentiment === 'negative'
        ? (Math.random() > 0.5 ? 'high' : 'medium') as EventImpact
        : (Math.random() > 0.7 ? 'medium' : 'low') as EventImpact,
    });
  }

  // Sort by date (most recent first)
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate alternative suppliers
export const generateAlternativesData = (
  currentSupplier: Supplier
): {
  currentSupplier: string;
  currentScore: number;
  alternatives: AlternativeSupplier[];
} => {
  // Find suppliers in the same category with lower risk
  const sameCategory = MOCK_SUPPLIERS.filter(
    s => s.id !== currentSupplier.id && s.category === currentSupplier.category
  );

  // If not enough in same category, add from similar categories
  const alternatives: AlternativeSupplier[] = [];
  const candidates = sameCategory.length >= 3 ? sameCategory : MOCK_SUPPLIERS.filter(s => s.id !== currentSupplier.id);

  // Pick up to 5 alternatives
  const selected = candidates.slice(0, 5);

  selected.forEach(s => {
    alternatives.push({
      id: s.id,
      name: s.name,
      score: s.srs.score,
      level: s.srs.level,
      category: s.category,
      matchScore: Math.floor(Math.random() * 30) + 70, // 70-99% match
    });
  });

  // Sort by score (lower is better)
  alternatives.sort((a, b) => a.score - b.score);

  return {
    currentSupplier: currentSupplier.name,
    currentScore: currentSupplier.srs.score,
    alternatives,
  };
};

// Generate concentration warning data
export const generateConcentrationData = (
  suppliers: Supplier[] = MOCK_SUPPLIERS
): {
  type: ConcentrationType;
  entity: string;
  concentration: number;
  threshold: number;
  spend: string;
  recommendation: string;
  severity: SeverityLevel;
} | null => {
  const totalSpend = suppliers.reduce((sum, s) => sum + s.spend, 0);

  // Check supplier concentration
  const sortedBySpend = [...suppliers].sort((a, b) => b.spend - a.spend);
  const topSupplier = sortedBySpend[0];
  const topSupplierPercent = (topSupplier.spend / totalSpend) * 100;

  if (topSupplierPercent > 30) {
    return {
      type: 'supplier',
      entity: topSupplier.name,
      concentration: Math.round(topSupplierPercent * 10) / 10,
      threshold: 30,
      spend: topSupplier.spendFormatted,
      recommendation: `Consider diversifying spend away from ${topSupplier.name} to reduce single-supplier dependency. Explore alternative suppliers in the ${topSupplier.category} category.`,
      severity: topSupplierPercent > 50 ? 'high' : 'medium',
    };
  }

  // Check category concentration
  const categorySpend: Record<string, number> = {};
  suppliers.forEach(s => {
    categorySpend[s.category] = (categorySpend[s.category] || 0) + s.spend;
  });

  const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];
  const topCategoryPercent = (topCategory[1] / totalSpend) * 100;

  if (topCategoryPercent > 40) {
    return {
      type: 'category',
      entity: topCategory[0],
      concentration: Math.round(topCategoryPercent * 10) / 10,
      threshold: 40,
      spend: formatSpend(topCategory[1]),
      recommendation: `Heavy concentration in ${topCategory[0]} category increases vulnerability to sector-specific disruptions. Consider expanding supplier base across other categories.`,
      severity: topCategoryPercent > 60 ? 'high' : 'medium',
    };
  }

  // Check regional concentration
  const regionSpend: Record<string, number> = {};
  suppliers.forEach(s => {
    regionSpend[s.location.region] = (regionSpend[s.location.region] || 0) + s.spend;
  });

  const topRegion = Object.entries(regionSpend).sort((a, b) => b[1] - a[1])[0];
  const topRegionPercent = (topRegion[1] / totalSpend) * 100;

  if (topRegionPercent > 50) {
    return {
      type: 'region',
      entity: topRegion[0],
      concentration: Math.round(topRegionPercent * 10) / 10,
      threshold: 50,
      spend: formatSpend(topRegion[1]),
      recommendation: `Over half of spend concentrated in ${topRegion[0]}. Geographic diversification would reduce exposure to regional disruptions and geopolitical risks.`,
      severity: topRegionPercent > 70 ? 'high' : 'medium',
    };
  }

  return null;
};

// Generate spend exposure data matching SpendExposureWidget interface
export const generateSpendExposureData = (
  suppliers: Supplier[] = MOCK_SUPPLIERS
): {
  totalSpend: number;
  totalSpendFormatted: string;
  breakdown: Array<{
    level: RiskLevel;
    amount: number;
    formatted: string;
    percent: number;
    supplierCount: number;
  }>;
  highestExposure?: {
    supplierName: string;
    amount: string;
    riskLevel: string;
  };
} => {
  const totalSpend = suppliers.reduce((sum, s) => sum + s.spend, 0);

  const levels: RiskLevel[] = ['high', 'medium-high', 'medium', 'low', 'unrated'];
  const breakdown = levels.map(level => {
    const levelSuppliers = suppliers.filter(s => s.srs.level === level);
    const amount = levelSuppliers.reduce((sum, s) => sum + s.spend, 0);
    return {
      level,
      amount,
      formatted: formatSpend(amount),
      percent: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
      supplierCount: levelSuppliers.length,
    };
  });

  // Find highest risk exposure supplier
  const highRiskSuppliers = suppliers.filter(s => s.srs.level === 'high' || s.srs.level === 'medium-high');
  const topRiskSupplier = highRiskSuppliers.sort((a, b) => b.spend - a.spend)[0];

  return {
    totalSpend,
    totalSpendFormatted: formatSpend(totalSpend),
    breakdown,
    highestExposure: topRiskSupplier ? {
      supplierName: topRiskSupplier.name,
      amount: topRiskSupplier.spendFormatted,
      riskLevel: topRiskSupplier.srs.level,
    } : undefined,
  };
};
