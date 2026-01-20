// GET /api/categories - List all managed categories with filters
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { withOrg } from '../_middleware/organization.js';
import type { OrgRequest } from '../_middleware/organization.js';
import { managedCategories, categoryDomains, activatedCategories } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function handler(req: OrgRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const companyId = req.org.company.id;

  // Parse query parameters
  const {
    domain,
    search,
    popular,
    activated,
    limit = '50',
    offset = '0',
  } = req.query;

  // Get all categories with domain info
  let categories = await db
    .select({
      category: managedCategories,
      domain: categoryDomains,
    })
    .from(managedCategories)
    .innerJoin(categoryDomains, eq(managedCategories.domainId, categoryDomains.id))
    .limit(parseInt(limit as string, 10))
    .offset(parseInt(offset as string, 10));

  // Filter by domain
  if (domain && typeof domain === 'string') {
    categories = categories.filter((c) =>
      c.domain.slug === domain || c.domain.name.toLowerCase().includes(domain.toLowerCase())
    );
  }

  // Filter by search term
  if (search && typeof search === 'string') {
    const searchTerm = search.toLowerCase();
    categories = categories.filter((c) =>
      c.category.name.toLowerCase().includes(searchTerm) ||
      c.category.description?.toLowerCase().includes(searchTerm) ||
      c.domain.name.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by popular
  if (popular === 'true') {
    categories = categories.filter((c) => c.category.isPopular);
  }

  // Get activated categories for this company
  const activatedCats = await db
    .select()
    .from(activatedCategories)
    .where(eq(activatedCategories.companyId, companyId));

  const activatedIds = new Set(activatedCats.map((a) => a.categoryId));

  // Filter by activation status
  if (activated === 'true') {
    categories = categories.filter((c) => activatedIds.has(c.category.id));
  } else if (activated === 'false') {
    categories = categories.filter((c) => !activatedIds.has(c.category.id));
  }

  // Format response
  const formattedCategories = categories.map((c) => {
    const activation = activatedCats.find((a) => a.categoryId === c.category.id);
    return {
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
      description: c.category.description,
      domain: {
        id: c.domain.id,
        name: c.domain.name,
        slug: c.domain.slug,
        icon: c.domain.icon,
        color: c.domain.color,
      },
      subDomain: c.category.subDomain,
      leadAnalyst: c.category.leadAnalystName ? {
        name: c.category.leadAnalystName,
        photo: c.category.leadAnalystPhoto,
      } : null,
      updateFrequency: c.category.updateFrequency,
      capabilities: {
        hasMarketReport: c.category.hasMarketReport,
        hasPriceIndex: c.category.hasPriceIndex,
        hasSupplierData: c.category.hasSupplierData,
      },
      responseTimeSla: c.category.responseTimeSla,
      clientCount: c.category.clientCount,
      isPopular: c.category.isPopular,
      isActivated: activatedIds.has(c.category.id),
      activation: activation ? {
        activatedAt: activation.activatedAt,
        queriesThisMonth: activation.queriesThisMonth,
        alertsEnabled: activation.alertsEnabled,
      } : null,
    };
  });

  return res.status(200).json({
    categories: formattedCategories,
    total: formattedCategories.length,
    activatedCount: activatedCats.length,
  });
}

export default withOrg(handler);
