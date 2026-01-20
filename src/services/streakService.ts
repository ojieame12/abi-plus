// Streak Service - Track user activity streaks
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { profiles } from '../db/schema.js';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date | null;
}

/**
 * Update user's activity streak
 * Called when user takes an action (question, answer, vote)
 */
export async function updateStreak(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string
): Promise<StreakInfo> {
  const now = new Date();
  const todayStart = getDateStart(now);
  const yesterdayStart = getDateStart(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  // Get current profile
  const profile = await db
    .select({
      currentStreak: profiles.currentStreak,
      longestStreak: profiles.longestStreak,
      lastActiveAt: profiles.lastActiveAt,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (profile.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveAt: null };
  }

  const { currentStreak, longestStreak, lastActiveAt } = profile[0];

  // Already active today - no change
  if (lastActiveAt && getDateStart(lastActiveAt).getTime() === todayStart.getTime()) {
    return { currentStreak, longestStreak, lastActiveAt };
  }

  let newStreak: number;

  if (!lastActiveAt) {
    // First activity ever
    newStreak = 1;
  } else if (getDateStart(lastActiveAt).getTime() === yesterdayStart.getTime()) {
    // Active yesterday - continue streak
    newStreak = currentStreak + 1;
  } else {
    // Streak broken - start fresh
    newStreak = 1;
  }

  const newLongest = Math.max(longestStreak, newStreak);

  // Update profile
  await db
    .update(profiles)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveAt: now,
      updatedAt: now,
    })
    .where(eq(profiles.userId, userId));

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveAt: now,
  };
}

/**
 * Get user's current streak info
 */
export async function getStreakInfo(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string
): Promise<StreakInfo> {
  const profile = await db
    .select({
      currentStreak: profiles.currentStreak,
      longestStreak: profiles.longestStreak,
      lastActiveAt: profiles.lastActiveAt,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (profile.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveAt: null };
  }

  const { currentStreak, longestStreak, lastActiveAt } = profile[0];

  // Check if streak is still valid (active today or yesterday)
  if (lastActiveAt) {
    const now = new Date();
    const yesterdayStart = getDateStart(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const lastActiveStart = getDateStart(lastActiveAt);

    // If last active was before yesterday, streak is broken
    if (lastActiveStart.getTime() < yesterdayStart.getTime()) {
      return {
        currentStreak: 0,
        longestStreak,
        lastActiveAt,
      };
    }
  }

  return { currentStreak, longestStreak, lastActiveAt };
}

/**
 * Get start of day (midnight) for a date
 */
function getDateStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check streak milestones for badge awarding
 */
export function getStreakMilestone(streak: number): number | null {
  const milestones = [7, 14, 30, 60, 100, 365];
  return milestones.find(m => streak === m) || null;
}
