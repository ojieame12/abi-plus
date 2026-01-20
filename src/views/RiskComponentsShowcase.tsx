import { useState } from 'react';
import {
    RiskScoreBadge,
    RiskScoreCircle,
    RiskDistributionChart,
    SupplierRiskCard,
    SupplierMiniTable,
    TrendChangeIndicator,
    RiskChangeAlert,
    MarketContextCard,
    EventAlertCard,
    BenchmarkCard,
    HandoffCard,
    ActionConfirmationCard,
    SuggestedActions,
    QuickPrompts,
    PortfolioOverviewCard,
    defaultRiskPrompts,
    getFollowUpActions,
    // Artifact Panels
    SupplierTableArtifact,
    SupplierDetailArtifact,
    ComparisonArtifact,
    PortfolioDashboardArtifact,
    PortfolioSummaryWidget,
} from '../components/risk';

// Import new widget components
import {
    TrendChartWidget,
    ScoreBreakdownWidget,
    EventTimelineWidget,
    NewsItemCard,
    SupplierMiniCard,
    CategoryBreakdownWidget,
    RegionListWidget,
    CategoryBadge,
    StatusBadge,
    // New widgets
    StatCard,
    InfoCard,
    QuoteCard,
    RecommendationCard,
    ChecklistCard,
    ProgressCard,
    SpendExposureWidget,
    HealthScorecardWidget,
    EventsFeedWidget,
    ExecutiveSummaryCard,
    DataListCard,
} from '../components/widgets';

// Demo Data
const demoDistribution = {
    high: 2,
    mediumHigh: 1,
    medium: 3,
    low: 4,
    unrated: 10,
};

const demoSupplier = {
    id: '1',
    name: 'Apple Inc.',
    duns: '372280056',
    category: 'Silicon Metal',
    location: 'New York, USA',
    spend: 10000000,
    spendFormatted: '$10.0M',
    criticality: 'high' as const,
    srs: {
        score: 85,
        level: 'high' as const,
        trend: 'worsening' as const,
        lastUpdated: 'May 3, 2024',
    },
    alert: 'Risk level increased from Medium to High',
};

const demoSuppliers = [
    { id: '1', name: 'Apple Inc.', category: 'Silicon Metal', srs: { score: 85, level: 'high' as const, trend: 'worsening' as const }, spend: '$10.0M' },
    { id: '2', name: 'Flash Cleaning', category: 'Cleaning', srs: { score: 68, level: 'medium' as const, trend: 'stable' as const }, spend: '$2.1M' },
    { id: '3', name: 'Queen Cleaners', category: 'Glassware', srs: { score: 41, level: 'low' as const, trend: 'improving' as const }, spend: '$450K' },
    { id: '4', name: 'Acme Corporation', category: 'Services', srs: { score: 32, level: 'high' as const, trend: 'worsening' as const }, spend: '$10B' },
    { id: '5', name: 'Widget Co', category: 'Components', srs: { score: 55, level: 'medium' as const, trend: 'stable' as const }, spend: '$850K' },
];

const demoMarketFactors = [
    'Semiconductor shortage continues (Month 18)',
    'Taiwan strait tensions elevated',
    'Logistics costs +23% YoY',
];

const demoAffectedSuppliers = [
    { id: '1', name: 'Apple Inc.', dependency: 'high' as const },
    { id: '2', name: 'Acme Corp', dependency: 'medium' as const },
];

const demoBenchmarks = [
    { metric: 'Avg SRS', yours: 62, industry: 58, status: 'worse' as const },
    { metric: 'High Risk %', yours: '14%', industry: '11%', status: 'worse' as const },
    { metric: 'Unrated %', yours: '72%', industry: '45%', status: 'worse' as const },
];

// Demo data for Artifact Panels
const demoTableSuppliers = [
    { id: '1', name: 'Apple Inc.', duns: '372280056', category: 'Silicon Metal', location: 'USA', spend: 10000000, spendFormatted: '$10.0M', srs: { score: 85, level: 'high' as const, trend: 'worsening' as const } },
    { id: '2', name: 'Flash Cleaning', duns: '123456789', category: 'Cleaning', location: 'Germany', spend: 2100000, spendFormatted: '$2.1M', srs: { score: 68, level: 'medium-high' as const, trend: 'stable' as const } },
    { id: '3', name: 'Queen Cleaners', duns: '987654321', category: 'Glassware', location: 'UK', spend: 450000, spendFormatted: '$450K', srs: { score: 41, level: 'low' as const, trend: 'improving' as const } },
    { id: '4', name: 'Acme Corporation', duns: '555666777', category: 'Services', location: 'Japan', spend: 10000000000, spendFormatted: '$10B', srs: { score: 72, level: 'medium-high' as const, trend: 'worsening' as const } },
    { id: '5', name: 'Widget Co', duns: '111222333', category: 'Components', location: 'China', spend: 850000, spendFormatted: '$850K', srs: { score: 55, level: 'medium' as const, trend: 'stable' as const } },
];

