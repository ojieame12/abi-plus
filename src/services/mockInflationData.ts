// Mock Inflation Data Service
// Provides sample data for the Inflation Watch module

import type {
  CommodityPrice,
  InflationDriver,
  InflationExposure,
  CommodityExposure,
  SupplierExposure,
  PriceJustification,
  InflationScenario,
  PriceChange,
  InflationSummaryCardData,
  DriverBreakdownCardData,
  SpendImpactCardData,
  JustificationCardData,
  ScenarioCardData,
  CommodityGaugeData,
  ExecutiveBriefCardData,
} from '../types/inflation';

// ============================================
// HELPER FUNCTIONS
// ============================================

const generatePriceHistory = (
  basePrice: number,
  months: number,
  volatility: number = 0.05
): Array<{ date: string; price: number }> => {
  const history: Array<{ date: string; price: number }> = [];
  let currentPrice = basePrice * (1 - volatility * months * 0.3);
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const change = (Math.random() - 0.4) * volatility * currentPrice;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.5);
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100,
    });
  }

  return history;
};

const createPriceChange = (current: number, previous: number): PriceChange => {
  const absolute = current - previous;
  const percent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  return {
    absolute: Math.round(absolute * 100) / 100,
    percent: Math.round(percent * 10) / 10,
    direction: percent > 0.5 ? 'up' : percent < -0.5 ? 'down' : 'stable',
  };
};

// ============================================
// MOCK COMMODITIES
// ============================================

