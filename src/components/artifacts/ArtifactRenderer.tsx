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
// AI CONTENT SECTION
// ============================================

interface AIContent {
  title?: string;
  overview?: string;
  keyPoints?: string[];
  recommendations?: string[];
}

const AIContentSection = ({ aiContent }: { aiContent?: AIContent }) => {
  if (!aiContent || (!aiContent.overview && !aiContent.keyPoints?.length)) {
    return null;
  }

  return (
    <div className="px-5 py-4 bg-gradient-to-br from-violet-50/50 to-slate-50 border-b border-slate-100">
      {aiContent.title && (
        <h4 className="text-sm font-semibold text-slate-900 mb-2">{aiContent.title}</h4>
      )}
      {aiContent.overview && (
        <p className="text-sm text-slate-600 leading-relaxed mb-3">{aiContent.overview}</p>
      )}
      {aiContent.keyPoints && aiContent.keyPoints.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Key Points</span>
          <ul className="space-y-1">
            {aiContent.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
      {aiContent.recommendations && aiContent.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recommendations</span>
          <ul className="mt-1.5 space-y-1">
            {aiContent.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-violet-500 shrink-0">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

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
          onFindAlternatives={() => onAction?.('find_alternatives', (payload as any).supplier)}
          onAddToShortlist={() => onAction?.('add_to_shortlist', (payload as any).supplier)}
          onViewDashboard={() => onAction?.('view_dashboard')}
        />
      );

    case 'supplier_table':
      {
        const suppliers = (payload as any).suppliers || [];
        const totalCount = (payload as any).totalCount ?? suppliers.length;
        const categories = (payload as any).categories || [];
        const locations = (payload as any).locations || [];
        const supplierIds = suppliers.map((supplier: any) => supplier.id).filter(Boolean);
        const aiContent = (payload as any).aiContent;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={aiContent} />
            <div className="flex-1 min-h-0">
              <SupplierTableArtifact
                suppliers={suppliers}
                totalCount={totalCount}
                categories={categories}
                locations={locations}
                onSupplierClick={(supplier) => onAction?.('select_supplier', supplier)}
                onExport={() => onAction?.('export', { context: 'supplier', entityIds: supplierIds })}
              />
            </div>
          </div>
        );
      }

    case 'supplier_comparison':
      {
        const compSuppliers = (payload as any).suppliers || [];
        const compAiContent = (payload as any).aiContent;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={compAiContent} />
            <div className="flex-1 min-h-0">
              <ComparisonArtifact
                suppliers={compSuppliers}
                onSelectSupplier={(supplier) => onAction?.('select_supplier', supplier)}
                onExport={() => onAction?.('export', {
                  context: 'comparison',
                  entityIds: compSuppliers.map((supplier: any) => supplier.id).filter(Boolean),
                })}
                onViewDashboard={() => onAction?.('view_dashboard')}
              />
            </div>
          </div>
        );
      }

    case 'supplier_alternatives':
      {
        const altAiContent = (payload as any).aiContent;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={altAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <AlternativesArtifact
                currentSupplier={(payload as any).currentSupplier}
                alternatives={(payload as any).alternatives || []}
                onRequestAssessment={(ids) => onAction?.('request_assessment', ids)}
                onAddToShortlist={(ids) => onAction?.('add_to_shortlist', ids)}
                onSelectSupplier={(supplier) => onAction?.('select_supplier', supplier)}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

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
      {
        const totalSuppliers = (payload as any).totalSuppliers ?? 0;
        const distribution = (payload as any).distribution || {
          high: 0,
          mediumHigh: 0,
          medium: 0,
          low: 0,
          unrated: 0,
        };
        const trends = (payload as any).trends || { period: '30d', newHighRisk: 0, improved: 0, deteriorated: 0 };
        const alerts = (payload as any).alerts || [];
        const topMovers = (payload as any).topMovers || [];
        const lastUpdated = (payload as any).lastUpdated || new Date().toISOString();
        const portfolioAiContent = (payload as any).aiContent;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={portfolioAiContent} />
            <div className="flex-1 min-h-0">
              <PortfolioDashboardArtifact
                totalSuppliers={totalSuppliers}
                distribution={distribution}
                trends={trends}
                alerts={alerts}
                topMovers={topMovers}
                lastUpdated={lastUpdated}
                onExport={() => onAction?.('export', { context: 'portfolio' })}
                onSupplierClick={(supplier) => onAction?.('select_supplier', supplier)}
              />
            </div>
          </div>
        );
      }

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
