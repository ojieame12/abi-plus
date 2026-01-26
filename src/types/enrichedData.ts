// Enriched Data Types for Beroe Intelligence Platform
// Comprehensive type definitions for rich procurement data

// ============================================
// SOURCE TYPES
// ============================================

export type DataProviderType =
  | 'beroe'              // Beroe internal intelligence
  | 'dun_bradstreet'     // D&B financial data
  | 'ecovadis'           // ESG ratings
  | 'commodity_exchange' // LME, COMEX, ICE
  | 'trade_intelligence' // ImportGenius, Panjiva
  | 'regulatory'         // FDA, EPA, OSHA
  | 'esg_rating'         // MSCI, Sustainalytics
  | 'credit_rating'      // Moody's, S&P
  | 'news_sentiment'     // Reuters, Bloomberg
  | 'patent_ip'          // USPTO, EPO
  | 'labor_market'       // BLS, Glassdoor
  | 'geopolitical'       // EIU, Control Risks
  | 'supplier_data'      // Internal supplier data
  | 'internal_data';     // Other internal data

export interface DataProvider {
  id: string;
  name: string;
  type: DataProviderType;
  description: string;
  dataFreshness: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  coverage: string[];  // regions or categories covered
  reliabilityScore: number; // 0-100
  isPremium: boolean;
}

// ============================================
// BEROE REPORT TYPES
// ============================================

export type ReportCategory =
  | 'category_intelligence'
  | 'risk_analytics'
  | 'pricing_intelligence'
  | 'strategic'
  | 'sustainability'
  | 'supply_chain';

export type ReportType =
  // Category Intelligence
  | 'market_overview'
  | 'supplier_landscape'
  | 'cost_structure'
  | 'regional_price_index'
  | 'demand_supply_forecast'
  | 'regulatory_impact'
  // Risk Analytics
  | 'financial_health'
  | 'supply_chain_vulnerability'
  | 'geopolitical_risk'
  | 'esg_scorecard'
  | 'cyber_threat'
  | 'business_continuity'
  // Pricing Intelligence
  | 'should_cost_model'
  | 'price_benchmark'
  | 'total_cost_ownership'
  | 'negotiation_levers'
  | 'contract_pricing'
  | 'forward_curve_analysis'
  // Strategic
  | 'sourcing_strategy'
  | 'make_vs_buy'
  | 'supplier_consolidation'
  | 'nearshoring_assessment'
  | 'innovation_scouting';

export interface BeroeReport {
  id: string;
  title: string;
  type: ReportType;
  category: ReportCategory;
  description: string;

  // Coverage
  commodities: string[];
  regions: string[];
  industries: string[];

  // Metadata
  publishedDate: string;
  lastUpdated: string;
  updateFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  pageCount: number;

  // Author
  analyst: {
    name: string;
    title: string;
    expertise: string[];
  };

  // Key findings preview
  keyFindings: string[];
  executiveSummary: string;

  // Access
  accessLevel: 'free' | 'basic' | 'premium' | 'enterprise';
  creditCost: number;
}

// ============================================
// ENRICHED COMMODITY DATA
// ============================================

export interface CommodityProducer {
  name: string;
  country: string;
  marketShare: number;
  productionCapacity: number;
  isStateOwned: boolean;
}

export interface PricePoint {
  date: string;
  price: number;
  volume?: number;
}

export interface ForwardPrice {
  month: string;
  price: number;
  confidence: number;
}

export interface EnrichedCommodity {
  // Identity
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;

  // Current Pricing
  currentPrice: number;
  currency: 'USD' | 'EUR' | 'CNY' | 'GBP';
  unit: string;
  priceChange: {
    daily: number;
    weekly: number;
    monthly: number;
    ytd: number;
  };

  // Market Structure
  marketStructure: {
    topProducers: CommodityProducer[];
    supplyConcentration: 'high' | 'medium' | 'low';
    herfindahlIndex: number; // 0-10000
    demandDrivers: string[];
    substitutes: { name: string; substitutionScore: number }[];
    tradeFlows: { from: string; to: string; volumePct: number }[];
  };

  // Pricing Intelligence
  pricing: {
    spotPrice: number;
    forwardCurve: ForwardPrice[];
    historicalPrices: PricePoint[];
    volatility30d: number;
    volatility90d: number;
    priceFloor: number;
    priceCeiling: number;
    regionalPrices: Record<string, number>;
    benchmarkIndex: string; // e.g., "LME Aluminum"
  };

