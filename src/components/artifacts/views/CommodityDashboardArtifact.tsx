// Commodity Dashboard Artifact
// Single commodity deep dive with price history, drivers, exposure, and forecast

import { motion } from 'framer-motion';
import {
  Download,
  Calendar,
  DollarSign,
  Users,
  Zap,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Globe,
  Package,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type {
  CommodityPrice,
  PriceChange,
  PriceForecast,
  InflationDriver,
  CommodityExposure,
  SupplierExposure,
  CommodityCategory,
  DriverCategory,
} from '../../../types/inflation';

// ============================================
// TYPES
// ============================================

export interface HistoricalComparison {
  period: string;
  price: number;
  change: number;
}

export interface RelatedCommodity {
  name: string;
  correlation: number;
  change: PriceChange;
}

export interface CommodityDashboardArtifactProps {
  commodity?: CommodityPrice;
  drivers?: InflationDriver[];
  exposure?: CommodityExposure;
  affectedSuppliers?: SupplierExposure[];
  historicalComparison?: HistoricalComparison[];
  forecast?: PriceForecast;
  relatedCommodities?: RelatedCommodity[];
  onExport?: () => void;
  onSetAlert?: () => void;
  onViewSupplier?: (supplierId: string) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_ICONS: Record<CommodityCategory, typeof Package> = {
  metals: Package,
  energy: Zap,
  agriculture: Package,
  chemicals: Package,
  packaging: Package,
  logistics: Globe,
  other: Package,
};

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

const TIMEFRAME_LABELS = {
  daily: '1D',
  weekly: '1W',
  monthly: '1M',
  quarterly: '3M',
  yearly: '1Y',
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PriceHeader = ({ commodity }: { commodity: CommodityPrice }) => {
  const CategoryIcon = CATEGORY_ICONS[commodity.category] || Package;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/60"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <CategoryIcon size={24} className="text-slate-600" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-800">{commodity.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="capitalize">{commodity.category}</span>
              <span>·</span>
              <span>{commodity.market}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-light text-slate-800">
            {commodity.currency === 'USD' ? '$' : commodity.currency}
            {commodity.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500">per {commodity.unit}</p>
        </div>
      </div>

      {/* Price Changes */}
      {commodity.changes && (
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(commodity.changes).map(([timeframe, change]) => {
            if (!change) return null;
            const changeIsUp = change.direction === 'up';
            return (
              <div
                key={timeframe}
                className={`p-2 rounded-lg text-center ${
                  changeIsUp ? 'bg-red-50' : change.direction === 'down' ? 'bg-emerald-50' : 'bg-slate-50'
                }`}
              >
                <p className="text-[10px] text-slate-500 mb-0.5">
                  {TIMEFRAME_LABELS[timeframe as keyof typeof TIMEFRAME_LABELS]}
                </p>
                <p className={`text-sm font-medium ${
                  changeIsUp ? 'text-red-600' : change.direction === 'down' ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  {changeIsUp ? '+' : ''}{change.percent}%
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
        <Clock size={12} />
        <span>Updated {commodity.lastUpdated}</span>
      </div>
    </motion.div>
  );
};

const ForecastCard = ({ forecast }: { forecast: PriceForecast }) => {
  const range = forecast.high - forecast.low;
  const midPosition = ((forecast.mid - forecast.low) / range) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-4 bg-violet-50/50 rounded-xl border border-violet-100/60"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-violet-500" />
          <span className="text-sm font-medium text-violet-700">Price Forecast</span>
        </div>
        <span className="text-xs text-slate-500">{forecast.period}</span>
      </div>

      {/* Forecast Range */}
      <div className="relative mb-4">
        <div className="h-3 bg-gradient-to-r from-emerald-200 via-violet-200 to-red-200 rounded-full" />
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${midPosition}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute top-0 -translate-x-1/2"
        >
          <div className="w-3 h-3 bg-violet-600 rounded-full border-2 border-white shadow-sm" />
        </motion.div>
      </div>

      <div className="flex justify-between text-xs">
        <div className="text-emerald-600">
          <p className="font-medium">${forecast.low.toFixed(2)}</p>
          <p className="text-slate-400">Low</p>
        </div>
        <div className="text-center text-violet-600">
          <p className="font-medium">${forecast.mid.toFixed(2)}</p>
          <p className="text-slate-400">Expected</p>
        </div>
        <div className="text-red-600">
          <p className="font-medium">${forecast.high.toFixed(2)}</p>
          <p className="text-slate-400">High</p>
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-3 pt-3 border-t border-violet-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Confidence</span>
          <span className={`font-medium ${
            forecast.confidence >= 70 ? 'text-emerald-600' :
            forecast.confidence >= 40 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {forecast.confidence}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${forecast.confidence}%` }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`h-full rounded-full ${
              forecast.confidence >= 70 ? 'bg-emerald-500' :
              forecast.confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Factors */}
      {forecast.factors && forecast.factors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-violet-100">
          <p className="text-xs text-slate-500 mb-2">Key Factors</p>
          <div className="flex flex-wrap gap-1.5">
            {forecast.factors.map((factor, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white/80 text-xs text-slate-600 rounded-full border border-slate-200"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ExposureCard = ({ exposure }: { exposure: CommodityExposure }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/60"
    >
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={16} className="text-amber-600" />
        <span className="text-sm font-medium text-amber-700">Your Exposure</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Total Exposure</p>
          <p className="text-xl font-light text-slate-800">{exposure.exposureFormatted}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Suppliers</p>
          <p className="text-xl font-light text-slate-800">{exposure.supplierCount}</p>
        </div>
      </div>

      {/* Price Impact */}
      {exposure.priceChange && (
        <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Price Impact</span>
          <span className={`text-sm font-medium ${
            exposure.priceChange.direction === 'up' ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {exposure.priceChange.direction === 'up' ? '+' : ''}{exposure.priceChange.percent}%
          </span>
        </div>
      )}

      {/* Top Suppliers */}
      {exposure.topSuppliers && exposure.topSuppliers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-100">
          <p className="text-xs text-slate-500 mb-2">Top Suppliers</p>
          <div className="space-y-1">
            {exposure.topSuppliers.slice(0, 3).map((supplier, i) => (
              <p key={i} className="text-sm text-slate-700">{supplier}</p>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const DriverRow = ({
  driver,
  index,
  maxContribution,
}: {
  driver: InflationDriver;
  index: number;
  maxContribution: number;
}) => {
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
        <div className="flex items-center gap-2">
          <span className={`text-xs ${
            driver.direction === 'inflationary' ? 'text-red-500' :
            driver.direction === 'deflationary' ? 'text-emerald-500' : 'text-slate-400'
          }`}>
            {driver.direction === 'inflationary' ? '↑' : driver.direction === 'deflationary' ? '↓' : '–'}
          </span>
          <span className="text-sm font-medium text-slate-800">{driver.contribution}%</span>
        </div>
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

const SupplierRow = ({
  supplier,
  index,
  onClick,
}: {
  supplier: SupplierExposure;
  index: number;
  onClick?: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Users size={14} className="text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{supplier.supplierName}</p>
          {supplier.riskScore !== undefined && (
            <p className="text-xs text-slate-500">Risk Score: {supplier.riskScore}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-slate-800">{supplier.exposureFormatted}</p>
        {supplier.priceImpactFormatted && (
          <p className="text-xs text-red-600">{supplier.priceImpactFormatted} impact</p>
        )}
      </div>
    </motion.div>
  );
};

const HistoricalRow = ({
  item,
  index,
}: {
  item: HistoricalComparison;
  index: number;
}) => {
  const isUp = item.change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Calendar size={14} className="text-slate-500" />
        </div>
        <span className="text-sm text-slate-700">{item.period}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">${item.price.toFixed(2)}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${
          isUp ? 'text-red-600' : item.change < 0 ? 'text-emerald-600' : 'text-slate-500'
        }`}>
          {isUp ? <ArrowUpRight size={12} /> : item.change < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {isUp ? '+' : ''}{item.change}%
        </span>
      </div>
    </motion.div>
  );
};

const RelatedCommodityRow = ({
  item,
  index,
}: {
  item: RelatedCommodity;
  index: number;
}) => {
  const isUp = item.change.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700">{item.name}</span>
        <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
          {(item.correlation * 100).toFixed(0)}% correlated
        </span>
      </div>
      <span className={`text-sm font-medium ${
        isUp ? 'text-red-600' : 'text-emerald-600'
      }`}>
        {isUp ? '+' : ''}{item.change.percent}%
      </span>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CommodityDashboardArtifact = ({
  commodity,
  drivers = [],
  exposure,
  affectedSuppliers = [],
  historicalComparison = [],
  forecast,
  relatedCommodities = [],
  onExport,
  onSetAlert,
  onViewSupplier,
}: CommodityDashboardArtifactProps) => {
  if (!commodity) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Package size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">No Commodity Data</h3>
        <p className="text-sm text-slate-500">
          Select a commodity to view detailed analysis.
        </p>
      </div>
    );
  }

  const maxContribution = Math.max(...drivers.map(d => d.contribution), 1);

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Price Header */}
        <PriceHeader commodity={commodity} />

        {/* Forecast & Exposure Row */}
        <div className="grid grid-cols-2 gap-4">
          {forecast && <ForecastCard forecast={forecast} />}
          {exposure && <ExposureCard exposure={exposure} />}
        </div>

        {/* Single column if only one is present */}
        {!forecast && exposure && (
          <div className="grid grid-cols-1">
            <ExposureCard exposure={exposure} />
          </div>
        )}
        {forecast && !exposure && (
          <div className="grid grid-cols-1">
            <ForecastCard forecast={forecast} />
          </div>
        )}

        {/* Drivers */}
        {drivers.length > 0 && (
          <ArtifactSection
            title="Price Drivers"
            badge={drivers.length}
            icon={<Zap size={14} className="text-amber-500" />}
            defaultOpen={true}
          >
            <div className="space-y-3">
              {drivers.slice(0, 5).map((driver, i) => (
                <DriverRow
                  key={driver.id}
                  driver={driver}
                  index={i}
                  maxContribution={maxContribution}
                />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Affected Suppliers */}
        {affectedSuppliers.length > 0 && (
          <ArtifactSection
            title="Affected Suppliers"
            badge={affectedSuppliers.length}
            icon={<Users size={14} className="text-slate-400" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {affectedSuppliers.map((supplier, i) => (
                <SupplierRow
                  key={supplier.supplierId}
                  supplier={supplier}
                  index={i}
                  onClick={onViewSupplier ? () => onViewSupplier(supplier.supplierId) : undefined}
                />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Historical Comparison */}
        {historicalComparison.length > 0 && (
          <ArtifactSection
            title="Historical Prices"
            badge={historicalComparison.length}
            icon={<BarChart3 size={14} className="text-slate-400" />}
            defaultOpen={false}
          >
            <div className="space-y-2">
              {historicalComparison.map((item, i) => (
                <HistoricalRow key={item.period} item={item} index={i} />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Related Commodities */}
        {relatedCommodities.length > 0 && (
          <ArtifactSection
            title="Related Commodities"
            badge={relatedCommodities.length}
            defaultOpen={false}
          >
            <div className="space-y-2">
              {relatedCommodities.map((item, i) => (
                <RelatedCommodityRow key={item.name} item={item} index={i} />
              ))}
            </div>
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
        secondaryActions={onSetAlert ? [
          {
            id: 'alert',
            label: 'Set Alert',
            variant: 'secondary',
            onClick: onSetAlert,
          },
        ] : undefined}
      />
    </div>
  );
};

export default CommodityDashboardArtifact;
