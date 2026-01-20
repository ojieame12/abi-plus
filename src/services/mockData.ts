// Mock supplier data for Risk Watch prototype
import type {
  Supplier,
  RiskPortfolio,
  RiskChange,
  RiskLevel,
  RiskFactor,
} from '../types/supplier';
import type {
  InflationSummaryCardData,
  DriverBreakdownCardData,
  SpendImpactCardData,
  JustificationCardData,
  ScenarioCardData,
} from '../types/inflation';
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

// ============================================
// COMMODITIES DATA
// ============================================

export interface Commodity {
  id: string;
  name: string;
  category: 'metals' | 'packaging' | 'chemicals' | 'energy' | 'logistics' | 'agriculture';
  region?: 'global' | 'europe' | 'asia' | 'americas';
  currentPrice?: number;
  unit?: string;
  currency?: 'USD' | 'EUR' | 'CNY' | 'GBP';  // Currency for price display
  priceChange?: { percent: number; direction: 'up' | 'down' | 'stable' };
}

export const COMMODITIES: Commodity[] = [
  // Metals (LME prices in USD)
  { id: 'steel', name: 'Steel', category: 'metals', region: 'global', currentPrice: 680, unit: 'mt', currency: 'USD', priceChange: { percent: 8.5, direction: 'up' } },
  { id: 'aluminum', name: 'Aluminum', category: 'metals', region: 'global', currentPrice: 2380, unit: 'mt', currency: 'USD', priceChange: { percent: 6.2, direction: 'up' } },
  { id: 'copper', name: 'Copper', category: 'metals', region: 'global', currentPrice: 8245, unit: 'mt', currency: 'USD', priceChange: { percent: 4.1, direction: 'up' } },
  { id: 'cold-rolled-steel', name: 'Cold Rolled Steel', category: 'metals', region: 'global', currentPrice: 920, unit: 'mt', currency: 'USD', priceChange: { percent: 12.0, direction: 'up' } },

  // Packaging (USD)
  { id: 'corrugated-boxes', name: 'Corrugated Boxes', category: 'packaging', region: 'europe', currentPrice: 850, unit: 'mt', currency: 'EUR', priceChange: { percent: 5.8, direction: 'up' } },
  { id: 'plastics', name: 'Plastics', category: 'packaging', region: 'global', currentPrice: 1450, unit: 'mt', currency: 'USD', priceChange: { percent: -2.3, direction: 'down' } },
  { id: 'paper-pulp', name: 'Paper & Pulp', category: 'packaging', region: 'europe', currentPrice: 720, unit: 'mt', currency: 'EUR', priceChange: { percent: 3.2, direction: 'up' } },
  { id: 'flexible-packaging', name: 'Flexible Packaging', category: 'packaging', region: 'global', currentPrice: 2100, unit: 'mt', currency: 'USD', priceChange: { percent: 2.1, direction: 'up' } },

  // Chemicals (mixed currencies)
  { id: 'resins', name: 'Resins', category: 'chemicals', region: 'global', currentPrice: 1680, unit: 'mt', currency: 'USD', priceChange: { percent: -1.5, direction: 'down' } },
  { id: 'rubber', name: 'Rubber', category: 'chemicals', region: 'asia', currentPrice: 1850, unit: 'mt', currency: 'USD', priceChange: { percent: -1.8, direction: 'down' } },
  { id: 'silicones', name: 'Silicones', category: 'chemicals', region: 'global', currentPrice: 3200, unit: 'mt', currency: 'USD', priceChange: { percent: 1.2, direction: 'up' } },
  { id: 'lithium-carbonate', name: 'Lithium Carbonate', category: 'chemicals', region: 'global', currentPrice: 126005, unit: 'mt', currency: 'CNY', priceChange: { percent: 56.0, direction: 'up' } },
  { id: 'rare-earth-elements', name: 'Rare Earth Elements', category: 'chemicals', region: 'asia', currentPrice: 50000, unit: 'mt', currency: 'CNY', priceChange: { percent: 14.0, direction: 'up' } },

  // Energy (mixed)
  { id: 'natural-gas', name: 'Natural Gas', category: 'energy', region: 'europe', currentPrice: 32.5, unit: 'MMBtu', currency: 'EUR', priceChange: { percent: 15.3, direction: 'up' } },
  { id: 'electricity', name: 'Electricity', category: 'energy', region: 'europe', currentPrice: 85, unit: 'MWh', currency: 'EUR', priceChange: { percent: 8.7, direction: 'up' } },

  // Logistics (USD)
  { id: 'ocean-freight', name: 'Ocean Freight', category: 'logistics', region: 'global', currentPrice: 2850, unit: 'TEU', currency: 'USD', priceChange: { percent: -5.2, direction: 'down' } },
  { id: 'air-freight', name: 'Air Freight', category: 'logistics', region: 'global', currentPrice: 4.25, unit: 'kg', currency: 'USD', priceChange: { percent: 2.8, direction: 'up' } },
];

