// Enriched Supplier Data
// Comprehensive supplier intelligence with financials, operations, and ESG

import type { EnrichedSupplier } from '../types/enrichedData';
import { createSeededRandom, SEEDS, REFERENCE_DATE } from '../utils/seededRandom';

// ============================================
// HELPER: Generate Score History
// ============================================

function generateScoreHistory(currentScore: number, trend: 'improving' | 'stable' | 'worsening'): { date: string; score: number }[] {
  const history: { date: string; score: number }[] = [];
  let score = currentScore;

  // Create seeded random based on current score for consistent history
  const random = createSeededRandom(SEEDS.SUPPLIERS + currentScore);

  // Go back 12 months from reference date
  for (let i = 11; i >= 0; i--) {
    const date = new Date(REFERENCE_DATE);
    date.setMonth(date.getMonth() - i);

    // Adjust score based on trend
    if (i > 0) {
      const adjustment = trend === 'improving' ? 2 : trend === 'worsening' ? -2 : (random() - 0.5) * 2;
      score = Math.max(0, Math.min(100, score - adjustment));
    }

    history.push({
      date: date.toISOString().split('T')[0],
      score: Math.round(score),
    });
  }

  return history;
}

// ============================================
// ENRICHED SUPPLIERS
// ============================================

export const ENRICHED_SUPPLIERS: EnrichedSupplier[] = [
  {
    id: 'novelis-001',
    name: 'Novelis Inc.',
    legalName: 'Novelis Inc.',
    duns: '123456789',
    ticker: undefined,
    website: 'https://novelis.com',

    category: 'Metals',
    subcategories: ['Aluminum', 'Rolled Products', 'Recycled Aluminum'],
    commoditiesSupplied: ['aluminum', 'aluminum-sheet', 'aluminum-coil'],
    industryCodes: [
      { system: 'NAICS', code: '331315' },
      { system: 'SIC', code: '3353' },
    ],

    headquarters: {
      country: 'USA',
      region: 'North America',
      city: 'Atlanta',
      address: '3560 Lenox Road NE, Suite 2000, Atlanta, GA 30326',
    },
    operatingCountries: ['USA', 'Canada', 'Germany', 'UK', 'Brazil', 'South Korea', 'China'],

    employeeCount: 13500,
    revenueRange: '$15B - $20B',
    marketCap: undefined,
    ownershipType: 'subsidiary',
    parentCompany: 'Hindalco Industries Limited',

    annualSpend: 45000000,
    spendRank: 1,
    spendPctOfCategory: 28.5,
    criticality: 'critical',
    singleSourced: false,

    srs: {
      score: 72,
      level: 'medium',
      trend: 'improving',
      lastUpdated: '2025-01-15',
      factors: [
        { name: 'Financial Health', score: 78, weight: 0.2, trend: 'up' },
        { name: 'Operational Risk', score: 65, weight: 0.15, trend: 'stable' },
        { name: 'Cyber Security', score: 82, weight: 0.1, trend: 'up' },
        { name: 'ESG Performance', score: 85, weight: 0.15, trend: 'up' },
        { name: 'Geopolitical', score: 58, weight: 0.1, trend: 'down' },
        { name: 'Supply Chain', score: 68, weight: 0.15, trend: 'stable' },
        { name: 'Regulatory', score: 75, weight: 0.1, trend: 'stable' },
        { name: 'Reputation', score: 80, weight: 0.05, trend: 'up' },
      ],
      scoreHistory: generateScoreHistory(72, 'improving'),
    },

    financials: {
      revenue: 18500000000,
      revenueGrowth: 8.5,
      grossMargin: 18.2,
      ebitdaMargin: 12.5,
      netMargin: 5.8,
      debtToEquity: 1.8,
      currentRatio: 1.4,
      quickRatio: 0.9,
      interestCoverage: 4.2,
      daysPayableOutstanding: 52,
      daysSalesOutstanding: 38,
      inventoryTurnover: 8.5,
      altmanZScore: 2.1,
      paymentBehavior: 'on_time',
      creditLimit: 75000000,
      lastFinancialUpdate: '2024-12-31',
    },

    operations: {
      deliveryOnTime: 94.5,
      deliveryInFull: 97.2,
      qualityDefectRate: 125,
      qualityScore: 92,
      leadTimeStandard: 21,
      leadTimeExpedited: 10,
      capacityUtilization: 85,
      flexibilityScore: 78,
      productionSites: [
        { id: 'site-1', country: 'USA', city: 'Oswego', capacity: 450000, headcount: 1200, certifications: ['ISO 9001', 'IATF 16949', 'ISO 14001'] },
        { id: 'site-2', country: 'Germany', city: 'Nachterstedt', capacity: 400000, headcount: 980, certifications: ['ISO 9001', 'IATF 16949', 'ISO 14001', 'ISO 45001'] },
        { id: 'site-3', country: 'Brazil', city: 'Pindamonhangaba', capacity: 500000, headcount: 1100, certifications: ['ISO 9001', 'ISO 14001'] },
        { id: 'site-4', country: 'South Korea', city: 'Yeongju', capacity: 350000, headcount: 850, certifications: ['ISO 9001', 'IATF 16949'] },
      ],
      warehouseLocations: ['Atlanta', 'Detroit', 'Munich', 'Shanghai'],
      transportModes: ['Truck', 'Rail', 'Ocean'],
    },

    relationship: {
      yearsAsSupplier: 8,
      tier: 1,
      strategicClassification: 'strategic',
      contractStartDate: '2022-01-01',
      contractEndDate: '2026-12-31',
      contractValue: 180000000,
      paymentTerms: 'Net 45',
      volumeCommitment: 40000,
      volumeActual: 42500,
      priceEscalationClause: true,
      exclusivityAgreement: false,
      jointDevelopmentProjects: 2,
      lastBusinessReview: '2024-11-15',
      relationshipScore: 88,
      accountManager: 'Jennifer Walsh',
    },

    compliance: {
      iso9001: true,
      iso9001Expiry: '2026-03-15',
      iso14001: true,
      iso14001Expiry: '2026-03-15',
      iso45001: true,
      iatf16949: true,
      as9100: false,
      soc2: false,
      soc2Type: 1,
      fdaRegistered: false,
      conflictMineralsFree: true,
      reachCompliant: true,
      rohsCompliant: true,
      customsCertifications: ['C-TPAT', 'AEO'],
      exportLicenses: [],
      lastAuditDate: '2024-09-20',
      lastAuditScore: 92,
      auditFindings: [
        { severity: 'minor', count: 3 },
        { severity: 'major', count: 0 },
        { severity: 'critical', count: 0 },
      ],
      nextAuditDate: '2025-09-20',
    },

    esg: {
      overallScore: 78,
      overallRating: 'B',
      environmentalScore: 82,
      socialScore: 75,
      governanceScore: 76,
      carbonFootprint: 2850000,
      carbonIntensity: 154,
      scope1Emissions: 1200000,
      scope2Emissions: 1650000,
      scope3Emissions: 8500000,
      renewableEnergyPct: 35,
      waterUsage: 12500000,
      wasteRecyclingRate: 92,
      diversityScore: 72,
      womenInLeadership: 28,
      safetyIncidentRate: 0.8,
      ethicsTrainingPct: 98,
      controversies: [],
      sustainabilityGoals: [
        { goal: 'Carbon Neutral by 2050', targetYear: 2050, progress: 25 },
        { goal: '100% Renewable Energy', targetYear: 2030, progress: 35 },
        { goal: 'Zero Waste to Landfill', targetYear: 2025, progress: 92 },
      ],
      lastEsgUpdate: '2024-12-01',
      esgDataProvider: 'EcoVadis',
    },

    alternatives: [
      {
        supplierId: 'alcoa-002',
        name: 'Alcoa Corporation',
        matchScore: 85,
        matchReasons: ['Same commodity', 'Similar capacity', 'North American presence'],
        switchingCost: 'medium',
        qualificationTime: 16,
        capacityAvailable: true,
        priceCompetitiveness: 'similar',
        qualityComparison: 'similar',
        riskComparison: 'similar',
      },
      {
        supplierId: 'constellium-003',
        name: 'Constellium SE',
        matchScore: 78,
        matchReasons: ['Automotive grade aluminum', 'European presence'],
        switchingCost: 'high',
        qualificationTime: 24,
        capacityAvailable: true,
        priceCompetitiveness: 'worse',
        qualityComparison: 'better',
        riskComparison: 'lower',
      },
    ],

    contacts: [
      { name: 'David Chen', title: 'VP Sales - Americas', email: 'david.chen@novelis.com', phone: '+1-404-555-0101', isPrimary: true },
      { name: 'Maria Schmidt', title: 'Account Manager', email: 'maria.schmidt@novelis.com', phone: '+1-404-555-0102', isPrimary: false },
    ],

    recentActivity: [
      { date: '2025-01-20', type: 'delivery', description: 'Shipment #45892 delivered on time' },
      { date: '2025-01-15', type: 'price_change', description: 'Q1 2025 price adjustment +2.5%' },
      { date: '2024-12-10', type: 'contract', description: 'Contract extension negotiation started' },
      { date: '2024-11-15', type: 'audit', description: 'Quarterly business review completed' },
    ],
  },

  {
    id: 'basf-002',
    name: 'BASF SE',
    legalName: 'BASF SE',
    duns: '987654321',
    ticker: 'BAS.DE',
    website: 'https://basf.com',

    category: 'Chemicals',
    subcategories: ['Resins', 'Polymers', 'Specialty Chemicals', 'Coatings'],
    commoditiesSupplied: ['resins', 'polymers', 'adhesives', 'coatings'],
    industryCodes: [
      { system: 'NAICS', code: '325211' },
      { system: 'SIC', code: '2821' },
    ],

    headquarters: {
      country: 'Germany',
      region: 'Europe',
      city: 'Ludwigshafen',
      address: 'Carl-Bosch-Strasse 38, 67056 Ludwigshafen, Germany',
    },
    operatingCountries: ['Germany', 'USA', 'China', 'Belgium', 'Brazil', 'India', 'Japan', 'Singapore'],

    employeeCount: 111000,
    revenueRange: '$60B - $80B',
    marketCap: 45000000000,
    ownershipType: 'public',
    parentCompany: undefined,

    annualSpend: 32000000,
    spendRank: 2,
    spendPctOfCategory: 18.2,
    criticality: 'critical',
    singleSourced: true,

    srs: {
      score: 68,
      level: 'medium',
      trend: 'stable',
      lastUpdated: '2025-01-18',
      factors: [
        { name: 'Financial Health', score: 75, weight: 0.2, trend: 'stable' },
        { name: 'Operational Risk', score: 62, weight: 0.15, trend: 'down' },
        { name: 'Cyber Security', score: 78, weight: 0.1, trend: 'up' },
        { name: 'ESG Performance', score: 82, weight: 0.15, trend: 'up' },
        { name: 'Geopolitical', score: 52, weight: 0.1, trend: 'down' },
        { name: 'Supply Chain', score: 58, weight: 0.15, trend: 'down' },
        { name: 'Regulatory', score: 72, weight: 0.1, trend: 'stable' },
        { name: 'Reputation', score: 78, weight: 0.05, trend: 'stable' },
      ],
      scoreHistory: generateScoreHistory(68, 'stable'),
    },

    financials: {
      revenue: 68900000000,
      revenueGrowth: -5.2,
      grossMargin: 22.5,
      ebitdaMargin: 11.8,
      netMargin: 4.2,
      debtToEquity: 0.85,
      currentRatio: 1.6,
      quickRatio: 1.1,
      interestCoverage: 6.8,
      daysPayableOutstanding: 58,
      daysSalesOutstanding: 52,
      inventoryTurnover: 5.2,
      altmanZScore: 2.8,
      paymentBehavior: 'on_time',
      creditLimit: 50000000,
      lastFinancialUpdate: '2024-12-31',
    },

    operations: {
      deliveryOnTime: 91.2,
      deliveryInFull: 95.8,
      qualityDefectRate: 85,
      qualityScore: 94,
      leadTimeStandard: 28,
      leadTimeExpedited: 14,
      capacityUtilization: 78,
      flexibilityScore: 72,
      productionSites: [
        { id: 'site-1', country: 'Germany', city: 'Ludwigshafen', capacity: 8000000, headcount: 35000, certifications: ['ISO 9001', 'ISO 14001', 'RC 14001', 'ISO 45001'] },
        { id: 'site-2', country: 'Belgium', city: 'Antwerp', capacity: 3500000, headcount: 3200, certifications: ['ISO 9001', 'ISO 14001', 'RC 14001'] },
        { id: 'site-3', country: 'USA', city: 'Freeport', capacity: 2800000, headcount: 2100, certifications: ['ISO 9001', 'ISO 14001'] },
        { id: 'site-4', country: 'China', city: 'Nanjing', capacity: 2200000, headcount: 2800, certifications: ['ISO 9001', 'ISO 14001'] },
      ],
      warehouseLocations: ['Rotterdam', 'Houston', 'Shanghai', 'Singapore'],
      transportModes: ['Truck', 'Rail', 'Ocean', 'Barge'],
    },

    relationship: {
      yearsAsSupplier: 12,
      tier: 1,
      strategicClassification: 'strategic',
      contractStartDate: '2020-04-01',
      contractEndDate: '2025-03-31',
      contractValue: 128000000,
      paymentTerms: 'Net 60',
      volumeCommitment: 25000,
      volumeActual: 23800,
      priceEscalationClause: true,
      exclusivityAgreement: true,
      jointDevelopmentProjects: 3,
      lastBusinessReview: '2024-10-20',
      relationshipScore: 82,
      accountManager: 'Thomas Mueller',
    },

    compliance: {
      iso9001: true,
      iso9001Expiry: '2025-08-20',
      iso14001: true,
      iso14001Expiry: '2025-08-20',
      iso45001: true,
      iatf16949: false,
      as9100: false,
      soc2: true,
      soc2Type: 2,
      fdaRegistered: true,
      fdaFacilityId: 'FDA-12345',
      conflictMineralsFree: true,
      reachCompliant: true,
      rohsCompliant: true,
      customsCertifications: ['AEO', 'C-TPAT'],
      exportLicenses: ['EAR'],
      lastAuditDate: '2024-07-15',
      lastAuditScore: 88,
      auditFindings: [
        { severity: 'minor', count: 5 },
        { severity: 'major', count: 1 },
        { severity: 'critical', count: 0 },
      ],
      nextAuditDate: '2025-07-15',
    },

    esg: {
      overallScore: 82,
      overallRating: 'A',
      environmentalScore: 78,
      socialScore: 85,
      governanceScore: 84,
      carbonFootprint: 18500000,
      carbonIntensity: 268,
      scope1Emissions: 8200000,
      scope2Emissions: 10300000,
      scope3Emissions: 42000000,
      renewableEnergyPct: 28,
      waterUsage: 1800000000,
      wasteRecyclingRate: 85,
      diversityScore: 78,
      womenInLeadership: 32,
      safetyIncidentRate: 0.5,
      ethicsTrainingPct: 100,
      controversies: [
        { date: '2023-06-15', type: 'Environmental', description: 'Minor chemical spill at Ludwigshafen', severity: 'low', resolved: true },
      ],
      sustainabilityGoals: [
        { goal: 'Net Zero CO2 by 2050', targetYear: 2050, progress: 18 },
        { goal: 'Circular Economy Products 25%', targetYear: 2030, progress: 42 },
      ],
      lastEsgUpdate: '2024-11-15',
      esgDataProvider: 'MSCI',
    },

    alternatives: [
      {
        supplierId: 'dow-003',
        name: 'Dow Inc.',
        matchScore: 82,
        matchReasons: ['Same product categories', 'Global presence', 'Similar scale'],
        switchingCost: 'high',
        qualificationTime: 20,
        capacityAvailable: true,
        priceCompetitiveness: 'similar',
        qualityComparison: 'similar',
        riskComparison: 'similar',
      },
    ],

    contacts: [
      { name: 'Klaus Weber', title: 'Global Account Director', email: 'klaus.weber@basf.com', phone: '+49-621-555-0101', isPrimary: true },
      { name: 'Sarah Johnson', title: 'Technical Sales Manager', email: 'sarah.johnson@basf.com', phone: '+1-973-555-0102', isPrimary: false },
    ],

    recentActivity: [
      { date: '2025-01-22', type: 'order', description: 'PO #78234 placed for Q1 requirements' },
      { date: '2025-01-10', type: 'quality_issue', description: 'Minor color variation in batch #45892 - resolved' },
      { date: '2024-12-05', type: 'contract', description: 'Contract renewal discussions initiated' },
    ],
  },

  {
    id: 'ip-003',
    name: 'International Paper',
    legalName: 'International Paper Company',
    duns: '456789123',
    ticker: 'IP',
    website: 'https://internationalpaper.com',

    category: 'Packaging',
    subcategories: ['Corrugated', 'Containerboard', 'Kraft Paper'],
    commoditiesSupplied: ['corrugated-boxes', 'containerboard', 'kraft-paper'],
    industryCodes: [
      { system: 'NAICS', code: '322211' },
      { system: 'SIC', code: '2631' },
    ],

    headquarters: {
      country: 'USA',
      region: 'North America',
      city: 'Memphis',
      address: '6400 Poplar Avenue, Memphis, TN 38197',
    },
    operatingCountries: ['USA', 'Mexico', 'Brazil', 'Poland', 'Russia', 'Morocco'],

    employeeCount: 38000,
    revenueRange: '$18B - $22B',
    marketCap: 15000000000,
    ownershipType: 'public',
    parentCompany: undefined,

    annualSpend: 18500000,
    spendRank: 3,
    spendPctOfCategory: 42.5,
    criticality: 'important',
    singleSourced: false,

    srs: {
      score: 82,
      level: 'low',
      trend: 'stable',
      lastUpdated: '2025-01-12',
      factors: [
        { name: 'Financial Health', score: 85, weight: 0.2, trend: 'stable' },
        { name: 'Operational Risk', score: 78, weight: 0.15, trend: 'up' },
        { name: 'Cyber Security', score: 75, weight: 0.1, trend: 'stable' },
        { name: 'ESG Performance', score: 88, weight: 0.15, trend: 'up' },
        { name: 'Geopolitical', score: 82, weight: 0.1, trend: 'stable' },
        { name: 'Supply Chain', score: 80, weight: 0.15, trend: 'stable' },
        { name: 'Regulatory', score: 85, weight: 0.1, trend: 'stable' },
        { name: 'Reputation', score: 88, weight: 0.05, trend: 'up' },
      ],
      scoreHistory: generateScoreHistory(82, 'stable'),
    },

    financials: {
      revenue: 19400000000,
      revenueGrowth: 2.8,
      grossMargin: 24.5,
      ebitdaMargin: 15.2,
      netMargin: 8.5,
      debtToEquity: 1.2,
      currentRatio: 1.8,
      quickRatio: 1.2,
      interestCoverage: 8.5,
      daysPayableOutstanding: 42,
      daysSalesOutstanding: 35,
      inventoryTurnover: 9.2,
      altmanZScore: 3.2,
      paymentBehavior: 'early',
      creditLimit: 30000000,
      lastFinancialUpdate: '2024-12-31',
    },

    operations: {
      deliveryOnTime: 96.8,
      deliveryInFull: 98.5,
      qualityDefectRate: 45,
      qualityScore: 96,
      leadTimeStandard: 14,
      leadTimeExpedited: 5,
      capacityUtilization: 88,
      flexibilityScore: 85,
      productionSites: [
        { id: 'site-1', country: 'USA', city: 'Mansfield', capacity: 1200000, headcount: 850, certifications: ['ISO 9001', 'FSC', 'SFI'] },
        { id: 'site-2', country: 'USA', city: 'Prattville', capacity: 950000, headcount: 720, certifications: ['ISO 9001', 'FSC', 'SFI'] },
        { id: 'site-3', country: 'Mexico', city: 'Monterrey', capacity: 650000, headcount: 480, certifications: ['ISO 9001', 'FSC'] },
      ],
      warehouseLocations: ['Memphis', 'Dallas', 'Chicago', 'Los Angeles'],
      transportModes: ['Truck', 'Rail'],
    },

    relationship: {
      yearsAsSupplier: 6,
      tier: 1,
      strategicClassification: 'preferred',
      contractStartDate: '2023-01-01',
      contractEndDate: '2025-12-31',
      contractValue: 55500000,
      paymentTerms: 'Net 30',
      volumeCommitment: 15000,
      volumeActual: 16200,
      priceEscalationClause: true,
      exclusivityAgreement: false,
      jointDevelopmentProjects: 1,
      lastBusinessReview: '2024-12-01',
      relationshipScore: 92,
      accountManager: 'Robert Williams',
    },

    compliance: {
      iso9001: true,
      iso9001Expiry: '2026-02-28',
      iso14001: true,
      iso14001Expiry: '2026-02-28',
      iso45001: false,
      iatf16949: false,
      as9100: false,
      soc2: false,
      soc2Type: 1,
      fdaRegistered: true,
      conflictMineralsFree: true,
      reachCompliant: true,
      rohsCompliant: true,
      customsCertifications: ['C-TPAT'],
      exportLicenses: [],
      lastAuditDate: '2024-11-10',
      lastAuditScore: 95,
      auditFindings: [
        { severity: 'minor', count: 1 },
        { severity: 'major', count: 0 },
        { severity: 'critical', count: 0 },
      ],
      nextAuditDate: '2025-11-10',
    },

    esg: {
      overallScore: 85,
      overallRating: 'A',
      environmentalScore: 88,
      socialScore: 82,
      governanceScore: 85,
      carbonFootprint: 4200000,
      carbonIntensity: 216,
      scope1Emissions: 1800000,
      scope2Emissions: 2400000,
      scope3Emissions: 5500000,
      renewableEnergyPct: 72,
      waterUsage: 850000000,
      wasteRecyclingRate: 94,
      diversityScore: 75,
      womenInLeadership: 30,
      safetyIncidentRate: 0.4,
      ethicsTrainingPct: 99,
      controversies: [],
      sustainabilityGoals: [
        { goal: '30% GHG Reduction by 2030', targetYear: 2030, progress: 55 },
        { goal: '100% Certified Fiber', targetYear: 2025, progress: 88 },
      ],
      lastEsgUpdate: '2024-10-30',
      esgDataProvider: 'EcoVadis',
    },

    alternatives: [
      {
        supplierId: 'westrock-004',
        name: 'WestRock Company',
        matchScore: 92,
        matchReasons: ['Direct competitor', 'Same product range', 'Similar geography'],
        switchingCost: 'low',
        qualificationTime: 8,
        capacityAvailable: true,
        priceCompetitiveness: 'similar',
        qualityComparison: 'similar',
        riskComparison: 'similar',
      },
      {
        supplierId: 'smurfit-005',
        name: 'Smurfit Kappa',
        matchScore: 75,
        matchReasons: ['Same products', 'European strength'],
        switchingCost: 'medium',
        qualificationTime: 12,
        capacityAvailable: true,
        priceCompetitiveness: 'worse',
        qualityComparison: 'better',
        riskComparison: 'lower',
      },
    ],

    contacts: [
      { name: 'Michael Brown', title: 'National Account Manager', email: 'michael.brown@ipaper.com', phone: '+1-901-555-0101', isPrimary: true },
    ],

    recentActivity: [
      { date: '2025-01-18', type: 'delivery', description: 'Weekly shipment delivered - 100% on time' },
      { date: '2025-01-05', type: 'price_change', description: 'Annual price review - 1.5% increase' },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSupplierById(id: string): EnrichedSupplier | undefined {
  return ENRICHED_SUPPLIERS.find(s => s.id === id);
}

export function getSuppliersByCategory(category: string): EnrichedSupplier[] {
  return ENRICHED_SUPPLIERS.filter(s => s.category.toLowerCase() === category.toLowerCase());
}

export function getHighRiskSuppliers(): EnrichedSupplier[] {
  return ENRICHED_SUPPLIERS.filter(s => s.srs.level === 'high' || s.srs.level === 'medium-high');
}

export function getCriticalSuppliers(): EnrichedSupplier[] {
  return ENRICHED_SUPPLIERS.filter(s => s.criticality === 'critical');
}

export function getSingleSourcedSuppliers(): EnrichedSupplier[] {
  return ENRICHED_SUPPLIERS.filter(s => s.singleSourced);
}

export function getSuppliersByRiskTrend(trend: 'improving' | 'stable' | 'worsening'): EnrichedSupplier[] {
  return ENRICHED_SUPPLIERS.filter(s => s.srs.trend === trend);
}

export function getSupplierFinancialSummary(supplier: EnrichedSupplier): string {
  const { financials, srs } = supplier;
  const healthStatus = financials.altmanZScore > 2.9 ? 'healthy' : financials.altmanZScore > 1.8 ? 'moderate' : 'distressed';
  return `${supplier.name} financial health is ${healthStatus} (Altman Z: ${financials.altmanZScore.toFixed(1)}). Revenue ${financials.revenueGrowth > 0 ? 'grew' : 'declined'} ${Math.abs(financials.revenueGrowth).toFixed(1)}% with ${financials.ebitdaMargin.toFixed(1)}% EBITDA margin. Risk score: ${srs.score}/100 (${srs.trend}).`;
}

export function getSupplierESGSummary(supplier: EnrichedSupplier): string {
  const { esg } = supplier;
  return `${supplier.name} ESG rating: ${esg.overallRating} (${esg.overallScore}/100). ${esg.renewableEnergyPct}% renewable energy, ${esg.wasteRecyclingRate}% waste recycling. Carbon intensity: ${esg.carbonIntensity} kg CO2e/$1M revenue.`;
}

// ============================================
// LAZY-LOADED SUPPLIER DETAIL PAYLOAD
// ============================================

/**
 * Lightweight supplier summary for list views
 * Minimal data to render cards without loading full supplier detail
 */
export interface SupplierSummary {
  id: string;
  name: string;
  category: string;
  location: {
    city: string;
    country: string;
  };
  srs: {
    score: number | null;
    level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
    trend: 'improving' | 'worsening' | 'stable';
  };
  spend: number;
  spendFormatted: string;
  criticality: 'critical' | 'important' | 'standard' | 'low';
}

/**
 * Full supplier detail data for artifact views
 * This is the actual supplier data shape (vs SupplierDetailPayload which is the artifact wrapper)
 * Matches the Supplier interface expected by SupplierDetailArtifact
 */
export interface SupplierDetailData {
  id: string;
  name: string;
  duns?: string;
  category: string;
  location: {
    city: string;
    country: string;
  };
  spend: number;
  spendFormatted: string;
  criticality?: 'high' | 'medium' | 'low';
  srs: {
    score: number | null;
    level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
    trend: 'improving' | 'worsening' | 'stable';
    lastUpdated: string;
  };
  riskFactors: {
    name: string;
    weight: number;
    isRestricted: boolean;
    category: 'financial' | 'operational' | 'compliance' | 'external';
  }[];
  events: {
    id: string;
    date: string;
    title: string;
    type: 'news' | 'alert' | 'update';
    summary: string;
  }[];
  history: {
    date: string;
    score: number;
    level: string;
    change?: number;
  }[];

  // Extended fields from enriched data (for enhanced views)
  financials?: {
    revenue: number;
    revenueGrowth: number;
    grossMargin: number;
    ebitdaMargin: number;
    altmanZScore: number;
    paymentBehavior: string;
  };
  esg?: {
    overallScore: number;
    overallRating: string;
    environmentalScore: number;
    socialScore: number;
    governanceScore: number;
  };
  operations?: {
    deliveryOnTime: number;
    deliveryInFull: number;
    qualityScore: number;
    leadTimeStandard: number;
  };
}

/**
 * Get all suppliers as lightweight summaries for list views
 */
export function getSupplierSummaries(): SupplierSummary[] {
  return ENRICHED_SUPPLIERS.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    location: {
      city: s.headquarters.city,
      country: s.headquarters.country,
    },
    srs: {
      score: s.srs.score,
      level: s.srs.level,
      trend: s.srs.trend,
    },
    spend: s.annualSpend,
    spendFormatted: formatSpend(s.annualSpend),
    criticality: s.criticality,
  }));
}

