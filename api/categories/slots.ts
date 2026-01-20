// GET /api/categories/slots - Get company's category slot summary
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, count } from 'drizzle-orm';
import { withOrg } from '../_middleware/organization.js';
import type { OrgRequest } from '../_middleware/organization.js';
import { activatedCategories, managedCategories, categoryDomains } from '../../src/db/schema.js';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const companyId = req.org.company.id;
  const subscriptionTier = req.org.creditAccount?.subscriptionTier || 'starter';

  // Get activated categories
  const activated = await db
    .select({
      activation: activatedCategories,
      category: managedCategories,
      domain: categoryDomains,
    })
    .from(activatedCategories)
    .innerJoin(managedCategories, eq(activatedCategories.categoryId, managedCategories.id))
    .innerJoin(categoryDomains, eq(managedCategories.domainId, categoryDomains.id))
    .where(eq(activatedCategories.companyId, companyId));

  const slotLimit = SLOT_LIMITS[subscriptionTier] || SLOT_LIMITS.starter;
  const usedSlots = activated.length;
  const availableSlots = Math.max(0, slotLimit - usedSlots);

  // Group by domain
  const byDomain: Record<string, number> = {};
  activated.forEach((a) => {
    const domainName = a.domain.name;
    byDomain[domainName] = (byDomain[domainName] || 0) + 1;
  });

  return res.status(200).json({
    slots: {
      total: slotLimit,
      used: usedSlots,
      available: availableSlots,
    },
    subscriptionTier,
    activatedCategories: activated.map((a) => ({
      id: a.category.id,
      name: a.category.name,
      domain: a.domain.name,
      activatedAt: a.activation.activatedAt,
      queriesThisMonth: a.activation.queriesThisMonth,
      alertsEnabled: a.activation.alertsEnabled,
    })),
    breakdownByDomain: Object.entries(byDomain).map(([domain, count]) => ({
      domain,
      count,
    })),
  });
}

export default withOrg(handler);
