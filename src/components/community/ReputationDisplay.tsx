interface ReputationDisplayProps {
  reputation: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function formatReputation(value: number): string {
  if (value >= 10000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

const SIZE_STYLES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function ReputationDisplay({
  reputation,
  size = 'sm',
  showLabel = true,
}: ReputationDisplayProps) {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span className={`tabular-nums ${sizeStyle} text-slate-600`}>
      <span className="font-medium text-slate-900">{formatReputation(reputation)}</span>
      {showLabel && <span className="text-slate-400 ml-1">rep</span>}
    </span>
  );
}
