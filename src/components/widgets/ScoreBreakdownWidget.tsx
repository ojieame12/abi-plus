import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ScoreBreakdownData } from '../../types/widgets';

interface ScoreBreakdownWidgetProps {
  data: ScoreBreakdownData;
  size?: 'M' | 'L';
  onExpand?: () => void;
}

const riskColors = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', fill: '#10b981' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', fill: '#f59e0b' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', fill: '#f97316' },
  high: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', fill: '#f43f5e' },
};

const impactIcons = {
  positive: { icon: TrendingDown, color: 'text-emerald-500' },
  negative: { icon: TrendingUp, color: 'text-rose-500' },
  neutral: { icon: Minus, color: 'text-slate-400' },
};

export const ScoreBreakdownWidget = ({ data, size = 'M', onExpand }: ScoreBreakdownWidgetProps) => {
  const { totalScore, riskLevel, factors, lastUpdated } = data;
  const colors = riskColors[riskLevel];

  // Calculate gauge angle (0-180 degrees)
  const gaugeAngle = (totalScore / 100) * 180;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] overflow-hidden">
      {/* Score Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[13px] text-slate-500">Risk Score</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-light text-slate-900">{totalScore}</span>
              <span className={`text-[12px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                {riskLevel.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Mini gauge */}
          <div className="relative w-16 h-8">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={8}
                strokeLinecap="round"
              />
              {/* Colored arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={colors.fill}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${(gaugeAngle / 180) * 126} 126`}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Factors */}
      <div className="border-t border-slate-100/60">
        <div className="px-5 py-3">
          <span className="text-[12px] font-normal text-slate-500 uppercase tracking-wide">Contributing Factors</span>
        </div>
        <div className="px-5 pb-4 space-y-2">
          {factors.slice(0, size === 'L' ? factors.length : 4).map((factor, i) => {
            const impact = impactIcons[factor.impact];
            const ImpactIcon = impact.icon;
            const barWidth = (factor.score / 100) * 100;

            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ImpactIcon size={14} strokeWidth={1.5} className={impact.color} />
                    <span className="text-[13px] text-slate-700">{factor.name}</span>
                  </div>
                  <span className="text-[13px] text-slate-500">{factor.score}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: factor.impact === 'positive' ? '#10b981' : factor.impact === 'negative' ? '#f43f5e' : '#94a3b8',
                    }}
                  />
                </div>
                {factor.description && (
                  <p className="text-[11px] text-slate-400 mt-1">{factor.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50/40 border-t border-slate-100/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Updated {lastUpdated}</span>
        {onExpand && (
          <button
            onClick={onExpand}
            className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700 transition-colors"
          >
            View details
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
};
