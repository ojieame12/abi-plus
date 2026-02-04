// WorldviewDrawer — slide-out drawer showing visual catalog of user interests
// Matches the NotificationDrawer/CreditDrawer pattern with floating card aesthetic

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Plus,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Globe,
  Loader2,
} from 'lucide-react';
import { useUserInterests } from '../../hooks/useUserInterests';
import type { Interest, CoverageLevel } from '../../types/interests';

const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

interface WorldviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAbi: (topic: string) => void;
  onNavigateToSettings: () => void;
}

// Coverage styling helpers
const COVERAGE_CONFIG: Record<CoverageLevel, {
  label: string;
  dot: string;
  bg: string;
  text: string;
  icon: typeof ShieldCheck;
}> = {
  decision_grade: { label: 'Decision Grade', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: ShieldCheck },
  available: { label: 'Available', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', icon: Zap },
  partial: { label: 'Partial', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertTriangle },
  web_only: { label: 'Web Only', dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', icon: Globe },
};

// Coverage stat pills — lightweight inline indicators
function CoverageStats({ interests }: { interests: Interest[] }) {
  const counts: Record<CoverageLevel, number> = {
    decision_grade: 0,
    available: 0,
    partial: 0,
    web_only: 0,
  };

  interests.forEach(i => {
    const level = i.coverage?.level ?? 'web_only';
    counts[level]++;
  });

  if (interests.length === 0) return null;

  const levels = (['decision_grade', 'available', 'partial', 'web_only'] as CoverageLevel[])
    .filter(level => counts[level] > 0);

  return (
    <div className="flex flex-wrap gap-2">
      {levels.map(level => {
        const cfg = COVERAGE_CONFIG[level];
        return (
          <span
            key={level}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {counts[level]} {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

// Individual interest card — whole card is tappable to start a conversation
function InterestCard({
  interest,
  onAskAbi,
  onRemove,
}: {
  interest: Interest;
  onAskAbi: (topic: string) => void;
  onRemove: (id: string) => void;
}) {
  const level = interest.coverage?.level ?? 'web_only';
  const cfg = COVERAGE_CONFIG[level];
  const matched = interest.coverage?.matchedCategory;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white border border-slate-100/60 rounded-2xl p-4 transition-all hover:border-violet-200 hover:shadow-[0_4px_24px_-8px_rgba(139,92,246,0.12)] cursor-pointer"
      style={{ boxShadow: cardShadow }}
      onClick={() => onAskAbi(interest.text)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAskAbi(interest.text); } }}
      aria-label={`Ask Abi about ${interest.text}`}
    >
      {/* Remove button — appears on hover, top-right */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(interest.id); }}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-all"
        aria-label={`Remove ${interest.text}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Top row: name + coverage badge */}
      <div className="flex items-start justify-between gap-2 mb-2 pr-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-slate-800 truncate">
            {interest.text}
          </h3>
          {interest.region && (
            <span className="text-xs text-slate-400 mt-0.5">{interest.region}</span>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      {/* Matched category info */}
      {matched && (
        <div className="mb-3 text-xs text-slate-500 space-y-0.5">
          <p>{matched.categoryName} <span className="text-slate-300">in</span> {matched.domain}</p>
          {matched.analystName && (
            <p className="text-slate-400">Analyst: {matched.analystName}</p>
          )}
        </div>
      )}

      {/* Capabilities row (when matched) */}
      {matched && (
        <div className="flex flex-wrap gap-1.5">
          {matched.hasMarketReport && <CapBadge label="Market Reports" />}
          {matched.hasPriceIndex && <CapBadge label="Price Index" />}
          {matched.hasSupplierData && <CapBadge label="Suppliers" />}
          {matched.hasNewsAlerts && <CapBadge label="News" />}
          {matched.hasCostModel && <CapBadge label="Cost Model" />}
        </div>
      )}
    </motion.div>
  );
}

function CapBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-100">
      {label}
    </span>
  );
}

// Quick add input inline in the drawer
function QuickAddInput({ onAdd }: { onAdd: (text: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || isAdding) return;
    setIsAdding(true);
    setFeedback(null);
    try {
      await onAdd(value.trim());
      setValue('');
      inputRef.current?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add';
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setFeedback(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
          placeholder="Add a topic..."
          className="flex-1 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isAdding}
          className="w-9 h-9 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors shrink-0"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
      {feedback && (
        <p className="text-xs text-amber-600 mt-1.5 px-1">{feedback}</p>
      )}
    </div>
  );
}

export function WorldviewDrawer({
  isOpen,
  onClose,
  onAskAbi,
  onNavigateToSettings,
}: WorldviewDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const {
    interests,
    isLoading,
    addInterest,
    removeInterest,
  } = useUserInterests();

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

  const handleQuickAdd = async (text: string) => {
    await addInterest(text, 'manual');
  };

  const handleAskAbi = (topic: string) => {
    onClose();
    onAskAbi(topic);
  };

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
            aria-labelledby="worldview-drawer-title"
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100/80 via-slate-50 to-pink-50/60" />
              <div className="relative px-7 pt-7 pb-6">
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  aria-label="Close worldview drawer"
                  className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="p-3.5 rounded-2xl bg-white shadow-sm border border-white/60 w-fit mb-5">
                  <Compass className="w-6 h-6 text-violet-500" />
                </div>

                {/* Title row */}
                <h2 id="worldview-drawer-title" className="text-lg font-medium text-slate-700 mb-1">
                  My Worldview
                </h2>
                <p className="text-[13px] text-slate-400 mb-5">
                  Topics and categories you track. Tap any to ask Abi.
                </p>

                {/* Coverage stats */}
                {!isLoading && interests.length > 0 && (
                  <CoverageStats interests={interests} />
                )}
              </div>
            </div>

            {/* Quick add + content */}
            <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
              {/* Quick add */}
              <div className="mb-6">
                <QuickAddInput onAdd={handleQuickAdd} />
              </div>

              {/* Interest cards */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : interests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Compass className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">No topics yet</h3>
                  <p className="text-sm text-slate-400 max-w-[240px]">
                    Add categories and topics you manage. Abi will personalize your experience around them.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interests.map((interest, index) => (
                    <motion.div
                      key={interest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <InterestCard
                        interest={interest}
                        onAskAbi={handleAskAbi}
                        onRemove={(id) => removeInterest(id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-slate-200/60 shrink-0">
              <button
                onClick={() => { onClose(); onNavigateToSettings(); }}
                className="text-[13px] text-slate-500 hover:text-slate-700 transition-colors"
              >
                Manage in Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
