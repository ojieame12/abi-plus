import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThoughtProcess, ThoughtContent } from './ThoughtProcess';
import { InsightBanner } from './InsightBanner';
import { InsightBar } from './InsightBar';
import { SourcesDisplay } from './SourcesDisplay';
import { SourceAttribution } from './SourceAttribution';
import { SuggestedFollowUps } from './SuggestedFollowUps';
import { ResponseFeedback } from './ResponseFeedback';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { buildInsightFromSupplier, buildInsightFromPortfolio, findSupplierFromContext } from '../../utils/insightBuilder';
import type { WidgetData } from '../../types/widgets';
import type { IntentCategory } from '../../types/intents';
import type { Supplier, Portfolio, RiskChange } from '../../types/data';
import type { RiskPortfolio } from '../../types/supplier';
import type { ResponseInsight, ResponseSources } from '../../types/aiResponse';
import type { RenderContext } from '../../services/componentSelector';
import type { Milestone } from '../../services/ai';

interface ThoughtProcessData {
    duration?: string;
    content?: ThoughtContent;
    // New: Real milestones from AI processing
    milestones?: Milestone[];
    liveMilestones?: Milestone[];
}

// Legacy insight format (string or simple object)
interface LegacyInsightData {
    text: string;
    detail?: string;
    trend?: 'up' | 'down' | 'neutral';
}

// Legacy sources format
interface LegacySourcesData {
    webPages?: number;
    dataSources?: number;
    dataSourceName?: string;
}

interface FollowUpItem {
    id: string;
    text: string;
    icon?: 'chat' | 'search' | 'document' | 'chart' | 'alert';
}

// ============================================
// WIDGET CONTEXT (for context-based rendering)
// ============================================

// AI-generated artifact content
interface ArtifactContent {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations?: string[];
}

interface WidgetContext {
    intent: IntentCategory;
    subIntent?: string;  // Sub-intent for granular widget selection
    portfolio?: Portfolio | RiskPortfolio; // Accept both types
    suppliers?: Supplier[];
    supplier?: Supplier;
    riskChanges?: RiskChange[];
    widgetData?: WidgetData;
    artifactContent?: ArtifactContent; // AI-generated content for artifact panel
    renderContext?: RenderContext;
    onOpenArtifact?: (type: string, payload: Record<string, unknown>) => void;
}

// ============================================
// PROPS
// ============================================

interface AIResponseProps {
    // Optional: Thought process section
    thoughtProcess?: ThoughtProcessData;

    // Optional: Acknowledgement header (greeting)
    acknowledgement?: string;

    // Required: Main response content (narrative)
    children: ReactNode;

    // Optional: Detailed summary shown above widget
    // This is AI-generated widgetContent.summary or artifactContent.overview
    detailSummary?: string;

    // Widget rendering - two modes:
    // 1. Direct ReactNode (legacy) - just render as-is
    widget?: ReactNode;
    // 2. Context-based (new) - use WidgetRenderer with component selection
    widgetContext?: WidgetContext;

    // Optional: Key insight highlight
    // Supports both legacy format and new ResponseInsight format
    insight?: string | LegacyInsightData | ResponseInsight;

    // Sources - supports both legacy and new format
    sources?: LegacySourcesData | ResponseSources;

    // Follow-up suggestions
    followUps?: FollowUpItem[];
    onFollowUpClick?: (item: FollowUpItem) => void;

    // Callbacks
    onDownload?: () => void;
    onFeedback?: (type: 'up' | 'down') => void;
    onRefresh?: () => void;
    onWidgetExpand?: (artifactComponent: string) => void;
    onInsightClick?: (insightData: any) => void;

    // Animation control
    isAnimating?: boolean; // When true, plays staggered entrance animation
}

// ============================================
// TYPE GUARDS
// ============================================

const isResponseInsight = (insight: unknown): insight is ResponseInsight => {
    return typeof insight === 'object' && insight !== null && 'headline' in insight;
};

const isResponseSources = (sources: unknown): sources is ResponseSources => {
    return typeof sources === 'object' && sources !== null && ('web' in sources || 'internal' in sources);
};

// ============================================
// MAIN COMPONENT
// ============================================

// Animation timing constants (in ms)
const ANIMATION_TIMING = {
    thinkingDuration: 2200,    // How long thinking phase lasts (4 steps @ 400ms each + 600ms buffer)
    bodyDelay: 200,            // After thinking, body fades in
    widgetDelay: 500,          // Widget slides in
    insightDelay: 900,         // Insight bar grows
    footerDelay: 1200,         // Sources + feedback appear
    followUpsDelay: 1500,      // Follow-ups stagger in
};

