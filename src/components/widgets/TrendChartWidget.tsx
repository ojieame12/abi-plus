import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendChartData } from '../../types/widgets';

interface TrendChartWidgetProps {
  data: TrendChartData;
  size?: 'M' | 'L';
}

export const TrendChartWidget = ({ data, size = 'M' }: TrendChartWidgetProps) => {
  const { title, dataPoints, changeDirection, changeSummary, unit } = data;

  // Calculate chart dimensions
  const chartHeight = size === 'L' ? 200 : 120;
  const chartWidth = size === 'L' ? 400 : 280;

  // Normalize data points for SVG
  const values = dataPoints.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = dataPoints.map((d, i) => {
    const x = (i / (dataPoints.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - minValue) / range) * (chartHeight - 20);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const directionConfig = {
    up: { icon: TrendingUp, color: 'text-rose-500', bgColor: 'bg-rose-50', strokeColor: '#f43f5e', fillColor: 'rgba(244, 63, 94, 0.1)' },
    down: { icon: TrendingDown, color: 'text-emerald-500', bgColor: 'bg-emerald-50', strokeColor: '#10b981', fillColor: 'rgba(16, 185, 129, 0.1)' },
    stable: { icon: Minus, color: 'text-slate-500', bgColor: 'bg-slate-50', strokeColor: '#64748b', fillColor: 'rgba(100, 116, 139, 0.1)' },
  };

  const config = directionConfig[changeDirection];
  const Icon = config.icon;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-normal text-slate-900">{title}</h3>
          <p className="text-[13px] text-slate-500 mt-0.5">{changeSummary}</p>
        </div>
        <div className={`w-9 h-9 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
          <Icon size={18} strokeWidth={1.5} className={config.color} />
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={0}
              y1={chartHeight - ratio * (chartHeight - 20)}
              x2={chartWidth}
              y2={chartHeight - ratio * (chartHeight - 20)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill={config.fillColor} />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={config.strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={config.strokeColor} strokeWidth={2} />
              {(i === 0 || i === points.length - 1) && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor={i === 0 ? 'start' : 'end'}
                  className="text-[10px] fill-slate-500"
                >
                  {p.value}{unit}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-1">
        {dataPoints.filter((_, i) => i === 0 || i === dataPoints.length - 1).map((d, i) => (
          <span key={i} className="text-[11px] text-slate-400">{d.date}</span>
        ))}
      </div>
    </div>
  );
};
