// POST /api/auth/logout - Logout and clear session
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { sessions } from '../../src/db/schema';
import { serializeCookie, parseCookies } from '../../src/services/security';
import { COOKIE_NAMES } from '../_middleware/auth';

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

  // Note: We intentionally skip CSRF validation here for logout
  // Logout is a safe operation - at worst, an attacker logs out a user

  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[COOKIE_NAMES.session];

    // Delete session from database if it exists
    if (sessionToken) {
      const db = getDb();
      await db.delete(sessions).where(eq(sessions.token, sessionToken));
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Clear cookies by setting maxAge to 0
    res.setHeader('Set-Cookie', [
      serializeCookie(COOKIE_NAMES.session, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }),
      serializeCookie(COOKIE_NAMES.csrf, '', {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }),
      // Note: We keep the visitor cookie for conversation history
    ]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even on error
    const isProduction = process.env.NODE_ENV === 'production';

    res.setHeader('Set-Cookie', [
      serializeCookie(COOKIE_NAMES.session, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }),
      serializeCookie(COOKIE_NAMES.csrf, '', {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }),
    ]);

    return res.status(200).json({ success: true });
  }
}
