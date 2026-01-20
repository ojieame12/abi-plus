/**
 * Demo Database Seeder
 *
 * Creates a complete demo environment with realistic data for stakeholder demos.
 * All entities use stable UUIDs for idempotency.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts          # Seed (idempotent)
 *   npx tsx scripts/seed-demo.ts --reset  # Clear demo data and reseed
 *
 * Requires:
 *   DATABASE_URL environment variable
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, inArray } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import {
  users,
  profiles,
  companies,
  teams,
  teamMemberships,
  creditAccounts,
  ledgerEntries,
  creditHolds,
  approvalRequests,
  approvalEvents,
  approvalRules,
} from '../src/db/schema.js';

// ══════════════════════════════════════════════════════════════════
// STABLE UUIDs (deterministic for idempotency)
// ══════════════════════════════════════════════════════════════════

const DEMO_IDS = {
  company: '550e8400-e29b-41d4-a716-446655440001',

  users: {
    admin: '550e8400-e29b-41d4-a716-446655440010',
    approver: '550e8400-e29b-41d4-a716-446655440011',
    member: '550e8400-e29b-41d4-a716-446655440012',
    member2: '550e8400-e29b-41d4-a716-446655440013',
  },

  teams: {
    directMaterials: '550e8400-e29b-41d4-a716-446655440020',
    indirectProcurement: '550e8400-e29b-41d4-a716-446655440021',
  },

  creditAccount: '550e8400-e29b-41d4-a716-446655440030',

  requests: {
    pending1: '550e8400-e29b-41d4-a716-446655440040',
    pending2: '550e8400-e29b-41d4-a716-446655440041',
    approved: '550e8400-e29b-41d4-a716-446655440042',
    fulfilled: '550e8400-e29b-41d4-a716-446655440043',
    cancelled: '550e8400-e29b-41d4-a716-446655440044',
    denied: '550e8400-e29b-41d4-a716-446655440045',
  },

  holds: {
    pending1: '550e8400-e29b-41d4-a716-446655440050',
    pending2: '550e8400-e29b-41d4-a716-446655440051',
    approved: '550e8400-e29b-41d4-a716-446655440052',
    fulfilled: '550e8400-e29b-41d4-a716-446655440053',
    cancelled: '550e8400-e29b-41d4-a716-446655440054',
    denied: '550e8400-e29b-41d4-a716-446655440055',
  },

  ledgerEntries: {
    initial: '550e8400-e29b-41d4-a716-446655440060',
    fulfilled: '550e8400-e29b-41d4-a716-446655440061',
    historicalSpend1: '550e8400-e29b-41d4-a716-446655440062',
    historicalSpend2: '550e8400-e29b-41d4-a716-446655440063',
    approvedConversion: '550e8400-e29b-41d4-a716-446655440064', // Debit for approved request
  },

  approvalRules: {
    auto: '550e8400-e29b-41d4-a716-446655440070',
    approver: '550e8400-e29b-41d4-a716-446655440071',
    admin: '550e8400-e29b-41d4-a716-446655440072',
  },

  // Events - stable IDs for idempotency (format: request_eventtype)
  events: {
    pending1_submitted: '550e8400-e29b-41d4-a716-446655440080',
    pending2_submitted: '550e8400-e29b-41d4-a716-446655440081',
    approved_submitted: '550e8400-e29b-41d4-a716-446655440082',
    approved_approved: '550e8400-e29b-41d4-a716-446655440083',
    fulfilled_submitted: '550e8400-e29b-41d4-a716-446655440084',
    fulfilled_approved: '550e8400-e29b-41d4-a716-446655440085',
    fulfilled_fulfilled: '550e8400-e29b-41d4-a716-446655440086',
    cancelled_submitted: '550e8400-e29b-41d4-a716-446655440087',
    cancelled_cancelled: '550e8400-e29b-41d4-a716-446655440088',
    denied_submitted: '550e8400-e29b-41d4-a716-446655440089',
    denied_denied: '550e8400-e29b-41d4-a716-446655440090',
  },
};

// ══════════════════════════════════════════════════════════════════
// DEMO DATA - Realistic company in manufacturing/procurement
// ══════════════════════════════════════════════════════════════════

const DEMO_COMPANY = {
  id: DEMO_IDS.company,
  name: 'Nexus Industries',
  slug: 'nexus-industries',
};

const DEMO_USERS_DATA = [
  {
    id: DEMO_IDS.users.admin,
    email: 'sarah.chen@nexus-demo.com',
    displayName: 'Sarah Chen',
    username: 'sarahchen',
    title: 'VP of Procurement',
    bio: '20+ years in strategic sourcing. Leading procurement transformation at Nexus.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
  },
  {
    id: DEMO_IDS.users.approver,
    email: 'michael.torres@nexus-demo.com',
    displayName: 'Michael Torres',
    username: 'mtorres',
    title: 'Director, Strategic Sourcing',
    bio: 'Supply chain specialist with focus on automotive and industrial materials.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'approver',
  },
  {
    id: DEMO_IDS.users.member,
    email: 'emily.watson@nexus-demo.com',
    displayName: 'Emily Watson',
    username: 'ewatson',
    title: 'Category Manager, Raw Materials',
    bio: 'Focused on metals and polymers sourcing for manufacturing.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    role: 'member',
  },
  {
    id: DEMO_IDS.users.member2,
    email: 'james.park@nexus-demo.com',
    displayName: 'James Park',
    username: 'jpark',
    title: 'Procurement Analyst',
    bio: 'Data-driven approach to supplier analysis and cost optimization.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    role: 'member',
  },
];

const DEMO_TEAMS_DATA = [
  {
    id: DEMO_IDS.teams.directMaterials,
    name: 'Direct Materials',
    slug: 'direct-materials',
    companyId: DEMO_IDS.company,
  },
  {
    id: DEMO_IDS.teams.indirectProcurement,
    name: 'Indirect Procurement',
    slug: 'indirect-procurement',
    companyId: DEMO_IDS.company,
  },
];

// Team membership mapping
const DEMO_MEMBERSHIPS = [
  // Direct Materials team
  { teamId: DEMO_IDS.teams.directMaterials, userId: DEMO_IDS.users.admin, role: 'admin' },
  { teamId: DEMO_IDS.teams.directMaterials, userId: DEMO_IDS.users.approver, role: 'approver' },
  { teamId: DEMO_IDS.teams.directMaterials, userId: DEMO_IDS.users.member, role: 'member' },
  // Indirect Procurement team
  { teamId: DEMO_IDS.teams.indirectProcurement, userId: DEMO_IDS.users.admin, role: 'admin' },
  { teamId: DEMO_IDS.teams.indirectProcurement, userId: DEMO_IDS.users.member2, role: 'member' },
];

// Credit configuration
const CREDIT_CONFIG = {
  subscriptionTier: 'enterprise',
  totalCredits: 50000,
  bonusCredits: 5000,
  // Historical spend to make it look realistic
  historicalSpend: 3500,
};

// Seeded requests for demo scenarios
const DEMO_REQUESTS = [
  {
    id: DEMO_IDS.requests.pending1,
    type: 'report_upgrade' as const,
    status: 'pending' as const,
    title: 'Steel Market Analysis Q1 2026',
    description: 'Need comprehensive analysis of global steel pricing trends for upcoming supplier negotiations with ArcelorMittal and Nippon Steel.',
    estimatedCredits: 2000,
    requesterId: DEMO_IDS.users.member,
    currentApproverId: DEMO_IDS.users.approver,
    approvalLevel: 'approver' as const,
    holdId: DEMO_IDS.holds.pending1,
    submittedEventId: DEMO_IDS.events.pending1_submitted,
  },
  {
    id: DEMO_IDS.requests.pending2,
    type: 'analyst_call' as const,
    status: 'pending' as const,
    title: 'Aluminum Supply Chain Consultation',
    description: 'Quick consultation on Southeast Asia aluminum sourcing risks and alternative suppliers.',
    estimatedCredits: 750,
    requesterId: DEMO_IDS.users.member,
    currentApproverId: DEMO_IDS.users.approver,
    approvalLevel: 'approver' as const,
    holdId: DEMO_IDS.holds.pending2,
    submittedEventId: DEMO_IDS.events.pending2_submitted,
  },
  {
    id: DEMO_IDS.requests.approved,
    type: 'expert_deepdive' as const,
    status: 'approved' as const,
    title: 'Copper Futures Strategy Session',
    description: 'Deep dive with commodities expert on hedging strategies for Q2-Q3 copper requirements.',
    estimatedCredits: 3500,
    requesterId: DEMO_IDS.users.member2,
    currentApproverId: null,
    decidedBy: DEMO_IDS.users.approver,
    approvalLevel: 'admin' as const,
    holdId: DEMO_IDS.holds.approved,
    decisionReason: 'Approved - critical for upcoming budget planning cycle.',
    submittedEventId: DEMO_IDS.events.approved_submitted,
    decisionEventId: DEMO_IDS.events.approved_approved,
  },
  {
    id: DEMO_IDS.requests.fulfilled,
    type: 'report_upgrade' as const,
    status: 'fulfilled' as const,
    title: 'Polymer Market Intelligence Report',
    description: 'Upgraded market report with supplier benchmarking and price forecasts.',
    estimatedCredits: 1500,
    actualCredits: 1500,
    requesterId: DEMO_IDS.users.member,
    decidedBy: DEMO_IDS.users.admin,
    approvalLevel: 'approver' as const,
    holdId: DEMO_IDS.holds.fulfilled,
    decisionReason: 'Good value for the insights provided.',
    submittedEventId: DEMO_IDS.events.fulfilled_submitted,
    decisionEventId: DEMO_IDS.events.fulfilled_fulfilled,
  },
  {
    id: DEMO_IDS.requests.cancelled,
    type: 'expert_consult' as const,
    status: 'cancelled' as const,
    title: 'Logistics Cost Optimization Review',
    description: 'Consultation on freight and logistics cost reduction strategies.',
    estimatedCredits: 800,
    requesterId: DEMO_IDS.users.member2,
    approvalLevel: 'approver' as const,
    holdId: DEMO_IDS.holds.cancelled,
    submittedEventId: DEMO_IDS.events.cancelled_submitted,
    decisionEventId: DEMO_IDS.events.cancelled_cancelled,
  },
  {
    id: DEMO_IDS.requests.denied,
    type: 'bespoke_project' as const,
    status: 'denied' as const,
    title: 'Custom Supplier Risk Assessment',
    description: 'Bespoke risk assessment for Tier 2 suppliers in Eastern Europe.',
    estimatedCredits: 5000,
    requesterId: DEMO_IDS.users.member,
    decidedBy: DEMO_IDS.users.admin,
    approvalLevel: 'admin' as const,
    submittedEventId: DEMO_IDS.events.denied_submitted,
    decisionEventId: DEMO_IDS.events.denied_denied,
    holdId: DEMO_IDS.holds.denied,
    decisionReason: 'Budget constraints - defer to Q2. Consider standard report as alternative.',
  },
];

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
// SEED FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function clearDemoData(db: ReturnType<typeof getDb>) {
  console.log('🗑️  Clearing existing demo data...');

  const userIds = Object.values(DEMO_IDS.users);
  const requestIds = Object.values(DEMO_IDS.requests);
  const holdIds = Object.values(DEMO_IDS.holds);
  const eventIds = Object.values(DEMO_IDS.events);
  const demoUsernames = DEMO_USERS_DATA.map(u => u.username);

  // Delete in reverse order of dependencies
  // Clear events by both requestId AND stable event IDs for complete cleanup
  await db.delete(approvalEvents).where(inArray(approvalEvents.requestId, requestIds));
  await db.delete(approvalEvents).where(inArray(approvalEvents.id, eventIds));
  await db.delete(creditHolds).where(inArray(creditHolds.id, holdIds));
  await db.delete(approvalRequests).where(inArray(approvalRequests.id, requestIds));
  await db.delete(ledgerEntries).where(eq(ledgerEntries.accountId, DEMO_IDS.creditAccount));
  await db.delete(approvalRules).where(eq(approvalRules.companyId, DEMO_IDS.company));
  await db.delete(creditAccounts).where(eq(creditAccounts.id, DEMO_IDS.creditAccount));
  await db.delete(teamMemberships).where(inArray(teamMemberships.userId, userIds));
  await db.delete(teams).where(eq(teams.companyId, DEMO_IDS.company));
  // Clear profiles by userId AND by username (to handle username conflicts)
  await db.delete(profiles).where(inArray(profiles.userId, userIds));
  await db.delete(profiles).where(inArray(profiles.username, demoUsernames));
  await db.delete(users).where(inArray(users.id, userIds));
  await db.delete(companies).where(eq(companies.id, DEMO_IDS.company));

  console.log('✅ Demo data cleared');
}

async function seedUsers(db: ReturnType<typeof getDb>) {
  console.log('👥 Seeding users and profiles...');

  const demoPassword = await bcrypt.hash('demo123', 10);

  for (const userData of DEMO_USERS_DATA) {
    // Upsert user
    await db.insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        passwordHash: demoPassword,
        emailVerifiedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: userData.email, updatedAt: new Date() },
      });

    // Upsert profile
    await db.insert(profiles)
      .values({
        userId: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        reputation: Math.floor(Math.random() * 1000) + 500,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          displayName: userData.displayName,
          bio: userData.bio,
          avatarUrl: userData.avatarUrl,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`✅ Seeded ${DEMO_USERS_DATA.length} users`);
}

async function seedCompanyAndTeams(db: ReturnType<typeof getDb>) {
  console.log('🏢 Seeding company and teams...');

  // Upsert company
  await db.insert(companies)
    .values(DEMO_COMPANY)
    .onConflictDoUpdate({
      target: companies.id,
      set: { name: DEMO_COMPANY.name, updatedAt: new Date() },
    });

  // Upsert teams
  for (const team of DEMO_TEAMS_DATA) {
    await db.insert(teams)
      .values(team)
      .onConflictDoUpdate({
        target: teams.id,
        set: { name: team.name, updatedAt: new Date() },
      });
  }

  // Upsert memberships
  for (const membership of DEMO_MEMBERSHIPS) {
    await db.insert(teamMemberships)
      .values(membership)
      .onConflictDoNothing();
  }

  console.log(`✅ Seeded company with ${DEMO_TEAMS_DATA.length} teams`);
}

async function seedCredits(db: ReturnType<typeof getDb>) {
  console.log('💳 Seeding credit account and ledger...');

  const now = new Date();
  const subscriptionStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const subscriptionEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Upsert credit account
  await db.insert(creditAccounts)
    .values({
      id: DEMO_IDS.creditAccount,
      companyId: DEMO_IDS.company,
      subscriptionTier: CREDIT_CONFIG.subscriptionTier,
      subscriptionStart,
      subscriptionEnd,
      totalCredits: CREDIT_CONFIG.totalCredits,
      bonusCredits: CREDIT_CONFIG.bonusCredits,
    })
    .onConflictDoUpdate({
      target: creditAccounts.id,
      set: {
        totalCredits: CREDIT_CONFIG.totalCredits,
        bonusCredits: CREDIT_CONFIG.bonusCredits,
        updatedAt: new Date(),
      },
    });

  // NOTE: We don't create an allocation ledger entry because the account's
  // totalCredits + bonusCredits fields already track the base allocation.
  // The balance formula is: totalCredits + bonusCredits + ledgerCredits - ledgerDebits - holds
  // Adding an allocation entry would double-count the credits.

  // Historical spend entries for realism
  await db.insert(ledgerEntries)
    .values({
      id: DEMO_IDS.ledgerEntries.historicalSpend1,
      accountId: DEMO_IDS.creditAccount,
      entryType: 'debit',
      amount: 2000,
      transactionType: 'spend',
      referenceType: 'request',
      description: 'Market Intelligence: Rare Earth Elements Report',
      performedBy: DEMO_IDS.users.member,
      idempotencyKey: `spend_historical_1`,
    })
    .onConflictDoNothing();

  await db.insert(ledgerEntries)
    .values({
      id: DEMO_IDS.ledgerEntries.historicalSpend2,
      accountId: DEMO_IDS.creditAccount,
      entryType: 'debit',
      amount: 1500,
      transactionType: 'hold_conversion',
      referenceType: 'request',
      referenceId: DEMO_IDS.requests.fulfilled,
      description: 'Approved: Polymer Market Intelligence Report',
      performedBy: DEMO_IDS.users.admin,
      idempotencyKey: `hold_convert_${DEMO_IDS.holds.fulfilled}`,
    })
    .onConflictDoNothing();

  // Ledger debit for the approved request (hold converted on approval)
  await db.insert(ledgerEntries)
    .values({
      id: DEMO_IDS.ledgerEntries.approvedConversion,
      accountId: DEMO_IDS.creditAccount,
      entryType: 'debit',
      amount: 3500, // Matches approved request estimatedCredits
      transactionType: 'hold_conversion',
      referenceType: 'request',
      referenceId: DEMO_IDS.requests.approved,
      description: 'Approved: Copper Futures Strategy Session',
      performedBy: DEMO_IDS.users.approver,
      idempotencyKey: `hold_convert_${DEMO_IDS.holds.approved}`,
    })
    .onConflictDoNothing();

  console.log('✅ Seeded credit account with ledger entries');
}

async function seedApprovalRules(db: ReturnType<typeof getDb>) {
  console.log('📋 Seeding approval rules...');

  const rules = [
    {
      id: DEMO_IDS.approvalRules.auto,
      companyId: DEMO_IDS.company,
      minCredits: 0,
      maxCredits: 500,
      approverRole: 'auto' as const,
      escalationHours: null,
      priority: 0,
    },
    {
      id: DEMO_IDS.approvalRules.approver,
      companyId: DEMO_IDS.company,
      minCredits: 500,
      maxCredits: 2000, // Aligned with frontend APPROVAL_THRESHOLDS.approverLimit
      approverRole: 'approver' as const,
      escalationHours: 48,
      priority: 1,
    },
    {
      id: DEMO_IDS.approvalRules.admin,
      companyId: DEMO_IDS.company,
      minCredits: 2000, // Aligned with frontend APPROVAL_THRESHOLDS.adminRequired
      maxCredits: null,
      approverRole: 'admin' as const,
      escalationHours: 24,
      priority: 2,
    },
  ];

  for (const rule of rules) {
    await db.insert(approvalRules)
      .values(rule)
      .onConflictDoUpdate({
        target: approvalRules.id,
        set: {
          minCredits: rule.minCredits,
          maxCredits: rule.maxCredits,
          approverRole: rule.approverRole,
          updatedAt: new Date(),
        },
      });
  }

  console.log('✅ Seeded approval rules');
}

async function seedRequests(db: ReturnType<typeof getDb>) {
  console.log('📝 Seeding approval requests...');

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  for (const reqData of DEMO_REQUESTS) {
    const createdAt = reqData.status === 'pending' ? twoDaysAgo :
                      reqData.status === 'approved' ? oneWeekAgo : twoWeeksAgo;

    const expiresAt = reqData.status === 'pending'
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      : null;

    // Insert request
    await db.insert(approvalRequests)
      .values({
        id: reqData.id,
        companyId: DEMO_IDS.company,
        teamId: DEMO_IDS.teams.directMaterials,
        requesterId: reqData.requesterId,
        requestType: reqData.type,
        status: reqData.status,
        title: reqData.title,
        description: reqData.description,
        estimatedCredits: reqData.estimatedCredits,
        actualCredits: reqData.actualCredits,
        currentApproverId: reqData.currentApproverId,
        approvalLevel: reqData.approvalLevel,
        decidedBy: reqData.decidedBy,
        decisionReason: reqData.decisionReason,
        submittedAt: createdAt,
        decidedAt: reqData.status !== 'pending' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null,
        fulfilledAt: reqData.status === 'fulfilled' ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000) : null,
        expiresAt,
        createdAt,
      })
      .onConflictDoUpdate({
        target: approvalRequests.id,
        set: {
          status: reqData.status,
          title: reqData.title,
          updatedAt: new Date(),
        },
      });

    // Create corresponding hold
    let holdStatus: 'active' | 'converted' | 'released' = 'active';
    if (reqData.status === 'approved' || reqData.status === 'fulfilled') {
      holdStatus = 'converted';
    } else if (reqData.status === 'denied' || reqData.status === 'cancelled') {
      holdStatus = 'released';
    }

    if (reqData.holdId) {
      await db.insert(creditHolds)
        .values({
          id: reqData.holdId,
          accountId: DEMO_IDS.creditAccount,
          requestId: reqData.id,
          amount: reqData.estimatedCredits,
          status: holdStatus,
          releasedAt: holdStatus === 'released' ? new Date() : null,
          convertedAt: holdStatus === 'converted' ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: creditHolds.id,
          set: { status: holdStatus },
        });
    }

    // Create submission event with stable ID
    // Use onConflictDoNothing since we just need idempotency, not updates
    await db.insert(approvalEvents)
      .values({
        id: reqData.submittedEventId,
        requestId: reqData.id,
        eventType: 'submitted',
        performedBy: reqData.requesterId,
        performedBySystem: false,
        toStatus: 'pending',
        metadata: { estimatedCredits: reqData.estimatedCredits },
        createdAt,
      })
      .onConflictDoNothing();

    // Create decision event if applicable (with stable ID)
    if (reqData.status !== 'pending' && reqData.decisionEventId) {
      const eventType = reqData.status === 'cancelled' ? 'cancelled' :
                        reqData.status === 'denied' ? 'denied' :
                        reqData.status === 'fulfilled' ? 'fulfilled' : 'approved';

      await db.insert(approvalEvents)
        .values({
          id: reqData.decisionEventId,
          requestId: reqData.id,
          eventType,
          performedBy: reqData.decidedBy || reqData.requesterId,
          performedBySystem: false,
          fromStatus: 'pending',
          toStatus: reqData.status,
          reason: reqData.decisionReason,
          createdAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing();
    }
  }

  console.log(`✅ Seeded ${DEMO_REQUESTS.length} approval requests`);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ABI Plus Demo Seeder');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const db = getDb();

  if (shouldReset) {
    await clearDemoData(db);
    console.log('');
  }

  await seedUsers(db);
  await seedCompanyAndTeams(db);
  await seedCredits(db);
  await seedApprovalRules(db);
  await seedRequests(db);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ Demo seeding complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  Demo Users:');
  console.log('  ───────────────────────────────────────────────────────');
  for (const user of DEMO_USERS_DATA) {
    console.log(`  ${user.role.padEnd(10)} │ ${user.displayName.padEnd(20)} │ ${user.email}`);
  }
  console.log('');
  console.log('  Company: Nexus Industries');
  console.log('  Credits: 50,000 base + 5,000 bonus');
  console.log('  Requests: 2 pending, 1 approved, 1 fulfilled, 1 cancelled, 1 denied');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

// Export IDs for use in demo-login endpoint
export { DEMO_IDS, DEMO_USERS_DATA, DEMO_COMPANY };
