// PUT /api/experts/availability - Update expert's availability status
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { withAuthenticated } from '../_middleware/auth.js';
import type { AuthRequest } from '../_middleware/auth.js';
import { experts } from '../../src/db/schema.js';
import type { ExpertAvailability } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const userId = req.auth.user!.id;

  const { availability } = req.body;

  // Validate availability status
  const validStatuses: ExpertAvailability[] = ['online', 'busy', 'offline'];
  if (!availability || !validStatuses.includes(availability)) {
    return res.status(400).json({
      error: 'Invalid availability status',
      valid: validStatuses,
    });
  }

  // Get expert profile linked to user by userId (secure linkage)
  const [expert] = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId))
    .limit(1);

  if (!expert) {
    return res.status(403).json({
      error: 'No expert profile linked to this account',
      message: 'Contact support to link your expert profile.',
    });
  }

  // Update availability
  const [updated] = await db
    .update(experts)
    .set({
      availability: availability as ExpertAvailability,
    })
    .where(eq(experts.id, expert.id))
    .returning();

  return res.status(200).json({
    expert: {
      id: updated.id,
      name: updated.name,
      availability: updated.availability,
    },
    message: `Availability updated to ${availability}`,
  });
}

export default withAuthenticated(handler);
