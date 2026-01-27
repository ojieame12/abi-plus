// PDF Export via Browser Print
// Builds a self-contained HTML document from report data and triggers window.print()
// The user sees the browser's native print dialog where they can "Save as PDF"
//
// Typography + colors are aligned to the on-screen report artifact:
//   Font: ClashGrotesk (loaded from same origin)
//   Colors: Tailwind slate palette

import type { DeepResearchReport, ReportSection, ReportCitation } from '../types/deepResearch';
import { renderMarkdown } from './markdownRenderer';

// ============================================
// TAILWIND SLATE PALETTE (single source of truth)
// ============================================

const C = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  accent:   '#6366f1', // indigo-500 — citation links
} as const;

// ============================================
// HTML ENTITY ESCAPING
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================
// CITATION PROCESSING
// ============================================

/**
 * Build a stable numeric mapping from citation IDs (e.g. "B1", "W3", "1") to
 * sequential reference numbers used in the printed document.
 */
function buildCitationNumberMap(references: ReportCitation[]): Map<string, number> {
  const map = new Map<string, number>();
  references.forEach((ref, i) => {
    map.set(ref.id, i + 1);
  });
  return map;
}

/**
 * Collect citation IDs in first-appearance order from summary + sections.
 */
function collectCitationIdsInOrder(report: DeepResearchReport): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const collectFromText = (text?: string) => {
    if (!text) return;
    const matches = text.match(/\[([A-Z]?\d+)\]/g) || [];
    for (const match of matches) {
      const id = match.replace(/[\[\]]/g, '');
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
  };

  collectFromText(report.summary);

  const walkSections = (sections: ReportSection[]) => {
    for (const section of sections) {
      collectFromText(section.content);
      if (section.children?.length) {
        walkSections(section.children);
      }
    }
  };

  walkSections(report.sections);

  return ordered;
}

/**
 * Build ordered references list based on first citation appearance.
 * Unused references are appended at the end to preserve completeness.
 */
function buildOrderedReferences(report: DeepResearchReport): ReportCitation[] {
  const references = report.references || Object.values(report.citations || {});
  const referencesById = new Map(references.map(ref => [ref.id, ref]));
  const orderedIds = collectCitationIdsInOrder(report);

  const orderedRefs = orderedIds
    .map(id => referencesById.get(id))
    .filter((ref): ref is ReportCitation => Boolean(ref));

  const unusedRefs = references.filter(ref => !orderedIds.includes(ref.id));

  return [...orderedRefs, ...unusedRefs];
}

/**
 * Convert inline citation markers like [B1], [W1], [1] into superscript numbers
 * that link to the references section.
 */
function processCitations(text: string, citationMap: Map<string, number>): string {
  return text.replace(/\[([A-Z]?\d+)\]/g, (_match, id: string) => {
    const num = citationMap.get(id);
    if (num !== undefined) {
      return `<sup class="cite"><a href="#ref-${num}">[${num}]</a></sup>`;
    }
    return `<sup class="cite unknown">[${escapeHtml(id)}]</sup>`;
  });
}

// ============================================
// CONTENT PROCESSING
// ============================================

function contentToHtml(content: string, citationMap: Map<string, number>): string {
  if (!content?.trim()) return '';
  const html = renderMarkdown(content);
  return processCitations(html, citationMap);
}

// ============================================
// SECTION RENDERING
// ============================================

function renderSection(section: ReportSection, citationMap: Map<string, number>): string {
  const headingTag = section.level === 0 ? 'h2' : section.level === 1 ? 'h3' : 'h4';

  let html = `<${headingTag}>${escapeHtml(section.title)}</${headingTag}>\n`;

  if (section.content) {
    html += contentToHtml(section.content, citationMap);
  }

  if (section.children && section.children.length > 0) {
    for (const child of section.children) {
      html += renderSection(child, citationMap);
    }
  }

  return html;
}

// ============================================
// REFERENCES RENDERING
// ============================================

