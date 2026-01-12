// Community Q&A Types

// ══════════════════════════════════════════════════════════════════
// BADGE TYPES
// ══════════════════════════════════════════════════════════════════

export interface BadgeCriteria {
  type: 'question_count' | 'answer_count' | 'accepted_count' |
        'upvotes_received' | 'reputation' | 'first_question' | 'first_answer' |
        // Streak-based
        'streak_days' | 'longest_streak' |
        // Quality-based
        'answer_score' | 'question_score' |
        // Voting activity
        'votes_cast' | 'helpful_votes';
  threshold?: number;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: BadgeTier;
  icon: string;
  criteria: BadgeCriteria;
}

export interface UserBadgeWithDetails {
  badge: Badge;
  awardedAt: string;
}

// ══════════════════════════════════════════════════════════════════
// REPUTATION TYPES
// ══════════════════════════════════════════════════════════════════

export type ReputationReason =
  | 'question_upvoted' | 'question_downvoted'
  | 'answer_upvoted' | 'answer_downvoted'
  | 'answer_accepted' | 'accepted_answer'
  | 'downvote_cast'
  // Reversed reasons (for undoing votes/accepts)
  | 'question_upvoted_reversed' | 'question_downvoted_reversed'
  | 'answer_upvoted_reversed' | 'answer_downvoted_reversed'
  | 'answer_accepted_reversed' | 'accepted_answer_reversed'
  | 'downvote_cast_reversed';

export const REPUTATION_CHANGES: Record<ReputationReason, number> = {
  question_upvoted: 5,
  question_downvoted: -2,
  answer_upvoted: 10,
  answer_downvoted: -2,
  answer_accepted: 15,
  accepted_answer: 2, // Bonus for accepting
  downvote_cast: -1,  // Cost to downvote
  // Reversed values
  question_upvoted_reversed: -5,
  question_downvoted_reversed: 2,
  answer_upvoted_reversed: -10,
  answer_downvoted_reversed: 2,
  answer_accepted_reversed: -15,
  accepted_answer_reversed: -2,
  downvote_cast_reversed: 1,
};

// Privilege thresholds (duplicated from auth.ts for client-side use)
export const REPUTATION_THRESHOLDS = {
  upvote: 50,
  comment: 100,
  downvote: 250,
  moderate: 1000,
} as const;

// ══════════════════════════════════════════════════════════════════
// VOTE TYPES
// ══════════════════════════════════════════════════════════════════

export type VoteValue = 1 | -1;
export type VoteTargetType = 'question' | 'answer';

export interface VoteState {
  userVote: VoteValue | null;
  score: number;
}

// ══════════════════════════════════════════════════════════════════
// TAG TYPES
// ══════════════════════════════════════════════════════════════════

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  questionCount: number;
}

// ══════════════════════════════════════════════════════════════════
// USER PROFILE TYPES
// ══════════════════════════════════════════════════════════════════

export interface UserProfile {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  reputation: number;
}

export interface UserCommunityStats {
  questionCount: number;
  answerCount: number;
  acceptedAnswerCount: number;
  reputation: number;
  badges: UserBadgeWithDetails[];
}

// ══════════════════════════════════════════════════════════════════
// QUESTION TYPES
// ══════════════════════════════════════════════════════════════════

export interface Question {
  id: string;
  author?: UserProfile;
  userId: string;
  title: string;
  body: string;
  aiContextSummary?: string;
  score: number;
  viewCount: number;
  answerCount: number;
  acceptedAnswerId?: string;
  hasAcceptedAnswer: boolean;
  status: 'open' | 'answered' | 'closed';
  tags: Tag[];
  userVote?: VoteValue | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

// ══════════════════════════════════════════════════════════════════
// ANSWER TYPES
// ══════════════════════════════════════════════════════════════════

export interface Answer {
  id: string;
  questionId: string;
  author?: UserProfile;
  userId: string;
  body: string;
  score: number;
  isAccepted: boolean;
  userVote?: VoteValue | null;
  createdAt: string;
  updatedAt: string;
}

// ══════════════════════════════════════════════════════════════════
// FORM INPUT TYPES
// ══════════════════════════════════════════════════════════════════

export interface CreateQuestionInput {
  title: string;
  body: string;
  tagIds: string[];
  aiContextSummary?: string;
}

export interface UpdateQuestionInput {
  title?: string;
  body?: string;
  tagIds?: string[];
}

export interface CreateAnswerInput {
  questionId: string;
  body: string;
}

export interface UpdateAnswerInput {
  body: string;
}

// ══════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ══════════════════════════════════════════════════════════════════

export interface QuestionsListResponse {
  questions: Question[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface QuestionDetailResponse extends QuestionWithAnswers {}

export interface VoteResponse {
  success: boolean;
  newScore: number;
  userVote: VoteValue | null;
}

export interface AcceptAnswerResponse {
  success: boolean;
  acceptedAnswerId: string;
}

// ══════════════════════════════════════════════════════════════════
// FILTER/SORT TYPES
// ══════════════════════════════════════════════════════════════════

export type QuestionSortBy = 'newest' | 'votes' | 'unanswered' | 'active';
export type QuestionFilter = 'all' | 'open' | 'answered' | 'unanswered';
export type ContentType = 'posts' | 'discussion' | 'announcement';
