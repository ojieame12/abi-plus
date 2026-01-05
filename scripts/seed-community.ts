// Seed script for Community Q&A - Badges and Tags
// Run with: npx tsx scripts/seed-community.ts

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { tags } from '../src/db/schema';
import { seedBadges } from '../src/services/badgeService';

// Initial tags for procurement community
const INITIAL_TAGS = [
  { name: 'Sourcing', slug: 'sourcing', description: 'Strategic sourcing and supplier selection' },
  { name: 'Contracts', slug: 'contracts', description: 'Contract negotiation and management' },
  { name: 'Risk Management', slug: 'risk', description: 'Supplier and supply chain risk' },
  { name: 'Compliance', slug: 'compliance', description: 'Regulatory and policy compliance' },
  { name: 'Category Management', slug: 'category', description: 'Category strategy and spend analysis' },
  { name: 'Supplier Relationships', slug: 'suppliers', description: 'SRM and supplier development' },
  { name: 'Technology', slug: 'technology', description: 'Procurement technology and tools' },
  { name: 'Sustainability', slug: 'sustainability', description: 'ESG and sustainable procurement' },
  { name: 'Cost Reduction', slug: 'cost', description: 'Cost savings and value creation' },
  { name: 'Negotiations', slug: 'negotiations', description: 'Negotiation tactics and strategies' },
  { name: 'RFx Process', slug: 'rfx', description: 'RFI, RFP, RFQ processes' },
  { name: 'Best Practices', slug: 'best-practices', description: 'Industry standards and benchmarks' },
];

async function main() {
  console.log('🌱 Starting community seed...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Seed badges
  console.log('📛 Seeding badges...');
  try {
    await seedBadges(db);
    console.log('   ✓ Badges seeded successfully\n');
  } catch (error) {
    console.error('   ✗ Failed to seed badges:', error);
  }

  // Seed tags
  console.log('🏷️  Seeding tags...');
  try {
    for (const tag of INITIAL_TAGS) {
      await db
        .insert(tags)
        .values({
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          questionCount: 0,
        })
        .onConflictDoUpdate({
          target: tags.slug,
          set: {
            name: tag.name,
            description: tag.description,
          },
        });
      console.log(`   ✓ ${tag.name}`);
    }
    console.log('\n   ✓ Tags seeded successfully\n');
  } catch (error) {
    console.error('   ✗ Failed to seed tags:', error);
  }

  console.log('✅ Community seed complete!');
}

main().catch(console.error);
