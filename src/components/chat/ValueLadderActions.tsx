// ValueLadderActions - Action row for escalation tiers
// Sits under the widget in AI responses, provides access to:
// - Analyst Connect: Beroe analysts (DM / schedule call)
// - Community: Peer discussions (free / open)
// - Expert Network: Premium external experts (paid)

import { motion } from 'framer-motion';
import { UserCircle, Users, Sparkles, Crown, ChevronRight } from 'lucide-react';
import type { ValueLadder } from '../../types/aiResponse';

interface ValueLadderActionsProps {
  valueLadder: ValueLadder;
  onAnalystConnect?: () => void;
  onCommunity?: () => void;
  onExpertDeepDive?: () => void;
  className?: string;
}

export const ValueLadderActions = ({
  valueLadder,
  onAnalystConnect,
  onCommunity,
  onExpertDeepDive,
  className = '',
}: ValueLadderActionsProps) => {
  const { analystConnect, community, expertDeepDive } = valueLadder;

  // Check if any actions are available
  const hasActions =
    analystConnect?.available ||
    community?.available ||
    expertDeepDive?.available;

  if (!hasActions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 ${className}`}
    >
      {/* Analyst Connect - Teal/Beroe styling */}
      {analystConnect?.available && (
        <button
          onClick={onAnalystConnect}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-teal-50 hover:bg-teal-100 border border-teal-200
                     text-teal-700 text-sm font-medium transition-all
                     hover:shadow-sm"
        >
          {analystConnect.analyst?.photo ? (
            <img
              src={analystConnect.analyst.photo}
              alt={analystConnect.analyst.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <UserCircle className="w-4 h-4" />
          )}
          <span>Ask an Analyst</span>
          <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[10px]
                          rounded font-semibold uppercase tracking-wide">
            Beroe
          </span>
          <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100
                                   group-hover:ml-0 transition-all" />
        </button>
      )}

      {/* Community - Standard styling */}
      {community?.available && (
        <button
          onClick={onCommunity}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-slate-50 hover:bg-slate-100 border border-slate-200
                     text-slate-700 text-sm font-medium transition-all
                     hover:shadow-sm"
        >
          <Users className="w-4 h-4 text-slate-500" />
          <span>Ask the Community</span>
          {community.relatedThreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px]
                            rounded-full font-medium ml-0.5"
                  title={`${community.relatedThreadCount} related discussions`}>
              {community.relatedThreadCount}
            </span>
          )}
          <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100
                                   group-hover:ml-0 transition-all" />
        </button>
      )}

      {/* Expert Network - Premium Gold styling */}
      {expertDeepDive?.available && (
        <button
          onClick={onExpertDeepDive}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-gradient-to-r from-amber-50 to-yellow-50
                     hover:from-amber-100 hover:to-yellow-100
                     border border-amber-300
                     text-amber-800 text-sm font-medium transition-all
                     hover:shadow-md hover:shadow-amber-100"
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Request Expert</span>
          <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500
                          text-white text-[10px] rounded font-semibold uppercase tracking-wide
                          shadow-sm">
            Premium
          </span>
          <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100
                                   group-hover:ml-0 transition-all" />
        </button>
      )}
    </motion.div>
  );
};

// Compact variant for tighter spaces
export const ValueLadderActionsCompact = ({
  valueLadder,
  onAnalystConnect,
  onCommunity,
  onExpertDeepDive,
}: ValueLadderActionsProps) => {
  const { analystConnect, community, expertDeepDive } = valueLadder;

  const hasActions =
    analystConnect?.available ||
    community?.available ||
    expertDeepDive?.available;

  if (!hasActions) return null;

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {analystConnect?.available && (
        <button
          onClick={onAnalystConnect}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md
                     bg-teal-50 hover:bg-teal-100 border border-teal-200
                     text-teal-700 text-xs font-medium transition-colors"
          title="Connect with a Beroe analyst"
        >
          <UserCircle className="w-3 h-3" />
          <span>Ask an Analyst</span>
        </button>
      )}

      {community?.available && (
        <button
          onClick={onCommunity}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md
                     bg-slate-50 hover:bg-slate-100 border border-slate-200
                     text-slate-600 text-xs font-medium transition-colors"
          title="Post to community discussions"
        >
          <Users className="w-3 h-3" />
          <span>Ask the Community</span>
        </button>
      )}

      {expertDeepDive?.available && (
        <button
          onClick={onExpertDeepDive}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md
                     bg-amber-50 hover:bg-amber-100 border border-amber-300
                     text-amber-700 text-xs font-medium transition-colors"
          title="Request a premium expert consultation"
        >
          <Crown className="w-3 h-3" />
          <span>Request Expert</span>
        </button>
      )}
    </div>
  );
};

// Inline variant - sits in same row as feedback actions (no "Go deeper" label)
export const ValueLadderActionsInline = ({
  valueLadder,
  onAnalystConnect,
  onCommunity,
  onExpertDeepDive,
}: ValueLadderActionsProps) => {
  const { analystConnect, community, expertDeepDive } = valueLadder;

  const hasActions =
    analystConnect?.available ||
    community?.available ||
    expertDeepDive?.available;

  if (!hasActions) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Analyst Connect - Compact teal */}
      {analystConnect?.available && (
        <button
          onClick={onAnalystConnect}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-teal-50 hover:bg-teal-100 border border-teal-200
                     text-teal-700 text-xs font-medium transition-all"
          title="Connect with a Beroe analyst"
        >
          {analystConnect.analyst?.photo ? (
            <img
              src={analystConnect.analyst.photo}
              alt={analystConnect.analyst.name}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <UserCircle className="w-3.5 h-3.5" />
          )}
          <span>Ask an Analyst</span>
        </button>
      )}

      {/* Community - Compact slate */}
      {community?.available && (
        <button
          onClick={onCommunity}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-slate-50 hover:bg-slate-100 border border-slate-200
                     text-slate-600 text-xs font-medium transition-all"
          title="Post to community discussions"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Ask the Community</span>
          {community.relatedThreadCount > 0 && (
            <span className="px-1 py-0.5 bg-slate-200 text-slate-500 text-[10px]
                            rounded-full font-medium leading-none ml-0.5"
                  title={`${community.relatedThreadCount} related discussions`}>
              {community.relatedThreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expert Network - Compact gold */}
      {expertDeepDive?.available && (
        <button
          onClick={onExpertDeepDive}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-amber-50 hover:bg-amber-100 border border-amber-200
                     text-amber-700 text-xs font-medium transition-all"
          title="Request a premium expert consultation"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Request Expert</span>
        </button>
      )}
    </div>
  );
};

export default ValueLadderActions;
