// Organization Middleware - Company/Team context resolution
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import {
  companies,
  teams,
  teamMemberships,
  creditAccounts,
} from '../../src/db/schema.js';
import type {
  Company,
  Team,
  TeamMembership,
  CreditAccount,
} from '../../src/db/schema.js';
import type { AuthContext, AuthRequest } from './auth.js';
import { withAuthenticated, getAuthContext, validateCsrf } from './auth.js';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export type OrgRole = 'member' | 'approver' | 'admin' | 'owner';

export interface OrgContext {
  company: Company;
  teams: Array<{
    team: Team;
    role: OrgRole;
  }>;
  primaryTeam: Team | null;
  userRole: OrgRole;
  creditAccount: CreditAccount | null;
}

export interface OrgRequest extends AuthRequest {
  org: OrgContext;
}

type OrgHandler = (req: OrgRequest, res: VercelResponse) => Promise<void | VercelResponse>;

// ══════════════════════════════════════════════════════════════════
// Database Setup
// ══════════════════════════════════════════════════════════════════

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// ══════════════════════════════════════════════════════════════════
// Organization Context Resolution
// ══════════════════════════════════════════════════════════════════

/**
 * Get organization context for authenticated user
 */
export async function getOrgContext(userId: string): Promise<OrgContext | null> {
  const db = getDb();

  // Get all team memberships for user
  const memberships = await db
    .select({
      membership: teamMemberships,
      team: teams,
      company: companies,
    })
    .from(teamMemberships)
    .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
    .innerJoin(companies, eq(teams.companyId, companies.id))
    .where(eq(teamMemberships.userId, userId));

  if (memberships.length === 0) {
    return null;
  }

  // All memberships should be for the same company (for now)
  const company = memberships[0].company;

  // Get credit account for company
  const creditAccountResults = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.companyId, company.id))
    .limit(1);

  const creditAccount = creditAccountResults[0] || null;

  // Map team memberships
  const userTeams = memberships.map((m) => ({
    team: m.team,
    role: m.membership.role as OrgRole,
  }));

  // Determine highest role
  const roleHierarchy: OrgRole[] = ['member', 'approver', 'admin', 'owner'];
  const userRole = userTeams.reduce((highest, t) => {
    const currentIndex = roleHierarchy.indexOf(t.role);
    const highestIndex = roleHierarchy.indexOf(highest);
    return currentIndex > highestIndex ? t.role : highest;
  }, 'member' as OrgRole);

  // Primary team is the first one (could be enhanced to store preference)
  const primaryTeam = userTeams[0]?.team || null;

  return {
    company,
    teams: userTeams,
    primaryTeam,
    userRole,
    creditAccount,
  };
}

/**
 * Get user's role in the organization
 */
export async function getUserRole(userId: string): Promise<OrgRole | null> {
  const orgContext = await getOrgContext(userId);
  return orgContext?.userRole || null;
}

// ══════════════════════════════════════════════════════════════════
// Middleware Wrappers
// ══════════════════════════════════════════════════════════════════

/**
 * Wrap handler requiring organization context
 */
export function withOrg(handler: OrgHandler): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  return withAuthenticated(async (req: AuthRequest, res: VercelResponse) => {
    if (!req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const orgContext = await getOrgContext(req.auth.user.id);

    if (!orgContext) {
      return res.status(403).json({ error: 'No organization membership found' });
    }

    (req as OrgRequest).org = orgContext;
    return handler(req as OrgRequest, res);
  });
}

/**
 * Wrap handler requiring specific organization role
 */
export function withOrgRole(
  roles: OrgRole[],
  handler: OrgHandler
): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  return withOrg(async (req: OrgRequest, res: VercelResponse) => {
    if (!roles.includes(req.org.userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.org.userRole,
      });
    }

    return handler(req, res);
  });
}

/**
 * Check if user has required role
 */
export function requireRole(roles: OrgRole[], userRole: OrgRole): boolean {
  return roles.includes(userRole);
}

// ══════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════

/**
 * Get all members of a team
 */
export async function getTeamMembers(teamId: string): Promise<Array<{
  userId: string;
  role: OrgRole;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}>> {
  const db = getDb();
  const { users, profiles } = await import('../../src/db/schema.js');

  const members = await db
    .select({
      userId: teamMemberships.userId,
      role: teamMemberships.role,
      email: users.email,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(teamMemberships)
    .innerJoin(users, eq(teamMemberships.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(teamMemberships.teamId, teamId));

  return members.map((m) => ({
    userId: m.userId,
    role: m.role as OrgRole,
    displayName: m.displayName,
    email: m.email,
    avatarUrl: m.avatarUrl,
  }));
}

/**
 * Get all teams for a company
 */
export async function getCompanyTeams(companyId: string): Promise<Team[]> {
  const db = getDb();

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.companyId, companyId));

  return result;
}
