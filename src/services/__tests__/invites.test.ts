// Invite Service Tests - TDD (Write tests FIRST)
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInviteCode,
  isInviteValid,
  isInviteExpired,
  isInviteFullyUsed,
  canUseInvite,
  createInviteData,
  getInviteExpiry,
  getInviteLink,
  normalizeInviteCode,
  isValidInviteCodeFormat,
} from '../invites';
import {
  createTestInvite,
  createExpiredInvite,
  createUsedUpInvite,
  resetTestCounters,
} from '../../test/auth-utils';

describe('Invite Service', () => {
  beforeEach(() => {
    resetTestCounters();
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Code Generation
  // ════════════════════════════════════════════════════════════════

  describe('generateInviteCode', () => {
    it('generates an 8-character alphanumeric code', () => {
      const code = generateInviteCode();

      expect(typeof code).toBe('string');
      expect(code.length).toBe(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('generates unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }

      expect(codes.size).toBe(100);
    });

    it('generates URL-safe codes', () => {
      const code = generateInviteCode();

      // Should not contain special URL characters
      expect(/^[A-Za-z0-9]+$/.test(code)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Expiry Check
  // ════════════════════════════════════════════════════════════════

  describe('isInviteExpired', () => {
    it('returns false for invite with future expiry', () => {
      const invite = createTestInvite({
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      });

      expect(isInviteExpired(invite)).toBe(false);
    });

    it('returns true for invite with past expiry', () => {
      const invite = createExpiredInvite();

      expect(isInviteExpired(invite)).toBe(true);
    });

    it('returns false for invite with no expiry (null)', () => {
      const invite = createTestInvite({ expiresAt: null });

      expect(isInviteExpired(invite)).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Usage Check
  // ════════════════════════════════════════════════════════════════

  describe('isInviteFullyUsed', () => {
    it('returns false when use_count < max_uses', () => {
      const invite = createTestInvite({ maxUses: 5, useCount: 3 });

      expect(isInviteFullyUsed(invite)).toBe(false);
    });

    it('returns true when use_count >= max_uses', () => {
      const invite = createUsedUpInvite();

      expect(isInviteFullyUsed(invite)).toBe(true);
    });

    it('returns true when use_count exceeds max_uses', () => {
      const invite = createTestInvite({ maxUses: 1, useCount: 2 });

      expect(isInviteFullyUsed(invite)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Can Use Invite (Combined Check)
  // ════════════════════════════════════════════════════════════════

  describe('canUseInvite', () => {
    it('returns true for valid, unexpired, not fully used invite', () => {
      const invite = createTestInvite({
        maxUses: 5,
        useCount: 2,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      const result = canUseInvite(invite);
      expect(result.canUse).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns false with error for expired invite', () => {
      const invite = createExpiredInvite();

      const result = canUseInvite(invite);
      expect(result.canUse).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('returns false with error for fully used invite', () => {
      const invite = createUsedUpInvite();

      const result = canUseInvite(invite);
      expect(result.canUse).toBe(false);
      expect(result.error).toContain('used');
    });

    it('checks expiry before usage', () => {
      // Both expired AND fully used - should report expired first
      const invite = createTestInvite({
        maxUses: 1,
        useCount: 1,
        expiresAt: new Date(Date.now() - 1000),
      });

      const result = canUseInvite(invite);
      expect(result.canUse).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Validation (Full Check)
  // ════════════════════════════════════════════════════════════════

  describe('isInviteValid', () => {
    it('returns true for valid direct invite', () => {
      const invite = createTestInvite({ type: 'direct' });

      expect(isInviteValid(invite)).toBe(true);
    });

    it('returns true for valid link invite', () => {
      const invite = createTestInvite({ type: 'link', maxUses: 10 });

      expect(isInviteValid(invite)).toBe(true);
    });

    it('returns false for expired invite', () => {
      const invite = createExpiredInvite();

      expect(isInviteValid(invite)).toBe(false);
    });

    it('returns false for fully used invite', () => {
      const invite = createUsedUpInvite();

      expect(isInviteValid(invite)).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Email-Restricted Invites
  // ════════════════════════════════════════════════════════════════

  describe('direct invite email matching', () => {
    it('direct invite with email only usable by that email', () => {
      const invite = createTestInvite({
        type: 'direct',
        email: 'specific@example.com',
      });

      const resultMatching = canUseInvite(invite, 'specific@example.com');
      expect(resultMatching.canUse).toBe(true);

      const resultDifferent = canUseInvite(invite, 'other@example.com');
      expect(resultDifferent.canUse).toBe(false);
      expect(resultDifferent.error).toContain('email');
    });

    it('direct invite without email is usable by anyone', () => {
      const invite = createTestInvite({
        type: 'direct',
        email: null,
      });

      const result = canUseInvite(invite, 'anyone@example.com');
      expect(result.canUse).toBe(true);
    });

    it('link invites ignore email restriction', () => {
      const invite = createTestInvite({
        type: 'link',
        email: null,
        maxUses: 10,
      });

      const result = canUseInvite(invite, 'anyone@example.com');
      expect(result.canUse).toBe(true);
    });

    it('email matching is case insensitive', () => {
      const invite = createTestInvite({
        type: 'direct',
        email: 'Test@Example.com',
      });

      const result = canUseInvite(invite, 'test@example.com');
      expect(result.canUse).toBe(true);
    });

    it('rejects direct invite with email restriction when forEmail not provided', () => {
      const invite = createTestInvite({
        type: 'direct',
        email: 'specific@example.com',
      });

      // Attempting to use without providing email should fail
      const result = canUseInvite(invite);
      expect(result.canUse).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Data Creation
  // ════════════════════════════════════════════════════════════════

  describe('createInviteData', () => {
    it('creates direct invite data with correct defaults', () => {
      const data = createInviteData({
        type: 'direct',
        email: 'test@example.com',
        invitedBy: 'user-123',
      });

      expect(data.type).toBe('direct');
      expect(data.email).toBe('test@example.com');
      expect(data.invitedBy).toBe('user-123');
      expect(data.maxUses).toBe(1); // default for direct
      expect(data.useCount).toBe(0);
      expect(data.code.length).toBe(8);
      expect(data.expiresAt).toBeInstanceOf(Date);
    });

    it('creates link invite data with correct defaults', () => {
      const data = createInviteData({
        type: 'link',
        invitedBy: 'user-123',
      });

      expect(data.type).toBe('link');
      expect(data.email).toBeNull();
      expect(data.maxUses).toBe(5); // default for link
    });

    it('respects custom maxUses', () => {
      const data = createInviteData({
        type: 'link',
        maxUses: 10,
      });

      expect(data.maxUses).toBe(10);
    });

    it('respects custom expiry duration', () => {
      const before = Date.now();
      const data = createInviteData({
        type: 'direct',
        expiresInSeconds: 3600, // 1 hour
      });
      const after = Date.now();

      const expiryTime = data.expiresAt.getTime();
      expect(expiryTime).toBeGreaterThanOrEqual(before + 3600 * 1000);
      expect(expiryTime).toBeLessThanOrEqual(after + 3600 * 1000);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Expiry Calculation
  // ════════════════════════════════════════════════════════════════

  describe('getInviteExpiry', () => {
    it('returns date in the future', () => {
      const expiry = getInviteExpiry(3600);
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });

    it('respects duration parameter', () => {
      const before = Date.now();
      const expiry = getInviteExpiry(60); // 60 seconds
      const after = Date.now();

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 60 * 1000);
      expect(expiry.getTime()).toBeLessThanOrEqual(after + 60 * 1000);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Link Generation
  // ════════════════════════════════════════════════════════════════

  describe('getInviteLink', () => {
    it('generates correct link format', () => {
      const link = getInviteLink('ABCD1234', 'https://app.example.com');
      expect(link).toBe('https://app.example.com/invite/ABCD1234');
    });

    it('works without base URL', () => {
      const link = getInviteLink('ABCD1234');
      expect(link).toBe('/invite/ABCD1234');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Code Normalization
  // ════════════════════════════════════════════════════════════════

  describe('normalizeInviteCode', () => {
    it('converts to uppercase', () => {
      expect(normalizeInviteCode('abcd1234')).toBe('ABCD1234');
    });

    it('trims whitespace', () => {
      expect(normalizeInviteCode('  ABCD1234  ')).toBe('ABCD1234');
    });

    it('handles mixed case', () => {
      expect(normalizeInviteCode('AbCd1234')).toBe('ABCD1234');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Code Format Validation
  // ════════════════════════════════════════════════════════════════

  describe('isValidInviteCodeFormat', () => {
    it('accepts valid 8-character alphanumeric codes', () => {
      expect(isValidInviteCodeFormat('ABCD1234')).toBe(true);
      expect(isValidInviteCodeFormat('12345678')).toBe(true);
      expect(isValidInviteCodeFormat('ABCDEFGH')).toBe(true);
    });

    it('rejects codes that are too short', () => {
      expect(isValidInviteCodeFormat('ABC1234')).toBe(false);
    });

    it('rejects codes that are too long', () => {
      expect(isValidInviteCodeFormat('ABCD12345')).toBe(false);
    });

    it('rejects codes with special characters', () => {
      expect(isValidInviteCodeFormat('ABCD-123')).toBe(false);
      expect(isValidInviteCodeFormat('ABCD_123')).toBe(false);
    });

    it('normalizes before validation', () => {
      expect(isValidInviteCodeFormat('abcd1234')).toBe(true);
      expect(isValidInviteCodeFormat('  ABCD1234  ')).toBe(true);
    });
  });
});
