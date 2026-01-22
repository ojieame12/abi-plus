// ExpertCard Component
// Expandable card showing expert profile with inline expansion pattern

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Clock,
  MessageCircle,
  Calendar,
  ChevronDown,
  Award,
  Users,
} from 'lucide-react';
import type { ExpertProfile } from '../../types/expertMarketplace';
import {
  getAvailabilityColor,
  getAvailabilityLabel,
  getSpecialtyColor,
  getSpecialtyLabel,
} from '../../types/expertMarketplace';

interface ExpertCardProps {
  expert: ExpertProfile;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onViewProfile?: () => void;
  onAskQuestion?: () => void;
  onBookCall?: () => void;
  variant?: 'default' | 'compact' | 'featured';
  isManaged?: boolean;
}

export function ExpertCard({
  expert,
  isExpanded = false,
  onToggleExpand,
  onViewProfile,
  onAskQuestion,
  onBookCall,
  variant = 'default',
  isManaged = false,
}: ExpertCardProps) {
  const [imageError, setImageError] = useState(false);

  if (variant === 'featured') {
    return (
      <FeaturedExpertCard
        expert={expert}
        onViewProfile={onViewProfile}
        isManaged={isManaged}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <CompactExpertCard
        expert={expert}
        onViewProfile={onViewProfile}
        isManaged={isManaged}
      />
    );
  }

  return (
    <div
      className={`rounded-[20px] border transition-all ${
        isExpanded
          ? 'ring-1 ring-violet-200 border-violet-100/60 bg-white'
          : 'border-slate-100/60 bg-white hover:-translate-y-0.5'
      }`}
      style={{
        boxShadow: isExpanded
          ? '0 8px 40px -12px rgba(139, 92, 246, 0.15)'
          : '0 8px 40px -12px rgba(148, 163, 184, 0.15)',
      }}
    >
      {/* Collapsed Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-5 flex items-start gap-4 text-left"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden">
            {expert.photo && !imageError ? (
              <img
                src={expert.photo}
                alt={expert.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Users className="w-6 h-6" />
              </div>
            )}
          </div>
          {/* Availability dot */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getAvailabilityColor(
              expert.availability
            )}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-medium text-slate-900 truncate">
              {expert.name}
            </h3>
            {expert.isTopVoice && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                Top Voice
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2">{expert.title}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{expert.yearsExperience} yrs</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {expert.questionsAnswered}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
              {expert.rating}
            </span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className={`px-2 py-1 rounded-lg text-xs font-medium ${
              expert.availability === 'available'
                ? 'bg-emerald-50 text-emerald-700'
                : expert.availability === 'busy'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {getAvailabilityLabel(expert.availability)}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-300 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Specialty tags - always visible */}
      <div className="px-5 pb-4 flex flex-wrap gap-1.5">
        {expert.categories.slice(0, 4).map((category) => (
          <span
            key={category}
            className="px-2 py-1 rounded-lg text-xs bg-slate-50 text-slate-600"
          >
            {category}
          </span>
        ))}
        {expert.categories.length > 4 && (
          <span className="px-2 py-1 rounded-lg text-xs bg-slate-50 text-slate-400">
            +{expert.categories.length - 4}
          </span>
        )}
      </div>

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
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              {/* Bio */}
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {expert.bio}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div
                  className="bg-slate-50 rounded-[16px] p-3 text-center"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="text-lg font-medium text-slate-900">
                    {expert.yearsExperience}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Years
                  </div>
                </div>
                <div
                  className="bg-slate-50 rounded-[16px] p-3 text-center"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="text-lg font-medium text-slate-900">
                    {expert.questionsAnswered}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Answered
                  </div>
                </div>
                <div
                  className="bg-slate-50 rounded-[16px] p-3 text-center"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="text-lg font-medium text-slate-900 flex items-center justify-center gap-0.5">
                    {expert.rating}
                    <Star
                      className="w-3 h-3 text-amber-500"
                      fill="currentColor"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Rating
                  </div>
                </div>
                <div
                  className="bg-slate-50 rounded-[16px] p-3 text-center"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="text-lg font-medium text-slate-900">
                    {expert.responseTime}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Response
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {expert.recentActivity && expert.recentActivity.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Recent Activity</p>
                  <div className="space-y-1.5">
                    {expert.recentActivity.slice(0, 2).map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-600"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="truncate flex-1">{activity.title}</span>
                        <span className="text-slate-400 flex-shrink-0">
                          {activity.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskQuestion?.();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask Question
                  {isManaged && (
                    <span className="text-violet-200 text-xs">(Free)</span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookCall?.();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Book Call
                  <span className="text-slate-400 text-xs">
                    {expert.rates.consultation}c
                  </span>
                </button>
              </div>

              {/* View Profile Link */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile?.();
                }}
                className="w-full mt-3 py-2 text-center text-sm text-violet-600 hover:text-violet-700 transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact variant for match results
function CompactExpertCard({
  expert,
  onViewProfile,
  isManaged,
}: {
  expert: ExpertProfile;
  onViewProfile?: () => void;
  isManaged?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onViewProfile}
      className="w-full p-4 rounded-[16px] border border-slate-100/60 bg-white text-left hover:-translate-y-0.5 transition-all"
      style={{
        boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
            {expert.photo && !imageError ? (
              <img
                src={expert.photo}
                alt={expert.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Users className="w-4 h-4" />
              </div>
            )}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(
              expert.availability
            )}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium text-slate-900 truncate">
              {expert.name}
            </h4>
            {expert.isTopVoice && (
              <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{expert.title}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
          {expert.rating}
        </div>
      </div>
    </button>
  );
}

// Featured variant for horizontal carousel
function FeaturedExpertCard({
  expert,
  onViewProfile,
  isManaged,
}: {
  expert: ExpertProfile;
  onViewProfile?: () => void;
  isManaged?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onViewProfile}
      className="flex-shrink-0 w-[160px] rounded-[20px] border border-slate-100/60 bg-white text-left hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg transition-all overflow-hidden group"
      style={{
        boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.15)',
      }}
    >
      {/* Avatar Section with overlay for badge */}
      <div className="relative pt-4 pb-3 px-4">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent" />

        {/* Top Voice badge - inline above avatar */}
        {expert.isTopVoice && (
          <div className="relative flex justify-center mb-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 flex items-center gap-1">
              <Award className="w-2.5 h-2.5" />
              Top Voice
            </span>
          </div>
        )}

        {/* Avatar with availability ring */}
        <div className="relative w-14 h-14 mx-auto">
          <div
            className={`absolute inset-0 rounded-full ${
              expert.availability === 'available'
                ? 'ring-2 ring-emerald-400 ring-offset-2'
                : expert.availability === 'busy'
                ? 'ring-2 ring-amber-400 ring-offset-2'
                : ''
            }`}
          />
          <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden">
            {expert.photo && !imageError ? (
              <img
                src={expert.photo}
                alt={expert.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Users className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-3 pb-3">
        <div className="text-center mb-2">
          <h4 className="text-[13px] font-medium text-slate-900 truncate leading-tight">
            {expert.name}
          </h4>
          <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
            {expert.title}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-0.5 font-medium">
            <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
            {expert.rating}
          </span>
          <span className="text-slate-200">|</span>
          <span>{expert.questionsAnswered} ans</span>
        </div>
      </div>

      {/* Availability Footer */}
      <div
        className={`py-2 text-center text-[10px] font-medium ${
          expert.availability === 'available'
            ? 'bg-emerald-50 text-emerald-600'
            : expert.availability === 'busy'
            ? 'bg-amber-50 text-amber-600'
            : 'bg-slate-50 text-slate-400'
        }`}
      >
        {getAvailabilityLabel(expert.availability)}
      </div>
    </button>
  );
}

export default ExpertCard;
