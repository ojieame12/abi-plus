import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
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
    insight?: {
        text: string;
        detail?: string;
    };
    onViewDetails?: () => void;
    beroeSourceCount?: number;
}

interface NewPriceGaugeWidgetProps {
    data: PriceGaugeData;
    onViewDetails?: () => void;
    beroeSourceCount?: number;
}

type PriceGaugeWidgetProps = LegacyPriceGaugeWidgetProps | NewPriceGaugeWidgetProps;

// Type guard to check if using new data format
const isNewFormat = (props: PriceGaugeWidgetProps): props is NewPriceGaugeWidgetProps => {
    return 'data' in props;
};

export const PriceGaugeWidget = (props: PriceGaugeWidgetProps) => {
    // Extract common props
    const onViewDetails = 'onViewDetails' in props ? props.onViewDetails : undefined;
    const beroeSourceCount = 'beroeSourceCount' in props ? props.beroeSourceCount : 3;

    // Normalize to common format
    let title: string;
    let price: string;
    let unit: string;
    let lastChecked: string;
    let change24h: { value: string; percent: string; direction: 'up' | 'down' };
    let change30d: { value: string; percent: string; direction: 'up' | 'down' };
    let market: string;
    let gaugeValue: number;
    let insight: { text: string; detail?: string } | undefined;

    if (isNewFormat(props)) {
        const { data } = props;
        title = `Current ${data.commodity} Price`;
        price = `$${data.currentPrice.toLocaleString()}`;
        unit = `/${data.unit}`;
        lastChecked = data.lastUpdated;
        change24h = {
            value: `$${Math.abs(data.change24h.value)}`,
            percent: `${Math.abs(data.change24h.percent).toFixed(2)}%`,
            direction: data.change24h.value >= 0 ? 'up' : 'down',
        };
        change30d = {
            value: `$${Math.abs(data.change30d.value)}`,
            percent: `${Math.abs(data.change30d.percent).toFixed(2)}%`,
            direction: data.change30d.value >= 0 ? 'up' : 'down',
        };
        market = data.market;
        gaugeValue = Math.round(data.gaugePosition * 0.32); // Convert 0-100 to 0-32
        insight = data.tags?.length ? { text: data.tags.join(', ') } : undefined;
    } else {
        title = props.title;
        price = props.price;
        unit = props.unit;
        lastChecked = props.lastChecked;
        change24h = props.change24h;
        change30d = props.change30d;
        market = props.market;
        gaugeValue = props.gaugeValue ?? 28;
        insight = props.insight;
    }
    // Calculate gauge position (0-32 scale, displayed as arc)
    const gaugePercent = (gaugeValue / 32) * 100;

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {title}
                </span>
            </div>

            {/* Gauge Section */}
            <div className="px-6 py-6 flex flex-col items-center">
                <div className="relative w-48 h-28">
                    {/* Gauge Background Arc */}
                    <svg className="w-full h-full" viewBox="0 0 200 110">
                        {/* Scale marks */}
                        {[0, 8, 16, 24, 32].map((mark, i) => {
                            const angle = -180 + (i * 180) / 4;
                            const rad = (angle * Math.PI) / 180;
                            const x1 = 100 + 85 * Math.cos(rad);
                            const y1 = 100 + 85 * Math.sin(rad);
                            const x2 = 100 + 75 * Math.cos(rad);
                            const y2 = 100 + 75 * Math.sin(rad);
                            const labelX = 100 + 95 * Math.cos(rad);
                            const labelY = 100 + 95 * Math.sin(rad);

                            return (
                                <g key={mark}>
                                    <line
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke="#e2e8f0"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={labelX}
                                        y={labelY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-[10px] fill-slate-400"
                                    >
                                        {mark}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Background arc */}
                        <path
                            d="M 15 100 A 85 85 0 0 1 185 100"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />

                        {/* Gradient fill arc */}
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22c55e" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 15 100 A 85 85 0 0 1 185 100"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${(gaugePercent / 100) * 267} 267`}
                        />

                        {/* Needle indicator */}
                        {(() => {
                            const needleAngle = -180 + (gaugePercent / 100) * 180;
                            const needleRad = (needleAngle * Math.PI) / 180;
                            const needleX = 100 + 70 * Math.cos(needleRad);
                            const needleY = 100 + 70 * Math.sin(needleRad);
                            return (
                                <circle
                                    cx={needleX}
                                    cy={needleY}
                                    r="6"
                                    fill="#6366f1"
                                    stroke="white"
                                    strokeWidth="2"
                                />
                            );
                        })()}
                    </svg>

                    {/* Center Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                        <div className="text-3xl font-light text-slate-900">
                            {price}<span className="text-lg font-normal text-slate-500">{unit}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            last checked by {lastChecked}
                        </div>
                    </div>
                </div>

                {/* Gauge Value Badge */}
                <div className="mt-2 px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                    {gaugeValue}/32
                </div>
            </div>

            {/* Insight Bar */}
            {insight && (
                <div className="mx-4 mb-4 px-4 py-3 bg-violet-50 rounded-lg flex items-center gap-3">
                    <TrendingDown size={18} strokeWidth={1.5} className="text-violet-600 flex-shrink-0" />
                    <div>
                        <div className="text-sm font-normal text-slate-900">{insight.text}</div>
                        {insight.detail && (
                            <div className="text-xs text-slate-500">{insight.detail}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-3 border-t border-slate-100">
                <div className="px-4 py-4 text-center border-r border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                        <span className={`text-lg font-semibold ${
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
                        <span className={`text-lg font-semibold ${
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

            {/* Data Attribution Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">B</span>
                    </div>
                    <span>{beroeSourceCount} Beroe Data Sources</span>
                </div>
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
