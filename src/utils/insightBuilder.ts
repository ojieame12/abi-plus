// Utility for building insight detail data from supplier/portfolio data
import type { Supplier } from '../types/supplier';

// ============================================
// TYPES
// ============================================

export interface InsightDetailData {
  headline: string;
  subheadline: string;
  summary: string;
  type: 'risk_alert' | 'opportunity' | 'info' | 'action_required';
  sentiment: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  entity?: {
    name: string;
    type: 'supplier' | 'category' | 'region' | 'portfolio';
    logoUrl?: string;
  };
  metric?: {
    label: string;
    previousValue: number;
    currentValue: number;
    unit?: string;
    trend: 'up' | 'down' | 'stable';
  };
  factors?: InsightFactor[];
  trendData?: number[];
  actions?: InsightAction[];
  sources?: {
    web?: Array<{ name: string; url?: string }>;
    internal?: Array<{ name: string; type: string }>;
  };
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
}

export interface InsightFactor {
  title: string;  // Display name of the factor
  detail: string; // Description of the factor's impact
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low' | 'positive' | 'negative' | 'neutral';
}

export interface InsightAction {
  label: string;
  action: string;
  icon: 'profile' | 'alert' | 'watchlist' | 'compare' | 'export' | 'escalate' | 'monitor';
}

// ============================================
// FACTOR DESCRIPTIONS BY RISK LEVEL
// ============================================

const FACTOR_DESCRIPTIONS: Record<string, Record<string, string>> = {
  financial: {
    high: 'Recent credit rating downgrade detected, increased default probability',
    medium: 'Some financial pressure observed, monitoring recommended',
    low: 'Stable financial position with strong credit metrics',
  },
  cybersecurity: {
    high: 'Critical security vulnerabilities identified in recent assessment',
    medium: 'Minor security concerns flagged, improvements underway',
    low: 'Strong security posture with recent certifications',
  },
  esg: {
    high: 'ESG compliance issues reported, regulatory risk elevated',
    medium: 'Mixed ESG performance, some improvement initiatives',
    low: 'Strong sustainability practices and certifications',
  },
  delivery: {
    high: 'Significant delivery delays and reliability issues reported',
    medium: 'Occasional delivery inconsistencies noted',
    low: 'Consistent on-time delivery performance',
  },
  quality: {
    high: 'Quality control failures and product recalls reported',
    medium: 'Some quality variations detected in recent batches',
    low: 'Excellent quality track record with certifications',
  },
  diversity: {
    high: 'Diversity metrics below industry standards',
    medium: 'Moderate diversity performance, room for improvement',
    low: 'Strong diversity and inclusion practices',
  },
  scalability: {
    high: 'Limited capacity to scale operations if needed',
    medium: 'Moderate scalability with some constraints',
    low: 'Strong operational flexibility and growth capacity',
  },
  freight: {
    high: 'Logistics disruptions and freight cost increases',
    medium: 'Some shipping delays in certain regions',
    low: 'Efficient logistics network with reliable shipping',
  },
};

// ============================================
// ACTION CONFIGURATIONS BY RISK LEVEL
// ============================================

const getActionsForRiskLevel = (riskLevel: string, trend: string): InsightAction[] => {
  const baseActions: InsightAction[] = [
    { label: 'View Full Profile', action: 'view_profile', icon: 'profile' },
  ];

  if (riskLevel === 'high' || riskLevel === 'medium-high') {
    return [
      ...baseActions,
      { label: 'Escalate to Procurement', action: 'escalate', icon: 'escalate' },
      { label: 'Find Alternatives', action: 'find_alternatives', icon: 'compare' },
      { label: 'Set Alert', action: 'set_alert', icon: 'alert' },
    ];
  }

  if (trend === 'worsening') {
    return [
      ...baseActions,
      { label: 'Set Alert', action: 'set_alert', icon: 'alert' },
      { label: 'Add to Watchlist', action: 'add_watchlist', icon: 'watchlist' },
    ];
  }

  if (trend === 'improving') {
    return [
      ...baseActions,
      { label: 'Export Report', action: 'export', icon: 'export' },
      { label: 'Continue Monitoring', action: 'monitor', icon: 'monitor' },
    ];
  }

  return [
    ...baseActions,
    { label: 'Add to Watchlist', action: 'add_watchlist', icon: 'watchlist' },
    { label: 'Export Report', action: 'export', icon: 'export' },
  ];
};

// ============================================
// BUILD FACTORS FROM SUPPLIER DATA
// ============================================

