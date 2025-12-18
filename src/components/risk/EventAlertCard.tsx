import { Zap, AlertTriangle, Clock, ChevronRight, ExternalLink } from 'lucide-react';

interface AffectedSupplier {
    id: string;
    name: string;
    dependency: 'high' | 'medium' | 'low';
}

interface EventAlertCardProps {
    headline: string;
    timestamp: string;
    potentialImpact?: string;
    estimatedDuration?: string;
    affectedSuppliers: AffectedSupplier[];
    onViewAnalysis?: () => void;
    onFindAlternatives?: () => void;
    onDismiss?: () => void;
    severity?: 'critical' | 'warning' | 'info';
}

export const EventAlertCard = ({
    headline,
    timestamp,
    potentialImpact,
    estimatedDuration,
    affectedSuppliers,
    onViewAnalysis,
    onFindAlternatives,
    onDismiss,
    severity = 'warning',
}: EventAlertCardProps) => {
    const getSeverityConfig = () => {
        switch (severity) {
            case 'critical':
                return { icon: AlertTriangle, iconColor: 'text-red-600', badge: 'bg-red-50 text-red-700' };
            case 'warning':
                return { icon: Zap, iconColor: 'text-amber-600', badge: 'bg-amber-50 text-amber-700' };
            case 'info':
                return { icon: Zap, iconColor: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' };
        }
    };

    const config = getSeverityConfig();
    const Icon = config.icon;

    const getDependencyColor = (dep: string) => {
        switch (dep) {
            case 'high': return 'text-red-600';
            case 'medium': return 'text-amber-600';
            case 'low': return 'text-slate-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-normal uppercase tracking-wider ${config.badge}`}>
                                Market Event
                            </span>
                            <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                                <Clock size={12} strokeWidth={1.5} />
                                {timestamp}
                            </span>
                        </div>
                        <h4 className="text-lg font-normal text-[#1d1d1f] tracking-tight leading-snug">{headline}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="text-slate-300 hover:text-slate-500 p-1 transition-colors"
                            >
                                ×
                            </button>
                        )}
                        <div className={`w-10 h-10 rounded-2xl ${config.badge} flex items-center justify-center shrink-0`}>
                            <Icon size={20} strokeWidth={1.5} className={config.iconColor} />
                        </div>
                    </div>
                </div>

                {/* Impact Info */}
                {(potentialImpact || estimatedDuration) && (
                    <div className="mb-5 p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/40">
                        {potentialImpact && (
                            <div className="text-[13px] text-slate-600 mb-1.5 leading-relaxed">
                                <span className="font-normal text-slate-700">Potential Impact:</span> {potentialImpact}
                            </div>
                        )}
                        {estimatedDuration && (
                            <div className="text-[13px] text-slate-500">
                                <span className="font-normal text-slate-600">Est. Duration:</span> {estimatedDuration}
                            </div>
                        )}
                    </div>
                )}

                {/* Affected Suppliers */}
                <div>
                    <div className="text-[11px] uppercase tracking-wider font-normal text-slate-400 mb-2">Affected Suppliers</div>
                    <div className="space-y-2">
                        {affectedSuppliers.slice(0, 3).map((supplier) => (
                            <div key={supplier.id} className="flex items-center justify-between">
                                <span className="text-[13px] font-normal text-[#1d1d1f] flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    {supplier.name}
                                </span>
                                <span className={`text-[11px] font-normal uppercase tracking-wide ${getDependencyColor(supplier.dependency)}`}>
                                    {supplier.dependency} Dep
                                </span>
                            </div>
                        ))}
                        {affectedSuppliers.length > 3 && (
                            <div className="text-[12px] font-normal text-slate-400 pl-3">
                                +{affectedSuppliers.length - 3} more suppliers
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-slate-100/60 bg-slate-50/20 divide-x divide-slate-100/60">
                <button
                    onClick={onViewAnalysis}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-normal text-violet-700 hover:bg-violet-50/50 transition-colors"
                >
                    View Full Analysis
                    <ExternalLink size={13} strokeWidth={1.5} />
                </button>
                <button
                    onClick={onFindAlternatives}
                    className="flex-1 py-3 text-[13px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 transition-colors"
                >
                    Find Alternatives
                </button>
            </div>
        </div>
    );
};

// Compact list item version
export const EventAlertItem = ({
    headline,
    timestamp,
    affectedCount,
    severity = 'warning',
    onClick,
}: {
    headline: string;
    timestamp: string;
    affectedCount: number;
    severity?: 'critical' | 'warning' | 'info';
    onClick?: () => void;
}) => {
    const iconColor = severity === 'critical' ? 'text-red-500' : severity === 'warning' ? 'text-amber-500' : 'text-blue-500';

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 text-left group ring-1 ring-black/[0.02]"
        >
            <div className={`p-2 rounded-lg bg-slate-50 group-hover:bg-white transition-colors`}>
                <Zap size={16} strokeWidth={1.5} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-normal text-[#1d1d1f] truncate">{headline}</div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    {affectedCount} supplier{affectedCount !== 1 ? 's' : ''} affected · {timestamp}
                </div>
            </div>
            <ChevronRight size={14} strokeWidth={1.5} className="text-slate-300" />
        </button>
    );
};