export const MOCK_COMMODITIES: CommodityPrice[] = [
  {
    commodityId: 'steel-hrc',
    name: 'Steel (Hot Rolled Coil)',
    category: 'metals',
    currentPrice: 892,
    previousPrice: 845,
    unit: 'mt',
    currency: 'USD',
    market: 'CME Midwest',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(892, 888),
      weekly: createPriceChange(892, 875),
      monthly: createPriceChange(892, 845),
      quarterly: createPriceChange(892, 810),
      yearly: createPriceChange(892, 780),
    },
    forecast: {
      period: '90d',
      low: 850,
      mid: 920,
      high: 980,
      confidence: 72,
      factors: ['Infrastructure spending', 'China export policy', 'Auto production'],
    },
    history: generatePriceHistory(892, 12, 0.08),
  },
  {
    commodityId: 'aluminum-lme',
    name: 'Aluminum',
    category: 'metals',
    currentPrice: 2485,
    previousPrice: 2380,
    unit: 'mt',
    currency: 'USD',
    market: 'LME',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(2485, 2470),
      weekly: createPriceChange(2485, 2425),
      monthly: createPriceChange(2485, 2380),
      quarterly: createPriceChange(2485, 2290),
      yearly: createPriceChange(2485, 2180),
    },
    forecast: {
      period: '90d',
      low: 2350,
      mid: 2550,
      high: 2700,
      confidence: 68,
      factors: ['Energy costs in Europe', 'EV demand', 'Recycling capacity'],
    },
    history: generatePriceHistory(2485, 12, 0.06),
  },
  {
    commodityId: 'copper-comex',
    name: 'Copper',
    category: 'metals',
    currentPrice: 4.28,
    previousPrice: 4.15,
    unit: 'lb',
    currency: 'USD',
    market: 'COMEX',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(4.28, 4.25),
      weekly: createPriceChange(4.28, 4.18),
      monthly: createPriceChange(4.28, 4.15),
      quarterly: createPriceChange(4.28, 3.95),
      yearly: createPriceChange(4.28, 3.72),
    },
    forecast: {
      period: '90d',
      low: 4.10,
      mid: 4.45,
      high: 4.75,
      confidence: 75,
      factors: ['Green energy transition', 'Chile mine output', 'China demand'],
    },
    history: generatePriceHistory(4.28, 12, 0.05),
  },
  {
    commodityId: 'crude-wti',
    name: 'Crude Oil (WTI)',
    category: 'energy',
    currentPrice: 78.5,
    previousPrice: 82.3,
    unit: 'barrel',
    currency: 'USD',
    market: 'NYMEX',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(78.5, 79.2),
      weekly: createPriceChange(78.5, 80.1),
      monthly: createPriceChange(78.5, 82.3),
      quarterly: createPriceChange(78.5, 85.0),
      yearly: createPriceChange(78.5, 75.2),
    },
    forecast: {
      period: '90d',
      low: 72,
      mid: 80,
      high: 92,
      confidence: 62,
      factors: ['OPEC+ production', 'US shale output', 'Global demand'],
    },
    history: generatePriceHistory(78.5, 12, 0.1),
  },
  {
    commodityId: 'nat-gas',
    name: 'Natural Gas',
    category: 'energy',
    currentPrice: 2.85,
    previousPrice: 2.45,
    unit: 'MMBtu',
    currency: 'USD',
    market: 'NYMEX',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(2.85, 2.78),
      weekly: createPriceChange(2.85, 2.62),
      monthly: createPriceChange(2.85, 2.45),
      quarterly: createPriceChange(2.85, 2.20),
      yearly: createPriceChange(2.85, 2.95),
    },
    history: generatePriceHistory(2.85, 12, 0.15),
  },
  {
    commodityId: 'polyethylene',
    name: 'Polyethylene (HDPE)',
    category: 'chemicals',
    currentPrice: 1420,
    previousPrice: 1350,
    unit: 'mt',
    currency: 'USD',
    market: 'ICIS',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(1420, 1415),
      weekly: createPriceChange(1420, 1390),
      monthly: createPriceChange(1420, 1350),
      quarterly: createPriceChange(1420, 1280),
      yearly: createPriceChange(1420, 1250),
    },
    history: generatePriceHistory(1420, 12, 0.07),
  },
  {
    commodityId: 'corrugated',
    name: 'Corrugated Containers',
    category: 'packaging',
    currentPrice: 825,
    previousPrice: 790,
    unit: 'ton',
    currency: 'USD',
    market: 'Fastmarkets RISI',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(825, 822),
      weekly: createPriceChange(825, 810),
      monthly: createPriceChange(825, 790),
      quarterly: createPriceChange(825, 760),
      yearly: createPriceChange(825, 720),
    },
    history: generatePriceHistory(825, 12, 0.05),
  },
  {
    commodityId: 'freight-container',
    name: 'Container Freight (Asia-US)',
    category: 'logistics',
    currentPrice: 2850,
    previousPrice: 2400,
    unit: 'FEU',
    currency: 'USD',
    market: 'Freightos Baltic Index',
    lastUpdated: new Date().toISOString(),
    changes: {
      daily: createPriceChange(2850, 2820),
      weekly: createPriceChange(2850, 2680),
      monthly: createPriceChange(2850, 2400),
      quarterly: createPriceChange(2850, 2100),
      yearly: createPriceChange(2850, 1850),
    },
    history: generatePriceHistory(2850, 12, 0.12),
  },
];

// ============================================
// MOCK DRIVERS
// ============================================

