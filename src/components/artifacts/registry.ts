// Artifact Registry
// Central registry mapping artifact types to components and metadata

// ComponentType import available if needed for component registry pattern

// ============================================
// ARTIFACT TYPE DEFINITIONS
// ============================================

export type ArtifactCategory = 'insight' | 'supplier' | 'action' | 'discovery';

export interface ArtifactMeta {
  id: string;
  title: string;
  category: ArtifactCategory;
  description: string;
  defaultWidth?: '35%' | '40%' | '45%' | '50%' | '60%' | '100%';
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
  | 'spend_analysis'
  // Inflation Watch
  | 'inflation_dashboard'
  | 'commodity_dashboard'
  | 'driver_analysis'
  | 'impact_analysis'
  | 'justification_report'
  | 'scenario_planner'
  | 'executive_presentation'
  // Value Ladder (4-Layer System)
  | 'analyst_connect'
  | 'expert_request'
  | 'community_embed'
  | 'deeper_analysis'
  | 'upgrade_confirm'
  | 'analyst_message'
  | 'expert_briefing'
  // Content Viewer
  | 'report_viewer';

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
    defaultWidth: '45%',
    allowExpand: true,
  },
  factor_breakdown: {
    id: 'factor_breakdown',
    title: 'Factor Analysis',
    category: 'insight',
    description: 'Detailed breakdown of risk factors with history',
    defaultWidth: '45%',
    allowExpand: true,
  },
  news_events: {
    id: 'news_events',
    title: 'News & Events',
    category: 'insight',
    description: 'Full news feed with filters and sentiment analysis',
    defaultWidth: '45%',
    allowExpand: true,
  },

  // Supplier Views
  supplier_detail: {
    id: 'supplier_detail',
    title: 'Supplier Details',
    category: 'supplier',
    description: 'Comprehensive supplier profile with tabs',
    defaultWidth: '45%',
    allowExpand: true,
  },
  supplier_comparison: {
    id: 'supplier_comparison',
    title: 'Supplier Comparison',
    category: 'supplier',
    description: 'Side-by-side supplier comparison',
    defaultWidth: '45%',
    allowExpand: true,
  },
  supplier_table: {
    id: 'supplier_table',
    title: 'Supplier Table',
    category: 'supplier',
    description: 'Full supplier table with filters and sorting',
    defaultWidth: '45%',
    allowExpand: true,
  },
  supplier_alternatives: {
    id: 'supplier_alternatives',
    title: 'Alternative Suppliers',
    category: 'discovery',
    description: 'Find and compare alternative suppliers',
    defaultWidth: '45%',
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
    defaultWidth: '45%',
    allowExpand: true,
  },
  portfolio_dashboard: {
    id: 'portfolio_dashboard',
    title: 'Portfolio Dashboard',
    category: 'discovery',
    description: 'Full portfolio risk overview',
    defaultWidth: '45%',
    allowExpand: true,
  },
  regional_analysis: {
    id: 'regional_analysis',
    title: 'Regional Analysis',
    category: 'discovery',
    description: 'Geographic risk distribution',
    defaultWidth: '45%',
    allowExpand: true,
  },
  spend_analysis: {
    id: 'spend_analysis',
    title: 'Spend Analysis',
    category: 'discovery',
    description: 'Detailed spend exposure analysis by risk, category, and region',
    defaultWidth: '45%',
    allowExpand: true,
  },

  // Inflation Watch Artifacts
  inflation_dashboard: {
    id: 'inflation_dashboard',
    title: 'Inflation Dashboard',
    category: 'discovery',
    description: 'Full inflation overview with price movements, exposure, and drivers',
    defaultWidth: '45%',
    allowExpand: true,
  },
  commodity_dashboard: {
    id: 'commodity_dashboard',
    title: 'Commodity Analysis',
    category: 'insight',
    description: 'Deep dive into a single commodity with history, drivers, and forecast',
    defaultWidth: '45%',
    allowExpand: true,
  },
  driver_analysis: {
    id: 'driver_analysis',
    title: 'Price Driver Analysis',
    category: 'insight',
    description: 'Detailed root cause analysis for price changes with market context',
    defaultWidth: '45%',
    allowExpand: true,
  },
  impact_analysis: {
    id: 'impact_analysis',
    title: 'Impact Analysis',
    category: 'discovery',
    description: 'Portfolio impact from inflation with exposure breakdown and mitigation options',
    defaultWidth: '45%',
    allowExpand: true,
  },
  justification_report: {
    id: 'justification_report',
    title: 'Price Justification',
    category: 'action',
    description: 'Supplier price increase validation with market comparison and negotiation support',
    defaultWidth: '45%',
    allowExpand: true,
  },
  scenario_planner: {
    id: 'scenario_planner',
    title: 'Scenario Planner',
    category: 'action',
    description: 'Interactive what-if modeling for price scenarios and budget impact',
    defaultWidth: '45%',
    allowExpand: true,
  },
  executive_presentation: {
    id: 'executive_presentation',
    title: 'Executive Presentation',
    category: 'action',
    description: 'Shareable executive summary with key metrics and stakeholder talking points',
    defaultWidth: '45%',
    allowExpand: true,
  },

  // Value Ladder (4-Layer System)
  analyst_connect: {
    id: 'analyst_connect',
    title: 'Connect with Analyst',
    category: 'action',
    description: 'Schedule a call or send a question to a Beroe analyst',
    defaultWidth: '40%',
    allowExpand: false,
  },
  expert_request: {
    id: 'expert_request',
    title: 'Expert Network',
    category: 'action',
    description: 'Request introduction to an industry expert for bespoke research',
    defaultWidth: '45%',
    allowExpand: false,
  },
  community_embed: {
    id: 'community_embed',
    title: 'Community Discussions',
    category: 'discovery',
    description: 'Browse related discussions or start a new conversation',
    defaultWidth: '45%',
    allowExpand: true,
  },
  deeper_analysis: {
    id: 'deeper_analysis',
    title: 'Deeper Analysis',
    category: 'action',
    description: 'Explore premium options: upgrade report, analyst consultation, or expert deep-dive',
    defaultWidth: '35%',
    allowExpand: false,
  },
  upgrade_confirm: {
    id: 'upgrade_confirm',
    title: 'Upgrade Report',
    category: 'action',
    description: 'Confirm decision-grade report upgrade request',
    defaultWidth: '35%',
    allowExpand: false,
  },
  analyst_message: {
    id: 'analyst_message',
    title: 'Message Analyst',
    category: 'action',
    description: 'Send a question to your assigned analyst',
    defaultWidth: '35%',
    allowExpand: false,
  },
  expert_briefing: {
    id: 'expert_briefing',
    title: 'Expert Deep-Dive',
    category: 'action',
    description: 'Request an expert consultation session',
    defaultWidth: '35%',
    allowExpand: false,
  },

  // Content Viewer
  report_viewer: {
    id: 'report_viewer',
    title: 'Beroe Report',
    category: 'insight',
    description: 'View Beroe research report in the sidebar',
    defaultWidth: '50%',
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
  totalCount?: number;
  categories?: string[];
  locations?: string[];
}

