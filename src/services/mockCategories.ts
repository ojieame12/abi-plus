// Mock managed categories data for P1 demo
// Beroe maintains ~500 validated categories
// This is a sample of the catalog

import type {
  ManagedCategory,
  CategoryDomain,
  ActivatedCategory,
  CategorySlotSummary,
} from '../types/managedCategories';

// Category domains (top-level groupings)
export const MOCK_CATEGORY_DOMAINS: CategoryDomain[] = [
  { id: 'dom_metals', name: 'Metals', slug: 'metals', categoryCount: 18, icon: 'Box', color: 'text-slate-600 bg-slate-100' },
  { id: 'dom_packaging', name: 'Packaging', slug: 'packaging', categoryCount: 12, icon: 'Package', color: 'text-amber-600 bg-amber-50' },
  { id: 'dom_logistics', name: 'Logistics', slug: 'logistics', categoryCount: 15, icon: 'Truck', color: 'text-blue-600 bg-blue-50' },
  { id: 'dom_it', name: 'IT Services', slug: 'it-services', categoryCount: 22, icon: 'Monitor', color: 'text-violet-600 bg-violet-50' },
  { id: 'dom_chemicals', name: 'Chemicals', slug: 'chemicals', categoryCount: 25, icon: 'Beaker', color: 'text-emerald-600 bg-emerald-50' },
  { id: 'dom_energy', name: 'Energy', slug: 'energy', categoryCount: 14, icon: 'Zap', color: 'text-yellow-600 bg-yellow-50' },
  { id: 'dom_mro', name: 'MRO', slug: 'mro', categoryCount: 18, icon: 'Wrench', color: 'text-orange-600 bg-orange-50' },
  { id: 'dom_marketing', name: 'Marketing', slug: 'marketing', categoryCount: 16, icon: 'Megaphone', color: 'text-pink-600 bg-pink-50' },
  { id: 'dom_hr', name: 'HR Services', slug: 'hr-services', categoryCount: 14, icon: 'Users', color: 'text-cyan-600 bg-cyan-50' },
  { id: 'dom_facilities', name: 'Facilities', slug: 'facilities', categoryCount: 12, icon: 'Building', color: 'text-indigo-600 bg-indigo-50' },
  { id: 'dom_travel', name: 'Travel', slug: 'travel', categoryCount: 8, icon: 'Plane', color: 'text-sky-600 bg-sky-50' },
  { id: 'dom_fleet', name: 'Fleet', slug: 'fleet', categoryCount: 10, icon: 'Car', color: 'text-red-600 bg-red-50' },
  { id: 'dom_professional', name: 'Professional Services', slug: 'professional-services', categoryCount: 20, icon: 'Briefcase', color: 'text-teal-600 bg-teal-50' },
];

