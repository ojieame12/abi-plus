// GET /api/organization/me - Get current user's organization context
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withOrg } from '../_middleware/organization.js';
import type { OrgRequest } from '../_middleware/organization.js';

async function handler(req: OrgRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, teams, primaryTeam, userRole, creditAccount } = req.org;

  return res.status(200).json({
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      industry: company.industry,
      size: company.size,
      logoUrl: company.logoUrl,
    },
    teams: teams.map((t) => ({
      id: t.team.id,
      name: t.team.name,
      slug: t.team.slug,
      role: t.role,
    })),
    primaryTeam: primaryTeam ? {
      id: primaryTeam.id,
      name: primaryTeam.name,
      slug: primaryTeam.slug,
    } : null,
    userRole,
    subscription: creditAccount ? {
      tier: creditAccount.subscriptionTier,
      start: creditAccount.subscriptionStart,
      end: creditAccount.subscriptionEnd,
      totalCredits: creditAccount.totalCredits,
      bonusCredits: creditAccount.bonusCredits,
    } : null,
  });
}

export default withOrg(handler);
