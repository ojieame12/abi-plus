// Shared Widget Footer Component
// Renders Beroe source attribution and View Details button

import { ChevronRight } from 'lucide-react';

export interface WidgetFooterProps {
  beroeSourceCount?: number;
  onViewDetails?: () => void;
  className?: string;
}

export const WidgetFooter = ({
  beroeSourceCount = 3,
  onViewDetails,
  className = '',
}: WidgetFooterProps) => {
  return (
    <div className={`flex items-center justify-between px-5 py-3 border-t border-slate-100/60 bg-slate-50/30 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">B</span>
        </div>
        <span>{beroeSourceCount} Beroe Data Sources</span>
      </div>
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors group"
        >
          <span>View Details</span>
          <ChevronRight
            size={16}
            strokeWidth={1.5}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      )}
    </div>
  );
};

export default WidgetFooter;
