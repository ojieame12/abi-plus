// Test utilities for Credit Ledger tests
import type { AuthContext } from '../../api/_middleware/auth';
import type {
  CreditAccount,
  LedgerEntry,
  CreditHold,
  Company,
  Team,
  TeamMembership,
} from '../db/schema';

// ══════════════════════════════════════════════════════════════════
// TEST DATA FACTORIES
// ══════════════════════════════════════════════════════════════════

let idCounter = 0;

export function resetCreditTestCounters() {
  idCounter = 0;
}

// ══════════════════════════════════════════════════════════════════
// LINKED ENTITY CREATION
// ══════════════════════════════════════════════════════════════════

/**
 * Context for creating linked test entities with consistent IDs
 */
export interface TestEntityContext {
  companyId: string;
  teamId: string;
  userId: string;
  accountId: string;
}

/**
 * Create a fresh context with linked IDs for relational tests
 */
export function createTestContext(): TestEntityContext {
  idCounter++;
  const suffix = idCounter;
  return {
    companyId: `company-${suffix}`,
    teamId: `team-${suffix}`,
    userId: `user-${suffix}`,
    accountId: `account-${suffix}`,
  };
}

/**
 * Create a full set of linked entities for relational tests
 * Returns company, team, membership, and credit account with consistent IDs
 */
export function createLinkedTestEntities(overrides: Partial<TestEntityContext> = {}) {
  const ctx = { ...createTestContext(), ...overrides };

  const company = createTestCompany({ id: ctx.companyId });
  const team = createTestTeam({ id: ctx.teamId, companyId: ctx.companyId });
  const membership = createTestTeamMembership({
    teamId: ctx.teamId,
    userId: ctx.userId,
  });
  const account = createTestCreditAccount({
    id: ctx.accountId,
    companyId: ctx.companyId,
  });

  return {
    context: ctx,
    company,
    team,
    membership,
    account,
  };
}

/**
 * Create a hold linked to an existing account
 */
export function createLinkedHold(accountId: string, overrides: Partial<CreditHold> = {}): CreditHold {
  return createTestCreditHold({
    accountId,
    ...overrides,
  });
}

/**
 * Create a ledger entry linked to an existing account
 */
export function createLinkedLedgerEntry(accountId: string, overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return createTestLedgerEntry({
    accountId,
    ...overrides,
  });
}

/**
 * Create a test company
 */
