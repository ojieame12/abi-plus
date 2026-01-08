// Community Questions API - List and Create
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { withAuth, withAuthenticated, type AuthRequest } from '../../_middleware/auth.js';
import {
  listQuestions,
  createQuestion,
} from '../../../src/services/communityService.js';
import { checkAndAwardBadges } from '../../../src/services/badgeService.js';
import { updateStreak } from '../../../src/services/streakService.js';
import { checkQuestionContent } from '../../../src/services/contentModeration.js';
import type { QuestionSortBy, QuestionFilter } from '../../../src/types/community.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();

  try {
    // GET - List questions
    if (req.method === 'GET') {
      const {
        sortBy = 'newest',
        filter = 'all',
        tag,
        search,
        page = '1',
        pageSize = '20',
      } = req.query;

      const result = await listQuestions(db, {
        sortBy: sortBy as QuestionSortBy,
        filter: filter as QuestionFilter,
        tagSlug: typeof tag === 'string' ? tag : null,
        search: typeof search === 'string' ? search : null,
        page: parseInt(page as string, 10) || 1,
        pageSize: Math.min(parseInt(pageSize as string, 10) || 20, 50),
        userId: req.auth.user?.id || null,
      });

      return res.status(200).json({
        questions: result.questions,
        totalCount: result.totalCount,
        page: parseInt(page as string, 10) || 1,
        pageSize: parseInt(pageSize as string, 10) || 20,
        hasMore: result.hasMore,
      });
    }

    // POST - Create question (requires auth)
    if (req.method === 'POST') {
      if (!req.auth.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.auth.permissions.canAsk) {
        return res.status(403).json({ error: 'Insufficient permissions to ask questions' });
      }

      const { title, body, tagIds = [], aiContextSummary } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.trim().length < 15) {
        return res.status(400).json({ error: 'Title must be at least 15 characters' });
      }

      if (!body || typeof body !== 'string' || body.trim().length < 30) {
        return res.status(400).json({ error: 'Body must be at least 30 characters' });
      }

      if (!Array.isArray(tagIds) || tagIds.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 tags allowed' });
      }

      // Server-side profanity check (hard block)
      const moderationResult = checkQuestionContent(title.trim(), body.trim());
      if (moderationResult.flagged) {
        return res.status(400).json({
          error: 'Content violates community guidelines',
          reason: moderationResult.reason,
          severity: moderationResult.severity,
        });
      }

      const question = await createQuestion(db, req.auth.user!.id, {
        title: title.trim(),
        body: body.trim(),
        tagIds,
        aiContextSummary: aiContextSummary || undefined,
      });

      // Update streak and check for badges
      await updateStreak(db, req.auth.user!.id);
      await checkAndAwardBadges(db, req.auth.user!.id);

      return res.status(201).json(question);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Questions API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
