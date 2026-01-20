// GET /api/experts/[id] - Get expert profile details
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { withAuthenticated } from '../_middleware/auth.js';
import type { AuthRequest } from '../_middleware/auth.js';
import { experts, expertEngagements } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Expert ID is required' });
  }

  const db = getDb();

  // Get expert
  const [expert] = await db
    .select()
    .from(experts)
    .where(eq(experts.id, id))
    .limit(1);

  if (!expert) {
    return res.status(404).json({ error: 'Expert not found' });
  }

  // Get recent completed engagements with reviews for testimonials
  // Filter at query level and order descending by completedAt
  const recentEngagements = await db
    .select()
    .from(expertEngagements)
    .where(
      and(
        eq(expertEngagements.expertId, id),
        eq(expertEngagements.status, 'completed'),
        isNotNull(expertEngagements.review)
      )
    )
    .orderBy(desc(expertEngagements.completedAt))
    .limit(5);

  const testimonials = recentEngagements.map((e) => ({
    rating: e.rating,
    review: e.review,
    date: e.completedAt,
  }));

  return res.status(200).json({
    expert: {
      id: expert.id,
      name: expert.name,
      title: expert.title,
      photo: expert.photo,
      formerCompany: expert.formerCompany,
      formerTitle: expert.formerTitle,
      yearsExperience: expert.yearsExperience,
      specialties: expert.specialties,
      industries: expert.industries,
      regions: expert.regions,
      rating: expert.rating ? expert.rating / 10 : null,
      totalRatings: expert.totalRatings,
      totalEngagements: expert.totalEngagements,
      availability: expert.availability,
      hourlyRate: expert.hourlyRate,
      isTopVoice: expert.isTopVoice,
      isVerified: expert.isVerified,
      createdAt: expert.createdAt,
    },
    testimonials,
  });
}

export default withAuthenticated(handler);
