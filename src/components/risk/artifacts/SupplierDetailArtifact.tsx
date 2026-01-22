import { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Star,
    MoreHorizontal,
    MapPin,
    Clock,
    AlertTriangle,
    Lock,
    Check
} from 'lucide-react';
import { RiskScoreCircle } from '../RiskScoreBadge';

interface RiskFactor {
    name: string;
    weight: number;
    isRestricted: boolean;
    category: 'financial' | 'operational' | 'compliance' | 'external';
}

interface Event {
    id: string;
    date: string;
    title: string;
    type: 'news' | 'alert' | 'update';
    summary: string;
}

interface HistoryPoint {
    date: string;
    score: number;
    level: string;
    change?: number;
}

interface Supplier {
    id: string;
    name: string;
    duns?: string;
    category: string;
    location: {
        city: string;
        country: string;
    };
    spend: number;
    spendFormatted: string;
    criticality?: 'high' | 'medium' | 'low';
    srs: {
        score: number | null;
        level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
        trend: 'improving' | 'worsening' | 'stable';
        lastUpdated: string;
    };
    riskFactors: RiskFactor[];
    events: Event[];
    history: HistoryPoint[];
}

interface SupplierDetailArtifactProps {
    supplier: Supplier;
    onBack?: () => void;
    onFindAlternatives?: () => void;
    onAddToShortlist?: () => void;
    onViewDashboard?: () => void;
}

type TabId = 'overview' | 'factors' | 'events' | 'history';

const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'factors', label: 'Risk Factors' },
    { id: 'events', label: 'Events' },
    { id: 'history', label: 'History' },
];

export const SupplierDetailArtifact = ({
    supplier,
    onBack,
    onFindAlternatives,
    onAddToShortlist,
    onViewDashboard,
}: SupplierDetailArtifactProps) => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    // Defensive defaults for partial supplier data
    const srs = supplier?.srs || { score: null, level: 'unrated' as const, trend: 'stable' as const, lastUpdated: '' };
    const riskFactors = supplier?.riskFactors || [];
    const events = supplier?.events || [];
    const history = supplier?.history || [];
    const location = supplier?.location || { city: 'Unknown', country: 'Unknown' };

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1.5 -ml-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <span className="font-medium text-[#1d1d1f] tracking-tight">Supplier Details</span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <Star size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-5 border-b border-slate-200 bg-white z-10">
                <div className="flex gap-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 text-[13px] font-medium border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-violet-600 text-violet-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                {activeTab === 'overview' && (
                    <OverviewTab supplier={supplier} srs={srs} location={location} riskFactors={riskFactors} onViewDashboard={onViewDashboard} />
                )}
                {activeTab === 'factors' && (
                    <FactorsTab factors={riskFactors} onViewDashboard={onViewDashboard} />
                )}
                {activeTab === 'events' && (
                    <EventsTab events={events} />
                )}
                {activeTab === 'history' && (
                    <HistoryTab history={history} />
                )}
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-4 border-t border-slate-200 flex items-center gap-3 bg-white">
                <button
                    onClick={onFindAlternatives}
                    className="flex-1 py-2.5 text-[13px] font-medium text-white bg-[#1d1d1f] hover:bg-[#1d1d1f]/90 rounded-lg transition-all shadow-sm active:scale-[0.98]"
                >
                    Find Alternatives
                </button>
                <button
                    onClick={onAddToShortlist}
                    className="flex-1 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors active:scale-[0.98]"
                >
                    Add to Shortlist
                </button>
            </div>
        </div>
    );
};

