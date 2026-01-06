import { useState, useEffect, useCallback } from 'react';
import type { QuestionWithAnswers } from '../types/community';
import { apiFetch } from '../services/api';
// Fallback to mock data if API not available
import { getQuestionById as getMockQuestionById } from '../services/communityMockData';

interface UseQuestionDetailOptions {
  useMockData?: boolean;
}

interface UseQuestionDetailReturn {
  question: QuestionWithAnswers | null;
  isLoading: boolean;
  error: string | null;
  notice: string | null;
  refetch: () => void;
}

export function useQuestionDetail(
  questionId: string | null,
  options: UseQuestionDetailOptions = {}
): UseQuestionDetailReturn {
  const { useMockData = false } = options; // Use API by default
  const [question, setQuestion] = useState<QuestionWithAnswers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(useMockData ? 'Showing sample question.' : null);

  const fetchQuestion = useCallback(async () => {
    if (!questionId) {
      setQuestion(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Use mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        const data = getMockQuestionById(questionId);

        if (!data) {
          setError('Question not found');
          setQuestion(null);
        } else {
          setQuestion(data);
        }
        setNotice('Showing sample question.');
      } else {
        // Use API
        const data = await apiFetch<QuestionWithAnswers>(
          `/api/community/questions/${questionId}`
        );
        setQuestion(data);
        setNotice(null);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      if (!useMockData) {
        const fallback = getMockQuestionById(questionId);
        if (fallback) {
          setQuestion(fallback);
          setNotice('API unavailable. Showing sample question.');
          return;
        }
      }
      setNotice(null);
      setError('Failed to load question');
    } finally {
      setIsLoading(false);
    }
  }, [questionId, useMockData]);

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
    notice,
    refetch,
  };
}
