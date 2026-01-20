// POST /api/credits/hold/[id]/release - Release a credit hold (denied/cancelled)
import type { VercelResponse } from '@vercel/node';
import {
  withAuthenticated,
  type AuthRequest,
} from '../../../_middleware/auth.js';
import {
  getHoldById,
  getAccountForUser,
  releaseHold,
} from '../../../_middleware/credits.js';

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

  const holdId = req.query.id as string;
  const userId = req.auth.user!.id;

  if (!holdId) {
    return res.status(400).json({ error: 'Hold ID is required' });
  }

  try {
    // Get the hold to verify ownership
    const hold = await getHoldById(holdId);

    if (!hold) {
      return res.status(404).json({ error: 'Hold not found' });
    }

    // Verify user has access to this account
    const userAccount = await getAccountForUser(userId);
    if (!userAccount || userAccount.id !== hold.accountId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this hold',
      });
    }

    // Release the hold
    const result = await releaseHold(holdId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error releasing hold:', error);

    if (error instanceof Error) {
      if (error.message.includes('Cannot release hold')) {
        return res.status(400).json({
          error: 'Invalid operation',
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

export default withAuthenticated(handler);
