// POST /api/waitlist/join - Join the waitlist
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { waitlist, users } from '../../src/db/schema.js';
import { validateEmail } from '../../src/services/auth.js';
import {
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
} from '../../src/services/security.js';

const getDb = () => {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    getRateLimitKey(ip, '/api/waitlist/join'),
    RATE_LIMITS.waitlist
  );

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
    });
  }

  try {
    const { email, company, jobTitle, reason, referralSource } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    const db = getDb();

    // Check if email already registered as user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailValidation.normalized!))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if already on waitlist
    const [existingWaitlist] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, emailValidation.normalized!))
      .limit(1);

    if (existingWaitlist) {
      // Don't reveal if email exists - just say success
      return res.status(200).json({
        success: true,
        message: 'You have been added to the waitlist',
      });
    }

    // Create waitlist entry
    await db.insert(waitlist).values({
      email: emailValidation.normalized!,
      company: company || null,
      jobTitle: jobTitle || null,
      reason: reason || null,
      referralSource: referralSource || null,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'You have been added to the waitlist',
    });
  } catch (error) {
    console.error('Waitlist join error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
