import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserInterests } from '../useUserInterests';
import * as interestService from '../../services/interestService';
import type { Interest } from '../../types/interests';

// Mock the service module
vi.mock('../../services/interestService', () => ({
  getInterests: vi.fn(),
  addInterest: vi.fn(),
  removeInterest: vi.fn(),
  updateInterest: vi.fn(),
  isDuplicate: vi.fn(),
}));

const mockGetInterests = vi.mocked(interestService.getInterests);
const mockAddInterest = vi.mocked(interestService.addInterest);
const mockRemoveInterest = vi.mocked(interestService.removeInterest);
const mockUpdateInterest = vi.mocked(interestService.updateInterest);
const mockIsDuplicate = vi.mocked(interestService.isDuplicate);

const MOCK_INTERESTS: Interest[] = [
  {
    id: 'test_1',
    text: 'Steel',
    canonicalKey: 'europe|hrc|steel',
    source: 'manual',
    region: 'Europe',
    grade: 'HRC',
    coverage: { level: 'decision_grade' },
    savedAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'test_2',
    text: 'Aluminum Pricing',
    canonicalKey: 'aluminum|pricing',
    source: 'chat_inferred',
    savedAt: '2025-01-20T14:30:00.000Z',
  },
];

describe('useUserInterests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetInterests.mockResolvedValue(MOCK_INTERESTS);
  });

  // ============================================
  // LOADING
  // ============================================
  describe('Loading', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useUserInterests());
      expect(result.current.isLoading).toBe(true);
    });

    it('resolves with interests after loading', async () => {
      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.interests).toEqual(MOCK_INTERESTS);
      // interestTexts includes region/grade when present
      expect(result.current.interestTexts).toEqual(['Steel - HRC - Europe', 'Aluminum Pricing']);
    });
  });

  // ============================================
  // ADD
  // ============================================
  describe('Add', () => {
    it('calls service and updates local state', async () => {
      const newInterest: Interest = {
        id: 'test_3',
        text: 'Copper - Asia',
        source: 'manual',
        savedAt: '2025-01-25T00:00:00.000Z',
      };
      mockAddInterest.mockResolvedValue(newInterest);

      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addInterest('Copper - Asia', 'manual');
      });

      expect(mockAddInterest).toHaveBeenCalledWith({
        text: 'Copper - Asia',
        source: 'manual',
      });
      expect(result.current.interests).toHaveLength(3);
    });

    it('sets error on failure', async () => {
      mockAddInterest.mockRejectedValue(new Error('Maximum of 50 interests reached'));

      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call addInterest and catch the re-thrown error
      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.addInterest('Too many', 'manual');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('Maximum of 50 interests reached');
      expect(result.current.error).toBe('Maximum of 50 interests reached');
    });
  });

  // ============================================
  // REMOVE
  // ============================================
  describe('Remove', () => {
    it('calls service and removes from state', async () => {
      mockRemoveInterest.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeInterest('test_1');
      });

      expect(mockRemoveInterest).toHaveBeenCalledWith('test_1');
      expect(result.current.interests).toHaveLength(1);
      expect(result.current.interests[0].id).toBe('test_2');
    });
  });

  // ============================================
  // HAS INTEREST
  // ============================================
  describe('hasInterest', () => {
    it('delegates to isDuplicate', async () => {
      mockIsDuplicate.mockReturnValue(true);

      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasInterest('Steel - HRC - Europe')).toBe(true);
      expect(mockIsDuplicate).toHaveBeenCalled();
    });

    it('returns false for non-existent interest', async () => {
      mockIsDuplicate.mockReturnValue(false);

      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasInterest('Non-existent')).toBe(false);
    });
  });

  // ============================================
  // ERROR
  // ============================================
  describe('Error', () => {
    it('sets error on load failure', async () => {
      mockGetInterests.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserInterests());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.interests).toEqual([]);
    });
  });
});
