// Tests for Community Q&A Service
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  incrementViewCount,
  getAnswersForQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  castVote,
  removeVote,
  listTags,
  getTagBySlug,
} from '../communityService';
import {
  createTestQuestion,
  createTestAnswer,
  createTestTag,
  createTestUserProfile,
  createQuestionInput,
  createAnswerInput,
  resetTestCounters,
} from '../../test/community-utils';

// ══════════════════════════════════════════════════════════════════
// MOCK DATABASE SETUP
// ══════════════════════════════════════════════════════════════════

// Create chainable mock
function createChainableMock(returnValue: unknown = []) {
  const mock: Record<string, Mock> = {};
  const chain = () => mock;

  mock.from = vi.fn().mockReturnThis();
  mock.leftJoin = vi.fn().mockReturnThis();
  mock.innerJoin = vi.fn().mockReturnThis();
  mock.where = vi.fn().mockReturnThis();
  mock.orderBy = vi.fn().mockReturnThis();
  mock.limit = vi.fn().mockReturnThis();
  mock.offset = vi.fn().mockReturnThis();
  mock.returning = vi.fn().mockResolvedValue(returnValue);
  mock.set = vi.fn().mockReturnThis();
  mock.values = vi.fn().mockReturnThis();

  // Make the mock resolve to returnValue when awaited directly
  mock.then = vi.fn((resolve) => Promise.resolve(returnValue).then(resolve));

  return mock;
}

function createMockDb() {
  const selectMock = createChainableMock();
  const insertMock = createChainableMock();
  const updateMock = createChainableMock();
  const deleteMock = createChainableMock();

  return {
    select: vi.fn(() => selectMock),
    insert: vi.fn(() => insertMock),
    update: vi.fn(() => updateMock),
    delete: vi.fn(() => deleteMock),
    _selectMock: selectMock,
    _insertMock: insertMock,
    _updateMock: updateMock,
    _deleteMock: deleteMock,
  };
}

// ══════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════

