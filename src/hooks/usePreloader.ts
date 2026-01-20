import { useState, useEffect, useCallback } from 'react';

export type PreloaderPhase = 'loading' | 'exiting' | 'done';

interface PreloaderState {
  phase: PreloaderPhase;
  progress: number;
  fontsReady: boolean;
  minTimeElapsed: boolean;
}

interface UsePreloaderOptions {
  minDuration?: number;
  cachedMinDuration?: number;
  exitDuration?: number;
}

const DEFAULT_OPTIONS: Required<UsePreloaderOptions> = {
  minDuration: 1500,       // 1.5s minimum for first visit
  cachedMinDuration: 800,  // 800ms for return visits
  exitDuration: 500,       // Exit animation duration
};

/**
 * Hook to manage app preloader state
 * Waits for fonts to load + minimum display time before revealing app
 */
export function usePreloader(options: UsePreloaderOptions = {}) {
  const { minDuration, cachedMinDuration, exitDuration } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const [state, setState] = useState<PreloaderState>({
    phase: 'loading',
    progress: 0,
    fontsReady: false,
    minTimeElapsed: false,
  });

  // Check if fonts are already cached
  const areFontsCached = useCallback(() => {
    try {
      return document.fonts.check('1em ClashGrotesk');
    } catch {
      return false;
    }
  }, []);

  // Determine minimum duration based on cache state
  const getMinDuration = useCallback(() => {
    return areFontsCached() ? cachedMinDuration : minDuration;
  }, [areFontsCached, cachedMinDuration, minDuration]);

  useEffect(() => {
    const actualMinDuration = getMinDuration();
    let progressInterval: NodeJS.Timeout;
    let minTimeTimeout: NodeJS.Timeout;

    // Simulate progress (smooth increment)
    const startProgress = () => {
      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const target = Math.min((elapsed / actualMinDuration) * 100, 95);
        setState(prev => ({
          ...prev,
          progress: Math.max(prev.progress, target),
        }));
      }, 50);
    };

    // Wait for fonts
    const waitForFonts = async () => {
      try {
        await document.fonts.ready;
        setState(prev => ({ ...prev, fontsReady: true, progress: Math.max(prev.progress, 50) }));
      } catch {
        // Fallback: assume fonts loaded after timeout
        setState(prev => ({ ...prev, fontsReady: true }));
      }
    };

    // Minimum time timer
    const startMinTimer = () => {
      minTimeTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, minTimeElapsed: true, progress: 100 }));
      }, actualMinDuration);
    };

    startProgress();
    waitForFonts();
    startMinTimer();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(minTimeTimeout);
    };
  }, [getMinDuration]);

  // Transition to exiting phase when ready
  useEffect(() => {
    if (state.fontsReady && state.minTimeElapsed && state.phase === 'loading') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- state machine transition is intentional
      setState(prev => ({ ...prev, phase: 'exiting' }));
    }
  }, [state.fontsReady, state.minTimeElapsed, state.phase]);

  // Transition to done after exit animation
  useEffect(() => {
    if (state.phase === 'exiting') {
      const exitTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, phase: 'done' }));
      }, exitDuration);

      return () => clearTimeout(exitTimeout);
    }
  }, [state.phase, exitDuration]);

  return {
    phase: state.phase,
    progress: state.progress,
    isLoading: state.phase === 'loading',
    isExiting: state.phase === 'exiting',
    isDone: state.phase === 'done',
  };
}
