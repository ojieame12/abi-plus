// GET/POST /api/requests - List requests or submit new request
import type { VercelResponse } from '@vercel/node';
import {
  submitRequest,
  getRequests,
} from '../_middleware/approvals.js';
import { withAuth, type AuthRequest } from '../_middleware/auth.js';
import type { ApprovalRequestType, ApprovalRequestStatus, ApprovalRequestContext } from '../../src/db/schema.js';

const VALID_REQUEST_TYPES: ApprovalRequestType[] = [
  'report_upgrade',
  'analyst_qa',
  'analyst_call',
  'expert_consult',
  'expert_deepdive',
  'bespoke_project',
];

const VALID_STATUSES: ApprovalRequestStatus[] = [
  'draft',
  'pending',
  'approved',
  'denied',
  'cancelled',
  'expired',
  'fulfilled',
];

interface SubmitRequestBody {
  companyId: string;
  teamId: string;
  requestType: ApprovalRequestType;
  title: string;
  description?: string;
  context?: ApprovalRequestContext;
  estimatedCredits: number;
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get user ID from session (demo mode will have logged in user)
  const userId = req.auth.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // GET - List requests
  if (req.method === 'GET') {
    try {
      const role = (req.query.role as string) || 'requester';
      const statusParam = req.query.status as string | undefined;
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const offset = parseInt(req.query.offset as string) || 0;

      if (role !== 'requester' && role !== 'approver') {
        return res.status(400).json({ error: 'Invalid role. Must be "requester" or "approver"' });
      }

      let status: ApprovalRequestStatus[] | undefined;
      if (statusParam) {
        const statuses = statusParam.split(',') as ApprovalRequestStatus[];
        const invalid = statuses.find((s) => !VALID_STATUSES.includes(s));
        if (invalid) {
          return res.status(400).json({
            error: `Invalid status: ${invalid}`,
            valid: VALID_STATUSES,
          });
        }
        status = statuses;
      }

      const result = await getRequests({
        userId,
        role: role as 'requester' | 'approver',
        status,
        limit,
        offset,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching requests:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST - Submit new request
  if (req.method === 'POST') {
    const body = req.body as SubmitRequestBody;

    // Validate required fields
    if (!body.companyId || typeof body.companyId !== 'string') {
      return res.status(400).json({ error: 'companyId is required' });
    }
    if (!body.teamId || typeof body.teamId !== 'string') {
      return res.status(400).json({ error: 'teamId is required' });
    }
    if (!body.requestType || !VALID_REQUEST_TYPES.includes(body.requestType)) {
      return res.status(400).json({
        error: 'Invalid requestType',
        valid: VALID_REQUEST_TYPES,
      });
    }
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!body.estimatedCredits || typeof body.estimatedCredits !== 'number' || body.estimatedCredits <= 0) {
      return res.status(400).json({ error: 'estimatedCredits must be a positive number' });
    }

    try {
      const result = await submitRequest({
        companyId: body.companyId,
        teamId: body.teamId,
        requesterId: userId,
        requestType: body.requestType,
        title: body.title.trim(),
        description: body.description,
        context: body.context,
        estimatedCredits: body.estimatedCredits,
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error submitting request:', error);

      if (error instanceof Error) {
        if (error.message.includes('Insufficient credits')) {
          return res.status(400).json({
            error: 'Insufficient credits',
            message: error.message,
          });
        }
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
