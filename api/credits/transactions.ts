// GET /api/credits/transactions - Get transaction history
import type { VercelResponse } from '@vercel/node';
import {
  withAuthenticated,
  type AuthRequest,
} from '../_middleware/auth.js';
import {
  getAccountForUser,
  getTransactions,
} from '../_middleware/credits.js';
import type { LedgerTransactionType } from '../../src/db/schema.js';

const VALID_TRANSACTION_TYPES: LedgerTransactionType[] = [
  'allocation',
  'spend',
  'hold_conversion',
  'refund',
  'adjustment',
  'expiry',
  'rollover',
];

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

  // Parse query parameters
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const transactionType = req.query.type as LedgerTransactionType | undefined;

  // Validate transactionType if provided
  if (transactionType && !VALID_TRANSACTION_TYPES.includes(transactionType)) {
    return res.status(400).json({
      error: 'Invalid transaction type',
      valid: VALID_TRANSACTION_TYPES,
    });
  }

  // Validate dates if provided
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({ error: 'Invalid startDate format' });
  }
  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({ error: 'Invalid endDate format' });
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

    // Get transactions
    const result = await getTransactions({
      accountId: account.id,
      limit,
      offset,
      startDate,
      endDate,
      transactionType,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuthenticated(handler);
