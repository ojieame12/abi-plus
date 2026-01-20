// Organization hierarchy types
// Company -> Teams -> Users
// Roles: Admin, Approver, User

export type OrgRole = 'member' | 'approver' | 'admin' | 'owner' | 'user';

export interface OrgRoleConfig {
  id: OrgRole;
  name: string;
  description: string;
  canRequest: boolean;
  canApprove: boolean;
  canAllocate: boolean;
  canViewAllTeams: boolean;
  approvalLimit?: number;  // Max amount they can approve (undefined = unlimited)
}

export const ORG_ROLES: Record<OrgRole, OrgRoleConfig> = {
  owner: {
    id: 'owner',
    name: 'Owner',
    description: 'Organization owner with full access',
    canRequest: true,
    canApprove: true,
    canAllocate: true,
    canViewAllTeams: true,
    approvalLimit: undefined,  // Can approve any amount
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Manages credit allocation across teams',
    canRequest: true,
    canApprove: true,
    canAllocate: true,
    canViewAllTeams: true,
    approvalLimit: undefined,  // Can approve any amount
  },
  approver: {
    id: 'approver',
    name: 'Approver',
    description: 'Authorizes high-credit requests for their team',
    canRequest: true,
    canApprove: true,
    canAllocate: false,
    canViewAllTeams: false,
    approvalLimit: 5000,  // Can approve up to $5,000
  },
  member: {
    id: 'member',
    name: 'Member',
    description: 'Team member who can view and request',
    canRequest: true,
    canApprove: false,
    canAllocate: false,
    canViewAllTeams: false,
  },
  user: {
    id: 'user',
    name: 'User',
    description: 'Consumes intelligence and requests upgrades',
    canRequest: true,
    canApprove: false,
    canAllocate: false,
    canViewAllTeams: false,
  },
};

// Company (top-level organization)
export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  subscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

// Team within a company
export interface Team {
  id: string;
  companyId: string;
  name: string;
  description?: string;

  // Credit allocation
  creditAllocation: number;   // Credits allocated to this team
  usedCredits: number;
  remainingCredits: number;

  // Members
  memberCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Team member (user with role)
export interface TeamMember {
  id: string;

  // Relationships
  userId: string;
  teamId: string;
  companyId: string;

  // Role
  role: OrgRole;
  roleConfig: OrgRoleConfig;

  // Profile info (denormalized for convenience)
  displayName: string;
  email: string;
  avatarUrl?: string;
  title?: string;             // Job title
  department?: string;

  // Activity
  lastActiveAt?: string;
  joinedAt: string;
}

// Current user's org context (for app state)
export interface OrgContext {
  company: Company;
  team: Team;
  member: TeamMember;
  allTeams?: Team[];          // Only populated for admins
  teamMembers?: TeamMember[]; // Members of current team
}

// Helper to check if user can approve a specific amount
export function canApproveAmount(role: OrgRole, amount: number): boolean {
  const config = ORG_ROLES[role];
  if (!config.canApprove) return false;
  if (config.approvalLimit === undefined) return true;
  return amount <= config.approvalLimit;
}

// Helper to get role display info
export function getRoleDisplay(role: OrgRole): { name: string; color: string } {
  switch (role) {
    case 'owner':
      return { name: 'Owner', color: 'text-emerald-600 bg-emerald-50' };
    case 'admin':
      return { name: 'Admin', color: 'text-violet-600 bg-violet-50' };
    case 'approver':
      return { name: 'Approver', color: 'text-amber-600 bg-amber-50' };
    case 'member':
      return { name: 'Member', color: 'text-blue-600 bg-blue-50' };
    case 'user':
    default:
      return { name: 'User', color: 'text-slate-600 bg-slate-50' };
  }
}
