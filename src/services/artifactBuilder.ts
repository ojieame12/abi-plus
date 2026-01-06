import { ARTIFACT_META } from '../components/artifacts/registry';
import type { ArtifactPayload, ArtifactType } from '../components/artifacts/registry';
import type { Supplier, RiskChange, RiskPortfolio } from '../types/supplier';
import { formatSpend, getRiskLevelFromScore } from '../types/supplier';
import type {
  InflationSummaryCardData,
  DriverBreakdownCardData,
  SpendImpactCardData,
  JustificationCardData,
  ScenarioCardData,
  ExecutiveBriefCardData,
  CommodityGaugeData,
} from '../types/inflation';
import type { PriceGaugeData } from '../types/widgets';

interface ArtifactContext {
  suppliers?: Supplier[];
  portfolio?: RiskPortfolio;
  riskChanges?: RiskChange[];
  // Inflation widget data - passed from widget.data
  widgetData?: Record<string, unknown>;
}

const artifactTypeMap: Record<string, ArtifactType> = {
  PortfolioDashboardArtifact: 'portfolio_dashboard',
  SupplierTableArtifact: 'supplier_table',
  SupplierDetailArtifact: 'supplier_detail',
  ComparisonArtifact: 'supplier_comparison',
  AlternativesArtifact: 'supplier_alternatives',
  InflationDashboardArtifact: 'inflation_dashboard',
  DriverAnalysisArtifact: 'driver_analysis',
  ImpactAnalysisArtifact: 'impact_analysis',
  JustificationReportArtifact: 'justification_report',
  ScenarioPlannerArtifact: 'scenario_planner',
  ExecutivePresentationArtifact: 'executive_presentation',
};

export const resolveArtifactType = (
  expandsTo?: string,
  fallback?: string
): ArtifactType | null => {
  if (expandsTo && expandsTo in artifactTypeMap) {
    return artifactTypeMap[expandsTo];
  }
  if (expandsTo && expandsTo in ARTIFACT_META) {
    return expandsTo as ArtifactType;
  }
  if (fallback && fallback in artifactTypeMap) {
    return artifactTypeMap[fallback];
  }
  if (fallback && fallback in ARTIFACT_META) {
    return fallback as ArtifactType;
  }
  return null;
};

const toLocationLabel = (supplier: Supplier): string => {
  const city = supplier.location?.city;
  const country = supplier.location?.country;
  const region = supplier.location?.region;
  return [city, country].filter(Boolean).join(', ') || country || region || 'Unknown';
};

const uniqueValues = (items: string[]): string[] => {
  return Array.from(new Set(items.filter(Boolean)));
};

const mapFactorCategory = (name: string): 'financial' | 'operational' | 'compliance' | 'external' => {
  const normalized = name.toLowerCase();
  if (normalized.includes('financial') || normalized.includes('credit')) return 'financial';
  if (normalized.includes('compliance') || normalized.includes('sanction') || normalized.includes('esg') || normalized.includes('diversity')) {
    return 'compliance';
  }
  if (normalized.includes('quality') || normalized.includes('delivery') || normalized.includes('scalability') || normalized.includes('freight')) {
    return 'operational';
  }
  return 'external';
};

const buildSupplierHistory = (supplier: Supplier) => {
  const historyScores = supplier.srs.scoreHistory?.length
    ? supplier.srs.scoreHistory
    : [supplier.srs.previousScore, supplier.srs.score].filter((score): score is number => typeof score === 'number');

  if (historyScores.length === 0) {
    historyScores.push(supplier.srs.score ?? 0);
  }

  const now = Date.now();
  const stepMs = 30 * 24 * 60 * 60 * 1000;

  return historyScores.map((score, index) => {
    const previous = index > 0 ? historyScores[index - 1] : undefined;
    const change = previous !== undefined ? score - previous : undefined;
    const date = new Date(now - (historyScores.length - 1 - index) * stepMs).toISOString();
    return {
      date,
      score,
      level: getRiskLevelFromScore(score),
      change,
    };
  });
};

