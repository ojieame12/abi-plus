// ManagedCategoriesView - Slot management for Beroe managed categories
// Redesigned with contained layout, grid cards, and inline expansion

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SampleReportArtifact } from '../components/artifacts/views/SampleReportArtifact';
import { AlertSetupArtifact } from '../components/artifacts/views/AlertSetupArtifact';
import { AnalystMessageArtifact } from '../components/artifacts/views/AnalystMessageArtifact';
import {
  ArrowLeft,
  Search,
  Check,
  Plus,
  Clock,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronUp,
} from 'lucide-react';
import type {
  ManagedCategory,
  ActivatedCategory,
} from '../types/managedCategories';
import {
  formatUpdateFrequency,
  getSlotUsageStatus,
} from '../types/managedCategories';
import {
  MOCK_CATEGORY_DOMAINS,
  MOCK_MANAGED_CATEGORIES,
  MOCK_ACTIVATED_CATEGORIES,
  MOCK_SLOT_SUMMARY,
} from '../services/mockCategories';

// Clean SVG icons for domains (Iconly-style)
const DomainIcon = ({ domain, className = '' }: { domain: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    metals: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    packaging: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    logistics: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    it_services: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    chemicals: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6v5.5l4 6.5H5l4-6.5V3z" />
        <path d="M10 3v5M14 3v5" />
        <circle cx="7" cy="17" r="1" />
        <circle cx="12" cy="18" r="1" />
        <circle cx="16" cy="16" r="1" />
      </svg>
    ),
    energy: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    mro: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    marketing: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    hr_services: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    facilities: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" />
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      </svg>
    ),
    travel: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
    fleet: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14v-5H5v5zM18 9l1-4H5l1 4" />
        <circle cx="7.5" cy="17" r="2" />
        <circle cx="16.5" cy="17" r="2" />
        <path d="M5 12V9h14v3" />
      </svg>
    ),
  };

  return icons[domain] || icons.packaging;
};

interface ManagedCategoriesViewProps {
  onBack: () => void;
  onCategorySelect?: (categoryId: string) => void;
}

