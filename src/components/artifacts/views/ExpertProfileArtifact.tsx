// ExpertProfileArtifact - Full expert profile view in artifact panel
// Shows detailed profile, stats, engagement options, and reviews

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Clock,
  MessageCircle,
  Calendar,
  Award,
  MapPin,
  Briefcase,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ExpertProfile, ExpertReview } from '../../../types/expertMarketplace';
import {
  getAvailabilityColor,
  getAvailabilityLabel,
  getSpecialtyColor,
  getSpecialtyLabel,
  getEngagementTierConfig,
} from '../../../types/expertMarketplace';
import { getMockExpertReviews } from '../../../services/expertMarketplaceService';

interface ExpertProfileArtifactProps {
  expert: ExpertProfile;
  onBack: () => void;
  onAskQuestion?: () => void;
  onBookCall?: () => void;
  onRequestReport?: () => void;
  isManaged?: boolean;
}

export function ExpertProfileArtifact({
  expert,
  onBack,
  onAskQuestion,
  onBookCall,
  onRequestReport,
  isManaged = false,
}: ExpertProfileArtifactProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [imageError, setImageError] = useState(false);

  const reviews = getMockExpertReviews(expert.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-medium text-slate-900">Expert Profile</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Hero Section */}
        <div className="p-6 pb-0">
          <div className="flex gap-4 mb-4">
            {/* Large avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden">
                {expert.photo && !imageError ? (
                  <img
                    src={expert.photo}
                    alt={expert.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Users className="w-8 h-8" />
                  </div>
                )}
              </div>
              {/* Availability dot */}
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white ${getAvailabilityColor(
                  expert.availability
                )}`}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-medium text-slate-900">{expert.name}</h3>
                {expert.isTopVoice && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Top Voice
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-2">{expert.title}</p>
              {expert.formerCompany && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Formerly {expert.formerTitle} at {expert.formerCompany}
                </p>
              )}
            </div>
          </div>

          {/* Availability status */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium mb-4 ${
              expert.availability === 'available'
                ? 'bg-emerald-50 text-emerald-700'
                : expert.availability === 'busy'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${getAvailabilityColor(expert.availability)}`}
            />
            {getAvailabilityLabel(expert.availability)}
            {expert.availability === 'available' && (
              <span className="text-xs opacity-75">
                • Responds in {expert.responseTime}
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-4 gap-2">
            <div
              className="bg-slate-50 rounded-[16px] p-3 text-center"
              style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)' }}
            >
              <div className="text-xl font-medium text-slate-900">
                {expert.yearsExperience}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Years Exp
              </div>
            </div>
            <div
              className="bg-slate-50 rounded-[16px] p-3 text-center"
              style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)' }}
            >
              <div className="text-xl font-medium text-slate-900">
                {expert.questionsAnswered}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Answered
              </div>
            </div>
            <div
              className="bg-slate-50 rounded-[16px] p-3 text-center"
              style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)' }}
            >
              <div className="text-xl font-medium text-slate-900 flex items-center justify-center gap-0.5">
                {expert.rating}
                <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Rating
              </div>
            </div>
            <div
              className="bg-slate-50 rounded-[16px] p-3 text-center"
              style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)' }}
            >
              <div className="text-xl font-medium text-slate-900">
                {expert.responseTime}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Response
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="px-6 mb-6">
          <h4 className="text-sm font-medium text-slate-900 mb-2">About</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{expert.bio}</p>
        </div>

        {/* Expertise Section */}
        <div className="px-6 mb-6">
          <h4 className="text-sm font-medium text-slate-900 mb-2">Expertise</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {expert.specialties.map((specialty) => (
              <span
                key={specialty}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getSpecialtyColor(
                  specialty
                )}`}
              >
                {getSpecialtyLabel(specialty)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {expert.categories.map((category) => (
              <span
                key={category}
                className="px-2 py-1 rounded-lg text-xs bg-slate-50 text-slate-600"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div className="px-6 mb-6">
          <h4 className="text-sm font-medium text-slate-900 mb-2">Regional Coverage</h4>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">{expert.regions.join(' • ')}</span>
          </div>
        </div>

        {/* Engagement Options */}
        <div className="px-6 mb-6">
          <h4 className="text-sm font-medium text-slate-900 mb-3">
            Engagement Options
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Quick Question */}
            <button
              onClick={onAskQuestion}
              className="p-4 rounded-[16px] bg-violet-50 border border-violet-100 text-left hover:bg-violet-100 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-violet-600" />
                <span className="text-sm font-medium text-violet-900">
                  Quick Question
                </span>
              </div>
              <p className="text-xs text-violet-700 mb-2">24hr response</p>
              <p className="text-xs font-medium text-violet-600">
                {isManaged ? 'Free (managed)' : `${expert.rates.quickQuestion} credits`}
              </p>
            </button>

            {/* Consultation */}
            <button
              onClick={onBookCall}
              className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-100 text-left hover:bg-emerald-100 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">
                  Consultation
                </span>
              </div>
              <p className="text-xs text-emerald-700 mb-2">30-min video call</p>
              <p className="text-xs font-medium text-emerald-600">
                {expert.rates.consultation} credits
              </p>
            </button>

            {/* Deep Dive */}
            <button
              onClick={onAskQuestion}
              className="p-4 rounded-[16px] bg-blue-50 border border-blue-100 text-left hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔍</span>
                <span className="text-sm font-medium text-blue-900">Deep Dive</span>
              </div>
              <p className="text-xs text-blue-700 mb-2">Comprehensive analysis</p>
              <p className="text-xs font-medium text-blue-600">
                {expert.rates.deepDive} credits
              </p>
            </button>

            {/* Custom Report */}
            <button
              onClick={onRequestReport}
              className="p-4 rounded-[16px] bg-amber-50 border border-amber-100 text-left hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📋</span>
                <span className="text-sm font-medium text-amber-900">
                  Custom Report
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-2">Tailored research</p>
              <p className="text-xs font-medium text-amber-600">Get quote</p>
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-900">
                Reviews ({expert.reviewCount})
              </h4>
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <Star className="w-4 h-4" fill="currentColor" />
                {expert.rating}
              </div>
            </div>

            <div className="space-y-3">
              {reviews.slice(0, showAllReviews ? undefined : 2).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {reviews.length > 2 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="w-full mt-3 py-2 text-center text-sm text-violet-600 hover:text-violet-700 transition-colors flex items-center justify-center gap-1"
              >
                {showAllReviews ? 'Show less' : `Show all ${reviews.length} reviews`}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showAllReviews ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {expert.recentActivity && expert.recentActivity.length > 0 && (
          <div className="px-6 mb-6">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {expert.recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                    {activity.type === 'question' && <MessageCircle className="w-4 h-4" />}
                    {activity.type === 'report' && <span className="text-sm">📋</span>}
                    {activity.type === 'insight' && <span className="text-sm">💡</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{activity.title}</p>
                    <p className="text-xs text-slate-400">{activity.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {expert.badges && expert.badges.length > 0 && (
          <div className="px-6 pb-6">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Badges</h4>
            <div className="flex flex-wrap gap-2">
              {expert.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 flex items-center gap-1.5"
                >
                  <Award className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Review card component
function ReviewCard({ review }: { review: ExpertReview }) {
  const tierConfig = getEngagementTierConfig(review.engagementType);

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-slate-700">{review.clientName}</p>
          <p className="text-xs text-slate-400">{review.date}</p>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < review.rating ? 'text-amber-500' : 'text-slate-200'
              }`}
              fill={i < review.rating ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">{review.comment}</p>
      <span
        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-${tierConfig.color}-50 text-${tierConfig.color}-600`}
      >
        {tierConfig.label}
      </span>
    </div>
  );
}

export default ExpertProfileArtifact;
