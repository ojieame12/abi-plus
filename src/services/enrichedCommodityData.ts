// Enriched Commodity Data
// Comprehensive market intelligence for procurement decisions

import type { EnrichedCommodity, PricePoint, ForwardPrice } from '../types/enrichedData';
import { createSeededRandom, SEEDS, REFERENCE_DATE } from '../utils/seededRandom';

// ============================================
// HELPER: Generate Historical Prices (Deterministic)
// ============================================

function generateHistoricalPrices(
  basePrice: number,
  volatility: number,
  weeks: number = 52
): PricePoint[] {
  // Seed based on base price for unique but deterministic series per commodity
  const random = createSeededRandom(SEEDS.COMMODITIES + Math.round(basePrice));
  const prices: PricePoint[] = [];
  let price = basePrice * (1 - volatility * 0.3); // Start lower

  for (let i = weeks; i >= 0; i--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - i * 7);

    // Seeded random walk with trend
    const change = (random() - 0.45) * volatility * basePrice * 0.02;
    price = Math.max(price * 0.7, Math.min(price * 1.3, price + change));

    prices.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.round(10000 + random() * 50000),
    });
  }

  return prices;
}

function generateForwardCurve(
  spotPrice: number,
  contango: number = 0.02 // 2% annual contango
): ForwardPrice[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Use fixed reference month for consistency (January)
  const referenceMonth = REFERENCE_DATE.getMonth();

  return Array.from({ length: 12 }, (_, i) => {
    const monthIndex = (referenceMonth + i + 1) % 12;
    const monthsOut = i + 1;
    const forwardPremium = spotPrice * (contango * monthsOut / 12);

    return {
      month: months[monthIndex],
      price: Math.round((spotPrice + forwardPremium) * 100) / 100,
      confidence: Math.max(0.5, 0.95 - i * 0.04),
    };
  });
}

// ============================================
// ENRICHED COMMODITIES
// ============================================

