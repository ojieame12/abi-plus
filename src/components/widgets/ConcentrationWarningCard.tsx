// Concentration Warning Card Widget
// Alert when portfolio has concentration risk

import { motion } from 'framer-motion';
import { AlertTriangle, Building2, MapPin, Package, ChevronRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type ConcentrationType = 'supplier' | 'category' | 'region';
export type SeverityLevel = 'high' | 'medium' | 'low';

export interface ConcentrationWarningCardProps {
  type: ConcentrationType;
  entity: string;
  concentration: number; // percentage
  threshold: number; // threshold percentage
  spend: string;
  severity: SeverityLevel;
  onViewDetails?: () => void;
  delay?: number;
  hideFooter?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const TYPE_CONFIG: Record<ConcentrationType, { icon: typeof Building2; label: string }> = {
  supplier: { icon: Building2, label: 'Supplier Concentration' },
  category: { icon: Package, label: 'Category Concentration' },
  region: { icon: MapPin, label: 'Regional Concentration' },
};

const SEVERITY_STYLES: Record<SeverityLevel, {
  bg: string;
  border: string;
  icon: string;
  text: string;
  badge: string;
}> = {
  high: {
    bg: 'bg-red-50/80',
    border: 'border-red-200/60',
    icon: 'text-red-600',
    text: 'text-red-900',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200/60',
    icon: 'text-amber-600',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: {
    bg: 'bg-slate-50/80',
    border: 'border-slate-200/60',
    icon: 'text-slate-500',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-600',
  },
};

// ============================================
// HELPER COMPONENTS
// ============================================

const ConcentrationGauge = ({
  value,
  threshold,
  severity,
  delay = 0,
}: {
  value: number;
  threshold: number;
  severity: SeverityLevel;
  delay?: number;
}) => {
  const gaugeColor = severity === 'high'
    ? 'bg-red-500'
    : severity === 'medium'
    ? 'bg-amber-500'
    : 'bg-slate-400';

  const thresholdPosition = Math.min(100, threshold);

  return (
    <div className="relative h-2 bg-slate-100 rounded-full overflow-visible">
      {/* Progress bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{
          duration: 0.6,
          delay: delay + 0.2,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className={`absolute inset-y-0 left-0 ${gaugeColor} rounded-full`}
      />

      {/* Threshold marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400"
        style={{ left: `${thresholdPosition}%` }}
      >
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 whitespace-nowrap">
          {threshold}% limit
        </span>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ConcentrationWarningCard = ({
  type,
  entity,
  concentration,
  threshold,
  spend,
  severity,
  onViewDetails,
  delay = 0,
  hideFooter = false,
}: ConcentrationWarningCardProps) => {
  const typeConfig = TYPE_CONFIG[type];
  const TypeIcon = typeConfig.icon;
  const styles = SEVERITY_STYLES[severity];
  const isOverThreshold = concentration > threshold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`${styles.bg} backdrop-blur-xl border ${styles.border} rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
          className={`p-2 rounded-xl ${severity === 'high' ? 'bg-red-100' : severity === 'medium' ? 'bg-amber-100' : 'bg-slate-100'}`}
        >
          <AlertTriangle size={20} className={styles.icon} />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon size={14} className="text-slate-400" />
            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider">
              {typeConfig.label}
            </span>
          </div>
          <h3 className={`text-base font-medium ${styles.text}`}>
            {entity}
          </h3>
        </div>

        {/* Severity Badge */}
        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${styles.badge}`}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)} Risk
        </span>
      </div>

      {/* Concentration Metric */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className={`text-3xl font-light ${styles.text}`}>
              {concentration}%
            </span>
            <span className="text-sm text-slate-500 ml-2">
              of portfolio spend
            </span>
          </div>
          <span className="text-sm font-medium text-slate-700">{spend}</span>
        </div>

        {/* Gauge */}
        <ConcentrationGauge
          value={concentration}
          threshold={threshold}
          severity={severity}
          delay={delay}
        />

        {isOverThreshold && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
            className="text-xs text-slate-500 mt-2"
          >
            Exceeds recommended threshold by {(concentration - threshold).toFixed(1)}%
          </motion.p>
        )}
      </div>

      {/* Footer Action - hidden when WidgetRenderer handles it */}
      {!hideFooter && onViewDetails && (
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onViewDetails}
          className="w-full mt-4 pt-3 border-t border-white/60 flex items-center justify-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          View Diversification Options
          <ChevronRight size={16} />
        </motion.button>
      )}
    </motion.div>
  );
};

export default ConcentrationWarningCard;
