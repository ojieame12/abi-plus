// Markdown Renderer - Safe pipeline using remark/rehype
// Uses remark-rehype + rehype-sanitize for XSS protection

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

// ============================================
// TYPES
// ============================================

export interface RenderOptions {
  /** Highlight numbers like $10.5M, 15%, etc. Default: false */
  highlightNumbers?: boolean;
  /** Strip tables from output (use when widget is present). Default: false */
  suppressTables?: boolean;
  /** Maximum number of paragraphs to render. Default: unlimited */
  maxParagraphs?: number;
}

// ============================================
// CUSTOM SANITIZE SCHEMA
// ============================================

// Extend default schema to allow class attributes for Tailwind styling
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'class'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'class', 'style'],
  },
};

// ============================================
// REMARK PLUGINS
// ============================================

/**
 * Plugin to remove table nodes from AST
 */
function stripTables() {
  return (tree: Root) => {
    visit(tree, 'table', (_node, index, parent) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        return index; // Revisit this index since we removed a node
      }
    });
  };
}

/**
 * Plugin to limit the number of paragraphs
 */
function limitParagraphs(max: number) {
  return (tree: Root) => {
    let paragraphCount = 0;
    visit(tree, 'paragraph', (_node, index, parent) => {
      paragraphCount++;
      if (paragraphCount > max && parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        return index;
      }
    });
  };
}

// ============================================
// POST-PROCESSORS
// ============================================

/**
 * Highlight numbers (currency, percentages) in HTML
 * Matches: $10.5M, $500K, 15%, 1,234.56, etc.
 */
function highlightNumbers(html: string): string {
  // Pattern matches:
  // - Currency: $10.5M, $500K, $1,234.56
  // - Percentages: 15%, 3.5%
  // - Plain numbers with commas: 1,234,567
  // Negative lookbehind/lookahead to avoid matching inside URLs or words
  return html.replace(
    /(?<![a-zA-Z0-9-])(\$[\d,.]+[BMKbmk]?|\d{1,3}(?:,\d{3})*(?:\.\d+)?%?)(?![a-zA-Z0-9-])/g,
    '<span class="font-medium text-slate-900">$1</span>'
  );
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

/**
 * Convert markdown to sanitized HTML
 *
 * @param content - Markdown string to render
 * @param options - Rendering options
 * @returns Sanitized HTML string
 *
 * @example
 * ```ts
 * const html = renderMarkdown('**Bold** and *italic*');
 * // => '<p><strong>Bold</strong> and <em>italic</em></p>'
 *
 * const html = renderMarkdown('Spend is $10.5M', { highlightNumbers: true });
 * // => '<p>Spend is <span class="font-medium text-slate-900">$10.5M</span></p>'
 * ```
 */
export function renderMarkdown(content: string, options: RenderOptions = {}): string {
  // Handle empty/null content
  if (!content?.trim()) {
    return '';
  }

  const { highlightNumbers: doHighlight, suppressTables, maxParagraphs } = options;

  // Build the unified processor pipeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processor: any = unified()
    .use(remarkParse)
    .use(remarkGfm);

  // Apply optional plugins
  if (suppressTables) {
    processor = processor.use(stripTables);
  }

  if (maxParagraphs && maxParagraphs > 0) {
    processor = processor.use(limitParagraphs, maxParagraphs);
  }

  // Convert to HTML with sanitization
  processor = processor
    .use(remarkRehype)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify);

  // Process synchronously
  const result = processor.processSync(content);
  let html = String(result);

  // Post-process: highlight numbers
  if (doHighlight) {
    html = highlightNumbers(html);
  }

  return html;
}

// ============================================
// PARSE FUNCTION (for advanced use)
// ============================================

/**
 * Parse markdown to AST for custom rendering
 *
 * @param content - Markdown string to parse
 * @returns mdast Root node
 */
export function parseMarkdown(content: string): Root {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(content);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Strip all markdown formatting and return plain text
 */
export function stripMarkdown(content: string): string {
  if (!content?.trim()) return '';

  return content
    // Remove headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove list markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Collapse whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if content contains markdown tables
 */
export function hasMarkdownTables(content: string): boolean {
  // Simple heuristic: look for pipe characters with dashes (table separator row)
  return /\|[-:]+\|/.test(content);
}

/**
 * Extract first paragraph from markdown
 */
export function extractFirstParagraph(content: string): string {
  if (!content?.trim()) return '';

  // Split by double newlines and take first non-empty block
  const paragraphs = content.split(/\n\n+/);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    // Skip headings and list items
    if (trimmed && !trimmed.startsWith('#') && !trimmed.match(/^[-*+\d.]/)) {
      return trimmed;
    }
  }

  return paragraphs[0]?.trim() || '';
}

/**
 * Extract first sentence from text
 */
export function extractFirstSentence(content: string): string {
  if (!content?.trim()) return '';

  const match = content.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : content.slice(0, 50).trim();
}
