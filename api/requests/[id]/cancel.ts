// POST /api/requests/[id]/cancel - Cancel a request (by requester)
import type { VercelResponse } from '@vercel/node';
import { cancelRequest } from '../../_middleware/approvals.js';
import { withAuth, type AuthRequest } from '../../_middleware/auth.js';

interface CancelRequestBody {
  reason?: string;
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

  const body = req.body as CancelRequestBody;

  try {
    const result = await cancelRequest(requestId, userId, body.reason);

    return res.status(200).json({
      request: result,
      message: 'Request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling request:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Request not found' });
      }
      if (error.message.includes('Cannot cancel')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Only the requester')) {
        return res.status(403).json({ error: error.message });
      }
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
