import { ExternalLink, Lock, ArrowRight, Info } from 'lucide-react';

interface HandoffCardProps {
    title: string;
    description: string;
    restrictions?: string[];
    linkText: string;
    linkUrl?: string;
    onNavigate?: () => void;
    variant?: 'standard' | 'inline' | 'warning';
}

export const HandoffCard = ({
    title,
    description,
    restrictions,
    linkText,
    linkUrl,
    onNavigate,
    variant = 'standard',
}: HandoffCardProps) => {
    const handleClick = () => {
        if (linkUrl) {
            window.open(linkUrl, '_blank');
        } else if (onNavigate) {
            onNavigate();
        }
    };

    if (variant === 'inline') {
        return (
            <button
                onClick={handleClick}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-slate-50/50 border border-white/60 hover:border-slate-200 rounded-xl text-[13px] font-normal text-slate-700 transition-all shadow-sm"
            >
                {linkText}
                <ExternalLink size={13} strokeWidth={1.5} className="text-slate-400" />
            </button>
        );
    }

    if (variant === 'warning') {
        return (
            <div className="p-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h4 className="font-normal text-[#1d1d1f] text-[15px] mb-1">{title}</h4>
                        <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">{description}</p>
                        <button
                            onClick={handleClick}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/60 hover:bg-slate-50/50 text-slate-700 text-[13px] font-normal rounded-xl transition-colors"
                        >
                            {linkText}
                            <ExternalLink size={13} strokeWidth={1.5} />
                        </button>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Lock size={18} strokeWidth={1.5} className="text-amber-600" />
                    </div>
                </div>
            </div>
        );
    }

    // Standard variant
    return (
        <div className="p-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h4 className="font-normal text-[#1d1d1f] text-[15px] mb-1">{title}</h4>
                    <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">{description}</p>

                    {restrictions && restrictions.length > 0 && (
                        <div className="mb-4 p-3 bg-slate-50/60 rounded-2xl border border-slate-100/40">
                            <div className="text-[10px] font-normal text-slate-400 uppercase tracking-wider mb-2">
                                To view:
                            </div>
                            <ul className="space-y-1.5">
                                {restrictions.map((item, i) => (
                                    <li key={i} className="text-[13px] text-slate-600 flex items-center gap-2 font-normal">
                                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={handleClick}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] hover:bg-[#1d1d1f]/90 text-white text-[13px] font-normal rounded-xl transition-all active:scale-[0.98] shadow-sm"
                    >
                        {linkText}
                        <ArrowRight size={14} strokeWidth={1.5} />
                    </button>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                    <ExternalLink size={18} strokeWidth={1.5} className="text-violet-600" />
                </div>
            </div>
        </div>
    );
};

// Compact link for inline text
export const DashboardLink = ({
    text,
    onClick,
}: {
    text: string;
    onClick?: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-normal"
        >
            {text}
            <ExternalLink size={12} strokeWidth={1.5} />
        </button>
    );
};

// Data restriction notice
export const DataRestrictionNotice = ({
    message = "Some data requires dashboard access due to partner restrictions.",
}: {
    message?: string;
}) => {
    return (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-sm text-slate-500">
            <Info size={14} strokeWidth={1.5} className="shrink-0" />
            <span>{message}</span>
        </div>
    );
};
