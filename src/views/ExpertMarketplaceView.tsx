// ExpertMarketplaceView - Browse and connect with domain experts
// Modern, Apple-like design with AI matching and inline expansion

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Filter,
  Users,
} from 'lucide-react';
import { ExpertCard } from '../components/experts/ExpertCard';
import { ExpertMatchingCard } from '../components/experts/ExpertMatchingCard';
import { ExpertProfileArtifact } from '../components/artifacts/views/ExpertProfileArtifact';
import { ExpertBookingArtifact } from '../components/artifacts/views/ExpertBookingArtifact';
import type { ExpertProfile, ExpertSpecialty } from '../types/expertMarketplace';
import { getSpecialtyLabel } from '../types/expertMarketplace';
import {
  MOCK_EXPERTS,
  EXPERT_DOMAINS,
  getMockExperts,
  getMockFeaturedExperts,
  getAvailableExpertsCount,
  getTotalExpertsCount,
} from '../services/expertMarketplaceService';

// Domain Icon component matching ManagedCategoriesView pattern
const DomainIcon = ({
  domain,
  className = '',
}: {
  domain: string;
  className?: string;
}) => {
  const icons: Record<string, JSX.Element> = {
    metals: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    packaging: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    logistics: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    it_services: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    chemicals: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3h6v5.5l4 6.5H5l4-6.5V3z" />
        <path d="M10 3v5M14 3v5" />
        <circle cx="7" cy="17" r="1" />
        <circle cx="12" cy="18" r="1" />
        <circle cx="16" cy="16" r="1" />
      </svg>
    ),
    energy: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    mro: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    hr_services: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    marketing: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    facilities: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" />
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      </svg>
    ),
  };

  return icons[domain] || icons.packaging;
};

interface ExpertMarketplaceViewProps {
  onBack: () => void;
}

