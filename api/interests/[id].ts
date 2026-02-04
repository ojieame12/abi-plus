// DELETE /api/interests/:id - Remove an interest
// PATCH /api/interests/:id - Update an interest
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { profiles } from '../../src/db/schema.js';
import type { Interest, InterestSource } from '../../src/types/interests.js';
import { canonicalKey, cleanTopicText } from '../../src/types/interests.js';
import { computeCoverage } from '../../src/services/interestService.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

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

  const interestId = req.query.id;
  if (!interestId || typeof interestId !== 'string') {
    return res.status(400).json({ error: 'Interest ID is required' });
  }

  const db = getDb();

  const [profile] = await db
    .select({ interests: profiles.interests })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const existing = normalizeInterests(profile.interests);
  const targetIndex = existing.findIndex(i => i.id === interestId);

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Interest not found' });
  }

  if (req.method === 'DELETE') {
    const updated = existing.filter(i => i.id !== interestId);
    await db
      .update(profiles)
      .set({ interests: updated as Interest[], updatedAt: new Date() })
      .where(eq(profiles.userId, userId));

    return res.status(200).json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { text, region, grade } = req.body || {};

    const target = existing[targetIndex];

    // Merge updates
    const newText = text !== undefined ? text : target.text;
    const newRegion = region !== undefined ? (region || undefined) : target.region;
    const newGrade = grade !== undefined ? (grade || undefined) : target.grade;

    // Recompute derived fields after update
    const cleanedText = cleanTopicText(newText, newRegion, newGrade);
    const key = canonicalKey(cleanedText, { region: newRegion, grade: newGrade });
    const coverage = computeCoverage(cleanedText, newRegion, newGrade);

    const updated: Interest = {
      ...target,
      text: cleanedText,
      region: newRegion,
      grade: newGrade,
      canonicalKey: key,
      coverage,
    };

    existing[targetIndex] = updated;

    await db
      .update(profiles)
      .set({ interests: existing as Interest[], updatedAt: new Date() })
      .where(eq(profiles.userId, userId));

    return res.status(200).json(updated);
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
      if (!interest.canonicalKey) {
        interest.canonicalKey = canonicalKey(interest.text, { region: interest.region, grade: interest.grade });
      }
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
