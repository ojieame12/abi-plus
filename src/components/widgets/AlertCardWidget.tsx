// Alert Card Widget - Risk change notifications
import type { AlertCardData } from '../../types/widgets';

interface Props {
  data: AlertCardData;
}

export const AlertCardWidget = ({ data }: Props) => {
  const {
    alertType,
    severity,
    title,
    affectedSuppliers,
    timestamp,
    actionRequired,
    suggestedAction,
  } = data;

  // Severity colors
  const severityColors = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      badge: 'bg-red-100 text-red-700',
    },
  };

  const colors = severityColors[severity] || severityColors.info;

  // Alert type icons
  const getIcon = () => {
    switch (alertType) {
      case 'risk_increase':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'risk_decrease':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'threshold_breach':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`${colors.bg} backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.icon}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-normal text-slate-900">{title}</h3>
            {actionRequired && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge}`}>
                Action Required
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{timestamp}</p>
        </div>
      </div>

      {/* Affected Suppliers */}
      <div className="px-5 pb-4">
        <div className="space-y-2">
          {affectedSuppliers.map((supplier, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg"
            >
              <span className="font-normal text-slate-900">{supplier.name}</span>
              {supplier.previousScore !== undefined && supplier.currentScore !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">{supplier.previousScore}</span>
                  <span className="text-slate-400">→</span>
                  <span className={
                    supplier.currentScore > supplier.previousScore
                      ? 'text-red-600 font-semibold'
                      : 'text-green-600 font-semibold'
                  }>
                    {supplier.currentScore}
                  </span>
                  {supplier.change && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${supplier.currentScore > supplier.previousScore
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                      }`}>
                      {supplier.change}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested Action */}
        {suggestedAction && (
          <div className="mt-4 pt-4 border-t border-slate-200/50">
            <p className="text-sm text-slate-600">
              <span className="font-normal text-slate-700">Suggested:</span> {suggestedAction}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCardWidget;
