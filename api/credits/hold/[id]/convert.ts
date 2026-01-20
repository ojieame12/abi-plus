// POST /api/credits/hold/[id]/convert - Convert a hold to spend (approved)
import type { VercelResponse } from '@vercel/node';
import {
  withAuthenticated,
  type AuthRequest,
} from '../../../_middleware/auth.js';
import {
  getHoldById,
  getAccountForUser,
  convertHold,
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

    // Convert the hold
    const result = await convertHold(holdId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error converting hold:', error);

    if (error instanceof Error) {
      if (error.message.includes('Cannot convert hold')) {
        return res.status(400).json({
          error: 'Invalid operation',
          message: error.message,
        });
      }
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({
          error: 'Already converted',
          message: 'This hold has already been converted',
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
