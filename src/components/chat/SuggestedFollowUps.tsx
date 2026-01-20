import { ArrowRight, MessageCircle, Search, FileText, BarChart3, AlertTriangle, GitCompare, Lightbulb } from 'lucide-react';

interface FollowUpItem {
    id: string;
    text: string;
    icon?: 'chat' | 'search' | 'document' | 'chart' | 'alert' | 'lightbulb' | 'message' | 'compare';
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
};

export const SuggestedFollowUps = ({ items, onItemClick }: SuggestedFollowUpsProps) => {
    return (
        <div className="pt-2">
            <h4 className="text-sm text-slate-400 mb-2">Suggested Follow-Ups</h4>
            <div className="divide-y divide-slate-100">
                {items.map((item) => {
                    const Icon = iconMap[item.icon || 'chat'];
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
