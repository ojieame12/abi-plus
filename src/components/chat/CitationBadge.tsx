import { Circle } from 'lucide-react';

interface CitationBadgeProps {
    number: number;
    onClick?: () => void;
}

export const CitationBadge = ({ number, onClick }: CitationBadgeProps) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 px-2 py-0.5 ml-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full hover:bg-slate-200 transition-colors"
        >
            <Circle size={10} strokeWidth={2} />
            <span>{number}</span>
        </button>
    );
};
