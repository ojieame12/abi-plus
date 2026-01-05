import { describe, it, expect } from 'vitest';
import { selectComponent, buildDataContext } from '../componentSelector';
import type { Supplier, RiskChange } from '../../types/supplier';
import type { Portfolio } from '../../types/data';

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

describe('componentSelector', () => {
  describe('selectComponent', () => {
    it('returns correct config for portfolio_overview', () => {
      const ctx = buildDataContext('portfolio_overview', {
        portfolio: mockPortfolio,
      });

      const config = selectComponent(ctx, 'chat');

      expect(config).toBeDefined();
      expect(config?.componentType).toBeDefined();
      // Should select a portfolio-related component
      expect(['RiskDistributionWidget', 'SpendExposureWidget', 'HealthScorecardWidget', 'PortfolioOverviewCard'])
        .toContain(config?.componentType);
    });

    it('returns correct config for supplier_deep_dive', () => {
      const ctx = buildDataContext('supplier_deep_dive', {
        supplier: mockSupplier,
      });

      const config = selectComponent(ctx, 'chat');

      expect(config).toBeDefined();
      expect(config?.componentType).toBe('SupplierRiskCardWidget');
      // Verify transformed data has required fields
      expect(config?.props?.data).toBeDefined();
      expect(config?.props?.data?.supplierName).toBe('Acme Corp');
      expect(config?.props?.data?.category).toBe('Electronics');
      expect(config?.props?.data?.location?.city).toBe('San Francisco');
      expect(config?.props?.data?.spendFormatted).toBe('$5.0M');
    });

    it('returns correct config for comparison with multiple suppliers', () => {
      const ctx = buildDataContext('comparison', {
        suppliers: [mockSupplier, mockLowRiskSupplier],
      });

      const config = selectComponent(ctx, 'chat');

      expect(config).toBeDefined();
      expect(config?.componentType).toBe('ComparisonTableWidget');
      // Verify uses comparisonDimensions not dimensions
      expect(config?.props?.data?.comparisonDimensions).toBeDefined();
      expect(Array.isArray(config?.props?.data?.comparisonDimensions)).toBe(true);
      // Verify suppliers have strengths and weaknesses
      expect(config?.props?.data?.suppliers?.[0]?.strengths).toBeDefined();
      expect(config?.props?.data?.suppliers?.[0]?.weaknesses).toBeDefined();
    });

    it('returns correct config for market_context with valid riskLevel', () => {
      const ctx = buildDataContext('market_context', {
        portfolio: mockPortfolio,
      });

      const config = selectComponent(ctx, 'chat');

      expect(config).toBeDefined();
      expect(config?.componentType).toBe('MarketContextCard');
      // Verify riskLevel is one of: 'elevated' | 'moderate' | 'low' (not 'medium')
      expect(['elevated', 'moderate', 'low']).toContain(config?.props?.riskLevel);
      expect(config?.props?.riskLevel).not.toBe('medium');
    });

    it('does not suppress widgets when widget data exists', () => {
      const mockWidgetData = {
        type: 'info_card' as const,
        data: { title: 'Test', content: 'Test content' },
      };

      const ctx = buildDataContext('general', {
        widget: mockWidgetData,
      });

      const config = selectComponent(ctx, 'chat');

      // With widget data present, should NOT return 'none'
      // The widget data should be rendered
      expect(config?.componentType).not.toBe('none');
    });

    it('suppresses widgets for general intent when no widget data', () => {
      const ctx = buildDataContext('general', {
        // No widget data
      });

      const config = selectComponent(ctx, 'chat');

      expect(config?.componentType).toBe('none');
    });

    it('returns trend detection widget when riskChanges available', () => {
      const ctx = buildDataContext('trend_detection', {
        riskChanges: [mockRiskChange],
      });

      const config = selectComponent(ctx, 'chat');

      expect(config).toBeDefined();
      // Should select a trend/alert widget
      expect(['AlertCardWidget', 'TrendChangeIndicator', 'EventsFeedWidget'])
        .toContain(config?.componentType);
    });
  });

  describe('buildDataContext', () => {
    it('includes all provided data', () => {
      const ctx = buildDataContext('portfolio_overview', {
        portfolio: mockPortfolio,
        suppliers: [mockSupplier],
        supplier: mockSupplier,
        riskChanges: [mockRiskChange],
      });

      expect(ctx.intent).toBe('portfolio_overview');
      expect(ctx.portfolio).toBe(mockPortfolio);
      expect(ctx.suppliers).toHaveLength(1);
      expect(ctx.supplier).toBe(mockSupplier);
      expect(ctx.riskChanges).toHaveLength(1);
    });

    it('handles minimal input', () => {
      const ctx = buildDataContext('general', {});

      expect(ctx.intent).toBe('general');
      expect(ctx.portfolio).toBeUndefined();
      expect(ctx.suppliers).toBeUndefined();
    });
  });
});
