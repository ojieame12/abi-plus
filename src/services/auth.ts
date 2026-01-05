// Auth Service - Core authentication logic
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { User, Profile } from '../db/schema.js';
import type {
  UserPermissions,
  PasswordValidation,
  EmailValidation,
  UsernameValidation,
} from '../types/auth.js';
import {
  RESERVED_USERNAMES,
  COMMON_PASSWORDS,
  REPUTATION_THRESHOLDS,
} from '../types/auth.js';

// ══════════════════════════════════════════════════════════════════
// Password Hashing
// ══════════════════════════════════════════════════════════════════

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

// ══════════════════════════════════════════════════════════════════
// Session Token Generation
// ══════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure session token (32 bytes = 64 hex chars)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ══════════════════════════════════════════════════════════════════
// Email Validation
// ══════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate and normalize an email address
 */
export function validateEmail(email: string): EmailValidation {
  const trimmed = email.trim();
  const normalized = trimmed.toLowerCase();

  if (!trimmed) {
    return { valid: false, normalized: '', error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, normalized, error: 'Invalid email format' };
  }

  return { valid: true, normalized };
}

// ══════════════════════════════════════════════════════════════════
// Password Validation
// ══════════════════════════════════════════════════════════════════

const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  // Check against common passwords (case insensitive)
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.some(common => lowerPassword === common || lowerPassword.includes(common))) {
    errors.push('Password is too common, please choose a more secure password');
  }

  // Require at least one number or special character for complexity
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ══════════════════════════════════════════════════════════════════
// Username Validation
// ══════════════════════════════════════════════════════════════════

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;

/**
 * Validate username format and availability
 */
export function validateUsername(username: string): UsernameValidation {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Check reserved usernames (case insensitive)
  const lowerUsername = username.toLowerCase();
  if (RESERVED_USERNAMES.includes(lowerUsername as any)) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
}

// ══════════════════════════════════════════════════════════════════
// Permissions Calculation
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate user permissions based on auth state and profile
 */
export function getPermissions(user: User | null, profile: Profile | null): UserPermissions {
  // Anonymous user
  if (!user) {
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

  // Authenticated but not verified
  const isVerified = !!user.emailVerifiedAt;
  if (!isVerified) {
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

  // Verified user - check reputation for additional permissions
  const reputation = profile?.reputation ?? 0;
  const inviteSlots = profile?.inviteSlots ?? 0;

  return {
    canAccessChat: true,
    canReadCommunity: true,
    canAsk: true,
    canAnswer: true,
    canComment: reputation >= REPUTATION_THRESHOLDS.comment,
    canUpvote: reputation >= REPUTATION_THRESHOLDS.upvote,
    canDownvote: reputation >= REPUTATION_THRESHOLDS.downvote,
    canInvite: inviteSlots > 0,
    canModerate: reputation >= REPUTATION_THRESHOLDS.closeReopen,
    inviteSlots,
  };
}

// ══════════════════════════════════════════════════════════════════
// Session Helpers
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate session expiry date
 */
export function getSessionExpiry(durationSeconds: number = 30 * 24 * 60 * 60): Date {
  return new Date(Date.now() + durationSeconds * 1000);
}

/**
 * Check if a session has expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

// ══════════════════════════════════════════════════════════════════
// Verification Token Helpers
// ══════════════════════════════════════════════════════════════════

/**
 * Generate a verification token (unhashed for sending to user)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a verification token for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
