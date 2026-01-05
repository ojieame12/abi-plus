// Badge Service - Badge definitions and awarding logic
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, sql, and, count } from 'drizzle-orm';
import {
  badges,
  userBadges,
  questions,
  answers,
  profiles,
} from '../db/schema';
import type { Badge as DbBadge } from '../db/schema';
import type {
  Badge,
  BadgeCriteria,
  BadgeTier,
  UserBadgeWithDetails,
} from '../types/community';

// ══════════════════════════════════════════════════════════════════
// BADGE DEFINITIONS
// ══════════════════════════════════════════════════════════════════

export interface BadgeDefinition {
  name: string;
  slug: string;
  description: string;
  tier: BadgeTier;
  icon: string;
  criteria: BadgeCriteria;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Bronze - Getting started
  {
    name: 'First Question',
    slug: 'first-question',
    description: 'Asked your first question',
    tier: 'bronze',
    icon: 'HelpCircle',
    criteria: { type: 'first_question' },
  },
  {
    name: 'First Answer',
    slug: 'first-answer',
    description: 'Posted your first answer',
    tier: 'bronze',
    icon: 'MessageSquare',
    criteria: { type: 'first_answer' },
  },
  {
    name: 'Curious',
    slug: 'curious',
    description: 'Asked 5 questions',
    tier: 'bronze',
    icon: 'Search',
    criteria: { type: 'question_count', threshold: 5 },
  },
  {
    name: 'Contributor',
    slug: 'contributor',
    description: 'Posted 5 answers',
    tier: 'bronze',
    icon: 'PenLine',
    criteria: { type: 'answer_count', threshold: 5 },
  },

  // Silver - Growing engagement
  {
    name: 'Good Question',
    slug: 'good-question',
    description: 'Received 25 upvotes on your questions',
    tier: 'silver',
    icon: 'ThumbsUp',
    criteria: { type: 'upvotes_received', threshold: 25 },
  },
  {
    name: 'Helpful',
    slug: 'helpful',
    description: 'Posted 10 answers',
    tier: 'silver',
    icon: 'Heart',
    criteria: { type: 'answer_count', threshold: 10 },
  },
  {
    name: 'Teacher',
    slug: 'teacher',
    description: 'Had 5 answers accepted',
    tier: 'silver',
    icon: 'GraduationCap',
    criteria: { type: 'accepted_count', threshold: 5 },
  },
  {
    name: 'Rising Star',
    slug: 'rising-star',
    description: 'Reached 500 reputation',
    tier: 'silver',
    icon: 'TrendingUp',
    criteria: { type: 'reputation', threshold: 500 },
  },

  // Gold - Expert level
  {
    name: 'Great Answer',
    slug: 'great-answer',
    description: 'Received 100 upvotes on your answers',
    tier: 'gold',
    icon: 'Award',
    criteria: { type: 'upvotes_received', threshold: 100 },
  },
  {
    name: 'Guru',
    slug: 'guru',
    description: 'Had 50 answers accepted',
    tier: 'gold',
    icon: 'Crown',
    criteria: { type: 'accepted_count', threshold: 50 },
  },
  {
    name: 'Legend',
    slug: 'legend',
    description: 'Reached 10,000 reputation',
    tier: 'gold',
    icon: 'Star',
    criteria: { type: 'reputation', threshold: 10000 },
  },
  {
    name: 'Inquisitor',
    slug: 'inquisitor',
    description: 'Asked 50 questions',
    tier: 'gold',
    icon: 'HelpCircle',
    criteria: { type: 'question_count', threshold: 50 },
  },
];

// ══════════════════════════════════════════════════════════════════
// BADGE OPERATIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Seed badge definitions into database
 */
export async function seedBadges(
  db: NeonHttpDatabase<Record<string, never>>
): Promise<void> {
  for (const badge of BADGE_DEFINITIONS) {
    // Upsert: insert or update existing
    await db
      .insert(badges)
      .values({
        name: badge.name,
        slug: badge.slug,
        description: badge.description,
        tier: badge.tier,
        icon: badge.icon,
        criteria: badge.criteria,
      })
      .onConflictDoUpdate({
        target: badges.slug,
        set: {
          name: badge.name,
          description: badge.description,
          tier: badge.tier,
          icon: badge.icon,
          criteria: badge.criteria,
        },
      });
  }
}

/**
 * Get all badges from database
 */
export async function getAllBadges(
  db: NeonHttpDatabase<Record<string, never>>
): Promise<Badge[]> {
  const results = await db.select().from(badges);

  return results.map(badge => ({
    id: badge.id,
    name: badge.name,
    slug: badge.slug,
    description: badge.description,
    tier: badge.tier as BadgeTier,
    icon: badge.icon,
    criteria: badge.criteria as BadgeCriteria,
  }));
}

/**
 * Get badges for a specific user
 */
