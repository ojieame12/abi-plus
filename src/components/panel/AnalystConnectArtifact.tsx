// AnalystConnectArtifact - Layer 2: Quick validation from Beroe analysts
// Redesign: Card Continuity — matches DeeperAnalysisArtifact card language
// Single rounded-3xl card on #fafafa canvas, mini-card engagement selector

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  Check,
  Briefcase,
  ChevronRight,
  Video,
} from 'lucide-react';
import type { AnalystConnectAction } from '../../types/aiResponse';

interface AnalystConnectArtifactProps {
  analystConnect: AnalystConnectAction;
  queryContext?: {
    queryId?: string;
    queryText?: string;
    relevantSection?: string;
  };
  onScheduleCall?: (analystId: string, slot: string) => void;
  onSendQuestion?: (analystId: string, question: string) => void;
}

// Mock available time slots
const MOCK_TIME_SLOTS = [
  { id: 'slot_1', label: 'Today, 2:00 PM', available: true },
  { id: 'slot_2', label: 'Today, 4:30 PM', available: true },
  { id: 'slot_3', label: 'Tomorrow, 10:00 AM', available: true },
  { id: 'slot_4', label: 'Tomorrow, 2:00 PM', available: false },
  { id: 'slot_5', label: 'Wed, 11:00 AM', available: true },
];

type EngagementMode = 'schedule' | 'question';

export const AnalystConnectArtifact = ({
  analystConnect,
  queryContext,
  onScheduleCall,
  onSendQuestion,
}: AnalystConnectArtifactProps) => {
  const { analyst } = analystConnect;
  const [activeMode, setActiveMode] = useState<EngagementMode | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!analyst) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-full flex items-center justify-center">
        <p className="text-slate-500">No analyst available at this time.</p>
      </div>
    );
  }

  const handleSchedule = () => {
    if (selectedSlot) {
      onScheduleCall?.(analyst.id, selectedSlot);
      setIsSubmitted(true);
    }
  };

  const handleSendQuestion = () => {
    if (question.trim()) {
      onSendQuestion?.(analyst.id, question);
      setIsSubmitted(true);
    }
  };

  // Success state — spring-animated teal circle (matches ExpertBookingArtifact pattern)
  if (isSubmitted) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-100/80 p-8 flex flex-col items-center max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Check className="w-8 h-8 text-teal-600" />
            </motion.div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg font-medium text-slate-900 mb-2 text-center"
          >
            {activeMode === 'schedule' ? 'Call Scheduled!' : 'Question Sent!'}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-slate-500 text-center mb-6"
          >
            {activeMode === 'schedule'
              ? `Your call with ${analyst.name} has been scheduled. You'll receive a calendar invite shortly.`
              : `${analyst.name} will review your question and respond within ${analyst.responseTime}.`}
          </motion.p>

          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full p-4 bg-slate-50/50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              {analyst.photo ? (
                <img
                  src={analyst.photo}
                  alt={analyst.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-teal-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-900">{analyst.name}</p>
                <p className="text-xs text-slate-500">
                  {activeMode === 'schedule' ? 'Video Call' : 'Async Question'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fafafa] min-h-full">
      {/* Single card container — matches DeeperAnalysisArtifact card style */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-3xl border border-slate-100/80 overflow-hidden"
      >
        {/* Analyst Profile Header */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
          <div className="flex items-start gap-4">
            {analyst.photo ? (
              <img
                src={analyst.photo}
                alt={analyst.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-teal-200 flex items-center justify-center border-2 border-white shadow-sm">
                <UserCircle className="w-9 h-9 text-teal-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900">{analyst.name}</h3>
                <span className="px-2 py-0.5 bg-teal-600 text-white text-[10px] font-medium rounded uppercase">
                  Beroe
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{analyst.title}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <Briefcase className="w-3.5 h-3.5" />
                  {analyst.specialty}
                </span>
                <span className={`flex items-center gap-1 ${
                  analyst.availability === 'available' ? 'text-green-600' :
                  analyst.availability === 'busy' ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    analyst.availability === 'available' ? 'bg-green-500' :
                    analyst.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                  {analyst.availability === 'available' ? 'Available' :
                   analyst.availability === 'busy' ? 'Busy' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 space-y-5">
          {/* Query Context — elevated above the engagement choice */}
          {queryContext?.queryText && (
            <div className="bg-slate-50/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1.5">Your question</p>
              <p className="text-sm text-slate-700 leading-relaxed">"{queryContext.queryText}"</p>
            </div>
          )}

          {/* Engagement Mode Selector — two mini-cards */}
          <div>
            <p className="text-xs text-slate-400 mb-3">How would you like to connect?</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Schedule Call card */}
              <button
                onClick={() => setActiveMode('schedule')}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  activeMode === 'schedule'
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                  activeMode === 'schedule' ? 'bg-teal-100' : 'bg-slate-100'
                }`}>
                  <Video className={`w-4.5 h-4.5 ${
                    activeMode === 'schedule' ? 'text-teal-600' : 'text-slate-500'
                  }`} />
                </div>
                <p className={`text-sm font-medium mb-0.5 ${
                  activeMode === 'schedule' ? 'text-teal-700' : 'text-slate-900'
                }`}>
                  Schedule Call
                </p>
                <p className="text-xs text-slate-400">30 min, via video</p>
              </button>

              {/* Send Question card */}
              <button
                onClick={() => setActiveMode('question')}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  activeMode === 'question'
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                  activeMode === 'question' ? 'bg-teal-100' : 'bg-slate-100'
                }`}>
                  <MessageSquare className={`w-4.5 h-4.5 ${
                    activeMode === 'question' ? 'text-teal-600' : 'text-slate-500'
                  }`} />
                </div>
                <p className={`text-sm font-medium mb-0.5 ${
                  activeMode === 'question' ? 'text-teal-700' : 'text-slate-900'
                }`}>
                  Send Question
                </p>
                <p className="text-xs text-slate-400">Reply in {analyst.responseTime}</p>
              </button>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <AnimatePresence mode="wait">
            {activeMode === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Select a time</p>
                  <div className="space-y-2">
                    {MOCK_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => slot.available && setSelectedSlot(slot.id)}
                        disabled={!slot.available}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          selectedSlot === slot.id
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : slot.available
                            ? 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                            : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          {slot.label}
                        </span>
                        {selectedSlot === slot.id && (
                          <Check className="w-4 h-4 text-teal-600" />
                        )}
                        {!slot.available && (
                          <span className="text-xs text-slate-400">Unavailable</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSchedule}
                    disabled={!selectedSlot}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      selectedSlot
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Confirm Booking
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeMode === 'question' && (
              <motion.div
                key="question"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Your question for {analyst.name.split(' ')[0]}</p>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={`What would you like to ask ${analyst.name.split(' ')[0]}?`}
                    className="w-full h-28 px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none text-sm placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleSendQuestion}
                    disabled={!question.trim()}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      question.trim()
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Send Question
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalystConnectArtifact;
