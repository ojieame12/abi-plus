// Tests for useTags hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTags } from '../useTags';
import * as api from '../../services/api';
import { createTestTag } from '../../test/community-utils';

// Mock the api module
vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = api.apiFetch as ReturnType<typeof vi.fn>;

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useTags());

    expect(result.current.tags).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  describe('fetching tags', () => {
    it('fetches tags from API on mount', async () => {
      const mockTags = [
        createTestTag({ name: 'tag1' }),
        createTestTag({ name: 'tag2' }),
      ];
      mockApiFetch.mockResolvedValue(mockTags);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiFetch).toHaveBeenCalledWith('/api/community/tags');
      expect(result.current.tags).toEqual(mockTags);
      expect(result.current.error).toBeNull();
    });

    it('sets error on API failure', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load tags');
      expect(result.current.tags).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('refetches tags on demand', async () => {
      const mockTags1 = [createTestTag({ name: 'initial' })];
      const mockTags2 = [createTestTag({ name: 'updated' })];

      mockApiFetch.mockResolvedValueOnce(mockTags1);
      mockApiFetch.mockResolvedValueOnce(mockTags2);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.tags[0]?.name).toBe('initial');
      });

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.tags[0]?.name).toBe('updated');
      });

      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });

    it('clears error on successful refetch', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('First error'));
      mockApiFetch.mockResolvedValueOnce([createTestTag()]);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load tags');
      });

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
