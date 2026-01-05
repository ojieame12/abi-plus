// InfoCard - Beautiful general information display
import { motion } from 'framer-motion';
import { Info, AlertCircle, CheckCircle, AlertTriangle, HelpCircle, LucideIcon, ChevronRight } from 'lucide-react';

interface InfoCardProps {
  title: string;
  content: string;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'help';
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick?: () => void;
  };
  bullets?: string[];
  footer?: string;
  delay?: number;
}

const variantStyles = {
  info: {
    bg: 'bg-blue-50/60',
    border: 'border-blue-100/60',
    icon: 'bg-blue-100 text-blue-600',
    title: 'text-blue-900',
    defaultIcon: Info,
  },
  success: {
    bg: 'bg-emerald-50/60',
    border: 'border-emerald-100/60',
    icon: 'bg-emerald-100 text-emerald-600',
    title: 'text-emerald-900',
    defaultIcon: CheckCircle,
  },
  warning: {
    bg: 'bg-amber-50/60',
    border: 'border-amber-100/60',
    icon: 'bg-amber-100 text-amber-600',
    title: 'text-amber-900',
    defaultIcon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50/60',
    border: 'border-red-100/60',
    icon: 'bg-red-100 text-red-600',
    title: 'text-red-900',
    defaultIcon: AlertCircle,
  },
  help: {
    bg: 'bg-violet-50/60',
    border: 'border-violet-100/60',
    icon: 'bg-violet-100 text-violet-600',
    title: 'text-violet-900',
    defaultIcon: HelpCircle,
  },
};

export const InfoCard = ({
  title,
  content,
  variant = 'info',
  icon,
  action,
  bullets,
  footer,
  delay = 0,
}: InfoCardProps) => {
  const styles = variantStyles[variant];
  const Icon = icon || styles.defaultIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        ${styles.bg}
        rounded-[1.25rem] border ${styles.border}
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl ${styles.icon}
            flex items-center justify-center flex-shrink-0
          `}>
            <Icon size={20} strokeWidth={1.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-[15px] font-medium ${styles.title} mb-1`}>
              {title}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {content}
            </p>

            {/* Bullets */}
            {bullets && bullets.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {bullets.map((bullet, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.1 + i * 0.05 }}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                    {bullet}
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Action */}
            {action && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
                onClick={action.onClick}
                className={`
                  mt-3 inline-flex items-center gap-1
                  text-sm font-medium ${styles.title}
                  hover:opacity-80 transition-opacity
                  group
                `}
              >
                {action.label}
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {footer && (
        <div className={`
          px-4 py-2.5 border-t ${styles.border}
          bg-white/40
        `}>
          <p className="text-xs text-slate-500">{footer}</p>
        </div>
      )}
    </motion.div>
  );
};

// Minimal inline variant
export const InfoBadge = ({
  text,
  variant = 'info',
}: { text: string; variant?: InfoCardProps['variant'] }) => {
  const styles = variantStyles[variant || 'info'];
  const Icon = styles.defaultIcon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1
      ${styles.bg} rounded-lg border ${styles.border}
      text-xs ${styles.title}
    `}>
      <Icon size={12} strokeWidth={1.5} />
      {text}
    </span>
  );
};
