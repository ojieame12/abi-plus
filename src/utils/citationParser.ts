// Citation Parser
// Parses content with [B1], [W1] citation markers into renderable segments

import type { CitationMap } from '../types/hybridResponse';
import type { WebSource, InternalSource } from '../types/aiResponse';

// ============================================
// TYPES
// ============================================

export type CitationSourceType = 'beroe' | 'web' | 'unknown';

export interface ParsedContentSegment {
  /** Segment type: plain text or citation marker */
  type: 'text' | 'citation';
  /** Content: text content or citation ID */
  content: string;
  /** Citation ID (only for citation segments) */
  citationId?: string;
  /** Citation source type for styling */
  sourceType?: CitationSourceType;
}

// ============================================
// PARSER
// ============================================

/**
 * Parse content with [B1], [W1] markers into renderable segments
 *
 * @example
 * const segments = parseContentWithCitations(
 *   "Steel prices up 3% [B1] due to demand [W1].",
 *   { B1: {...}, W1: {...} }
 * );
 * // Returns:
 * // [
 * //   { type: 'text', content: 'Steel prices up 3% ' },
 * //   { type: 'citation', content: 'B1', citationId: 'B1', sourceType: 'beroe' },
 * //   { type: 'text', content: ' due to demand ' },
 * //   { type: 'citation', content: 'W1', citationId: 'W1', sourceType: 'web' },
 * //   { type: 'text', content: '.' },
 * // ]
 */
export function parseContentWithCitations(
  content: string,
  citations: CitationMap | Record<string, WebSource | InternalSource>
): ParsedContentSegment[] {
  if (!content) return [];

  const segments: ParsedContentSegment[] = [];
  const regex = /\[([BW]\d+)\]/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Add text segment before citation
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    // Extract citation ID
    const citationId = match[1];
    const citation = citations[citationId];

    if (citation) {
      // Valid citation - determine source type
      const sourceType = getCitationSourceType(citationId, citation);
      segments.push({
        type: 'citation',
        content: citationId,
        citationId,
        sourceType,
      });
    } else {
      // Unknown citation - treat as plain text
      segments.push({
        type: 'text',
        content: match[0], // Keep the [B1] as text
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last citation
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Determine the source type from citation ID and data
 */
function getCitationSourceType(
  citationId: string,
  citation: unknown
): CitationSourceType {
  // Check by prefix first
  if (citationId.startsWith('B')) return 'beroe';
  if (citationId.startsWith('W')) return 'web';

  // Check by citation data if available
  if (citation && typeof citation === 'object') {
    if ('type' in citation) {
      const type = (citation as { type?: string }).type;
      if (type === 'beroe' || type === 'web') return type;
      if (type === 'dun_bradstreet' || type === 'ecovadis' || type === 'internal_data') {
        return 'beroe'; // Internal sources use beroe styling
      }
    }
    if ('url' in citation && 'domain' in citation) {
      return 'web';
    }
  }

  return 'unknown';
}

// ============================================
// EXTRACTION UTILITIES
// ============================================

/**
 * Extract all unique citation IDs from content
 *
 * @example
 * extractCitationIds("Prices [B1] and demand [W1][W2] with [B1] repeated.")
 * // Returns: ['B1', 'W1', 'W2']
 */
export function extractCitationIds(content: string): string[] {
  if (!content) return [];

  const regex = /\[([BW]\d+)\]/g;
  const ids = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]);
  }

  return Array.from(ids);
}

/**
 * Extract citation IDs by type (Beroe or Web)
 */
export function extractCitationIdsByType(content: string): {
  beroe: string[];
  web: string[];
} {
  const ids = extractCitationIds(content);
  return {
    beroe: ids.filter(id => id.startsWith('B')),
    web: ids.filter(id => id.startsWith('W')),
  };
}

/**
 * Check if content has any citations
 */
export function hasCitations(content: string): boolean {
  return /\[[BW]\d+\]/.test(content);
}

/**
 * Count total citations in content
 */
export function countTotalCitations(content: string): number {
  return extractCitationIds(content).length;
}

// ============================================
// CONTENT MANIPULATION
// ============================================

/**
 * Strip all citation markers from content
 * Useful for plain text rendering
 */
export function stripCitations(content: string): string {
  return content.replace(/\[[BW]\d+\]/g, '');
}

/**
 * Replace citation markers with human-readable format
 * @example
 * humanizeCitations("Prices up [B1].", { B1: { name: "Beroe Report" } })
 * // Returns: "Prices up (Beroe Report)."
 */
export function humanizeCitations(
  content: string,
  citations: CitationMap | Record<string, { name?: string }>
): string {
  return content.replace(/\[([BW]\d+)\]/g, (match, citationId) => {
    const citation = citations[citationId];
    if (citation && 'name' in citation && citation.name) {
      return `(${citation.name})`;
    }
    return match;
  });
}

/**
 * Get citation statistics for content
 */
export function getCitationStats(content: string): {
  total: number;
  beroe: number;
  web: number;
  unique: string[];
} {
  const ids = extractCitationIds(content);
  const { beroe, web } = extractCitationIdsByType(content);

  return {
    total: ids.length,
    beroe: beroe.length,
    web: web.length,
    unique: ids,
  };
}
