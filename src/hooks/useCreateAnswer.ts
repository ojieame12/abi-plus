import { useState, useCallback } from 'react';
import { apiFetch, ApiError } from '../services/api';
import type { Answer } from '../types/community';

interface UseCreateAnswerReturn {
  createAnswer: (questionId: string, body: string) => Promise<Answer>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCreateAnswer(): UseCreateAnswerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAnswer = useCallback(async (questionId: string, body: string): Promise<Answer> => {
    setIsLoading(true);
    setError(null);

    try {
      const answer = await apiFetch<Answer>('/api/community/answers', {
        method: 'POST',
        body: JSON.stringify({ questionId, body }),
      });

      return answer;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to post answer');
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
    createAnswer,
    isLoading,
    error,
    clearError,
  };
}
