// Auth Middleware - Session handling, CSRF protection, permission checks
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, gt } from 'drizzle-orm';
import { sessions, users, profiles } from '../../src/db/schema';
import type { User, Profile, Session } from '../../src/db/schema';
import {
  parseCookies,
  validateCsrfToken,
  requiresCsrf,
  verifySignedVisitorId,
} from '../../src/services/security';
import { getPermissions } from '../../src/services/auth';
import type { UserPermissions, AuthState } from '../../src/types/auth';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  profile: Profile | null;
}

export interface AuthContext {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  visitorId: string | null;
  permissions: UserPermissions;
}

export interface AuthRequest extends VercelRequest {
  auth: AuthContext;
}

type Handler = (req: AuthRequest, res: VercelResponse) => Promise<void | VercelResponse>;

// ══════════════════════════════════════════════════════════════════
// Database Setup
// ══════════════════════════════════════════════════════════════════

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// ══════════════════════════════════════════════════════════════════
// Cookie Names
// ══════════════════════════════════════════════════════════════════

export const COOKIE_NAMES = {
  session: 'abi_session',
  csrf: 'abi_csrf',
  visitor: 'abi_visitor',
} as const;

// ══════════════════════════════════════════════════════════════════
// Session Extraction
// ══════════════════════════════════════════════════════════════════

/**
 * Extract session token from cookie
 */
export function extractSessionToken(req: VercelRequest): string | null {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[COOKIE_NAMES.session] || null;
}

/**
 * Extract and verify visitor ID from signed cookie
 */
export function extractVisitorId(req: VercelRequest): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const signedVisitor = cookies[COOKIE_NAMES.visitor];

  if (!signedVisitor) {
    return null;
  }

  return verifySignedVisitorId(signedVisitor);
}

/**
 * Extract CSRF token from header
 */
export function extractCsrfToken(req: VercelRequest): string | undefined {
  const headerValue = req.headers['x-csrf-token'];
  return typeof headerValue === 'string' ? headerValue : undefined;
}

// ══════════════════════════════════════════════════════════════════
// Session Validation
// ══════════════════════════════════════════════════════════════════

interface SessionWithUser {
  session: Session;
  user: User;
  profile: Profile | null;
}

/**
 * Validate session token against database
 * Returns null if session is invalid or expired
 */
export async function validateSession(token: string): Promise<SessionWithUser | null> {
  const db = getDb();

  const result = await db
    .select({
      session: sessions,
      user: users,
      profile: profiles,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

// ══════════════════════════════════════════════════════════════════
// CSRF Validation
// ══════════════════════════════════════════════════════════════════

/**
 * Validate CSRF token for state-changing requests
 */
export function validateCsrf(req: VercelRequest): boolean {
  if (!requiresCsrf(req.method || 'GET')) {
    return true;
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[COOKIE_NAMES.csrf];
  const headerToken = extractCsrfToken(req);

  return validateCsrfToken(headerToken, cookieToken);
}

// ══════════════════════════════════════════════════════════════════
// Auth Context Building
// ══════════════════════════════════════════════════════════════════

/**
 * Build auth context from request
 */
export async function getAuthContext(req: VercelRequest): Promise<AuthContext> {
  const sessionToken = extractSessionToken(req);
  const visitorId = extractVisitorId(req);

  // No session token - anonymous user
  if (!sessionToken) {
    return {
      isAuthenticated: false,
      user: null,
      visitorId,
      permissions: getPermissions(null, null),
    };
  }

  // Validate session
  const sessionData = await validateSession(sessionToken);

  if (!sessionData) {
    // Invalid/expired session
    return {
      isAuthenticated: false,
      user: null,
      visitorId,
      permissions: getPermissions(null, null),
    };
  }

  const { user, profile } = sessionData;

  return {
    isAuthenticated: true,
    user: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      profile,
    },
    visitorId, // May still be set for linking purposes
    permissions: getPermissions(user, profile),
  };
}

// ══════════════════════════════════════════════════════════════════
// Middleware Wrappers
// ══════════════════════════════════════════════════════════════════

/**
 * Wrap handler with auth context (no authentication required)
 */
export function withAuth(handler: Handler): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Validate CSRF for state-changing requests
    if (!validateCsrf(req)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    const auth = await getAuthContext(req);
    (req as AuthRequest).auth = auth;

    return handler(req as AuthRequest, res);
  };
}

/**
 * Wrap handler requiring authentication
 */
export function withAuthenticated(handler: Handler): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Validate CSRF for state-changing requests
    if (!validateCsrf(req)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    const auth = await getAuthContext(req);

    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    (req as AuthRequest).auth = auth;
    return handler(req as AuthRequest, res);
  };
}

/**
 * Wrap handler requiring verified email
 */
export function withVerified(handler: Handler): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Validate CSRF for state-changing requests
    if (!validateCsrf(req)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    const auth = await getAuthContext(req);

    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!auth.user?.emailVerifiedAt) {
      return res.status(403).json({ error: 'Email verification required' });
    }

    (req as AuthRequest).auth = auth;
    return handler(req as AuthRequest, res);
  };
}

// ══════════════════════════════════════════════════════════════════
// Permission Checks
// ══════════════════════════════════════════════════════════════════

/**
 * Check if user has required permission
 */
export function requirePermission(
  auth: AuthContext,
  permission: keyof UserPermissions
): boolean {
  return auth.permissions[permission] === true;
}

/**
 * Create permission-gated handler wrapper
 */
export function withPermission(
  permission: keyof UserPermissions,
  handler: Handler
): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  return withAuthenticated(async (req: AuthRequest, res: VercelResponse) => {
    if (!requirePermission(req.auth, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
      });
    }

    return handler(req, res);
  });
}
