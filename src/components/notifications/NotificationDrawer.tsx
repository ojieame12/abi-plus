// NotificationDrawer - Slide-out panel showing all notification types
// Follows the CreditDrawer pattern

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
} from 'lucide-react';
import type { AppNotification, AlertSeverity, BadgeTier, ApprovalStatus } from '../../types/notifications';
import { formatRelativeTime } from '../../types/notifications';
import { groupNotificationsByTime } from '../../services/notificationService';

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
        flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors
        ${notification.isRead ? 'hover:bg-slate-50' : 'bg-violet-50/50 hover:bg-violet-50'}
      `}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`p-2 rounded-lg shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notification.isRead ? 'text-primary' : 'font-medium text-primary'}`}>
            {notification.title}
          </p>
          {/* Unread indicator */}
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-secondary mt-0.5 line-clamp-2">
          {notification.description}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// Section header for time groups
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
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

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-drawer-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50">
                  <Bell className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="notification-drawer-title" className="text-lg font-medium text-primary">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 text-xs font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary">Stay updated on your activity</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close notifications drawer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions bar */}
            {unreadCount > 0 && (
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-primary mb-1">No notifications</h3>
                  <p className="text-sm text-secondary">
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {/* Today */}
                  {grouped.today.length > 0 && (
                    <div className="mb-2">
                      <SectionHeader title="Today" />
                      <div className="px-3 space-y-1">
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
                    <div className="mb-2">
                      <SectionHeader title="Yesterday" />
                      <div className="px-3 space-y-1">
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
                    <div className="mb-2">
                      <SectionHeader title="Earlier" />
                      <div className="px-3 space-y-1">
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

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  // Future: open notification settings
                  console.log('Notification settings clicked');
                }}
              >
                Notification Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
