// Leaderboard API - Get rankings and top contributors
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuth, type AuthRequest } from '../../_middleware/auth';
import { getReputationLeaderboard, getTopContributors, type LeaderboardPeriod } from '../../../src/services/leaderboardService';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  // Get current user if authenticated (optional for leaderboard)
  const userId = req.auth.user?.id;

  const { type = 'reputation', period = 'all-time', limit = '10' } = req.query;

  // Validate period
  const validPeriods: LeaderboardPeriod[] = ['week', 'month', 'all-time'];
  const periodValue = (Array.isArray(period) ? period[0] : period) as LeaderboardPeriod;
  if (!validPeriods.includes(periodValue)) {
    return res.status(400).json({ error: 'Invalid period. Use: week, month, or all-time' });
  }

  const limitValue = Math.min(Math.max(parseInt(Array.isArray(limit) ? limit[0] : limit) || 10, 1), 50);

  try {
    const typeValue = Array.isArray(type) ? type[0] : type;

    if (typeValue === 'contributors') {
      const entries = await getTopContributors(db, {
        period: periodValue,
        limit: limitValue,
      });
      return res.status(200).json({ entries });
    }

    // Default: reputation leaderboard
    const result = await getReputationLeaderboard(db, {
      period: periodValue,
      limit: limitValue,
      userId,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
