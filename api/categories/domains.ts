// GET /api/categories/domains - List category domains
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc } from 'drizzle-orm';
import { withAuthenticated } from '../_middleware/auth.js';
import type { AuthRequest } from '../_middleware/auth.js';
import { categoryDomains } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: AuthRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  const domains = await db
    .select()
    .from(categoryDomains)
    .orderBy(desc(categoryDomains.categoryCount));

  return res.status(200).json({
    domains: domains.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      icon: d.icon,
      color: d.color,
      categoryCount: d.categoryCount,
    })),
    total: domains.length,
  });
}

export default withAuthenticated(handler);
