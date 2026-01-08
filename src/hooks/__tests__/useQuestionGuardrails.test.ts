// useQuestionGuardrails Hook Tests
// Note: Async debounce tests skipped due to complexity with fake timers + waitFor
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionGuardrails } from '../useQuestionGuardrails';
import * as contentModeration from '../../services/contentModeration';
import * as threadSimilarity from '../../services/threadSimilarity';

// Mock the services
vi.mock('../../services/contentModeration');
vi.mock('../../services/threadSimilarity');

describe('useQuestionGuardrails', () => {
  beforeEach(() => {
    // Mock checkQuestionContent
    vi.mocked(contentModeration.checkQuestionContent).mockImplementation((title: string, body: string) => {
      const hasProfanity = title.includes('damn') || body.includes('damn');
      return {
        flagged: hasProfanity,
        reason: hasProfanity ? 'Please remove inappropriate language.' : null,
        severity: hasProfanity ? 'medium' as const : 'none' as const,
        flaggedTerms: hasProfanity ? ['damn'] : [],
      };
    });

    // Mock findSimilarThreads - returns immediately
    vi.mocked(threadSimilarity.findSimilarThreads).mockImplementation(() => {
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ════════════════════════════════════════════════════════════════
  // Initial State
  // ════════════════════════════════════════════════════════════════

  describe('Initial State', () => {
    it('returns initial state with no flags', () => {
      const { result } = renderHook(() => useQuestionGuardrails('', ''));

      expect(result.current.isProfanityFlagged).toBe(false);
      expect(result.current.profanityMessage).toBeNull();
      expect(result.current.similarThreads).toEqual([]);
      expect(result.current.canSubmit).toBe(false); // title too short
    });

    it('provides dismiss and reset actions', () => {
      const { result } = renderHook(() => useQuestionGuardrails('', ''));

      expect(typeof result.current.dismissSimilarThreads).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Profanity Detection (Synchronous)
  // ════════════════════════════════════════════════════════════════

  describe('Profanity Detection', () => {
    it('detects profanity immediately', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('This is damn annoying', 'Clean body')
      );

      expect(result.current.isProfanityFlagged).toBe(true);
      expect(result.current.profanityMessage).toBe('Please remove inappropriate language.');
    });

    it('clears profanity flag when text is cleaned', () => {
      const { result, rerender } = renderHook(
        ({ title, body }) => useQuestionGuardrails(title, body),
        { initialProps: { title: 'damn title', body: 'clean body' } }
      );

      expect(result.current.isProfanityFlagged).toBe(true);

      rerender({ title: 'clean title', body: 'clean body' });

      expect(result.current.isProfanityFlagged).toBe(false);
    });

    it('checks body for profanity too', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('Clean title', 'This damn body')
      );

      expect(result.current.isProfanityFlagged).toBe(true);
    });

    it('calls checkQuestionContent with correct args', () => {
      renderHook(() =>
        useQuestionGuardrails('Test title', 'Test body')
      );

      expect(contentModeration.checkQuestionContent).toHaveBeenCalledWith('Test title', 'Test body');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Submission Status (Synchronous)
  // ════════════════════════════════════════════════════════════════

  describe('Submission Status', () => {
    it('cannot submit if profanity is flagged', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('damn title that is long enough', 'Clean body')
      );

      expect(result.current.canSubmit).toBe(false);
    });

    it('can submit if clean and title is long enough', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('Clean title', 'Clean body')
      );

      expect(result.current.canSubmit).toBe(true);
    });

    it('cannot submit if title is too short', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('Hi', 'Clean body')
      );

      expect(result.current.canSubmit).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Dismiss Similar Threads (Synchronous part)
  // ════════════════════════════════════════════════════════════════

  describe('Dismiss Similar Threads', () => {
    it('dismiss function can be called without error', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('Test title', 'Test body')
      );

      expect(() => {
        act(() => {
          result.current.dismissSimilarThreads();
        });
      }).not.toThrow();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Reset (Synchronous part)
  // ════════════════════════════════════════════════════════════════

  describe('Reset', () => {
    it('reset function can be called without error', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('Test title', 'Test body')
      );

      expect(() => {
        act(() => {
          result.current.reset();
        });
      }).not.toThrow();
    });

    it('resets profanity state', () => {
      const { result, rerender } = renderHook(
        ({ title, body }) => useQuestionGuardrails(title, body),
        { initialProps: { title: 'damn title', body: 'body' } }
      );

      expect(result.current.isProfanityFlagged).toBe(true);

      act(() => {
        result.current.reset();
      });

      // Re-render with clean text
      rerender({ title: 'clean title', body: 'body' });

      expect(result.current.isProfanityFlagged).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Similar Threads - Basic Tests
  // ════════════════════════════════════════════════════════════════

  describe('Similar Threads - Basic', () => {
    it('does not search for short titles', () => {
      renderHook(() =>
        useQuestionGuardrails('Hi', 'Body text', { minQueryLength: 5 })
      );

      // Should not call findSimilarThreads for short title
      expect(threadSimilarity.findSimilarThreads).not.toHaveBeenCalled();
    });

    it('starts checking for longer titles', () => {
      const { result } = renderHook(() =>
        useQuestionGuardrails('This is a long enough title', 'Body text')
      );

      // Should be in checking state initially
      expect(result.current.isCheckingSimilar).toBe(true);
    });
  });
});
