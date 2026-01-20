// Inflation Dashboard Artifact
// Full inflation overview with price movements, exposure, and drivers

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Download,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type { PriceChange, InflationDriver, DriverCategory } from '../../../types/inflation';

// ============================================
// TYPES
// ============================================

export interface InflationSummary {
  period: string;
  headline: string;
  overallChange: PriceChange;
  portfolioImpact: {
    amount: string;
    percent: number;
    direction: 'increase' | 'decrease';
  };
}

export interface PriceMovement {
  id: string;
  name: string;
  category: string;
  change: PriceChange;
  exposure: string;
}

export interface InflationAlert {
  id: string;
  type: 'spike' | 'drop' | 'volatility' | 'forecast';
  commodity: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface InflationDashboardArtifactProps {
  period?: string;
  summary?: InflationSummary;
  priceMovements?: PriceMovement[];
  drivers?: InflationDriver[];
  alerts?: InflationAlert[];
  onExport?: () => void;
  onDrillDown?: (commodity: string) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DRIVER_COLORS: Record<DriverCategory, string> = {
  supply: 'bg-blue-500',
  demand: 'bg-orange-500',
  geopolitical: 'bg-red-500',
  environmental: 'bg-green-500',
  currency: 'bg-purple-500',
  logistics: 'bg-cyan-500',
  regulatory: 'bg-slate-500',
  market_speculation: 'bg-amber-500',
};

const ALERT_STYLES = {
  high: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-slate-50 border-slate-200 text-slate-600',
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PriceChangeIndicator = ({ change, size = 'md' }: { change: PriceChange; size?: 'sm' | 'md' | 'lg' }) => {
  const isUp = change.direction === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const colorClass = isUp ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-medium ${colorClass} ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      {isUp ? '+' : ''}{change.percent}%
    </span>
  );
};

const MovementRow = ({ item, index, onClick }: { item: PriceMovement; index: number; onClick?: () => void }) => {
  const isUp = item.change.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUp ? 'bg-red-50' : 'bg-emerald-50'}`}>
          {isUp ? (
            <ArrowUpRight size={16} className="text-red-500" />
          ) : (
            <ArrowDownRight size={16} className="text-emerald-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{item.name}</p>
          <p className="text-xs text-slate-400">{item.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-500">{item.exposure}</span>
        <PriceChangeIndicator change={item.change} size="sm" />
      </div>
    </motion.div>
  );
};

const DriverBar = ({ driver, index, maxContribution }: { driver: InflationDriver; index: number; maxContribution: number }) => {
  const width = (driver.contribution / maxContribution) * 100;
  const color = DRIVER_COLORS[driver.category] || 'bg-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-sm text-slate-700">{driver.name}</span>
        </div>
        <span className="text-sm font-medium text-slate-800">{driver.contribution}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.5, delay: 0.15 + index * 0.04 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </motion.div>
  );
};

const AlertCard = ({ alert }: { alert: InflationAlert }) => {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${ALERT_STYLES[alert.severity]}`}>
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{alert.commodity}</p>
        <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const InflationDashboardArtifact = ({
  period = 'January 2026',
  summary,
  priceMovements = [],
  drivers = [],
  alerts = [],
  onExport,
  onDrillDown,
}: InflationDashboardArtifactProps) => {
  const [showAllMovements, setShowAllMovements] = useState(false);

  const displayedMovements = showAllMovements ? priceMovements : priceMovements.slice(0, 5);
  const maxContribution = Math.max(...drivers.map(d => d.contribution), 1);

  const topIncreases = priceMovements.filter(m => m.change.direction === 'up').slice(0, 3);
  const topDecreases = priceMovements.filter(m => m.change.direction === 'down').slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Period Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inflation Dashboard</p>
          <p className="text-lg font-medium text-slate-800">{period}</p>
        </motion.div>

        {/* Portfolio Impact Summary */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl border ${
              summary.portfolioImpact.direction === 'increase'
                ? 'bg-red-50/60 border-red-100/60'
                : 'bg-emerald-50/60 border-emerald-100/60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  summary.portfolioImpact.direction === 'increase' ? 'bg-red-100' : 'bg-emerald-100'
                }`}>
                  <DollarSign size={24} className={
                    summary.portfolioImpact.direction === 'increase' ? 'text-red-600' : 'text-emerald-600'
                  } strokeWidth={1.5} />
                </div>
                <div>
                  <p className={`text-sm ${
                    summary.portfolioImpact.direction === 'increase' ? 'text-red-600' : 'text-emerald-600'
                  }`}>Portfolio Impact</p>
                  <p className={`text-2xl font-light ${
                    summary.portfolioImpact.direction === 'increase' ? 'text-red-700' : 'text-emerald-700'
                  }`}>{summary.portfolioImpact.amount}</p>
                </div>
              </div>
              <PriceChangeIndicator change={summary.overallChange} size="lg" />
            </div>
            <p className="mt-3 text-sm text-slate-600">{summary.headline}</p>
          </motion.div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <ArtifactSection
            title="Price Alerts"
            badge={alerts.length}
            badgeVariant="warning"
            defaultOpen={true}
          >
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Top Movers Summary */}
        {(topIncreases.length > 0 || topDecreases.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {/* Top Increases */}
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/60">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-red-500" />
                <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Top Increases</span>
              </div>
              <div className="space-y-1.5">
                {topIncreases.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">{item.name}</span>
                    <span className="text-red-600 font-medium">+{item.change.percent}%</span>
                  </div>
                ))}
                {topIncreases.length === 0 && (
                  <p className="text-xs text-slate-400">No increases</p>
                )}
              </div>
            </div>

            {/* Top Decreases */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={14} className="text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Top Decreases</span>
              </div>
              <div className="space-y-1.5">
                {topDecreases.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">{item.name}</span>
                    <span className="text-emerald-600 font-medium">{item.change.percent}%</span>
                  </div>
                ))}
                {topDecreases.length === 0 && (
                  <p className="text-xs text-slate-400">No decreases</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Key Drivers */}
        {drivers.length > 0 && (
          <ArtifactSection
            title="Key Drivers"
            badge={drivers.length}
            icon={<Zap size={14} className="text-amber-500" />}
            defaultOpen={true}
          >
            <div className="space-y-3">
              {drivers.slice(0, 5).map((driver, i) => (
                <DriverBar
                  key={driver.id}
                  driver={driver}
                  index={i}
                  maxContribution={maxContribution}
                />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Price Movements */}
        {priceMovements.length > 0 && (
          <ArtifactSection
            title="Price Movements"
            badge={priceMovements.length}
            icon={<BarChart3 size={14} className="text-slate-400" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {displayedMovements.map((item, i) => (
                <MovementRow
                  key={item.id}
                  item={item}
                  index={i}
                  onClick={onDrillDown ? () => onDrillDown(item.id) : undefined}
                />
              ))}
            </div>
            {priceMovements.length > 5 && (
              <button
                onClick={() => setShowAllMovements(!showAllMovements)}
                className="w-full mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                {showAllMovements ? 'Show less' : `View all ${priceMovements.length} commodities`}
              </button>
            )}
          </ArtifactSection>
        )}
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: 'Export Report',
          variant: 'primary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
      />
    </div>
  );
};

export default InflationDashboardArtifact;
