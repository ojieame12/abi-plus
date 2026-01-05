// Artifact Registry
// Central registry mapping artifact types to components and metadata

import { ComponentType } from 'react';

// ============================================
// ARTIFACT TYPE DEFINITIONS
// ============================================

export type ArtifactCategory = 'insight' | 'supplier' | 'action' | 'discovery';

export interface ArtifactMeta {
  id: string;
  title: string;
  category: ArtifactCategory;
  description: string;
  defaultWidth?: '40%' | '50%' | '60%' | '100%';
  allowExpand?: boolean;
}

// All possible artifact types
export type ArtifactType =
  // Insight & Analysis
  | 'insight_detail'
  | 'trend_analysis'
  | 'factor_breakdown'
  | 'news_events'
  // Supplier Views
  | 'supplier_detail'
  | 'supplier_comparison'
  | 'supplier_table'
  | 'supplier_alternatives'
  // Actions
  | 'alert_config'
  | 'export_builder'
  | 'watchlist_manage'
  | 'assessment_request'
  // Discovery
  | 'category_overview'
  | 'portfolio_dashboard'
  | 'regional_analysis'
  | 'spend_analysis';

// ============================================
// ARTIFACT METADATA
// ============================================

export const ARTIFACT_META: Record<ArtifactType, ArtifactMeta> = {
  // Insight & Analysis
  insight_detail: {
    id: 'insight_detail',
    title: 'Insight Details',
    category: 'insight',
    description: 'Detailed view of a risk insight with factors and actions',
    defaultWidth: '40%',
    allowExpand: true,
  },
  trend_analysis: {
    id: 'trend_analysis',
    title: 'Trend Analysis',
    category: 'insight',
    description: 'Historical trend analysis with projections',
    defaultWidth: '50%',
    allowExpand: true,
  },
  factor_breakdown: {
    id: 'factor_breakdown',
    title: 'Factor Analysis',
    category: 'insight',
    description: 'Detailed breakdown of risk factors with history',
    defaultWidth: '50%',
    allowExpand: true,
  },
  news_events: {
    id: 'news_events',
    title: 'News & Events',
    category: 'insight',
    description: 'Full news feed with filters and sentiment analysis',
    defaultWidth: '50%',
    allowExpand: true,
  },

  // Supplier Views
  supplier_detail: {
    id: 'supplier_detail',
    title: 'Supplier Details',
    category: 'supplier',
    description: 'Comprehensive supplier profile with tabs',
    defaultWidth: '50%',
    allowExpand: true,
  },
  supplier_comparison: {
    id: 'supplier_comparison',
    title: 'Supplier Comparison',
    category: 'supplier',
    description: 'Side-by-side supplier comparison',
    defaultWidth: '60%',
    allowExpand: true,
  },
  supplier_table: {
    id: 'supplier_table',
    title: 'Supplier Table',
    category: 'supplier',
    description: 'Full supplier table with filters and sorting',
    defaultWidth: '60%',
    allowExpand: true,
  },
  supplier_alternatives: {
    id: 'supplier_alternatives',
    title: 'Alternative Suppliers',
    category: 'discovery',
    description: 'Find and compare alternative suppliers',
    defaultWidth: '50%',
    allowExpand: true,
  },

  // Actions
  alert_config: {
    id: 'alert_config',
    title: 'Configure Alert',
    category: 'action',
    description: 'Set up risk alerts and notifications',
    defaultWidth: '40%',
    allowExpand: false,
  },
  export_builder: {
    id: 'export_builder',
    title: 'Export Report',
    category: 'action',
    description: 'Configure and export reports',
    defaultWidth: '40%',
    allowExpand: false,
  },
  watchlist_manage: {
    id: 'watchlist_manage',
    title: 'Manage Watchlist',
    category: 'action',
    description: 'Add or remove suppliers from watchlists',
    defaultWidth: '40%',
    allowExpand: false,
  },
  assessment_request: {
    id: 'assessment_request',
    title: 'Request Assessment',
    category: 'action',
    description: 'Request a supplier risk assessment',
    defaultWidth: '40%',
    allowExpand: false,
  },

  // Discovery
  category_overview: {
    id: 'category_overview',
    title: 'Category Overview',
    category: 'discovery',
    description: 'Overview of all suppliers in a category',
    defaultWidth: '60%',
    allowExpand: true,
  },
  portfolio_dashboard: {
    id: 'portfolio_dashboard',
    title: 'Portfolio Dashboard',
    category: 'discovery',
    description: 'Full portfolio risk overview',
    defaultWidth: '100%',
    allowExpand: true,
  },
  regional_analysis: {
    id: 'regional_analysis',
    title: 'Regional Analysis',
    category: 'discovery',
    description: 'Geographic risk distribution',
    defaultWidth: '60%',
    allowExpand: true,
  },
  spend_analysis: {
    id: 'spend_analysis',
    title: 'Spend Analysis',
    category: 'discovery',
    description: 'Detailed spend exposure analysis by risk, category, and region',
    defaultWidth: '60%',
    allowExpand: true,
  },
};

// ============================================
// ARTIFACT PAYLOAD TYPES
// ============================================

import type { InsightDetailData } from '../panel/InsightDetailArtifact';

// Base payload interface
export interface BaseArtifactPayload {
  type: ArtifactType;
}

// Specific payload types - aligned with what ArtifactRenderer expects

export interface InsightDetailPayload extends BaseArtifactPayload {
  type: 'insight_detail';
  data: InsightDetailData;
}

export interface SupplierDetailPayload extends BaseArtifactPayload {
  type: 'supplier_detail';
  supplier: unknown; // Full supplier object
}

export interface SupplierTablePayload extends BaseArtifactPayload {
  type: 'supplier_table';
  suppliers: unknown[]; // Array of supplier objects
  filter?: {
    riskLevel?: string[];
    category?: string[];
  };
}

export interface SupplierComparisonPayload extends BaseArtifactPayload {
  type: 'supplier_comparison';
  suppliers: unknown[]; // Array of suppliers to compare
}

export interface PortfolioDashboardPayload extends BaseArtifactPayload {
  type: 'portfolio_dashboard';
  portfolio: unknown; // Portfolio data object
}

export interface AlertConfigPayload extends BaseArtifactPayload {
  type: 'alert_config';
  supplierId?: string;
  supplierName?: string;
  currentScore?: number;
}

export interface ExportBuilderPayload extends BaseArtifactPayload {
  type: 'export_builder';
  context?: 'supplier' | 'portfolio' | 'comparison';
  entityName?: string;
  entityIds?: string[];
}

export interface WatchlistPayload extends BaseArtifactPayload {
  type: 'watchlist_manage';
  supplierId?: string;
  supplierName?: string;
}

// Union of all payload types
export type ArtifactPayload =
  | InsightDetailPayload
  | SupplierDetailPayload
  | SupplierTablePayload
  | SupplierComparisonPayload
  | PortfolioDashboardPayload
  | AlertConfigPayload
  | ExportBuilderPayload
  | WatchlistPayload
  | (BaseArtifactPayload & { [key: string]: unknown });

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getArtifactMeta = (type: ArtifactType): ArtifactMeta => {
  return ARTIFACT_META[type];
};

export const getArtifactTitle = (type: ArtifactType): string => {
  return ARTIFACT_META[type]?.title || 'Details';
};

export const getArtifactsByCategory = (category: ArtifactCategory): ArtifactMeta[] => {
  return Object.values(ARTIFACT_META).filter((meta) => meta.category === category);
};

export const isActionArtifact = (type: ArtifactType): boolean => {
  return ARTIFACT_META[type]?.category === 'action';
};
