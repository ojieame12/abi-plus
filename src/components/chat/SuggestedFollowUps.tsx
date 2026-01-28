import { ArrowRight, MessageCircle, Search, FileText, BarChart3, AlertTriangle, GitCompare, Lightbulb, Brain, Coins } from 'lucide-react';

interface FollowUpItem {
    id: string;
    text: string;
    icon?: 'chat' | 'search' | 'document' | 'chart' | 'alert' | 'lightbulb' | 'message' | 'compare' | 'deep_research';
    /** Optional: mark as a deep research suggestion for special styling */
    isDeepResearch?: boolean;
    /** Optional: credit cost to display (for deep research suggestions) */
    creditCost?: number;
}

interface SuggestedFollowUpsProps {
    items: FollowUpItem[];
    onItemClick?: (item: FollowUpItem) => void;
}

const iconMap = {
    chat: MessageCircle,
    message: MessageCircle,
    lightbulb: Lightbulb,
    search: Search,
    document: FileText,
    chart: BarChart3,
    alert: AlertTriangle,
    compare: GitCompare,
    deep_research: Brain,
};

export const SuggestedFollowUps = ({ items, onItemClick }: SuggestedFollowUpsProps) => {
    return (
        <div className="pt-2">
            <h4 className="text-sm text-slate-400 mb-2">Suggested Follow-Ups</h4>
            <div className="divide-y divide-slate-100">
                {items.map((item) => {
                    const Icon = iconMap[item.icon || 'chat'];
                    const isDeepResearch = item.isDeepResearch || item.icon === 'deep_research';

                    // Special styling for deep research suggestions
                    if (isDeepResearch) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onItemClick?.(item)}
                                className="w-full flex items-center justify-between py-3 px-3 -mx-3 my-1 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl hover:from-violet-100 hover:to-indigo-100 hover:border-violet-300 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <Brain size={14} className="text-white" strokeWidth={2} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-violet-800 text-sm font-medium block">{item.text}</span>
                                        <span className="text-violet-500 text-xs">Deep Research</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.creditCost && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                                            <Coins size={12} />
                                            {item.creditCost}
                                        </span>
                                    )}
                                    <ArrowRight size={16} className="text-violet-400 group-hover:text-violet-600 transition-colors" strokeWidth={1.5} />
                                </div>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onItemClick?.(item)}
                            className="w-full flex items-center justify-between py-3 hover:bg-slate-50/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={1.5} />
                                <span className="text-slate-700 text-sm font-medium">{item.text}</span>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" strokeWidth={1.5} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
