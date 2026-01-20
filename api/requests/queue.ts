// GET /api/requests/queue - Get approval queue for current user
import type { VercelResponse } from '@vercel/node';
import { getApprovalQueue } from '../_middleware/approvals.js';
import { withAuth, type AuthRequest } from '../_middleware/auth.js';

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user ID from session (demo mode will have logged in user)
  const userId = req.auth.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // The queue will show requests assigned to this approver
    const queue = await getApprovalQueue(userId);

    return res.status(200).json(queue);
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
