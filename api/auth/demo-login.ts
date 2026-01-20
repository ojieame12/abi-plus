// POST /api/auth/demo-login - Demo mode login with persona selection
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, profiles, sessions, teamMemberships } from '../../src/db/schema.js';
import { generateSessionToken } from '../../src/services/auth.js';
import {
  serializeCookie,
  generateCsrfToken,
  signVisitorId,
  generateVisitorId,
  parseCookies,
  verifySignedVisitorId,
} from '../../src/services/security.js';
import { COOKIE_NAMES } from '../_middleware/auth.js';
import { SESSION_DURATION_SECONDS } from '../../src/types/auth.js';

// ══════════════════════════════════════════════════════════════════
// Demo User IDs (must match seed-demo.ts)
// ══════════════════════════════════════════════════════════════════

const DEMO_USER_IDS: Record<string, string> = {
  admin: '550e8400-e29b-41d4-a716-446655440010',
  approver: '550e8400-e29b-41d4-a716-446655440011',
  member: '550e8400-e29b-41d4-a716-446655440012',
};

const VALID_PERSONAS = ['admin', 'approver', 'member'] as const;
type DemoPersona = (typeof VALID_PERSONAS)[number];

// ══════════════════════════════════════════════════════════════════
// Security Guards
// ══════════════════════════════════════════════════════════════════

function isDemoModeEnabled(): boolean {
  // Allow demo mode in development or when explicitly enabled
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
}

// ══════════════════════════════════════════════════════════════════
// Database Setup
// ══════════════════════════════════════════════════════════════════

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// ══════════════════════════════════════════════════════════════════
// Handler
// ══════════════════════════════════════════════════════════════════

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Only allow in demo mode
  if (!isDemoModeEnabled()) {
    return res.status(403).json({
      error: 'Demo login is not available in production',
    });
  }

  try {
    const { persona } = req.body as { persona?: string };

    // Validate persona
    if (!persona || !VALID_PERSONAS.includes(persona as DemoPersona)) {
      return res.status(400).json({
        error: 'Invalid persona',
        valid: VALID_PERSONAS,
      });
    }

    const userId = DEMO_USER_IDS[persona];
    const db = getDb();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: 'Demo user not found. Please run: npm run seed:demo',
      });
    }

    // Get profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    // Get team membership to determine role
    const [membership] = await db
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.userId, user.id))
      .limit(1);

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Check for existing visitor cookie, or generate new one
    const cookies = parseCookies(req.headers.cookie);
    let visitorId = verifySignedVisitorId(cookies[COOKIE_NAMES.visitor]);
    if (!visitorId) {
      visitorId = generateVisitorId();
    }
    const signedVisitorId = signVisitorId(visitorId);

    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production';

    res.setHeader('Set-Cookie', [
      serializeCookie(COOKIE_NAMES.session, sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: SESSION_DURATION_SECONDS,
      }),
      serializeCookie(COOKIE_NAMES.csrf, csrfToken, {
        httpOnly: false, // Needs to be read by JS
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: SESSION_DURATION_SECONDS,
      }),
      serializeCookie(COOKIE_NAMES.visitor, signedVisitorId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
      }),
    ]);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: !!user.emailVerifiedAt,
        profile: profile || null,
        role: membership?.role || 'member',
      },
      persona,
      csrfToken,
      demoMode: true,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
