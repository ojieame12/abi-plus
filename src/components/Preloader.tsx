import { motion } from 'framer-motion';

interface PreloaderProps {
  progress: number;
  isExiting: boolean;
}

// Consistent easing with the rest of the app
const EASING = [0.25, 0.46, 0.45, 0.94] as const;

const logoVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.2 },
  },
  exit: {
    scale: 1.1,
    opacity: 0,
    transition: { duration: 0.4, ease: EASING },
  },
};

const progressBarVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { delay: 0.4, duration: 0.3, ease: EASING },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const backgroundVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, delay: 0.1 },
  },
};

export function Preloader({ progress, isExiting }: PreloaderProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white overflow-hidden"
      variants={backgroundVariants}
      initial="hidden"
      animate={isExiting ? 'exit' : 'visible'}
      exit="exit"
    >
      {/* Ethereal gradient layers - same as MainLayout */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left - violet */}
        <div
          className="absolute -top-[100px] -left-[200px] w-[800px] h-[800px] rounded-full pointer-events-none blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)' }}
        />
        {/* Center left - lavender */}
        <div
          className="absolute top-[100px] -left-[100px] w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, rgba(221,214,254,0.3) 50%, transparent 70%)' }}
        />
        {/* Top center - soft pink */}
        <div
          className="absolute -top-[150px] left-[30%] w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(245,208,254,0.5) 0%, rgba(253,230,255,0.3) 50%, transparent 70%)' }}
        />
        {/* Top right - light violet */}
        <div
          className="absolute -top-[50px] right-[-50px] w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, rgba(167,139,250,0.3) 50%, transparent 70%)' }}
        />
        {/* Center right - violet */}
        <div
          className="absolute top-[25%] right-[5%] w-[550px] h-[550px] rounded-full pointer-events-none blur-3xl opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(221,214,254,0.5) 0%, rgba(196,181,253,0.3) 50%, transparent 70%)' }}
        />
        {/* Bottom right - pink */}
        <div
          className="absolute bottom-[-100px] right-[0%] w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(251,207,232,0.5) 0%, rgba(245,208,254,0.3) 50%, transparent 70%)' }}
        />
        {/* Bottom center - subtle lavender */}
        <div
          className="absolute bottom-[-50px] left-[30%] w-[700px] h-[700px] rounded-full pointer-events-none blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(221,214,254,0.5) 0%, rgba(237,233,254,0.3) 50%, transparent 70%)' }}
        />
        {/* Far right edge - accent */}
        <div
          className="absolute top-[50%] right-[-150px] w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.4) 0%, rgba(251,207,232,0.2) 50%, transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div
          variants={logoVariants}
          initial="hidden"
          animate={isExiting ? 'exit' : 'visible'}
          className="relative"
        >
          {/* Logo with subtle pulse when not exiting */}
          <motion.img
            src="/logo expanded.svg"
            alt="Abi+"
            className="h-12 w-auto"
            animate={!isExiting ? {
              scale: [1, 1.02, 1],
            } : undefined}
            transition={!isExiting ? {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            } : undefined}
          />
        </motion.div>

        {/* Progress bar container */}
        <motion.div
          variants={progressBarVariants}
          initial="hidden"
          animate={isExiting ? 'exit' : 'visible'}
          className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden"
        >
          {/* Progress fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
