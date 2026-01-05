import { motion } from 'framer-motion';
import type { QuestionSortBy, QuestionFilter } from '../../types/community';

interface QuestionFiltersProps {
  sortBy: QuestionSortBy;
  filter: QuestionFilter;
  onSortChange: (sort: QuestionSortBy) => void;
  onFilterChange: (filter: QuestionFilter) => void;
}

export function QuestionFilters({
  sortBy,
  filter,
  onSortChange,
  onFilterChange,
}: QuestionFiltersProps) {
  const sortOptions: { value: QuestionSortBy; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'votes', label: 'Top Voted' },
    { value: 'active', label: 'Active' },
    { value: 'unanswered', label: 'Unanswered' },
  ];

  const filterOptions: { value: QuestionFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'answered', label: 'Answered' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Filter Tabs - more subtle */}
      <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/60 rounded-lg border border-slate-200/40">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`
              relative px-3 py-1.5 text-xs font-medium rounded-md
              transition-colors duration-200
              ${filter === option.value
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            {filter === option.value && (
              <motion.div
                layoutId="filter-pill"
                className="absolute inset-0 bg-white rounded-md shadow-sm ring-1 ring-black/[0.02]"
                transition={{ type: 'spring', duration: 0.3 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Sort Dropdown - cleaner */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Sort:</span>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as QuestionSortBy)}
          className="px-2.5 py-1.5 text-xs text-slate-600
                     bg-white border border-slate-200/60 rounded-lg
                     focus:outline-none focus:ring-1 focus:ring-slate-200
                     cursor-pointer"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
