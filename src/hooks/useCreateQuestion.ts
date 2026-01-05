import { useState, useCallback } from 'react';
import { apiFetch, ApiError } from '../services/api';
import type { Question, CreateQuestionInput } from '../types/community';

interface UseCreateQuestionReturn {
  createQuestion: (input: CreateQuestionInput) => Promise<Question>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCreateQuestion(): UseCreateQuestionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuestion = useCallback(async (input: CreateQuestionInput): Promise<Question> => {
    setIsLoading(true);
    setError(null);

    try {
      const question = await apiFetch<Question>('/api/community/questions', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      return question;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create question');
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
    createQuestion,
    isLoading,
    error,
    clearError,
  };
}
