// Approval Workflow Middleware - State machine, routing rules, credit integration
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql, desc, lte, isNull, or } from 'drizzle-orm';
import {
  approvalRequests,
  approvalEvents,
  approvalRules,
  teamMemberships,
  users,
  profiles,
  teams,
  creditHolds,
  ledgerEntries,
} from '../../src/db/schema.js';
import type {
  ApprovalRequest,
  ApprovalEvent,
  ApprovalRule,
  ApprovalRequestType,
  ApprovalRequestStatus,
  ApprovalLevel,
  ApprovalEventType,
  ApprovalRequestContext,
} from '../../src/db/schema.js';
import {
  createHold,
  releaseHold,
  convertHold,
  directSpend,
  getAccountForUser,
  withTransaction,
  getPoolDb,
} from './credits.js';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface SubmitRequestParams {
  companyId: string;
  teamId: string;
  requesterId: string;
  requestType: ApprovalRequestType;
  title: string;
  description?: string;
  context?: ApprovalRequestContext;
  estimatedCredits: number;
}

export interface SubmitRequestResult {
  request: ApprovalRequest;
  status: ApprovalRequestStatus;
  approvalLevel: ApprovalLevel;
  holdId?: string;
  autoApproved: boolean;
}

export interface RequestWithEvents {
  request: ApprovalRequest;
  events: ApprovalEvent[];
}

export interface ApprovalQueueItem {
  request: ApprovalRequest;
  requesterName: string;
  requesterEmail: string;
  hoursUntilEscalation?: number;
}

export interface ApprovalQueue {
  pending: ApprovalQueueItem[];
  totalPending: number;
  nearingEscalation: ApprovalQueueItem[];
}

// Default approval rules (used when company has no custom rules)
const DEFAULT_RULES: Array<{
  minCredits: number;
  maxCredits: number | null;
  approverRole: ApprovalLevel;
  escalationHours: number | null;
}> = [
  { minCredits: 0, maxCredits: 500, approverRole: 'auto', escalationHours: null },
  { minCredits: 500, maxCredits: 2000, approverRole: 'approver', escalationHours: 48 },
  { minCredits: 2000, maxCredits: null, approverRole: 'admin', escalationHours: 24 },
];

// ══════════════════════════════════════════════════════════════════
// Database Setup
// ══════════════════════════════════════════════════════════════════

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// ══════════════════════════════════════════════════════════════════
// State Machine Validation
// ══════════════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<ApprovalRequestStatus, ApprovalRequestStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'denied', 'cancelled', 'expired'],
  approved: ['fulfilled', 'cancelled'],
  denied: [], // Terminal state
  cancelled: [], // Terminal state
  expired: [], // Terminal state
  fulfilled: [], // Terminal state
};

