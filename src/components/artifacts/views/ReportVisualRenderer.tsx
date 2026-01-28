// ReportVisualRenderer — Inline chart, table, and metric renderers for deep research reports.
// Renders ReportVisual data inline within report sections. No external charting libraries.
// Delegates metric and single-series line_chart visuals to existing widget components
// (MetricRowWidget, StatCard, TrendChartWidget) for consistent styling.
// Fails gracefully — if data is malformed, the component returns null (prose still renders).

import type {
  ReportVisual,
  LineChartVisual,
  BarChartVisual,
  PieChartVisual,
  TableVisual,
  MetricVisual,
} from '../../../types/deepResearch';
import type { CitationMap } from '../../../types/hybridResponse';
import { TrendChartWidget } from '../../widgets/TrendChartWidget';
import { MetricRowWidget } from '../../widgets/MetricRowWidget';
import { StatCard } from '../../widgets/StatCard';
import { CitationBadge } from '../../chat/CitationBadge';
import { lineChartToTrendChart, metricVisualToMetricRow, metricVisualToStatCard } from '../../../utils/reportToWidgetAdapters';

// ── Color palette ──
const CHART_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
];

const getColor = (index: number, override?: string): string =>
  override || CHART_COLORS[index % CHART_COLORS.length];

// ============================================
// VISUAL FOOTER — source citations + confidence
// ============================================

/** Max citation icons to show before "+N more" */
const MAX_VISIBLE_CITATIONS = 5;

interface VisualFooterProps {
  visual: ReportVisual;
  citations: CitationMap;
}

const VisualFooter = ({ visual, citations }: VisualFooterProps) => {
  const resolvedIds = visual.sourceIds.filter(id => citations[id]);
  const visibleIds = resolvedIds.slice(0, MAX_VISIBLE_CITATIONS);
  const overflowCount = resolvedIds.length - visibleIds.length;

  const confidenceLabel =
    visual.confidence === 'low' ? 'Approximate data' :
    visual.confidence === 'medium' ? 'Extracted data' : null;

  if (!resolvedIds.length && !confidenceLabel && !visual.footnote) return null;

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px] text-slate-400">
      {/* Footnote from structured adapter (e.g. "Source: LME Aluminum quarterly average") */}
      {visual.footnote && (
        <span>{visual.footnote}</span>
      )}
      {/* Citation icons — resolved to Beroe squircle / Globe with tooltips */}
      {visibleIds.length > 0 && (
        <span className="inline-flex items-center gap-0.5">
          {!visual.footnote && <span className="mr-0.5">{resolvedIds.length} source{resolvedIds.length > 1 ? 's' : ''}</span>}
          {visibleIds.map(id => (
            <CitationBadge
              key={id}
              citationId={id}
              citation={citations[id]}
            />
          ))}
          {overflowCount > 0 && (
            <span className="ml-0.5">+{overflowCount}</span>
          )}
        </span>
      )}
      {/* Confidence indicator */}
      {confidenceLabel && (
        <>
          {(resolvedIds.length > 0 || visual.footnote) && <span className="text-slate-300">·</span>}
          <span className="italic">{confidenceLabel}</span>
        </>
      )}
    </div>
  );
};

// ============================================
// INLINE LINE CHART — SVG with area fill
// ============================================

const InlineLineChart = ({ visual }: { visual: LineChartVisual }) => {
  const { series, unit } = visual.data;
  if (!series.length || !series[0].points.length) return null;

  const W = 560;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Gather all y values for scale
  const allY = series.flatMap(s => s.points.map(p => p.y));
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const rangeY = maxY - minY || 1;

  // Use first series x-labels as axis labels
  const xLabels = series[0].points.map(p => p.x);

  const scaleX = (i: number) => PAD.left + (i / Math.max(xLabels.length - 1, 1)) * plotW;
  const scaleY = (v: number) => PAD.top + plotH - ((v - minY) / rangeY) * plotH;

  // Grid lines (5 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = PAD.top + (i / 4) * plotH;
    const val = maxY - (i / 4) * rangeY;
    return { y, label: val.toLocaleString(undefined, { maximumFractionDigits: 1 }) };
  });

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" className="fill-slate-400" fontSize={10}>
              {g.label}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-400"
            fontSize={10}
          >
            {label}
          </text>
        ))}

        {/* Series */}
        {series.map((s, si) => {
          const color = getColor(si, s.color);
          const pts = s.points.map((p, i) => ({ x: scaleX(i), y: scaleY(p.y) }));
          const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          const areaPath = `${linePath} L${pts[pts.length - 1].x},${PAD.top + plotH} L${pts[0].x},${PAD.top + plotH} Z`;

          return (
            <g key={si}>
              <path d={areaPath} fill={color} opacity={0.08} />
              <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="white" stroke={color} strokeWidth={2} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div className="flex items-center gap-4 mt-2 justify-center">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: getColor(i, s.color) }} />
              <span className="text-[11px] text-slate-500">{s.name}</span>
            </div>
          ))}
        </div>
      )}
      {unit && <p className="text-[11px] text-slate-400 mt-1 text-center">{unit}</p>}
    </div>
  );
};

