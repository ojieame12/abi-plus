// POST /api/requests/expire - Process expirations (cron job endpoint)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processExpirations } from '../_middleware/approvals.js';

// Secret for cron job authentication
const CRON_SECRET = process.env.CRON_SECRET;

async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret for authenticated cron jobs
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await processExpirations();

    return res.status(200).json({
      success: true,
      expiredCount: result.expiredCount,
      expiredIds: result.expiredIds,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing expirations:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default handler;
