// ExpertProfileArtifact - Full expert profile view in artifact panel
// Soft floating cards with subtle shadows, light typography

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Calendar,
  Award,
  MapPin,
  Briefcase,
  Users,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { ExpertProfile, ExpertReview } from '../../../types/expertMarketplace';
import {
  getAvailabilityColor,
  getAvailabilityLabel,
  getSpecialtyLabel,
} from '../../../types/expertMarketplace';
import { getMockExpertReviews } from '../../../services/expertMarketplaceService';

// Consistent card shadow from design system
const cardShadow = '0 8px 40px -12px rgba(148, 163, 184, 0.15)';
const cardHoverShadow = '0 12px 48px -12px rgba(148, 163, 184, 0.2)';

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
  const [isFollowing, setIsFollowing] = useState(false);

  const reviews = getMockExpertReviews(expert.id);

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-500 hover:text-slate-700 transition-all"
          style={{ boxShadow: cardShadow }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            isFollowing
              ? 'bg-slate-800 text-white'
              : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:text-slate-800'
          }`}
          style={{ boxShadow: cardShadow }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24">
        {/* Hero Section with Gradient */}
        <div className="relative">
          {/* Soft Gradient Background */}
          <div className="absolute inset-0 h-44 bg-gradient-to-br from-violet-50/80 via-slate-50 to-pink-50/50" />

          {/* Hero Content */}
          <div className="relative pt-16 pb-6 px-6">
            {/* Large Avatar with Availability Ring */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                {/* Animated ring for available experts */}
                {expert.availability === 'available' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-300/60"
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.15, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div
                  className={`w-24 h-24 rounded-full bg-white p-1 ${
                    expert.availability === 'available'
                      ? 'ring-2 ring-emerald-300'
                      : expert.availability === 'busy'
                      ? 'ring-2 ring-amber-300'
                      : ''
                  }`}
                  style={{ boxShadow: '0 8px 32px -8px rgba(148, 163, 184, 0.25)' }}
                >
                  <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden">
                    {expert.photo && !imageError ? (
                      <img
                        src={expert.photo}
                        alt={expert.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Users className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>
                {/* Availability Badge */}
                <div
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    expert.availability === 'available'
                      ? 'bg-emerald-500 text-white'
                      : expert.availability === 'busy'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-400 text-white'
                  }`}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {getAvailabilityLabel(expert.availability)}
                </div>
              </div>
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-lg font-medium text-slate-800">{expert.name}</h3>
                {expert.isTopVoice && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-600 flex items-center gap-1">
                    <Award className="w-2.5 h-2.5" />
                    Top Voice
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-2">{expert.title}</p>
              {expert.formerCompany && (
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Formerly {expert.formerTitle} at {expert.formerCompany}
                </p>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="flex items-center justify-center gap-6 text-center">
              <div>
                <div className="text-lg font-medium text-slate-700">{expert.yearsExperience}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Years</div>
              </div>
              <div className="w-px h-8 bg-slate-200/60" />
              <div>
                <div className="text-lg font-medium text-slate-700">{expert.questionsAnswered}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Answered</div>
              </div>
              <div className="w-px h-8 bg-slate-200/60" />
              <div>
                <div className="text-lg font-medium text-slate-700 flex items-center justify-center gap-0.5">
                  {expert.rating}
                  <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Banner */}
        {expert.availability === 'available' && (
          <div
            className="mx-6 mb-4 p-3 rounded-[20px] bg-white border border-emerald-100/60 flex items-center gap-3"
            style={{ boxShadow: '0 4px 24px -8px rgba(16, 185, 129, 0.12)' }}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Quick Responder</p>
              <p className="text-xs text-slate-400">Usually responds in {expert.responseTime}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {/* About Card */}
        <div
          className="mx-6 mb-4 p-5 rounded-[20px] bg-white border border-slate-100/60"
          style={{ boxShadow: cardShadow }}
        >
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            About
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">{expert.bio}</p>
        </div>

        {/* Expertise Card */}
        <div
          className="mx-6 mb-4 p-5 rounded-[20px] bg-white border border-slate-100/60"
          style={{ boxShadow: cardShadow }}
        >
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Expertise
          </h4>

          {/* Specialty Pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {expert.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600"
              >
                {getSpecialtyLabel(specialty)}
              </span>
            ))}
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-1.5">
            {expert.categories.map((category) => (
              <span
                key={category}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 text-slate-500"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Regions */}
          <div className="mt-4 pt-4 border-t border-slate-100/60 flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            {expert.regions.join(' • ')}
          </div>
        </div>

        {/* Rating Summary Card */}
        <div
          className="mx-6 mb-4 p-5 rounded-[20px] bg-white border border-slate-100/60"
          style={{ boxShadow: cardShadow }}
        >
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
            Ratings & Reviews
          </h4>

          <div className="flex items-center gap-6">
            {/* Big Rating */}
            <div className="text-center">
              <div className="text-3xl font-medium text-slate-700">{expert.rating}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(expert.rating) ? 'text-amber-400' : 'text-slate-200'
                    }`}
                    fill={i < Math.floor(expert.rating) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{expert.reviewCount} reviews</p>
            </div>

            {/* Rating Breakdown */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const percentage = stars === 5 ? 78 : stars === 4 ? 18 : stars === 3 ? 4 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-2">{stars}</span>
                    <Star className="w-2.5 h-2.5 text-amber-400" fill="currentColor" />
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-300 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mx-6 mb-4">
            <div className="space-y-3">
              {reviews.slice(0, showAllReviews ? undefined : 2).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {reviews.length > 2 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="w-full mt-3 py-2 text-center text-xs text-violet-500 hover:text-violet-600 transition-colors flex items-center justify-center gap-1"
              >
                {showAllReviews ? 'Show less' : `Show all ${reviews.length} reviews`}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAllReviews ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {expert.recentActivity && expert.recentActivity.length > 0 && (
          <div
            className="mx-6 mb-4 p-5 rounded-[20px] bg-white border border-slate-100/60"
            style={{ boxShadow: cardShadow }}
          >
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Recent Activity
            </h4>
            <div className="space-y-2">
              {expert.recentActivity.map((activity, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl transition-colors text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      activity.type === 'question'
                        ? 'bg-violet-50 text-violet-500'
                        : activity.type === 'report'
                        ? 'bg-blue-50 text-blue-500'
                        : 'bg-amber-50 text-amber-500'
                    }`}
                  >
                    {activity.type === 'question' && <MessageCircle className="w-4 h-4" />}
                    {activity.type === 'report' && <FileText className="w-4 h-4" />}
                    {activity.type === 'insight' && <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 truncate">{activity.title}</p>
                    <p className="text-[10px] text-slate-400">{activity.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {expert.badges && expert.badges.length > 0 && (
          <div
            className="mx-6 mb-4 p-5 rounded-[20px] bg-white border border-slate-100/60"
            style={{ boxShadow: cardShadow }}
          >
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Achievements
            </h4>
            <div className="flex flex-wrap gap-2">
              {expert.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 flex items-center gap-1.5"
                >
                  <Award className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* More Engagement Options */}
        <div
          className="mx-6 mb-6 p-5 rounded-[20px] bg-white border border-slate-100/60"
          style={{ boxShadow: cardShadow }}
        >
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            More Options
          </h4>
          <div className="space-y-2">
            {/* Deep Dive */}
            <button
              onClick={onAskQuestion}
              className="w-full p-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Deep Dive Analysis</p>
                <p className="text-[10px] text-slate-400">Comprehensive research report</p>
              </div>
              <span className="text-xs font-medium text-blue-500">{expert.rates.deepDive}c</span>
            </button>

            {/* Custom Report */}
            <button
              onClick={onRequestReport}
              className="w-full p-3 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Custom Report</p>
                <p className="text-[10px] text-slate-400">Tailored research & analysis</p>
              </div>
              <span className="text-xs font-medium text-amber-500">Quote</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Footer CTA */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-100/60"
        style={{ boxShadow: '0 -8px 32px -12px rgba(148, 163, 184, 0.15)' }}
      >
        <div className="flex gap-3">
          <button
            onClick={onAskQuestion}
            className="flex-1 py-3 px-4 rounded-2xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 16px -4px rgba(139, 92, 246, 0.4)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Ask Question
            {isManaged && <span className="text-violet-200 text-[10px]">(Free)</span>}
            {!isManaged && expert.rates.quickQuestion > 0 && (
              <span className="text-violet-200 text-[10px]">({expert.rates.quickQuestion}c)</span>
            )}
          </button>
          <button
            onClick={onBookCall}
            className="py-3 px-5 rounded-2xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

// Review card component
function ReviewCard({ review }: { review: ExpertReview }) {
  return (
    <div
      className="p-4 rounded-[20px] bg-white border border-slate-100/60"
      style={{ boxShadow: cardShadow }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-slate-600">{review.clientName}</p>
          <p className="text-[10px] text-slate-400">{review.date}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < review.rating ? 'text-amber-400' : 'text-slate-200'
              }`}
              fill={i < review.rating ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{review.comment}</p>
    </div>
  );
}

export default ExpertProfileArtifact;