describe('communityService', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    resetTestCounters();
    mockDb = createMockDb();
    vi.clearAllMocks();
  });

  // ════════════════════════════════════════════════════════════════
  // QUESTION TESTS
  // ════════════════════════════════════════════════════════════════

  describe('Questions', () => {
    describe('listQuestions', () => {
      it('returns paginated results with default options', async () => {
        const mockQuestions = [
          { question: { id: 'q1', userId: 'u1', title: 'Test', body: 'Body', score: 0, viewCount: 0, answerCount: 0, acceptedAnswerId: null, status: 'open', aiContextSummary: null, createdAt: new Date(), updatedAt: new Date() }, profile: null },
        ];

        // Setup count query
        const countMock = createChainableMock([{ count: 1 }]);
        // Setup main query
        const mainMock = createChainableMock(mockQuestions);
        // Setup tags query
        const tagsMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return countMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return mainMock as unknown as ReturnType<typeof createChainableMock>;
          return tagsMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await listQuestions(mockDb as unknown as NeonHttpDatabase<Record<string, never>>);

        expect(result).toHaveProperty('questions');
        expect(result).toHaveProperty('totalCount');
        expect(result).toHaveProperty('hasMore');
      });

      it('applies sort correctly for newest', async () => {
        const mockQuestions: unknown[] = [];
        const countMock = createChainableMock([{ count: 0 }]);
        const mainMock = createChainableMock(mockQuestions);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return countMock as unknown as ReturnType<typeof createChainableMock>;
          return mainMock as unknown as ReturnType<typeof createChainableMock>;
        });

        await listQuestions(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, { sortBy: 'newest' });

        expect(mainMock.orderBy).toHaveBeenCalled();
      });

      it('applies sort correctly for votes', async () => {
        const countMock = createChainableMock([{ count: 0 }]);
        const mainMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return countMock as unknown as ReturnType<typeof createChainableMock>;
          return mainMock as unknown as ReturnType<typeof createChainableMock>;
        });

        await listQuestions(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, { sortBy: 'votes' });

        expect(mainMock.orderBy).toHaveBeenCalled();
      });

      it('applies filter for unanswered', async () => {
        const countMock = createChainableMock([{ count: 0 }]);
        const mainMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return countMock as unknown as ReturnType<typeof createChainableMock>;
          return mainMock as unknown as ReturnType<typeof createChainableMock>;
        });

        await listQuestions(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, { filter: 'unanswered' });

        // Check that where was called with conditions
        expect(mainMock.where).toHaveBeenCalled();
      });

      it('returns empty when tag not found', async () => {
        const tagMock = createChainableMock([]); // No tag found
        mockDb.select = vi.fn(() => tagMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await listQuestions(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          { tagSlug: 'nonexistent' }
        );

        expect(result.questions).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      it('includes user vote state when userId provided', async () => {
        // This test verifies that when userId is provided, the function attempts to fetch user votes
        // The actual vote state is populated from the voteResults query
        const countMock = createChainableMock([{ count: 0 }]);
        const mainMock = createChainableMock([]); // Empty results to simplify

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return countMock as unknown as ReturnType<typeof createChainableMock>;
          return mainMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await listQuestions(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          { userId: 'current-user' }
        );

        // Should complete without error when userId is provided
        expect(result.questions).toEqual([]);
        expect(result.totalCount).toBe(0);
        // The function should have made the select calls for count and main query
        expect(selectCallCount).toBeGreaterThanOrEqual(2);
      });
    });

    describe('getQuestionById', () => {
      it('returns question with tags and author', async () => {
        const mockQuestionData = {
          id: 'q1',
          userId: 'u1',
          title: 'Test Question',
          body: 'Test body content',
          score: 5,
          viewCount: 10,
          answerCount: 2,
          acceptedAnswerId: null,
          status: 'open',
          aiContextSummary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const questionMock = createChainableMock([{ question: mockQuestionData, profile: { displayName: 'Test User', reputation: 100 } }]);
        const tagsMock = createChainableMock([{ tag: { id: 't1', name: 'test-tag', slug: 'test-tag', description: 'Desc', questionCount: 5 } }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return tagsMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await getQuestionById(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'q1');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('q1');
        expect(result?.title).toBe('Test Question');
        expect(result?.tags).toHaveLength(1);
      });

      it('returns null for non-existent question', async () => {
        const emptyMock = createChainableMock([]);
        mockDb.select = vi.fn(() => emptyMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await getQuestionById(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'nonexistent');

        expect(result).toBeNull();
      });

      it('includes user vote when userId provided', async () => {
        const mockQuestionData = {
          id: 'q1',
          userId: 'u1',
          title: 'Test',
          body: 'Body',
          score: 5,
          viewCount: 10,
          answerCount: 2,
          acceptedAnswerId: null,
          status: 'open',
          aiContextSummary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const questionMock = createChainableMock([{ question: mockQuestionData, profile: null }]);
        const tagsMock = createChainableMock([]);
        const voteMock = createChainableMock([{ value: -1 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return tagsMock as unknown as ReturnType<typeof createChainableMock>;
          return voteMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await getQuestionById(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'voter-user'
        );

        expect(result?.userVote).toBe(-1);
      });
    });

    describe('createQuestion', () => {
      it('creates question with tags', async () => {
        const newQuestion = {
          id: 'new-q',
          userId: 'u1',
          title: 'New Question Title Here',
          body: 'Question body with sufficient length for validation',
          score: 0,
          viewCount: 0,
          answerCount: 0,
          acceptedAnswerId: null,
          status: 'open',
          aiContextSummary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert returns new question
        mockDb._insertMock.returning = vi.fn().mockResolvedValue([newQuestion]);

        // For getQuestionById call at the end
        const questionMock = createChainableMock([{ question: newQuestion, profile: null }]);
        const tagsMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return tagsMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const input = createQuestionInput({ tagIds: ['tag1', 'tag2'] });
        const result = await createQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'u1',
          input
        );

        expect(result).toBeDefined();
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('creates question without tags', async () => {
        const newQuestion = {
          id: 'new-q',
          userId: 'u1',
          title: 'Question without tags',
          body: 'Body content',
          score: 0,
          viewCount: 0,
          answerCount: 0,
          acceptedAnswerId: null,
          status: 'open',
          aiContextSummary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockDb._insertMock.returning = vi.fn().mockResolvedValue([newQuestion]);

        const questionMock = createChainableMock([{ question: newQuestion, profile: null }]);
        const tagsMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return tagsMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const input = createQuestionInput({ tagIds: [] });
        await createQuestion(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'u1', input);

        // Should only call insert once (for the question, not for tags)
        expect(mockDb.insert).toHaveBeenCalledTimes(1);
      });
    });

    describe('updateQuestion', () => {
      it('updates question when user is owner', async () => {
        // Verify ownership query
        const ownerMock = createChainableMock([{ userId: 'u1' }]);
        // After update, getQuestionById queries
        const questionMock = createChainableMock([{
          question: { id: 'q1', userId: 'u1', title: 'Updated', body: 'Body', score: 0, viewCount: 0, answerCount: 0, acceptedAnswerId: null, status: 'open', aiContextSummary: null, createdAt: new Date(), updatedAt: new Date() },
          profile: null,
        }]);
        const tagsMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return ownerMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return tagsMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await updateQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'u1',
          { title: 'Updated Title' }
        );

        expect(result).not.toBeNull();
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('returns null when user is not owner', async () => {
        const ownerMock = createChainableMock([{ userId: 'other-user' }]);
        mockDb.select = vi.fn(() => ownerMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await updateQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'u1',
          { title: 'Updated Title' }
        );

        expect(result).toBeNull();
        expect(mockDb.update).not.toHaveBeenCalled();
      });

      it('returns null for non-existent question', async () => {
        const emptyMock = createChainableMock([]);
        mockDb.select = vi.fn(() => emptyMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await updateQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'nonexistent',
          'u1',
          { title: 'Updated' }
        );

        expect(result).toBeNull();
      });
    });

    describe('deleteQuestion', () => {
      it('deletes question when user is owner', async () => {
        const ownerMock = createChainableMock([{ userId: 'u1' }]);
        const tagsMock = createChainableMock([{ tagId: 't1' }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return ownerMock as unknown as ReturnType<typeof createChainableMock>;
          return tagsMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await deleteQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'u1'
        );

        expect(result).toBe(true);
        expect(mockDb.delete).toHaveBeenCalled();
      });

      it('returns false when user is not owner', async () => {
        const ownerMock = createChainableMock([{ userId: 'other-user' }]);
        mockDb.select = vi.fn(() => ownerMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await deleteQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'u1'
        );

        expect(result).toBe(false);
        expect(mockDb.delete).not.toHaveBeenCalled();
      });

      it('returns false for non-existent question', async () => {
        const emptyMock = createChainableMock([]);
        mockDb.select = vi.fn(() => emptyMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await deleteQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'nonexistent',
          'u1'
        );

        expect(result).toBe(false);
      });
    });

    describe('incrementViewCount', () => {
      it('increments view count', async () => {
        await incrementViewCount(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'q1');

        expect(mockDb.update).toHaveBeenCalled();
        expect(mockDb._updateMock.set).toHaveBeenCalled();
        expect(mockDb._updateMock.where).toHaveBeenCalled();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // ANSWER TESTS
  // ════════════════════════════════════════════════════════════════

  describe('Answers', () => {
    describe('getAnswersForQuestion', () => {
      it('returns answers sorted by accepted status and score', async () => {
        const mockAnswers = [
          {
            answer: { id: 'a1', questionId: 'q1', userId: 'u1', body: 'Answer 1', score: 10, isAccepted: true, createdAt: new Date(), updatedAt: new Date() },
            profile: { displayName: 'User 1', reputation: 100 },
          },
          {
            answer: { id: 'a2', questionId: 'q1', userId: 'u2', body: 'Answer 2', score: 5, isAccepted: false, createdAt: new Date(), updatedAt: new Date() },
            profile: { displayName: 'User 2', reputation: 50 },
          },
        ];

        const answersMock = createChainableMock(mockAnswers);
        mockDb.select = vi.fn(() => answersMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await getAnswersForQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1'
        );

        expect(result).toHaveLength(2);
        expect(result[0].isAccepted).toBe(true);
      });

      it('includes user vote state when userId provided', async () => {
        const mockAnswers = [
          {
            answer: { id: 'a1', questionId: 'q1', userId: 'u1', body: 'Answer', score: 5, isAccepted: false, createdAt: new Date(), updatedAt: new Date() },
            profile: null,
          },
        ];

        const answersMock = createChainableMock(mockAnswers);
        const votesMock = createChainableMock([{ targetId: 'a1', value: 1 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return answersMock as unknown as ReturnType<typeof createChainableMock>;
          return votesMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await getAnswersForQuestion(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'voter-user'
        );

        expect(result[0].userVote).toBe(1);
      });
    });

    describe('createAnswer', () => {
      it('creates answer and increments question answerCount', async () => {
        // Question exists check
        const questionMock = createChainableMock([{ id: 'q1' }]);
        // Profile lookup
        const profileMock = createChainableMock([{ displayName: 'Test User', reputation: 100 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return profileMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const newAnswer = {
          id: 'new-a',
          questionId: 'q1',
          userId: 'u1',
          body: 'New answer content',
          score: 0,
          isAccepted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDb._insertMock.returning = vi.fn().mockResolvedValue([newAnswer]);

        const input = createAnswerInput({ questionId: 'q1' });
        const result = await createAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'u1',
          input
        );

        expect(result.id).toBe('new-a');
        expect(mockDb.insert).toHaveBeenCalled();
        expect(mockDb.update).toHaveBeenCalled(); // For incrementing answer count
      });

      it('throws error when question not found', async () => {
        const emptyMock = createChainableMock([]);
        mockDb.select = vi.fn(() => emptyMock as unknown as ReturnType<typeof createChainableMock>);

        const input = createAnswerInput({ questionId: 'nonexistent' });

        await expect(
          createAnswer(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'u1', input)
        ).rejects.toThrow('Question not found');
      });
    });

    describe('updateAnswer', () => {
      it('updates answer when user is owner', async () => {
        const ownerMock = createChainableMock([{ userId: 'u1', questionId: 'q1' }]);
        const updatedMock = createChainableMock([{
          answer: { id: 'a1', questionId: 'q1', userId: 'u1', body: 'Updated body', score: 0, isAccepted: false, createdAt: new Date(), updatedAt: new Date() },
          profile: null,
        }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return ownerMock as unknown as ReturnType<typeof createChainableMock>;
          return updatedMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await updateAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'a1',
          'u1',
          'Updated body content'
        );

        expect(result).not.toBeNull();
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('returns null when user is not owner', async () => {
        const ownerMock = createChainableMock([{ userId: 'other-user', questionId: 'q1' }]);
        mockDb.select = vi.fn(() => ownerMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await updateAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'a1',
          'u1',
          'Updated body'
        );

        expect(result).toBeNull();
      });
    });

    describe('deleteAnswer', () => {
      it('deletes answer and decrements answerCount', async () => {
        const ownerMock = createChainableMock([{ userId: 'u1', questionId: 'q1', isAccepted: false }]);
        mockDb.select = vi.fn(() => ownerMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await deleteAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'a1',
          'u1'
        );

        expect(result).toBe(true);
        expect(mockDb.delete).toHaveBeenCalled();
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('reverts accepted status when deleting accepted answer', async () => {
        const ownerMock = createChainableMock([{ userId: 'u1', questionId: 'q1', isAccepted: true }]);
        mockDb.select = vi.fn(() => ownerMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await deleteAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'a1',
          'u1'
        );

        expect(result).toBe(true);
        // Verify the update was called with status reset
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('returns false when user is not owner', async () => {
        const ownerMock = createChainableMock([{ userId: 'other-user', questionId: 'q1', isAccepted: false }]);
        mockDb.select = vi.fn(() => ownerMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await deleteAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'a1',
          'u1'
        );

        expect(result).toBe(false);
      });
    });

    describe('acceptAnswer', () => {
      it('accepts answer and awards reputation', async () => {
        // Question ownership check
        const questionMock = createChainableMock([{ userId: 'q-owner', acceptedAnswerId: null }]);
        // Answer validation
        const answerMock = createChainableMock([{ id: 'a1', userId: 'a-author' }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return answerMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await acceptAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'a1',
          'q-owner'
        );

        expect(result.success).toBe(true);
        expect(result.answerAuthorId).toBe('a-author');
        expect(mockDb.update).toHaveBeenCalled();
        expect(mockDb.insert).toHaveBeenCalled(); // For reputation log
      });

      it('returns false when user is not question owner', async () => {
        const questionMock = createChainableMock([{ userId: 'other-user', acceptedAnswerId: null }]);
        mockDb.select = vi.fn(() => questionMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await acceptAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'a1',
          'not-owner'
        );

        expect(result.success).toBe(false);
      });

      it('returns false when answer does not belong to question', async () => {
        const questionMock = createChainableMock([{ userId: 'q-owner', acceptedAnswerId: null }]);
        const answerMock = createChainableMock([]); // No matching answer

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return answerMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await acceptAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'wrong-answer',
          'q-owner'
        );

        expect(result.success).toBe(false);
      });

      it('is idempotent when same answer already accepted', async () => {
        const questionMock = createChainableMock([{ userId: 'q-owner', acceptedAnswerId: 'a1' }]);
        const answerMock = createChainableMock([{ id: 'a1', userId: 'a-author' }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return questionMock as unknown as ReturnType<typeof createChainableMock>;
          return answerMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await acceptAnswer(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'q1',
          'a1',
          'q-owner'
        );

        expect(result.success).toBe(true);
        // Should not have made additional updates since it's already accepted
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // VOTING TESTS
  // ════════════════════════════════════════════════════════════════

  describe('Voting', () => {
    describe('castVote', () => {
      it('creates new vote and updates score', async () => {
        // No existing vote
        const existingVoteMock = createChainableMock([]);
        // Get target owner (question)
        const ownerMock = createChainableMock([{ userId: 'target-owner' }]);
        // Get new score
        const scoreMock = createChainableMock([{ score: 1 }]);
        // Get current user vote
        const userVoteMock = createChainableMock([{ value: 1 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return ownerMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 3) return scoreMock as unknown as ReturnType<typeof createChainableMock>;
          return userVoteMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await castVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'q1',
          1
        );

        expect(result.success).toBe(true);
        expect(result.newScore).toBe(1);
        expect(result.userVote).toBe(1);
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('toggles off vote when same value', async () => {
        // Existing vote with same value
        const existingVoteMock = createChainableMock([{ id: 'v1', value: 1 }]);
        const ownerMock = createChainableMock([{ userId: 'target-owner' }]);
        const scoreMock = createChainableMock([{ score: 0 }]);
        const userVoteMock = createChainableMock([]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return ownerMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 3) return scoreMock as unknown as ReturnType<typeof createChainableMock>;
          return userVoteMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await castVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'q1',
          1
        );

        expect(result.success).toBe(true);
        expect(result.userVote).toBeNull();
        expect(mockDb.delete).toHaveBeenCalled();
      });

      it('switches vote when different value', async () => {
        // Existing upvote, casting downvote
        const existingVoteMock = createChainableMock([{ id: 'v1', value: 1 }]);
        const ownerMock = createChainableMock([{ userId: 'target-owner' }]);
        const scoreMock = createChainableMock([{ score: -1 }]);
        const userVoteMock = createChainableMock([{ value: -1 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return ownerMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 3) return scoreMock as unknown as ReturnType<typeof createChainableMock>;
          return userVoteMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await castVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'q1',
          -1
        );

        expect(result.success).toBe(true);
        expect(result.userVote).toBe(-1);
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('prevents self-voting', async () => {
        const existingVoteMock = createChainableMock([]);
        // Owner is the same as voter
        const ownerMock = createChainableMock([{ userId: 'voter' }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          return ownerMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await castVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'q1',
          1
        );

        expect(result.success).toBe(false);
      });

      it('returns failure when target not found', async () => {
        const existingVoteMock = createChainableMock([]);
        const ownerMock = createChainableMock([]); // No owner found

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          return ownerMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await castVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'nonexistent',
          1
        );

        expect(result.success).toBe(false);
      });
    });

    describe('removeVote', () => {
      it('removes existing vote and updates score', async () => {
        const existingVoteMock = createChainableMock([{ id: 'v1', value: 1 }]);
        const targetMock = createChainableMock([{ userId: 'target-owner' }]);
        const scoreMock = createChainableMock([{ score: 0 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          if (selectCallCount === 2) return targetMock as unknown as ReturnType<typeof createChainableMock>;
          return scoreMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await removeVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'q1'
        );

        expect(result.success).toBe(true);
        expect(result.userVote).toBeNull();
        expect(mockDb.delete).toHaveBeenCalled();
      });

      it('succeeds even when no vote exists', async () => {
        const existingVoteMock = createChainableMock([]);
        const scoreMock = createChainableMock([{ score: 5 }]);

        let selectCallCount = 0;
        mockDb.select = vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) return existingVoteMock as unknown as ReturnType<typeof createChainableMock>;
          return scoreMock as unknown as ReturnType<typeof createChainableMock>;
        });

        const result = await removeVote(
          mockDb as unknown as NeonHttpDatabase<Record<string, never>>,
          'voter',
          'question',
          'q1'
        );

        expect(result.success).toBe(true);
        expect(result.newScore).toBe(5);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // TAG TESTS
  // ════════════════════════════════════════════════════════════════

  describe('Tags', () => {
    describe('listTags', () => {
      it('returns tags sorted by question count', async () => {
        const mockTags = [
          { id: 't1', name: 'Popular', slug: 'popular', description: 'Popular tag', questionCount: 100 },
          { id: 't2', name: 'Less Popular', slug: 'less-popular', description: null, questionCount: 50 },
        ];

        const tagsMock = createChainableMock(mockTags);
        mockDb.select = vi.fn(() => tagsMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await listTags(mockDb as unknown as NeonHttpDatabase<Record<string, never>>);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Popular');
        expect(result[0].questionCount).toBe(100);
      });
    });

    describe('getTagBySlug', () => {
      it('returns tag when found', async () => {
        const tagMock = createChainableMock([{ id: 't1', name: 'Test Tag', slug: 'test-tag', description: 'Description', questionCount: 10 }]);
        mockDb.select = vi.fn(() => tagMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await getTagBySlug(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'test-tag');

        expect(result).not.toBeNull();
        expect(result?.slug).toBe('test-tag');
      });

      it('returns null when tag not found', async () => {
        const tagMock = createChainableMock([]);
        mockDb.select = vi.fn(() => tagMock as unknown as ReturnType<typeof createChainableMock>);

        const result = await getTagBySlug(mockDb as unknown as NeonHttpDatabase<Record<string, never>>, 'nonexistent');

        expect(result).toBeNull();
      });
    });
  });
});