  // Supply/Demand Fundamentals
  fundamentals: {
    globalProduction: number;
    globalConsumption: number;
    productionGrowthRate: number;
    consumptionGrowthRate: number;
    stockpileLevels: number;
    daysOfSupply: number;
    utilizationRate: number;
    capacityAdditions: { year: number; volume: number; region: string }[];
    sentiment: 'bullish' | 'neutral' | 'bearish';
    sentimentScore: number; // -100 to 100
  };

  // Risk Indicators
  risks: {
    supplyDisruptionRisk: 'high' | 'medium' | 'low';
    supplyRiskScore: number;
    geopoliticalExposure: number;
    topRiskCountries: string[];
    environmentalRegulationRisk: 'high' | 'medium' | 'low';
    currencyExposure: string[];
    weatherSensitivity: 'high' | 'medium' | 'low';
    laborRisk: 'high' | 'medium' | 'low';
  };

  // Beroe Coverage
  beroeCoverage: {
    hasAnalyst: boolean;
    analystName?: string;
    reportCount: number;
    lastReportDate: string;
    priceIndexAvailable: boolean;
    costModelAvailable: boolean;
  };
}

// ============================================
// ENRICHED SUPPLIER DATA
// ============================================

export interface SupplierFinancials {
  revenue: number;
  revenueGrowth: number;
  grossMargin: number;
  ebitdaMargin: number;
  netMargin: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  interestCoverage: number;
  daysPayableOutstanding: number;
  daysSalesOutstanding: number;
  inventoryTurnover: number;
  altmanZScore: number;
  paymentBehavior: 'early' | 'on_time' | 'late' | 'chronic_late';
  creditLimit: number;
  lastFinancialUpdate: string;
}

export interface SupplierOperations {
  deliveryOnTime: number;
  deliveryInFull: number;
  qualityDefectRate: number; // ppm
  qualityScore: number; // 0-100
  leadTimeStandard: number;
  leadTimeExpedited: number;
  capacityUtilization: number;
  flexibilityScore: number;
  productionSites: {
    id: string;
    country: string;
    city: string;
    capacity: number;
    headcount: number;
    certifications: string[];
  }[];
  warehouseLocations: string[];
  transportModes: string[];
}

export interface SupplierRelationship {
  yearsAsSupplier: number;
  tier: 1 | 2 | 3;
  strategicClassification: 'strategic' | 'preferred' | 'approved' | 'transactional';
  contractStartDate: string;
  contractEndDate: string;
  contractValue: number;
  paymentTerms: string;
  volumeCommitment: number;
  volumeActual: number;
  priceEscalationClause: boolean;
  exclusivityAgreement: boolean;
  jointDevelopmentProjects: number;
  lastBusinessReview: string;
  relationshipScore: number;
  accountManager: string;
}

export interface SupplierCompliance {
  iso9001: boolean;
  iso9001Expiry?: string;
  iso14001: boolean;
  iso14001Expiry?: string;
  iso45001: boolean;
  iatf16949: boolean;
  as9100: boolean;
  soc2: boolean;
  soc2Type: 1 | 2;
  fdaRegistered: boolean;
  fdaFacilityId?: string;
  conflictMineralsFree: boolean;
  reachCompliant: boolean;
  rohsCompliant: boolean;
  customsCertifications: string[];
  exportLicenses: string[];
  lastAuditDate: string;
  lastAuditScore: number;
  auditFindings: { severity: 'critical' | 'major' | 'minor'; count: number }[];
  nextAuditDate: string;
}

export interface SupplierESG {
  overallScore: number;
  overallRating: 'A' | 'B' | 'C' | 'D' | 'F';
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  carbonFootprint: number; // tons CO2e
  carbonIntensity: number; // kg CO2e per $1M revenue
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions?: number;
  renewableEnergyPct: number;
  waterUsage: number; // cubic meters
  wasteRecyclingRate: number;
  diversityScore: number;
  womenInLeadership: number;
  safetyIncidentRate: number;
  ethicsTrainingPct: number;
  controversies: {
    date: string;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolved: boolean;
  }[];
  sustainabilityGoals: { goal: string; targetYear: number; progress: number }[];
  lastEsgUpdate: string;
  esgDataProvider: string;
}

export interface SupplierAlternative {
  supplierId: string;
  name: string;
  matchScore: number;
  matchReasons: string[];
  switchingCost: 'low' | 'medium' | 'high';
  qualificationTime: number; // weeks
  capacityAvailable: boolean;
  priceCompetitiveness: 'better' | 'similar' | 'worse';
  qualityComparison: 'better' | 'similar' | 'worse';
  riskComparison: 'lower' | 'similar' | 'higher';
}

