import { TrendingUp, TrendingDown, ChevronRight, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import type { PriceGaugeData } from '../../types/widgets';

// Props can be either the new structured data OR the legacy props
interface LegacyPriceGaugeWidgetProps {
    title: string;
    price: string;
    unit: string;
    lastChecked: string;
    change24h: {
        value: string;
        percent: string;
        direction: 'up' | 'down';
    };
    change30d: {
        value: string;
        percent: string;
        direction: 'up' | 'down';
    };
    market: string;
    gaugeValue?: number;
    onViewDetails?: () => void;
    beroeSourceCount?: number;
    hideFooter?: boolean;
}

interface NewPriceGaugeWidgetProps {
    data: PriceGaugeData;
    onViewDetails?: () => void;
    beroeSourceCount?: number;
    hideFooter?: boolean;
}

type PriceGaugeWidgetProps = LegacyPriceGaugeWidgetProps | NewPriceGaugeWidgetProps;

// Type guard to check if using new data format
const isNewFormat = (props: PriceGaugeWidgetProps): props is NewPriceGaugeWidgetProps => {
    return 'data' in props;
};

export const PriceGaugeWidget = (props: PriceGaugeWidgetProps) => {
    // Extract common props
    const onViewDetails = 'onViewDetails' in props ? props.onViewDetails : undefined;
    const beroeSourceCount = 'beroeSourceCount' in props ? (props.beroeSourceCount ?? 0) : 0;
    const hideFooter = 'hideFooter' in props ? props.hideFooter : false;

    // Normalize to common format
    let title: string;
    let price: string;
    let unit: string;
    let lastChecked: string;
    let change24h: { value: string; percent: string; direction: 'up' | 'down' };
    let change30d: { value: string; percent: string; direction: 'up' | 'down' };
    let market: string;
    let gaugeValue: number;

    // Enriched fields (optional)
    let sentiment: PriceGaugeData['sentiment'] | undefined;
    let volatility30d: number | undefined;
    let supplyRisk: PriceGaugeData['supplyRisk'] | undefined;

    if (isNewFormat(props)) {
        const { data } = props;
        title = `Current ${data.commodity} Price`;
        price = `$${data.currentPrice.toLocaleString()}`;
        unit = `/${data.unit}`;
        lastChecked = data.lastUpdated;
        change24h = {
            value: `$${Math.abs(data.change24h.value).toFixed(2)}`,
            percent: `${Math.abs(data.change24h.percent).toFixed(2)}%`,
            direction: data.change24h.value >= 0 ? 'up' : 'down',
        };
        change30d = {
            value: `$${Math.abs(data.change30d.value).toFixed(2)}`,
            percent: `${Math.abs(data.change30d.percent).toFixed(2)}%`,
            direction: data.change30d.value >= 0 ? 'up' : 'down',
        };
        market = data.market;
        gaugeValue = Math.round(data.gaugePosition * 0.32); // Convert 0-100 to 0-32

        // Extract enriched fields
        sentiment = data.sentiment;
        volatility30d = data.volatility30d;
        supplyRisk = data.supplyRisk;
    } else {
        title = props.title;
        price = props.price;
        unit = props.unit;
        lastChecked = props.lastChecked;
        change24h = props.change24h;
        change30d = props.change30d;
        market = props.market;
        gaugeValue = props.gaugeValue ?? 28;
    }

    // Check if we have any enriched data to show
    const hasEnrichedData = sentiment || volatility30d !== undefined || supplyRisk;
    // Calculate gauge position (0-32 scale, displayed as arc)
    const gaugePercent = (gaugeValue / 32) * 100;

    // When hideFooter is true, WidgetRenderer provides the container
    const containerClasses = hideFooter
        ? 'overflow-hidden'
        : 'bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]';

    return (
        <div className={containerClasses}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {title}
                </span>
            </div>

            {/* Gauge Section */}
            <div className="px-6 py-6 flex flex-col items-center">
                {/* Gauge SVG - properly sized with labels outside */}
                <div className="relative w-56 h-32">
                    <svg className="w-full h-full" viewBox="0 0 200 120">
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22c55e" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>

                        {/* Background arc - centered at (100, 95) with radius 70 */}
                        <path
                            d="M 30 95 A 70 70 0 0 1 170 95"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="14"
                            strokeLinecap="round"
                        />

                        {/* Gradient fill arc */}
                        <path
                            d="M 30 95 A 70 70 0 0 1 170 95"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${(gaugePercent / 100) * 220} 220`}
                        />

                        {/* Needle indicator dot */}
                        {(() => {
                            const needleAngle = -180 + (gaugePercent / 100) * 180;
                            const needleRad = (needleAngle * Math.PI) / 180;
                            const needleX = 100 + 55 * Math.cos(needleRad);
                            const needleY = 95 + 55 * Math.sin(needleRad);
                            return (
                                <circle
                                    cx={needleX}
                                    cy={needleY}
                                    r="5"
                                    fill="#6366f1"
                                    stroke="white"
                                    strokeWidth="2"
                                />
                            );
                        })()}

                        {/* Scale labels - positioned outside the arc */}
                        <text x="18" y="100" textAnchor="middle" className="text-[11px] fill-slate-400">0</text>
                        <text x="40" y="50" textAnchor="middle" className="text-[11px] fill-slate-400">8</text>
                        <text x="100" y="18" textAnchor="middle" className="text-[11px] fill-slate-400">16</text>
                        <text x="160" y="50" textAnchor="middle" className="text-[11px] fill-slate-400">24</text>
                        <text x="182" y="100" textAnchor="middle" className="text-[11px] fill-slate-400">32</text>
                    </svg>
                </div>

                {/* Center Value - positioned below gauge */}
                <div className="flex flex-col items-center -mt-8">
                    <div className="text-3xl font-light text-slate-900">
                        {price}<span className="text-lg font-normal text-slate-500">{unit}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                        last checked by {lastChecked}
                    </div>
                </div>

                {/* Gauge Value Badge */}
                <div className="mt-3 px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                    {gaugeValue}/32
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 border-t border-slate-100">
                <div className="px-4 py-4 text-center border-r border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                        <span className={`text-lg font-medium ${
                            change24h.direction === 'up' ? 'text-red-600' : 'text-green-600'
                        }`}>
                            {change24h.direction === 'up' ? '+' : ''}{change24h.value}
                        </span>
                        <span className="text-sm text-slate-400">({change24h.percent})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">24h Change</div>
                </div>
                <div className="px-4 py-4 text-center border-r border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                        <span className={`text-lg font-medium ${
                            change30d.direction === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {change30d.direction === 'up' ? '+' : ''}{change30d.value}
                        </span>
                        <span className="text-sm text-slate-400">({change30d.percent})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">30d Change</div>
                </div>
                <div className="px-4 py-4 text-center">
                    <div className="text-lg font-normal text-slate-900">{market}</div>
                    <div className="text-xs text-slate-500 mt-1">Market</div>
                </div>
            </div>

            {/* Enriched Market Insights Row (only shown if enriched data available) */}
            {hasEnrichedData && (
                <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    {sentiment && (
                        <div className="flex items-center gap-1.5">
                            <BarChart3 size={14} strokeWidth={1.5} className={
                                sentiment === 'bullish' ? 'text-emerald-500' :
                                sentiment === 'bearish' ? 'text-red-500' : 'text-slate-400'
                            } />
                            <span className={`text-xs font-medium capitalize ${
                                sentiment === 'bullish' ? 'text-emerald-600' :
                                sentiment === 'bearish' ? 'text-red-600' : 'text-slate-500'
                            }`}>
                                {sentiment}
                            </span>
                        </div>
                    )}
                    {volatility30d !== undefined && (
                        <div className="flex items-center gap-1.5">
                            <Activity size={14} strokeWidth={1.5} className={
                                volatility30d > 15 ? 'text-amber-500' :
                                volatility30d > 10 ? 'text-yellow-500' : 'text-slate-400'
                            } />
                            <span className="text-xs text-slate-600">
                                {volatility30d.toFixed(1)}% <span className="text-slate-400">vol</span>
                            </span>
                        </div>
                    )}
                    {supplyRisk && (
                        <div className="flex items-center gap-1.5">
                            <AlertTriangle size={14} strokeWidth={1.5} className={
                                supplyRisk === 'high' ? 'text-red-500' :
                                supplyRisk === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                            } />
                            <span className={`text-xs font-medium ${
                                supplyRisk === 'high' ? 'text-red-600' :
                                supplyRisk === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                                {supplyRisk === 'high' ? 'High' : supplyRisk === 'medium' ? 'Med' : 'Low'} supply risk
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Data Attribution Footer - hidden when WidgetRenderer handles it */}
            {!hideFooter && ((beroeSourceCount ?? 0) > 0 || onViewDetails) && (
                <div className={`flex items-center px-5 py-3 border-t border-slate-100 bg-slate-50/30 ${(beroeSourceCount ?? 0) > 0 ? 'justify-between' : 'justify-end'}`}>
                    {(beroeSourceCount ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                                <span className="text-[8px] font-medium text-white">B</span>
                            </div>
                            <span>{beroeSourceCount} Beroe Data Sources</span>
                        </div>
                    )}
                    {onViewDetails && (
                        <button
                            onClick={onViewDetails}
                            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors group"
                        >
                            <span>View Details</span>
                            <ChevronRight
                                size={16}
                                strokeWidth={1.5}
                                className="group-hover:translate-x-0.5 transition-transform"
                            />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Compact version for inline use
export const PriceWidgetCompact = ({
    title,
    price,
    unit,
    change,
    direction,
}: {
    title: string;
    price: string;
    unit: string;
    change: string;
    direction: 'up' | 'down';
}) => (
    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <div>
            <div className="text-xs text-slate-500">{title}</div>
            <div className="font-normal text-slate-900">
                {price}<span className="text-sm font-normal text-slate-500">{unit}</span>
            </div>
        </div>
        <div className={`flex items-center gap-1 ${
            direction === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
            {direction === 'up' ? <TrendingUp size={14} strokeWidth={1.5} /> : <TrendingDown size={14} strokeWidth={1.5} />}
            <span className="text-sm font-medium">{change}</span>
        </div>
    </div>
);
