// Cited Content Component
// Renders text content with inline citation badges [B1], [W1]
// Supports basic inline markdown (bold, italic, code, links)
// Badges are hoverable and clickable

import { parseContentWithCitations } from '../../utils/citationParser';
import { CitationBadge } from './CitationBadge';
import type { CitationMap, Citation } from '../../types/hybridResponse';
import type { WebSource, InternalSource } from '../../types/aiResponse';

// ============================================
// INLINE MARKDOWN HELPER
// ============================================

/**
 * Highlight numbers (currency, percentages) in text
 * Returns React elements with highlighted spans
 */
function highlightNumbers(text: string, keyPrefix: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let partIndex = 0;

  // Pattern matches: $10.5M, $500K, $1,234.56, 15%, 1,234,567
  const numberPattern = /(\$[\d,.]+[BMKbmk]?|\d{1,3}(?:,\d{3})*(?:\.\d+)?%?(?:\s*(?:million|billion|thousand|suppliers?|entities?|dollars?))?)/gi;
  let lastIndex = 0;
  let match;

  while ((match = numberPattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      elements.push(
        <span key={`${keyPrefix}-num-${partIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add highlighted number
    elements.push(
      <span key={`${keyPrefix}-num-${partIndex++}`} className="font-medium text-slate-900">
        {match[1]}
      </span>
    );

    lastIndex = numberPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`${keyPrefix}-num-${partIndex++}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return elements.length > 0 ? elements : [<span key={`${keyPrefix}-0`}>{text}</span>];
}

/**
 * Render basic inline markdown as React elements
 * Handles: **bold**, *italic*, `code`, [links](url), and number highlighting
 */
function renderInlineMarkdown(text: string, keyPrefix: string = ''): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let partIndex = 0;

  // Pattern to match markdown: **bold**, *italic*, `code`, [text](url)
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match (with number highlighting)
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      elements.push(...highlightNumbers(beforeText, `${keyPrefix}-${partIndex++}`));
    }

    const boldText = match[2];
    const italicText = match[3];
    const codeText = match[4];
    const linkText = match[5];
    const linkUrl = match[6];

    if (boldText) {
      elements.push(
        <strong key={`${keyPrefix}-${partIndex++}`} className="font-medium text-slate-800">
          {boldText}
        </strong>
      );
    } else if (italicText) {
      elements.push(
        <em key={`${keyPrefix}-${partIndex++}`} className="italic">
          {italicText}
        </em>
      );
    } else if (codeText) {
      elements.push(
        <code key={`${keyPrefix}-${partIndex++}`} className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono">
          {codeText}
        </code>
      );
    } else if (linkText && linkUrl) {
      elements.push(
        <a
          key={`${keyPrefix}-${partIndex++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 hover:underline"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text (with number highlighting)
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    elements.push(...highlightNumbers(remainingText, `${keyPrefix}-${partIndex++}`));
  }

  // If no matches, apply number highlighting to the entire text
  if (elements.length === 0) {
    return highlightNumbers(text, keyPrefix);
  }

  return elements;
}

/**
 * Split a text segment into prefix + anchor (last statement) + trailing whitespace.
 * The anchor is underlined to indicate the cited statement.
 */
function splitTextForCitationAnchor(text: string): { prefix: string; anchor: string; trailing: string } {
  let prefix = '';
  let anchor = text;

  // Prefer splitting by the last sentence boundary.
  const sentenceRegex = /[.!?]\s+/g;
  let lastSentenceIndex = -1;
  let lastSentenceLen = 0;
  let match: RegExpExecArray | null;
  while ((match = sentenceRegex.exec(text)) !== null) {
    lastSentenceIndex = match.index;
    lastSentenceLen = match[0].length;
  }

  if (lastSentenceIndex >= 0 && lastSentenceIndex + lastSentenceLen < text.length) {
    prefix = text.slice(0, lastSentenceIndex + lastSentenceLen);
    anchor = text.slice(lastSentenceIndex + lastSentenceLen);
  } else {
    // Fallback: underline the last ~8 words (avoid splitting inside markdown when possible)
    const hasMarkdown = /(\*\*|\*|`|\[[^\]]+?\]\([^)]+?\))/.test(text);
    if (!hasMarkdown) {
      const tokens = text.match(/\S+|\s+/g) || [];
      let wordCount = 0;
      let startIndex = tokens.length;
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (/\S/.test(tokens[i])) {
          wordCount += 1;
        }
        if (wordCount >= 8) {
          startIndex = i;
          break;
        }
      }
      prefix = tokens.slice(0, startIndex).join('');
      anchor = tokens.slice(startIndex).join('');
    }
  }

  // Separate trailing whitespace so underline doesn't extend
  const trailingMatch = anchor.match(/(\s+)$/);
  let trailing = '';
  if (trailingMatch) {
    trailing = trailingMatch[1];
    anchor = anchor.slice(0, -trailing.length);
  }

  return { prefix, anchor, trailing };
}

