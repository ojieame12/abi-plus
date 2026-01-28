// Metric Row Widget - Simple row of 3-4 key metrics
import type { MetricRowData } from '../../types/widgets';

interface Props {
  data: MetricRowData;
  variant?: 'default' | 'report';
}

export const MetricRowWidget = ({ data, variant = 'default' }: Props) => {
  const { metrics } = data || {};

  // Guard against undefined metrics
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'danger': return 'text-red-600';
      default: return 'text-slate-900';
    }
  };

  const isReport = variant === 'report';
  const valueClass = isReport ? 'text-[17px] leading-snug break-words' : 'text-xl font-light';
  const labelClass = isReport ? 'text-xs text-slate-600 mt-1' : 'text-sm text-slate-600 mt-1';
  const subLabelClass = isReport ? 'text-[11px] text-slate-400' : 'text-xs text-slate-400';
  const cellClass = isReport ? 'px-3 py-3 text-center' : 'px-4 py-4 text-center';

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
      <div
        className="grid divide-x divide-slate-100"
        style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))` }}
      >
        {metrics.map((metric, i) => (
          <div key={i} className={cellClass}>
            <div className={`${valueClass} ${getColorClass(metric.color)}`}>
              {metric.value}
              {metric.change && (
                <span className={`ml-1.5 text-xs font-normal align-middle ${
                  metric.change.direction === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.change.direction === 'up' ? '↑' : '↓'}
                  {Math.abs(metric.change.value)}%
                </span>
              )}
            </div>
            <div className={labelClass}>{metric.label}</div>
            {metric.subLabel && (
              <div className={subLabelClass}>{metric.subLabel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricRowWidget;