const demoDetailSupplier = {
    id: '1',
    name: 'Apple Inc.',
    duns: '372280056',
    category: 'Silicon Metal / Electronics',
    location: { city: 'Cupertino', country: 'USA' },
    spend: 10000000,
    spendFormatted: '$10.0M',
    criticality: 'high' as const,
    srs: {
        score: 85,
        level: 'high' as const,
        trend: 'worsening' as const,
        lastUpdated: 'May 3, 2024',
    },
    riskFactors: [
        { name: 'ESG Score', weight: 15, isRestricted: false, category: 'compliance' as const },
        { name: 'Delivery Performance', weight: 20, isRestricted: false, category: 'operational' as const },
        { name: 'Quality Rating', weight: 25, isRestricted: false, category: 'operational' as const },
        { name: 'Financial Health (D&B)', weight: 20, isRestricted: true, category: 'financial' as const },
        { name: 'Cybersecurity Assessment', weight: 10, isRestricted: true, category: 'external' as const },
        { name: 'Sanctions Screening', weight: 10, isRestricted: true, category: 'compliance' as const },
    ],
    events: [
        { id: '1', date: 'May 3, 2024', title: 'Risk Level Increased', type: 'alert' as const, summary: 'SRS moved from Medium (72) to High (85) due to quality concerns.' },
        { id: '2', date: 'Apr 15, 2024', title: 'Quarterly Review', type: 'update' as const, summary: 'Standard quarterly risk reassessment completed.' },
        { id: '3', date: 'Mar 22, 2024', title: 'Supply Chain News', type: 'news' as const, summary: 'Semiconductor shortage affects Q2 production capacity.' },
    ],
    history: [
        { date: 'May 2024', score: 85, level: 'high', change: 13 },
        { date: 'Apr 2024', score: 72, level: 'medium-high' },
        { date: 'Mar 2024', score: 68, level: 'medium-high', change: -4 },
        { date: 'Feb 2024', score: 72, level: 'medium-high' },
    ],
};

const demoComparisonSuppliers = [
    {
        id: '1', name: 'Apple Inc.', category: 'Silicon Metal', location: 'USA',
        srs: { score: 85, level: 'high' as const, trend: 'worsening' as const },
        metrics: { esg: 72, quality: 85, delivery: 68, diversity: 55, scalability: 78, financial: 'restricted' as const, cybersecurity: 'restricted' as const, sanctions: 'restricted' as const },
        spend: '$10.0M', relationship: '8 years',
        pros: ['Strong quality metrics', 'Established relationship'],
        cons: ['High risk score', 'Declining performance'],
    },
    {
        id: '2', name: 'Flash Cleaning', category: 'Silicon Metal', location: 'Germany',
        srs: { score: 52, level: 'medium' as const, trend: 'stable' as const },
        metrics: { esg: 88, quality: 72, delivery: 85, diversity: 72, scalability: 65, financial: 'restricted' as const, cybersecurity: 'restricted' as const, sanctions: 'restricted' as const },
        spend: '$2.1M', relationship: '3 years',
        pros: ['Excellent ESG rating', 'Strong delivery'],
        cons: ['Lower capacity', 'Shorter track record'],
    },
    {
        id: '3', name: 'Widget Co', category: 'Silicon Metal', location: 'China',
        srs: { score: 41, level: 'low' as const, trend: 'improving' as const },
        metrics: { esg: 65, quality: 78, delivery: 82, diversity: 45, scalability: 90, financial: 'restricted' as const, cybersecurity: 'restricted' as const, sanctions: 'restricted' as const },
        spend: '$850K', relationship: '1 year',
        pros: ['Best risk score', 'High scalability'],
        cons: ['Lower diversity score', 'New relationship'],
    },
];

const demoPortfolioAlerts = [
    { id: '1', headline: 'Semiconductor shortage impacts 4 suppliers', type: 'critical' as const, affectedCount: 4, timestamp: '2h ago' },
    { id: '2', headline: 'ESG compliance deadline approaching', type: 'warning' as const, affectedCount: 12, timestamp: '1d ago' },
    { id: '3', headline: 'New supplier onboarded successfully', type: 'info' as const, affectedCount: 1, timestamp: '3d ago' },
];

const demoTopMovers = [
    { id: '1', name: 'Apple Inc.', previousScore: 72, currentScore: 85, direction: 'up' as const },
    { id: '2', name: 'Flash Cleaning', previousScore: 75, currentScore: 52, direction: 'down' as const },
    { id: '3', name: 'Acme Corp', previousScore: 58, currentScore: 72, direction: 'up' as const },
];

// Demo data for new widgets
const demoTrendChartData = {
    title: 'Portfolio Risk Score',
    dataPoints: [
        { date: 'Jan', value: 52 },
        { date: 'Feb', value: 55 },
        { date: 'Mar', value: 58 },
        { date: 'Apr', value: 62 },
        { date: 'May', value: 68 },
        { date: 'Jun', value: 72 },
    ],
    changeDirection: 'up' as const,
    changeSummary: '+20 points over 6 months',
    unit: '',
};

const demoScoreBreakdownData = {
    totalScore: 72,
    riskLevel: 'medium-high' as const,
    factors: [
        { name: 'Financial Health', score: 78, weight: 25, impact: 'negative' as const, description: 'Cash flow concerns identified' },
        { name: 'ESG Compliance', score: 65, weight: 20, impact: 'negative' as const, description: 'Missing environmental certifications' },
        { name: 'Delivery Performance', score: 85, weight: 20, impact: 'positive' as const, description: 'Consistent on-time delivery' },
        { name: 'Quality Rating', score: 72, weight: 20, impact: 'neutral' as const },
        { name: 'Cybersecurity', score: 58, weight: 15, impact: 'negative' as const, description: 'Assessment overdue' },
    ],
    lastUpdated: '2 days ago',
};

