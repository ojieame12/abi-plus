import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Question, Tag, QuestionSortBy, QuestionFilter } from '../types/community';
import { filterQuestions, getPopularTags, MOCK_QUESTIONS } from '../services/communityMockData';

interface UseCommunityQuestionsOptions {
  sortBy?: QuestionSortBy;
  filter?: QuestionFilter;
  tag?: string | null;
  search?: string;
  pageSize?: number;
}

interface UseCommunityQuestionsReturn {
  questions: Question[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useCommunityQuestions(
  options: UseCommunityQuestionsOptions = {}
): UseCommunityQuestionsReturn {
  const {
    sortBy = 'newest',
    filter = 'all',
    tag = null,
    search = '',
    pageSize = 10,
  } = options;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Memoize filtered results
  const allFilteredQuestions = useMemo(() => {
    return filterQuestions({ sortBy, filter, tag, search });
  }, [sortBy, filter, tag, search]);

  const totalCount = allFilteredQuestions.length;
  const hasMore = questions.length < totalCount;

  // Fetch questions (simulated with mock data)
  const fetchQuestions = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const startPage = reset ? 1 : page;
      const paginatedQuestions = allFilteredQuestions.slice(0, startPage * pageSize);

      setQuestions(paginatedQuestions);
      if (reset) {
        setPage(1);
      }
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error fetching questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [allFilteredQuestions, page, pageSize]);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      setTags(getPopularTags(8));
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchQuestions(true);
  }, [sortBy, filter, tag, search]);

  // Fetch tags once
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Load more
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  // When page changes, fetch more
  useEffect(() => {
    if (page > 1) {
      fetchQuestions(false);
    }
  }, [page]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchQuestions(true);
    fetchTags();
  }, [fetchQuestions, fetchTags]);

  return {
    questions,
    tags,
    isLoading,
    error,
    totalCount,
    page,
    hasMore,
    loadMore,
    refetch,
  };
}
