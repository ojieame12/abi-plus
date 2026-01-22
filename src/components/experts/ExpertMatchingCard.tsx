// ExpertMatchingCard Component
// AI-powered expert matching interface with query input and results display

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, Star, Users, ArrowRight } from 'lucide-react';
import type { ExpertMatch } from '../../types/expertMarketplace';
import { getMatchScoreColor, getAvailabilityColor } from '../../types/expertMarketplace';
import { getMockExpertMatches } from '../../services/expertMarketplaceService';

interface ExpertMatchingCardProps {
  onExpertSelect?: (expertId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function ExpertMatchingCard({
  onExpertSelect,
  isCollapsed = false,
  onToggleCollapsed,
}: ExpertMatchingCardProps) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ExpertMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const results = getMockExpertMatches(query);
    setMatches(results);
    setIsSearching(false);
    setHasSearched(true);
  };

  const handleReset = () => {
    setQuery('');
    setMatches([]);
    setHasSearched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div
      className="rounded-[20px] border border-slate-100/60 bg-gradient-to-br from-violet-50/50 to-white overflow-hidden"
      style={{
        boxShadow: '0 8px 40px -12px rgba(139, 92, 246, 0.1)',
      }}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggleCollapsed}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <img src="/bero-logo.svg" alt="" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">
              Find the Right Expert
            </h3>
            <p className="text-xs text-slate-500">
              Describe your challenge and we'll match you
            </p>
          </div>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-slate-300 transition-transform ${
            isCollapsed ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content - collapsible */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {!hasSearched ? (
                // Initial state - search input
                <>
                  <div className="relative mb-3">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., I need help understanding steel price forecasts for Q2 2025..."
                      className="w-full h-24 p-4 rounded-xl bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={!query.trim() || isSearching}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      query.trim() && !isSearching
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSearching ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Finding experts...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Find Matching Experts
                      </>
                    )}
                  </button>
                </>
              ) : (
                // Results state
                <>
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">
                      Based on your query, we recommend:
                    </p>
                    {/* Query summary */}
                    <div className="p-3 bg-white rounded-lg border border-slate-100 mb-3">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        "{query}"
                      </p>
                    </div>
                  </div>

                  {/* Match results */}
                  {matches.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {matches.slice(0, 3).map((match) => (
                        <MatchResultCard
                          key={match.expert.id}
                          match={match}
                          onClick={() => onExpertSelect?.(match.expert.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-slate-500">
                      No exact matches found. Try browsing all experts below.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 px-4 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Search Again
                    </button>
                    <button
                      onClick={onToggleCollapsed}
                      className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Browse All Experts
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual match result card
function MatchResultCard({
  match,
  onClick,
}: {
  match: ExpertMatch;
  onClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-white border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all text-left flex items-center gap-3"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
          {match.expert.photo && !imageError ? (
            <img
              src={match.expert.photo}
              alt={match.expert.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Users className="w-5 h-5" />
            </div>
          )}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(
            match.expert.availability
          )}`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-slate-900 truncate">
            {match.expert.name}
          </h4>
          {/* Match score badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getMatchScoreColor(
              match.matchScore
            )}`}
          >
            {match.matchScore}%
          </span>
        </div>
        {/* Match reasons */}
        <div className="flex flex-wrap gap-1">
          {match.matchReasons.slice(0, 2).map((reason, idx) => (
            <span
              key={idx}
              className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded"
            >
              {reason}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </button>
  );
}

export default ExpertMatchingCard;
