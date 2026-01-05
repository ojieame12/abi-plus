interface VoteDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function VoteDisplay({ score, size = 'md' }: VoteDisplayProps) {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Monochrome: strong for positive, muted for zero/negative
  const colorClass = score > 0 ? 'text-slate-900 font-medium' : 'text-slate-400 font-normal';

  return (
    <div
      className={`
        tabular-nums
        ${sizeStyles[size]}
        ${colorClass}
      `}
    >
      {score}
    </div>
  );
}
