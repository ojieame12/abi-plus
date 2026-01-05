// Auth Middleware Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractSessionToken,
  extractVisitorId,
  extractCsrfToken,
  validateCsrf,
  COOKIE_NAMES,
} from '../../../api/_middleware/auth';
import {
  generateCsrfToken,
  signVisitorId,
  generateVisitorId,
} from '../security';

// ══════════════════════════════════════════════════════════════════
// Test Helpers
// ══════════════════════════════════════════════════════════════════

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    headers: {},
    method: 'GET',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const res: Partial<VercelResponse> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as VercelResponse;
}

// ══════════════════════════════════════════════════════════════════
// Session Extraction Tests
// ══════════════════════════════════════════════════════════════════

describe('Auth Middleware', () => {
  describe('extractSessionToken', () => {
    it('extracts session token from cookie', () => {
      const req = createMockRequest({
        headers: { cookie: `${COOKIE_NAMES.session}=test-token-123` },
      });

      expect(extractSessionToken(req)).toBe('test-token-123');
    });

    it('returns null when no cookie header', () => {
      const req = createMockRequest({ headers: {} });
      expect(extractSessionToken(req)).toBeNull();
    });

    it('returns null when session cookie not present', () => {
      const req = createMockRequest({
        headers: { cookie: 'other_cookie=value' },
      });

      expect(extractSessionToken(req)).toBeNull();
    });

    it('extracts from multiple cookies', () => {
      const req = createMockRequest({
        headers: {
          cookie: `other=foo; ${COOKIE_NAMES.session}=my-session; another=bar`,
        },
      });

      expect(extractSessionToken(req)).toBe('my-session');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Visitor ID Extraction Tests
  // ════════════════════════════════════════════════════════════════

  describe('extractVisitorId', () => {
    it('extracts and verifies valid signed visitor ID', () => {
      const visitorId = generateVisitorId();
      const signedVisitor = signVisitorId(visitorId);

      const req = createMockRequest({
        headers: { cookie: `${COOKIE_NAMES.visitor}=${signedVisitor}` },
      });

      expect(extractVisitorId(req)).toBe(visitorId);
    });

    it('returns null for tampered visitor cookie', () => {
      const req = createMockRequest({
        headers: { cookie: `${COOKIE_NAMES.visitor}=tampered.invalidsig` },
      });

      expect(extractVisitorId(req)).toBeNull();
    });

    it('returns null when visitor cookie not present', () => {
      const req = createMockRequest({ headers: {} });
      expect(extractVisitorId(req)).toBeNull();
    });

    it('returns null for unsigned visitor ID', () => {
      const req = createMockRequest({
        headers: { cookie: `${COOKIE_NAMES.visitor}=unsigned-id-no-signature` },
      });

      expect(extractVisitorId(req)).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // CSRF Token Extraction Tests
  // ════════════════════════════════════════════════════════════════

  describe('extractCsrfToken', () => {
    it('extracts CSRF token from x-csrf-token header', () => {
      const req = createMockRequest({
        headers: { 'x-csrf-token': 'csrf-token-123' },
      });

      expect(extractCsrfToken(req)).toBe('csrf-token-123');
    });

    it('returns undefined when header not present', () => {
      const req = createMockRequest({ headers: {} });
      expect(extractCsrfToken(req)).toBeUndefined();
    });

    it('returns undefined for non-string header value', () => {
      const req = createMockRequest({
        headers: { 'x-csrf-token': ['array', 'value'] as any },
      });

      expect(extractCsrfToken(req)).toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // CSRF Validation Tests
  // ════════════════════════════════════════════════════════════════

  describe('validateCsrf', () => {
    it('returns true for GET requests (no CSRF needed)', () => {
      const req = createMockRequest({ method: 'GET', headers: {} });
      expect(validateCsrf(req)).toBe(true);
    });

    it('returns true for HEAD requests', () => {
      const req = createMockRequest({ method: 'HEAD', headers: {} });
      expect(validateCsrf(req)).toBe(true);
    });

    it('returns true for OPTIONS requests', () => {
      const req = createMockRequest({ method: 'OPTIONS', headers: {} });
      expect(validateCsrf(req)).toBe(true);
    });

    it('returns true for POST with matching CSRF tokens', () => {
      const token = generateCsrfToken();
      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `${COOKIE_NAMES.csrf}=${token}`,
          'x-csrf-token': token,
        },
      });

      expect(validateCsrf(req)).toBe(true);
    });

    it('returns false for POST with mismatched CSRF tokens', () => {
      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `${COOKIE_NAMES.csrf}=cookie-token`,
          'x-csrf-token': 'different-token',
        },
      });

      expect(validateCsrf(req)).toBe(false);
    });

    it('returns false for POST without CSRF header', () => {
      const req = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `${COOKIE_NAMES.csrf}=cookie-token`,
        },
      });

      expect(validateCsrf(req)).toBe(false);
    });

    it('returns false for POST without CSRF cookie', () => {
      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-csrf-token': 'header-token',
        },
      });

      expect(validateCsrf(req)).toBe(false);
    });

    it('returns false for DELETE without CSRF', () => {
      const req = createMockRequest({ method: 'DELETE', headers: {} });
      expect(validateCsrf(req)).toBe(false);
    });

    it('returns false for PATCH without CSRF', () => {
      const req = createMockRequest({ method: 'PATCH', headers: {} });
      expect(validateCsrf(req)).toBe(false);
    });

    it('returns false for PUT without CSRF', () => {
      const req = createMockRequest({ method: 'PUT', headers: {} });
      expect(validateCsrf(req)).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // Cookie Names Constants
  // ════════════════════════════════════════════════════════════════

  describe('COOKIE_NAMES', () => {
    it('defines session cookie name', () => {
      expect(COOKIE_NAMES.session).toBe('abi_session');
    });

    it('defines csrf cookie name', () => {
      expect(COOKIE_NAMES.csrf).toBe('abi_csrf');
    });

    it('defines visitor cookie name', () => {
      expect(COOKIE_NAMES.visitor).toBe('abi_visitor');
    });
  });
});