export interface SupplierComparisonPayload extends BaseArtifactPayload {
  type: 'supplier_comparison';
  suppliers: unknown[]; // Array of suppliers to compare
}

export interface PortfolioDashboardPayload extends BaseArtifactPayload {
  type: 'portfolio_dashboard';
  portfolio?: unknown; // Portfolio data object
  totalSuppliers?: number;
  distribution?: {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
  };
  trends?: {
    period: string;
    newHighRisk: number;
    improved: number;
    deteriorated: number;
  };
  alerts?: Array<{
    id: string;
    headline: string;
    type: 'critical' | 'warning' | 'info';
    affectedCount: number;
    timestamp: string;
  }>;
  topMovers?: Array<{
    id: string;
    name: string;
    previousScore: number;
    currentScore: number;
    direction: 'up' | 'down';
  }>;
  lastUpdated?: string;
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

// Value Ladder Payloads
export interface AnalystConnectPayload extends BaseArtifactPayload {
  type: 'analyst_connect';
  analystConnect: {
    available: boolean;
    analyst?: {
      id: string;
      name: string;
      title: string;
      specialty: string;
      photo?: string;
      availability: 'available' | 'busy' | 'offline';
      responseTime: string;
    };
    cta: string;
    context?: {
      queryId: string;
      relevantSection?: string;
    };
  };
  queryContext?: {
    queryId?: string;
    queryText?: string;
    relevantSection?: string;
  };
}

export interface ExpertRequestPayload extends BaseArtifactPayload {
  type: 'expert_request';
  expertDeepDive: {
    available: boolean;
    matchedExpert?: {
      id: string;
      name: string;
      title: string;
      formerCompany: string;
      expertise: string;
      isTopVoice: boolean;
    };
    isPremium: true;
    cta: string;
    recommendedBy?: {
      analystName: string;
      reason: string;
    };
  };
  queryContext?: {
    queryId?: string;
    queryText?: string;
    topic?: string;
  };
}

export interface CommunityEmbedPayload extends BaseArtifactPayload {
  type: 'community_embed';
  community: {
    available: boolean;
    relatedThreadCount: number;
    topThread?: {
      id: string;
      title: string;
      replyCount: number;
      category: string;
    };
    cta: string;
  };
  queryContext?: {
    queryId?: string;
    queryText?: string;
    topic?: string;
  };
}

export interface DeeperAnalysisPayload extends BaseArtifactPayload {
  type: 'deeper_analysis';
  // Query context
  queryText?: string;
  category?: string;
  // Use existing ValueLadder - no type changes needed
  valueLadder: import('../../types/aiResponse').ValueLadder;
  // App state passed as props (not baked into ValueLadder)
  isManaged: boolean;
  // Credits from CREDIT_COSTS (centralized)
  credits: {
    upgrade: number;
    analyst: number;
    expert: number;
  };
}

export interface UpgradeConfirmPayload extends BaseArtifactPayload {
  type: 'upgrade_confirm';
  category: string;
  credits: number;
  balanceAfter: number;
}

export interface AnalystMessagePayload extends BaseArtifactPayload {
  type: 'analyst_message';
  analyst: {
    name: string;
    specialty: string;
    photo?: string;
    availability?: 'available' | 'busy' | 'offline';
    responseTime?: string;
  };
  category: string;
  isManaged: boolean;
  queryContext?: string;
  credits: number;
}

export interface ExpertBriefingPayload extends BaseArtifactPayload {
  type: 'expert_briefing';
  expert: {
    id: string;
    name: string;
    title: string;
    formerCompany?: string;
    expertise?: string;
    isTopVoice?: boolean;
  };
  category: string;
  credits: number;
  balanceAfter: number;
  requiresApproval?: boolean;
}

export interface ReportViewerPayload extends BaseArtifactPayload {
  type: 'report_viewer';
  report: {
    id: string;
    title: string;
    category: string;
    publishedDate: string;
    author?: string;
    summary?: string;
    url?: string; // External URL or internal path
    pdfUrl?: string;
    sections?: Array<{
      title: string;
      content: string;
    }>;
  };
  queryContext?: {
    queryText?: string;
    highlightTerms?: string[];
  };
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
  | AnalystConnectPayload
  | ExpertRequestPayload
  | CommunityEmbedPayload
  | DeeperAnalysisPayload
  | UpgradeConfirmPayload
  | AnalystMessagePayload
  | ExpertBriefingPayload
  | ReportViewerPayload
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
