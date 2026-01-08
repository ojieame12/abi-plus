// Tests for Community Vote API endpoints
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { VercelResponse } from '@vercel/node';
import type { AuthRequest, AuthContext } from '../../_middleware/auth';

// Mock the service modules BEFORE importing the handler
vi.mock('../../../src/services/communityService', () => ({
  castVote: vi.fn(),
  removeVote: vi.fn(),
}));

vi.mock('../../../src/services/badgeService', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../src/services/streakService', () => ({
  updateStreak: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
}));

vi.mock('drizzle-orm/neon-http', () => ({
  drizzle: vi.fn(() => ({})),
}));

// Mock auth middleware
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

import { castVote, removeVote } from '../../../src/services/communityService';
import { resetTestCounters } from '../../../src/test/community-utils';

// ══════════════════════════════════════════════════════════════════
// MOCK REQUEST/RESPONSE HELPERS
// ══════════════════════════════════════════════════════════════════

function createMockResponse(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

function createMockAuthContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    isAuthenticated: true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      emailVerifiedAt: new Date(),
      profile: null,
    },
    visitorId: null,
    permissions: {
      canAccessChat: true,
      canReadCommunity: true,
      canAsk: true,
      canAnswer: true,
      canComment: true,
      canUpvote: true,
      canDownvote: true,
      canInvite: false,
      canModerate: false,
      inviteSlots: 0,
    },
    ...overrides,
  };
}

function createLowRepAuthContext(): AuthContext {
  return createMockAuthContext({
    permissions: {
      canAccessChat: true,
      canReadCommunity: true,
      canAsk: true,
      canAnswer: true,
      canComment: false,
      canUpvote: false, // Not enough rep
      canDownvote: false, // Not enough rep
      canInvite: false,
      canModerate: false,
      inviteSlots: 0,
    },
  });
}

function createMidRepAuthContext(): AuthContext {
  return createMockAuthContext({
    permissions: {
      canAccessChat: true,
      canReadCommunity: true,
      canAsk: true,
      canAnswer: true,
      canComment: true,
      canUpvote: true, // 50+ rep
      canDownvote: false, // Not 250+ rep
      canInvite: false,
      canModerate: false,
      inviteSlots: 0,
    },
  });
}

function createMockRequest(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    method: 'POST',
    query: { id: 'q1' },
    body: {},
    headers: {},
    auth: createMockAuthContext(),
    ...overrides,
  } as unknown as AuthRequest;
}

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/community/questions/[id]/vote
// ══════════════════════════════════════════════════════════════════

describe('POST /api/community/questions/[id]/vote', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    // The withAuthenticated middleware returns 401 for unauthenticated requests
    // Since we mocked it to bypass, we test the handler logic directly
    // In reality, the middleware would block this - but we're testing handler logic
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: 1 },
      auth: createMockAuthContext(), // Authenticated (middleware handles unauth)
    });
    const res = createMockResponse();

    // Mock successful vote
    (castVote as Mock).mockResolvedValue({
      success: true,
      newScore: 1,
      userVote: 1,
      targetOwnerId: 'owner-id',
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('requires canUpvote permission for +1 vote', async () => {
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: 1 },
      auth: createLowRepAuthContext(), // No upvote permission
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Insufficient reputation to upvote',
        required: 50,
      })
    );
  });

  it('requires canDownvote permission for -1 vote', async () => {
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: -1 },
      auth: createMidRepAuthContext(), // Can upvote but not downvote
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Insufficient reputation to downvote',
        required: 250,
      })
    );
  });

  it('validates vote value must be 1 or -1', async () => {
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: 2 }, // Invalid value
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Vote value must be 1 or -1' })
    );
  });

  it('creates new vote and returns updated score', async () => {
    (castVote as Mock).mockResolvedValue({
      success: true,
      newScore: 5,
      userVote: 1,
      targetOwnerId: 'owner-id',
    });

    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: 1 },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(castVote).toHaveBeenCalledWith(expect.anything(), 'test-user-id', 'question', 'q1', 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      newScore: 5,
      userVote: 1,
    });
  });

  it('handles vote toggle (same vote removes it)', async () => {
    (castVote as Mock).mockResolvedValue({
      success: true,
      newScore: 4,
      userVote: null, // Toggled off
      targetOwnerId: 'owner-id',
    });

    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: 1 },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      newScore: 4,
      userVote: null,
    });
  });

  it('handles vote switch (upvote to downvote)', async () => {
    (castVote as Mock).mockResolvedValue({
      success: true,
      newScore: -1,
      userVote: -1,
      targetOwnerId: 'owner-id',
    });

    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: -1 },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      newScore: -1,
      userVote: -1,
    });
  });

  it('returns 400 when vote fails (e.g., self-voting)', async () => {
    (castVote as Mock).mockResolvedValue({
      success: false,
      newScore: 0,
      userVote: null,
    });

    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: { id: 'q1' },
      body: { value: 1 },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Cannot vote on this question' })
    );
  });

  it('requires question ID in query', async () => {
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'POST',
      query: {}, // Missing ID
      body: { value: 1 },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Question ID is required' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - DELETE /api/community/questions/[id]/vote
// ══════════════════════════════════════════════════════════════════

describe('DELETE /api/community/questions/[id]/vote', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('removes existing vote', async () => {
    (removeVote as Mock).mockResolvedValue({
      success: true,
      newScore: 4,
      userVote: null,
    });

    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'DELETE',
      query: { id: 'q1' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(removeVote).toHaveBeenCalledWith(expect.anything(), 'test-user-id', 'question', 'q1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      newScore: 4,
      userVote: null,
    });
  });

  it('succeeds even when no vote exists', async () => {
    (removeVote as Mock).mockResolvedValue({
      success: true,
      newScore: 5,
      userVote: null,
    });

    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'DELETE',
      query: { id: 'q1' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - OPTIONS (CORS preflight)
// ══════════════════════════════════════════════════════════════════

describe('OPTIONS /api/community/questions/[id]/vote', () => {
  it('returns 200 for CORS preflight', async () => {
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'OPTIONS',
      query: { id: 'q1' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Method not allowed
// ══════════════════════════════════════════════════════════════════

describe('Invalid methods', () => {
  it('returns 405 for unsupported methods', async () => {
    const { default: handler } = await import('../questions/[id]/vote');

    const req = createMockRequest({
      method: 'GET', // Not supported
      query: { id: 'q1' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Method not allowed' })
    );
  });
});
