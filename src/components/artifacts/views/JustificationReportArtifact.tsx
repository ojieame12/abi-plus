// Justification Report Artifact
// Full price increase validation report with market comparison and negotiation support

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Download,
  Scale,
  FileText,
  Calendar,
  ExternalLink,
  Shield,
  Target,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type {
  PriceJustification,
  JustificationVerdict,
  JustificationFactor,
  SupportingDataPoint,
} from '../../../types/inflation';

// Re-export for external use

// ============================================
// TYPES
// ============================================

export interface HistoricalPricing {
  date: string;
  supplierPrice: number;
  marketPrice: number;
}

export interface CompetitorPricing {
  supplier: string;
  price: number;
  delta: number;
}

export interface ContractTerms {
  escalationClause: boolean;
  indexTied: boolean;
  renegotiationDate?: string;
}

export interface JustificationReportArtifactProps {
  justification?: PriceJustification;
  historicalPricing?: HistoricalPricing[];
  competitorPricing?: CompetitorPricing[];
  contractTerms?: ContractTerms;
  onExport?: () => void;
  onStartNegotiation?: () => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const VERDICT_STYLES: Record<JustificationVerdict, {
  bg: string;
  border: string;
  text: string;
  icon: typeof CheckCircle2;
  label: string;
}> = {
  justified: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle2,
    label: 'Justified',
  },
  partially_justified: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: MinusCircle,
    label: 'Partially Justified',
  },
  questionable: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    label: 'Questionable',
  },
  insufficient_data: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    icon: AlertTriangle,
    label: 'Insufficient Data',
  },
};

const FACTOR_VERDICT_STYLES = {
  supports: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  neutral: { icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-50' },
  disputes: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

const DATA_TYPE_ICONS = {
  index: TrendingUp,
  news: FileText,
  contract: Shield,
  history: Calendar,
};

// ============================================
// HELPER COMPONENTS
// ============================================

const VerdictHeader = ({
  justification,
}: {
  justification: PriceJustification;
}) => {
  const verdict = justification.verdict;
  const style = VERDICT_STYLES[verdict];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-xl border ${style.bg} ${style.border}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center`}>
          <Icon size={24} className={style.text} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${style.text}`}>{style.label}</span>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-1">
            {justification.supplierName}
          </h3>
          <p className="text-sm text-slate-600">
            {justification.commodity} price increase request
          </p>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Requested</p>
          <p className="text-xl font-medium text-slate-800">
            +{justification.requestedIncrease}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Market Avg</p>
          <p className="text-xl font-medium text-slate-800">
            +{justification.marketIncrease}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Variance</p>
          <p className={`text-xl font-medium ${
            justification.variance > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {justification.variance > 0 ? '+' : ''}{justification.variance}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const MarketPositionGauge = ({
  marketComparison,
}: {
  marketComparison: PriceJustification['marketComparison'];
}) => {
  const { supplierPrice, marketAvg, marketLow, marketHigh, percentile } = marketComparison;
  const range = marketHigh - marketLow;
  const supplierPosition = range > 0 ? ((supplierPrice - marketLow) / range) * 100 : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-4 bg-slate-50 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-2 mb-4">
        <Scale size={16} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Market Position</span>
        <span className="ml-auto text-sm text-slate-500">
          {percentile}th percentile
        </span>
      </div>

      {/* Price Range Bar */}
      <div className="relative mb-4">
        <div className="h-3 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full" />

        {/* Market Average Marker */}
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${((marketAvg - marketLow) / range) * 100}%` }}
        >
          <div className="w-0.5 h-5 bg-slate-400 -mt-1" />
          <p className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">Avg</p>
        </div>

        {/* Supplier Position Marker */}
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${Math.min(Math.max(supplierPosition, 5), 95)}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute top-0 -translate-x-1/2"
        >
          <div className="w-3 h-3 bg-violet-600 rounded-full border-2 border-white shadow-sm -mt-0" />
          <p className="text-[10px] font-medium text-violet-600 mt-1 whitespace-nowrap">
            Supplier
          </p>
        </motion.div>
      </div>

      {/* Price Labels */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>${marketLow.toFixed(2)}</span>
        <span>${marketHigh.toFixed(2)}</span>
      </div>
    </motion.div>
  );
};

const FactorRow = ({
  factor,
  index,
}: {
  factor: JustificationFactor;
  index: number;
}) => {
  const style = FACTOR_VERDICT_STYLES[factor.verdict];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 ${style.bg}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className={style.color} />
        <span className="text-sm font-medium text-slate-800">{factor.name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <span className="text-slate-500">Claimed: </span>
          <span className="text-slate-700">{factor.claimed}%</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500">Market: </span>
          <span className="text-slate-700">{factor.market}%</span>
        </div>
        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
          factor.delta > 0 ? 'bg-red-100 text-red-700' :
          factor.delta < 0 ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {factor.delta > 0 ? '+' : ''}{factor.delta}%
        </div>
      </div>
    </motion.div>
  );
};

