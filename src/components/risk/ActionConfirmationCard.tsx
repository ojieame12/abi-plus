import { Check, AlertTriangle, Info, Undo2, Eye } from 'lucide-react';

type ActionStatus = 'success' | 'warning' | 'info' | 'error';

interface ActionConfirmationCardProps {
    status: ActionStatus;
    title: string;
    message: string;
    onUndo?: () => void;
    onViewResult?: () => void;
    viewResultLabel?: string;
    autoHide?: boolean;
}

export const ActionConfirmationCard = ({
    status,
    title,
    message,
    onUndo,
    onViewResult,
    viewResultLabel = 'View',
}: ActionConfirmationCardProps) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'success':
                return { icon: Check, iconBg: 'bg-green-50', iconColor: 'text-green-600' };
            case 'warning':
                return { icon: AlertTriangle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' };
            case 'info':
                return { icon: Info, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' };
            case 'error':
                return { icon: AlertTriangle, iconBg: 'bg-red-50', iconColor: 'text-red-600' };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className="p-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h4 className="font-normal text-[#1d1d1f] text-[15px] mb-1">{title}</h4>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{message}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl ${config.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} strokeWidth={1.5} className={config.iconColor} />
                </div>
            </div>

            {(onUndo || onViewResult) && (
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100/60">
                    {onUndo && (
                        <button
                            onClick={onUndo}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 rounded-lg transition-colors"
                        >
                            <Undo2 size={14} strokeWidth={1.5} />
                            Undo
                        </button>
                    )}
                    {onViewResult && (
                        <button
                            onClick={onViewResult}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-normal text-violet-600 hover:text-violet-900 hover:bg-violet-50/50 rounded-lg transition-colors"
                        >
                            <Eye size={14} strokeWidth={1.5} />
                            {viewResultLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Minimal toast-style confirmation
export const ActionToast = ({
    message,
    onUndo,
}: {
    message: string;
    onUndo?: () => void;
}) => {
    return (
        <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-lg shadow-lg">
            <Check size={16} strokeWidth={1.5} className="text-green-400" />
            <span className="text-sm">{message}</span>
            {onUndo && (
                <button
                    onClick={onUndo}
                    className="text-sm font-medium text-violet-300 hover:text-violet-200 ml-2"
                >
                    Undo
                </button>
            )}
        </div>
    );
};
