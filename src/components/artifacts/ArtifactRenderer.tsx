/* eslint-disable react-refresh/only-export-components -- Exports utility functions alongside component */
/* eslint-disable @typescript-eslint/no-explicit-any -- Artifact payloads are intentionally loosely typed */
// Artifact Renderer
// Renders the appropriate artifact component based on type

import { ReactNode } from 'react';
import { ArtifactType, ArtifactPayload, getArtifactMeta } from './registry';

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

// Import inflation artifacts
import { InflationDashboardArtifact } from './views/InflationDashboardArtifact';
import { DriverAnalysisArtifact } from './views/DriverAnalysisArtifact';
import { ImpactAnalysisArtifact } from './views/ImpactAnalysisArtifact';
import { ScenarioPlannerArtifact } from './views/ScenarioPlannerArtifact';
import { JustificationReportArtifact } from './views/JustificationReportArtifact';
import { ExecutivePresentationArtifact } from './views/ExecutivePresentationArtifact';
import { CommodityDashboardArtifact } from './views/CommodityDashboardArtifact';

// Import value ladder artifacts
import { AnalystConnectArtifact } from '../panel/AnalystConnectArtifact';
import { ExpertRequestArtifact } from '../panel/ExpertRequestArtifact';
import { CommunityEmbedArtifact } from '../panel/CommunityEmbedArtifact';
import { DeeperAnalysisArtifact } from './views/DeeperAnalysisArtifact';
import { UpgradeConfirmArtifact } from './views/UpgradeConfirmArtifact';
import { AnalystMessageArtifact } from './views/AnalystMessageArtifact';
import { ExpertBriefingArtifact } from './views/ExpertBriefingArtifact';

