// Accept Answer API - Mark an answer as accepted
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuthenticated, type AuthRequest } from '../../../_middleware/auth';
import { acceptAnswer } from '../../../../src/services/communityService';
import { checkAndAwardBadges } from '../../../../src/services/badgeService';
import { updateStreak } from '../../../../src/services/streakService';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  const { answerId } = req.body;
  if (!answerId || typeof answerId !== 'string') {
    return res.status(400).json({ error: 'Answer ID is required' });
  }

  const db = getDb();
  const userId = req.auth.user!.id;

  try {
    const result = await acceptAnswer(db, id, answerId, userId);

    if (!result.success) {
      return res.status(403).json({ error: 'Not authorized to accept this answer' });
    }

    // Update streak for question owner and check badges
    await updateStreak(db, userId);
    await checkAndAwardBadges(db, userId);

    // Check badges for answer author
    if (result.answerAuthorId) {
      await checkAndAwardBadges(db, result.answerAuthorId);
    }

    return res.status(200).json({
      success: true,
      acceptedAnswerId: answerId,
    });
  } catch (error) {
    console.error('Accept Answer API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthenticated(handler);