export async function getUserBadges(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string
): Promise<UserBadgeWithDetails[]> {
  const results = await db
    .select({
      badge: badges,
      awardedAt: userBadges.awardedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(eq(userBadges.userId, userId));

  return results.map(({ badge, awardedAt }) => ({
    badge: {
      id: badge.id,
      name: badge.name,
      slug: badge.slug,
      description: badge.description,
      tier: badge.tier as BadgeTier,
      icon: badge.icon,
      criteria: badge.criteria as BadgeCriteria,
    },
    awardedAt: awardedAt.toISOString(),
  }));
}

/**
 * Check if user has a specific badge
 */
export async function userHasBadge(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  badgeSlug: string
): Promise<boolean> {
  const result = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(and(eq(userBadges.userId, userId), eq(badges.slug, badgeSlug)))
    .limit(1);

  return result.length > 0;
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  badgeSlug: string
): Promise<boolean> {
  // Get badge
  const badge = await db
    .select({ id: badges.id })
    .from(badges)
    .where(eq(badges.slug, badgeSlug))
    .limit(1);

  if (badge.length === 0) return false;

  // Check if already awarded
  const existing = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(
      and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge[0].id))
    )
    .limit(1);

  if (existing.length > 0) return false; // Already has badge

  // Award badge
  await db.insert(userBadges).values({
    userId,
    badgeId: badge[0].id,
  });

  return true;
}

// ══════════════════════════════════════════════════════════════════
// BADGE CRITERIA EVALUATION
// ══════════════════════════════════════════════════════════════════

interface UserStats {
  questionCount: number;
  answerCount: number;
  acceptedAnswerCount: number;
  totalUpvotes: number;
  reputation: number;
}

/**
 * Get user stats for badge evaluation
 */
async function getUserStats(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string
): Promise<UserStats> {
  // Question count
  const questionCountResult = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.userId, userId));

  // Answer count
  const answerCountResult = await db
    .select({ count: count() })
    .from(answers)
    .where(eq(answers.userId, userId));

  // Accepted answer count
  const acceptedCountResult = await db
    .select({ count: count() })
    .from(answers)
    .where(and(eq(answers.userId, userId), eq(answers.isAccepted, true)));

  // Total upvotes (sum of positive scores)
  const questionScoreResult = await db
    .select({ total: sql<number>`COALESCE(SUM(GREATEST(score, 0)), 0)::int` })
    .from(questions)
    .where(eq(questions.userId, userId));

  const answerScoreResult = await db
    .select({ total: sql<number>`COALESCE(SUM(GREATEST(score, 0)), 0)::int` })
    .from(answers)
    .where(eq(answers.userId, userId));

  // Reputation
  const profileResult = await db
    .select({ reputation: profiles.reputation })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return {
    questionCount: questionCountResult[0]?.count || 0,
    answerCount: answerCountResult[0]?.count || 0,
    acceptedAnswerCount: acceptedCountResult[0]?.count || 0,
    totalUpvotes:
      (questionScoreResult[0]?.total || 0) + (answerScoreResult[0]?.total || 0),
    reputation: profileResult[0]?.reputation || 0,
  };
}

/**
 * Evaluate if a user meets badge criteria
 */
function evaluateCriteria(criteria: BadgeCriteria, stats: UserStats): boolean {
  switch (criteria.type) {
    case 'first_question':
      return stats.questionCount >= 1;

    case 'first_answer':
      return stats.answerCount >= 1;

    case 'question_count':
      return stats.questionCount >= (criteria.threshold || 0);

    case 'answer_count':
      return stats.answerCount >= (criteria.threshold || 0);

    case 'accepted_count':
      return stats.acceptedAnswerCount >= (criteria.threshold || 0);

    case 'upvotes_received':
      return stats.totalUpvotes >= (criteria.threshold || 0);

    case 'reputation':
      return stats.reputation >= (criteria.threshold || 0);

    default:
      return false;
  }
}

/**
 * Check and award all eligible badges for a user
 * Call this after actions that might earn badges (question/answer/vote/accept)
 */
export async function checkAndAwardBadges(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string
): Promise<Badge[]> {
  const stats = await getUserStats(db, userId);
  const allBadges = await getAllBadges(db);
  const userBadgesList = await getUserBadges(db, userId);
  const userBadgeSlugs = new Set(userBadgesList.map(ub => ub.badge.slug));

  const newlyAwarded: Badge[] = [];

  for (const badge of allBadges) {
    // Skip if already has
    if (userBadgeSlugs.has(badge.slug)) continue;

    // Check criteria
    if (evaluateCriteria(badge.criteria, stats)) {
      const awarded = await awardBadge(db, userId, badge.slug);
      if (awarded) {
        newlyAwarded.push(badge);
      }
    }
  }

  return newlyAwarded;
}

// ══════════════════════════════════════════════════════════════════
// USER COMMUNITY STATS
// ══════════════════════════════════════════════════════════════════

export interface CommunityStats {
  questionCount: number;
  answerCount: number;
  acceptedAnswerCount: number;
  reputation: number;
  badges: UserBadgeWithDetails[];
}

export async function getUserCommunityStats(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string
): Promise<CommunityStats> {
  const stats = await getUserStats(db, userId);
  const badgesList = await getUserBadges(db, userId);

  return {
    questionCount: stats.questionCount,
    answerCount: stats.answerCount,
    acceptedAnswerCount: stats.acceptedAnswerCount,
    reputation: stats.reputation,
    badges: badgesList,
  };
}
