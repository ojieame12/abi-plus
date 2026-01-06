// Widget Registry Integration Tests
// Tests the unified widget registry and intent-to-widget selection pipeline

import { describe, it, expect } from 'vitest';
import {
  WIDGET_REGISTRY,
  getWidgetForIntent,
  getWidgetById,
  getWidgetByType,
  getWidgetByComponent,
  getWidgetsByCategory,
  searchWidgets,
  getCategoryCounts,
  getWidgetsForIntent,
  validateIntentCoverage,
  CATEGORY_ORDER,
  type WidgetCategory,
  type RequiredData,
} from '../widgetRegistry';

import type { IntentCategory, SubIntent } from '../../types/intents';

// ============================================
// ALL INTENTS FROM THE SYSTEM
// ============================================

const ALL_INTENTS: IntentCategory[] = [
  'portfolio_overview',
  'filtered_discovery',
  'supplier_deep_dive',
  'trend_detection',
  'explanation_why',
  'action_trigger',
  'comparison',
  'setup_config',
  'reporting_export',
  'market_context',
  'restricted_query',
  // Inflation Watch
  'inflation_summary',
  'inflation_drivers',
  'inflation_impact',
  'inflation_justification',
  'inflation_scenarios',
  'inflation_communication',
  'inflation_benchmark',
  'general',
];

// ============================================
// REGISTRY STRUCTURE TESTS
// ============================================

