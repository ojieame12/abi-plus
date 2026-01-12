import { Search, MessageSquarePlus } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommunityHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAskQuestion?: () => void;
  canAsk?: boolean;
}

export function CommunityHero({
  searchQuery,
  onSearchChange,
  onAskQuestion,
  canAsk = false,
}: CommunityHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 min-h-[340px] rounded-2xl">
      {/* Background image - cover fit */}
      <img
        src="/bgd.png"
        alt=""
        className="absolute right-0 top-0 w-4/5 h-full object-cover object-right"
      />
      {/* Gradient overlay - only on left side for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 from-30% to-transparent to-50%" />

      {/* Content */}
      <div className="relative z-10 pt-8 pb-28 px-4">
        <div className="max-w-5xl mx-auto">
        {/* Top row: Logo + Ask button */}
        <div className="flex items-center justify-between mb-10">
          {/* Abi Logo */}
          <img
            src="/logo-white.svg"
            alt="abi"
            className="h-10"
          />

          {/* Ask Question button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={onAskQuestion}
            disabled={!canAsk || !onAskQuestion}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                       transition-all shadow-lg ${
                         canAsk && onAskQuestion
                           ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl'
                           : 'bg-slate-900/80 text-white/80 cursor-not-allowed'
                       }`}
            title={canAsk ? 'Ask a question' : 'Sign in to ask questions'}
          >
            <MessageSquarePlus size={16} />
            Ask Question
          </motion.button>
        </div>

        {/* Title and subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: '#FFFFFF' }}>
            Beroe Community
          </h1>
          <p className="text-base md:text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Questions and answers from procurement peers
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative max-w-lg"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search questions..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white
                       border-0 shadow-lg
                       text-sm text-slate-900 placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-white/50
                       transition-all"
          />
        </motion.div>
        </div>
      </div>
    </div>
  );
}
