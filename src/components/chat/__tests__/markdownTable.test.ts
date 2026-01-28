import { describe, it, expect } from 'vitest';
import {
  parseMarkdownTable,
  isMarkdownTableBlock,
  splitContentByTables,
} from '../CitedContent';

// ============================================
// parseMarkdownTable
// ============================================

describe('parseMarkdownTable', () => {
  it('should parse a standard 3-column table', () => {
    const block = [
      '| Supplier | Country | Capacity |',
      '|---|---|---|',
      '| Valcambi | Switzerland | ~2,000 tonnes/year |',
      '| PAMP | Switzerland | ~450 tonnes/year |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.headers).toEqual(['Supplier', 'Country', 'Capacity']);
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[0][0]).toBe('Valcambi');
    expect(result!.rows[1][2]).toBe('~450 tonnes/year');
  });

  it('should parse alignment markers correctly', () => {
    const block = [
      '| Left | Center | Right |',
      '|:---|:---:|---:|',
      '| a | b | c |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.alignments).toEqual(['left', 'center', 'right']);
  });

  it('should handle mixed alignment markers', () => {
    const block = [
      '| Default | Right | Center |',
      '|---|---:|:---:|',
      '| a | 100 | yes |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.alignments).toEqual(['left', 'right', 'center']);
  });

  it('should handle escaped pipes in cell content', () => {
    const block = [
      '| Name | Formula |',
      '|---|---|',
      '| Pipe test | A \\| B |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.rows[0][1]).toBe('A | B');
  });

  it('should accept a caption line starting with "Table:"', () => {
    const block = [
      'Table: European Gold Refiners',
      '| Supplier | Country |',
      '|---|---|',
      '| Valcambi | Switzerland |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.caption).toBe('Table: European Gold Refiners');
    expect(result!.headers).toEqual(['Supplier', 'Country']);
  });

  it('should accept an italic caption', () => {
    const block = [
      '*Key Metrics*',
      '| Metric | Value |',
      '|---|---|',
      '| Price | $1,800 |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.caption).toBe('Key Metrics');
  });

  it('should NOT steal a normal sentence as caption', () => {
    const block = [
      'This is a normal sentence before the table.',
      '| Metric | Value |',
      '|---|---|',
      '| Price | $1,800 |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    // The normal sentence should not be treated as a caption
    expect(result!.caption).toBeUndefined();
  });

  it('should return null for single-column tables', () => {
    const block = [
      '| Name |',
      '|---|',
      '| Valcambi |',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).toBeNull();
  });

  it('should return null for missing separator row', () => {
    const block = [
      '| Supplier | Country |',
      '| Valcambi | Switzerland |',
    ].join('\n');

    expect(parseMarkdownTable(block)).toBeNull();
  });

  it('should return null for separator with too few dashes', () => {
    const block = [
      '| Supplier | Country |',
      '|--|--|',
      '| Valcambi | Switzerland |',
    ].join('\n');

    expect(parseMarkdownTable(block)).toBeNull();
  });

  it('should return null for no data rows', () => {
    const block = [
      '| Supplier | Country |',
      '|---|---|',
    ].join('\n');

    expect(parseMarkdownTable(block)).toBeNull();
  });

  it('should return null for fewer than 3 lines', () => {
    const block = '| A | B |';
    expect(parseMarkdownTable(block)).toBeNull();
  });

  it('should handle rows without leading/trailing pipes', () => {
    const block = [
      'Supplier | Country',
      '---|---',
      'Valcambi | Switzerland',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.headers).toEqual(['Supplier', 'Country']);
    expect(result!.rows[0]).toEqual(['Valcambi', 'Switzerland']);
  });

  it('should stop at non-pipe lines', () => {
    const block = [
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
      '| 3 | 4 |',
      'This is prose after the table',
    ].join('\n');

    const result = parseMarkdownTable(block);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(2);
  });
});

// ============================================
// isMarkdownTableBlock
// ============================================

describe('isMarkdownTableBlock', () => {
  it('should detect a valid table', () => {
    const text = [
      'Some intro text.',
      '',
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
    ].join('\n');

    expect(isMarkdownTableBlock(text)).toBe(true);
  });

  it('should NOT detect pipes inside fenced code blocks', () => {
    const text = [
      'Here is some code:',
      '```',
      '| this | is | not | a | table |',
      '|------|-----|-----|-----|-------|',
      '| just | code | with | pipes | inside |',
      '```',
    ].join('\n');

    expect(isMarkdownTableBlock(text)).toBe(false);
  });

  it('should NOT detect plain text with occasional pipe characters', () => {
    const text = 'The value is A | B and we should note that C | D applies.';
    expect(isMarkdownTableBlock(text)).toBe(false);
  });

  it('should NOT detect a separator without enough surrounding pipe lines', () => {
    const text = [
      '|---|---|',
      '| 1 | 2 |',
    ].join('\n');

    // Only 2 pipe lines, needs ≥ 3
    expect(isMarkdownTableBlock(text)).toBe(false);
  });

  it('should require ≥ 2 columns in separator', () => {
    const text = [
      '| A |',
      '|---|',
      '| 1 |',
    ].join('\n');

    expect(isMarkdownTableBlock(text)).toBe(false);
  });
});

// ============================================
// splitContentByTables
// ============================================

describe('splitContentByTables', () => {
  it('should return pure prose if no table present', () => {
    const content = 'This is just regular prose with no table.';
    const segments = splitContentByTables(content);

    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('prose');
    expect(segments[0].content).toBe(content);
  });

  it('should split prose + table + prose', () => {
    const content = [
      'Here is some intro text.',
      '',
      '| Supplier | Country |',
      '|---|---|',
      '| Valcambi | Switzerland |',
      '| PAMP | Switzerland |',
      '',
      'And here is the conclusion.',
    ].join('\n');

    const segments = splitContentByTables(content);

    expect(segments.length).toBeGreaterThanOrEqual(2);

    const proseSegments = segments.filter(s => s.type === 'prose');
    const tableSegments = segments.filter(s => s.type === 'table');

    expect(tableSegments).toHaveLength(1);
    expect(proseSegments.length).toBeGreaterThanOrEqual(1);

    // Table segment should contain the pipe-delimited content
    expect(tableSegments[0].content).toContain('Valcambi');
  });

  it('should NOT treat pipes inside code blocks as tables', () => {
    const content = [
      'Here is code:',
      '```',
      '| Col1 | Col2 |',
      '|------|------|',
      '| a    | b    |',
      '```',
      'After the code.',
    ].join('\n');

    const segments = splitContentByTables(content);

    // Should be all prose, no table segment
    const tableSegments = segments.filter(s => s.type === 'table');
    expect(tableSegments).toHaveLength(0);
  });

  it('should handle multiple tables in the same content', () => {
    const content = [
      'First paragraph.',
      '',
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
      '',
      'Middle paragraph.',
      '',
      '| X | Y |',
      '|---|---|',
      '| 3 | 4 |',
      '',
      'Last paragraph.',
    ].join('\n');

    const segments = splitContentByTables(content);
    const tableSegments = segments.filter(s => s.type === 'table');

    expect(tableSegments).toHaveLength(2);
  });

  it('should handle table with caption', () => {
    const content = [
      'Intro text.',
      '',
      'Table: Key Metrics',
      '| Metric | Value |',
      '|---|---|',
      '| Price | $1,800 |',
      '',
      'Outro text.',
    ].join('\n');

    const segments = splitContentByTables(content);
    const tableSegments = segments.filter(s => s.type === 'table');

    expect(tableSegments).toHaveLength(1);
    expect(tableSegments[0].content).toContain('Table: Key Metrics');
  });

  it('should handle table-like content that is actually invalid', () => {
    const content = [
      'The price is $10 | $20 per unit.',
      'Another line with | pipe characters.',
    ].join('\n');

    const segments = splitContentByTables(content);

    // Should be pure prose
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('prose');
  });
});