function canTransition(from: ApprovalRequestStatus, to: ApprovalRequestStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ══════════════════════════════════════════════════════════════════
// Routing Rules
// ══════════════════════════════════════════════════════════════════

/**
 * Get the approval rule that applies to a given credit amount for a company
 */
export async function getApplicableRule(
  companyId: string,
  credits: number
): Promise<{ approverRole: ApprovalLevel; escalationHours: number | null }> {
  const db = getDb();

  // Try company-specific rules first
  const rules = await db
    .select()
    .from(approvalRules)
    .where(
      and(
        eq(approvalRules.companyId, companyId),
        eq(approvalRules.isActive, true),
        lte(approvalRules.minCredits, credits),
        or(
          isNull(approvalRules.maxCredits),
          sql`${approvalRules.maxCredits} >= ${credits}`
        )
      )
    )
    .orderBy(approvalRules.priority)
    .limit(1);

  if (rules.length > 0) {
    return {
      approverRole: rules[0].approverRole,
      escalationHours: rules[0].escalationHours,
    };
  }

  // Fall back to default rules
  const defaultRule = DEFAULT_RULES.find(
    (r) => credits >= r.minCredits && (r.maxCredits === null || credits < r.maxCredits)
  );

  return defaultRule ?? { approverRole: 'admin', escalationHours: 24 };
}

/**
 * Find an approver for a request based on the approval level
 * - 'approver' level: look for team members with 'approver' role, fallback to admin/owner
 * - 'admin' level: look for team members with 'admin' or 'owner' role
 */
async function findApprover(
  companyId: string,
  teamId: string,
  requesterId: string,
  approverRole: ApprovalLevel
): Promise<string | null> {
  if (approverRole === 'auto') {
    return null; // No approver needed
  }

  const db = getDb();

  if (approverRole === 'approver') {
    // First try to find someone with 'approver' role
    const approvers = await db
      .select({
        userId: teamMemberships.userId,
      })
      .from(teamMemberships)
      .where(
        and(
          eq(teamMemberships.teamId, teamId),
          eq(teamMemberships.role, 'approver'),
          sql`${teamMemberships.userId} != ${requesterId}::uuid` // Can't approve own request
        )
      )
      .limit(1);

    if (approvers.length > 0) {
      return approvers[0].userId;
    }

    // Fallback to admin/owner if no approver found
    const admins = await db
      .select({
        userId: teamMemberships.userId,
      })
      .from(teamMemberships)
      .where(
        and(
          eq(teamMemberships.teamId, teamId),
          sql`${teamMemberships.role} IN ('admin', 'owner')`,
          sql`${teamMemberships.userId} != ${requesterId}::uuid`
        )
      )
      .limit(1);

    return admins.length > 0 ? admins[0].userId : null;
  }

  // admin level: look for admin or owner
  const approvers = await db
    .select({
      userId: teamMemberships.userId,
    })
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.teamId, teamId),
        sql`${teamMemberships.role} IN ('admin', 'owner')`,
        sql`${teamMemberships.userId} != ${requesterId}::uuid`
      )
    )
    .limit(1);

  return approvers.length > 0 ? approvers[0].userId : null;
}

// ══════════════════════════════════════════════════════════════════
// Event Recording
// ══════════════════════════════════════════════════════════════════

