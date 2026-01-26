// Normalized Source Taxonomy
// Extends the source system while maintaining backward compatibility with confidence calculation

// ============================================
// RELIABILITY TIERS
// ============================================

/**
 * Reliability tier for source categorization and display
 * - tier1: Beroe proprietary data (highest confidence, "Decision Grade")
 * - tier2: Premium partner data (D&B, EcoVadis, etc.)
 * - tier3: Web/public data (lower confidence, needs validation)
 */
export type ReliabilityTier = 'tier1' | 'tier2' | 'tier3';

// ============================================
// SOURCE CATEGORIES
// ============================================

/**
 * High-level source categories for UI display and filtering
 */
export type SourceCategory =
  | 'intelligence'    // Beroe reports, category intelligence
  | 'financial'       // D&B, credit ratings
  | 'esg'             // EcoVadis, sustainability ratings
  | 'market_data'     // LME, COMEX, commodity exchanges
  | 'trade'           // Import/export data
  | 'regulatory'      // FDA, EPA, compliance data
  | 'news'            // News and sentiment
  | 'supplier'        // Internal supplier data
  | 'web';            // Web research

// ============================================
// DATA PROVIDER REGISTRY
// ============================================

/**
 * Provider definition with reliability and display metadata
 */
export interface ProviderDefinition {
  id: string;
  name: string;
  shortName: string;          // For badge display (e.g., "Beroe", "D&B")
  category: SourceCategory;
  reliabilityTier: ReliabilityTier;
  isBeroeProperty: boolean;   // Critical for confidence calculation
  isPremium: boolean;
  iconClass?: string;         // For UI icon selection
  color?: string;             // Brand color for badges
}

/**
 * Registry of all known data providers
 * Key is the provider ID used in source data
 */
export const PROVIDER_REGISTRY: Record<string, ProviderDefinition> = {
  // Tier 1: Beroe Proprietary (counts toward "Decision Grade")
  beroe: {
    id: 'beroe',
    name: 'Beroe Intelligence',
    shortName: 'Beroe',
    category: 'intelligence',
    reliabilityTier: 'tier1',
    isBeroeProperty: true,
    isPremium: false,
    color: '#7C3AED', // violet-600
  },
  beroe_risk: {
    id: 'beroe_risk',
    name: 'Beroe Risk Analytics',
    shortName: 'Beroe Risk',
    category: 'intelligence',
    reliabilityTier: 'tier1',
    isBeroeProperty: true,
    isPremium: false,
    color: '#7C3AED',
  },
  beroe_pricing: {
    id: 'beroe_pricing',
    name: 'Beroe Price Intelligence',
    shortName: 'Beroe Pricing',
    category: 'intelligence',
    reliabilityTier: 'tier1',
    isBeroeProperty: true,
    isPremium: false,
    color: '#7C3AED',
  },

  // Tier 2: Premium Partners (high quality but not Beroe)
  dun_bradstreet: {
    id: 'dun_bradstreet',
    name: 'Dun & Bradstreet',
    shortName: 'D&B',
    category: 'financial',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#0284C7', // sky-600
  },
  ecovadis: {
    id: 'ecovadis',
    name: 'EcoVadis',
    shortName: 'EcoVadis',
    category: 'esg',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#059669', // emerald-600
  },
  moodys: {
    id: 'moodys',
    name: "Moody's Ratings",
    shortName: "Moody's",
    category: 'financial',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#0284C7',
  },
  sp_global: {
    id: 'sp_global',
    name: 'S&P Global',
    shortName: 'S&P',
    category: 'financial',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#DC2626', // red-600
  },
  lme: {
    id: 'lme',
    name: 'London Metal Exchange',
    shortName: 'LME',
    category: 'market_data',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#0369A1', // sky-700
  },
  comex: {
    id: 'comex',
    name: 'COMEX',
    shortName: 'COMEX',
    category: 'market_data',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#CA8A04', // yellow-600
  },
  ice: {
    id: 'ice',
    name: 'ICE Futures',
    shortName: 'ICE',
    category: 'market_data',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#0891B2', // cyan-600
  },
  panjiva: {
    id: 'panjiva',
    name: 'Panjiva (S&P Global)',
    shortName: 'Panjiva',
    category: 'trade',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#DC2626',
  },
  import_genius: {
    id: 'import_genius',
    name: 'ImportGenius',
    shortName: 'ImportGenius',
    category: 'trade',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: true,
    color: '#7C3AED',
  },

  // Tier 2: Internal data (high quality, internal)
  supplier_data: {
    id: 'supplier_data',
    name: 'Supplier Master Data',
    shortName: 'Supplier Data',
    category: 'supplier',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: false,
    color: '#6366F1', // indigo-500
  },
  internal_data: {
    id: 'internal_data',
    name: 'Internal Analytics',
    shortName: 'Internal',
    category: 'supplier',
    reliabilityTier: 'tier2',
    isBeroeProperty: false,
    isPremium: false,
    color: '#6366F1',
  },

  // Tier 3: Web/Public (lower reliability)
  web: {
    id: 'web',
    name: 'Web Research',
    shortName: 'Web',
    category: 'web',
    reliabilityTier: 'tier3',
    isBeroeProperty: false,
    isPremium: false,
    color: '#64748B', // slate-500
  },
  news: {
    id: 'news',
    name: 'News Sources',
    shortName: 'News',
    category: 'news',
    reliabilityTier: 'tier3',
    isBeroeProperty: false,
    isPremium: false,
    color: '#64748B',
  },
};

