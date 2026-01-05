// POST /api/auth/login - Login with email/password
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, profiles, sessions } from '../../src/db/schema.js';
import {
  verifyPassword,
  generateSessionToken,
  validateEmail,
} from '../../src/services/auth.js';
import {
  serializeCookie,
  generateCsrfToken,
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
  addTimingNoise,
  signVisitorId,
  generateVisitorId,
  parseCookies,
  verifySignedVisitorId,
} from '../../src/services/security.js';
import { COOKIE_NAMES } from '../_middleware/auth.js';
import { SESSION_DURATION_SECONDS } from '../../src/types/auth.js';

const getDb = () => {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
};

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

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
  const rateLimitResult = checkRateLimit(
    getRateLimitKey(ip, '/api/auth/login'),
    RATE_LIMITS.login
  );

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
    });
  }

  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      await addTimingNoise();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!password || typeof password !== 'string') {
      await addTimingNoise();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      await addTimingNoise();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const db = getDb();

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailValidation.normalized!))
      .limit(1);

    if (!user) {
      await addTimingNoise();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has a password (not OAuth-only)
    if (!user.passwordHash) {
      await addTimingNoise();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      await addTimingNoise();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
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
      },
      csrfToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