export const MOCK_DRIVERS: Record<string, InflationDriver[]> = {
  'steel-hrc': [
    {
      id: 'steel-driver-1',
      name: 'US Infrastructure Bill Spending',
      category: 'demand',
      impact: 'high',
      direction: 'inflationary',
      contribution: 35,
      description: 'Infrastructure Investment and Jobs Act driving demand for construction steel',
      sources: ['WSJ', 'Steel Market Update'],
      relatedCommodities: ['steel-hrc', 'aluminum-lme'],
    },
    {
      id: 'steel-driver-2',
      name: 'China Export Restrictions',
      category: 'supply',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 25,
      description: 'Reduced Chinese steel exports tightening global supply',
      sources: ['Reuters', 'Platts'],
      relatedCommodities: ['steel-hrc'],
    },
    {
      id: 'steel-driver-3',
      name: 'Energy Cost Increases',
      category: 'supply',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 20,
      description: 'Higher natural gas prices increasing production costs for EAF mills',
      sources: ['American Iron and Steel Institute'],
      relatedCommodities: ['steel-hrc', 'nat-gas'],
    },
    {
      id: 'steel-driver-4',
      name: 'Auto Sector Recovery',
      category: 'demand',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 20,
      description: 'Automotive production recovery increasing flat steel demand',
      sources: ['Automotive News', 'IHS Markit'],
      relatedCommodities: ['steel-hrc', 'aluminum-lme'],
    },
  ],
  'freight-container': [
    {
      id: 'freight-driver-1',
      name: 'Red Sea Disruptions',
      category: 'geopolitical',
      impact: 'high',
      direction: 'inflationary',
      contribution: 45,
      description: 'Houthi attacks forcing rerouting around Cape of Good Hope',
      sources: ['Lloyd\'s List', 'Financial Times'],
      relatedCommodities: ['freight-container'],
    },
    {
      id: 'freight-driver-2',
      name: 'Container Equipment Shortage',
      category: 'supply',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 25,
      description: 'Repositioning delays creating container availability issues',
      sources: ['Container xChange', 'JOC'],
      relatedCommodities: ['freight-container'],
    },
    {
      id: 'freight-driver-3',
      name: 'Peak Season Demand',
      category: 'demand',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 30,
      description: 'Pre-holiday inventory building increasing booking volumes',
      sources: ['Freightos', 'Xeneta'],
      relatedCommodities: ['freight-container'],
    },
  ],
  'aluminum-lme': [
    {
      id: 'alu-driver-1',
      name: 'European Smelter Curtailments',
      category: 'supply',
      impact: 'high',
      direction: 'inflationary',
      contribution: 40,
      description: 'High energy costs forcing European aluminum smelter shutdowns',
      sources: ['Metal Bulletin', 'Reuters'],
    },
    {
      id: 'alu-driver-2',
      name: 'EV Production Growth',
      category: 'demand',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 35,
      description: 'Electric vehicle adoption driving aluminum demand for lightweighting',
      sources: ['CRU', 'Bloomberg NEF'],
    },
    {
      id: 'alu-driver-3',
      name: 'Russian Supply Concerns',
      category: 'geopolitical',
      impact: 'medium',
      direction: 'inflationary',
      contribution: 25,
      description: 'Ongoing sanctions uncertainty affecting Russian aluminum trade',
      sources: ['LME', 'Financial Times'],
    },
  ],
};

// ============================================
// MOCK PORTFOLIO EXPOSURE
// ============================================

