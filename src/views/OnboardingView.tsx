// OnboardingView — "Tell Us About Your World" first-run screen
// Gated by onboardingStep !== 'complete'. Composes WorldviewInput + StarterChips + SavedInterestChips.

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { WorldviewInput } from '../components/onboarding/WorldviewInput';
import { StarterChips } from '../components/onboarding/StarterChips';
import { SavedInterestChips } from '../components/onboarding/SavedInterestChips';
import { useUserInterests } from '../hooks/useUserInterests';
import { extractInterestContext } from '../services/interestService';

const ONBOARDING_SOFT_CAP = 10;

interface OnboardingViewProps {
  userName?: string;
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = 'input' | 'transitioning' | 'interstitial';

export function OnboardingView({ userName, onComplete, onSkip }: OnboardingViewProps) {
  const {
    interests,
    addInterest,
    removeInterest,
    hasInterest,
  } = useUserInterests();

  const [phase, setPhase] = useState<Phase>('input');
  const [softCapShown, setSoftCapShown] = useState(false);

  // Track which starter domains have been added
  const addedDomains = useMemo(() => {
    const set = new Set<string>();
    interests.forEach(i => {
      set.add(i.text.toLowerCase());
    });
    return set;
  }, [interests]);

  // Handle adding interest from text input
  const handleAddFromInput = useCallback(async (text: string): Promise<{ success: boolean; error?: string }> => {
    // Try to extract structured context (region, grade) from the text
    const context = extractInterestContext(text, text);
    const interestText = context?.text ?? text;
    const region = context?.region;
    const grade = context?.grade;

    // Check duplicate before calling API
    if (hasInterest(interestText)) {
      return { success: false, error: 'Already added.' };
    }

    try {
      await addInterest(interestText, 'manual', { region, grade });

      // Show soft cap hint
      if (interests.length + 1 >= ONBOARDING_SOFT_CAP && !softCapShown) {
        setSoftCapShown(true);
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add';
      return { success: false, error: msg };
    }
  }, [addInterest, hasInterest, interests.length, softCapShown]);

  // Handle adding interest from starter chip
  const handleChipClick = useCallback(async (domain: string) => {
    if (hasInterest(domain)) return;

    try {
      await addInterest(domain, 'manual');

      if (interests.length + 1 >= ONBOARDING_SOFT_CAP && !softCapShown) {
        setSoftCapShown(true);
      }
    } catch {
      // Error handled by hook
    }
  }, [addInterest, hasInterest, interests.length, softCapShown]);

  // Handle "Build My Dashboard"
  const handleBuild = async () => {
    if (interests.length === 0) return;
    setPhase('transitioning');

    // Brief delay for exit animation
    setTimeout(() => {
      setPhase('interstitial');
      // Show interstitial, then complete
      setTimeout(() => {
        onComplete();
      }, 1100);
    }, 300);
  };

  // Display name logic
  const greeting = userName
    ? <>Hi <span className="text-secondary">{userName}</span>.</>
    : <>Welcome.</>;

  return (
    <AnimatePresence mode="wait">
      {phase === 'interstitial' ? (
        <motion.div
          key="interstitial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center"
        >
          <motion.div
            animate={{ scale: [0.82, 1, 0.82] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/Abi.svg" className="w-12 h-12" alt="Abi" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-[15px] text-secondary mt-4"
          >
            Personalizing Abi for you...
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          key="onboarding"
          animate={{ opacity: phase === 'transitioning' ? 0 : 1, y: phase === 'transitioning' ? -10 : 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 py-8"
        >
          <div className="w-full max-w-[520px]">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center mb-6"
            >
              <img src="/Abi.svg" className="w-14 h-14" alt="Abi" />
            </motion.div>

            {/* Greeting */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="text-3xl md:text-4xl font-medium text-primary text-center mb-2"
            >
              {greeting}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-[15px] text-muted text-center mb-8"
            >
              Let's personalize Abi Plus for you.
            </motion.p>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-4"
            >
              <WorldviewInput onAdd={handleAddFromInput} />
            </motion.div>

            {/* Saved interest chips */}
            {interests.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <SavedInterestChips
                  interests={interests}
                  onRemove={(id) => removeInterest(id)}
                />
              </motion.div>
            )}

            {/* Soft cap hint */}
            <AnimatePresence>
              {softCapShown && interests.length >= ONBOARDING_SOFT_CAP && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-slate-400 text-center mb-4"
                  data-testid="soft-cap-hint"
                >
                  Great start! You can add more anytime in Settings.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-center gap-3 my-6"
            >
              <div className="flex-1 h-px bg-slate-200/60" />
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                Or pick from popular topics
              </span>
              <div className="flex-1 h-px bg-slate-200/60" />
            </motion.div>

            {/* Starter chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="mb-8"
            >
              <StarterChips
                addedDomains={addedDomains}
                onChipClick={handleChipClick}
              />
            </motion.div>

            {/* Build My Dashboard CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="space-y-3"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={interests.length === 0}
                onClick={handleBuild}
                className={`
                  w-full flex items-center justify-center gap-2
                  px-4 py-3 rounded-2xl
                  text-[15px] font-medium
                  transition-all
                  ${interests.length > 0
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }
                `}
                data-testid="personalize-button"
              >
                {phase === 'transitioning' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Personalize Abi
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Helper text when empty */}
              {interests.length === 0 && (
                <p className="text-xs text-slate-400 text-center">
                  Add at least one topic to continue.
                </p>
              )}

              {/* Skip link */}
              <div className="text-center">
                <button
                  onClick={onSkip}
                  className="text-sm text-muted hover:text-secondary transition-colors"
                  data-testid="skip-onboarding"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
