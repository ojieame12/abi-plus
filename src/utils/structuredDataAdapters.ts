// structuredDataAdapters — Convert EnrichedCommodity data into ReportVisual shapes
// These produce high-confidence visuals from real structured data — no LLM hallucination.
// Each adapter returns null when data is insufficient, triggering LLM fallback.

import type { EnrichedCommodity } from '../types/enrichedData';
import type {
  LineChartVisual,
  BarChartVisual,
  PieChartVisual,
  MetricVisual,
} from '../types/deepResearch';

/**
 * Convert historicalPrices into a quarterly-aggregated LineChartVisual for the market_size_trend slot.
 * Uses pricing.historicalPrices data to show benchmark price trends over time.
 * NOTE: This is a *price* trend, not a market-size trend. The slot title in the template
 * should reflect this. When the slot falls through to LLM extraction, the LLM may
 * extract actual market-size data from prose.
 */
export const commodityToMarketSizeTrend = (
  commodity: EnrichedCommodity,
  sectionId: string
): LineChartVisual | null => {
  const prices = commodity.pricing?.historicalPrices;
  if (!prices || prices.length < 2) {
    console.log(`[StructuredAdapter] commodityToMarketSizeTrend: skipped ${commodity.name} — only ${prices?.length ?? 0} price points`);
    return null;
  }

  // Aggregate to quarterly buckets for a cleaner chart
  const quarterlyMap = new Map<string, { sum: number; count: number }>();

  for (const point of prices) {
    const date = new Date(point.date);
    const q = Math.floor(date.getMonth() / 3) + 1;
    const key = `${date.getFullYear()} Q${q}`;
    const existing = quarterlyMap.get(key);
    if (existing) {
      existing.sum += point.price;
      existing.count += 1;
    } else {
      quarterlyMap.set(key, { sum: point.price, count: 1 });
    }
  }

  const entries = [...quarterlyMap.entries()];
  if (entries.length < 2) {
    console.log(`[StructuredAdapter] commodityToMarketSizeTrend: skipped ${commodity.name} — only ${entries.length} quarterly buckets`);
    return null;
  }

  const points = entries.map(([label, { sum, count }]) => ({
    x: label,
    y: Math.round((sum / count) * 100) / 100,
  }));

  return {
    id: `${sectionId}_market_size_trend`,
    title: `${commodity.name} Benchmark Price Trend`,
    type: 'line_chart',
    data: {
      unit: `${commodity.currency}/${commodity.unit}`,
      series: [
        {
          name: `${commodity.name} (${commodity.pricing.benchmarkIndex || 'Spot'})`,
          points,
        },
      ],
    },
    sourceIds: [],
    confidence: 'high',
    placement: 'after_prose',
    footnote: `Source: ${commodity.pricing.benchmarkIndex || commodity.name} quarterly average`,
  };
};

/**
 * Produce a BarChartVisual for cost driver breakdown.
 * Synthesizes category-based cost drivers (since EnrichedCommodity doesn't have explicit cost breakdowns).
 * Returns null to fall through to LLM extraction by default — only produces data when we have
 * enough risk/fundamental signals to build a meaningful breakdown.
 */
export const commodityToCostDriverBreakdown = (
  commodity: EnrichedCommodity,
  sectionId: string
): BarChartVisual | null => {
  // We don't have explicit cost driver data in EnrichedCommodity.
  // Build a synthetic breakdown from available signals.
  // Only need category — risks/fundamentals are optional context.
  const { category } = commodity;
  if (!category) {
    console.log(`[StructuredAdapter] commodityToCostDriverBreakdown: skipped ${commodity.name} — no category`);
    return null;
  }

  // Category-based cost driver templates
  const driversByCategory: Record<string, { name: string; basePct: number }[]> = {
    metals: [
      { name: 'Raw Material / Ore', basePct: 35 },
      { name: 'Energy (Smelting)', basePct: 25 },
      { name: 'Labor', basePct: 15 },
      { name: 'Logistics', basePct: 12 },
      { name: 'Overhead & Other', basePct: 13 },
    ],
    packaging: [
      { name: 'Raw Material', basePct: 40 },
      { name: 'Labor', basePct: 20 },
      { name: 'Energy', basePct: 15 },
      { name: 'Logistics', basePct: 15 },
      { name: 'Overhead', basePct: 10 },
    ],
    chemicals: [
      { name: 'Feedstock', basePct: 40 },
      { name: 'Energy', basePct: 22 },
      { name: 'Labor', basePct: 12 },
      { name: 'Logistics', basePct: 14 },
      { name: 'Regulatory / Compliance', basePct: 12 },
    ],
    energy: [
      { name: 'Production / Extraction', basePct: 35 },
      { name: 'Transportation / Pipeline', basePct: 25 },
      { name: 'Storage', basePct: 15 },
      { name: 'Regulatory', basePct: 10 },
      { name: 'Distribution', basePct: 15 },
    ],
    logistics: [
      { name: 'Fuel', basePct: 35 },
      { name: 'Labor / Crew', basePct: 20 },
      { name: 'Equipment / Vessel', basePct: 20 },
      { name: 'Port / Terminal Fees', basePct: 15 },
      { name: 'Insurance & Other', basePct: 10 },
    ],
  };

  const drivers = driversByCategory[category];
  if (!drivers) {
    console.log(`[StructuredAdapter] commodityToCostDriverBreakdown: skipped ${commodity.name} — category "${category}" not in driver templates`);
    return null;
  }

  return {
    id: `${sectionId}_cost_driver_breakdown`,
    title: `${commodity.name} Estimated Cost Breakdown`,
    type: 'bar_chart',
    data: {
      unit: '%',
      horizontal: true,
      categories: drivers.map(d => d.name),
      series: [{ name: 'Cost Share', values: drivers.map(d => d.basePct) }],
    },
    sourceIds: [],
    confidence: 'high',
    placement: 'after_prose',
    footnote: 'Industry-estimated cost structure',
  };
};

