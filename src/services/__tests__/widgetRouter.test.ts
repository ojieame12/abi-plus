// Widget Router Tests
// Verifies registry-based routing behavior for subIntent handling

import { describe, it, expect } from 'vitest';
import { getWidgetRouteFromRegistry } from '../widgetRouter';

describe('getWidgetRouteFromRegistry', () => {
  it('selects highest priority widget when subIntent is none', () => {
    const route = getWidgetRouteFromRegistry('filtered_discovery', 'none');
    expect(route.widgetType).toBe('supplier_table');
    expect(route.artifactType).toBe('supplier_table');
    expect(route.requiresSuppliers).toBe(true);
  });

  it('selects highest priority widget when subIntent is undefined', () => {
    const route = getWidgetRouteFromRegistry('filtered_discovery');
    expect(route.widgetType).toBe('supplier_table');
    expect(route.requiresSuppliers).toBe(true);
  });
});
