// Community Service - Database operations for Q&A system
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import {
  questions,
  answers,
  votes,
  tags,
  questionTags,
  profiles,
  reputationLog,
} from '../db/schema.js';
import type {
  DbQuestion,
  DbAnswer,
  Vote,
  Tag as DbTag,
  Profile,
} from '../db/schema.js';
import type {
  Question,
  Answer,
  Tag,
  UserProfile,
  CreateQuestionInput,
  CreateAnswerInput,
  QuestionSortBy,
  QuestionFilter,
  VoteValue,
  VoteTargetType,
  ReputationReason,
  REPUTATION_CHANGES,
} from '../types/community.js';

// Re-export for API use
export { REPUTATION_CHANGES } from '../types/community.js';

// ══════════════════════════════════════════════════════════════════
// HELPER: Build user profile from DB profile
// ══════════════════════════════════════════════════════════════════

function buildUserProfile(profile: Profile | null, userId: string): UserProfile {
  return {
    id: userId,
    displayName: profile?.displayName || undefined,
    avatarUrl: profile?.avatarUrl || undefined,
    title: profile?.jobTitle || undefined,
    company: profile?.company || undefined,
    reputation: profile?.reputation || 0,
  };
}

// ══════════════════════════════════════════════════════════════════
// QUESTIONS
// ══════════════════════════════════════════════════════════════════

interface ListQuestionsOptions {
  sortBy?: QuestionSortBy;
  filter?: QuestionFilter;
  tagSlug?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  userId?: string | null; // For vote state
}

export async function listQuestions(
  db: NeonHttpDatabase<Record<string, never>>,
  options: ListQuestionsOptions = {}
): Promise<{ questions: Question[]; totalCount: number; hasMore: boolean }> {
  const {
    sortBy = 'newest',
    filter = 'all',
    tagSlug = null,
    search = null,
    page = 1,
    pageSize = 20,
    userId = null,
  } = options;

  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (filter === 'open') {
    conditions.push(eq(questions.status, 'open'));
  } else if (filter === 'answered') {
    conditions.push(eq(questions.status, 'answered'));
  } else if (filter === 'unanswered') {
    // Strictly filter to questions with zero answers
    conditions.push(eq(questions.answerCount, 0));
  }

  // Build ORDER BY
  let orderBy;
  switch (sortBy) {
    case 'votes':
      orderBy = desc(questions.score);
      break;
    case 'unanswered':
      // Sort by answer count ascending (fewest answers first)
      orderBy = asc(questions.answerCount);
      break;
    case 'active':
      orderBy = desc(questions.updatedAt);
      break;
    case 'newest':
    default:
      orderBy = desc(questions.createdAt);
  }

  // Base query - get questions with author profile
  let query = db
    .select({
      question: questions,
      profile: profiles,
    })
    .from(questions)
    .leftJoin(profiles, eq(profiles.userId, questions.userId));

  // Apply tag filter via subquery if needed
  if (tagSlug) {
    const tagResult = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, tagSlug))
      .limit(1);

    if (tagResult.length === 0) {
      // Tag not found - return empty results
      return { questions: [], totalCount: 0, hasMore: false };
    }

    const tagId = tagResult[0].id;
    const questionIdsWithTag = await db
      .select({ questionId: questionTags.questionId })
      .from(questionTags)
      .where(eq(questionTags.tagId, tagId));

    if (questionIdsWithTag.length > 0) {
      conditions.push(
        inArray(
          questions.id,
          questionIdsWithTag.map(r => r.questionId)
        )
      );
    } else {
      // No questions with this tag
      return { questions: [], totalCount: 0, hasMore: false };
    }
  }

  // Apply search filter
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`(${questions.title} ILIKE ${searchTerm} OR ${questions.body} ILIKE ${searchTerm})`
    );
  }

  // Apply conditions
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(whereClause);
  const totalCount = countResult[0]?.count || 0;

  // Get paginated results
  const results = await db
    .select({
      question: questions,
      profile: profiles,
    })
    .from(questions)
    .leftJoin(profiles, eq(profiles.userId, questions.userId))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // Get tags for each question
  const questionIds = results.map(r => r.question.id);
  const questionTagsResult = questionIds.length > 0
    ? await db
        .select({
          questionId: questionTags.questionId,
          tag: tags,
        })
        .from(questionTags)
        .innerJoin(tags, eq(tags.id, questionTags.tagId))
        .where(inArray(questionTags.questionId, questionIds))
    : [];

  // Group tags by question
  const tagsByQuestion = new Map<string, Tag[]>();
  for (const { questionId, tag } of questionTagsResult) {
    if (!tagsByQuestion.has(questionId)) {
      tagsByQuestion.set(questionId, []);
    }
    tagsByQuestion.get(questionId)!.push({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      questionCount: tag.questionCount,
    });
  }

  // Get user votes if authenticated
  const userVotes = new Map<string, VoteValue>();
  if (userId && questionIds.length > 0) {
    const voteResults = await db
      .select({ targetId: votes.targetId, value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.targetType, 'question'),
          inArray(votes.targetId, questionIds)
        )
      );
    for (const v of voteResults) {
      userVotes.set(v.targetId, v.value as VoteValue);
    }
  }

  // Build response
  const questionList: Question[] = results.map(({ question, profile }) => ({
    id: question.id,
    userId: question.userId,
    author: buildUserProfile(profile, question.userId),
    title: question.title,
    body: question.body,
    aiContextSummary: question.aiContextSummary || undefined,
    score: question.score,
    viewCount: question.viewCount,
    answerCount: question.answerCount,
    acceptedAnswerId: question.acceptedAnswerId || undefined,
    hasAcceptedAnswer: !!question.acceptedAnswerId,
    status: question.status as 'open' | 'answered' | 'closed',
    tags: tagsByQuestion.get(question.id) || [],
    userVote: userVotes.get(question.id) || null,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  }));

  return {
    questions: questionList,
    totalCount,
    hasMore: offset + results.length < totalCount,
  };
}