export function ExpertMarketplaceView({ onBack }: ExpertMarketplaceViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<ExpertSpecialty | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [expandedExpertId, setExpandedExpertId] = useState<string | null>(null);
  const [isMatchingCollapsed, setIsMatchingCollapsed] = useState(false);
  const [carouselScrolled, setCarouselScrolled] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Artifact panel state
  const [artifactPanel, setArtifactPanel] = useState<{
    type: 'profile' | 'booking' | null;
    expert: ExpertProfile | null;
    bookingType?: 'quick_question' | 'consultation';
  }>({ type: null, expert: null });

  // Filter experts based on search, specialty, and availability
  const filteredExperts = useMemo(() => {
    return getMockExperts({
      specialty: selectedSpecialty || undefined,
      availableNow: showAvailableOnly,
      minRating: minRating || undefined,
      searchQuery: searchQuery || undefined,
    });
  }, [searchQuery, selectedSpecialty, showAvailableOnly, minRating]);

  // Featured experts
  const featuredExperts = useMemo(() => getMockFeaturedExperts(), []);

  // Carousel scroll handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 220;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Get expert count by specialty
  const getExpertCountBySpecialty = (specialty: string) => {
    return MOCK_EXPERTS.filter((e) => e.specialties.includes(specialty as ExpertSpecialty)).length;
  };

  // Artifact handlers
  const openExpertProfile = (expert: ExpertProfile) => {
    setArtifactPanel({ type: 'profile', expert });
  };

  const openBooking = (expert: ExpertProfile, type: 'quick_question' | 'consultation') => {
    setArtifactPanel({ type: 'booking', expert, bookingType: type });
  };

  const closeArtifact = () => {
    setArtifactPanel({ type: null, expert: null });
  };

  // Handle expert selection from matching
  const handleExpertSelect = (expertId: string) => {
    const expert = MOCK_EXPERTS.find((e) => e.id === expertId);
    if (expert) {
      openExpertProfile(expert);
    }
  };

  return (
    <div className="h-full overflow-auto bg-slate-50/50 relative">
      {/* Artifact Panel Overlay */}
      <AnimatePresence>
        {artifactPanel.type && artifactPanel.expert && (
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
              className="fixed top-0 right-0 h-full w-[440px] bg-white shadow-2xl z-50 overflow-auto"
            >
              {artifactPanel.type === 'profile' && (
                <ExpertProfileArtifact
                  expert={artifactPanel.expert}
                  onBack={closeArtifact}
                  onAskQuestion={() => openBooking(artifactPanel.expert!, 'quick_question')}
                  onBookCall={() => openBooking(artifactPanel.expert!, 'consultation')}
                  isManaged={false} // TODO: Check if any categories are managed
                />
              )}
              {artifactPanel.type === 'booking' && (
                <ExpertBookingArtifact
                  expert={artifactPanel.expert}
                  engagementType={artifactPanel.bookingType || 'quick_question'}
                  onBack={() => setArtifactPanel({ type: 'profile', expert: artifactPanel.expert })}
                  onComplete={(booking) => {
                    console.log('Booking completed:', booking);
                    closeArtifact();
                  }}
                  isManaged={false}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-[1000px] mx-auto p-6">
        {/* Main Container */}
        <div className="rounded-3xl p-6">
          {/* Header Row 1: Title + Stats */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-medium text-slate-900">
                  Expert Marketplace
                </h1>
                <p className="text-sm text-slate-500">
                  Connect with {getTotalExpertsCount()}+ domain specialists
                </p>
              </div>
            </div>

            {/* Available now indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-700">
                {getAvailableExpertsCount()} available now
              </span>
            </div>
          </div>

          {/* AI Matching Card */}
          <div className="mb-6">
            <ExpertMatchingCard
              isCollapsed={isMatchingCollapsed}
              onToggleCollapsed={() => setIsMatchingCollapsed(!isMatchingCollapsed)}
              onExpertSelect={handleExpertSelect}
            />
          </div>

          {/* Header Row 2: Search + Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experts, categories..."
                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white border border-slate-100/80 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
              />
            </div>
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`h-11 px-5 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all ${
                showAvailableOnly
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-white border border-slate-100/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  showAvailableOnly ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              Available Now
            </button>
            <div className="relative">
              <select
                value={minRating || ''}
                onChange={(e) =>
                  setMinRating(e.target.value ? parseFloat(e.target.value) : null)
                }
                className="h-11 px-4 pr-8 rounded-2xl bg-white border border-slate-100/80 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 appearance-none cursor-pointer"
              >
                <option value="">Rating</option>
                <option value="4.5">4.5+</option>
                <option value="4.7">4.7+</option>
                <option value="4.9">4.9+</option>
              </select>
              <Star className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Featured Experts - Top This Month (HERO section) */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-700 mb-3 px-1">
              Top This Month
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {featuredExperts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  variant="featured"
                  onViewProfile={() => openExpertProfile(expert)}
                />
              ))}
            </div>
          </div>

          {/* Specialty Carousel */}
          <div className="mb-6 -mx-6 relative">
            <div className="flex items-center justify-between mb-3 px-6">
              <h2 className="text-sm font-medium text-slate-700">
                Browse by Specialty
              </h2>
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

            {/* Fade edges */}
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
                onClick={() => setSelectedSpecialty(null)}
                className={`flex-shrink-0 w-[160px] h-[160px] p-4 rounded-[20px] border transition-all flex flex-col text-left ${
                  !selectedSpecialty
                    ? 'bg-slate-900 border-slate-700/50'
                    : 'bg-white border-slate-100/60 hover:-translate-y-0.5'
                }`}
                style={{
                  boxShadow: !selectedSpecialty
                    ? '0 8px 40px -12px rgba(15, 23, 42, 0.15)'
                    : '0 8px 40px -12px rgba(148, 163, 184, 0.15)',
                }}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    !selectedSpecialty ? 'bg-white' : 'bg-[#fafafa]'
                  }`}
                >
                  <Users
                    className={`w-4 h-4 ${
                      !selectedSpecialty ? 'text-slate-700' : 'text-slate-500'
                    }`}
                  />
                </div>

                {/* Spacer */}
                <div className="flex-1 min-h-[20px]" />

                {/* Stats */}
                <div>
                  <div className="flex items-baseline">
                    <span
                      className={`text-[22px] leading-none ${
                        !selectedSpecialty ? 'text-violet-300' : 'text-violet-600'
                      }`}
                    >
                      {getTotalExpertsCount()}
                    </span>
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      !selectedSpecialty ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    All Experts
                  </div>
                </div>
              </button>

              {/* Specialty Cards */}
              {EXPERT_DOMAINS.map((domain) => {
                const count = getExpertCountBySpecialty(domain.id);
                const isSelected = selectedSpecialty === domain.id;

                return (
                  <button
                    key={domain.id}
                    onClick={() =>
                      setSelectedSpecialty(isSelected ? null : (domain.id as ExpertSpecialty))
                    }
                    className={`flex-shrink-0 w-[160px] h-[160px] p-4 rounded-[20px] border transition-all flex flex-col text-left ${
                      isSelected
                        ? 'bg-slate-900 border-slate-700/50'
                        : 'bg-white border-slate-100/60 hover:-translate-y-0.5'
                    }`}
                    style={{
                      boxShadow: isSelected
                        ? '0 8px 40px -12px rgba(15, 23, 42, 0.15)'
                        : '0 8px 40px -12px rgba(148, 163, 184, 0.15)',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-white' : 'bg-[#fafafa]'
                      }`}
                    >
                      <DomainIcon
                        domain={domain.id}
                        className={`w-4 h-4 ${
                          isSelected ? 'text-slate-700' : 'text-slate-500'
                        }`}
                      />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 min-h-[20px]" />

                    {/* Stats */}
                    <div>
                      <div className="flex items-baseline">
                        <span
                          className={`text-[22px] leading-none ${
                            isSelected ? 'text-violet-300' : 'text-violet-600'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isSelected ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {domain.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

{/* Experts Grid */}
          <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
            {/* Section header */}
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {selectedSpecialty ? getSpecialtyLabel(selectedSpecialty) : 'All Experts'}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                {filteredExperts.length}
              </span>
            </div>

            {/* Expert cards */}
            <div className="divide-y divide-slate-50">
              {filteredExperts.map((expert) => (
                <div key={expert.id} className="p-4">
                  <ExpertCard
                    expert={expert}
                    isExpanded={expandedExpertId === expert.id}
                    onToggleExpand={() =>
                      setExpandedExpertId(
                        expandedExpertId === expert.id ? null : expert.id
                      )
                    }
                    onViewProfile={() => openExpertProfile(expert)}
                    onAskQuestion={() => openBooking(expert, 'quick_question')}
                    onBookCall={() => openBooking(expert, 'consultation')}
                    isManaged={false}
                  />
                </div>
              ))}

              {/* Empty state */}
              {filteredExperts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-600 mb-1">No experts found</p>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpertMarketplaceView;