// Get commodity by ID or name (tolerant matching - partial names work)
export const getCommodity = (idOrName: string): Commodity | undefined => {
  const lower = idOrName.toLowerCase().trim();

  // Exact match first
  const exact = COMMODITIES.find(c =>
    c.id === lower || c.name.toLowerCase() === lower
  );
  if (exact) return exact;

  // Partial match: query contains commodity name or vice versa
  return COMMODITIES.find(c =>
    c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
  );
};

// Get commodities by category
export const getCommoditiesByCategory = (category: Commodity['category']): Commodity[] => {
  return COMMODITIES.filter(c => c.category === category);
};

// Get commodities by region
export const getCommoditiesByRegion = (region: Commodity['region']): Commodity[] => {
  return COMMODITIES.filter(c => c.region === region || c.region === 'global');
};

// ============================================
// INFLATION MOCK DATA
// ============================================

export type InflationSummaryData = InflationSummaryCardData;
export type CommodityDriverData = DriverBreakdownCardData;
export type SpendImpactData = SpendImpactCardData;
export type JustificationData = JustificationCardData;
export type ScenarioData = ScenarioCardData;

export const MOCK_INFLATION_SUMMARY: InflationSummaryData = {
  period: 'January 2026',
  headline: 'Steel and aluminum prices surge amid supply constraints and EV demand',
  overallChange: { absolute: 125000000, percent: 4.2, direction: 'up' },
  topIncreases: [
    { commodity: 'Steel', change: 8.5, impact: '$2.5M impact' },
    { commodity: 'Aluminum', change: 6.2, impact: '$1.8M impact' },
    { commodity: 'Copper', change: 4.1, impact: '$950K impact' },
  ],
  topDecreases: [
    { commodity: 'Plastics', change: -2.3, benefit: '$500K savings' },
    { commodity: 'Rubber', change: -1.8, benefit: '$320K savings' },
  ],
  portfolioImpact: { amount: '$5.2M', percent: 4.2, direction: 'increase' },
  keyDrivers: ['China production cuts', 'EV demand surge', 'Energy costs'],
  lastUpdated: '2 hours ago',
};

export const MOCK_COMMODITY_DRIVERS: CommodityDriverData = {
  commodity: 'Steel',
  priceChange: { absolute: 85, percent: 8.5, direction: 'up' },
  period: 'January 2026',
  drivers: [
    { name: 'China production cuts', category: 'supply', contribution: 45, direction: 'up', description: 'Reduced output by 12% due to environmental policies' },
    { name: 'EV manufacturing demand', category: 'demand', contribution: 30, direction: 'up', description: 'Battery and chassis steel demand up 25% YoY' },
    { name: 'Energy costs', category: 'supply', contribution: 15, direction: 'up', description: 'Natural gas prices remain elevated' },
    { name: 'Shipping disruptions', category: 'logistics', contribution: 10, direction: 'down', description: 'Red Sea disruptions easing' },
  ],
  marketContext: 'Global steel production down 5% while demand remains strong, creating supply-demand imbalance.',
  sources: [
    { title: 'China Steel Output Falls 12%', source: 'Reuters', url: 'https://www.reuters.com/markets/commodities/' },
    { title: 'EV Demand Drives Steel Surge', source: 'Bloomberg', url: 'https://www.bloomberg.com/commodities' },
  ],
};

