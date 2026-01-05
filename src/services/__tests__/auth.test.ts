// Auth Service Tests - TDD (Write tests FIRST)
import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateEmail,
  validatePassword,
  validateUsername,
  getPermissions,
} from '../auth';
import {
  createTestUser,
  createVerifiedUser,
  createTestProfile,
  resetTestCounters,
  INVALID_EMAILS,
  WEAK_PASSWORDS,
  INVALID_USERNAMES,
} from '../../test/auth-utils';
import { RESERVED_USERNAMES, COMMON_PASSWORDS } from '../../types/auth';

describe('Auth Service', () => {
  beforeEach(() => {
    resetTestCounters();
  });

  // ════════════════════════════════════════════════════════════════
  // Password Hashing
  // ════════════════════════════════════════════════════════════════

  describe('hashPassword', () => {
    it('hashes a password and returns a string', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('produces different hashes for same password (salt)', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('returns false for empty password', async () => {
      const hash = await hashPassword('SecurePassword123!');
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Session Token Generation
  // ════════════════════════════════════════════════════════════════

  describe('generateSessionToken', () => {
    it('generates a 64-character hex string (32 bytes)', () => {
      const token = generateSessionToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('generates unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSessionToken());
      }

      expect(tokens.size).toBe(100);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Email Validation
  // ════════════════════════════════════════════════════════════════

  describe('validateEmail', () => {
    it('accepts valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@company.co.uk',
        'firstname.lastname@subdomain.example.com',
      ];

      for (const email of validEmails) {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('rejects invalid email formats', () => {
      for (const email of INVALID_EMAILS) {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('normalizes email to lowercase', () => {
      const result = validateEmail('Test@EXAMPLE.com');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('test@example.com');
    });

    it('trims whitespace', () => {
      const result = validateEmail('  test@example.com  ');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('test@example.com');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Password Validation
  // ════════════════════════════════════════════════════════════════

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd!',
        'Str0ng&Secure',
        'C0mpl3x!Pass',
      ];

      for (const password of strongPasswords) {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('requires minimum 8 characters', () => {
      const result = validatePassword('Short1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('rejects common passwords', () => {
      for (const password of COMMON_PASSWORDS) {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('common'))).toBe(true);
      }
    });

    it('rejects weak passwords', () => {
      for (const password of WEAK_PASSWORDS) {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Username Validation
  // ════════════════════════════════════════════════════════════════

  describe('validateUsername', () => {
    it('accepts valid usernames (alphanumeric + underscore)', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'procurement_pro',
        'JohnDoe',
        'a_b_c',
      ];

      for (const username of validUsernames) {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('rejects special characters', () => {
      const invalidUsernames = [
        'user@name',
        'user-name',
        'user.name',
        'user name',
        'user!name',
      ];

      for (const username of invalidUsernames) {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      }
    });

    it('requires 3-20 characters', () => {
      // Too short
      expect(validateUsername('ab').valid).toBe(false);
      expect(validateUsername('ab').error).toContain('3');

      // Just right (min)
      expect(validateUsername('abc').valid).toBe(true);

      // Just right (max)
      expect(validateUsername('a'.repeat(20)).valid).toBe(true);

      // Too long
      expect(validateUsername('a'.repeat(21)).valid).toBe(false);
      expect(validateUsername('a'.repeat(21)).error).toContain('20');
    });

    it('rejects reserved usernames (case insensitive)', () => {
      for (const reserved of RESERVED_USERNAMES) {
        const resultLower = validateUsername(reserved);
        const resultUpper = validateUsername(reserved.toUpperCase());

        expect(resultLower.valid).toBe(false);
        expect(resultLower.error).toContain('reserved');
        expect(resultUpper.valid).toBe(false);
      }
    });

    it('rejects invalid usernames', () => {
      for (const username of INVALID_USERNAMES) {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Permissions Calculation
  // ════════════════════════════════════════════════════════════════

  describe('getPermissions', () => {
    it('returns anonymous permissions for null user', () => {
      const permissions = getPermissions(null, null);

      expect(permissions.canAccessChat).toBe(true);
      expect(permissions.canReadCommunity).toBe(true);
      expect(permissions.canAsk).toBe(false);
      expect(permissions.canAnswer).toBe(false);
      expect(permissions.canUpvote).toBe(false);
      expect(permissions.canDownvote).toBe(false);
      expect(permissions.canInvite).toBe(false);
    });

    it('returns authenticated (unverified) permissions', () => {
      const user = createTestUser({ emailVerifiedAt: null });
      const permissions = getPermissions(user, null);

      expect(permissions.canAccessChat).toBe(true);
      expect(permissions.canReadCommunity).toBe(true);
      expect(permissions.canAsk).toBe(false);
      expect(permissions.canAnswer).toBe(false);
    });

    it('returns verified permissions (can ask/answer)', () => {
      const user = createVerifiedUser();
      const profile = createTestProfile(user.id, { reputation: 0 });
      const permissions = getPermissions(user, profile);

      expect(permissions.canAsk).toBe(true);
      expect(permissions.canAnswer).toBe(true);
      expect(permissions.canUpvote).toBe(false); // Need 50 rep
      expect(permissions.canDownvote).toBe(false); // Need 250 rep
    });

    it('gates upvoting at 50 reputation', () => {
      const user = createVerifiedUser();

      const profileLow = createTestProfile(user.id, { reputation: 49 });
      expect(getPermissions(user, profileLow).canUpvote).toBe(false);

      const profileHigh = createTestProfile(user.id, { reputation: 50 });
      expect(getPermissions(user, profileHigh).canUpvote).toBe(true);
    });

    it('gates downvoting at 250 reputation', () => {
      const user = createVerifiedUser();

      const profileLow = createTestProfile(user.id, { reputation: 249 });
      expect(getPermissions(user, profileLow).canDownvote).toBe(false);

      const profileHigh = createTestProfile(user.id, { reputation: 250 });
      expect(getPermissions(user, profileHigh).canDownvote).toBe(true);
    });

    it('gates commenting at 100 reputation', () => {
      const user = createVerifiedUser();

      const profileLow = createTestProfile(user.id, { reputation: 99 });
      expect(getPermissions(user, profileLow).canComment).toBe(false);

      const profileHigh = createTestProfile(user.id, { reputation: 100 });
      expect(getPermissions(user, profileHigh).canComment).toBe(true);
    });

    it('enables invite if user has invite slots', () => {
      const user = createVerifiedUser();

      const profileNoSlots = createTestProfile(user.id, { inviteSlots: 0 });
      expect(getPermissions(user, profileNoSlots).canInvite).toBe(false);

      const profileWithSlots = createTestProfile(user.id, { inviteSlots: 3 });
      expect(getPermissions(user, profileWithSlots).canInvite).toBe(true);
      expect(getPermissions(user, profileWithSlots).inviteSlots).toBe(3);
    });

    it('gates moderation at 1000 reputation', () => {
      const user = createVerifiedUser();

      const profileLow = createTestProfile(user.id, { reputation: 999 });
      expect(getPermissions(user, profileLow).canModerate).toBe(false);

      const profileHigh = createTestProfile(user.id, { reputation: 1000 });
      expect(getPermissions(user, profileHigh).canModerate).toBe(true);
    });
  });
});
