import { useState, useEffect, useCallback } from 'react';
import type { QuestionWithAnswers } from '../types/community';
import { getQuestionById } from '../services/communityMockData';

interface UseQuestionDetailReturn {
  question: QuestionWithAnswers | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useQuestionDetail(questionId: string | null): UseQuestionDetailReturn {
  const [question, setQuestion] = useState<QuestionWithAnswers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!questionId) {
      setQuestion(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const data = getQuestionById(questionId);

      if (!data) {
        setError('Question not found');
        setQuestion(null);
      } else {
        setQuestion(data);
      }
    } catch (err) {
      setError('Failed to load question');
      console.error('Error fetching question:', err);
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const refetch = useCallback(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  return {
    question,
    isLoading,
    error,
    refetch,
  };
}
