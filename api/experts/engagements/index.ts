// GET /api/experts/engagements - List user's expert engagements
// POST /api/experts/engagements - Book a new engagement
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import { withAuthenticated } from '../../_middleware/auth.js';
import type { AuthRequest } from '../../_middleware/auth.js';
import { experts, expertEngagements, approvalRequests } from '../../../src/db/schema.js';
import type { ExpertEngagementType } from '../../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// GET - List user's engagements
async function handleGet(req: AuthRequest, res: VercelResponse) {
  const db = getDb();
  const userId = req.auth.user!.id;

  const engagements = await db
    .select({
      engagement: expertEngagements,
      expert: experts,
    })
    .from(expertEngagements)
    .innerJoin(experts, eq(expertEngagements.expertId, experts.id))
    .where(eq(expertEngagements.clientId, userId))
    .orderBy(desc(expertEngagements.createdAt))
    .limit(50);

  return res.status(200).json({
    engagements: engagements.map((e) => ({
      id: e.engagement.id,
      type: e.engagement.type,
      title: e.engagement.title,
      status: e.engagement.status,
      scheduledAt: e.engagement.scheduledAt,
      completedAt: e.engagement.completedAt,
      credits: e.engagement.credits,
      rating: e.engagement.rating,
      review: e.engagement.review,
      createdAt: e.engagement.createdAt,
      expert: {
        id: e.expert.id,
        name: e.expert.name,
        title: e.expert.title,
        photo: e.expert.photo,
        isTopVoice: e.expert.isTopVoice,
      },
    })),
    total: engagements.length,
  });
}

// POST - Book a new engagement
async function handlePost(req: AuthRequest, res: VercelResponse) {
  const db = getDb();
  const userId = req.auth.user!.id;

  const { expertId, type, title, scheduledAt, requestId } = req.body;

  // Validate required fields
  if (!expertId || typeof expertId !== 'string') {
    return res.status(400).json({ error: 'Expert ID is required' });
  }
  if (!type || !['consultation', 'deep_dive', 'bespoke_project'].includes(type)) {
    return res.status(400).json({ error: 'Valid engagement type is required' });
  }
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Get expert to calculate credits
  const [expert] = await db
    .select()
    .from(experts)
    .where(eq(experts.id, expertId))
    .limit(1);

  if (!expert) {
    return res.status(404).json({ error: 'Expert not found' });
  }

  // Check expert availability
  if (expert.availability === 'offline') {
    return res.status(400).json({ error: 'Expert is currently offline' });
  }

  // Calculate credits based on engagement type
  const creditMultipliers: Record<ExpertEngagementType, number> = {
    consultation: 1,
    deep_dive: 3,
    bespoke_project: 10,
  };
  const credits = expert.hourlyRate * creditMultipliers[type as ExpertEngagementType];

  // Verify approval request if provided
  if (requestId) {
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))
      .limit(1);

    if (!request) {
      return res.status(400).json({ error: 'Approval request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ error: 'Approval request is not approved' });
    }

    // Verify the request belongs to the current user
    if (request.requesterId !== userId) {
      return res.status(403).json({ error: 'Approval request does not belong to this user' });
    }
  }

  // Create engagement
  const [engagement] = await db
    .insert(expertEngagements)
    .values({
      expertId,
      clientId: userId,
      requestId: requestId || null,
      type: type as ExpertEngagementType,
      title,
      status: 'scheduled',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      credits,
    })
    .returning();

  // Update expert's total engagements
  await db
    .update(experts)
    .set({
      totalEngagements: (expert.totalEngagements || 0) + 1,
    })
    .where(eq(experts.id, expertId));

  return res.status(201).json({
    engagement: {
      id: engagement.id,
      type: engagement.type,
      title: engagement.title,
      status: engagement.status,
      scheduledAt: engagement.scheduledAt,
      credits: engagement.credits,
      createdAt: engagement.createdAt,
      expert: {
        id: expert.id,
        name: expert.name,
        title: expert.title,
        photo: expert.photo,
      },
    },
  });
}

async function handler(req: AuthRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuthenticated(handler);