// ============================================
// NORMALIZED SOURCE INTERFACE
// ============================================

/**
 * Normalized source with full metadata
 * Extends the existing InternalSource pattern
 */
export interface NormalizedSource {
  // Identity
  id: string;
  name: string;

  // Provider info
  providerId: string;           // Key into PROVIDER_REGISTRY
  provider: ProviderDefinition; // Full provider metadata

  // Classification
  reliabilityTier: ReliabilityTier;
  category: SourceCategory;

  // Content
  reportId?: string;
  reportCategory?: string;
  summary?: string;
  url?: string;
  date?: string;

  // For backward compatibility with existing type
  legacyType: 'beroe' | 'dun_bradstreet' | 'ecovadis' | 'internal_data' | 'supplier_data';

  // Citation reference
  citationId?: string;
}

// ============================================
// NORMALIZATION HELPERS
// ============================================

/**
 * Map legacy source type to provider ID
 * Returns null for unknown types to prevent misclassification
 */
export function legacyTypeToProviderId(
  legacyType: string | undefined
): string | null {
  switch (legacyType) {
    case 'beroe':
      return 'beroe';
    case 'dnd':
    case 'dun_bradstreet':
      return 'dun_bradstreet';
    case 'ecovadis':
      return 'ecovadis';
    case 'supplier_data':
      return 'supplier_data';
    case 'internal_data':
    case 'report':
    case 'analysis':
    case 'data':
      return 'internal_data';
    case 'news':
      return 'news';
    case 'web':
      return 'web';
    // Return null for unknown types - they will be dropped rather than misclassified
    default:
      return null;
  }
}

/**
 * Get provider definition by ID with fallback
 */
export function getProvider(providerId: string): ProviderDefinition {
  return PROVIDER_REGISTRY[providerId] || PROVIDER_REGISTRY.internal_data;
}

/**
 * Check if a provider counts toward Beroe confidence
 * Critical for maintaining "Decision Grade" calculation
 */
export function countsToBeroeConfidence(providerId: string): boolean {
  const provider = PROVIDER_REGISTRY[providerId];
  return provider?.isBeroeProperty === true;
}

/**
 * Get display badge color for a provider
 */
export function getProviderBadgeColor(providerId: string): string {
  const provider = PROVIDER_REGISTRY[providerId];
  return provider?.color || '#64748B';
}

/**
 * Get reliability tier label for display
 */
export function getReliabilityLabel(tier: ReliabilityTier): string {
  switch (tier) {
    case 'tier1':
      return 'Decision Grade';
    case 'tier2':
      return 'Verified Data';
    case 'tier3':
      return 'Web Research';
    default:
      return '';
  }
}

/**
 * Map provider ID to legacy InternalSource type
 * Maintains backward compatibility with existing code
 * Returns null for providers that should remain as web sources
 */
export function providerIdToLegacyType(
  providerId: string
): 'beroe' | 'dun_bradstreet' | 'ecovadis' | 'internal_data' | 'supplier_data' | null {
  switch (providerId) {
    // Tier 1: Beroe (counts toward Decision Grade)
    case 'beroe':
    case 'beroe_risk':
    case 'beroe_pricing':
      return 'beroe'; // All Beroe variants map to 'beroe' for confidence

    // Tier 2: Premium Partners (verified data, not Decision Grade)
    case 'dun_bradstreet':
    case 'moodys':
    case 'sp_global':
      return 'dun_bradstreet';
    case 'ecovadis':
      return 'ecovadis';

    // Tier 2: Market Data (internal, subscription-based)
    case 'lme':
    case 'comex':
    case 'ice':
    case 'panjiva':
    case 'import_genius':
      return 'internal_data';

    // Internal data sources
    case 'supplier_data':
      return 'supplier_data';
    case 'internal_data':
      return 'internal_data';

    // Tier 3: Web/News - should NOT be treated as internal sources
    // Return null to signal these should remain web sources
    case 'web':
    case 'news':
      return null;

    default:
      return 'internal_data';
  }
}

// ============================================
// SOURCE GROUPING FOR UI
// ============================================

/**
 * Group sources by reliability tier for display
 */
export function groupSourcesByTier(
  sources: NormalizedSource[]
): Record<ReliabilityTier, NormalizedSource[]> {
  return {
    tier1: sources.filter(s => s.reliabilityTier === 'tier1'),
    tier2: sources.filter(s => s.reliabilityTier === 'tier2'),
    tier3: sources.filter(s => s.reliabilityTier === 'tier3'),
  };
}

/**
 * Group sources by category for display
 */
export function groupSourcesByCategory(
  sources: NormalizedSource[]
): Record<SourceCategory, NormalizedSource[]> {
  const groups: Record<SourceCategory, NormalizedSource[]> = {
    intelligence: [],
    financial: [],
    esg: [],
    market_data: [],
    trade: [],
    regulatory: [],
    news: [],
    supplier: [],
    web: [],
  };

  for (const source of sources) {
    groups[source.category].push(source);
  }

  return groups;
}
