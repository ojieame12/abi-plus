// RequestDetail - Full detail view of a request with event timeline
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ArrowLeft,
  Coins,
  Calendar,
  User,
  Users,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RequestStatusBadge } from './RequestStatusBadge';
import { ApprovalActions } from './ApprovalActions';
import type { UpgradeRequest, ApprovalEvent, RequestWithEvents } from '../../types/requests';
import { getRequest, canCancel, cancelRequest } from '../../services/approvalService';
import { getRequestTypeDisplay } from '../../types/requests';
import { formatCredits } from '../../types/subscription';

interface RequestDetailProps {
  requestId: string;
  userId: string;
  userRole: 'user' | 'approver' | 'admin';
  onBack?: () => void;
  onActionComplete?: (action: 'approved' | 'denied' | 'cancelled', request: UpgradeRequest) => void;
}

const eventIcons: Record<string, typeof CheckCircle> = {
  created: FileText,
  submitted: Clock,
  auto_approved: CheckCircle,
  approved: CheckCircle,
  denied: XCircle,
  escalated: AlertTriangle,
  cancelled: Ban,
  expired: AlertTriangle,
  fulfilled: CheckCircle,
};

const eventColors: Record<string, string> = {
  created: 'text-slate-500 bg-slate-100',
  submitted: 'text-amber-600 bg-amber-50',
  auto_approved: 'text-emerald-600 bg-emerald-50',
  approved: 'text-emerald-600 bg-emerald-50',
  denied: 'text-red-600 bg-red-50',
  escalated: 'text-orange-600 bg-orange-50',
  cancelled: 'text-slate-500 bg-slate-100',
  expired: 'text-orange-600 bg-orange-50',
  fulfilled: 'text-emerald-600 bg-emerald-50',
};

export function RequestDetail({
  requestId,
  userId,
  userRole,
  onBack,
  onActionComplete,
}: RequestDetailProps) {
  const [data, setData] = useState<RequestWithEvents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRequest(requestId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load request');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [requestId]);

  const handleCancel = async () => {
    if (!data) return;
    setIsCancelling(true);
    try {
      await cancelRequest(data.request.id);
      const updated = { ...data.request, status: 'cancelled' as const };
      setData({ ...data, request: updated });
      onActionComplete?.('cancelled', updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
        {error || 'Request not found'}
      </div>
    );
  }

  const { request, events } = data;
  const typeInfo = getRequestTypeDisplay(request.type);
  const isRequester = request.requesterId === userId;
  const isApprover = request.approverId === userId;
  const canBeCancelled = canCancel(request, userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
              {typeInfo.label}
            </span>
            <RequestStatusBadge status={request.status} size="M" />
          </div>
          <h2 className="text-[18px] font-medium text-[#1d1d1f]">
            {request.title}
          </h2>
        </div>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-[1.25rem] bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]"
      >
        {/* Description */}
        {request.description && (
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            {request.description}
          </p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-[13px]">
            <Coins size={14} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-slate-500">Credits:</span>
            <span className="font-medium text-slate-700">
              {formatCredits(request.estimatedCredits)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <Calendar size={14} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-slate-500">Created:</span>
            <span className="font-medium text-slate-700">
              {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <User size={14} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-slate-500">Requester:</span>
            <span className="font-medium text-slate-700">
              {request.requesterName}
            </span>
          </div>
          {request.approverName && (
            <div className="flex items-center gap-2 text-[13px]">
              <Users size={14} strokeWidth={1.5} className="text-slate-400" />
              <span className="text-slate-500">Approver:</span>
              <span className="font-medium text-slate-700">
                {request.approverName}
              </span>
            </div>
          )}
        </div>

        {/* Context info */}
        {request.context && (
          <div className="p-3 rounded-lg bg-slate-50/60 border border-slate-100 mb-4">
            <p className="text-[12px] font-medium text-slate-500 mb-1">Context</p>
            {request.context.reportTitle && (
              <p className="text-[13px] text-slate-600">
                Related to: {request.context.reportTitle}
              </p>
            )}
            {request.context.queryText && (
              <p className="text-[13px] text-slate-500 italic mt-1">
                "{request.context.queryText}"
              </p>
            )}
          </div>
        )}

        {/* Decision reason */}
        {(request.approvalNote || request.denialReason) && (
          <div className={`
            p-3 rounded-lg border mb-4
            ${request.denialReason ? 'bg-red-50/60 border-red-100' : 'bg-emerald-50/60 border-emerald-100'}
          `}>
            <p className={`text-[12px] font-medium mb-1 ${request.denialReason ? 'text-red-600' : 'text-emerald-600'}`}>
              {request.denialReason ? 'Denial Reason' : 'Approval Note'}
            </p>
            <p className="text-[13px] text-slate-600">
              {request.denialReason || request.approvalNote}
            </p>
          </div>
        )}

        {/* Approval actions (for approvers on pending requests) */}
        {request.status === 'pending' && (isApprover || userRole === 'admin') && (
          <div className="pt-4 border-t border-slate-100/60">
            <ApprovalActions
              request={request}
              onActionComplete={(action, updated) => {
                setData({ ...data, request: updated });
                onActionComplete?.(action, updated);
              }}
            />
          </div>
        )}

        {/* Cancel button (for requesters) */}
        {canBeCancelled && isRequester && (
          <div className="pt-4 border-t border-slate-100/60">
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Ban size={14} strokeWidth={1.5} />
              )}
              Cancel Request
            </button>
          </div>
        )}
      </motion.div>

      {/* Event timeline */}
      <div className="space-y-2">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-700"
        >
          {showTimeline ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Activity Timeline ({events.length} events)
        </button>

        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pl-4 space-y-3 border-l-2 border-slate-200">
                {events.map((event, index) => (
                  <EventItem key={event.id} event={event} delay={index * 0.05} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EventItem({ event, delay }: { event: ApprovalEvent; delay: number }) {
  const Icon = eventIcons[event.eventType] || Clock;
  const colorClass = eventColors[event.eventType] || 'text-slate-500 bg-slate-100';
  const [textColor, bgColor] = colorClass.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="relative flex items-start gap-3"
    >
      <div className={`absolute -left-[1.4rem] w-3 h-3 rounded-full ${bgColor} border-2 border-white`} />
      <div className={`p-1.5 rounded-lg ${bgColor}`}>
        <Icon size={14} strokeWidth={1.5} className={textColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-700 capitalize">
          {event.eventType.replace('_', ' ')}
        </p>
        {event.reason && (
          <p className="text-[12px] text-slate-500 mt-0.5">
            {event.reason}
          </p>
        )}
        <p className="text-[11px] text-slate-400 mt-1">
          {new Date(event.createdAt).toLocaleString()}
          {!event.performedBySystem && event.performedBy && ' • by user'}
        </p>
      </div>
    </motion.div>
  );
}
