// Supplier Risk Score (SRS) types based on spec

export type RiskLevel = 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
export type TrendDirection = 'improving' | 'stable' | 'worsening';

// Data Tiers - controls what can be shown in AI responses
export type DataTier = 'freely-displayable' | 'conditionally-displayable' | 'restricted';

// Risk factors with their data tier classification
export interface RiskFactor {
  id: string;
  name: string;
  tier: DataTier;
  weight: number; // 0-1
  score?: number; // Only populated for non-restricted tiers
  rating?: string; // Low, Medium, High
}

// Factor definitions per spec
export const RISK_FACTORS: Record<string, { name: string; tier: DataTier }> = {
  // Tier 1: Freely Displayable (Beroe-Owned)
  overall_srs: { name: 'Overall SRS', tier: 'freely-displayable' },

  // Tier 2: Conditionally Displayable (Beroe-Calculated)
  esg: { name: 'ESG Score', tier: 'conditionally-displayable' },
  delivery: { name: 'Delivery Score', tier: 'conditionally-displayable' },
  quality: { name: 'Quality Score', tier: 'conditionally-displayable' },
  diversity: { name: 'Diversity Score', tier: 'conditionally-displayable' },
  scalability: { name: 'Scalability Score', tier: 'conditionally-displayable' },
  freight: { name: 'Freight Score', tier: 'conditionally-displayable' },

  // Tier 3: Restricted (Partner-Sourced) - NEVER show in AI responses
  financial: { name: 'Financial Score', tier: 'restricted' },
  cybersecurity: { name: 'Cybersecurity Score', tier: 'restricted' },
  sanctions: { name: 'Sanctions', tier: 'restricted' },
  pep: { name: 'PEP (Politically Exposed Persons)', tier: 'restricted' },
  ame: { name: 'AME (Adverse Media Events)', tier: 'restricted' },
};

// Supplier Risk Score
export interface SupplierRiskScore {
  score: number; // 0-100
  level: RiskLevel;
  trend: TrendDirection;
  lastUpdated: string; // ISO date
  factors: RiskFactor[];
}

// Full supplier model
export interface Supplier {
  id: string;
  name: string;
  duns: string;
  category: string;
  industry: string;
  location: {
    city: string;
    country: string;
    region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East' | 'Africa';
  };
  spend: number; // In dollars
  spendFormatted: string; // "$10.0M"
  criticality: 'high' | 'medium' | 'low';
  isFollowed: boolean;
  srs: SupplierRiskScore;
  revenue?: string; // Company revenue
  employeeCount?: number;
}

// Risk change event
export interface RiskChange {
  supplierId: string;
  supplierName: string;
  previousScore: number;
  previousLevel: RiskLevel;
  currentScore: number;
  currentLevel: RiskLevel;
  changeDate: string;
  direction: 'improved' | 'worsened';
}

// Portfolio aggregation
export interface RiskPortfolio {
  totalSuppliers: number;
  totalSpend: number;
  totalSpendFormatted: string;
  distribution: {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
  };
  recentChanges: RiskChange[];
}

// Helper functions
export const getRiskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium-high';
  if (score >= 40) return 'medium';
  if (score > 0) return 'low';
  return 'unrated';
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  switch (level) {
    case 'high': return 'red';
    case 'medium-high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    case 'unrated': return 'gray';
  }
};

export const getRiskLevelEmoji = (level: RiskLevel): string => {
  switch (level) {
    case 'high': return '🔴';
    case 'medium-high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    case 'unrated': return '⚪';
  }
};

export const formatSpend = (amount: number): string => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
};

// Check if a query is asking about restricted data
export const isRestrictedQuery = (query: string): boolean => {
  const restrictedPatterns = [
    /why.*(score|risk|rating)/i,
    /what.*(driving|causing|factors)/i,
    /explain.*(score|risk)/i,
    /breakdown/i,
    /financial.*(score|health|rating)/i,
    /cyber.*(score|security)/i,
    /sanction/i,
  ];

  return restrictedPatterns.some(pattern => pattern.test(query));
};
