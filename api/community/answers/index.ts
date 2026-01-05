// Community Answers API - Create answer
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuthenticated, type AuthRequest } from '../../_middleware/auth.js';
import { createAnswer } from '../../../src/services/communityService.js';
import { checkAndAwardBadges } from '../../../src/services/badgeService.js';
import { updateStreak } from '../../../src/services/streakService.js';

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

  // Check permission
  if (!req.auth.permissions.canAnswer) {
    return res.status(403).json({ error: 'Insufficient permissions to answer questions' });
  }

  const { questionId, body } = req.body;

  // Validation
  if (!questionId || typeof questionId !== 'string') {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  if (!body || typeof body !== 'string' || body.trim().length < 30) {
    return res.status(400).json({ error: 'Answer must be at least 30 characters' });
  }

  const db = getDb();
  const userId = req.auth.user!.id;

  try {
    const answer = await createAnswer(db, userId, {
      questionId,
      body: body.trim(),
    });

    // Update streak and check for badges
    await updateStreak(db, userId);
    await checkAndAwardBadges(db, userId);

    return res.status(201).json(answer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Question not found') {
      return res.status(404).json({ error: 'Question not found' });
    }
    console.error('Create Answer API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthenticated(handler);