export async function getQuestionById(
  db: NeonHttpDatabase<Record<string, never>>,
  questionId: string,
  userId?: string | null
): Promise<Question | null> {
  const results = await db
    .select({
      question: questions,
      profile: profiles,
    })
    .from(questions)
    .leftJoin(profiles, eq(profiles.userId, questions.userId))
    .where(eq(questions.id, questionId))
    .limit(1);

  if (results.length === 0) return null;

  const { question, profile } = results[0];

  // Get tags
  const questionTagsResult = await db
    .select({ tag: tags })
    .from(questionTags)
    .innerJoin(tags, eq(tags.id, questionTags.tagId))
    .where(eq(questionTags.questionId, questionId));

  const tagList: Tag[] = questionTagsResult.map(({ tag }) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description || undefined,
    questionCount: tag.questionCount,
  }));

  // Get user vote
  let userVote: VoteValue | null = null;
  if (userId) {
    const voteResult = await db
      .select({ value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.targetType, 'question'),
          eq(votes.targetId, questionId)
        )
      )
      .limit(1);
    if (voteResult.length > 0) {
      userVote = voteResult[0].value as VoteValue;
    }
  }

  return {
    id: question.id,
    userId: question.userId,
    author: buildUserProfile(profile, question.userId),
    title: question.title,
    body: question.body,
    aiContextSummary: question.aiContextSummary || undefined,
    score: question.score,
    viewCount: question.viewCount,
    answerCount: question.answerCount,
    acceptedAnswerId: question.acceptedAnswerId || undefined,
    hasAcceptedAnswer: !!question.acceptedAnswerId,
    status: question.status as 'open' | 'answered' | 'closed',
    tags: tagList,
    userVote,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}

