// GET /api/experts - List available experts with filters
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or, ilike, sql } from 'drizzle-orm';
import { withAuthenticated } from '../_middleware/auth.js';
import type { AuthRequest } from '../_middleware/auth.js';
import { experts } from '../../src/db/schema.js';
import type { ExpertAvailability } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  // Parse query parameters
  const {
    specialty,
    industry,
    region,
    availability,
    topVoice,
    search,
    limit = '20',
    offset = '0',
  } = req.query;

  // Build conditions
  const conditions = [];

  if (availability && typeof availability === 'string') {
    conditions.push(eq(experts.availability, availability as ExpertAvailability));
  }

  if (topVoice === 'true') {
    conditions.push(eq(experts.isTopVoice, true));
  }

  // Get all experts and filter in memory for JSONB fields
  let results = await db
    .select()
    .from(experts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${experts.isTopVoice} DESC, ${experts.rating} DESC`)
    .limit(parseInt(limit as string, 10))
    .offset(parseInt(offset as string, 10));

  // Filter by specialty (JSONB array)
  if (specialty && typeof specialty === 'string') {
    const searchTerm = specialty.toLowerCase();
    results = results.filter((e) =>
      e.specialties.some((s) => s.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by industry (JSONB array)
  if (industry && typeof industry === 'string') {
    const searchTerm = industry.toLowerCase();
    results = results.filter((e) =>
      e.industries.some((i) => i.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by region (JSONB array)
  if (region && typeof region === 'string') {
    const searchTerm = region.toLowerCase();
    results = results.filter((e) =>
      e.regions.some((r) => r.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by search term
  if (search && typeof search === 'string') {
    const searchTerm = search.toLowerCase();
    results = results.filter((e) =>
      e.name.toLowerCase().includes(searchTerm) ||
      e.title.toLowerCase().includes(searchTerm) ||
      e.formerCompany.toLowerCase().includes(searchTerm) ||
      e.specialties.some((s) => s.toLowerCase().includes(searchTerm))
    );
  }

  // Format response
  const formattedExperts = results.map((e) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    photo: e.photo,
    formerCompany: e.formerCompany,
    formerTitle: e.formerTitle,
    yearsExperience: e.yearsExperience,
    specialties: e.specialties,
    industries: e.industries,
    regions: e.regions,
    rating: e.rating ? e.rating / 10 : null, // Convert from 10x back to decimal
    totalRatings: e.totalRatings,
    totalEngagements: e.totalEngagements,
    availability: e.availability,
    hourlyRate: e.hourlyRate,
    isTopVoice: e.isTopVoice,
    isVerified: e.isVerified,
  }));

  return res.status(200).json({
    experts: formattedExperts,
    total: formattedExperts.length,
  });
}

export default withAuthenticated(handler);
