// NotificationDrawer - Slide-out panel showing all notification types
// Redesigned with Expert Dashboard floating card aesthetic

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  TrendingUp,
  Info,
  CheckCheck,
  Settings,
} from 'lucide-react';
import type { AppNotification, AlertSeverity, BadgeTier, ApprovalStatus } from '../../types/notifications';
import { formatRelativeTime } from '../../types/notifications';
import { groupNotificationsByTime } from '../../services/notificationService';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: AppNotification) => void;
}

// Icon mapping based on notification type and metadata
function getNotificationIcon(notification: AppNotification) {
  const { type, metadata } = notification;

  switch (type) {
    case 'approval_update':
      // Use approvalStatus from metadata for icon/color
      const status = metadata?.approvalStatus || 'pending';
      const approvalStyles: Record<ApprovalStatus, { Icon: typeof CheckCircle; color: string; bg: string }> = {
        approved: { Icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        denied: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
        escalated: { Icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        pending: { Icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
      };
      return approvalStyles[status];

    case 'alert_triggered':
      const severity = metadata?.alertSeverity || 'info';
      const alertColors: Record<AlertSeverity, { color: string; bg: string }> = {
        critical: { color: 'text-red-500', bg: 'bg-red-50' },
        warning: { color: 'text-amber-500', bg: 'bg-amber-50' },
        info: { color: 'text-slate-500', bg: 'bg-slate-50' },
      };
      return { Icon: AlertTriangle, ...alertColors[severity] };

    case 'badge_awarded':
      const tier = metadata?.badgeTier || 'bronze';
      const badgeColors: Record<BadgeTier, { color: string; bg: string }> = {
        gold: { color: 'text-amber-500', bg: 'bg-amber-50' },
        silver: { color: 'text-slate-500', bg: 'bg-slate-100' },
        bronze: { color: 'text-orange-500', bg: 'bg-orange-50' },
      };
      return { Icon: Award, ...badgeColors[tier] };

    case 'reputation_change':
      return { Icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' };

    case 'system':
    default:
      return { Icon: Info, color: 'text-slate-500', bg: 'bg-slate-50' };
  }
}

// Individual notification item
interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onClick: (notification: AppNotification) => void;
}

function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const { Icon, color, bg } = getNotificationIcon(notification);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClick(notification);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200
        bg-white border
        ${notification.isRead
          ? 'border-slate-100/60 hover:border-slate-200'
          : 'border-violet-100 hover:border-violet-200 ring-1 ring-violet-50'}
      `}
      style={{ boxShadow: cardShadow }}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`p-2.5 rounded-xl shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${notification.isRead ? 'text-slate-600' : 'font-medium text-slate-700'}`}>
            {notification.title}
          </p>
          {/* Unread indicator */}
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {notification.description}
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// Section header for time groups - Expert Dashboard style
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide px-1 py-3">
      {title}
    </h3>
  );
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const grouped = groupNotificationsByTime(notifications);

  // Focus management: store previous focus, restore on close, handle Escape
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element before opening
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus close button when drawer opens
      closeButtonRef.current?.focus();

      // Handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      // Restore focus when drawer closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer - Redesigned with bg-[#fafafa] and floating card aesthetic */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#fafafa] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-slate-50 to-pink-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-white/60">
                      <Bell className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 id="notification-drawer-title" className="text-lg font-medium text-slate-700">
                          Notifications
                        </h2>
                        {unreadCount > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-violet-500 text-white text-xs font-medium">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Stay updated on your activity</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close notifications drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Actions bar - integrated into header */}
                {unreadCount > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={onMarkAllAsRead}
                      className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div
                    className="w-20 h-20 rounded-[20px] bg-white flex items-center justify-center mb-5 border border-slate-100/60"
                    style={{ boxShadow: cardShadow }}
                  >
                    <Bell className="w-9 h-9 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-slate-600 mb-1.5">All caught up!</h3>
                  <p className="text-sm text-slate-400 max-w-[240px]">
                    New notifications will appear here when there's activity on your account.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Today */}
                  {grouped.today.length > 0 && (
                    <div>
                      <SectionHeader title="Today" />
                      <div className="space-y-2">
                        {grouped.today.map(notification => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={onMarkAsRead}
                            onClick={onNotificationClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday */}
                  {grouped.yesterday.length > 0 && (
                    <div>
                      <SectionHeader title="Yesterday" />
                      <div className="space-y-2">
                        {grouped.yesterday.map(notification => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={onMarkAsRead}
                            onClick={onNotificationClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earlier */}
                  {grouped.earlier.length > 0 && (
                    <div>
                      <SectionHeader title="Earlier" />
                      <div className="space-y-2">
                        {grouped.earlier.map(notification => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={onMarkAsRead}
                            onClick={onNotificationClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Floating card style */}
            <div className="p-4">
              <div
                className="px-5 py-4 rounded-2xl bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <button
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-violet-600 font-medium transition-colors"
                  onClick={() => {
                    console.log('Notification settings clicked');
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Notification Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
