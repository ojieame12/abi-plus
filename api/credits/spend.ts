// POST /api/credits/spend - Direct spend (auto-approved, under threshold)
import type { VercelResponse } from '@vercel/node';
import {
  withAuthenticated,
  type AuthRequest,
} from '../_middleware/auth.js';
import {
  getAccountForUser,
  directSpend,
  DEBIT_TRANSACTION_TYPES,
} from '../_middleware/credits.js';
import type { LedgerReferenceType } from '../../src/db/schema.js';

type DebitTransactionType = (typeof DEBIT_TRANSACTION_TYPES)[number];

interface DirectSpendBody {
  amount: number;
  transactionType: DebitTransactionType;
  referenceType: LedgerReferenceType;
  referenceId: string;
  description: string;
  idempotencyKey: string;
}

// Only allow debit transaction types for the spend endpoint
// Credit types (allocation, refund, rollover) would add to balance, not spend
const VALID_TRANSACTION_TYPES: readonly string[] = DEBIT_TRANSACTION_TYPES;

const VALID_REFERENCE_TYPES: LedgerReferenceType[] = [
  'request',
  'subscription',
  'admin',
  'system',
];

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
  const body = req.body as DirectSpendBody;

  // Validate request body
  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (!body.transactionType || !VALID_TRANSACTION_TYPES.includes(body.transactionType)) {
    return res.status(400).json({
      error: 'Invalid transactionType',
      valid: VALID_TRANSACTION_TYPES,
    });
  }
  if (!body.referenceType || !VALID_REFERENCE_TYPES.includes(body.referenceType)) {
    return res.status(400).json({
      error: 'Invalid referenceType',
      valid: VALID_REFERENCE_TYPES,
    });
  }
  if (!body.referenceId || typeof body.referenceId !== 'string') {
    return res.status(400).json({ error: 'referenceId is required' });
  }
  if (!body.description || typeof body.description !== 'string') {
    return res.status(400).json({ error: 'description is required' });
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

    // Create the direct spend
    // Type is already validated above to be a valid debit type
    const result = await directSpend({
      accountId: account.id,
      amount: body.amount,
      transactionType: body.transactionType as DebitTransactionType,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      description: body.description,
      idempotencyKey: body.idempotencyKey,
      userId,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error processing spend:', error);

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
          message: 'This operation has already been processed (idempotency)',
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
