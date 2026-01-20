// Tests for Approval Workflow API - Auth/CSRF behavior
// These tests do NOT mock the auth middleware to verify proper auth handling
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ══════════════════════════════════════════════════════════════════
// MOCKS - Only mock DB and approval operations, NOT auth middleware
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
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  })),
}));

// Mock approval middleware functions
vi.mock('../../_middleware/approvals', () => ({
  submitRequest: vi.fn(),
  getRequests: vi.fn(() => Promise.resolve({ requests: [], total: 0 })),
  getRequestWithEvents: vi.fn(),
  approveRequest: vi.fn(),
  denyRequest: vi.fn(),
  cancelRequest: vi.fn(),
  getApprovalQueue: vi.fn(() => Promise.resolve({ pending: [], totalPending: 0, nearingEscalation: [] })),
  canUserApprove: vi.fn(() => Promise.resolve(false)),
  canUserCancel: vi.fn(() => Promise.resolve(false)),
  getApplicableRule: vi.fn(),
  processEscalations: vi.fn(() => Promise.resolve({ escalatedCount: 0, escalatedIds: [] })),
  processExpirations: vi.fn(() => Promise.resolve({ expiredCount: 0, expiredIds: [] })),
}));

// Mock credit operations (used by approval workflow)
vi.mock('../../_middleware/credits', () => ({
  createHold: vi.fn(),
  releaseHold: vi.fn(),
  convertHold: vi.fn(),
  directSpend: vi.fn(),
  getAccountForUser: vi.fn(),
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

describe('Approval API - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/requests', () => {
    it('returns 401 for unauthenticated request', async () => {
      const { default: handler } = await import('../index');

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
  });

  describe('POST /api/requests', () => {
    it('returns 401 for unauthenticated request (with valid CSRF)', async () => {
      const { default: handler } = await import('../index');

      const csrfToken = 'valid-csrf-token';
      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `abi_csrf=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: {
          companyId: 'comp-1',
          teamId: 'team-1',
          requestType: 'report_upgrade',
          title: 'Test',
          estimatedCredits: 100,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('GET /api/requests/queue', () => {
    it('returns 401 for unauthenticated request', async () => {
      const { default: handler } = await import('../queue');

      const req = createMockRequest({
        method: 'GET',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('GET /api/requests/[id]', () => {
    it('returns 401 for unauthenticated request', async () => {
      const { default: handler } = await import('../[id]');

      const req = createMockRequest({
        method: 'GET',
        query: { id: 'req-123' },
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/requests/[id]/approve', () => {
    it('returns 401 for unauthenticated request (with valid CSRF)', async () => {
      const { default: handler } = await import('../[id]/approve');

      const csrfToken = 'valid-csrf-token';
      const req = createMockRequest({
        method: 'POST',
        query: { id: 'req-123' },
        headers: {
          cookie: `abi_csrf=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/requests/[id]/deny', () => {
    it('returns 401 for unauthenticated request (with valid CSRF)', async () => {
      const { default: handler } = await import('../[id]/deny');

      const csrfToken = 'valid-csrf-token';
      const req = createMockRequest({
        method: 'POST',
        query: { id: 'req-123' },
        headers: {
          cookie: `abi_csrf=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: { reason: 'Test reason' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/requests/[id]/cancel', () => {
    it('returns 401 for unauthenticated request (with valid CSRF)', async () => {
      const { default: handler } = await import('../[id]/cancel');

      const csrfToken = 'valid-csrf-token';
      const req = createMockRequest({
        method: 'POST',
        query: { id: 'req-123' },
        headers: {
          cookie: `abi_csrf=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: {},
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

describe('Approval API - CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/requests', () => {
    it('returns 403 for missing CSRF token on POST', async () => {
      const { default: handler } = await import('../index');

      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: 'abi_session=valid-token; abi_csrf=csrf-cookie',
          // Missing x-csrf-token header
        },
        body: {
          companyId: 'comp-1',
          teamId: 'team-1',
          requestType: 'report_upgrade',
          title: 'Test',
          estimatedCredits: 100,
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
      const { default: handler } = await import('../index');

      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: 'abi_session=valid-token; abi_csrf=csrf-cookie-value',
          'x-csrf-token': 'different-csrf-value',
        },
        body: {
          companyId: 'comp-1',
          teamId: 'team-1',
          requestType: 'report_upgrade',
          title: 'Test',
          estimatedCredits: 100,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('POST /api/requests/[id]/approve', () => {
    it('returns 403 for missing CSRF token', async () => {
      const { default: handler } = await import('../[id]/approve');

      const req = createMockRequest({
        method: 'POST',
        query: { id: 'req-123' },
        headers: {
          cookie: 'abi_session=valid-token; abi_csrf=csrf-cookie',
        },
        body: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('GET requests', () => {
    it('does not require CSRF for GET /api/requests', async () => {
      const { default: handler } = await import('../index');

      const req = createMockRequest({
        method: 'GET',
        headers: {
          cookie: 'abi_session=valid-token', // No CSRF token
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should get 401 (no valid session), not 403 (CSRF)
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Cron Job Endpoints (no user auth, uses CRON_SECRET)
// ══════════════════════════════════════════════════════════════════

describe('Approval API - Cron Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/requests/escalate', () => {
    it('processes escalations when no CRON_SECRET is set', async () => {
      // Without CRON_SECRET, endpoint is open
      delete process.env.CRON_SECRET;

      const { default: handler } = await import('../escalate');

      const req = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          escalatedCount: 0,
        })
      );
    });

    it('returns 405 for GET requests', async () => {
      const { default: handler } = await import('../escalate');

      const req = createMockRequest({
        method: 'GET',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('POST /api/requests/expire', () => {
    it('processes expirations when no CRON_SECRET is set', async () => {
      delete process.env.CRON_SECRET;

      const { default: handler } = await import('../expire');

      const req = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          expiredCount: 0,
        })
      );
    });
  });
});
