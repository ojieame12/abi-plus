// Supplier Service - Query supplier data from database
// Replaces mock data with real database queries

import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, desc, sql, and, inArray, ilike, or } from 'drizzle-orm';
import {
  suppliers,
  supplierRiskScores,
  riskChanges,
  userPortfolios,
  type DbSupplier,
  type DbSupplierRiskScore,
  type DbRiskChange,
  type RiskFactorScore,
} from '../db/schema';

// ============================================
// TYPES
// ============================================

export type RiskLevel = 'low' | 'medium' | 'medium-high' | 'high' | 'unrated';
export type Trend = 'improving' | 'stable' | 'worsening';

export interface Supplier {
  id: string;
  name: string;
  duns: string | null;
  category: string;
  industry: string | null;
  location: {
    city: string | null;
    country: string;
    region: string;
  };
  spend: number;
  spendFormatted: string | null;
  criticality: string;
  revenue: string | null;
  isFollowed: boolean;
  srs: {
    score: number;
    previousScore?: number;
    level: RiskLevel;
    trend: Trend;
    lastUpdated: string;
    factors: RiskFactorScore[];
    scoreHistory: number[];
  };
}

export interface RiskPortfolio {
  totalSuppliers: number;
  totalSpend: number;
  totalSpendFormatted: string;
  distribution: {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
  };
  recentChanges: RiskChange[];
}

export interface RiskChange {
  supplierId: string;
  supplierName: string;
  previousScore: number;
  previousLevel: string;
  currentScore: number;
  currentLevel: string;
  changeDate: string;
  direction: 'improved' | 'worsened';
}

