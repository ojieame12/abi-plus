import { describe, it, expect } from 'vitest';
import {
  renderMarkdown,
  parseMarkdown,
  stripMarkdown,
  hasMarkdownTables,
  extractFirstParagraph,
  extractFirstSentence,
} from '../markdownRenderer';

describe('markdownRenderer', () => {
  describe('renderMarkdown', () => {
    it('converts bold text', () => {
      const html = renderMarkdown('**bold text**');
      expect(html).toContain('<strong>bold text</strong>');
    });

    it('converts italic text', () => {
      const html = renderMarkdown('*italic text*');
      expect(html).toContain('<em>italic text</em>');
    });

    it('converts underscores bold/italic', () => {
      expect(renderMarkdown('__bold__')).toContain('<strong>bold</strong>');
      expect(renderMarkdown('_italic_')).toContain('<em>italic</em>');
    });

    it('converts bullet lists', () => {
      const md = '- item 1\n- item 2\n- item 3';
      const html = renderMarkdown(md);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
      expect(html).toContain('item 1');
      expect(html).toContain('item 2');
    });

    it('converts numbered lists', () => {
      const md = '1. first\n2. second\n3. third';
      const html = renderMarkdown(md);
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>');
    });

    it('converts headings', () => {
      expect(renderMarkdown('# Heading 1')).toContain('<h1>');
      expect(renderMarkdown('## Heading 2')).toContain('<h2>');
      expect(renderMarkdown('### Heading 3')).toContain('<h3>');
    });

    it('converts tables (GFM)', () => {
      const md = '| A | B |\n|---|---|\n| 1 | 2 |';
      const html = renderMarkdown(md);
      expect(html).toContain('<table>');
      expect(html).toContain('<th>');
      expect(html).toContain('<td>');
    });

    it('converts inline code', () => {
      const html = renderMarkdown('Use `console.log()` for debugging');
      expect(html).toContain('<code>');
      expect(html).toContain('console.log()');
    });

    it('converts code blocks', () => {
      const md = '```\nconst x = 1;\n```';
      const html = renderMarkdown(md);
      expect(html).toContain('<pre>');
      expect(html).toContain('<code>');
    });

    it('converts links', () => {
      const html = renderMarkdown('[Click here](https://example.com)');
      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Click here');
    });

    it('handles multiple paragraphs without nesting', () => {
      const md = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const html = renderMarkdown(md);
      // Should have separate <p> tags, not nested
      expect(html).not.toMatch(/<p[^>]*><p/);
      expect(html.match(/<p>/g)?.length).toBe(3);
    });

    it('handles blockquotes', () => {
      const html = renderMarkdown('> This is a quote');
      expect(html).toContain('<blockquote>');
    });

    it('handles empty content', () => {
      expect(renderMarkdown('')).toBe('');
      expect(renderMarkdown('   ')).toBe('');
      expect(renderMarkdown(null as unknown as string)).toBe('');
      expect(renderMarkdown(undefined as unknown as string)).toBe('');
    });

    describe('options.highlightNumbers', () => {
      it('highlights currency values', () => {
        const html = renderMarkdown('Spend is $10.5M', { highlightNumbers: true });
        expect(html).toContain('font-medium');
        expect(html).toContain('$10.5M');
      });

      it('highlights percentages', () => {
        const html = renderMarkdown('Growth of 15%', { highlightNumbers: true });
        expect(html).toContain('font-medium');
        expect(html).toContain('15%');
      });

      it('highlights comma-separated numbers', () => {
        const html = renderMarkdown('Total: 1,234,567', { highlightNumbers: true });
        expect(html).toContain('font-medium');
      });

      it('does not highlight when option is false', () => {
        const html = renderMarkdown('Spend is $10.5M', { highlightNumbers: false });
        expect(html).not.toContain('font-medium');
      });

      it('handles K, M, B suffixes', () => {
        const html = renderMarkdown('$500K and $2B', { highlightNumbers: true });
        expect(html).toContain('$500K');
        expect(html).toContain('$2B');
        expect(html.match(/font-medium/g)?.length).toBe(2);
      });
    });

    describe('options.suppressTables', () => {
      it('removes tables when suppressTables is true', () => {
        const md = 'Before table\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nAfter table';
        const html = renderMarkdown(md, { suppressTables: true });
        expect(html).not.toContain('<table>');
        expect(html).toContain('Before table');
        expect(html).toContain('After table');
      });

      it('keeps tables when suppressTables is false', () => {
        const md = '| A | B |\n|---|---|\n| 1 | 2 |';
        const html = renderMarkdown(md, { suppressTables: false });
        expect(html).toContain('<table>');
      });
    });

    describe('options.maxParagraphs', () => {
      it('limits paragraphs to specified count', () => {
        const md = 'Para 1\n\nPara 2\n\nPara 3\n\nPara 4\n\nPara 5';
        const html = renderMarkdown(md, { maxParagraphs: 2 });
        // Should only have 2 paragraphs
        expect(html.match(/<p>/g)?.length).toBeLessThanOrEqual(2);
      });
    });

    describe('XSS sanitization', () => {
      it('sanitizes script tags', () => {
        const md = '<script>alert("xss")</script>';
        const html = renderMarkdown(md);
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('alert');
      });

      it('sanitizes onclick attributes', () => {
        const md = '<a href="#" onclick="alert(1)">click</a>';
        const html = renderMarkdown(md);
        expect(html).not.toContain('onclick');
      });

      it('sanitizes javascript: URLs', () => {
        const md = '[click](javascript:alert(1))';
        const html = renderMarkdown(md);
        expect(html).not.toContain('javascript:');
      });

      it('sanitizes iframe tags', () => {
        const md = '<iframe src="evil.com"></iframe>';
        const html = renderMarkdown(md);
        expect(html).not.toContain('<iframe');
      });
    });
  });

  describe('parseMarkdown', () => {
    it('returns AST root node', () => {
      const ast = parseMarkdown('**bold**');
      expect(ast.type).toBe('root');
      expect(ast.children).toBeDefined();
      expect(ast.children.length).toBeGreaterThan(0);
    });

    it('parses paragraphs correctly', () => {
      const ast = parseMarkdown('First para\n\nSecond para');
      expect(ast.children.filter(c => c.type === 'paragraph').length).toBe(2);
    });
  });

  describe('stripMarkdown', () => {
    it('removes bold markers', () => {
      expect(stripMarkdown('**bold**')).toBe('bold');
    });

    it('removes italic markers', () => {
      expect(stripMarkdown('*italic*')).toBe('italic');
    });

    it('removes heading markers', () => {
      expect(stripMarkdown('## Heading')).toBe('Heading');
    });

    it('removes links but keeps text', () => {
      expect(stripMarkdown('[text](url)')).toBe('text');
    });

    it('removes list markers', () => {
      expect(stripMarkdown('- item 1\n- item 2')).toBe('item 1\nitem 2');
    });

    it('handles empty content', () => {
      expect(stripMarkdown('')).toBe('');
      expect(stripMarkdown(null as unknown as string)).toBe('');
    });
  });

  describe('hasMarkdownTables', () => {
    it('returns true for content with tables', () => {
      expect(hasMarkdownTables('| A | B |\n|---|---|\n| 1 | 2 |')).toBe(true);
    });

    it('returns false for content without tables', () => {
      expect(hasMarkdownTables('Just some text')).toBe(false);
    });

    it('returns false for pipe in regular text', () => {
      expect(hasMarkdownTables('A | B without table')).toBe(false);
    });
  });

  describe('extractFirstParagraph', () => {
    it('extracts first paragraph', () => {
      const md = 'First paragraph.\n\nSecond paragraph.';
      expect(extractFirstParagraph(md)).toBe('First paragraph.');
    });

    it('skips headings', () => {
      const md = '## Heading\n\nFirst real paragraph.';
      expect(extractFirstParagraph(md)).toBe('First real paragraph.');
    });

    it('handles empty content', () => {
      expect(extractFirstParagraph('')).toBe('');
    });
  });

  describe('extractFirstSentence', () => {
    it('extracts first sentence ending with period', () => {
      expect(extractFirstSentence('First sentence. Second sentence.')).toBe('First sentence.');
    });

    it('extracts first sentence ending with exclamation', () => {
      expect(extractFirstSentence('Alert! Something happened.')).toBe('Alert!');
    });

    it('extracts first sentence ending with question mark', () => {
      expect(extractFirstSentence('What happened? Let me explain.')).toBe('What happened?');
    });

    it('returns truncated text if no sentence ending found', () => {
      const longText = 'This is a very long text without any sentence endings that goes on and on';
      const result = extractFirstSentence(longText);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('handles empty content', () => {
      expect(extractFirstSentence('')).toBe('');
    });
  });
});
