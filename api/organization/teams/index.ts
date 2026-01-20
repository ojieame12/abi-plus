// GET /api/organization/teams - List teams for company
// POST /api/organization/teams - Create a new team (admin only)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { withOrg, withOrgRole, getCompanyTeams } from '../../_middleware/organization.js';
import type { OrgRequest } from '../../_middleware/organization.js';
import { teams, teamMemberships } from '../../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// GET - List teams
async function handleGet(req: OrgRequest, res: VercelResponse) {
  const companyTeams = await getCompanyTeams(req.org.company.id);

  return res.status(200).json({
    teams: companyTeams.map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      createdAt: team.createdAt,
    })),
    total: companyTeams.length,
  });
}

// POST - Create team (admin only)
async function handlePost(req: OrgRequest, res: VercelResponse) {
  const { name, slug } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Team name is required' });
  }

  const db = getDb();
  const teamSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Check if slug already exists in company
  const existing = await db
    .select()
    .from(teams)
    .where(eq(teams.companyId, req.org.company.id))
    .limit(100);

  if (existing.some((t) => t.slug === teamSlug)) {
    return res.status(400).json({ error: 'Team slug already exists' });
  }

  // Create team
  const [newTeam] = await db
    .insert(teams)
    .values({
      companyId: req.org.company.id,
      name,
      slug: teamSlug,
    })
    .returning();

  // Add creator as owner
  await db.insert(teamMemberships).values({
    teamId: newTeam.id,
    userId: req.auth.user!.id,
    role: 'owner',
  });

  return res.status(201).json({
    team: {
      id: newTeam.id,
      name: newTeam.name,
      slug: newTeam.slug,
      createdAt: newTeam.createdAt,
    },
  });
}

async function handler(req: OrgRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET is available to all org members, POST requires admin
export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return withOrgRole(['admin', 'owner'], handler)(req, res);
  }
  return withOrg(handler)(req, res);
}
