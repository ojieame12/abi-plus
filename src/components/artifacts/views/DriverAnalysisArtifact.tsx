// Driver Analysis Artifact
// Detailed root cause analysis for price changes with market context

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  ExternalLink,
  Newspaper,
  BarChart3,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type { PriceChange, InflationDriver, DriverCategory } from '../../../types/inflation';

// Re-export DriverContribution for external use

// ============================================
// TYPES
// ============================================

export interface MarketNews {
  title: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}

export interface HistoricalDriver {
  period: string;
  topDriver: string;
  change: number;
}

export interface DriverContribution {
  driver: string;
  category: DriverCategory;
  contribution: number;
}

export interface DriverAnalysisArtifactProps {
  commodity?: string;
  period?: string;
  priceChange?: PriceChange;
  drivers?: InflationDriver[];
  driverContributions?: DriverContribution[];
  marketNews?: MarketNews[];
  historicalDrivers?: HistoricalDriver[];
  marketContext?: string;
  sources?: Array<{ title: string; source: string; url?: string }>;
  onExport?: () => void;
  onViewCommodity?: () => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DRIVER_CATEGORY_LABELS: Record<DriverCategory, string> = {
  supply: 'Supply',
  demand: 'Demand',
  geopolitical: 'Geopolitical',
  environmental: 'Environmental',
  currency: 'Currency',
  logistics: 'Logistics',
  regulatory: 'Regulatory',
  market_speculation: 'Market',
};

const DRIVER_COLORS: Record<DriverCategory, { bg: string; text: string; bar: string }> = {
  supply: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  demand: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  geopolitical: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  environmental: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  currency: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  logistics: { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500' },
  regulatory: { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-500' },
  market_speculation: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
};

const SENTIMENT_COLORS = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-slate-500',
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PriceHeader = ({ commodity, priceChange, period }: { commodity: string; priceChange: PriceChange; period: string }) => {
  const isUp = priceChange.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${isUp ? 'bg-red-50/60 border-red-100/60' : 'bg-emerald-50/60 border-emerald-100/60'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isUp ? 'bg-red-100' : 'bg-emerald-100'}`}>
            <Search size={24} className={isUp ? 'text-red-600' : 'text-emerald-600'} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Price Drivers</p>
            <p className="text-xl font-medium text-slate-900">{commodity}</p>
            <p className="text-xs text-slate-400">{period}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isUp ? 'bg-red-100' : 'bg-emerald-100'}`}>
          {isUp ? (
            <TrendingUp size={20} className="text-red-600" />
          ) : (
            <TrendingDown size={20} className="text-emerald-600" />
          )}
          <span className={`text-xl font-medium ${isUp ? 'text-red-700' : 'text-emerald-700'}`}>
            {isUp ? '+' : ''}{priceChange.percent}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const DriverCard = ({ driver, index, maxContribution }: { driver: InflationDriver; index: number; maxContribution: number }) => {
  const colors = DRIVER_COLORS[driver.category] || DRIVER_COLORS.supply;
  const width = (driver.contribution / maxContribution) * 100;
  const isInflationary = driver.direction === 'inflationary';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${colors.bg} ${colors.text}`}>
              {DRIVER_CATEGORY_LABELS[driver.category]}
            </span>
            <span className={`text-xs ${isInflationary ? 'text-red-500' : 'text-emerald-500'}`}>
              {isInflationary ? '↑ Inflationary' : '↓ Deflationary'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800">{driver.name}</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-medium text-slate-800">{driver.contribution}%</span>
          <p className="text-xs text-slate-400">contribution</p>
        </div>
      </div>

      {/* Contribution Bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
          className={`h-full ${colors.bar} rounded-full`}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">{driver.description}</p>

      {/* Related Commodities */}
      {driver.relatedCommodities && driver.relatedCommodities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {driver.relatedCommodities.slice(0, 3).map((commodity, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
              {commodity}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const NewsItem = ({ news, index }: { news: MarketNews; index: number }) => {
  const sentimentColor = SENTIMENT_COLORS[news.sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0`}>
        <Newspaper size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 line-clamp-2">{news.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">{news.source}</span>
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs text-slate-400">{news.date}</span>
          <span className={`text-xs ${sentimentColor}`}>
            {news.sentiment === 'positive' ? '↑' : news.sentiment === 'negative' ? '↓' : '→'}
          </span>
        </div>
      </div>
      {news.url && (
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
};

const HistoricalComparison = ({ data }: { data: HistoricalDriver[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-sm text-slate-600">{item.period}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700">{item.topDriver}</span>
            <span className={`text-sm font-medium ${item.change >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {item.change >= 0 ? '+' : ''}{item.change}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DriverAnalysisArtifact = ({
  commodity = 'Commodity',
  period = 'January 2026',
  priceChange = { percent: 0, absolute: 0, direction: 'stable' },
  drivers = [],
  marketNews = [],
  historicalDrivers = [],
  marketContext,
  sources = [],
  onExport,
  onViewCommodity,
}: DriverAnalysisArtifactProps) => {
  const [activeTab, setActiveTab] = useState<'drivers' | 'news' | 'history'>('drivers');

  const maxContribution = Math.max(...drivers.map(d => d.contribution), 1);
  const totalContribution = drivers.reduce((sum, d) => sum + d.contribution, 0);

  // Group drivers by category for summary
  const driversByCategory = drivers.reduce((acc, driver) => {
    const category = driver.category;
    if (!acc[category]) acc[category] = 0;
    acc[category] += driver.contribution;
    return acc;
  }, {} as Record<DriverCategory, number>);

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Header */}
        <PriceHeader commodity={commodity} priceChange={priceChange} period={period} />

        {/* Market Context */}
        {marketContext && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-slate-50/80 rounded-xl border border-slate-100"
          >
            <p className="text-sm text-slate-600 leading-relaxed">{marketContext}</p>
          </motion.div>
        )}

        {/* Category Summary */}
        {Object.keys(driversByCategory).length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(driversByCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([category, contribution], i) => {
                const colors = DRIVER_COLORS[category as DriverCategory] || DRIVER_COLORS.supply;
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`p-3 rounded-xl text-center ${colors.bg}`}
                  >
                    <span className={`text-lg font-medium ${colors.text}`}>{contribution}%</span>
                    <p className={`text-xs ${colors.text} opacity-80`}>
                      {DRIVER_CATEGORY_LABELS[category as DriverCategory]}
                    </p>
                  </motion.div>
                );
              })}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'drivers' as const, label: 'Drivers', icon: BarChart3, count: drivers.length },
            { id: 'news' as const, label: 'Market News', icon: Newspaper, count: marketNews.length },
            { id: 'history' as const, label: 'Historical', icon: Clock, count: historicalDrivers.length },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs bg-slate-200 text-slate-600 px-1.5 rounded-full">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'drivers' && (
          <ArtifactSection
            title="Contributing Factors"
            badge={`${totalContribution}% explained`}
            collapsible={false}
          >
            <div className="space-y-3">
              {drivers.length > 0 ? (
                drivers.map((driver, i) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    index={i}
                    maxContribution={maxContribution}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No driver data available</p>
              )}
            </div>
          </ArtifactSection>
        )}

        {activeTab === 'news' && (
          <ArtifactSection
            title="Market News & Signals"
            badge={marketNews.length}
            collapsible={false}
          >
            <div className="space-y-2">
              {marketNews.length > 0 ? (
                marketNews.map((news, i) => (
                  <NewsItem key={i} news={news} index={i} />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No news available</p>
              )}
            </div>
          </ArtifactSection>
        )}

        {activeTab === 'history' && (
          <ArtifactSection
            title="Historical Comparison"
            collapsible={false}
          >
            {historicalDrivers.length > 0 ? (
              <HistoricalComparison data={historicalDrivers} />
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No historical data available</p>
            )}
          </ArtifactSection>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <ArtifactSection title="Data Sources" badge={sources.length} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                >
                  {source.source}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </ArtifactSection>
        )}
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: 'Export Analysis',
          variant: 'primary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
        secondaryActions={
          onViewCommodity
            ? [
                {
                  id: 'view_commodity',
                  label: 'View Commodity',
                  variant: 'secondary',
                  onClick: onViewCommodity,
                  icon: <ChevronRight size={16} />,
                },
              ]
            : []
        }
      />
    </div>
  );
};

export default DriverAnalysisArtifact;