// Sample managed categories (representing the ~500 catalog)
export const MOCK_MANAGED_CATEGORIES: ManagedCategory[] = [
  // Metals
  {
    id: 'cat_steel',
    name: 'Steel',
    slug: 'steel',
    domainId: 'dom_metals',
    domain: 'Metals',
    subDomain: 'Ferrous',
    description: 'Carbon steel, stainless steel, and specialty steel products',
    keywords: ['carbon steel', 'stainless', 'hot rolled', 'cold rolled', 'galvanized'],
    leadAnalyst: {
      id: 'analyst_001',
      name: 'Sarah Chen',
      title: 'Senior Analyst, Metals',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    analystTeamSize: 4,
    updateFrequency: 'weekly',
    lastUpdated: '2025-01-12T00:00:00Z',
    nextUpdateDue: '2025-01-19T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: true,
    responseTimeSla: '24 hours',
    clientCount: 245,
    isPopular: true,
  },
  {
    id: 'cat_aluminum',
    name: 'Aluminum',
    slug: 'aluminum',
    domainId: 'dom_metals',
    domain: 'Metals',
    subDomain: 'Non-Ferrous',
    description: 'Primary and secondary aluminum, extrusions, and rolled products',
    keywords: ['primary aluminum', 'secondary', 'extrusions', 'sheets', 'LME'],
    leadAnalyst: {
      id: 'analyst_002',
      name: 'James Park',
      title: 'Analyst, Metals',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
    analystTeamSize: 3,
    updateFrequency: 'weekly',
    lastUpdated: '2025-01-11T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: true,
    responseTimeSla: '24 hours',
    clientCount: 198,
    isPopular: true,
  },
  {
    id: 'cat_copper',
    name: 'Copper',
    slug: 'copper',
    domainId: 'dom_metals',
    domain: 'Metals',
    subDomain: 'Non-Ferrous',
    description: 'Copper cathodes, wire rod, and fabricated copper products',
    leadAnalyst: {
      id: 'analyst_002',
      name: 'James Park',
      title: 'Analyst, Metals',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
    updateFrequency: 'weekly',
    lastUpdated: '2025-01-10T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: false,
    responseTimeSla: '24 hours',
    clientCount: 156,
    isPopular: true,
  },

  // Packaging
  {
    id: 'cat_corrugated',
    name: 'Corrugated Boxes',
    slug: 'corrugated-boxes',
    domainId: 'dom_packaging',
    domain: 'Packaging',
    subDomain: 'Paper-Based',
    description: 'Corrugated shipping containers and packaging',
    leadAnalyst: {
      id: 'analyst_003',
      name: 'Emily Watson',
      title: 'Senior Analyst, Packaging',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
    updateFrequency: 'bi-weekly',
    lastUpdated: '2025-01-08T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: true,
    responseTimeSla: '24 hours',
    clientCount: 312,
    isPopular: true,
  },
  {
    id: 'cat_flexible_packaging',
    name: 'Flexible Packaging',
    slug: 'flexible-packaging',
    domainId: 'dom_packaging',
    domain: 'Packaging',
    subDomain: 'Films & Pouches',
    description: 'Flexible films, pouches, and laminated packaging',
    leadAnalyst: {
      id: 'analyst_003',
      name: 'Emily Watson',
      title: 'Senior Analyst, Packaging',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
    updateFrequency: 'bi-weekly',
    lastUpdated: '2025-01-06T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: false,
    responseTimeSla: '24 hours',
    clientCount: 189,
    isPopular: true,
  },

  // Logistics
  {
    id: 'cat_contract_logistics',
    name: 'Contract Logistics',
    slug: 'contract-logistics',
    domainId: 'dom_logistics',
    domain: 'Logistics',
    subDomain: '3PL',
    description: 'Third-party logistics, warehousing, and fulfillment',
    leadAnalyst: {
      id: 'analyst_004',
      name: 'Robert Chang',
      title: 'Senior Analyst, Logistics',
    },
    updateFrequency: 'monthly',
    lastUpdated: '2025-01-01T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: false,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: true,
    responseTimeSla: '48 hours',
    clientCount: 267,
    isPopular: true,
  },
  {
    id: 'cat_ocean_freight',
    name: 'Ocean Freight',
    slug: 'ocean-freight',
    domainId: 'dom_logistics',
    domain: 'Logistics',
    subDomain: 'Freight',
    description: 'Container shipping and ocean freight services',
    leadAnalyst: {
      id: 'analyst_004',
      name: 'Robert Chang',
      title: 'Senior Analyst, Logistics',
    },
    updateFrequency: 'weekly',
    lastUpdated: '2025-01-13T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: true,
    responseTimeSla: '24 hours',
    clientCount: 234,
    isPopular: true,
  },

  // IT Services
  {
    id: 'cat_it_staffing',
    name: 'IT Staffing',
    slug: 'it-staffing',
    domainId: 'dom_it',
    domain: 'IT Services',
    subDomain: 'Staffing',
    description: 'IT contract staffing and staff augmentation',
    leadAnalyst: {
      id: 'analyst_005',
      name: 'Lisa Chen',
      title: 'Analyst, IT Services',
    },
    updateFrequency: 'monthly',
    lastUpdated: '2025-01-05T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: false,
    hasCostModel: true,
    responseTimeSla: '48 hours',
    clientCount: 178,
  },
  {
    id: 'cat_cloud_services',
    name: 'Cloud Services',
    slug: 'cloud-services',
    domainId: 'dom_it',
    domain: 'IT Services',
    subDomain: 'Infrastructure',
    description: 'Cloud infrastructure, IaaS, PaaS, and SaaS',
    leadAnalyst: {
      id: 'analyst_005',
      name: 'Lisa Chen',
      title: 'Analyst, IT Services',
    },
    updateFrequency: 'monthly',
    lastUpdated: '2025-01-02T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    hasNewsAlerts: true,
    hasCostModel: true,
    responseTimeSla: '48 hours',
    clientCount: 356,
    isPopular: true,
  },
];

// Mock activated categories for Acme Corp (28 of 35 slots used)
export const MOCK_ACTIVATED_CATEGORIES: ActivatedCategory[] = MOCK_MANAGED_CATEGORIES.map((cat, index) => ({
  id: `act_${cat.id}`,
  categoryId: cat.id,
  category: cat,
  companyId: 'comp_001',
  activatedAt: '2024-03-15T00:00:00Z',
  activatedBy: 'user_001',
  queriesThisMonth: Math.floor(Math.random() * 50) + 5,
  lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  alertsEnabled: true,
  weeklyDigestEnabled: index < 5, // Top 5 categories get weekly digest
}));

// Mock slot summary for Acme Corp
export const MOCK_SLOT_SUMMARY: CategorySlotSummary = {
  companyId: 'comp_001',
  companyName: 'Acme Corporation',
  totalSlots: 35,
  usedSlots: 28,
  remainingSlots: 7,
  activatedCategories: MOCK_ACTIVATED_CATEGORIES,
  suggestedCategories: MOCK_MANAGED_CATEGORIES.filter(c => !MOCK_ACTIVATED_CATEGORIES.find(ac => ac.categoryId === c.id)).slice(0, 5),
};

// Helper functions

export function getMockCategories(filter?: { domainId?: string; search?: string }): ManagedCategory[] {
  let categories = [...MOCK_MANAGED_CATEGORIES];

  if (filter?.domainId) {
    categories = categories.filter(c => c.domainId === filter.domainId);
  }

  if (filter?.search) {
    const searchLower = filter.search.toLowerCase();
    categories = categories.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.domain.toLowerCase().includes(searchLower) ||
      c.keywords?.some(k => k.toLowerCase().includes(searchLower))
    );
  }

  return categories;
}

export function getMockCategory(categoryId: string): ManagedCategory | undefined {
  return MOCK_MANAGED_CATEGORIES.find(c => c.id === categoryId);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockSlotSummary(_companyId: string): CategorySlotSummary {
  return MOCK_SLOT_SUMMARY;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockActivatedCategories(_companyId: string): ActivatedCategory[] {
  return MOCK_ACTIVATED_CATEGORIES;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isCategoryActivated(categoryId: string, _companyId: string): boolean {
  return MOCK_ACTIVATED_CATEGORIES.some(ac => ac.categoryId === categoryId);
}