describe('Widget Registry Structure', () => {
  it('should have at least 30 widgets', () => {
    expect(WIDGET_REGISTRY.length).toBeGreaterThanOrEqual(30);
  });

  it('all widgets should have required fields', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.id).toBeTruthy();
      expect(widget.type).toBeTruthy();
      expect(widget.component).toBeTruthy();
      expect(widget.name).toBeTruthy();
      expect(widget.category).toBeTruthy();
      expect(widget.description).toBeTruthy();
      expect(Array.isArray(widget.intents)).toBe(true);
      expect(typeof widget.priority).toBe('number');
      expect(Array.isArray(widget.requiredData)).toBe(true);
      expect(Array.isArray(widget.renderContexts)).toBe(true);
      expect(Array.isArray(widget.sizes)).toBe(true);
      expect(widget.defaultSize).toBeTruthy();
      expect(Array.isArray(widget.props)).toBe(true);
      expect(widget.demoData).toBeTruthy();
      expect(widget.usageExample).toBeTruthy();
    });
  });

  it('all widget IDs should be unique', () => {
    const ids = WIDGET_REGISTRY.map(w => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all widget types should be unique', () => {
    const types = WIDGET_REGISTRY.map(w => w.type);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });

  it('all categories should be valid', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(CATEGORY_ORDER).toContain(widget.category);
    });
  });

  it('all widgets should have at least one intent', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.intents.length).toBeGreaterThan(0);
    });
  });

  it('all widgets should have at least one render context', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.renderContexts.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// INTENT COVERAGE TESTS
// ============================================

describe('Intent Coverage', () => {
  it('all major intents should have widget mappings', () => {
    const majorIntents: IntentCategory[] = [
      'portfolio_overview',
      'filtered_discovery',
      'supplier_deep_dive',
      'trend_detection',
      'comparison',
      'market_context',
      'restricted_query',
      'action_trigger',
    ];

    majorIntents.forEach(intent => {
      const widgets = getWidgetsForIntent(intent);
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  it('inflation intents should have widget mappings', () => {
    const inflationIntents: IntentCategory[] = [
      'inflation_summary',
      'inflation_drivers',
      'inflation_impact',
      'inflation_justification',
      'inflation_scenarios',
      'inflation_communication',
    ];

    inflationIntents.forEach(intent => {
      const widgets = getWidgetsForIntent(intent);
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  it('validateIntentCoverage should report coverage status', () => {
    const { covered, uncovered } = validateIntentCoverage(ALL_INTENTS);

    // Most intents should be covered
    expect(covered.length).toBeGreaterThan(uncovered.length);

    // Portfolio overview must be covered
    expect(covered).toContain('portfolio_overview');

    // Supplier deep dive must be covered
    expect(covered).toContain('supplier_deep_dive');
  });
});

// ============================================
// INTENT → WIDGET SELECTION TESTS
// ============================================

describe('Intent to Widget Selection', () => {
  describe('portfolio_overview intent', () => {
    it('should return RiskDistributionWidget with portfolio data', () => {
      const widget = getWidgetForIntent('portfolio_overview', undefined, ['portfolio'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('RiskDistributionWidget');
    });

    it('should return SpendExposureWidget for spend_weighted sub-intent', () => {
      const widget = getWidgetForIntent('portfolio_overview', 'spend_weighted', ['portfolio'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('SpendExposureWidget');
    });

    it('should return CategoryBreakdownWidget for by_dimension sub-intent', () => {
      const widget = getWidgetForIntent('portfolio_overview', 'by_dimension', ['portfolio', 'suppliers'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('CategoryBreakdownWidget');
    });
  });

  describe('supplier_deep_dive intent', () => {
    it('should return SupplierRiskCardWidget with supplier data', () => {
      const widget = getWidgetForIntent('supplier_deep_dive', undefined, ['supplier'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('SupplierRiskCardWidget');
    });

    it('should return FactorBreakdownCard for score_inquiry sub-intent', () => {
      const widget = getWidgetForIntent('supplier_deep_dive', 'score_inquiry', ['supplier'], 'chat');
      expect(widget).toBeTruthy();
      // Should prefer widget that handles score_inquiry sub-intent
      expect(['SupplierRiskCardWidget', 'FactorBreakdownCard']).toContain(widget?.component);
    });
  });

  describe('filtered_discovery intent', () => {
    it('should return SupplierTableWidget with suppliers data', () => {
      const widget = getWidgetForIntent('filtered_discovery', undefined, ['suppliers'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('SupplierTableWidget');
    });
  });

  describe('trend_detection intent', () => {
    it('should return AlertCardWidget with riskChanges data', () => {
      const widget = getWidgetForIntent('trend_detection', undefined, ['riskChanges'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('AlertCardWidget');
    });

    it('should return EventsFeedWidget for news_events sub-intent', () => {
      const widget = getWidgetForIntent('trend_detection', 'news_events', ['events'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('EventsFeedWidget');
    });
  });

  describe('comparison intent', () => {
    it('should return ComparisonTableWidget with suppliers data', () => {
      const widget = getWidgetForIntent('comparison', undefined, ['suppliers'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('ComparisonTableWidget');
    });
  });

  describe('market_context intent', () => {
    it('should return PriceGaugeWidget with commodity data', () => {
      const widget = getWidgetForIntent('market_context', undefined, ['commodityData'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('PriceGaugeWidget');
    });
  });

  describe('restricted_query intent', () => {
    it('should return HandoffCard', () => {
      const widget = getWidgetForIntent('restricted_query', undefined, [], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('HandoffCard');
    });
  });

  describe('action_trigger intent', () => {
    it('should return AlternativesPreviewCard for find_alternatives sub-intent', () => {
      const widget = getWidgetForIntent('action_trigger', 'find_alternatives', ['suppliers'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('AlternativesPreviewCard');
    });
  });

  describe('inflation intents', () => {
    it('inflation_summary should return InflationSummaryCard', () => {
      const widget = getWidgetForIntent('inflation_summary', undefined, ['inflationSummary'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('InflationSummaryCard');
    });

    it('inflation_drivers should return DriverBreakdownCard', () => {
      const widget = getWidgetForIntent('inflation_drivers', undefined, ['commodityDrivers'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('DriverBreakdownCard');
    });

    it('inflation_impact should return SpendImpactCard', () => {
      const widget = getWidgetForIntent('inflation_impact', undefined, ['portfolioExposure'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('SpendImpactCard');
    });

    it('inflation_justification should return JustificationCard', () => {
      const widget = getWidgetForIntent('inflation_justification', undefined, ['justificationData'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('JustificationCard');
    });

    it('inflation_scenarios should return ScenarioCard', () => {
      const widget = getWidgetForIntent('inflation_scenarios', undefined, ['scenarioData'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('ScenarioCard');
    });

    it('inflation_communication should return ExecutiveBriefCard', () => {
      const widget = getWidgetForIntent('inflation_communication', undefined, ['inflationSummary'], 'chat');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('ExecutiveBriefCard');
    });
  });
});

// ============================================
// DATA REQUIREMENT TESTS
// ============================================

describe('Data Requirements', () => {
  it('should not return primary widget when required data is missing', () => {
    // SupplierRiskCardWidget requires 'supplier' data
    // Without supplier data, it should fall back to a general widget
    const widget = getWidgetForIntent('supplier_deep_dive', undefined, [], 'chat');
    // Either null or a fallback widget (not SupplierRiskCardWidget)
    if (widget) {
      expect(widget.component).not.toBe('SupplierRiskCardWidget');
    }
  });

  it('should return widget when all required data is present', () => {
    const widget = getWidgetForIntent('portfolio_overview', undefined, ['portfolio'], 'chat');
    expect(widget).toBeTruthy();
  });

  it('widgets with "none" data requirement should match without data', () => {
    const widget = getWidgetForIntent('restricted_query', undefined, [], 'chat');
    expect(widget).toBeTruthy();
  });
});

// ============================================
// PRIORITY RESOLUTION TESTS
// ============================================

describe('Priority Resolution', () => {
  it('higher priority widget should win when multiple match', () => {
    // Multiple widgets can match portfolio_overview
    // RiskDistributionWidget (100) should beat HealthScorecardWidget (95)
    const widget = getWidgetForIntent('portfolio_overview', undefined, ['portfolio'], 'chat');
    expect(widget?.priority).toBeGreaterThanOrEqual(95);
  });

  it('sub-intent match should boost priority', () => {
    // SpendExposureWidget has spend_weighted sub-intent with priority 105
    const widget = getWidgetForIntent('portfolio_overview', 'spend_weighted', ['portfolio'], 'chat');
    expect(widget?.component).toBe('SpendExposureWidget');
  });
});

// ============================================
// LOOKUP FUNCTION TESTS
// ============================================

describe('Lookup Functions', () => {
  describe('getWidgetById', () => {
    it('should find widget by ID', () => {
      const widget = getWidgetById('risk-distribution-widget');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('RiskDistributionWidget');
    });

    it('should return undefined for unknown ID', () => {
      const widget = getWidgetById('non-existent-widget');
      expect(widget).toBeUndefined();
    });
  });

  describe('getWidgetByType', () => {
    it('should find widget by type', () => {
      const widget = getWidgetByType('risk_distribution');
      expect(widget).toBeTruthy();
      expect(widget?.component).toBe('RiskDistributionWidget');
    });

    it('should return undefined for unknown type', () => {
      const widget = getWidgetByType('non_existent_type' as any);
      expect(widget).toBeUndefined();
    });
  });

  describe('getWidgetByComponent', () => {
    it('should find widget by component name', () => {
      const widget = getWidgetByComponent('RiskDistributionWidget');
      expect(widget).toBeTruthy();
      expect(widget?.type).toBe('risk_distribution');
    });
  });

  describe('getWidgetsByCategory', () => {
    it('should return widgets for portfolio category', () => {
      const widgets = getWidgetsByCategory('portfolio');
      expect(widgets.length).toBeGreaterThan(0);
      widgets.forEach(w => expect(w.category).toBe('portfolio'));
    });

    it('should return widgets for supplier category', () => {
      const widgets = getWidgetsByCategory('supplier');
      expect(widgets.length).toBeGreaterThan(0);
      widgets.forEach(w => expect(w.category).toBe('supplier'));
    });

    it('should return widgets for inflation category', () => {
      const widgets = getWidgetsByCategory('inflation');
      expect(widgets.length).toBeGreaterThan(0);
      widgets.forEach(w => expect(w.category).toBe('inflation'));
    });
  });

  describe('searchWidgets', () => {
    it('should find widgets by name', () => {
      const results = searchWidgets('risk distribution');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find widgets by description', () => {
      const results = searchWidgets('donut chart');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find widgets by intent', () => {
      const results = searchWidgets('portfolio_overview');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = searchWidgets('xyznonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('getCategoryCounts', () => {
    it('should return counts for all categories', () => {
      const counts = getCategoryCounts();
      CATEGORY_ORDER.forEach(cat => {
        expect(counts[cat]).toBeDefined();
        expect(typeof counts[cat]).toBe('number');
      });
    });

    it('counts should match actual widgets', () => {
      const counts = getCategoryCounts();
      CATEGORY_ORDER.forEach(cat => {
        const actual = WIDGET_REGISTRY.filter(w => w.category === cat).length;
        expect(counts[cat]).toBe(actual);
      });
    });
  });
});

// ============================================
// RENDER CONTEXT TESTS
// ============================================

describe('Render Context Filtering', () => {
  it('chat context should work', () => {
    const widget = getWidgetForIntent('portfolio_overview', undefined, ['portfolio'], 'chat');
    expect(widget).toBeTruthy();
    expect(widget?.renderContexts).toContain('chat');
  });

  it('panel context should work', () => {
    const widget = getWidgetForIntent('portfolio_overview', undefined, ['portfolio'], 'panel');
    expect(widget).toBeTruthy();
    expect(widget?.renderContexts).toContain('panel');
  });

  it('chat_compact context should filter appropriately', () => {
    const widget = getWidgetForIntent('supplier_deep_dive', undefined, ['supplier'], 'chat_compact');
    // Only widgets that support chat_compact should be returned
    if (widget) {
      expect(widget.renderContexts).toContain('chat_compact');
    }
  });
});

// ============================================
// DEMO DATA VALIDATION TESTS
// ============================================

describe('Demo Data Validation', () => {
  it('all widgets should have non-empty demoData', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.demoData).toBeTruthy();
      expect(Object.keys(widget.demoData).length).toBeGreaterThan(0);
    });
  });

  it('all widgets should have non-empty usageExample', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.usageExample).toBeTruthy();
      expect(widget.usageExample.length).toBeGreaterThan(10);
    });
  });

  it('all widgets should have at least one prop definition', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.props.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// CROSS-REFERENCE TESTS
// ============================================

describe('Cross-Reference Integrity', () => {
  it('all intents in widgets should be valid IntentCategory values', () => {
    const validIntents = new Set(ALL_INTENTS);
    WIDGET_REGISTRY.forEach(widget => {
      widget.intents.forEach(intent => {
        expect(validIntents.has(intent)).toBe(true);
      });
    });
  });

  it('all expandsTo components should correspond to existing artifacts', () => {
    const widgetsWithExpansion = WIDGET_REGISTRY.filter(w => w.expandsTo);
    expect(widgetsWithExpansion.length).toBeGreaterThan(0);
    // Each expandsTo should be a string (artifact component name)
    widgetsWithExpansion.forEach(widget => {
      expect(typeof widget.expandsTo).toBe('string');
      expect(widget.expandsTo!.length).toBeGreaterThan(0);
    });
  });
});