export const AIResponse = ({
    thoughtProcess,
    acknowledgement,
    children,
    detailSummary,
    widget,
    widgetContext,
    insight,
    sources,
    followUps = [],
    onFollowUpClick,
    onDownload,
    onFeedback,
    onRefresh,
    onWidgetExpand,
    onInsightClick,
    isAnimating = false,
}: AIResponseProps) => {

    // Animation phase state
    const [phase, setPhase] = useState<'thinking' | 'body' | 'complete'>(
        isAnimating ? 'thinking' : 'complete'
    );
    const [showBody, setShowBody] = useState(!isAnimating);
    const [showWidget, setShowWidget] = useState(!isAnimating);
    const [showInsight, setShowInsight] = useState(!isAnimating);
    const [showFooter, setShowFooter] = useState(!isAnimating);
    const [showFollowUps, setShowFollowUps] = useState(!isAnimating);

    // Orchestrate animation phases
    useEffect(() => {
        if (!isAnimating) {
            setPhase('complete');
            setShowBody(true);
            setShowWidget(true);
            setShowInsight(true);
            setShowFooter(true);
            setShowFollowUps(true);
            return;
        }

        // Phase 1: Thinking
        setPhase('thinking');

        // Phase 2: Body appears after thinking
        const bodyTimer = setTimeout(() => {
            setPhase('body');
            setShowBody(true);
        }, ANIMATION_TIMING.thinkingDuration);

        // Widget appears
        const widgetTimer = setTimeout(() => {
            setShowWidget(true);
        }, ANIMATION_TIMING.thinkingDuration + ANIMATION_TIMING.widgetDelay);

        // Insight appears
        const insightTimer = setTimeout(() => {
            setShowInsight(true);
        }, ANIMATION_TIMING.thinkingDuration + ANIMATION_TIMING.insightDelay);

        // Footer appears
        const footerTimer = setTimeout(() => {
            setShowFooter(true);
        }, ANIMATION_TIMING.thinkingDuration + ANIMATION_TIMING.footerDelay);

        // Follow-ups appear
        const followUpsTimer = setTimeout(() => {
            setShowFollowUps(true);
            setPhase('complete');
        }, ANIMATION_TIMING.thinkingDuration + ANIMATION_TIMING.followUpsDelay);

        return () => {
            clearTimeout(bodyTimer);
            clearTimeout(widgetTimer);
            clearTimeout(insightTimer);
            clearTimeout(footerTimer);
            clearTimeout(followUpsTimer);
        };
    }, [isAnimating]);

    // ========================================
    // RENDER WIDGET
    // ========================================
    const renderWidget = () => {
        // Priority 1: Context-based rendering
        if (widgetContext) {
            return (
                <WidgetRenderer
                    intent={widgetContext.intent}
                    subIntent={widgetContext.subIntent}
                    renderContext={widgetContext.renderContext || 'chat'}
                    portfolio={widgetContext.portfolio}
                    suppliers={widgetContext.suppliers}
                    supplier={widgetContext.supplier}
                    riskChanges={widgetContext.riskChanges}
                    widget={widgetContext.widgetData}
                    artifactContent={widgetContext.artifactContent}
                    onExpand={onWidgetExpand}
                    onOpenArtifact={widgetContext.onOpenArtifact}
                />
            );
        }

        // Priority 2: Direct ReactNode widget (legacy)
        if (widget) {
            return widget;
        }

        return null;
    };

    // ========================================
    // RENDER INSIGHT
    // ========================================
    const renderInsight = () => {
        if (!insight) return null;

        // Build insight data using utility functions with real supplier data
        const handleInsightClick = () => {
            if (!onInsightClick) return;

            // Get headline text
            const headlineText = isResponseInsight(insight) ? insight.headline : (typeof insight === 'string' ? insight : insight.text);

            // Extract entity name from headline for supplier lookup
            const extractEntityFromHeadline = (text: string): string | null => {
                const patterns = [/^(.+?)\s+Risk\s/i, /^(.+?)'s\s+score/i, /^(.+?):\s/, /^(.+?)\s+score\s/i];
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match) return match[1].trim();
                }
                return null;
            };

            const entityName = extractEntityFromHeadline(headlineText);

            // Build sources from response data
            const insightSources = sources && isResponseSources(sources) ? {
                web: sources.web?.slice(0, 3).map(s => ({ name: s.name, url: s.url })),
                internal: sources.internal?.slice(0, 3).map(s => ({ name: s.name, type: s.type || 'data' })),
            } : undefined;

            // CHECK: If insight already has rich data (from Gemini), use it directly
            if (isResponseInsight(insight) && insight.factors && insight.factors.length > 0) {
                // Use the AI-generated insight data with enrichments from enhanceResponseWithData
                const richInsight = insight as ResponseInsight;
                onInsightClick({
                    headline: richInsight.headline,
                    subheadline: richInsight.entity
                        ? `${richInsight.entity.name} - ${richInsight.entity.type === 'portfolio' ? 'Portfolio Overview' : 'Risk Assessment'}`
                        : (entityName ? `${entityName} - Risk Assessment` : 'Risk Intelligence Update'),
                    summary: richInsight.summary || richInsight.explanation || 'Click "View Full Profile" for detailed analysis.',
                    type: richInsight.type || 'info',
                    sentiment: richInsight.sentiment || 'neutral',
                    trend: richInsight.sentiment === 'negative' ? 'up' : richInsight.sentiment === 'positive' ? 'down' : 'stable',
                    entity: richInsight.entity,
                    metric: richInsight.metric ? {
                        ...richInsight.metric,
                        trend: richInsight.sentiment === 'negative' ? 'up' : richInsight.sentiment === 'positive' ? 'down' : 'stable',
                    } : undefined,
                    factors: richInsight.factors?.map(f => ({
                        title: f.title,
                        detail: f.detail,
                        trend: f.trend || (f.impact === 'negative' ? 'down' : f.impact === 'positive' ? 'up' : 'stable'),
                        impact: f.impact,
                    })),
                    trendData: richInsight.trendData,
                    actions: richInsight.actions?.map(a => ({
                        label: a.label,
                        action: a.action,
                        icon: a.icon as 'profile' | 'alert' | 'export' | 'compare' | 'escalate' | 'watchlist',
                    })),
                    sources: richInsight.sources || insightSources || {
                        internal: [{ name: 'Beroe Risk Intelligence', type: 'risk' }],
                    },
                    confidence: richInsight.confidence || 'high',
                    generatedAt: richInsight.generatedAt || new Date().toISOString(),
                });
                return;
            }

            // Try to find supplier from widgetContext or by name
            const supplier = widgetContext?.supplier ||
                (widgetContext?.suppliers && entityName ? findSupplierFromContext(entityName, widgetContext.suppliers as any) : undefined);

            // If we have a supplier, use the rich utility function
            if (supplier) {
                const insightData = buildInsightFromSupplier(
                    supplier as any, // Type cast to Supplier from supplier.ts
                    headlineText,
                    insightSources
                );
                onInsightClick(insightData);
                return;
            }

            // If we have portfolio data, use portfolio insight builder
            if (widgetContext?.portfolio) {
                const portfolio = widgetContext.portfolio;
                const distribution = portfolio.distribution || { high: 0, mediumHigh: 0, medium: 0, low: 0, unrated: 0 };
                const highRiskCount = (distribution.high || 0) + (distribution.mediumHigh || 0);
                const unratedCount = distribution.unrated || 0;
                const totalSuppliers = portfolio.totalSuppliers || 14;

                const insightData = buildInsightFromPortfolio(
                    headlineText,
                    {
                        label: 'Unrated Suppliers',
                        value: Math.round((unratedCount / totalSuppliers) * 100),
                        previousValue: Math.round((unratedCount / totalSuppliers) * 100) - 5,
                        unit: '%',
                    },
                    { totalSuppliers, highRiskCount, unratedCount },
                    insightSources
                );
                onInsightClick(insightData);
                return;
            }

            // Fallback: Build basic insight data without supplier context
            const sentiment = isResponseInsight(insight)
                ? insight.sentiment
                : (typeof insight !== 'string' && insight.trend === 'up' ? 'positive' : 'negative');

            const insightType = sentiment === 'negative' ? 'risk_alert' : sentiment === 'positive' ? 'opportunity' : 'info';

            onInsightClick({
                headline: headlineText,
                subheadline: entityName ? `${entityName} - Risk Assessment` : 'Portfolio Update',
                summary: isResponseInsight(insight)
                    ? insight.explanation || 'Click "View Full Profile" for detailed analysis.'
                    : (typeof insight !== 'string' && insight.detail) || 'Click "View Full Profile" for detailed analysis.',
                type: insightType,
                sentiment: sentiment || 'neutral',
                trend: sentiment === 'negative' ? 'up' : sentiment === 'positive' ? 'down' : 'stable',
                entity: entityName ? { name: entityName, type: 'supplier' as const } : undefined,
                factors: [
                    { title: 'Risk Assessment', detail: 'Analysis based on available data', trend: 'stable' as const, impact: 'neutral' as const },
                ],
                actions: [
                    { label: 'View Details', action: 'view_profile', icon: 'profile' as const },
                ],
                sources: insightSources || {
                    internal: [
                        { name: 'Beroe Risk Intelligence', type: 'risk' },
                    ],
                },
                confidence: 'medium' as const,
                generatedAt: new Date().toISOString(),
            });
        };

        // New ResponseInsight format
        if (isResponseInsight(insight)) {
            return <InsightBanner insight={insight} onClick={onInsightClick ? handleInsightClick : undefined} />;
        }

        // Legacy formats (string or LegacyInsightData)
        const legacyData: LegacyInsightData = typeof insight === 'string'
            ? { text: insight }
            : insight;

        return (
            <InsightBar
                text={legacyData.text}
                detail={legacyData.detail}
                trend={legacyData.trend}
                onClick={onInsightClick ? handleInsightClick : undefined}
            />
        );
    };

    // ========================================
    // RENDER SOURCES
    // ========================================
    const hasDetailedSources = sources && isResponseSources(sources);

    const renderSources = () => {
        if (!sources) return null;

        // New ResponseSources format
        if (isResponseSources(sources)) {
            return (
                <SourcesDisplay
                    sources={sources}
                />
            );
        }

        // Legacy format
        return (
            <SourceAttribution
                webPages={sources.webPages}
                dataSources={sources.dataSources}
                dataSourceName={sources.dataSourceName}
            />
        );
    };

    // Check if we should show the footer (feedback + sources)
    const hasFooter = sources || followUps.length > 0;

    // ========================================
    // RENDER
    // ========================================
    return (
        <div className="space-y-4">
            {/* 1. Thought Process - shows during thinking phase */}
            {thoughtProcess && (
                <div className="mb-6">
                    <ThoughtProcess
                        duration={thoughtProcess.duration}
                        milestones={thoughtProcess.milestones}
                        liveMilestones={thoughtProcess.liveMilestones}
                        isThinking={phase === 'thinking'}
                    />
                </div>
            )}

            {/* 2. Acknowledgement Header (Optional) */}
            <AnimatePresence>
                {showBody && acknowledgement && (
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-lg font-normal text-slate-900 tracking-tight"
                    >
                        {acknowledgement}
                    </motion.h3>
                )}
            </AnimatePresence>

            {/* 3. Response Detail (Required) */}
            <AnimatePresence>
                {showBody && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="leading-relaxed font-normal text-[15px]"
                        style={{ color: '#1D1D1D' }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3.5 Detail Summary (AI-generated widgetContent.summary) */}
            <AnimatePresence>
                {showBody && detailSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mt-3 p-4 bg-slate-50/70 border border-slate-100 rounded-xl"
                    >
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {detailSummary}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Information Widget (Conditional) */}
            <AnimatePresence>
                {showWidget && (widget || widgetContext) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="my-4"
                    >
                        {renderWidget()}
                        {/* Widget Sources Footer */}
                        {sources && isResponseSources(sources) && sources.totalInternalCount > 0 && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                    <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">B</span>
                                    </div>
                                    <span>{sources.totalInternalCount} Beroe Data Sources</span>
                                </button>
                                <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 font-medium transition-colors">
                                    <span>View Details</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 5. Abi Insight (Optional) - InsightBar has its own animation */}
            <AnimatePresence>
                {showInsight && insight && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {renderInsight()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 6. Response Feedback + Sources - Same row: feedback left, sources right */}
            <AnimatePresence>
                {showFooter && hasFooter && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between pt-3 gap-4"
                    >
                        <ResponseFeedback
                            onDownload={onDownload}
                            onThumbsUp={() => onFeedback?.('up')}
                            onThumbsDown={() => onFeedback?.('down')}
                            onRefresh={onRefresh}
                        />
                        <div className="flex-shrink-0">
                            {renderSources()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 7. Follow Ups - with stagger */}
            <AnimatePresence>
                {showFollowUps && followUps.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SuggestedFollowUps
                            items={followUps}
                            onItemClick={onFollowUpClick}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// HELPER COMPONENTS
// ============================================

export const ResponseSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="mb-4">
        <h4 className="font-normal text-primary mb-2">{title}</h4>
        <div className="text-secondary">{children}</div>
    </div>
);

export const ResponseList = ({ items }: { items: ReactNode[] }) => (
    <ul className="list-disc list-inside space-y-1 text-secondary">
        {items.map((item, i) => (
            <li key={i}>{item}</li>
        ))}
    </ul>
);

export const Highlight = ({ children }: { children: ReactNode }) => (
    <span className="font-medium text-slate-900">{children}</span>
);

export const HighlightBadge = ({ children, variant = 'default' }: {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
    const variantClasses = {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-1.5 py-0.5 rounded font-medium text-sm ${variantClasses[variant]}`}>
            {children}
        </span>
    );
};
