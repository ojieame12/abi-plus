// Upgrade request and approval workflow types
// Matches schema in server/migrations/002_approval_workflow.sql

// ============================================================================
// ENUMS
// ============================================================================

// Request status (state machine)
export type RequestStatus =
  | 'draft'              // Not yet submitted
  | 'pending'            // Awaiting approval (was 'pending_approval')
  | 'approved'           // Approved, pending fulfillment
  | 'denied'             // Denied by approver
  | 'cancelled'          // Cancelled by requester
  | 'expired'            // Timed out waiting for approval
  | 'fulfilled';         // Completed/delivered (was 'completed')

// Legacy alias for backward compatibility
export type LegacyRequestStatus =
  | 'draft'
  | 'pending_approval'   // Maps to 'pending'
  | 'approved'
  | 'denied'
  | 'in_progress'        // Maps to 'approved' (being fulfilled)
  | 'completed'          // Maps to 'fulfilled'
  | 'cancelled';

// Request type (subset of credit transaction types that can be requested)
export type RequestType =
  | 'analyst_qa'
  | 'analyst_call'
  | 'report_upgrade'
  | 'expert_consult'
  | 'expert_deepdive'
  | 'bespoke_project';

// Request context - what prompted this request
export interface RequestContext {
  reportId?: string;
  reportTitle?: string;
  categoryId?: string;
  categoryName?: string;
  queryText?: string;
  conversationId?: string;
}

// Upgrade request
export interface UpgradeRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;

  // Requester info
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterAvatar?: string;
  teamId: string;
  teamName: string;
  companyId: string;

  // Request details
  title: string;
  description: string;
  context?: RequestContext;

  // Cost
  estimatedCredits: number;
  actualCredits?: number;

  // Approval workflow
  requiresApproval: boolean;
  approvalLevel: 'auto' | 'approver' | 'admin';
  approverId?: string;
  approverName?: string;
  approvalNote?: string;
  approvedAt?: string;
  deniedAt?: string;
  denialReason?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  // Deliverables (after completion)
  deliverables?: {
    reportId?: string;
    artifactId?: string;
    callRecordingUrl?: string;
    summary?: string;
  };
}

// Approval thresholds (configurable per org, but defaults here)
export const APPROVAL_THRESHOLDS = {
  autoApprove: 500,        // < $500 auto-approved
  approverLimit: 2000,     // $500-$2000 team approver can approve
  adminRequired: 2000,     // > $2000 requires admin
  escalationHours: 48,     // Hours before escalation if approver doesn't respond
} as const;

// Determine what approval level is needed
export type ApprovalLevel = 'auto' | 'approver' | 'admin';

export function getApprovalLevel(credits: number): ApprovalLevel {
  if (credits < APPROVAL_THRESHOLDS.autoApprove) return 'auto';
  if (credits <= APPROVAL_THRESHOLDS.approverLimit) return 'approver';
  return 'admin';
}

// Get approval level display text
export function getApprovalLevelDisplay(level: ApprovalLevel): string {
  switch (level) {
    case 'auto':
      return 'Auto-approved';
    case 'approver':
      return 'Requires team approver';
    case 'admin':
      return 'Requires admin approval';
  }
}

// Request status display info
export interface RequestStatusDisplay {
  label: string;
  color: string;
  bgColor: string;
  icon: string; // Lucide icon name
}

// Request type display info
export function getRequestTypeDisplay(type: RequestType): { label: string; description: string } {
  switch (type) {
    case 'analyst_qa':
      return {
        label: 'Analyst Q&A',
        description: 'Get async answers from a Beroe analyst',
      };
    case 'analyst_call':
      return {
        label: 'Analyst Call',
        description: 'Schedule a 30-minute call with an analyst',
      };
    case 'report_upgrade':
      return {
        label: 'Report Upgrade',
        description: 'Upgrade AI report to decision-grade quality',
      };
    case 'expert_consult':
      return {
        label: 'Expert Consultation',
        description: '1-hour session with an industry expert',
      };
    case 'expert_deepdive':
      return {
        label: 'Expert Deep-Dive',
        description: '2-3 hour intensive session with prep materials',
      };
    case 'bespoke_project':
      return {
        label: 'Bespoke Project',
        description: 'Custom research project with deliverables',
      };
  }
}

// ============================================================================
// APPROVAL EVENTS (Audit Trail)
// ============================================================================

export type ApprovalEventType =
  | 'created'            // Request created (draft)
  | 'submitted'          // Submitted for approval
  | 'auto_approved'      // Auto-approved (under threshold)
  | 'assigned'           // Assigned to approver
  | 'approved'           // Approved by user
  | 'denied'             // Denied by user
  | 'escalated'          // Escalated to next level
  | 'reassigned'         // Reassigned to different approver
  | 'cancelled'          // Cancelled by requester
  | 'expired'            // Timed out
  | 'fulfilled'          // Work completed
  | 'comment';           // Comment added (no status change)

