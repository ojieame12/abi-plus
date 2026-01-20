// POST /api/categories/deactivate - Deactivate a category (frees a slot)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, count } from 'drizzle-orm';
import { withOrgRole } from '../_middleware/organization.js';
import type { OrgRequest } from '../_middleware/organization.js';
import { activatedCategories, managedCategories } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

// Slot limits by subscription tier (matches src/types/subscription.ts)
const SLOT_LIMITS: Record<string, number> = {
  starter: 10,
  professional: 20,
  business: 35,
  enterprise: 50,
  custom: 0, // Custom tiers have per-customer allowances
};

async function handler(req: OrgRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const companyId = req.org.company.id;
  const subscriptionTier = req.org.creditAccount?.subscriptionTier || 'starter';

  const { categoryId } = req.body;

  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  // Check if activated
  const [activation] = await db
    .select()
    .from(activatedCategories)
    .where(
      and(
        eq(activatedCategories.categoryId, categoryId),
        eq(activatedCategories.companyId, companyId)
      )
    )
    .limit(1);

  if (!activation) {
    return res.status(400).json({ error: 'Category is not activated' });
  }

  // Get category info
  const [category] = await db
    .select()
    .from(managedCategories)
    .where(eq(managedCategories.id, categoryId))
    .limit(1);

  // Deactivate category
  await db
    .delete(activatedCategories)
    .where(
      and(
        eq(activatedCategories.categoryId, categoryId),
        eq(activatedCategories.companyId, companyId)
      )
    );

  // Update category client count
  if (category && category.clientCount && category.clientCount > 0) {
    await db
      .update(managedCategories)
      .set({
        clientCount: category.clientCount - 1,
      })
      .where(eq(managedCategories.id, categoryId));
  }

  // Get updated slot count
  const [{ count: currentCount }] = await db
    .select({ count: count() })
    .from(activatedCategories)
    .where(eq(activatedCategories.companyId, companyId));

  const slotLimit = SLOT_LIMITS[subscriptionTier] || SLOT_LIMITS.starter;
  const usedSlots = Number(currentCount);

  return res.status(200).json({
    message: 'Category deactivated successfully',
    category: category ? {
      id: category.id,
      name: category.name,
      slug: category.slug,
    } : { id: categoryId },
    slots: {
      total: slotLimit,
      used: usedSlots,
      available: slotLimit - usedSlots,
    },
  });
}

// Only admins can deactivate categories
export default withOrgRole(['admin', 'owner'], handler);