export const MOCK_SPEND_IMPACT: SpendImpactData = {
  totalImpact: '$5.2M',
  totalImpactDirection: 'increase',
  impactPercent: 4.2,
  timeframe: 'vs. last quarter',
  breakdown: [
    { category: 'Raw Materials', amount: '+$2.8M', percent: 6.2, direction: 'up' },
    { category: 'Components', amount: '+$1.5M', percent: 4.7, direction: 'up' },
    { category: 'Packaging', amount: '+$650K', percent: 3.6, direction: 'up' },
    { category: 'Logistics', amount: '+$250K', percent: 2.1, direction: 'up' },
  ],
  mostAffected: {
    type: 'category',
    name: 'Raw Materials',
    impact: '+$2.8M (6.2%)',
  },
  recommendation: 'Consider negotiating volume discounts or switching to alternative suppliers to mitigate $1.8M in potential savings.',
};


export const MOCK_JUSTIFICATION_DATA: JustificationData = {
  supplierName: 'Acme Steel',
  commodity: 'Cold Rolled Steel',
  requestedIncrease: 12,
  marketBenchmark: 8.5,
  verdict: 'partially_justified',
  verdictLabel: 'Partially Justified',
  keyPoints: [
    { point: 'Market prices increased 8.5% average', supports: true },
    { point: 'Energy costs up 15% affecting production', supports: true },
    { point: 'Supplier margin already above industry average', supports: false },
    { point: 'Alternative suppliers available at lower rates', supports: false },
  ],
  recommendation: 'Counter-offer at 9% increase with volume commitment for additional discount.',
  negotiationLeverage: 'moderate',
};

export const MOCK_SCENARIO_DATA: ScenarioData = {
  scenarioName: 'Steel Price Surge',
  description: 'Impact analysis if steel prices continue upward trend',
  assumption: 'Steel prices increase 15% over next quarter',
  currentState: { label: 'Current Q2 Spend', value: '$45.2M' },
  projectedState: { label: 'Projected Q3 Spend', value: '$52.0M' },
  delta: { amount: '$6.8M', percent: 15, direction: 'up' },
  confidence: 'medium',
  topImpacts: [
    'Raw materials budget +$4.2M',
    'Component costs +$1.8M',
    'Margin compression 2.1%',
  ],
  recommendation: 'Consider forward contracts to lock in current rates.',
};

// Commodity-specific driver data
const COMMODITY_DRIVERS: Record<string, CommodityDriverData> = {
  'corrugated boxes': {
    commodity: 'Corrugated Boxes',
    priceChange: { absolute: 45, percent: 5.8, direction: 'up' },
    period: 'January 2026',
    drivers: [
      { name: 'Pulp prices surge', category: 'supply', contribution: 40, direction: 'up', description: 'European pulp mills facing energy cost increases' },
      { name: 'E-commerce packaging demand', category: 'demand', contribution: 30, direction: 'up', description: 'Online retail growth driving 15% higher box consumption' },
      { name: 'Recycled content regulations', category: 'regulatory', contribution: 20, direction: 'up', description: 'EU mandates pushing up recycled fiber costs' },
      { name: 'Energy costs in mills', category: 'supply', contribution: 10, direction: 'up', description: 'Natural gas prices affecting production costs' },
    ],
    marketContext: 'European corrugated packaging market seeing sustained demand from e-commerce while facing supply-side cost pressures.',
    sources: [
      { title: 'European Pulp Prices Hit 18-Month High', source: 'RISI', url: 'https://www.risiinfo.com' },
      { title: 'E-commerce Packaging Demand Outlook', source: 'Smithers', url: 'https://www.smithers.com' },
    ],
  },
  'aluminum': {
    commodity: 'Aluminum',
    priceChange: { absolute: 125, percent: 6.2, direction: 'up' },
    period: 'January 2026',
    drivers: [
      { name: 'China smelter curtailments', category: 'supply', contribution: 35, direction: 'up', description: 'Power rationing reducing output by 8%' },
      { name: 'EV and renewable demand', category: 'demand', contribution: 30, direction: 'up', description: 'Lightweighting trends accelerating adoption' },
      { name: 'Bauxite supply constraints', category: 'supply', contribution: 20, direction: 'up', description: 'Guinea export restrictions limiting raw material' },
      { name: 'Energy transition investments', category: 'demand', contribution: 15, direction: 'up', description: 'Solar and grid infrastructure projects' },
    ],
    marketContext: 'Global aluminum market in deficit as demand outpaces production capacity additions.',
    sources: [
      { title: 'China Aluminum Output Falls', source: 'Reuters', url: 'https://www.reuters.com' },
      { title: 'Aluminum Demand in EV Sector', source: 'CRU Group', url: 'https://www.crugroup.com' },
    ],
  },
};

