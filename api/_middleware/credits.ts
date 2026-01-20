// Credit Ledger Middleware - Balance calculation and database utilities
import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless';
import { eq, and, sql, desc } from 'drizzle-orm';
import {
  creditAccounts,
  ledgerEntries,
  creditHolds,
  companies,
  teamMemberships,
} from '../../src/db/schema.js';
import type {
  CreditAccount,
  LedgerEntry,
  CreditHold,
} from '../../src/db/schema.js';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface AccountBalance {
  accountId: string;
  companyId: string;
  totalCredits: number;      // Base credits from subscription tier
  bonusCredits: number;      // Tier bonus
  ledgerCredits: number;     // Sum of credit entries (refunds, top-ups)
  ledgerDebits: number;      // Sum of debit entries (spends)
  usedCredits: number;       // Same as ledgerDebits (for display)
  reservedCredits: number;   // Active holds for pending approvals
  availableCredits: number;  // total + bonus + ledgerCredits - ledgerDebits - reserved
  subscriptionTier: string;
  subscriptionEnd: string;
  daysRemaining: number;
}

export interface CreateHoldResult {
  holdId: string;
  amount: number;
  status: 'active' | 'released' | 'converted' | 'expired';
  availableCredits: number;
  /** True if this is a new hold, false if returning existing (idempotent) */
  created: boolean;
}

export interface ReleaseHoldResult {
  holdId: string;
  amount: number;
  status: 'released';
  availableCredits: number;
}

export interface ConvertHoldResult {
  holdId: string;
  amount: number;
  status: 'converted';
  ledgerEntryId: string;
  availableCredits: number;
}

export interface DirectSpendResult {
  ledgerEntryId: string;
  amount: number;
  availableCredits: number;
}

// ══════════════════════════════════════════════════════════════════
// Database Setup
// ══════════════════════════════════════════════════════════════════

/** HTTP-based db for simple queries (no transactions) */
export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzleHttp(sql);
}

/** Singleton pool for transactional operations - reused across requests */
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 10, // Limit connections for serverless
    });
  }
  return _pool;
}

/** Pool-based db for transactions */
export function getPoolDb() {
  return drizzleServerless(getPool());
}

/** Transaction database type - use this for transaction callbacks */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransactionDb = any;

/** Run a function within a database transaction */
export async function withTransaction<T>(
  fn: (tx: TransactionDb) => Promise<T>
): Promise<T> {
  const db = getPoolDb();
  return db.transaction(fn);
}

// ══════════════════════════════════════════════════════════════════
// Company/Account Lookup
// ══════════════════════════════════════════════════════════════════

/**
 * Get the credit account for a user's company
 * Finds the company through team membership
 * If user belongs to multiple companies, returns the most recently created account
 */
export async function getAccountForUser(userId: string): Promise<CreditAccount | null> {
  const db = getDb();

  // First, find the user's company through team membership
  const membership = await db
    .select({
      teamId: teamMemberships.teamId,
    })
    .from(teamMemberships)
    .where(eq(teamMemberships.userId, userId))
    .limit(1);

  if (membership.length === 0) {
    return null;
  }

  // Then get the company's credit account via the team
  // Order by createdAt DESC for deterministic results when user has multiple companies
  const result = await db
    .select({
      account: creditAccounts,
    })
    .from(creditAccounts)
    .innerJoin(companies, eq(creditAccounts.companyId, companies.id))
    .innerJoin(
      sql`teams`,
      sql`teams.company_id = ${companies.id}`
    )
    .innerJoin(
      sql`team_memberships tm`,
      sql`tm.team_id = teams.id AND tm.user_id = ${userId}::uuid`
    )
    .orderBy(desc(creditAccounts.createdAt))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].account;
}

/**
 * Get credit account by ID
 */
export async function getAccountById(accountId: string): Promise<CreditAccount | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.id, accountId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ══════════════════════════════════════════════════════════════════
// Balance Calculation
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate available balance for an account
 * Uses separate queries to avoid join multiplication
 * Balance = total + bonus + credits - debits - reserved
 */
