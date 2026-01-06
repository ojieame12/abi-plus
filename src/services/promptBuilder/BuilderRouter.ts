// Builder Router - Converts builder selections into deterministic intents
// This replaces probabilistic regex-based classification with explicit mapping

import type { DetectedIntent } from '../../types/intents';
import type { WidgetType, WidgetSize } from '../../types/widgets';
import {
  type BuilderSelection,
  type RouteMapping,
  buildPath,
  buildPrompt,
  getRouteMappingForPath,
} from './BuilderConfig';

// ============================================
// ROUTER RESULT
// ============================================

export interface BuilderRouterResult {
  // The generated natural language prompt
  prompt: string;

  // Deterministic intent (no confidence needed - it's 100%)
  intent: DetectedIntent;

  // Suggested widgets in priority order
  suggestedWidgets: WidgetType[];

  // Widget sizing hint
  defaultWidgetSize: WidgetSize;

  // Flags for additional processing
  requiresResearch: boolean;
  requiresSupplierInput: boolean;

  // Original selection for reference
  selection: BuilderSelection;

  // Debug info
  routePath: string;
}

// ============================================
// MAIN ROUTER FUNCTION
// ============================================

export function routeBuilderSelection(selection: BuilderSelection): BuilderRouterResult | null {
  const path = buildPath(selection);

  if (!path) {
    return null;
  }

  const mapping = getRouteMappingForPath(path);

  if (!mapping) {
    // Fallback for unmapped paths
    return createFallbackResult(selection, path);
  }

  const prompt = buildPrompt(selection);

  return {
    prompt,
    intent: createDetectedIntent(mapping, selection),
    suggestedWidgets: mapping.widgets,
    defaultWidgetSize: determineWidgetSize(mapping),
    requiresResearch: mapping.requiresResearch || false,
    requiresSupplierInput: mapping.requiresSupplierInput || false,
    selection,
    routePath: path,
  };
}

// ============================================
// INTENT CREATION
// ============================================

function createDetectedIntent(
  mapping: RouteMapping,
  selection: BuilderSelection
): DetectedIntent {
  return {
    category: mapping.intent,
    subIntent: mapping.subIntent,
    confidence: 1.0, // Deterministic - no guessing
    responseType: determineResponseType(mapping),
    artifactType: determineArtifactType(mapping),
    extractedEntities: extractEntitiesFromSelection(selection),
    requiresHandoff: false,
    requiresResearch: mapping.requiresResearch || false,
    researchContext: mapping.requiresResearch ? mapping.promptTemplate : undefined,
    requiresDiscovery: mapping.intent === 'action_trigger' &&
                       mapping.subIntent === 'find_alternatives',
  };
}

function determineResponseType(mapping: RouteMapping): DetectedIntent['responseType'] {
  // Map primary widget to response type
  const primaryWidget = mapping.widgets[0];

  switch (primaryWidget) {
    case 'supplier_table':
    case 'comparison_table':
      return 'table';
    case 'alert_card':
    case 'events_feed':
      return 'alert';
    case 'handoff_card':
      return 'handoff';
    case 'info_card':
    case 'recommendation_card':
    case 'executive_summary':
      return 'summary';
    default:
      return 'widget';
  }
}

function determineArtifactType(mapping: RouteMapping): DetectedIntent['artifactType'] {
  const primaryWidget = mapping.widgets[0];

  switch (primaryWidget) {
    case 'supplier_table':
      return 'supplier_table';
    case 'supplier_risk_card':
    case 'score_breakdown':
    case 'factor_breakdown':
      return 'supplier_detail';
    case 'comparison_table':
      return 'comparison';
    case 'risk_distribution':
    case 'portfolio_summary':
    case 'health_scorecard':
      return 'portfolio_dashboard';
    default:
      return 'none';
  }
}

function extractEntitiesFromSelection(
  selection: BuilderSelection
): DetectedIntent['extractedEntities'] {
  const entities: DetectedIntent['extractedEntities'] = {};

  // Extract from modifiers
  if (selection.modifiers.supplier_name) {
    entities.supplierName = selection.modifiers.supplier_name;
  }

  if (selection.modifiers.risk_level) {
    entities.riskLevel = selection.modifiers.risk_level;
  }

  if (selection.modifiers.region) {
    entities.region = formatRegion(selection.modifiers.region);
  }

  if (selection.modifiers.category) {
    entities.category = formatCategory(selection.modifiers.category);
  }

  if (selection.modifiers.timeframe) {
    entities.timeframe = formatTimeframe(selection.modifiers.timeframe);
  }

  // Extract action from selection
  if (selection.action) {
    entities.action = selection.action;
  }

  return entities;
}

