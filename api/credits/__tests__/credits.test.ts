// Tests for Credit Ledger API endpoints
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { VercelResponse } from '@vercel/node';
import type { AuthRequest, AuthContext } from '../../_middleware/auth';

// ══════════════════════════════════════════════════════════════════
// MOCKS
// ══════════════════════════════════════════════════════════════════

// Mock the credits middleware BEFORE importing handlers
vi.mock('../../_middleware/credits', () => ({
  getAccountForUser: vi.fn(),
  getAccountById: vi.fn(),
  getAccountBalance: vi.fn(),
  createHold: vi.fn(),
  releaseHold: vi.fn(),
  convertHold: vi.fn(),
  directSpend: vi.fn(),
  getTransactions: vi.fn(),
  getActiveHolds: vi.fn(),
  getHoldById: vi.fn(),
  // Export the constants needed by spend endpoint
  DEBIT_TRANSACTION_TYPES: ['spend', 'adjustment', 'expiry'] as const,
  CREDIT_TRANSACTION_TYPES: ['allocation', 'refund', 'rollover'] as const,
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
}));

vi.mock('drizzle-orm/neon-http', () => ({
  drizzle: vi.fn(() => ({})),
}));

// Mock auth middleware to bypass CSRF and auth checks
vi.mock('../../_middleware/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../_middleware/auth')>();
  return {
    ...original,
    withAuth: (handler: unknown) => handler,
    withAuthenticated: (handler: unknown) => handler,
    withVerified: (handler: unknown) => handler,
    validateCsrf: () => true,
    getAuthContext: vi.fn(),
  };
});

import {
  getAccountForUser,
  getAccountBalance,
  createHold,
  releaseHold,
  convertHold,
  directSpend,
  getTransactions,
  getActiveHolds,
  getHoldById,
} from '../../_middleware/credits';
import {
  createTestCreditAccount,
  createTestCreditHold,
  createTestLedgerEntry,
  createTestBalance,
  createMockAuthContext,
  createAuthenticatedContext,
  createHoldInput,
  createDirectSpendInput,
  resetCreditTestCounters,
} from '../../../src/test/credit-utils';

// ══════════════════════════════════════════════════════════════════
// MOCK REQUEST/RESPONSE HELPERS
// ══════════════════════════════════════════════════════════════════

function createMockResponse(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    getHeader: vi.fn().mockReturnValue([]),
  };
  return res as unknown as VercelResponse;
}

function createMockRequest(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    method: 'GET',
    query: {},
    body: {},
    headers: {},
    auth: createMockAuthContext(),
    ...overrides,
  } as unknown as AuthRequest;
}

// ══════════════════════════════════════════════════════════════════
// TESTS - GET /api/credits/balance
// ══════════════════════════════════════════════════════════════════

