// Artifact Footer Primitive
// Sticky action footer for artifact panels

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface FooterAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface ArtifactFooterProps {
  actions?: FooterAction[];
  primaryAction?: FooterAction;
  secondaryAction?: FooterAction;
  secondaryActions?: FooterAction[]; // Multiple secondary actions
  children?: ReactNode; // For custom footer content
  variant?: 'default' | 'compact' | 'split';
  className?: string;
}

export const ArtifactFooter = ({
  actions,
  primaryAction,
  secondaryAction,
  secondaryActions,
  children,
  variant = 'default',
  className = '',
}: ArtifactFooterProps) => {
  const getButtonStyles = (buttonVariant: FooterAction['variant'] = 'secondary') => {
    const base = 'flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all active:scale-[0.98]';

    switch (buttonVariant) {
      case 'primary':
        return `${base} bg-slate-900 text-white hover:bg-slate-800 shadow-sm`;
      case 'secondary':
        return `${base} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300`;
      case 'ghost':
        return `${base} text-slate-600 hover:bg-slate-100`;
      case 'danger':
        return `${base} bg-rose-600 text-white hover:bg-rose-700 shadow-sm`;
      default:
        return `${base} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`;
    }
  };

  const renderButton = (action: FooterAction, fullWidth = false) => (
    <button
      key={action.id}
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={`${getButtonStyles(action.variant)} ${fullWidth ? 'flex-1' : ''} ${
        action.disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {action.loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : action.icon ? (
        action.icon
      ) : null}
      {action.label}
    </button>
  );

  // Combine single and array secondary actions
  const allSecondaryActions = [
    ...(secondaryAction ? [secondaryAction] : []),
    ...(secondaryActions || []),
  ];

  // Split variant: secondary on left, primary on right
  if (variant === 'split' && (primaryAction || allSecondaryActions.length > 0)) {
    return (
      <div className={`px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white ${className}`}>
        <div className="flex items-center gap-2">
          {allSecondaryActions.map(action => renderButton(action))}
        </div>
        <div>
          {primaryAction && renderButton(primaryAction)}
        </div>
      </div>
    );
  }

  // Default: actions side by side
  return (
    <div className={`px-5 py-4 border-t border-slate-100 bg-white ${className}`}>
      {children || (
        <div className="flex items-center gap-3">
          {/* Render explicit primary/secondary actions */}
          {primaryAction && renderButton(primaryAction, true)}
          {allSecondaryActions.map(action => renderButton(action, true))}

          {/* Or render actions array */}
          {actions?.map((action) => renderButton(action, actions.length <= 2))}
        </div>
      )}
    </div>
  );
};

export default ArtifactFooter;
