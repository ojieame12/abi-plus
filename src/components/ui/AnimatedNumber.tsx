// Animated Number - Smooth transitions for counts
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  /** Format with commas for large numbers */
  format?: boolean;
}

export function AnimatedNumber({ value, className = '', format = false }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (value !== displayValue) {
      setDirection(value > displayValue ? 'up' : 'down');
      setDisplayValue(value);
    }
  }, [value, displayValue]);

  const formatted = format
    ? displayValue.toLocaleString()
    : displayValue.toString();

  return (
    <span className={`inline-flex overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={displayValue}
          initial={{
            y: direction === 'up' ? 8 : -8,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          exit={{
            y: direction === 'up' ? -8 : 8,
            opacity: 0
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 0.8
          }}
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Simpler variant for inline use - just fades
export function AnimatedCount({ value, className = '' }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`tabular-nums ${className}`}
    >
      {value}
    </motion.span>
  );
}
