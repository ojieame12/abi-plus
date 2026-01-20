// GET /api/experts/dashboard - Get expert's own dashboard data
// Note: This endpoint is for users who ARE experts (future feature)
// For now, returns mock data or requires expert profile linking
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import { withAuthenticated } from '../_middleware/auth.js';
import type { AuthRequest } from '../_middleware/auth.js';
import { experts, expertEngagements, users, profiles } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const userId = req.auth.user!.id;

  // Get expert profile by userId (secure linkage)
  const [expert] = await db
    .select()
    .from(experts)
    .where(eq(experts.userId, userId))
    .limit(1);

  if (!expert) {
    return res.status(403).json({
      error: 'No expert profile linked to this account',
      message: 'Your account is not registered as an expert. Contact support to link your expert profile.',
    });
  }

  // Get engagements
  const engagements = await db
    .select({
      engagement: expertEngagements,
      client: {
        id: users.id,
        email: users.email,
      },
      clientProfile: {
        displayName: profiles.displayName,
        company: profiles.company,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(expertEngagements)
    .innerJoin(users, eq(expertEngagements.clientId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(expertEngagements.expertId, expert.id))
    .orderBy(desc(expertEngagements.createdAt))
    .limit(50);

  // Calculate stats
  const completedEngagements = engagements.filter((e) => e.engagement.status === 'completed');
  const pendingEngagements = engagements.filter((e) =>
    e.engagement.status === 'scheduled' || e.engagement.status === 'in_progress'
  );
  const totalEarnings = completedEngagements.reduce((sum, e) => sum + e.engagement.credits, 0);
  const averageRating = completedEngagements.length > 0
    ? completedEngagements.reduce((sum, e) => sum + (e.engagement.rating || 0), 0) / completedEngagements.length
    : 0;

  return res.status(200).json({
    expert: {
      id: expert.id,
      name: expert.name,
      title: expert.title,
      photo: expert.photo,
      availability: expert.availability,
      rating: expert.rating ? expert.rating / 10 : null,
      totalRatings: expert.totalRatings,
      isTopVoice: expert.isTopVoice,
      isVerified: expert.isVerified,
    },
    stats: {
      totalEngagements: expert.totalEngagements,
      completedEngagements: completedEngagements.length,
      pendingEngagements: pendingEngagements.length,
      totalEarnings,
      averageRating: averageRating.toFixed(1),
    },
    upcomingEngagements: pendingEngagements.slice(0, 5).map((e) => ({
      id: e.engagement.id,
      type: e.engagement.type,
      title: e.engagement.title,
      status: e.engagement.status,
      scheduledAt: e.engagement.scheduledAt,
      credits: e.engagement.credits,
      client: {
        displayName: e.clientProfile?.displayName || e.client.email.split('@')[0],
        company: e.clientProfile?.company,
        avatarUrl: e.clientProfile?.avatarUrl,
      },
    })),
    recentEngagements: completedEngagements.slice(0, 10).map((e) => ({
      id: e.engagement.id,
      type: e.engagement.type,
      title: e.engagement.title,
      completedAt: e.engagement.completedAt,
      credits: e.engagement.credits,
      rating: e.engagement.rating,
      review: e.engagement.review,
      client: {
        displayName: e.clientProfile?.displayName || e.client.email.split('@')[0],
        company: e.clientProfile?.company,
      },
    })),
  });
}

export default withAuthenticated(handler);
