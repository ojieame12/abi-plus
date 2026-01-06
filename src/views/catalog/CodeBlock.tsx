import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  defaultExpanded?: boolean;
}

export const CodeBlock = ({ code, language = 'tsx', title = 'Usage Example', defaultExpanded = false }: CodeBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
            {language}
          </span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      {isExpanded && (
        <div className="bg-slate-900 p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
