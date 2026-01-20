/* eslint-disable react-refresh/only-export-components -- Exports multiple related components */
import {
    ChevronRight,
    BarChart3,
    AlertTriangle,
    Search,
    Bell,
    Download,
    Users,
    Shield,
    TrendingUp,
    Plus,
    Eye,
    Repeat
} from 'lucide-react';

type ActionIcon = 'chart' | 'alert' | 'search' | 'bell' | 'download' | 'users' | 'shield' | 'trend' | 'add' | 'view' | 'compare';

interface SuggestedAction {
    id: string;
    text: string;
    icon?: ActionIcon;
    variant?: 'primary' | 'secondary';
}

interface SuggestedActionsProps {
    actions: SuggestedAction[];
    onActionClick: (action: SuggestedAction) => void;
    layout?: 'horizontal' | 'vertical' | 'grid';
}

const getIcon = (icon?: ActionIcon, size = 16) => {
    switch (icon) {
        case 'chart': return <BarChart3 size={size} />;
        case 'alert': return <AlertTriangle size={size} />;
        case 'search': return <Search size={size} />;
        case 'bell': return <Bell size={size} />;
        case 'download': return <Download size={size} />;
        case 'users': return <Users size={size} />;
        case 'shield': return <Shield size={size} />;
        case 'trend': return <TrendingUp size={size} />;
        case 'add': return <Plus size={size} />;
        case 'view': return <Eye size={size} />;
        case 'compare': return <Repeat size={size} />;
        default: return <ChevronRight size={size} />;
    }
};

export const SuggestedActions = ({
    actions,
    onActionClick,
    layout = 'horizontal',
}: SuggestedActionsProps) => {
    const containerClass = {
        horizontal: 'flex flex-wrap gap-2',
        vertical: 'flex flex-col gap-2',
        grid: 'grid grid-cols-2 gap-2',
    }[layout];

    return (
        <div className={containerClass}>
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => onActionClick(action)}
                    className={`
                        flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all shadow-sm
                        ${action.variant === 'primary'
                            ? 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60'
                        }
                    `}
                >
                    {action.icon && (
                        <span className={action.variant === 'primary' ? 'text-violet-600' : 'text-slate-400'}>
                            {getIcon(action.icon)}
                        </span>
                    )}
                    <span>{action.text}</span>
                </button>
            ))}
        </div>
    );
};

// Quick prompts for entry points
interface QuickPrompt {
    id: string;
    text: string;
    icon?: ActionIcon;
}

interface QuickPromptsProps {
    prompts: QuickPrompt[];
    onPromptClick: (prompt: QuickPrompt) => void;
    title?: string;
}

export const QuickPrompts = ({
    prompts,
    onPromptClick,
    title = 'Quick Prompts',
}: QuickPromptsProps) => {
    return (
        <div className="space-y-3">
            {title && (
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                    {title}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                    <button
                        key={prompt.id}
                        onClick={() => onPromptClick(prompt)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/60 rounded-lg text-[13px] font-medium text-slate-700 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700 shadow-sm hover:shadow transition-all"
                    >
                        {prompt.icon && (
                            <span className="text-slate-400 group-hover:text-violet-400">
                                {getIcon(prompt.icon, 14)}
                            </span>
                        )}
                        <span>{prompt.text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Default risk watch prompts
export const defaultRiskPrompts: QuickPrompt[] = [
    { id: '1', text: 'Show my risk overview', icon: 'chart' },
    { id: '2', text: 'Any risk changes recently?', icon: 'alert' },
    { id: '3', text: 'Which suppliers are high risk?', icon: 'shield' },
    { id: '4', text: 'Add suppliers to monitor', icon: 'add' },
];

// Contextual follow-up actions
export const getFollowUpActions = (context: 'portfolio' | 'supplier' | 'filtered' | 'alert'): SuggestedAction[] => {
    switch (context) {
        case 'portfolio':
            return [
                { id: '1', text: 'Show high-risk suppliers', icon: 'alert', variant: 'primary' },
                { id: '2', text: 'View by category', icon: 'chart' },
                { id: '3', text: 'Set up alerts', icon: 'bell' },
                { id: '4', text: 'Export report', icon: 'download' },
            ];
        case 'supplier':
            return [
                { id: '1', text: 'Find alternatives', icon: 'search', variant: 'primary' },
                { id: '2', text: 'View risk history', icon: 'trend' },
                { id: '3', text: 'Compare with others', icon: 'compare' },
                { id: '4', text: 'Why this risk level?', icon: 'view' },
            ];
        case 'filtered':
            return [
                { id: '1', text: 'Compare these suppliers', icon: 'compare' },
                { id: '2', text: 'Find alternatives for all', icon: 'search' },
                { id: '3', text: 'Export this list', icon: 'download' },
            ];
        case 'alert':
            return [
                { id: '1', text: 'View affected supplier', icon: 'view', variant: 'primary' },
                { id: '2', text: 'Find alternatives', icon: 'search' },
                { id: '3', text: 'Set up monitoring', icon: 'bell' },
            ];
        default:
            return [];
    }
};
