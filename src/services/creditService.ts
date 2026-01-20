// Credit Service - Fetch live credit balance and transactions from API
import type { CompanySubscription, CreditTransaction, SubscriptionTier } from '../types/subscription';
import { SUBSCRIPTION_TIERS } from '../types/subscription';

// API response type (matches api/_middleware/credits.ts AccountBalance)
interface AccountBalance {
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

// API transaction type
interface ApiTransaction {
  id: string;
  amount: number;
  entryType: 'credit' | 'debit';
  transactionType: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface TransactionsResponse {
  transactions: ApiTransaction[];
  total: number;
  hasMore: boolean;
}

// API base URL
const API_BASE = '';

// ══════════════════════════════════════════════════════════════════
// API Calls
// ══════════════════════════════════════════════════════════════════

export async function fetchBalance(): Promise<AccountBalance> {
  const response = await fetch(`${API_BASE}/api/credits/balance`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch balance');
  }

  return response.json();
}

export async function fetchTransactions(limit = 10): Promise<TransactionsResponse> {
  const response = await fetch(`${API_BASE}/api/credits/transactions?limit=${limit}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch transactions');
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════════════
// Data Transformers
// ══════════════════════════════════════════════════════════════════

/**
 * Convert API AccountBalance to frontend CompanySubscription type
 */
export function mapBalanceToSubscription(balance: AccountBalance): CompanySubscription {
  // Map tier string to SubscriptionTier
  const tierKey = (balance.subscriptionTier || 'business').toLowerCase() as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[tierKey] || SUBSCRIPTION_TIERS.business;

  return {
    id: balance.accountId,
    companyId: balance.companyId,
    tier: tierKey,
    tierConfig,
    startDate: '', // Not provided by API
    endDate: balance.subscriptionEnd,

    // Credits
    totalCredits: balance.totalCredits + balance.bonusCredits,
    usedCredits: balance.usedCredits,
    reservedCredits: balance.reservedCredits,
    remainingCredits: balance.availableCredits,

    // Slots (not provided by balance API - use defaults)
    slotAllowance: tierConfig.slotAllowance,
    usedSlots: 0,
    remainingSlots: tierConfig.slotAllowance,
    activatedCategories: [],

    isActive: true,
    daysRemaining: balance.daysRemaining,
  };
}

/**
 * Convert API transaction to frontend CreditTransaction type
 */
export function mapApiTransaction(tx: ApiTransaction): CreditTransaction {
  // Map transaction type to a user-friendly format
  const typeMap: Record<string, string> = {
    allocation: 'allocation',
    spend: 'report_upgrade', // Default for spend
    hold_conversion: 'report_upgrade',
    refund: 'refund',
    adjustment: 'adjustment',
    expiry: 'adjustment',
    rollover: 'allocation',
  };

  return {
    id: tx.id,
    type: typeMap[tx.transactionType] || tx.transactionType,
    amount: tx.entryType === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    balance: 0, // Not provided in list response
    description: tx.description || `${tx.transactionType} transaction`,
    requestId: tx.referenceType === 'request' ? tx.referenceId || undefined : undefined,
    createdAt: tx.createdAt,
    createdBy: tx.createdBy || 'system',
  };
}

/**
 * Fetch both balance and transactions, return mapped subscription data
 */
export async function fetchCreditData(): Promise<{
  subscription: CompanySubscription;
  transactions: CreditTransaction[];
}> {
  const [balance, txResponse] = await Promise.all([
    fetchBalance(),
    fetchTransactions(10),
  ]);

  return {
    subscription: mapBalanceToSubscription(balance),
    transactions: txResponse.transactions.map(mapApiTransaction),
  };
}
