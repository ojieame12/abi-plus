// Client-side supplier data service
// Fetches from API and caches for the session

// Re-export canonical types from types/supplier.ts for compatibility
import type { Supplier, RiskChange, RiskPortfolio } from '../types/supplier';
export type { Supplier, RiskChange, RiskPortfolio };

const API_BASE = '/api/suppliers/portfolio';

// Cache for session
let cachedPortfolioData: {
  portfolio: RiskPortfolio;
  suppliers: Supplier[];
  highRiskSuppliers: Supplier[];
  riskChanges: RiskChange[];
} | null = null;

let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return cachedPortfolioData !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

/**
 * Fetch all portfolio data (cached)
 */
export async function fetchPortfolioData(): Promise<{
  portfolio: RiskPortfolio;
  suppliers: Supplier[];
  highRiskSuppliers: Supplier[];
  riskChanges: RiskChange[];
}> {
  if (isCacheValid() && cachedPortfolioData) {
    return cachedPortfolioData;
  }

  try {
    const response = await fetch(`${API_BASE}?action=portfolio`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    cachedPortfolioData = data;
    cacheTimestamp = Date.now();
    return data;
  } catch (error) {
    console.error('[SupplierDataClient] Failed to fetch portfolio:', error);
    // Return fallback data if API fails
    return getFallbackData();
  }
}

/**
 * Get portfolio summary
 */
export async function getPortfolioSummary(): Promise<RiskPortfolio> {
  const data = await fetchPortfolioData();
  return data.portfolio;
}

/**
 * Get all suppliers
 */
export async function getAllSuppliers(): Promise<Supplier[]> {
  const data = await fetchPortfolioData();
  return data.suppliers;
}

/**
 * Get high-risk suppliers
 */
export async function getHighRiskSuppliers(): Promise<Supplier[]> {
  const data = await fetchPortfolioData();
  return data.highRiskSuppliers;
}

/**
 * Get recent risk changes
 */
export async function getRecentRiskChanges(): Promise<RiskChange[]> {
  const data = await fetchPortfolioData();
  return data.riskChanges;
}

/**
 * Filter suppliers by criteria
 */
export async function filterSuppliers(filters: {
  riskLevel?: string | string[];
  region?: string;
  category?: string;
}): Promise<Supplier[]> {
  const data = await fetchPortfolioData();
  let suppliers = data.suppliers;

  if (filters.riskLevel) {
    const levels = Array.isArray(filters.riskLevel) ? filters.riskLevel : [filters.riskLevel];
    suppliers = suppliers.filter(s => levels.includes(s.srs.level));
  }

  if (filters.region) {
    suppliers = suppliers.filter(s => s.location.region === filters.region);
  }

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    suppliers = suppliers.filter(s => s.category.toLowerCase().includes(cat));
  }

  return suppliers;
}

/**
 * Search for a supplier by name
 */
export async function searchSupplier(query: string): Promise<Supplier | null> {
  try {
    const response = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.supplier || data.suppliers?.[0] || null;
  } catch (error) {
    console.error('[SupplierDataClient] Failed to search:', error);
    // Fall back to local search
    const allData = await fetchPortfolioData();
    const queryLower = query.toLowerCase();
    return allData.suppliers.find(s =>
      s.name.toLowerCase().includes(queryLower) ||
      queryLower.includes(s.name.toLowerCase())
    ) || null;
  }
}

/**
 * Get a supplier by name from cached data
 */
export async function getSupplierByName(name: string): Promise<Supplier | null> {
  const data = await fetchPortfolioData();
  const nameLower = name.toLowerCase();
  return data.suppliers.find(s =>
    s.name.toLowerCase().includes(nameLower) ||
    nameLower.includes(s.name.toLowerCase())
  ) || null;
}

/**
 * Clear cache to force refresh
 */
export function clearCache(): void {
  cachedPortfolioData = null;
  cacheTimestamp = 0;
}

/**
 * Fallback data when API is unavailable
 */
function getFallbackData(): {
  portfolio: RiskPortfolio;
  suppliers: Supplier[];
  highRiskSuppliers: Supplier[];
  riskChanges: RiskChange[];
} {
  return {
    portfolio: {
      totalSuppliers: 0,
      totalSpend: 0,
      totalSpendFormatted: '$0',
      distribution: {
        high: 0,
        mediumHigh: 0,
        medium: 0,
        low: 0,
        unrated: 0,
      },
      recentChanges: [],
    },
    suppliers: [],
    highRiskSuppliers: [],
    riskChanges: [],
  };
}