export const MOCK_PORTFOLIO_EXPOSURE: InflationExposure = {
  totalExposure: 45200000,
  totalExposureFormatted: '$45.2M',
  impactAmount: 3850000,
  impactAmountFormatted: '$3.85M',
  impactPercent: 8.5,
  byCommodity: [
    {
      commodityId: 'steel-hrc',
      commodityName: 'Steel (Hot Rolled Coil)',
      category: 'metals',
      exposure: 18500000,
      exposureFormatted: '$18.5M',
      priceChange: createPriceChange(892, 845),
      supplierCount: 12,
      topSuppliers: ['ArcelorMittal', 'Nucor', 'US Steel'],
    },
    {
      commodityId: 'aluminum-lme',
      commodityName: 'Aluminum',
      category: 'metals',
      exposure: 8200000,
      exposureFormatted: '$8.2M',
      priceChange: createPriceChange(2485, 2380),
      supplierCount: 8,
      topSuppliers: ['Novelis', 'Alcoa', 'Constellium'],
    },
    {
      commodityId: 'freight-container',
      commodityName: 'Container Freight',
      category: 'logistics',
      exposure: 6800000,
      exposureFormatted: '$6.8M',
      priceChange: createPriceChange(2850, 2400),
      supplierCount: 5,
      topSuppliers: ['Maersk', 'MSC', 'CMA CGM'],
    },
    {
      commodityId: 'polyethylene',
      commodityName: 'Polyethylene',
      category: 'chemicals',
      exposure: 5400000,
      exposureFormatted: '$5.4M',
      priceChange: createPriceChange(1420, 1350),
      supplierCount: 6,
      topSuppliers: ['Dow', 'LyondellBasell', 'ExxonMobil'],
    },
    {
      commodityId: 'corrugated',
      commodityName: 'Corrugated Packaging',
      category: 'packaging',
      exposure: 3200000,
      exposureFormatted: '$3.2M',
      priceChange: createPriceChange(825, 790),
      supplierCount: 4,
      topSuppliers: ['WestRock', 'International Paper', 'Packaging Corp'],
    },
    {
      commodityId: 'copper-comex',
      commodityName: 'Copper',
      category: 'metals',
      exposure: 3100000,
      exposureFormatted: '$3.1M',
      priceChange: createPriceChange(4.28, 4.15),
      supplierCount: 5,
      topSuppliers: ['Freeport-McMoRan', 'Southern Copper', 'Glencore'],
    },
  ],
  byCategory: [
    {
      category: 'Metals',
      exposure: 29800000,
      exposureFormatted: '$29.8M',
      percentOfTotal: 66,
      commodities: ['Steel', 'Aluminum', 'Copper'],
      avgPriceChange: 6.2,
      riskLevel: 'high',
    },
    {
      category: 'Logistics',
      exposure: 6800000,
      exposureFormatted: '$6.8M',
      percentOfTotal: 15,
      commodities: ['Container Freight'],
      avgPriceChange: 18.8,
      riskLevel: 'high',
    },
    {
      category: 'Chemicals',
      exposure: 5400000,
      exposureFormatted: '$5.4M',
      percentOfTotal: 12,
      commodities: ['Polyethylene'],
      avgPriceChange: 5.2,
      riskLevel: 'medium',
    },
    {
      category: 'Packaging',
      exposure: 3200000,
      exposureFormatted: '$3.2M',
      percentOfTotal: 7,
      commodities: ['Corrugated'],
      avgPriceChange: 4.4,
      riskLevel: 'low',
    },
  ],
  bySupplier: [
    {
      supplierId: 'sup-001',
      supplierName: 'ArcelorMittal',
      exposure: 8500000,
      exposureFormatted: '$8.5M',
      commodities: ['Steel'],
      priceImpact: 476000,
      priceImpactFormatted: '$476K',
      riskScore: 62,
      justificationStatus: 'pending',
    },
    {
      supplierId: 'sup-002',
      supplierName: 'Maersk',
      exposure: 4200000,
      exposureFormatted: '$4.2M',
      commodities: ['Container Freight'],
      priceImpact: 787500,
      priceImpactFormatted: '$788K',
      riskScore: 45,
      justificationStatus: 'validated',
    },
    {
      supplierId: 'sup-003',
      supplierName: 'Novelis',
      exposure: 3800000,
      exposureFormatted: '$3.8M',
      commodities: ['Aluminum'],
      priceImpact: 167200,
      priceImpactFormatted: '$167K',
      riskScore: 38,
      justificationStatus: 'pending',
    },
    {
      supplierId: 'sup-004',
      supplierName: 'Nucor',
      exposure: 5200000,
      exposureFormatted: '$5.2M',
      commodities: ['Steel'],
      priceImpact: 291200,
      priceImpactFormatted: '$291K',
      riskScore: 42,
    },
    {
      supplierId: 'sup-005',
      supplierName: 'Dow Chemical',
      exposure: 3200000,
      exposureFormatted: '$3.2M',
      commodities: ['Polyethylene'],
      priceImpact: 166400,
      priceImpactFormatted: '$166K',
      riskScore: 35,
    },
  ],
  byRiskLevel: [
    {
      riskLevel: 'high',
      exposure: 12500000,
      exposureFormatted: '$12.5M',
      percentOfTotal: 28,
      supplierCount: 8,
      avgPriceImpact: 9.2,
    },
    {
      riskLevel: 'medium-high',
      exposure: 15200000,
      exposureFormatted: '$15.2M',
      percentOfTotal: 34,
      supplierCount: 12,
      avgPriceImpact: 7.5,
    },
    {
      riskLevel: 'medium',
      exposure: 10800000,
      exposureFormatted: '$10.8M',
      percentOfTotal: 24,
      supplierCount: 15,
      avgPriceImpact: 5.8,
    },
    {
      riskLevel: 'low',
      exposure: 6700000,
      exposureFormatted: '$6.7M',
      percentOfTotal: 14,
      supplierCount: 10,
      avgPriceImpact: 3.2,
    },
  ],
};

// ============================================
// MOCK JUSTIFICATIONS
// ============================================

