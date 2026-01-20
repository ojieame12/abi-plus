// RequestList - Display a list of upgrade requests for the requester
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Inbox,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { RequestCard } from './RequestCard';
import type { UpgradeRequest, RequestStatus } from '../../types/requests';
import { getRequests } from '../../services/approvalService';

interface RequestListProps {
  onRequestClick?: (request: UpgradeRequest) => void;
  initialStatus?: RequestStatus[];
}

const STATUS_FILTERS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'fulfilled', label: 'Completed' },
  { value: 'denied', label: 'Denied' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function RequestList({
  onRequestClick,
  initialStatus = [],
}: RequestListProps) {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>(
    initialStatus.length === 1 ? initialStatus[0] : 'all'
  );

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = statusFilter === 'all' ? undefined : [statusFilter];
      const result = await getRequests({ role: 'requester', status });
      setRequests(result.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={14} strokeWidth={1.5} className="text-slate-400" />
          <div className="flex items-center gap-1 bg-slate-100/60 rounded-lg p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`
                  px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors
                  ${statusFilter === filter.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} strokeWidth={1.5} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && requests.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && requests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Inbox size={24} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">
            No requests found
          </p>
          <p className="text-[13px] text-slate-400">
            {statusFilter === 'all'
              ? "You haven't submitted any upgrade requests yet"
              : `No ${statusFilter} requests`
            }
          </p>
        </motion.div>
      )}

      {/* Request list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {requests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              onClick={onRequestClick ? () => onRequestClick(request) : undefined}
              delay={index * 0.05}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
