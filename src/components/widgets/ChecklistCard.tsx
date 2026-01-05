// ChecklistCard - Beautiful checklist/action items display
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight, ListChecks, Sparkles } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed?: boolean;
  action?: {
    label: string;
    onClick?: () => void;
  };
}

interface ChecklistCardProps {
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
  onItemToggle?: (id: string, completed: boolean) => void;
  interactive?: boolean;
  showProgress?: boolean;
  delay?: number;
}

export const ChecklistCard = ({
  title,
  subtitle,
  items,
  onItemToggle,
  interactive = false,
  showProgress = true,
  delay = 0,
}: ChecklistCardProps) => {
  const [localItems, setLocalItems] = useState(items);

  const completedCount = localItems.filter(i => i.completed).length;
  const progressPercent = (completedCount / localItems.length) * 100;

  const handleToggle = (id: string) => {
    if (!interactive) return;

    const updated = localItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setLocalItems(updated);

    const item = updated.find(i => i.id === id);
    if (item && onItemToggle) {
      onItemToggle(id, item.completed || false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="
        bg-white/80
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
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <ListChecks size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[15px] font-medium text-slate-900">{title}</h4>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {showProgress && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {completedCount}/{localItems.length}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, delay: delay + 0.2 }}
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="px-4 pb-4">
        <div className="space-y-1">
          {localItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              onClick={() => handleToggle(item.id)}
              className={`
                flex items-start gap-3 p-3
                rounded-xl transition-all duration-200
                ${interactive ? 'cursor-pointer hover:bg-slate-50/80' : ''}
                ${item.completed ? 'opacity-60' : ''}
              `}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                <AnimatePresence mode="wait">
                  {item.completed ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <CheckCircle2
                        size={20}
                        className="text-emerald-500"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <Circle
                        size={20}
                        className="text-slate-300"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`
                  text-sm text-slate-700
                  ${item.completed ? 'line-through text-slate-400' : ''}
                `}>
                  {item.label}
                </p>
                {item.description && !item.completed && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action */}
              {item.action && !item.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action?.onClick?.();
                  }}
                  className="
                    flex items-center gap-1 px-2 py-1
                    text-xs font-medium text-violet-600
                    bg-violet-50 rounded-lg
                    hover:bg-violet-100 transition-colors
                    group
                  "
                >
                  {item.action.label}
                  <ChevronRight
                    size={12}
                    strokeWidth={1.5}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {completedCount === localItems.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-t border-slate-100/60 bg-emerald-50/50"
          >
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Sparkles size={14} className="text-emerald-500" />
              All items completed!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
