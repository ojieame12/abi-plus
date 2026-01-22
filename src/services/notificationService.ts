// Mock notification service for demo
// Later: wire to real API endpoints

import type { AppNotification } from '../types/notifications';

// Generate timestamps relative to now
function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// Mock notifications for demo
const MOCK_NOTIFICATIONS: AppNotification[] = [
  // Today
  {
    id: 'notif-1',
    type: 'approval_update',
    title: 'Request Approved',
    description: 'Your steel supplier deep-dive request has been approved. 150 credits deducted.',
    timestamp: hoursAgo(1),
    isRead: false,
    metadata: {
      requestId: 'req-001',
      approvalStatus: 'approved',
    },
    action: {
      label: 'View Report',
      onClick: 'view_report',
    },
  },
  {
    id: 'notif-2',
    type: 'alert_triggered',
    title: 'Critical Risk Alert',
    description: 'Supplier "Shanghai Steel Corp" risk score increased to 78 (High Risk). Financial stability concerns detected.',
    timestamp: hoursAgo(3),
    isRead: false,
    metadata: {
      alertSeverity: 'critical',
    },
    action: {
      label: 'View Supplier',
      onClick: 'view_supplier',
    },
  },
  {
    id: 'notif-3',
    type: 'badge_awarded',
    title: 'New Badge Earned!',
    description: 'Congratulations! You\'ve earned the "Research Pioneer" silver badge for completing 25 deep-dive analyses.',
    timestamp: hoursAgo(5),
    isRead: false,
    metadata: {
      badgeTier: 'silver',
    },
  },
  // Yesterday
  {
    id: 'notif-4',
    type: 'approval_update',
    title: 'Request Pending Approval',
    description: 'Your analyst call request for copper market analysis is awaiting team lead approval.',
    timestamp: daysAgo(1),
    isRead: true,
    metadata: {
      requestId: 'req-002',
      approvalStatus: 'pending',
    },
    action: {
      label: 'View Request',
      onClick: 'view_request',
    },
  },
  {
    id: 'notif-5',
    type: 'alert_triggered',
    title: 'Threshold Breach Warning',
    description: 'Portfolio risk concentration exceeded 40% in Asia-Pacific region. Review recommended.',
    timestamp: daysAgo(1),
    isRead: true,
    metadata: {
      alertSeverity: 'warning',
    },
    action: {
      label: 'View Portfolio',
      onClick: 'view_portfolio',
    },
  },
  // Earlier
  {
    id: 'notif-6',
    type: 'reputation_change',
    title: 'Reputation Milestone',
    description: 'Your community reputation reached "Trusted Contributor" status. New privileges unlocked.',
    timestamp: daysAgo(3),
    isRead: true,
    metadata: {
      reputationTier: 'trusted_contributor',
    },
  },
  {
    id: 'notif-7',
    type: 'system',
    title: 'System Maintenance Complete',
    description: 'Scheduled maintenance has been completed. All services are now operational.',
    timestamp: daysAgo(5),
    isRead: true,
  },
];

// Returns a fresh copy of mock notifications
// State management is handled by App.tsx, not this service
export function getMockNotifications(): AppNotification[] {
  return MOCK_NOTIFICATIONS.map(n => ({ ...n }));
}

// Group notifications by time period
export function groupNotificationsByTime(
  notifs: AppNotification[]
): { today: AppNotification[]; yesterday: AppNotification[]; earlier: AppNotification[] } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped = {
    today: [] as AppNotification[],
    yesterday: [] as AppNotification[],
    earlier: [] as AppNotification[],
  };

  for (const notif of notifs) {
    const date = new Date(notif.timestamp);
    if (date >= today) {
      grouped.today.push(notif);
    } else if (date >= yesterday) {
      grouped.yesterday.push(notif);
    } else {
      grouped.earlier.push(notif);
    }
  }

  return grouped;
}
