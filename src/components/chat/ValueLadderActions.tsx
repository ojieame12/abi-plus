// ValueLadderActions - Action row for escalation tiers
// Sits under the widget in AI responses, provides access to:
// - Upgrade: L2b Decision Grade upgrade (paid, uses credits)
// - Analyst Connect: Beroe analysts (DM / schedule call)
// - Expert Network: Premium external experts (L3, paid)
// NOTE: Community has been parked - removed from this component

import { motion } from 'framer-motion';
import { UserCircle, Star, Crown, ChevronRight, Coins } from 'lucide-react';
import type { ValueLadder } from '../../types/aiResponse';

interface ValueLadderActionsProps {
  valueLadder: ValueLadder;
  onUpgrade?: () => void;
  onAnalystConnect?: () => void;
  onExpertDeepDive?: () => void;
  upgradeCost?: number;
  className?: string;
}

export const ValueLadderActions = ({
  valueLadder,
  onUpgrade,
  onAnalystConnect,
  onExpertDeepDive,
  upgradeCost = 2000,
  className = '',
}: ValueLadderActionsProps) => {
  const { analystConnect, expertDeepDive } = valueLadder;

  // Check if any actions are available (upgrade is always available for L1 content)
  const hasActions =
    onUpgrade ||
    analystConnect?.available ||
    expertDeepDive?.available;

  if (!hasActions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 ${className}`}
    >
      {/* Upgrade to Decision Grade - Violet styling (L2b) */}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-violet-50 hover:bg-violet-100 border border-violet-200
                     text-violet-700 text-sm font-medium transition-all
                     hover:shadow-sm"
        >
          <Star className="w-4 h-4 text-violet-500" />
          <span>Upgrade Report</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-600 text-white text-[10px]
                          rounded font-semibold">
            <Coins className="w-3 h-3" />
            {upgradeCost.toLocaleString()}
          </span>
          <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100
                                   group-hover:ml-0 transition-all" />
        </button>
      )}

      {/* Analyst Connect - Teal/Beroe styling (L2a) */}
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
          <span>Ask Analyst</span>
          <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[10px]
                          rounded font-semibold uppercase tracking-wide">
            Beroe
          </span>
          <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100
                                   group-hover:ml-0 transition-all" />
        </button>
      )}

      {/* Expert Network - Premium Gold styling (L3) */}
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
            Bespoke
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
  onUpgrade,
  onAnalystConnect,
  onExpertDeepDive,
  upgradeCost = 2000,
}: ValueLadderActionsProps) => {
  const { analystConnect, expertDeepDive } = valueLadder;

  const hasActions =
    onUpgrade ||
    analystConnect?.available ||
    expertDeepDive?.available;

  if (!hasActions) return null;

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md
                     bg-violet-50 hover:bg-violet-100 border border-violet-200
                     text-violet-700 text-xs font-medium transition-colors"
          title="Upgrade to Decision Grade"
        >
          <Star className="w-3 h-3" />
          <span>Upgrade</span>
          <span className="flex items-center gap-0.5 text-[10px]">
            <Coins className="w-2.5 h-2.5" />
            {upgradeCost.toLocaleString()}
          </span>
        </button>
      )}

      {analystConnect?.available && (
        <button
          onClick={onAnalystConnect}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md
                     bg-teal-50 hover:bg-teal-100 border border-teal-200
                     text-teal-700 text-xs font-medium transition-colors"
          title="Connect with a Beroe analyst"
        >
          <UserCircle className="w-3 h-3" />
          <span>Ask Analyst</span>
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
  onUpgrade,
  onAnalystConnect,
  onExpertDeepDive,
  upgradeCost = 2000,
}: ValueLadderActionsProps) => {
  const { analystConnect, expertDeepDive } = valueLadder;

  const hasActions =
    onUpgrade ||
    analystConnect?.available ||
    expertDeepDive?.available;

  if (!hasActions) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Upgrade - Compact violet */}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-violet-50 hover:bg-violet-100 border border-violet-200
                     text-violet-700 text-xs font-medium transition-all"
          title="Upgrade to Decision Grade"
        >
          <Star className="w-3.5 h-3.5" />
          <span>Upgrade</span>
          <span className="flex items-center gap-0.5 px-1 py-0.5 bg-violet-200/60 rounded text-[10px]">
            <Coins className="w-2.5 h-2.5" />
            {upgradeCost.toLocaleString()}
          </span>
        </button>
      )}

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
          <span>Ask Analyst</span>
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
