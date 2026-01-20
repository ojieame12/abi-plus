// GET /api/requests/[id] - Get single request with events
import type { VercelResponse } from '@vercel/node';
import { getRequestWithEvents } from '../_middleware/approvals.js';
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

  const requestId = req.query.id as string;
  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  // User ID from session (for access control if needed later)
  // const userId = req.auth.user?.id;

  try {
    const result = await getRequestWithEvents(requestId);

    if (!result) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Note: Access check can be added here to restrict viewing
    // For demo mode, any authenticated user can view any request
    const { request, events } = result;

    return res.status(200).json({
      request,
      events,
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