export async function getAccountBalance(accountId: string): Promise<AccountBalance | null> {
  const db = getDb();

  // Get account base values
  const accountResult = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.id, accountId))
    .limit(1);

  if (accountResult.length === 0) {
    return null;
  }

  const account = accountResult[0];

  // Sum ledger credits (separate query to avoid join multiplication)
  const creditsResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.accountId, accountId),
        eq(ledgerEntries.entryType, 'credit')
      )
    );

  const ledgerCredits = Number(creditsResult[0]?.total ?? 0);

  // Sum ledger debits (separate query)
  const debitsResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.accountId, accountId),
        eq(ledgerEntries.entryType, 'debit')
      )
    );

  const ledgerDebits = Number(debitsResult[0]?.total ?? 0);

  // Sum active holds (separate query)
  const holdsResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${creditHolds.amount}), 0)`,
    })
    .from(creditHolds)
    .where(
      and(
        eq(creditHolds.accountId, accountId),
        eq(creditHolds.status, 'active')
      )
    );

  const reservedCredits = Number(holdsResult[0]?.total ?? 0);

  // Calculate available credits
  const availableCredits =
    account.totalCredits +
    account.bonusCredits +
    ledgerCredits -
    ledgerDebits -
    reservedCredits;

  // Format subscription end date as YYYY-MM-DD without timezone shift
  // Use UTC methods to avoid local timezone issues
  const endDate = account.subscriptionEnd;
  const subscriptionEndStr = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;

  // Calculate days remaining using UTC dates to avoid timezone issues
  const now = new Date();
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endUtc = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  const daysRemaining = Math.max(
    0,
    Math.ceil((endUtc - nowUtc) / (1000 * 60 * 60 * 24))
  );

  return {
    accountId: account.id,
    companyId: account.companyId,
    totalCredits: account.totalCredits,
    bonusCredits: account.bonusCredits,
    ledgerCredits,
    ledgerDebits,
    usedCredits: ledgerDebits,
    reservedCredits,
    availableCredits,
    subscriptionTier: account.subscriptionTier,
    subscriptionEnd: subscriptionEndStr,
    daysRemaining,
  };
}

// ══════════════════════════════════════════════════════════════════
// Credit Hold Operations
// ══════════════════════════════════════════════════════════════════

/**
 * Create a credit hold for a pending request
 * Uses transaction with row-level locking to prevent race conditions
 * Supports idempotency - returns existing hold if one exists for this requestId
 */
export async function createHold(
  accountId: string,
  requestId: string,
  amount: number
): Promise<CreateHoldResult> {
  return withTransaction(async (tx) => {
    // Lock the account row to prevent concurrent balance modifications
    // This ensures only one transaction can modify this account at a time
    await tx.execute(
      sql`SELECT id FROM credit_accounts WHERE id = ${accountId} FOR UPDATE`
    );

    // Check for existing hold with same requestId (idempotency)
    const existingHold = await tx
      .select()
      .from(creditHolds)
      .where(
        and(
          eq(creditHolds.accountId, accountId),
          eq(creditHolds.requestId, requestId)
        )
      )
      .limit(1);

    if (existingHold.length > 0) {
      // Return existing hold with actual status for idempotency
      const hold = existingHold[0];
      const balance = await getAccountBalanceInTx(tx, accountId);
      return {
        holdId: hold.id,
        amount: hold.amount,
        status: hold.status,
        availableCredits: balance?.availableCredits ?? 0,
        created: false,
      };
    }

    // Calculate balance within transaction (account is locked)
    const balance = await getAccountBalanceInTx(tx, accountId);
    if (!balance) {
      throw new Error('Account not found');
    }

    if (balance.availableCredits < amount) {
      throw new Error(
        `Insufficient credits. Available: ${balance.availableCredits}, Required: ${amount}`
      );
    }

    // Create the hold
    const [hold] = await tx
      .insert(creditHolds)
      .values({
        accountId,
        requestId,
        amount,
        status: 'active',
      })
      .returning();

    return {
      holdId: hold.id,
      amount: hold.amount,
      status: 'active',
      availableCredits: balance.availableCredits - amount,
      created: true,
    };
  });
}

/**
 * Calculate balance within a transaction context
 * Used for atomic balance checks in write operations
 */
async function getAccountBalanceInTx(
  tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
  accountId: string
): Promise<AccountBalance | null> {
  // Get account base values
  const accountResult = await tx
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.id, accountId))
    .limit(1);

  if (accountResult.length === 0) {
    return null;
  }

  const account = accountResult[0];

  // Sum ledger credits
  const creditsResult = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.accountId, accountId),
        eq(ledgerEntries.entryType, 'credit')
      )
    );

  const ledgerCredits = Number(creditsResult[0]?.total ?? 0);

  // Sum ledger debits
  const debitsResult = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.accountId, accountId),
        eq(ledgerEntries.entryType, 'debit')
      )
    );

  const ledgerDebits = Number(debitsResult[0]?.total ?? 0);

  // Sum active holds
  const holdsResult = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${creditHolds.amount}), 0)`,
    })
    .from(creditHolds)
    .where(
      and(
        eq(creditHolds.accountId, accountId),
        eq(creditHolds.status, 'active')
      )
    );

  const reservedCredits = Number(holdsResult[0]?.total ?? 0);

  // Calculate available credits
  const availableCredits =
    account.totalCredits +
    account.bonusCredits +
    ledgerCredits -
    ledgerDebits -
    reservedCredits;

  // Format subscription end date as YYYY-MM-DD without timezone shift
  const endDate = account.subscriptionEnd;
  const subscriptionEndStr = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;

  // Calculate days remaining
  const now = new Date();
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endUtc = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  const daysRemaining = Math.max(
    0,
    Math.ceil((endUtc - nowUtc) / (1000 * 60 * 60 * 24))
  );

  return {
    accountId: account.id,
    companyId: account.companyId,
    totalCredits: account.totalCredits,
    bonusCredits: account.bonusCredits,
    ledgerCredits,
    ledgerDebits,
    usedCredits: ledgerDebits,
    reservedCredits,
    availableCredits,
    subscriptionTier: account.subscriptionTier,
    subscriptionEnd: subscriptionEndStr,
    daysRemaining,
  };
}