export const ENRICHED_COMMODITIES: EnrichedCommodity[] = [
  // ==========================================
  // METALS
  // ==========================================
  {
    id: 'aluminum',
    name: 'Aluminum',
    slug: 'aluminum',
    category: 'metals',
    subcategory: 'non-ferrous',

    currentPrice: 2380,
    currency: 'USD',
    unit: 'MT',
    priceChange: {
      daily: 0.8,
      weekly: 2.3,
      monthly: 5.1,
      ytd: 8.7,
    },

    marketStructure: {
      topProducers: [
        { name: 'China Hongqiao', country: 'China', marketShare: 12.5, productionCapacity: 8000000, isStateOwned: false },
        { name: 'Rusal', country: 'Russia', marketShare: 5.8, productionCapacity: 3800000, isStateOwned: false },
        { name: 'Alcoa', country: 'USA', marketShare: 4.2, productionCapacity: 2500000, isStateOwned: false },
        { name: 'Rio Tinto', country: 'Australia', marketShare: 3.9, productionCapacity: 3200000, isStateOwned: false },
        { name: 'Hindalco', country: 'India', marketShare: 3.1, productionCapacity: 1300000, isStateOwned: false },
      ],
      supplyConcentration: 'medium',
      herfindahlIndex: 850,
      demandDrivers: [
        'Electric vehicle production growth',
        'Packaging industry demand',
        'Construction sector activity',
        'Aerospace manufacturing',
        'Green energy infrastructure',
      ],
      substitutes: [
        { name: 'Steel', substitutionScore: 0.6 },
        { name: 'Copper', substitutionScore: 0.3 },
        { name: 'Plastics', substitutionScore: 0.4 },
        { name: 'Magnesium', substitutionScore: 0.2 },
      ],
      tradeFlows: [
        { from: 'China', to: 'Europe', volumePct: 18 },
        { from: 'Russia', to: 'Europe', volumePct: 12 },
        { from: 'Middle East', to: 'Asia', volumePct: 15 },
        { from: 'Canada', to: 'USA', volumePct: 22 },
      ],
    },

    pricing: {
      spotPrice: 2380,
      forwardCurve: generateForwardCurve(2380, 0.018),
      historicalPrices: generateHistoricalPrices(2380, 0.15),
      volatility30d: 12.5,
      volatility90d: 18.2,
      priceFloor: 2100,
      priceCeiling: 2800,
      regionalPrices: {
        'North America': 2420,
        'Europe': 2450,
        'Asia': 2350,
        'Middle East': 2320,
        'South America': 2480,
      },
      benchmarkIndex: 'LME Aluminum',
    },

    fundamentals: {
      globalProduction: 69000000,
      globalConsumption: 67500000,
      productionGrowthRate: 3.2,
      consumptionGrowthRate: 4.1,
      stockpileLevels: 4200000,
      daysOfSupply: 23,
      utilizationRate: 82,
      capacityAdditions: [
        { year: 2025, volume: 2500000, region: 'China' },
        { year: 2025, volume: 800000, region: 'India' },
        { year: 2026, volume: 1200000, region: 'Middle East' },
      ],
      sentiment: 'bullish',
      sentimentScore: 35,
    },

    risks: {
      supplyDisruptionRisk: 'medium',
      supplyRiskScore: 55,
      geopoliticalExposure: 62,
      topRiskCountries: ['Russia', 'China', 'Guinea'],
      environmentalRegulationRisk: 'high',
      currencyExposure: ['CNY', 'RUB', 'AUD'],
      weatherSensitivity: 'low',
      laborRisk: 'medium',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'Sarah Chen',
      reportCount: 24,
      lastReportDate: '2025-01-15',
      priceIndexAvailable: true,
      costModelAvailable: true,
    },
  },

  {
    id: 'steel-hrc',
    name: 'Steel (Hot-Rolled Coil)',
    slug: 'steel-hrc',
    category: 'metals',
    subcategory: 'ferrous',

    currentPrice: 680,
    currency: 'USD',
    unit: 'MT',
    priceChange: {
      daily: -0.3,
      weekly: 1.2,
      monthly: -2.4,
      ytd: -5.8,
    },

    marketStructure: {
      topProducers: [
        { name: 'China Baowu', country: 'China', marketShare: 7.2, productionCapacity: 150000000, isStateOwned: true },
        { name: 'ArcelorMittal', country: 'Luxembourg', marketShare: 4.8, productionCapacity: 85000000, isStateOwned: false },
        { name: 'Nippon Steel', country: 'Japan', marketShare: 2.9, productionCapacity: 50000000, isStateOwned: false },
        { name: 'POSCO', country: 'South Korea', marketShare: 2.4, productionCapacity: 42000000, isStateOwned: false },
        { name: 'Nucor', country: 'USA', marketShare: 1.8, productionCapacity: 27000000, isStateOwned: false },
      ],
      supplyConcentration: 'low',
      herfindahlIndex: 420,
      demandDrivers: [
        'Automotive production',
        'Construction activity',
        'Infrastructure spending',
        'Appliance manufacturing',
        'Energy sector capex',
      ],
      substitutes: [
        { name: 'Aluminum', substitutionScore: 0.4 },
        { name: 'Carbon Fiber', substitutionScore: 0.15 },
        { name: 'Plastics', substitutionScore: 0.25 },
      ],
      tradeFlows: [
        { from: 'China', to: 'Southeast Asia', volumePct: 25 },
        { from: 'Japan', to: 'USA', volumePct: 8 },
        { from: 'Europe', to: 'Africa', volumePct: 12 },
        { from: 'Russia', to: 'Turkey', volumePct: 10 },
      ],
    },

    pricing: {
      spotPrice: 680,
      forwardCurve: generateForwardCurve(680, -0.01), // Backwardation
      historicalPrices: generateHistoricalPrices(680, 0.20),
      volatility30d: 18.5,
      volatility90d: 25.3,
      priceFloor: 520,
      priceCeiling: 950,
      regionalPrices: {
        'North America': 750,
        'Europe': 720,
        'Asia': 650,
        'Middle East': 680,
        'South America': 710,
      },
      benchmarkIndex: 'CRU Steel Price Index',
    },

    fundamentals: {
      globalProduction: 1900000000,
      globalConsumption: 1850000000,
      productionGrowthRate: 1.5,
      consumptionGrowthRate: 2.0,
      stockpileLevels: 85000000,
      daysOfSupply: 17,
      utilizationRate: 75,
      capacityAdditions: [
        { year: 2025, volume: 35000000, region: 'India' },
        { year: 2025, volume: 15000000, region: 'Southeast Asia' },
        { year: 2026, volume: 20000000, region: 'Middle East' },
      ],
      sentiment: 'neutral',
      sentimentScore: -5,
    },

    risks: {
      supplyDisruptionRisk: 'low',
      supplyRiskScore: 35,
      geopoliticalExposure: 48,
      topRiskCountries: ['China', 'Russia', 'Ukraine'],
      environmentalRegulationRisk: 'high',
      currencyExposure: ['CNY', 'EUR', 'JPY'],
      weatherSensitivity: 'low',
      laborRisk: 'medium',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'Michael Rodriguez',
      reportCount: 36,
      lastReportDate: '2025-01-20',
      priceIndexAvailable: true,
      costModelAvailable: true,
    },
  },

  {
    id: 'copper',
    name: 'Copper',
    slug: 'copper',
    category: 'metals',
    subcategory: 'non-ferrous',

    currentPrice: 8950,
    currency: 'USD',
    unit: 'MT',
    priceChange: {
      daily: 1.2,
      weekly: 3.5,
      monthly: 7.8,
      ytd: 12.4,
    },

    marketStructure: {
      topProducers: [
        { name: 'Codelco', country: 'Chile', marketShare: 8.5, productionCapacity: 1800000, isStateOwned: true },
        { name: 'Freeport-McMoRan', country: 'USA', marketShare: 6.2, productionCapacity: 1500000, isStateOwned: false },
        { name: 'BHP', country: 'Australia', marketShare: 5.8, productionCapacity: 1700000, isStateOwned: false },
        { name: 'Glencore', country: 'Switzerland', marketShare: 5.1, productionCapacity: 1200000, isStateOwned: false },
        { name: 'Southern Copper', country: 'Mexico', marketShare: 4.5, productionCapacity: 1000000, isStateOwned: false },
      ],
      supplyConcentration: 'medium',
      herfindahlIndex: 680,
      demandDrivers: [
        'Electric vehicle batteries and wiring',
        'Renewable energy infrastructure',
        'Power grid modernization',
        'Construction and plumbing',
        '5G network deployment',
      ],
      substitutes: [
        { name: 'Aluminum', substitutionScore: 0.5 },
        { name: 'Fiber Optics', substitutionScore: 0.2 },
      ],
      tradeFlows: [
        { from: 'Chile', to: 'China', volumePct: 35 },
        { from: 'Peru', to: 'China', volumePct: 18 },
        { from: 'Australia', to: 'Japan', volumePct: 12 },
        { from: 'Zambia', to: 'Europe', volumePct: 8 },
      ],
    },

    pricing: {
      spotPrice: 8950,
      forwardCurve: generateForwardCurve(8950, 0.025),
      historicalPrices: generateHistoricalPrices(8950, 0.18),
      volatility30d: 15.8,
      volatility90d: 22.1,
      priceFloor: 7500,
      priceCeiling: 11000,
      regionalPrices: {
        'North America': 9100,
        'Europe': 9050,
        'Asia': 8900,
        'South America': 8800,
      },
      benchmarkIndex: 'LME Copper',
    },

    fundamentals: {
      globalProduction: 22000000,
      globalConsumption: 25000000,
      productionGrowthRate: 2.1,
      consumptionGrowthRate: 4.5,
      stockpileLevels: 680000,
      daysOfSupply: 10,
      utilizationRate: 88,
      capacityAdditions: [
        { year: 2025, volume: 400000, region: 'Chile' },
        { year: 2026, volume: 350000, region: 'Congo' },
        { year: 2027, volume: 500000, region: 'Peru' },
      ],
      sentiment: 'bullish',
      sentimentScore: 55,
    },

    risks: {
      supplyDisruptionRisk: 'high',
      supplyRiskScore: 72,
      geopoliticalExposure: 58,
      topRiskCountries: ['Chile', 'Peru', 'Congo'],
      environmentalRegulationRisk: 'high',
      currencyExposure: ['CLP', 'PEN', 'AUD'],
      weatherSensitivity: 'medium',
      laborRisk: 'high',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'James Wilson',
      reportCount: 28,
      lastReportDate: '2025-01-18',
      priceIndexAvailable: true,
      costModelAvailable: true,
    },
  },

  // ==========================================
  // PACKAGING
  // ==========================================
  {
    id: 'corrugated-boxes',
    name: 'Corrugated Boxes',
    slug: 'corrugated-boxes',
    category: 'packaging',
    subcategory: 'paper-based',

    currentPrice: 850,
    currency: 'USD',
    unit: 'MSF', // per 1000 sq ft
    priceChange: {
      daily: 0.2,
      weekly: -0.5,
      monthly: 1.8,
      ytd: 3.2,
    },

    marketStructure: {
      topProducers: [
        { name: 'International Paper', country: 'USA', marketShare: 12.5, productionCapacity: 15000000, isStateOwned: false },
        { name: 'WestRock', country: 'USA', marketShare: 10.8, productionCapacity: 13500000, isStateOwned: false },
        { name: 'Smurfit Kappa', country: 'Ireland', marketShare: 8.2, productionCapacity: 10000000, isStateOwned: false },
        { name: 'DS Smith', country: 'UK', marketShare: 5.5, productionCapacity: 6500000, isStateOwned: false },
        { name: 'Packaging Corp', country: 'USA', marketShare: 4.8, productionCapacity: 5800000, isStateOwned: false },
      ],
      supplyConcentration: 'medium',
      herfindahlIndex: 620,
      demandDrivers: [
        'E-commerce growth',
        'Food and beverage packaging',
        'Consumer goods shipping',
        'Sustainable packaging shift',
        'Retail display demand',
      ],
      substitutes: [
        { name: 'Plastic Containers', substitutionScore: 0.35 },
        { name: 'Reusable Packaging', substitutionScore: 0.2 },
        { name: 'Molded Fiber', substitutionScore: 0.15 },
      ],
      tradeFlows: [
        { from: 'USA', to: 'Mexico', volumePct: 15 },
        { from: 'Europe', to: 'UK', volumePct: 12 },
        { from: 'China', to: 'Southeast Asia', volumePct: 20 },
      ],
    },

    pricing: {
      spotPrice: 850,
      forwardCurve: generateForwardCurve(850, 0.01),
      historicalPrices: generateHistoricalPrices(850, 0.12),
      volatility30d: 8.5,
      volatility90d: 12.3,
      priceFloor: 720,
      priceCeiling: 1050,
      regionalPrices: {
        'North America': 850,
        'Europe': 920,
        'Asia': 680,
        'South America': 780,
      },
      benchmarkIndex: 'RISI Containerboard',
    },

    fundamentals: {
      globalProduction: 180000000,
      globalConsumption: 175000000,
      productionGrowthRate: 3.5,
      consumptionGrowthRate: 4.2,
      stockpileLevels: 8500000,
      daysOfSupply: 18,
      utilizationRate: 85,
      capacityAdditions: [
        { year: 2025, volume: 5000000, region: 'Asia' },
        { year: 2025, volume: 2000000, region: 'North America' },
        { year: 2026, volume: 3000000, region: 'Europe' },
      ],
      sentiment: 'neutral',
      sentimentScore: 15,
    },

    risks: {
      supplyDisruptionRisk: 'low',
      supplyRiskScore: 28,
      geopoliticalExposure: 22,
      topRiskCountries: [],
      environmentalRegulationRisk: 'medium',
      currencyExposure: ['EUR', 'CNY'],
      weatherSensitivity: 'medium',
      laborRisk: 'low',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'Emily Zhang',
      reportCount: 18,
      lastReportDate: '2025-01-10',
      priceIndexAvailable: true,
      costModelAvailable: true,
    },
  },

  // ==========================================
  // CHEMICALS
  // ==========================================
  {
    id: 'lithium-carbonate',
    name: 'Lithium Carbonate',
    slug: 'lithium-carbonate',
    category: 'chemicals',
    subcategory: 'battery-materials',

    currentPrice: 126005,
    currency: 'CNY',
    unit: 'MT',
    priceChange: {
      daily: -1.5,
      weekly: -4.2,
      monthly: -12.5,
      ytd: -28.3,
    },

    marketStructure: {
      topProducers: [
        { name: 'Albemarle', country: 'USA', marketShare: 18.5, productionCapacity: 175000, isStateOwned: false },
        { name: 'SQM', country: 'Chile', marketShare: 15.2, productionCapacity: 180000, isStateOwned: false },
        { name: 'Ganfeng Lithium', country: 'China', marketShare: 14.8, productionCapacity: 200000, isStateOwned: false },
        { name: 'Tianqi Lithium', country: 'China', marketShare: 10.5, productionCapacity: 88000, isStateOwned: false },
        { name: 'Livent', country: 'USA', marketShare: 5.2, productionCapacity: 35000, isStateOwned: false },
      ],
      supplyConcentration: 'high',
      herfindahlIndex: 1250,
      demandDrivers: [
        'Electric vehicle battery production',
        'Energy storage systems',
        'Consumer electronics',
        'Grid-scale batteries',
        'E-mobility expansion',
      ],
      substitutes: [
        { name: 'Sodium-ion batteries', substitutionScore: 0.25 },
        { name: 'Solid-state batteries', substitutionScore: 0.1 },
      ],
      tradeFlows: [
        { from: 'Chile', to: 'China', volumePct: 45 },
        { from: 'Australia', to: 'China', volumePct: 30 },
        { from: 'Argentina', to: 'Asia', volumePct: 12 },
      ],
    },

    pricing: {
      spotPrice: 126005,
      forwardCurve: generateForwardCurve(126005, -0.05), // Backwardation due to oversupply
      historicalPrices: generateHistoricalPrices(126005, 0.45),
      volatility30d: 35.2,
      volatility90d: 52.8,
      priceFloor: 80000,
      priceCeiling: 500000,
      regionalPrices: {
        'China': 126005,
        'Asia ex-China': 135000,
        'Europe': 145000,
        'North America': 150000,
      },
      benchmarkIndex: 'Asian Metal Lithium',
    },

    fundamentals: {
      globalProduction: 820000,
      globalConsumption: 750000,
      productionGrowthRate: 25.0,
      consumptionGrowthRate: 22.0,
      stockpileLevels: 95000,
      daysOfSupply: 46,
      utilizationRate: 72,
      capacityAdditions: [
        { year: 2025, volume: 150000, region: 'Australia' },
        { year: 2025, volume: 100000, region: 'Chile' },
        { year: 2026, volume: 200000, region: 'China' },
        { year: 2026, volume: 80000, region: 'Argentina' },
      ],
      sentiment: 'bearish',
      sentimentScore: -45,
    },

    risks: {
      supplyDisruptionRisk: 'medium',
      supplyRiskScore: 48,
      geopoliticalExposure: 72,
      topRiskCountries: ['Chile', 'Argentina', 'China'],
      environmentalRegulationRisk: 'high',
      currencyExposure: ['CNY', 'CLP', 'ARS', 'AUD'],
      weatherSensitivity: 'high',
      laborRisk: 'high',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'Dr. Wei Liu',
      reportCount: 32,
      lastReportDate: '2025-01-22',
      priceIndexAvailable: true,
      costModelAvailable: true,
    },
  },

  // ==========================================
  // LOGISTICS
  // ==========================================
  {
    id: 'ocean-freight',
    name: 'Ocean Freight (Container)',
    slug: 'ocean-freight',
    category: 'logistics',
    subcategory: 'freight',

    currentPrice: 2850,
    currency: 'USD',
    unit: 'TEU',
    priceChange: {
      daily: 2.5,
      weekly: 8.2,
      monthly: 45.5,
      ytd: 125.8,
    },

    marketStructure: {
      topProducers: [
        { name: 'MSC', country: 'Switzerland', marketShare: 19.2, productionCapacity: 5500000, isStateOwned: false },
        { name: 'Maersk', country: 'Denmark', marketShare: 15.8, productionCapacity: 4200000, isStateOwned: false },
        { name: 'CMA CGM', country: 'France', marketShare: 13.1, productionCapacity: 3400000, isStateOwned: false },
        { name: 'COSCO', country: 'China', marketShare: 12.5, productionCapacity: 3100000, isStateOwned: true },
        { name: 'Hapag-Lloyd', country: 'Germany', marketShare: 7.2, productionCapacity: 1800000, isStateOwned: false },
      ],
      supplyConcentration: 'high',
      herfindahlIndex: 1150,
      demandDrivers: [
        'Global trade volumes',
        'E-commerce growth',
        'Manufacturing reshoring',
        'Inventory restocking',
        'Seasonal demand patterns',
      ],
      substitutes: [
        { name: 'Air Freight', substitutionScore: 0.15 },
        { name: 'Rail Freight', substitutionScore: 0.1 },
        { name: 'Nearshoring', substitutionScore: 0.2 },
      ],
      tradeFlows: [
        { from: 'Asia', to: 'North America', volumePct: 28 },
        { from: 'Asia', to: 'Europe', volumePct: 22 },
        { from: 'Europe', to: 'North America', volumePct: 12 },
        { from: 'Intra-Asia', to: 'Intra-Asia', volumePct: 25 },
      ],
    },

    pricing: {
      spotPrice: 2850,
      forwardCurve: generateForwardCurve(2850, 0.08),
      historicalPrices: generateHistoricalPrices(2850, 0.55),
      volatility30d: 42.5,
      volatility90d: 65.8,
      priceFloor: 1200,
      priceCeiling: 15000,
      regionalPrices: {
        'Trans-Pacific Eastbound': 3200,
        'Trans-Pacific Westbound': 850,
        'Asia-Europe Westbound': 2950,
        'Asia-Europe Eastbound': 1100,
        'Trans-Atlantic Westbound': 2400,
      },
      benchmarkIndex: 'Drewry World Container Index',
    },

    fundamentals: {
      globalProduction: 25000000, // TEU capacity
      globalConsumption: 23500000,
      productionGrowthRate: 4.5,
      consumptionGrowthRate: 3.8,
      stockpileLevels: 0, // Not applicable
      daysOfSupply: 0,
      utilizationRate: 92,
      capacityAdditions: [
        { year: 2025, volume: 1200000, region: 'Global' },
        { year: 2026, volume: 1500000, region: 'Global' },
      ],
      sentiment: 'bullish',
      sentimentScore: 65,
    },

    risks: {
      supplyDisruptionRisk: 'high',
      supplyRiskScore: 78,
      geopoliticalExposure: 85,
      topRiskCountries: ['Panama', 'Egypt', 'Yemen'],
      environmentalRegulationRisk: 'high',
      currencyExposure: ['EUR', 'CNY'],
      weatherSensitivity: 'high',
      laborRisk: 'high',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'Carlos Martinez',
      reportCount: 42,
      lastReportDate: '2025-01-24',
      priceIndexAvailable: true,
      costModelAvailable: false,
    },
  },

  // ==========================================
  // ENERGY
  // ==========================================
  {
    id: 'natural-gas',
    name: 'Natural Gas',
    slug: 'natural-gas',
    category: 'energy',
    subcategory: 'fuel',

    currentPrice: 3.25,
    currency: 'USD',
    unit: 'MMBtu',
    priceChange: {
      daily: 1.8,
      weekly: 5.2,
      monthly: -8.5,
      ytd: -15.2,
    },

    marketStructure: {
      topProducers: [
        { name: 'ExxonMobil', country: 'USA', marketShare: 4.5, productionCapacity: 180000000000, isStateOwned: false },
        { name: 'Gazprom', country: 'Russia', marketShare: 12.2, productionCapacity: 520000000000, isStateOwned: true },
        { name: 'Qatar Energy', country: 'Qatar', marketShare: 5.8, productionCapacity: 175000000000, isStateOwned: true },
        { name: 'Shell', country: 'Netherlands', marketShare: 3.2, productionCapacity: 125000000000, isStateOwned: false },
        { name: 'Chevron', country: 'USA', marketShare: 2.8, productionCapacity: 110000000000, isStateOwned: false },
      ],
      supplyConcentration: 'medium',
      herfindahlIndex: 580,
      demandDrivers: [
        'Power generation',
        'Industrial heating',
        'Residential heating',
        'Petrochemical feedstock',
        'LNG export demand',
      ],
      substitutes: [
        { name: 'Renewable Energy', substitutionScore: 0.35 },
        { name: 'Nuclear', substitutionScore: 0.2 },
        { name: 'Coal', substitutionScore: 0.25 },
        { name: 'Oil', substitutionScore: 0.15 },
      ],
      tradeFlows: [
        { from: 'USA', to: 'Europe', volumePct: 18 },
        { from: 'Qatar', to: 'Asia', volumePct: 25 },
        { from: 'Australia', to: 'Japan', volumePct: 15 },
        { from: 'Russia', to: 'China', volumePct: 12 },
      ],
    },

    pricing: {
      spotPrice: 3.25,
      forwardCurve: generateForwardCurve(3.25, 0.15),
      historicalPrices: generateHistoricalPrices(3.25, 0.45),
      volatility30d: 38.5,
      volatility90d: 55.2,
      priceFloor: 1.80,
      priceCeiling: 9.50,
      regionalPrices: {
        'Henry Hub (USA)': 3.25,
        'TTF (Europe)': 12.50,
        'JKM (Asia)': 14.20,
        'AECO (Canada)': 2.85,
      },
      benchmarkIndex: 'Henry Hub',
    },

    fundamentals: {
      globalProduction: 4100000000000, // cubic meters
      globalConsumption: 4000000000000,
      productionGrowthRate: 2.5,
      consumptionGrowthRate: 2.8,
      stockpileLevels: 350000000000,
      daysOfSupply: 32,
      utilizationRate: 78,
      capacityAdditions: [
        { year: 2025, volume: 50000000000, region: 'USA' },
        { year: 2025, volume: 40000000000, region: 'Qatar' },
        { year: 2026, volume: 35000000000, region: 'Australia' },
      ],
      sentiment: 'neutral',
      sentimentScore: 5,
    },

    risks: {
      supplyDisruptionRisk: 'high',
      supplyRiskScore: 68,
      geopoliticalExposure: 78,
      topRiskCountries: ['Russia', 'Iran', 'Qatar'],
      environmentalRegulationRisk: 'high',
      currencyExposure: ['EUR', 'JPY', 'CNY'],
      weatherSensitivity: 'high',
      laborRisk: 'medium',
    },

    beroeCoverage: {
      hasAnalyst: true,
      analystName: 'Robert Anderson',
      reportCount: 38,
      lastReportDate: '2025-01-21',
      priceIndexAvailable: true,
      costModelAvailable: true,
    },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getCommodityById(id: string): EnrichedCommodity | undefined {
  return ENRICHED_COMMODITIES.find(c => c.id === id);
}

export function getCommoditiesByCategory(category: string): EnrichedCommodity[] {
  return ENRICHED_COMMODITIES.filter(c => c.category === category);
}

export function getCommodityBySlug(slug: string): EnrichedCommodity | undefined {
  return ENRICHED_COMMODITIES.find(c => c.slug === slug || c.name.toLowerCase().includes(slug.toLowerCase()));
}

export function getHighRiskCommodities(): EnrichedCommodity[] {
  return ENRICHED_COMMODITIES.filter(c => c.risks.supplyDisruptionRisk === 'high');
}

export function getBullishCommodities(): EnrichedCommodity[] {
  return ENRICHED_COMMODITIES.filter(c => c.fundamentals.sentiment === 'bullish');
}

export function getCommodityPriceSummary(commodity: EnrichedCommodity): string {
  const direction = commodity.priceChange.monthly > 0 ? 'up' : 'down';
  const sentiment = commodity.fundamentals.sentiment;
  return `${commodity.name} is trading at ${commodity.currentPrice} ${commodity.currency}/${commodity.unit}, ${direction} ${Math.abs(commodity.priceChange.monthly).toFixed(1)}% this month. Market sentiment is ${sentiment} with ${commodity.fundamentals.daysOfSupply} days of supply.`;
}

// ============================================
// WIDGET DATA CONVERTER
// ============================================

import type { PriceGaugeData } from '../types/widgets';

/**
 * Convert an EnrichedCommodity to PriceGaugeData for the price gauge widget
 * Includes enriched fields: sentiment, volatility, supply risk
 */
export function commodityToPriceGaugeData(commodity: EnrichedCommodity): PriceGaugeData {
  // Calculate gauge position based on price floor/ceiling
  const priceRange = commodity.pricing.priceCeiling - commodity.pricing.priceFloor;
  const pricePosition = commodity.currentPrice - commodity.pricing.priceFloor;
  const gaugePosition = Math.min(100, Math.max(0, (pricePosition / priceRange) * 100));

  return {
    commodity: commodity.name,
    currentPrice: commodity.currentPrice,
    unit: commodity.unit,
    currency: commodity.currency,
    lastUpdated: commodity.beroeCoverage.lastReportDate,
    gaugeMin: commodity.pricing.priceFloor,
    gaugeMax: commodity.pricing.priceCeiling,
    gaugePosition,
    change24h: {
      value: commodity.currentPrice * (commodity.priceChange.daily / 100),
      percent: commodity.priceChange.daily,
    },
    change30d: {
      value: commodity.currentPrice * (commodity.priceChange.monthly / 100),
      percent: commodity.priceChange.monthly,
    },
    market: commodity.pricing.benchmarkIndex,

    // Enriched fields from commodity intelligence
    sentiment: commodity.fundamentals.sentiment,
    sentimentScore: commodity.fundamentals.sentimentScore,
    volatility30d: commodity.pricing.volatility30d,
    supplyRisk: commodity.risks.supplyDisruptionRisk,
    supplyRiskScore: commodity.risks.supplyRiskScore,
    supplyConcentration: commodity.marketStructure.supplyConcentration,
  };
}

/**
 * Get PriceGaugeData by commodity ID
 * Returns undefined if commodity not found
 */
export function getPriceGaugeDataById(commodityId: string): PriceGaugeData | undefined {
  const commodity = getCommodityById(commodityId);
  if (!commodity) return undefined;
  return commodityToPriceGaugeData(commodity);
}

/**
 * Get PriceGaugeData by commodity name/slug
 * Returns undefined if commodity not found
 */
export function getPriceGaugeDataBySlug(slug: string): PriceGaugeData | undefined {
  const commodity = getCommodityBySlug(slug);
  if (!commodity) return undefined;
  return commodityToPriceGaugeData(commodity);
}
