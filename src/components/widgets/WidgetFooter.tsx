// Shared Widget Footer Component
// Renders sources (web + Beroe) and View Details button

import { useState } from 'react';
import { ChevronRight, Database, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseSources, WebSource, InternalSource } from '../../types/aiResponse';

export interface WidgetFooterProps {
  sources?: ResponseSources;
  beroeSourceCount?: number; // Legacy fallback - only shown if explicitly set
  hasBeroeSourceCount?: boolean; // Whether beroeSourceCount was explicitly set (not default)
  onViewDetails?: () => void;
  onSourceClick?: (source: InternalSource) => void; // Opens report viewer for Beroe sources
  className?: string;
}

// Get favicon URL from domain
const getFaviconUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

// Source type colors for modal
const SOURCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  beroe: { bg: 'bg-teal-100', text: 'text-teal-600' },
  dun_bradstreet: { bg: 'bg-blue-100', text: 'text-blue-600' },
  ecovadis: { bg: 'bg-green-100', text: 'text-green-600' },
  internal_data: { bg: 'bg-slate-100', text: 'text-slate-600' },
  supplier_data: { bg: 'bg-amber-100', text: 'text-amber-600' },
};

export const WidgetFooter = ({
  sources,
  beroeSourceCount = 0,
  hasBeroeSourceCount = false,
  onViewDetails,
  onSourceClick,
  className = '',
}: WidgetFooterProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'web' | 'internal'>('internal');

  // Use sources if provided, otherwise fall back to legacy beroeSourceCount only if explicitly set
  const hasFullSources = sources && (sources.totalWebCount > 0 || sources.totalInternalCount > 0);
  const webCount = sources?.totalWebCount ?? 0;

  // For internal count: prefer sources.totalInternalCount, fall back to beroeSourceCount only if explicitly set
  const internalCount = sources?.totalInternalCount ?? (hasBeroeSourceCount ? beroeSourceCount : 0);
  const webSources = sources?.web ?? [];
  const internalSources = sources?.internal ?? [];

  const handleSourceClick = (tab: 'web' | 'internal') => {
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={`flex items-center justify-between px-5 py-3 border-t border-slate-100/60 bg-slate-50/30 ${className}`}>
        {/* Sources Section */}
        <div className="flex items-center gap-3">
          {/* Web Sources - Stacked favicons */}
          {webCount > 0 && (
            <button
              onClick={() => handleSourceClick('web')}
              className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/60 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                {webSources.length > 0 ? (
                  webSources.slice(0, 4).map((source, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white bg-white flex items-center justify-center overflow-hidden shadow-sm"
                      style={{ marginLeft: i === 0 ? 0 : -6 }}
                    >
                      <img
                        src={getFaviconUrl(source.domain)}
                        alt=""
                        className="w-3 h-3 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))
                ) : (
                  // Placeholder favicons
                  [0, 1, 2, 3].slice(0, Math.min(4, webCount)).map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                      style={{ marginLeft: i === 0 ? 0 : -6 }}
                    />
                  ))
                )}
              </div>
              <span className="text-sm text-slate-600">{webCount} Web Pages</span>
            </button>
          )}

          {/* Internal/Beroe Sources */}
          {internalCount > 0 && (
            <button
              onClick={() => handleSourceClick('internal')}
              className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/60 rounded-lg transition-colors"
            >
              <img
                src="/bero-logo.svg"
                alt="Beroe"
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-600">{internalCount} Beroe Data Sources</span>
            </button>
          )}
        </div>

        {/* View Details - no chevron */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <span>View Details</span>
          </button>
        )}
      </div>

      {/* Sources Modal */}
      <AnimatePresence>
        {isModalOpen && hasFullSources && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-lg font-medium text-slate-900">Sources</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>

                {/* Tabs */}
                {webCount > 0 && internalCount > 0 && (
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setActiveTab('web')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'web'
                          ? 'text-teal-600 border-b-2 border-teal-500'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Web Sources ({webCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('internal')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'internal'
                          ? 'text-teal-600 border-b-2 border-teal-500'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Data Sources ({internalCount})
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="max-h-[400px] overflow-y-auto p-4">
                  {activeTab === 'web' ? (
                    <div className="space-y-2">
                      {webSources.length > 0 ? (
                        webSources.map((source, i) => (
                          <WebSourceItem key={i} source={source} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          {webCount} web sources were used to generate this response.
                          <br />
                          <span className="text-xs">Detailed source links not available.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {internalSources.length > 0 ? (
                        internalSources.map((source, i) => (
                          <InternalSourceItem
                            key={i}
                            source={source}
                            onClick={onSourceClick ? (src) => {
                              setIsModalOpen(false);
                              onSourceClick(src);
                            } : undefined}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          {internalCount} internal data sources were used.
                          <br />
                          <span className="text-xs">Including Beroe intelligence and supplier databases.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Web source item for modal
const WebSourceItem = ({ source }: { source: WebSource }) => (
  <a
    href={source.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
  >
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
      <img
        src={getFaviconUrl(source.domain)}
        alt=""
        className="w-5 h-5"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-800 truncate">
          {source.name}
        </span>
        <ExternalLink
          size={12}
          className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      </div>
      <span className="text-xs text-slate-400 truncate block">
        {source.domain}
      </span>
      {source.snippet && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {source.snippet}
        </p>
      )}
    </div>
  </a>
);

// Internal source item for modal
const InternalSourceItem = ({
  source,
  onClick,
}: {
  source: InternalSource;
  onClick?: (source: InternalSource) => void;
}) => {
  const colors = SOURCE_TYPE_COLORS[source.type] || SOURCE_TYPE_COLORS.internal_data;
  const isClickable = onClick && (source.type === 'beroe' || source.reportId);

  const content = (
    <>
      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
        <Database size={14} className={colors.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">
            {source.name}
          </span>
          {isClickable && (
            <ChevronRight
              size={14}
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="capitalize">{source.type.replace('_', ' ')}</span>
          {source.dataPoints && (
            <>
              <span>•</span>
              <span>{source.dataPoints} data points</span>
            </>
          )}
          {source.category && (
            <>
              <span>•</span>
              <span>{source.category}</span>
            </>
          )}
        </div>
        {source.summary && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{source.summary}</p>
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={() => onClick(source)}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors w-full text-left group"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
      {content}
    </div>
  );
};

export default WidgetFooter;
