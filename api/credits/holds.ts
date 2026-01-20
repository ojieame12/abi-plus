// GET /api/credits/holds - Get active holds for the account
import type { VercelResponse } from '@vercel/node';
import {
  withAuthenticated,
  type AuthRequest,
} from '../_middleware/auth.js';
import {
  getAccountForUser,
  getActiveHolds,
} from '../_middleware/credits.js';

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

  const userId = req.auth.user!.id;

  try {
    // Get account for user's company
    const account = await getAccountForUser(userId);

    if (!account) {
      return res.status(404).json({
        error: 'No credit account found',
        message: 'Your company does not have a credit account configured',
      });
    }

    // Get active holds
    const holds = await getActiveHolds(account.id);

    return res.status(200).json(holds);
  } catch (error) {
    console.error('Error fetching holds:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuthenticated(handler);
