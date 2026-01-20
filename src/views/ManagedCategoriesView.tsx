// ManagedCategoriesView - Slot management for Beroe managed categories
// Clients can browse, activate, and manage their category slots

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Grid3X3,
  Check,
  Plus,
  ChevronRight,
  FileText,
  TrendingUp,
  Building2,
  Bell,
  Calculator,
  Clock,
  Users,
  Star,
  X,
} from 'lucide-react';
import type {
  ManagedCategory,
  ActivatedCategory,
} from '../types/managedCategories';
import {
  getCategoryDomainColor,
  formatUpdateFrequency,
  getSlotUsageStatus,
} from '../types/managedCategories';
import {
  MOCK_CATEGORY_DOMAINS,
  MOCK_MANAGED_CATEGORIES,
  MOCK_ACTIVATED_CATEGORIES,
  MOCK_SLOT_SUMMARY,
} from '../services/mockCategories';

interface ManagedCategoriesViewProps {
  onBack: () => void;
  onCategorySelect?: (categoryId: string) => void;
}

export function ManagedCategoriesView({ onBack, onCategorySelect }: ManagedCategoriesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showActivatedOnly, setShowActivatedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ManagedCategory | null>(null);

  const slotSummary = MOCK_SLOT_SUMMARY;
  const slotStatus = getSlotUsageStatus(slotSummary.usedSlots, slotSummary.totalSlots);

  // Get activated category IDs for quick lookup
  const activatedCategoryIds = useMemo(
    () => new Set(MOCK_ACTIVATED_CATEGORIES.map(ac => ac.categoryId)),
    []
  );

  // Filter categories based on search, domain, and activation status
  const filteredCategories = useMemo(() => {
    let categories = [...MOCK_MANAGED_CATEGORIES];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      categories = categories.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.domain.toLowerCase().includes(query) ||
        c.subDomain?.toLowerCase().includes(query) ||
        c.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    if (selectedDomain) {
      categories = categories.filter(c => c.domainId === selectedDomain);
    }

    if (showActivatedOnly) {
      categories = categories.filter(c => activatedCategoryIds.has(c.id));
    }

    return categories;
  }, [searchQuery, selectedDomain, showActivatedOnly, activatedCategoryIds]);

  // Get activation data for a category
  const getActivation = (categoryId: string): ActivatedCategory | undefined => {
    return MOCK_ACTIVATED_CATEGORIES.find(ac => ac.categoryId === categoryId);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-primary">Managed Categories</h1>
              <p className="text-sm text-secondary">
                Browse and manage your category slots
              </p>
            </div>
          </div>

          {/* Slot Usage Badge */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
            slotStatus === 'healthy' ? 'bg-emerald-50' :
            slotStatus === 'warning' ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <Grid3X3 className={`w-5 h-5 ${
              slotStatus === 'healthy' ? 'text-emerald-600' :
              slotStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
            }`} />
            <div>
              <div className="text-sm font-medium text-primary">
                <span className="tabular-nums">{slotSummary.usedSlots}</span> / {slotSummary.totalSlots} slots
              </div>
              <div className="text-xs text-secondary">
                {slotSummary.remainingSlots} available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
            />
          </div>

          {/* Filter: Activated Only */}
          <button
            onClick={() => setShowActivatedOnly(!showActivatedOnly)}
            className={`h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
              showActivatedOnly
                ? 'bg-violet-100 text-violet-700 border border-violet-200'
                : 'bg-white border border-slate-200 text-secondary hover:border-slate-300'
            }`}
          >
            <Check className="w-4 h-4" />
            Activated
          </button>
        </div>

        {/* Domain Filters */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDomain(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedDomain
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-secondary hover:bg-slate-200'
            }`}
          >
            All Domains
          </button>
          {MOCK_CATEGORY_DOMAINS.slice(0, 8).map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id === selectedDomain ? null : domain.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDomain === domain.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-secondary hover:bg-slate-200'
              }`}
            >
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Category List */}
        <div className={`flex-1 overflow-y-auto ${selectedCategory ? 'hidden lg:block lg:w-1/2 lg:border-r lg:border-slate-100' : ''}`}>
          <div className="p-4 space-y-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Grid3X3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-secondary">No categories found</p>
                <p className="text-xs text-muted mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isActivated = activatedCategoryIds.has(category.id);
                const domainColor = getCategoryDomainColor(category.domain);

                return (
                  <motion.button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category);
                      onCategorySelect?.(category.id);
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedCategory?.id === category.id
                        ? 'bg-violet-50 border-2 border-violet-200'
                        : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-primary truncate">{category.name}</h3>
                          {category.isPopular && (
                            <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${domainColor}`}>
                            {category.domain}
                          </span>
                          {category.subDomain && (
                            <span className="text-xs text-muted">{category.subDomain}</span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-secondary mt-2 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isActivated ? (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : slotSummary.remainingSlots > 0 ? (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <Plus className="w-3 h-3" />
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">
                            No slots
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Category Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              key={selectedCategory.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full lg:w-1/2 overflow-y-auto bg-slate-50/50"
            >
              <CategoryDetailPanel
                category={selectedCategory}
                activation={getActivation(selectedCategory.id)}
                hasAvailableSlots={slotSummary.remainingSlots > 0}
                onClose={() => setSelectedCategory(null)}
                onActivate={() => {
                  console.log('Activate category:', selectedCategory.id);
                  // Would trigger approval flow if needed
                }}
                onDeactivate={() => {
                  console.log('Deactivate category:', selectedCategory.id);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Category Detail Panel Component
interface CategoryDetailPanelProps {
  category: ManagedCategory;
  activation?: ActivatedCategory;
  hasAvailableSlots: boolean;
  onClose: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

function CategoryDetailPanel({
  category,
  activation,
  hasAvailableSlots,
  onClose,
  onActivate,
  onDeactivate,
}: CategoryDetailPanelProps) {
  const isActivated = !!activation;
  const domainColor = getCategoryDomainColor(category.domain);

  return (
    <div className="p-6">
      {/* Close button (mobile) */}
      <button
        onClick={onClose}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white mb-4"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">{category.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${domainColor}`}>
                {category.domain}
              </span>
              {category.subDomain && (
                <span className="text-sm text-secondary">{category.subDomain}</span>
              )}
            </div>
          </div>
          {category.isPopular && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
              <Star className="w-3 h-3" fill="currentColor" />
              Popular
            </div>
          )}
        </div>
        {category.description && (
          <p className="text-sm text-secondary mt-3">{category.description}</p>
        )}
      </div>

      {/* Analyst */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-slate-100">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Lead Analyst</h3>
        <div className="flex items-center gap-3">
          {category.leadAnalyst.photo ? (
            <img
              src={category.leadAnalyst.photo}
              alt={category.leadAnalyst.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-primary">{category.leadAnalyst.name}</p>
            {category.leadAnalyst.title && (
              <p className="text-xs text-secondary">{category.leadAnalyst.title}</p>
            )}
          </div>
        </div>
        {category.analystTeamSize && (
          <p className="text-xs text-muted mt-2">
            Team of {category.analystTeamSize} analysts
          </p>
        )}
      </div>

      {/* Features */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Available Features</h3>
        <div className="grid grid-cols-2 gap-2">
          <FeatureBadge
            icon={FileText}
            label="Market Reports"
            available={category.hasMarketReport}
          />
          <FeatureBadge
            icon={TrendingUp}
            label="Price Index"
            available={category.hasPriceIndex}
          />
          <FeatureBadge
            icon={Building2}
            label="Supplier Data"
            available={category.hasSupplierData}
          />
          <FeatureBadge
            icon={Bell}
            label="News Alerts"
            available={category.hasNewsAlerts}
          />
          <FeatureBadge
            icon={Calculator}
            label="Cost Model"
            available={category.hasCostModel}
          />
        </div>
      </div>

      {/* Update Info */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-secondary">
              {formatUpdateFrequency(category.updateFrequency)}
            </span>
          </div>
          <span className="text-xs text-muted">
            SLA: {category.responseTimeSla}
          </span>
        </div>
        <p className="text-xs text-muted mt-2">
          Last updated: {new Date(category.lastUpdated).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      {category.clientCount && (
        <div className="mb-6 text-center py-3 rounded-xl bg-slate-100">
          <span className="text-2xl font-bold text-primary tabular-nums">{category.clientCount}</span>
          <p className="text-xs text-secondary mt-1">clients using this category</p>
        </div>
      )}

      {/* Activation Status & Actions */}
      {isActivated ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-5 h-5" />
              <span className="font-medium">Category Activated</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Activated on {new Date(activation.activatedAt).toLocaleDateString()}
            </p>
            {activation.queriesThisMonth && (
              <p className="text-xs text-emerald-600 mt-0.5">
                {activation.queriesThisMonth} queries this month
              </p>
            )}
          </div>
          <button
            onClick={onDeactivate}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Deactivate Category
          </button>
        </div>
      ) : (
        <button
          onClick={onActivate}
          disabled={!hasAvailableSlots}
          className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            hasAvailableSlots
              ? 'bg-violet-600 hover:bg-violet-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          {hasAvailableSlots ? 'Activate Category' : 'No Slots Available'}
        </button>
      )}
    </div>
  );
}

// Feature Badge Component
interface FeatureBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  available: boolean;
}

function FeatureBadge({ icon: Icon, label, available }: FeatureBadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      available
        ? 'bg-white border border-slate-100'
        : 'bg-slate-50 text-slate-400'
    }`}>
      <Icon className={`w-4 h-4 ${available ? 'text-violet-500' : 'text-slate-300'}`} />
      <span className={`text-xs font-medium ${available ? 'text-primary' : 'text-slate-400'}`}>
        {label}
      </span>
      {!available && (
        <span className="text-[10px] text-slate-400 ml-auto">N/A</span>
      )}
    </div>
  );
}
