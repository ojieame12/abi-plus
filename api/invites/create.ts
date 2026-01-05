// POST /api/invites/create - Create a new invite (requires auth)
import type { VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import { invites, profiles } from '../../src/db/schema.js';
import {
  withAuthenticated,
  type AuthRequest,
} from '../_middleware/auth.js';
import { createInviteData, getInviteLink } from '../../src/services/invites.js';
import { validateEmail } from '../../src/services/auth.js';
import type { InviteType } from '../../src/types/auth.js';

const getDb = () => {
  const sqlClient = neon(process.env.DATABASE_URL!);
  return drizzle(sqlClient);
};

async function handler(req: AuthRequest, res: VercelResponse) {
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

  const { auth } = req;
  if (!auth.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { type, email } = req.body;

    // Validate invite type
    const validTypes: InviteType[] = ['direct', 'link'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid invite type' });
    }

    // For direct invites, email is required and must be normalized
    let normalizedEmail: string | null = null;
    if (type === 'direct') {
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required for direct invites' });
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.error });
      }
      normalizedEmail = emailValidation.normalized;
    }

    const db = getDb();

    // Check user has invite slots
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, auth.user.id))
      .limit(1);

    if (!profile || profile.inviteSlots <= 0) {
      return res.status(403).json({ error: 'No invite slots available' });
    }

    // Create invite data
    const inviteData = createInviteData({
      type: type as InviteType,
      email: normalizedEmail,
      invitedBy: auth.user.id,
      maxUses: type === 'direct' ? 1 : 5,
    });

    // Atomic: decrement slot and create invite in transaction-like manner
    // First decrement the slot
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        inviteSlots: sql`${profiles.inviteSlots} - 1`,
      })
      .where(
        eq(profiles.userId, auth.user.id)
      )
      .returning();

    if (!updatedProfile || updatedProfile.inviteSlots < 0) {
      // Rollback if something went wrong
      if (updatedProfile) {
        await db
          .update(profiles)
          .set({ inviteSlots: sql`${profiles.inviteSlots} + 1` })
          .where(eq(profiles.userId, auth.user.id));
      }
      return res.status(403).json({ error: 'No invite slots available' });
    }

    // Create the invite
    const [newInvite] = await db
      .insert(invites)
      .values(inviteData)
      .returning();

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const inviteLink = getInviteLink(newInvite.code, baseUrl);

    return res.status(201).json({
      invite: {
        id: newInvite.id,
        code: newInvite.code,
        type: newInvite.type,
        email: newInvite.email,
        maxUses: newInvite.maxUses,
        expiresAt: newInvite.expiresAt,
        link: inviteLink,
      },
      remainingSlots: updatedProfile.inviteSlots,
    });
  } catch (error) {
    console.error('Invite creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthenticated(handler);
