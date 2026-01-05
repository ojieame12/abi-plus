// DataListCard - Beautiful generic list display widget
import { motion } from 'framer-motion';
import { List, ChevronRight, LucideIcon, ExternalLink } from 'lucide-react';

interface ListItem {
  id: string;
  label: string;
  value?: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  status?: 'default' | 'success' | 'warning' | 'danger';
  href?: string;
  onClick?: () => void;
}

interface DataListCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  items: ListItem[];
  maxItems?: number;
  emptyMessage?: string;
  variant?: 'default' | 'compact' | 'detailed';
  onViewAll?: () => void;
  delay?: number;
}

const statusStyles = {
  default: { dot: 'bg-slate-400', text: 'text-slate-600' },
  success: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-600' },
  danger: { dot: 'bg-red-500', text: 'text-red-600' },
};

export const DataListCard = ({
  title,
  subtitle,
  icon: HeaderIcon = List,
  items,
  maxItems = 5,
  emptyMessage = 'No items to display',
  variant = 'default',
  onViewAll,
  delay = 0,
}: DataListCardProps) => {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

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
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <HeaderIcon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[15px] font-medium text-slate-900">{title}</h4>
              {subtitle && (
                <p className="text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
            {items.length} items
          </span>
        </div>
      </div>

      {/* List */}
      <div className={variant === 'compact' ? 'px-4 pb-3' : 'px-2 pb-2'}>
        {displayItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : variant === 'compact' ? (
          // Compact variant - inline badges
          <div className="flex flex-wrap gap-2">
            {displayItems.map((item, i) => {
              const status = statusStyles[item.status || 'default'];
              return (
                <motion.span
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.1 + i * 0.03 }}
                  onClick={item.onClick}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5
                    bg-slate-50 rounded-lg border border-slate-100
                    text-sm text-slate-700
                    ${item.onClick ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {item.label}
                  {item.value && (
                    <span className={`font-medium ${status.text}`}>{item.value}</span>
                  )}
                </motion.span>
              );
            })}
          </div>
        ) : (
          // Default/Detailed variant - list rows
          <div className="space-y-1">
            {displayItems.map((item, i) => {
              const status = statusStyles[item.status || 'default'];
              const ItemIcon = item.icon;
              const isClickable = item.onClick || item.href;

              const content = (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 + i * 0.05 }}
                  onClick={item.onClick}
                  className={`
                    flex items-center gap-3 p-3 mx-1 rounded-xl
                    ${isClickable ? 'cursor-pointer hover:bg-slate-50 transition-colors group' : ''}
                  `}
                >
                  {/* Icon or dot */}
                  {ItemIcon ? (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <ItemIcon size={16} className="text-slate-500" strokeWidth={1.5} />
                    </div>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${status.dot} flex-shrink-0`} />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{item.label}</p>
                    {item.sublabel && variant === 'detailed' && (
                      <p className="text-xs text-slate-500 truncate">{item.sublabel}</p>
                    )}
                  </div>

                  {/* Value */}
                  {item.value && (
                    <span className={`text-sm font-medium ${status.text} flex-shrink-0`}>
                      {item.value}
                    </span>
                  )}

                  {/* Action indicator */}
                  {isClickable && (
                    item.href ? (
                      <ExternalLink
                        size={14}
                        className="text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <ChevronRight
                        size={14}
                        className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                        strokeWidth={1.5}
                      />
                    )
                  )}
                </motion.div>
              );

              return item.href ? (
                <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>

      {/* View all */}
      {hasMore && onViewAll && (
        <div className="px-4 py-3 border-t border-slate-100/60 bg-slate-50/30">
          <button
            onClick={onViewAll}
            className="
              w-full flex items-center justify-center gap-1.5
              text-sm font-medium text-slate-600
              hover:text-slate-900 transition-colors
              group
            "
          >
            View all {items.length} items
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Simple inline list
export const InlineList = ({
  items,
  separator = '·',
}: { items: string[]; separator?: string }) => (
  <span className="text-sm text-slate-600">
    {items.map((item, i) => (
      <span key={i}>
        {item}
        {i < items.length - 1 && (
          <span className="mx-1.5 text-slate-300">{separator}</span>
        )}
      </span>
    ))}
  </span>
);
