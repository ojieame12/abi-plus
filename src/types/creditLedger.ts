// Credit Ledger API Types
// Matches schema in server/migrations/001_credit_ledger.sql

// ============================================================================
// ENUMS
// ============================================================================

export type LedgerEntryType = 'credit' | 'debit';

export type TransactionType =
  | 'allocation'       // Initial or top-up credit allocation
  | 'spend'            // Direct spend (auto-approved)
  | 'hold_conversion'  // Approved hold converted to spend
  | 'refund'           // Credit returned to account
  | 'adjustment'       // Manual admin adjustment
  | 'expiry'           // Credits expired
  | 'rollover';        // Credits rolled over to new period

export type ReferenceType =
  | 'request'          // Approval request
  | 'subscription'     // Subscription event
  | 'admin'            // Admin action
  | 'system';          // System action

export type HoldStatus =
  | 'active'           // Hold is reserving credits
  | 'converted'        // Approved: converted to ledger debit
  | 'released'         // Denied/cancelled: credits returned
  | 'expired';         // Timed out: credits returned

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * Credit account for a company
 * One account per company, linked to subscription
 */
export interface CreditAccount {
  id: string;
  companyId: string;

  // Subscription info
  subscriptionTier: string;
  subscriptionStart: string;  // ISO date
  subscriptionEnd: string;    // ISO date

  // Credits
  totalCredits: number;
  bonusCredits: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Immutable ledger entry
 * All credit changes are recorded as entries
 */
export interface LedgerEntry {
  id: string;
  accountId: string;

  // Entry details
  entryType: LedgerEntryType;
  amount: number;  // Always positive
  transactionType: TransactionType;

  // Reference
  referenceType?: ReferenceType;
  referenceId?: string;

  // Audit
  description: string;
  performedBy?: string;  // User ID
  idempotencyKey?: string;

  createdAt: string;
}

/**
 * Credit hold (reservation)
 * Credits reserved for pending approval requests
 */
export interface CreditHold {
  id: string;
  accountId: string;
  requestId: string;

  amount: number;
  status: HoldStatus;

  createdAt: string;
  releasedAt?: string;
  convertedAt?: string;
}

/**
 * Team-level credit allocation
 * Budget allocation from company pool to team
 */
export interface CreditAllocation {
  id: string;
  accountId: string;
  teamId: string;

  allocatedCredits: number;
  periodStart: string;  // ISO date
  periodEnd: string;    // ISO date

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COMPUTED / DERIVED
// ============================================================================

/**
 * Account balance (derived from ledger)
 * Never stored, always computed via get_account_balance()
 */
export interface AccountBalance {
  accountId: string;
  companyId: string;

  // From credit_accounts (base allocation)
  totalCredits: number;    // Base credits from subscription tier
  bonusCredits: number;    // Bonus credits on top of base

  // Derived from ledger_entries (net activity)
  ledgerCredits: number;   // Sum of credit entries (refunds, top-ups)
  ledgerDebits: number;    // Sum of debit entries (spends)

  // Derived from credit_holds
  reservedCredits: number; // Active holds for pending approvals

  // Computed: total + bonus + ledgerCredits - ledgerDebits - reserved
  availableCredits: number;

  // Convenience: total debits (same as ledgerDebits, for display)
  usedCredits: number;

  // Subscription info
  subscriptionTier: string;
  subscriptionEnd: string;
  daysRemaining: number;
}

/**
 * Team balance (derived)
 * Available credits for a specific team
 */
export interface TeamBalance {
  teamId: string;
  teamName: string;

  allocatedCredits: number;
  usedCredits: number;
  reservedCredits: number;
  availableCredits: number;

  periodStart: string;
  periodEnd: string;
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Create a credit hold for a pending request
 */
export interface CreateHoldRequest {
  requestId: string;
  amount: number;
  idempotencyKey: string;
}

/**
 * Direct spend (auto-approved, under threshold)
 */
export interface DirectSpendRequest {
  amount: number;
  transactionType: TransactionType;
  referenceType: ReferenceType;
  referenceId: string;
  description: string;
  idempotencyKey: string;
}

/**
 * Admin balance adjustment
 */
export interface AdjustBalanceRequest {
  amount: number;
  entryType: LedgerEntryType;  // 'credit' to add, 'debit' to remove
  reason: string;
  idempotencyKey: string;
}

/**
 * Team allocation request
 */
export interface AllocateToTeamRequest {
  teamId: string;
  allocatedCredits: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Transaction history query params
 */
export interface GetTransactionsParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  transactionType?: TransactionType;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Response after creating a hold
 */
export interface CreateHoldResponse {
  holdId: string;
  amount: number;
  status: HoldStatus;
  availableCredits: number;
  created: boolean;
}

/**
 * Response after releasing a hold
 */
export interface ReleaseHoldResponse {
  holdId: string;
  amount: number;
  status: 'released';
  availableCredits: number;
}

/**
 * Response after converting hold to spend
 */
export interface ConvertHoldResponse {
  holdId: string;
  amount: number;
  status: 'converted';
  ledgerEntryId: string;
  availableCredits: number;
}

/**
 * Response after direct spend
 */
export interface DirectSpendResponse {
  ledgerEntryId: string;
  amount: number;
  availableCredits: number;
}

/**
 * Paginated transaction list
 */
export interface GetTransactionsResponse {
  transactions: LedgerEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Credit statement (for reporting)
 */
export interface CreditStatement {
  accountId: string;
  companyId: string;
  companyName: string;

  // Period
  periodStart: string;
  periodEnd: string;

  // Summary
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  closingBalance: number;

  // Breakdown by type
  breakdownByType: Record<TransactionType, number>;

  // Entries
  entries: LedgerEntry[];
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if account has sufficient available credits
 */
export function hasAvailableCredits(balance: AccountBalance, amount: number): boolean {
  return balance.availableCredits >= amount;
}

/**
 * Calculate available credits from components
 */
export function calculateAvailableCredits(
  totalCredits: number,
  bonusCredits: number,
  usedCredits: number,
  reservedCredits: number
): number {
  return totalCredits + bonusCredits - usedCredits - reservedCredits;
}

/**
 * Format credits for display (with commas)
 */
export function formatCreditsDisplay(amount: number): string {
  return amount.toLocaleString();
}

/**
 * Format credits as currency ($1 = 1 credit)
 */
export function formatCreditsAsCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
