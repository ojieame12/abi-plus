// AnalystMessageArtifact - Messaging view for contacting an analyst
// Soft, polished design with quick question pills and context from query

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock } from 'lucide-react';

interface Analyst {
  name: string;
  specialty: string;
  photo?: string;
  availability?: 'available' | 'busy' | 'offline';
  responseTime?: string;
}

interface AnalystMessageArtifactProps {
  analyst: Analyst;
  category: string;
  isManaged: boolean;
  queryContext?: string;
  credits: number;
  onSend: (message: string) => void;
  onBack: () => void;
}

// Quick question pills
const QUICK_QUESTIONS = [
  'Price outlook',
  'Top risks',
  'Key suppliers',
  'Alternatives',
];

export const AnalystMessageArtifact = ({
  analyst,
  category,
  isManaged,
  queryContext,
  credits,
  onSend,
  onBack,
}: AnalystMessageArtifactProps) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    onSend(message);
    setIsSuccess(true);
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(prev => {
      if (prev.trim()) {
        return `${prev}\n\nI'd like to know more about: ${question}`;
      }
      return `I'd like to understand the ${question.toLowerCase()} for ${category}.`;
    });
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center bg-[#fafafa]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5"
        >
          <Check className="w-8 h-8 text-emerald-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-slate-900 mb-2">Message Sent</h3>
          <p className="text-sm text-slate-500 mb-2 max-w-[280px]">
            Your question has been sent to {analyst.name}.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Expected response: {analyst.responseTime || '~4 hours'}
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Back to Chat
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fafafa] min-h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Analyst card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <div className="flex items-start gap-4">
          {analyst.photo ? (
            <img
              src={analyst.photo}
              alt={analyst.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-xl font-medium text-slate-500">
                {analyst.name?.charAt(0) || 'A'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-medium text-slate-900">{analyst.name}</h3>
            <p className="text-sm text-slate-500">{analyst.specialty}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {analyst.availability === 'available' ? 'Available' :
                 analyst.availability === 'busy' ? 'Busy' : 'Offline'}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {analyst.responseTime || '~4 hours'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Managed category badge */}
      {isManaged && (
        <div className="bg-teal-50/80 rounded-2xl border border-teal-100/50 p-4 mb-4">
          <div className="flex items-center gap-2">
            <img src="/Check badge - Iconly Pro.svg" alt="" className="w-5 h-5" />
            <span className="text-sm text-teal-700">
              No credit cost - {category} is a managed category
            </span>
          </div>
        </div>
      )}

      {/* Query context */}
      {queryContext && (
        <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Context from your query</h4>
          <p className="text-sm text-slate-500 italic">"{queryContext}"</p>
        </div>
      )}

      {/* Message input */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Your question</h4>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Ask ${analyst.name.split(' ')[0]} about ${category}...`}
          className="w-full h-32 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
        />
      </div>

      {/* Quick questions */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Quick questions</h4>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              className="px-3 py-1.5 rounded-full bg-white border border-slate-100/80 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Credit info (if not managed) */}
      {!isManaged && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Cost</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-slate-600">{credits.toLocaleString()} credits</span>
              <img src="/Coins 1 - Iconly Pro.svg" alt="" className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={isSubmitting || !message.trim()}
        className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 text-white text-sm font-medium transition-colors"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
};

export default AnalystMessageArtifact;