export const getInflationSummary = (): InflationSummaryData => MOCK_INFLATION_SUMMARY;
export const getCommodityDrivers = (commodity?: string): CommodityDriverData => {
  if (commodity) {
    const lower = commodity.toLowerCase();
    const specificData = COMMODITY_DRIVERS[lower];
    if (specificData) return specificData;
  }
  return {
    ...MOCK_COMMODITY_DRIVERS,
    commodity: commodity || MOCK_COMMODITY_DRIVERS.commodity,
  };
};
export const getSpendImpact = (): SpendImpactData => MOCK_SPEND_IMPACT;
export const getJustificationData = (supplierName?: string, commodity?: string): JustificationData => ({
  ...MOCK_JUSTIFICATION_DATA,
  supplierName: supplierName || MOCK_JUSTIFICATION_DATA.supplierName,
  commodity: commodity || MOCK_JUSTIFICATION_DATA.commodity,
});
export const getScenarioData = (): ScenarioData => MOCK_SCENARIO_DATA;

// Market Events for news/events feed widget
export interface MarketEvent {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  category: 'price' | 'supply' | 'demand' | 'regulation' | 'geopolitical';
  impact: 'positive' | 'negative' | 'neutral';
  affectedCommodities?: string[];
}

const MOCK_MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'evt-1',
    title: 'China steel production hits 18-month low',
    summary: 'Output decline expected to support global prices through Q1',
    source: 'Reuters',
    timestamp: '2h ago',
    category: 'supply',
    impact: 'positive',
    affectedCommodities: ['steel', 'iron ore'],
  },
  {
    id: 'evt-2',
    title: 'EU carbon border tax takes effect',
    summary: 'New tariffs on carbon-intensive imports may increase aluminum costs 3-5%',
    source: 'Financial Times',
    timestamp: '4h ago',
    category: 'regulation',
    impact: 'negative',
    affectedCommodities: ['aluminum', 'steel'],
  },
  {
    id: 'evt-3',
    title: 'LME copper inventories drop to decade low',
    summary: 'Tight supply conditions signal continued price support',
    source: 'Bloomberg',
    timestamp: '6h ago',
    category: 'supply',
    impact: 'negative',
    affectedCommodities: ['copper'],
  },
  {
    id: 'evt-4',
    title: 'US packaging demand forecasts revised upward',
    summary: 'E-commerce growth driving 8% increase in corrugated box consumption',
    source: 'Industry Week',
    timestamp: '1d ago',
    category: 'demand',
    impact: 'negative',
    affectedCommodities: ['corrugated boxes', 'paper', 'pulp'],
  },
];

export const getMarketEvents = (commodity?: string): MarketEvent[] => {
  if (commodity) {
    const lower = commodity.toLowerCase();
    return MOCK_MARKET_EVENTS.filter(e =>
      e.affectedCommodities?.some(c => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()))
    );
  }
  return MOCK_MARKET_EVENTS;
};

