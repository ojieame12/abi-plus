// Artifact Renderer
// Renders the appropriate artifact component based on type

import { ReactNode } from 'react';
import { ArtifactType, ArtifactPayload, getArtifactTitle, getArtifactMeta } from './registry';

// Import existing artifacts
import { InsightDetailArtifact } from '../panel/InsightDetailArtifact';
import { SupplierDetailArtifact } from '../risk/artifacts/SupplierDetailArtifact';
import { SupplierTableArtifact } from '../risk/artifacts/SupplierTableArtifact';
import { ComparisonArtifact } from '../risk/artifacts/ComparisonArtifact';
import { PortfolioDashboardArtifact } from '../risk/artifacts/PortfolioDashboardArtifact';

// Import new action artifacts
import { AlertConfigArtifact } from './views/AlertConfigArtifact';
import { ExportBuilderArtifact } from './views/ExportBuilderArtifact';

// Import new insight/discovery artifacts
import { FactorBreakdownArtifact } from './views/FactorBreakdownArtifact';
import { AlternativesArtifact } from './views/AlternativesArtifact';
import { NewsEventsArtifact } from './views/NewsEventsArtifact';
import { SpendAnalysisArtifact } from './views/SpendAnalysisArtifact';

// ============================================
// TYPES
// ============================================

export interface ArtifactRendererProps {
  type: ArtifactType;
  payload: ArtifactPayload;
  isExpanded?: boolean;
  onClose?: () => void;
  onAction?: (action: string, data?: unknown) => void;
}

// ============================================
// PLACEHOLDER COMPONENT
// ============================================

const ArtifactPlaceholder = ({ type }: { type: string }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <span className="text-2xl">🚧</span>
    </div>
    <h3 className="text-lg font-medium text-slate-700 mb-2">
      Coming Soon
    </h3>
    <p className="text-sm text-slate-500 max-w-xs">
      The <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{type}</code> artifact is under development.
    </p>
  </div>
);

// ============================================
// RENDERER
// ============================================

export const ArtifactRenderer = ({
  type,
  payload,
  isExpanded = false,
  onClose,
  onAction,
}: ArtifactRendererProps): ReactNode => {
  // Get metadata for the artifact
  const meta = getArtifactMeta(type);

  // Render based on type
  switch (type) {
    // Insight & Analysis
    case 'insight_detail':
      return (
        <div className="p-6">
          <InsightDetailArtifact
            data={(payload as any).data}
            isExpanded={isExpanded}
          />
        </div>
      );

    case 'trend_analysis':
      return <ArtifactPlaceholder type={type} />;

    case 'factor_breakdown':
      return (
        <FactorBreakdownArtifact
          supplierName={(payload as any).supplierName}
          supplierId={(payload as any).supplierId}
          overallScore={(payload as any).overallScore}
          previousScore={(payload as any).previousScore}
          level={(payload as any).level}
          trend={(payload as any).trend}
          lastUpdated={(payload as any).lastUpdated}
          factors={(payload as any).factors || []}
          scoreHistory={(payload as any).scoreHistory}
          contributingEvents={(payload as any).contributingEvents}
          onViewDashboard={() => onAction?.('view_dashboard')}
          onExport={() => onAction?.('export')}
          onClose={onClose}
        />
      );

    case 'news_events':
      return (
        <NewsEventsArtifact
          title={(payload as any).title}
          context={(payload as any).context}
          events={(payload as any).events || []}
          onSetAlert={() => onAction?.('set_alert')}
          onExport={() => onAction?.('export')}
          onEventClick={(event) => onAction?.('event_click', event)}
          onClose={onClose}
        />
      );

    // Supplier Views
    case 'supplier_detail':
      return (
        <SupplierDetailArtifact
          supplier={(payload as any).supplier}
          onClose={onClose}
          onFindAlternatives={() => onAction?.('find_alternatives')}
          onAddToShortlist={() => onAction?.('add_to_shortlist')}
          onViewDashboard={() => onAction?.('view_dashboard')}
        />
      );

    case 'supplier_table':
      return (
        <SupplierTableArtifact
          suppliers={(payload as any).suppliers || []}
          filter={(payload as any).filter}
          onSupplierClick={(supplier) => onAction?.('select_supplier', supplier)}
          onExport={() => onAction?.('export')}
        />
      );

    case 'supplier_comparison':
      return (
        <ComparisonArtifact
          suppliers={(payload as any).suppliers || []}
          onSelectSupplier={(supplier) => onAction?.('select_supplier', supplier)}
        />
      );

    case 'supplier_alternatives':
      return (
        <AlternativesArtifact
          currentSupplier={(payload as any).currentSupplier}
          alternatives={(payload as any).alternatives || []}
          onRequestAssessment={(ids) => onAction?.('request_assessment', ids)}
          onAddToShortlist={(ids) => onAction?.('add_to_shortlist', ids)}
          onSelectSupplier={(supplier) => onAction?.('select_supplier', supplier)}
          onClose={onClose}
        />
      );

    // Actions
    case 'alert_config':
      return (
        <AlertConfigArtifact
          supplierId={(payload as any).supplierId}
          supplierName={(payload as any).supplierName}
          currentScore={(payload as any).currentScore}
          onSave={(config) => onAction?.('alert_created', config)}
          onCancel={onClose}
        />
      );

    case 'export_builder':
      return (
        <ExportBuilderArtifact
          context={(payload as any).context}
          entityName={(payload as any).entityName}
          entityIds={(payload as any).entityIds}
          onExport={(config) => onAction?.('export_complete', config)}
          onCancel={onClose}
        />
      );

    case 'watchlist_manage':
    case 'assessment_request':
      return <ArtifactPlaceholder type={type} />;

    // Discovery
    case 'portfolio_dashboard':
      return (
        <PortfolioDashboardArtifact
          portfolio={(payload as any).portfolio}
          onSupplierClick={(supplier) => onAction?.('select_supplier', supplier)}
          onViewAllSuppliers={() => onAction?.('view_all_suppliers')}
        />
      );

    case 'category_overview':
    case 'regional_analysis':
      return <ArtifactPlaceholder type={type} />;

    case 'spend_analysis':
      return (
        <SpendAnalysisArtifact
          totalSpend={(payload as any).totalSpend}
          totalSpendFormatted={(payload as any).totalSpendFormatted}
          byRiskLevel={(payload as any).byRiskLevel || []}
          byCategory={(payload as any).byCategory || []}
          byRegion={(payload as any).byRegion || []}
          concentrationWarnings={(payload as any).concentrationWarnings}
          trend={(payload as any).trend}
          onExport={() => onAction?.('export')}
          onDrillDown={(dimension, value) => onAction?.('drill_down', { dimension, value })}
          onClose={onClose}
        />
      );

    default:
      return <ArtifactPlaceholder type={type} />;
  }
};

// ============================================
// HELPER HOOK
// ============================================

export const useArtifactMeta = (type: ArtifactType) => {
  return getArtifactMeta(type);
};

export default ArtifactRenderer;