const NegotiationPointCard = ({ points }: { points: string[] }) => {
  if (!points || points.length === 0) return null;

  return (
    <ArtifactSection
      title="Negotiation Points"
      badge={points.length}
      icon={<MessageSquare size={14} className="text-violet-500" />}
      defaultOpen={true}
    >
      <div className="space-y-2">
        {points.map((point, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            className="flex items-start gap-3 p-3 bg-violet-50/50 rounded-xl border border-violet-100/60"
          >
            <Target size={14} className="text-violet-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">{point}</p>
          </motion.div>
        ))}
      </div>
    </ArtifactSection>
  );
};

const SupportingDataCard = ({ data }: { data: SupportingDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <ArtifactSection
      title="Supporting Data"
      badge={data.length}
      icon={<FileText size={14} className="text-slate-400" />}
      defaultOpen={false}
    >
      <div className="space-y-2">
        {data.map((item, i) => {
          const Icon = DATA_TYPE_ICONS[item.type] || FileText;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.03 }}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                {item.value && (
                  <p className="text-xs text-slate-600 mt-0.5">{item.value}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{item.date}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:text-violet-600 flex items-center gap-0.5"
                    >
                      <ExternalLink size={10} />
                      View
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ArtifactSection>
  );
};

const CompetitorComparison = ({ competitors }: { competitors: CompetitorPricing[] }) => {
  if (!competitors || competitors.length === 0) return null;

  return (
    <ArtifactSection
      title="Competitor Pricing"
      badge={competitors.length}
      defaultOpen={false}
    >
      <div className="space-y-2">
        {competitors.map((comp, i) => (
          <motion.div
            key={comp.supplier}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.03 }}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
          >
            <span className="text-sm text-slate-700">{comp.supplier}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-800">
                ${comp.price.toFixed(2)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                comp.delta < 0 ? 'bg-emerald-100 text-emerald-700' :
                comp.delta > 0 ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {comp.delta > 0 ? '+' : ''}{comp.delta}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </ArtifactSection>
  );
};

const ContractInfo = ({ terms }: { terms: ContractTerms }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-slate-50 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Contract Terms</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          {terms.escalationClause ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <XCircle size={14} className="text-slate-300" />
          )}
          <span className="text-sm text-slate-600">Escalation Clause</span>
        </div>
        <div className="flex items-center gap-2">
          {terms.indexTied ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <XCircle size={14} className="text-slate-300" />
          )}
          <span className="text-sm text-slate-600">Index-Tied</span>
        </div>
      </div>
      {terms.renegotiationDate && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600">
            Renegotiation: {terms.renegotiationDate}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const JustificationReportArtifact = ({
  justification,
  competitorPricing = [],
  contractTerms,
  onExport,
  onStartNegotiation,
}: JustificationReportArtifactProps) => {
  if (!justification) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Scale size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">No Justification Data</h3>
        <p className="text-sm text-slate-500">
          Submit a price increase request to generate a justification report.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Verdict Header */}
        <VerdictHeader justification={justification} />

        {/* Market Position */}
        {justification.marketComparison && (
          <MarketPositionGauge marketComparison={justification.marketComparison} />
        )}

        {/* Recommendation */}
        {justification.recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 bg-violet-50/50 rounded-xl border border-violet-100/60"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-violet-500" />
              <span className="text-sm font-medium text-violet-700">Recommendation</span>
            </div>
            <p className="text-sm text-slate-700">{justification.recommendation}</p>
          </motion.div>
        )}

        {/* Factor Analysis */}
        {justification.factors && justification.factors.length > 0 && (
          <ArtifactSection
            title="Factor Analysis"
            badge={justification.factors.length}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {justification.factors.map((factor, i) => (
                <FactorRow key={factor.name} factor={factor} index={i} />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Negotiation Points */}
        <NegotiationPointCard points={justification.negotiationPoints} />

        {/* Contract Terms */}
        {contractTerms && <ContractInfo terms={contractTerms} />}

        {/* Competitor Pricing */}
        <CompetitorComparison competitors={competitorPricing} />

        {/* Supporting Data */}
        <SupportingDataCard data={justification.supportingData} />
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
        secondaryActions={onStartNegotiation ? [
          {
            id: 'negotiate',
            label: 'Start Negotiation',
            variant: 'secondary',
            onClick: onStartNegotiation,
          },
        ] : undefined}
      />
    </div>
  );
};

export default JustificationReportArtifact;
