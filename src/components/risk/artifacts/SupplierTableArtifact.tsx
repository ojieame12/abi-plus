/* eslint-disable react-hooks/static-components -- SortIcon is a simple render helper, safe pattern */
import { useState } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { RiskScoreBadge } from '../RiskScoreBadge';

interface Supplier {
    id: string;
    name: string;
    duns?: string;
    category: string;
    location: string;
    spend: number;
    spendFormatted: string;
    srs: {
        score: number | null;
        level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
        trend?: 'improving' | 'worsening' | 'stable';
    };
}

interface FilterState {
    riskLevel: string[];
    category: string[];
    location: string[];
    spendMin: number | null;
    spendMax: number | null;
}

interface SupplierTableArtifactProps {
    suppliers: Supplier[];
    totalCount: number;
    categories: string[];
    locations: string[];
    onSupplierClick?: (supplier: Supplier) => void;
    onFilterChange?: (filters: FilterState) => void;
    onExport?: () => void;
    onBulkAction?: (action: string, supplierIds: string[]) => void;
}

const riskLevels = [
    { value: 'high', label: 'High Risk', color: 'bg-red-500' },
    { value: 'medium-high', label: 'Med-High', color: 'bg-orange-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'low', label: 'Low Risk', color: 'bg-green-500' },
    { value: 'unrated', label: 'Unrated', color: 'bg-slate-400' },
];

export const SupplierTableArtifact = ({
    suppliers,
    totalCount,
    categories,
    onSupplierClick,
    onFilterChange,
    onExport,
    onBulkAction,
}: SupplierTableArtifactProps) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<string>('srs');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        riskLevel: [],
        category: [],
        location: [],
        spendMin: null,
        spendMax: null,
    });

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === suppliers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(suppliers.map(s => s.id)));
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const toggleFilter = (type: keyof FilterState, value: string) => {
        const current = filters[type] as string[];
        const newFilters = {
            ...filters,
            [type]: current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value],
        };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    };

    const clearFilters = () => {
        const cleared: FilterState = {
            riskLevel: [],
            category: [],
            location: [],
            spendMin: null,
            spendMax: null,
        };
        setFilters(cleared);
        onFilterChange?.(cleared);
    };

    const activeFilterCount = filters.riskLevel.length + filters.category.length + filters.location.length;

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />;
    };

    return (
        <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl font-sans rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100/60">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-normal text-[#1d1d1f] tracking-tight">Your Followed Suppliers</h3>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <Download size={14} strokeWidth={1.5} />
                        Export
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[13px] bg-slate-50/60 border-none ring-1 ring-slate-200/60 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-normal border rounded-xl transition-all ${
                            showFilters || activeFilterCount > 0
                                ? 'border-violet-200/60 bg-violet-50/50 text-violet-700'
                                : 'border-slate-200/60 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                    >
                        <Filter size={14} strokeWidth={1.5} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-0.5 w-4 h-4 flex items-center justify-center bg-violet-600 text-white text-[10px] font-bold rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-3 p-4 bg-slate-50/40 rounded-2xl border border-slate-100/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-normal text-slate-900 uppercase tracking-wide">Filter Options</span>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-medium text-violet-600 hover:text-violet-700"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Risk Level */}
                        <div className="mb-4">
                            <div className="text-[11px] font-medium text-slate-500 mb-2">RISK LEVEL</div>
                            <div className="flex flex-wrap gap-2">
                                {riskLevels.map(level => (
                                    <button
                                        key={level.value}
                                        onClick={() => toggleFilter('riskLevel', level.value)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[13px] rounded-xl border transition-all ${
                                            filters.riskLevel.includes(level.value)
                                                ? 'border-violet-200/60 bg-violet-50/50 text-violet-700 font-normal'
                                                : 'border-slate-200/60 bg-white/80 text-slate-600 hover:border-slate-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${level.color}`} />
                                        {level.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="mb-4">
                            <div className="text-[11px] font-medium text-slate-500 mb-2">CATEGORY</div>
                            <div className="flex flex-wrap gap-2">
                                {categories.slice(0, 6).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleFilter('category', cat)}
                                        className={`px-2.5 py-1 text-[13px] rounded-xl border transition-all ${
                                            filters.category.includes(cat)
                                                ? 'border-violet-200/60 bg-violet-50/50 text-violet-700 font-normal'
                                                : 'border-slate-200/60 bg-white/80 text-slate-600 hover:border-slate-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-white/95 backdrop-blur-sm">
                            <th className="w-12 px-5 py-3 border-b border-slate-100/60 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === suppliers.length && suppliers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                                />
                            </th>
                            <th
                                className="px-5 py-3 border-b border-slate-100/60 text-left text-[11px] font-normal text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors group"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Supplier <SortIcon field="name" />
                                </div>
                            </th>
                            <th
                                className="px-5 py-3 border-b border-slate-100/60 text-left text-[11px] font-normal text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors group"
                                onClick={() => handleSort('category')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Category <SortIcon field="category" />
                                </div>
                            </th>
                            <th
                                className="px-5 py-3 border-b border-slate-100/60 text-left text-[11px] font-normal text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors group"
                                onClick={() => handleSort('location')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Location <SortIcon field="location" />
                                </div>
                            </th>
                            <th
                                className="px-5 py-3 border-b border-slate-100/60 text-right text-[11px] font-normal text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors group"
                                onClick={() => handleSort('srs')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    SRS <SortIcon field="srs" />
                                </div>
                            </th>
                            <th
                                className="px-5 py-3 border-b border-slate-100/60 text-right text-[11px] font-normal text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors group"
                                onClick={() => handleSort('spend')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    Spend <SortIcon field="spend" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white/60">
                        {suppliers.map((supplier) => (
                            <tr
                                key={supplier.id}
                                className={`group hover:bg-[#fafafa] transition-colors cursor-pointer ${
                                    selectedIds.has(supplier.id) ? 'bg-violet-50/30' : ''
                                }`}
                                onClick={() => onSupplierClick?.(supplier)}
                            >
                                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(supplier.id)}
                                        onChange={() => toggleSelect(supplier.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="font-normal text-[#1d1d1f] text-[13px]">{supplier.name}</div>
                                    {supplier.duns && (
                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">#{supplier.duns}</div>
                                    )}
                                </td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-600">{supplier.category}</td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-600">{supplier.location}</td>
                                <td className="px-5 py-3.5 text-right">
                                    <RiskScoreBadge
                                        score={supplier.srs.score}
                                        level={supplier.srs.level}
                                        size="sm"
                                        showLabel={false}
                                    />
                                </td>
                                <td className="px-5 py-3.5 text-right text-[13px] font-normal text-[#1d1d1f] tabular-nums">
                                    {supplier.spendFormatted}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bulk Actions Footer */}
            {selectedIds.size > 0 && (
                <div className="px-5 py-3 bg-violet-50/30 border-t border-violet-100/60 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                    <span className="text-[13px] font-normal text-violet-900">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onBulkAction?.('unfollow', Array.from(selectedIds))}
                            className="px-3 py-1.5 text-xs font-normal text-slate-700 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm hover:bg-slate-50/50 transition-colors"
                        >
                            Unfollow
                        </button>
                        <button
                            onClick={() => onBulkAction?.('export', Array.from(selectedIds))}
                            className="px-3 py-1.5 text-xs font-normal text-slate-700 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm hover:bg-slate-50/50 transition-colors"
                        >
                            Export
                        </button>
                        <button
                            onClick={() => onBulkAction?.('compare', Array.from(selectedIds))}
                            className="px-3 py-1.5 text-xs font-normal text-white bg-violet-600 rounded-xl shadow-sm hover:bg-violet-700 transition-colors"
                        >
                            Compare
                        </button>
                    </div>
                </div>
            )}

            {/* Pagination Footer */}
            <div className="px-5 py-4 border-t border-slate-100/60 flex items-center justify-between bg-white/60">
                <span className="text-[13px] text-slate-500">
                    Showing <span className="font-normal text-slate-900">{suppliers.length}</span> of <span className="font-normal text-slate-900">{totalCount}</span>
                </span>
                <div className="flex items-center gap-1">
                    <button className="px-2.5 py-1 text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors disabled:opacity-50">
                        Previous
                    </button>
                    <div className="flex items-center">
                        <button className="w-7 h-7 flex items-center justify-center text-xs font-normal bg-violet-50/50 text-violet-700 rounded-lg">1</button>
                        <button className="w-7 h-7 flex items-center justify-center text-xs font-normal text-slate-600 hover:bg-slate-50/50 rounded-lg">2</button>
                        <button className="w-7 h-7 flex items-center justify-center text-xs font-normal text-slate-600 hover:bg-slate-50/50 rounded-lg">3</button>
                    </div>
                    <button className="px-2.5 py-1 text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};
