import { useState, useEffect } from 'react';
import { Clock, ChevronDown, Check, Loader2, LayoutGrid, Database, Lightbulb, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

interface ThoughtProcessProps {
    duration?: string;
    content?: ThoughtContent;
    isThinking?: boolean;
}

export interface ThoughtContent {
    // Query Understanding
    intent?: {
        detected: string; // e.g., "portfolio_overview", "supplier_deep_dive"
        displayName?: string; // e.g., "Portfolio Overview"
        confidence?: 'high' | 'medium' | 'low';
    };

    // Data Retrieved
    dataFound?: {
        type: string; // e.g., "portfolio", "suppliers", "risk_changes"
        summary: string; // e.g., "14 suppliers, $10B spend"
        count?: number;
    };

    // Widget Selection
    widgetSelection?: {
        type: string; // e.g., "risk_distribution", "supplier_table"
        displayName?: string; // e.g., "Risk Distribution Chart"
        reason: string; // e.g., "Best for visualizing portfolio breakdown"
    };

    // Sources Used
    sources?: string[];

    // Legacy fields for backwards compatibility
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
}

// ============================================
// THINKING STEPS (Dynamic based on what's happening)
// ============================================

const getThinkingSteps = (content?: ThoughtContent) => [
    {
        id: 1,
        icon: Search,
        text: 'Understanding your query...',
        completedText: content?.intent?.displayName
            ? `Intent: ${content.intent.displayName}`
            : 'Query analyzed',
        delay: 0,
    },
    {
        id: 2,
        icon: Database,
        text: 'Retrieving portfolio data...',
        completedText: content?.dataFound?.summary
            ? `Found: ${content.dataFound.summary}`
            : 'Data retrieved',
        delay: 400,
    },
    {
        id: 3,
        icon: LayoutGrid,
        text: 'Selecting visualization...',
        completedText: content?.widgetSelection?.displayName
            ? `Widget: ${content.widgetSelection.displayName}`
            : 'Visualization ready',
        delay: 800,
    },
    {
        id: 4,
        icon: Lightbulb,
        text: 'Generating insights...',
        completedText: 'Response ready',
        delay: 1200,
    },
];

// ============================================
// WIDGET DISPLAY NAMES
// ============================================

const WIDGET_DISPLAY_NAMES: Record<string, string> = {
    risk_distribution: 'Risk Distribution Chart',
    supplier_table: 'Supplier Table',
    supplier_risk_card: 'Supplier Risk Card',
    alert_card: 'Risk Alert Card',
    comparison_table: 'Comparison Table',
    price_gauge: 'Price Gauge',
    trend_chart: 'Trend Chart',
    none: 'Text Response',
};

const INTENT_DISPLAY_NAMES: Record<string, string> = {
    portfolio_overview: 'Portfolio Overview',
    filtered_discovery: 'Supplier Search',
    supplier_deep_dive: 'Supplier Analysis',
    trend_detection: 'Risk Changes',
    comparison: 'Supplier Comparison',
    market_context: 'Market Intelligence',
    explanation_why: 'Explanation',
    action_trigger: 'Action Request',
    restricted_query: 'Restricted Data',
    general: 'General Query',
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ThoughtProcess = ({ duration = '2s', content, isThinking = false }: ThoughtProcessProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const thinkingSteps = getThinkingSteps(content);

    // Auto-expand and animate steps when thinking
    useEffect(() => {
        if (isThinking) {
            setIsExpanded(true);
            setVisibleSteps([]);
            setCompletedSteps([]);

            thinkingSteps.forEach((step) => {
                setTimeout(() => {
                    setVisibleSteps(prev => [...prev, step.id]);
                }, step.delay);

                setTimeout(() => {
                    setCompletedSteps(prev => [...prev, step.id]);
                }, step.delay + 500);
            });
        } else {
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isThinking]);

    // Enrich content with display names
    const enrichedContent = content ? {
        ...content,
        intent: content.intent ? {
            ...content.intent,
            displayName: content.intent.displayName || INTENT_DISPLAY_NAMES[content.intent.detected] || content.intent.detected,
        } : undefined,
        widgetSelection: content.widgetSelection ? {
            ...content.widgetSelection,
            displayName: content.widgetSelection.displayName || WIDGET_DISPLAY_NAMES[content.widgetSelection.type] || content.widgetSelection.type,
        } : undefined,
    } : undefined;

    return (
        <div className="border-b border-slate-100">
            {/* Collapsed Row */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between py-3 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    {isThinking ? (
                        <Loader2 size={16} className="text-violet-500 animate-spin" strokeWidth={1.5} />
                    ) : (
                        <Clock size={16} className="text-slate-400" strokeWidth={1.5} />
                    )}
                    <span className={`text-sm ${isThinking ? 'text-violet-600' : 'text-slate-500'}`}>
                        {isThinking ? 'Thinking...' : 'Thought Process'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isThinking && (
                        <span className="text-slate-400 text-sm">{duration}</span>
                    )}
                    <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        strokeWidth={1.5}
                    />
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 pl-2 space-y-2">
                            {/* Live thinking animation */}
                            {isThinking && (
                                <div className="space-y-2">
                                    {thinkingSteps.map((step) => {
                                        const Icon = step.icon;
                                        const isVisible = visibleSteps.includes(step.id);
                                        const isComplete = completedSteps.includes(step.id);

                                        return (
                                            <AnimatePresence key={step.id}>
                                                {isVisible && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center gap-3 py-1"
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                                            isComplete ? 'bg-green-50' : 'bg-violet-50'
                                                        }`}>
                                                            {isComplete ? (
                                                                <Check size={14} className="text-green-500" strokeWidth={2} />
                                                            ) : (
                                                                <Icon size={14} className="text-violet-500" strokeWidth={1.5} />
                                                            )}
                                                        </div>
                                                        <span className={`text-sm ${isComplete ? 'text-slate-500' : 'text-slate-700'}`}>
                                                            {isComplete ? step.completedText : step.text}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Static content when not thinking */}
                            {!isThinking && enrichedContent && (
                                <div className="space-y-3">
                                    {/* Intent */}
                                    {enrichedContent.intent && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Search size={14} className="text-blue-500" strokeWidth={1.5} />
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-slate-400">Intent: </span>
                                                <span className="text-slate-600">{enrichedContent.intent.displayName}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Data Found */}
                                    {enrichedContent.dataFound && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <Database size={14} className="text-emerald-500" strokeWidth={1.5} />
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-slate-400">Data: </span>
                                                <span className="text-slate-600">{enrichedContent.dataFound.summary}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Widget Selection */}
                                    {enrichedContent.widgetSelection && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                                                <LayoutGrid size={14} className="text-violet-500" strokeWidth={1.5} />
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-slate-400">Widget: </span>
                                                <span className="text-slate-600">{enrichedContent.widgetSelection.displayName}</span>
                                                {enrichedContent.widgetSelection.reason && (
                                                    <p className="text-slate-400 text-xs mt-0.5">{enrichedContent.widgetSelection.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sources */}
                                    {enrichedContent.sources && enrichedContent.sources.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                <Lightbulb size={14} className="text-amber-500" strokeWidth={1.5} />
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-slate-400">Sources: </span>
                                                <span className="text-slate-600">{enrichedContent.sources.join(', ')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Legacy: Query Analysis fallback */}
                                    {!enrichedContent.intent && enrichedContent.queryAnalysis && (
                                        <div className="space-y-1 text-sm">
                                            {enrichedContent.queryAnalysis.commodity && (
                                                <p><span className="text-slate-400">Topic:</span> <span className="text-slate-600">{enrichedContent.queryAnalysis.commodity}</span></p>
                                            )}
                                            {enrichedContent.queryAnalysis.informationNeeded && (
                                                <p><span className="text-slate-400">Analyzed:</span> <span className="text-slate-600">{enrichedContent.queryAnalysis.informationNeeded}</span></p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// STANDALONE THINKING INDICATOR
// ============================================

export const ThinkingIndicator = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = getThinkingSteps();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const Icon = steps[currentStep].icon;

    return (
        <div className="flex items-center gap-3 py-3">
            <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                <Icon size={14} className="text-violet-500 animate-pulse" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-slate-600">{steps[currentStep].text}</span>
        </div>
    );
};

// ============================================
// HELPER: Build thought content from response
// ============================================

export const buildThoughtContent = (response: {
    intent?: { category: string };
    widget?: { type: string };
    portfolio?: { totalSuppliers: number; totalSpendFormatted: string };
    suppliers?: Array<{ name: string }>;
    sources?: Array<{ name: string }>;
}): ThoughtContent => {
    const content: ThoughtContent = {};

    // Intent
    if (response.intent?.category) {
        content.intent = {
            detected: response.intent.category,
        };
    }

    // Data found
    if (response.portfolio) {
        content.dataFound = {
            type: 'portfolio',
            summary: `${response.portfolio.totalSuppliers} suppliers, ${response.portfolio.totalSpendFormatted} spend`,
            count: response.portfolio.totalSuppliers,
        };
    } else if (response.suppliers && response.suppliers.length > 0) {
        content.dataFound = {
            type: 'suppliers',
            summary: `${response.suppliers.length} supplier${response.suppliers.length > 1 ? 's' : ''} found`,
            count: response.suppliers.length,
        };
    }

    // Widget selection with reasoning
    if (response.widget?.type) {
        const reasons: Record<string, string> = {
            risk_distribution: 'Best for visualizing portfolio risk breakdown',
            supplier_table: 'Shows supplier list with key metrics',
            supplier_risk_card: 'Detailed view of single supplier risk profile',
            alert_card: 'Highlights critical risk changes requiring attention',
            comparison_table: 'Side-by-side comparison of suppliers',
            price_gauge: 'Visual indicator for commodity pricing',
        };

        content.widgetSelection = {
            type: response.widget.type,
            reason: reasons[response.widget.type] || 'Selected based on query type',
        };
    }

    // Sources
    if (response.sources && response.sources.length > 0) {
        content.sources = response.sources.slice(0, 3).map(s => s.name);
    }

    return content;
};
