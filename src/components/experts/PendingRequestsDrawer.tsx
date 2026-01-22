// PendingRequestsDrawer - Review and respond to incoming engagement requests
// Matches CreditDrawer floating card aesthetic

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Inbox,
  MessageCircle,
  Video,
  FileText,
  Clock,
  Check,
  XIcon,
  Calendar,
  Building2,
  ChevronRight,
} from 'lucide-react';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

// Types for pending requests
export interface PendingRequest {
  id: string;
  type: 'quick_question' | 'deep_dive' | 'consultation' | 'custom';
  clientName: string;
  clientCompany: string;
  clientAvatar?: string;
  title: string;
  description: string;
  credits: number;
  submittedAt: string;
  urgency?: 'normal' | 'urgent';
  preferredDate?: string;
}

interface PendingRequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requests: PendingRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onViewDetails: (request: PendingRequest) => void;
}

// Icon and styling based on request type
function getRequestTypeInfo(type: PendingRequest['type']) {
  switch (type) {
    case 'quick_question':
      return { Icon: MessageCircle, label: 'Quick Question', color: 'text-violet-500', bg: 'bg-violet-50' };
    case 'deep_dive':
      return { Icon: FileText, label: 'Deep Dive', color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'consultation':
      return { Icon: Video, label: 'Consultation', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'custom':
      return { Icon: FileText, label: 'Custom Project', color: 'text-amber-500', bg: 'bg-amber-50' };
    default:
      return { Icon: MessageCircle, label: 'Request', color: 'text-slate-500', bg: 'bg-slate-50' };
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// Individual request card
function RequestCard({
  request,
  onAccept,
  onDecline,
  onViewDetails,
}: {
  request: PendingRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onViewDetails: (request: PendingRequest) => void;
}) {
  const { Icon, label, color, bg } = getRequestTypeInfo(request.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-[20px] bg-white border border-slate-100/60"
      style={{ boxShadow: cardShadow }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
            {request.urgency === 'urgent' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-500">
                Urgent
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-slate-700">{request.title}</h4>
        </div>
        <span className="text-[10px] text-slate-400 flex-shrink-0">
          {formatTimeAgo(request.submittedAt)}
        </span>
      </div>

      {/* Client info */}
      <div className="flex items-center gap-2 mb-3">
        {request.clientAvatar ? (
          <img
            src={request.clientAvatar}
            alt={request.clientName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-medium">
            {request.clientName[0]}
          </div>
        )}
        <span className="text-xs text-slate-600">{request.clientName}</span>
        <span className="text-slate-200">•</span>
        <span className="text-xs text-slate-400">{request.clientCompany}</span>
      </div>

      {/* Description preview */}
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
        {request.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-emerald-600">${request.credits}</span>
          {request.preferredDate && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(request.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDecline(request.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Decline"
          >
            <XIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAccept(request.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
            title="Accept"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewDetails(request)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function PendingRequestsDrawer({
  isOpen,
  onClose,
  requests,
  onAccept,
  onDecline,
  onViewDetails,
}: PendingRequestsDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#fafafa] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="requests-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-slate-50 to-orange-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-white/60">
                      <Inbox className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 id="requests-drawer-title" className="text-lg font-medium text-slate-700">
                          Pending Requests
                        </h2>
                        {requests.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-medium">
                            {requests.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Review incoming requests</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close requests drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-slate-600 mb-1">No pending requests</h3>
                  <p className="text-sm text-slate-400">
                    New client requests will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {requests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <RequestCard
                        request={request}
                        onAccept={onAccept}
                        onDecline={onDecline}
                        onViewDetails={onViewDetails}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {requests.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Requests expire after 48 hours
                  </span>
                  <button className="text-violet-500 hover:text-violet-600 font-medium">
                    View History
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PendingRequestsDrawer;