const buildSupplierEvents = (supplier: Supplier, riskChanges?: RiskChange[]) => {
  const matches = (riskChanges || []).filter(change => change.supplierId === supplier.id);
  if (matches.length > 0) {
    return matches.map((change, index) => ({
      id: `${supplier.id}-${change.changeDate}-${index}`,
      date: change.changeDate,
      title: `Risk score ${change.direction === 'worsened' ? 'increased' : 'decreased'} to ${change.currentScore}`,
      type: change.direction === 'worsened' ? 'alert' as const : 'update' as const,
      summary: `Score moved from ${change.previousScore} to ${change.currentScore} (${change.currentLevel}).`,
    }));
  }

  return [{
    id: `${supplier.id}-update`,
    date: supplier.srs.lastUpdated || new Date().toISOString(),
    title: 'Risk score updated',
    type: 'update' as const,
    summary: 'Latest risk assessment completed.',
  }];
};

const mapSupplierForTable = (supplier: Supplier) => ({
  id: supplier.id,
  name: supplier.name,
  duns: supplier.duns,
  category: supplier.category,
  location: toLocationLabel(supplier),
  spend: supplier.spend,
  spendFormatted: supplier.spendFormatted || formatSpend(supplier.spend),
  srs: {
    score: supplier.srs.score ?? null,
    level: supplier.srs.level,
    trend: supplier.srs.trend,
  },
});

const mapSupplierForDetail = (supplier: Supplier, riskChanges?: RiskChange[]) => ({
  id: supplier.id,
  name: supplier.name,
  duns: supplier.duns,
  category: supplier.category,
  location: {
    city: supplier.location?.city || '',
    country: supplier.location?.country || supplier.location?.region || 'Unknown',
  },
  spend: supplier.spend,
  spendFormatted: supplier.spendFormatted || formatSpend(supplier.spend),
  criticality: supplier.criticality,
  srs: {
    score: supplier.srs.score ?? null,
    level: supplier.srs.level,
    trend: supplier.srs.trend,
    lastUpdated: supplier.srs.lastUpdated || new Date().toISOString(),
  },
  riskFactors: (supplier.srs.factors || []).map(factor => ({
    name: factor.name,
    weight: factor.weight,
    isRestricted: factor.tier === 'restricted',
    category: mapFactorCategory(factor.name),
  })),
  events: buildSupplierEvents(supplier, riskChanges),
  history: buildSupplierHistory(supplier),
});

const mapSupplierForComparison = (supplier: Supplier) => {
  const metrics: Record<string, number | 'restricted'> = {};

  (supplier.srs.factors || []).forEach(factor => {
    const name = factor.name.toLowerCase();
    const score = factor.score ?? Math.round((factor.weight || 0) * 100);
    if (name.includes('esg')) metrics.esg = score;
    if (name.includes('quality')) metrics.quality = score;
    if (name.includes('delivery')) metrics.delivery = score;
    if (name.includes('diversity')) metrics.diversity = score;
    if (name.includes('scalability')) metrics.scalability = score;
    if (name.includes('financial')) metrics.financial = factor.tier === 'restricted' ? 'restricted' : score;
    if (name.includes('cyber')) metrics.cybersecurity = factor.tier === 'restricted' ? 'restricted' : score;
    if (name.includes('sanction')) metrics.sanctions = factor.tier === 'restricted' ? 'restricted' : score;
  });

  const pros: string[] = [];
  const cons: string[] = [];

  if (supplier.srs.trend === 'improving') pros.push('Improving risk trend');
  if (supplier.srs.trend === 'stable') pros.push('Stable risk profile');
  if (supplier.srs.trend === 'worsening') cons.push('Risk trend worsening');

  if (supplier.srs.level === 'low' || supplier.srs.level === 'medium') {
    pros.push('Moderate risk score');
  } else if (supplier.srs.level === 'high' || supplier.srs.level === 'medium-high') {
    cons.push('Elevated risk score');
  }

  return {
    id: supplier.id,
    name: supplier.name,
    category: supplier.category,
    location: toLocationLabel(supplier),
    srs: {
      score: supplier.srs.score ?? null,
      level: supplier.srs.level,
      trend: supplier.srs.trend,
    },
    metrics,
    spend: supplier.spendFormatted || formatSpend(supplier.spend),
    relationship: supplier.criticality === 'high' ? 'Strategic' : supplier.criticality === 'medium' ? 'Preferred' : 'Approved',
    pros: pros.length > 0 ? pros : ['Established supplier relationship'],
    cons: cons.length > 0 ? cons : ['Limited comparative benchmarks'],
  };
};

