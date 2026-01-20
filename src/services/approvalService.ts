// Approval Workflow Service
// API client for request submission and approval operations

import type {
  RequestStatus,
  UpgradeRequest,
  ApprovalEvent,
  SubmitRequestPayload,
  SubmitRequestResponse,
  ApproveRequestPayload,
  ApproveRequestResponse,
  DenyRequestPayload,
  DenyRequestResponse,
  CancelRequestResponse,
  GetRequestsParams,
  GetRequestsResponse,
  ApprovalQueueResponse,
  RequestWithEvents,
} from '../types/requests';
import { getApprovalLevel, APPROVAL_THRESHOLDS } from '../types/requests';
import { apiFetch } from './api';
import { createHold, releaseHold, convertHold, directSpend } from './creditLedgerService';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = '/api/requests';

// Feature flag: use real API or mock data
const USE_REAL_API = true;  // Backend is ready

// In-memory mock store (for demo purposes)
const mockRequests: Map<string, UpgradeRequest> = new Map();
const mockEvents: Map<string, ApprovalEvent[]> = new Map();

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Submit a new upgrade request
 */
export async function submitRequest(
  payload: SubmitRequestPayload & { companyId: string; teamId: string }
): Promise<SubmitRequestResponse> {
  if (USE_REAL_API) {
    return apiFetch<SubmitRequestResponse>(API_BASE, {
      method: 'POST',
      body: JSON.stringify({
        companyId: payload.companyId,
        teamId: payload.teamId,
        requestType: payload.type,
        title: payload.title,
        description: payload.description,
        context: payload.context,
        estimatedCredits: payload.estimatedCredits,
      }),
    });
  }

  // Mock implementation
  const requestId = `req_${Date.now()}`;
  const approvalLevel = getApprovalLevel(payload.estimatedCredits);
  const isAutoApproved = approvalLevel === 'auto';

  // Create hold for non-auto-approved requests
  let holdId: string | undefined;
  if (!isAutoApproved) {
    const holdResponse = await createHold({
      requestId,
      amount: payload.estimatedCredits,
      idempotencyKey: `hold_${requestId}`,
    });
    holdId = holdResponse.holdId;
  } else {
    // Auto-approved: direct spend
    await directSpend({
      amount: payload.estimatedCredits,
      transactionType: 'spend',
      referenceType: 'request',
      referenceId: requestId,
      description: payload.title,
      idempotencyKey: `spend_${requestId}`,
    });
  }

  // Create mock request
  const now = new Date().toISOString();
  const request: UpgradeRequest = {
    id: requestId,
    type: payload.type,
    status: isAutoApproved ? 'approved' : 'pending',
    requesterId: 'user_001',
    requesterName: 'Sarah Chen',
    requesterEmail: 'sarah.chen@acme.com',
    teamId: 'team_001',
    teamName: 'Procurement',
    companyId: 'comp_001',
    title: payload.title,
    description: payload.description || '',
    context: payload.context,
    estimatedCredits: payload.estimatedCredits,
    requiresApproval: !isAutoApproved,
    approvalLevel,
    createdAt: now,
    updatedAt: now,
  };

  if (!isAutoApproved) {
    // Set expiration (48h for approver, 24h for admin)
    const expirationHours = approvalLevel === 'admin' ? 24 : 48;
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    request.approverId = 'user_approver';
    request.approverName = 'John Director';
    (request as UpgradeRequest & { expiresAt?: string }).expiresAt = expiresAt.toISOString();
  } else {
    request.approvedAt = now;
  }

  mockRequests.set(requestId, request);

  // Create initial events
  const events: ApprovalEvent[] = [
    {
      id: `evt_${Date.now()}_1`,
      requestId,
      eventType: 'created',
      performedBy: 'user_001',
      performedBySystem: false,
      toStatus: 'draft',
      createdAt: now,
    },
    {
      id: `evt_${Date.now()}_2`,
      requestId,
      eventType: isAutoApproved ? 'auto_approved' : 'submitted',
      performedBy: 'user_001',
      performedBySystem: isAutoApproved,
      fromStatus: 'draft',
      toStatus: isAutoApproved ? 'approved' : 'pending',
      createdAt: now,
    },
  ];
  mockEvents.set(requestId, events);

  return {
    requestId,
    status: request.status as RequestStatus,
    holdId,
    approvalLevel,
    currentApproverId: request.approverId,
    expiresAt: (request as UpgradeRequest & { expiresAt?: string }).expiresAt,
  };
}

