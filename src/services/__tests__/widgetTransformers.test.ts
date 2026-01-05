import { describe, it, expect } from 'vitest';
import {
  transformSupplierToRiskCardData,
  transformSuppliersToTableData,
  transformSuppliersToComparisonData,
  transformRiskChangesToAlertData,
  transformPortfolioToDistributionData,
  extractEventsArray,
  mapRiskLevelToMarketContext,
} from '../widgetTransformers';
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
      { id: 'delivery', name: 'Delivery Score', tier: 'conditionally-displayable', weight: 0.2, rating: 'Low' },
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
    factors: [
      { id: 'delivery', name: 'Delivery Score', tier: 'conditionally-displayable', weight: 0.2, rating: 'Good' },
    ],
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

describe('widgetTransformers', () => {
  describe('transformSupplierToRiskCardData', () => {
    it('maps all required fields correctly', () => {
      const result = transformSupplierToRiskCardData(mockSupplier);

      expect(result.supplierId).toBe('sup-001');
      expect(result.supplierName).toBe('Acme Corp');
      expect(result.riskScore).toBe(72);
      expect(result.riskLevel).toBe('medium-high');
      expect(result.trend).toBe('worsening');
      expect(result.category).toBe('Electronics');
      expect(result.spendFormatted).toBe('$5.0M');
    });

    it('includes location object with city and country', () => {
      const result = transformSupplierToRiskCardData(mockSupplier);

      expect(result.location).toBeDefined();
      expect(result.location.city).toBe('San Francisco');
      expect(result.location.country).toBe('United States');
      expect(result.location.region).toBe('North America');
    });

    it('maps keyFactors with impact ratings', () => {
      const result = transformSupplierToRiskCardData(mockSupplier);

      expect(result.keyFactors).toBeDefined();
      expect(result.keyFactors!.length).toBe(2);
      expect(result.keyFactors![0].name).toBe('ESG Score');
      expect(result.keyFactors![0].impact).toBe('negative'); // High rating = negative
      expect(result.keyFactors![1].impact).toBe('positive'); // Low rating = positive
    });

    it('handles missing optional fields gracefully', () => {
      const minimalSupplier: Supplier = {
        id: 'min-001',
        name: 'Minimal',
        duns: '',
        category: '',
        industry: '',
        location: { city: '', country: '', region: 'North America' },
        spend: 0,
        spendFormatted: '',
        criticality: 'low',
        isFollowed: false,
        srs: {
          score: 0,
          level: 'unrated',
          trend: 'stable',
          lastUpdated: '',
          factors: [],
        },
      };

      const result = transformSupplierToRiskCardData(minimalSupplier);

      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('unrated');
      expect(result.keyFactors).toEqual([]);
    });
  });

  describe('transformSuppliersToTableData', () => {
    it('transforms supplier array to table format', () => {
      const result = transformSuppliersToTableData([mockSupplier, mockLowRiskSupplier]);

      expect(result.totalCount).toBe(2);
      expect(result.suppliers).toHaveLength(2);
    });

    it('includes correct fields for each supplier row', () => {
      const result = transformSuppliersToTableData([mockSupplier]);

      const row = result.suppliers[0];
      expect(row.id).toBe('sup-001');
      expect(row.name).toBe('Acme Corp');
      expect(row.riskScore).toBe(72);
      expect(row.riskLevel).toBe('medium-high');
      expect(row.trend).toBe('worsening');
      expect(row.category).toBe('Electronics');
      expect(row.country).toBe('United States');
      expect(row.spend).toBe('$5.0M');
    });

    it('passes through filters', () => {
      const filters = { riskLevel: 'high', region: 'Europe' };
      const result = transformSuppliersToTableData([mockSupplier], filters);

      expect(result.filters).toEqual(filters);
    });
  });

  describe('transformSuppliersToComparisonData', () => {
    it('uses comparisonDimensions not dimensions', () => {
      const result = transformSuppliersToComparisonData([mockSupplier, mockLowRiskSupplier]);

      expect(result.comparisonDimensions).toBeDefined();
      expect(result.comparisonDimensions).toContain('riskScore');
      expect((result as unknown as { dimensions?: string[] }).dimensions).toBeUndefined();
    });

    it('includes strengths and weaknesses arrays', () => {
      const result = transformSuppliersToComparisonData([mockSupplier, mockLowRiskSupplier]);

      expect(result.suppliers[0].strengths).toBeDefined();
      expect(result.suppliers[0].weaknesses).toBeDefined();
      expect(Array.isArray(result.suppliers[0].strengths)).toBe(true);
      expect(Array.isArray(result.suppliers[0].weaknesses)).toBe(true);
    });

    it('generates recommendation for lowest risk supplier', () => {
      const result = transformSuppliersToComparisonData([mockSupplier, mockLowRiskSupplier]);

      expect(result.recommendation).toBeDefined();
      expect(result.recommendation).toContain('Safe Supply Co');
    });

    it('limits to 4 suppliers maximum', () => {
      const suppliers = Array(10).fill(null).map((_, i) => ({
        ...mockSupplier,
        id: `sup-${i}`,
      }));

      const result = transformSuppliersToComparisonData(suppliers);

      expect(result.suppliers).toHaveLength(4);
    });
  });

  describe('transformRiskChangesToAlertData', () => {
    it('calculates severity correctly for worsened changes', () => {
      const result = transformRiskChangesToAlertData([mockRiskChange]);

      expect(result.alertType).toBe('risk_increase');
      expect(result.severity).toBe('warning');
      expect(result.actionRequired).toBe(true);
    });

    it('calculates critical severity for large changes', () => {
      const criticalChange: RiskChange = {
        ...mockRiskChange,
        previousScore: 50,
        currentScore: 75, // +25 points
      };

      const result = transformRiskChangesToAlertData([criticalChange]);

      expect(result.severity).toBe('critical');
    });

    it('maps alertType based on direction', () => {
      const improvedChange: RiskChange = {
        ...mockRiskChange,
        direction: 'improved',
        previousScore: 72,
        currentScore: 65,
      };

      const result = transformRiskChangesToAlertData([improvedChange]);

      expect(result.alertType).toBe('risk_decrease');
      expect(result.actionRequired).toBe(false);
    });

    it('formats affectedSuppliers correctly', () => {
      const result = transformRiskChangesToAlertData([mockRiskChange]);

      expect(result.affectedSuppliers).toHaveLength(1);
      expect(result.affectedSuppliers[0].name).toBe('Acme Corp');
      expect(result.affectedSuppliers[0].previousScore).toBe(65);
      expect(result.affectedSuppliers[0].currentScore).toBe(72);
      expect(result.affectedSuppliers[0].change).toBe('+7');
    });
  });

  describe('transformPortfolioToDistributionData', () => {
    it('transforms distribution with count objects', () => {
      const result = transformPortfolioToDistributionData(mockPortfolio);

      expect(result.distribution.high.count).toBe(10);
      expect(result.distribution.mediumHigh.count).toBe(15);
      expect(result.distribution.medium.count).toBe(30);
      expect(result.distribution.low.count).toBe(35);
      expect(result.distribution.unrated.count).toBe(10);
    });

    it('calculates percentages correctly', () => {
      const result = transformPortfolioToDistributionData(mockPortfolio);

      expect(result.distribution.high.percent).toBe(10); // 10/100 = 10%
      expect(result.distribution.low.percent).toBe(35); // 35/100 = 35%
    });

    it('includes totalSuppliers and totalSpendFormatted', () => {
      const result = transformPortfolioToDistributionData(mockPortfolio);

      expect(result.totalSuppliers).toBe(100);
      expect(result.totalSpendFormatted).toBe('$50.0M');
    });
  });

  describe('extractEventsArray', () => {
    const mockEvents = [
      { id: '1', type: 'news' as const, title: 'Event 1', timestamp: '2024-01-01' },
      { id: '2', type: 'alert' as const, title: 'Event 2', timestamp: '2024-01-02' },
    ];

    it('returns array as-is when given an array', () => {
      const result = extractEventsArray(mockEvents);

      expect(result).toEqual(mockEvents);
    });

    it('extracts events from EventsFeedData object', () => {
      const eventsFeedData = { events: mockEvents };
      const result = extractEventsArray(eventsFeedData);

      expect(result).toEqual(mockEvents);
    });

    it('handles double-wrapped events (prevents double-wrapping bug)', () => {
      // This is the bug scenario: { events: { events: [...] } }
      const doubleWrapped = { events: { events: mockEvents } };
      const result = extractEventsArray(doubleWrapped);

      expect(result).toEqual(mockEvents);
    });

    it('returns empty array for invalid input', () => {
      const result = extractEventsArray(null as unknown as []);

      expect(result).toEqual([]);
    });
  });

  describe('mapRiskLevelToMarketContext', () => {
    it('maps high to elevated', () => {
      expect(mapRiskLevelToMarketContext('high')).toBe('elevated');
    });

    it('maps medium-high to elevated', () => {
      expect(mapRiskLevelToMarketContext('medium-high')).toBe('elevated');
    });

    it('maps medium to moderate (not medium)', () => {
      expect(mapRiskLevelToMarketContext('medium')).toBe('moderate');
    });

    it('maps low to low', () => {
      expect(mapRiskLevelToMarketContext('low')).toBe('low');
    });

    it('maps unrated to low', () => {
      expect(mapRiskLevelToMarketContext('unrated')).toBe('low');
    });
  });
});
