// Test utilities for auth testing

import type { User, Profile, Session, Invite, NewUser, NewProfile, NewInvite } from '../db/schema';
import type { UserPermissions } from '../types/auth';

// ══════════════════════════════════════════════════════════════════
// Factory Functions - Create test data
// ══════════════════════════════════════════════════════════════════

let userCounter = 0;
let inviteCounter = 0;

export function createTestUser(overrides: Partial<NewUser> = {}): User {
  userCounter++;
  return {
    id: `test-user-${userCounter}`,
    email: overrides.email ?? `test${userCounter}@example.com`,
    passwordHash: overrides.passwordHash ?? '$2a$10$hashedpassword',
    emailVerifiedAt: overrides.emailVerifiedAt ?? null,
    invitedBy: overrides.invitedBy ?? null,
    inviteId: overrides.inviteId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createVerifiedUser(overrides: Partial<NewUser> = {}): User {
  return createTestUser({
    ...overrides,
    emailVerifiedAt: new Date(),
  });
}

export function createTestProfile(userId: string, overrides: Partial<NewProfile> = {}): Profile {
  return {
    id: `test-profile-${userId}`,
    userId,
    username: overrides.username ?? `user_${userId.slice(-4)}`,
    displayName: overrides.displayName ?? 'Test User',
    avatarUrl: overrides.avatarUrl ?? null,
    company: overrides.company ?? null,
    jobTitle: overrides.jobTitle ?? null,
    bio: overrides.bio ?? null,
    industry: overrides.industry ?? null,
    certifications: overrides.certifications ?? null,
    interests: overrides.interests ?? null,
    reputation: overrides.reputation ?? 0,
    inviteSlots: overrides.inviteSlots ?? 0,
    isPublic: overrides.isPublic ?? true,
    anonymousDefault: overrides.anonymousDefault ?? false,
    onboardingStep: overrides.onboardingStep ?? 'profile',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createTestInvite(overrides: Partial<NewInvite> = {}): Invite {
  inviteCounter++;
  return {
    id: `test-invite-${inviteCounter}`,
    code: overrides.code ?? `INVITE${inviteCounter.toString().padStart(4, '0')}`,
    type: overrides.type ?? 'direct',
    email: overrides.email ?? null,
    invitedBy: overrides.invitedBy ?? null,
    maxUses: overrides.maxUses ?? 1,
    useCount: overrides.useCount ?? 0,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    metadata: overrides.metadata ?? null,
  };
}

export function createExpiredInvite(overrides: Partial<NewInvite> = {}): Invite {
  return createTestInvite({
    ...overrides,
    expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
  });
}

export function createUsedUpInvite(overrides: Partial<NewInvite> = {}): Invite {
  return createTestInvite({
    ...overrides,
    maxUses: 1,
    useCount: 1,
  });
}

export function createTestSession(userId: string, overrides: Partial<Session> = {}): Session {
  return {
    id: `test-session-${userId}`,
    userId,
    token: overrides.token ?? `token_${Math.random().toString(36).slice(2)}`,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdAt: new Date(),
  };
}

export function createExpiredSession(userId: string): Session {
  return createTestSession(userId, {
    expiresAt: new Date(Date.now() - 1000), // Expired
  });
}

// ══════════════════════════════════════════════════════════════════
// Permission Helpers
// ══════════════════════════════════════════════════════════════════

export function createAnonymousPermissions(): UserPermissions {
  return {
    canAccessChat: true,
    canReadCommunity: true,
    canAsk: false,
    canAnswer: false,
    canComment: false,
    canUpvote: false,
    canDownvote: false,
    canInvite: false,
    canModerate: false,
    inviteSlots: 0,
  };
}

export function createAuthenticatedPermissions(): UserPermissions {
  return {
    canAccessChat: true,
    canReadCommunity: true,
    canAsk: false, // Not verified yet
    canAnswer: false,
    canComment: false,
    canUpvote: false,
    canDownvote: false,
    canInvite: false,
    canModerate: false,
    inviteSlots: 0,
  };
}

export function createVerifiedPermissions(reputation = 0, inviteSlots = 0): UserPermissions {
  return {
    canAccessChat: true,
    canReadCommunity: true,
    canAsk: true,
    canAnswer: true,
    canComment: reputation >= 100,
    canUpvote: reputation >= 50,
    canDownvote: reputation >= 250,
    canInvite: inviteSlots > 0,
    canModerate: reputation >= 1000,
    inviteSlots,
  };
}

// ══════════════════════════════════════════════════════════════════
// Test Data Generators
// ══════════════════════════════════════════════════════════════════

export function generateValidEmail(): string {
  return `test_${Math.random().toString(36).slice(2)}@example.com`;
}

export function generateValidPassword(): string {
  return `SecurePass${Math.random().toString(36).slice(2)}!`;
}

export function generateValidUsername(): string {
  return `user_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ══════════════════════════════════════════════════════════════════
// Invalid Test Data
// ══════════════════════════════════════════════════════════════════

export const INVALID_EMAILS = [
  '',
  'notanemail',
  '@nodomain.com',
  'no@',
  'spaces in@email.com',
  'missing.domain@',
  'double@@at.com',
];

export const WEAK_PASSWORDS = [
  '',
  '1234567', // Too short
  'password', // Common
  'abcdefgh', // No numbers or special chars
  '12345678', // Common
];

export const INVALID_USERNAMES = [
  '',
  'ab', // Too short
  'a'.repeat(21), // Too long
  'has spaces',
  'has-dashes',
  'has.dots',
  'admin', // Reserved
  'ADMIN', // Reserved (case insensitive)
  '@handle', // Starts with @
  'special!chars',
];

// ══════════════════════════════════════════════════════════════════
// Reset Counter (call in beforeEach)
// ══════════════════════════════════════════════════════════════════

export function resetTestCounters(): void {
  userCounter = 0;
  inviteCounter = 0;
}