describe('GET /api/credits/balance', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('returns account balance for authenticated user', async () => {
    const account = createTestCreditAccount();
    const balance = createTestBalance();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getAccountBalance as Mock).mockResolvedValue(balance);

    const { default: handler } = await import('../balance');

    const req = createMockRequest({
      method: 'GET',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: balance.accountId,
        totalCredits: balance.totalCredits,
        availableCredits: balance.availableCredits,
      })
    );
  });

  it('returns 404 when user has no credit account', async () => {
    (getAccountForUser as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../balance');

    const req = createMockRequest({
      method: 'GET',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'No credit account found' })
    );
  });

  it('returns 404 when balance calculation fails', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getAccountBalance as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../balance');

    const req = createMockRequest({
      method: 'GET',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Balance calculation failed' })
    );
  });

  it('returns 405 for non-GET methods', async () => {
    const { default: handler } = await import('../balance');

    const req = createMockRequest({
      method: 'POST',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Method not allowed' })
    );
  });

  it('returns 200 for OPTIONS (CORS preflight)', async () => {
    const { default: handler } = await import('../balance');

    const req = createMockRequest({
      method: 'OPTIONS',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS');
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/credits/hold
// ══════════════════════════════════════════════════════════════════

describe('POST /api/credits/hold', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('creates a credit hold successfully', async () => {
    const account = createTestCreditAccount();
    const holdInput = createHoldInput();
    const holdResult = {
      holdId: 'hold-1',
      amount: holdInput.amount,
      status: 'active' as const,
      availableCredits: 9500,
    };
    (getAccountForUser as Mock).mockResolvedValue(account);
    (createHold as Mock).mockResolvedValue(holdResult);

    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: holdInput,
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(createHold).toHaveBeenCalledWith(account.id, holdInput.requestId, holdInput.amount);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(holdResult);
  });

  it('returns 400 for missing requestId', async () => {
    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: { amount: 500, idempotencyKey: 'key-1' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'requestId is required' })
    );
  });

  it('returns 400 for invalid amount', async () => {
    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: { requestId: 'req-1', amount: -100, idempotencyKey: 'key-1' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'amount must be a positive number' })
    );
  });

  it('returns 400 for missing idempotencyKey', async () => {
    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: { requestId: 'req-1', amount: 500 },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'idempotencyKey is required' })
    );
  });

  it('returns 400 for insufficient credits', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (createHold as Mock).mockRejectedValue(
      new Error('Insufficient credits. Available: 1000, Required: 5000')
    );

    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: createHoldInput({ amount: 5000 }),
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Insufficient credits' })
    );
  });

  it('returns 409 for duplicate request', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (createHold as Mock).mockRejectedValue(new Error('duplicate key'));

    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: createHoldInput(),
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Duplicate request' })
    );
  });

  it('returns 404 when user has no credit account', async () => {
    (getAccountForUser as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../hold');

    const req = createMockRequest({
      method: 'POST',
      body: createHoldInput(),
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/credits/hold/[id]/release
// ══════════════════════════════════════════════════════════════════

describe('POST /api/credits/hold/[id]/release', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('releases a hold successfully', async () => {
    const hold = createTestCreditHold();
    const account = createTestCreditAccount({ id: hold.accountId });
    const releaseResult = {
      holdId: hold.id,
      amount: hold.amount,
      status: 'released' as const,
      availableCredits: 10000,
    };
    (getHoldById as Mock).mockResolvedValue(hold);
    (getAccountForUser as Mock).mockResolvedValue(account);
    (releaseHold as Mock).mockResolvedValue(releaseResult);

    const { default: handler } = await import('../hold/[id]/release');

    const req = createMockRequest({
      method: 'POST',
      query: { id: hold.id },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(releaseHold).toHaveBeenCalledWith(hold.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(releaseResult);
  });

  it('returns 404 for non-existent hold', async () => {
    (getHoldById as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../hold/[id]/release');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'nonexistent' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Hold not found' })
    );
  });

  it('returns 403 when user does not own the hold', async () => {
    const hold = createTestCreditHold({ accountId: 'other-account' });
    const userAccount = createTestCreditAccount({ id: 'user-account' });
    (getHoldById as Mock).mockResolvedValue(hold);
    (getAccountForUser as Mock).mockResolvedValue(userAccount);

    const { default: handler } = await import('../hold/[id]/release');

    const req = createMockRequest({
      method: 'POST',
      query: { id: hold.id },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Forbidden' })
    );
  });

  it('returns 400 for already released hold', async () => {
    const hold = createTestCreditHold({ status: 'released' });
    const account = createTestCreditAccount({ id: hold.accountId });
    (getHoldById as Mock).mockResolvedValue(hold);
    (getAccountForUser as Mock).mockResolvedValue(account);
    (releaseHold as Mock).mockRejectedValue(
      new Error('Cannot release hold with status: released')
    );

    const { default: handler } = await import('../hold/[id]/release');

    const req = createMockRequest({
      method: 'POST',
      query: { id: hold.id },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid operation' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/credits/hold/[id]/convert
// ══════════════════════════════════════════════════════════════════

describe('POST /api/credits/hold/[id]/convert', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('converts a hold to spend successfully', async () => {
    const hold = createTestCreditHold();
    const account = createTestCreditAccount({ id: hold.accountId });
    const convertResult = {
      holdId: hold.id,
      amount: hold.amount,
      status: 'converted' as const,
      ledgerEntryId: 'entry-1',
      availableCredits: 9500,
    };
    (getHoldById as Mock).mockResolvedValue(hold);
    (getAccountForUser as Mock).mockResolvedValue(account);
    (convertHold as Mock).mockResolvedValue(convertResult);

    const { default: handler } = await import('../hold/[id]/convert');

    const req = createMockRequest({
      method: 'POST',
      query: { id: hold.id },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(convertHold).toHaveBeenCalledWith(hold.id, 'test-user-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'converted',
        ledgerEntryId: 'entry-1',
      })
    );
  });

  it('returns 404 for non-existent hold', async () => {
    (getHoldById as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../hold/[id]/convert');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'nonexistent' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 for already converted hold', async () => {
    const hold = createTestCreditHold();
    const account = createTestCreditAccount({ id: hold.accountId });
    (getHoldById as Mock).mockResolvedValue(hold);
    (getAccountForUser as Mock).mockResolvedValue(account);
    (convertHold as Mock).mockRejectedValue(new Error('duplicate key'));

    const { default: handler } = await import('../hold/[id]/convert');

    const req = createMockRequest({
      method: 'POST',
      query: { id: hold.id },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Already converted' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/credits/spend
// ══════════════════════════════════════════════════════════════════

describe('POST /api/credits/spend', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('creates a direct spend successfully', async () => {
    const account = createTestCreditAccount();
    const spendInput = createDirectSpendInput();
    const spendResult = {
      ledgerEntryId: 'entry-1',
      amount: spendInput.amount,
      availableCredits: 9900,
    };
    (getAccountForUser as Mock).mockResolvedValue(account);
    (directSpend as Mock).mockResolvedValue(spendResult);

    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: spendInput,
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(directSpend).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: account.id,
        amount: spendInput.amount,
        transactionType: spendInput.transactionType,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(spendResult);
  });

  it('returns 400 for missing amount', async () => {
    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: { ...createDirectSpendInput(), amount: undefined },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'amount must be a positive number' })
    );
  });

  it('returns 400 for invalid transactionType', async () => {
    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: { ...createDirectSpendInput(), transactionType: 'invalid' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid transactionType' })
    );
  });

  it('returns 400 for invalid referenceType', async () => {
    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: { ...createDirectSpendInput(), referenceType: 'invalid' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid referenceType' })
    );
  });

  it('returns 400 for missing referenceId', async () => {
    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: { ...createDirectSpendInput(), referenceId: undefined },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'referenceId is required' })
    );
  });

  it('returns 400 for missing description', async () => {
    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: { ...createDirectSpendInput(), description: undefined },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'description is required' })
    );
  });

  it('returns 400 for missing idempotencyKey', async () => {
    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: { ...createDirectSpendInput(), idempotencyKey: undefined },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'idempotencyKey is required' })
    );
  });

  it('returns 400 for insufficient credits', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (directSpend as Mock).mockRejectedValue(
      new Error('Insufficient credits. Available: 100, Required: 5000')
    );

    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: createDirectSpendInput({ amount: 5000 }),
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Insufficient credits' })
    );
  });

  it('returns 409 for duplicate idempotency key', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (directSpend as Mock).mockRejectedValue(new Error('duplicate key'));

    const { default: handler } = await import('../spend');

    const req = createMockRequest({
      method: 'POST',
      body: createDirectSpendInput(),
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Duplicate request' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - GET /api/credits/transactions
// ══════════════════════════════════════════════════════════════════

describe('GET /api/credits/transactions', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('returns transaction history', async () => {
    const account = createTestCreditAccount();
    const transactions = [
      createTestLedgerEntry(),
      createTestLedgerEntry(),
    ];
    const transactionsResult = {
      transactions,
      total: 2,
      hasMore: false,
    };
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getTransactions as Mock).mockResolvedValue(transactionsResult);

    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: {},
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        transactions: expect.any(Array),
        total: 2,
        hasMore: false,
      })
    );
  });

  it('applies pagination parameters', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getTransactions as Mock).mockResolvedValue({
      transactions: [],
      total: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: { limit: '25', offset: '50' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: account.id,
        limit: 25,
        offset: 50,
      })
    );
  });

  it('applies date filters', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getTransactions as Mock).mockResolvedValue({
      transactions: [],
      total: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: { startDate: '2025-01-01', endDate: '2025-12-31' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      })
    );
  });

  it('applies transaction type filter', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getTransactions as Mock).mockResolvedValue({
      transactions: [],
      total: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: { type: 'spend' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: 'spend',
      })
    );
  });

  it('returns 400 for invalid transaction type', async () => {
    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: { type: 'invalid' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid transaction type' })
    );
  });

  it('returns 400 for invalid date format', async () => {
    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: { startDate: 'not-a-date' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid startDate format' })
    );
  });

  it('caps limit at 100', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getTransactions as Mock).mockResolvedValue({
      transactions: [],
      total: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../transactions');

    const req = createMockRequest({
      method: 'GET',
      query: { limit: '500' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100, // Capped at 100
      })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - GET /api/credits/holds
// ══════════════════════════════════════════════════════════════════

describe('GET /api/credits/holds', () => {
  beforeEach(() => {
    resetCreditTestCounters();
    vi.clearAllMocks();
  });

  it('returns active holds', async () => {
    const account = createTestCreditAccount();
    const holds = [
      createTestCreditHold({ accountId: account.id }),
      createTestCreditHold({ accountId: account.id }),
    ];
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getActiveHolds as Mock).mockResolvedValue(holds);

    const { default: handler } = await import('../holds');

    const req = createMockRequest({
      method: 'GET',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(getActiveHolds).toHaveBeenCalledWith(account.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(holds);
  });

  it('returns empty array when no active holds', async () => {
    const account = createTestCreditAccount();
    (getAccountForUser as Mock).mockResolvedValue(account);
    (getActiveHolds as Mock).mockResolvedValue([]);

    const { default: handler } = await import('../holds');

    const req = createMockRequest({
      method: 'GET',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 404 when user has no credit account', async () => {
    (getAccountForUser as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../holds');

    const req = createMockRequest({
      method: 'GET',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 405 for non-GET methods', async () => {
    const { default: handler } = await import('../holds');

    const req = createMockRequest({
      method: 'POST',
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