export function createTestCompany(overrides: Partial<Company> = {}): Company {
  idCounter++;
  return {
    id: `company-${idCounter}`,
    name: `Test Company ${idCounter}`,
    slug: `test-company-${idCounter}`,
    industry: 'Technology',
    size: 'mid-market',
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a test team
 */
export function createTestTeam(overrides: Partial<Team> = {}): Team {
  idCounter++;
  return {
    id: `team-${idCounter}`,
    companyId: `company-${idCounter}`,
    name: `Test Team ${idCounter}`,
    slug: `test-team-${idCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a test team membership
 */
export function createTestTeamMembership(overrides: Partial<TeamMembership> = {}): TeamMembership {
  idCounter++;
  return {
    id: `membership-${idCounter}`,
    teamId: `team-${idCounter}`,
    userId: 'test-user-id',
    role: 'member',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a test credit account
 */
export function createTestCreditAccount(overrides: Partial<CreditAccount> = {}): CreditAccount {
  idCounter++;
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  return {
    id: `account-${idCounter}`,
    companyId: `company-${idCounter}`,
    subscriptionTier: 'professional',
    subscriptionStart: now,
    subscriptionEnd: yearEnd,
    totalCredits: 10000,
    bonusCredits: 2000,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test ledger entry
 */
export function createTestLedgerEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  idCounter++;
  return {
    id: `entry-${idCounter}`,
    accountId: `account-${idCounter}`,
    entryType: 'debit',
    amount: 100,
    transactionType: 'spend',
    referenceType: 'request',
    referenceId: `request-${idCounter}`,
    description: `Test transaction ${idCounter}`,
    performedBy: 'test-user-id',
    idempotencyKey: `idem-${idCounter}`,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a test credit hold
 */
export function createTestCreditHold(overrides: Partial<CreditHold> = {}): CreditHold {
  idCounter++;
  return {
    id: `hold-${idCounter}`,
    accountId: `account-${idCounter}`,
    requestId: `request-${idCounter}`,
    amount: 500,
    status: 'active',
    createdAt: new Date(),
    releasedAt: null,
    convertedAt: null,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════
// MOCK BALANCE DATA
// ══════════════════════════════════════════════════════════════════

export interface MockAccountBalance {
  accountId: string;
  companyId: string;
  totalCredits: number;
  bonusCredits: number;
  ledgerCredits: number;
  ledgerDebits: number;
  usedCredits: number;
  reservedCredits: number;
  availableCredits: number;
  subscriptionTier: string;
  subscriptionEnd: string;
  daysRemaining: number;
}

export function createTestBalance(overrides: Partial<MockAccountBalance> = {}): MockAccountBalance {
  const totalCredits = overrides.totalCredits ?? 10000;
  const bonusCredits = overrides.bonusCredits ?? 2000;
  const ledgerCredits = overrides.ledgerCredits ?? 0;
  const ledgerDebits = overrides.ledgerDebits ?? 1500;
  const reservedCredits = overrides.reservedCredits ?? 500;
  const availableCredits = totalCredits + bonusCredits + ledgerCredits - ledgerDebits - reservedCredits;

  return {
    accountId: 'account-1',
    companyId: 'company-1',
    totalCredits,
    bonusCredits,
    ledgerCredits,
    ledgerDebits,
    usedCredits: ledgerDebits,
    reservedCredits,
    availableCredits,
    subscriptionTier: 'professional',
    subscriptionEnd: '2025-12-31',
    daysRemaining: 350,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════
// AUTH CONTEXT HELPERS
// ══════════════════════════════════════════════════════════════════

export function createMockAuthContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    isAuthenticated: false,
    user: null,
    visitorId: null,
    permissions: {
      canAccessChat: true,
      canReadCommunity: true,
      canAsk: false,
      canAnswer: false,
      canComment: false,
      canUpvote: false,
      canDownvote: false,
      canInvite: false,
      canModerate: false,
      inviteSlots: 0,
    },
    ...overrides,
  };
}

export function createAuthenticatedContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return createMockAuthContext({
    isAuthenticated: true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      emailVerifiedAt: new Date(),
      profile: null,
    },
    permissions: {
      canAccessChat: true,
      canReadCommunity: true,
      canAsk: true,
      canAnswer: true,
      canComment: true,
      canUpvote: true,
      canDownvote: false,
      canInvite: false,
      canModerate: false,
      inviteSlots: 0,
    },
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════
// REQUEST INPUT FACTORIES
// ══════════════════════════════════════════════════════════════════

export interface CreateHoldInput {
  requestId: string;
  amount: number;
  idempotencyKey: string;
}

export function createHoldInput(overrides: Partial<CreateHoldInput> = {}): CreateHoldInput {
  idCounter++;
  return {
    requestId: `request-${idCounter}`,
    amount: 500,
    idempotencyKey: `hold-idem-${idCounter}`,
    ...overrides,
  };
}

export interface DirectSpendInput {
  amount: number;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  description: string;
  idempotencyKey: string;
}

export function createDirectSpendInput(overrides: Partial<DirectSpendInput> = {}): DirectSpendInput {
  idCounter++;
  return {
    amount: 100,
    transactionType: 'spend',
    referenceType: 'request',
    referenceId: `request-${idCounter}`,
    description: 'Test direct spend',
    idempotencyKey: `spend-idem-${idCounter}`,
    ...overrides,
  };
}
