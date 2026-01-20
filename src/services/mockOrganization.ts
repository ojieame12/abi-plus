// Mock organization data for P1 demo
// Company -> Teams -> Users structure

import type { Company, Team, TeamMember, OrgContext } from '../types/organization';
import { ORG_ROLES } from '../types/organization';

// Mock company: Acme Corporation
export const MOCK_COMPANY: Company = {
  id: 'comp_001',
  name: 'Acme Corporation',
  logo: '/logos/acme.svg',
  industry: 'Manufacturing',
  size: 'large',
  subscriptionId: 'sub_001',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2025-01-10T00:00:00Z',
};

// Mock teams
export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_001',
    companyId: 'comp_001',
    name: 'Direct Materials',
    description: 'Raw materials and components procurement',
    creditAllocation: 45000,
    usedCredits: 18000,
    remainingCredits: 27000,
    memberCount: 4,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'team_002',
    companyId: 'comp_001',
    name: 'Indirect Procurement',
    description: 'Services, MRO, and operational spend',
    creditAllocation: 35000,
    usedCredits: 9550,
    remainingCredits: 25450,
    memberCount: 3,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
];

// Mock team members
export const MOCK_MEMBERS: TeamMember[] = [
  // Direct Materials Team
  {
    id: 'member_001',
    userId: 'user_001',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'admin',
    roleConfig: ORG_ROLES.admin,
    displayName: 'Sarah Chen',
    email: 'sarah.chen@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    title: 'VP of Procurement',
    department: 'Procurement',
    lastActiveAt: '2025-01-15T09:30:00Z',
    joinedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'member_002',
    userId: 'user_002',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'approver',
    roleConfig: ORG_ROLES.approver,
    displayName: 'Michael Torres',
    email: 'michael.torres@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    title: 'Director, Direct Materials',
    department: 'Direct Materials',
    lastActiveAt: '2025-01-14T16:45:00Z',
    joinedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'member_003',
    userId: 'user_003',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'user',
    roleConfig: ORG_ROLES.user,
    displayName: 'Emily Watson',
    email: 'emily.watson@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    title: 'Category Manager, Metals',
    department: 'Direct Materials',
    lastActiveAt: '2025-01-15T10:15:00Z',
    joinedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'member_004',
    userId: 'user_004',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'user',
    roleConfig: ORG_ROLES.user,
    displayName: 'James Park',
    email: 'james.park@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    title: 'Category Manager, Packaging',
    department: 'Direct Materials',
    lastActiveAt: '2025-01-13T14:20:00Z',
    joinedAt: '2024-04-15T00:00:00Z',
  },

  // Indirect Procurement Team
  {
    id: 'member_005',
    userId: 'user_005',
    teamId: 'team_002',
    companyId: 'comp_001',
    role: 'approver',
    roleConfig: ORG_ROLES.approver,
    displayName: 'David Kim',
    email: 'david.kim@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    title: 'Director, Indirect Procurement',
    department: 'Indirect Procurement',
    lastActiveAt: '2025-01-15T08:00:00Z',
    joinedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'member_006',
    userId: 'user_006',
    teamId: 'team_002',
    companyId: 'comp_001',
    role: 'user',
    roleConfig: ORG_ROLES.user,
    displayName: 'Lisa Chen',
    email: 'lisa.chen@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    title: 'Category Manager, IT Services',
    department: 'Indirect Procurement',
    lastActiveAt: '2025-01-14T11:30:00Z',
    joinedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'member_007',
    userId: 'user_007',
    teamId: 'team_002',
    companyId: 'comp_001',
    role: 'user',
    roleConfig: ORG_ROLES.user,
    displayName: 'Robert Johnson',
    email: 'robert.johnson@acme.com',
    avatarUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
    title: 'Category Manager, Facilities',
    department: 'Indirect Procurement',
    lastActiveAt: '2025-01-12T15:45:00Z',
    joinedAt: '2024-06-15T00:00:00Z',
  },
];

// Current user for demo (Emily Watson - Category Manager)
export const MOCK_CURRENT_USER: TeamMember = MOCK_MEMBERS[2];

// Get full org context for current user
export function getMockOrgContext(userId?: string): OrgContext {
  const member = userId
    ? MOCK_MEMBERS.find(m => m.userId === userId) || MOCK_CURRENT_USER
    : MOCK_CURRENT_USER;

  const team = MOCK_TEAMS.find(t => t.id === member.teamId)!;

  return {
    company: MOCK_COMPANY,
    team,
    member,
    allTeams: member.role === 'admin' ? MOCK_TEAMS : undefined,
    teamMembers: MOCK_MEMBERS.filter(m => m.teamId === member.teamId),
  };
}

// Get team by ID
export function getMockTeam(teamId: string): Team | undefined {
  return MOCK_TEAMS.find(t => t.id === teamId);
}

// Get team members by team ID
export function getMockTeamMembers(teamId: string): TeamMember[] {
  return MOCK_MEMBERS.filter(m => m.teamId === teamId);
}

// Get approvers for a team (for approval workflow)
export function getMockApprovers(teamId: string): TeamMember[] {
  return MOCK_MEMBERS.filter(
    m => m.teamId === teamId && (m.role === 'approver' || m.role === 'admin')
  );
}

// Get all admins (company-wide)
export function getMockAdmins(): TeamMember[] {
  return MOCK_MEMBERS.filter(m => m.role === 'admin');
}
