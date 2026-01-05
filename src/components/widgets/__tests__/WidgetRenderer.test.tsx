import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WidgetRenderer } from '../WidgetRenderer';
import type { Supplier, RiskChange } from '../../../types/supplier';
import type { Portfolio } from '../../../types/data';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock data
const mockSupplier: Supplier = {
  id: 'sup-001',
  name: 'Acme Corp',
  duns: '123456789',
  category: 'Electronics',
  industry: 'Manufacturing',
  location: {
    city: 'San Francisco',
    country: 'United States',
    region: 'North America',
  },
  spend: 5000000,
  spendFormatted: '$5.0M',
  criticality: 'high',
  isFollowed: true,
  srs: {
    score: 72,
    previousScore: 65,
    level: 'medium-high',
    trend: 'worsening',
    lastUpdated: '2024-01-15T00:00:00Z',
    factors: [
      { id: 'esg', name: 'ESG Score', tier: 'conditionally-displayable', weight: 0.3, rating: 'High' },
    ],
  },
};

const mockLowRiskSupplier: Supplier = {
  ...mockSupplier,
  id: 'sup-002',
  name: 'Safe Supply Co',
  srs: {
    ...mockSupplier.srs,
    score: 25,
    level: 'low',
    trend: 'improving',
  },
};

const mockRiskChange: RiskChange = {
  supplierId: 'sup-001',
  supplierName: 'Acme Corp',
  previousScore: 65,
  previousLevel: 'medium',
  currentScore: 72,
  currentLevel: 'medium-high',
  changeDate: '2024-01-15T00:00:00Z',
  direction: 'worsened',
};

const mockPortfolio: Portfolio = {
  totalSuppliers: 100,
  totalSpend: 50000000,
  spendFormatted: '$50.0M',
  avgRiskScore: 45,
  distribution: {
    high: 10,
    mediumHigh: 15,
    medium: 30,
    low: 35,
    unrated: 10,
  },
};

