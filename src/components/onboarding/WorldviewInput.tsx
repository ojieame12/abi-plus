// WorldviewInput — free-text input for adding interests during onboarding
// Supports Enter and comma-separated input, shows inline feedback

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorldviewInputProps {
  onAdd: (text: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export function WorldviewInput({ onAdd, disabled }: WorldviewInputProps) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear feedback after 2.5s
  const showFeedback = (msg: string) => {
    setFeedback(msg);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 2500);
  };

  const submitValue = async (raw: string) => {
    // Support comma-separated values
    const topics = raw.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (topics.length === 0) return;

    setIsSubmitting(true);
    for (const topic of topics) {
      const result = await onAdd(topic);
      if (!result.success && result.error) {
        showFeedback(result.error);
      }
    }
    setValue('');
    setIsSubmitting(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      submitValue(value);
    }
  };

  return (
    <div data-testid="worldview-input">
      <div
        className={`
          bg-white/80 backdrop-blur-sm rounded-2xl
          border border-white/60
          shadow-[0_8px_30px_rgb(0,0,0,0.04)]
          ring-1 ring-black/[0.02]
          focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200
          focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
          transition-all px-4 py-3
        `}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Steel, Packaging, IT Services"
          disabled={disabled || isSubmitting}
          className="w-full bg-transparent text-[15px] text-primary
            placeholder:text-muted focus:outline-none disabled:opacity-50"
          aria-label="Add an interest"
          data-testid="worldview-text-input"
        />
      </div>

      {/* Inline feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-amber-600 mt-1.5 ml-1"
            role="alert"
            data-testid="input-feedback"
          >
            {feedback}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
