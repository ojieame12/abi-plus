import { Bookmark } from 'lucide-react';

interface TrackInterestButtonProps {
  isTracked: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export const TrackInterestButton = ({
  isTracked,
  isExpanded,
  onClick,
}: TrackInterestButtonProps) => {
  const label = isTracked ? 'Tracked' : 'Track';

  const className = isTracked
    ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700'
    : isExpanded
      ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900'
      : 'text-slate-500 border-slate-200 hover:text-slate-600 hover:bg-slate-50';

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${className}`}
      data-testid="track-interest-button"
    >
      <Bookmark size={14} />
      {label}
    </button>
  );
};
