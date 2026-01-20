// POST /api/categories/activate - Activate a category (uses a slot)
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
  const userId = req.auth.user!.id;
  const subscriptionTier = req.org.creditAccount?.subscriptionTier || 'starter';

  const { categoryId } = req.body;

  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  // Check if category exists
  const [category] = await db
    .select()
    .from(managedCategories)
    .where(eq(managedCategories.id, categoryId))
    .limit(1);

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Check if already activated
  const [existing] = await db
    .select()
    .from(activatedCategories)
    .where(
      and(
        eq(activatedCategories.categoryId, categoryId),
        eq(activatedCategories.companyId, companyId)
      )
    )
    .limit(1);

  if (existing) {
    return res.status(400).json({ error: 'Category is already activated' });
  }

  // Check slot availability
  const [{ count: currentCount }] = await db
    .select({ count: count() })
    .from(activatedCategories)
    .where(eq(activatedCategories.companyId, companyId));

  const slotLimit = SLOT_LIMITS[subscriptionTier] || SLOT_LIMITS.starter;
  const usedSlots = Number(currentCount);

  if (usedSlots >= slotLimit) {
    return res.status(400).json({
      error: 'No available slots',
      message: `Your ${subscriptionTier} plan allows ${slotLimit} categories. Upgrade your plan or deactivate a category.`,
      slots: {
        total: slotLimit,
        used: usedSlots,
        available: 0,
      },
    });
  }

  // Activate category
  const [activation] = await db
    .insert(activatedCategories)
    .values({
      categoryId,
      companyId,
      activatedBy: userId,
    })
    .returning();

  // Update category client count
  await db
    .update(managedCategories)
    .set({
      clientCount: (category.clientCount || 0) + 1,
    })
    .where(eq(managedCategories.id, categoryId));

  return res.status(201).json({
    activation: {
      id: activation.id,
      categoryId: activation.categoryId,
      activatedAt: activation.activatedAt,
      alertsEnabled: activation.alertsEnabled,
    },
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    slots: {
      total: slotLimit,
      used: usedSlots + 1,
      available: slotLimit - usedSlots - 1,
    },
  });
}

// Only admins can activate categories
export default withOrgRole(['admin', 'owner'], handler);