const buildPortfolioPayload = (portfolio: RiskPortfolio, riskChanges?: RiskChange[]) => {
  const changes = riskChanges || [];
  const worsened = changes.filter(change => change.direction === 'worsened');
  const improved = changes.filter(change => change.direction === 'improved');
  const newHighRisk = changes.filter(change => change.currentLevel === 'high' || change.currentLevel === 'medium-high');

  const topMovers = [...changes]
    .sort((a, b) => Math.abs(b.currentScore - b.previousScore) - Math.abs(a.currentScore - a.previousScore))
    .slice(0, 4)
    .map(change => ({
      id: change.supplierId,
      name: change.supplierName,
      previousScore: change.previousScore,
      currentScore: change.currentScore,
      direction: change.direction === 'worsened' ? 'up' as const : 'down' as const,
    }));

  const alerts = worsened.slice(0, 3).map((change, index) => ({
    id: `${change.supplierId}-${index}`,
    headline: `${change.supplierName} risk increased`,
    type: 'critical' as const,
    affectedCount: 1,
    timestamp: new Date(change.changeDate).toLocaleDateString(),
  }));

  return {
    totalSuppliers: portfolio.totalSuppliers,
    distribution: portfolio.distribution,
    trends: {
      period: '30d',
      newHighRisk: newHighRisk.length,
      improved: improved.length,
      deteriorated: worsened.length,
    },
    alerts,
    topMovers,
    lastUpdated: new Date().toISOString(),
  };
};

