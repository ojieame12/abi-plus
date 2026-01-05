// Security Service Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateCsrfToken,
  validateCsrfToken,
  requiresCsrf,
  signVisitorId,
  verifySignedVisitorId,
  generateVisitorId,
  checkRateLimit,
  getRateLimitKey,
  addTimingNoise,
  serializeCookie,
  parseCookies,
  RATE_LIMITS,
} from '../security';
import {
  normalizeInviteCode,
  isValidInviteCodeFormat,
} from '../invites';

describe('Security Service', () => {
  // ════════════════════════════════════════════════════════════════
  // CSRF Protection
  // ════════════════════════════════════════════════════════════════

  describe('CSRF Protection', () => {
    describe('generateCsrfToken', () => {
      it('generates a 64-character hex token', () => {
        const token = generateCsrfToken();

        expect(typeof token).toBe('string');
        expect(token.length).toBe(64);
        expect(/^[a-f0-9]+$/.test(token)).toBe(true);
      });

      it('generates unique tokens', () => {
        const tokens = new Set<string>();
        for (let i = 0; i < 100; i++) {
          tokens.add(generateCsrfToken());
        }
        expect(tokens.size).toBe(100);
      });
    });

    describe('validateCsrfToken', () => {
      it('returns true for matching tokens', () => {
        const token = generateCsrfToken();
        expect(validateCsrfToken(token, token)).toBe(true);
      });

      it('returns false for mismatched tokens', () => {
        const token1 = generateCsrfToken();
        const token2 = generateCsrfToken();
        expect(validateCsrfToken(token1, token2)).toBe(false);
      });

      it('returns false if header token is undefined', () => {
        const cookieToken = generateCsrfToken();
        expect(validateCsrfToken(undefined, cookieToken)).toBe(false);
      });

      it('returns false if cookie token is undefined', () => {
        const headerToken = generateCsrfToken();
        expect(validateCsrfToken(headerToken, undefined)).toBe(false);
      });

      it('returns false for different length tokens', () => {
        expect(validateCsrfToken('short', 'longertoken')).toBe(false);
      });
    });

    describe('requiresCsrf', () => {
      it('returns false for GET requests', () => {
        expect(requiresCsrf('GET')).toBe(false);
        expect(requiresCsrf('get')).toBe(false);
      });

      it('returns false for HEAD requests', () => {
        expect(requiresCsrf('HEAD')).toBe(false);
      });

      it('returns false for OPTIONS requests', () => {
        expect(requiresCsrf('OPTIONS')).toBe(false);
      });

      it('returns true for POST requests', () => {
        expect(requiresCsrf('POST')).toBe(true);
        expect(requiresCsrf('post')).toBe(true);
      });

      it('returns true for PATCH requests', () => {
        expect(requiresCsrf('PATCH')).toBe(true);
      });

      it('returns true for DELETE requests', () => {
        expect(requiresCsrf('DELETE')).toBe(true);
      });

      it('returns true for PUT requests', () => {
        expect(requiresCsrf('PUT')).toBe(true);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Signed Visitor Cookies
  // ════════════════════════════════════════════════════════════════

  describe('Signed Visitor Cookies', () => {
    describe('generateVisitorId', () => {
      it('generates a valid UUID', () => {
        const id = generateVisitorId();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      });

      it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
          ids.add(generateVisitorId());
        }
        expect(ids.size).toBe(100);
      });
    });

    describe('signVisitorId', () => {
      it('returns id.signature format', () => {
        const id = generateVisitorId();
        const signed = signVisitorId(id);

        expect(signed).toContain('.');
        expect(signed.startsWith(id + '.')).toBe(true);
      });

      it('produces consistent signatures for same input', () => {
        const id = generateVisitorId();
        const signed1 = signVisitorId(id);
        const signed2 = signVisitorId(id);

        expect(signed1).toBe(signed2);
      });

      it('produces different signatures for different inputs', () => {
        const id1 = generateVisitorId();
        const id2 = generateVisitorId();

        const signed1 = signVisitorId(id1);
        const signed2 = signVisitorId(id2);

        const sig1 = signed1.split('.')[1];
        const sig2 = signed2.split('.')[1];

        expect(sig1).not.toBe(sig2);
      });
    });

    describe('verifySignedVisitorId', () => {
      it('returns visitor ID for valid signature', () => {
        const id = generateVisitorId();
        const signed = signVisitorId(id);

        const verified = verifySignedVisitorId(signed);
        expect(verified).toBe(id);
      });

      it('returns null for tampered ID', () => {
        const id = generateVisitorId();
        const signed = signVisitorId(id);
        const tampered = 'tampered-id.' + signed.split('.')[1];

        expect(verifySignedVisitorId(tampered)).toBeNull();
      });

      it('returns null for tampered signature', () => {
        const id = generateVisitorId();
        const signed = signVisitorId(id);
        const tampered = id + '.invalidsignature';

        expect(verifySignedVisitorId(tampered)).toBeNull();
      });

      it('returns null for missing signature', () => {
        expect(verifySignedVisitorId('id-without-signature')).toBeNull();
      });

      it('returns null for empty string', () => {
        expect(verifySignedVisitorId('')).toBeNull();
      });

      it('returns null for undefined', () => {
        expect(verifySignedVisitorId(undefined as any)).toBeNull();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Rate Limiting
  // ════════════════════════════════════════════════════════════════

  describe('Rate Limiting', () => {
    describe('checkRateLimit', () => {
      it('allows first request in window', () => {
        const key = `test-${Date.now()}`;
        const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60000 });

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
      });

      it('decrements remaining on each request', () => {
        const key = `test-decrement-${Date.now()}-${Math.random()}`;
        const config = { maxRequests: 3, windowMs: 60000 };

        const r1 = checkRateLimit(key, config);
        expect(r1.remaining).toBe(2);

        const r2 = checkRateLimit(key, config);
        expect(r2.remaining).toBe(1);

        const r3 = checkRateLimit(key, config);
        expect(r3.remaining).toBe(0);
      });

      it('blocks after max requests reached', () => {
        const key = `test-block-${Date.now()}`;
        const config = { maxRequests: 2, windowMs: 60000 };

        checkRateLimit(key, config);
        checkRateLimit(key, config);

        const blocked = checkRateLimit(key, config);
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
      });

      it('returns reset time', () => {
        const key = `test-reset-${Date.now()}`;
        const config = { maxRequests: 5, windowMs: 60000 };

        const result = checkRateLimit(key, config);
        expect(result.resetAt).toBeGreaterThan(Date.now());
        expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60000);
      });
    });

    describe('getRateLimitKey', () => {
      it('combines IP and endpoint', () => {
        const key = getRateLimitKey('192.168.1.1', '/api/auth/login');
        expect(key).toBe('192.168.1.1:/api/auth/login');
      });
    });

    describe('RATE_LIMITS config', () => {
      it('defines login limit', () => {
        expect(RATE_LIMITS.login.maxRequests).toBe(5);
        expect(RATE_LIMITS.login.windowMs).toBe(60000);
      });

      it('defines register limit', () => {
        expect(RATE_LIMITS.register.maxRequests).toBe(3);
      });

      it('defines invite validation limit', () => {
        expect(RATE_LIMITS.inviteValidate.maxRequests).toBe(5);
      });
    });

    describe('addTimingNoise', () => {
      it('adds delay within specified range', async () => {
        const start = Date.now();
        await addTimingNoise(50, 100);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(50);
        expect(elapsed).toBeLessThan(150); // Some buffer for execution time
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Cookie Utilities
  // ════════════════════════════════════════════════════════════════

  describe('Cookie Utilities', () => {
    describe('serializeCookie', () => {
      it('creates basic cookie string', () => {
        const cookie = serializeCookie('name', 'value');
        expect(cookie).toContain('name=value');
      });

      it('includes HttpOnly by default', () => {
        const cookie = serializeCookie('name', 'value');
        expect(cookie).toContain('HttpOnly');
      });

      it('includes SameSite=Lax by default', () => {
        const cookie = serializeCookie('name', 'value');
        expect(cookie).toContain('SameSite=Lax');
      });

      it('includes Path=/ by default', () => {
        const cookie = serializeCookie('name', 'value');
        expect(cookie).toContain('Path=/');
      });

      it('respects custom options', () => {
        const cookie = serializeCookie('name', 'value', {
          httpOnly: false,
          sameSite: 'Strict',
          maxAge: 3600,
        });

        expect(cookie).not.toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Strict');
        expect(cookie).toContain('Max-Age=3600');
      });

      it('URL-encodes special characters', () => {
        const cookie = serializeCookie('name', 'value with spaces');
        expect(cookie).toContain('value%20with%20spaces');
      });
    });

    describe('parseCookies', () => {
      it('parses single cookie', () => {
        const cookies = parseCookies('name=value');
        expect(cookies.name).toBe('value');
      });

      it('parses multiple cookies', () => {
        const cookies = parseCookies('a=1; b=2; c=3');
        expect(cookies.a).toBe('1');
        expect(cookies.b).toBe('2');
        expect(cookies.c).toBe('3');
      });

      it('handles URL-encoded values', () => {
        const cookies = parseCookies('name=value%20with%20spaces');
        expect(cookies.name).toBe('value with spaces');
      });

      it('returns empty object for undefined', () => {
        const cookies = parseCookies(undefined);
        expect(cookies).toEqual({});
      });

      it('returns empty object for empty string', () => {
        const cookies = parseCookies('');
        expect(cookies).toEqual({});
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Invite Code Security
  // ════════════════════════════════════════════════════════════════

  describe('Invite Code Security', () => {
    describe('normalizeInviteCode', () => {
      it('converts to uppercase', () => {
        expect(normalizeInviteCode('abc12345')).toBe('ABC12345');
      });

      it('trims whitespace', () => {
        expect(normalizeInviteCode('  ABC123  ')).toBe('ABC123');
      });

      it('handles mixed case', () => {
        expect(normalizeInviteCode('AbC12dEf')).toBe('ABC12DEF');
      });
    });

    describe('isValidInviteCodeFormat', () => {
      it('accepts valid 8-char alphanumeric code', () => {
        expect(isValidInviteCodeFormat('ABC12345')).toBe(true);
        expect(isValidInviteCodeFormat('ABCD1234')).toBe(true);
      });

      it('rejects too short codes', () => {
        expect(isValidInviteCodeFormat('ABC123')).toBe(false);
      });

      it('rejects too long codes', () => {
        expect(isValidInviteCodeFormat('ABC123456')).toBe(false);
      });

      it('rejects codes with special characters', () => {
        expect(isValidInviteCodeFormat('ABC-1234')).toBe(false);
        expect(isValidInviteCodeFormat('ABC_1234')).toBe(false);
      });

      it('accepts lowercase (after normalization)', () => {
        expect(isValidInviteCodeFormat('abc12345')).toBe(true);
      });
    });
  });
});
