import { useState, useCallback } from 'react';
import { apiFetch, ApiError } from '../services/api';
import type { AcceptAnswerResponse } from '../types/community';

interface UseAcceptAnswerReturn {
  acceptAnswer: (questionId: string, answerId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAcceptAnswer(): UseAcceptAnswerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptAnswer = useCallback(async (questionId: string, answerId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiFetch<AcceptAnswerResponse>(`/api/community/questions/${questionId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ answerId }),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to accept answer');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    acceptAnswer,
    isLoading,
    error,
    clearError,
  };
}
