// Risk Distribution Chart - Horizontal bar chart for portfolio breakdown
import { RiskPortfolio } from '../../types/supplier';

interface RiskDistributionChartProps {
  portfolio: RiskPortfolio;
  onSegmentClick?: (level: string) => void;
  compact?: boolean;
}

export const RiskDistributionChart = ({
  portfolio,
  onSegmentClick,
  compact = false,
}: RiskDistributionChartProps) => {
  const { distribution, totalSuppliers } = portfolio;

  const segments = [
    { key: 'high', label: 'High', count: distribution.high, color: 'bg-red-500', textColor: 'text-red-600' },
    { key: 'mediumHigh', label: 'Med-High', count: distribution.mediumHigh, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { key: 'medium', label: 'Medium', count: distribution.medium, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { key: 'low', label: 'Low', count: distribution.low, color: 'bg-green-500', textColor: 'text-green-600' },
    { key: 'unrated', label: 'Unrated', count: distribution.unrated, color: 'bg-gray-300', textColor: 'text-gray-500' },
  ];

  const maxCount = Math.max(...segments.map(s => s.count), 1);

  if (compact) {
    // Compact stacked bar version
    return (
      <div className="w-full">
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
          {segments.map(segment => {
            const width = totalSuppliers > 0 ? (segment.count / totalSuppliers) * 100 : 0;
            if (width === 0) return null;
            return (
              <div
                key={segment.key}
                className={`${segment.color} transition-all cursor-pointer hover:opacity-80`}
                style={{ width: `${width}%` }}
                onClick={() => onSegmentClick?.(segment.key)}
                title={`${segment.label}: ${segment.count}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted">
          <span>{totalSuppliers} suppliers</span>
          <span>{portfolio.totalSpendFormatted} spend</span>
        </div>
      </div>
    );
  }

  // Full horizontal bar chart
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-primary">Risk Distribution</h4>
        <span className="text-sm text-muted">{totalSuppliers} suppliers</span>
      </div>

      <div className="space-y-2">
        {segments.map(segment => (
          <button
            key={segment.key}
            className="w-full group"
            onClick={() => onSegmentClick?.(segment.key)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${segment.color}`}></span>
                <span className="text-sm text-primary">{segment.label}</span>
              </div>
              <span className={`text-sm font-medium ${segment.textColor}`}>
                {segment.count}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${segment.color} rounded-full transition-all group-hover:opacity-80`}
                style={{ width: `${(segment.count / maxCount) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RiskDistributionChart;
