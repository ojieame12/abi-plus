// Credit Ledger Service
// API client for credit operations
// Set USE_REAL_API = true when backend is ready

import type {
  AccountBalance,
  CreateHoldRequest,
  CreateHoldResponse,
  ReleaseHoldResponse,
  ConvertHoldResponse,
  DirectSpendRequest,
  DirectSpendResponse,
  GetTransactionsParams,
  GetTransactionsResponse,
  AdjustBalanceRequest,
  LedgerEntry,
  CreditHold,
} from '../types/creditLedger';
import { MOCK_SUBSCRIPTION, MOCK_TRANSACTIONS } from './mockSubscription';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = '/api/credits';

// Feature flag: use real API or mock data
// Backend is deployed and database is ready - using real API
const USE_REAL_API = true;

// ============================================================================
// API HELPERS
// ============================================================================

interface ApiError {
  error: string;
  message?: string;
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/abi_csrf=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Make authenticated API request with proper headers
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add CSRF token for state-changing requests
  if (options.method && options.method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
    if (!options.headers || !(options.headers as Record<string, string>)['Content-Type']) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as ApiError;
    const message = errorBody.message || errorBody.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Get account balance for current company
 */
export async function getAccountBalance(): Promise<AccountBalance> {
  if (USE_REAL_API) {
    return apiRequest<AccountBalance>(`${API_BASE}/balance`);
  }

  // Mock implementation
  const sub = MOCK_SUBSCRIPTION;
  return {
    accountId: sub.id,
    companyId: sub.companyId,
    totalCredits: sub.tierConfig.baseCredits,  // Base only
    bonusCredits: sub.tierConfig.bonusCredits,
    ledgerCredits: 0,  // No refunds/top-ups in mock
    ledgerDebits: sub.usedCredits,
    usedCredits: sub.usedCredits,
    reservedCredits: sub.reservedCredits,
    availableCredits: sub.remainingCredits,
    subscriptionTier: sub.tier,
    subscriptionEnd: sub.endDate,
    daysRemaining: sub.daysRemaining,
  };
}

/**
 * Create a credit hold for a pending request
 */
export async function createHold(request: CreateHoldRequest): Promise<CreateHoldResponse> {
  if (USE_REAL_API) {
    return apiRequest<CreateHoldResponse>(`${API_BASE}/hold`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Mock implementation
  const holdId = `hold_${Date.now()}`;
  const balance = await getAccountBalance();

  return {
    holdId,
    amount: request.amount,
    status: 'active',
    availableCredits: balance.availableCredits - request.amount,
    created: true,
  };
}

/**
 * Release a credit hold (denied/cancelled request)
 */
export async function releaseHold(holdId: string): Promise<ReleaseHoldResponse> {
  if (USE_REAL_API) {
    return apiRequest<ReleaseHoldResponse>(`${API_BASE}/hold/${holdId}/release`, {
      method: 'POST',
    });
  }

  // Mock implementation
  const balance = await getAccountBalance();

  return {
    holdId,
    amount: 0,  // Would be from hold record
    status: 'released',
    availableCredits: balance.availableCredits,
  };
}

/**
 * Convert a hold to spend (approved request)
 */
export async function convertHold(holdId: string): Promise<ConvertHoldResponse> {
  if (USE_REAL_API) {
    return apiRequest<ConvertHoldResponse>(`${API_BASE}/hold/${holdId}/convert`, {
      method: 'POST',
    });
  }

  // Mock implementation
  const ledgerEntryId = `entry_${Date.now()}`;
  const balance = await getAccountBalance();

  return {
    holdId,
    amount: 0,  // Would be from hold record
    status: 'converted',
    ledgerEntryId,
    availableCredits: balance.availableCredits,
  };
}

/**
 * Direct spend (auto-approved, under threshold)
 */
export async function directSpend(request: DirectSpendRequest): Promise<DirectSpendResponse> {
  if (USE_REAL_API) {
    return apiRequest<DirectSpendResponse>(`${API_BASE}/spend`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Mock implementation
  const ledgerEntryId = `entry_${Date.now()}`;
  const balance = await getAccountBalance();

  return {
    ledgerEntryId,
    amount: request.amount,
    availableCredits: balance.availableCredits - request.amount,
  };
}

/**
 * Get transaction history
 */
export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<GetTransactionsResponse> {
  if (USE_REAL_API) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.transactionType) searchParams.set('type', params.transactionType);

    return apiRequest<GetTransactionsResponse>(`${API_BASE}/transactions?${searchParams}`);
  }

  // Mock implementation
  const { limit = 10, offset = 0 } = params;
  const transactions = MOCK_TRANSACTIONS.slice(offset, offset + limit).map(
    (txn): LedgerEntry => ({
      id: txn.id,
      accountId: 'acct_001',
      entryType: txn.amount > 0 ? 'credit' : 'debit',
      amount: Math.abs(txn.amount),
      transactionType: txn.type as LedgerEntry['transactionType'],
      description: txn.description,
      performedBy: txn.createdBy,
      createdAt: txn.createdAt,
    })
  );

  return {
    transactions,
    total: MOCK_TRANSACTIONS.length,
    hasMore: offset + limit < MOCK_TRANSACTIONS.length,
  };
}

/**
 * Admin: Adjust account balance
 */
export async function adjustBalance(
  request: AdjustBalanceRequest
): Promise<{ ledgerEntryId: string; availableCredits: number }> {
  if (USE_REAL_API) {
    return apiRequest<{ ledgerEntryId: string; availableCredits: number }>(
      `${API_BASE}/adjust`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Mock implementation
  const balance = await getAccountBalance();
  const adjustment = request.entryType === 'credit' ? request.amount : -request.amount;

  return {
    ledgerEntryId: `entry_${Date.now()}`,
    availableCredits: balance.availableCredits + adjustment,
  };
}

/**
 * Get active holds for the account
 */
export async function getActiveHolds(): Promise<CreditHold[]> {
  if (USE_REAL_API) {
    return apiRequest<CreditHold[]>(`${API_BASE}/holds`);
  }

  // Mock: no active holds
  return [];
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if account has sufficient credits for an operation
 */
export async function checkSufficientCredits(amount: number): Promise<{
  sufficient: boolean;
  availableCredits: number;
  shortfall: number;
}> {
  const balance = await getAccountBalance();
  const sufficient = balance.availableCredits >= amount;

  return {
    sufficient,
    availableCredits: balance.availableCredits,
    shortfall: sufficient ? 0 : amount - balance.availableCredits,
  };
}

/**
 * Calculate total reserved credits
 */
export async function getTotalReservedCredits(): Promise<number> {
  const holds = await getActiveHolds();
  return holds.reduce((sum, hold) => sum + hold.amount, 0);
}
