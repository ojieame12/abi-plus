import { useState } from 'react';
import { X, ExternalLink, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebSource {
    name: string;
    url: string;
    domain?: string;
    snippet?: string;
    date?: string;
}

interface InternalSource {
    name: string;
    type: 'beroe' | 'dun_bradstreet' | 'ecovadis' | 'internal_data' | 'supplier_data' | string;
    dataPoints?: number;
    lastUpdated?: string;
}

interface SourceAttributionProps {
    webPages?: number;
    dataSources?: number;
    dataSourceName?: string;
    // Actual source data for the modal
    webSourcesList?: WebSource[];
    internalSourcesList?: InternalSource[];
}

// Sample favicons for display
const SAMPLE_FAVICONS = [
    { bg: 'bg-blue-500' },
    { bg: 'bg-orange-500' },
    { bg: 'bg-slate-800' },
    { bg: 'bg-pink-500' },
];

// Get favicon URL from domain
const getFaviconUrl = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return null;
    }
};

// Source type icons/colors
const SOURCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    beroe: { bg: 'bg-violet-100', text: 'text-violet-600' },
    dun_bradstreet: { bg: 'bg-blue-100', text: 'text-blue-600' },
    ecovadis: { bg: 'bg-green-100', text: 'text-green-600' },
    internal_data: { bg: 'bg-slate-100', text: 'text-slate-600' },
    supplier_data: { bg: 'bg-amber-100', text: 'text-amber-600' },
};

export const SourceAttribution = ({
    webPages = 0,
    dataSources = 0,
    dataSourceName = 'Data Sources',
    webSourcesList = [],
    internalSourcesList = [],
}: SourceAttributionProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'web' | 'internal'>('web');

    const hasWebPages = webPages > 0;
    const hasDataSources = dataSources > 0;

    if (!hasWebPages && !hasDataSources) {
        return null;
    }

    const handleClick = (tab: 'web' | 'internal') => {
        setActiveTab(tab);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="flex items-center gap-3">
                {/* Web Pages - stacked favicon circles */}
                {hasWebPages && (
                    <button
                        onClick={() => handleClick('web')}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                        <div className="flex items-center">
                            {SAMPLE_FAVICONS.slice(0, Math.min(4, webPages)).map((favicon, i) => (
                                <div
                                    key={i}
                                    className={`w-5 h-5 rounded-full border-2 border-white ${favicon.bg} flex items-center justify-center overflow-hidden shadow-sm`}
                                    style={{ marginLeft: i === 0 ? 0 : -6 }}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-slate-600">{webPages} Web Pages</span>
                    </button>
                )}

                {/* Data Sources */}
                {hasDataSources && (
                    <button
                        onClick={() => handleClick('internal')}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                        <img
                            src="/bero-logo.svg"
                            alt="Beroe"
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">{dataSources} {dataSourceName}</span>
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
                                {hasWebPages && hasDataSources && (
                                    <div className="flex border-b border-slate-100">
                                        <button
                                            onClick={() => setActiveTab('web')}
                                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                                activeTab === 'web'
                                                    ? 'text-violet-600 border-b-2 border-violet-500'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            Web Sources ({webPages})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('internal')}
                                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                                activeTab === 'internal'
                                                    ? 'text-violet-600 border-b-2 border-violet-500'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            Data Sources ({dataSources})
                                        </button>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="max-h-[400px] overflow-y-auto p-4">
                                    {activeTab === 'web' ? (
                                        <div className="space-y-2">
                                            {webSourcesList.length > 0 ? (
                                                webSourcesList.map((source, i) => (
                                                    <a
                                                        key={i}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {getFaviconUrl(source.url) ? (
                                                                <img
                                                                    src={getFaviconUrl(source.url)!}
                                                                    alt=""
                                                                    className="w-5 h-5"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ExternalLink size={14} className="text-slate-400" />
                                                            )}
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
                                                                {source.domain || new URL(source.url).hostname}
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
                                                    {webPages} web sources were used to generate this response.
                                                    <br />
                                                    <span className="text-xs">Detailed source links not available.</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {internalSourcesList.length > 0 ? (
                                                internalSourcesList.map((source, i) => {
                                                    const colors = SOURCE_TYPE_COLORS[source.type] || SOURCE_TYPE_COLORS.internal_data;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                                                <Database size={14} className={colors.text} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-sm font-medium text-slate-800">
                                                                    {source.name}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                    <span className="capitalize">{source.type.replace('_', ' ')}</span>
                                                                    {source.dataPoints && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{source.dataPoints} data points</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-8 text-slate-400 text-sm">
                                                    {dataSources} internal data sources were used.
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

// Legacy simple version
export const SourceAttributionSimple = ({
    sourceCount,
    sourceName,
    onSourceClick,
}: {
    sourceCount: number;
    sourceName: string;
    onSourceClick?: () => void;
}) => (
    <button
        onClick={onSourceClick}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
    >
        <img
            src="/bero-logo.svg"
            alt="Beroe"
            className="w-4 h-4"
        />
        <span className="text-sm text-slate-600">{sourceCount} {sourceName}</span>
    </button>
);
