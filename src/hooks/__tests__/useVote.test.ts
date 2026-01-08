// Tests for useVote hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVote } from '../useVote';
import * as api from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number = 400) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mockApiFetch = api.apiFetch as ReturnType<typeof vi.fn>;

describe('useVote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with provided values', () => {
    const { result } = renderHook(() =>
      useVote({
        targetType: 'question',
        targetId: 'q1',
        initialScore: 5,
        initialUserVote: null,
      })
    );

    expect(result.current.score).toBe(5);
    expect(result.current.userVote).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes with existing user vote', () => {
    const { result } = renderHook(() =>
      useVote({
        targetType: 'question',
        targetId: 'q1',
        initialScore: 10,
        initialUserVote: 1,
      })
    );

    expect(result.current.score).toBe(10);
    expect(result.current.userVote).toBe(1);
  });

  describe('castVote', () => {
    it('optimistically updates score on new upvote', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 6, userVote: 1 });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      await act(async () => {
        await result.current.castVote(1);
      });

      expect(result.current.score).toBe(6);
      expect(result.current.userVote).toBe(1);
    });

    it('optimistically updates score on new downvote', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 4, userVote: -1 });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      await act(async () => {
        await result.current.castVote(-1);
      });

      expect(result.current.score).toBe(4);
      expect(result.current.userVote).toBe(-1);
    });

    it('toggles off vote when same value (optimistically)', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 4, userVote: null });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: 1, // Already upvoted
        })
      );

      await act(async () => {
        await result.current.castVote(1); // Click upvote again
      });

      expect(result.current.score).toBe(4);
      expect(result.current.userVote).toBeNull();
    });

    it('switches vote direction (upvote to downvote)', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 3, userVote: -1 });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: 1, // Currently upvoted
        })
      );

      await act(async () => {
        await result.current.castVote(-1); // Change to downvote
      });

      // Score should go from 5 to 3 (remove +1, add -1)
      expect(result.current.score).toBe(3);
      expect(result.current.userVote).toBe(-1);
    });

    it('rolls back on error', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Insufficient reputation'));

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      await act(async () => {
        await result.current.castVote(1);
      });

      // Should roll back to original values
      expect(result.current.score).toBe(5);
      expect(result.current.userVote).toBeNull();
      expect(result.current.error).toBe('Insufficient reputation');
    });

    it('sets isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(promise);

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      act(() => {
        result.current.castVote(1);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true, newScore: 6, userVote: 1 });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('calls correct endpoint for questions', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 6, userVote: 1 });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q123',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      await act(async () => {
        await result.current.castVote(1);
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/questions/q123/vote',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('calls correct endpoint for answers', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 6, userVote: 1 });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'answer',
          targetId: 'a456',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      await act(async () => {
        await result.current.castVote(1);
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/answers/a456/vote',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('removeVote', () => {
    it('removes existing vote', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 4, userVote: null });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: 1,
        })
      );

      await act(async () => {
        await result.current.removeVote();
      });

      expect(result.current.score).toBe(4);
      expect(result.current.userVote).toBeNull();
    });

    it('does nothing when no vote exists', async () => {
      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: null,
        })
      );

      await act(async () => {
        await result.current.removeVote();
      });

      // Should not call API
      expect(mockApiFetch).not.toHaveBeenCalled();
      expect(result.current.score).toBe(5);
    });

    it('rolls back on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: 1,
        })
      );

      await act(async () => {
        await result.current.removeVote();
      });

      // Should roll back
      expect(result.current.score).toBe(5);
      expect(result.current.userVote).toBe(1);
      expect(result.current.error).toBe('Failed to remove vote');
    });

    it('calls DELETE endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true, newScore: 4, userVote: null });

      const { result } = renderHook(() =>
        useVote({
          targetType: 'question',
          targetId: 'q1',
          initialScore: 5,
          initialUserVote: 1,
        })
      );

      await act(async () => {
        await result.current.removeVote();
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/questions/q1/vote',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('sync with props', () => {
    it('updates score when initialScore changes', async () => {
      const { result, rerender } = renderHook(
        ({ initialScore }) =>
          useVote({
            targetType: 'question',
            targetId: 'q1',
            initialScore,
            initialUserVote: null,
          }),
        { initialProps: { initialScore: 5 } }
      );

      expect(result.current.score).toBe(5);

      rerender({ initialScore: 10 });

      expect(result.current.score).toBe(10);
    });

    it('updates userVote when initialUserVote changes', async () => {
      const { result, rerender } = renderHook(
        ({ initialUserVote }) =>
          useVote({
            targetType: 'question',
            targetId: 'q1',
            initialScore: 5,
            initialUserVote,
          }),
        { initialProps: { initialUserVote: null as (1 | -1 | null) } }
      );

      expect(result.current.userVote).toBeNull();

      rerender({ initialUserVote: 1 });

      expect(result.current.userVote).toBe(1);
    });
  });
});
