// Tests for useCommunityQuestions hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCommunityQuestions } from '../useCommunityQuestions';
import type { QuestionSortBy } from '../../types/community';
import * as api from '../../services/api';
import * as mockData from '../../services/communityMockData';
import { createTestQuestion, createTestTag } from '../../test/community-utils';

// Mock the api module
vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
}));

// Mock the mock data module
vi.mock('../../services/communityMockData', () => ({
  filterQuestions: vi.fn(),
  getPopularTags: vi.fn(),
}));

const mockApiFetch = api.apiFetch as ReturnType<typeof vi.fn>;
const mockFilterQuestions = mockData.filterQuestions as ReturnType<typeof vi.fn>;
const mockGetPopularTags = mockData.getPopularTags as ReturnType<typeof vi.fn>;

describe('useCommunityQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterQuestions.mockReturnValue([]);
    mockGetPopularTags.mockReturnValue([]);
  });

  it('initializes with loading state', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useCommunityQuestions());

    expect(result.current.questions).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
  });

  describe('API mode (default)', () => {
    it('fetches questions from API', async () => {
      const mockQuestions = [createTestQuestion(), createTestQuestion()];
      const mockTags = [createTestTag()];
      // First call for questions, second for tags
      mockApiFetch
        .mockResolvedValueOnce({
          questions: mockQuestions,
          totalCount: 2,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce(mockTags);

      const { result } = renderHook(() => useCommunityQuestions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.notice).toBeNull();
    });

    it('includes sort and filter parameters', async () => {
      mockApiFetch
        .mockResolvedValueOnce({
          questions: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce([]);

      renderHook(() =>
        useCommunityQuestions({
          sortBy: 'votes',
          filter: 'unanswered',
          tag: 'supplier-risk',
          search: 'test query',
        })
      );

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalled();
      });

      const callUrl = mockApiFetch.mock.calls[0][0];
      expect(callUrl).toContain('sortBy=votes');
      expect(callUrl).toContain('filter=unanswered');
      expect(callUrl).toContain('tag=supplier-risk');
      expect(callUrl).toContain('search=test+query');
    });

    it('fetches tags from API', async () => {
      const mockTags = [createTestTag(), createTestTag()];
      mockApiFetch
        .mockResolvedValueOnce({
          questions: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce(mockTags);

      const { result } = renderHook(() => useCommunityQuestions());

      await waitFor(() => {
        expect(result.current.tags.length).toBe(2);
      });
    });

    it('falls back to mock data on API error', async () => {
      const mockQuestions = [createTestQuestion()];
      mockApiFetch.mockRejectedValue(new Error('Network error'));
      mockFilterQuestions.mockReturnValue(mockQuestions);
      mockGetPopularTags.mockReturnValue([createTestTag()]);

      const { result } = renderHook(() => useCommunityQuestions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.notice).toBe('API unavailable. Showing sample questions.');
    });
  });

  describe('mock mode', () => {
    it('uses mock data when useMockData is true', async () => {
      const mockQuestions = [createTestQuestion(), createTestQuestion()];
      mockFilterQuestions.mockReturnValue(mockQuestions);
      mockGetPopularTags.mockReturnValue([createTestTag()]);

      const { result } = renderHook(() =>
        useCommunityQuestions({ useMockData: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiFetch).not.toHaveBeenCalled();
      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.notice).toBe('Showing sample questions.');
    });

    it('filters mock data based on options', async () => {
      mockFilterQuestions.mockReturnValue([]);
      mockGetPopularTags.mockReturnValue([]);

      renderHook(() =>
        useCommunityQuestions({
          useMockData: true,
          sortBy: 'votes',
          filter: 'open',
          tag: 'test-tag',
          search: 'query',
        })
      );

      await waitFor(() => {
        expect(mockFilterQuestions).toHaveBeenCalledWith({
          sortBy: 'votes',
          filter: 'open',
          tag: 'test-tag',
          search: 'query',
        });
      });
    });
  });

  describe('pagination', () => {
    it('supports loadMore', async () => {
      const page1Questions = [createTestQuestion({ id: 'q1' })];
      const page2Questions = [createTestQuestion({ id: 'q2' })];

      mockApiFetch
        .mockResolvedValueOnce({
          questions: page1Questions,
          totalCount: 2,
          page: 1,
          pageSize: 1,
          hasMore: true,
        })
        .mockResolvedValueOnce([]) // tags call
        .mockResolvedValueOnce({
          questions: page2Questions,
          totalCount: 2,
          page: 2,
          pageSize: 1,
          hasMore: false,
        });

      const { result } = renderHook(() =>
        useCommunityQuestions({ pageSize: 1 })
      );

      await waitFor(() => {
        expect(result.current.questions.length).toBe(1);
      });

      expect(result.current.hasMore).toBe(true);

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.questions.length).toBe(2);
      });

      expect(result.current.hasMore).toBe(false);
    });

    it('does not load more when already loading', async () => {
      const promise = new Promise(() => {
        // Never resolves to keep loading state
      });
      mockApiFetch.mockReturnValue(promise);

      const { result } = renderHook(() => useCommunityQuestions());

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.loadMore();
      });

      // Should not have called API again
      expect(mockApiFetch).toHaveBeenCalledTimes(2); // questions + tags
    });
  });

  describe('refetch', () => {
    it('calls refetch function without error', async () => {
      mockApiFetch
        .mockResolvedValueOnce({
          questions: [createTestQuestion()],
          totalCount: 1,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce([createTestTag()])
        .mockResolvedValueOnce({
          questions: [createTestQuestion()],
          totalCount: 1,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce([createTestTag()]);

      const { result } = renderHook(() => useCommunityQuestions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not throw
      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('filter changes', () => {
    it('refetches when sortBy changes', async () => {
      // Setup mocks for initial + re-render
      mockApiFetch
        .mockResolvedValueOnce({
          questions: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({
          questions: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          hasMore: false,
        })
        .mockResolvedValueOnce([]);

      const { result, rerender } = renderHook(
        ({ sortBy }) => useCommunityQuestions({ sortBy }),
        { initialProps: { sortBy: 'newest' as QuestionSortBy } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ sortBy: 'votes' as QuestionSortBy });

      await waitFor(() => {
        // Check that the new sortBy is being used in calls
        const calls = mockApiFetch.mock.calls.map(c => c[0]);
        expect(calls.some((url: string) => url.includes('sortBy=votes'))).toBe(true);
      });
    });
  });
});
