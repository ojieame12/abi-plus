import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, ArrowUpDown, Check, MessageSquare, Sparkles } from 'lucide-react';
import { ConversationRow } from '../components/chat/ConversationRow';
import { useConversations, type Conversation } from '../hooks/useConversations';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface ChatHistoryViewProps {
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
}

type DateGroup = 'Today' | 'Yesterday' | 'Last Week' | 'Older';
type SortOption = 'recent' | 'starred';
type FilterCategory = 'all' | 'suppliers' | 'categories' | 'risk' | 'research' | 'general';

function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  if (diffDays <= 7) return 'Last Week';
  return 'Older';
}

function formatTimestamp(dateStr: string, group: DateGroup): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (group === 'Today') {
    if (diffHours < 1) return 'Just now';
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  if (group === 'Yesterday') {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ChatHistoryView = ({ onNewChat, onSelectConversation }: ChatHistoryViewProps) => {
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Debounce search input for server-side search
  const debouncedSearch = useDebounce(searchInput, 300);

  // Use real data from API
  const {
    conversations,
    isLoading,
    error,
    search,
    updateConversation,
    deleteConversation,
  } = useConversations();

  // Trigger server-side search when debounced value changes
  useEffect(() => {
    search(debouncedSearch);
  }, [debouncedSearch, search]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: conversations.length,
      suppliers: 0,
      categories: 0,
      risk: 0,
      research: 0,
      general: 0,
    };
    conversations.forEach(c => {
      const cat = c.category as FilterCategory;
      if (cat in counts) {
        counts[cat]++;
      }
    });
    return counts;
  }, [conversations]);

  // Filter and sort conversations (search is now server-side)
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Apply category filter (client-side)
    if (activeFilter !== 'all') {
      result = result.filter(c => c.category === activeFilter);
    }

    // Apply sort (client-side)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'starred':
          // Starred first, then by date
          if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [conversations, activeFilter, sortBy]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: Record<DateGroup, Conversation[]> = {
      'Today': [],
      'Yesterday': [],
      'Last Week': [],
      'Older': [],
    };

    filteredConversations.forEach(conv => {
      const group = getDateGroup(conv.updatedAt);
      groups[group].push(conv);
    });

    return groups;
  }, [filteredConversations]);

  const groupOrder: DateGroup[] = ['Today', 'Yesterday', 'Last Week', 'Older'];

  const filterTabs: { key: FilterCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'categories', label: 'Categories' },
    { key: 'risk', label: 'Risk' },
    { key: 'research', label: 'Research' },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'recent', label: 'Most Recent' },
    { key: 'starred', label: 'Starred First' },
  ];

  // Handlers for conversation actions
  const handleStar = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      await updateConversation(id, { isStarred: !conv.isStarred });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
  };

  const handleArchive = async (id: string) => {
    await updateConversation(id, { isArchived: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            className="flex items-center gap-3 text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-2 h-2 bg-violet-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <span>Loading conversations...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load conversations</p>
            <p className="text-sm text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no conversations at all
  const isEmpty = conversations.length === 0;

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[720px]">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-medium text-primary">Your Conversations</h1>
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#242F47] text-white rounded-xl hover:bg-[#1a2236] transition-colors text-sm font-medium"
            >
              New Chat
              <Plus size={16} strokeWidth={2} />
            </button>
          </motion.div>

          {isEmpty ? (
            /* Empty State - No conversations yet */
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={32} className="text-violet-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-medium text-primary mb-2">No conversations yet</h2>
              <p className="text-secondary mb-6 max-w-sm mx-auto">
                Start a new chat to ask questions about suppliers, risks, categories, and more.
              </p>
              <button
                onClick={onNewChat}
                className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                <Sparkles size={16} strokeWidth={2} />
                Start your first conversation
              </button>
            </motion.div>
          ) : (
            <>
              {/* Search Bar */}
              <motion.div
                className="flex items-center gap-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search conversations and messages..."
                    className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white border border-slate-200/80 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Filter Tabs + Sort */}
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {/* Category Filter Tabs */}
                <div className="flex items-center bg-slate-50/80 rounded-xl p-1 gap-0.5">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeFilter === tab.key
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-xs ${activeFilter === tab.key ? 'text-violet-600' : 'text-muted'}`}>
                        {categoryCounts[tab.key]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-sm text-secondary hover:text-primary hover:border-slate-300 transition-all"
                  >
                    <ArrowUpDown size={14} strokeWidth={1.5} />
                    Sort
                  </button>

                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        className="absolute right-0 top-full mt-2 z-50 w-44 py-1.5 bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.key}
                            onClick={() => {
                              setSortBy(option.key);
                              setShowSortMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-secondary hover:bg-slate-50 hover:text-primary transition-colors"
                          >
                            {option.label}
                            {sortBy === option.key && (
                              <Check size={14} className="text-emerald-500" strokeWidth={2} />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Conversation Groups */}
              <div className="space-y-6">
                {groupOrder.map((group, groupIndex) => {
                  const items = groupedConversations[group];
                  if (items.length === 0) return null;

                  return (
                    <motion.div
                      key={group}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 + groupIndex * 0.05 }}
                    >
                      <h2 className="text-sm text-secondary font-medium mb-3">{group}</h2>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {items.map((conversation, index) => (
                            <motion.div
                              key={conversation.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                            >
                              <ConversationRow
                                id={conversation.id}
                                title={conversation.title}
                                timestamp={formatTimestamp(conversation.updatedAt, group)}
                                onClick={() => onSelectConversation?.(conversation.id)}
                                onStar={handleStar}
                                onDelete={handleDelete}
                                onArchive={handleArchive}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Empty Search Results */}
              {filteredConversations.length === 0 && (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-muted" strokeWidth={1.5} />
                  </div>
                  <p className="text-secondary font-medium mb-1">No conversations found</p>
                  <p className="text-sm text-muted">
                    {searchInput ? 'Try a different search term' : 'No conversations match this filter'}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