// Category/Region breakdown helpers
export const getCategoryBreakdown = (portfolio: RiskPortfolio, suppliers: Supplier[]): Array<{
  category: string;
  count: number;
  spend: number;
  highRisk: number;
  avgScore: number;
}> => {
  const categories = getCategories();
  return categories.map(cat => {
    const catSuppliers = suppliers.filter(s => s.category === cat);
    const highRisk = catSuppliers.filter(s => s.srs?.level === 'high' || s.srs?.level === 'medium-high').length;
    const avgScore = catSuppliers.length > 0
      ? catSuppliers.reduce((sum, s) => sum + (s.srs?.score ?? 50), 0) / catSuppliers.length
      : 0;
    const spend = catSuppliers.reduce((sum, s) => sum + s.spend, 0);
    return { category: cat, count: catSuppliers.length, spend, highRisk, avgScore: Math.round(avgScore) };
  }).filter(c => c.count > 0);
};

export const getRegionBreakdown = (portfolio: RiskPortfolio, suppliers: Supplier[]): Array<{
  region: string;
  count: number;
  spend: number;
  highRisk: number;
  avgScore: number;
}> => {
  const regions = getRegions();
  return regions.map(reg => {
    const regSuppliers = suppliers.filter(s => s.location?.region === reg);
    const highRisk = regSuppliers.filter(s => s.srs?.level === 'high' || s.srs?.level === 'medium-high').length;
    const avgScore = regSuppliers.length > 0
      ? regSuppliers.reduce((sum, s) => sum + (s.srs?.score ?? 50), 0) / regSuppliers.length
      : 0;
    const spend = regSuppliers.reduce((sum, s) => sum + s.spend, 0);
    return { region: reg, count: regSuppliers.length, spend, highRisk, avgScore: Math.round(avgScore) };
  }).filter(r => r.count > 0);
};

// ============================================
// VALUE LADDER MOCK DATA (4-Layer System)
// ============================================

import type {
  ValueLadder,
  SourceEnhancement,
  SourceEnhancementSuggestion,
} from '../types/aiResponse';

// Mock Beroe Analysts (Layer 2)
const MOCK_ANALYSTS = [
  {
    id: 'analyst_001',
    name: 'Sarah Chen',
    title: 'Senior Category Analyst',
    specialty: 'Metals & Mining',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    availability: 'available' as const,
    responseTime: '~2 hours',
  },
  {
    id: 'analyst_002',
    name: 'Michael Torres',
    title: 'Principal Analyst',
    specialty: 'Packaging & Paper',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    availability: 'available' as const,
    responseTime: '~4 hours',
  },
  {
    id: 'analyst_003',
    name: 'Emma Williams',
    title: 'Category Lead',
    specialty: 'Chemicals & Energy',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    availability: 'busy' as const,
    responseTime: '~1 day',
  },
  {
    id: 'analyst_004',
    name: 'James Park',
    title: 'Senior Analyst',
    specialty: 'Logistics & Freight',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    availability: 'available' as const,
    responseTime: '~3 hours',
  },
];

// Mock Expert Network (Layer 3)
const MOCK_EXPERTS = [
  {
    id: 'expert_001',
    name: 'Dr. Robert Hayes',
    title: 'Former VP Supply Chain',
    formerCompany: 'Tesla',
    expertise: 'EV Battery Materials, Lithium Supply Chain',
    isTopVoice: true,
  },
  {
    id: 'expert_002',
    name: 'Patricia Morgan',
    title: 'Former Chief Procurement Officer',
    formerCompany: 'Unilever',
    expertise: 'Sustainable Packaging, FMCG Supply',
    isTopVoice: true,
  },
  {
    id: 'expert_003',
    name: 'Thomas Schmidt',
    title: 'Former Managing Director',
    formerCompany: 'ThyssenKrupp',
    expertise: 'Steel Markets, European Manufacturing',
    isTopVoice: false,
  },
  {
    id: 'expert_004',
    name: 'Lisa Chang',
    title: 'Former Head of Strategic Sourcing',
    formerCompany: 'Apple',
    expertise: 'Electronics, Asia-Pacific Supply Chain',
    isTopVoice: true,
  },
];


