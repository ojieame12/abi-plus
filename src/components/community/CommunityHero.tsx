import { useState } from 'react';
import {
  Search,
  MessageSquarePlus,
  Bell,
  MessageCircle,
  ThumbsUp,
  AtSign,
  X,
  HelpCircle,
  Bookmark,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarWithBadge } from './ReputationBadge';

interface User {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  reputation?: number;
  questionsCount?: number;
  answersCount?: number;
  upvotesReceived?: number;
}

interface Notification {
  id: string;
  type: 'answer' | 'upvote' | 'mention' | 'new_question';
  message: string;
  actorName: string;
  actorAvatar?: string;
  timestamp: Date;
  read: boolean;
}

interface CommunityHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAskQuestion?: () => void;
  canAsk?: boolean;
  user?: User | null;
  notifications?: Notification[];
  onNotificationClick?: (id: string) => void;
  onMarkAllRead?: () => void;
  onSignOut?: () => void;
}

// Generate avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-violet-400',
    'bg-blue-400',
    'bg-emerald-400',
    'bg-amber-400',
    'bg-rose-400',
    'bg-cyan-400',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'answer':
      return <MessageCircle size={14} className="text-violet-500" />;
    case 'upvote':
      return <ThumbsUp size={14} className="text-emerald-500" />;
    case 'mention':
      return <AtSign size={14} className="text-blue-500" />;
    case 'new_question':
      return <MessageSquarePlus size={14} className="text-amber-500" />;
  }
}

export function CommunityHero({
  searchQuery,
  onSearchChange,
  onAskQuestion,
  canAsk = false,
  user,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  onSignOut,
}: CommunityHeroProps) {
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
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
            {/* Top row: Logo + Avatar */}
            <div className="flex items-center justify-between mb-10">
              {/* Abi Logo */}
              <img
                src="/logo-white.svg"
                alt="abi"
                className="h-10"
              />

              {/* User Avatar */}
              {user && (
                <button
                  onClick={() => setShowProfilePanel(true)}
                  className="relative"
                >
                  <AvatarWithBadge
                    avatarUrl={user.avatarUrl}
                    displayName={user.displayName}
                    reputation={user.reputation ?? 0}
                    size="sm"
                  />
                  {/* Notification indicator */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 rounded-full
                                     flex items-center justify-center text-[9px] font-medium text-white z-10">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
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

          {/* Search bar + Ask Question button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 max-w-2xl"
          >
            <div className="relative flex-1">
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
            </div>

            {/* Ask Question button */}
            <button
              onClick={onAskQuestion}
              disabled={!canAsk || !onAskQuestion}
              className={`flex items-center gap-2 px-5 h-12 rounded-xl text-sm font-medium
                         transition-all shadow-lg whitespace-nowrap ${
                           canAsk && onAskQuestion
                             ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl'
                             : 'bg-slate-900/80 text-white/80 cursor-not-allowed'
                         }`}
              title={canAsk ? 'Ask a question' : 'Sign in to ask questions'}
            >
              <MessageSquarePlus size={16} />
              Ask Question
            </button>
          </motion.div>
        </div>
      </div>
      </div>

      {/* Profile Slide-out Panel */}
      <AnimatePresence>
        {showProfilePanel && user && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfilePanel(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto"
              style={{ boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.1)' }}
            >
              {/* Header with user info */}
              <div className="bg-[#FAFBFD] px-5 py-6">
                <div className="flex items-start justify-between mb-4">
                  <AvatarWithBadge
                    avatarUrl={user.avatarUrl}
                    displayName={user.displayName}
                    reputation={user.reputation ?? 0}
                    size="lg"
                  />
                  <button
                    onClick={() => setShowProfilePanel(false)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>

                <h3 className="text-lg font-normal text-slate-900">{user.displayName}</h3>
                {user.username && (
                  <p className="text-sm text-slate-500">@{user.username}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-sm font-medium text-violet-600">
                    {(user.reputation ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">reputation</span>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  Your Activity
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Questions Asked</span>
                    <span className="text-sm font-medium text-slate-900">
                      {user.questionsCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Answers Given</span>
                    <span className="text-sm font-medium text-slate-900">
                      {user.answersCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Upvotes Received</span>
                    <span className="text-sm font-medium text-slate-900">
                      {user.upvotesReceived ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <Bell size={12} />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-xs text-violet-600 hover:text-violet-700"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 py-2">No notifications yet</p>
                ) : (
                  <div className="space-y-1">
                    {notifications.slice(0, 3).map(notification => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          onNotificationClick?.(notification.id);
                        }}
                        className={`w-full p-2.5 rounded-lg flex items-start gap-2.5 text-left
                                   hover:bg-slate-50 transition-colors
                                   ${!notification.read ? 'bg-violet-50/50' : ''}`}
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                          {notification.actorAvatar ? (
                            <img
                              src={notification.actorAvatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-white text-[10px]
                                            ${getAvatarColor(notification.actorName)}`}>
                              {getInitials(notification.actorName)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 line-clamp-2">
                            <span className="font-medium">{notification.actorName}</span>{' '}
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {getNotificationIcon(notification.type)}
                            <span className="text-[10px] text-slate-400">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </button>
                    ))}
                    {notifications.length > 3 && (
                      <button className="w-full py-2 text-xs text-violet-600 hover:text-violet-700 flex items-center justify-center gap-1">
                        View all notifications
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  Quick Links
                </h4>
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                     hover:bg-slate-50 transition-colors text-left">
                    <HelpCircle size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">My Questions</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                     hover:bg-slate-50 transition-colors text-left">
                    <MessageCircle size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">My Answers</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                     hover:bg-slate-50 transition-colors text-left">
                    <Bookmark size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">Saved Posts</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                     hover:bg-slate-50 transition-colors text-left">
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">Settings</span>
                  </button>
                </div>
              </div>

              {/* Sign Out */}
              <div className="px-5 py-4">
                <button
                  onClick={() => {
                    onSignOut?.();
                    setShowProfilePanel(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <LogOut size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-700">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
