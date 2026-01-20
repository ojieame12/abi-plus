/**
 * Expert Network Seeder
 *
 * Seeds expert profiles for the expert network system.
 *
 * Usage:
 *   npx tsx scripts/seed-experts.ts          # Seed (idempotent)
 *   npx tsx scripts/seed-experts.ts --reset  # Clear and reseed
 *
 * Requires:
 *   DATABASE_URL environment variable
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import {
  experts,
  expertEngagements,
  users,
  profiles,
} from '../src/db/schema.js';
import type { ExpertAvailability } from '../src/db/schema.js';

// ══════════════════════════════════════════════════════════════════
// STABLE UUIDs (deterministic for idempotency)
// ══════════════════════════════════════════════════════════════════

const EXPERT_IDS = {
  steelExpert: '770e8400-e29b-41d4-a716-446655440001',
  logisticsExpert: '770e8400-e29b-41d4-a716-446655440002',
  supplyChainExpert: '770e8400-e29b-41d4-a716-446655440003',
  packagingExpert: '770e8400-e29b-41d4-a716-446655440004',
  energyExpert: '770e8400-e29b-41d4-a716-446655440005',
  riskExpert: '770e8400-e29b-41d4-a716-446655440006',
  procurementExpert: '770e8400-e29b-41d4-a716-446655440007',
  sustainabilityExpert: '770e8400-e29b-41d4-a716-446655440008',
};

// User IDs for expert accounts (used for dashboard/availability endpoints)
const EXPERT_USER_IDS = {
  steelExpert: '880e8400-e29b-41d4-a716-446655440001',
  logisticsExpert: '880e8400-e29b-41d4-a716-446655440002',
  supplyChainExpert: '880e8400-e29b-41d4-a716-446655440003',
  packagingExpert: '880e8400-e29b-41d4-a716-446655440004',
  energyExpert: '880e8400-e29b-41d4-a716-446655440005',
  riskExpert: '880e8400-e29b-41d4-a716-446655440006',
  procurementExpert: '880e8400-e29b-41d4-a716-446655440007',
  sustainabilityExpert: '880e8400-e29b-41d4-a716-446655440008',
};

// ══════════════════════════════════════════════════════════════════
// DATABASE SETUP
// ══════════════════════════════════════════════════════════════════

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql);
}

// ══════════════════════════════════════════════════════════════════
// SEED DATA
// ══════════════════════════════════════════════════════════════════

const EXPERTS = [
  {
    id: EXPERT_IDS.steelExpert,
    userId: EXPERT_USER_IDS.steelExpert,
    email: 'robert.chen@expert-network.demo',
    name: 'Dr. Robert Chen',
    title: 'Steel Industry Consultant',
    photo: null,
    formerCompany: 'ArcelorMittal',
    formerTitle: 'VP of Strategic Sourcing',
    yearsExperience: 22,
    specialties: ['Steel', 'Metals', 'Mining', 'Raw Materials'],
    industries: ['Automotive', 'Construction', 'Heavy Industry'],
    regions: ['North America', 'Europe', 'Asia Pacific'],
    rating: 48, // 4.8
    totalRatings: 67,
    totalEngagements: 89,
    availability: 'online' as ExpertAvailability,
    hourlyRate: 500,
    isTopVoice: true,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.logisticsExpert,
    userId: EXPERT_USER_IDS.logisticsExpert,
    email: 'maria.santos@expert-network.demo',
    name: 'Maria Santos',
    title: 'Global Logistics Strategist',
    photo: null,
    formerCompany: 'Maersk',
    formerTitle: 'Director of Trade Operations',
    yearsExperience: 18,
    specialties: ['Ocean Freight', 'Container Logistics', 'Trade Lanes', 'Port Operations'],
    industries: ['Retail', 'Manufacturing', 'Consumer Goods'],
    regions: ['Global', 'Asia Pacific', 'Europe'],
    rating: 49, // 4.9
    totalRatings: 52,
    totalEngagements: 73,
    availability: 'online' as ExpertAvailability,
    hourlyRate: 450,
    isTopVoice: true,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.supplyChainExpert,
    userId: EXPERT_USER_IDS.supplyChainExpert,
    email: 'james.wilson@expert-network.demo',
    name: 'James Wilson',
    title: 'Supply Chain Transformation Expert',
    photo: null,
    formerCompany: 'Amazon',
    formerTitle: 'Senior Director, Supply Chain',
    yearsExperience: 15,
    specialties: ['Supply Chain Optimization', 'Inventory Management', 'Demand Planning', 'S&OP'],
    industries: ['E-commerce', 'Retail', 'Technology'],
    regions: ['North America', 'Europe'],
    rating: 47, // 4.7
    totalRatings: 38,
    totalEngagements: 56,
    availability: 'busy' as ExpertAvailability,
    hourlyRate: 600,
    isTopVoice: false,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.packagingExpert,
    userId: EXPERT_USER_IDS.packagingExpert,
    email: 'emily.zhang@expert-network.demo',
    name: 'Dr. Emily Zhang',
    title: 'Sustainable Packaging Consultant',
    photo: null,
    formerCompany: 'Mondi Group',
    formerTitle: 'Chief Sustainability Officer',
    yearsExperience: 14,
    specialties: ['Sustainable Packaging', 'Corrugated', 'Flexible Packaging', 'Recycling'],
    industries: ['FMCG', 'Food & Beverage', 'Healthcare'],
    regions: ['Europe', 'North America'],
    rating: 46, // 4.6
    totalRatings: 29,
    totalEngagements: 41,
    availability: 'online' as ExpertAvailability,
    hourlyRate: 400,
    isTopVoice: false,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.energyExpert,
    userId: EXPERT_USER_IDS.energyExpert,
    email: 'michael.thompson@expert-network.demo',
    name: 'Michael Thompson',
    title: 'Energy Markets Specialist',
    photo: null,
    formerCompany: 'Shell',
    formerTitle: 'Head of Energy Trading',
    yearsExperience: 20,
    specialties: ['Natural Gas', 'Electricity', 'Renewable Energy', 'Carbon Markets'],
    industries: ['Energy', 'Utilities', 'Manufacturing'],
    regions: ['Europe', 'Middle East', 'North America'],
    rating: 48, // 4.8
    totalRatings: 45,
    totalEngagements: 62,
    availability: 'offline' as ExpertAvailability,
    hourlyRate: 550,
    isTopVoice: true,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.riskExpert,
    userId: EXPERT_USER_IDS.riskExpert,
    email: 'sarah.johnson@expert-network.demo',
    name: 'Sarah Johnson',
    title: 'Supplier Risk Management Expert',
    photo: null,
    formerCompany: 'Dun & Bradstreet',
    formerTitle: 'VP of Risk Analytics',
    yearsExperience: 16,
    specialties: ['Supplier Risk', 'Financial Risk', 'Compliance', 'Due Diligence'],
    industries: ['Financial Services', 'Manufacturing', 'Pharma'],
    regions: ['North America', 'Europe', 'LATAM'],
    rating: 47, // 4.7
    totalRatings: 34,
    totalEngagements: 48,
    availability: 'online' as ExpertAvailability,
    hourlyRate: 475,
    isTopVoice: false,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.procurementExpert,
    userId: EXPERT_USER_IDS.procurementExpert,
    email: 'david.park@expert-network.demo',
    name: 'David Park',
    title: 'Strategic Procurement Advisor',
    photo: null,
    formerCompany: 'General Motors',
    formerTitle: 'CPO, Global Procurement',
    yearsExperience: 25,
    specialties: ['Category Management', 'Supplier Negotiations', 'Contract Management', 'Spend Analytics'],
    industries: ['Automotive', 'Aerospace', 'Industrial'],
    regions: ['North America', 'Asia Pacific'],
    rating: 50, // 5.0
    totalRatings: 71,
    totalEngagements: 95,
    availability: 'busy' as ExpertAvailability,
    hourlyRate: 650,
    isTopVoice: true,
    isVerified: true,
  },
  {
    id: EXPERT_IDS.sustainabilityExpert,
    userId: EXPERT_USER_IDS.sustainabilityExpert,
    email: 'anna.kowalski@expert-network.demo',
    name: 'Dr. Anna Kowalski',
    title: 'ESG & Sustainability Consultant',
    photo: null,
    formerCompany: 'Unilever',
    formerTitle: 'Global Head of Sustainable Sourcing',
    yearsExperience: 17,
    specialties: ['ESG', 'Sustainable Sourcing', 'Carbon Footprint', 'Circular Economy'],
    industries: ['Consumer Goods', 'Retail', 'Food & Beverage'],
    regions: ['Europe', 'North America', 'Asia Pacific'],
    rating: 48, // 4.8
    totalRatings: 42,
    totalEngagements: 58,
    availability: 'online' as ExpertAvailability,
    hourlyRate: 500,
    isTopVoice: true,
    isVerified: true,
  },
];

// ══════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function clearData(db: ReturnType<typeof getDb>) {
  console.log('🗑️  Clearing existing expert data...');

  // Delete in order of dependencies
  await db.delete(expertEngagements).where(
    inArray(expertEngagements.expertId, Object.values(EXPERT_IDS))
  );
  await db.delete(experts).where(
    inArray(experts.id, Object.values(EXPERT_IDS))
  );

  // Delete expert user profiles and accounts
  await db.delete(profiles).where(
    inArray(profiles.userId, Object.values(EXPERT_USER_IDS))
  );
  await db.delete(users).where(
    inArray(users.id, Object.values(EXPERT_USER_IDS))
  );

  console.log('✅ Cleared expert data');
}

async function seedExpertUsers(db: ReturnType<typeof getDb>) {
  console.log('👤 Seeding expert user accounts...');

  const passwordHash = await bcrypt.hash('expert123', 10);

  for (const expert of EXPERTS) {
    // Create user account
    await db.insert(users).values({
      id: expert.userId,
      email: expert.email,
      passwordHash,
      emailVerifiedAt: new Date(),
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        email: expert.email,
        emailVerifiedAt: new Date(),
      },
    });

    // Create profile
    await db.insert(profiles).values({
      userId: expert.userId,
      displayName: expert.name,
      company: `${expert.formerCompany} (Former)`,
      jobTitle: expert.title,
    }).onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: expert.name,
        company: `${expert.formerCompany} (Former)`,
        jobTitle: expert.title,
      },
    });
  }

  console.log(`✅ Seeded ${EXPERTS.length} expert user accounts`);
}

async function seedExperts(db: ReturnType<typeof getDb>) {
  console.log('👤 Seeding expert profiles...');

  for (const expert of EXPERTS) {
    await db.insert(experts).values({
      id: expert.id,
      userId: expert.userId, // Link to user account
      name: expert.name,
      title: expert.title,
      photo: expert.photo,
      formerCompany: expert.formerCompany,
      formerTitle: expert.formerTitle,
      yearsExperience: expert.yearsExperience,
      specialties: expert.specialties,
      industries: expert.industries,
      regions: expert.regions,
      rating: expert.rating,
      totalRatings: expert.totalRatings,
      totalEngagements: expert.totalEngagements,
      availability: expert.availability,
      hourlyRate: expert.hourlyRate,
      isTopVoice: expert.isTopVoice,
      isVerified: expert.isVerified,
    }).onConflictDoUpdate({
      target: experts.id,
      set: {
        userId: expert.userId, // Ensure userId is updated
        name: expert.name,
        title: expert.title,
        photo: expert.photo,
        formerCompany: expert.formerCompany,
        formerTitle: expert.formerTitle,
        yearsExperience: expert.yearsExperience,
        specialties: expert.specialties,
        industries: expert.industries,
        regions: expert.regions,
        rating: expert.rating,
        totalRatings: expert.totalRatings,
        totalEngagements: expert.totalEngagements,
        availability: expert.availability,
        hourlyRate: expert.hourlyRate,
        isTopVoice: expert.isTopVoice,
        isVerified: expert.isVerified,
      },
    });
  }

  console.log(`✅ Seeded ${EXPERTS.length} expert profiles`);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  EXPERT NETWORK SEEDER');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');

  const db = getDb();

  if (shouldReset) {
    await clearData(db);
  }

  await seedExpertUsers(db);  // Create user accounts first
  await seedExperts(db);      // Then create expert profiles with userId link

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ✅ EXPERT SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Experts: ${EXPERTS.length}`);
  console.log(`  Expert User Accounts: ${EXPERTS.length}`);
  console.log(`  Top Voices: ${EXPERTS.filter(e => e.isTopVoice).length}`);
  console.log(`  Online Now: ${EXPERTS.filter(e => e.availability === 'online').length}`);
  console.log('');
  console.log('  Expert credentials (all use password: expert123):');
  EXPERTS.forEach(e => {
    console.log(`    - ${e.email} (${e.name})`);
  });
  console.log('');
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
