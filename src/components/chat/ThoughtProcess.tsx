import { useState, useEffect } from 'react';
import { Clock, ChevronDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThoughtProcessProps {
    duration?: string;
    content?: ThoughtContent;
    isThinking?: boolean; // When true, shows live thinking animation
}

interface ThoughtContent {
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

// Thinking steps for animation
const THINKING_STEPS = [
    { id: 1, text: 'Analyzing your query...', delay: 0 },
    { id: 2, text: 'Searching portfolio data...', delay: 400 },
    { id: 3, text: 'Retrieving risk metrics...', delay: 800 },
    { id: 4, text: 'Generating insights...', delay: 1200 },
];

export const ThoughtProcess = ({ duration = '2min', content, isThinking = false }: ThoughtProcessProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // Auto-expand and animate steps when thinking
    useEffect(() => {
        if (isThinking) {
            setIsExpanded(true);
            setVisibleSteps([]);
            setCompletedSteps([]);

            // Show steps one by one
            THINKING_STEPS.forEach((step) => {
                setTimeout(() => {
                    setVisibleSteps(prev => [...prev, step.id]);
                }, step.delay);

                // Mark as complete after a bit
                setTimeout(() => {
                    setCompletedSteps(prev => [...prev, step.id]);
                }, step.delay + 600);
            });
        } else {
            // When done thinking, collapse after a moment
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isThinking]);

    return (
        <div className="border-b border-slate-200">
            {/* Collapsed Row */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between py-3 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    {isThinking ? (
                        <Loader2 size={16} className="text-violet-500 animate-spin" strokeWidth={2} />
                    ) : (
                        <Clock size={16} className="text-slate-400" strokeWidth={1.5} />
                    )}
                    <span className={`text-[14px] ${isThinking ? 'text-violet-600' : 'text-slate-600'}`}>
                        {isThinking ? 'Thinking...' : 'Thought Process'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isThinking && (
                        <span className="text-slate-400 text-[13px]">{duration}</span>
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
                        <div className="pb-4 pl-6 space-y-2 text-[13px] text-slate-600">
                            {/* Live thinking animation */}
                            {isThinking && (
                                <div className="space-y-2">
                                    {THINKING_STEPS.map((step) => (
                                        <AnimatePresence key={step.id}>
                                            {visibleSteps.includes(step.id) && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    {completedSteps.includes(step.id) ? (
                                                        <Check size={14} className="text-green-500" />
                                                    ) : (
                                                        <Loader2 size={14} className="text-violet-500 animate-spin" />
                                                    )}
                                                    <span className={completedSteps.includes(step.id) ? 'text-slate-500' : 'text-slate-700'}>
                                                        {step.text}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    ))}
                                </div>
                            )}

                            {/* Static content when not thinking */}
                            {!isThinking && content && (
                                <>
                                    {content.queryAnalysis && (
                                        <div className="space-y-1">
                                            {content.queryAnalysis.commodity && (
                                                <p><span className="text-slate-400">Topic:</span> {content.queryAnalysis.commodity}</p>
                                            )}
                                            {content.queryAnalysis.informationNeeded && (
                                                <p><span className="text-slate-400">Analyzed:</span> {content.queryAnalysis.informationNeeded}</p>
                                            )}
                                        </div>
                                    )}

                                    {content.informationRetrieval?.sources && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {content.informationRetrieval.sources.slice(0, 3).map((source, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                                                    <Check size={12} className="text-green-500" />
                                                    {source.length > 25 ? source.substring(0, 25) + '...' : source}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Standalone thinking indicator for use during loading
export const ThinkingIndicator = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % THINKING_STEPS.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 py-3 text-[14px]">
            <Loader2 size={16} className="text-violet-500 animate-spin" />
            <span className="text-slate-600">{THINKING_STEPS[currentStep].text}</span>
        </div>
    );
};