export function buildArtifactPayload(
  type: ArtifactType,
  context: ArtifactContext
): ArtifactPayload | null {
  const suppliers = context.suppliers || [];

  switch (type) {
    case 'supplier_table': {
      if (suppliers.length === 0) return null;
      const tableSuppliers = suppliers.map(mapSupplierForTable);
      const categories = uniqueValues(tableSuppliers.map(s => s.category));
      const locations = uniqueValues(tableSuppliers.map(s => s.location));
      return {
        type: 'supplier_table',
        suppliers: tableSuppliers,
        totalCount: tableSuppliers.length,
        categories,
        locations,
      } as ArtifactPayload;
    }

    case 'supplier_detail': {
      if (suppliers.length === 0) return null;
      return {
        type: 'supplier_detail',
        supplier: mapSupplierForDetail(suppliers[0], context.riskChanges),
      } as ArtifactPayload;
    }

    case 'supplier_comparison': {
      if (suppliers.length < 2) return null;
      return {
        type: 'supplier_comparison',
        suppliers: suppliers.map(mapSupplierForComparison),
      } as ArtifactPayload;
    }

    case 'portfolio_dashboard': {
      if (!context.portfolio) return null;
      return {
        type: 'portfolio_dashboard',
        ...buildPortfolioPayload(context.portfolio, context.riskChanges),
      } as ArtifactPayload;
    }

    case 'supplier_alternatives': {
      if (suppliers.length < 2) return null;
      // First supplier is the "current" one we're finding alternatives for
      const currentSupplier = suppliers[0];
      const alternatives = suppliers.slice(1);

      return {
        type: 'supplier_alternatives',
        currentSupplier: {
          id: currentSupplier.id,
          name: currentSupplier.name,
          score: currentSupplier.srs?.score ?? 50,
          category: currentSupplier.category,
        },
        alternatives: alternatives.map(s => ({
          id: s.id,
          name: s.name,
          score: s.srs?.score ?? 50,
          level: s.srs?.level || 'unrated',
          category: s.category,
          region: s.location?.region || 'Unknown',
          country: s.location?.country || 'Unknown',
          matchScore: calculateSupplierMatchScore(currentSupplier, s),
          spend: s.spendFormatted,
        })),
      } as ArtifactPayload;
    }

    // ============================================
    // INFLATION ARTIFACTS
    // ============================================

    case 'inflation_dashboard': {
      const widgetData = context.widgetData as InflationSummaryCardData | undefined;
      if (!widgetData) return null;

      // Build priceMovements array from topIncreases and topDecreases
      const priceMovements = [
        ...(widgetData.topIncreases || []).map((item, i) => ({
          id: `increase-${i}`,
          name: item.commodity,
          category: 'commodity',
          change: { percent: item.change, direction: 'up' as const, absolute: 0 },
          exposure: item.impact,
        })),
        ...(widgetData.topDecreases || []).map((item, i) => ({
          id: `decrease-${i}`,
          name: item.commodity,
          category: 'commodity',
          change: { percent: Math.abs(item.change), direction: 'down' as const, absolute: 0 },
          exposure: item.benefit || '$0',
        })),
      ];

      return {
        type: 'inflation_dashboard',
        period: widgetData.period,
        summary: {
          period: widgetData.period,
          headline: widgetData.headline,
          overallChange: widgetData.overallChange,
          portfolioImpact: widgetData.portfolioImpact,
        },
        // priceMovements is a flat array, not nested in an object
        priceMovements,
        drivers: (widgetData.keyDrivers || []).map((driver, i) => ({
          id: `driver-${i}`,
          name: driver,
          category: 'market_speculation' as const,
          impact: 'medium' as const,
          direction: 'inflationary' as const,
          contribution: Math.round(100 / (widgetData.keyDrivers?.length || 1)),
          description: driver,
        })),
        alerts: [],
      } as ArtifactPayload;
    }

    case 'driver_analysis': {
      const widgetData = context.widgetData as DriverBreakdownCardData | undefined;
      if (!widgetData) return null;

      return {
        type: 'driver_analysis',
        commodity: widgetData.commodity,
        period: widgetData.period,
        priceChange: widgetData.priceChange,
        drivers: (widgetData.drivers || []).map((driver, i) => ({
          id: `driver-${i}`,
          name: driver.name,
          category: driver.category,
          impact: driver.contribution > 30 ? 'high' : driver.contribution > 15 ? 'medium' : 'low',
          direction: driver.direction === 'up' ? 'inflationary' : 'deflationary',
          contribution: driver.contribution,
          description: driver.description,
        })),
        driverContributions: (widgetData.drivers || []).map(driver => ({
          driver: driver.name,
          category: driver.category,
          contribution: driver.contribution,
        })),
        marketNews: [],
        historicalDrivers: [],
        marketContext: widgetData.marketContext,
        sources: widgetData.sources || [],
      } as ArtifactPayload;
    }

    case 'impact_analysis': {
      const widgetData = context.widgetData as SpendImpactCardData | undefined;
      if (!widgetData) return null;

      // Parse total impact amount (e.g., "$5.2M" -> 5200000, "$10.2B" -> 10200000000)
      const parseAmount = (str: string): number => {
        const match = str.match(/[\d.]+/);
        if (!match) return 0;
        const num = parseFloat(match[0]);
        if (str.includes('B')) return num * 1000000000;
        if (str.includes('M')) return num * 1000000;
        if (str.includes('K')) return num * 1000;
        return num;
      };

      const totalImpact = parseAmount(widgetData.totalImpact);

      return {
        type: 'impact_analysis',
        period: widgetData.timeframe,
        exposure: {
          totalExposure: totalImpact,
          totalExposureFormatted: widgetData.totalImpact,
          impactAmount: totalImpact,
          impactAmountFormatted: widgetData.totalImpact,
          impactPercent: widgetData.impactPercent * (widgetData.totalImpactDirection === 'increase' ? 1 : -1),
          byCommodity: [],
          byCategory: (widgetData.breakdown || []).map(item => ({
            category: item.category,
            exposure: parseAmount(item.amount),
            exposureFormatted: item.amount,
            percentOfTotal: item.percent,
            commodities: [],
            avgPriceChange: item.percent * (item.direction === 'up' ? 1 : -1),
            riskLevel: item.percent > 20 ? 'high' : item.percent > 10 ? 'medium' : 'low',
          })),
          bySupplier: [],
          byRiskLevel: [],
        },
        riskCorrelation: {
          highRiskHighExposure: 0,
          concentrationRisk: widgetData.mostAffected ? [{
            // Map 'category' to 'commodity' since categories are often commodity-based
            type: (widgetData.mostAffected.type === 'category' ? 'commodity' : widgetData.mostAffected.type) as 'commodity' | 'supplier' | 'region',
            name: widgetData.mostAffected.name,
            concentration: 30, // Default since we don't have exact data
          }] : [],
        },
        budgetImpact: undefined,
        mitigationOptions: widgetData.recommendation ? [{
          action: widgetData.recommendation,
          potentialSavings: 'TBD',
          effort: 'medium' as const,
          timeframe: '30 days',
        }] : [],
      } as ArtifactPayload;
    }

    case 'justification_report': {
      const widgetData = context.widgetData as JustificationCardData | undefined;
      if (!widgetData) return null;

      return {
        type: 'justification_report',
        justification: {
          supplierId: '',
          supplierName: widgetData.supplierName,
          commodity: widgetData.commodity,
          requestedIncrease: widgetData.requestedIncrease,
          marketIncrease: widgetData.marketBenchmark,
          variance: widgetData.requestedIncrease - widgetData.marketBenchmark,
          verdict: widgetData.verdict,
          marketComparison: {
            supplierPrice: 0,
            marketAvg: 0,
            marketLow: 0,
            marketHigh: 0,
            percentile: 50,
          },
          factors: (widgetData.keyPoints || []).map((point, i) => ({
            name: point.point,
            claimed: 0,
            market: 0,
            delta: 0,
            verdict: point.supports ? 'supports' as const : 'disputes' as const,
          })),
          recommendation: widgetData.recommendation,
          negotiationPoints: [],
          supportingData: [],
        },
        historicalPricing: [],
        competitorPricing: [],
        contractTerms: undefined,
      } as ArtifactPayload;
    }

    case 'scenario_planner': {
      const widgetData = context.widgetData as ScenarioCardData | undefined;
      if (!widgetData) return null;

      // Parse amounts from formatted strings
      const parseAmount = (str: string): number => {
        const match = str.match(/[\d.]+/);
        if (!match) return 0;
        const num = parseFloat(match[0]);
        if (str.includes('M')) return num * 1000000;
        if (str.includes('K')) return num * 1000;
        return num;
      };

      const baselineValue = parseAmount(widgetData.currentState.value);
      const projectedValue = parseAmount(widgetData.projectedState.value);
      const deltaValue = parseAmount(widgetData.delta.amount);

      return {
        type: 'scenario_planner',
        scenarios: [{
          id: 'scenario-1',
          name: widgetData.scenarioName,
          description: widgetData.description,
          type: 'price_increase' as const,
          assumptions: [{
            factor: widgetData.assumption,
            currentValue: baselineValue,
            projectedValue: projectedValue,
            changePercent: widgetData.delta.percent,
            confidence: widgetData.confidence,
          }],
          results: {
            baselineSpend: baselineValue,
            projectedSpend: projectedValue,
            delta: deltaValue * (widgetData.delta.direction === 'up' ? 1 : -1),
            deltaFormatted: widgetData.delta.amount,
            deltaPercent: widgetData.delta.percent * (widgetData.delta.direction === 'up' ? 1 : -1),
            impactByCategory: [],
            impactBySupplier: [],
            recommendations: widgetData.recommendation ? [widgetData.recommendation] : [],
            risks: widgetData.topImpacts || [],
            opportunities: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        baselineData: {
          totalSpend: baselineValue,
          byCategory: [],
          bySupplier: [],
        },
        availableFactors: [],
      } as ArtifactPayload;
    }

    case 'executive_presentation': {
      const widgetData = context.widgetData as ExecutiveBriefCardData | undefined;
      if (!widgetData) return null;

      return {
        type: 'executive_presentation',
        title: widgetData.title,
        period: widgetData.period,
        summary: widgetData.summary,
        keyMetrics: (widgetData.keyMetrics || []).map(metric => ({
          label: metric.label,
          value: metric.value,
          change: metric.change,
          status: metric.status,
        })),
        highlights: (widgetData.highlights || []).map(highlight => ({
          type: highlight.type,
          text: highlight.text,
        })),
        talkingPoints: [],
        outlook: widgetData.outlook,
        nextSteps: [],
        shareableUrl: widgetData.shareableUrl,
      } as ArtifactPayload;
    }

    case 'commodity_dashboard': {
      // Handle both CommodityGaugeData and PriceGaugeData formats
      const widgetData = context.widgetData as (CommodityGaugeData | PriceGaugeData) | undefined;
      if (!widgetData) return null;

      // Type guard to check if it's CommodityGaugeData (has .changes.monthly)
      const isCommodityGauge = (data: CommodityGaugeData | PriceGaugeData): data is CommodityGaugeData => {
        return 'changes' in data && typeof data.changes === 'object' && 'monthly' in (data.changes || {});
      };

      if (isCommodityGauge(widgetData)) {
        // CommodityGaugeData format
        return {
          type: 'commodity_dashboard',
          commodity: {
            commodityId: widgetData.commodity,
            name: widgetData.commodity,
            category: widgetData.category,
            currentPrice: widgetData.currentPrice,
            previousPrice: widgetData.currentPrice * (1 - (widgetData.changes?.monthly?.percent || 0) / 100),
            unit: widgetData.unit,
            currency: widgetData.currency,
            market: widgetData.market,
            lastUpdated: widgetData.lastUpdated,
            changes: widgetData.changes,
            history: [],
          },
          drivers: [],
          exposure: widgetData.portfolioExposure ? {
            commodityId: widgetData.commodity,
            commodityName: widgetData.commodity,
            category: widgetData.category,
            exposure: 0,
            exposureFormatted: widgetData.portfolioExposure.amount,
            priceChange: widgetData.changes?.monthly || { percent: 0, direction: 'stable', absolute: 0 },
            supplierCount: widgetData.portfolioExposure.supplierCount,
            topSuppliers: [],
          } : undefined,
          affectedSuppliers: [],
          historicalComparison: [],
          forecast: undefined,
          relatedCommodities: [],
        } as ArtifactPayload;
      } else {
        // PriceGaugeData format (from price_gauge widget)
        const priceData = widgetData as PriceGaugeData;
        const change30d = priceData.change30d?.percent || 0;
        return {
          type: 'commodity_dashboard',
          commodity: {
            commodityId: priceData.commodity.toLowerCase().replace(/\s+/g, '-'),
            name: priceData.commodity,
            category: 'metals', // Default category for price gauge
            currentPrice: priceData.currentPrice,
            previousPrice: priceData.currentPrice * (1 - change30d / 100),
            unit: priceData.unit,
            currency: priceData.currency || 'USD',
            market: priceData.market,
            lastUpdated: priceData.lastUpdated,
            changes: {
              daily: { percent: priceData.change24h?.percent || 0, direction: (priceData.change24h?.percent || 0) > 0 ? 'up' : (priceData.change24h?.percent || 0) < 0 ? 'down' : 'stable', absolute: priceData.change24h?.value || 0 },
              weekly: { percent: change30d / 4, direction: change30d > 0 ? 'up' : change30d < 0 ? 'down' : 'stable', absolute: (priceData.change30d?.value || 0) / 4 },
              monthly: { percent: change30d, direction: change30d > 0 ? 'up' : change30d < 0 ? 'down' : 'stable', absolute: priceData.change30d?.value || 0 },
            },
            history: [],
          },
          drivers: [],
          exposure: undefined,
          affectedSuppliers: [],
          historicalComparison: [],
          forecast: undefined,
          relatedCommodities: [],
        } as ArtifactPayload;
      }
    }

    default:
      return null;
  }
}

// Helper to calculate match score between suppliers
function calculateSupplierMatchScore(current: Supplier, alternative: Supplier): number {
  let score = 70; // Base score

  // Same category = +15
  if (current.category === alternative.category) score += 15;

  // Same region = +10
  if (current.location?.region === alternative.location?.region) score += 5;
  if (current.location?.country === alternative.location?.country) score += 5;

  // Better risk score = +5
  if ((alternative.srs?.score ?? 100) < (current.srs?.score ?? 0)) score += 5;

  return Math.min(score, 98); // Cap at 98%
}