describe('WidgetRenderer', () => {
  describe('Context-based rendering', () => {
    it('renders RiskDistributionWidget for portfolio_overview intent', () => {
      render(
        <WidgetRenderer
          intent="portfolio_overview"
          renderContext="chat"
          portfolio={mockPortfolio}
        />
      );

      // Should render distribution widget with data
      expect(screen.getByText('Portfolio Risk Distribution')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // totalSuppliers
    });

    it('renders SupplierRiskCardWidget for supplier_deep_dive intent', () => {
      render(
        <WidgetRenderer
          intent="supplier_deep_dive"
          renderContext="chat"
          supplier={mockSupplier}
        />
      );

      // Should render supplier card with data
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('renders ComparisonTableWidget for comparison intent with multiple suppliers', () => {
      render(
        <WidgetRenderer
          intent="comparison"
          renderContext="chat"
          suppliers={[mockSupplier, mockLowRiskSupplier]}
        />
      );

      // Should render comparison table
      expect(screen.getByText('Supplier Comparison')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Safe Supply Co')).toBeInTheDocument();
    });

    it('renders AlertCardWidget for trend_detection intent with riskChanges', () => {
      render(
        <WidgetRenderer
          intent="trend_detection"
          renderContext="chat"
          riskChanges={[mockRiskChange]}
        />
      );

      // Should render alert card with risk change data
      expect(screen.getByText(/risk change/i)).toBeInTheDocument();
    });

    it('renders nothing for general intent without widget data', () => {
      const { container } = render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
        />
      );

      // Should render nothing or minimal content
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Direct widget rendering', () => {
    it('renders widget from provided widget data', () => {
      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{
            type: 'risk_distribution',
            data: {
              totalSuppliers: 50,
              totalSpend: 25000000,
              totalSpendFormatted: '$25.0M',
              distribution: {
                high: { count: 5, spend: 0, percent: 10 },
                mediumHigh: { count: 10, spend: 0, percent: 20 },
                medium: { count: 15, spend: 0, percent: 30 },
                low: { count: 15, spend: 0, percent: 30 },
                unrated: { count: 5, spend: 0, percent: 10 },
              },
            },
          }}
        />
      );

      expect(screen.getByText('Portfolio Risk Distribution')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument(); // totalSuppliers from widget data
    });

    it('renders EventsFeedWidget without double-wrapping events', () => {
      const mockEvents = [
        { id: '1', type: 'news' as const, title: 'Supply Chain Update', timestamp: '2024-01-15' },
        { id: '2', type: 'alert' as const, title: 'Risk Alert', timestamp: '2024-01-16' },
      ];

      render(
        <WidgetRenderer
          intent="trend_detection"
          renderContext="chat"
          widget={{
            type: 'events_feed',
            data: { events: mockEvents },
          }}
        />
      );

      // Should render events without double-wrapping
      expect(screen.getByText('Supply Chain Update')).toBeInTheDocument();
      expect(screen.getByText('Risk Alert')).toBeInTheDocument();
    });
  });

  describe('Direct widget data prop wrapping', () => {
    it('renders CategoryBreakdownWidget with data prop wrapper', () => {
      const categoryData = {
        categories: [
          { name: 'Electronics', supplierCount: 25, totalSpend: 5000000, spendFormatted: '$5M', avgRiskScore: 45, riskLevel: 'medium' },
          { name: 'Raw Materials', supplierCount: 15, totalSpend: 3000000, spendFormatted: '$3M', avgRiskScore: 65, riskLevel: 'high' },
        ],
        sortBy: 'spend' as const,
      };

      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{ type: 'category_breakdown', data: categoryData }}
        />
      );

      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Raw Materials')).toBeInTheDocument();
    });

    it('renders RegionListWidget with data prop wrapper', () => {
      const regionData = {
        regions: [
          { name: 'United States', code: 'US', supplierCount: 50, avgRiskScore: 40, flag: '🇺🇸' },
          { name: 'China', code: 'CN', supplierCount: 30, avgRiskScore: 55, flag: '🇨🇳' },
        ],
        totalSuppliers: 80,
      };

      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{ type: 'region_list', data: regionData }}
        />
      );

      expect(screen.getByText('Regions')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('China')).toBeInTheDocument();
    });

    it('renders EventTimelineWidget with data prop wrapper', () => {
      const timelineData = {
        events: [
          { id: '1', date: '2024-01-15', type: 'risk_change' as const, title: 'Risk Score Updated', description: 'Score increased by 5 points' },
          { id: '2', date: '2024-01-10', type: 'news' as const, title: 'Industry News', severity: 'info' as const },
        ],
        timeRange: { start: '2024-01-01', end: '2024-01-31' },
      };

      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{ type: 'event_timeline', data: timelineData }}
        />
      );

      expect(screen.getByText('Recent Events')).toBeInTheDocument();
      expect(screen.getByText('Risk Score Updated')).toBeInTheDocument();
      expect(screen.getByText('Industry News')).toBeInTheDocument();
    });

    it('renders NewsItemCard with data prop wrapper', () => {
      const newsData = {
        title: 'Supply Chain Disruption Alert',
        source: 'Reuters',
        timestamp: '2 hours ago',
        category: 'Supply Chain',
        sentiment: 'negative' as const,
      };

      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{ type: 'news_item', data: newsData }}
        />
      );

      expect(screen.getByText('Supply Chain Disruption Alert')).toBeInTheDocument();
      expect(screen.getByText(/Reuters/)).toBeInTheDocument();
    });

    it('renders SupplierMiniCard with data prop wrapper', () => {
      const miniData = {
        supplierId: 'sup-001',
        supplierName: 'Quick Supplier',
        riskScore: 45,
        riskLevel: 'medium' as const,
        trend: 'stable' as const,
        category: 'Electronics',
      };

      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{ type: 'supplier_mini', data: miniData }}
        />
      );

      expect(screen.getByText('Quick Supplier')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('renders ScoreBreakdownWidget with data prop wrapper', () => {
      const scoreData = {
        totalScore: 72,
        riskLevel: 'medium-high' as const,
        factors: [
          { name: 'Financial Health', score: 65, weight: 0.3, impact: 'negative' as const },
          { name: 'ESG Compliance', score: 80, weight: 0.2, impact: 'positive' as const },
        ],
        lastUpdated: '2 days ago',
      };

      render(
        <WidgetRenderer
          intent="general"
          renderContext="chat"
          widget={{ type: 'score_breakdown', data: scoreData }}
        />
      );

      expect(screen.getByText('Risk Score')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('Financial Health')).toBeInTheDocument();
      expect(screen.getByText('ESG Compliance')).toBeInTheDocument();
    });
  });

  describe('Data shape validation', () => {
    it('supplier card receives all required fields from transformer', () => {
      render(
        <WidgetRenderer
          intent="supplier_deep_dive"
          renderContext="chat"
          supplier={mockSupplier}
        />
      );

      // Verify transformed data includes all required fields
      expect(screen.getByText('Acme Corp')).toBeInTheDocument(); // supplierName
      expect(screen.getByText('Electronics')).toBeInTheDocument(); // category
      // Location should be visible
      expect(screen.getByText(/San Francisco/)).toBeInTheDocument();
      expect(screen.getByText(/United States/)).toBeInTheDocument();
    });

    it('comparison table uses comparisonDimensions not dimensions', () => {
      render(
        <WidgetRenderer
          intent="comparison"
          renderContext="chat"
          suppliers={[mockSupplier, mockLowRiskSupplier]}
        />
      );

      // Both suppliers should be visible
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Safe Supply Co')).toBeInTheDocument();
      // Strengths and weaknesses should be rendered (they come from comparisonDimensions)
      expect(screen.getByText(/Strength/i)).toBeInTheDocument();
    });
  });
});