async function recordEvent(
  requestId: string,
  eventType: ApprovalEventType,
  options: {
    performedBy?: string;
    performedBySystem?: boolean;
    fromStatus?: ApprovalRequestStatus;
    toStatus?: ApprovalRequestStatus;
    reason?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<ApprovalEvent> {
  const db = getDb();

  const [event] = await db
    .insert(approvalEvents)
    .values({
      requestId,
      eventType,
      performedBy: options.performedBy,
      performedBySystem: options.performedBySystem ?? false,
      fromStatus: options.fromStatus,
      toStatus: options.toStatus,
      reason: options.reason,
      metadata: options.metadata,
    })
    .returning();

  return event;
}

// ══════════════════════════════════════════════════════════════════
// Core Operations
// ══════════════════════════════════════════════════════════════════

/**
 * Submit a new approval request
 * - Determines approval level based on credit amount
 * - Auto-approves if under threshold
 * - Creates credit hold if approval needed
 */
export async function submitRequest(
  params: SubmitRequestParams
): Promise<SubmitRequestResult> {
  const db = getDb();

  // Get applicable routing rule
  const rule = await getApplicableRule(params.companyId, params.estimatedCredits);
  const isAutoApproved = rule.approverRole === 'auto';

  // Find approver if needed
  const approverId = isAutoApproved
    ? null
    : await findApprover(
        params.companyId,
        params.teamId,
        params.requesterId,
        rule.approverRole
      );

  // Calculate expiration time
  const expiresAt = rule.escalationHours
    ? new Date(Date.now() + rule.escalationHours * 60 * 60 * 1000)
    : null;

  const now = new Date();

  // Create the request
  const [request] = await db
    .insert(approvalRequests)
    .values({
      companyId: params.companyId,
      teamId: params.teamId,
      requesterId: params.requesterId,
      requestType: params.requestType,
      title: params.title,
      description: params.description,
      context: params.context,
      estimatedCredits: params.estimatedCredits,
      status: isAutoApproved ? 'approved' : 'pending',
      approvalLevel: rule.approverRole,
      currentApproverId: approverId,
      submittedAt: now,
      decidedAt: isAutoApproved ? now : null,
      expiresAt,
    })
    .returning();

  // Record submission event (single event captures creation + submission)
  // Note: request is created directly in target status (no intermediate 'draft' state)
  if (isAutoApproved) {
    // Auto-approved: single event captures creation and auto-approval
    await recordEvent(request.id, 'auto_approved', {
      performedBy: params.requesterId,
      performedBySystem: true,
      toStatus: 'approved',
      reason: 'Auto-approved (under threshold)',
      metadata: {
        approvalLevel: rule.approverRole,
        estimatedCredits: params.estimatedCredits,
      },
    });
  } else {
    // Needs approval: record submission to pending state
    await recordEvent(request.id, 'submitted', {
      performedBy: params.requesterId,
      toStatus: 'pending',
      metadata: {
        approvalLevel: rule.approverRole,
        estimatedCredits: params.estimatedCredits,
        approverId: approverId,
      },
    });
  }

  let holdId: string | undefined;

  if (isAutoApproved) {
    // Auto-approved: do direct spend

    // Get user's credit account and do direct spend
    const account = await getAccountForUser(params.requesterId);
    if (account) {
      await directSpend({
        accountId: account.id,
        amount: params.estimatedCredits,
        transactionType: 'spend',
        referenceType: 'request',
        referenceId: request.id,
        description: `Auto-approved: ${params.title}`,
        idempotencyKey: `request_${request.id}`,
        userId: params.requesterId,
      });
    }
  } else {
    // Needs approval: create credit hold
    const account = await getAccountForUser(params.requesterId);
    if (account) {
      const holdResult = await createHold(
        account.id,
        request.id,
        params.estimatedCredits
      );
      holdId = holdResult.holdId;
    }
  }

  return {
    request,
    status: request.status,
    approvalLevel: rule.approverRole,
    holdId,
    autoApproved: isAutoApproved,
  };
}

/**
 * Approve a pending request
 * Runs status update and hold conversion in a single transaction
 */
export async function approveRequest(
  requestId: string,
  approverId: string,
  reason?: string
): Promise<ApprovalRequest> {
  return withTransaction(async (tx) => {
    // Lock the request row to prevent concurrent status changes
    const requestResult = await tx.execute(sql`
      SELECT *
      FROM approval_requests
      WHERE id = ${requestId}
      FOR UPDATE
    `);
    const request = requestResult.rows[0] as ApprovalRequest | undefined;

    if (!request) {
      throw new Error('Request not found');
    }

    if (!canTransition(request.status, 'approved')) {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }

    const now = new Date();

    // Update request status
    const [updated] = await tx
      .update(approvalRequests)
      .set({
        status: 'approved',
        decidedAt: now,
        decidedBy: approverId,
        decisionReason: reason,
        updatedAt: now,
      })
      .where(eq(approvalRequests.id, requestId))
      .returning();

    // Record event
    await tx
      .insert(approvalEvents)
      .values({
        requestId,
        eventType: 'approved',
        performedBy: approverId,
        performedBySystem: false,
        fromStatus: request.status,
        toStatus: 'approved',
        reason,
      });

    // Find and convert hold to spend within same transaction
    const holdResult = await tx.execute(sql`
      SELECT id, account_id as "accountId", amount
      FROM credit_holds
      WHERE request_id = ${requestId} AND status = 'active'
      FOR UPDATE
      LIMIT 1
    `);

    if (holdResult.rows.length > 0) {
      const hold = holdResult.rows[0] as { id: string; accountId: string; amount: number };

      // Update hold status to converted
      await tx
        .update(creditHolds)
        .set({
          status: 'converted',
          convertedAt: now,
        })
        .where(eq(creditHolds.id, hold.id));

      // Create ledger debit entry
      await tx
        .insert(ledgerEntries)
        .values({
          accountId: hold.accountId,
          entryType: 'debit',
          amount: hold.amount,
          transactionType: 'hold_conversion',
          referenceType: 'request',
          referenceId: requestId,
          description: `Approved: ${request.title}`,
          performedBy: approverId,
          idempotencyKey: `hold_convert_${hold.id}`,
        });
    }

    return updated;
  });
}

/**
 * Deny a pending request
 * Runs status update and hold release in a single transaction
 */
export async function denyRequest(
  requestId: string,
  approverId: string,
  reason: string
): Promise<ApprovalRequest> {
  return withTransaction(async (tx) => {
    // Lock the request row to prevent concurrent status changes
    const requestResult = await tx.execute(sql`
      SELECT *
      FROM approval_requests
      WHERE id = ${requestId}
      FOR UPDATE
    `);
    const request = requestResult.rows[0] as ApprovalRequest | undefined;

    if (!request) {
      throw new Error('Request not found');
    }

    if (!canTransition(request.status, 'denied')) {
      throw new Error(`Cannot deny request with status: ${request.status}`);
    }

    const now = new Date();

    // Update request status
    const [updated] = await tx
      .update(approvalRequests)
      .set({
        status: 'denied',
        decidedAt: now,
        decidedBy: approverId,
        decisionReason: reason,
        updatedAt: now,
      })
      .where(eq(approvalRequests.id, requestId))
      .returning();

    // Record event
    await tx
      .insert(approvalEvents)
      .values({
        requestId,
        eventType: 'denied',
        performedBy: approverId,
        performedBySystem: false,
        fromStatus: request.status,
        toStatus: 'denied',
        reason,
      });

    // Find and release hold within same transaction
    const holdResult = await tx.execute(sql`
      SELECT id
      FROM credit_holds
      WHERE request_id = ${requestId} AND status = 'active'
      FOR UPDATE
      LIMIT 1
    `);

    if (holdResult.rows.length > 0) {
      const hold = holdResult.rows[0] as { id: string };

      // Update hold status to released
      await tx
        .update(creditHolds)
        .set({
          status: 'released',
          releasedAt: now,
        })
        .where(eq(creditHolds.id, hold.id));
    }

    return updated;
  });
}

/**
 * Cancel a request (by requester)
 * Runs status update and hold release in a single transaction
 */
export async function cancelRequest(
  requestId: string,
  userId: string,
  reason?: string
): Promise<ApprovalRequest> {
  return withTransaction(async (tx) => {
    // Lock the request row to prevent concurrent status changes
    const requestResult = await tx.execute(sql`
      SELECT *
      FROM approval_requests
      WHERE id = ${requestId}
      FOR UPDATE
    `);
    const request = requestResult.rows[0] as ApprovalRequest | undefined;

    if (!request) {
      throw new Error('Request not found');
    }

    if (!canTransition(request.status, 'cancelled')) {
      throw new Error(`Cannot cancel request with status: ${request.status}`);
    }

    // Note: Requester check removed for demo mode - any user can cancel
    // TODO: Re-enable when auth is implemented
    // if (request.requesterId !== userId) {
    //   throw new Error('Only the requester can cancel this request');
    // }

    const now = new Date();

    // Update request status
    const [updated] = await tx
      .update(approvalRequests)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(approvalRequests.id, requestId))
      .returning();

    // Record event
    await tx
      .insert(approvalEvents)
      .values({
        requestId,
        eventType: 'cancelled',
        performedBy: userId,
        performedBySystem: false,
        fromStatus: request.status,
        toStatus: 'cancelled',
        reason,
      });

    // Find and release hold within same transaction
    const holdResult = await tx.execute(sql`
      SELECT id
      FROM credit_holds
      WHERE request_id = ${requestId} AND status = 'active'
      FOR UPDATE
      LIMIT 1
    `);

    if (holdResult.rows.length > 0) {
      const hold = holdResult.rows[0] as { id: string };

      // Update hold status to released
      await tx
        .update(creditHolds)
        .set({
          status: 'released',
          releasedAt: now,
        })
        .where(eq(creditHolds.id, hold.id));
    }

    return updated;
  });
}

/**
 * Mark a request as fulfilled
 */
export async function fulfillRequest(
  requestId: string,
  userId: string,
  actualCredits?: number
): Promise<ApprovalRequest> {
  const db = getDb();

  // Get the request
  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new Error('Request not found');
  }

  if (!canTransition(request.status, 'fulfilled')) {
    throw new Error(`Cannot fulfill request with status: ${request.status}`);
  }

  // Update request
  const [updated] = await db
    .update(approvalRequests)
    .set({
      status: 'fulfilled',
      fulfilledAt: new Date(),
      actualCredits: actualCredits ?? request.estimatedCredits,
      updatedAt: new Date(),
    })
    .where(eq(approvalRequests.id, requestId))
    .returning();

  // Record event
  await recordEvent(requestId, 'fulfilled', {
    performedBy: userId,
    fromStatus: request.status,
    toStatus: 'fulfilled',
    metadata: {
      actualCredits: actualCredits ?? request.estimatedCredits,
    },
  });

  return updated;
}

