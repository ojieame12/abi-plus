import { useState, useEffect } from 'react';
import { Clock, ChevronDown, Check, Loader2, Database, Lightbulb, Search, Cpu, Globe, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Milestone } from '../../services/ai';

// ============================================
// TYPES
// ============================================

interface ThoughtProcessProps {
    duration?: string;
    milestones?: Milestone[];
    isThinking?: boolean;
    // Live milestone stream during thinking
    liveMilestones?: Milestone[];
}

// Icon mapping for milestone events
const MILESTONE_ICONS: Record<string, typeof Search> = {
    intent_classified: Search,
    provider_selected: Cpu,
    sources_found: Globe,
    data_retrieved: Database,
    widget_selected: LayoutGrid,
    response_ready: Check,
};

// Color mapping for milestone events
const MILESTONE_COLORS: Record<string, { bg: string; icon: string }> = {
    intent_classified: { bg: 'bg-blue-50', icon: 'text-blue-500' },
    provider_selected: { bg: 'bg-purple-50', icon: 'text-purple-500' },
    sources_found: { bg: 'bg-amber-50', icon: 'text-amber-500' },
    data_retrieved: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
    widget_selected: { bg: 'bg-violet-50', icon: 'text-violet-500' },
    response_ready: { bg: 'bg-green-50', icon: 'text-green-500' },
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ThoughtProcess = ({
    duration = '...',
    milestones = [],
    isThinking = false,
    liveMilestones = [],
}: ThoughtProcessProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand during thinking, auto-collapse after
    useEffect(() => {
        if (isThinking) {
            setIsExpanded(true);
        } else if (milestones.length > 0) {
            // Keep expanded briefly after completion, then collapse
            const timer = setTimeout(() => setIsExpanded(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [isThinking, milestones.length]);

    // Use live milestones during thinking, final milestones after
    const displayMilestones = isThinking ? liveMilestones : milestones;

    // Format timestamp for display
    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    return (
        <div className="border-b border-slate-100">
            {/* Collapsed Header */}
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
                        {isThinking ? 'Processing...' : 'Thought Process'}
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
                        <div className="pb-4 pl-2 space-y-1.5">
                            {displayMilestones.length === 0 && isThinking && (
                                <div className="flex items-center gap-3 py-1 text-sm text-slate-400">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Starting...</span>
                                </div>
                            )}

                            {displayMilestones.map((milestone, index) => {
                                const Icon = MILESTONE_ICONS[milestone.event] || Lightbulb;
                                const colors = MILESTONE_COLORS[milestone.event] || { bg: 'bg-slate-50', icon: 'text-slate-500' };
                                const isLast = index === displayMilestones.length - 1;
                                const isComplete = !isThinking || !isLast;

                                return (
                                    <motion.div
                                        key={milestone.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center gap-3 py-1"
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                            isComplete ? colors.bg : 'bg-violet-50'
                                        }`}>
                                            {isComplete ? (
                                                <Icon size={14} className={colors.icon} strokeWidth={1.5} />
                                            ) : (
                                                <Loader2 size={14} className="text-violet-500 animate-spin" strokeWidth={1.5} />
                                            )}
                                        </div>
                                        <span className="text-sm text-slate-600 flex-1">
                                            {milestone.label}
                                        </span>
                                        <span className="text-xs text-slate-400 tabular-nums">
                                            {formatTime(milestone.timestamp)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// STANDALONE THINKING INDICATOR (simplified)
// ============================================

export const ThinkingIndicator = () => {
    return (
        <div className="flex items-center gap-3 py-3">
            <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                <Loader2 size={14} className="text-violet-500 animate-spin" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-slate-600">Processing your request...</span>
        </div>
    );
};

// ============================================
// HELPER: Build thought content from response (legacy compatibility)
// ============================================

export interface ThoughtContent {
    intent?: { detected: string; displayName?: string };
    dataFound?: { type: string; summary: string; count?: number };
    widgetSelection?: { type: string; displayName?: string; reason: string };
    sources?: string[];
}

export const buildThoughtContent = (response: {
    intent?: { category: string };
    widget?: { type: string };
    portfolio?: { totalSuppliers: number; totalSpendFormatted: string };
    suppliers?: Array<{ name: string }>;
    sources?: Array<{ name: string }>;
}): ThoughtContent => {
    const content: ThoughtContent = {};

    if (response.intent?.category) {
        content.intent = { detected: response.intent.category };
    }

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

    if (response.widget?.type) {
        content.widgetSelection = {
            type: response.widget.type,
            reason: 'Selected based on query type',
        };
    }

    if (response.sources && response.sources.length > 0) {
        content.sources = response.sources.slice(0, 3).map(s => s.name);
    }

    return content;
};
