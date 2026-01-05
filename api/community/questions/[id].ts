// Community Question Detail API - Get, Update, Delete
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuth, type AuthRequest } from '../../_middleware/auth.js';
import {
  getQuestionById,
  getAnswersForQuestion,
  updateQuestion,
  deleteQuestion,
  incrementViewCount,
} from '../../../src/services/communityService.js';
import type { QuestionWithAnswers } from '../../../src/types/community.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  const db = getDb();

  try {
    // GET - Get question with answers
    if (req.method === 'GET') {
      const userId = req.auth.user?.id || null;
      const question = await getQuestionById(db, id, userId);

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Increment view count (fire and forget)
      incrementViewCount(db, id).catch(console.error);

      // Get answers
      const answers = await getAnswersForQuestion(db, id, userId);

      const response: QuestionWithAnswers = {
        ...question,
        answers,
      };

      return res.status(200).json(response);
    }

    // PATCH - Update question (owner only)
    if (req.method === 'PATCH') {
      if (!req.auth.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, body, tagIds } = req.body;

      // Validation
      if (title !== undefined && (typeof title !== 'string' || title.trim().length < 15)) {
        return res.status(400).json({ error: 'Title must be at least 15 characters' });
      }

      if (body !== undefined && (typeof body !== 'string' || body.trim().length < 30)) {
        return res.status(400).json({ error: 'Body must be at least 30 characters' });
      }

      if (tagIds !== undefined && (!Array.isArray(tagIds) || tagIds.length > 5)) {
        return res.status(400).json({ error: 'Maximum 5 tags allowed' });
      }

      const question = await updateQuestion(db, id, req.auth.user!.id, {
        title: title?.trim(),
        body: body?.trim(),
        tagIds,
      });

      if (!question) {
        return res.status(403).json({ error: 'Not authorized to update this question' });
      }

      return res.status(200).json(question);
    }

    // DELETE - Delete question (owner only)
    if (req.method === 'DELETE') {
      if (!req.auth.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const success = await deleteQuestion(db, id, req.auth.user!.id);

      if (!success) {
        return res.status(403).json({ error: 'Not authorized to delete this question' });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Question Detail API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
