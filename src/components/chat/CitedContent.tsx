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
// PARAGRAPH VARIANT
// ============================================

export interface CitedParagraphProps extends CitedContentProps {
  /** Render as block element */
  block?: boolean;
}

/**
 * Renders a paragraph of content with citations
 * Splits on newlines and renders each as a separate block
 */
export const CitedParagraph = ({
  content,
  citations,
  onSourceClick,
  className = '',
  block = true,
}: CitedParagraphProps) => {
  // Normalize "Action:" and "Actions:" to start on a new line for readability
  const normalizeActions = (text: string) => {
    let updated = text;
    // After sentence punctuation
    updated = updated.replace(/([.!?])\s+(Action:|Actions:)/g, '$1\n\n$2');
    // After closing citation markers
    updated = updated.replace(/(\[[BW]?\d+\])\s+(Action:|Actions:)/g, '$1\n\n$2');
    // After bold "Action" labels
    updated = updated.replace(/([.!?])\s+(\*\*Action:\*\*|\*\*Actions:\*\*)/g, '$1\n\n$2');
    return updated;
  };

  const normalizedContent = normalizeActions(content);

  // Split content on double newlines (paragraph breaks)
  const paragraphs = normalizedContent.split(/\n\n+/);

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
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={index > 0 ? 'mt-3' : ''}>
          <CitedContent
            content={paragraph}
            citations={citations}
            onSourceClick={onSourceClick}
          />
        </p>
      ))}
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
