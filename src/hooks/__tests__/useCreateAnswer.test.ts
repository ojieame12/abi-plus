// Tests for useCreateAnswer hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateAnswer } from '../useCreateAnswer';
import * as api from '../../services/api';
import { createTestAnswer } from '../../test/community-utils';

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

describe('useCreateAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useCreateAnswer());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.createAnswer).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  describe('createAnswer', () => {
    it('submits answer to API and returns result', async () => {
      const mockAnswer = createTestAnswer({ questionId: 'q1' });
      mockApiFetch.mockResolvedValue(mockAnswer);

      const { result } = renderHook(() => useCreateAnswer());

      let returnedAnswer;

      await act(async () => {
        returnedAnswer = await result.current.createAnswer(
          'q1',
          'This is a valid answer body with enough content for validation.'
        );
      });

      expect(returnedAnswer).toEqual(mockAnswer);
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/answers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            questionId: 'q1',
            body: 'This is a valid answer body with enough content for validation.',
          }),
        })
      );
    });

    it('sets isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(promise);

      const { result } = renderHook(() => useCreateAnswer());

      act(() => {
        result.current.createAnswer('q1', 'Valid body content with enough characters.');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(createTestAnswer());
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles ApiError with message', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Answer must be at least 30 characters', 400));

      const { result } = renderHook(() => useCreateAnswer());

      await act(async () => {
        try {
          await result.current.createAnswer('q1', 'Short');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Answer must be at least 30 characters');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles generic error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCreateAnswer());

      await act(async () => {
        try {
          await result.current.createAnswer('q1', 'Valid body content with enough characters.');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to post answer');
    });

    it('throws error after setting state', async () => {
      const error = new api.ApiError('Invalid input', 400);
      mockApiFetch.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateAnswer());

      await expect(
        act(async () => {
          await result.current.createAnswer('q1', 'Valid body content with enough characters.');
        })
      ).rejects.toThrow();
    });

    it('clears previous error on new request', async () => {
      mockApiFetch.mockRejectedValueOnce(new api.ApiError('Question not found', 404));

      const { result } = renderHook(() => useCreateAnswer());

      // First call - sets error
      await act(async () => {
        try {
          await result.current.createAnswer('nonexistent', 'Valid body with enough characters here.');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Question not found');

      // Second call - should clear error first
      mockApiFetch.mockResolvedValueOnce(createTestAnswer());

      await act(async () => {
        await result.current.createAnswer('q1', 'Valid body content with enough characters here.');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Some error', 500));

      const { result } = renderHook(() => useCreateAnswer());

      await act(async () => {
        try {
          await result.current.createAnswer('q1', 'Valid body content with enough characters.');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
