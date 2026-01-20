// POST /api/requests/[id]/deny - Deny a pending request
import type { VercelResponse } from '@vercel/node';
import { denyRequest } from '../../_middleware/approvals.js';
import { withAuth, type AuthRequest } from '../../_middleware/auth.js';

interface DenyRequestBody {
  reason: string;
}

async function handler(req: AuthRequest, res: VercelResponse) {
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

  // Get user ID from session (demo mode will have logged in user)
  const userId = req.auth.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const body = req.body as DenyRequestBody;

  // Reason is required for denials
  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return res.status(400).json({ error: 'A reason is required when denying a request' });
  }

  try {
    const result = await denyRequest(requestId, userId, body.reason.trim());

    return res.status(200).json({
      request: result,
      message: 'Request denied',
    });
  } catch (error) {
    console.error('Error denying request:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Request not found' });
      }
      if (error.message.includes('Cannot deny')) {
        return res.status(400).json({ error: error.message });
      }
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