// Import content viewer artifacts
import { ReportViewerArtifact } from '../panel/ReportViewerArtifact';

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
        <h4 className="text-sm font-medium text-slate-900 mb-2">{aiContent.title}</h4>
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
  // Get metadata for the artifact (unused but available for future use)
  const _meta = getArtifactMeta(type);
  void _meta;

  // Render based on type
  switch (type) {
    // Insight & Analysis
    case 'insight_detail':
      return (
        <div className="p-6">
          <InsightDetailArtifact
            data={(payload as unknown as { data: unknown }).data}
            isExpanded={isExpanded}
          />
        </div>
      );

    case 'trend_analysis':
      return <ArtifactPlaceholder type={type} />;

    case 'factor_breakdown':
      {
        const factorPayload = payload as unknown as Record<string, unknown>;
        const factorAiContent = factorPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={factorAiContent} />
            <div className="flex-1 min-h-0">
              <FactorBreakdownArtifact
                supplierName={factorPayload.supplierName as string}
                supplierId={factorPayload.supplierId as string | undefined}
                overallScore={factorPayload.overallScore as number}
                previousScore={factorPayload.previousScore as number | undefined}
                level={factorPayload.level as import('../../types/supplier').RiskLevel}
                trend={factorPayload.trend as 'improving' | 'stable' | 'worsening' | undefined}
                lastUpdated={factorPayload.lastUpdated as string | undefined}
                factors={(factorPayload.factors as import('./views/FactorBreakdownArtifact').FactorData[]) || []}
                scoreHistory={factorPayload.scoreHistory as import('./views/FactorBreakdownArtifact').HistoryPoint[] | undefined}
                contributingEvents={factorPayload.contributingEvents as import('./views/FactorBreakdownArtifact').ContributingEvent[] | undefined}
                onViewDashboard={() => onAction?.('view_dashboard')}
                onExport={() => onAction?.('export')}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'news_events':
      {
        const newsPayload = payload as unknown as Record<string, unknown>;
        const newsAiContent = newsPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={newsAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <NewsEventsArtifact
                title={newsPayload.title as string | undefined}
                context={newsPayload.context as { type: 'supplier' | 'portfolio'; name?: string; id?: string } | undefined}
                events={(newsPayload.events as import('./views/NewsEventsArtifact').NewsEvent[]) || []}
                onSetAlert={() => onAction?.('set_alert')}
                onExport={() => onAction?.('export')}
                onEventClick={(event) => onAction?.('event_click', event)}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    // Supplier Views
    case 'supplier_detail':
      {
        const detailPayload = payload as unknown as Record<string, unknown>;
        const detailAiContent = detailPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={detailAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <SupplierDetailArtifact
                supplier={detailPayload.supplier as any}
                onBack={onClose}
                onFindAlternatives={() => onAction?.('find_alternatives', detailPayload.supplier)}
                onAddToShortlist={() => onAction?.('add_to_shortlist', detailPayload.supplier)}
                onViewDashboard={() => onAction?.('view_dashboard')}
              />
            </div>
          </div>
        );
      }

    case 'supplier_table':
      {
        const tablePayload = payload as unknown as Record<string, unknown>;
        const suppliers = (tablePayload.suppliers as Array<{ id?: string }>) || [];
        const totalCount = (tablePayload.totalCount as number) ?? suppliers.length;
        const categories = (tablePayload.categories as string[]) || [];
        const locations = (tablePayload.locations as string[]) || [];
        const supplierIds = suppliers.map((supplier) => supplier.id).filter(Boolean);
        const aiContent = tablePayload.aiContent as AIContent | undefined;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={aiContent} />
            <div className="flex-1 min-h-0">
              <SupplierTableArtifact
                suppliers={suppliers as any}
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
        const compPayload = payload as unknown as Record<string, unknown>;
        const compSuppliers = (compPayload.suppliers as Array<{ id?: string }>) || [];
        const compAiContent = compPayload.aiContent as AIContent | undefined;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={compAiContent} />
            <div className="flex-1 min-h-0">
              <ComparisonArtifact
                suppliers={compSuppliers as any}
                onSelectSupplier={(supplier) => onAction?.('select_supplier', supplier)}
                onExport={() => onAction?.('export', {
                  context: 'comparison',
                  entityIds: compSuppliers.map((supplier) => supplier.id).filter(Boolean),
                })}
                onViewDashboard={() => onAction?.('view_dashboard')}
              />
            </div>
          </div>
        );
      }

    case 'supplier_alternatives':
      {
        const altPayload = payload as unknown as Record<string, unknown>;
        const altAiContent = altPayload.aiContent as AIContent | undefined;

        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={altAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <AlternativesArtifact
                currentSupplier={altPayload.currentSupplier as { id: string; name: string; score: number; category: string }}
                alternatives={(altPayload.alternatives as import('./views/AlternativesArtifact').AlternativeSupplier[]) || []}
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
      {
        const alertPayload = payload as unknown as Record<string, unknown>;
        return (
          <AlertConfigArtifact
            supplierId={alertPayload.supplierId as string | undefined}
            supplierName={alertPayload.supplierName as string | undefined}
            currentScore={alertPayload.currentScore as number | undefined}
            onSave={(config) => onAction?.('alert_created', config)}
            onCancel={onClose}
          />
        );
      }

    case 'export_builder':
      {
        const exportPayload = payload as unknown as Record<string, unknown>;
        return (
          <ExportBuilderArtifact
            context={exportPayload.context as 'supplier' | 'portfolio' | 'comparison' | undefined}
            entityName={exportPayload.entityName as string | undefined}
            entityIds={exportPayload.entityIds as string[] | undefined}
            onExport={(config) => onAction?.('export_complete', config)}
            onCancel={onClose}
          />
        );
      }

    case 'watchlist_manage':
    case 'assessment_request':
      return <ArtifactPlaceholder type={type} />;

    // Discovery
    case 'portfolio_dashboard':
      {
        const portfolioPayload = payload as unknown as Record<string, unknown>;
        const totalSuppliers = (portfolioPayload.totalSuppliers as number) ?? 0;
        const distribution = (portfolioPayload.distribution as { high: number; mediumHigh: number; medium: number; low: number; unrated: number }) || {
          high: 0,
          mediumHigh: 0,
          medium: 0,
          low: 0,
          unrated: 0,
        };
        const trends = (portfolioPayload.trends as { period: string; newHighRisk: number; improved: number; deteriorated: number }) || { period: '30d', newHighRisk: 0, improved: 0, deteriorated: 0 };
        const alerts = (portfolioPayload.alerts as Array<{ id: string; headline: string; type: 'critical' | 'warning' | 'info'; affectedCount: number; timestamp: string }>) || [];
        const topMovers = (portfolioPayload.topMovers as Array<{ id: string; name: string; previousScore: number; currentScore: number; direction: 'up' | 'down' }>) || [];
        const lastUpdated = (portfolioPayload.lastUpdated as string) || new Date().toISOString();
        const portfolioAiContent = portfolioPayload.aiContent as AIContent | undefined;

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

    // Inflation Watch Artifacts
    case 'inflation_dashboard':
      {
        const inflationPayload = payload as unknown as Record<string, unknown>;
        const inflationAiContent = inflationPayload.aiContent as AIContent | undefined;
        const priceMovementsData = inflationPayload.priceMovements as { commodities?: unknown[] } | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={inflationAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <InflationDashboardArtifact
                period={inflationPayload.period as string | undefined}
                summary={inflationPayload.summary as import('./views/InflationDashboardArtifact').InflationSummary | undefined}
                priceMovements={(priceMovementsData?.commodities as import('./views/InflationDashboardArtifact').PriceMovement[]) || []}
                drivers={(inflationPayload.drivers as import('../../types/inflation').InflationDriver[]) || []}
                alerts={(inflationPayload.alerts as import('./views/InflationDashboardArtifact').InflationAlert[]) || []}
                onExport={() => onAction?.('export')}
                onDrillDown={(commodity) => onAction?.('drill_down', { commodity })}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'driver_analysis':
      {
        const driverPayload = payload as unknown as Record<string, unknown>;
        const driverAiContent = driverPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={driverAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <DriverAnalysisArtifact
                commodity={driverPayload.commodity as string | undefined}
                period={driverPayload.period as string | undefined}
                priceChange={driverPayload.priceChange as import('../../types/inflation').PriceChange | undefined}
                drivers={(driverPayload.drivers as import('../../types/inflation').InflationDriver[]) || []}
                driverContributions={(driverPayload.driverContributions as import('./views/DriverAnalysisArtifact').DriverContribution[]) || []}
                marketNews={(driverPayload.marketNews as import('./views/DriverAnalysisArtifact').MarketNews[]) || []}
                historicalDrivers={(driverPayload.historicalDrivers as import('./views/DriverAnalysisArtifact').HistoricalDriver[]) || []}
                marketContext={driverPayload.marketContext as string | undefined}
                sources={(driverPayload.sources as Array<{ title: string; source: string; url?: string }>) || []}
                onExport={() => onAction?.('export')}
                onViewCommodity={() => onAction?.('view_commodity')}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'impact_analysis':
      {
        const impactPayload = payload as unknown as Record<string, unknown>;
        const impactAiContent = impactPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={impactAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <ImpactAnalysisArtifact
                period={impactPayload.period as string | undefined}
                exposure={impactPayload.exposure as import('../../types/inflation').InflationExposure | undefined}
                riskCorrelation={impactPayload.riskCorrelation as { highRiskHighExposure: number; concentrationRisk: import('./views/ImpactAnalysisArtifact').ConcentrationRisk[] } | undefined}
                budgetImpact={impactPayload.budgetImpact as import('./views/ImpactAnalysisArtifact').BudgetImpact | undefined}
                mitigationOptions={(impactPayload.mitigationOptions as import('./views/ImpactAnalysisArtifact').MitigationOption[]) || []}
                onExport={() => onAction?.('export')}
                onDrillDown={(dimension, value) => onAction?.('drill_down', { dimension, value })}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'scenario_planner':
      {
        const scenarioPayload = payload as unknown as Record<string, unknown>;
        const scenarioAiContent = scenarioPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={scenarioAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <ScenarioPlannerArtifact
                scenarios={(scenarioPayload.scenarios as import('../../types/inflation').InflationScenario[]) || []}
                baselineData={scenarioPayload.baselineData as { totalSpend: number; byCategory: Array<{ category: string; spend: number }>; bySupplier: Array<{ supplier: string; spend: number }> } | undefined}
                availableFactors={(scenarioPayload.availableFactors as Array<{ factor: string; currentValue: number; unit: string; historicalRange: { min: number; max: number } }>) || []}
                onExport={() => onAction?.('export')}
                onCreateScenario={(assumptions) => onAction?.('create_scenario', { assumptions })}
                onSelectScenario={(scenario) => onAction?.('select_scenario', scenario)}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'justification_report':
      {
        const justificationPayload = payload as unknown as Record<string, unknown>;
        const justificationAiContent = justificationPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={justificationAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <JustificationReportArtifact
                justification={justificationPayload.justification as import('../../types/inflation').PriceJustification | undefined}
                historicalPricing={(justificationPayload.historicalPricing as import('./views/JustificationReportArtifact').HistoricalPricing[]) || []}
                competitorPricing={(justificationPayload.competitorPricing as import('./views/JustificationReportArtifact').CompetitorPricing[]) || []}
                contractTerms={justificationPayload.contractTerms as import('./views/JustificationReportArtifact').ContractTerms | undefined}
                onExport={() => onAction?.('export')}
                onStartNegotiation={() => onAction?.('start_negotiation')}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'executive_presentation':
      {
        const execPayload = payload as unknown as Record<string, unknown>;
        const execAiContent = execPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={execAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <ExecutivePresentationArtifact
                title={execPayload.title as string | undefined}
                period={execPayload.period as string | undefined}
                summary={execPayload.summary as string | undefined}
                keyMetrics={(execPayload.keyMetrics as import('./views/ExecutivePresentationArtifact').KeyMetric[]) || []}
                highlights={(execPayload.highlights as import('./views/ExecutivePresentationArtifact').Highlight[]) || []}
                talkingPoints={(execPayload.talkingPoints as import('./views/ExecutivePresentationArtifact').TalkingPoint[]) || []}
                outlook={execPayload.outlook as string | undefined}
                nextSteps={(execPayload.nextSteps as string[]) || []}
                shareableUrl={execPayload.shareableUrl as string | undefined}
                onExport={() => onAction?.('export')}
                onShare={() => onAction?.('share')}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'commodity_dashboard':
      {
        const commodityPayload = payload as unknown as Record<string, unknown>;
        const commodityAiContent = commodityPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={commodityAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <CommodityDashboardArtifact
                commodity={commodityPayload.commodity as import('../../types/inflation').CommodityPrice | undefined}
                drivers={(commodityPayload.drivers as import('../../types/inflation').InflationDriver[]) || []}
                exposure={commodityPayload.exposure as import('../../types/inflation').CommodityExposure | undefined}
                affectedSuppliers={(commodityPayload.affectedSuppliers as import('../../types/inflation').SupplierExposure[]) || []}
                historicalComparison={(commodityPayload.historicalComparison as import('./views/CommodityDashboardArtifact').HistoricalComparison[]) || []}
                forecast={commodityPayload.forecast as import('../../types/inflation').PriceForecast | undefined}
                relatedCommodities={(commodityPayload.relatedCommodities as import('./views/CommodityDashboardArtifact').RelatedCommodity[]) || []}
                onExport={() => onAction?.('export')}
                onSetAlert={() => onAction?.('set_alert')}
                onViewSupplier={(supplierId) => onAction?.('view_supplier', { supplierId })}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    case 'spend_analysis':
      {
        const spendPayload = payload as unknown as Record<string, unknown>;
        const spendAiContent = spendPayload.aiContent as AIContent | undefined;
        return (
          <div className="flex flex-col h-full">
            <AIContentSection aiContent={spendAiContent} />
            <div className="flex-1 min-h-0 overflow-auto">
              <SpendAnalysisArtifact
                totalSpend={spendPayload.totalSpend as number}
                totalSpendFormatted={spendPayload.totalSpendFormatted as string}
                byRiskLevel={(spendPayload.byRiskLevel as import('./views/SpendAnalysisArtifact').SpendByRiskLevel[]) || []}
                byCategory={(spendPayload.byCategory as import('./views/SpendAnalysisArtifact').SpendByCategory[]) || []}
                byRegion={(spendPayload.byRegion as import('./views/SpendAnalysisArtifact').SpendByRegion[]) || []}
                concentrationWarnings={spendPayload.concentrationWarnings as import('./views/SpendAnalysisArtifact').ConcentrationWarning[] | undefined}
                trend={spendPayload.trend as { direction: 'up' | 'down' | 'stable'; percent: number; period: string } | undefined}
                onExport={() => onAction?.('export')}
                onDrillDown={(dimension, value) => onAction?.('drill_down', { dimension, value })}
                onClose={onClose}
              />
            </div>
          </div>
        );
      }

    // Value Ladder (4-Layer System)
    case 'analyst_connect':
      {
        const analystPayload = payload as unknown as Record<string, unknown>;
        return (
          <AnalystConnectArtifact
            analystConnect={analystPayload.analystConnect as import('./registry').AnalystConnectPayload['analystConnect']}
            queryContext={analystPayload.queryContext as { queryId?: string; queryText?: string; relevantSection?: string } | undefined}
            onScheduleCall={(analystId, slot) => onAction?.('schedule_call', { analystId, slot })}
            onSendQuestion={(analystId, question) => onAction?.('send_question', { analystId, question })}
          />
        );
      }

    case 'expert_request':
      {
        const expertPayload = payload as unknown as Record<string, unknown>;
        return (
          <ExpertRequestArtifact
            expertDeepDive={expertPayload.expertDeepDive as import('./registry').ExpertRequestPayload['expertDeepDive']}
            queryContext={expertPayload.queryContext as { queryId?: string; queryText?: string; topic?: string } | undefined}
            onRequestIntro={(expertId, briefing, projectType) =>
              onAction?.('request_expert_intro', { expertId, briefing, projectType })
            }
          />
        );
      }

    case 'community_embed':
      {
        const communityPayload = payload as unknown as Record<string, unknown>;
        return (
          <CommunityEmbedArtifact
            community={communityPayload.community as import('./registry').CommunityEmbedPayload['community']}
            queryContext={communityPayload.queryContext as { queryId?: string; queryText?: string; topic?: string } | undefined}
            onViewThread={(threadId) => onAction?.('view_thread', { threadId })}
            onStartDiscussion={(title, body) => onAction?.('start_discussion', { title, body })}
            onViewAll={() => onAction?.('view_all_discussions')}
          />
        );
      }

    case 'deeper_analysis':
      {
        const deeperPayload = payload as unknown as import('./registry').DeeperAnalysisPayload;
        return (
          <DeeperAnalysisArtifact
            queryText={deeperPayload.queryText}
            category={deeperPayload.category}
            valueLadder={deeperPayload.valueLadder}
            isManaged={deeperPayload.isManaged}
            credits={deeperPayload.credits}
            onRequestUpgrade={() => onAction?.('open_upgrade_confirm', deeperPayload)}
            onMessageAnalyst={() => onAction?.('open_analyst_message', deeperPayload)}
            onRequestExpert={() => onAction?.('open_expert_briefing', deeperPayload)}
          />
        );
      }

    case 'upgrade_confirm':
      {
        const upgradePayload = payload as unknown as import('./registry').UpgradeConfirmPayload;
        return (
          <UpgradeConfirmArtifact
            category={upgradePayload.category}
            credits={upgradePayload.credits}
            balanceAfter={upgradePayload.balanceAfter}
            onConfirm={(context) => onAction?.('confirm_upgrade', { context })}
            onBack={() => onAction?.('back_to_deeper_analysis')}
          />
        );
      }

    case 'analyst_message':
      {
        const analystPayload = payload as unknown as import('./registry').AnalystMessagePayload;
        return (
          <AnalystMessageArtifact
            analyst={analystPayload.analyst}
            category={analystPayload.category}
            isManaged={analystPayload.isManaged}
            queryContext={analystPayload.queryContext}
            credits={analystPayload.credits}
            onSend={(message) => onAction?.('send_analyst_message', { message })}
            onBack={() => onAction?.('back_to_deeper_analysis')}
          />
        );
      }

    case 'expert_briefing':
      {
        const expertPayload = payload as unknown as import('./registry').ExpertBriefingPayload;
        return (
          <ExpertBriefingArtifact
            expert={expertPayload.expert}
            category={expertPayload.category}
            credits={expertPayload.credits}
            balanceAfter={expertPayload.balanceAfter}
            requiresApproval={expertPayload.requiresApproval}
            onSubmit={(briefing, scheduling) => onAction?.('submit_expert_request', { briefing, scheduling })}
            onBack={() => onAction?.('back_to_deeper_analysis')}
          />
        );
      }

    case 'report_viewer':
      {
        const reportPayload = payload as unknown as Record<string, unknown>;
        return (
          <ReportViewerArtifact
            report={reportPayload.report as import('./registry').ReportViewerPayload['report']}
            queryContext={reportPayload.queryContext as { queryText?: string; highlightTerms?: string[] } | undefined}
          />
        );
      }

    default:
      {
        const fallbackPayload = payload as unknown as Record<string, unknown>;
        const fallbackAiContent = fallbackPayload.aiContent as AIContent | undefined;
        if (fallbackAiContent) {
          return (
            <div className="flex flex-col h-full">
              <AIContentSection aiContent={fallbackAiContent} />
              <ArtifactPlaceholder type={type} />
            </div>
          );
        }
        return <ArtifactPlaceholder type={type} />;
      }
  }
};

// ============================================
// HELPER HOOK
// ============================================

export const useArtifactMeta = (type: ArtifactType) => {
  return getArtifactMeta(type);
};

export default ArtifactRenderer;