const demoEventTimelineData = {
    events: [
        { id: '1', date: '2024-05-06', type: 'alert' as const, title: 'Risk level increased to High', description: 'SRS moved from 72 to 85 due to quality concerns', severity: 'critical' as const, supplierName: 'Apple Inc.' },
        { id: '2', date: '2024-05-03', type: 'news' as const, title: 'Semiconductor shortage update', description: 'Industry-wide shortage expected to continue through Q3', severity: 'warning' as const },
        { id: '3', date: '2024-04-28', type: 'risk_change' as const, title: 'Flash Cleaning improved', description: 'Score improved from 75 to 52 after ESG certification', severity: 'info' as const, supplierName: 'Flash Cleaning' },
        { id: '4', date: '2024-04-15', type: 'action' as const, title: 'Quarterly review completed', description: 'All suppliers reassessed for Q2' },
    ],
    timeRange: { start: 'Apr 1', end: 'May 6' },
};

const demoNewsItems = [
    { title: 'Semiconductor shortage affects Q2 production capacity', source: 'Reuters', timestamp: '2h ago', category: 'Supply Chain', sentiment: 'negative' as const },
    { title: 'New sustainability standards announced for electronics', source: 'Bloomberg', timestamp: '5h ago', category: 'ESG', sentiment: 'neutral' as const },
    { title: 'Trade agreement reduces tariffs on raw materials', source: 'WSJ', timestamp: '1d ago', category: 'Trade', sentiment: 'positive' as const },
];

const demoSupplierMiniData = {
    supplierId: '1',
    supplierName: 'Apple Inc.',
    riskScore: 85,
    riskLevel: 'high' as const,
    trend: 'worsening' as const,
    category: 'Electronics',
};

const demoCategoryBreakdownData = {
    categories: [
        { name: 'Electronics', supplierCount: 8, totalSpend: 45000000, spendFormatted: '$45M', avgRiskScore: 68, riskLevel: 'medium-high' },
        { name: 'Raw Materials', supplierCount: 12, totalSpend: 32000000, spendFormatted: '$32M', avgRiskScore: 52, riskLevel: 'medium' },
        { name: 'Services', supplierCount: 15, totalSpend: 18000000, spendFormatted: '$18M', avgRiskScore: 38, riskLevel: 'low' },
        { name: 'Logistics', supplierCount: 6, totalSpend: 12000000, spendFormatted: '$12M', avgRiskScore: 72, riskLevel: 'medium-high' },
        { name: 'Packaging', supplierCount: 4, totalSpend: 5000000, spendFormatted: '$5M', avgRiskScore: 45, riskLevel: 'medium' },
    ],
    sortBy: 'spend' as const,
};

const demoRegionListData = {
    regions: [
        { name: 'United States', code: 'US', supplierCount: 12, avgRiskScore: 48, flag: '🇺🇸' },
        { name: 'Germany', code: 'DE', supplierCount: 8, avgRiskScore: 42, flag: '🇩🇪' },
        { name: 'China', code: 'CN', supplierCount: 15, avgRiskScore: 65, flag: '🇨🇳' },
        { name: 'Japan', code: 'JP', supplierCount: 6, avgRiskScore: 38, flag: '🇯🇵' },
        { name: 'United Kingdom', code: 'GB', supplierCount: 4, avgRiskScore: 52, flag: '🇬🇧' },
    ],
    totalSuppliers: 45,
};

const demoCategoryBadgeData = {
    name: 'Electronics',
    supplierCount: 8,
    riskLevel: 'medium-high' as const,
    spend: '$45M',
};

// Demo data for new widgets
const demoSpendExposure = {
    totalSpend: 10000000000,
    totalSpendFormatted: '$10.0B',
    breakdown: [
        { level: 'high' as const, amount: 1500000000, formatted: '$1.5B', percent: 15, supplierCount: 2 },
        { level: 'medium-high' as const, amount: 2000000000, formatted: '$2.0B', percent: 20, supplierCount: 3 },
        { level: 'medium' as const, amount: 3000000000, formatted: '$3.0B', percent: 30, supplierCount: 4 },
        { level: 'low' as const, amount: 2500000000, formatted: '$2.5B', percent: 25, supplierCount: 3 },
        { level: 'unrated' as const, amount: 1000000000, formatted: '$1.0B', percent: 10, supplierCount: 2 },
    ],
    highestExposure: { supplierName: 'Acme Corp', amount: '$1.2B', riskLevel: 'high' },
};

const demoHealthScorecard = {
    overallScore: 68,
    scoreLabel: 'Moderate Health',
    metrics: [
        { label: 'High Risk', value: '14%', target: '<10%', status: 'warning' as const, trend: 'up' as const },
        { label: 'Unrated', value: '72%', target: '<50%', status: 'critical' as const },
        { label: 'Avg Score', value: 62, target: '<50', status: 'warning' as const },
        { label: 'Coverage', value: '28%', target: '>80%', status: 'critical' as const },
    ],
    concerns: [
        { title: 'High concentration in China', severity: 'high' as const, count: 15 },
        { title: 'ESG gaps identified', severity: 'medium' as const, count: 8 },
    ],
};

