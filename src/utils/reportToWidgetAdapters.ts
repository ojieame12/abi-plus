// reportToWidgetAdapters — Convert ReportVisual shapes into existing widget data shapes
// so that MetricRowWidget, StatCard, and TrendChartWidget can render report visuals.

import type { LineChartVisual, MetricVisual } from '../types/deepResearch';
import type { TrendChartData, MetricRowData, StatCardData } from '../types/widgets';

/**
 * Convert a single-series LineChartVisual into TrendChartData for TrendChartWidget.
 * Returns null when data shape doesn't fit (multi-series, empty, etc.) — triggers generic fallback.
 */
export const lineChartToTrendChart = (visual: LineChartVisual): TrendChartData | null => {
  const { series, unit } = visual.data;

  // Only handle single-series line charts
  if (!series || series.length !== 1) return null;

  const s = series[0];
  if (!s.points || s.points.length < 2) return null;

  const dataPoints = s.points.map(p => ({
    date: p.x,
    value: p.y,
  }));

  // Determine trend direction from first to last value
  const firstVal = dataPoints[0].value;
  const lastVal = dataPoints[dataPoints.length - 1].value;
  const diff = lastVal - firstVal;
  const changeDirection: 'up' | 'down' | 'stable' =
    Math.abs(diff) < 0.001 ? 'stable' : diff > 0 ? 'up' : 'down';

  // Build a human-readable change summary
  const pctChange = firstVal !== 0 ? ((diff / Math.abs(firstVal)) * 100) : 0;
  const sign = pctChange >= 0 ? '+' : '';
  const changeSummary = `${sign}${pctChange.toFixed(1)}% from ${dataPoints[0].date} to ${dataPoints[dataPoints.length - 1].date}`;

  return {
    title: visual.title,
    dataPoints,
    changeDirection,
    changeSummary,
    unit: unit || undefined,
  };
};

/**
 * Convert a MetricVisual (2+ metrics) into MetricRowData for MetricRowWidget.
 */
export const metricVisualToMetricRow = (visual: MetricVisual): MetricRowData => {
  return {
    metrics: visual.data.metrics.map(m => ({
      label: m.label,
      value: m.value,
      subLabel: m.subLabel,
      change: buildChange(m.trend, m.trendValue),
      color: m.color || 'default',
    })),
  };
};

/**
 * Convert a MetricVisual (single metric) into StatCardData for StatCard.
 * Returns null when there's more than one metric — use metricVisualToMetricRow instead.
 */
export const metricVisualToStatCard = (visual: MetricVisual): StatCardData | null => {
  const { metrics } = visual.data;
  if (!metrics || metrics.length !== 1) return null;

  const m = metrics[0];
  return {
    label: m.label,
    value: m.value,
    subLabel: m.subLabel,
    change: buildChange(m.trend, m.trendValue),
    color: m.color || 'default',
  };
};

// ── Helpers ──

/**
 * Parse trend + trendValue from MetricVisual into the change shape used by widgets.
 */
function buildChange(
  trend?: 'up' | 'down' | 'stable',
  trendValue?: string
): { value: number; direction: 'up' | 'down' | 'stable'; period?: string } | undefined {
  if (!trendValue) {
    // Avoid showing misleading "↑0%" when no trend magnitude is provided
    return undefined;
  }

  const direction = trend || 'stable';

  // Try to parse a numeric value from trendValue (e.g., "+5.2%", "3.1%", "-12%")
  let numericValue = 0;
  const match = trendValue.match(/[+-]?\d+\.?\d*/);
  if (match) {
    numericValue = Math.abs(parseFloat(match[0]));
  }

  if (!isFinite(numericValue) || numericValue === 0) {
    return undefined;
  }

  return {
    value: numericValue,
    direction,
  };
}
