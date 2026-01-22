// ResponseBody - Renders canonical response narrative with safe markdown
// Lives inside AIResponse, replacing formatMarkdown usage

import { useMemo } from 'react';
import { renderMarkdown } from '../../utils/markdownRenderer';
import type { CanonicalResponse } from '../../types/responseSchema';

interface ResponseBodyProps {
  /** The canonical response to render */
  canonical: CanonicalResponse;
  /** Whether a widget is present (used to suppress tables) */
  hasWidget?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show debug panel */
  showDebug?: boolean;
}

/**
 * ResponseBody renders the narrative content from a canonical response.
 * It uses the safe remark markdown pipeline with HTML sanitization.
 *
 * Features:
 * - Safe markdown rendering (XSS protected)
 * - Table suppression when widget is present
 * - Number highlighting ($10.5M, 15%, etc.)
 * - Tailwind prose styling
 */
export const ResponseBody: React.FC<ResponseBodyProps> = ({
  canonical,
  hasWidget = false,
  className = '',
  showDebug = false,
}) => {
  // Render markdown to HTML with options
  const narrativeHtml = useMemo(() => {
    if (!canonical.narrative) return '';

    return renderMarkdown(canonical.narrative, {
      highlightNumbers: true,
      suppressTables: hasWidget, // Strip tables when widget present
    });
  }, [canonical.narrative, hasWidget]);

  return (
    <div className={className}>
      {/* Narrative - Markdown rendered */}
      <div
        className={`
          prose prose-slate max-w-none
          prose-p:mb-3 prose-p:leading-relaxed
          prose-strong:font-medium prose-strong:text-slate-800
          prose-ul:list-disc prose-ul:list-inside prose-ul:space-y-1 prose-ul:my-3
          prose-ol:list-decimal prose-ol:list-inside prose-ol:space-y-1 prose-ol:my-3
          prose-li:text-slate-700
          prose-headings:font-medium prose-headings:text-slate-900 prose-headings:mb-2
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline
          prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-slate-100 prose-pre:p-3 prose-pre:rounded-lg
          prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic
          prose-table:text-sm prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-td:border-t
        `.trim().replace(/\s+/g, ' ')}
        dangerouslySetInnerHTML={{ __html: narrativeHtml }}
      />

      {/* Debug Panel */}
      {showDebug && (
        <ResponseDebugPanel canonical={canonical} />
      )}
    </div>
  );
};

// Inline debug panel (can be split to separate file if needed)
const ResponseDebugPanel: React.FC<{ canonical: CanonicalResponse }> = ({ canonical }) => {
  return (
    <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs font-mono">
      <div className="font-medium mb-2 text-slate-700">Debug Info</div>
      <div className="grid grid-cols-2 gap-2 text-slate-600">
        <div>
          Provider: <span className="text-blue-600">{canonical.provider}</span>
        </div>
        <div>
          Has Ack: <span className={canonical.acknowledgement ? 'text-green-600' : 'text-red-600'}>
            {canonical.acknowledgement ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          Has Widget: {canonical.widget ? 'Yes' : 'No'}
        </div>
        <div>
          Has Insight: {canonical.insight ? 'Yes' : 'No'}
        </div>
        <div>
          Sources: {canonical.sources?.totalWebCount || 0} web, {canonical.sources?.totalInternalCount || 0} internal
        </div>
        <div>
          Suggestions: {canonical.suggestions?.length || 0}
        </div>
      </div>

      {canonical.headline && (
        <div className="mt-2 text-slate-600">
          Headline: <span className="text-slate-800">{canonical.headline}</span>
        </div>
      )}

      {canonical.bullets && canonical.bullets.length > 0 && (
        <div className="mt-2 text-slate-600">
          Bullets: {canonical.bullets.length} items
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
          Raw Canonical
        </summary>
        <pre className="mt-1 text-[10px] overflow-auto max-h-48 bg-white p-2 rounded border">
          {JSON.stringify(canonical, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default ResponseBody;
