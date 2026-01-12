import type { Tag } from '../../types/community';

interface TagPillProps {
  tag: Tag;
  size?: 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
}

export function TagPill({ tag, size = 'sm', selected = false, onClick }: TagPillProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  // Monochrome design - no per-tag colors
  // Selected: dark bg, no hover change (stays dark)
  // Unselected: light bg, hover to slightly darker
  const stateStyles = selected
    ? 'bg-slate-900 text-white border-slate-900'
    : 'bg-slate-100 text-slate-600 border-slate-200/60';

  const hoverStyles = onClick
    ? selected
      ? '' // Selected pills don't change on hover
      : 'hover:bg-slate-200 hover:border-slate-300 hover:text-slate-700'
    : '';

  const className = `
    ${sizeStyles[size]}
    ${stateStyles}
    ${hoverStyles}
    rounded-lg border
    transition-colors duration-200
    ${onClick ? 'cursor-pointer' : 'cursor-default'}
  `;

  // Render as span when not clickable to avoid nested button issues
  if (!onClick) {
    return (
      <span className={className}>
        {tag.name}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      {tag.name}
    </button>
  );
}
