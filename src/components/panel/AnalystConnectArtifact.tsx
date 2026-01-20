// AnalystConnectArtifact - Layer 2: Quick validation from Beroe analysts
// Allows users to schedule a call or send a question to a matched analyst

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  Check,
  Briefcase,
  ChevronRight,
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

export const AnalystConnectArtifact = ({
  analystConnect,
  queryContext,
  onScheduleCall,
  onSendQuestion,
}: AnalystConnectArtifactProps) => {
  const { analyst } = analystConnect;
  const [activeTab, setActiveTab] = useState<'schedule' | 'question'>('schedule');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!analyst) {
    return (
      <div className="p-6 text-center text-slate-500">
        No analyst available at this time.
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

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 flex flex-col items-center justify-center min-h-[400px]"
      >
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {activeTab === 'schedule' ? 'Call Scheduled!' : 'Question Sent!'}
        </h3>
        <p className="text-slate-600 text-center max-w-sm">
          {activeTab === 'schedule'
            ? `Your call with ${analyst.name} has been scheduled. You'll receive a calendar invite shortly.`
            : `${analyst.name} will review your question and respond within ${analyst.responseTime}.`}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Analyst Profile Card */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-100">
        <div className="flex items-start gap-4">
          {analyst.photo ? (
            <img
              src={analyst.photo}
              alt={analyst.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-teal-200 flex items-center justify-center border-2 border-white shadow-sm">
              <UserCircle className="w-10 h-10 text-teal-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{analyst.name}</h3>
              <span className="px-2 py-0.5 bg-teal-600 text-white text-[10px] font-semibold rounded uppercase">
                Beroe
              </span>
            </div>
            <p className="text-sm text-slate-600">{analyst.title}</p>
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

        {/* Response time indicator */}
        <div className="mt-4 pt-4 border-t border-teal-100 flex items-center justify-between">
          <span className="text-sm text-slate-600">Typical response time</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-teal-700">
            <Clock className="w-4 h-4" />
            {analyst.responseTime}
          </span>
        </div>
      </div>

      {/* Query Context (if provided) */}
      {queryContext?.queryText && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Related to your question:</p>
          <p className="text-sm text-slate-700 italic">"{queryContext.queryText}"</p>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'schedule'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedule Call
        </button>
        <button
          onClick={() => setActiveTab('question')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'question'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Send Question
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' ? (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-900">Select a time slot</h4>
          <div className="space-y-2">
            {MOCK_TIME_SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && setSelectedSlot(slot.id)}
                disabled={!slot.available}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                  selectedSlot === slot.id
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : slot.available
                    ? 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
                    : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-2">
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
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
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
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-900">Your question</h4>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`What would you like to ask ${analyst.name.split(' ')[0]}?`}
            className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none text-sm"
          />
          <button
            onClick={handleSendQuestion}
            disabled={!question.trim()}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              question.trim()
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Send Question
          </button>
          <p className="text-xs text-slate-500 text-center">
            {analyst.name} typically responds within {analyst.responseTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalystConnectArtifact;