const demoEventsFeed = {
    events: [
        { id: '1', type: 'alert' as const, title: 'Risk Alert: Apple Inc. moved to High', timestamp: '2h ago', impact: 'negative' as const, supplier: 'Apple Inc.' },
        { id: '2', type: 'news' as const, title: 'Semiconductor shortage update from Reuters', summary: 'Shortage expected to continue through Q3', timestamp: '5h ago', source: 'Reuters', impact: 'negative' as const },
        { id: '3', type: 'risk_change' as const, title: 'Flash Cleaning improved to Medium', timestamp: '1d ago', impact: 'positive' as const, supplier: 'Flash Cleaning' },
        { id: '4', type: 'update' as const, title: 'Quarterly review completed', timestamp: '2d ago' },
    ],
};

const demoExecutiveSummary = {
    title: 'Portfolio Risk Summary',
    period: 'Q2 2024',
    keyPoints: [
        { text: 'High risk suppliers increased to 14%', type: 'concern' as const, value: '+3%' },
        { text: 'Total spend at risk reached $3.5B', type: 'metric' as const, value: '$3.5B' },
        { text: 'Coverage improved with 8 new assessments', type: 'positive' as const },
        { text: 'Action required: Review China suppliers', type: 'action' as const },
    ],
    metrics: [
        { label: 'Suppliers', value: '14', change: { value: 2, direction: 'up' as const } },
        { label: 'Spend at Risk', value: '$3.5B', change: { value: 12, direction: 'up' as const } },
        { label: 'Avg SRS', value: '62' },
    ],
    focusAreas: ['China concentration', 'ESG compliance', 'Financial health'],
};

const demoChecklist = {
    title: 'Risk Mitigation Actions',
    subtitle: '3 of 5 complete',
    items: [
        { id: '1', label: 'Review high-risk suppliers', description: 'Apple Inc., Acme Corp', completed: true },
        { id: '2', label: 'Update ESG certifications', description: '8 suppliers pending', completed: true },
        { id: '3', label: 'Schedule quarterly review', completed: true },
        { id: '4', label: 'Assess China alternatives', description: 'Find backup suppliers' },
        { id: '5', label: 'Complete D&B integration' },
    ],
};

const demoProgress = {
    title: 'Onboarding Progress',
    subtitle: 'Setting up your risk profile',
    steps: [
        { id: '1', label: 'Upload supplier list', status: 'completed' as const },
        { id: '2', label: 'Connect data sources', description: 'D&B, EcoVadis', status: 'completed' as const },
        { id: '3', label: 'Configure risk thresholds', status: 'current' as const },
        { id: '4', label: 'Set up alerts', status: 'upcoming' as const },
    ],
};

