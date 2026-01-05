// Community Answer Detail API - Update, Delete
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuthenticated, type AuthRequest } from '../../_middleware/auth';
import { updateAnswer, deleteAnswer } from '../../../src/services/communityService';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Answer ID is required' });
  }

  const db = getDb();
  const userId = req.auth.user!.id;

  try {
    // PATCH - Update answer (owner only)
    if (req.method === 'PATCH') {
      const { body } = req.body;

      if (!body || typeof body !== 'string' || body.trim().length < 30) {
        return res.status(400).json({ error: 'Answer must be at least 30 characters' });
      }

      const answer = await updateAnswer(db, id, userId, body.trim());

      if (!answer) {
        return res.status(403).json({ error: 'Not authorized to update this answer' });
      }

      return res.status(200).json(answer);
    }

    // DELETE - Delete answer (owner only)
    if (req.method === 'DELETE') {
      const success = await deleteAnswer(db, id, userId);

      if (!success) {
        return res.status(403).json({ error: 'Not authorized to delete this answer' });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Answer Detail API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthenticated(handler);
