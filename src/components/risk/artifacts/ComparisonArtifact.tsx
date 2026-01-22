import { useState } from 'react';
import { X, Check, Minus, AlertTriangle, Lock, ChevronLeft, Download, Plus } from 'lucide-react';
import { RiskScoreCircle } from '../RiskScoreBadge';

interface Supplier {
    id: string;
    name: string;
    category: string;
    location: string;
    srs: {
        score: number | null;
        level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
        trend: 'improving' | 'worsening' | 'stable';
    };
    metrics: {
        esg?: number;
        quality?: number;
        delivery?: number;
        diversity?: number;
        scalability?: number;
        // Tier 3 metrics - restricted
        financial?: 'restricted';
        cybersecurity?: 'restricted';
        sanctions?: 'restricted';
    };
    spend: string;
    relationship: string;
    pros: string[];
    cons: string[];
}

interface ComparisonArtifactProps {
    suppliers: Supplier[];
    maxSuppliers?: number;
    onBack?: () => void;
    onRemoveSupplier?: (id: string) => void;
    onAddSupplier?: () => void;
    onSelectSupplier?: (supplier: Supplier) => void;
    onExport?: () => void;
    onViewDashboard?: () => void;
}

const metricLabels: Record<string, string> = {
    esg: 'ESG Score',
    quality: 'Quality',
    delivery: 'Delivery',
    diversity: 'Diversity',
    scalability: 'Scalability',
    financial: 'Financial Health',
    cybersecurity: 'Cybersecurity',
    sanctions: 'Sanctions Check',
};

const tier2Metrics = ['esg', 'quality', 'delivery', 'diversity', 'scalability'];
const tier3Metrics = ['financial', 'cybersecurity', 'sanctions'];

