// Sources Display - Shows web and internal data sources
import type { ResponseSources, WebSource, InternalSource } from '../../types/aiResponse';

interface SourcesDisplayProps {
  sources: ResponseSources;
  compact?: boolean;
}

export const SourcesDisplay = ({ sources, compact = false }: SourcesDisplayProps) => {
  const { web, internal, totalWebCount, totalInternalCount } = sources;

  if (totalWebCount === 0 && totalInternalCount === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        {totalWebCount > 0 && (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <WebIcon />
            <span className="text-slate-700">{totalWebCount} Web Pages</span>
          </button>
        )}
        {totalInternalCount > 0 && (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
            <DataIcon />
            <span className="text-violet-700">{totalInternalCount} Data Sources</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
              <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
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
      <div className="text-sm font-medium text-slate-900 truncate group-hover:text-violet-700">
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

// Internal source badge component
const InternalSourceBadge = ({ source }: { source: InternalSource }) => {
  const getSourceStyle = (type: string) => {
    switch (type) {
      case 'beroe':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'dun_bradstreet':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ecovadis':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'internal_data':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'supplier_data':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'beroe':
        return 'B';
      case 'dun_bradstreet':
        return 'D&B';
      case 'ecovadis':
        return 'EV';
      default:
        return '📊';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getSourceStyle(source.type)}`}
    >
      <span className="w-4 h-4 flex items-center justify-center bg-white/50 rounded-full text-[10px]">
        {getSourceIcon(source.type)}
      </span>
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
  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default SourcesDisplay;
