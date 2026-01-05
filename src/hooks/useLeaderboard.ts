import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import type { LeaderboardPeriod } from '../services/leaderboardService';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  currentStreak: number;
  periodReputation?: number;
  questionCount?: number;
  answerCount?: number;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
  isLoading: boolean;
  error: string | null;
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  refetch: () => void;
}

export function useLeaderboard(
  type: 'reputation' | 'contributors' = 'reputation',
  limit = 10
): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        period,
        limit: limit.toString(),
      });

      const data = await apiFetch<{
        entries: LeaderboardEntry[];
        currentUserRank?: LeaderboardEntry;
      }>(`/api/community/leaderboard?${params}`);

      setEntries(data.entries);
      setCurrentUserRank(data.currentUserRank || null);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [type, period, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    currentUserRank,
    isLoading,
    error,
    period,
    setPeriod,
    refetch: fetchLeaderboard,
  };
}
