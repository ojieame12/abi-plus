// Managed categories types for Layer 2a
// Beroe maintains ~500 validated categories
// Clients get "Slot Allowance" based on subscription tier

// Category domain (top-level grouping)
export interface CategoryDomain {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;            // Lucide icon name
  categoryCount: number;
  color?: string;           // Tailwind color class
}

// Managed category (from Beroe's 500 catalog)
export interface ManagedCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;        // For hierarchy

  // Classification
  domainId: string;
  domain: string;           // "Packaging", "Metals", "Logistics", etc.
  subDomain?: string;

  // Description
  description?: string;
  keywords?: string[];

  // Analyst coverage
  leadAnalyst: {
    id: string;
    name: string;
    title?: string;
    photo?: string;
  };
  analystTeamSize?: number;

  // Update frequency and freshness
  updateFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  lastUpdated: string;
  nextUpdateDue?: string;

  // Content availability
  hasMarketReport: boolean;
  hasPriceIndex: boolean;
  hasSupplierData: boolean;
  hasNewsAlerts: boolean;
  hasCostModel: boolean;

  // SLA
  responseTimeSla: string;  // "24 hours", "48 hours"

  // Popularity/usage
  clientCount?: number;     // How many clients have this activated
  isPopular?: boolean;
}

// Client's activated category
export interface ActivatedCategory {
  id: string;
  categoryId: string;
  category: ManagedCategory;
  companyId: string;

  // Activation details
  activatedAt: string;
  activatedBy: string;      // User ID

  // Usage stats
  queriesThisMonth?: number;
  lastAccessedAt?: string;

  // Preferences
  alertsEnabled: boolean;
  weeklyDigestEnabled: boolean;
}

// Category slot summary for a company
export interface CategorySlotSummary {
  companyId: string;
  companyName: string;

  // Slot counts
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;

  // Activated categories
  activatedCategories: ActivatedCategory[];

  // Suggestions
  suggestedCategories?: ManagedCategory[];  // Based on usage patterns
}

// Category search/filter options
export interface CategoryFilter {
  domainId?: string;
  search?: string;
  hasMarketReport?: boolean;
  hasPriceIndex?: boolean;
  updateFrequency?: ManagedCategory['updateFrequency'];
  isPopular?: boolean;
}

// Category activation request (when adding to slots)
export interface CategoryActivationRequest {
  categoryId: string;
  companyId: string;
  requestedBy: string;
  reason?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Helper functions

export function getCategoryDomainIcon(domain: string): string {
  const domainIcons: Record<string, string> = {
    'Metals': 'Box',
    'Packaging': 'Package',
    'Logistics': 'Truck',
    'IT Services': 'Monitor',
    'Chemicals': 'Beaker',
    'Energy': 'Zap',
    'MRO': 'Wrench',
    'Marketing': 'Megaphone',
    'HR Services': 'Users',
    'Facilities': 'Building',
    'Travel': 'Plane',
    'Fleet': 'Car',
    'Professional Services': 'Briefcase',
  };
  return domainIcons[domain] || 'Folder';
}

export function getCategoryDomainColor(domain: string): string {
  const domainColors: Record<string, string> = {
    'Metals': 'text-slate-600 bg-slate-100',
    'Packaging': 'text-amber-600 bg-amber-50',
    'Logistics': 'text-blue-600 bg-blue-50',
    'IT Services': 'text-violet-600 bg-violet-50',
    'Chemicals': 'text-emerald-600 bg-emerald-50',
    'Energy': 'text-yellow-600 bg-yellow-50',
    'MRO': 'text-orange-600 bg-orange-50',
    'Marketing': 'text-pink-600 bg-pink-50',
    'HR Services': 'text-cyan-600 bg-cyan-50',
    'Facilities': 'text-indigo-600 bg-indigo-50',
    'Travel': 'text-sky-600 bg-sky-50',
    'Fleet': 'text-red-600 bg-red-50',
    'Professional Services': 'text-teal-600 bg-teal-50',
  };
  return domainColors[domain] || 'text-slate-600 bg-slate-100';
}

export function formatUpdateFrequency(frequency: ManagedCategory['updateFrequency']): string {
  switch (frequency) {
    case 'daily':
      return 'Daily updates';
    case 'weekly':
      return 'Weekly updates';
    case 'bi-weekly':
      return 'Bi-weekly updates';
    case 'monthly':
      return 'Monthly updates';
  }
}

export function getSlotUsageStatus(used: number, total: number): 'healthy' | 'warning' | 'full' {
  const percentage = (used / total) * 100;
  if (percentage >= 100) return 'full';
  if (percentage >= 80) return 'warning';
  return 'healthy';
}

export function getSlotUsageColor(status: 'healthy' | 'warning' | 'full'): string {
  switch (status) {
    case 'healthy':
      return 'text-emerald-600 bg-emerald-500';
    case 'warning':
      return 'text-amber-600 bg-amber-500';
    case 'full':
      return 'text-red-600 bg-red-500';
  }
}