export interface ApprovalEvent {
  id: string;
  requestId: string;
  eventType: ApprovalEventType;

  // Actor
  performedBy?: string;  // User ID, null for system
  performedBySystem: boolean;

  // State change
  fromStatus?: RequestStatus;
  toStatus?: RequestStatus;

  // Details
  reason?: string;
  metadata?: Record<string, unknown>;

  createdAt: string;
}

// ============================================================================
// APPROVAL RULES
// ============================================================================

export interface ApprovalRule {
  id: string;
  companyId: string;

  minCredits: number;
  maxCredits: number | null;

  approverRole: ApprovalLevel;
  escalationHours: number | null;
  escalateTo: 'approver' | 'admin' | null;

  priority: number;
  isActive: boolean;
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Submit a new upgrade request
 */
export interface SubmitRequestPayload {
  type: RequestType;
  title: string;
  description?: string;
  context?: RequestContext;
  estimatedCredits: number;
}

/**
 * Approve a request
 */
export interface ApproveRequestPayload {
  reason?: string;
}

/**
 * Deny a request
 */
export interface DenyRequestPayload {
  reason: string;  // Required for denials
}

/**
 * Query params for listing requests
 */
export interface GetRequestsParams {
  status?: RequestStatus[];
  role?: 'requester' | 'approver';
  teamId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Response after submitting a request
 */
export interface SubmitRequestResponse {
  requestId: string;
  status: RequestStatus;
  holdId?: string;          // If credits were held
  approvalLevel: ApprovalLevel;
  currentApproverId?: string;
  expiresAt?: string;       // SLA deadline
}

/**
 * Response after approving a request
 */
export interface ApproveRequestResponse {
  requestId: string;
  status: 'approved';
  decidedAt: string;
  holdConverted: boolean;   // If hold was converted to spend
}

/**
 * Response after denying a request
 */
export interface DenyRequestResponse {
  requestId: string;
  status: 'denied';
  decidedAt: string;
  holdReleased: boolean;    // If hold was released
}

/**
 * Response after cancelling a request
 */
export interface CancelRequestResponse {
  requestId: string;
  status: 'cancelled';
  holdReleased: boolean;
}

/**
 * Full request with events (detail view)
 */
export interface RequestWithEvents {
  request: UpgradeRequest;
  events: ApprovalEvent[];
  hold?: {
    id: string;
    amount: number;
    status: string;
  };
}

/**
 * Approver queue response
 */
export interface ApprovalQueueResponse {
  pending: UpgradeRequest[];
  totalPending: number;
  nearingEscalation: UpgradeRequest[];  // < 4 hours to SLA
}

/**
 * Paginated request list
 */
export interface GetRequestsResponse {
  requests: UpgradeRequest[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// STATE MACHINE HELPERS
// ============================================================================

/**
 * Valid state transitions
 */
export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'denied', 'cancelled', 'expired'],
  approved: ['fulfilled', 'cancelled'],
  denied: [],  // Terminal state
  cancelled: [],  // Terminal state
  expired: [],  // Terminal state
  fulfilled: [],  // Terminal state
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(from: RequestStatus, to: RequestStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get available actions for a request status
 */
export function getAvailableActions(
  status: RequestStatus,
  isRequester: boolean,
  isApprover: boolean
): string[] {
  const actions: string[] = [];

  if (status === 'draft' && isRequester) {
    actions.push('submit', 'cancel');
  }
  if (status === 'pending') {
    if (isApprover) {
      actions.push('approve', 'deny');
    }
    if (isRequester) {
      actions.push('cancel');
    }
  }
  if (status === 'approved' && isRequester) {
    actions.push('cancel');
  }

  return actions;
}

// ============================================================================
// STATUS DISPLAY (Updated for new statuses)
// ============================================================================

export function getRequestStatusDisplay(status: RequestStatus): RequestStatusDisplay {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        color: 'text-slate-500',
        bgColor: 'bg-slate-100',
        icon: 'FileEdit',
      };
    case 'pending':
      return {
        label: 'Pending Approval',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        icon: 'Clock',
      };
    case 'approved':
      return {
        label: 'Approved',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        icon: 'CheckCircle',
      };
    case 'denied':
      return {
        label: 'Denied',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: 'XCircle',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'text-slate-500',
        bgColor: 'bg-slate-100',
        icon: 'Ban',
      };
    case 'expired':
      return {
        label: 'Expired',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: 'AlertTriangle',
      };
    case 'fulfilled':
      return {
        label: 'Completed',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        icon: 'CheckCircle2',
      };
  }
}
