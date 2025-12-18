import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { NewsItemData } from '../../types/widgets';

interface NewsItemCardProps {
  data: NewsItemData;
  size?: 'S' | 'M';
  onClick?: () => void;
}

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Positive' },
  negative: { icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Negative' },
  neutral: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Neutral' },
};

export const NewsItemCard = ({ data, size = 'M', onClick }: NewsItemCardProps) => {
  const { title, source, sourceIcon, timestamp, url, category, sentiment } = data;

  const sentimentInfo = sentiment ? sentimentConfig[sentiment] : null;
  const SentimentIcon = sentimentInfo?.icon;

  // Compact size
  if (size === 'S') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.06)] transition-all text-left group"
      >
        {sourceIcon ? (
          <img src={sourceIcon} alt="" className="w-5 h-5 rounded" />
        ) : (
          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
            {source.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-slate-700 truncate group-hover:text-violet-600 transition-colors">
            {title}
          </p>
          <p className="text-[11px] text-slate-400">{source} · {timestamp}</p>
        </div>
        {sentimentInfo && SentimentIcon && (
          <SentimentIcon size={14} strokeWidth={1.5} className={sentimentInfo.color} />
        )}
      </button>
    );
  }

  // Standard size
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
      <div className="flex items-start gap-3">
        {/* Source icon */}
        {sourceIcon ? (
          <img src={sourceIcon} alt="" className="w-8 h-8 rounded-lg" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[12px] text-slate-500 font-medium">
            {source.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Category & Sentiment */}
          <div className="flex items-center gap-2 mb-1.5">
            {category && (
              <span className="text-[11px] text-slate-500 px-1.5 py-0.5 bg-slate-50 rounded">
                {category}
              </span>
            )}
            {sentimentInfo && SentimentIcon && (
              <span className={`flex items-center gap-1 text-[11px] ${sentimentInfo.color} px-1.5 py-0.5 ${sentimentInfo.bg} rounded`}>
                <SentimentIcon size={10} strokeWidth={1.5} />
                {sentimentInfo.label}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-[14px] font-normal text-slate-800 leading-snug mb-2">
            {title}
          </h4>

          {/* Meta */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-400">
              {source} · {timestamp}
            </span>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Read
                <ExternalLink size={12} strokeWidth={1.5} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
