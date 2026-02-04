// GET /api/interests - List user interests
// POST /api/interests - Add a new interest
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { profiles } from '../../src/db/schema.js';
import type { Interest, InterestSource } from '../../src/types/interests.js';
import { MAX_INTERESTS, canonicalKey, cleanTopicText } from '../../src/types/interests.js';
import { computeCoverage, isDuplicate } from '../../src/services/interestService.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// Simple auth: extract userId from session cookie or header
async function getUserId(req: VercelRequest): Promise<string | null> {
  const demoUserId = req.headers['x-demo-user-id'];
  if (demoUserId && typeof demoUserId === 'string') {
    return demoUserId;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  if (req.method === 'GET') {
    const [profile] = await db
      .select({ interests: profiles.interests })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Normalize and backfill canonicalKey + coverage on read
    const interests = normalizeInterests(profile.interests);
    return res.status(200).json(interests);
  }

  if (req.method === 'POST') {
    const { text, source, region, grade, conversationId, searchContext } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Interest text is required' });
    }

    const [profile] = await db
      .select({ interests: profiles.interests })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const existing = normalizeInterests(profile.interests);

    if (existing.length >= MAX_INTERESTS) {
      return res.status(400).json({ error: `Maximum of ${MAX_INTERESTS} interests reached` });
    }

    // Use canonical-key + token-overlap dedup (matches client logic)
    if (isDuplicate(existing, text.trim(), { region, grade })) {
      return res.status(409).json({ error: `Interest "${text}" already exists` });
    }

    // Resolve text/field conflicts and compute derived fields server-side
    const cleanedText = cleanTopicText(text.trim(), region, grade);
    const key = canonicalKey(cleanedText, { region, grade });
    const coverage = computeCoverage(cleanedText, region, grade);

    const newInterest: Interest = {
      id: `interest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: cleanedText,
      canonicalKey: key,
      source: (source as InterestSource) || 'manual',
      region: region || undefined,
      grade: grade || undefined,
      coverage,
      savedAt: new Date().toISOString(),
      conversationId: conversationId || undefined,
      searchContext: searchContext || undefined,
    };

    const updated = [...existing, newInterest];
    await db
      .update(profiles)
      .set({ interests: updated as Interest[], updatedAt: new Date() })
      .where(eq(profiles.userId, userId));

    return res.status(201).json(newInterest);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Normalize JSONB interests to Interest[] format.
 * Backfills canonicalKey + coverage for legacy entries.
 */
function normalizeInterests(raw: unknown): Interest[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((item: unknown, index: number) => {
    if (typeof item === 'object' && item !== null && 'id' in item && 'text' in item) {
      const interest = item as Interest;
      // Backfill canonicalKey if missing
      if (!interest.canonicalKey) {
        interest.canonicalKey = canonicalKey(interest.text, { region: interest.region, grade: interest.grade });
      }
      // Backfill coverage if missing
      if (!interest.coverage) {
        interest.coverage = computeCoverage(interest.text, interest.region, interest.grade);
      }
      return interest;
    }
    if (typeof item === 'string') {
      const coverage = computeCoverage(item);
      return {
        id: `legacy_${index}_${Date.now()}`,
        text: item,
        canonicalKey: canonicalKey(item),
        source: 'manual' as InterestSource,
        coverage,
        savedAt: new Date().toISOString(),
      };
    }
    return null;
  }).filter((i): i is Interest => i !== null);
}
