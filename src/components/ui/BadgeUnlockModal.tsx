// Badge Unlock Modal - Elegant, understated celebration
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Badge, BadgeTier } from '../../types/community';

interface BadgeUnlockModalProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
}

const tierStyles: Record<BadgeTier, string> = {
  bronze: 'from-amber-600/90 to-amber-700 text-amber-50',
  silver: 'from-slate-400 to-slate-500 text-white',
  gold: 'from-yellow-500 to-amber-600 text-amber-950',
};

const tierLabels: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export function BadgeUnlockModal({ badge, isOpen, onClose }: BadgeUnlockModalProps) {
  if (!badge) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30
            }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-full max-w-sm"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full
                           text-slate-400 hover:text-slate-600 hover:bg-slate-100
                           transition-colors z-10"
              >
                <X size={18} />
              </button>

              {/* Content */}
              <div className="px-8 pt-10 pb-8 text-center">
                {/* Badge icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="mb-6"
                >
                  <div
                    className={`
                      w-20 h-20 mx-auto rounded-2xl
                      bg-gradient-to-br ${tierStyles[badge.tier]}
                      flex items-center justify-center
                      shadow-lg
                    `}
                  >
                    <span className="text-3xl">
                      {getBadgeEmoji(badge.icon)}
                    </span>
                  </div>
                </motion.div>

                {/* Tier label */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1"
                >
                  {tierLabels[badge.tier]} Badge
                </motion.p>

                {/* Badge name */}
                <motion.h2
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-semibold text-slate-900 mb-2"
                >
                  {badge.name}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-slate-500 mb-8"
                >
                  {badge.description}
                </motion.p>

                {/* Done button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium
                             rounded-xl hover:bg-slate-800 active:scale-[0.98]
                             transition-all duration-150"
                >
                  Done
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Map icon names to simple emojis (or could use Lucide icons)
function getBadgeEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    HelpCircle: '❓',
    MessageSquare: '💬',
    Search: '🔍',
    ThumbsUp: '👍',
    Heart: '❤️',
    GraduationCap: '🎓',
    Award: '🏆',
    Crown: '👑',
    Star: '⭐',
    Flame: '🔥',
    Zap: '⚡',
    Target: '🎯',
    BookOpen: '📖',
    Users: '👥',
    TrendingUp: '📈',
  };
  return emojiMap[iconName] || '🏅';
}