// ══════════════════════════════════════════════════════════════════
// Query Operations
// ══════════════════════════════════════════════════════════════════

/**
 * Get a request with its events
 */
export async function getRequestWithEvents(
  requestId: string
): Promise<RequestWithEvents | null> {
  const db = getDb();

  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.id, requestId))
    .limit(1);

  if (!request) {
    return null;
  }

  const events = await db
    .select()
    .from(approvalEvents)
    .where(eq(approvalEvents.requestId, requestId))
    .orderBy(desc(approvalEvents.createdAt));

  return { request, events };
}

// UI-ready request DTO with requester/team info
export interface RequestWithDetails {
  id: string;
  type: ApprovalRequestType;
  status: ApprovalRequestStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterAvatar: string | null;
  teamId: string;
  teamName: string;
  companyId: string;
  title: string;
  description: string | null;
  context: ApprovalRequestContext | null;
  estimatedCredits: number;
  actualCredits: number | null;
  requiresApproval: boolean;
  approvalLevel: ApprovalLevel | null;
  approverId: string | null;
  decisionReason: string | null;
  // UI aliases for compatibility
  denialReason: string | null;
  approvalNote: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  fulfilledAt: string | null;
}

/**
 * Get requests for a user (as requester or approver)
 * Returns UI-ready DTOs with requester/team info joined
 */