export const MOCK_JUSTIFICATIONS: Record<string, PriceJustification> = {
  'arcelor-steel': {
    supplierId: 'sup-001',
    supplierName: 'ArcelorMittal',
    commodity: 'Steel (Hot Rolled Coil)',
    requestedIncrease: 8.5,
    marketIncrease: 5.6,
    variance: 2.9,
    verdict: 'partially_justified',
    marketComparison: {
      supplierPrice: 892,
      marketAvg: 875,
      marketLow: 845,
      marketHigh: 920,
      percentile: 68,
    },
    factors: [
      { name: 'Raw Material (Iron Ore)', claimed: 12, market: 8, delta: 4, verdict: 'disputes' },
      { name: 'Energy Costs', claimed: 15, market: 18, delta: -3, verdict: 'supports' },
      { name: 'Labor Costs', claimed: 5, market: 4, delta: 1, verdict: 'neutral' },
      { name: 'Transportation', claimed: 8, market: 6, delta: 2, verdict: 'disputes' },
    ],
    recommendation: 'Counter at 6.5% increase based on market benchmarks. Energy cost claims are valid but raw material increase exceeds market data.',
    negotiationPoints: [
      'Market average increase is 5.6% - their request is 52% above market',
      'Iron ore prices have only risen 8% vs their claimed 12%',
      'Consider volume commitment for better pricing',
      'Request cost breakdown documentation',
    ],
    supportingData: [
      { type: 'index', title: 'CME HRC Futures', value: '+5.2% MoM', source: 'CME Group', date: '2024-01-15' },
      { type: 'news', title: 'Steel prices stabilize as demand softens', source: 'Metal Bulletin', date: '2024-01-12' },
      { type: 'history', title: 'Last increase was 6 months ago at 4.2%', source: 'Contract History', date: '2023-07-01' },
    ],
  },
  'maersk-freight': {
    supplierId: 'sup-002',
    supplierName: 'Maersk',
    commodity: 'Container Freight (Asia-US West Coast)',
    requestedIncrease: 18.5,
    marketIncrease: 18.8,
    variance: -0.3,
    verdict: 'justified',
    marketComparison: {
      supplierPrice: 2850,
      marketAvg: 2880,
      marketLow: 2650,
      marketHigh: 3200,
      percentile: 45,
    },
    factors: [
      { name: 'Fuel Surcharge', claimed: 8, market: 9, delta: -1, verdict: 'supports' },
      { name: 'Route Diversion (Red Sea)', claimed: 25, market: 28, delta: -3, verdict: 'supports' },
      { name: 'Equipment Costs', claimed: 5, market: 4, delta: 1, verdict: 'neutral' },
    ],
    recommendation: 'Accept the increase. Pricing is below market average and reflects genuine cost pressures from Red Sea disruptions.',
    negotiationPoints: [
      'Current pricing is 1% below market average',
      'Red Sea diversions adding 10-14 days to transit',
      'Lock in rates now before further increases',
      'Consider longer contract term for rate protection',
    ],
    supportingData: [
      { type: 'index', title: 'Freightos Baltic Index', value: '+22% MoM', source: 'Freightos', date: '2024-01-15' },
      { type: 'news', title: 'Carriers announce GRIs for February', source: 'JOC', date: '2024-01-14' },
    ],
  },
};

// ============================================
// MOCK SCENARIOS
// ============================================