/**
 * Format spend amount for display
 */
function formatSpend(spend: number): string {
  if (spend >= 1000000000) return `$${(spend / 1000000000).toFixed(1)}B`;
  if (spend >= 1000000) return `$${(spend / 1000000).toFixed(1)}M`;
  if (spend >= 1000) return `$${(spend / 1000).toFixed(0)}K`;
  return `$${spend}`;
}

/**
 * Map SRS factor category
 */
function mapFactorCategory(name: string): 'financial' | 'operational' | 'compliance' | 'external' {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('financial') || lowerName.includes('credit')) return 'financial';
  if (lowerName.includes('operational') || lowerName.includes('supply') || lowerName.includes('cyber')) return 'operational';
  if (lowerName.includes('regulatory') || lowerName.includes('compliance') || lowerName.includes('esg')) return 'compliance';
  return 'external'; // Geopolitical, Reputation, etc.
}

/**
 * Map SRS level to history level string
 */
function scoreToLevel(score: number): string {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'medium-high';
  return 'high';
}

/**
 * Convert EnrichedSupplier to SupplierDetailData
 * Used when loading full supplier details for artifact view
 */
export function enrichedSupplierToDetailData(supplier: EnrichedSupplier): SupplierDetailData {
  // Convert risk factors to artifact format
  const riskFactors = supplier.srs.factors.map(f => ({
    name: f.name,
    weight: f.weight,
    isRestricted: false, // No restricted factors in mock data
    category: mapFactorCategory(f.name),
  }));

  // Generate events from recent activity
  const events = supplier.recentActivity.slice(0, 5).map((activity, idx) => ({
    id: `${supplier.id}-event-${idx}`,
    date: activity.date,
    title: activity.description.split(' - ')[0] || activity.description,
    type: activity.type === 'quality_issue' || activity.type === 'audit'
      ? 'alert' as const
      : activity.type === 'price_change' || activity.type === 'contract'
        ? 'update' as const
        : 'news' as const,
    summary: activity.description,
  }));

  // Convert score history to artifact format
  const history = supplier.srs.scoreHistory.map((h, idx, arr) => ({
    date: h.date,
    score: h.score,
    level: scoreToLevel(h.score),
    change: idx > 0 ? h.score - arr[idx - 1].score : undefined,
  }));

  return {
    id: supplier.id,
    name: supplier.name,
    duns: supplier.duns,
    category: supplier.category,
    location: {
      city: supplier.headquarters.city,
      country: supplier.headquarters.country,
    },
    spend: supplier.annualSpend,
    spendFormatted: formatSpend(supplier.annualSpend),
    criticality: supplier.criticality === 'critical' ? 'high'
      : supplier.criticality === 'important' ? 'medium'
      : 'low',
    srs: {
      score: supplier.srs.score,
      level: supplier.srs.level,
      trend: supplier.srs.trend,
      lastUpdated: supplier.srs.lastUpdated,
    },
    riskFactors,
    events,
    history,

    // Extended enriched data
    financials: {
      revenue: supplier.financials.revenue,
      revenueGrowth: supplier.financials.revenueGrowth,
      grossMargin: supplier.financials.grossMargin,
      ebitdaMargin: supplier.financials.ebitdaMargin,
      altmanZScore: supplier.financials.altmanZScore,
      paymentBehavior: supplier.financials.paymentBehavior,
    },
    esg: {
      overallScore: supplier.esg.overallScore,
      overallRating: supplier.esg.overallRating,
      environmentalScore: supplier.esg.environmentalScore,
      socialScore: supplier.esg.socialScore,
      governanceScore: supplier.esg.governanceScore,
    },
    operations: {
      deliveryOnTime: supplier.operations.deliveryOnTime,
      deliveryInFull: supplier.operations.deliveryInFull,
      qualityScore: supplier.operations.qualityScore,
      leadTimeStandard: supplier.operations.leadTimeStandard,
    },
  };
}

/**
 * Lazy load supplier detail by ID
 * Simulates async data fetching with a small delay
 */
export async function loadSupplierDetail(supplierId: string): Promise<SupplierDetailData | null> {
  // Simulate network latency (50-150ms)
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

  const supplier = getSupplierById(supplierId);
  if (!supplier) return null;

  return enrichedSupplierToDetailData(supplier);
}

/**
 * Lazy load supplier detail by name (fuzzy match)
 */
export async function loadSupplierDetailByName(name: string): Promise<SupplierDetailData | null> {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

  const normalizedName = name.toLowerCase();
  const supplier = ENRICHED_SUPPLIERS.find(
    s => s.name.toLowerCase().includes(normalizedName) ||
         s.legalName.toLowerCase().includes(normalizedName)
  );

  if (!supplier) return null;

  return enrichedSupplierToDetailData(supplier);
}