export interface EnrichedSupplier {
  // Identity
  id: string;
  name: string;
  legalName: string;
  duns: string;
  ticker?: string;
  website: string;

  // Classification
  category: string;
  subcategories: string[];
  commoditiesSupplied: string[];
  industryCodes: { system: 'NAICS' | 'SIC' | 'UNSPSC'; code: string }[];

  // Location
  headquarters: {
    country: string;
    region: string;
    city: string;
    address: string;
  };
  operatingCountries: string[];

  // Size
  employeeCount: number;
  revenueRange: string;
  marketCap?: number;
  ownershipType: 'public' | 'private' | 'state_owned' | 'subsidiary';
  parentCompany?: string;

  // Spend & Criticality
  annualSpend: number;
  spendRank: number;
  spendPctOfCategory: number;
  criticality: 'critical' | 'important' | 'standard' | 'low';
  singleSourced: boolean;

  // Risk Score
  srs: {
    score: number;
    level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
    trend: 'improving' | 'stable' | 'worsening';
    lastUpdated: string;
    factors: {
      name: string;
      score: number;
      weight: number;
      trend: 'up' | 'down' | 'stable';
    }[];
    scoreHistory: { date: string; score: number }[];
  };

  // Enriched Sections
  financials: SupplierFinancials;
  operations: SupplierOperations;
  relationship: SupplierRelationship;
  compliance: SupplierCompliance;
  esg: SupplierESG;

  // Alternatives
  alternatives: SupplierAlternative[];

  // Contacts
  contacts: {
    name: string;
    title: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }[];

  // Activity
  recentActivity: {
    date: string;
    type: 'order' | 'delivery' | 'quality_issue' | 'price_change' | 'contract' | 'audit';
    description: string;
  }[];
}

// ============================================
// MARKET EVENTS
// ============================================

export type MarketEventType =
  | 'supply_disruption'
  | 'demand_shift'
  | 'regulatory'
  | 'geopolitical'
  | 'weather'
  | 'labor'
  | 'merger_acquisition'
  | 'bankruptcy'
  | 'capacity_change'
  | 'price_movement'
  | 'trade_policy'
  | 'technology'
  | 'sustainability';

export interface MarketEventImpact {
  affectedCommodities: string[];
  affectedRegions: string[];
  affectedIndustries: string[];
  priceImpactPct: number;
  supplyImpactPct: number;
  demandImpactPct: number;
  durationWeeks: number;
  peakImpactDate?: string;
  recoveryDate?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MarketEvent {
  id: string;
  date: string;
  type: MarketEventType;
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Content
  headline: string;
  summary: string;
  details: string;

  // Impact Analysis
  impact: MarketEventImpact;

  // Supplier Impact
  affectedSuppliers: {
    supplierId: string;
    supplierName: string;
    impactSeverity: 'critical' | 'high' | 'medium' | 'low';
    impactDescription: string;
    mitigationStatus: 'mitigated' | 'in_progress' | 'unaddressed';
    mitigationActions?: string[];
  }[];

  // Source Attribution
  sources: {
    name: string;
    url: string;
    publishedAt: string;
    credibilityScore: number;
  }[];

  // Sentiment
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    marketReaction: 'panic' | 'concern' | 'cautious' | 'neutral' | 'optimistic';
    socialMentions: number;
    newsCoverage: number;
  };

  // Recommendations
  recommendations: {
    action: string;
    urgency: 'immediate' | 'short_term' | 'medium_term';
    stakeholders: string[];
  }[];

  // Related
  relatedEvents: string[];
  tags: string[];
}

// ============================================
// NEWS & ALERTS
// ============================================

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  summary: string;
  fullText?: string;

  // Classification
  category: string;
  commodities: string[];
  suppliers: string[];
  regions: string[];

  // Sentiment
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1

  // Relevance
  relevanceScore: number;
  isBreaking: boolean;

  // Engagement
  readCount: number;
  shareCount: number;
}

export interface Alert {
  id: string;
  type: 'price' | 'risk' | 'news' | 'contract' | 'compliance' | 'delivery';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  createdAt: string;
  expiresAt?: string;

  // Context
  supplierId?: string;
  supplierName?: string;
  commodityId?: string;
  commodityName?: string;

  // Action
  actionRequired: boolean;
  actionUrl?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}