export interface SupplierFilters {
  riskLevel?: RiskLevel | RiskLevel[];
  region?: string;
  category?: string;
  minSpend?: number;
  maxSpend?: number;
  searchQuery?: string;
  userId?: string; // For portfolio filtering
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatSpend(spend: number): string {
  if (spend >= 1_000_000_000) {
    return `$${(spend / 1_000_000_000).toFixed(1)}B`;
  }
  if (spend >= 1_000_000) {
    return `$${(spend / 1_000_000).toFixed(1)}M`;
  }
  if (spend >= 1_000) {
    return `$${(spend / 1_000).toFixed(0)}K`;
  }
  return `$${spend}`;
}

function transformSupplier(
  supplier: DbSupplier,
  riskScore: DbSupplierRiskScore | null,
  isFollowed: boolean = true
): Supplier {
  return {
    id: supplier.id,
    name: supplier.name,
    duns: supplier.duns,
    category: supplier.category,
    industry: supplier.industry,
    location: {
      city: supplier.city,
      country: supplier.country,
      region: supplier.region,
    },
    spend: supplier.spend,
    spendFormatted: supplier.spendFormatted || formatSpend(supplier.spend),
    criticality: supplier.criticality,
    revenue: supplier.revenue,
    isFollowed,
    srs: {
      score: riskScore?.score ?? 0,
      previousScore: riskScore?.previousScore ?? undefined,
      level: (riskScore?.level as RiskLevel) ?? 'unrated',
      trend: (riskScore?.trend as Trend) ?? 'stable',
      lastUpdated: riskScore?.lastUpdated?.toISOString() ?? new Date().toISOString(),
      factors: (riskScore?.factors as RiskFactorScore[]) ?? [],
      scoreHistory: (riskScore?.scoreHistory as number[]) ?? [],
    },
  };
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get all suppliers in a user's portfolio
 */
export async function getPortfolioSuppliers(
  db: NeonHttpDatabase<Record<string, never>>,
  userId: string,
  filters?: SupplierFilters
): Promise<Supplier[]> {
  // Get supplier IDs in user's portfolio
  const portfolioEntries = await db
    .select({ supplierId: userPortfolios.supplierId })
    .from(userPortfolios)
    .where(eq(userPortfolios.userId, userId));

  if (portfolioEntries.length === 0) {
    return [];
  }

  const supplierIds = portfolioEntries.map(e => e.supplierId);

  // Get suppliers with their risk scores
  const results = await db
    .select({
      supplier: suppliers,
      riskScore: supplierRiskScores,
    })
    .from(suppliers)
    .leftJoin(supplierRiskScores, eq(suppliers.id, supplierRiskScores.supplierId))
    .where(inArray(suppliers.id, supplierIds));

  let supplierList = results.map(r => transformSupplier(r.supplier, r.riskScore, true));

  // Apply filters
  if (filters) {
    supplierList = applyFilters(supplierList, filters);
  }

  return supplierList;
}

/**
 * Get all suppliers (for demo without user context)
 */
export async function getAllSuppliers(
  db: NeonHttpDatabase<Record<string, never>>,
  filters?: SupplierFilters
): Promise<Supplier[]> {
  const results = await db
    .select({
      supplier: suppliers,
      riskScore: supplierRiskScores,
    })
    .from(suppliers)
    .leftJoin(supplierRiskScores, eq(suppliers.id, supplierRiskScores.supplierId));

  let supplierList = results.map(r => transformSupplier(r.supplier, r.riskScore, true));

  if (filters) {
    supplierList = applyFilters(supplierList, filters);
  }

  return supplierList;
}

/**
 * Get a single supplier by ID
 */
export async function getSupplierById(
  db: NeonHttpDatabase<Record<string, never>>,
  supplierId: string
): Promise<Supplier | null> {
  const results = await db
    .select({
      supplier: suppliers,
      riskScore: supplierRiskScores,
    })
    .from(suppliers)
    .leftJoin(supplierRiskScores, eq(suppliers.id, supplierRiskScores.supplierId))
    .where(eq(suppliers.id, supplierId))
    .limit(1);

  if (results.length === 0) return null;
  return transformSupplier(results[0].supplier, results[0].riskScore, true);
}

/**
 * Get a supplier by name (fuzzy match)
 */
export async function getSupplierByName(
  db: NeonHttpDatabase<Record<string, never>>,
  name: string
): Promise<Supplier | null> {
  const results = await db
    .select({
      supplier: suppliers,
      riskScore: supplierRiskScores,
    })
    .from(suppliers)
    .leftJoin(supplierRiskScores, eq(suppliers.id, supplierRiskScores.supplierId))
    .where(ilike(suppliers.name, `%${name}%`))
    .limit(1);

  if (results.length === 0) return null;
  return transformSupplier(results[0].supplier, results[0].riskScore, true);
}

/**
 * Get portfolio summary/overview
 */
export async function getPortfolioSummary(
  db: NeonHttpDatabase<Record<string, never>>,
  userId?: string
): Promise<RiskPortfolio> {
  // Get all suppliers (or user's portfolio if userId provided)
  const supplierList = userId
    ? await getPortfolioSuppliers(db, userId)
    : await getAllSuppliers(db);

  const totalSpend = supplierList.reduce((sum, s) => sum + s.spend, 0);

  const distribution = {
    high: supplierList.filter(s => s.srs.level === 'high').length,
    mediumHigh: supplierList.filter(s => s.srs.level === 'medium-high').length,
    medium: supplierList.filter(s => s.srs.level === 'medium').length,
    low: supplierList.filter(s => s.srs.level === 'low').length,
    unrated: supplierList.filter(s => s.srs.level === 'unrated').length,
  };

  // Get recent risk changes
  const recentChanges = await getRecentRiskChanges(db, 5);

  return {
    totalSuppliers: supplierList.length,
    totalSpend,
    totalSpendFormatted: formatSpend(totalSpend),
    distribution,
    recentChanges,
  };
}

/**
 * Get recent risk changes
 */
export async function getRecentRiskChanges(
  db: NeonHttpDatabase<Record<string, never>>,
  limit: number = 10
): Promise<RiskChange[]> {
  const changes = await db
    .select({
      change: riskChanges,
      supplier: suppliers,
    })
    .from(riskChanges)
    .innerJoin(suppliers, eq(riskChanges.supplierId, suppliers.id))
    .orderBy(desc(riskChanges.changeDate))
    .limit(limit);

  return changes
    .filter(c => c.change.direction === 'improved' || c.change.direction === 'worsened')
    .map(c => ({
      supplierId: c.change.supplierId,
      supplierName: c.supplier.name,
      previousScore: c.change.previousScore,
      previousLevel: c.change.previousLevel,
      currentScore: c.change.currentScore,
      currentLevel: c.change.currentLevel,
      changeDate: c.change.changeDate.toISOString(),
      direction: c.change.direction as 'improved' | 'worsened',
    }));
}

/**
 * Get high-risk suppliers
 */
export async function getHighRiskSuppliers(
  db: NeonHttpDatabase<Record<string, never>>,
  userId?: string
): Promise<Supplier[]> {
  const allSuppliers = userId
    ? await getPortfolioSuppliers(db, userId)
    : await getAllSuppliers(db);

  return allSuppliers.filter(s => s.srs.level === 'high' || s.srs.level === 'medium-high');
}

/**
 * Get suppliers by risk level
 */
export async function getSuppliersByRiskLevel(
  db: NeonHttpDatabase<Record<string, never>>,
  riskLevel: RiskLevel | RiskLevel[],
  userId?: string
): Promise<Supplier[]> {
  const levels = Array.isArray(riskLevel) ? riskLevel : [riskLevel];
  const allSuppliers = userId
    ? await getPortfolioSuppliers(db, userId)
    : await getAllSuppliers(db);

  return allSuppliers.filter(s => levels.includes(s.srs.level));
}

/**
 * Get suppliers by region
 */
export async function getSuppliersByRegion(
  db: NeonHttpDatabase<Record<string, never>>,
  region: string,
  userId?: string
): Promise<Supplier[]> {
  const allSuppliers = userId
    ? await getPortfolioSuppliers(db, userId)
    : await getAllSuppliers(db);

  return allSuppliers.filter(s => s.location.region === region);
}

/**
 * Get suppliers by category
 */
export async function getSuppliersByCategory(
  db: NeonHttpDatabase<Record<string, never>>,
  category: string,
  userId?: string
): Promise<Supplier[]> {
  const allSuppliers = userId
    ? await getPortfolioSuppliers(db, userId)
    : await getAllSuppliers(db);

  return allSuppliers.filter(s => s.category.toLowerCase().includes(category.toLowerCase()));
}

/**
 * Search suppliers by name
 */
export async function searchSuppliers(
  db: NeonHttpDatabase<Record<string, never>>,
  query: string,
  limit: number = 10
): Promise<Supplier[]> {
  const results = await db
    .select({
      supplier: suppliers,
      riskScore: supplierRiskScores,
    })
    .from(suppliers)
    .leftJoin(supplierRiskScores, eq(suppliers.id, supplierRiskScores.supplierId))
    .where(
      or(
        ilike(suppliers.name, `%${query}%`),
        ilike(suppliers.category, `%${query}%`),
        ilike(suppliers.country, `%${query}%`)
      )
    )
    .limit(limit);

  return results.map(r => transformSupplier(r.supplier, r.riskScore, true));
}

/**
 * Get unique categories
 */
export async function getCategories(
  db: NeonHttpDatabase<Record<string, never>>
): Promise<string[]> {
  const results = await db
    .selectDistinct({ category: suppliers.category })
    .from(suppliers);

  return results.map(r => r.category);
}

/**
 * Get unique regions
 */
export async function getRegions(
  db: NeonHttpDatabase<Record<string, never>>
): Promise<string[]> {
  const results = await db
    .selectDistinct({ region: suppliers.region })
    .from(suppliers);

  return results.map(r => r.region);
}

// ============================================
// FILTER HELPER
// ============================================

function applyFilters(supplierList: Supplier[], filters: SupplierFilters): Supplier[] {
  return supplierList.filter(supplier => {
    // Risk level filter
    if (filters.riskLevel) {
      const levels = Array.isArray(filters.riskLevel) ? filters.riskLevel : [filters.riskLevel];
      if (!levels.includes(supplier.srs.level)) return false;
    }

    // Region filter
    if (filters.region && supplier.location.region !== filters.region) {
      return false;
    }

    // Category filter
    if (filters.category && !supplier.category.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }

    // Spend range filter
    if (filters.minSpend && supplier.spend < filters.minSpend) return false;
    if (filters.maxSpend && supplier.spend > filters.maxSpend) return false;

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = `${supplier.name} ${supplier.category} ${supplier.location.country}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
}
