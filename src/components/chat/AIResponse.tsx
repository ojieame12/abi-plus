import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThoughtProcess } from './ThoughtProcess';
import { InsightBanner } from './InsightBanner';
import { InsightBar } from './InsightBar';
import { SourcesDisplay } from './SourcesDisplay';
import { SourceAttribution } from './SourceAttribution';
import { SuggestedFollowUps } from './SuggestedFollowUps';
import { ResponseFeedback } from './ResponseFeedback';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import type { WidgetData } from '../../types/widgets';
import type { IntentCategory } from '../../types/intents';
import type { Supplier, Portfolio, RiskChange } from '../../types/data';
import type { ResponseInsight, ResponseSources } from '../../types/aiResponse';
import type { RenderContext } from '../../services/componentSelector';

interface ThoughtProcessData {
    duration?: string;
    content?: {
        queryAnalysis?: {
            commodity?: string;
            informationNeeded?: string;
            timeSensitivity?: string;
            depthRequired?: string;
        };
        searchStrategy?: {
            priority?: string;
            bullets?: string[];
        };
        informationRetrieval?: {
            sources?: string[];
            dataQuality?: string;
        };
    };
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

interface WidgetContext {
    intent: IntentCategory;
    portfolio?: Portfolio;
    suppliers?: Supplier[];
    supplier?: Supplier;
    riskChanges?: RiskChange[];
    widgetData?: WidgetData;
    renderContext?: RenderContext;
}

// ============================================
// PROPS
// ============================================

interface AIResponseProps {
    // Optional: Thought process section
    thoughtProcess?: ThoughtProcessData;

    // Optional: Acknowledgement header
    acknowledgement?: string;

    // Required: Main response content
    children: ReactNode;

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
    thinkingDuration: 1800,    // How long thinking phase lasts
    bodyDelay: 200,            // After thinking, body fades in
    widgetDelay: 600,          // Widget slides in
    insightDelay: 1000,        // Insight bar grows
    footerDelay: 1400,         // Sources + feedback appear
    followUpsDelay: 1800,      // Follow-ups stagger in
};

export const AIResponse = ({
    thoughtProcess,
    acknowledgement,
    children,
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
                    renderContext={widgetContext.renderContext || 'chat'}
                    portfolio={widgetContext.portfolio}
                    suppliers={widgetContext.suppliers}
                    supplier={widgetContext.supplier}
                    riskChanges={widgetContext.riskChanges}
                    widget={widgetContext.widgetData}
                    onExpand={onWidgetExpand}
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

        // New ResponseInsight format
        if (isResponseInsight(insight)) {
            return <InsightBanner insight={insight} />;
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
            />
        );
    };

    // ========================================
    // RENDER SOURCES
    // ========================================
    const renderSources = () => {
        if (!sources) return null;

        // New ResponseSources format
        if (isResponseSources(sources)) {
            return (
                <SourcesDisplay
                    sources={sources}
                    compact={true}
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
                        content={thoughtProcess.content}
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
                        className="text-xl font-normal text-slate-900 tracking-tight"
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

            {/* 6. Response Feedback + Sources (only show for latest message) */}
            <AnimatePresence>
                {showFooter && hasFooter && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between pt-2"
                    >
                        <ResponseFeedback
                            onDownload={onDownload}
                            onThumbsUp={() => onFeedback?.('up')}
                            onThumbsDown={() => onFeedback?.('down')}
                            onRefresh={onRefresh}
                        />
                        {renderSources()}
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