export const MOCK_SCENARIOS: InflationScenario[] = [
  {
    id: 'scenario-1',
    name: 'Steel +15% Scenario',
    description: 'Model impact of continued steel price increases',
    type: 'price_increase',
    assumptions: [
      { factor: 'Steel HRC Price', currentValue: 892, projectedValue: 1026, changePercent: 15, confidence: 'medium' },
    ],
    results: {
      baselineSpend: 18500000,
      projectedSpend: 21275000,
      delta: 2775000,
      deltaFormatted: '$2.78M',
      deltaPercent: 15,
      impactByCategory: [
        { category: 'Automotive Parts', baseline: 8500000, projected: 9775000, delta: 1275000 },
        { category: 'Industrial Equipment', baseline: 6200000, projected: 7130000, delta: 930000 },
        { category: 'Construction', baseline: 3800000, projected: 4370000, delta: 570000 },
      ],
      impactBySupplier: [
        { supplierId: 'sup-001', supplierName: 'ArcelorMittal', baseline: 8500000, projected: 9775000, delta: 1275000 },
        { supplierId: 'sup-004', supplierName: 'Nucor', baseline: 5200000, projected: 5980000, delta: 780000 },
      ],
      recommendations: [
        'Accelerate hedging program for Q2 steel requirements',
        'Evaluate alternative suppliers in Mexico and Brazil',
        'Consider inventory build at current prices',
      ],
      risks: [
        'Auto sector demand could push prices higher',
        'Trade policy changes may impact imports',
      ],
      opportunities: [
        'Lock in long-term contracts at current levels',
        'Negotiate volume discounts with consolidated ordering',
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'scenario-2',
    name: 'Freight Normalization',
    description: 'Model impact if freight rates return to pre-disruption levels',
    type: 'price_increase',
    assumptions: [
      { factor: 'Container Freight Rate', currentValue: 2850, projectedValue: 1800, changePercent: -37, confidence: 'low' },
    ],
    results: {
      baselineSpend: 6800000,
      projectedSpend: 4284000,
      delta: -2516000,
      deltaFormatted: '-$2.52M',
      deltaPercent: -37,
      impactByCategory: [
        { category: 'Inbound Logistics', baseline: 4500000, projected: 2835000, delta: -1665000 },
        { category: 'Outbound Logistics', baseline: 2300000, projected: 1449000, delta: -851000 },
      ],
      impactBySupplier: [
        { supplierId: 'sup-002', supplierName: 'Maersk', baseline: 4200000, projected: 2646000, delta: -1554000 },
      ],
      recommendations: [
        'Maintain current contract rates - don\'t lock in at peak',
        'Monitor Red Sea situation closely',
        'Build flexibility into contracts for rate adjustments',
      ],
      risks: [
        'Red Sea disruptions may persist longer than expected',
        'Carrier consolidation limiting competition',
      ],
      opportunities: [
        'Potential $2.5M savings if rates normalize by Q3',
        'Negotiate rate adjustment clauses in contracts',
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// WIDGET DATA BUILDERS
// ============================================

export const buildInflationSummaryCard = (): InflationSummaryCardData => {
  const topIncreases = MOCK_COMMODITIES
    .filter(c => c.changes.monthly.direction === 'up')
    .sort((a, b) => b.changes.monthly.percent - a.changes.monthly.percent)
    .slice(0, 3)
    .map(c => ({
      commodity: c.name,
      change: c.changes.monthly.percent,
      impact: `$${Math.round((MOCK_PORTFOLIO_EXPOSURE.byCommodity.find(e => e.commodityId === c.commodityId)?.exposure || 0) * c.changes.monthly.percent / 100 / 1000)}K impact`,
    }));

  const topDecreases = MOCK_COMMODITIES
    .filter(c => c.changes.monthly.direction === 'down')
    .sort((a, b) => a.changes.monthly.percent - b.changes.monthly.percent)
    .slice(0, 2)
    .map(c => ({
      commodity: c.name,
      change: c.changes.monthly.percent,
      benefit: `$${Math.abs(Math.round((MOCK_PORTFOLIO_EXPOSURE.byCommodity.find(e => e.commodityId === c.commodityId)?.exposure || 0) * c.changes.monthly.percent / 100 / 1000))}K savings`,
    }));

  return {
    period: 'January 2024',
    headline: 'Logistics costs surge on Red Sea disruptions; metals continue upward trend',
    overallChange: {
      absolute: 3850000,
      percent: 8.5,
      direction: 'up',
    },
    topIncreases,
    topDecreases: topDecreases.length > 0 ? topDecreases : [
      { commodity: 'Crude Oil (WTI)', change: -4.6, benefit: '$85K savings' },
    ],
    portfolioImpact: {
      amount: '$3.85M',
      percent: 8.5,
      direction: 'increase',
    },
    keyDrivers: [
      'Red Sea shipping disruptions',
      'US infrastructure spending',
      'European energy costs',
    ],
    lastUpdated: new Date().toISOString(),
  };
};

export const buildDriverBreakdownCard = (commodityId: string): DriverBreakdownCardData | null => {
  const commodity = MOCK_COMMODITIES.find(c => c.commodityId === commodityId);
  const drivers = MOCK_DRIVERS[commodityId];

  if (!commodity || !drivers) return null;

  return {
    commodity: commodity.name,
    priceChange: commodity.changes.monthly,
    period: 'Last 30 days',
    drivers: drivers.map(d => ({
      name: d.name,
      category: d.category,
      contribution: d.contribution,
      direction: d.direction === 'inflationary' ? 'up' : 'down',
      description: d.description,
    })),
    marketContext: `${commodity.name} prices have ${commodity.changes.monthly.direction === 'up' ? 'increased' : 'decreased'} ${Math.abs(commodity.changes.monthly.percent)}% over the past month, driven primarily by ${drivers[0]?.name.toLowerCase()}.`,
    sources: drivers.flatMap(d => d.sources?.map(s => ({ title: d.name, source: s })) || []).slice(0, 3),
  };
};

export const buildSpendImpactCard = (): SpendImpactCardData => {
  return {
    totalImpact: MOCK_PORTFOLIO_EXPOSURE.impactAmountFormatted,
    totalImpactDirection: 'increase',
    impactPercent: MOCK_PORTFOLIO_EXPOSURE.impactPercent,
    timeframe: 'vs. last month',
    breakdown: MOCK_PORTFOLIO_EXPOSURE.byCategory.map(cat => ({
      category: cat.category,
      amount: `$${Math.round(cat.exposure * cat.avgPriceChange / 100 / 1000)}K`,
      percent: cat.avgPriceChange,
      direction: cat.avgPriceChange > 0 ? 'up' as const : 'down' as const,
    })),
    mostAffected: {
      type: 'category',
      name: 'Logistics',
      impact: '$1.28M (+18.8%)',
    },
    recommendation: 'Consider accelerating freight contract negotiations before further rate increases.',
  };
};

export const buildJustificationCard = (supplierId: string): JustificationCardData | null => {
  const justification = Object.values(MOCK_JUSTIFICATIONS).find(j => j.supplierId === supplierId);
  if (!justification) return null;

  const verdictLabels: Record<string, string> = {
    justified: 'Increase Justified',
    partially_justified: 'Partially Justified',
    questionable: 'Questionable',
    insufficient_data: 'Insufficient Data',
  };

  return {
    supplierName: justification.supplierName,
    commodity: justification.commodity,
    requestedIncrease: justification.requestedIncrease,
    marketBenchmark: justification.marketIncrease,
    verdict: justification.verdict,
    verdictLabel: verdictLabels[justification.verdict],
    keyPoints: justification.factors.map(f => ({
      point: `${f.name}: ${f.claimed}% claimed vs ${f.market}% market`,
      supports: f.verdict === 'supports',
    })),
    recommendation: justification.recommendation,
    negotiationLeverage: justification.verdict === 'justified' ? 'weak' : justification.verdict === 'questionable' ? 'strong' : 'moderate',
  };
};

export const buildScenarioCard = (scenarioId: string): ScenarioCardData | null => {
  const scenario = MOCK_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return null;

  const assumption = scenario.assumptions[0];

  return {
    scenarioName: scenario.name,
    description: scenario.description,
    assumption: `${assumption.factor} ${assumption.changePercent > 0 ? 'increases' : 'decreases'} ${Math.abs(assumption.changePercent)}%`,
    currentState: {
      label: 'Current Spend',
      value: `$${(scenario.results.baselineSpend / 1000000).toFixed(1)}M`,
    },
    projectedState: {
      label: 'Projected Spend',
      value: `$${(scenario.results.projectedSpend / 1000000).toFixed(1)}M`,
    },
    delta: {
      amount: scenario.results.deltaFormatted,
      percent: scenario.results.deltaPercent,
      direction: scenario.results.delta > 0 ? 'up' : 'down',
    },
    confidence: assumption.confidence,
    topImpacts: scenario.results.impactByCategory.slice(0, 3).map(c => `${c.category}: $${(Math.abs(c.delta) / 1000000).toFixed(2)}M`),
    recommendation: scenario.results.recommendations[0],
  };
};

export const buildCommodityGauge = (commodityId: string): CommodityGaugeData | null => {
  const commodity = MOCK_COMMODITIES.find(c => c.commodityId === commodityId);
  if (!commodity) return null;

  const history = commodity.history;
  const minPrice = Math.min(...history.map(h => h.price)) * 0.9;
  const maxPrice = Math.max(...history.map(h => h.price)) * 1.1;
  const position = ((commodity.currentPrice - minPrice) / (maxPrice - minPrice)) * 100;

  const exposure = MOCK_PORTFOLIO_EXPOSURE.byCommodity.find(e => e.commodityId === commodityId);

  return {
    commodity: commodity.name,
    category: commodity.category,
    currentPrice: commodity.currentPrice,
    unit: commodity.unit,
    currency: commodity.currency,
    market: commodity.market,
    lastUpdated: commodity.lastUpdated,
    gauge: {
      min: Math.round(minPrice),
      max: Math.round(maxPrice),
      position: Math.round(position),
      zones: [
        { start: 0, end: 33, color: '#22c55e', label: 'Low' },
        { start: 33, end: 66, color: '#f59e0b', label: 'Normal' },
        { start: 66, end: 100, color: '#ef4444', label: 'High' },
      ],
    },
    changes: {
      daily: commodity.changes.daily,
      monthly: commodity.changes.monthly,
      yearly: commodity.changes.yearly,
    },
    portfolioExposure: exposure ? {
      amount: exposure.exposureFormatted,
      supplierCount: exposure.supplierCount,
    } : undefined,
    trend: commodity.changes.monthly.percent > 2 ? 'bullish' : commodity.changes.monthly.percent < -2 ? 'bearish' : 'stable',
  };
};

export const buildExecutiveBriefCard = (): ExecutiveBriefCardData => {
  return {
    title: 'Monthly Inflation Brief',
    period: 'January 2024',
    summary: 'Portfolio costs increased 8.5% ($3.85M) this month, primarily driven by logistics disruptions in the Red Sea and continued metals price pressure. Immediate action recommended on freight contracts.',
    keyMetrics: [
      {
        label: 'Total Impact',
        value: '$3.85M',
        change: { absolute: 3850000, percent: 8.5, direction: 'up' },
        status: 'negative',
      },
      {
        label: 'Commodities Up',
        value: '6 of 8',
        status: 'negative',
      },
      {
        label: 'Pending Justifications',
        value: '3',
        status: 'neutral',
      },
      {
        label: 'Top Driver',
        value: 'Freight +18.8%',
        status: 'negative',
      },
    ],
    highlights: [
      { type: 'concern', text: 'Red Sea disruptions adding $1.28M to logistics costs' },
      { type: 'concern', text: 'Steel prices up 5.6% with infrastructure demand' },
      { type: 'opportunity', text: 'Oil prices down 4.6% - potential energy savings' },
      { type: 'action', text: 'Review 3 pending supplier price increase requests' },
    ],
    outlook: 'Freight volatility expected to continue through Q1. Steel prices likely to remain elevated due to infrastructure spending. Recommend accelerating hedging and contract negotiations.',
  };
};

// ============================================
// DATA FETCHER FUNCTIONS
// ============================================

export const getInflationSummary = () => buildInflationSummaryCard();
export const getCommodities = () => MOCK_COMMODITIES;
export const getCommodityById = (id: string) => MOCK_COMMODITIES.find(c => c.commodityId === id);
export const getCommodityDrivers = (id: string) => MOCK_DRIVERS[id] || [];
export const getPortfolioExposure = () => MOCK_PORTFOLIO_EXPOSURE;
export const getJustification = (supplierId: string) => MOCK_JUSTIFICATIONS[supplierId] || Object.values(MOCK_JUSTIFICATIONS).find(j => j.supplierId === supplierId);
export const getScenarios = () => MOCK_SCENARIOS;
export const getScenarioById = (id: string) => MOCK_SCENARIOS.find(s => s.id === id);
