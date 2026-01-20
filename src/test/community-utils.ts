// Test utilities for Community Q&A testing

import type {
  Question,
  QuestionWithAnswers,
  Answer,
  Tag,
  UserProfile,
  Badge,
  VoteValue,
  CreateQuestionInput,
  CreateAnswerInput,
  QuestionsListResponse,
} from '../types/community';

// ══════════════════════════════════════════════════════════════════
// COUNTERS
// ══════════════════════════════════════════════════════════════════

let questionCounter = 0;
let answerCounter = 0;
let tagCounter = 0;
let userCounter = 0;
let badgeCounter = 0;

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - Tags
// ══════════════════════════════════════════════════════════════════

export function createTestTag(overrides: Partial<Tag> = {}): Tag {
  tagCounter++;
  const name = overrides.name ?? `test-tag-${tagCounter}`;
  return {
    id: `test-tag-id-${tagCounter}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: overrides.description ?? `Description for ${name}`,
    questionCount: overrides.questionCount ?? 0,
    ...overrides,
  };
}

export function createDefaultTags(): Tag[] {
  return [
    createTestTag({ name: 'supplier-risk', description: 'Supplier risk management topics' }),
    createTestTag({ name: 'procurement', description: 'Procurement best practices' }),
    createTestTag({ name: 'market-trends', description: 'Market and commodity trends' }),
    createTestTag({ name: 'technology', description: 'Procurement technology' }),
    createTestTag({ name: 'sustainability', description: 'Sustainable procurement' }),
  ];
}

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - User Profiles
// ══════════════════════════════════════════════════════════════════

export function createTestUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  userCounter++;
  return {
    id: `test-user-${userCounter}`,
    displayName: overrides.displayName ?? `Test User ${userCounter}`,
    avatarUrl: overrides.avatarUrl ?? undefined,
    title: overrides.title ?? 'Procurement Manager',
    company: overrides.company ?? 'Test Corp',
    reputation: overrides.reputation ?? 100,
    ...overrides,
  };
}

export function createHighRepUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return createTestUserProfile({
    reputation: 1500,
    displayName: 'Expert User',
    title: 'Senior Procurement Director',
    ...overrides,
  });
}

export function createNewUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return createTestUserProfile({
    reputation: 1,
    displayName: 'New User',
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - Questions
// ══════════════════════════════════════════════════════════════════

export function createTestQuestion(overrides: Partial<Question> = {}): Question {
  questionCounter++;
  const author = overrides.author ?? createTestUserProfile();
  return {
    id: `test-question-${questionCounter}`,
    userId: author.id,
    author,
    title: overrides.title ?? `Test Question Title ${questionCounter} - sufficient length`,
    body: overrides.body ?? `This is the body of test question ${questionCounter}. It contains enough text to pass validation requirements for minimum body length.`,
    aiContextSummary: overrides.aiContextSummary ?? undefined,
    score: overrides.score ?? 0,
    viewCount: overrides.viewCount ?? 0,
    answerCount: overrides.answerCount ?? 0,
    acceptedAnswerId: overrides.acceptedAnswerId ?? undefined,
    hasAcceptedAnswer: overrides.hasAcceptedAnswer ?? false,
    status: overrides.status ?? 'open',
    tags: overrides.tags ?? [createTestTag()],
    userVote: overrides.userVote ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

export function createQuestionWithAnswers(
  questionOverrides: Partial<Question> = {},
  answerCount = 2
): QuestionWithAnswers {
  const question = createTestQuestion(questionOverrides);
  const answers: Answer[] = [];

  for (let i = 0; i < answerCount; i++) {
    answers.push(createTestAnswer({ questionId: question.id }));
  }

  return {
    ...question,
    answerCount: answers.length,
    answers,
  };
}

// Alias for naming consistency with other factory functions
export const createTestQuestionWithAnswers = createQuestionWithAnswers;

export function createAcceptedQuestion(overrides: Partial<Question> = {}): QuestionWithAnswers {
  const question = createTestQuestion({
    status: 'answered',
    hasAcceptedAnswer: true,
    ...overrides,
  });

  const acceptedAnswer = createTestAnswer({
    questionId: question.id,
    isAccepted: true,
  });

  const otherAnswer = createTestAnswer({ questionId: question.id });

  return {
    ...question,
    acceptedAnswerId: acceptedAnswer.id,
    answerCount: 2,
    answers: [acceptedAnswer, otherAnswer],
  };
}

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - Answers
// ══════════════════════════════════════════════════════════════════

export function createTestAnswer(overrides: Partial<Answer> = {}): Answer {
  answerCounter++;
  const author = overrides.author ?? createTestUserProfile();
  return {
    id: `test-answer-${answerCounter}`,
    questionId: overrides.questionId ?? `test-question-${questionCounter}`,
    userId: author.id,
    author,
    body: overrides.body ?? `This is the body of test answer ${answerCounter}. It provides a helpful response with enough content to pass validation.`,
    score: overrides.score ?? 0,
    isAccepted: overrides.isAccepted ?? false,
    userVote: overrides.userVote ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

export function createAcceptedAnswer(overrides: Partial<Answer> = {}): Answer {
  return createTestAnswer({
    isAccepted: true,
    score: 5,
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - Badges
// ══════════════════════════════════════════════════════════════════

export function createTestBadge(overrides: Partial<Badge> = {}): Badge {
  badgeCounter++;
  const name = overrides.name ?? `Test Badge ${badgeCounter}`;
  return {
    id: `test-badge-${badgeCounter}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: overrides.description ?? `Description for ${name}`,
    tier: overrides.tier ?? 'bronze',
    icon: overrides.icon ?? '🏆',
    criteria: overrides.criteria ?? { type: 'question_count', threshold: 1 },
    ...overrides,
  };
}

