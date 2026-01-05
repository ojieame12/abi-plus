// Seed script for supplier portfolio data
// Run with: npx dotenv -e .env.local -- npx tsx scripts/seed-suppliers.ts

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { suppliers, supplierRiskScores, riskChanges, userPortfolios, users, type RiskFactorScore } from '../src/db/schema';
import { sql, eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient);

// ============================================
// RISK FACTOR DEFINITIONS
// ============================================

const RISK_FACTORS = {
  financial: { name: 'Financial Health', tier: 'freely-displayable' as const, weight: 0.20 },
  cybersecurity: { name: 'Cybersecurity', tier: 'conditionally-displayable' as const, weight: 0.15 },
  esg: { name: 'ESG & Sustainability', tier: 'freely-displayable' as const, weight: 0.10 },
  delivery: { name: 'Delivery Performance', tier: 'freely-displayable' as const, weight: 0.10 },
  quality: { name: 'Quality Metrics', tier: 'conditionally-displayable' as const, weight: 0.15 },
  diversity: { name: 'Supplier Diversity', tier: 'freely-displayable' as const, weight: 0.05 },
  scalability: { name: 'Scalability', tier: 'conditionally-displayable' as const, weight: 0.10 },
  freight: { name: 'Freight Risk', tier: 'restricted' as const, weight: 0.05 },
  compliance: { name: 'Regulatory Compliance', tier: 'freely-displayable' as const, weight: 0.10 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRiskLevel(score: number): string {
  if (score === 0) return 'unrated';
  if (score >= 75) return 'high';
  if (score >= 55) return 'medium-high';
  if (score >= 35) return 'medium';
  return 'low';
}

function generateScoreHistory(currentScore: number, trend: string): number[] {
  const history: number[] = [];
  let score = currentScore;

  for (let i = 8; i >= 0; i--) {
    if (i === 8) {
      history.push(currentScore);
    } else {
      const variance = Math.floor(Math.random() * 5) + 2;
      if (trend === 'worsening') {
        score = Math.max(20, score - variance);
      } else if (trend === 'improving') {
        score = Math.min(95, score + variance);
      } else {
        score = score + (Math.random() > 0.5 ? variance : -variance);
        score = Math.max(20, Math.min(95, score));
      }
      history.unshift(score);
    }
  }

  return history;
}

function generateRiskFactors(overallScore: number): RiskFactorScore[] {
  return Object.entries(RISK_FACTORS).map(([id, config]) => {
    const variance = Math.floor(Math.random() * 30) - 15;
    const score = Math.max(0, Math.min(100, overallScore + variance));

    return {
      id,
      name: config.name,
      tier: config.tier,
      weight: config.weight,
      score: config.tier !== 'restricted' ? score : undefined,
      rating: score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk',
    };
  });
}

function formatSpend(spend: number): string {
  if (spend >= 1_000_000_000) {
    return `$${(spend / 1_000_000_000).toFixed(1)}B`;
  }
  if (spend >= 1_000_000) {
    return `$${(spend / 1_000_000).toFixed(1)}M`;
  }
  if (spend >= 1_000) {
    return `$${(spend / 1_000).toFixed(0)}K`;
  }
  return `$${spend}`;
}

function generateDUNS(): string {
  return String(Math.floor(Math.random() * 900000000) + 100000000);
}

// ============================================
// SUPPLIER DATA (60 diverse suppliers)
// ============================================

interface SupplierData {
  name: string;
  category: string;
  industry: string;
  city: string;
  country: string;
  region: string;
  spend: number;
  criticality: string;
  revenue: string;
  riskScore: number;
  trend: string;
}

const SUPPLIERS: SupplierData[] = [
  // HIGH RISK (10)
  { name: 'TechCore Industries', category: 'Electronics', industry: 'Technology', city: 'Shenzhen', country: 'China', region: 'Asia Pacific', spend: 45_000_000, criticality: 'high', revenue: '$2.5B Revenue', riskScore: 88, trend: 'worsening' },
  { name: 'GlobalChem Solutions', category: 'Chemicals', industry: 'Chemicals', city: 'Houston', country: 'USA', region: 'North America', spend: 32_000_000, criticality: 'high', revenue: '$890M Revenue', riskScore: 82, trend: 'stable' },
  { name: 'Apex Manufacturing Co', category: 'Industrial Equipment', industry: 'Manufacturing', city: 'Detroit', country: 'USA', region: 'North America', spend: 28_000_000, criticality: 'high', revenue: '$1.2B Revenue', riskScore: 79, trend: 'worsening' },
  { name: 'Eastern Logistics Corp', category: 'Logistics', industry: 'Transportation', city: 'Shanghai', country: 'China', region: 'Asia Pacific', spend: 18_000_000, criticality: 'high', revenue: '$3.1B Revenue', riskScore: 85, trend: 'worsening' },
  { name: 'PetroMax Energy', category: 'Energy', industry: 'Oil & Gas', city: 'Lagos', country: 'Nigeria', region: 'Africa', spend: 52_000_000, criticality: 'high', revenue: '$4.2B Revenue', riskScore: 91, trend: 'stable' },
  { name: 'SteelWorks International', category: 'Steel', industry: 'Metals', city: 'Mumbai', country: 'India', region: 'Asia Pacific', spend: 38_000_000, criticality: 'high', revenue: '$1.8B Revenue', riskScore: 77, trend: 'improving' },
  { name: 'DataStream Technologies', category: 'IT Services', industry: 'Technology', city: 'Bangalore', country: 'India', region: 'Asia Pacific', spend: 15_000_000, criticality: 'medium', revenue: '$450M Revenue', riskScore: 83, trend: 'worsening' },
  { name: 'Pacific Plastics Ltd', category: 'Plastics', industry: 'Manufacturing', city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia Pacific', spend: 8_500_000, criticality: 'medium', revenue: '$280M Revenue', riskScore: 76, trend: 'stable' },
  { name: 'RareEarth Mining Corp', category: 'Raw Materials', industry: 'Mining', city: 'Johannesburg', country: 'South Africa', region: 'Africa', spend: 72_000_000, criticality: 'high', revenue: '$5.6B Revenue', riskScore: 89, trend: 'worsening' },
  { name: 'CyberDefense Systems', category: 'Security', industry: 'Technology', city: 'Tel Aviv', country: 'Israel', region: 'Middle East', spend: 12_000_000, criticality: 'high', revenue: '$320M Revenue', riskScore: 78, trend: 'stable' },

  // MEDIUM-HIGH RISK (12)
  { name: 'AutoParts Global', category: 'Automotive', industry: 'Automotive', city: 'Stuttgart', country: 'Germany', region: 'Europe', spend: 42_000_000, criticality: 'high', revenue: '$2.8B Revenue', riskScore: 68, trend: 'stable' },
  { name: 'FlexPack Solutions', category: 'Packaging', industry: 'Manufacturing', city: 'Chicago', country: 'USA', region: 'North America', spend: 9_500_000, criticality: 'medium', revenue: '$340M Revenue', riskScore: 62, trend: 'worsening' },
  { name: 'BioPharm Ingredients', category: 'Pharmaceuticals', industry: 'Healthcare', city: 'Basel', country: 'Switzerland', region: 'Europe', spend: 35_000_000, criticality: 'high', revenue: '$1.5B Revenue', riskScore: 65, trend: 'stable' },
  { name: 'TurboMech Engineering', category: 'Industrial Equipment', industry: 'Manufacturing', city: 'Osaka', country: 'Japan', region: 'Asia Pacific', spend: 22_000_000, criticality: 'high', revenue: '$920M Revenue', riskScore: 58, trend: 'improving' },
  { name: 'ClearView Optics', category: 'Electronics', industry: 'Technology', city: 'Seoul', country: 'South Korea', region: 'Asia Pacific', spend: 16_500_000, criticality: 'medium', revenue: '$480M Revenue', riskScore: 64, trend: 'stable' },
  { name: 'AgriGrow Supplies', category: 'Agriculture', industry: 'Agriculture', city: 'Des Moines', country: 'USA', region: 'North America', spend: 7_200_000, criticality: 'medium', revenue: '$210M Revenue', riskScore: 59, trend: 'worsening' },
  { name: 'Nordic Power Systems', category: 'Energy', industry: 'Energy', city: 'Oslo', country: 'Norway', region: 'Europe', spend: 28_000_000, criticality: 'high', revenue: '$1.1B Revenue', riskScore: 66, trend: 'stable' },
  { name: 'MediSupply Corp', category: 'Medical Devices', industry: 'Healthcare', city: 'Boston', country: 'USA', region: 'North America', spend: 24_000_000, criticality: 'high', revenue: '$780M Revenue', riskScore: 61, trend: 'improving' },
  { name: 'TransCargo Freight', category: 'Logistics', industry: 'Transportation', city: 'Rotterdam', country: 'Netherlands', region: 'Europe', spend: 14_000_000, criticality: 'medium', revenue: '$620M Revenue', riskScore: 67, trend: 'worsening' },
  { name: 'Precision Tooling Inc', category: 'Industrial Equipment', industry: 'Manufacturing', city: 'Cincinnati', country: 'USA', region: 'North America', spend: 11_000_000, criticality: 'medium', revenue: '$290M Revenue', riskScore: 57, trend: 'stable' },
  { name: 'SolarTech Panels', category: 'Energy', industry: 'Renewable Energy', city: 'Phoenix', country: 'USA', region: 'North America', spend: 19_500_000, criticality: 'medium', revenue: '$540M Revenue', riskScore: 63, trend: 'improving' },
  { name: 'MetalForm Industries', category: 'Steel', industry: 'Metals', city: 'Pittsburgh', country: 'USA', region: 'North America', spend: 26_000_000, criticality: 'high', revenue: '$870M Revenue', riskScore: 69, trend: 'stable' },

  // MEDIUM RISK (15)
  { name: 'EuroFoods GmbH', category: 'Food & Beverage', industry: 'Consumer Goods', city: 'Munich', country: 'Germany', region: 'Europe', spend: 12_500_000, criticality: 'medium', revenue: '$380M Revenue', riskScore: 48, trend: 'stable' },
  { name: 'TextilePro Co', category: 'Textiles', industry: 'Manufacturing', city: 'Dhaka', country: 'Bangladesh', region: 'Asia Pacific', spend: 6_800_000, criticality: 'medium', revenue: '$195M Revenue', riskScore: 52, trend: 'stable' },
  { name: 'CleanEnergy Partners', category: 'Energy', industry: 'Renewable Energy', city: 'Copenhagen', country: 'Denmark', region: 'Europe', spend: 31_000_000, criticality: 'high', revenue: '$1.3B Revenue', riskScore: 44, trend: 'improving' },
  { name: 'PackRight Materials', category: 'Packaging', industry: 'Manufacturing', city: 'Toronto', country: 'Canada', region: 'North America', spend: 8_900_000, criticality: 'medium', revenue: '$260M Revenue', riskScore: 47, trend: 'stable' },
  { name: 'Digital Dynamics Ltd', category: 'IT Services', industry: 'Technology', city: 'Dublin', country: 'Ireland', region: 'Europe', spend: 17_000_000, criticality: 'medium', revenue: '$510M Revenue', riskScore: 51, trend: 'stable' },
  { name: 'SafeChem Industries', category: 'Chemicals', industry: 'Chemicals', city: 'Frankfurt', country: 'Germany', region: 'Europe', spend: 23_000_000, criticality: 'high', revenue: '$720M Revenue', riskScore: 46, trend: 'improving' },
  { name: 'AquaPure Systems', category: 'Water Treatment', industry: 'Utilities', city: 'Singapore', country: 'Singapore', region: 'Asia Pacific', spend: 9_200_000, criticality: 'medium', revenue: '$285M Revenue', riskScore: 49, trend: 'stable' },
  { name: 'BuildMaster Supplies', category: 'Construction', industry: 'Construction', city: 'Dallas', country: 'USA', region: 'North America', spend: 15_500_000, criticality: 'medium', revenue: '$420M Revenue', riskScore: 53, trend: 'worsening' },
  { name: 'NutriSource Foods', category: 'Food & Beverage', industry: 'Consumer Goods', city: 'Amsterdam', country: 'Netherlands', region: 'Europe', spend: 10_800_000, criticality: 'medium', revenue: '$340M Revenue', riskScore: 45, trend: 'stable' },
  { name: 'PrecisionCast Metals', category: 'Steel', industry: 'Metals', city: 'Sheffield', country: 'UK', region: 'Europe', spend: 13_200_000, criticality: 'medium', revenue: '$390M Revenue', riskScore: 50, trend: 'stable' },
  { name: 'HealthTech Devices', category: 'Medical Devices', industry: 'Healthcare', city: 'San Diego', country: 'USA', region: 'North America', spend: 21_000_000, criticality: 'high', revenue: '$650M Revenue', riskScore: 42, trend: 'improving' },
  { name: 'GreenLeaf Organics', category: 'Agriculture', industry: 'Agriculture', city: 'Portland', country: 'USA', region: 'North America', spend: 5_400_000, criticality: 'low', revenue: '$145M Revenue', riskScore: 48, trend: 'stable' },
  { name: 'MicroElectro Systems', category: 'Electronics', industry: 'Technology', city: 'Taipei', country: 'Taiwan', region: 'Asia Pacific', spend: 38_000_000, criticality: 'high', revenue: '$1.6B Revenue', riskScore: 54, trend: 'stable' },
  { name: 'CloudServe Solutions', category: 'IT Services', industry: 'Technology', city: 'Seattle', country: 'USA', region: 'North America', spend: 14_500_000, criticality: 'medium', revenue: '$430M Revenue', riskScore: 41, trend: 'improving' },
  { name: 'EcoWrap Packaging', category: 'Packaging', industry: 'Manufacturing', city: 'Stockholm', country: 'Sweden', region: 'Europe', spend: 7_600_000, criticality: 'medium', revenue: '$220M Revenue', riskScore: 43, trend: 'stable' },

  // LOW RISK (13)
  { name: 'SwissQuality Parts', category: 'Industrial Equipment', industry: 'Manufacturing', city: 'Zurich', country: 'Switzerland', region: 'Europe', spend: 19_000_000, criticality: 'high', revenue: '$580M Revenue', riskScore: 28, trend: 'stable' },
  { name: 'ReliaTech Components', category: 'Electronics', industry: 'Technology', city: 'San Jose', country: 'USA', region: 'North America', spend: 34_000_000, criticality: 'high', revenue: '$1.1B Revenue', riskScore: 32, trend: 'stable' },
  { name: 'PureFlow Chemicals', category: 'Chemicals', industry: 'Chemicals', city: 'Brussels', country: 'Belgium', region: 'Europe', spend: 11_500_000, criticality: 'medium', revenue: '$350M Revenue', riskScore: 26, trend: 'improving' },
  { name: 'TopGrade Materials', category: 'Raw Materials', industry: 'Mining', city: 'Perth', country: 'Australia', region: 'Asia Pacific', spend: 27_000_000, criticality: 'high', revenue: '$920M Revenue', riskScore: 31, trend: 'stable' },
  { name: 'SafetyFirst Equipment', category: 'Safety Equipment', industry: 'Manufacturing', city: 'London', country: 'UK', region: 'Europe', spend: 8_300_000, criticality: 'medium', revenue: '$240M Revenue', riskScore: 24, trend: 'stable' },
  { name: 'QuantumLogic Tech', category: 'IT Services', industry: 'Technology', city: 'Austin', country: 'USA', region: 'North America', spend: 22_000_000, criticality: 'high', revenue: '$710M Revenue', riskScore: 29, trend: 'stable' },
  { name: 'OceanFreight Global', category: 'Logistics', industry: 'Transportation', city: 'Hamburg', country: 'Germany', region: 'Europe', spend: 16_000_000, criticality: 'medium', revenue: '$490M Revenue', riskScore: 33, trend: 'stable' },
  { name: 'NanoTech Innovations', category: 'Electronics', industry: 'Technology', city: 'Cambridge', country: 'UK', region: 'Europe', spend: 13_800_000, criticality: 'medium', revenue: '$410M Revenue', riskScore: 27, trend: 'improving' },
  { name: 'GoldStandard Metals', category: 'Steel', industry: 'Metals', city: 'Tokyo', country: 'Japan', region: 'Asia Pacific', spend: 41_000_000, criticality: 'high', revenue: '$1.7B Revenue', riskScore: 25, trend: 'stable' },
  { name: 'BioMed Research', category: 'Pharmaceuticals', industry: 'Healthcare', city: 'Cambridge', country: 'USA', region: 'North America', spend: 29_000_000, criticality: 'high', revenue: '$980M Revenue', riskScore: 30, trend: 'stable' },
  { name: 'AeroSpace Dynamics', category: 'Aerospace', industry: 'Aerospace', city: 'Toulouse', country: 'France', region: 'Europe', spend: 56_000_000, criticality: 'high', revenue: '$2.2B Revenue', riskScore: 34, trend: 'stable' },
  { name: 'TrustWorth Logistics', category: 'Logistics', industry: 'Transportation', city: 'Atlanta', country: 'USA', region: 'North America', spend: 12_200_000, criticality: 'medium', revenue: '$360M Revenue', riskScore: 22, trend: 'improving' },
  { name: 'ProChem Solutions', category: 'Chemicals', industry: 'Chemicals', city: 'Lyon', country: 'France', region: 'Europe', spend: 18_500_000, criticality: 'medium', revenue: '$550M Revenue', riskScore: 28, trend: 'stable' },

  // UNRATED (10)
  { name: 'NewVenture Tech', category: 'IT Services', industry: 'Technology', city: 'Nairobi', country: 'Kenya', region: 'Africa', spend: 2_100_000, criticality: 'low', revenue: '$45M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'StarUp Manufacturing', category: 'Industrial Equipment', industry: 'Manufacturing', city: 'Manila', country: 'Philippines', region: 'Asia Pacific', spend: 3_400_000, criticality: 'low', revenue: '$78M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'FreshStart Farms', category: 'Agriculture', industry: 'Agriculture', city: 'Buenos Aires', country: 'Argentina', region: 'Latin America', spend: 1_800_000, criticality: 'low', revenue: '$32M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'QuickShip Express', category: 'Logistics', industry: 'Transportation', city: 'Jakarta', country: 'Indonesia', region: 'Asia Pacific', spend: 4_200_000, criticality: 'medium', revenue: '$95M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'LocalSource Materials', category: 'Raw Materials', industry: 'Mining', city: 'Santiago', country: 'Chile', region: 'Latin America', spend: 5_600_000, criticality: 'medium', revenue: '$125M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'EmergeTech Labs', category: 'Electronics', industry: 'Technology', city: 'Cairo', country: 'Egypt', region: 'Africa', spend: 2_900_000, criticality: 'low', revenue: '$58M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'GrowFast Organics', category: 'Food & Beverage', industry: 'Consumer Goods', city: 'Mexico City', country: 'Mexico', region: 'Latin America', spend: 3_100_000, criticality: 'low', revenue: '$67M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'BrightFuture Energy', category: 'Energy', industry: 'Renewable Energy', city: 'Casablanca', country: 'Morocco', region: 'Africa', spend: 6_800_000, criticality: 'medium', revenue: '$145M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'FlexiParts Co', category: 'Automotive', industry: 'Automotive', city: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia Pacific', spend: 4_500_000, criticality: 'medium', revenue: '$98M Revenue', riskScore: 0, trend: 'stable' },
  { name: 'NewHorizon Chemicals', category: 'Chemicals', industry: 'Chemicals', city: 'Bogota', country: 'Colombia', region: 'Latin America', spend: 3_800_000, criticality: 'low', revenue: '$82M Revenue', riskScore: 0, trend: 'stable' },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function clearExistingData() {
  console.log('Clearing existing supplier data...');
  await db.delete(riskChanges);
  await db.delete(userPortfolios);
  await db.delete(supplierRiskScores);
  await db.delete(suppliers);
  console.log('Cleared existing data.');
}

async function seedSuppliers() {
  console.log('Seeding suppliers...');

  const supplierRecords: Array<{ id: string; name: string; riskScore: number; trend: string }> = [];

  for (const supplier of SUPPLIERS) {
    const [inserted] = await db.insert(suppliers).values({
      name: supplier.name,
      duns: generateDUNS(),
      category: supplier.category,
      industry: supplier.industry,
      city: supplier.city,
      country: supplier.country,
      region: supplier.region,
      spend: supplier.spend,
      spendFormatted: formatSpend(supplier.spend),
      criticality: supplier.criticality,
      revenue: supplier.revenue,
    }).returning();

    supplierRecords.push({
      id: inserted.id,
      name: supplier.name,
      riskScore: supplier.riskScore,
      trend: supplier.trend,
    });
  }

  console.log(`Inserted ${supplierRecords.length} suppliers.`);
  return supplierRecords;
}

async function seedRiskScores(supplierRecords: Array<{ id: string; name: string; riskScore: number; trend: string }>) {
  console.log('Seeding risk scores...');

  for (const supplier of supplierRecords) {
    const level = generateRiskLevel(supplier.riskScore);
    const previousScore = supplier.riskScore === 0 ? undefined :
      supplier.trend === 'worsening' ? Math.max(0, supplier.riskScore - Math.floor(Math.random() * 15) - 5) :
      supplier.trend === 'improving' ? Math.min(100, supplier.riskScore + Math.floor(Math.random() * 15) + 5) :
      supplier.riskScore + (Math.random() > 0.5 ? 3 : -3);

    await db.insert(supplierRiskScores).values({
      supplierId: supplier.id,
      score: supplier.riskScore,
      level,
      trend: supplier.trend,
      previousScore: previousScore ? Math.round(previousScore) : undefined,
      factors: supplier.riskScore > 0 ? generateRiskFactors(supplier.riskScore) : [],
      scoreHistory: supplier.riskScore > 0 ? generateScoreHistory(supplier.riskScore, supplier.trend) : [],
    });
  }

  console.log(`Inserted ${supplierRecords.length} risk scores.`);
}

async function seedRiskChanges(supplierRecords: Array<{ id: string; name: string; riskScore: number; trend: string }>) {
  console.log('Seeding risk changes...');

  // Select suppliers with worsening or improving trends for risk changes
  const changingSuppliers = supplierRecords.filter(s => s.trend !== 'stable' && s.riskScore > 0);
  let changeCount = 0;

  for (const supplier of changingSuppliers.slice(0, 8)) { // Top 8 changes
    const currentLevel = generateRiskLevel(supplier.riskScore);
    const scoreChange = supplier.trend === 'worsening'
      ? Math.floor(Math.random() * 15) + 8
      : -(Math.floor(Math.random() * 15) + 8);
    const previousScore = Math.max(0, Math.min(100, supplier.riskScore - scoreChange));
    const previousLevel = generateRiskLevel(previousScore);

    // Only record if level changed or significant score change
    if (previousLevel !== currentLevel || Math.abs(scoreChange) > 10) {
      const daysAgo = Math.floor(Math.random() * 14) + 1; // Within last 2 weeks
      const changeDate = new Date();
      changeDate.setDate(changeDate.getDate() - daysAgo);

      await db.insert(riskChanges).values({
        supplierId: supplier.id,
        previousScore,
        previousLevel,
        currentScore: supplier.riskScore,
        currentLevel,
        direction: supplier.trend === 'worsening' ? 'worsened' : 'improved',
        changeReason: supplier.trend === 'worsening'
          ? 'Recent financial indicators and supply chain disruptions affected the risk profile.'
          : 'Improved compliance scores and stable financial performance.',
        changeDate,
      });
      changeCount++;
    }
  }

  console.log(`Inserted ${changeCount} risk changes.`);
}

async function seedUserPortfolios(supplierRecords: Array<{ id: string; name: string; riskScore: number; trend: string }>) {
  console.log('Seeding user portfolios...');

  // Get all users and add some suppliers to their portfolios
  const allUsers = await db.select().from(users);

  if (allUsers.length === 0) {
    console.log('No users found. Skipping portfolio seeding.');
    return;
  }

  let portfolioCount = 0;

  for (const user of allUsers) {
    // Each user follows 15-25 random suppliers
    const numSuppliers = Math.floor(Math.random() * 11) + 15;
    const shuffled = [...supplierRecords].sort(() => Math.random() - 0.5);
    const userSuppliers = shuffled.slice(0, numSuppliers);

    for (const supplier of userSuppliers) {
      await db.insert(userPortfolios).values({
        userId: user.id,
        supplierId: supplier.id,
        alertsEnabled: Math.random() > 0.2, // 80% have alerts enabled
      });
      portfolioCount++;
    }
  }

  console.log(`Inserted ${portfolioCount} portfolio entries for ${allUsers.length} users.`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('Starting supplier seed script...\n');

  try {
    await clearExistingData();
    const supplierRecords = await seedSuppliers();
    await seedRiskScores(supplierRecords);
    await seedRiskChanges(supplierRecords);
    await seedUserPortfolios(supplierRecords);

    console.log('\n✅ Supplier seeding complete!');
    console.log(`
Summary:
- ${SUPPLIERS.length} suppliers created
- ${SUPPLIERS.filter(s => s.riskScore >= 75).length} high risk
- ${SUPPLIERS.filter(s => s.riskScore >= 55 && s.riskScore < 75).length} medium-high risk
- ${SUPPLIERS.filter(s => s.riskScore >= 35 && s.riskScore < 55).length} medium risk
- ${SUPPLIERS.filter(s => s.riskScore > 0 && s.riskScore < 35).length} low risk
- ${SUPPLIERS.filter(s => s.riskScore === 0).length} unrated
    `);
  } catch (error) {
    console.error('Error seeding suppliers:', error);
    process.exit(1);
  }
}

main();