export async function createQuestion(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  input: CreateQuestionInput
): Promise<Question> {
  const { title, body, tagIds, aiContextSummary } = input;

  // Insert question
  const [newQuestion] = await db
    .insert(questions)
    .values({
      userId,
      title,
      body,
      aiContextSummary: aiContextSummary || null,
    })
    .returning();

  // Insert question-tag associations
  if (tagIds.length > 0) {
    await db.insert(questionTags).values(
      tagIds.map(tagId => ({
        questionId: newQuestion.id,
        tagId,
      }))
    );

    // Increment tag question counts
    await db
      .update(tags)
      .set({ questionCount: sql`${tags.questionCount} + 1` })
      .where(inArray(tags.id, tagIds));
  }

  return getQuestionById(db, newQuestion.id, userId) as Promise<Question>;
}

export async function updateQuestion(
  db: NeonHttpDatabase<Record<string, never>>,
  questionId: string,
  userId: string,
  input: Partial<CreateQuestionInput>
): Promise<Question | null> {
  // Verify ownership
  const existing = await db
    .select({ userId: questions.userId })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (existing.length === 0 || existing[0].userId !== userId) {
    return null;
  }

  const updates: Partial<DbQuestion> = {
    updatedAt: new Date(),
  };

  if (input.title) updates.title = input.title;
  if (input.body) updates.body = input.body;

  await db
    .update(questions)
    .set(updates)
    .where(eq(questions.id, questionId));

  // Update tags if provided
  if (input.tagIds) {
    // Get current tags
    const currentTags = await db
      .select({ tagId: questionTags.tagId })
      .from(questionTags)
      .where(eq(questionTags.questionId, questionId));

    const currentTagIds = currentTags.map(t => t.tagId);
    const newTagIds = input.tagIds;

    // Tags to remove
    const toRemove = currentTagIds.filter(id => !newTagIds.includes(id));
    // Tags to add
    const toAdd = newTagIds.filter(id => !currentTagIds.includes(id));

    if (toRemove.length > 0) {
      await db
        .delete(questionTags)
        .where(
          and(
            eq(questionTags.questionId, questionId),
            inArray(questionTags.tagId, toRemove)
          )
        );
      await db
        .update(tags)
        .set({ questionCount: sql`${tags.questionCount} - 1` })
        .where(inArray(tags.id, toRemove));
    }

    if (toAdd.length > 0) {
      await db.insert(questionTags).values(
        toAdd.map(tagId => ({ questionId, tagId }))
      );
      await db
        .update(tags)
        .set({ questionCount: sql`${tags.questionCount} + 1` })
        .where(inArray(tags.id, toAdd));
    }
  }

  return getQuestionById(db, questionId, userId);
}

export async function deleteQuestion(
  db: NeonHttpDatabase<Record<string, never>>,
  questionId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await db
    .select({ userId: questions.userId })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (existing.length === 0 || existing[0].userId !== userId) {
    return false;
  }

  // Get tags to decrement counts
  const questionTagsList = await db
    .select({ tagId: questionTags.tagId })
    .from(questionTags)
    .where(eq(questionTags.questionId, questionId));

  if (questionTagsList.length > 0) {
    await db
      .update(tags)
      .set({ questionCount: sql`${tags.questionCount} - 1` })
      .where(inArray(tags.id, questionTagsList.map(t => t.tagId)));
  }

  // Delete question (cascades to answers, question_tags)
  await db.delete(questions).where(eq(questions.id, questionId));

  return true;
}

export async function incrementViewCount(
  db: NeonHttpDatabase<Record<string, never>>,
  questionId: string
): Promise<void> {
  await db
    .update(questions)
    .set({ viewCount: sql`${questions.viewCount} + 1` })
    .where(eq(questions.id, questionId));
}

// ══════════════════════════════════════════════════════════════════
// ANSWERS
// ══════════════════════════════════════════════════════════════════