/**
 * Render a text segment, optionally underlining the last statement.
 */
function renderTextSegment(
  text: string,
  keyPrefix: string,
  underlineAnchor: boolean
): React.ReactNode {
  if (!underlineAnchor || text.trim().length === 0) {
    return <span>{renderInlineMarkdown(text, keyPrefix)}</span>;
  }

  const { prefix, anchor, trailing } = splitTextForCitationAnchor(text);
  if (!anchor.trim().length) {
    return <span>{renderInlineMarkdown(text, keyPrefix)}</span>;
  }

  return (
    <span>
      {prefix && <span>{renderInlineMarkdown(prefix, `${keyPrefix}-pre`)}</span>}
      <span className="citation-anchor underline decoration-dotted decoration-slate-300 underline-offset-4">
        {renderInlineMarkdown(anchor, `${keyPrefix}-anchor`)}
      </span>
      {trailing && <span>{trailing}</span>}
    </span>
  );
}

// ============================================
// TYPES
// ============================================

export interface CitedContentProps {
  /** Content with [B1], [W1] citation markers */
  content: string;
  /** Citation map for looking up citation data */
  citations: CitationMap | Record<string, WebSource | InternalSource>;
  /** Callback when clicking a citation badge */
  onSourceClick?: (citation: Citation | WebSource | InternalSource) => void;
  /** Additional class names for the container */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Renders content with inline citation badges
 *
 * @example
 * <CitedContent
 *   content="Steel prices rose 3% [B1] due to strong demand [W1]."
 *   citations={{ B1: {...}, W1: {...} }}
 *   onSourceClick={(citation) => openReportViewer(citation)}
 * />
 */
export const CitedContent = ({
  content,
  citations,
  onSourceClick,
  className = '',
}: CitedContentProps) => {
  // Parse content into segments
  const segments = parseContentWithCitations(content, citations);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        // Text segment - render with inline markdown support
        if (segment.type === 'text') {
          const next = segments[index + 1];
          const underlineAnchor = next?.type === 'citation';
          return (
            <span key={index}>
              {renderTextSegment(segment.content, `seg-${index}`, underlineAnchor)}
            </span>
          );
        }

        // Citation segment - render badge
        const citationId = segment.citationId!;
        const citation = citations[citationId];

        // If citation not found, render as plain text
        if (!citation) {
          return <span key={index}>{segment.content}</span>;
        }

        return (
          <CitationBadge
            key={index}
            citation={citation as Citation | WebSource | InternalSource}
            citationId={citationId}
            sourceType={segment.sourceType}
            onSourceClick={onSourceClick}
          />
        );
      })}
    </span>
  );
};

// ============================================
// MARKDOWN TABLE PARSING + RENDERING
// ============================================

interface ParsedTable {
  caption?: string;
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

/**
 * Parse a markdown pipe-delimited table block into structured data.
 * Handles optional caption line (italic text before header row).
 */
function parseMarkdownTable(block: string): ParsedTable | null {
  const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  // Find the separator row (|---|---|)
  const sepIndex = lines.findIndex(l => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l));
  if (sepIndex < 1) return null;

  // Caption is anything before the header row (italic text like "Table: ...")
  let caption: string | undefined;
  const headerIndex = sepIndex - 1;
  if (headerIndex > 0) {
    // Lines before the header row are the caption
    caption = lines.slice(0, headerIndex).join(' ').replace(/^\*(.+)\*$/, '$1').replace(/^_(.+)_$/, '$1').trim();
  }

  // Parse header
  const parseRow = (line: string): string[] =>
    line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

  const headers = parseRow(lines[headerIndex]);

