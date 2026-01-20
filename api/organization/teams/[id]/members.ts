// GET /api/organization/teams/[id]/members - List team members
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withOrg, getTeamMembers } from '../../../_middleware/organization.js';
import type { OrgRequest } from '../../../_middleware/organization.js';

async function handler(req: OrgRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  // Verify user has access to this team
  const userTeam = req.org.teams.find((t) => t.team.id === teamId);
  if (!userTeam) {
    return res.status(403).json({ error: 'Access denied to this team' });
  }

  const members = await getTeamMembers(teamId);

  return res.status(200).json({
    team: {
      id: userTeam.team.id,
      name: userTeam.team.name,
    },
    members: members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName || m.email.split('@')[0],
      email: m.email,
      avatarUrl: m.avatarUrl,
      role: m.role,
    })),
    total: members.length,
  });
}

export default withOrg(handler);
