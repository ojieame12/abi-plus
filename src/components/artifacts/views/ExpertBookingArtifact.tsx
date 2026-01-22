// ExpertBookingArtifact - Booking flow for expert engagements
// Handles both question submissions and consultation scheduling

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MessageCircle,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Users,
} from 'lucide-react';
import type { ExpertProfile, ExpertBooking, EngagementTier } from '../../../types/expertMarketplace';
import { getEngagementTierConfig } from '../../../types/expertMarketplace';
import { getMockAvailableSlots } from '../../../services/expertMarketplaceService';

interface ExpertBookingArtifactProps {
  expert: ExpertProfile;
  engagementType: 'quick_question' | 'deep_dive' | 'consultation';
  onBack: () => void;
  onComplete: (booking: ExpertBooking) => void;
  isManaged?: boolean;
  initialQuestion?: string;
}

type BookingStep = 'type' | 'details' | 'schedule' | 'confirm' | 'success';

export function ExpertBookingArtifact({
  expert,
  engagementType,
  onBack,
  onComplete,
  isManaged = false,
  initialQuestion = '',
}: ExpertBookingArtifactProps) {
  const [step, setStep] = useState<BookingStep>(engagementType === 'consultation' ? 'schedule' : 'details');
  const [question, setQuestion] = useState(initialQuestion);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const tierConfig = getEngagementTierConfig(engagementType as EngagementTier);

  // Get credits cost
  const creditsCost = useMemo(() => {
    if (isManaged && engagementType === 'quick_question') return 0;
    switch (engagementType) {
      case 'quick_question':
        return expert.rates.quickQuestion;
      case 'deep_dive':
        return expert.rates.deepDive;
      case 'consultation':
        return expert.rates.consultation;
      default:
        return 0;
    }
  }, [engagementType, expert.rates, isManaged]);

  // Generate date options for next 7 days
  const dateOptions = useMemo(() => {
    const dates: { date: string; display: string; dayName: string }[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return dates;
  }, []);

  // Get available slots for selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    return getMockAvailableSlots(expert.id, selectedDate);
  }, [expert.id, selectedDate]);

  // Handle submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const booking: ExpertBooking = {
      id: `booking-${Date.now()}`,
      expertId: expert.id,
      engagementType: engagementType as EngagementTier,
      status: 'pending',
      scheduledAt: selectedSlot
        ? `${selectedDate}T${availableSlots.find((s) => s.id === selectedSlot)?.time}`
        : undefined,
      question: question || undefined,
      notes: notes || undefined,
      creditsCharged: creditsCost,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(false);
    setStep('success');

    // Notify parent after success animation
    setTimeout(() => {
      onComplete(booking);
    }, 2000);
  };

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
        <div className="flex-1">
          <h2 className="text-sm font-medium text-slate-900">{tierConfig.label}</h2>
          <p className="text-xs text-slate-500">with {expert.name}</p>
        </div>
        {/* Credits badge */}
        <div className="px-3 py-1 rounded-lg bg-violet-50 text-violet-700 text-sm font-medium">
          {creditsCost === 0 ? 'Free' : `${creditsCost} credits`}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {/* Question/Details Step */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              {/* Expert mini card */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                  {expert.photo && !imageError ? (
                    <img
                      src={expert.photo}
                      alt={expert.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{expert.name}</p>
                  <p className="text-xs text-slate-500">{expert.title}</p>
                </div>
              </div>

              {/* Question input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    engagementType === 'quick_question'
                      ? 'e.g., What are the key factors driving steel prices in Q2 2025?'
                      : 'e.g., I need a comprehensive analysis of aluminum market dynamics including supply/demand forecasts...'
                  }
                  className="w-full h-32 p-4 rounded-xl bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {engagementType === 'quick_question'
                    ? 'Be specific for faster, more accurate responses.'
                    : 'Provide context for a more comprehensive analysis.'}
                </p>
              </div>

              {/* Additional notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any relevant background or specific areas you'd like covered..."
                  className="w-full h-20 p-4 rounded-xl bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none transition-all"
                />
              </div>

              {/* Response time info */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl mb-6">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Expected response: {expert.responseTime}
                  </p>
                  <p className="text-xs text-blue-700">
                    {engagementType === 'quick_question'
                      ? 'You\'ll receive a focused answer via email and in-app notification.'
                      : 'You\'ll receive a detailed analysis document.'}
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!question.trim() || isSubmitting}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  question.trim() && !isSubmitting
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Submit Question
                    {creditsCost > 0 && (
                      <span className="text-violet-200">({creditsCost} credits)</span>
                    )}
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Schedule Step (for consultations) */}
          {step === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              {/* Expert mini card */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                  {expert.photo && !imageError ? (
                    <img
                      src={expert.photo}
                      alt={expert.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{expert.name}</p>
                  <p className="text-xs text-slate-500">30-minute video call</p>
                </div>
              </div>

              {/* Date selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select a Date
                </label>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.date}
                      onClick={() => {
                        setSelectedDate(opt.date);
                        setSelectedSlot(null);
                      }}
                      className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all ${
                        selectedDate === opt.date
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wide opacity-75">
                        {opt.dayName}
                      </div>
                      <div className="text-sm font-medium">{opt.display}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Select a Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => slot.available && setSelectedSlot(slot.id)}
                        disabled={!slot.available}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                          selectedSlot === slot.id
                            ? 'bg-violet-600 text-white'
                            : slot.available
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    All times shown in your local timezone
                  </p>
                </div>
              )}

              {/* Briefing notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Briefing Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Topics you'd like to cover, specific questions, or context that would help the expert prepare..."
                  className="w-full h-24 p-4 rounded-xl bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none transition-all"
                />
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Before you book</p>
                  <p className="text-xs text-amber-700 mt-1">
                    You'll receive a calendar invite and video link once confirmed.
                    Cancellations are free up to 24 hours before the call.
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedSlot || isSubmitting}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  selectedSlot && !isSubmitting
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Confirm Booking
                    <span className="text-violet-200">({creditsCost} credits)</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 flex flex-col items-center justify-center min-h-[400px]"
            >
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Check className="w-10 h-10 text-emerald-600" />
                </motion.div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-medium text-slate-900 mb-2 text-center"
              >
                {engagementType === 'consultation' ? 'Booking Confirmed!' : 'Question Submitted!'}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-slate-500 text-center mb-6 max-w-xs"
              >
                {engagementType === 'consultation'
                  ? `Your call with ${expert.name} has been scheduled. You'll receive a calendar invite shortly.`
                  : `Your question has been sent to ${expert.name}. Expected response time: ${expert.responseTime}`}
              </motion.p>

              {/* Summary card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
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
                  <div>
                    <p className="text-sm font-medium text-slate-900">{expert.name}</p>
                    <p className="text-xs text-slate-500">{tierConfig.label}</p>
                  </div>
                </div>

                {selectedDate && selectedSlot && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {dateOptions.find((d) => d.date === selectedDate)?.display} at{' '}
                    {availableSlots.find((s) => s.id === selectedSlot)?.time}
                  </div>
                )}

                {creditsCost > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                    <span className="text-sm text-slate-500">Credits charged</span>
                    <span className="text-sm font-medium text-slate-900">{creditsCost}</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ExpertBookingArtifact;