/**
 * Release a credit hold (denied/cancelled request)
 */
export async function releaseHold(holdId: string): Promise<ReleaseHoldResult> {
  return withTransaction(async (tx) => {
    // Lock the hold row to prevent concurrent status changes
    const holdResult = await tx.execute(sql`
      SELECT
        id,
        account_id as "accountId",
        request_id as "requestId",
        amount,
        status
      FROM credit_holds
      WHERE id = ${holdId}
      FOR UPDATE
    `);
    const hold = holdResult.rows[0] as {
      id: string;
      accountId: string;
      requestId: string;
      amount: number;
      status: CreditHold['status'];
    } | undefined;

    if (!hold) {
      throw new Error('Hold not found');
    }

    if (hold.status !== 'active') {
      throw new Error(`Cannot release hold with status: ${hold.status}`);
    }

    // Update hold status
    await tx
      .update(creditHolds)
      .set({
        status: 'released',
        releasedAt: new Date(),
      })
      .where(eq(creditHolds.id, holdId));

    // Get updated balance within transaction
    const updatedBalance = await getAccountBalanceInTx(tx, hold.accountId);

    return {
      holdId: hold.id,
      amount: hold.amount,
      status: 'released',
      availableCredits: updatedBalance?.availableCredits ?? 0,
    };
  });
}

/**
 * Convert a hold to spend (approved request)
 * Creates a ledger entry and marks the hold as converted
 * Uses transaction to ensure atomicity - both operations succeed or both fail
 */
export async function convertHold(
  holdId: string,
  userId: string
): Promise<ConvertHoldResult> {
  return withTransaction(async (tx) => {
    // Lock the hold row to prevent concurrent modifications
    const holdResult = await tx.execute(sql`
      SELECT
        id,
        account_id as "accountId",
        request_id as "requestId",
        amount,
        status
      FROM credit_holds
      WHERE id = ${holdId}
      FOR UPDATE
    `);
    const hold = holdResult.rows[0] as {
      id: string;
      accountId: string;
      requestId: string;
      amount: number;
      status: CreditHold['status'];
    } | undefined;

    if (!hold) {
      throw new Error('Hold not found');
    }

    if (hold.status !== 'active') {
      throw new Error(`Cannot convert hold with status: ${hold.status}`);
    }

    // Update hold status first (within same transaction)
    await tx
      .update(creditHolds)
      .set({
        status: 'converted',
        convertedAt: new Date(),
      })
      .where(eq(creditHolds.id, holdId));

    // Create ledger entry for the spend
    const [ledgerEntry] = await tx
      .insert(ledgerEntries)
      .values({
        accountId: hold.accountId,
        entryType: 'debit',
        amount: hold.amount,
        transactionType: 'hold_conversion',
        referenceType: 'request',
        referenceId: hold.requestId,
        description: `Approved request - converted from hold ${holdId}`,
        performedBy: userId,
        idempotencyKey: `hold_convert_${holdId}`,
      })
      .returning();

    // Get updated balance within transaction
    const balance = await getAccountBalanceInTx(tx, hold.accountId);

    return {
      holdId: hold.id,
      amount: hold.amount,
      status: 'converted' as const,
      ledgerEntryId: ledgerEntry.id,
      availableCredits: balance?.availableCredits ?? 0,
    };
  });
}

// ══════════════════════════════════════════════════════════════════
// Direct Spend Operations
// ══════════════════════════════════════════════════════════════════

// Transaction types that represent debits (subtract from balance)
export const DEBIT_TRANSACTION_TYPES = ['spend', 'adjustment', 'expiry'] as const;

