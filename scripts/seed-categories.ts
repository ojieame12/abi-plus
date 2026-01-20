/**
 * Category Domains and Managed Categories Seeder
 *
 * Seeds category domains and managed categories for the slot management system.
 *
 * Usage:
 *   npx tsx scripts/seed-categories.ts          # Seed (idempotent)
 *   npx tsx scripts/seed-categories.ts --reset  # Clear and reseed
 *
 * Requires:
 *   DATABASE_URL environment variable
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import {
  categoryDomains,
  managedCategories,
  activatedCategories,
} from '../src/db/schema.js';

// ══════════════════════════════════════════════════════════════════
// STABLE UUIDs (deterministic for idempotency)
// ══════════════════════════════════════════════════════════════════

const DOMAIN_IDS = {
  rawMaterials: '660e8400-e29b-41d4-a716-446655440001',
  packaging: '660e8400-e29b-41d4-a716-446655440002',
  logistics: '660e8400-e29b-41d4-a716-446655440003',
  services: '660e8400-e29b-41d4-a716-446655440004',
  energy: '660e8400-e29b-41d4-a716-446655440005',
  chemicals: '660e8400-e29b-41d4-a716-446655440006',
  manufacturing: '660e8400-e29b-41d4-a716-446655440007',
  it: '660e8400-e29b-41d4-a716-446655440008',
};

const CATEGORY_IDS = {
  steel: '660e8400-e29b-41d4-a716-446655440010',
  aluminum: '660e8400-e29b-41d4-a716-446655440011',
  copper: '660e8400-e29b-41d4-a716-446655440012',
  plasticResins: '660e8400-e29b-41d4-a716-446655440013',
  corrugatedPackaging: '660e8400-e29b-41d4-a716-446655440014',
  flexiblePackaging: '660e8400-e29b-41d4-a716-446655440015',
  oceanFreight: '660e8400-e29b-41d4-a716-446655440016',
  airFreight: '660e8400-e29b-41d4-a716-446655440017',
  truckingFTL: '660e8400-e29b-41d4-a716-446655440018',
  naturalGas: '660e8400-e29b-41d4-a716-446655440019',
  electricity: '660e8400-e29b-41d4-a716-446655440020',
  industrialChemicals: '660e8400-e29b-41d4-a716-446655440021',
  lubricants: '660e8400-e29b-41d4-a716-446655440022',
  mro: '660e8400-e29b-41d4-a716-446655440023',
  cloudServices: '660e8400-e29b-41d4-a716-446655440024',
  lithium: '660e8400-e29b-41d4-a716-446655440025',
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

const DOMAINS = [
  { id: DOMAIN_IDS.rawMaterials, name: 'Raw Materials', slug: 'raw-materials', icon: '🔩', color: '#3B82F6', categoryCount: 4 },
  { id: DOMAIN_IDS.packaging, name: 'Packaging', slug: 'packaging', icon: '📦', color: '#10B981', categoryCount: 2 },
  { id: DOMAIN_IDS.logistics, name: 'Logistics', slug: 'logistics', icon: '🚚', color: '#F59E0B', categoryCount: 3 },
  { id: DOMAIN_IDS.services, name: 'Services', slug: 'services', icon: '🛠️', color: '#8B5CF6', categoryCount: 1 },
  { id: DOMAIN_IDS.energy, name: 'Energy', slug: 'energy', icon: '⚡', color: '#EF4444', categoryCount: 2 },
  { id: DOMAIN_IDS.chemicals, name: 'Chemicals', slug: 'chemicals', icon: '🧪', color: '#06B6D4', categoryCount: 2 },
  { id: DOMAIN_IDS.manufacturing, name: 'Manufacturing', slug: 'manufacturing', icon: '🏭', color: '#6366F1', categoryCount: 1 },
  { id: DOMAIN_IDS.it, name: 'IT & Technology', slug: 'it-technology', icon: '💻', color: '#EC4899', categoryCount: 1 },
];

const CATEGORIES = [
  // Raw Materials
  {
    id: CATEGORY_IDS.steel,
    name: 'Steel',
    slug: 'steel',
    domainId: DOMAIN_IDS.rawMaterials,
    subDomain: 'Metals',
    description: 'Comprehensive steel market intelligence covering hot-rolled, cold-rolled, and stainless steel.',
    leadAnalystName: 'James Mitchell',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 342,
    isPopular: true,
  },
  {
    id: CATEGORY_IDS.aluminum,
    name: 'Aluminum',
    slug: 'aluminum',
    domainId: DOMAIN_IDS.rawMaterials,
    subDomain: 'Metals',
    description: 'Aluminum market trends, LME prices, and regional supply analysis.',
    leadAnalystName: 'Sarah Chen',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 287,
    isPopular: true,
  },
  {
    id: CATEGORY_IDS.copper,
    name: 'Copper',
    slug: 'copper',
    domainId: DOMAIN_IDS.rawMaterials,
    subDomain: 'Metals',
    description: 'Copper commodity intelligence with focus on EV and renewable energy demand.',
    leadAnalystName: 'Michael Brown',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: false,
    responseTimeSla: '48 hours',
    clientCount: 198,
    isPopular: false,
  },
  {
    id: CATEGORY_IDS.lithium,
    name: 'Lithium',
    slug: 'lithium',
    domainId: DOMAIN_IDS.rawMaterials,
    subDomain: 'Battery Materials',
    description: 'Lithium market intelligence for battery and EV supply chains.',
    leadAnalystName: 'Lisa Wang',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 156,
    isPopular: true,
  },
  // Packaging
  {
    id: CATEGORY_IDS.corrugatedPackaging,
    name: 'Corrugated Packaging',
    slug: 'corrugated-packaging',
    domainId: DOMAIN_IDS.packaging,
    description: 'Corrugated boxes and containerboard market analysis.',
    leadAnalystName: 'Emily Davis',
    leadAnalystPhoto: null,
    updateFrequency: 'monthly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 412,
    isPopular: true,
  },
  {
    id: CATEGORY_IDS.flexiblePackaging,
    name: 'Flexible Packaging',
    slug: 'flexible-packaging',
    domainId: DOMAIN_IDS.packaging,
    description: 'Films, pouches, and flexible materials market coverage.',
    leadAnalystName: 'Robert Kim',
    leadAnalystPhoto: null,
    updateFrequency: 'monthly',
    hasMarketReport: true,
    hasPriceIndex: false,
    hasSupplierData: true,
    responseTimeSla: '48 hours',
    clientCount: 234,
    isPopular: false,
  },
  // Logistics
  {
    id: CATEGORY_IDS.oceanFreight,
    name: 'Ocean Freight',
    slug: 'ocean-freight',
    domainId: DOMAIN_IDS.logistics,
    description: 'Container shipping rates, capacity, and trade lane analysis.',
    leadAnalystName: 'Anna Petrov',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 523,
    isPopular: true,
  },
  {
    id: CATEGORY_IDS.airFreight,
    name: 'Air Freight',
    slug: 'air-freight',
    domainId: DOMAIN_IDS.logistics,
    description: 'Air cargo rates, capacity trends, and e-commerce impact analysis.',
    leadAnalystName: 'Daniel Lee',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: false,
    responseTimeSla: '48 hours',
    clientCount: 189,
    isPopular: false,
  },
  {
    id: CATEGORY_IDS.truckingFTL,
    name: 'Trucking (FTL)',
    slug: 'trucking-ftl',
    domainId: DOMAIN_IDS.logistics,
    description: 'Full truckload market intelligence including driver availability and fuel surcharges.',
    leadAnalystName: 'Maria Garcia',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 367,
    isPopular: false,
  },
  // Energy
  {
    id: CATEGORY_IDS.naturalGas,
    name: 'Natural Gas',
    slug: 'natural-gas',
    domainId: DOMAIN_IDS.energy,
    description: 'Natural gas pricing, storage levels, and regional supply dynamics.',
    leadAnalystName: 'Thomas Anderson',
    leadAnalystPhoto: null,
    updateFrequency: 'daily',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: false,
    responseTimeSla: '4 hours',
    clientCount: 278,
    isPopular: true,
  },
  {
    id: CATEGORY_IDS.electricity,
    name: 'Electricity',
    slug: 'electricity',
    domainId: DOMAIN_IDS.energy,
    description: 'Power market analysis including renewable integration and demand forecasting.',
    leadAnalystName: 'Jennifer Scott',
    leadAnalystPhoto: null,
    updateFrequency: 'daily',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: false,
    responseTimeSla: '4 hours',
    clientCount: 312,
    isPopular: false,
  },
  // Chemicals
  {
    id: CATEGORY_IDS.industrialChemicals,
    name: 'Industrial Chemicals',
    slug: 'industrial-chemicals',
    domainId: DOMAIN_IDS.chemicals,
    description: 'Base chemicals, solvents, and industrial feedstock market coverage.',
    leadAnalystName: 'David Wong',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 245,
    isPopular: false,
  },
  {
    id: CATEGORY_IDS.plasticResins,
    name: 'Plastic Resins',
    slug: 'plastic-resins',
    domainId: DOMAIN_IDS.chemicals,
    subDomain: 'Polymers',
    description: 'PE, PP, PET and other polymer markets with regional pricing.',
    leadAnalystName: 'Rachel Martinez',
    leadAnalystPhoto: null,
    updateFrequency: 'weekly',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
    clientCount: 398,
    isPopular: true,
  },
  // Manufacturing
  {
    id: CATEGORY_IDS.mro,
    name: 'MRO Supplies',
    slug: 'mro-supplies',
    domainId: DOMAIN_IDS.manufacturing,
    description: 'Maintenance, repair, and operations supplies market analysis.',
    leadAnalystName: 'Kevin Taylor',
    leadAnalystPhoto: null,
    updateFrequency: 'monthly',
    hasMarketReport: true,
    hasPriceIndex: false,
    hasSupplierData: true,
    responseTimeSla: '48 hours',
    clientCount: 178,
    isPopular: false,
  },
  // IT
  {
    id: CATEGORY_IDS.cloudServices,
    name: 'Cloud Services',
    slug: 'cloud-services',
    domainId: DOMAIN_IDS.it,
    description: 'Cloud infrastructure, SaaS, and IT services market intelligence.',
    leadAnalystName: 'Amanda Johnson',
    leadAnalystPhoto: null,
    updateFrequency: 'monthly',
    hasMarketReport: true,
    hasPriceIndex: false,
    hasSupplierData: true,
    responseTimeSla: '48 hours',
    clientCount: 456,
    isPopular: true,
  },
];

// ══════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function clearData(db: ReturnType<typeof getDb>) {
  console.log('🗑️  Clearing existing category data...');

  // Delete in order of dependencies
  await db.delete(activatedCategories).where(
    inArray(activatedCategories.categoryId, Object.values(CATEGORY_IDS))
  );
  await db.delete(managedCategories).where(
    inArray(managedCategories.id, Object.values(CATEGORY_IDS))
  );
  await db.delete(categoryDomains).where(
    inArray(categoryDomains.id, Object.values(DOMAIN_IDS))
  );

  console.log('✅ Cleared category data');
}

async function seedDomains(db: ReturnType<typeof getDb>) {
  console.log('📁 Seeding category domains...');

  for (const domain of DOMAINS) {
    await db.insert(categoryDomains).values(domain).onConflictDoUpdate({
      target: categoryDomains.id,
      set: {
        name: domain.name,
        slug: domain.slug,
        icon: domain.icon,
        color: domain.color,
        categoryCount: domain.categoryCount,
      },
    });
  }

  console.log(`✅ Seeded ${DOMAINS.length} domains`);
}

async function seedCategories(db: ReturnType<typeof getDb>) {
  console.log('📋 Seeding managed categories...');

  for (const category of CATEGORIES) {
    await db.insert(managedCategories).values(category).onConflictDoUpdate({
      target: managedCategories.id,
      set: {
        name: category.name,
        slug: category.slug,
        domainId: category.domainId,
        subDomain: category.subDomain,
        description: category.description,
        leadAnalystName: category.leadAnalystName,
        leadAnalystPhoto: category.leadAnalystPhoto,
        updateFrequency: category.updateFrequency,
        hasMarketReport: category.hasMarketReport,
        hasPriceIndex: category.hasPriceIndex,
        hasSupplierData: category.hasSupplierData,
        responseTimeSla: category.responseTimeSla,
        clientCount: category.clientCount,
        isPopular: category.isPopular,
      },
    });
  }

  console.log(`✅ Seeded ${CATEGORIES.length} categories`);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  CATEGORY SEEDER');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');

  const db = getDb();

  if (shouldReset) {
    await clearData(db);
  }

  await seedDomains(db);
  await seedCategories(db);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ✅ CATEGORY SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Domains: ${DOMAINS.length}`);
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log('');
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