export async function getRequests(options: {
  userId: string;
  role: 'requester' | 'approver';
  status?: ApprovalRequestStatus[];
  limit?: number;
  offset?: number;
}): Promise<{ requests: RequestWithDetails[]; total: number; hasMore: boolean }> {
  const db = getDb();
  const { userId, role, status, limit = 20, offset = 0 } = options;

  // Build conditions
  const conditions = [];

  if (role === 'requester') {
    conditions.push(eq(approvalRequests.requesterId, userId));
  } else {
    // For approvers, show all requests in pending status that they can approve
    // or requests they've already decided on
    conditions.push(
      or(
        eq(approvalRequests.currentApproverId, userId),
        eq(approvalRequests.decidedBy, userId)
      )
    );
  }

  if (status && status.length > 0) {
    conditions.push(sql`${approvalRequests.status} IN (${sql.join(status.map(s => sql`${s}`), sql`, `)})`);
  }

  // Join with profiles and teams to get requester/team info
  const results = await db
    .select({
      request: approvalRequests,
      requesterEmail: users.email,
      requesterName: profiles.displayName,
      requesterAvatar: profiles.avatarUrl,
      teamName: teams.name,
    })
    .from(approvalRequests)
    .leftJoin(users, eq(approvalRequests.requesterId, users.id))
    .leftJoin(profiles, eq(approvalRequests.requesterId, profiles.userId))
    .leftJoin(teams, eq(approvalRequests.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(desc(approvalRequests.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(approvalRequests)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  // Transform to UI-ready DTOs
  const requests: RequestWithDetails[] = results.map(row => ({
    id: row.request.id,
    type: row.request.requestType,
    status: row.request.status,
    requesterId: row.request.requesterId,
    requesterName: row.requesterName || 'Unknown User',
    requesterEmail: row.requesterEmail || '',
    requesterAvatar: row.requesterAvatar,
    teamId: row.request.teamId,
    teamName: row.teamName || 'Unknown Team',
    companyId: row.request.companyId,
    title: row.request.title,
    description: row.request.description,
    context: row.request.context,
    estimatedCredits: row.request.estimatedCredits,
    actualCredits: row.request.actualCredits,
    requiresApproval: row.request.approvalLevel !== 'auto',
    approvalLevel: row.request.approvalLevel,
    approverId: row.request.currentApproverId,
    decisionReason: row.request.decisionReason,
    // UI aliases: denialReason for denied, approvalNote for approved
    denialReason: row.request.status === 'denied' ? row.request.decisionReason : null,
    approvalNote: row.request.status === 'approved' ? row.request.decisionReason : null,
    createdAt: row.request.createdAt.toISOString(),
    updatedAt: row.request.updatedAt.toISOString(),
    submittedAt: row.request.submittedAt?.toISOString() || null,
    decidedAt: row.request.decidedAt?.toISOString() || null,
    fulfilledAt: row.request.fulfilledAt?.toISOString() || null,
  }));

  return {
    requests,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Get the approval queue for an approver
 */
export async function getApprovalQueue(approverId: string): Promise<ApprovalQueue> {
  const db = getDb();
  const now = new Date();
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  // Get pending requests assigned to this approver
  const pendingRequests = await db
    .select({
      request: approvalRequests,
      requesterName: users.email, // Will be replaced with profile display name
    })
    .from(approvalRequests)
    .innerJoin(users, eq(approvalRequests.requesterId, users.id))
    .where(
      and(
        eq(approvalRequests.currentApproverId, approverId),
        eq(approvalRequests.status, 'pending')
      )
    )
    .orderBy(approvalRequests.createdAt);

  const pending: ApprovalQueueItem[] = pendingRequests.map((r) => ({
    request: r.request,
    requesterName: r.requesterName,
    requesterEmail: r.requesterName,
    hoursUntilEscalation: r.request.expiresAt
      ? Math.max(0, (r.request.expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000))
      : undefined,
  }));

  // Filter for those nearing escalation (within 4 hours)
  const nearingEscalation = pending.filter(
    (p) =>
      p.request.expiresAt &&
      p.request.expiresAt <= fourHoursFromNow &&
      p.request.expiresAt > now
  );

  return {
    pending,
    totalPending: pending.length,
    nearingEscalation,
  };
}

/**
 * Check if a user can approve a specific request
 */
export async function canUserApprove(
  userId: string,
  requestId: string
): Promise<boolean> {
  const db = getDb();

  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, requestId),
        eq(approvalRequests.currentApproverId, userId),
        eq(approvalRequests.status, 'pending')
      )
    )
    .limit(1);

  return request !== undefined;
}

/**
 * Check if a user can cancel a specific request
 */
export async function canUserCancel(
  userId: string,
  requestId: string
): Promise<boolean> {
  const db = getDb();

  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, requestId),
        eq(approvalRequests.requesterId, userId)
      )
    )
    .limit(1);

  if (!request) return false;

  return canTransition(request.status, 'cancelled');
}

