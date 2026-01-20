// ApprovalQueue - Display pending approval requests for approvers
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckSquare,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { RequestCard } from './RequestCard';
import { ApprovalActions } from './ApprovalActions';
import type { UpgradeRequest } from '../../types/requests';
import { getApprovalQueue } from '../../services/approvalService';

interface ApprovalQueueProps {
  onRequestClick?: (request: UpgradeRequest) => void;
  onActionComplete?: (action: 'approved' | 'denied', request: UpgradeRequest) => void;
}

export function ApprovalQueue({
  onRequestClick,
  onActionComplete,
}: ApprovalQueueProps) {
  const [pending, setPending] = useState<UpgradeRequest[]>([]);
  const [nearingEscalation, setNearingEscalation] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getApprovalQueue();
      setPending(result.pending);
      setNearingEscalation(result.nearingEscalation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approval queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleActionComplete = (action: 'approved' | 'denied', request: UpgradeRequest) => {
    // Remove from pending list
    setPending((prev) => prev.filter((r) => r.id !== request.id));
    setNearingEscalation((prev) => prev.filter((r) => r.id !== request.id));
    setExpandedId(null);
    onActionComplete?.(action, request);
  };

  const urgentCount = nearingEscalation.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[15px] font-medium text-[#1d1d1f]">
            Approval Queue
          </h3>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[12px] font-medium">
              {pending.length} pending
            </span>
          )}
        </div>

        <button
          onClick={fetchQueue}
          disabled={isLoading}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} strokeWidth={1.5} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50 border border-orange-100"
        >
          <div className="p-2 rounded-lg bg-orange-100">
            <Clock size={16} strokeWidth={1.5} className="text-orange-600 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-orange-900">
              {urgentCount} request{urgentCount > 1 ? 's' : ''} nearing escalation
            </p>
            <p className="text-[12px] text-orange-600">
              Please review soon to avoid automatic escalation
            </p>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && pending.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-[13px] text-red-600">{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && pending.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
            <CheckSquare size={24} strokeWidth={1.5} className="text-emerald-600" />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">
            All caught up!
          </p>
          <p className="text-[13px] text-slate-400">
            No pending requests require your approval
          </p>
        </motion.div>
      )}

      {/* Request list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {pending.map((request, index) => {
            const isExpanded = expandedId === request.id;
            const isUrgent = nearingEscalation.some((r) => r.id === request.id);

            return (
              <motion.div
                key={request.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`
                  rounded-[1.25rem] overflow-hidden
                  ${isUrgent ? 'ring-2 ring-orange-200' : ''}
                `}
              >
                <RequestCard
                  request={request}
                  showRequester
                  onClick={() => {
                    if (onRequestClick) {
                      onRequestClick(request);
                    } else {
                      setExpandedId(isExpanded ? null : request.id);
                    }
                  }}
                />

                {/* Inline approval actions */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 -mt-2 pt-4 bg-white/80 backdrop-blur-xl border-t border-slate-100/60">
                        <ApprovalActions
                          request={request}
                          onActionComplete={handleActionComplete}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