  // Parse alignments from separator
  const sepCells = parseRow(lines[sepIndex]);
  const alignments = sepCells.map(cell => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center' as const;
    if (right) return 'right' as const;
    return 'left' as const;
  });

  // Parse data rows
  const rows: string[][] = [];
  for (let i = sepIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Skip non-table lines
    if (!line.includes('|')) break;
    rows.push(parseRow(line));
  }

  if (rows.length === 0) return null;

  return { caption, headers, alignments, rows };
}

/**
 * Detect if a text block is a markdown table
 */
function isMarkdownTableBlock(text: string): boolean {
  return /\|[-:]+\|/.test(text) && text.split('\n').filter(l => l.trim().includes('|')).length >= 3;
}

/**
 * Split content into alternating prose and table segments
 */
function splitContentByTables(content: string): { type: 'prose' | 'table'; content: string }[] {
  const segments: { type: 'prose' | 'table'; content: string }[] = [];

  // Match table blocks: optional caption line + header + separator + data rows
  // A table block is a sequence of lines containing pipes, with a separator row
  const tablePattern = /(?:^[^\n|]*\n)?(?:^\|.+\|$\n?){1}(?:^\|[\s:|-]+\|$\n?)(?:^\|.+\|$\n?)+/gm;

  let lastIndex = 0;
  let match;

  while ((match = tablePattern.exec(content)) !== null) {
    // Add prose before the table
    if (match.index > lastIndex) {
      const prose = content.slice(lastIndex, match.index).trim();
      if (prose) segments.push({ type: 'prose', content: prose });
    }

    segments.push({ type: 'table', content: match[0].trim() });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining prose
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) segments.push({ type: 'prose', content: remaining });
  }

  return segments.length > 0 ? segments : [{ type: 'prose', content }];
}

/**
 * Renders a parsed markdown table as a styled HTML table
 */