/**
 * Check if a user can fulfill a specific request
 * User must be: admin on the team OR the user who approved the request
 */
export async function canUserFulfill(
  userId: string,
  requestId: string
): Promise<boolean> {
  const db = getDb();

  // Get the request with team info
  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.id, requestId))
    .limit(1);

  if (!request) return false;

  // Must be in approved status
  if (request.status !== 'approved') return false;

  // Check if user is the one who approved
  if (request.decidedBy === userId) return true;

  // Check if user is admin or approver on the team
  const [membership] = await db
    .select()
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.teamId, request.teamId),
        eq(teamMemberships.userId, userId),
        sql`${teamMemberships.role} IN ('admin', 'owner', 'approver')`
      )
    )
    .limit(1);

  return membership !== undefined;
}

// ══════════════════════════════════════════════════════════════════
// Background Job Operations
// ══════════════════════════════════════════════════════════════════

/**
 * Process escalations for requests approaching their expiration time
 * Called by a cron job to escalate approver-level requests to admin
 */
export async function processEscalations(): Promise<{ escalatedCount: number; escalatedIds: string[] }> {
  const db = getDb();
  const now = new Date();
  // Escalate requests within 4 hours of expiration that are still at approver level
  const escalationWindow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  // Find pending requests approaching expiration at approver level
  const toEscalate = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.status, 'pending'),
        eq(approvalRequests.approvalLevel, 'approver'),
        lte(approvalRequests.expiresAt, escalationWindow),
        sql`${approvalRequests.expiresAt} > ${now}`
      )
    );

  const escalatedIds: string[] = [];

  for (const request of toEscalate) {
    // Find an admin to escalate to
    const admins = await db
      .select({ userId: teamMemberships.userId })
      .from(teamMemberships)
      .where(
        and(
          eq(teamMemberships.teamId, request.teamId),
          eq(teamMemberships.role, 'admin'),
          sql`${teamMemberships.userId} != ${request.requesterId}::uuid`
        )
      )
      .limit(1);

    if (admins.length === 0) continue;

    const newApproverId = admins[0].userId;
    const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h for admin

    // Update request
    await db
      .update(approvalRequests)
      .set({
        approvalLevel: 'admin',
        currentApproverId: newApproverId,
        expiresAt: newExpiresAt,
        updatedAt: now,
      })
      .where(eq(approvalRequests.id, request.id));

    // Record event
    await recordEvent(request.id, 'escalated', {
      performedBySystem: true,
      fromStatus: 'pending',
      toStatus: 'pending',
      metadata: {
        previousApprover: request.currentApproverId,
        newApprover: newApproverId,
        reason: 'Escalated due to approaching SLA deadline',
      },
    });

    escalatedIds.push(request.id);
  }

  return { escalatedCount: escalatedIds.length, escalatedIds };
}

/**
 * Process expirations for requests that have passed their expiration time
 * Called by a cron job to expire requests and release holds
 */
export async function processExpirations(): Promise<{ expiredCount: number; expiredIds: string[] }> {
  const db = getDb();
  const now = new Date();

  // Find pending requests past expiration
  const toExpire = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.status, 'pending'),
        lte(approvalRequests.expiresAt, now)
      )
    );

  const expiredIds: string[] = [];

  for (const request of toExpire) {
    // Update request status
    await db
      .update(approvalRequests)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(eq(approvalRequests.id, request.id));

    // Record event
    await recordEvent(request.id, 'expired', {
      performedBySystem: true,
      fromStatus: 'pending',
      toStatus: 'expired',
      reason: 'Request expired due to SLA deadline',
    });

    // Release credit hold
    const holdResult = await db.execute(
      sql`SELECT id FROM credit_holds WHERE request_id = ${request.id} AND status = 'active' LIMIT 1`
    );
    if (holdResult.rows.length > 0) {
      await releaseHold(holdResult.rows[0].id as string);
    }

    expiredIds.push(request.id);
  }

  return { expiredCount: expiredIds.length, expiredIds };
}
