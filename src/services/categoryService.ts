// Category Service - API client for managed categories endpoints

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface CategoryDomain {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  categoryCount: number | null;
}

export interface CategoryActivation {
  activatedAt: string;
  queriesThisMonth: number | null;
  alertsEnabled: boolean | null;
}

export interface ManagedCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  domain: CategoryDomain;
  subDomain: string | null;
  leadAnalyst: {
    name: string;
    photo: string | null;
  } | null;
  updateFrequency: string;
  capabilities: {
    hasMarketReport: boolean | null;
    hasPriceIndex: boolean | null;
    hasSupplierData: boolean | null;
  };
  responseTimeSla: string | null;
  clientCount: number | null;
  isPopular: boolean | null;
  isActivated: boolean;
  activation: CategoryActivation | null;
}

export interface CategoryFilters {
  domain?: string;
  search?: string;
  popular?: boolean;
  activated?: boolean;
  limit?: number;
  offset?: number;
}

export interface SlotSummary {
  total: number;
  used: number;
  available: number;
}

export interface SlotInfo {
  slots: SlotSummary;
  subscriptionTier: string;
  activatedCategories: Array<{
    id: string;
    name: string;
    domain: string;
    activatedAt: string;
    queriesThisMonth: number | null;
    alertsEnabled: boolean | null;
  }>;
  breakdownByDomain: Array<{
    domain: string;
    count: number;
  }>;
}

// ══════════════════════════════════════════════════════════════════
// API Helpers
// ══════════════════════════════════════════════════════════════════

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/abi_csrf=([^;]+)/);
  return match ? match[1] : null;
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = { ...options.headers };

  if (options.method && options.method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
    if (!options.headers || !(options.headers as Record<string, string>)['Content-Type']) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════════════
// API Functions
// ══════════════════════════════════════════════════════════════════

/**
 * List all managed categories with filters
 */
export async function fetchCategories(filters: CategoryFilters = {}): Promise<{
  categories: ManagedCategory[];
  total: number;
  activatedCount: number;
}> {
  const params = new URLSearchParams();

  if (filters.domain) params.set('domain', filters.domain);
  if (filters.search) params.set('search', filters.search);
  if (filters.popular) params.set('popular', 'true');
  if (filters.activated !== undefined) params.set('activated', String(filters.activated));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const queryString = params.toString();
  const url = queryString ? `/api/categories?${queryString}` : '/api/categories';

  return apiRequest(url);
}

/**
 * List all category domains
 */
export async function fetchDomains(): Promise<{
  domains: CategoryDomain[];
  total: number;
}> {
  return apiRequest('/api/categories/domains');
}

/**
 * Get company's slot summary
 */
export async function fetchSlotSummary(): Promise<SlotInfo> {
  return apiRequest('/api/categories/slots');
}

/**
 * Activate a category (uses a slot)
 */
export async function activateCategory(categoryId: string): Promise<{
  activation: {
    id: string;
    categoryId: string;
    activatedAt: string;
    alertsEnabled: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  slots: SlotSummary;
}> {
  return apiRequest('/api/categories/activate', {
    method: 'POST',
    body: JSON.stringify({ categoryId }),
  });
}

/**
 * Deactivate a category (frees a slot)
 */
export async function deactivateCategory(categoryId: string): Promise<{
  message: string;
  category: {
    id: string;
    name?: string;
    slug?: string;
  };
  slots: SlotSummary;
}> {
  return apiRequest('/api/categories/deactivate', {
    method: 'POST',
    body: JSON.stringify({ categoryId }),
  });
}
