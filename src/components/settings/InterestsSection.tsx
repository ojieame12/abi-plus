// InterestsSection - Settings section for managing user interests
// Uses useUserInterests() hook for state management

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, MessageSquare, Upload, User, ShieldCheck, AlertTriangle, Globe, ChevronRight, Zap } from 'lucide-react';
import { useUserInterests } from '../../hooks/useUserInterests';
import { InterestDetailDrawer } from './InterestDetailDrawer';
import type { InterestSource, CoverageLevel } from '../../types/interests';

export function InterestsSection() {
  const {
    interests,
    isLoading,
    error,
    addInterest,
    removeInterest,
    updateInterest,
  } = useUserInterests();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);

  const selectedInterest = interests.find(i => i.id === selectedInterestId) ?? null;
  const [newText, setNewText] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newText.trim()) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await addInterest(newText.trim(), 'manual', {
        region: newRegion.trim() || undefined,
        grade: newGrade.trim() || undefined,
      });
      // Reset form
      setNewText('');
      setNewRegion('');
      setNewGrade('');
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add interest');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeInterest(id);
    } catch {
      // Error is handled by hook
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setNewText('');
    setNewRegion('');
    setNewGrade('');
    setAddError(null);
  };

  const getSourceIcon = (source: InterestSource) => {
    switch (source) {
      case 'chat_inferred':
        return <MessageSquare className="w-3 h-3" />;
      case 'csm_imported':
        return <Upload className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getSourceLabel = (source: InterestSource) => {
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
        return <ShieldCheck className="w-3 h-3" />;
      case 'available':
        return <Zap className="w-3 h-3" />;
      case 'partial':
        return <AlertTriangle className="w-3 h-3" />;
      case 'web_only':
        return <Globe className="w-3 h-3" />;
    }
  };

  const getCoverageLabel = (level: CoverageLevel) => {
    switch (level) {
      case 'decision_grade':
        return 'Decision Grade';
      case 'available':
        return 'Available';
      case 'partial':
        return 'Partial';
      case 'web_only':
        return 'Web Only';
    }
  };

  const getCoverageStyle = (level: CoverageLevel) => {
    switch (level) {
      case 'decision_grade':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'available':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'partial':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'web_only':
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="interests-section">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-normal text-slate-900">My Interests</h2>
        <p className="text-sm text-slate-400 mt-1">
          Abi uses these to personalize your experience
        </p>
        {/* Usage meter */}
        {!isLoading && interests.length > 0 && (
          <div className="mt-3" data-testid="usage-meter">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-slate-400">
                {interests.length} of 50 interests
              </p>
              <p className="text-xs text-slate-300">
                {Math.round((interests.length / 50) * 100)}%
              </p>
            </div>
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  interests.length / 50 > 0.8
                    ? 'bg-red-400'
                    : interests.length / 50 > 0.6
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min((interests.length / 50) * 100, 100)}%` }}
                data-testid="usage-bar"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add button / form */}
      <div className="mb-6">
        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-2xl p-6"
            data-testid="add-form"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-normal text-slate-900">Add Interest</h3>
                <p className="text-sm text-slate-400 mt-1">Abi will personalize future responses</p>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 ml-4"
                data-testid="cancel-button"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Category"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all mb-3"
              autoFocus
              data-testid="interest-text-input"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                placeholder="Region"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                className="flex-1 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                data-testid="region-input"
              />
              <input
                type="text"
                placeholder="Grade/Type"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="flex-1 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                data-testid="grade-input"
              />
            </div>
            {addError && (
              <p className="text-xs text-red-600 mb-3">{addError}</p>
            )}
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || isAdding}
              className="flex items-center justify-between min-w-[180px] px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white text-sm font-medium transition-colors"
              data-testid="save-interest-button"
            >
              <span className="flex items-center gap-2">
                {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Interest
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-600 transition-colors"
            data-testid="add-interest-button"
          >
            <Plus className="w-4 h-4" />
            Add Interest
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3" data-testid="loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Interest list */}
      {!isLoading && interests.length > 0 && (
        <div className="space-y-3" data-testid="interest-list">
          <AnimatePresence>
            {interests.map(interest => (
              <motion.div
                key={interest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex items-center justify-between p-4 rounded-[1.25rem] cursor-pointer transition-all group border backdrop-blur-sm ${
                  selectedInterestId === interest.id
                    ? 'bg-white/90 border-violet-200/60 ring-2 ring-violet-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
                    : 'bg-white/80 border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.07)] hover:ring-black/[0.04]'
                }`}
                onClick={() => setSelectedInterestId(prev => prev === interest.id ? null : interest.id)}
                data-testid={`interest-card-${interest.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-slate-900 truncate">
                    {interest.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {interest.region && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600" data-testid="region-pill">
                        {interest.region}
                      </span>
                    )}
                    {interest.grade && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-amber-50 text-amber-600" data-testid="grade-pill">
                        {interest.grade}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" data-testid="source-badge">
                      {getSourceIcon(interest.source)}
                      {getSourceLabel(interest.source)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {interest.coverage && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${getCoverageStyle(interest.coverage.level)}`}
                      data-testid="coverage-badge"
                      title={interest.coverage.gapReason}
                    >
                      {getCoverageIcon(interest.coverage.level)}
                      {getCoverageLabel(interest.coverage.level)}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(interest.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    data-testid={`delete-button-${interest.id}`}
                    aria-label={`Remove ${interest.text}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && interests.length === 0 && (
        <div className="text-center py-12" data-testid="empty-state">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-primary mb-1">No interests yet</h3>
          <p className="text-sm text-secondary">
            Add topics you care about and Abi will personalize your experience
          </p>
        </div>
      )}

      {/* Detail drawer */}
      <InterestDetailDrawer
        interest={selectedInterest}
        onClose={() => setSelectedInterestId(null)}
        onUpdate={updateInterest}
        onDelete={async (id) => {
          await removeInterest(id);
          setSelectedInterestId(null);
        }}
      />
    </div>
  );
}
