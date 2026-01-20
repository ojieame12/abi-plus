import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ChevronRight,
    Download,
    RefreshCw,
    Clock
} from 'lucide-react';
import { RiskDistributionChart } from '../RiskDistributionChart';
import { TrendChangeIndicator } from '../TrendChangeIndicator';
import { PortfolioOverviewCard } from '../PortfolioOverviewCard';

interface RiskDistribution {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
}

interface TrendData {
    period: string;
    newHighRisk: number;
    improved: number;
    deteriorated: number;
}

interface Alert {
    id: string;
    headline: string;
    type: 'critical' | 'warning' | 'info';
    affectedCount: number;
    timestamp: string;
}

interface TopMover {
    id: string;
    name: string;
    previousScore: number;
    currentScore: number;
    direction: 'up' | 'down';
}

interface PortfolioDashboardArtifactProps {
    totalSuppliers: number;
    distribution: RiskDistribution;
    trends: TrendData;
    alerts: Alert[];
    topMovers: TopMover[];
    lastUpdated: string;
    onRefresh?: () => void;
    onExport?: () => void;
    onAlertClick?: (alert: Alert) => void;
    onSupplierClick?: (supplierId: string) => void;
    onViewAllRisks?: (riskLevel: string) => void;
    onViewAllMovers?: () => void;
}

export const PortfolioDashboardArtifact = ({
    totalSuppliers,
    distribution,
    trends,
    alerts,
    topMovers,
    lastUpdated,
    onRefresh,
    onExport,
    onAlertClick,
    onSupplierClick,
    onViewAllRisks,
    onViewAllMovers,
}: PortfolioDashboardArtifactProps) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    const highRiskCount = distribution.high;
    const unratedCount = distribution.unrated;
    const totalSpend = '—';

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
                <div>
                    <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Portfolio Overview</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-50 text-green-600">
                            <Clock size={10} />
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">Updated {lastUpdated}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-10">
                {/* Portfolio Summary */}
                <section>
                    <PortfolioOverviewCard
                        totalSuppliers={totalSuppliers}
                        totalSpend={totalSpend}
                        distribution={distribution}
                        highRiskCount={highRiskCount}
                        unratedCount={unratedCount}
                        variant="standard" // Reverted to standard as 'full' isn't defined in the props interface I read earlier
                        onSegmentClick={onViewAllRisks}
                    />
                </section>

                {/* Alerts Section */}
                {alerts.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wide">Active Alerts</h4>
                            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wider rounded-full border border-red-100">
                                {alerts.length} New
                            </span>
                        </div>
                        <div className="space-y-3">
                            {alerts.slice(0, 3).map((alert) => (
                                <div
                                    key={alert.id}
                                    onClick={() => onAlertClick?.(alert)}
                                    className="group p-4 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg shrink-0 ${
                                            alert.type === 'critical' ? 'bg-red-50 text-red-600' :
                                            alert.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-semibold text-[#1d1d1f] truncate group-hover:text-violet-600 transition-colors">
                                                {alert.headline}
                                            </p>
                                            <p className="text-[12px] text-slate-500 mt-1 font-medium">
                                                {alert.affectedCount} suppliers affected · {alert.timestamp}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trend Summary */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wide">Risk Trends</h4>
                        <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/50">
                            {(['7d', '30d', '90d'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                                        selectedPeriod === period
                                            ? 'bg-white text-[#1d1d1f] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-5 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-1 rounded bg-red-50 text-red-600"><TrendingUp size={12} /></span>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">New High Risk</span>
                            </div>
                            <div className="text-3xl font-light text-[#1d1d1f] tracking-tight">
                                +{trends.newHighRisk}
                            </div>
                        </div>
                        <div className="p-5 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-1 rounded bg-green-50 text-green-600"><TrendingDown size={12} /></span>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Improved</span>
                            </div>
                            <div className="text-3xl font-light text-[#1d1d1f] tracking-tight">
                                {trends.improved}
                            </div>
                        </div>
                        <div className="p-5 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-1 rounded bg-amber-50 text-amber-600"><TrendingUp size={12} /></span>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deteriorated</span>
                            </div>
                            <div className="text-3xl font-light text-[#1d1d1f] tracking-tight">
                                {trends.deteriorated}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Top Movers */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wide">Biggest Score Changes</h4>
                        <button
                            onClick={onViewAllMovers}
                            className="text-[12px] font-medium text-violet-600 hover:text-violet-700 hover:underline"
                        >
                            View all changes
                        </button>
                    </div>
                    <div className="space-y-2">
                        {topMovers.slice(0, 5).map((mover) => (
                            <div
                                key={mover.id}
                                onClick={() => onSupplierClick?.(mover.id)}
                                className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all group"
                            >
                                <span className="text-[13px] font-medium text-[#1d1d1f] group-hover:text-violet-600 transition-colors">
                                    {mover.name}
                                </span>
                                <TrendChangeIndicator
                                    previousScore={mover.previousScore}
                                    currentScore={mover.currentScore}
                                    variant="inline"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h4 className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wide mb-4">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => onViewAllRisks?.('high')}
                            className="p-5 bg-red-50/30 border border-red-100 rounded-xl text-left hover:bg-red-50 hover:border-red-200 transition-all group"
                        >
                            <div className="text-3xl font-light text-[#1d1d1f] mb-1 group-hover:scale-105 transition-transform origin-left">
                                {distribution.high}
                            </div>
                            <div className="text-[12px] font-medium text-red-700 flex items-center gap-1">
                                High-risk suppliers <ChevronRight size={12} />
                            </div>
                        </button>
                        <button
                            onClick={() => onViewAllRisks?.('unrated')}
                            className="p-5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 hover:shadow-sm transition-all group"
                        >
                            <div className="text-3xl font-light text-[#1d1d1f] mb-1 group-hover:scale-105 transition-transform origin-left">
                                {distribution.unrated}
                            </div>
                            <div className="text-[12px] font-medium text-slate-500 flex items-center gap-1">
                                Awaiting assessment <ChevronRight size={12} />
                            </div>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

// Mini version for embedding in chat
export const PortfolioSummaryWidget = ({
    totalSuppliers,
    distribution,
    onExpand,
}: {
    totalSuppliers: number;
    distribution: RiskDistribution;
    onExpand?: () => void;
}) => {
    const highRiskPercent = Math.round((distribution.high / totalSuppliers) * 100);

    return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Your Portfolio</h4>
                {onExpand && (
                    <button
                        onClick={onExpand}
                        className="text-xs text-violet-600 hover:text-violet-700"
                    >
                        View details
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4 mb-3">
                <div>
                    <div className="text-3xl font-bold text-slate-900">{totalSuppliers}</div>
                    <div className="text-xs text-slate-500">Total suppliers</div>
                </div>
                <div className="flex-1 h-px bg-slate-200" />
                <div className="text-right">
                    <div className="text-xl font-semibold text-red-600">{highRiskPercent}%</div>
                    <div className="text-xs text-slate-500">High risk</div>
                </div>
            </div>

            <RiskDistributionChart distribution={distribution} totalSuppliers={totalSuppliers} compact />
        </div>
    );
};
