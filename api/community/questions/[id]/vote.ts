// Question Vote API - Cast or remove votes
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuthenticated, type AuthRequest } from '../../../_middleware/auth';
import { castVote, removeVote } from '../../../../src/services/communityService';
import { checkAndAwardBadges } from '../../../../src/services/badgeService';
import type { VoteValue } from '../../../../src/types/community';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  const db = getDb();
  const userId = req.auth.user!.id;

  try {
    // POST - Cast vote
    if (req.method === 'POST') {
      const { value } = req.body;

      if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: 'Vote value must be 1 or -1' });
      }

      // Check permissions
      if (value === 1 && !req.auth.permissions.canUpvote) {
        return res.status(403).json({
          error: 'Insufficient reputation to upvote',
          required: 50,
        });
      }

      if (value === -1 && !req.auth.permissions.canDownvote) {
        return res.status(403).json({
          error: 'Insufficient reputation to downvote',
          required: 250,
        });
      }

      const result = await castVote(db, userId, 'question', id, value as VoteValue);

      if (!result.success) {
        return res.status(400).json({ error: 'Cannot vote on this question' });
      }

      // Check for badges (for the question author, not the voter)
      // This is handled in castVote via reputation updates

      return res.status(200).json({
        success: true,
        newScore: result.newScore,
        userVote: result.userVote,
      });
    }

    // DELETE - Remove vote
    if (req.method === 'DELETE') {
      const result = await removeVote(db, userId, 'question', id);

      return res.status(200).json({
        success: true,
        newScore: result.newScore,
        userVote: result.userVote,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Question Vote API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthenticated(handler);
