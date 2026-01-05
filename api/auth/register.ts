// POST /api/auth/register - Register with invite code
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, profiles, sessions, invites } from '../../src/db/schema';
import {
  hashPassword,
  generateSessionToken,
  validateEmail,
  validatePassword,
} from '../../src/services/auth';
import {
  normalizeInviteCode,
  isValidInviteCodeFormat,
  atomicUseInvite,
  canUseInvite,
} from '../../src/services/invites';
import {
  serializeCookie,
  generateCsrfToken,
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
  addTimingNoise,
  signVisitorId,
  generateVisitorId,
} from '../../src/services/security';
import { COOKIE_NAMES } from '../_middleware/auth';
import { SESSION_DURATION_SECONDS } from '../../src/types/auth';

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
    getRateLimitKey(ip, '/api/auth/register'),
    RATE_LIMITS.register
  );

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
    });
  }

  try {
    const { email, password, inviteCode } = req.body;

    // Validate invite code format first (before hitting DB)
    if (!inviteCode || typeof inviteCode !== 'string') {
      await addTimingNoise();
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const normalizedCode = normalizeInviteCode(inviteCode);
    if (!isValidInviteCodeFormat(normalizedCode)) {
      await addTimingNoise();
      return res.status(400).json({ error: 'Invalid invite code format' });
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    const db = getDb();

    // Look up invite code
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, normalizedCode))
      .limit(1);

    if (!invite) {
      await addTimingNoise();
      return res.status(400).json({ error: 'Invalid invite code' });
    }

    // Check if invite can be used for this email
    const canUseResult = canUseInvite(invite, emailValidation.normalized);
    if (!canUseResult.canUse) {
      await addTimingNoise();
      return res.status(400).json({ error: canUseResult.error });
    }

    // Check if email already registered
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailValidation.normalized!))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: emailValidation.normalized!,
        passwordHash,
        invitedBy: invite.invitedBy,
        inviteId: invite.id,
      })
      .returning();

    // Create profile
    await db.insert(profiles).values({
      userId: newUser.id,
    });

    // Atomically use the invite
    const useResult = await atomicUseInvite(db, invite.id, newUser.id);
    if (!useResult.success) {
      // Invite was used by someone else in a race - delete the user we just created
      await db.delete(users).where(eq(users.id, newUser.id));
      return res.status(400).json({ error: 'Invite code is no longer valid' });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    await db.insert(sessions).values({
      userId: newUser.id,
      token: sessionToken,
      expiresAt,
    });

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Generate visitor ID for future conversation linking
    const visitorId = generateVisitorId();
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

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        emailVerified: false,
      },
      csrfToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
