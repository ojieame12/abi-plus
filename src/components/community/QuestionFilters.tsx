import { motion } from 'framer-motion';
import { FileText, MessageCircle, Megaphone, ChevronDown } from 'lucide-react';
import type { QuestionSortBy, ContentType } from '../../types/community';

interface QuestionFiltersProps {
  sortBy: QuestionSortBy;
  contentType: ContentType;
  onSortChange: (sort: QuestionSortBy) => void;
  onContentTypeChange: (type: ContentType) => void;
}

export function QuestionFilters({
  sortBy,
  contentType,
  onSortChange,
  onContentTypeChange,
}: QuestionFiltersProps) {
  const sortOptions: { value: QuestionSortBy; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'votes', label: 'Top Voted' },
    { value: 'active', label: 'Active' },
    { value: 'unanswered', label: 'Unanswered' },
  ];

  const contentTypeOptions: { value: ContentType; label: string; icon: typeof FileText }[] = [
    { value: 'posts', label: 'Posts', icon: FileText },
    { value: 'discussion', label: 'Discussion', icon: MessageCircle },
    { value: 'announcement', label: 'Announcement', icon: Megaphone },
  ];

  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
      {/* Content Type Tabs */}
      <div className="flex items-center gap-0.5">
        {contentTypeOptions.map(option => {
          const Icon = option.icon;
          const isActive = contentType === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onContentTypeChange(option.value)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                transition-colors duration-200
                ${isActive
                  ? 'text-violet-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              `}
            >
              <Icon size={14} />
              <span>{option.label}</span>
              {isActive && (
                <motion.div
                  layoutId="content-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-600 rounded-full"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Sort:</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as QuestionSortBy)}
            className="appearance-none pl-2.5 pr-7 py-1.5 text-xs text-slate-700
                       bg-white border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300
                       cursor-pointer"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