export async function getAnswersForQuestion(
  db: NeonHttpDatabase<Record<string, never>>,
  questionId: string,
  userId?: string | null
): Promise<Answer[]> {
  const results = await db
    .select({
      answer: answers,
      profile: profiles,
    })
    .from(answers)
    .leftJoin(profiles, eq(profiles.userId, answers.userId))
    .where(eq(answers.questionId, questionId))
    .orderBy(desc(answers.isAccepted), desc(answers.score), asc(answers.createdAt));

  // Get user votes if authenticated
  const answerIds = results.map(r => r.answer.id);
  const userVotes = new Map<string, VoteValue>();
  if (userId && answerIds.length > 0) {
    const voteResults = await db
      .select({ targetId: votes.targetId, value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.targetType, 'answer'),
          inArray(votes.targetId, answerIds)
        )
      );
    for (const v of voteResults) {
      userVotes.set(v.targetId, v.value as VoteValue);
    }
  }

  return results.map(({ answer, profile }) => ({
    id: answer.id,
    questionId: answer.questionId,
    userId: answer.userId,
    author: buildUserProfile(profile, answer.userId),
    body: answer.body,
    score: answer.score,
    isAccepted: answer.isAccepted,
    userVote: userVotes.get(answer.id) || null,
    createdAt: answer.createdAt.toISOString(),
    updatedAt: answer.updatedAt.toISOString(),
  }));
}

