// ApprovalWorkflowView - Queue for pending approval requests
// Shown to users with approver/admin roles

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  ChevronRight,
  User,
  Coins,
  FileText,
  Phone,
  Users,
  Briefcase,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { UpgradeRequest, RequestStatus } from '../types/requests';
import {
  getRequestStatusDisplay,
  getRequestTypeDisplay,
  getApprovalLevelDisplay,
} from '../types/requests';
import { formatCredits } from '../types/subscription';
import {
  getRequests,
  approveRequest,
  denyRequest,
} from '../services/approvalService';

const REQUEST_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  analyst_qa: MessageSquare,
  analyst_call: Phone,
  report_upgrade: FileText,
  expert_consult: Users,
  expert_deepdive: Briefcase,
  bespoke_project: Briefcase,
};

interface ApprovalWorkflowViewProps {
  onBack: () => void;
  userRole?: 'admin' | 'approver' | 'user';
}

type FilterTab = 'pending' | 'all';

export function ApprovalWorkflowView({ onBack, userRole = 'approver' }: ApprovalWorkflowViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch requests from API
  const fetchRequests = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      // Fetch requests - role determines which queue (admin/approver both see approver queue)
      // The canApprove() function handles permission checking based on userRole
      const response = await getRequests({ role: 'approver', limit: 100 });
      setRequests(response.requests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Get pending requests from fetched data
  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === 'pending');
  }, [requests]);

  // Filter requests based on tab
  const filteredRequests = useMemo(() => {
    if (activeTab === 'pending') {
      return pendingRequests;
    }
    return requests;
  }, [activeTab, requests, pendingRequests]);

  // Group pending requests by approval level
  const pendingByLevel = useMemo(() => {
    return {
      approver: pendingRequests.filter(r => r.approvalLevel === 'approver'),
      admin: pendingRequests.filter(r => r.approvalLevel === 'admin'),
    };
  }, [pendingRequests]);

  // Handle approve action - calls real API
  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await approveRequest(requestId);
      setSelectedRequest(null);
      // Refresh the list to get updated status
      await fetchRequests(true);
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle deny action with reason - calls real API
  const handleDeny = async (requestId: string, reason: string) => {
    try {
      setActionLoading(requestId);
      await denyRequest(requestId, { reason });
      setSelectedRequest(null);
      // Refresh the list to get updated status
      await fetchRequests(true);
    } catch (err) {
      console.error('Error denying request:', err);
      setError(err instanceof Error ? err.message : 'Failed to deny request');
    } finally {
      setActionLoading(null);
    }
  };

  const canApprove = (request: UpgradeRequest): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'approver' && request.approvalLevel === 'approver') return true;
    return false;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-primary">Approval Queue</h1>
              <p className="text-sm text-secondary">
                Review and approve upgrade requests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => fetchRequests(true)}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Pending Count Badge */}
            {pendingRequests.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {pendingRequests.length} pending
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-slate-100 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-secondary hover:bg-slate-200'
            }`}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-secondary hover:bg-slate-200'
            }`}
          >
            All Requests
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Request List */}
        <div className={`flex-1 overflow-y-auto ${selectedRequest ? 'hidden lg:block lg:w-1/2 lg:border-r lg:border-slate-100' : ''}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
              <p className="text-sm text-secondary">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">All caught up!</h3>
              <p className="text-sm text-secondary">No pending requests to review.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Admin-level requests (if any) */}
              {activeTab === 'pending' && pendingByLevel.admin.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      Requires Admin Approval
                    </span>
                  </div>
                  {pendingByLevel.admin.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      isSelected={selectedRequest?.id === request.id}
                      canApprove={canApprove(request)}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ))}
                </div>
              )}

              {/* Approver-level requests */}
              {activeTab === 'pending' && pendingByLevel.approver.length > 0 && (
                <div>
                  <div className="px-2 mb-2">
                    <span className="text-xs font-medium text-muted uppercase tracking-wide">
                      Team Approver Review
                    </span>
                  </div>
                  {pendingByLevel.approver.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      isSelected={selectedRequest?.id === request.id}
                      canApprove={canApprove(request)}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ))}
                </div>
              )}

              {/* All requests tab */}
              {activeTab === 'all' && filteredRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedRequest?.id === request.id}
                  canApprove={canApprove(request)}
                  onClick={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Request Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedRequest && (
            <motion.div
              key={selectedRequest.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full lg:w-1/2 overflow-y-auto bg-slate-50/50"
            >
              <RequestDetailPanel
                request={selectedRequest}
                canApprove={canApprove(selectedRequest)}
                isActionLoading={actionLoading === selectedRequest.id}
                onClose={() => setSelectedRequest(null)}
                onApprove={() => handleApprove(selectedRequest.id)}
                onDeny={(reason) => handleDeny(selectedRequest.id, reason)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Request Card Component
interface RequestCardProps {
  request: UpgradeRequest;
  isSelected: boolean;
  canApprove: boolean;
  onClick: () => void;
}

function RequestCard({ request, isSelected, canApprove, onClick }: RequestCardProps) {
  const statusDisplay = getRequestStatusDisplay(request.status);
  const typeDisplay = getRequestTypeDisplay(request.type);
  const TypeIcon = REQUEST_TYPE_ICONS[request.type] || FileText;

  const timeAgo = getTimeAgo(request.createdAt);
  const isPending = request.status === 'pending';

  return (
    <motion.button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all mb-2 ${
        isSelected
          ? 'bg-violet-50 border-2 border-violet-200'
          : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm'
      }`}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl ${statusDisplay.bgColor}`}>
          <TypeIcon className={`w-5 h-5 ${statusDisplay.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-primary truncate">{request.title}</h3>
              <p className="text-xs text-secondary mt-0.5">{typeDisplay.label}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
          </div>

          {/* Requester & Meta */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              {request.requesterAvatar ? (
                <img
                  src={request.requesterAvatar}
                  alt={request.requesterName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs text-secondary">{request.requesterName}</span>
            </div>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted">{timeAgo}</span>
          </div>

          {/* Status & Cost */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                {statusDisplay.label}
              </span>
              {/* Visual indicator for canApprove */}
              {isPending && canApprove && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                  Can approve
                </span>
              )}
              {isPending && !canApprove && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                  Admin only
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Coins className="w-3.5 h-3.5 text-violet-500" />
              <span className="font-medium text-primary tabular-nums">
                {formatCredits(request.estimatedCredits)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Request Detail Panel
interface RequestDetailPanelProps {
  request: UpgradeRequest;
  canApprove: boolean;
  isActionLoading?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onDeny: (reason: string) => void;
}

function RequestDetailPanel({ request, canApprove, isActionLoading, onClose, onApprove, onDeny }: RequestDetailPanelProps) {
  const [denyReason, setDenyReason] = useState('');
  const [showDenyForm, setShowDenyForm] = useState(false);

  const statusDisplay = getRequestStatusDisplay(request.status);
  const typeDisplay = getRequestTypeDisplay(request.type);
  const TypeIcon = REQUEST_TYPE_ICONS[request.type] || FileText;

  const isPending = request.status === 'pending';

  return (
    <div className="p-6">
      {/* Close button (mobile) */}
      <button
        onClick={onClose}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white mb-4"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-xl ${statusDisplay.bgColor}`}>
            <TypeIcon className={`w-6 h-6 ${statusDisplay.color}`} />
          </div>
          <div>
            <h2 className="text-xl font-medium text-primary">{request.title}</h2>
            <p className="text-sm text-secondary mt-1">{typeDisplay.label}</p>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`mb-6 p-4 rounded-xl ${statusDisplay.bgColor}`}>
        <div className="flex items-center justify-between">
          <span className={`font-medium ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
          {isPending && (
            <span className="text-xs text-slate-500">
              {getApprovalLevelDisplay(request.approvalLevel)}
            </span>
          )}
        </div>
        {request.denialReason && (
          <p className="text-sm text-red-600 mt-2">{request.denialReason}</p>
        )}
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
          Request Details
        </h3>
        <p className="text-sm text-secondary leading-relaxed">{request.description}</p>
      </div>

      {/* Context */}
      {request.context && (
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-100">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Context
          </h3>
          {request.context.categoryName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary">Category:</span>
              <span className="font-medium text-primary">{request.context.categoryName}</span>
            </div>
          )}
          {request.context.reportTitle && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-secondary">Report:</span>
              <span className="font-medium text-primary">{request.context.reportTitle}</span>
            </div>
          )}
          {request.context.queryText && (
            <div className="mt-2">
              <span className="text-xs text-muted">Original query:</span>
              <p className="text-sm text-secondary italic mt-1">"{request.context.queryText}"</p>
            </div>
          )}
        </div>
      )}

      {/* Requester Info */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-slate-100">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
          Requested By
        </h3>
        <div className="flex items-center gap-3">
          {request.requesterAvatar ? (
            <img
              src={request.requesterAvatar}
              alt={request.requesterName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-primary">{request.requesterName}</p>
            <p className="text-xs text-secondary">{request.teamName}</p>
          </div>
        </div>
        <p className="text-xs text-muted mt-3">
          Requested {new Date(request.createdAt).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Cost */}
      <div className="mb-6 p-4 rounded-xl bg-violet-50 border border-violet-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-violet-700">Estimated Cost</span>
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-violet-600" />
            <span className="text-lg font-medium text-violet-700 tabular-nums">
              {formatCredits(request.estimatedCredits)}
            </span>
            <span className="text-sm text-violet-500">credits</span>
          </div>
        </div>
      </div>

      {/* Approval Actions */}
      {isPending && canApprove && (
        <div className="space-y-3">
          {!showDenyForm ? (
            <>
              <button
                onClick={onApprove}
                disabled={isActionLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isActionLoading ? 'Approving...' : 'Approve Request'}
              </button>
              <button
                onClick={() => setShowDenyForm(true)}
                disabled={isActionLoading}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 text-secondary hover:bg-slate-50 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Deny Request
              </button>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm font-medium text-red-700 mb-2">Reason for denial</p>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Provide a reason for denying this request..."
                className="w-full h-20 p-3 rounded-lg bg-white border border-red-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowDenyForm(false)}
                  disabled={isActionLoading}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-secondary text-sm font-medium hover:bg-white disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDeny(denyReason)}
                  disabled={!denyReason.trim() || isActionLoading}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Denying...
                    </>
                  ) : (
                    'Confirm Deny'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cannot Approve Message */}
      {isPending && !canApprove && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-sm text-secondary text-center">
            This request requires admin approval.
          </p>
        </div>
      )}

      {/* Fulfilled Request Info */}
      {request.status === 'fulfilled' && request.deliverables && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <h3 className="text-sm font-medium text-emerald-700 mb-2">Deliverables</h3>
          {request.deliverables.summary && (
            <p className="text-sm text-emerald-600">{request.deliverables.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
