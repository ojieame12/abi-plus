// InterestDetailDrawer - Right-slide detail panel for a tracked interest
// Shows origin, editable fields, how Abi uses the interest, and activity

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Pencil,
  Loader2,
  Check,
  Trash2,
  MessageSquare,
  Upload,
  User,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Sparkles,
  Search,
  BarChart3,
  MapPin,
  Tag,
  Zap,
  CheckCircle,
} from 'lucide-react';
import type { Interest, CoverageLevel } from '../../types/interests';
import { formatUpdateFrequency } from '../../types/managedCategories';

interface InterestDetailDrawerProps {
  interest: Interest | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Pick<Interest, 'text' | 'region' | 'grade'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getSourceIcon = (source: Interest['source']) => {
  switch (source) {
    case 'chat_inferred':
      return <MessageSquare className="w-3.5 h-3.5" />;
    case 'csm_imported':
      return <Upload className="w-3.5 h-3.5" />;
    default:
      return <User className="w-3.5 h-3.5" />;
  }
};

const getSourceLabel = (source: Interest['source']) => {
  switch (source) {
    case 'chat_inferred':
      return 'From chat';
    case 'csm_imported':
      return 'Imported';
    default:
      return 'Manual';
  }
};

const getCoverageIcon = (level: CoverageLevel) => {
  switch (level) {
    case 'decision_grade':
      return <ShieldCheck className="w-3.5 h-3.5" />;
    case 'available':
      return <Zap className="w-3.5 h-3.5" />;
    case 'partial':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'web_only':
      return <Globe className="w-3.5 h-3.5" />;
  }
};

const getCoverageLabel = (level: CoverageLevel) => {
  switch (level) {
    case 'decision_grade':
      return 'Decision Grade';
    case 'available':
      return 'Available';
    case 'partial':
      return 'Partial Coverage';
    case 'web_only':
      return 'Web Only';
  }
};

const getCoverageStyle = (level: CoverageLevel) => {
  switch (level) {
    case 'decision_grade':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'available':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'partial':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'web_only':
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const inputClass = 'w-full bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all';

export function InterestDetailDrawer({ interest, onClose, onUpdate, onDelete }: InterestDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Focus management
  useEffect(() => {
    if (interest) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }
  }, [interest]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && interest) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [interest, onClose]);

  // Reset edit state when interest changes
  useEffect(() => {
    if (interest) {
      setIsEditing(false);
      setEditText(interest.text);
      setEditRegion(interest.region || '');
      setEditGrade(interest.grade || '');
    }
  }, [interest?.id]);

  const handleStartEdit = () => {
    if (!interest) return;
    setEditText(interest.text);
    setEditRegion(interest.region || '');
    setEditGrade(interest.grade || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!interest || !editText.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(interest.id, {
        text: editText.trim(),
        region: editRegion.trim() || undefined,
        grade: editGrade.trim() || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!interest) return;
    setIsDeleting(true);
    try {
      await onDelete(interest.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {interest && (
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
            data-testid="drawer-backdrop"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#fafafa] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interest-drawer-title"
            data-testid="interest-detail-drawer"
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-slate-50 to-pink-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2
                        id="interest-drawer-title"
                        className="text-lg font-medium text-slate-700 truncate"
                        data-testid="drawer-title"
                      >
                        {interest.text}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {interest.coverage && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCoverageStyle(interest.coverage.level)}`}
                          data-testid="drawer-coverage-badge"
                        >
                          {getCoverageIcon(interest.coverage.level)}
                          {getCoverageLabel(interest.coverage.level)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close detail drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all flex-shrink-0 ml-4"
                    data-testid="drawer-close-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Origin */}
              <section data-testid="origin-section">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Origin</h3>
                <div className="bg-white rounded-2xl p-4 border border-slate-100/60" style={{ boxShadow: '0 4px 20px -8px rgba(148, 163, 184, 0.15)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600" data-testid="origin-source">
                      {getSourceIcon(interest.source)}
                      {getSourceLabel(interest.source)}
                    </span>
                    <span className="text-xs text-slate-400" data-testid="origin-date">
                      Tracked on {formatDate(interest.savedAt)}
                    </span>
                  </div>
                  {interest.source === 'chat_inferred' && interest.searchContext && (
                    <div className="mt-2 pl-3 border-l-2 border-slate-200" data-testid="origin-query">
                      <p className="text-xs text-slate-500 italic">"{interest.searchContext}"</p>
                    </div>
                  )}
                  {interest.conversationId && (
                    <p className="text-xs text-slate-400 mt-2" data-testid="origin-conversation">
                      Linked to a conversation
                    </p>
                  )}
                </div>
              </section>

              {/* Section 2: What We Track */}
              <section data-testid="tracking-section">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">What We Track</h3>
                  {!isEditing && (
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                      data-testid="edit-button"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100/60" style={{ boxShadow: '0 4px 20px -8px rgba(148, 163, 184, 0.15)' }}>
                  {isEditing ? (
                    <div className="space-y-3" data-testid="edit-form">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Topic</label>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className={inputClass}
                          placeholder="Category"
                          data-testid="edit-text-input"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Region</label>
                          <input
                            type="text"
                            value={editRegion}
                            onChange={(e) => setEditRegion(e.target.value)}
                            className={inputClass}
                            placeholder="Region"
                            data-testid="edit-region-input"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Grade/Type</label>
                          <input
                            type="text"
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className={inputClass}
                            placeholder="Grade/Type"
                            data-testid="edit-grade-input"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleSave}
                          disabled={isSaving || !editText.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white text-sm font-medium transition-colors"
                          data-testid="save-edit-button"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          data-testid="cancel-edit-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="read-only-fields">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Topic</p>
                        <p className="text-sm font-medium text-slate-900" data-testid="field-text">{interest.text}</p>
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Region</p>
                          <p className="text-sm text-slate-700" data-testid="field-region">{interest.region || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Grade/Type</p>
                          <p className="text-sm text-slate-700" data-testid="field-grade">{interest.grade || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {interest.coverage && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCoverageStyle(interest.coverage.level)}`}>
                          {getCoverageIcon(interest.coverage.level)}
                          {getCoverageLabel(interest.coverage.level)}
                        </span>
                      </div>
                      {interest.coverage.gapReason && (
                        <p className="text-xs text-slate-400 mt-2" data-testid="gap-reason">{interest.coverage.gapReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Section 3: How Abi Uses This */}
              <section data-testid="usage-section">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">How Abi Uses This</h3>
                <div className="bg-white rounded-2xl p-4 border border-slate-100/60" style={{ boxShadow: '0 4px 20px -8px rgba(148, 163, 184, 0.15)' }}>
                  {interest.coverage?.matchedCategory ? (
                    <ul className="space-y-3" data-testid="matched-capabilities">
                      <li className="flex items-start gap-2.5">
                        <Tag className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">
                          Matched to: <strong>{interest.coverage.matchedCategory.categoryName}</strong> ({interest.coverage.matchedCategory.domain})
                        </p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">
                          Lead analyst: {interest.coverage.matchedCategory.analystName}
                        </p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">
                          {formatUpdateFrequency(interest.coverage.matchedCategory.updateFrequency)}
                        </p>
                      </li>
                      {interest.coverage.matchedCategory.hasMarketReport && (
                        <li className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">Market reports available</p>
                        </li>
                      )}
                      {interest.coverage.matchedCategory.hasPriceIndex && (
                        <li className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">Price index tracking</p>
                        </li>
                      )}
                      {interest.coverage.matchedCategory.hasSupplierData && (
                        <li className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">Supplier intelligence</p>
                        </li>
                      )}
                      {interest.coverage.matchedCategory.hasNewsAlerts && (
                        <li className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">News & alerts</p>
                        </li>
                      )}
                      {interest.coverage.matchedCategory.hasCostModel && (
                        <li className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">Cost modeling</p>
                        </li>
                      )}
                      {!interest.coverage.matchedCategory.isActivated && (
                        <li className="flex items-start gap-2.5" data-testid="activation-hint">
                          <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-600">This category can be activated for decision-grade coverage</p>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <ul className="space-y-3" data-testid="generic-usage">
                      <li className="flex items-start gap-2.5">
                        <Search className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Prioritizes this topic in search results</p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Includes relevant updates in research briefs</p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <BarChart3 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600">Adjusts market analysis for this commodity</p>
                      </li>
                      {interest.region && (
                        <li className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">Considers region-specific data when available</p>
                        </li>
                      )}
                      {interest.grade && (
                        <li className="flex items-start gap-2.5">
                          <Tag className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">Filters by grade/specification when possible</p>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </section>

              {/* Section 4: Activity */}
              <section data-testid="activity-section">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Activity</h3>
                <div className="bg-white rounded-2xl p-4 border border-slate-100/60" style={{ boxShadow: '0 4px 20px -8px rgba(148, 163, 184, 0.15)' }}>
                  {interest.conversationId || interest.searchContext ? (
                    <div className="space-y-3">
                      {interest.searchContext && (
                        <div data-testid="activity-query">
                          <p className="text-xs text-slate-400 mb-1">Original query</p>
                          <p className="text-sm text-slate-600 italic">"{interest.searchContext}"</p>
                        </div>
                      )}
                      {interest.conversationId && (
                        <p className="text-xs text-slate-400" data-testid="activity-conversation">
                          Originally detected in a conversation on {formatDate(interest.savedAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400" data-testid="activity-empty">
                      No conversation activity yet — ask Abi about this topic to build history
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Footer: Delete */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
                data-testid="delete-interest-button"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Remove interest
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