// Overview Tab
const OverviewTab = ({
    supplier,
    srs,
    location,
    riskFactors,
    onViewDashboard
}: {
    supplier: Supplier;
    srs: Supplier['srs'];
    location: Supplier['location'];
    riskFactors: RiskFactor[];
    onViewDashboard?: () => void;
}) => (
    <div className="space-y-6 max-w-3xl mx-auto">
        {/* Supplier Header */}
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-2xl font-medium text-[#1d1d1f] mb-1 tracking-tight">{supplier?.name || 'Unknown Supplier'}</h2>
                <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                    <span>{supplier?.category || 'Unknown Category'}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                        <MapPin size={13} />
                        {location.city}, {location.country}
                    </div>
                </div>
                {supplier?.duns && (
                    <div className="text-[11px] text-slate-400 font-mono mt-1.5">
                        DUNS: {supplier.duns}
                    </div>
                )}
            </div>
            {onViewDashboard && (
                <button
                    onClick={onViewDashboard}
                    className="text-[13px] font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                    View Hierarchy <ChevronRight size={14} />
                </button>
            )}
        </div>

        {/* Risk Score Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-8">
                <div className="shrink-0">
                    <RiskScoreCircle
                        score={srs.score}
                        level={srs.level}
                        trend={srs.trend}
                        lastUpdated={srs.lastUpdated}
                    />
                </div>
                <div className="flex-1 border-l border-slate-100 pl-8">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <div className="text-[11px] uppercase tracking-widest font-medium text-slate-400 mb-1">Total Spend</div>
                            <div className="text-xl font-medium text-[#1d1d1f] tracking-tight">{supplier?.spendFormatted || '—'}</div>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase tracking-widest font-medium text-slate-400 mb-1">Criticality</div>
                            <div className="text-xl font-medium text-[#1d1d1f] tracking-tight capitalize">{supplier?.criticality || '—'}</div>
                        </div>
                        <div className="col-span-2">
                             <div className="text-[11px] uppercase tracking-widest font-medium text-slate-400 mb-1">Risk Summary</div>
                             <p className="text-[13px] text-slate-600 leading-relaxed">
                                {riskFactors.length > 0 ? (
                                    <>Score calculated from {riskFactors.length} weighted factors.</>
                                ) : (
                                    <>Risk factor data not available.</>
                                )}
                                <span className="ml-1 text-amber-600 font-medium inline-flex items-center gap-1">
                                    <AlertTriangle size={12} /> Some data restricted.
                                </span>
                             </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                <button
                    onClick={onViewDashboard}
                    className="text-[13px] font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1.5 group"
                >
                    Open Full Risk Dashboard
                    <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    </div>
);

// Risk Factors Tab
const FactorsTab = ({ factors, onViewDashboard }: { factors: RiskFactor[]; onViewDashboard?: () => void }) => {
    const groupedFactors = {
        financial: factors.filter(f => f.category === 'financial'),
        operational: factors.filter(f => f.category === 'operational'),
        compliance: factors.filter(f => f.category === 'compliance'),
        external: factors.filter(f => f.category === 'external'),
    };

    const categoryLabels = {
        financial: 'Financial Health',
        operational: 'Operational',
        compliance: 'Compliance',
        external: 'External Risk',
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between p-4 bg-violet-50/50 border border-violet-100 rounded-lg">
                <p className="text-[13px] text-violet-900">
                    Showing <strong>{factors.length}</strong> factors. Detailed scoring logic is available in the dashboard.
                </p>
                <button onClick={onViewDashboard} className="text-xs font-medium text-violet-700 hover:text-violet-800 whitespace-nowrap">
                    View Logic
                </button>
            </div>

            {Object.entries(groupedFactors).map(([category, categoryFactors]) => (
                categoryFactors.length > 0 && (
                    <div key={category}>
                        <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3 pl-1">
                            {categoryLabels[category as keyof typeof categoryLabels]}
                        </h4>
                        <div className="space-y-2">
                            {categoryFactors.map((factor, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                >
                                    <div className="flex items-center gap-3">
                                        {factor.isRestricted ? (
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Lock size={14} />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                                <Check size={14} />
                                            </div>
                                        )}
                                        <span className="text-[13px] font-medium text-[#1d1d1f]">{factor.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                            Weight: {factor.weight}%
                                        </span>
                                        {factor.isRestricted ? (
                                            <span className="text-[11px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded">Dashboard</span>
                                        ) : (
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

// Events Tab
const EventsTab = ({ events }: { events: Event[] }) => (
    <div className="space-y-4">
        {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
                <Clock size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No recent events for this supplier</p>
            </div>
        ) : (
            events.map((event) => (
                <div key={event.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.type === 'alert' ? 'bg-red-100 text-red-700' :
                            event.type === 'news' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-200 text-slate-600'
                        }`}>
                            {event.type}
                        </span>
                        <span className="text-xs text-slate-400">{event.date}</span>
                    </div>
                    <h5 className="font-medium text-slate-900 text-sm mb-1">{event.title}</h5>
                    <p className="text-sm text-slate-600">{event.summary}</p>
                </div>
            ))
        )}
    </div>
);

// History Tab
const HistoryTab = ({ history }: { history: HistoryPoint[] }) => (
    <div className="space-y-4">
        <p className="text-sm text-slate-600">
            Score trend over time (overall SRS only)
        </p>

        {/* Simple Timeline */}
        <div className="space-y-3">
            {history.map((point, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-20 text-xs text-slate-500">{point.date}</div>
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                            point.level === 'high' ? 'text-red-600' :
                            point.level === 'medium-high' ? 'text-orange-600' :
                            point.level === 'medium' ? 'text-yellow-600' :
                            point.level === 'low' ? 'text-green-600' :
                            'text-slate-400'
                        }`}>
                            {point.score}
                        </span>
                        {point.change && (
                            <span className={`text-xs ${point.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ({point.change > 0 ? '+' : ''}{point.change})
                            </span>
                        )}
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${
                                point.level === 'high' ? 'bg-red-500' :
                                point.level === 'medium-high' ? 'bg-orange-500' :
                                point.level === 'medium' ? 'bg-yellow-500' :
                                point.level === 'low' ? 'bg-green-500' :
                                'bg-slate-300'
                            }`}
                            style={{ width: `${point.score}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
);
