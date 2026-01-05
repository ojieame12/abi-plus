// Leaderboard Service - Rankings and top contributors
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { profiles, questions, answers, reputationLog } from '../db/schema';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  currentStreak: number;
  // Period-specific stats
  periodReputation?: number;
  questionCount?: number;
  answerCount?: number;
}

export type LeaderboardPeriod = 'week' | 'month' | 'all-time';

/**
 * Get reputation leaderboard
 */
export async function getReputationLeaderboard(
  db: NeonHttpDatabase<Record<string, never>>,
  options: {
    period?: LeaderboardPeriod;
    limit?: number;
    userId?: string; // Include current user's rank even if not in top
  } = {}
): Promise<{
  entries: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry;
}> {
  const { period = 'all-time', limit = 10, userId } = options;

  if (period === 'all-time') {
    // Simple query for all-time
    const results = await db
      .select({
        userId: profiles.userId,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        reputation: profiles.reputation,
        currentStreak: profiles.currentStreak,
      })
      .from(profiles)
      .orderBy(desc(profiles.reputation))
      .limit(limit);

    const entries: LeaderboardEntry[] = results.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      reputation: r.reputation,
      currentStreak: r.currentStreak,
    }));

    // Get current user's rank if not in top
    let currentUserRank: LeaderboardEntry | undefined;
    if (userId && !entries.some(e => e.userId === userId)) {
      currentUserRank = await getUserRank(db, userId, 'all-time');
    }

    return { entries, currentUserRank };
  }

  // Period-based leaderboard (week/month)
  const periodStart = getPeriodStart(period);

  // Get reputation gained in period
  const periodResults = await db
    .select({
      userId: reputationLog.userId,
      periodReputation: sql<number>`SUM(${reputationLog.change})`.as('period_reputation'),
    })
    .from(reputationLog)
    .where(gte(reputationLog.createdAt, periodStart))
    .groupBy(reputationLog.userId)
    .orderBy(desc(sql`SUM(${reputationLog.change})`))
    .limit(limit);

  // Get profile info for these users
  const userIds = periodResults.map(r => r.userId);
  if (userIds.length === 0) {
    return { entries: [] };
  }

  const profileResults = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      reputation: profiles.reputation,
      currentStreak: profiles.currentStreak,
    })
    .from(profiles)
    .where(sql`${profiles.userId} IN ${userIds}`);

  const profileMap = new Map(profileResults.map(p => [p.userId, p]));

  const entries: LeaderboardEntry[] = periodResults.map((r, i) => {
    const profile = profileMap.get(r.userId);
    return {
      rank: i + 1,
      userId: r.userId,
      displayName: profile?.displayName || null,
      avatarUrl: profile?.avatarUrl || null,
      reputation: profile?.reputation || 0,
      currentStreak: profile?.currentStreak || 0,
      periodReputation: r.periodReputation,
    };
  });

  // Get current user's rank if not in top
  let currentUserRank: LeaderboardEntry | undefined;
  if (userId && !entries.some(e => e.userId === userId)) {
    currentUserRank = await getUserRank(db, userId, period);
  }

  return { entries, currentUserRank };
}

/**
 * Get a specific user's rank
 */
async function getUserRank(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  period: LeaderboardPeriod
): Promise<LeaderboardEntry | undefined> {
  const profile = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      reputation: profiles.reputation,
      currentStreak: profiles.currentStreak,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (profile.length === 0) return undefined;

  const userProfile = profile[0];

  if (period === 'all-time') {
    // Count users with more reputation
    const rankResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(profiles)
      .where(sql`${profiles.reputation} > ${userProfile.reputation}`);

    const rank = (rankResult[0]?.count || 0) + 1;

    return {
      rank,
      userId: userProfile.userId,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
      reputation: userProfile.reputation,
      currentStreak: userProfile.currentStreak,
    };
  }

  // Period-based rank
  const periodStart = getPeriodStart(period);

  const userPeriodRep = await db
    .select({ total: sql<number>`COALESCE(SUM(${reputationLog.change}), 0)` })
    .from(reputationLog)
    .where(
      and(
        eq(reputationLog.userId, userId),
        gte(reputationLog.createdAt, periodStart)
      )
    );

  const periodRep = userPeriodRep[0]?.total || 0;

  // Count users with more period reputation
  const rankResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${reputationLog.userId})` })
    .from(reputationLog)
    .where(gte(reputationLog.createdAt, periodStart))
    .having(sql`SUM(${reputationLog.change}) > ${periodRep}`);

  const rank = (rankResult[0]?.count || 0) + 1;

  return {
    rank,
    userId: userProfile.userId,
    displayName: userProfile.displayName,
    avatarUrl: userProfile.avatarUrl,
    reputation: userProfile.reputation,
    currentStreak: userProfile.currentStreak,
    periodReputation: periodRep,
  };
}

/**
 * Get top contributors (questions + answers)
 */
export async function getTopContributors(
  db: NeonHttpDatabase<Record<string, never>>,
  options: {
    period?: LeaderboardPeriod;
    limit?: number;
  } = {}
): Promise<LeaderboardEntry[]> {
  const { period = 'week', limit = 5 } = options;
  const periodStart = getPeriodStart(period);

  // Get question counts
  const questionCounts = await db
    .select({
      userId: questions.userId,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(questions)
    .where(period !== 'all-time' ? gte(questions.createdAt, periodStart) : undefined)
    .groupBy(questions.userId);

  // Get answer counts
  const answerCounts = await db
    .select({
      userId: answers.userId,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(answers)
    .where(period !== 'all-time' ? gte(answers.createdAt, periodStart) : undefined)
    .groupBy(answers.userId);

  // Combine counts
  const contributionMap = new Map<string, { questions: number; answers: number }>();

  for (const q of questionCounts) {
    const existing = contributionMap.get(q.userId) || { questions: 0, answers: 0 };
    existing.questions = q.count;
    contributionMap.set(q.userId, existing);
  }

  for (const a of answerCounts) {
    const existing = contributionMap.get(a.userId) || { questions: 0, answers: 0 };
    existing.answers = a.count;
    contributionMap.set(a.userId, existing);
  }

  // Sort by total contributions (answers weighted slightly more)
  const sorted = Array.from(contributionMap.entries())
    .map(([userId, counts]) => ({
      userId,
      ...counts,
      total: counts.questions + counts.answers * 1.5,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  if (sorted.length === 0) return [];

  // Get profiles
  const userIds = sorted.map(s => s.userId);
  const profileResults = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      reputation: profiles.reputation,
      currentStreak: profiles.currentStreak,
    })
    .from(profiles)
    .where(sql`${profiles.userId} IN ${userIds}`);

  const profileMap = new Map(profileResults.map(p => [p.userId, p]));

  return sorted.map((s, i) => {
    const profile = profileMap.get(s.userId);
    return {
      rank: i + 1,
      userId: s.userId,
      displayName: profile?.displayName || null,
      avatarUrl: profile?.avatarUrl || null,
      reputation: profile?.reputation || 0,
      currentStreak: profile?.currentStreak || 0,
      questionCount: s.questions,
      answerCount: s.answers,
    };
  });
}

/**
 * Get period start date
 */
function getPeriodStart(period: LeaderboardPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all-time':
    default:
      return new Date(0);
  }
}
