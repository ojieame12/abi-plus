import { ARTIFACT_META } from '../components/artifacts/registry';
import type { ArtifactPayload, ArtifactType } from '../components/artifacts/registry';
import type { Supplier, RiskChange, RiskPortfolio } from '../types/supplier';
import { formatSpend, getRiskLevelFromScore } from '../types/supplier';

interface ArtifactContext {
  suppliers?: Supplier[];
  portfolio?: RiskPortfolio;
  riskChanges?: RiskChange[];
}

const artifactTypeMap: Record<string, ArtifactType> = {
  PortfolioDashboardArtifact: 'portfolio_dashboard',
  SupplierTableArtifact: 'supplier_table',
  SupplierDetailArtifact: 'supplier_detail',
  ComparisonArtifact: 'supplier_comparison',
};

export const resolveArtifactType = (
  expandsTo?: string,
  fallback?: string
): ArtifactType | null => {
  if (expandsTo && expandsTo in artifactTypeMap) {
    return artifactTypeMap[expandsTo];
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

    default:
      return null;
  }
}
