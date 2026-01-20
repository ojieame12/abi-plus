// Organization Service - API client for organization endpoints
import type { OrgRole } from '../types/organization';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface OrgCompany {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  logoUrl: string | null;
}

export interface OrgTeam {
  id: string;
  name: string;
  slug: string;
  role?: OrgRole;
  createdAt?: string;
}

export interface OrgSubscription {
  tier: string;
  start: string;
  end: string;
  totalCredits: number;
  bonusCredits: number;
}

export interface OrgContext {
  company: OrgCompany;
  teams: OrgTeam[];
  primaryTeam: OrgTeam | null;
  userRole: OrgRole;
  subscription: OrgSubscription | null;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: OrgRole;
}

// ══════════════════════════════════════════════════════════════════
// API Helpers
// ══════════════════════════════════════════════════════════════════

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/abi_csrf=([^;]+)/);
  return match ? match[1] : null;
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = { ...options.headers };

  if (options.method && options.method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
    if (!options.headers || !(options.headers as Record<string, string>)['Content-Type']) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════════════
// API Functions
// ══════════════════════════════════════════════════════════════════

/**
 * Get current user's organization context
 */
export async function fetchOrgContext(): Promise<OrgContext> {
  return apiRequest<OrgContext>('/api/organization/me');
}

/**
 * List all teams for the company
 */
export async function fetchTeams(): Promise<{ teams: OrgTeam[]; total: number }> {
  return apiRequest<{ teams: OrgTeam[]; total: number }>('/api/organization/teams');
}

/**
 * Get members of a specific team
 */
export async function fetchTeamMembers(teamId: string): Promise<{
  team: { id: string; name: string };
  members: TeamMember[];
  total: number;
}> {
  return apiRequest(`/api/organization/teams/${teamId}/members`);
}

/**
 * Create a new team (admin only)
 */
export async function createTeam(name: string, slug?: string): Promise<{ team: OrgTeam }> {
  return apiRequest<{ team: OrgTeam }>('/api/organization/teams', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
}