const MarkdownTableRenderer = ({
  table,
  citations,
  onSourceClick,
}: {
  table: ParsedTable;
  citations: CitationMap | Record<string, WebSource | InternalSource>;
  onSourceClick?: (citation: Citation | WebSource | InternalSource) => void;
}) => (
  <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
    {table.caption && (
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
        <p className="text-[13px] text-slate-500 italic">{table.caption}</p>
      </div>
    )}
    <table className="w-full text-[13px]">
      <thead>
        <tr className="bg-slate-50/80 border-b border-slate-200">
          {table.headers.map((header, i) => (
            <th
              key={i}
              className="py-2.5 px-3 font-medium text-slate-600 text-[12px] uppercase tracking-wider"
              style={{ textAlign: table.alignments[i] || 'left' }}
            >
              <CitedContent content={header} citations={citations} onSourceClick={onSourceClick} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {table.rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50/30' : ''}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={`py-2 px-3 text-slate-600 ${
                  ci === 0 ? 'font-medium text-slate-700' : ''
                }`}
                style={{ textAlign: table.alignments[ci] || 'left' }}
              >
                <CitedContent content={cell} citations={citations} onSourceClick={onSourceClick} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================
// PARAGRAPH VARIANT
// ============================================

export interface CitedParagraphProps extends CitedContentProps {
  /** Render as block element */
  block?: boolean;
}

/**
 * Renders a paragraph of content with citations
 * Splits on newlines and renders each as a separate block
 * Handles numbered lists by converting inline numbers to proper list items
 * Handles markdown tables by parsing and rendering as styled HTML tables
 */
export const CitedParagraph = ({
  content,
  citations,
  onSourceClick,
  className = '',
  block = true,
}: CitedParagraphProps) => {
  // Normalize content for better display
  const normalizeContent = (text: string) => {
    let updated = text;

    // Normalize "Action:" and "Actions:" to start on a new line for readability
    // After sentence punctuation
    updated = updated.replace(/([.!?])\s+(Action:|Actions:)/g, '$1\n\n$2');
    // After closing citation markers
    updated = updated.replace(/(\[[BW]?\d+\])\s+(Action:|Actions:)/g, '$1\n\n$2');
    // After bold "Action" labels
    updated = updated.replace(/([.!?])\s+(\*\*Action:\*\*|\*\*Actions:\*\*)/g, '$1\n\n$2');

    // Convert inline numbered lists to proper line breaks
    // Pattern: ". 1." or "] 1." or "1." at start - adds newline before each numbered item
    // Matches: ". 1. Title:" or "[W1] 2. Title:" patterns
    updated = updated.replace(/([.!?]|\])\s+(\d+)\.\s+(\*\*)?([A-Z])/g, '$1\n\n$2. $3$4');

    // Also handle numbered items that follow citation markers with colon patterns
    // e.g., "driven by: 1. Title:" -> "driven by:\n\n1. Title:"
    updated = updated.replace(/:\s+(\d+)\.\s+(\*\*)?([A-Z])/g, ':\n\n$1. $2$3');

    return updated;
  };

  // Check if content contains markdown tables
  const hasTable = isMarkdownTableBlock(content);

  // If content has tables, split into prose + table segments first
  if (block && hasTable) {
    const segments = splitContentByTables(content);

    return (
      <div className={className}>
        {segments.map((segment, segIdx) => {
          if (segment.type === 'table') {
            const parsed = parseMarkdownTable(segment.content);
            if (parsed) {
              return (
                <MarkdownTableRenderer
                  key={`table-${segIdx}`}
                  table={parsed}
                  citations={citations}
                  onSourceClick={onSourceClick}
                />
              );
            }
          }

          // Prose segment - normalize and render paragraphs
          const normalized = normalizeContent(segment.content);
          const paragraphs = normalized.split(/\n\n+/);

          return (
            <div key={`prose-${segIdx}`}>
              {paragraphs.map((paragraph, pIdx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                const isNumberedItem = /^\d+\.\s+/.test(trimmed);
                if (isNumberedItem) {
                  const match = trimmed.match(/^(\d+)\.\s+(.*)$/s);
                  if (match) {
                    return (
                      <div key={pIdx} className={`${pIdx > 0 ? 'mt-3' : ''} flex gap-1`}>
                        <span className="text-slate-500 font-medium flex-shrink-0">{match[1]}.</span>
                        <span className="flex-1">
                          <CitedContent content={match[2]} citations={citations} onSourceClick={onSourceClick} />
                        </span>
                      </div>
                    );
                  }
                }

                return (
                  <p key={pIdx} className={pIdx > 0 ? 'mt-3' : ''}>
                    <CitedContent content={paragraph} citations={citations} onSourceClick={onSourceClick} />
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  const normalizedContent = normalizeContent(content);

  // Split content on double newlines (paragraph breaks)
  const paragraphs = normalizedContent.split(/\n\n+/);

  // Check if we have numbered list items
  const hasNumberedList = paragraphs.some(p => /^\d+\.\s+/.test(p.trim()));

  if (!block || paragraphs.length <= 1) {
    return (
      <CitedContent
        content={content}
        citations={citations}
        onSourceClick={onSourceClick}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();
        const isNumberedItem = /^\d+\.\s+/.test(trimmed);

        // Render numbered items with special styling
        if (isNumberedItem && hasNumberedList) {
          // Extract the number and content
          const match = trimmed.match(/^(\d+)\.\s+(.*)$/s);
          if (match) {
            const [, , itemContent] = match;
            return (
              <div key={index} className={`${index > 0 ? 'mt-3' : ''} flex gap-1`}>
                <span className="text-slate-500 font-medium flex-shrink-0">{match[1]}.</span>
                <span className="flex-1">
                  <CitedContent
                    content={itemContent}
                    citations={citations}
                    onSourceClick={onSourceClick}
                  />
                </span>
              </div>
            );
          }
        }

        return (
          <p key={index} className={index > 0 ? 'mt-3' : ''}>
            <CitedContent
              content={paragraph}
              citations={citations}
              onSourceClick={onSourceClick}
            />
          </p>
        );
      })}
    </div>
  );
};

// ============================================
// MARKDOWN INTEGRATION
// ============================================

/**
 * Process markdown content and replace citation markers with components
 * This is designed to work with existing markdown rendering pipelines
 */
export function renderCitedMarkdown(
  content: string,
  citations: CitationMap | Record<string, WebSource | InternalSource>,
  onSourceClick?: (citation: Citation | WebSource | InternalSource) => void
): React.ReactNode[] {
  const segments = parseContentWithCitations(content, citations);

  return segments.map((segment, index) => {
    if (segment.type === 'text') {
      return segment.content;
    }

    const citationId = segment.citationId!;
    const citation = citations[citationId];

    if (!citation) {
      return segment.content;
    }

    return (
      <CitationBadge
        key={index}
        citation={citation as Citation | WebSource | InternalSource}
        citationId={citationId}
        sourceType={segment.sourceType}
        onSourceClick={onSourceClick}
      />
    );
  });
}

export default CitedContent;
