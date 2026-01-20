// Tests for Community Answers API endpoints
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { VercelResponse } from '@vercel/node';
import type { AuthRequest, AuthContext } from '../../_middleware/auth';

// Mock the service modules BEFORE importing the handler
vi.mock('../../../src/services/communityService', () => ({
  createAnswer: vi.fn(),
  updateAnswer: vi.fn(),
  deleteAnswer: vi.fn(),
  getQuestionById: vi.fn(),
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

import {
  createAnswer,
  updateAnswer,
  deleteAnswer,
} from '../../../src/services/communityService';
import {
  createTestAnswer,
  createAnswerInput,
  resetTestCounters,
} from '../../../src/test/community-utils';

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

function createAuthenticatedContext(overrides: Partial<AuthContext> = {}): AuthContext {
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

function createMockRequest(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    method: 'POST',
    query: {},
    body: {},
    headers: {},
    auth: createMockAuthContext(),
    ...overrides,
  } as unknown as AuthRequest;
}

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/community/answers
// ══════════════════════════════════════════════════════════════════

describe('POST /api/community/answers', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  // Note: Authentication is handled by withAuthenticated middleware (mocked)
  // We test permission checks which happen inside the handler

  it('requires canAnswer permission', async () => {
    const { default: handler } = await import('../answers/index');

    const req = createMockRequest({
      method: 'POST',
      body: createAnswerInput(),
      auth: createAuthenticatedContext({
        permissions: {
          canAccessChat: true,
          canReadCommunity: true,
          canAsk: true,
          canAnswer: false, // Cannot answer
          canComment: false,
          canUpvote: false,
          canDownvote: false,
          canInvite: false,
          canModerate: false,
          inviteSlots: 0,
        },
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Insufficient permissions to answer questions' })
    );
  });

  it('validates questionId is required', async () => {
    const { default: handler } = await import('../answers/index');

    const req = createMockRequest({
      method: 'POST',
      body: { body: 'This is a valid answer body with enough content' }, // Missing questionId
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Question ID is required' })
    );
  });

  it('validates body length (min 30 chars)', async () => {
    const { default: handler } = await import('../answers/index');

    const req = createMockRequest({
      method: 'POST',
      body: { questionId: 'q1', body: 'Too short' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Answer must be at least 30 characters' })
    );
  });

  it('returns 404 when question not found', async () => {
    (createAnswer as Mock).mockRejectedValue(new Error('Question not found'));

    const { default: handler } = await import('../answers/index');

    const req = createMockRequest({
      method: 'POST',
      body: {
        questionId: 'nonexistent',
        body: 'This is a valid answer body with enough content for validation.',
      },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Question not found' })
    );
  });

  it('creates answer and returns 201', async () => {
    const createdAnswer = createTestAnswer();
    (createAnswer as Mock).mockResolvedValue(createdAnswer);

    const { default: handler } = await import('../answers/index');

    const req = createMockRequest({
      method: 'POST',
      body: {
        questionId: 'q1',
        body: 'This is a valid answer body with enough content for validation.',
      },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(createAnswer).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdAnswer);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - PATCH /api/community/answers/[id]
// ══════════════════════════════════════════════════════════════════

describe('PATCH /api/community/answers/[id]', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  // Note: Authentication is handled by withAuthenticated middleware (mocked)
  // The handler assumes the request is authenticated when it reaches the handler

  it('validates body length on update', async () => {
    const { default: handler } = await import('../answers/[id]');

    const req = createMockRequest({
      method: 'PATCH',
      query: { id: 'a1' },
      body: { body: 'Short' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Answer must be at least 30 characters' })
    );
  });

  it('updates answer when owner', async () => {
    const updatedAnswer = createTestAnswer({ body: 'Updated answer body with enough content here.' });
    (updateAnswer as Mock).mockResolvedValue(updatedAnswer);

    const { default: handler } = await import('../answers/[id]');

    const req = createMockRequest({
      method: 'PATCH',
      query: { id: 'a1' },
      body: { body: 'Updated answer body with enough content here.' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(updateAnswer).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 403 when not owner', async () => {
    (updateAnswer as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../answers/[id]');

    const req = createMockRequest({
      method: 'PATCH',
      query: { id: 'a1' },
      body: { body: 'Updated answer body with enough content here.' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - DELETE /api/community/answers/[id]
// ══════════════════════════════════════════════════════════════════

describe('DELETE /api/community/answers/[id]', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  // Note: Authentication is handled by withAuthenticated middleware (mocked)

  it('deletes answer when owner and returns 204', async () => {
    (deleteAnswer as Mock).mockResolvedValue(true);

    const { default: handler } = await import('../answers/[id]');

    const req = createMockRequest({
      method: 'DELETE',
      query: { id: 'a1' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(deleteAnswer).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 403 when not owner', async () => {
    (deleteAnswer as Mock).mockResolvedValue(false);

    const { default: handler } = await import('../answers/[id]');

    const req = createMockRequest({
      method: 'DELETE',
      query: { id: 'a1' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - OPTIONS (CORS preflight)
// ══════════════════════════════════════════════════════════════════

describe('OPTIONS /api/community/answers', () => {
  it('returns 200 for CORS preflight', async () => {
    const { default: handler } = await import('../answers/index');

    const req = createMockRequest({
      method: 'OPTIONS',
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
