// ProgressCard - Beautiful onboarding/setup progress display
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Rocket, ChevronRight, Sparkles } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface ProgressCardProps {
  title: string;
  subtitle?: string;
  steps: ProgressStep[];
  currentStep?: number;
  action?: {
    label: string;
    onClick?: () => void;
  };
  delay?: number;
}

export const ProgressCard = ({
  title,
  subtitle,
  steps,
  action,
  delay = 0,
}: ProgressCardProps) => {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = (completedCount / steps.length) * 100;
  const isComplete = completedCount === steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="
        bg-gradient-to-br from-white/90 to-slate-50/80
        rounded-[1.25rem] border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${isComplete
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600'
                }
              `}
            >
              {isComplete ? (
                <Sparkles size={20} strokeWidth={1.5} />
              ) : (
                <Rocket size={20} strokeWidth={1.5} />
              )}
            </motion.div>
            <div>
              <h4 className="text-[15px] font-medium text-slate-900">{title}</h4>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-light text-slate-900">
              {completedCount}/{steps.length}
            </span>
            <p className="text-xs text-slate-500">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, delay: delay + 0.2, ease: 'easeOut' }}
            className={`
              h-full rounded-full
              ${isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-violet-500 to-purple-500'
              }
            `}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pb-4">
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-[14px] top-6 bottom-6 w-px bg-slate-200" />

          <div className="space-y-1">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.15 + i * 0.05 }}
                className={`
                  relative flex items-start gap-3 p-2.5 rounded-xl
                  transition-colors duration-200
                  ${step.status === 'current' ? 'bg-violet-50/60' : ''}
                `}
              >
                {/* Status indicator */}
                <div className="relative z-10">
                  {step.status === 'completed' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: delay + 0.2 + i * 0.05, type: 'spring' }}
                    >
                      <CheckCircle2
                        size={20}
                        className="text-emerald-500"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </motion.div>
                  ) : step.status === 'current' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-violet-500 bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                    </div>
                  ) : (
                    <Circle size={20} className="text-slate-300" strokeWidth={1.5} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`
                    text-sm
                    ${step.status === 'completed' ? 'text-slate-500' : ''}
                    ${step.status === 'current' ? 'text-violet-900 font-medium' : ''}
                    ${step.status === 'upcoming' ? 'text-slate-400' : ''}
                  `}>
                    {step.label}
                  </p>
                  {step.description && step.status === 'current' && (
                    <p className="text-xs text-violet-600 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Current step action */}
                {step.status === 'current' && (
                  <ChevronRight size={16} className="text-violet-400 mt-0.5" strokeWidth={1.5} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action */}
      {action && !isComplete && (
        <div className="px-4 pb-4">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.4 }}
            onClick={action.onClick}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 rounded-xl
              bg-slate-900 text-white text-sm font-medium
              hover:bg-slate-800 transition-colors
              shadow-sm
              group
            "
          >
            {action.label}
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </motion.button>
        </div>
      )}

      {/* Completion celebration */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-3 border-t border-emerald-100/60 bg-emerald-50/50"
        >
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Sparkles size={14} className="text-emerald-500" />
            Setup complete! You're all set.
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
