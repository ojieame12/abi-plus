// Tests for useCreateQuestion hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateQuestion } from '../useCreateQuestion';
import * as api from '../../services/api';
import { createTestQuestion, createQuestionInput } from '../../test/community-utils';

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

describe('useCreateQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useCreateQuestion());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.createQuestion).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  describe('createQuestion', () => {
    it('submits question to API and returns result', async () => {
      const mockQuestion = createTestQuestion();
      mockApiFetch.mockResolvedValue(mockQuestion);

      const { result } = renderHook(() => useCreateQuestion());

      const input = createQuestionInput();
      let returnedQuestion;

      await act(async () => {
        returnedQuestion = await result.current.createQuestion(input);
      });

      expect(returnedQuestion).toEqual(mockQuestion);
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/questions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
    });

    it('sets isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(promise);

      const { result } = renderHook(() => useCreateQuestion());

      act(() => {
        result.current.createQuestion(createQuestionInput());
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(createTestQuestion());
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles ApiError with message', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Title must be at least 15 characters', 400));

      const { result } = renderHook(() => useCreateQuestion());

      await act(async () => {
        try {
          await result.current.createQuestion(createQuestionInput({ title: 'Short' }));
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Title must be at least 15 characters');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles generic error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCreateQuestion());

      await act(async () => {
        try {
          await result.current.createQuestion(createQuestionInput());
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to create question');
    });

    it('throws error after setting state', async () => {
      const error = new api.ApiError('Invalid input', 400);
      mockApiFetch.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateQuestion());

      await expect(
        act(async () => {
          await result.current.createQuestion(createQuestionInput());
        })
      ).rejects.toThrow();
    });

    it('clears previous error on new request', async () => {
      mockApiFetch.mockRejectedValueOnce(new api.ApiError('First error', 500));

      const { result } = renderHook(() => useCreateQuestion());

      // First call - sets error
      await act(async () => {
        try {
          await result.current.createQuestion(createQuestionInput());
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second call - should clear error first
      mockApiFetch.mockResolvedValueOnce(createTestQuestion());

      await act(async () => {
        await result.current.createQuestion(createQuestionInput());
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Some error', 500));

      const { result } = renderHook(() => useCreateQuestion());

      await act(async () => {
        try {
          await result.current.createQuestion(createQuestionInput());
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