export async function createAnswer(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  input: CreateAnswerInput
): Promise<Answer> {
  const { questionId, body } = input;

  // Verify question exists
  const question = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (question.length === 0) {
    throw new Error('Question not found');
  }

  // Insert answer
  const [newAnswer] = await db
    .insert(answers)
    .values({
      questionId,
      userId,
      body,
    })
    .returning();

  // Update question answer count
  await db
    .update(questions)
    .set({
      answerCount: sql`${questions.answerCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId));

  // Get profile for response
  const profileResult = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return {
    id: newAnswer.id,
    questionId: newAnswer.questionId,
    userId: newAnswer.userId,
    author: buildUserProfile(profileResult[0] || null, userId),
    body: newAnswer.body,
    score: newAnswer.score,
    isAccepted: newAnswer.isAccepted,
    userVote: null,
    createdAt: newAnswer.createdAt.toISOString(),
    updatedAt: newAnswer.updatedAt.toISOString(),
  };
}

export async function updateAnswer(
  db: NeonHttpDatabase<Record<string, never>>,
  answerId: string,
  userId: string,
  body: string
): Promise<Answer | null> {
  // Verify ownership
  const existing = await db
    .select({ userId: answers.userId, questionId: answers.questionId })
    .from(answers)
    .where(eq(answers.id, answerId))
    .limit(1);

  if (existing.length === 0 || existing[0].userId !== userId) {
    return null;
  }

  await db
    .update(answers)
    .set({ body, updatedAt: new Date() })
    .where(eq(answers.id, answerId));

  // Update question updatedAt
  await db
    .update(questions)
    .set({ updatedAt: new Date() })
    .where(eq(questions.id, existing[0].questionId));

  // Return updated answer
  const result = await db
    .select({
      answer: answers,
      profile: profiles,
    })
    .from(answers)
    .leftJoin(profiles, eq(profiles.userId, answers.userId))
    .where(eq(answers.id, answerId))
    .limit(1);

  if (result.length === 0) return null;

  const { answer, profile } = result[0];
  return {
    id: answer.id,
    questionId: answer.questionId,
    userId: answer.userId,
    author: buildUserProfile(profile, answer.userId),
    body: answer.body,
    score: answer.score,
    isAccepted: answer.isAccepted,
    userVote: null,
    createdAt: answer.createdAt.toISOString(),
    updatedAt: answer.updatedAt.toISOString(),
  };
}

export async function deleteAnswer(
  db: NeonHttpDatabase<Record<string, never>>,
  answerId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await db
    .select({
      userId: answers.userId,
      questionId: answers.questionId,
      isAccepted: answers.isAccepted,
    })
    .from(answers)
    .where(eq(answers.id, answerId))
    .limit(1);

  if (existing.length === 0 || existing[0].userId !== userId) {
    return false;
  }

  const { questionId, isAccepted } = existing[0];

  // Delete answer
  await db.delete(answers).where(eq(answers.id, answerId));

  // Update question
  const questionUpdates: { answerCount: ReturnType<typeof sql>; updatedAt: Date; acceptedAnswerId?: null; status?: string } = {
    answerCount: sql`${questions.answerCount} - 1`,
    updatedAt: new Date(),
  };

  if (isAccepted) {
    questionUpdates.acceptedAnswerId = null;
    questionUpdates.status = 'open';
  }

  await db
    .update(questions)
    .set(questionUpdates)
    .where(eq(questions.id, questionId));

  return true;
}

interface AcceptAnswerResult {
  success: boolean;
  answerAuthorId?: string;
}

export async function acceptAnswer(
  db: NeonHttpDatabase<Record<string, never>>,
  questionId: string,
  answerId: string,
  userId: string
): Promise<AcceptAnswerResult> {
  // Verify question ownership
  const question = await db
    .select({ userId: questions.userId, acceptedAnswerId: questions.acceptedAnswerId })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (question.length === 0 || question[0].userId !== userId) {
    return { success: false };
  }

  // Verify answer belongs to question
  const answer = await db
    .select({ id: answers.id, userId: answers.userId })
    .from(answers)
    .where(and(eq(answers.id, answerId), eq(answers.questionId, questionId)))
    .limit(1);

  if (answer.length === 0) {
    return { success: false };
  }

  const previousAcceptedId = question[0].acceptedAnswerId;

  // Idempotent: if same answer is already accepted, no-op
  if (previousAcceptedId === answerId) {
    return { success: true, answerAuthorId: answer[0].userId };
  }

  // If switching from a different accepted answer, reverse prior reputation
  if (previousAcceptedId) {
    // Get the previous answer author
    const previousAnswer = await db
      .select({ userId: answers.userId })
      .from(answers)
      .where(eq(answers.id, previousAcceptedId))
      .limit(1);

    if (previousAnswer.length > 0) {
      // Reverse previous answer author's +15
      await reverseReputation(db, previousAnswer[0].userId, 'answer_accepted', 'answer', previousAcceptedId);
      // Reverse question owner's +2 for accepting
      await reverseReputation(db, userId, 'accepted_answer', 'question', questionId);
    }

    // Unaccept previous answer
    await db
      .update(answers)
      .set({ isAccepted: false })
      .where(eq(answers.id, previousAcceptedId));
  }

  // Accept new answer
  await db
    .update(answers)
    .set({ isAccepted: true })
    .where(eq(answers.id, answerId));

  // Update question
  await db
    .update(questions)
    .set({
      acceptedAnswerId: answerId,
      status: 'answered',
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId));

  // Award reputation to new answer author and question owner
  // answer_accepted: +15 to answer author
  // accepted_answer: +2 to question author
  await updateReputation(db, answer[0].userId, 'answer_accepted', 'answer', answerId);
  await updateReputation(db, userId, 'accepted_answer', 'question', questionId);

  return { success: true, answerAuthorId: answer[0].userId };
}

// ══════════════════════════════════════════════════════════════════
// VOTING
// ══════════════════════════════════════════════════════════════════

interface CastVoteResult {
  success: boolean;
  newScore: number;
  userVote: VoteValue | null;
  targetOwnerId?: string; // For badge evaluation
}

export async function castVote(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  targetType: VoteTargetType,
  targetId: string,
  value: VoteValue
): Promise<CastVoteResult> {
  // Check for existing vote
  const existingVote = await db
    .select()
    .from(votes)
    .where(
      and(
        eq(votes.userId, userId),
        eq(votes.targetType, targetType),
        eq(votes.targetId, targetId)
      )
    )
    .limit(1);

  // Get target owner for reputation
  let targetOwnerId: string | null = null;
  if (targetType === 'question') {
    const q = await db
      .select({ userId: questions.userId })
      .from(questions)
      .where(eq(questions.id, targetId))
      .limit(1);
    targetOwnerId = q[0]?.userId || null;
  } else {
    const a = await db
      .select({ userId: answers.userId })
      .from(answers)
      .where(eq(answers.id, targetId))
      .limit(1);
    targetOwnerId = a[0]?.userId || null;
  }

  if (!targetOwnerId) {
    return { success: false, newScore: 0, userVote: null };
  }

  // Can't vote on your own content
  if (targetOwnerId === userId) {
    return { success: false, newScore: 0, userVote: null };
  }

  let scoreDelta = 0;

  if (existingVote.length > 0) {
    const oldValue = existingVote[0].value as VoteValue;

    if (oldValue === value) {
      // Same vote - toggle it off (remove)
      await db
        .delete(votes)
        .where(eq(votes.id, existingVote[0].id));

      scoreDelta = -value;

      // Reverse the original reputation award
      if (value === 1) {
        // Removing an upvote: reverse the +5/+10 that was given
        await reverseReputation(
          db,
          targetOwnerId,
          targetType === 'question' ? 'question_upvoted' : 'answer_upvoted',
          targetType,
          targetId
        );
      } else {
        // Removing a downvote: reverse the -2 that was applied
        await reverseReputation(
          db,
          targetOwnerId,
          targetType === 'question' ? 'question_downvoted' : 'answer_downvoted',
          targetType,
          targetId
        );
        // Refund the -1 downvote cost to the voter
        await reverseReputation(db, userId, 'downvote_cast', 'vote', existingVote[0].id);
      }
    } else {
      // Different vote - switch direction
      await db
        .update(votes)
        .set({ value })
        .where(eq(votes.id, existingVote[0].id));

      scoreDelta = value - oldValue; // e.g., going from -1 to +1 = +2

      if (value === 1) {
        // Switching from downvote to upvote
        // 1. Reverse the old downvote effect (+2 to owner)
        await reverseReputation(
          db,
          targetOwnerId,
          targetType === 'question' ? 'question_downvoted' : 'answer_downvoted',
          targetType,
          targetId
        );
        // 2. Apply the new upvote effect (+5/+10 to owner)
        await updateReputation(
          db,
          targetOwnerId,
          targetType === 'question' ? 'question_upvoted' : 'answer_upvoted',
          targetType,
          targetId
        );
        // 3. Refund the downvote cost to voter (+1)
        await reverseReputation(db, userId, 'downvote_cast', 'vote', existingVote[0].id);
      } else {
        // Switching from upvote to downvote
        // 1. Reverse the old upvote effect (-5/-10 to owner)
        await reverseReputation(
          db,
          targetOwnerId,
          targetType === 'question' ? 'question_upvoted' : 'answer_upvoted',
          targetType,
          targetId
        );
        // 2. Apply the new downvote effect (-2 to owner)
        await updateReputation(
          db,
          targetOwnerId,
          targetType === 'question' ? 'question_downvoted' : 'answer_downvoted',
          targetType,
          targetId
        );
        // 3. Charge downvote cost to voter (-1)
        await updateReputation(db, userId, 'downvote_cast', 'vote', targetId);
      }
    }
  } else {
    // New vote
    await db.insert(votes).values({
      userId,
      targetType,
      targetId,
      value,
    });

    scoreDelta = value;

    // Award/deduct reputation
    if (value === 1) {
      await updateReputation(
        db,
        targetOwnerId,
        targetType === 'question' ? 'question_upvoted' : 'answer_upvoted',
        targetType,
        targetId
      );
    } else {
      await updateReputation(
        db,
        targetOwnerId,
        targetType === 'question' ? 'question_downvoted' : 'answer_downvoted',
        targetType,
        targetId
      );
      // Charge voter for downvoting
      await updateReputation(db, userId, 'downvote_cast', 'vote', targetId);
    }
  }

  // Update target score
  const table = targetType === 'question' ? questions : answers;
  const idColumn = targetType === 'question' ? questions.id : answers.id;
  const scoreColumn = targetType === 'question' ? questions.score : answers.score;

  await db
    .update(table)
    .set({ score: sql`${scoreColumn} + ${scoreDelta}` })
    .where(eq(idColumn, targetId));

  // Get new score
  const newScoreResult = await db
    .select({ score: scoreColumn })
    .from(table)
    .where(eq(idColumn, targetId))
    .limit(1);

  // Get current user vote
  const currentVote = await db
    .select({ value: votes.value })
    .from(votes)
    .where(
      and(
        eq(votes.userId, userId),
        eq(votes.targetType, targetType),
        eq(votes.targetId, targetId)
      )
    )
    .limit(1);

  return {
    success: true,
    newScore: newScoreResult[0]?.score || 0,
    userVote: currentVote.length > 0 ? (currentVote[0].value as VoteValue) : null,
    targetOwnerId,
  };
}

export async function removeVote(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  targetType: VoteTargetType,
  targetId: string
): Promise<CastVoteResult> {
  const existingVote = await db
    .select()
    .from(votes)
    .where(
      and(
        eq(votes.userId, userId),
        eq(votes.targetType, targetType),
        eq(votes.targetId, targetId)
      )
    )
    .limit(1);

  if (existingVote.length === 0) {
    // No vote to remove
    const table = targetType === 'question' ? questions : answers;
    const idColumn = targetType === 'question' ? questions.id : answers.id;
    const scoreColumn = targetType === 'question' ? questions.score : answers.score;

    const scoreResult = await db
      .select({ score: scoreColumn })
      .from(table)
      .where(eq(idColumn, targetId))
      .limit(1);

    return {
      success: true,
      newScore: scoreResult[0]?.score || 0,
      userVote: null,
    };
  }

  const oldValue = existingVote[0].value as VoteValue;

  // Get the target owner for reputation reversal
  const table = targetType === 'question' ? questions : answers;
  const idColumn = targetType === 'question' ? questions.id : answers.id;
  const scoreColumn = targetType === 'question' ? questions.score : answers.score;
  const userIdColumn = targetType === 'question' ? questions.userId : answers.userId;

  const targetResult = await db
    .select({ userId: userIdColumn })
    .from(table)
    .where(eq(idColumn, targetId))
    .limit(1);

  const targetOwnerId = targetResult[0]?.userId;

  // Delete vote
  await db
    .delete(votes)
    .where(eq(votes.id, existingVote[0].id));

  // Reverse reputation effects
  if (targetOwnerId) {
    if (oldValue === 1) {
      // Was an upvote - reverse the +5/+10
      await reverseReputation(
        db,
        targetOwnerId,
        targetType === 'question' ? 'question_upvoted' : 'answer_upvoted',
        targetType,
        targetId
      );
    } else {
      // Was a downvote - reverse the -2
      await reverseReputation(
        db,
        targetOwnerId,
        targetType === 'question' ? 'question_downvoted' : 'answer_downvoted',
        targetType,
        targetId
      );
      // Refund the downvote cost to the voter
      await reverseReputation(db, userId, 'downvote_cast', 'vote', existingVote[0].id);
    }
  }

  // Update score
  await db
    .update(table)
    .set({ score: sql`${scoreColumn} - ${oldValue}` })
    .where(eq(idColumn, targetId));

  const newScoreResult = await db
    .select({ score: scoreColumn })
    .from(table)
    .where(eq(idColumn, targetId))
    .limit(1);

  return {
    success: true,
    newScore: newScoreResult[0]?.score || 0,
    userVote: null,
    targetOwnerId: targetOwnerId || undefined,
  };
}

// ══════════════════════════════════════════════════════════════════
// REPUTATION
// ══════════════════════════════════════════════════════════════════

const REPUTATION_POINTS: Record<ReputationReason, number> = {
  question_upvoted: 5,
  question_downvoted: -2,
  answer_upvoted: 10,
  answer_downvoted: -2,
  answer_accepted: 15,
  accepted_answer: 2,
  downvote_cast: -1,
  // Reversed values
  question_upvoted_reversed: -5,
  question_downvoted_reversed: 2,
  answer_upvoted_reversed: -10,
  answer_downvoted_reversed: 2,
  answer_accepted_reversed: -15,
  accepted_answer_reversed: -2,
  downvote_cast_reversed: 1,
};

// Base reasons that can be reversed
type BaseReputationReason =
  | 'question_upvoted' | 'question_downvoted'
  | 'answer_upvoted' | 'answer_downvoted'
  | 'answer_accepted' | 'accepted_answer'
  | 'downvote_cast';

// Map base reason to its reversal change amount
const REPUTATION_REVERSE: Record<BaseReputationReason, number> = {
  question_upvoted: -5,
  question_downvoted: 2,
  answer_upvoted: -10,
  answer_downvoted: 2,
  answer_accepted: -15,
  accepted_answer: -2,
  downvote_cast: 1,
};

// Map base reason to its reversed reason type
const REVERSED_REASON_MAP: Record<BaseReputationReason, ReputationReason> = {
  question_upvoted: 'question_upvoted_reversed',
  question_downvoted: 'question_downvoted_reversed',
  answer_upvoted: 'answer_upvoted_reversed',
  answer_downvoted: 'answer_downvoted_reversed',
  answer_accepted: 'answer_accepted_reversed',
  accepted_answer: 'accepted_answer_reversed',
  downvote_cast: 'downvote_cast_reversed',
};

export async function updateReputation(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  reason: ReputationReason,
  sourceType?: string,
  sourceId?: string
): Promise<void> {
  const change = REPUTATION_POINTS[reason];

  // Log reputation change
  await db.insert(reputationLog).values({
    userId,
    change,
    reason,
    sourceType: sourceType || null,
    sourceId: sourceId || null,
  });

  // Update profile reputation
  await db
    .update(profiles)
    .set({ reputation: sql`GREATEST(0, ${profiles.reputation} + ${change})` })
    .where(eq(profiles.userId, userId));
}

// Reverse a previous reputation change (for undoing votes)
export async function reverseReputation(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  originalReason: BaseReputationReason,
  sourceType?: string,
  sourceId?: string
): Promise<void> {
  const change = REPUTATION_REVERSE[originalReason];
  const reversedReason = REVERSED_REASON_MAP[originalReason];

  // Log the reversal with properly typed reason
  await db.insert(reputationLog).values({
    userId,
    change,
    reason: reversedReason,
    sourceType: sourceType || null,
    sourceId: sourceId || null,
  });

  // Update profile reputation
  await db
    .update(profiles)
    .set({ reputation: sql`GREATEST(0, ${profiles.reputation} + ${change})` })
    .where(eq(profiles.userId, userId));
}

// ══════════════════════════════════════════════════════════════════
// TAGS
// ══════════════════════════════════════════════════════════════════

export async function listTags(
  db: NeonHttpDatabase<Record<string, never>>
): Promise<Tag[]> {
  const results = await db
    .select()
    .from(tags)
    .orderBy(desc(tags.questionCount));

  return results.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description || undefined,
    questionCount: tag.questionCount,
  }));
}

export async function getTagBySlug(
  db: NeonHttpDatabase<Record<string, never>>,
  slug: string
): Promise<Tag | null> {
  const results = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  if (results.length === 0) return null;

  const tag = results[0];
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description || undefined,
    questionCount: tag.questionCount,
  };
}
