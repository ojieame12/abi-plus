// POST /api/requests/[id]/fulfill - Mark an approved request as fulfilled
import type { VercelResponse } from '@vercel/node';
import { fulfillRequest } from '../../_middleware/approvals.js';
import { withAuth, type AuthRequest } from '../../_middleware/auth.js';

interface FulfillRequestBody {
  actualCredits?: number;
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

  const body = req.body as FulfillRequestBody;

  // Validate actualCredits if provided
  if (body.actualCredits !== undefined) {
    if (typeof body.actualCredits !== 'number' || body.actualCredits < 0) {
      return res.status(400).json({ error: 'actualCredits must be a non-negative number' });
    }
  }

  try {
    const result = await fulfillRequest(requestId, userId, body.actualCredits);

    return res.status(200).json({
      request: result,
      message: 'Request fulfilled successfully',
    });
  } catch (error) {
    console.error('Error fulfilling request:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Request not found' });
      }
      if (error.message.includes('Cannot fulfill')) {
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
