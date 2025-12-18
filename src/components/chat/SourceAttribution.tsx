interface SourceAttributionProps {
    webPages?: number;
    dataSources?: number;
    dataSourceName?: string; // e.g., "Beroe Data Sources"
    onWebPagesClick?: () => void;
    onDataSourcesClick?: () => void;
}

// Sample favicons for the stacked web sources display
const SAMPLE_FAVICONS = [
    { url: 'https://www.google.com/favicon.ico', bg: 'bg-white' },
    { url: 'https://www.reuters.com/favicon.ico', bg: 'bg-orange-500' },
    { url: 'https://www.bloomberg.com/favicon.ico', bg: 'bg-black' },
    { url: 'https://www.ft.com/favicon.ico', bg: 'bg-[#FFF1E5]' },
];

export const SourceAttribution = ({
    webPages = 0,
    dataSources = 0,
    dataSourceName = 'Data Sources',
    onWebPagesClick,
    onDataSourcesClick,
}: SourceAttributionProps) => {
    const hasWebPages = webPages > 0;
    const hasDataSources = dataSources > 0;

    if (!hasWebPages && !hasDataSources) {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            {/* Web Pages - stacked favicon circles */}
            {hasWebPages && (
                <button
                    onClick={onWebPagesClick}
                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                >
                    <div className="flex items-center">
                        {SAMPLE_FAVICONS.slice(0, 4).map((favicon, i) => (
                            <div
                                key={i}
                                className={`w-5 h-5 rounded-full border-2 border-white ${favicon.bg} flex items-center justify-center overflow-hidden shadow-sm`}
                                style={{ marginLeft: i === 0 ? 0 : -6 }}
                            >
                                <img
                                    src={favicon.url}
                                    alt=""
                                    className="w-3 h-3 object-contain"
                                    onError={(e) => {
                                        // Fallback to colored circle if favicon fails
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <span className="text-sm text-slate-600">{webPages} Web Pages</span>
                </button>
            )}

            {/* Data Sources - Beroe icon */}
            {hasDataSources && (
                <button
                    onClick={onDataSourcesClick}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                >
                    <img src="/beroe-icon.svg" alt="" className="w-4 h-4" />
                    <span className="text-sm text-slate-600">{dataSources} {dataSourceName}</span>
                </button>
            )}
        </div>
    );
};

// Legacy single-source version for backwards compatibility
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
        <img src="/beroe-icon.svg" alt="" className="w-4 h-4" />
        <span className="text-sm text-slate-600">{sourceCount} {sourceName}</span>
    </button>
);
