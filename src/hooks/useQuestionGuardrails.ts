// useQuestionGuardrails Hook
// Combines profanity checking and similar thread detection
// with debouncing for real-time form validation

import { useState, useEffect, useCallback, useRef } from 'react';
import { checkQuestionContent, type ModerationResult } from '../services/contentModeration';
import { findSimilarThreads, type SimilarThread } from '../services/threadSimilarity';

/**
 * Guardrails check result
 */
export interface GuardrailsResult {
  // Profanity check
  isProfanityFlagged: boolean;
  profanityMessage: string | null;
  profanitySeverity: ModerationResult['severity'];

  // Similar threads
  similarThreads: SimilarThread[];
  isCheckingSimilar: boolean;

  // Overall submission status
  canSubmit: boolean;
  isChecking: boolean;

  // Actions
  dismissSimilarThreads: () => void;
  reset: () => void;
}

/**
 * Hook options
 */
export interface UseQuestionGuardrailsOptions {
  /** Debounce delay in ms (default: 400) */
  debounceMs?: number;
  /** Minimum query length to search for similar threads */
  minQueryLength?: number;
  /** Maximum similar threads to show */
  maxSimilarThreads?: number;
  /** Minimum similarity score to show thread */
  minSimilarityScore?: number;
  /** Categories to filter similar threads */
  categories?: string[];
}

/**
 * Hook for real-time question validation
 * - Checks profanity on every change (synchronous)
 * - Debounces similar thread search
 */
export function useQuestionGuardrails(
  title: string,
  body: string,
  options: UseQuestionGuardrailsOptions = {}
): GuardrailsResult {
  const {
    debounceMs = 400,
    minQueryLength = 5,
    maxSimilarThreads = 5,
    minSimilarityScore = 0.3,
    categories,
  } = options;

  // State
  const [moderationResult, setModerationResult] = useState<ModerationResult>({
    flagged: false,
    reason: null,
    severity: 'none',
    flaggedTerms: [],
  });
  const [similarThreads, setSimilarThreads] = useState<SimilarThread[]>([]);
  const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);
  const [similarDismissed, setSimilarDismissed] = useState(false);

  // Refs for debouncing
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTitleRef = useRef<string>('');

  // Profanity check - runs immediately on every change
  useEffect(() => {
    const result = checkQuestionContent(title, body);
    setModerationResult(result);
  }, [title, body]);

  // Similar thread search - debounced
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset dismissed state if title changed significantly
    if (title !== lastTitleRef.current) {
      const titleChanged = Math.abs(title.length - lastTitleRef.current.length) > 3;
      if (titleChanged) {
        setSimilarDismissed(false);
      }
      lastTitleRef.current = title;
    }

    // Skip if title too short
    if (title.length < minQueryLength) {
      setSimilarThreads([]);
      setIsCheckingSimilar(false);
      return;
    }

    // Start loading indicator
    setIsCheckingSimilar(true);

    // Debounced search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const threads = await findSimilarThreads(title, {
          limit: maxSimilarThreads,
          minScore: minSimilarityScore,
          categories,
        });
        setSimilarThreads(threads);
      } catch (error) {
        console.error('[useQuestionGuardrails] Error finding similar threads:', error);
        setSimilarThreads([]);
      } finally {
        setIsCheckingSimilar(false);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, debounceMs, minQueryLength, maxSimilarThreads, minSimilarityScore, categories]);

  // Dismiss similar threads (user acknowledged them)
  const dismissSimilarThreads = useCallback(() => {
    setSimilarDismissed(true);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setModerationResult({
      flagged: false,
      reason: null,
      severity: 'none',
      flaggedTerms: [],
    });
    setSimilarThreads([]);
    setIsCheckingSimilar(false);
    setSimilarDismissed(false);
    lastTitleRef.current = '';
  }, []);

  // Calculate if user can submit
  // - Cannot submit if profanity is flagged (hard block)
  // - Can submit even if similar threads exist (soft gate)
  const canSubmit = !moderationResult.flagged && title.trim().length >= 3;

  // Overall checking status
  const isChecking = isCheckingSimilar;

  return {
    // Profanity
    isProfanityFlagged: moderationResult.flagged,
    profanityMessage: moderationResult.reason,
    profanitySeverity: moderationResult.severity,

    // Similar threads (only show if not dismissed)
    similarThreads: similarDismissed ? [] : similarThreads,
    isCheckingSimilar,

    // Submission
    canSubmit,
    isChecking,

    // Actions
    dismissSimilarThreads,
    reset,
  };
}

export default useQuestionGuardrails;