export function ManagedCategoriesView({ onBack }: ManagedCategoriesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showActivatedOnly, setShowActivatedOnly] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [carouselScrolled, setCarouselScrolled] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Artifact panel state
  const [artifactPanel, setArtifactPanel] = useState<{
    type: 'sample-report' | 'message-analyst' | 'setup-alerts' | null;
    category: ManagedCategory | null;
  }>({ type: null, category: null });

  const ITEMS_PER_DOMAIN = 5; // Show 5 initially, expand to show all

  // Open artifact handlers
  const openSampleReport = (category: ManagedCategory) => {
    setArtifactPanel({ type: 'sample-report', category });
  };

  const openMessageAnalyst = (category: ManagedCategory) => {
    setArtifactPanel({ type: 'message-analyst', category });
  };

  const openSetupAlerts = (category: ManagedCategory) => {
    setArtifactPanel({ type: 'setup-alerts', category });
  };

  const closeArtifact = () => {
    setArtifactPanel({ type: null, category: null });
  };

  // Generate stable "random" values from category ID (deterministic)
  const getStableValue = (id: string, seed: number, min: number, max: number) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i) + seed;
      hash = hash & hash;
    }
    const normalized = Math.abs(hash % 1000) / 1000;
    return Math.floor(normalized * (max - min) + min);
  };

  const getPriceTrend = (id: string) => {
    const isUp = getStableValue(id, 1, 0, 100) > 50;
    const percent = (getStableValue(id, 2, 10, 150) / 10).toFixed(1);
    return { isUp, percent };
  };

  const getSuppliersTracked = (id: string) => {
    return getStableValue(id, 3, 50, 250);
  };

  // Local state for activated categories (for demo)
  // Initialize with 28 to match mock summary (7 slots remaining for demo)
  const totalSlots = MOCK_SLOT_SUMMARY.totalSlots;
  const [localActivatedIds, setLocalActivatedIds] = useState<Set<string>>(
    () => new Set(MOCK_ACTIVATED_CATEGORIES.slice(0, 28).map(ac => ac.categoryId))
  );
  const usedSlots = localActivatedIds.size;
  const remainingSlots = totalSlots - usedSlots;
  const slotStatus = getSlotUsageStatus(usedSlots, totalSlots);
  const slotPercentage = Math.round((usedSlots / totalSlots) * 100);

  // Handlers for activate/deactivate
  const handleActivate = (categoryId: string) => {
    if (remainingSlots > 0) {
      setLocalActivatedIds(prev => new Set([...prev, categoryId]));
    }
  };

  const handleDeactivate = (categoryId: string) => {
    setLocalActivatedIds(prev => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  };

  // Get activated category IDs for quick lookup
  const activatedCategoryIds = localActivatedIds;

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

  // Group categories by domain for display
  const categoriesByDomain = useMemo(() => {
    const grouped: Record<string, ManagedCategory[]> = {};
    filteredCategories.forEach(cat => {
      const domain = cat.domainId || 'other';
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(cat);
    });
    return grouped;
  }, [filteredCategories]);

  // Get activation data for a category
  const getActivation = (categoryId: string): ActivatedCategory | undefined => {
    return MOCK_ACTIVATED_CATEGORIES.find(ac => ac.categoryId === categoryId);
  };

  // Carousel scroll handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Count categories per domain
  const getDomainCategoryCount = (domainId: string) => {
    return MOCK_MANAGED_CATEGORIES.filter(c => c.domainId === domainId).length;
  };

  const getDomainActiveCount = (domainId: string) => {
    return MOCK_MANAGED_CATEGORIES.filter(
      c => c.domainId === domainId && localActivatedIds.has(c.id)
    ).length;
  };

  return (
    <div className="h-full overflow-auto bg-slate-50/50 relative">
      {/* Artifact Panel Overlay */}
      <AnimatePresence>
        {artifactPanel.type && artifactPanel.category && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeArtifact}
              className="fixed inset-0 bg-black/20 z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 overflow-auto"
            >
              {artifactPanel.type === 'sample-report' && (
                <SampleReportArtifact
                  category={artifactPanel.category.name}
                  analystName={artifactPanel.category.leadAnalyst.name}
                  onBack={closeArtifact}
                />
              )}
              {artifactPanel.type === 'message-analyst' && (
                <AnalystMessageArtifact
                  analyst={{
                    name: artifactPanel.category.leadAnalyst.name,
                    specialty: artifactPanel.category.domain,
                    photo: artifactPanel.category.leadAnalyst.photo,
                    availability: 'available',
                    responseTime: artifactPanel.category.responseTimeSla,
                  }}
                  category={artifactPanel.category.name}
                  isManaged={localActivatedIds.has(artifactPanel.category.id)}
                  credits={150}
                  onSend={(message) => {
                    console.log('Message sent:', message);
                    closeArtifact();
                  }}
                  onBack={closeArtifact}
                />
              )}
              {artifactPanel.type === 'setup-alerts' && (
                <AlertSetupArtifact
                  category={artifactPanel.category.name}
                  onSave={(config) => {
                    console.log('Alert config saved:', config);
                  }}
                  onBack={closeArtifact}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-[1000px] mx-auto p-6">
        {/* Main Container */}
        <div className="rounded-3xl p-6">
          {/* Header Row 1: Title + Slot Progress */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-medium text-slate-900">Managed Categories</h1>
                <p className="text-sm text-slate-500">
                  {usedSlots} active across {new Set(Array.from(localActivatedIds).map(id => MOCK_MANAGED_CATEGORIES.find(c => c.id === id)?.domainId).filter(Boolean)).size} domains
                </p>
              </div>
            </div>

            {/* Slot Progress - Linear */}
            <div className="flex items-center gap-4">
              <div className="w-48">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">{usedSlots} / {totalSlots} slots</span>
                  <span className="text-xs text-slate-400">{remainingSlots} remaining</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      slotStatus === 'healthy' ? 'bg-emerald-500' :
                      slotStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${slotPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Header Row 2: Search + Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white border border-slate-100/80 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
              />
            </div>
            <button
              onClick={() => setShowActivatedOnly(!showActivatedOnly)}
              className={`h-11 px-5 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all ${
                showActivatedOnly
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-white border border-slate-100/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Check className={`w-4 h-4 ${showActivatedOnly ? 'opacity-100' : 'opacity-50'}`} />
              Active only
            </button>
          </div>

          {/* Domain Carousel */}
          <div className="mb-6 -mx-6 relative">
            <div className="flex items-center justify-between mb-3 px-6">
              <h2 className="text-sm font-medium text-slate-700">Browse by Domain</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fade edges - left fade only shows after scrolling */}
            {carouselScrolled && (
              <div className="absolute left-0 top-[44px] bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
            )}
            <div className="absolute right-0 top-[44px] bottom-0 w-12 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

            <div
              ref={carouselRef}
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                setCarouselScrolled(scrollLeft > 0);
              }}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-1 px-6"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Domains Card */}
              <button
                onClick={() => setSelectedDomain(null)}
                className={`flex-shrink-0 w-[160px] h-[160px] p-4 rounded-[20px] border transition-all flex flex-col text-left ${
                  !selectedDomain
                    ? 'bg-slate-900 border-slate-700/50'
                    : 'bg-white border-slate-100/60 hover:-translate-y-0.5'
                }`}
                style={{
                  boxShadow: !selectedDomain
                    ? '0 8px 40px -12px rgba(15, 23, 42, 0.15)'
                    : '0 8px 40px -12px rgba(148, 163, 184, 0.15)'
                }}
              >
                {/* Icon - Top Left */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  !selectedDomain ? 'bg-white' : 'bg-[#fafafa]'
                }`}>
                  <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>

                {/* Spacer */}
                <div className="flex-1 min-h-[20px]" />

                {/* Stats - Bottom */}
                <div>
                  <div className="flex items-baseline">
                    <span className={`text-[22px] leading-none ${!selectedDomain ? 'text-violet-300' : 'text-violet-600'}`}>
                      {localActivatedIds.size}
                    </span>
                    <span className={`text-sm leading-none ${!selectedDomain ? 'text-slate-500' : 'text-slate-400'}`}>
                      /{MOCK_MANAGED_CATEGORIES.length}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${!selectedDomain ? 'text-slate-400' : 'text-slate-500'}`}>
                    All Domains
                  </div>
                </div>
              </button>

              {/* Domain Cards */}
              {MOCK_CATEGORY_DOMAINS.map((domain) => {
                const count = getDomainCategoryCount(domain.id);
                const activeCount = getDomainActiveCount(domain.id);
                const isSelected = selectedDomain === domain.id;

                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
                    className={`flex-shrink-0 w-[160px] h-[160px] p-4 rounded-[20px] border transition-all flex flex-col text-left ${
                      isSelected
                        ? 'bg-slate-900 border-slate-700/50'
                        : 'bg-white border-slate-100/60 hover:-translate-y-0.5'
                    }`}
                    style={{
                      boxShadow: isSelected
                        ? '0 8px 40px -12px rgba(15, 23, 42, 0.15)'
                        : '0 8px 40px -12px rgba(148, 163, 184, 0.15)'
                    }}
                  >
                    {/* Icon - Top Left */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-white' : 'bg-[#fafafa]'
                    }`}>
                      <DomainIcon domain={domain.id} className={`w-4 h-4 ${isSelected ? 'text-slate-700' : 'text-slate-500'}`} />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 min-h-[20px]" />

                    {/* Stats - Bottom */}
                    <div>
                      <div className="flex items-baseline">
                        <span className={`text-[22px] leading-none ${isSelected ? 'text-violet-300' : 'text-violet-600'}`}>
                          {activeCount}
                        </span>
                        <span className={`text-sm leading-none ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                          /{count}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {domain.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category List */}
          <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
            {Object.entries(categoriesByDomain).map(([domainId, categories], groupIndex) => {
              const domain = MOCK_CATEGORY_DOMAINS.find(d => d.id === domainId);
              const domainName = domain?.name || domainId;

              return (
                <div key={domainId}>
                  {/* Domain Header */}
                  <div className={`px-5 py-3 bg-slate-50/80 border-b border-slate-100 ${groupIndex > 0 ? 'border-t' : ''}`}>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {domainName}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {categories.length}
                    </span>
                  </div>

                  {/* Category Rows */}
                  {(() => {
                    const isDomainExpanded = expandedDomains.has(domainId);
                    const visibleCategories = isDomainExpanded
                      ? categories
                      : categories.slice(0, ITEMS_PER_DOMAIN);
                    const hasMore = categories.length > ITEMS_PER_DOMAIN;

                    return (
                      <>
                        {visibleCategories.map((category, index) => {
                          const isActivated = activatedCategoryIds.has(category.id);
                          const isExpanded = expandedCategoryId === category.id;
                          const activation = getActivation(category.id);

                          return (
                            <div
                              key={category.id}
                              className={`${isExpanded ? 'ring-1 ring-violet-200 rounded-xl mx-2 my-2 overflow-hidden bg-white' : ''}`}
                            >
                        {/* Row */}
                        <button
                          onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                          className={`w-full px-5 py-4 flex items-center gap-4 text-left transition-colors ${
                            !isExpanded && index < categories.length - 1 ? 'border-b border-slate-50' : ''
                          } ${isExpanded ? 'bg-violet-50/30' : 'hover:bg-slate-50/50'}`}
                        >
                          {/* Status indicator */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isActivated ? 'bg-emerald-500' : 'bg-slate-200'
                          }`} />

                          {/* Category info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-slate-900 truncate">{category.name}</h4>
                              {category.isPopular && (
                                <Star className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{category.subDomain}</p>
                          </div>

                          {/* Analyst */}
                          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                              {category.leadAnalyst.photo ? (
                                <img src={category.leadAnalyst.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                            <span className="text-xs text-slate-500 max-w-[100px] truncate">{category.leadAnalyst.name}</span>
                          </div>

                          {/* Update frequency */}
                          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatUpdateFrequency(category.updateFrequency)}
                          </div>

                          {/* Action */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isActivated ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                Add
                              </span>
                            )}
                            <ChevronUp className={`w-4 h-4 text-slate-300 transition-transform ${
                              isExpanded ? '' : 'rotate-180'
                            }`} />
                          </div>
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 py-5 bg-slate-50/50 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
                                {/* Description */}
                                {category.description && (
                                  <p className="text-sm text-slate-600 mb-5">
                                    {category.description}
                                  </p>
                                )}

                                {/* Info Grid - Row 1 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  {/* Analyst */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Lead Analyst</p>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden">
                                        {category.leadAnalyst.photo ? (
                                          <img src={category.leadAnalyst.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <Users className="w-4 h-4 text-violet-600" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{category.leadAnalyst.name}</p>
                                        <p className="text-xs text-slate-500">+{category.analystTeamSize || 2} team</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* SLA */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Response SLA</p>
                                    <p className="text-lg font-medium text-slate-900">{category.responseTimeSla}</p>
                                  </div>

                                  {/* Clients */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Clients</p>
                                    <p className="text-lg font-medium text-slate-900">{category.clientCount || '50+'}</p>
                                  </div>

                                  {/* Market Trend */}
                                  {(() => {
                                    const trend = getPriceTrend(category.id);
                                    return (
                                      <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                        <p className="text-xs text-slate-400 mb-2">Price Trend</p>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-lg font-medium ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {trend.isUp ? '↑' : '↓'} {trend.percent}%
                                          </span>
                                          <span className="text-xs text-slate-400">30d</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Info Grid - Row 2 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                  {/* Coverage */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Coverage</p>
                                    <div className="flex flex-wrap gap-1">
                                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">NA</span>
                                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">EMEA</span>
                                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">APAC</span>
                                    </div>
                                  </div>

                                  {/* Suppliers */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Suppliers Tracked</p>
                                    <p className="text-lg font-medium text-slate-900">{getSuppliersTracked(category.id)}</p>
                                  </div>

                                  {/* Updates */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Last Updated</p>
                                    <p className="text-sm font-medium text-slate-900">
                                      {new Date(category.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>

                                  {/* Features */}
                                  <div className="bg-white rounded-[16px] p-4 border border-slate-100/60" style={{ boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)' }}>
                                    <p className="text-xs text-slate-400 mb-2">Included</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {category.hasMarketReport && <span className="px-2 py-0.5 rounded text-xs bg-violet-50 text-violet-600">Reports</span>}
                                      {category.hasPriceIndex && <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">Prices</span>}
                                      {category.hasSupplierData && <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-600">Suppliers</span>}
                                      {category.hasNewsAlerts && <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600">Alerts</span>}
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2 mb-5">
                                  <button
                                    onClick={() => openSampleReport(category)}
                                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    View Sample Report
                                  </button>
                                  <button
                                    onClick={() => openMessageAnalyst(category)}
                                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    Message Analyst
                                  </button>
                                  {isActivated && (
                                    <button
                                      onClick={() => openSetupAlerts(category)}
                                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      Set Up Alerts
                                    </button>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                  {isActivated ? (
                                    <p className="text-xs text-slate-500">
                                      {activation
                                        ? `Active since ${new Date(activation.activatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}${activation.queriesThisMonth ? ` · ${activation.queriesThisMonth} queries this month` : ''}`
                                        : 'Just activated'
                                      }
                                    </p>
                                  ) : (
                                    <p className="text-xs text-slate-500">
                                      {remainingSlots} slots remaining
                                    </p>
                                  )}

                                  <div className="flex items-center gap-2">
                                    {isActivated ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeactivate(category.id);
                                        }}
                                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                      >
                                        Deactivate
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleActivate(category.id);
                                        }}
                                        disabled={remainingSlots === 0}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                                          remainingSlots > 0
                                            ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Activate
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                            </div>
                          );
                        })}

                        {/* Show More / Show Less */}
                        {hasMore && (
                          <button
                            onClick={() => {
                              setExpandedDomains(prev => {
                                const next = new Set(prev);
                                if (isDomainExpanded) {
                                  next.delete(domainId);
                                } else {
                                  next.add(domainId);
                                }
                                return next;
                              });
                            }}
                            className="w-full px-5 py-3 text-center text-sm text-violet-600 hover:bg-violet-50/50 transition-colors"
                          >
                            {isDomainExpanded
                              ? 'Show less'
                              : `Show ${categories.length - ITEMS_PER_DOMAIN} more`}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })}

            {/* Empty State */}
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-600 mb-1">No categories found</p>
                <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

