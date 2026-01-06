import { useState, useMemo } from 'react';
import { Search, Layers, ChevronRight } from 'lucide-react';
import {
  WIDGET_REGISTRY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getCategoryCounts,
  getWidgetsByCategory,
  searchWidgets,
  type WidgetCategory,
} from '../services/widgetRegistry';
import { WidgetCard } from './catalog/WidgetCard';

export const WidgetCatalog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');

  const categoryCounts = useMemo(() => getCategoryCounts(), []);
  const totalWidgets = WIDGET_REGISTRY.length;

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    let widgets = searchQuery ? searchWidgets(searchQuery) : WIDGET_REGISTRY;

    if (selectedCategory !== 'all') {
      widgets = widgets.filter(w => w.category === selectedCategory);
    }

    return widgets;
  }, [searchQuery, selectedCategory]);

  // Group widgets by category for display
  const widgetsByCategory = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredWidgets };
    }

    const grouped: Partial<Record<WidgetCategory, typeof filteredWidgets>> = {};
    CATEGORY_ORDER.forEach(cat => {
      const catWidgets = filteredWidgets.filter(w => w.category === cat);
      if (catWidgets.length > 0) {
        grouped[cat] = catWidgets;
      }
    });
    return grouped;
  }, [filteredWidgets, selectedCategory]);

  const scrollToCategory = (category: WidgetCategory) => {
    setSelectedCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-screen overflow-y-auto">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={20} className="text-violet-600" />
            <h1 className="text-lg font-semibold text-slate-900">Widget Catalog</h1>
          </div>
          <p className="text-sm text-slate-500">{totalWidgets} widgets available</p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="p-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-violet-50 text-violet-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Widgets</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
              {totalWidgets}
            </span>
          </button>

          <div className="mt-2 space-y-1">
            {CATEGORY_ORDER.map(category => (
              <button
                key={category}
                onClick={() => scrollToCategory(category)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{CATEGORY_LABELS[category]}</span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  {categoryCounts[category]}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-slate-900">{totalWidgets}</div>
              <div className="text-xs text-slate-500">Widgets</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-slate-900">{CATEGORY_ORDER.length}</div>
              <div className="text-xs text-slate-500">Categories</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>Design System</span>
            <ChevronRight size={14} />
            <span className="text-slate-700">Widget Catalog</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Widget Components</h1>
          <p className="text-slate-600 max-w-2xl">
            Browse all available widgets with live demos, prop documentation, and usage examples.
            Click on any widget to see its props and copy the code snippet.
          </p>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
            <p className="text-sm text-violet-700">
              Found <strong>{filteredWidgets.length}</strong> widget{filteredWidgets.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          </div>
        )}

        {/* Widget Grid by Category */}
        {Object.entries(widgetsByCategory).map(([category, widgets]) => (
          <section key={category} id={`category-${category}`} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {CATEGORY_LABELS[category as WidgetCategory]}
              </h2>
              <span className="text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {widgets.map(widget => (
                <WidgetCard key={widget.id} widget={widget} />
              ))}
            </div>
          </section>
        ))}

        {/* Empty State */}
        {filteredWidgets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <Search size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">No widgets found</h3>
            <p className="text-slate-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WidgetCatalog;
