// Alternatives Artifact
// Find and compare alternative suppliers

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowUpDown,
  Check,
  Plus,
  FileText,
  ChevronRight,
  MapPin,
  X,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter, TextInput, SelectInput } from '../primitives';
import type { RiskLevel } from '../../../types/supplier';

// ============================================
// TYPES
// ============================================

export interface AlternativeSupplier {
  id: string;
  name: string;
  score: number;
  level: RiskLevel;
  category: string;
  region: string;
  country: string;
  matchScore: number;
  spend?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface AlternativesArtifactProps {
  currentSupplier: {
    id: string;
    name: string;
    score: number;
    category: string;
  };
  alternatives: AlternativeSupplier[];
  onRequestAssessment?: (supplierIds: string[]) => void;
  onAddToShortlist?: (supplierIds: string[]) => void;
  onSelectSupplier?: (supplier: AlternativeSupplier) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  unrated: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  high: 'High',
  'medium-high': 'Med-High',
  medium: 'Medium',
  low: 'Low',
  unrated: 'Unrated',
};

type SortField = 'matchScore' | 'score' | 'name';
type SortDirection = 'asc' | 'desc';

// ============================================
// HELPER COMPONENTS
// ============================================

const MatchBadge = ({ score }: { score: number }) => {
  const color = score >= 90
    ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
    : score >= 75
    ? 'bg-blue-100 text-blue-700 ring-blue-200'
    : 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${color}`}>
      {score}% match
    </span>
  );
};

const ScoreComparison = ({
  alternativeScore,
  currentScore,
}: {
  alternativeScore: number;
  currentScore: number;
}) => {
  const diff = currentScore - alternativeScore;
  const isBetter = diff > 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-slate-900">{alternativeScore}</span>
      {diff !== 0 && (
        <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${
          isBetter ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {isBetter ? `−${diff}` : `+${Math.abs(diff)}`}
        </span>
      )}
    </div>
  );
};

const SupplierRow = ({
  supplier,
  currentScore,
  isSelected,
  onToggleSelect,
  onView,
  index,
}: {
  supplier: AlternativeSupplier;
  currentScore: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  index: number;
}) => {
  const colors = RISK_COLORS[supplier.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.03 }}
      className={`group p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-violet-50/50 border-violet-200'
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-violet-600 border-violet-600'
              : 'border-slate-300 hover:border-violet-400'
          }`}
        >
          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0" onClick={onView}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-900 truncate">
              {supplier.name}
            </span>
            <MatchBadge score={supplier.matchScore} />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{supplier.category}</span>
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {supplier.country}
            </span>
          </div>
        </div>

        {/* Score & Risk */}
        <div className="text-right shrink-0">
          <ScoreComparison
            alternativeScore={supplier.score}
            currentScore={currentScore}
          />
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            <span className={`text-xs ${colors.text}`}>
              {LEVEL_LABELS[supplier.level]}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-slate-400 mt-1 shrink-0"
        />
      </div>
    </motion.div>
  );
};

const ComparisonPreview = ({
  suppliers,
  currentScore,
  onRemove,
}: {
  suppliers: AlternativeSupplier[];
  currentScore: number;
  onRemove: (id: string) => void;
}) => {
  if (suppliers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-violet-50/50 rounded-xl border border-violet-100"
    >
      <p className="text-xs font-medium text-violet-700 mb-3">
        Comparing {suppliers.length} supplier{suppliers.length > 1 ? 's' : ''}
      </p>
      <div className="flex gap-2 flex-wrap">
        {suppliers.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-violet-200"
          >
            <span className="text-sm text-slate-700">{s.name}</span>
            <span className={`text-xs font-medium ${
              s.score < currentScore ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {s.score}
            </span>
            <button
              onClick={() => onRemove(s.id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AlternativesArtifact = ({
  currentSupplier,
  alternatives,
  onRequestAssessment,
  onAddToShortlist,
  onSelectSupplier,
  onClose,
}: AlternativesArtifactProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    region: 'all',
  });

  // Get unique regions for filter
  const regions = useMemo(() => {
    const unique = [...new Set(alternatives.map(a => a.region))];
    return ['all', ...unique];
  }, [alternatives]);

  // Filter and sort alternatives
  const filteredAlternatives = useMemo(() => {
    let result = [...alternatives];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    }

    // Risk level filter
    if (filters.riskLevel !== 'all') {
      result = result.filter(a => a.level === filters.riskLevel);
    }

    // Region filter
    if (filters.region !== 'all') {
      result = result.filter(a => a.region === filters.region);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'matchScore':
          comparison = a.matchScore - b.matchScore;
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [alternatives, searchQuery, filters, sortField, sortDirection]);

  const selectedSuppliers = alternatives.filter(a => selectedIds.has(a.id));

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < 5) {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Context Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl"
        >
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <ArrowUpDown size={20} className="text-violet-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-900">
              Finding alternatives to {currentSupplier.name}
            </p>
            <p className="text-xs text-violet-600">
              Current score: {currentSupplier.score} • {currentSupplier.category}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-light text-violet-700">{alternatives.length}</span>
            <p className="text-xs text-violet-500">found</p>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <TextInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alternatives..."
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-32">
            <SelectInput
              value={filters.riskLevel}
              onChange={(e) => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
              options={[
                { value: 'all', label: 'All Risk' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'medium-high', label: 'Med-High' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
          <div className="w-36">
            <SelectInput
              value={filters.region}
              onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
              options={regions.map(r => ({ value: r, label: r === 'all' ? 'All Regions' : r }))}
            />
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400">Sort by:</span>
          {[
            { field: 'matchScore' as SortField, label: 'Match' },
            { field: 'score' as SortField, label: 'Risk Score' },
            { field: 'name' as SortField, label: 'Name' },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                sortField === field
                  ? 'text-violet-700 bg-violet-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              {sortField === field && (
                <ArrowUpDown size={10} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
              )}
            </button>
          ))}
        </div>

        {/* Comparison Preview */}
        <AnimatePresence>
          {selectedSuppliers.length > 0 && (
            <ComparisonPreview
              suppliers={selectedSuppliers}
              currentScore={currentSupplier.score}
              onRemove={(id) => toggleSelect(id)}
            />
          )}
        </AnimatePresence>

        {/* Results List */}
        <ArtifactSection
          title="Results"
          badge={filteredAlternatives.length}
          collapsible={false}
        >
          <div className="space-y-2">
            {filteredAlternatives.map((supplier, index) => (
              <SupplierRow
                key={supplier.id}
                supplier={supplier}
                currentScore={currentSupplier.score}
                isSelected={selectedIds.has(supplier.id)}
                onToggleSelect={() => toggleSelect(supplier.id)}
                onView={() => onSelectSupplier?.(supplier)}
                index={index}
              />
            ))}
            {filteredAlternatives.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                No alternatives match your filters
              </div>
            )}
          </div>
        </ArtifactSection>
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'shortlist',
          label: `Add to Shortlist${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`,
          variant: 'primary',
          onClick: () => onAddToShortlist?.([...selectedIds]),
          disabled: selectedIds.size === 0,
          icon: <Plus size={16} />,
        }}
        secondaryAction={{
          id: 'assess',
          label: 'Request Assessment',
          variant: 'secondary',
          onClick: () => onRequestAssessment?.([...selectedIds]),
          disabled: selectedIds.size === 0,
          icon: <FileText size={16} />,
        }}
      />
    </div>
  );
};

export default AlternativesArtifact;