// Category to specialty mapping for analyst matching
const CATEGORY_SPECIALTY_MAP: Record<string, string[]> = {
  'metals': ['Metals & Mining'],
  'steel': ['Metals & Mining'],
  'aluminum': ['Metals & Mining'],
  'copper': ['Metals & Mining'],
  'packaging': ['Packaging & Paper'],
  'corrugated': ['Packaging & Paper'],
  'paper': ['Packaging & Paper'],
  'chemicals': ['Chemicals & Energy'],
  'energy': ['Chemicals & Energy'],
  'lithium': ['Chemicals & Energy'],
  'logistics': ['Logistics & Freight'],
  'freight': ['Logistics & Freight'],
  'shipping': ['Logistics & Freight'],
};

/**
 * Generate Value Ladder actions based on context
 * @param context - Query context (commodity, supplier, category)
 * @param intent - Detected intent from query
 * @returns ValueLadder with available actions
 */
export const generateValueLadder = (
  context?: {
    commodity?: string;
    supplier?: string;
    category?: string;
    queryId?: string;
  },
  intent?: string
): ValueLadder => {
  const valueLadder: ValueLadder = {};

  // Layer 2: Analyst Connect - Match analyst based on category/commodity
  const searchTerms = [
    context?.commodity?.toLowerCase(),
    context?.category?.toLowerCase(),
    context?.supplier?.toLowerCase(),
  ].filter(Boolean);

  let matchedSpecialty: string | undefined;
  for (const term of searchTerms) {
    if (term) {
      for (const [key, specialties] of Object.entries(CATEGORY_SPECIALTY_MAP)) {
        if (term.includes(key)) {
          matchedSpecialty = specialties[0];
          break;
        }
      }
    }
    if (matchedSpecialty) break;
  }

  // Deterministic analyst selection - first matched by specialty, or first in list
  const matchedAnalyst = matchedSpecialty
    ? MOCK_ANALYSTS.find(a => a.specialty === matchedSpecialty)
    : MOCK_ANALYSTS[0];

  if (matchedAnalyst) {
    valueLadder.analystConnect = {
      available: true,
      analyst: matchedAnalyst,
      cta: `Ask ${matchedAnalyst.name.split(' ')[0]} about this`,
      context: context?.queryId ? {
        queryId: context.queryId,
        relevantSection: 'main_response',
      } : undefined,
    };
  }

  // Layer 3: Expert Deep-Dive - Match expert based on context (premium)
  // Use deterministic matching - first matched expert or first in list
  const matchedExpert = MOCK_EXPERTS.find(expert => {
    const expertiseLower = expert.expertise.toLowerCase();
    return searchTerms.some(term => term && expertiseLower.includes(term));
  }) || MOCK_EXPERTS[0];

  // Expert is available for complex intents (deterministic, no randomness)
  const complexIntents = ['market_context', 'comparison', 'explanation_why', 'negotiation', 'scenario_analysis'];
  const shouldShowExpert = intent && complexIntents.includes(intent);

  if (shouldShowExpert && matchedExpert) {
    // Recommendation shown when there's a matched analyst (deterministic)
    const showRecommendation = !!matchedAnalyst;
    valueLadder.expertDeepDive = {
      available: true,
      matchedExpert,
      isPremium: true,
      cta: 'Request expert intro',
      recommendedBy: showRecommendation ? {
        analystName: matchedAnalyst.name,
        reason: `${matchedExpert.name} has deep expertise in this area`,
      } : undefined,
    };
  }

  return valueLadder;
};

/**
 * Generate Source Enhancement suggestions based on source mix
 * @param sourceMix - What sources were used in the response
 * @param intent - Detected intent
 * @returns SourceEnhancement with suggestions
 */
