// POST /api/requests/[id]/approve - Approve a pending request
// Requires approver or admin role
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { approveRequest } from '../../_middleware/approvals.js';
import { withOrgRole, type OrgRequest } from '../../_middleware/organization.js';
import { approvalRequests } from '../../../src/db/schema.js';

interface ApproveRequestBody {
  reason?: string;
}

// Approval limits by role (in credits)
const APPROVAL_LIMITS: Record<string, number | null> = {
  member: null, // Cannot approve
  approver: 5000, // Up to 5000 credits
  admin: null, // Unlimited
  owner: null, // Unlimited
};

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: OrgRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = req.query.id as string;
  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  const userId = req.auth.user!.id;
  const userRole = req.org.userRole;
  const body = req.body as ApproveRequestBody;

  // Check if role has approval limits
  const approvalLimit = APPROVAL_LIMITS[userRole];

  if (approvalLimit !== null) {
    // Fetch request to check credit amount
    const db = getDb();
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Use estimatedCredits (or actualCredits if set)
    const requestCredits = request.actualCredits ?? request.estimatedCredits;

    if (requestCredits > approvalLimit) {
      return res.status(403).json({
        error: 'Insufficient approval authority',
        message: `Your role (${userRole}) can only approve requests up to ${approvalLimit} credits. This request is for ${requestCredits} credits.`,
        required: requestCredits,
        limit: approvalLimit,
      });
    }
  }

  try {
    const result = await approveRequest(requestId, userId, body.reason);

    return res.status(200).json({
      request: result,
      message: 'Request approved successfully',
    });
  } catch (error) {
    console.error('Error approving request:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Request not found' });
      }
      if (error.message.includes('Cannot approve')) {
        return res.status(400).json({ error: error.message });
      }
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Only approvers, admins, and owners can approve requests
export default withOrgRole(['approver', 'admin', 'owner'], handler);
