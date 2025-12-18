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
      level: 'high',
      trend: 'worsening',
      lastUpdated: '2024-05-03',
      factors: generateRiskFactors(85),
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
      level: 'medium-high',
      trend: 'stable',
      lastUpdated: '2023-07-23',
      factors: generateRiskFactors(68),
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
      level: 'medium',
      trend: 'improving',
      lastUpdated: '2024-05-05',
      factors: generateRiskFactors(41),
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
      level: 'high',
      trend: 'stable',
      lastUpdated: '2024-04-15',
      factors: generateRiskFactors(85),
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
      level: 'low',
      trend: 'worsening',
      lastUpdated: '2024-05-01',
      factors: generateRiskFactors(32),
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
      level: 'medium',
      trend: 'stable',
      lastUpdated: '2024-04-20',
      factors: generateRiskFactors(55),
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