export const ComparisonArtifact = ({
    suppliers,
    maxSuppliers = 4,
    onBack,
    onRemoveSupplier,
    onAddSupplier,
    onSelectSupplier,
    onExport,
    onViewDashboard,
}: ComparisonArtifactProps) => {
    const [highlightBest, setHighlightBest] = useState(true);

    const getBestScoreForMetric = (metric: string): number | null => {
        const scores = suppliers
            .map(s => s.metrics[metric as keyof typeof s.metrics])
            .filter((s): s is number => typeof s === 'number');
        return scores.length > 0 ? Math.min(...scores) : null;
    };

    const isBestScore = (value: number | undefined | 'restricted', metric: string): boolean => {
        if (!highlightBest || typeof value !== 'number') return false;
        return value === getBestScoreForMetric(metric);
    };

    const formatScore = (value: number | undefined | 'restricted'): React.ReactNode => {
        if (value === 'restricted') {
            return (
                <span className="flex items-center gap-1 text-slate-400 italic">
                    <Lock size={12} />
                    Restricted
                </span>
            );
        }
        if (value === undefined || value === null) {
            return <span className="text-slate-300">—</span>;
        }
        return value;
    };

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-1.5 -ml-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <h3 className="text-lg font-medium text-[#1d1d1f] tracking-tight">
                            Compare Suppliers
                            <span className="ml-2 text-sm font-normal text-slate-400">({suppliers.length})</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-[13px] font-medium text-slate-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={highlightBest}
                                onChange={(e) => setHighlightBest(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                            Highlight best metrics
                        </label>
                        <button
                            onClick={onExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <Download size={14} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full min-w-[700px] border-separate border-spacing-0">
                    {/* Supplier Headers */}
                    <thead className="sticky top-0 z-20 shadow-sm">
                        <tr className="bg-white/95 backdrop-blur-sm">
                            <th className="w-48 px-6 py-4 text-left border-b border-slate-200 bg-white/95" />
                            {suppliers.map((supplier) => (
                                <th
                                    key={supplier.id}
                                    className="px-6 py-6 border-b border-slate-200 border-l border-slate-100 min-w-[200px] align-top"
                                >
                                    <div className="relative flex flex-col items-center gap-3">
                                        {onRemoveSupplier && (
                                            <button
                                                onClick={() => onRemoveSupplier(supplier.id)}
                                                className="absolute -top-3 -right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <RiskScoreCircle
                                            score={supplier.srs.score}
                                            level={supplier.srs.level}
                                            showLabel={false}
                                        />
                                        <div className="text-center">
                                            <button
                                                onClick={() => onSelectSupplier?.(supplier)}
                                                className="font-medium text-[#1d1d1f] hover:text-violet-600 transition-colors tracking-tight text-[15px] mb-0.5 block"
                                            >
                                                {supplier.name}
                                            </button>
                                            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{supplier.category}</span>
                                        </div>
                                    </div>
                                </th>
                            ))}
                            {suppliers.length < maxSuppliers && onAddSupplier && (
                                <th className="px-6 py-6 border-b border-slate-200 border-l border-slate-100 min-w-[200px] align-middle bg-slate-50/30">
                                    <button
                                        onClick={onAddSupplier}
                                        className="w-full flex flex-col items-center gap-3 py-4 text-slate-400 hover:text-violet-600 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 group-hover:border-violet-400 flex items-center justify-center transition-colors bg-white">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-xs font-medium">Add Supplier</span>
                                    </button>
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="bg-white">
                        {/* Basic Info */}
                        <tr className="bg-slate-50/50">
                            <td colSpan={suppliers.length + 2} className="px-6 py-2.5 border-b border-slate-100">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    Basic Info
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-[13px] font-medium text-slate-500 border-b border-slate-100 bg-white">
                                Location
                            </td>
                            {suppliers.map((s) => (
                                <td key={s.id} className="px-6 py-4 text-[13px] font-medium text-[#1d1d1f] text-center border-b border-slate-100 border-l border-slate-100">
                                    {s.location}
                                </td>
                            ))}
                            {suppliers.length < maxSuppliers && onAddSupplier && (
                                <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                            )}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-[13px] font-medium text-slate-500 border-b border-slate-100 bg-white">
                                Your Spend
                            </td>
                            {suppliers.map((s) => (
                                <td key={s.id} className="px-6 py-4 text-[13px] font-medium text-[#1d1d1f] text-center border-b border-slate-100 border-l border-slate-100">
                                    {s.spend}
                                </td>
                            ))}
                            {suppliers.length < maxSuppliers && onAddSupplier && (
                                <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                            )}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-[13px] font-medium text-slate-500 border-b border-slate-100 bg-white">
                                Relationship
                            </td>
                            {suppliers.map((s) => (
                                <td key={s.id} className="px-6 py-4 text-[13px] font-medium text-[#1d1d1f] text-center border-b border-slate-100 border-l border-slate-100">
                                    {s.relationship}
                                </td>
                            ))}
                            {suppliers.length < maxSuppliers && onAddSupplier && (
                                <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                            )}
                        </tr>

                        {/* Risk Metrics - Tier 2 */}
                        <tr className="bg-slate-50/50">
                            <td colSpan={suppliers.length + 2} className="px-6 py-2.5 border-b border-slate-100">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    Risk Factors (Available)
                                </span>
                            </td>
                        </tr>
                        {tier2Metrics.map((metric) => (
                            <tr key={metric}>
                                <td className="px-6 py-4 text-[13px] font-medium text-slate-500 border-b border-slate-100 bg-white">
                                    {metricLabels[metric]}
                                </td>
                                {suppliers.map((s) => {
                                    const value = s.metrics[metric as keyof typeof s.metrics];
                                    const best = isBestScore(value, metric);
                                    return (
                                        <td
                                            key={s.id}
                                            className={`px-6 py-4 text-[13px] font-medium text-center border-b border-slate-100 border-l border-slate-100 ${
                                                best ? 'bg-green-50/40 text-green-700' : 'text-[#1d1d1f]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                {formatScore(value)}
                                                {best && <Check size={12} className="text-green-600" />}
                                            </div>
                                        </td>
                                    );
                                })}
                                {suppliers.length < maxSuppliers && onAddSupplier && (
                                    <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                                )}
                            </tr>
                        ))}

                        {/* Risk Metrics - Tier 3 (Restricted) */}
                        <tr className="bg-slate-50/50">
                            <td colSpan={suppliers.length + 2} className="px-6 py-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                        Partner Data
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-amber-600/80 bg-amber-50 px-1.5 py-0.5 rounded">
                                        <Lock size={10} />
                                        Locked
                                    </span>
                                </div>
                            </td>
                        </tr>
                        {tier3Metrics.map((metric) => (
                            <tr key={metric}>
                                <td className="px-6 py-4 text-[13px] font-medium text-slate-500 border-b border-slate-100 bg-white">
                                    {metricLabels[metric]}
                                </td>
                                {suppliers.map((s) => (
                                    <td
                                        key={s.id}
                                        className="px-6 py-4 text-[13px] text-center text-slate-400 italic border-b border-slate-100 border-l border-slate-100 bg-slate-50/20"
                                    >
                                        <span className="flex items-center justify-center gap-1.5 opacity-60">
                                            <Lock size={12} />
                                            Restricted
                                        </span>
                                    </td>
                                ))}
                                {suppliers.length < maxSuppliers && onAddSupplier && (
                                    <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                                )}
                            </tr>
                        ))}

                        {/* Pros/Cons */}
                        <tr className="bg-slate-50/50">
                            <td colSpan={suppliers.length + 2} className="px-6 py-2.5 border-b border-slate-100">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    Assessment
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-[13px] font-medium text-slate-500 align-top border-b border-slate-100 bg-white">
                                Pros
                            </td>
                            {suppliers.map((s) => (
                                <td key={s.id} className="px-6 py-4 text-[13px] border-b border-slate-100 border-l border-slate-100 align-top">
                                    <ul className="space-y-2">
                                        {s.pros.map((pro, i) => (
                                            <li key={i} className="flex items-start gap-2 text-green-700/90 leading-relaxed">
                                                <Check size={12} className="mt-1 flex-shrink-0" />
                                                {pro}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                            {suppliers.length < maxSuppliers && onAddSupplier && (
                                <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                            )}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-[13px] font-medium text-slate-500 align-top border-b border-slate-100 bg-white">
                                Cons
                            </td>
                            {suppliers.map((s) => (
                                <td key={s.id} className="px-6 py-4 text-[13px] border-b border-slate-100 border-l border-slate-100 align-top">
                                    <ul className="space-y-2">
                                        {s.cons.map((con, i) => (
                                            <li key={i} className="flex items-start gap-2 text-rose-700/90 leading-relaxed">
                                                <Minus size={12} className="mt-1 flex-shrink-0" />
                                                {con}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                            {suppliers.length < maxSuppliers && onAddSupplier && (
                                <td className="border-b border-slate-100 border-l border-slate-100 bg-slate-50/30" />
                            )}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-3 p-3.5 bg-amber-50/50 border border-amber-100 rounded-lg text-amber-900/80">
                    <AlertTriangle size={16} className="text-amber-600/80" />
                    <span className="text-[13px] font-medium">
                        Financial, Cybersecurity, and Sanctions data requires dashboard access.
                    </span>
                    <button
                        onClick={onViewDashboard}
                        className="ml-auto text-[13px] font-medium text-amber-700 hover:text-amber-900 transition-colors"
                    >
                        Open Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
};
