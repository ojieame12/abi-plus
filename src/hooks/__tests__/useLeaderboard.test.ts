// Tests for useLeaderboard hook
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeaderboard, LeaderboardEntry } from '../useLeaderboard';
import * as api from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = api.apiFetch as ReturnType<typeof vi.fn>;

function createLeaderboardEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    userId: 'user-1',
    displayName: 'Test User',
    avatarUrl: null,
    reputation: 1000,
    currentStreak: 5,
    ...overrides,
  };
}

describe('useLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useLeaderboard());

    expect(result.current.entries).toEqual([]);
    expect(result.current.currentUserRank).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.period).toBe('all-time');
  });

  describe('fetching leaderboard', () => {
    it('fetches leaderboard with default parameters', async () => {
      const mockEntries = [
        createLeaderboardEntry({ rank: 1 }),
        createLeaderboardEntry({ rank: 2, userId: 'user-2' }),
      ];
      mockApiFetch.mockResolvedValue({ entries: mockEntries });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/leaderboard?type=reputation&period=all-time&limit=10'
      );
      expect(result.current.entries).toEqual(mockEntries);
    });

    it('fetches leaderboard with custom type and limit', async () => {
      mockApiFetch.mockResolvedValue({ entries: [] });

      const { result } = renderHook(() => useLeaderboard('contributors', 5));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/community/leaderboard?type=contributors&period=all-time&limit=5'
      );
    });

    it('includes current user rank when available', async () => {
      const mockCurrentUser = createLeaderboardEntry({ rank: 15, userId: 'current' });
      mockApiFetch.mockResolvedValue({
        entries: [createLeaderboardEntry()],
        currentUserRank: mockCurrentUser,
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentUserRank).toEqual(mockCurrentUser);
    });

    it('sets error on API failure', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load leaderboard');
      expect(result.current.entries).toEqual([]);
    });
  });

  describe('period changes', () => {
    it('refetches when period changes', async () => {
      mockApiFetch.mockResolvedValue({ entries: [] });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('period=all-time')
      );

      act(() => {
        result.current.setPeriod('week');
      });

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          expect.stringContaining('period=week')
        );
      });
    });

    it('updates period state', async () => {
      mockApiFetch.mockResolvedValue({ entries: [] });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.period).toBe('all-time');

      act(() => {
        result.current.setPeriod('month');
      });

      expect(result.current.period).toBe('month');
    });
  });

  describe('refetch', () => {
    it('refetches leaderboard on demand', async () => {
      const entries1 = [createLeaderboardEntry({ rank: 1 })];
      const entries2 = [createLeaderboardEntry({ rank: 1, reputation: 2000 })];

      mockApiFetch.mockResolvedValueOnce({ entries: entries1 });
      mockApiFetch.mockResolvedValueOnce({ entries: entries2 });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.entries[0]?.reputation).toBe(1000);
      });

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.entries[0]?.reputation).toBe(2000);
      });

      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });

    it('clears error on successful refetch', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('First error'));
      mockApiFetch.mockResolvedValueOnce({ entries: [] });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load leaderboard');
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
