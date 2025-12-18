// Comparison Table Widget - Side-by-side supplier comparison
import type { ComparisonTableData } from '../../types/widgets';

interface Props {
  data: ComparisonTableData;
}

export const ComparisonTableWidget = ({ data }: Props) => {
  const { suppliers, comparisonDimensions, recommendation } = data;

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' };
      case 'medium-high': return { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100' };
      case 'medium': return { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100' };
      case 'low': return { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100' };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'worsening': return { icon: '↑', color: 'text-red-500' };
      case 'improving': return { icon: '↓', color: 'text-green-500' };
      default: return { icon: '→', color: 'text-slate-400' };
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-normal text-slate-900">Supplier Comparison</h3>
        <p className="text-sm text-slate-500">
          Comparing {suppliers.length} suppliers across {comparisonDimensions.length} dimensions
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                Metric
              </th>
              {suppliers.map((supplier) => (
                <th
                  key={supplier.id}
                  className="px-4 py-3 text-center text-sm font-normal text-slate-900"
                >
                  {supplier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Risk Score Row */}
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Risk Score
              </td>
              {suppliers.map((supplier) => {
                const colors = getRiskColor(supplier.riskLevel);
                return (
                  <td key={supplier.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xl font-normal ${colors.text}`}>
                        {supplier.riskScore}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge} ${colors.text}`}>
                        {supplier.riskLevel}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Trend Row */}
            <tr className="bg-slate-50/50">
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Trend
              </td>
              {suppliers.map((supplier) => {
                const trend = getTrendIcon(supplier.trend);
                return (
                  <td key={supplier.id} className="px-4 py-3 text-center">
                    <span className={`text-lg ${trend.color}`}>{trend.icon}</span>
                    <span className={`ml-1 text-sm ${trend.color}`}>
                      {supplier.trend}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Spend Row */}
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Your Spend
              </td>
              {suppliers.map((supplier) => (
                <td key={supplier.id} className="px-4 py-3 text-center">
                  <span className="font-normal text-slate-900">{supplier.spend}</span>
                </td>
              ))}
            </tr>

            {/* Location Row */}
            <tr className="bg-slate-50/50">
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Location
              </td>
              {suppliers.map((supplier) => (
                <td key={supplier.id} className="px-4 py-3 text-center text-sm text-slate-600">
                  {supplier.location}
                </td>
              ))}
            </tr>

            {/* Category Row */}
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Category
              </td>
              {suppliers.map((supplier) => (
                <td key={supplier.id} className="px-4 py-3 text-center text-sm text-slate-600">
                  {supplier.category}
                </td>
              ))}
            </tr>

            {/* Strengths Row */}
            <tr className="bg-slate-50/50">
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Strengths
              </td>
              {suppliers.map((supplier) => (
                <td key={supplier.id} className="px-4 py-3 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {supplier.strengths.slice(0, 2).map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Weaknesses Row */}
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-slate-600">
                Concerns
              </td>
              {suppliers.map((supplier) => (
                <td key={supplier.id} className="px-4 py-3 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {supplier.weaknesses.slice(0, 2).map((w, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="px-5 py-4 bg-violet-50 border-t border-violet-100">
          <div className="flex items-start gap-2">
            <span className="text-violet-600 mt-0.5">💡</span>
            <div>
              <div className="text-sm font-normal text-violet-900">Recommendation</div>
              <div className="text-sm text-violet-700 mt-1">{recommendation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTableWidget;
