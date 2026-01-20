// POST /api/credits/hold - Create a credit hold for a pending request
import type { VercelResponse } from '@vercel/node';
import {
  withAuthenticated,
  type AuthRequest,
} from '../_middleware/auth.js';
import {
  getAccountForUser,
  createHold,
} from '../_middleware/credits.js';

interface CreateHoldBody {
  requestId: string;
  amount: number;
  idempotencyKey: string;
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

  const userId = req.auth.user!.id;
  const body = req.body as CreateHoldBody;

  // Validate request body
  if (!body.requestId || typeof body.requestId !== 'string') {
    return res.status(400).json({ error: 'requestId is required' });
  }
  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (!body.idempotencyKey || typeof body.idempotencyKey !== 'string') {
    return res.status(400).json({ error: 'idempotencyKey is required' });
  }

  try {
    // Get account for user's company
    const account = await getAccountForUser(userId);

    if (!account) {
      return res.status(404).json({
        error: 'No credit account found',
        message: 'Your company does not have a credit account configured',
      });
    }

    // Create the hold
    const result = await createHold(account.id, body.requestId, body.amount);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating hold:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient credits')) {
        return res.status(400).json({
          error: 'Insufficient credits',
          message: error.message,
        });
      }
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({
          error: 'Duplicate request',
          message: 'A hold already exists for this request',
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
