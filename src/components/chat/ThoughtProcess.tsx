import { useState, useEffect } from 'react';
import { Clock, ChevronDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Milestone } from '../../services/ai';

// ============================================
// TYPES
// ============================================

interface ThoughtProcessProps {
    duration?: string;
    milestones?: Milestone[];
    isThinking?: boolean;
    liveMilestones?: Milestone[];
}

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
            const timer = setTimeout(() => setIsExpanded(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [isThinking, milestones.length]);

    // Use live milestones during thinking, final milestones after
    const displayMilestones = isThinking ? liveMilestones : milestones;

    return (
        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    {isThinking ? (
                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                            <Loader2 size={12} className="text-violet-500 animate-spin" strokeWidth={2} />
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <Clock size={12} className="text-slate-400" strokeWidth={2} />
                        </div>
                    )}
                    <span className={`text-sm font-medium ${isThinking ? 'text-violet-600' : 'text-slate-600'}`}>
                        Thought Process
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 tabular-nums">
                        {isThinking ? 'Processing...' : duration}
                    </span>
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
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                            <div className="space-y-2 mt-3">
                                {displayMilestones.length === 0 && isThinking && (
                                    <div className="flex items-center gap-3 text-sm text-slate-400">
                                        <div className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center">
                                            <Loader2 size={10} className="animate-spin text-violet-400" />
                                        </div>
                                        <span>Starting analysis...</span>
                                    </div>
                                )}

                                {displayMilestones.map((milestone, index) => {
                                    const isLast = index === displayMilestones.length - 1;
                                    const isComplete = !isThinking || !isLast;

                                    return (
                                        <motion.div
                                            key={milestone.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                                isComplete
                                                    ? 'bg-emerald-50'
                                                    : 'bg-violet-50'
                                            }`}>
                                                {isComplete ? (
                                                    <Check size={10} className="text-emerald-500" strokeWidth={2.5} />
                                                ) : (
                                                    <Loader2 size={10} className="text-violet-500 animate-spin" strokeWidth={2} />
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Format timestamp for display
const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

// ============================================
// STANDALONE THINKING INDICATOR (simplified)
// ============================================

export const ThinkingIndicator = () => {
    return (
        <div className="flex items-center gap-3 py-3">
            <div className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center">
                <Loader2 size={12} className="text-violet-500 animate-spin" strokeWidth={2} />
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
