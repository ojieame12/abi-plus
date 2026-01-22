// Notification types for the notification drawer system

export type NotificationType =
  | 'approval_update'    // Request approved/denied/escalated
  | 'alert_triggered'    // Risk alert fired
  | 'badge_awarded'      // New badge earned
  | 'reputation_change'  // Reputation milestone reached
  | 'system';            // System announcements

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type BadgeTier = 'bronze' | 'silver' | 'gold';
export type ApprovalStatus = 'approved' | 'denied' | 'escalated' | 'pending';

export interface NotificationMetadata {
  requestId?: string;              // For approval_update
  approvalStatus?: ApprovalStatus; // For approval_update icon/color
  alertSeverity?: AlertSeverity;   // For alert_triggered
  badgeTier?: BadgeTier;           // For badge_awarded
  reputationTier?: string;         // For reputation_change
}

export interface NotificationAction {
  label: string;
  onClick: string;  // Action identifier
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  metadata?: NotificationMetadata;
  action?: NotificationAction;
}

// Helper to get time grouping
export function getTimeGroup(timestamp: string): 'today' | 'yesterday' | 'earlier' {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return 'today';
  } else if (date >= yesterday) {
    return 'yesterday';
  }
  return 'earlier';
}

// Helper to format relative time
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