// ============================================
// INLINE BAR CHART — SVG vertical / HTML horizontal
// ============================================

const InlineBarChart = ({ visual }: { visual: BarChartVisual }) => {
  const { categories, series, unit, horizontal } = visual.data;
  if (!categories.length || !series.length) return null;

  if (horizontal) {
    // HTML horizontal bars
    const maxVal = Math.max(...series.flatMap(s => s.values), 1);
    return (
      <div className="space-y-3">
        {categories.map((cat, ci) => (
          <div key={ci}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-slate-600">{cat}</span>
              <span className="text-[12px] text-slate-400 tabular-nums">
                {series[0]?.values[ci]?.toLocaleString()}{unit ? ` ${unit}` : ''}
              </span>
            </div>
            <div className="flex gap-1">
              {series.map((s, si) => (
                <div
                  key={si}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(s.values[ci] / maxVal) * 100}%`,
                    backgroundColor: getColor(si, s.color),
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        {series.length > 1 && (
          <div className="flex items-center gap-4 mt-2">
            {series.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getColor(i, s.color) }} />
                <span className="text-[11px] text-slate-500">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // SVG vertical bars
  const W = 560;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 50, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...series.flatMap(s => s.values), 1);
  const groupWidth = plotW / categories.length;
  const barWidth = Math.min(groupWidth * 0.6 / series.length, 40);
  const groupOffset = (groupWidth - barWidth * series.length) / 2;

  // Grid
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = PAD.top + (i / 4) * plotH;
    const val = maxVal - (i / 4) * maxVal;
    return { y, label: val.toLocaleString(undefined, { maximumFractionDigits: 0 }) };
  });

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" className="fill-slate-400" fontSize={10}>
              {g.label}
            </text>
          </g>
        ))}

        {categories.map((cat, ci) => (
          <g key={ci}>
            {series.map((s, si) => {
              const val = s.values[ci] || 0;
              const barH = (val / maxVal) * plotH;
              const x = PAD.left + ci * groupWidth + groupOffset + si * barWidth;
              const y = PAD.top + plotH - barH;
              return (
                <rect
                  key={si}
                  x={x}
                  y={y}
                  width={barWidth - 2}
                  height={barH}
                  rx={2}
                  fill={getColor(si, s.color)}
                />
              );
            })}
            <text
              x={PAD.left + ci * groupWidth + groupWidth / 2}
              y={H - 10}
              textAnchor="middle"
              className="fill-slate-400"
              fontSize={10}
            >
              {cat.length > 12 ? cat.slice(0, 11) + '…' : cat}
            </text>
          </g>
        ))}
      </svg>

      {series.length > 1 && (
        <div className="flex items-center gap-4 mt-2 justify-center">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getColor(i, s.color) }} />
              <span className="text-[11px] text-slate-500">{s.name}</span>
            </div>
          ))}
        </div>
      )}
      {unit && <p className="text-[11px] text-slate-400 mt-1 text-center">{unit}</p>}
    </div>
  );
};

// ============================================
// INLINE PIE CHART — SVG donut
// ============================================

const InlinePieChart = ({ visual }: { visual: PieChartVisual }) => {
  const { slices, unit } = visual.data;
  if (!slices.length) return null;

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const R = 15.915; // Radius for circumference = 100
  let cumulative = 0;

  const segments = slices.map((slice, i) => {
    const pct = (slice.value / total) * 100;
    const offset = cumulative;
    cumulative += pct;
    return {
      ...slice,
      pct,
      offset,
      color: getColor(i, slice.color),
    };
  });

  return (
    <div className="flex items-start gap-6">
      {/* Donut */}
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={R} fill="none" stroke="#f1f5f9" strokeWidth="3" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="18"
              cy="18"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-[18px] font-medium text-slate-700">{slices.length}</span>
            <span className="block text-[10px] text-slate-400">segments</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 pt-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[13px] text-slate-600 flex-1 min-w-0 truncate">{seg.label}</span>
            <span className="text-[12px] text-slate-400 tabular-nums flex-shrink-0">
              {seg.pct.toFixed(1)}%
              {unit && unit !== '%' ? ` (${seg.value.toLocaleString()} ${unit})` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// INLINE TABLE — HTML table with alternating rows
// ============================================

const InlineTable = ({ visual }: { visual: TableVisual }) => {
  const { headers, rows, columnAlignments, highlightFirstColumn } = visual.data;
  if (!headers.length || !rows.length) return null;

  const getAlign = (i: number) => columnAlignments?.[i] || 'left';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-slate-200">
            {headers.map((header, i) => (
              <th
                key={i}
                className="py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[11px]"
                style={{ textAlign: getAlign(i) }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50/50' : ''}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-2 px-3 text-slate-600 ${
                    highlightFirstColumn && ci === 0 ? 'font-medium text-slate-700' : ''
                  }`}
                  style={{ textAlign: getAlign(ci) }}
                >
                  {typeof cell === 'number' ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// INLINE METRIC ROW — grid of metric cards
// ============================================

const InlineMetricRow = ({ visual }: { visual: MetricVisual }) => {
  const { metrics } = visual.data;
  if (!metrics.length) return null;

  const colorClass = (color?: string) => {
    switch (color) {
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'danger': return 'text-red-600';
      default: return 'text-slate-900';
    }
  };

  const trendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <span className="text-emerald-500">↑</span>;
      case 'down': return <span className="text-red-500">↓</span>;
      case 'stable': return <span className="text-slate-400">→</span>;
      default: return null;
    }
  };

  // Single metric → callout card
  if (metrics.length === 1) {
    const m = metrics[0];
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-5 py-4 text-center">
        <p className="text-[12px] text-slate-500 mb-1">{m.label}</p>
        <p className={`text-[24px] font-medium ${colorClass(m.color)}`}>{m.value}</p>
        {(m.trend || m.trendValue) && (
          <p className="text-[12px] text-slate-500 mt-1">
            {trendIcon(m.trend)} {m.trendValue}
          </p>
        )}
        {m.subLabel && <p className="text-[11px] text-slate-400 mt-0.5">{m.subLabel}</p>}
      </div>
    );
  }

  // Multiple metrics → grid
  const cols = Math.min(metrics.length, 4);

  return (
    <div
      className="grid divide-x divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="px-4 py-4 text-center">
          <p className="text-[12px] text-slate-500 mb-1 truncate">{m.label}</p>
          <p className={`text-[20px] font-medium ${colorClass(m.color)}`}>{m.value}</p>
          {(m.trend || m.trendValue) && (
            <p className="text-[12px] text-slate-500 mt-1">
              {trendIcon(m.trend)} {m.trendValue}
            </p>
          )}
          {m.subLabel && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{m.subLabel}</p>}
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN RENDERER
// ============================================

interface ReportVisualRendererProps {
  visual: ReportVisual;
  citations: CitationMap;
}

export const ReportVisualRenderer = ({ visual, citations }: ReportVisualRendererProps) => {
  let chart: React.ReactNode = null;
  // When delegating to a widget that provides its own chrome (glassmorphic container),
  // skip the outer border wrapper to avoid double-boxing.
  let usesWidgetChrome = false;

  try {
    switch (visual.type) {
      case 'line_chart': {
        // Single-series line charts → delegate to TrendChartWidget
        if (visual.data.series.length === 1) {
          const trendData = lineChartToTrendChart(visual);
          if (trendData) {
            // Determine trend semantics from visual metadata (set by template slot or structured adapter)
            chart = <TrendChartWidget data={trendData} size="L" trendSemantics={visual.trendSemantics || 'up-good'} />;
            usesWidgetChrome = true;
            break;
          }
        }
        // Multi-series or adapter failed → inline SVG fallback
        chart = <InlineLineChart visual={visual} />;
        break;
      }
      case 'bar_chart':
        chart = <InlineBarChart visual={visual} />;
        break;
      case 'pie_chart':
        chart = <InlinePieChart visual={visual} />;
        break;
      case 'table':
        chart = <InlineTable visual={visual} />;
        break;
      case 'metric': {
        const { metrics } = visual.data;
        if (metrics.length === 1) {
          // Single metric → StatCard widget
          const statData = metricVisualToStatCard(visual);
          if (statData) {
            chart = <StatCard {...statData} size="md" />;
            usesWidgetChrome = true;
            break;
          }
        }
        if (metrics.length >= 2) {
          // 2+ metrics → MetricRowWidget
          const rowData = metricVisualToMetricRow(visual);
          if (rowData.metrics.length > 0) {
            chart = <MetricRowWidget data={rowData} variant="report" />;
            usesWidgetChrome = true;
            break;
          }
        }
        // Fallback to inline renderer
        chart = <InlineMetricRow visual={visual} />;
        break;
      }
      default:
        return null;
    }
  } catch (err) {
    // Malformed data — log for debugging, prose still renders
    console.warn(`[ReportVisualRenderer] Error rendering visual "${visual.id}" (type=${visual.type}):`, err);
    return null;
  }

  if (!chart) return null;

  // Widgets provide their own glassmorphic containers — don't double-wrap
  if (usesWidgetChrome) {
    return (
      <div className="my-6">
        {chart}
        <VisualFooter visual={visual} citations={citations} />
      </div>
    );
  }

  return (
    <div className="my-6">
      <p className="text-[13px] font-medium text-slate-700 mb-3">{visual.title}</p>
      <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-4">
        {chart}
      </div>
      <VisualFooter visual={visual} citations={citations} />
    </div>
  );
};

export default ReportVisualRenderer;