function renderReferences(references: ReportCitation[], citationMap: Map<string, number>): string {
  if (!references || references.length === 0) return '';

  const items = references
    .map((ref, i) => {
      const num = citationMap.get(ref.id) ?? i + 1;
      const name = escapeHtml(ref.source.name || `Source ${num}`);
      const snippet = ref.source.snippet
        ? `<br/><span class="ref-snippet">${escapeHtml(ref.source.snippet)}</span>`
        : '';
      const url = ref.source.url
        ? `<br/><a href="${escapeHtml(ref.source.url)}" class="ref-url">${escapeHtml(ref.source.url)}</a>`
        : '';

      return `<li id="ref-${num}">
        <span class="ref-name">${name}</span>${url}${snippet}
      </li>`;
    })
    .join('\n');

  return `
    <div style="page-break-before:always;"></div>
    <h2>References</h2>
    <ol class="references">${items}</ol>
  `;
}

// ============================================
// METADATA HELPERS
// ============================================

function getStudyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sourcing_study: 'Sourcing Study',
    cost_model: 'Cost Model Analysis',
    market_analysis: 'Market Analysis',
    supplier_assessment: 'Supplier Assessment',
    risk_assessment: 'Risk Assessment',
    custom: 'Custom Research',
  };
  return labels[type] || 'Research Report';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatProcessingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function generateReportPdf(report: DeepResearchReport): void {
  const references = buildOrderedReferences(report);
  const citationMap = buildCitationNumberMap(references);

  const studyLabel = getStudyTypeLabel(report.studyType);
  const dateStr = formatDate(report.generatedAt);
  const processingTime = formatProcessingTime(report.totalProcessingTime);
  const sourceCount = report.allSources.length;

  // Build metadata line
  const metaParts = [dateStr, `${sourceCount} sources`, processingTime];
  const metaLine = metaParts.join(' · ');

  // Optional customer/region line
  const contextParts: string[] = [];
  if (report.metadata?.customer) contextParts.push(escapeHtml(report.metadata.customer));
  if (report.metadata?.region) contextParts.push(escapeHtml(report.metadata.region));
  const contextLine = contextParts.length > 0 ? contextParts.join(' · ') : '';

  // Build sections HTML
  const sectionsHtml = report.sections.map(s => renderSection(s, citationMap)).join('\n');

  // Build executive summary
  const summaryHtml = report.summary
    ? `<div class="summary">${contentToHtml(report.summary, citationMap)}</div>`
    : '';

  // Build references
  const referencesHtml = renderReferences(references, citationMap);

  // Resolve font URLs from current origin so the print window can load them
  const origin = window.location.origin;

  // Assemble the full HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(report.title)}</title>
  <style>
    /* ── ClashGrotesk — same font as the app ── */
    @font-face {
      font-family: 'ClashGrotesk';
      src: url('${origin}/ClashGrotesk-Light.otf') format('opentype');
      font-weight: 300;
      font-style: normal;
    }
    @font-face {
      font-family: 'ClashGrotesk';
      src: url('${origin}/ClashGrotesk-Regular.otf') format('opentype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'ClashGrotesk';
      src: url('${origin}/ClashGrotesk-Medium.otf') format('opentype');
      font-weight: 500;
      font-style: normal;
    }

    /* ── Page rules ── */
    @page {
      size: A4;
      margin: 2.2cm 2.5cm 2.5cm 2.5cm;
      @bottom-center {
        content: "Confidential";
        font-size: 8pt;
        color: ${C.slate400};
        font-family: 'ClashGrotesk', system-ui, sans-serif;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8pt;
        color: ${C.slate400};
        font-family: 'ClashGrotesk', system-ui, sans-serif;
      }
    }

    /* ── Base ── */
    * { box-sizing: border-box; }

    body {
      font-family: 'ClashGrotesk', system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.75;
      letter-spacing: 0.03em;
      color: ${C.slate600};
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Links ── */
    a { color: ${C.accent}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    sup a { text-decoration: none; }

    /* ── Headings — match on-screen artifact ── */
    h1, h2, h3, h4 {
      font-family: 'ClashGrotesk', system-ui, -apple-system, sans-serif;
      page-break-after: avoid;
      break-after: avoid;
      letter-spacing: normal;
    }

    h1 {
      font-size: 28pt;
      font-weight: 400;
      color: ${C.slate900};
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0 0 20px 0;
    }

    h2 {
      font-size: 15pt;
      font-weight: 500;
      color: ${C.slate900};
      margin: 32px 0 12px 0;
    }

    h3 {
      font-size: 12pt;
      font-weight: 500;
      color: ${C.slate800};
      margin: 24px 0 10px 0;
    }

    h4 {
      font-size: 11pt;
      font-weight: 400;
      color: ${C.slate700};
      margin: 20px 0 8px 0;
    }

    /* ── Body text ── */
    p {
      margin: 0 0 14px 0;
      line-height: 1.75;
      color: ${C.slate600};
      letter-spacing: 0.03em;
    }

    p, li {
      orphans: 3;
      widows: 3;
    }

    ul, ol {
      margin: 0 0 14px 20px;
      padding: 0;
      color: ${C.slate600};
    }

    li { margin: 4px 0; }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 10pt;
    }

    th, td {
      border: 1px solid ${C.slate200};
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: ${C.slate50};
      font-weight: 500;
      color: ${C.slate700};
    }

    /* ── Block elements ── */
    blockquote {
      margin: 10px 0;
      padding: 6px 12px;
      border-left: 3px solid ${C.slate200};
      color: ${C.slate500};
    }

    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10pt;
    }

    /* ── Citations (superscript) ── */
    sup.cite { font-size: 9px; letter-spacing: 0; }
    sup.cite a { color: ${C.accent}; text-decoration: none; }
    sup.cite.unknown { color: ${C.slate400}; }

    /* ── Summary divider ── */
    .summary {
      margin-bottom: 40px;
      padding-bottom: 28px;
      border-bottom: 1px solid ${C.slate100};
    }
    .summary p { line-height: 1.85; }

    /* ── References ── */
    ol.references {
      padding-left: 24px;
      margin: 0;
      font-size: 10.5pt;
      color: ${C.slate700};
    }
    ol.references li {
      margin-bottom: 12px;
      padding-left: 4px;
    }
    .ref-name { color: ${C.slate700}; }
    .ref-url {
      font-size: 10pt;
      color: ${C.accent};
      word-break: break-all;
    }
    .ref-snippet {
      font-size: 10pt;
      color: ${C.slate400};
      line-height: 1.5;
    }

    /* ── Cover page ── */
    .cover { page-break-after: always; padding-top: 120px; }
    .cover .study-type {
      font-size: 10pt;
      color: ${C.accent};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .cover .meta {
      font-size: 11pt;
      color: ${C.slate400};
      margin: 0 0 8px 0;
    }
    .cover .query {
      font-size: 10pt;
      color: ${C.slate400};
      margin: 24px 0 0 0;
      line-height: 1.6;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid ${C.slate100};
    }
    .doc-footer p {
      font-size: 9pt;
      color: ${C.slate400};
      line-height: 1.6;
    }

    /* ── Screen preview mode ── */
    @media screen {
      body {
        max-width: 680px;
        margin: 40px auto;
        padding: 0 24px;
      }
    }

    /* ── Print pagination ── */
    .page-break { page-break-before: always; break-before: page; }
    h2, h3 { break-inside: avoid; }
    table { break-inside: avoid; }
  </style>
</head>
<body>
  <!-- COVER PAGE -->
  <div class="cover">
    <div class="study-type">${escapeHtml(studyLabel)}</div>
    <h1>${escapeHtml(report.title)}</h1>
    <p class="meta">${metaLine}</p>
    ${contextLine ? `<p class="meta">${contextLine}</p>` : ''}
    <p class="query"><em>Original query: ${escapeHtml(report.queryOriginal)}</em></p>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  ${summaryHtml}

  <!-- REPORT SECTIONS -->
  ${sectionsHtml}

  <!-- REFERENCES -->
  ${referencesHtml}

  <!-- DOCUMENT FOOTER -->
  <div class="doc-footer">
    <p>
      Generated from ${sourceCount} sources in ${escapeHtml(processingTime)}.${
        report.qualityMetrics
          ? ` ${report.qualityMetrics.sectionsWithCitations} of ${report.qualityMetrics.totalSections} sections include citations.`
          : ''
      }
    </p>
  </div>

  <script>
    // Wait for ClashGrotesk fonts to load, then trigger print
    document.fonts.ready.then(function() {
      setTimeout(function() { window.print(); }, 300);
    });
    window.addEventListener('afterprint', function() {
      window.close();
    });
  </script>
</body>
</html>`;

  // Open in a new window and write the HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
