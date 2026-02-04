// useUserInterests Hook
// Wraps interestService with React state management and optimistic updates

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Interest, InterestSource } from '../types/interests';
import {
  getInterests,
  addInterest as addInterestService,
  removeInterest as removeInterestService,
  updateInterest as updateInterestService,
  isDuplicate,
} from '../services/interestService';

interface UseUserInterestsReturn {
  interests: Interest[];
  isLoading: boolean;
  error: string | null;
  addInterest: (text: string, source: InterestSource, opts?: { region?: string; grade?: string; conversationId?: string; searchContext?: string }) => Promise<void>;
  removeInterest: (id: string) => Promise<void>;
  updateInterest: (id: string, updates: Partial<Pick<Interest, 'text' | 'region' | 'grade'>>) => Promise<void>;
  hasInterest: (text: string) => boolean;
  interestTexts: string[];
}

export function useUserInterests(): UseUserInterestsReturn {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load interests on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getInterests();
        if (!cancelled) {
          setInterests(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load interests');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Add interest with optimistic update
  const addInterest = useCallback(async (
    text: string,
    source: InterestSource,
    opts?: { region?: string; grade?: string; conversationId?: string; searchContext?: string }
  ) => {
    setError(null);

    try {
      const newInterest = await addInterestService({
        text,
        source,
        ...opts,
      });
      setInterests(prev => [...prev, newInterest]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add interest';
      setError(message);
      throw err;
    }
  }, []);

  // Remove interest with optimistic update
  const removeInterest = useCallback(async (id: string) => {
    setError(null);

    // Optimistic: remove immediately
    const previous = interests;
    setInterests(prev => prev.filter(i => i.id !== id));

    try {
      await removeInterestService(id);
    } catch (err) {
      // Rollback on error
      setInterests(previous);
      const message = err instanceof Error ? err.message : 'Failed to remove interest';
      setError(message);
      throw err;
    }
  }, [interests]);

  // Update interest with optimistic update + server reconciliation
  const updateInterest = useCallback(async (
    id: string,
    updates: Partial<Pick<Interest, 'text' | 'region' | 'grade'>>
  ) => {
    setError(null);

    // Optimistic: apply update immediately
    const previous = interests;
    setInterests(prev => prev.map(i =>
      i.id === id ? { ...i, ...updates } : i
    ));

    try {
      // Server recomputes canonicalKey + coverage; reconcile with response
      const updated = await updateInterestService(id, updates);
      setInterests(prev => prev.map(i =>
        i.id === id ? updated : i
      ));
    } catch (err) {
      // Rollback on error
      setInterests(previous);
      const message = err instanceof Error ? err.message : 'Failed to update interest';
      setError(message);
      throw err;
    }
  }, [interests]);

  // Check if text already exists (case-insensitive)
  const hasInterest = useCallback((text: string): boolean => {
    return isDuplicate(interests, text);
  }, [interests]);

  // Formatted interest strings for context injection
  // Includes region/grade when available for richer context
  const interestTexts = useMemo(
    () => interests.map(i => {
      const parts = [i.text];
      if (i.grade) parts.push(i.grade);
      if (i.region) parts.push(i.region);
      return parts.join(' - ');
    }),
    [interests]
  );

  return {
    interests,
    isLoading,
    error,
    addInterest,
    removeInterest,
    updateInterest,
    hasInterest,
    interestTexts,
  };
}