export const generateSourceEnhancement = (
  sourceMix: 'internal_only' | 'internal_plus_partners' | 'internal_plus_web' | 'web_only' | 'all',
  intent?: string
): SourceEnhancement => {
  const suggestions: SourceEnhancementSuggestion[] = [];

  // Map internal names to API names
  const currentSourceType: SourceEnhancement['currentSourceType'] =
    sourceMix === 'internal_only' ? 'beroe_only' :
    sourceMix === 'internal_plus_partners' ? 'beroe_plus_partners' :
    sourceMix === 'internal_plus_web' ? 'beroe_plus_web' :
    sourceMix === 'web_only' ? 'web_only' : 'all';

  // If using only internal/Beroe data, suggest adding web sources
  if (sourceMix === 'internal_only') {
    suggestions.push({
      type: 'add_web',
      text: 'Add web sources',
      description: 'Include recent news, filings, and market reports',
      icon: 'globe',
    });
  }

  // If not using all sources, suggest deep research
  if (sourceMix !== 'all') {
    suggestions.push({
      type: 'deep_research',
      text: 'Deep research',
      description: 'Multi-source analysis with verification',
      icon: 'search',
    });
  }

  // For complex intents, suggest analyst or expert
  const complexIntents = ['market_context', 'comparison', 'explanation_why', 'negotiation', 'scenario_analysis'];
  if (intent && complexIntents.includes(intent)) {
    if (sourceMix === 'internal_only' || sourceMix === 'internal_plus_partners') {
      suggestions.push({
        type: 'analyst',
        text: 'Ask an analyst',
        description: 'Get expert validation from Beroe team',
        icon: 'user',
      });
    }
    suggestions.push({
      type: 'expert',
      text: 'Expert consultation',
      description: 'Connect with industry specialists',
      icon: 'sparkles',
    });
  }

  return {
    currentSourceType,
    suggestions,
  };
};

/**
 * Determine source mix from response sources
 * Handles both array format (Source[]) and object format (ResponseSources)
 * @param sources - Array of Source objects OR ResponseSources object
 * @returns Source mix type
 */
export const determineSourceMix = (
  sources: Array<{ type?: string }> | { web?: unknown[]; internal?: unknown[] } | undefined
): 'internal_only' | 'internal_plus_partners' | 'internal_plus_web' | 'web_only' | 'all' => {
  // Handle undefined/null
  if (!sources) {
    return 'internal_only';
  }

  // Handle object format (ResponseSources): { web: [], internal: [] }
  if (!Array.isArray(sources)) {
    const sourcesObj = sources as { web?: unknown[]; internal?: unknown[] };
    const hasWeb = Array.isArray(sourcesObj.web) && sourcesObj.web.length > 0;
    const hasInternal = Array.isArray(sourcesObj.internal) && sourcesObj.internal.length > 0;
    // Partner data would be in internal array with specific types
    if (hasWeb && hasInternal) {
      return 'internal_plus_web';
    }
    if (hasWeb && !hasInternal) {
      return 'web_only';
    }
    if (hasInternal) {
      return 'internal_only';
    }
    return 'internal_only';
  }

  // Handle array format (Source[])
  if (sources.length === 0) {
    return 'internal_only';
  }

  // Categorize source types based on chat.ts Source interface
  const WEB_TYPES = ['web', 'news'];
  const INTERNAL_TYPES = ['beroe', 'internal_data', 'supplier_data', 'report', 'data', 'analysis'];
  const PARTNER_TYPES = ['dnd', 'ecovadis'];

  let hasWeb = false;
  let hasInternal = false;
  let hasPartner = false;

  for (const source of sources) {
    const type = source.type?.toLowerCase();
    if (!type) continue;

    if (WEB_TYPES.includes(type)) {
      hasWeb = true;
    } else if (INTERNAL_TYPES.includes(type)) {
      hasInternal = true;
    } else if (PARTNER_TYPES.includes(type)) {
      hasPartner = true;
    }
  }

  // Determine mix based on what's actually present
  if (hasInternal && hasWeb && hasPartner) {
    return 'all';
  }
  if (hasInternal && hasWeb) {
    return 'internal_plus_web';
  }
  if (hasInternal && hasPartner) {
    return 'internal_plus_partners';
  }
  if (hasInternal) {
    return 'internal_only';
  }
  if (hasWeb && hasPartner) {
    return 'all';
  }
  if (hasWeb) {
    return 'web_only';
  }
  if (hasPartner) {
    return 'internal_plus_partners';
  }
  return 'internal_only';
};
