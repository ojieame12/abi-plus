// Sources Display - Shows web and internal data sources with clickable modal
import { useState } from 'react';
import { X, ExternalLink, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseSources, WebSource, InternalSource } from '../../types/aiResponse';

interface SourcesDisplayProps {
  sources: ResponseSources;
  compact?: boolean;
}

// Sample favicons for the stacked web sources display
const SAMPLE_FAVICONS = [
  { bg: 'bg-blue-500' },
  { bg: 'bg-orange-500' },
  { bg: 'bg-slate-800' },
  { bg: 'bg-pink-500' },
];

// Get favicon URL from domain
const getFaviconUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

// Source type colors (fallback when provider metadata not available)
const SOURCE_TYPE_COLORS: Record<string, { bg: string; text: string; color: string }> = {
  beroe: { bg: 'bg-violet-100', text: 'text-violet-600', color: '#7C3AED' },
  dun_bradstreet: { bg: 'bg-sky-100', text: 'text-sky-600', color: '#0284C7' },
  ecovadis: { bg: 'bg-emerald-100', text: 'text-emerald-600', color: '#059669' },
  internal_data: { bg: 'bg-indigo-100', text: 'text-indigo-600', color: '#6366F1' },
  supplier_data: { bg: 'bg-indigo-100', text: 'text-indigo-600', color: '#6366F1' },
};

// Get source display info - uses provider metadata when available
const getSourceDisplayInfo = (source: InternalSource) => {
  const fallback = SOURCE_TYPE_COLORS[source.type] || SOURCE_TYPE_COLORS.internal_data;
  return {
    color: source.providerColor || fallback.color,
    bg: fallback.bg,
    text: fallback.text,
    label: source.providerShortName || source.type.replace('_', ' '),
    isTier1: source.reliabilityTier === 'tier1',
  };
};

