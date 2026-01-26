import type { Source } from '../types/chat';
import type { ResponseSources, InternalSource, WebSource, SourceConfidenceInfo } from '../types/aiResponse';
import { calculateSourceConfidence } from '../services/sourceConfidenceService';

// ============================================
// MOCK BEROE REPORT DATA
// ============================================

const MOCK_BEROE_REPORTS: Record<string, Partial<InternalSource>> = {
  'Beroe Risk Intelligence': {
    reportId: 'beroe-risk-2024-q4',
    category: 'Risk Analytics',
    summary: 'Comprehensive supplier risk assessment covering financial stability, operational resilience, and compliance factors.',
  },
  'Portfolio Analytics': {
    reportId: 'beroe-portfolio-2024',
    category: 'Portfolio Management',
    summary: 'Portfolio-wide risk distribution and trend analysis with actionable recommendations.',
  },
  'Supplier Performance Data': {
    reportId: 'beroe-performance-metrics',
    category: 'Performance Metrics',
    summary: 'Historical supplier performance trends including delivery, quality, and responsiveness scores.',
  },
  'Industry Benchmarks': {
    reportId: 'beroe-industry-benchmark-2024',
    category: 'Market Intelligence',
    summary: 'Industry-wide benchmarking data for supplier evaluation and comparison.',
  },
  'D&B Financial Data': {
    reportId: 'dnb-financial-report',
    category: 'Financial Analysis',
    summary: 'Dun & Bradstreet credit and financial health indicators for supplier evaluation.',
  },
  'EcoVadis Sustainability': {
    reportId: 'ecovadis-sustainability-2024',
    category: 'ESG & Sustainability',
    summary: 'Environmental, social, and governance performance ratings and improvement areas.',
  },
  'Risk Change Alerts': {
    reportId: 'beroe-alerts-digest',
    category: 'Alerts & Monitoring',
    summary: 'Recent risk score changes and triggering events across your monitored suppliers.',
  },
  'Category Intelligence Report': {
    reportId: 'beroe-category-q4-2024',
    category: 'Category Insights',
    summary: 'Deep-dive analysis into category trends, pricing dynamics, and market outlook.',
  },
  'Aluminum Market Report 2024': {
    reportId: 'beroe-aluminum-2024',
    category: 'Commodity Intelligence',
    summary: 'Global aluminum market analysis including supply-demand dynamics, pricing forecasts, and regional trends.',
  },
};

export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/$/, '');
    return `${parsed.origin}${pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
};

export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
};

const mapInternalType = (type?: Source['type']): InternalSource['type'] | null => {
  switch (type) {
    case 'beroe':
      return 'beroe';
    case 'dnd':
      return 'dun_bradstreet';
    case 'ecovadis':
      return 'ecovadis';
    case 'internal_data':
      return 'internal_data';
    case 'supplier_data':
      return 'supplier_data';
    case 'report':
    case 'analysis':
    case 'data':
    case 'news':
      return 'internal_data';
    default:
      return null;
  }
};

export interface BuildResponseSourcesOptions {
  /** Detected category from query for confidence calculation */
  detectedCategory?: string;
  /** User's managed categories for confidence calculation */
  managedCategories?: string[];
  /** Whether to calculate confidence (default: true) */
  calculateConfidenceFlag?: boolean;
}

export const buildResponseSources = (
  sources: Source[] | ResponseSources | undefined | null,
  options?: BuildResponseSourcesOptions
): ResponseSources => {
  const { detectedCategory, managedCategories, calculateConfidenceFlag = true } = options || {};

  // Guard: if sources is already a ResponseSources object, return it directly
  // But add confidence if it's missing and we have the info to calculate it
  if (sources && typeof sources === 'object' && 'web' in sources && 'internal' in sources) {
    const existing = sources as ResponseSources;
    if (!existing.confidence && calculateConfidenceFlag) {
      existing.confidence = calculateSourceConfidence(existing, detectedCategory, managedCategories);
    }
    return existing;
  }

  // Guard: if sources is not an array, return empty
  if (!Array.isArray(sources)) {
    const empty: ResponseSources = { web: [], internal: [], totalWebCount: 0, totalInternalCount: 0 };
    if (calculateConfidenceFlag) {
      empty.confidence = calculateSourceConfidence(empty, detectedCategory, managedCategories);
    }
    return empty;
  }

  const web: WebSource[] = [];
  const internal: InternalSource[] = [];
  const seenWeb = new Set<string>();
  const seenInternal = new Set<string>();

  for (const source of sources) {
    if (source.url) {
      const normalized = normalizeUrl(source.url);
      if (seenWeb.has(normalized)) continue;
      seenWeb.add(normalized);
      const domain = extractDomain(source.url);
      web.push({
        name: source.name || domain,
        url: source.url,
        domain,
        date: source.date,
      });
      continue;
    }

    if (!source.name) continue;
    const internalType = mapInternalType(source.type);
    if (!internalType) continue;

    const key = `${internalType}:${source.name}`.toLowerCase();
    if (seenInternal.has(key)) continue;
    seenInternal.add(key);

    // Enrich with mock report data if available
    const mockData = MOCK_BEROE_REPORTS[source.name];
    internal.push({
      name: source.name,
      type: internalType,
      ...(mockData && {
        reportId: mockData.reportId,
        category: mockData.category,
        summary: mockData.summary,
      }),
    });
  }

  const result: ResponseSources = {
    web,
    internal,
    totalWebCount: web.length,
    totalInternalCount: internal.length,
  };

  // Calculate confidence if enabled
  if (calculateConfidenceFlag) {
    result.confidence = calculateSourceConfidence(result, detectedCategory, managedCategories);
  }

  return result;
};

/**
 * Create enriched Beroe internal sources with report metadata
 */
export const createEnrichedBeroeSources = (
  sourceNames: string[]
): InternalSource[] => {
  return sourceNames.map(name => {
    const mockData = MOCK_BEROE_REPORTS[name];
    return {
      name,
      type: 'beroe' as const,
      ...(mockData && {
        reportId: mockData.reportId,
        category: mockData.category,
        summary: mockData.summary,
      }),
    };
  });
};

/**
 * Create a standard set of Beroe sources for a given context
 */
export const getDefaultBeroeSources = (
  context: 'risk' | 'portfolio' | 'supplier' | 'category' | 'inflation'
): InternalSource[] => {
  const sourcesByContext: Record<string, string[]> = {
    risk: ['Beroe Risk Intelligence', 'Industry Benchmarks'],
    portfolio: ['Beroe Risk Intelligence', 'Portfolio Analytics'],
    supplier: ['Beroe Risk Intelligence', 'D&B Financial Data', 'EcoVadis Sustainability'],
    category: ['Category Intelligence Report', 'Industry Benchmarks'],
    inflation: ['Aluminum Market Report 2024', 'Category Intelligence Report'],
  };

  return createEnrichedBeroeSources(sourcesByContext[context] || sourcesByContext.risk);
};
