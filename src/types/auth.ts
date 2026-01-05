// Auth-related TypeScript types

import type { User, Profile, Session, Invite } from '../db/schema';

// User permissions based on state
export interface UserPermissions {
  canAccessChat: boolean;
  canReadCommunity: boolean;
  canAsk: boolean;
  canAnswer: boolean;
  canComment: boolean;
  canUpvote: boolean;
  canDownvote: boolean;
  canInvite: boolean;
  canModerate: boolean;
  inviteSlots: number;
}

// Auth state for client
export interface AuthState {
  isLoading: boolean;
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  permissions: UserPermissions;
  visitorId: string;
}

// Computed auth status
export interface AuthStatus {
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isVerified: boolean; // email verified
  isOnboarded: boolean; // profile complete
}

// Registration input
export interface RegisterInput {
  email: string;
  password: string;
  inviteCode: string;
}

// Login input
export interface LoginInput {
  email: string;
  password: string;
}

// Session with user data (for API responses)
export interface SessionWithUser {
  session: Session;
  user: User;
  profile: Profile | null;
  permissions: UserPermissions;
}

// Invite validation result
export interface InviteValidation {
  valid: boolean;
  invite?: Invite;
  inviter?: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  error?: string;
}

// Waitlist entry input
export interface WaitlistInput {
  email: string;
  company?: string;
  jobTitle?: string;
  reason?: string;
  referralSource?: string;
}

// Verification token types
export type VerificationTokenType = 'email_verify' | 'password_reset';

// Invite types
export type InviteType = 'direct' | 'link' | 'company';

// Waitlist status
export type WaitlistStatus = 'pending' | 'approved' | 'rejected';

// Onboarding steps
export type OnboardingStep = 'profile' | 'interests' | 'complete';

// Password validation result
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

// Email validation result
export interface EmailValidation {
  valid: boolean;
  normalized: string;
  error?: string;
}

// Username validation result
export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

// API error response
export interface AuthError {
  error: string;
  code?: string;
  field?: string;
}

// API success response types
export interface RegisterResponse {
  user: User;
  profile: Profile;
  session: Session;
}

export interface LoginResponse {
  user: User;
  profile: Profile | null;
  session: Session;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: User;
  profile?: Profile;
  permissions: UserPermissions;
  visitorId?: string;
}

// Reserved usernames that cannot be registered
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'mod',
  'moderator',
  'system',
  'support',
  'help',
  'info',
  'contact',
  'api',
  'www',
  'mail',
  'email',
  'root',
  'null',
  'undefined',
  'anonymous',
  'guest',
  'user',
  'abi',
  'abiplus',
  'abi_plus', // underscore version (hyphens not allowed in usernames)
  'community',
  'settings',
  'profile',
  'account',
] as const;

// Common passwords to reject
export const COMMON_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'letmein',
  'welcome',
  'admin123',
  'iloveyou',
  'sunshine',
] as const;

// Reputation thresholds for permissions
export const REPUTATION_THRESHOLDS = {
  upvote: 50,
  comment: 100,
  downvote: 250,
  suggestEdit: 500,
  closeReopen: 1000,
} as const;

// Session duration in seconds (30 days)
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

// Verification token expiry in seconds (24 hours)
export const VERIFICATION_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24;

// Password reset token expiry in seconds (1 hour)
export const PASSWORD_RESET_EXPIRY_SECONDS = 60 * 60;

// Invite link expiry in seconds (7 days)
export const INVITE_LINK_EXPIRY_SECONDS = 60 * 60 * 24 * 7;
