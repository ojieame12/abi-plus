// Artifact Header Primitive
// Reusable header for all artifact views

import { ChevronLeft, X, MoreHorizontal } from 'lucide-react';
import { ReactNode } from 'react';

export interface ArtifactHeaderAction {
  id: string;
  icon: ReactNode;
  label?: string;
  onClick: () => void;
}

export interface ArtifactHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  actions?: ArtifactHeaderAction[];
  showMoreMenu?: boolean;
  onMoreClick?: () => void;
  variant?: 'default' | 'compact' | 'transparent';
  children?: ReactNode; // For custom content like badges
}

export const ArtifactHeader = ({
  title,
  subtitle,
  icon,
  onBack,
  onClose,
  actions = [],
  showMoreMenu = false,
  onMoreClick,
  variant = 'default',
  children,
}: ArtifactHeaderProps) => {
  const variantStyles = {
    default: 'px-5 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm',
    compact: 'px-4 py-3 border-b border-slate-100 bg-white',
    transparent: 'px-5 py-4 bg-transparent',
  };

  return (
    <div className={`flex items-center justify-between shrink-0 z-10 ${variantStyles[variant]}`}>
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
            aria-label="Go back"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
        )}

        {icon && (
          <div className="shrink-0 text-slate-400">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <h2 className="font-medium text-primary tracking-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={action.label}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}

        {showMoreMenu && (
          <button
            onClick={onMoreClick}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal size={18} strokeWidth={1.5} />
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtifactHeader;
