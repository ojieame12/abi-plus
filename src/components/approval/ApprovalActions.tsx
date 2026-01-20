// ApprovalActions - Approve/Deny action buttons and forms
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { UpgradeRequest } from '../../types/requests';
import { approveRequest, denyRequest } from '../../services/approvalService';

interface ApprovalActionsProps {
  request: UpgradeRequest;
  onActionComplete?: (action: 'approved' | 'denied', request: UpgradeRequest) => void;
  onError?: (error: Error) => void;
}

export function ApprovalActions({
  request,
  onActionComplete,
  onError,
}: ApprovalActionsProps) {
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [approveReason, setApproveReason] = useState('');
  const [showApproveNote, setShowApproveNote] = useState(false);
  const [isLoading, setIsLoading] = useState<'approve' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsLoading('approve');
    setError(null);
    try {
      await approveRequest(request.id, { reason: approveReason || undefined });
      onActionComplete?.('approved', { ...request, status: 'approved' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      setError('A reason is required when denying a request');
      return;
    }
    setIsLoading('deny');
    setError(null);
    try {
      await denyRequest(request.id, { reason: denyReason });
      onActionComplete?.('denied', { ...request, status: 'denied' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deny';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(null);
    }
  };

  if (request.status !== 'pending') {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]"
          >
            <AlertTriangle size={14} strokeWidth={1.5} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deny form */}
      <AnimatePresence>
        {showDenyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-100">
              <label className="block text-[13px] font-medium text-red-900 mb-2">
                Reason for denial (required)
              </label>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Please explain why this request is being denied..."
                rows={3}
                className="
                  w-full px-3 py-2 rounded-lg
                  bg-white border border-red-200
                  text-[13px] text-slate-700
                  placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300
                  resize-none
                "
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowDenyForm(false);
                    setDenyReason('');
                    setError(null);
                  }}
                  className="px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 transition-colors"
                  disabled={isLoading !== null}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeny}
                  disabled={isLoading !== null || !denyReason.trim()}
                  className="
                    flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                    bg-red-600 hover:bg-red-700
                    text-white text-[13px] font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  "
                >
                  {isLoading === 'deny' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Confirm Denial
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve note (optional) */}
      <AnimatePresence>
        {showApproveNote && !showDenyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <label className="block text-[13px] font-medium text-emerald-900 mb-2">
                Add a note (optional)
              </label>
              <textarea
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                placeholder="Any comments for the requester..."
                rows={2}
                className="
                  w-full px-3 py-2 rounded-lg
                  bg-white border border-emerald-200
                  text-[13px] text-slate-700
                  placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300
                  resize-none
                "
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {!showDenyForm && (
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApprove}
            disabled={isLoading !== null}
            className="
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              bg-emerald-600 hover:bg-emerald-700
              text-white text-[14px] font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors shadow-sm hover:shadow-md
            "
          >
            {isLoading === 'approve' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} strokeWidth={1.5} />
            )}
            Approve
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDenyForm(true)}
            disabled={isLoading !== null}
            className="
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              bg-white border border-slate-200
              text-slate-700 text-[14px] font-medium
              hover:bg-slate-50 hover:border-slate-300
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <XCircle size={16} strokeWidth={1.5} />
            Deny
          </motion.button>

          {/* Toggle note button */}
          <button
            onClick={() => setShowApproveNote(!showApproveNote)}
            className={`
              p-2.5 rounded-xl border transition-colors
              ${showApproveNote
                ? 'bg-violet-50 border-violet-200 text-violet-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }
            `}
            title="Add note"
          >
            <MessageSquare size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
