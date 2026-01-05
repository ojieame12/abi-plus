// Artifact Empty State Primitive
// Consistent empty state display for artifacts

import { ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';

export interface ArtifactEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ArtifactEmpty = ({
  icon,
  title,
  description,
  action,
}: ArtifactEmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
        {icon || <FileQuestion size={24} strokeWidth={1.5} />}
      </div>

      <h3 className="text-sm font-medium text-slate-700 mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-500 max-w-xs">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default ArtifactEmpty;
