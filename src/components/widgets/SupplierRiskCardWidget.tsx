// Supplier Risk Card Widget - Detailed view of a single supplier
import type { SupplierRiskCardData } from '../../types/widgets';

interface Props {
  data: SupplierRiskCardData;
}

export const SupplierRiskCardWidget = ({ data }: Props) => {
  const {
    supplierName,
    riskScore,
    riskLevel,
    trend,
    category,
    location,
    spendFormatted,
    lastUpdated,
    keyFactors,
  } = data;

  // Risk level colors
  const riskColors = {
    low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', ring: 'ring-green-500' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', ring: 'ring-yellow-500' },
    'medium-high': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', ring: 'ring-orange-500' },
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'ring-red-500' },
  };

  const colors = riskColors[riskLevel] || riskColors.medium;

  // Trend icons
  const trendIcons = {
    improving: { icon: '↓', color: 'text-green-600', label: 'Improving' },
    stable: { icon: '→', color: 'text-slate-500', label: 'Stable' },
    worsening: { icon: '↑', color: 'text-red-600', label: 'Worsening' },
  };

  const trendInfo = trendIcons[trend] || trendIcons.stable;

  // Calculate gauge position (0-180 degrees for semicircle)
  const gaugeAngle = (riskScore / 100) * 180;

  return (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]`}>
      {/* Header */}
      <div className={`${colors.bg} px-5 py-4 border-b ${colors.border}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-normal text-slate-900 text-lg">{supplierName}</h3>
            <p className="text-sm text-slate-600">{category}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
            {riskLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Risk
          </div>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="px-5 py-6">
        <div className="relative w-40 h-20 mx-auto mb-4">
          {/* Gauge background */}
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Colored arc based on score */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={
                riskLevel === 'high' ? '#ef4444' :
                  riskLevel === 'medium-high' ? '#f97316' :
                    riskLevel === 'medium' ? '#eab308' : '#22c55e'
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(riskScore / 100) * 141.3} 141.3`}
            />
            {/* Needle */}
            <line
              x1="50"
              y1="50"
              x2={50 + 35 * Math.cos((Math.PI * (180 - gaugeAngle)) / 180)}
              y2={50 - 35 * Math.sin((Math.PI * (180 - gaugeAngle)) / 180)}
              stroke="#1e293b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="4" fill="#1e293b" />
          </svg>

          {/* Score display */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <div className={`text-3xl font-light ${colors.text}`}>{riskScore}</div>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`text-lg ${trendInfo.color}`}>{trendInfo.icon}</span>
          <span className={`text-sm font-medium ${trendInfo.color}`}>{trendInfo.label}</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-slate-500">Location</div>
            <div className="font-normal text-slate-900">
              {location.city}, {location.country}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-500">Your Spend</div>
            <div className="font-normal text-slate-900">{spendFormatted}</div>
          </div>
        </div>

        {/* Key Factors */}
        {keyFactors && keyFactors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Key Factors
            </div>
            <div className="space-y-1">
              {keyFactors.slice(0, 3).map((factor, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={
                    factor.impact === 'positive' ? 'text-green-500' :
                      factor.impact === 'negative' ? 'text-red-500' : 'text-slate-400'
                  }>
                    {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '−' : '•'}
                  </span>
                  <span className="text-slate-600">{factor.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <div className="mt-4 text-xs text-slate-400 text-center">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierRiskCardWidget;