const buildFactorsFromSupplier = (supplier: Supplier): InsightFactor[] => {
  const factors: InsightFactor[] = [];
  const riskFactors = supplier.srs.factors || [];

  // Get top 3 most impactful factors (non-restricted only)
  const displayableFactors = riskFactors
    .filter(f => f.tier !== 'restricted' && f.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  displayableFactors.forEach(factor => {
    const score = factor.score || 50;
    const riskCategory = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    const descriptions = FACTOR_DESCRIPTIONS[factor.id] || FACTOR_DESCRIPTIONS['quality'];

    // Map risk category to impact sentiment
    const impactSentiment = riskCategory === 'high' ? 'negative' : riskCategory === 'low' ? 'positive' : 'neutral';

    factors.push({
      title: factor.name.replace(' Score', ''),
      detail: descriptions[riskCategory] || descriptions['medium'],
      trend: supplier.srs.trend === 'worsening' ? 'down' : supplier.srs.trend === 'improving' ? 'up' : 'stable',
      impact: impactSentiment as 'positive' | 'negative' | 'neutral',
    });
  });

  // If we have fewer than 3 factors, add generic ones based on overall trend
  if (factors.length < 3) {
    const genericFactors: InsightFactor[] = [
      {
        title: 'Market Position',
        detail: 'Competitive landscape remains stable',
        trend: 'stable',
        impact: 'neutral',
      },
      {
        title: 'Operational Stability',
        detail: supplier.srs.trend === 'worsening'
          ? 'Recent operational challenges reported'
          : 'Operations running within normal parameters',
        trend: supplier.srs.trend === 'worsening' ? 'down' : 'stable',
        impact: supplier.srs.trend === 'worsening' ? 'negative' : 'neutral',
      },
    ];

    while (factors.length < 3 && genericFactors.length > 0) {
      factors.push(genericFactors.shift()!);
    }
  }

  return factors;
};

// ============================================
// BUILD INSIGHT FROM SUPPLIER
// ============================================

export const buildInsightFromSupplier = (
  supplier: Supplier,
  headline: string,
  sources?: {
    web?: Array<{ name: string; url?: string }>;
    internal?: Array<{ name: string; type: string }>;
  }
): InsightDetailData => {
  const { srs, name, category } = supplier;

  // Determine sentiment and type based on risk level and trend
  const isHighRisk = srs.level === 'high' || srs.level === 'medium-high';
  const isWorsening = srs.trend === 'worsening';
  const isImproving = srs.trend === 'improving';

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let type: InsightDetailData['type'] = 'info';

  if (isHighRisk || isWorsening) {
    sentiment = 'negative';
    type = isHighRisk ? 'risk_alert' : 'action_required';
  } else if (isImproving) {
    sentiment = 'positive';
    type = 'opportunity';
  }

  // Calculate metric change
  const previousScore = srs.previousScore || srs.score;
  const scoreChange = srs.score - previousScore;
  const changePercent = previousScore > 0 ? Math.round((scoreChange / previousScore) * 100) : 0;

  // Build summary based on context
  const summaryParts: string[] = [];
  if (isHighRisk) {
    summaryParts.push(`${name} is currently classified as ${srs.level} risk with a score of ${srs.score}.`);
  }
  if (isWorsening && scoreChange > 0) {
    summaryParts.push(`The risk score increased by ${scoreChange} points (+${changePercent}%) since the last assessment.`);
  } else if (isImproving && scoreChange < 0) {
    summaryParts.push(`The risk score improved by ${Math.abs(scoreChange)} points (${changePercent}%) since the last assessment.`);
  }
  summaryParts.push('Click "View Full Profile" for detailed analysis and recommended actions.');

  return {
    headline,
    subheadline: `${name} - ${category} - Risk Assessment`,
    summary: summaryParts.join(' '),
    type,
    sentiment,
    trend: isWorsening ? 'up' : isImproving ? 'down' : 'stable',
    entity: {
      name,
      type: 'supplier',
    },
    metric: {
      label: 'Risk Score',
      previousValue: previousScore,
      currentValue: srs.score,
      unit: 'points',
      trend: isWorsening ? 'up' : isImproving ? 'down' : 'stable',
    },
    factors: buildFactorsFromSupplier(supplier),
    trendData: srs.scoreHistory || generateFallbackTrendData(srs.score, srs.trend),
    actions: getActionsForRiskLevel(srs.level, srs.trend),
    sources: sources || {
      internal: [
        { name: 'Beroe Risk Intelligence', type: 'risk' },
        { name: 'Supplier Performance Data', type: 'performance' },
        { name: 'Industry Benchmarks', type: 'benchmark' },
      ],
    },
    confidence: srs.factors.length >= 3 ? 'high' : srs.factors.length >= 1 ? 'medium' : 'low',
    generatedAt: new Date().toISOString(),
  };
};

// ============================================
// BUILD INSIGHT FROM PORTFOLIO
// ============================================

export const buildInsightFromPortfolio = (
  headline: string,
  metric: { label: string; value: number; previousValue?: number; unit?: string },
  context: {
    totalSuppliers: number;
    highRiskCount: number;
    unratedCount: number;
  },
  sources?: InsightDetailData['sources']
): InsightDetailData => {
  const isHighRiskHeavy = context.highRiskCount >= context.totalSuppliers * 0.2;
  const isLowVisibility = context.unratedCount >= context.totalSuppliers * 0.4;

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let type: InsightDetailData['type'] = 'info';

  if (isHighRiskHeavy || isLowVisibility) {
    sentiment = 'negative';
    type = isHighRiskHeavy ? 'risk_alert' : 'action_required';
  }

  const change = metric.previousValue ? metric.value - metric.previousValue : 0;

  return {
    headline,
    subheadline: `Portfolio Overview - ${context.totalSuppliers} Suppliers`,
    summary: isLowVisibility
      ? `${Math.round((context.unratedCount / context.totalSuppliers) * 100)}% of your suppliers lack risk assessments, limiting visibility into potential risks. Consider requesting ratings for unrated suppliers.`
      : `Your portfolio has ${context.highRiskCount} high-risk suppliers requiring attention. Review recommended actions below.`,
    type,
    sentiment,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    entity: {
      name: 'Supplier Portfolio',
      type: 'portfolio',
    },
    metric: {
      label: metric.label,
      previousValue: metric.previousValue || metric.value,
      currentValue: metric.value,
      unit: metric.unit || '%',
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    },
    factors: [
      {
        title: 'High Risk Concentration',
        detail: `${context.highRiskCount} of ${context.totalSuppliers} suppliers classified as high risk`,
        trend: isHighRiskHeavy ? 'down' : 'stable',
        impact: isHighRiskHeavy ? 'negative' : 'neutral',
      },
      {
        title: 'Risk Visibility',
        detail: `${context.unratedCount} suppliers without risk assessments`,
        trend: isLowVisibility ? 'down' : 'stable',
        impact: isLowVisibility ? 'negative' : 'positive',
      },
      {
        title: 'Portfolio Health',
        detail: 'Overall portfolio risk within acceptable thresholds',
        trend: 'stable',
        impact: 'neutral',
      },
    ],
    trendData: generateFallbackTrendData(metric.value, 'stable'),
    actions: [
      { label: 'View All Suppliers', action: 'view_all', icon: 'profile' },
      { label: 'Request Ratings', action: 'request_ratings', icon: 'alert' },
      { label: 'Export Report', action: 'export', icon: 'export' },
    ],
    sources: sources || {
      internal: [
        { name: 'Beroe Risk Intelligence', type: 'risk' },
        { name: 'Portfolio Analytics', type: 'analytics' },
      ],
    },
    confidence: 'high',
    generatedAt: new Date().toISOString(),
  };
};

// ============================================
// HELPER: Generate fallback trend data
// ============================================

const generateFallbackTrendData = (currentValue: number, trend: string): number[] => {
  const data: number[] = [];
  let value = currentValue;

  for (let i = 8; i >= 0; i--) {
    if (i === 8) {
      data.push(currentValue);
    } else {
      const variance = Math.floor(Math.random() * 5) + 2;
      if (trend === 'worsening') {
        value = Math.max(20, value - variance);
      } else if (trend === 'improving') {
        value = Math.min(95, value + variance);
      } else {
        value = value + (Math.random() > 0.5 ? variance : -variance);
        value = Math.max(20, Math.min(95, value));
      }
      data.unshift(value);
    }
  }

  return data;
};

// ============================================
// HELPER: Find supplier by name in response
// ============================================

export const findSupplierFromContext = (
  entityName: string | null,
  suppliers?: Supplier[]
): Supplier | undefined => {
  if (!entityName || !suppliers) return undefined;

  const normalized = entityName.toLowerCase();
  return suppliers.find(s =>
    s.name.toLowerCase().includes(normalized) ||
    normalized.includes(s.name.toLowerCase())
  );
};
