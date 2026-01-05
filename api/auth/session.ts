// GET /api/auth/session - Get current session/user info
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withAuth,
  type AuthRequest,
} from '../_middleware/auth.js';
import {
  generateCsrfToken,
  serializeCookie,
  signVisitorId,
  generateVisitorId,
  parseCookies,
  verifySignedVisitorId,
} from '../../src/services/security.js';
import { COOKIE_NAMES } from '../_middleware/auth.js';
import { SESSION_DURATION_SECONDS } from '../../src/types/auth.js';

async function handler(req: AuthRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { auth } = req;
  const isProduction = process.env.NODE_ENV === 'production';

  // Ensure visitor cookie is set (for anonymous users)
  const cookies = parseCookies(req.headers.cookie);
  let visitorId = verifySignedVisitorId(cookies[COOKIE_NAMES.visitor]);

  if (!visitorId) {
    visitorId = generateVisitorId();
    const signedVisitorId = signVisitorId(visitorId);

    res.setHeader('Set-Cookie', [
      serializeCookie(COOKIE_NAMES.visitor, signedVisitorId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
      }),
    ]);
  }

  if (auth.isAuthenticated && auth.user) {
    // Generate fresh CSRF token if needed
    let csrfToken = cookies[COOKIE_NAMES.csrf];
    if (!csrfToken) {
      csrfToken = generateCsrfToken();
      res.setHeader('Set-Cookie', [
        ...(res.getHeader('Set-Cookie') as string[] || []),
        serializeCookie(COOKIE_NAMES.csrf, csrfToken, {
          httpOnly: false,
          secure: isProduction,
          sameSite: 'Lax',
          path: '/',
          maxAge: SESSION_DURATION_SECONDS,
        }),
      ]);
    }

    return res.status(200).json({
      status: auth.user.emailVerifiedAt ? 'verified' : 'authenticated',
      user: {
        id: auth.user.id,
        email: auth.user.email,
        emailVerified: !!auth.user.emailVerifiedAt,
        profile: auth.user.profile,
      },
      permissions: auth.permissions,
      csrfToken,
    });
  }

  // Anonymous user
  return res.status(200).json({
    status: 'anonymous',
    user: null,
    visitorId,
    permissions: auth.permissions,
  });
}

export default withAuth(handler);
