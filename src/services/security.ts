// Security Service - CSRF, signed cookies, rate limiting
import crypto from 'crypto';

// ══════════════════════════════════════════════════════════════════
// CSRF Protection (Double-Submit Cookie Pattern)
// ══════════════════════════════════════════════════════════════════

const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token for double-submit cookie pattern
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate CSRF token from header matches cookie
 */
export function validateCsrfToken(headerToken: string | undefined, cookieToken: string | undefined): boolean {
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  );
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrf(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

// ══════════════════════════════════════════════════════════════════
// Signed Visitor Cookies
// ══════════════════════════════════════════════════════════════════

// Secret for signing visitor IDs (should be in env var in production)
const VISITOR_SECRET = process.env.VISITOR_COOKIE_SECRET || 'dev-visitor-secret-change-in-prod';

/**
 * Create a signed visitor ID (id.signature format)
 */
export function signVisitorId(visitorId: string): string {
  const signature = crypto
    .createHmac('sha256', VISITOR_SECRET)
    .update(visitorId)
    .digest('hex')
    .slice(0, 16); // Use first 16 chars for shorter cookie

  return `${visitorId}.${signature}`;
}

/**
 * Verify and extract visitor ID from signed cookie
 * Returns null if invalid
 */
export function verifySignedVisitorId(signedValue: string): string | null {
  if (!signedValue || !signedValue.includes('.')) {
    return null;
  }

  const lastDotIndex = signedValue.lastIndexOf('.');
  const visitorId = signedValue.slice(0, lastDotIndex);
  const signature = signedValue.slice(lastDotIndex + 1);

  if (!visitorId || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', VISITOR_SECRET)
    .update(visitorId)
    .digest('hex')
    .slice(0, 16);

  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  return isValid ? visitorId : null;
}

/**
 * Generate a new visitor ID
 */
export function generateVisitorId(): string {
  return crypto.randomUUID();
}

// ══════════════════════════════════════════════════════════════════
// Rate Limiting (In-Memory for Serverless)
// ══════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start - acceptable for serverless)
// For production, use Redis or Upstash
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (e.g., IP + endpoint)
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entry
  if (entry && now >= entry.resetAt) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    // First request in window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if limit exceeded
  if (currentEntry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  // Increment count
  currentEntry.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetAt: currentEntry.resetAt,
  };
}

/**
 * Pre-configured rate limits
 */
export const RATE_LIMITS = {
  // Login: 5 attempts per minute
  login: { maxRequests: 5, windowMs: 60 * 1000 },
  // Registration: 3 attempts per minute
  register: { maxRequests: 3, windowMs: 60 * 1000 },
  // Invite validation: 5 attempts per minute
  inviteValidate: { maxRequests: 5, windowMs: 60 * 1000 },
  // Waitlist: 3 attempts per minute
  waitlist: { maxRequests: 3, windowMs: 60 * 1000 },
  // Email verification: 3 attempts per minute
  verifyEmail: { maxRequests: 3, windowMs: 60 * 1000 },
} as const;

/**
 * Get rate limit key from request (IP + endpoint)
 */
export function getRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

/**
 * Add random delay to prevent timing attacks (for invite validation)
 */
export async function addTimingNoise(minMs = 100, maxMs = 300): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ══════════════════════════════════════════════════════════════════
// Cookie Utilities
// ══════════════════════════════════════════════════════════════════

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  path?: string;
  maxAge?: number;
  domain?: string;
}

/**
 * Serialize a cookie to Set-Cookie header format
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const {
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
    path = '/',
    maxAge,
    domain,
  } = options;

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  if (path) cookie += `; Path=${path}`;
  if (maxAge !== undefined) cookie += `; Max-Age=${maxAge}`;
  if (domain) cookie += `; Domain=${domain}`;

  return cookie;
}

/**
 * Parse cookies from Cookie header
 */
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(valueParts.join('='));
    }
  });

  return cookies;
}
