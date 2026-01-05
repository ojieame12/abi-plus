// Success Checkmark - Elegant draw animation
import { motion } from 'framer-motion';

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
  /** Delay before animation starts */
  delay?: number;
}

export function SuccessCheckmark({
  size = 24,
  className = '',
  delay = 0
}: SuccessCheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      initial="hidden"
      animate="visible"
    >
      {/* Circle */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              delay,
              duration: 0.4,
              ease: "easeOut"
            }
          }
        }}
      />
      {/* Checkmark */}
      <motion.path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              delay: delay + 0.3,
              duration: 0.3,
              ease: "easeOut"
            }
          }
        }}
      />
    </motion.svg>
  );
}

// Simple checkmark without circle
export function CheckmarkDraw({
  size = 16,
  className = '',
  delay = 0
}: SuccessCheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <motion.path
        d="M3 8l3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay,
          duration: 0.25,
          ease: "easeOut"
        }}
      />
    </motion.svg>
  );
}