// Transaction types that represent credits (add to balance)
export const CREDIT_TRANSACTION_TYPES = ['allocation', 'refund', 'rollover'] as const;

export interface DirectSpendParams {
  accountId: string;
  amount: number;
  transactionType: (typeof DEBIT_TRANSACTION_TYPES)[number];
  referenceType: LedgerEntry['referenceType'];
  referenceId: string;
  description: string;
  idempotencyKey: string;
  userId: string;
}

/**
 * Direct spend (auto-approved, under threshold)
 * Creates a ledger entry directly without a hold
 * Uses transaction with row-level locking to prevent race conditions
 */
export async function directSpend(params: DirectSpendParams): Promise<DirectSpendResult> {
  // Validate transaction type is a debit type
  if (!DEBIT_TRANSACTION_TYPES.includes(params.transactionType)) {
    throw new Error(
      `Invalid transaction type for spend: ${params.transactionType}. ` +
      `Use one of: ${DEBIT_TRANSACTION_TYPES.join(', ')}`
    );
  }

  return withTransaction(async (tx) => {
    // Lock the account row to prevent concurrent balance modifications
    await tx.execute(
      sql`SELECT id FROM credit_accounts WHERE id = ${params.accountId} FOR UPDATE`
    );

    // Check for existing entry with same idempotency key (account-scoped)
    const existingEntry = await tx
      .select()
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.accountId, params.accountId),
          eq(ledgerEntries.idempotencyKey, params.idempotencyKey)
        )
      )
      .limit(1);

    if (existingEntry.length > 0) {
      // Return existing entry for idempotency
      const entry = existingEntry[0];
      const balance = await getAccountBalanceInTx(tx, params.accountId);
      return {
        ledgerEntryId: entry.id,
        amount: entry.amount,
        availableCredits: balance?.availableCredits ?? 0,
      };
    }

    // Calculate balance within transaction (account is locked)
    const balance = await getAccountBalanceInTx(tx, params.accountId);
    if (!balance) {
      throw new Error('Account not found');
    }

    if (balance.availableCredits < params.amount) {
      throw new Error(
        `Insufficient credits. Available: ${balance.availableCredits}, Required: ${params.amount}`
      );
    }

    // Create ledger entry
    const [ledgerEntry] = await tx
      .insert(ledgerEntries)
      .values({
        accountId: params.accountId,
        entryType: 'debit',
        amount: params.amount,
        transactionType: params.transactionType,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        description: params.description,
        performedBy: params.userId,
        idempotencyKey: params.idempotencyKey,
      })
      .returning();

    return {
      ledgerEntryId: ledgerEntry.id,
      amount: params.amount,
      availableCredits: balance.availableCredits - params.amount,
    };
  });
}

// ══════════════════════════════════════════════════════════════════
// Transaction History
// ══════════════════════════════════════════════════════════════════

export interface GetTransactionsParams {
  accountId: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  transactionType?: LedgerEntry['transactionType'];
}

export interface TransactionsResult {
  transactions: LedgerEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Get transaction history for an account
 */
export async function getTransactions(
  params: GetTransactionsParams
): Promise<TransactionsResult> {
  const db = getDb();
  const { accountId, limit = 10, offset = 0, startDate, endDate, transactionType } = params;

  // Build conditions
  const conditions = [eq(ledgerEntries.accountId, accountId)];

  if (startDate) {
    conditions.push(sql`${ledgerEntries.createdAt} >= ${new Date(startDate)}`);
  }
  if (endDate) {
    conditions.push(sql`${ledgerEntries.createdAt} <= ${new Date(endDate)}`);
  }
  if (transactionType) {
    conditions.push(eq(ledgerEntries.transactionType, transactionType));
  }

  // Get transactions
  const transactions = await db
    .select()
    .from(ledgerEntries)
    .where(and(...conditions))
    .orderBy(sql`${ledgerEntries.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(ledgerEntries)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  return {
    transactions,
    total,
    hasMore: offset + transactions.length < total,
  };
}

// ══════════════════════════════════════════════════════════════════
// Active Holds
// ══════════════════════════════════════════════════════════════════

/**
 * Get active holds for an account
 */
export async function getActiveHolds(accountId: string): Promise<CreditHold[]> {
  const db = getDb();

  return db
    .select()
    .from(creditHolds)
    .where(
      and(
        eq(creditHolds.accountId, accountId),
        eq(creditHolds.status, 'active')
      )
    )
    .orderBy(sql`${creditHolds.createdAt} DESC`);
}

/**
 * Get a hold by ID
 */
export async function getHoldById(holdId: string): Promise<CreditHold | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(creditHolds)
    .where(eq(creditHolds.id, holdId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