export function createBadgeSet(): Badge[] {
  return [
    createTestBadge({ name: 'First Question', tier: 'bronze', criteria: { type: 'first_question' } }),
    createTestBadge({ name: 'First Answer', tier: 'bronze', criteria: { type: 'first_answer' } }),
    createTestBadge({ name: 'Helpful', tier: 'silver', criteria: { type: 'upvotes_received', threshold: 10 } }),
    createTestBadge({ name: 'Expert', tier: 'gold', criteria: { type: 'accepted_count', threshold: 10 } }),
  ];
}

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - Input Types (for API testing)
// ══════════════════════════════════════════════════════════════════

export function createQuestionInput(overrides: Partial<CreateQuestionInput> = {}): CreateQuestionInput {
  return {
    title: overrides.title ?? 'How do I assess supplier risk for new vendors?',
    body: overrides.body ?? 'I need guidance on evaluating supplier risk for vendors we have not worked with before. What are the key factors to consider?',
    tagIds: overrides.tagIds ?? ['tag-1'],
    aiContextSummary: overrides.aiContextSummary,
  };
}

export function createAnswerInput(overrides: Partial<CreateAnswerInput> = {}): CreateAnswerInput {
  return {
    questionId: overrides.questionId ?? 'question-1',
    body: overrides.body ?? 'Here is a comprehensive answer to help you with supplier risk assessment. The key factors include financial stability, compliance history, and operational capacity.',
  };
}

// ══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - API Responses
// ══════════════════════════════════════════════════════════════════

export function createQuestionsListResponse(
  count = 5,
  overrides: Partial<QuestionsListResponse> = {}
): QuestionsListResponse {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(createTestQuestion());
  }

  return {
    questions,
    totalCount: overrides.totalCount ?? count,
    page: overrides.page ?? 1,
    pageSize: overrides.pageSize ?? 20,
    hasMore: overrides.hasMore ?? false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════
// INVALID TEST DATA
// ══════════════════════════════════════════════════════════════════

export const INVALID_QUESTION_TITLES = [
  '', // Empty
  'Short', // Too short (< 15 chars)
  'a'.repeat(301), // Too long (> 300 chars)
  '   ', // Only whitespace
];

export const INVALID_QUESTION_BODIES = [
  '', // Empty
  'Too short', // Too short (< 30 chars)
  '   ', // Only whitespace
];

export const INVALID_ANSWER_BODIES = [
  '', // Empty
  'Short', // Too short
  '   ', // Only whitespace
];

// ══════════════════════════════════════════════════════════════════
// MOCK DATA BUILDERS
// ══════════════════════════════════════════════════════════════════

export function buildMockQuestionsPage(
  page: number,
  pageSize: number,
  totalCount: number
): QuestionsListResponse {
  const startIdx = (page - 1) * pageSize;
  const count = Math.min(pageSize, totalCount - startIdx);
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    questions.push(createTestQuestion());
  }

  return {
    questions,
    totalCount,
    page,
    pageSize,
    hasMore: startIdx + count < totalCount,
  };
}

// ══════════════════════════════════════════════════════════════════
// RESET COUNTERS
// ══════════════════════════════════════════════════════════════════

export function resetTestCounters(): void {
  questionCounter = 0;
  answerCounter = 0;
  tagCounter = 0;
  userCounter = 0;
  badgeCounter = 0;
}

// ══════════════════════════════════════════════════════════════════
// VOTE HELPERS
// ══════════════════════════════════════════════════════════════════

export function createVoteScenario(type: 'upvoted' | 'downvoted' | 'none'): {
  userVote: VoteValue | null;
  expectedScore: number;
} {
  switch (type) {
    case 'upvoted':
      return { userVote: 1, expectedScore: 1 };
    case 'downvoted':
      return { userVote: -1, expectedScore: -1 };
    case 'none':
      return { userVote: null, expectedScore: 0 };
  }
}

// ══════════════════════════════════════════════════════════════════
// MOCK SERVICE HELPERS
// ══════════════════════════════════════════════════════════════════

export interface MockCommunityService {
  listQuestions: ReturnType<typeof import('vitest').vi.fn>;
  getQuestionById: ReturnType<typeof import('vitest').vi.fn>;
  createQuestion: ReturnType<typeof import('vitest').vi.fn>;
  updateQuestion: ReturnType<typeof import('vitest').vi.fn>;
  deleteQuestion: ReturnType<typeof import('vitest').vi.fn>;
  createAnswer: ReturnType<typeof import('vitest').vi.fn>;
  updateAnswer: ReturnType<typeof import('vitest').vi.fn>;
  deleteAnswer: ReturnType<typeof import('vitest').vi.fn>;
  acceptAnswer: ReturnType<typeof import('vitest').vi.fn>;
  castVote: ReturnType<typeof import('vitest').vi.fn>;
  removeVote: ReturnType<typeof import('vitest').vi.fn>;
}

export function createMockCommunityService(vi: typeof import('vitest').vi): MockCommunityService {
  return {
    listQuestions: vi.fn(),
    getQuestionById: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
    createAnswer: vi.fn(),
    updateAnswer: vi.fn(),
    deleteAnswer: vi.fn(),
    acceptAnswer: vi.fn(),
    castVote: vi.fn(),
    removeVote: vi.fn(),
  };
}
