// POST /api/invites/validate - Validate invite code
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { invites, users, profiles } from '../../src/db/schema.js';
import {
  normalizeInviteCode,
  isValidInviteCodeFormat,
  canUseInvite,
} from '../../src/services/invites.js';
import {
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
  addTimingNoise,
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

  // Rate limiting to prevent enumeration
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
  const rateLimitResult = checkRateLimit(
    getRateLimitKey(ip, '/api/invites/validate'),
    RATE_LIMITS.inviteValidate
  );

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many validation attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
    });
  }

  try {
    const { code, email } = req.body;

    // Validate code format first
    if (!code || typeof code !== 'string') {
      await addTimingNoise();
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const normalizedCode = normalizeInviteCode(code);
    if (!isValidInviteCodeFormat(normalizedCode)) {
      await addTimingNoise();
      return res.status(400).json({ error: 'Invalid invite code format' });
    }

    const db = getDb();

    // Look up invite
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, normalizedCode))
      .limit(1);

    if (!invite) {
      await addTimingNoise();
      return res.status(400).json({ error: 'Invalid invite code' });
    }

    // Check if invite can be used
    const canUseResult = canUseInvite(invite, email);
    if (!canUseResult.canUse) {
      await addTimingNoise();
      return res.status(400).json({ error: canUseResult.error });
    }

    // Get inviter info if available
    let inviter = null;
    if (invite.invitedBy) {
      const [inviterUser] = await db
        .select({
          id: users.id,
          profile: profiles,
        })
        .from(users)
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(eq(users.id, invite.invitedBy))
        .limit(1);

      if (inviterUser?.profile) {
        inviter = {
          displayName: inviterUser.profile.displayName || 'A member',
          company: inviterUser.profile.company,
          avatarUrl: inviterUser.profile.avatarUrl,
        };
      }
    }

    return res.status(200).json({
      valid: true,
      type: invite.type,
      inviter,
      // Include email restriction for direct invites
      restrictedEmail: invite.type === 'direct' ? invite.email : null,
      // Remaining uses
      remainingUses: invite.maxUses - invite.useCount,
    });
  } catch (error) {
    console.error('Invite validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
