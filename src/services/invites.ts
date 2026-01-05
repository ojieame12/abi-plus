// Invite Service - Invite code management logic
import crypto from 'crypto';
import { eq, and, lt, sql, or, isNull } from 'drizzle-orm';
import type { Invite } from '../db/schema.js';
import { invites, inviteUses } from '../db/schema.js';
import type { InviteType } from '../types/auth.js';
import { INVITE_LINK_EXPIRY_SECONDS } from '../types/auth.js';

// ══════════════════════════════════════════════════════════════════
// Invite Code Generation
// ══════════════════════════════════════════════════════════════════

const INVITE_CODE_LENGTH = 8;
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, I, 1)

/**
 * Generate a random invite code (8 uppercase alphanumeric characters)
 */
export function generateInviteCode(): string {
  let code = '';
  const randomBytes = crypto.randomBytes(INVITE_CODE_LENGTH);

  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const index = randomBytes[i] % INVITE_CODE_CHARS.length;
    code += INVITE_CODE_CHARS[index];
  }

  return code;
}

// ══════════════════════════════════════════════════════════════════
// Invite Expiry Check
// ══════════════════════════════════════════════════════════════════

/**
 * Check if an invite has expired
 */
export function isInviteExpired(invite: Invite): boolean {
  if (!invite.expiresAt) {
    return false; // No expiry = never expires
  }
  return new Date() >= invite.expiresAt;
}

// ══════════════════════════════════════════════════════════════════
// Invite Usage Check
// ══════════════════════════════════════════════════════════════════

/**
 * Check if an invite has been fully used
 */
export function isInviteFullyUsed(invite: Invite): boolean {
  return invite.useCount >= invite.maxUses;
}

// ══════════════════════════════════════════════════════════════════
// Combined Invite Validation
// ══════════════════════════════════════════════════════════════════

interface CanUseInviteResult {
  canUse: boolean;
  error?: string;
}

/**
 * Check if an invite can be used for a specific email
 * IMPORTANT: forEmail is required for direct invites with email restrictions
 */
export function canUseInvite(invite: Invite, forEmail?: string): CanUseInviteResult {
  // Check expiry first
  if (isInviteExpired(invite)) {
    return { canUse: false, error: 'This invite has expired' };
  }

  // Check usage
  if (isInviteFullyUsed(invite)) {
    return { canUse: false, error: 'This invite has already been used' };
  }

  // For direct invites with an email restriction, email matching is REQUIRED
  if (invite.type === 'direct' && invite.email) {
    // If forEmail not provided, reject - prevents bypassing email check
    if (!forEmail) {
      return { canUse: false, error: 'Email is required for this invite' };
    }
    if (invite.email.toLowerCase() !== forEmail.toLowerCase()) {
      return { canUse: false, error: 'This invite is for a different email address' };
    }
  }

  return { canUse: true };
}

/**
 * Simple validity check (expired + used)
 */
export function isInviteValid(invite: Invite): boolean {
  return !isInviteExpired(invite) && !isInviteFullyUsed(invite);
}

// ══════════════════════════════════════════════════════════════════
// Invite Expiry Calculation
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate expiry date for a new invite
 */
export function getInviteExpiry(durationSeconds: number = INVITE_LINK_EXPIRY_SECONDS): Date {
  return new Date(Date.now() + durationSeconds * 1000);
}

// ══════════════════════════════════════════════════════════════════
// Invite Link Generation
// ══════════════════════════════════════════════════════════════════

/**
 * Generate a full invite link from a code
 */
export function getInviteLink(code: string, baseUrl: string = ''): string {
  return `${baseUrl}/invite/${code}`;
}

// ══════════════════════════════════════════════════════════════════
// Invite Creation Helpers
// ══════════════════════════════════════════════════════════════════

interface CreateInviteParams {
  type: InviteType;
  email?: string | null;
  invitedBy?: string | null;
  maxUses?: number;
  expiresInSeconds?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Generate invite data (for insertion into database)
 */
export function createInviteData(params: CreateInviteParams) {
  const {
    type,
    email = null,
    invitedBy = null,
    maxUses = type === 'direct' ? 1 : 5,
    expiresInSeconds = INVITE_LINK_EXPIRY_SECONDS,
    metadata = null,
  } = params;

  return {
    code: generateInviteCode(),
    type,
    email,
    invitedBy,
    maxUses,
    useCount: 0,
    expiresAt: getInviteExpiry(expiresInSeconds),
    metadata,
  };
}

// ══════════════════════════════════════════════════════════════════
// Atomic Invite Use (Database Operations)
// ══════════════════════════════════════════════════════════════════

/**
 * Build atomic update query for using an invite
 * Returns the SQL condition for conditional update
 */
export function buildAtomicUseCondition(inviteId: string) {
  return and(
    eq(invites.id, inviteId),
    lt(invites.useCount, invites.maxUses),
    or(
      isNull(invites.expiresAt),
      lt(sql`NOW()`, invites.expiresAt)
    )
  );
}

interface AtomicUseInviteResult {
  success: boolean;
  invite?: Invite;
  error?: 'expired' | 'max_uses' | 'not_found';
}

/**
 * Atomically use an invite (increment use_count with conditional update)
 * This prevents race conditions where concurrent uses exceed max_uses
 *
 * Usage:
 * ```
 * const result = await atomicUseInvite(db, inviteId, userId);
 * if (!result.success) {
 *   return error(result.error);
 * }
 * ```
 */
export async function atomicUseInvite(
  db: any, // Drizzle database instance
  inviteId: string,
  userId: string
): Promise<AtomicUseInviteResult> {
  // Try to atomically increment use_count
  const [updated] = await db
    .update(invites)
    .set({
      useCount: sql`${invites.useCount} + 1`
    })
    .where(buildAtomicUseCondition(inviteId))
    .returning();

  if (!updated) {
    // Update failed - need to determine why
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.id, inviteId));

    if (!invite) {
      return { success: false, error: 'not_found' };
    }

    if (isInviteExpired(invite)) {
      return { success: false, error: 'expired' };
    }

    if (isInviteFullyUsed(invite)) {
      return { success: false, error: 'max_uses' };
    }

    // Shouldn't reach here, but fallback
    return { success: false, error: 'not_found' };
  }

  // Record the use in invite_uses table
  try {
    await db.insert(inviteUses).values({
      inviteId,
      userId,
    });
  } catch (err: any) {
    // If unique constraint violation, user already used this invite
    if (err.code === '23505') {
      // Rollback the use_count increment
      await db
        .update(invites)
        .set({ useCount: sql`${invites.useCount} - 1` })
        .where(eq(invites.id, inviteId));

      return { success: false, error: 'max_uses' };
    }
    throw err;
  }

  return { success: true, invite: updated };
}

// ══════════════════════════════════════════════════════════════════
// Invite Code Normalization
// ══════════════════════════════════════════════════════════════════

/**
 * Normalize invite code (uppercase, trim)
 */
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Validate invite code format
 */
export function isValidInviteCodeFormat(code: string): boolean {
  const normalized = normalizeInviteCode(code);
  return /^[A-Z0-9]{8}$/.test(normalized);
}