/**
 * Approve a request
 */
export async function approveRequest(
  requestId: string,
  payload: ApproveRequestPayload = {}
): Promise<ApproveRequestResponse> {
  if (USE_REAL_API) {
    return apiFetch<ApproveRequestResponse>(`${API_BASE}/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Mock implementation
  const request = mockRequests.get(requestId);
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');

  const now = new Date().toISOString();

  // Convert hold to spend
  const holdConverted = true;  // Would check if hold exists
  await convertHold(`hold_${requestId}`);

  // Update request
  request.status = 'approved';
  request.approvedAt = now;
  request.updatedAt = now;
  request.approvalNote = payload.reason;

  // Add event
  const events = mockEvents.get(requestId) || [];
  events.push({
    id: `evt_${Date.now()}`,
    requestId,
    eventType: 'approved',
    performedBy: 'user_approver',
    performedBySystem: false,
    fromStatus: 'pending',
    toStatus: 'approved',
    reason: payload.reason,
    createdAt: now,
  });

  return {
    requestId,
    status: 'approved',
    decidedAt: now,
    holdConverted,
  };
}

/**
 * Deny a request
 */
export async function denyRequest(
  requestId: string,
  payload: DenyRequestPayload
): Promise<DenyRequestResponse> {
  if (USE_REAL_API) {
    return apiFetch<DenyRequestResponse>(`${API_BASE}/${requestId}/deny`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Mock implementation
  const request = mockRequests.get(requestId);
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');

  const now = new Date().toISOString();

  // Release hold
  await releaseHold(`hold_${requestId}`);

  // Update request
  request.status = 'denied';
  request.deniedAt = now;
  request.updatedAt = now;
  request.denialReason = payload.reason;

  // Add event
  const events = mockEvents.get(requestId) || [];
  events.push({
    id: `evt_${Date.now()}`,
    requestId,
    eventType: 'denied',
    performedBy: 'user_approver',
    performedBySystem: false,
    fromStatus: 'pending',
    toStatus: 'denied',
    reason: payload.reason,
    createdAt: now,
  });

  return {
    requestId,
    status: 'denied',
    decidedAt: now,
    holdReleased: true,
  };
}

/**
 * Cancel a request (by requester)
 */
export async function cancelRequest(requestId: string): Promise<CancelRequestResponse> {
  if (USE_REAL_API) {
    return apiFetch<CancelRequestResponse>(`${API_BASE}/${requestId}/cancel`, {
      method: 'POST',
    });
  }

  // Mock implementation
  const request = mockRequests.get(requestId);
  if (!request) throw new Error('Request not found');
  if (!['draft', 'pending', 'approved'].includes(request.status)) {
    throw new Error('Request cannot be cancelled');
  }

  const now = new Date().toISOString();
  const hadHold = request.status === 'pending';

  // Release hold if pending
  if (hadHold) {
    await releaseHold(`hold_${requestId}`);
  }

  // Update request
  request.status = 'cancelled';
  request.updatedAt = now;

  // Add event
  const events = mockEvents.get(requestId) || [];
  events.push({
    id: `evt_${Date.now()}`,
    requestId,
    eventType: 'cancelled',
    performedBy: 'user_001',
    performedBySystem: false,
    fromStatus: request.status,
    toStatus: 'cancelled',
    createdAt: now,
  });

  return {
    requestId,
    status: 'cancelled',
    holdReleased: hadHold,
  };
}

/**
 * Get request by ID with events
 */
export async function getRequest(requestId: string): Promise<RequestWithEvents> {
  if (USE_REAL_API) {
    return apiFetch<RequestWithEvents>(`${API_BASE}/${requestId}`);
  }

  // Mock implementation
  const request = mockRequests.get(requestId);
  if (!request) throw new Error('Request not found');

  const events = mockEvents.get(requestId) || [];

  return {
    request,
    events,
    hold: request.status === 'pending' ? {
      id: `hold_${requestId}`,
      amount: request.estimatedCredits,
      status: 'active',
    } : undefined,
  };
}

/**
 * Get requests with filtering
 */
export async function getRequests(
  params: GetRequestsParams = {}
): Promise<GetRequestsResponse> {
  if (USE_REAL_API) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status.join(','));
    if (params.role) searchParams.set('role', params.role);
    if (params.teamId) searchParams.set('teamId', params.teamId);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    return apiFetch<GetRequestsResponse>(`${API_BASE}?${searchParams}`);
  }

  // Mock implementation
  const { limit = 20, offset = 0, status, role } = params;

  let requests = Array.from(mockRequests.values());

  // Filter by status
  if (status && status.length > 0) {
    requests = requests.filter(r => status.includes(r.status as RequestStatus));
  }

  // Filter by role
  if (role === 'requester') {
    requests = requests.filter(r => r.requesterId === 'user_001');
  } else if (role === 'approver') {
    requests = requests.filter(r => r.approverId === 'user_approver');
  }

  // Sort by created date desc
  requests.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Paginate
  const total = requests.length;
  requests = requests.slice(offset, offset + limit);

  return {
    requests,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Get approver queue (pending requests for current approver)
 */
export async function getApprovalQueue(): Promise<ApprovalQueueResponse> {
  if (USE_REAL_API) {
    return apiFetch<ApprovalQueueResponse>(`${API_BASE}/queue`);
  }

  // Mock implementation
  const pending = Array.from(mockRequests.values()).filter(
    r => r.status === 'pending' && r.approverId === 'user_approver'
  );

  // Find requests nearing escalation (< 4 hours)
  const fourHoursFromNow = Date.now() + 4 * 60 * 60 * 1000;
  const nearingEscalation = pending.filter(r => {
    const expiresAt = (r as UpgradeRequest & { expiresAt?: string }).expiresAt;
    return expiresAt && new Date(expiresAt).getTime() < fourHoursFromNow;
  });

  return {
    pending,
    totalPending: pending.length,
    nearingEscalation,
  };
}

/**
 * Get count of pending approvals (for badge)
 */
export async function getPendingApprovalCount(): Promise<number> {
  const queue = await getApprovalQueue();
  return queue.totalPending;
}

// ============================================================================
// ESCALATION & EXPIRATION (would be handled by background jobs)
// ============================================================================

/**
 * Check for and process escalations
 * In production, this would be a cron job
 */
export async function processEscalations(): Promise<number> {
  if (USE_REAL_API) {
    const data = await apiFetch<{ escalatedCount: number }>(`${API_BASE}/escalate`, { method: 'POST' });
    return data.escalatedCount;
  }

  // Mock: no-op
  return 0;
}

/**
 * Check for and process expirations
 * In production, this would be a cron job
 */
export async function processExpirations(): Promise<number> {
  if (USE_REAL_API) {
    const data = await apiFetch<{ expiredCount: number }>(`${API_BASE}/expire`, { method: 'POST' });
    return data.expiredCount;
  }

  // Mock: no-op
  return 0;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if current user can approve a request
 */
export function canApprove(
  request: UpgradeRequest,
  userId: string,
  userRole: 'user' | 'approver' | 'admin'
): boolean {
  if (request.status !== 'pending') return false;
  if (request.requesterId === userId) return false;  // Can't approve own request

  if (userRole === 'admin') return true;
  if (userRole === 'approver' && request.approverId === userId) return true;

  return false;
}

/**
 * Check if current user can cancel a request
 */
export function canCancel(request: UpgradeRequest, userId: string): boolean {
  if (!['draft', 'pending', 'approved'].includes(request.status)) return false;
  return request.requesterId === userId;
}

/**
 * Get time until escalation
 */
export function getTimeUntilEscalation(request: UpgradeRequest): number | null {
  const expiresAt = (request as UpgradeRequest & { expiresAt?: string }).expiresAt;
  if (!expiresAt || request.status !== 'pending') return null;

  const escalationTime = new Date(expiresAt).getTime() - APPROVAL_THRESHOLDS.escalationHours * 60 * 60 * 1000;
  return Math.max(0, escalationTime - Date.now());
}