export const RiskComponentsShowcase = () => {
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#F5F5F7] relative overflow-hidden font-sans selection:bg-violet-500/30 selection:text-violet-900">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-rose-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            </div>

            <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
                <div className="mb-24 text-center">
                    <h1 className="text-5xl font-light text-[#1d1d1f] mb-4 tracking-tight leading-tight">
                        Liquid Risk
                    </h1>
                    <p className="text-xl text-[#86868b] max-w-2xl mx-auto font-light leading-relaxed">
                        A fluid, depth-aware interface system designed for clarity and immersion.
                    </p>
                </div>

                {/* Risk Score Badges */}
                <Section title="Risk Intelligence Badges">
                    <div className="flex flex-wrap gap-8 items-center justify-center p-12 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.02)] ring-1 ring-white/50 max-w-3xl mx-auto">
                        <RiskScoreBadge score={85} size="sm" />
                        <RiskScoreBadge score={68} size="md" />
                        <RiskScoreBadge score={41} size="lg" trend="improving" />
                        <RiskScoreBadge score={null} />
                    </div>
                    <div className="mt-12 flex justify-center">
                        <div className="p-16 rounded-[3rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.03)] ring-1 ring-white/50">
                            <RiskScoreCircle score={85} trend="worsening" lastUpdated="May 3, 2024" />
                        </div>
                    </div>
                </Section>

                {/* Distribution Chart */}
                <Section title="Risk Distribution Chart">
                    <div className="max-w-md mx-auto">
                        <RiskDistributionChart
                            distribution={demoDistribution}
                            totalSuppliers={20}
                            onSegmentClick={(level) => setSelectedSegment(level)}
                        />
                        {selectedSegment && (
                            <p className="mt-3 text-sm text-violet-600">
                                Clicked: {selectedSegment}
                            </p>
                        )}
                    </div>
                </Section>

                {/* Portfolio Overview */}
                <Section title="Portfolio Overview Card">
                    <div className="max-w-xl mx-auto space-y-8">
                        <PortfolioOverviewCard
                            totalSuppliers={20}
                            totalSpend="$23.5M"
                            distribution={demoDistribution}
                            highRiskCount={2}
                            unratedCount={10}
                            onSegmentClick={(level) => console.log('Segment:', level)}
                            onViewDetails={() => console.log('View details')}
                        />
                        <PortfolioOverviewCard
                            totalSuppliers={20}
                            totalSpend="$23.5M"
                            distribution={demoDistribution}
                            highRiskCount={2}
                            unratedCount={10}
                            variant="compact"
                        />
                    </div>
                </Section>

                {/* NEW WIDGETS SECTION */}
                <div className="mt-32 mb-16 pt-8 border-t border-slate-200/60 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-light text-[#1d1d1f] mb-2 tracking-tight">Chat Widgets</h2>
                    <p className="text-[#86868b] font-light">Widget components for AI responses in chat.</p>
                </div>

                {/* Trend Chart Widget */}
                <Section title="Trend Chart Widget">
                    <div className="max-w-md mx-auto">
                        <TrendChartWidget data={demoTrendChartData} />
                    </div>
                </Section>

                {/* Score Breakdown Widget */}
                <Section title="Score Breakdown Widget">
                    <div className="max-w-md mx-auto">
                        <ScoreBreakdownWidget
                            data={demoScoreBreakdownData}
                            onExpand={() => console.log('Expand')}
                        />
                    </div>
                </Section>

                {/* Event Timeline Widget */}
                <Section title="Event Timeline Widget">
                    <div className="max-w-md mx-auto">
                        <EventTimelineWidget
                            data={demoEventTimelineData}
                            onEventClick={(id) => console.log('Event:', id)}
                        />
                    </div>
                </Section>

                {/* News Item Cards */}
                <Section title="News Item Cards">
                    <div className="max-w-md mx-auto space-y-3">
                        {demoNewsItems.map((news, i) => (
                            <NewsItemCard
                                key={i}
                                data={news}
                                size={i === 0 ? 'M' : 'S'}
                                onClick={() => console.log('News:', news.title)}
                            />
                        ))}
                    </div>
                </Section>

                {/* Category Breakdown Widget */}
                <Section title="Category Breakdown Widget">
                    <div className="max-w-md mx-auto">
                        <CategoryBreakdownWidget
                            data={demoCategoryBreakdownData}
                            onCategoryClick={(name) => console.log('Category:', name)}
                        />
                    </div>
                </Section>

                {/* Region List Widget */}
                <Section title="Region List Widget">
                    <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
                        <RegionListWidget
                            data={demoRegionListData}
                            size="M"
                            onRegionClick={(code) => console.log('Region:', code)}
                        />
                        <div className="p-6 bg-white/40 backdrop-blur-xl rounded-[1.25rem] border border-white/60">
                            <div className="text-sm text-slate-500 mb-3">Compact Size (S):</div>
                            <RegionListWidget
                                data={demoRegionListData}
                                size="S"
                                onRegionClick={(code) => console.log('Region:', code)}
                            />
                        </div>
                    </div>
                </Section>

                {/* Compact Widgets (Badges) */}
                <Section title="Compact Widgets & Badges">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Supplier Mini Cards */}
                        <div className="p-6 bg-white/40 backdrop-blur-xl rounded-[1.25rem] border border-white/60">
                            <div className="text-sm text-slate-500 mb-3">Supplier Mini Cards:</div>
                            <div className="flex flex-wrap gap-3">
                                <SupplierMiniCard
                                    data={demoSupplierMiniData}
                                    onClick={() => console.log('Supplier clicked')}
                                />
                                <SupplierMiniCard
                                    data={{ ...demoSupplierMiniData, riskScore: 52, riskLevel: 'medium', trend: 'stable', supplierName: 'Flash Cleaning' }}
                                    onClick={() => console.log('Supplier clicked')}
                                />
                                <SupplierMiniCard
                                    data={{ ...demoSupplierMiniData, riskScore: 38, riskLevel: 'low', trend: 'improving', supplierName: 'Widget Co' }}
                                    onClick={() => console.log('Supplier clicked')}
                                />
                            </div>
                        </div>

                        {/* Category Badges */}
                        <div className="p-6 bg-white/40 backdrop-blur-xl rounded-[1.25rem] border border-white/60">
                            <div className="text-sm text-slate-500 mb-3">Category Badges:</div>
                            <div className="flex flex-wrap gap-3">
                                <CategoryBadge
                                    data={demoCategoryBadgeData}
                                    onClick={() => console.log('Category clicked')}
                                />
                                <CategoryBadge
                                    data={{ name: 'Raw Materials', supplierCount: 12, riskLevel: 'medium', spend: '$32M' }}
                                    onClick={() => console.log('Category clicked')}
                                />
                                <CategoryBadge
                                    data={{ name: 'Services', supplierCount: 15, riskLevel: 'low', spend: '$18M' }}
                                    onClick={() => console.log('Category clicked')}
                                />
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="p-6 bg-white/40 backdrop-blur-xl rounded-[1.25rem] border border-white/60">
                            <div className="text-sm text-slate-500 mb-3">Status Badges:</div>
                            <div className="flex flex-wrap gap-3">
                                <StatusBadge data={{ status: 'active', label: 'Active' }} />
                                <StatusBadge data={{ status: 'pending', label: 'Processing' }} />
                                <StatusBadge data={{ status: 'warning', label: 'Review Needed' }} />
                                <StatusBadge data={{ status: 'error', label: 'Failed' }} />
                                <StatusBadge data={{ status: 'inactive', label: 'Inactive' }} />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <StatusBadge data={{ status: 'active', label: 'Connected', detail: 'Last sync 2h ago' }} size="M" />
                                <StatusBadge data={{ status: 'warning', label: 'Action Required', detail: '3 items need review' }} size="M" />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Supplier Cards */}
                <Section title="Supplier Risk Cards">
                    <div className="max-w-md mx-auto space-y-6">
                        <SupplierRiskCard
                            supplier={demoSupplier}
                            onViewDetails={() => console.log('View details')}
                            onFindAlternatives={() => console.log('Find alternatives')}
                        />
                        <SupplierRiskCard
                            supplier={{ ...demoSupplier, alert: undefined }}
                            variant="alert"
                            onViewDetails={() => console.log('View details')}
                            onFindAlternatives={() => console.log('Find alternatives')}
                        />
                        <SupplierRiskCard
                            supplier={demoSupplier}
                            variant="compact"
                            onClick={() => console.log('Clicked')}
                        />
                    </div>
                </Section>

                {/* Supplier Table */}
                <Section title="Supplier Mini Table">
                    <div className="max-w-xl mx-auto">
                        <SupplierMiniTable
                            suppliers={demoSuppliers}
                            totalCount={14}
                            onRowClick={(s) => console.log('Row:', s.name)}
                            onViewAll={() => console.log('View all')}
                        />
                    </div>
                </Section>

                {/* Trend & Changes */}
                <Section title="Trend & Change Indicators">
                    <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-4">
                        <TrendChangeIndicator
                            previousScore={72}
                            currentScore={85}
                            previousLevel="medium"
                            currentLevel="high"
                            changeDate="May 3, 2024"
                            variant="card"
                        />
                        <TrendChangeIndicator
                            previousScore={58}
                            currentScore={41}
                            previousLevel="medium"
                            currentLevel="low"
                            changeDate="May 5, 2024"
                            variant="alert"
                        />
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                            <div className="text-sm text-slate-500 mb-2">Inline variant:</div>
                            <TrendChangeIndicator
                                previousScore={72}
                                currentScore={85}
                                changeDate="May 3"
                                variant="inline"
                            />
                        </div>
                    </div>
                    <div className="mt-4 max-w-md mx-auto">
                        <RiskChangeAlert
                            supplierName="Apple Inc."
                            previousScore={72}
                            currentScore={85}
                            changeDate="May 3"
                            onClick={() => console.log('Alert clicked')}
                        />
                    </div>
                </Section>

                {/* Market Intelligence */}
                <Section title="Market Context Card">
                    <div className="max-w-md mx-auto">
                        <MarketContextCard
                            sector="Electronics Components"
                            riskLevel="elevated"
                            keyFactors={demoMarketFactors}
                            exposedSuppliers={4}
                            totalSpend="$14.2M"
                            onViewReport={() => console.log('View report')}
                            onViewSuppliers={() => console.log('View suppliers')}
                        />
                    </div>
                </Section>

                {/* Event Alert */}
                <Section title="Event Alert Card">
                    <div className="max-w-md mx-auto">
                        <EventAlertCard
                            headline="Major fire at key semiconductor fab in Arizona"
                            timestamp="2 hours ago"
                            potentialImpact="2 of your suppliers source from this facility"
                            estimatedDuration="4-6 weeks supply disruption"
                            affectedSuppliers={demoAffectedSuppliers}
                            severity="warning"
                            onViewAnalysis={() => console.log('View analysis')}
                            onFindAlternatives={() => console.log('Find alternatives')}
                        />
                    </div>
                </Section>

                {/* Benchmark Card */}
                <Section title="Benchmark Card">
                    <div className="max-w-md mx-auto">
                        <BenchmarkCard
                            benchmarks={demoBenchmarks}
                            insight="Your portfolio has more unrated suppliers than typical, which may indicate monitoring gaps."
                            onAction={() => console.log('Action')}
                            actionLabel="Address Unrated Suppliers"
                        />
                    </div>
                </Section>

                {/* Handoff Card */}
                <Section title="Handoff Cards">
                    <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
                        <HandoffCard
                            title="Dashboard Access Required"
                            description="The detailed breakdown of risk factors requires direct dashboard access."
                            restrictions={[
                                'Individual factor scores',
                                'Financial health details',
                                'Cybersecurity assessment',
                            ]}
                            linkText="Open Risk Profile in Dashboard"
                            onNavigate={() => console.log('Navigate')}
                        />
                        <HandoffCard
                            title="Data Restriction"
                            description="Some partner data cannot be displayed in AI responses."
                            linkText="View in Dashboard"
                            variant="warning"
                            onNavigate={() => console.log('Navigate')}
                        />
                    </div>
                </Section>

                {/* Action Confirmation */}
                <Section title="Action Confirmation Cards">
                    <div className="max-w-md mx-auto space-y-4">
                        <ActionConfirmationCard
                            status="success"
                            title="Action Complete"
                            message="Flash Cleaning has been unfollowed from your risk monitoring portfolio."
                            onUndo={() => console.log('Undo')}
                            onViewResult={() => console.log('View')}
                            viewResultLabel="View Portfolio"
                        />
                        <ActionConfirmationCard
                            status="warning"
                            title="Alert Configured"
                            message="You'll be notified when any supplier moves to High Risk status."
                            onViewResult={() => console.log('View')}
                            viewResultLabel="Manage Alerts"
                        />
                    </div>
                </Section>

                {/* Suggested Actions */}
                <Section title="Suggested Actions & Quick Prompts">
                    <div className="max-w-md mx-auto space-y-6">
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-2">Portfolio Context:</div>
                            <SuggestedActions
                                actions={getFollowUpActions('portfolio')}
                                onActionClick={(a) => console.log('Action:', a.text)}
                            />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-2">Supplier Context:</div>
                            <SuggestedActions
                                actions={getFollowUpActions('supplier')}
                                onActionClick={(a) => console.log('Action:', a.text)}
                                layout="grid"
                            />
                        </div>
                        <div>
                            <QuickPrompts
                                prompts={defaultRiskPrompts}
                                onPromptClick={(p) => console.log('Prompt:', p.text)}
                            />
                        </div>
                    </div>
                </Section>

                {/* Artifact Panels Section */}
                <div className="mt-32 mb-16 pt-8 border-t border-slate-200/60 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-light text-[#1d1d1f] mb-2 tracking-tight">Artifact Panels</h2>
                    <p className="text-[#86868b] font-light">Full-panel views designed for the side panel.</p>
                </div>

                {/* Portfolio Summary Widget */}
                <Section title="Portfolio Summary Widget (Embeddable)">
                    <div className="max-w-md mx-auto">
                        <PortfolioSummaryWidget
                            totalSuppliers={20}
                            distribution={demoDistribution}
                            onExpand={() => console.log('Expand portfolio')}
                        />
                    </div>
                </Section>

                {/* Supplier Table Artifact */}
                <Section title="Supplier Table Artifact">
                    <div className="h-[500px] rounded-[1.25rem] overflow-hidden max-w-4xl mx-auto">
                        <SupplierTableArtifact
                            suppliers={demoTableSuppliers}
                            totalCount={14}
                            categories={['Silicon Metal', 'Cleaning', 'Glassware', 'Services', 'Components']}
                            locations={['USA', 'Germany', 'UK', 'Japan', 'China']}
                            onSupplierClick={(s) => console.log('Supplier:', s.name)}
                            onFilterChange={(f) => console.log('Filters:', f)}
                            onExport={() => console.log('Export')}
                            onBulkAction={(a, ids) => console.log('Bulk:', a, ids)}
                        />
                    </div>
                </Section>

                {/* Supplier Detail Artifact */}
                <Section title="Supplier Detail Artifact">
                    <div className="h-[600px] rounded-[1.25rem] overflow-hidden max-w-4xl mx-auto">
                        <SupplierDetailArtifact
                            supplier={demoDetailSupplier}
                            onBack={() => console.log('Back')}
                            onFindAlternatives={() => console.log('Find alternatives')}
                            onAddToShortlist={() => console.log('Add to shortlist')}
                            onViewDashboard={() => console.log('View dashboard')}
                        />
                    </div>
                </Section>

                {/* NEW WIDGETS SECTION - GENERAL PURPOSE */}
                <div className="mt-32 mb-16 pt-8 border-t border-slate-200/60 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-light text-[#1d1d1f] mb-2 tracking-tight">General Purpose Widgets</h2>
                    <p className="text-[#86868b] font-light">Flexible widgets for various AI response scenarios.</p>
                </div>

                {/* Stat Card */}
                <Section title="Stat Card">
                    <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-4">
                        <StatCard
                            label="High Risk Suppliers"
                            value={14}
                            change={{ value: 12, direction: 'up', period: 'vs last month' }}
                            color="danger"
                        />
                        <StatCard
                            label="Total Spend"
                            value="$10.2B"
                            change={{ value: 5, direction: 'down', period: 'vs Q1' }}
                            color="success"
                        />
                        <StatCard
                            label="Average SRS"
                            value={62}
                            color="warning"
                        />
                    </div>
                </Section>

                {/* Info Card */}
                <Section title="Info Card">
                    <div className="max-w-md mx-auto space-y-4">
                        <InfoCard
                            title="Understanding Risk Scores"
                            content="SRS (Supplier Risk Score) is calculated from multiple data sources including financial health, ESG compliance, and operational metrics."
                            variant="info"
                            bullets={['Scores range from 0-100', 'Higher scores indicate higher risk', 'Updated weekly']}
                        />
                        <InfoCard
                            title="Action Required"
                            content="2 suppliers require immediate review due to recent risk level changes."
                            variant="warning"
                        />
                    </div>
                </Section>

                {/* Quote Card */}
                <Section title="Quote Card">
                    <div className="max-w-md mx-auto space-y-4">
                        <QuoteCard
                            quote="Copper prices down 2.3% month-over-month due to increased Chinese production and softening demand."
                            source="Beroe Market Intelligence"
                            sentiment="negative"
                            highlight="2.3%"
                        />
                        <QuoteCard
                            quote="ESG compliance improved across 8 suppliers following recent certifications."
                            source="Internal Assessment"
                            sentiment="positive"
                        />
                    </div>
                </Section>

                {/* Recommendation Card */}
                <Section title="Recommendation Card">
                    <div className="max-w-md mx-auto">
                        <RecommendationCard
                            title="Diversify China Exposure"
                            recommendation="Consider adding alternative suppliers from Vietnam or India to reduce concentration risk in China region."
                            confidence="high"
                            reasoning={[
                                '15 suppliers concentrated in China (33% of portfolio)',
                                'Geopolitical tensions increasing supply risk',
                                'Alternative regions show 20% lower average SRS'
                            ]}
                            type="action"
                            actions={[
                                { label: 'Find Alternatives', primary: true },
                                { label: 'Dismiss' }
                            ]}
                        />
                    </div>
                </Section>

                {/* Checklist Card */}
                <Section title="Checklist Card">
                    <div className="max-w-md mx-auto">
                        <ChecklistCard
                            title={demoChecklist.title}
                            subtitle={demoChecklist.subtitle}
                            items={demoChecklist.items}
                            interactive={true}
                            showProgress={true}
                        />
                    </div>
                </Section>

                {/* Progress Card */}
                <Section title="Progress Card">
                    <div className="max-w-md mx-auto">
                        <ProgressCard
                            title={demoProgress.title}
                            subtitle={demoProgress.subtitle}
                            steps={demoProgress.steps}
                        />
                    </div>
                </Section>

                {/* NEW WIDGETS SECTION - PORTFOLIO */}
                <div className="mt-32 mb-16 pt-8 border-t border-slate-200/60 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-light text-[#1d1d1f] mb-2 tracking-tight">Portfolio Widgets</h2>
                    <p className="text-[#86868b] font-light">Portfolio-level risk visualization widgets.</p>
                </div>

                {/* Spend Exposure Widget */}
                <Section title="Spend Exposure Widget">
                    <div className="max-w-md mx-auto">
                        <SpendExposureWidget
                            totalSpendFormatted={demoSpendExposure.totalSpendFormatted}
                            breakdown={demoSpendExposure.breakdown}
                            highestExposure={demoSpendExposure.highestExposure}
                        />
                    </div>
                </Section>

                {/* Health Scorecard Widget */}
                <Section title="Health Scorecard Widget">
                    <div className="max-w-md mx-auto">
                        <HealthScorecardWidget
                            overallScore={demoHealthScorecard.overallScore}
                            scoreLabel={demoHealthScorecard.scoreLabel}
                            metrics={demoHealthScorecard.metrics}
                            concerns={demoHealthScorecard.concerns}
                        />
                    </div>
                </Section>

                {/* Events Feed Widget */}
                <Section title="Events Feed Widget">
                    <div className="max-w-md mx-auto">
                        <EventsFeedWidget
                            events={demoEventsFeed.events}
                            onViewAll={() => console.log('View all events')}
                            onEventClick={(id) => console.log('Event clicked:', id)}
                        />
                    </div>
                </Section>

                {/* Executive Summary Card */}
                <Section title="Executive Summary Card">
                    <div className="max-w-lg mx-auto">
                        <ExecutiveSummaryCard
                            title={demoExecutiveSummary.title}
                            period={demoExecutiveSummary.period}
                            keyPoints={demoExecutiveSummary.keyPoints}
                            metrics={demoExecutiveSummary.metrics}
                            focusAreas={demoExecutiveSummary.focusAreas}
                        />
                    </div>
                </Section>

                {/* Data List Card */}
                <Section title="Data List Card">
                    <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
                        <DataListCard
                            title="Top Risk Factors"
                            items={[
                                { id: '1', label: 'China Concentration', value: '33%', status: 'danger' },
                                { id: '2', label: 'ESG Gaps', value: '8 suppliers', status: 'warning' },
                                { id: '3', label: 'Single Source', value: '5 categories', status: 'warning' },
                                { id: '4', label: 'Financial Health', value: '3 concerns', status: 'default' },
                            ]}
                            variant="default"
                        />
                        <DataListCard
                            title="Recent Actions"
                            items={[
                                { id: '1', label: 'Reviewed Apple Inc.', sublabel: '2h ago', status: 'success' },
                                { id: '2', label: 'Updated thresholds', sublabel: '1d ago', status: 'success' },
                                { id: '3', label: 'Pending: ESG review', sublabel: '3 suppliers', status: 'warning' },
                            ]}
                            variant="compact"
                        />
                    </div>
                </Section>

                {/* Comparison Artifact */}
                <Section title="Comparison Artifact">
                    <div className="h-[600px] rounded-[1.25rem] overflow-hidden max-w-4xl mx-auto">
                        <ComparisonArtifact
                            suppliers={demoComparisonSuppliers}
                            onBack={() => console.log('Back')}
                            onRemoveSupplier={(id) => console.log('Remove:', id)}
                            onAddSupplier={() => console.log('Add supplier')}
                            onSelectSupplier={(s) => console.log('Select:', s.name)}
                            onExport={() => console.log('Export')}
                            onViewDashboard={() => console.log('View dashboard')}
                        />
                    </div>
                </Section>

                {/* Portfolio Dashboard Artifact */}
                <Section title="Portfolio Dashboard Artifact">
                    <div className="h-[700px] rounded-[1.25rem] overflow-hidden max-w-4xl mx-auto">
                        <PortfolioDashboardArtifact
                            totalSuppliers={20}
                            distribution={demoDistribution}
                            trends={{ period: '30d', newHighRisk: 2, improved: 3, deteriorated: 5 }}
                            alerts={demoPortfolioAlerts}
                            topMovers={demoTopMovers}
                            lastUpdated="May 6, 2024 at 9:15 AM"
                            onRefresh={() => console.log('Refresh')}
                            onExport={() => console.log('Export')}
                            onAlertClick={(a) => console.log('Alert:', a.headline)}
                            onSupplierClick={(id) => console.log('Supplier:', id)}
                            onViewAllRisks={(level) => console.log('View all:', level)}
                            onViewAllMovers={() => console.log('View all movers')}
                        />
                    </div>
                </Section>
            </div>
        </div>
    );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-32">
        <h2 className="text-xl font-normal text-[#86868b] mb-10 tracking-tight text-center">
            {title}
        </h2>
        {children}
    </div>
);

export default RiskComponentsShowcase;
