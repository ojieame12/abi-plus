import { useState, useCallback, useEffect } from 'react';
import { apiFetch, ApiError } from '../services/api';
import type { VoteValue, VoteTargetType, VoteResponse } from '../types/community';

interface UseVoteOptions {
  targetType: VoteTargetType;
  targetId: string;
  initialScore: number;
  initialUserVote: VoteValue | null;
}

interface UseVoteReturn {
  score: number;
  userVote: VoteValue | null;
  isLoading: boolean;
  error: string | null;
  castVote: (value: VoteValue) => Promise<void>;
  removeVote: () => Promise<void>;
}

export function useVote({
  targetType,
  targetId,
  initialScore,
  initialUserVote,
}: UseVoteOptions): UseVoteReturn {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<VoteValue | null>(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when props change (e.g., after async data load)
  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    setUserVote(initialUserVote);
  }, [initialUserVote]);

  const endpoint = targetType === 'question'
    ? `/api/community/questions/${targetId}/vote`
    : `/api/community/answers/${targetId}/vote`;

  const castVote = useCallback(async (value: VoteValue) => {
    setIsLoading(true);
    setError(null);

    // Optimistic update
    const prevScore = score;
    const prevVote = userVote;

    // Calculate new score based on vote change
    let newScore = score;
    if (userVote === value) {
      // Toggle off: remove the vote
      newScore -= value;
    } else if (userVote === null) {
      // New vote
      newScore += value;
    } else {
      // Switching vote direction
      newScore += value - userVote;
    }

    const newUserVote = userVote === value ? null : value;
    setScore(newScore);
    setUserVote(newUserVote);

    try {
      const response = await apiFetch<VoteResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ value }),
      });

      // Use server response as source of truth
      setScore(response.newScore);
      setUserVote(response.userVote);
    } catch (err) {
      // Rollback on error
      setScore(prevScore);
      setUserVote(prevVote);

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to vote');
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, score, userVote]);

  const removeVote = useCallback(async () => {
    if (userVote === null) return;

    setIsLoading(true);
    setError(null);

    // Optimistic update
    const prevScore = score;
    const prevVote = userVote;
    setScore(score - userVote);
    setUserVote(null);

    try {
      const response = await apiFetch<VoteResponse>(endpoint, {
        method: 'DELETE',
      });

      setScore(response.newScore);
      setUserVote(response.userVote);
    } catch (err) {
      // Rollback
      setScore(prevScore);
      setUserVote(prevVote);

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to remove vote');
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, score, userVote]);

  return {
    score,
    userVote,
    isLoading,
    error,
    castVote,
    removeVote,
  };
}
