// Risk Distribution Widget - Donut chart showing portfolio risk breakdown
import type { RiskDistributionData } from '../../types/widgets';

interface Props {
  data: RiskDistributionData;
}

export const RiskDistributionWidget = ({ data }: Props) => {
  const { totalSuppliers, totalSpendFormatted, distribution } = data;

  // Calculate total for percentages
  const total = distribution.high.count +
    distribution.mediumHigh.count +
    distribution.medium.count +
    distribution.low.count +
    distribution.unrated.count;

  // Risk levels with colors
  const levels = [
    { key: 'high', label: 'High Risk', count: distribution.high.count, color: 'bg-red-500', textColor: 'text-red-600' },
    { key: 'mediumHigh', label: 'Medium-High', count: distribution.mediumHigh.count, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { key: 'medium', label: 'Medium', count: distribution.medium.count, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { key: 'low', label: 'Low Risk', count: distribution.low.count, color: 'bg-green-500', textColor: 'text-green-600' },
    { key: 'unrated', label: 'Unrated', count: distribution.unrated.count, color: 'bg-slate-300', textColor: 'text-slate-500' },
  ];

  // Calculate donut segments
  let cumulativePercent = 0;
  const segments = levels.map(level => {
    const percent = total > 0 ? (level.count / total) * 100 : 0;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { ...level, percent, start };
  });

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
      {/* Header */}
      <div className="text-xs font-normal text-slate-400 uppercase tracking-wider mb-4">
        Portfolio Risk Distribution
      </div>

      {/* Main content grid */}
      <div className="flex gap-6">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="3"
            />
            {/* Segments */}
            {segments.map((segment, i) => (
              <circle
                key={segment.key}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={
                  segment.key === 'high' ? '#ef4444' :
                    segment.key === 'mediumHigh' ? '#f97316' :
                      segment.key === 'medium' ? '#eab308' :
                        segment.key === 'low' ? '#22c55e' : '#cbd5e1'
                }
                strokeWidth="3"
                strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                strokeDashoffset={-segment.start}
                className="transition-all duration-500"
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-normal text-slate-900">{totalSuppliers}</div>
            <div className="text-xs text-slate-500">Suppliers</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {levels.map(level => (
            <div key={level.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${level.color}`} />
                <span className="text-sm text-slate-600">{level.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-normal ${level.textColor}`}>
                  {level.count}
                </span>
                <span className="text-xs text-slate-400 w-10 text-right">
                  {total > 0 ? Math.round((level.count / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Total Spend */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total Spend</span>
        <span className="text-lg font-normal text-slate-900">{totalSpendFormatted}</span>
      </div>
    </div>
  );
};

export default RiskDistributionWidget;