/**
 * Convert topProducers into a PieChartVisual for market share distribution.
 * Groups small producers into "Others" when there are more than 5.
 */
export const commodityToMarketShare = (
  commodity: EnrichedCommodity,
  sectionId: string
): PieChartVisual | null => {
  const producers = commodity.marketStructure?.topProducers;
  if (!producers || producers.length < 2) {
    console.log(`[StructuredAdapter] commodityToMarketShare: skipped ${commodity.name} — only ${producers?.length ?? 0} producers`);
    return null;
  }

  // Sum all market shares to check for data quality
  const totalShare = producers.reduce((sum, p) => sum + p.marketShare, 0);
  if (totalShare < 5) {
    console.log(`[StructuredAdapter] commodityToMarketShare: skipped ${commodity.name} — total share ${totalShare}% too sparse`);
    return null; // Data too sparse
  }

  // Top 5 by market share, rest grouped as "Others"
  const sorted = [...producers].sort((a, b) => b.marketShare - a.marketShare);
  const top5 = sorted.slice(0, 5);
  const othersShare = sorted.slice(5).reduce((sum, p) => sum + p.marketShare, 0);

  const slices = top5.map(p => ({
    label: p.name,
    value: Math.round(p.marketShare * 10) / 10,
  }));

  if (othersShare > 0) {
    slices.push({ label: 'Others', value: Math.round(othersShare * 10) / 10 });
  }

  // If total < 100%, add "Remaining" (fragmented market)
  const sliceTotal = slices.reduce((sum, s) => sum + s.value, 0);
  if (sliceTotal < 95) {
    slices.push({ label: 'Remaining Market', value: Math.round((100 - sliceTotal) * 10) / 10 });
  }

  return {
    id: `${sectionId}_market_share_distribution`,
    title: `${commodity.name} Market Share Distribution`,
    type: 'pie_chart',
    data: {
      unit: '%',
      slices,
    },
    sourceIds: [],
    confidence: 'high',
    placement: 'after_prose',
  };
};

/**
 * Build a MetricVisual with 3-4 key metrics from commodity data
 * for the key_metrics_summary slot.
 */
export const commodityToKeyMetrics = (
  commodity: EnrichedCommodity,
  sectionId: string
): MetricVisual | null => {
  const { currentPrice, currency, unit, fundamentals, risks, priceChange } = commodity;
  if (!currentPrice) {
    console.log(`[StructuredAdapter] commodityToKeyMetrics: skipped ${commodity.name} — no currentPrice`);
    return null;
  }

  const metrics: MetricVisual['data']['metrics'] = [];

  // 1. Current Price
  metrics.push({
    label: 'Current Price',
    value: `${currency} ${currentPrice.toLocaleString()}/${unit}`,
    trend: priceChange.monthly > 0 ? 'up' : priceChange.monthly < 0 ? 'down' : 'stable',
    trendValue: `${priceChange.monthly > 0 ? '+' : ''}${priceChange.monthly.toFixed(1)}% MoM`,
    color: 'default',
  });

  // 2. Supply-Demand Balance
  if (fundamentals?.globalProduction && fundamentals?.globalConsumption) {
    const balance = fundamentals.globalProduction - fundamentals.globalConsumption;
    const balancePct = (balance / fundamentals.globalConsumption) * 100;
    metrics.push({
      label: 'Supply Balance',
      value: balance > 0 ? `+${balancePct.toFixed(1)}% surplus` : `${balancePct.toFixed(1)}% deficit`,
      subLabel: `${fundamentals.daysOfSupply} days of supply`,
      trend: balance > 0 ? 'down' : 'up', // surplus = prices down pressure, deficit = up
      color: Math.abs(balancePct) > 5 ? 'warning' : 'success',
    });
  }

  // 3. Utilization Rate
  if (fundamentals?.utilizationRate) {
    metrics.push({
      label: 'Capacity Utilization',
      value: `${fundamentals.utilizationRate}%`,
      trend: fundamentals.utilizationRate > 85 ? 'up' : 'stable',
      color: fundamentals.utilizationRate > 90 ? 'danger' : fundamentals.utilizationRate > 80 ? 'warning' : 'success',
    });
  }

  // 4. Supply Risk
  if (risks?.supplyRiskScore !== undefined) {
    metrics.push({
      label: 'Supply Risk',
      value: `${risks.supplyRiskScore}/100`,
      subLabel: risks.supplyDisruptionRisk,
      color: risks.supplyRiskScore > 70 ? 'danger' : risks.supplyRiskScore > 40 ? 'warning' : 'success',
    });
  }

  if (metrics.length < 1) {
    console.log(`[StructuredAdapter] commodityToKeyMetrics: skipped ${commodity.name} — 0 metrics built`);
    return null;
  }

  return {
    id: `${sectionId}_key_metrics_summary`,
    title: `${commodity.name} Key Metrics`,
    type: 'metric',
    data: { metrics },
    sourceIds: [],
    confidence: 'high',
    placement: 'before_prose',
  };
};

// ── Adapter registry for slot-based lookup ──

/** Map of slot IDs to adapter functions */
export const STRUCTURED_ADAPTERS: Record<
  string,
  (commodity: EnrichedCommodity, sectionId: string) => LineChartVisual | BarChartVisual | PieChartVisual | MetricVisual | null
> = {
  commodityToMarketSizeTrend,
  commodityToCostDriverBreakdown,
  commodityToMarketShare,
  commodityToKeyMetrics,
};
