/**
 * Organization Seeder
 *
 * Seeds additional organization data (teams, roles) beyond what seed-demo creates.
 * This is useful for testing organization features independently.
 *
 * Note: seed-demo.ts already creates the core demo organization.
 * This script adds extra teams and members for more comprehensive testing.
 *
 * Usage:
 *   npx tsx scripts/seed-organization.ts          # Seed additional org data
 *   npx tsx scripts/seed-organization.ts --reset  # Clear extra data and reseed
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
  users,
  profiles,
  companies,
  teams,
  teamMemberships,
} from '../src/db/schema.js';

// ══════════════════════════════════════════════════════════════════
// STABLE UUIDs (deterministic for idempotency)
// These extend the IDs from seed-demo.ts
// ══════════════════════════════════════════════════════════════════

// Reference to existing demo company ID
const DEMO_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440001';

// Additional team IDs
const EXTRA_TEAM_IDS = {
  logistics: '550e8400-e29b-41d4-a716-446655440022',
  itProcurement: '550e8400-e29b-41d4-a716-446655440023',
  marketingServices: '550e8400-e29b-41d4-a716-446655440024',
};

// Additional user IDs
const EXTRA_USER_IDS = {
  logisticsManager: '550e8400-e29b-41d4-a716-446655440014',
  logisticsAnalyst: '550e8400-e29b-41d4-a716-446655440015',
  itBuyer: '550e8400-e29b-41d4-a716-446655440016',
  marketingManager: '550e8400-e29b-41d4-a716-446655440017',
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

const EXTRA_TEAMS = [
  {
    id: EXTRA_TEAM_IDS.logistics,
    companyId: DEMO_COMPANY_ID,
    name: 'Logistics',
    slug: 'logistics',
  },
  {
    id: EXTRA_TEAM_IDS.itProcurement,
    companyId: DEMO_COMPANY_ID,
    name: 'IT Procurement',
    slug: 'it-procurement',
  },
  {
    id: EXTRA_TEAM_IDS.marketingServices,
    companyId: DEMO_COMPANY_ID,
    name: 'Marketing Services',
    slug: 'marketing-services',
  },
];

const EXTRA_USERS = [
  {
    id: EXTRA_USER_IDS.logisticsManager,
    email: 'logistics.manager@acme-demo.com',
    displayName: 'Tom Richards',
    title: 'Logistics Manager',
    department: 'Logistics',
    teamId: EXTRA_TEAM_IDS.logistics,
    role: 'approver',
  },
  {
    id: EXTRA_USER_IDS.logisticsAnalyst,
    email: 'logistics.analyst@acme-demo.com',
    displayName: 'Nina Patel',
    title: 'Logistics Analyst',
    department: 'Logistics',
    teamId: EXTRA_TEAM_IDS.logistics,
    role: 'member',
  },
  {
    id: EXTRA_USER_IDS.itBuyer,
    email: 'it.buyer@acme-demo.com',
    displayName: 'Marcus Lee',
    title: 'IT Procurement Specialist',
    department: 'IT',
    teamId: EXTRA_TEAM_IDS.itProcurement,
    role: 'member',
  },
  {
    id: EXTRA_USER_IDS.marketingManager,
    email: 'marketing.mgr@acme-demo.com',
    displayName: 'Sophie Adams',
    title: 'Marketing Services Manager',
    department: 'Marketing',
    teamId: EXTRA_TEAM_IDS.marketingServices,
    role: 'approver',
  },
];

// ══════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function clearData(db: ReturnType<typeof getDb>) {
  console.log('🗑️  Clearing extra organization data...');

  // Delete in order of dependencies
  await db.delete(teamMemberships).where(
    inArray(teamMemberships.teamId, Object.values(EXTRA_TEAM_IDS))
  );
  await db.delete(profiles).where(
    inArray(profiles.userId, Object.values(EXTRA_USER_IDS))
  );
  await db.delete(users).where(
    inArray(users.id, Object.values(EXTRA_USER_IDS))
  );
  await db.delete(teams).where(
    inArray(teams.id, Object.values(EXTRA_TEAM_IDS))
  );

  console.log('✅ Cleared extra organization data');
}

async function seedTeams(db: ReturnType<typeof getDb>) {
  console.log('🏢 Seeding additional teams...');

  for (const team of EXTRA_TEAMS) {
    await db.insert(teams).values(team).onConflictDoUpdate({
      target: teams.id,
      set: {
        name: team.name,
        slug: team.slug,
      },
    });
  }

  console.log(`✅ Seeded ${EXTRA_TEAMS.length} teams`);
}

async function seedUsers(db: ReturnType<typeof getDb>) {
  console.log('👥 Seeding additional users...');

  const passwordHash = await bcrypt.hash('demo123', 10);

  for (const userData of EXTRA_USERS) {
    // Create user
    await db.insert(users).values({
      id: userData.id,
      email: userData.email,
      passwordHash,
      emailVerifiedAt: new Date(),
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        email: userData.email,
        emailVerifiedAt: new Date(),
      },
    });

    // Create profile
    await db.insert(profiles).values({
      userId: userData.id,
      displayName: userData.displayName,
      title: userData.title,
      department: userData.department,
      company: 'ACME Manufacturing',
    }).onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: userData.displayName,
        title: userData.title,
        department: userData.department,
      },
    });

    // Create team membership
    await db.insert(teamMemberships).values({
      teamId: userData.teamId,
      userId: userData.id,
      role: userData.role,
    }).onConflictDoNothing();
  }

  console.log(`✅ Seeded ${EXTRA_USERS.length} users with profiles and memberships`);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ORGANIZATION SEEDER (Extended)');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  ℹ️  This extends the data from seed-demo.ts');
  console.log('  ℹ️  Run seed-demo.ts first if base data is missing');
  console.log('');

  const db = getDb();

  if (shouldReset) {
    await clearData(db);
  }

  await seedTeams(db);
  await seedUsers(db);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ✅ ORGANIZATION SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Additional Teams: ${EXTRA_TEAMS.length}`);
  console.log(`  Additional Users: ${EXTRA_USERS.length}`);
  console.log('');
  console.log('  User credentials (all use password: demo123):');
  EXTRA_USERS.forEach(u => {
    console.log(`    - ${u.email} (${u.role})`);
  });
  console.log('');
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