// ============================================
// WIDGET SIZE DETERMINATION
// ============================================

function determineWidgetSize(mapping: RouteMapping): WidgetSize {
  const primaryWidget = mapping.widgets[0];

  // Widgets that work best at medium size
  const mediumWidgets: WidgetType[] = [
    'supplier_risk_card',
    'alert_card',
    'action_card',
    'recommendation_card',
    'news_item',
    'stat_card',
  ];

  // Widgets that should expand to large
  const largeWidgets: WidgetType[] = [
    'supplier_table',
    'comparison_table',
    'trend_chart',
    'risk_distribution',
    'executive_summary',
    'events_feed',
  ];

  if (largeWidgets.includes(primaryWidget)) return 'L';
  if (mediumWidgets.includes(primaryWidget)) return 'M';

  return 'M'; // Default
}

// ============================================
// FALLBACK HANDLING
// ============================================

function createFallbackResult(
  selection: BuilderSelection,
  path: string
): BuilderRouterResult {
  // Create a generic response for unmapped paths
  const prompt = generateFallbackPrompt(selection);

  return {
    prompt,
    intent: {
      category: 'general',
      subIntent: 'none',
      confidence: 0.7,
      responseType: 'summary',
      artifactType: 'none',
      extractedEntities: extractEntitiesFromSelection(selection),
      requiresHandoff: false,
      requiresResearch: false,
      requiresDiscovery: false,
    },
    suggestedWidgets: ['info_card'],
    defaultWidgetSize: 'M',
    requiresResearch: false,
    requiresSupplierInput: false,
    selection,
    routePath: path,
  };
}

function generateFallbackPrompt(selection: BuilderSelection): string {
  const parts: string[] = [];

  if (selection.action) parts.push(selection.action);
  if (selection.subject) parts.push(selection.subject);
  if (selection.domain) parts.push(selection.domain);

  Object.entries(selection.modifiers).forEach(([key, value]) => {
    if (value) parts.push(`${key}: ${value}`);
  });

  return parts.join(' ') || 'Help me with my query';
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatRegion(regionId: string): string {
  const regionMap: Record<string, string> = {
    north_america: 'North America',
    europe: 'Europe',
    asia_pacific: 'Asia Pacific',
    latin_america: 'Latin America',
  };
  return regionMap[regionId] || regionId;
}

function formatCategory(categoryId: string): string {
  const categoryMap: Record<string, string> = {
    electronics: 'Electronics',
    raw_materials: 'Raw Materials',
    logistics: 'Logistics',
    packaging: 'Packaging',
    services: 'Services',
  };
  return categoryMap[categoryId] || categoryId;
}

function formatTimeframe(timeframeId: string): string {
  const timeframeMap: Record<string, string> = {
    '7d': 'the last 7 days',
    '30d': 'the last 30 days',
    '90d': 'the last 90 days',
  };
  return timeframeMap[timeframeId] || timeframeId;
}

// ============================================
// VALIDATION
// ============================================

export function isSelectionComplete(selection: BuilderSelection): boolean {
  return !!(selection.domain && selection.subject && selection.action);
}

export function isSelectionValid(selection: BuilderSelection): boolean {
  if (!isSelectionComplete(selection)) return false;

  const path = buildPath(selection);
  const mapping = getRouteMappingForPath(path);

  if (!mapping) return false;

  // Check if required inputs are provided
  if (mapping.requiresSupplierInput && !selection.modifiers.supplier_name) {
    return false;
  }

  return true;
}

export function getMissingRequirements(selection: BuilderSelection): string[] {
  const missing: string[] = [];

  if (!selection.domain) missing.push('domain');
  if (!selection.subject) missing.push('subject');
  if (!selection.action) missing.push('action');

  if (isSelectionComplete(selection)) {
    const path = buildPath(selection);
    const mapping = getRouteMappingForPath(path);

    if (mapping?.requiresSupplierInput && !selection.modifiers.supplier_name) {
      missing.push('supplier_name');
    }
  }

  return missing;
}