export const SourcesDisplay = ({ sources }: SourcesDisplayProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'web' | 'internal'>('web');

  const { web, internal, totalWebCount, totalInternalCount } = sources;

  if (totalWebCount === 0 && totalInternalCount === 0) {
    return null;
  }

  const handleClick = (tab: 'web' | 'internal') => {
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  // Default: Inline compact view matching Figma design
  // [favicon stack] X Web Pages | [beroe icon] X Beroe Data Sources
  return (
    <>
      <div className="flex items-center gap-3">
        {/* Web Sources - Stacked favicons */}
        {totalWebCount > 0 && (
          <button
            onClick={() => handleClick('web')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              {web.length > 0 ? (
                web.slice(0, 4).map((source, i) => (
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
                SAMPLE_FAVICONS.slice(0, Math.min(4, totalWebCount)).map((favicon, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 border-white ${favicon.bg} flex items-center justify-center overflow-hidden shadow-sm`}
                    style={{ marginLeft: i === 0 ? 0 : -6 }}
                  />
                ))
              )}
            </div>
            <span className="text-sm text-slate-600">{totalWebCount} Web Pages</span>
          </button>
        )}

        {/* Internal Sources - Data icon */}
        {totalInternalCount > 0 && (
          <button
            onClick={() => handleClick('internal')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Database size={16} className="text-teal-500" />
            <span className="text-sm text-slate-600">
              {totalInternalCount} {internal.some(s => s.type === 'beroe' || s.reliabilityTier === 'tier1') ? 'Beroe ' : ''}Data Sources
            </span>
          </button>
        )}
      </div>

      {/* Sources Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
                {totalWebCount > 0 && totalInternalCount > 0 && (
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setActiveTab('web')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'web'
                          ? 'text-teal-600 border-b-2 border-teal-500'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Web Sources ({totalWebCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('internal')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'internal'
                          ? 'text-teal-600 border-b-2 border-teal-500'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Data Sources ({totalInternalCount})
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="max-h-[400px] overflow-y-auto p-4">
                  {activeTab === 'web' ? (
                    <div className="space-y-2">
                      {web.length > 0 ? (
                        web.map((source, i) => (
                          <a
                            key={i}
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
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          {totalWebCount} web sources were used to generate this response.
                          <br />
                          <span className="text-xs">Detailed source links not available.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {internal.length > 0 ? (
                        internal.map((source, i) => {
                          const displayInfo = getSourceDisplayInfo(source);
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg ${displayInfo.bg} flex items-center justify-center`}
                                style={source.providerColor ? {
                                  backgroundColor: `${source.providerColor}20`,
                                } : undefined}
                              >
                                <Database size={14} style={{ color: displayInfo.color }} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-800">
                                    {source.name}
                                  </span>
                                  {displayInfo.isTier1 && (
                                    <span
                                      className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-100 text-violet-700"
                                      title="Decision Grade Source"
                                    >
                                      Decision Grade
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span
                                    className="font-medium"
                                    style={{ color: displayInfo.color }}
                                  >
                                    {displayInfo.label}
                                  </span>
                                  {source.category && (
                                    <>
                                      <span>•</span>
                                      <span>{source.category}</span>
                                    </>
                                  )}
                                  {source.dataPoints && (
                                    <>
                                      <span>•</span>
                                      <span>{source.dataPoints} data points</span>
                                    </>
                                  )}
                                </div>
                                {source.summary && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {source.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          {totalInternalCount} internal data sources were used.
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

// Expanded view for detailed source listing (used in artifact panel or expanded view)
export const SourcesDisplayExpanded = ({ sources }: { sources: ResponseSources }) => {
  const { web, internal, totalWebCount, totalInternalCount } = sources;

  if (totalWebCount === 0 && totalInternalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Web Sources */}
      {web.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <WebIcon />
            <span>Web Sources ({totalWebCount})</span>
          </div>
          <div className="space-y-1">
            {web.slice(0, 5).map((source, i) => (
              <WebSourceItem key={i} source={source} />
            ))}
            {totalWebCount > 5 && (
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View {totalWebCount - 5} more sources
              </button>
            )}
          </div>
        </div>
      )}

      {/* Internal Sources */}
      {internal.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <DataIcon />
            <span>Data Sources ({totalInternalCount})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {internal.map((source, i) => (
              <InternalSourceBadge key={i} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Web source item component
const WebSourceItem = ({ source }: { source: WebSource }) => (
  <a
    href={source.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
  >
    <img
      src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=16`}
      alt=""
      className="w-4 h-4 mt-0.5 rounded"
    />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-slate-900 truncate group-hover:text-teal-700">
        {source.name}
      </div>
      {source.snippet && (
        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
          {source.snippet}
        </div>
      )}
      <div className="text-xs text-slate-400 mt-0.5">{source.domain}</div>
    </div>
    <ExternalLinkIcon />
  </a>
);

// Internal source badge component - uses enriched provider metadata when available
const InternalSourceBadge = ({ source }: { source: InternalSource }) => {
  // Use enriched provider metadata if available, fallback to legacy type-based styling
  const getSourceStyle = () => {
    // If we have provider color, generate styles from it
    if (source.providerColor) {
      return {
        backgroundColor: `${source.providerColor}15`, // 15% opacity
        borderColor: `${source.providerColor}40`, // 40% opacity
        color: source.providerColor,
      };
    }
    // Fallback to legacy type-based colors
    switch (source.type) {
      case 'beroe':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'dun_bradstreet':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'ecovadis':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'internal_data':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'supplier_data':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Use providerShortName if available, fallback to type-based abbreviation
  const getSourceLabel = () => {
    if (source.providerShortName) return source.providerShortName;
    switch (source.type) {
      case 'beroe':
        return 'Beroe';
      case 'dun_bradstreet':
        return 'D&B';
      case 'ecovadis':
        return 'EcoVadis';
      case 'internal_data':
        return 'Internal';
      case 'supplier_data':
        return 'Supplier';
      default:
        return 'Data';
    }
  };

  const style = getSourceStyle();
  const isCustomStyle = typeof style === 'object';

  // Show tier indicator for tier1 (Decision Grade) sources
  const showTierBadge = source.reliabilityTier === 'tier1';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isCustomStyle ? '' : style
      }`}
      style={isCustomStyle ? {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.color,
      } : undefined}
    >
      {showTierBadge && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" title="Decision Grade Source" />
      )}
      <span className="font-medium">{getSourceLabel()}</span>
      <span className="opacity-70">•</span>
      <span>{source.name}</span>
      {source.dataPoints && (
        <span className="text-[10px] opacity-70">({source.dataPoints})</span>
      )}
    </div>
  );
};

// Icons
const WebIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const DataIcon = () => (
  <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default SourcesDisplay;
