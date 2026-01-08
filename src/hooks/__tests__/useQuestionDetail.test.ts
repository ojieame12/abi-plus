// Tests for useQuestionDetail hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuestionDetail } from '../useQuestionDetail';
import * as api from '../../services/api';
import * as mockData from '../../services/communityMockData';
import { createTestQuestionWithAnswers } from '../../test/community-utils';

// Mock the api module
vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
}));

// Mock the mock data module
vi.mock('../../services/communityMockData', () => ({
  getQuestionById: vi.fn(),
}));

const mockApiFetch = api.apiFetch as ReturnType<typeof vi.fn>;
const mockGetQuestionById = mockData.getQuestionById as ReturnType<typeof vi.fn>;

describe('useQuestionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null question when questionId is null', () => {
    const { result } = renderHook(() => useQuestionDetail(null));

    expect(result.current.question).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('API mode (default)', () => {
    it('fetches question from API', async () => {
      const mockQuestion = createTestQuestionWithAnswers();
      mockApiFetch.mockResolvedValue(mockQuestion);

      const { result } = renderHook(() => useQuestionDetail('q1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiFetch).toHaveBeenCalledWith('/api/community/questions/q1');
      expect(result.current.question).toEqual(mockQuestion);
      expect(result.current.notice).toBeNull();
    });

    it('sets isLoading during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(promise);

      const { result } = renderHook(() => useQuestionDetail('q1'));

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(createTestQuestionWithAnswers());
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('falls back to mock data on API error', async () => {
      const mockQuestion = createTestQuestionWithAnswers();
      mockApiFetch.mockRejectedValue(new Error('Network error'));
      mockGetQuestionById.mockReturnValue(mockQuestion);

      const { result } = renderHook(() => useQuestionDetail('q1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.question).toEqual(mockQuestion);
      expect(result.current.notice).toBe('API unavailable. Showing sample question.');
    });

    it('sets error when API fails and no mock data available', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));
      mockGetQuestionById.mockReturnValue(null);

      const { result } = renderHook(() => useQuestionDetail('q1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.question).toBeNull();
      expect(result.current.error).toBe('Failed to load question');
    });
  });

  describe('mock mode', () => {
    it('fetches question from mock data', async () => {
      const mockQuestion = createTestQuestionWithAnswers();
      mockGetQuestionById.mockReturnValue(mockQuestion);

      const { result } = renderHook(() =>
        useQuestionDetail('q1', { useMockData: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetQuestionById).toHaveBeenCalledWith('q1');
      expect(result.current.question).toEqual(mockQuestion);
      expect(result.current.notice).toBe('Showing sample question.');
    });

    it('sets error when question not found in mock data', async () => {
      mockGetQuestionById.mockReturnValue(null);

      const { result } = renderHook(() =>
        useQuestionDetail('nonexistent', { useMockData: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.question).toBeNull();
      expect(result.current.error).toBe('Question not found');
    });
  });

  describe('refetch', () => {
    it('refetches question data', async () => {
      const mockQuestion1 = createTestQuestionWithAnswers({ title: 'First Title' });
      const mockQuestion2 = createTestQuestionWithAnswers({ title: 'Second Title' });

      mockApiFetch.mockResolvedValueOnce(mockQuestion1);
      mockApiFetch.mockResolvedValueOnce(mockQuestion2);

      const { result } = renderHook(() => useQuestionDetail('q1'));

      await waitFor(() => {
        expect(result.current.question?.title).toContain('First');
      });

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.question?.title).toContain('Second');
      });
    });
  });

  describe('questionId changes', () => {
    it('fetches new question when questionId changes', async () => {
      const mockQuestion1 = createTestQuestionWithAnswers();
      const mockQuestion2 = createTestQuestionWithAnswers();

      mockApiFetch.mockResolvedValueOnce(mockQuestion1);
      mockApiFetch.mockResolvedValueOnce(mockQuestion2);

      const { result, rerender } = renderHook(
        ({ questionId }) => useQuestionDetail(questionId),
        { initialProps: { questionId: 'q1' } }
      );

      await waitFor(() => {
        expect(result.current.question).not.toBeNull();
        expect(result.current.question?.id).toBe(mockQuestion1.id);
      });

      rerender({ questionId: 'q2' });

      await waitFor(() => {
        expect(result.current.question?.id).toBe(mockQuestion2.id);
      });

      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });

    it('clears question when questionId becomes null', async () => {
      const mockQuestion = createTestQuestionWithAnswers();
      mockApiFetch.mockResolvedValue(mockQuestion);

      const { result, rerender } = renderHook(
        ({ questionId }) => useQuestionDetail(questionId),
        { initialProps: { questionId: 'q1' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.question).not.toBeNull();
      });

      rerender({ questionId: null });

      await waitFor(() => {
        expect(result.current.question).toBeNull();
      });
    });
  });
});
