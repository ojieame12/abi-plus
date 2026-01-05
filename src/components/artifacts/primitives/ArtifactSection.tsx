// Artifact Section Primitive
// Collapsible content section for organizing artifact content

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

export interface ArtifactSectionProps {
  title: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'warning' | 'success' | 'error';
  defaultOpen?: boolean;
  collapsible?: boolean;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: ReactNode;
  className?: string;
}

export const ArtifactSection = ({
  title,
  badge,
  badgeVariant = 'default',
  defaultOpen = true,
  collapsible = true,
  icon,
  action,
  children,
  className = '',
}: ArtifactSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const badgeStyles = {
    default: 'bg-slate-100 text-slate-600',
    warning: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
    error: 'bg-rose-100 text-rose-700',
  };

  const handleToggle = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Section Header */}
      <div
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`w-full flex items-center justify-between py-3 ${
          collapsible ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-slate-400">{icon}</span>
          )}
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
          {badge !== undefined && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeStyles[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              {action.label}
            </button>
          )}
          {collapsible && (
            <motion.div
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} className="text-slate-400" strokeWidth={1.5} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArtifactSection;
