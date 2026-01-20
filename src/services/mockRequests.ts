// Mock upgrade requests for approval workflow demo

import type { UpgradeRequest, RequestStatus, RequestType } from '../types/requests';

// Mock pending requests (for approvers)
export const MOCK_PENDING_REQUESTS: UpgradeRequest[] = [
  {
    id: 'req_001',
    type: 'report_upgrade',
    status: 'pending',
    requesterId: 'user_003',
    requesterName: 'Emily Watson',
    requesterEmail: 'emily.watson@acmecorp.com',
    requesterAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    teamId: 'team_001',
    teamName: 'Direct Materials',
    companyId: 'comp_001',
    title: 'Steel Market Analysis Q1 2025',
    description: 'Need decision-grade analysis for upcoming contract negotiations with ArcelorMittal. Current AI report lacks specific regional pricing data for APAC.',
    context: {
      reportTitle: 'Steel Market Outlook',
      categoryId: 'cat_steel',
      categoryName: 'Steel',
    },
    estimatedCredits: 2000,
    requiresApproval: true,
    approvalLevel: 'approver',
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'req_002',
    type: 'analyst_call',
    status: 'pending',
    requesterId: 'user_004',
    requesterName: 'James Park',
    requesterEmail: 'james.park@acmecorp.com',
    teamId: 'team_001',
    teamName: 'Direct Materials',
    companyId: 'comp_001',
    title: 'Aluminum Supply Chain Discussion',
    description: 'Want to discuss potential supply disruptions in Southeast Asia and alternative sourcing strategies.',
    context: {
      categoryId: 'cat_aluminum',
      categoryName: 'Aluminum',
      queryText: 'What are the risks of aluminum supply from Indonesia?',
    },
    estimatedCredits: 500,
    requiresApproval: true,
    approvalLevel: 'approver',
    createdAt: '2025-01-14T14:00:00Z',
    updatedAt: '2025-01-14T14:00:00Z',
  },
  {
    id: 'req_003',
    type: 'expert_deepdive',
    status: 'pending',
    requesterId: 'user_003',
    requesterName: 'Emily Watson',
    requesterEmail: 'emily.watson@acmecorp.com',
    requesterAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    teamId: 'team_001',
    teamName: 'Direct Materials',
    companyId: 'comp_001',
    title: 'Packaging Sustainability Strategy',
    description: 'Need expert guidance on transitioning to sustainable packaging materials. Looking for industry SME with experience in regulatory compliance and cost implications.',
    context: {
      categoryId: 'cat_flexible_packaging',
      categoryName: 'Flexible Packaging',
    },
    estimatedCredits: 3500,
    requiresApproval: true,
    approvalLevel: 'admin',
    createdAt: '2025-01-13T11:00:00Z',
    updatedAt: '2025-01-13T11:00:00Z',
  },
];

// Mock completed/historical requests
export const MOCK_COMPLETED_REQUESTS: UpgradeRequest[] = [
  {
    id: 'req_004',
    type: 'report_upgrade',
    status: 'completed',
    requesterId: 'user_003',
    requesterName: 'Emily Watson',
    requesterEmail: 'emily.watson@acmecorp.com',
    requesterAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    teamId: 'team_001',
    teamName: 'Direct Materials',
    companyId: 'comp_001',
    title: 'Copper Pricing Forecast',
    description: 'Decision-grade report on copper pricing trends for 2025.',
    estimatedCredits: 1500,
    actualCredits: 1500,
    requiresApproval: true,
    approvalLevel: 'approver',
    approverId: 'user_002',
    approverName: 'Michael Torres',
    approvedAt: '2025-01-10T10:00:00Z',
    createdAt: '2025-01-09T14:00:00Z',
    updatedAt: '2025-01-12T16:00:00Z',
    completedAt: '2025-01-12T16:00:00Z',
    deliverables: {
      reportId: 'rpt_001',
      summary: 'Comprehensive copper pricing forecast delivered with regional breakdowns.',
    },
  },
  {
    id: 'req_005',
    type: 'analyst_qa',
    status: 'completed',
    requesterId: 'user_004',
    requesterName: 'James Park',
    requesterEmail: 'james.park@acmecorp.com',
    teamId: 'team_001',
    teamName: 'Direct Materials',
    companyId: 'comp_001',
    title: 'Quick question on steel tariffs',
    description: 'Impact of new US steel tariffs on import pricing.',
    estimatedCredits: 250,
    actualCredits: 250,
    requiresApproval: false,
    approvalLevel: 'auto',
    createdAt: '2025-01-08T09:00:00Z',
    updatedAt: '2025-01-08T15:00:00Z',
    completedAt: '2025-01-08T15:00:00Z',
    deliverables: {
      summary: 'Analyst response provided within 6 hours.',
    },
  },
  {
    id: 'req_006',
    type: 'analyst_call',
    status: 'denied',
    requesterId: 'user_005',
    requesterName: 'Lisa Chen',
    requesterEmail: 'lisa.chen@acmecorp.com',
    teamId: 'team_002',
    teamName: 'Indirect Procurement',
    companyId: 'comp_001',
    title: 'IT Staffing Market Discussion',
    description: 'Wanted to discuss IT staffing rate trends.',
    estimatedCredits: 500,
    requiresApproval: true,
    approvalLevel: 'approver',
    approverId: 'user_006',
    approverName: 'David Kim',
    deniedAt: '2025-01-07T11:00:00Z',
    denialReason: 'Similar call completed last month. Please review notes from that session first.',
    createdAt: '2025-01-06T14:00:00Z',
    updatedAt: '2025-01-07T11:00:00Z',
  },
];

// All requests (pending + completed)
export const MOCK_ALL_REQUESTS: UpgradeRequest[] = [
  ...MOCK_PENDING_REQUESTS,
  ...MOCK_COMPLETED_REQUESTS,
];

// Helper functions
export function getMockRequests(filter?: {
  status?: RequestStatus | RequestStatus[];
  type?: RequestType;
  teamId?: string;
  requesterId?: string;
}): UpgradeRequest[] {
  let requests = [...MOCK_ALL_REQUESTS];

  if (filter?.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    requests = requests.filter(r => statuses.includes(r.status));
  }

  if (filter?.type) {
    requests = requests.filter(r => r.type === filter.type);
  }

  if (filter?.teamId) {
    requests = requests.filter(r => r.teamId === filter.teamId);
  }

  if (filter?.requesterId) {
    requests = requests.filter(r => r.requesterId === filter.requesterId);
  }

  // Sort by date (newest first)
  return requests.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockPendingRequests(_approverUserId?: string): UpgradeRequest[] {
  return getMockRequests({ status: 'pending' });
}

export function getMockRequestById(requestId: string): UpgradeRequest | undefined {
  return MOCK_ALL_REQUESTS.find(r => r.id === requestId);
}

// Get count of pending requests for badge
export function getMockPendingCount(): number {
  return MOCK_PENDING_REQUESTS.length;
}
