// Tests for Community Questions API endpoints
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { VercelResponse } from '@vercel/node';
import type { AuthRequest, AuthContext } from '../../_middleware/auth';

// Mock the service modules BEFORE importing the handler
vi.mock('../../../src/services/communityService', () => ({
  listQuestions: vi.fn(),
  createQuestion: vi.fn(),
  getQuestionById: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  incrementViewCount: vi.fn(),
  getAnswersForQuestion: vi.fn(),
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
  listQuestions,
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  incrementViewCount,
  getAnswersForQuestion,
} from '../../../src/services/communityService';
import {
  createTestQuestion,
  createTestAnswer,
  createQuestionInput,
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
    method: 'GET',
    query: {},
    body: {},
    headers: {},
    auth: createMockAuthContext(),
    ...overrides,
  } as unknown as AuthRequest;
}

// ══════════════════════════════════════════════════════════════════
// TESTS - GET /api/community/questions
// ══════════════════════════════════════════════════════════════════

describe('GET /api/community/questions', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('returns paginated list with default options', async () => {
    const questions = [createTestQuestion(), createTestQuestion()];
    (listQuestions as Mock).mockResolvedValue({
      questions,
      totalCount: 2,
      hasMore: false,
    });

    // Import handler after mocks are set up
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'GET',
      query: {},
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.any(Array),
        totalCount: 2,
        hasMore: false,
      })
    );
  });

  it('applies sortBy parameter', async () => {
    (listQuestions as Mock).mockResolvedValue({
      questions: [],
      totalCount: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'GET',
      query: { sortBy: 'votes' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(listQuestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sortBy: 'votes' })
    );
  });

  it('applies filter parameter', async () => {
    (listQuestions as Mock).mockResolvedValue({
      questions: [],
      totalCount: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'GET',
      query: { filter: 'unanswered' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(listQuestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ filter: 'unanswered' })
    );
  });

  it('applies tag parameter', async () => {
    (listQuestions as Mock).mockResolvedValue({
      questions: [],
      totalCount: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'GET',
      query: { tag: 'supplier-risk' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(listQuestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tagSlug: 'supplier-risk' })
    );
  });

  it('applies search parameter', async () => {
    (listQuestions as Mock).mockResolvedValue({
      questions: [],
      totalCount: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'GET',
      query: { search: 'procurement' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(listQuestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ search: 'procurement' })
    );
  });

  it('includes userId for vote state when authenticated', async () => {
    (listQuestions as Mock).mockResolvedValue({
      questions: [],
      totalCount: 0,
      hasMore: false,
    });

    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'GET',
      query: {},
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(listQuestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'test-user-id' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - POST /api/community/questions
// ══════════════════════════════════════════════════════════════════

describe('POST /api/community/questions', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'POST',
      body: createQuestionInput(),
      auth: createMockAuthContext({ isAuthenticated: false }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Authentication required' })
    );
  });

  it('requires canAsk permission', async () => {
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'POST',
      body: createQuestionInput(),
      auth: createAuthenticatedContext({
        permissions: {
          canAccessChat: true,
          canReadCommunity: true,
          canAsk: false, // Explicitly denied
          canAnswer: false,
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
      expect.objectContaining({ error: 'Insufficient permissions to ask questions' })
    );
  });

  it('validates title length (min 15 chars)', async () => {
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'POST',
      body: { title: 'Short', body: 'This is a valid body with more than 30 characters.', tagIds: [] },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Title must be at least 15 characters' })
    );
  });

  it('validates body length (min 30 chars)', async () => {
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'POST',
      body: { title: 'This is a valid title here', body: 'Short body', tagIds: [] },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Body must be at least 30 characters' })
    );
  });

  it('validates maximum 5 tags', async () => {
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'POST',
      body: {
        title: 'This is a valid title here',
        body: 'This is a valid body with more than 30 characters for the test.',
        tagIds: ['t1', 't2', 't3', 't4', 't5', 't6'], // 6 tags
      },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Maximum 5 tags allowed' })
    );
  });

  it('creates question and returns 201', async () => {
    const createdQuestion = createTestQuestion();
    (createQuestion as Mock).mockResolvedValue(createdQuestion);

    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'POST',
      body: createQuestionInput(),
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(createQuestion).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdQuestion);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - GET /api/community/questions/[id]
// ══════════════════════════════════════════════════════════════════

describe('GET /api/community/questions/[id]', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('returns question with answers', async () => {
    const question = createTestQuestion();
    const answers = [createTestAnswer(), createTestAnswer()];
    (getQuestionById as Mock).mockResolvedValue(question);
    (getAnswersForQuestion as Mock).mockResolvedValue(answers);
    (incrementViewCount as Mock).mockResolvedValue(undefined);

    const { default: handler } = await import('../questions/[id]');

    const req = createMockRequest({
      method: 'GET',
      query: { id: 'q1' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: question.id,
        answers: expect.any(Array),
      })
    );
    expect(incrementViewCount).toHaveBeenCalledWith(expect.anything(), 'q1');
  });

  it('returns 404 for non-existent question', async () => {
    (getQuestionById as Mock).mockResolvedValue(null);

    const { default: handler } = await import('../questions/[id]');

    const req = createMockRequest({
      method: 'GET',
      query: { id: 'nonexistent' },
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Question not found' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - PATCH /api/community/questions/[id]
// ══════════════════════════════════════════════════════════════════

describe('PATCH /api/community/questions/[id]', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('updates question when owner', async () => {
    const updatedQuestion = createTestQuestion({ title: 'Updated Title Here Now' });
    (updateQuestion as Mock).mockResolvedValue(updatedQuestion);

    const { default: handler } = await import('../questions/[id]');

    const req = createMockRequest({
      method: 'PATCH',
      query: { id: 'q1' },
      body: { title: 'Updated Title Here Now' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(updateQuestion).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 403 when not owner', async () => {
    (updateQuestion as Mock).mockResolvedValue(null); // Service returns null for unauthorized

    const { default: handler } = await import('../questions/[id]');

    const req = createMockRequest({
      method: 'PATCH',
      query: { id: 'q1' },
      body: { title: 'Updated Title Here Now' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - DELETE /api/community/questions/[id]
// ══════════════════════════════════════════════════════════════════

describe('DELETE /api/community/questions/[id]', () => {
  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  it('deletes question when owner and returns 204', async () => {
    (deleteQuestion as Mock).mockResolvedValue(true);

    const { default: handler } = await import('../questions/[id]');

    const req = createMockRequest({
      method: 'DELETE',
      query: { id: 'q1' },
      auth: createAuthenticatedContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(deleteQuestion).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 403 when not owner', async () => {
    (deleteQuestion as Mock).mockResolvedValue(false);

    const { default: handler } = await import('../questions/[id]');

    const req = createMockRequest({
      method: 'DELETE',
      query: { id: 'q1' },
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

describe('OPTIONS /api/community/questions', () => {
  it('returns 200 for CORS preflight', async () => {
    const { default: handler } = await import('../questions/index');

    const req = createMockRequest({
      method: 'OPTIONS',
      auth: createMockAuthContext(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
  });
});
