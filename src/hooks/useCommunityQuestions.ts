import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Question, Tag, QuestionSortBy, QuestionFilter } from '../types/community';
import { apiFetch } from '../services/api';
// Fallback to mock data if API not available
import { filterQuestions, getPopularTags } from '../services/communityMockData';

interface UseCommunityQuestionsOptions {
  sortBy?: QuestionSortBy;
  filter?: QuestionFilter;
  tag?: string | null;
  search?: string;
  pageSize?: number;
  useMockData?: boolean;
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
    useMockData = false, // Use API by default
  } = options;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Memoize filtered results for mock mode
  const allFilteredQuestions = useMemo(() => {
    if (!useMockData) return [];
    return filterQuestions({ sortBy, filter, tag, search });
  }, [sortBy, filter, tag, search, useMockData]);

  const hasMore = questions.length < totalCount;

  // Fetch questions from API or mock
  const fetchQuestions = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Use mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        const startPage = reset ? 1 : page;
        const paginatedQuestions = allFilteredQuestions.slice(0, startPage * pageSize);
        setQuestions(paginatedQuestions);
        setTotalCount(allFilteredQuestions.length);
        if (reset) setPage(1);
      } else {
        // Use API
        const currentPage = reset ? 1 : page;
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          sortBy,
          filter,
        });
        if (tag) params.set('tag', tag);
        if (search) params.set('search', search);

        const data = await apiFetch<{
          questions: Question[];
          totalCount: number;
          page: number;
          pageSize: number;
          hasMore: boolean;
        }>(`/api/community/questions?${params}`);

        if (reset) {
          setQuestions(data.questions);
          setPage(1);
        } else {
          setQuestions(prev => [...prev, ...data.questions]);
        }
        setTotalCount(data.totalCount);
      }
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error fetching questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [useMockData, allFilteredQuestions, page, pageSize, sortBy, filter, tag, search]);

  // Fetch tags from API or mock
  const fetchTags = useCallback(async () => {
    try {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setTags(getPopularTags(8));
      } else {
        const data = await apiFetch<Tag[]>('/api/community/tags');
        setTags(data.slice(0, 8)); // Limit to 8 popular tags
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, [useMockData]);

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
