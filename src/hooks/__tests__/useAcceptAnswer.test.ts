// Tests for useAcceptAnswer hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAcceptAnswer } from '../useAcceptAnswer';
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

describe('useAcceptAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAcceptAnswer());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.acceptAnswer).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  describe('acceptAnswer', () => {
    it('calls API with correct parameters', async () => {
      mockApiFetch.mockResolvedValue({ success: true, acceptedAnswerId: 'a1' });

      const { result } = renderHook(() => useAcceptAnswer());

      await act(async () => {
        await result.current.acceptAnswer('q1', 'a1');
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/questions/q1/accept',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ answerId: 'a1' }),
        })
      );
    });

    it('sets isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(promise);

      const { result } = renderHook(() => useAcceptAnswer());

      act(() => {
        result.current.acceptAnswer('q1', 'a1');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true, acceptedAnswerId: 'a1' });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles ApiError with message', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Only question author can accept', 403));

      const { result } = renderHook(() => useAcceptAnswer());

      await act(async () => {
        try {
          await result.current.acceptAnswer('q1', 'a1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Only question author can accept');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles generic error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAcceptAnswer());

      await act(async () => {
        try {
          await result.current.acceptAnswer('q1', 'a1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to accept answer');
    });

    it('throws error after setting state', async () => {
      const error = new api.ApiError('Not authorized', 403);
      mockApiFetch.mockRejectedValue(error);

      const { result } = renderHook(() => useAcceptAnswer());

      await expect(
        act(async () => {
          await result.current.acceptAnswer('q1', 'a1');
        })
      ).rejects.toThrow();
    });

    it('clears previous error on new request', async () => {
      mockApiFetch.mockRejectedValueOnce(new api.ApiError('First error', 400));

      const { result } = renderHook(() => useAcceptAnswer());

      // First call - sets error
      await act(async () => {
        try {
          await result.current.acceptAnswer('q1', 'a1');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second call - should clear error first
      mockApiFetch.mockResolvedValueOnce({ success: true, acceptedAnswerId: 'a2' });

      await act(async () => {
        await result.current.acceptAnswer('q1', 'a2');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      mockApiFetch.mockRejectedValue(new api.ApiError('Some error', 500));

      const { result } = renderHook(() => useAcceptAnswer());

      await act(async () => {
        try {
          await result.current.acceptAnswer('q1', 'a1');
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
