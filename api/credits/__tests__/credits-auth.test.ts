// Tests for Credit Ledger API - Auth/CSRF behavior
// These tests do NOT mock the auth middleware to verify proper auth handling
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ══════════════════════════════════════════════════════════════════
// MOCKS - Only mock DB and credit operations, NOT auth middleware
// ══════════════════════════════════════════════════════════════════

// Mock DB operations to prevent actual database calls
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
  Pool: vi.fn(() => ({
    connect: vi.fn(),
    query: vi.fn(),
  })),
}));

vi.mock('drizzle-orm/neon-http', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => ({
    transaction: vi.fn(),
    select: vi.fn(),
  })),
}));

// Mock credit middleware functions (they need DB)
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
  DEBIT_TRANSACTION_TYPES: ['spend', 'adjustment', 'expiry'] as const,
  CREDIT_TRANSACTION_TYPES: ['allocation', 'refund', 'rollover'] as const,
}));

// ══════════════════════════════════════════════════════════════════
// TEST HELPERS
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

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as unknown as VercelRequest;
}

// ══════════════════════════════════════════════════════════════════
// TESTS - Authentication Required (401)
// ══════════════════════════════════════════════════════════════════

describe('Credit API - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/credits/balance', () => {
    it('returns 401 for unauthenticated request', async () => {
      const { default: handler } = await import('../balance');

      const req = createMockRequest({
        method: 'GET',
        headers: {}, // No session cookie
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication required' })
      );
    });

    it('returns 401 for expired session', async () => {
      const { default: handler } = await import('../balance');

      const req = createMockRequest({
        method: 'GET',
        headers: {
          cookie: 'abi_session=expired-token',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Session validation returns null for invalid/expired tokens
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/credits/hold', () => {
    it('returns 401 for unauthenticated request (with valid CSRF)', async () => {
      const { default: handler } = await import('../hold');

      // Must provide matching CSRF tokens to pass CSRF check and test auth
      const csrfToken = 'valid-csrf-token';
      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `abi_csrf=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: {
          requestId: 'req-1',
          amount: 100,
          idempotencyKey: 'key-1',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/credits/spend', () => {
    it('returns 401 for unauthenticated request (with valid CSRF)', async () => {
      const { default: handler } = await import('../spend');

      // Must provide matching CSRF tokens to pass CSRF check and test auth
      const csrfToken = 'valid-csrf-token';
      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `abi_csrf=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: {
          amount: 100,
          transactionType: 'spend',
          referenceType: 'request',
          referenceId: 'ref-1',
          description: 'Test',
          idempotencyKey: 'key-1',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('GET /api/credits/transactions', () => {
    it('returns 401 for unauthenticated request', async () => {
      const { default: handler } = await import('../transactions');

      const req = createMockRequest({
        method: 'GET',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - CSRF Protection (403)
// ══════════════════════════════════════════════════════════════════

describe('Credit API - CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/credits/hold', () => {
    it('returns 403 for missing CSRF token on POST', async () => {
      const { default: handler } = await import('../hold');

      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: 'abi_session=valid-token; abi_csrf=csrf-cookie',
          // Missing x-csrf-token header
        },
        body: {
          requestId: 'req-1',
          amount: 100,
          idempotencyKey: 'key-1',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid CSRF token' })
      );
    });

    it('returns 403 for mismatched CSRF token', async () => {
      const { default: handler } = await import('../hold');

      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: 'abi_session=valid-token; abi_csrf=csrf-cookie-value',
          'x-csrf-token': 'different-csrf-value', // Doesn't match cookie
        },
        body: {
          requestId: 'req-1',
          amount: 100,
          idempotencyKey: 'key-1',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid CSRF token' })
      );
    });
  });

  describe('POST /api/credits/spend', () => {
    it('returns 403 for missing CSRF token on POST', async () => {
      const { default: handler } = await import('../spend');

      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: 'abi_session=valid-token; abi_csrf=csrf-cookie',
        },
        body: {
          amount: 100,
          transactionType: 'spend',
          referenceType: 'request',
          referenceId: 'ref-1',
          description: 'Test',
          idempotencyKey: 'key-1',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('GET requests', () => {
    it('does not require CSRF for GET /api/credits/balance', async () => {
      const { default: handler } = await import('../balance');

      const req = createMockRequest({
        method: 'GET',
        headers: {
          // No CSRF token, just session
          cookie: 'abi_session=valid-token',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should get 401 (no valid session), not 403 (CSRF)
      // This proves CSRF validation was skipped for GET
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
