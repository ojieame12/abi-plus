// reportPdfVisualRenderer
// Render ReportVisual items to HTML/SVG for PDF export (static, print-safe).

import type { ReportVisual } from '../types/deepResearch';

// ── Color palette ──
const COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
];

const getColor = (index: number, override?: string): string =>
  override || COLORS[index % COLORS.length];

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatNumber = (value: number, digits = 1): string =>
  Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : '0';

const renderVisualFooter = (visual: ReportVisual, citationMap: Map<string, number>): string => {
  const ids = (visual.sourceIds || []).filter(id => citationMap.has(id));
  const cites = ids.map(id => {
    const num = citationMap.get(id);
    return num ? `<sup class="cite"><a href="#ref-${num}">[${num}]</a></sup>` : '';
  }).join('');

  const confidence =
    visual.confidence === 'low' ? 'Approximate data' :
    visual.confidence === 'medium' ? 'Extracted data' : '';

  if (!cites && !confidence && !visual.footnote) return '';

  return `
    <div class="visual-footer">
      ${cites ? `<span class="visual-cites">${cites}</span>` : ''}
      ${confidence ? `<span class="visual-note">${escapeHtml(confidence)}</span>` : ''}
      ${visual.footnote ? `<span class="visual-note">${escapeHtml(visual.footnote)}</span>` : ''}
    </div>
  `;
};

const renderLineChart = (visual: Extract<ReportVisual, { type: 'line_chart' }>): string => {
  const { series, unit } = visual.data;
  if (!series?.length || !series[0].points?.length) return '';

  const W = 560;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const allY = series.flatMap(s => s.points.map(p => p.y));
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const rangeY = maxY - minY || 1;

  const xLabels = series[0].points.map(p => p.x);
  const scaleX = (i: number) => PAD.left + (i / Math.max(xLabels.length - 1, 1)) * plotW;
  const scaleY = (v: number) => PAD.top + plotH - ((v - minY) / rangeY) * plotH;

  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const y = PAD.top + (i / 3) * plotH;
    const val = maxY - (i / 3) * rangeY;
    return { y, label: formatNumber(val, 1) };
  });

  const labelIndexes = xLabels.length <= 3
    ? xLabels.map((_, i) => i)
    : [0, Math.floor((xLabels.length - 1) / 2), xLabels.length - 1];

  const lines = series.map((s, si) => {
    const color = getColor(si, s.color);
    const pts = s.points.map((p, i) => ({ x: scaleX(i), y: scaleY(p.y) }));
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `
      <g>
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="white" stroke="${color}" stroke-width="2" />`).join('')}
      </g>
    `;
  }).join('');

  const legend = series.length > 1 ? `
    <div class="chart-legend">
      ${series.map((s, i) => `
        <span class="legend-item"><span class="legend-dot" style="background:${getColor(i, s.color)}"></span>${escapeHtml(s.name)}</span>
      `).join('')}
    </div>
  ` : '';

  return `
    <div class="chart">
      <svg width="100%" viewBox="0 0 ${W} ${H}">
        ${gridLines.map(g => `
          <g>
            <line x1="${PAD.left}" y1="${g.y}" x2="${W - PAD.right}" y2="${g.y}" stroke="#e2e8f0" stroke-width="1" />
            <text x="${PAD.left - 8}" y="${g.y + 4}" text-anchor="end" fill="#94a3b8" font-size="10">${g.label}</text>
          </g>
        `).join('')}
        ${labelIndexes.map(i => `
          <text x="${scaleX(i)}" y="${H - 8}" text-anchor="middle" fill="#94a3b8" font-size="10">${escapeHtml(xLabels[i] || '')}</text>
        `).join('')}
        ${lines}
      </svg>
      ${legend}
      ${unit ? `<div class="chart-unit">${escapeHtml(unit)}</div>` : ''}
    </div>
  `;
};

const renderBarChart = (visual: Extract<ReportVisual, { type: 'bar_chart' }>): string => {
  const { categories, series, unit, horizontal } = visual.data;
  if (!categories?.length || !series?.length) return '';

  if (horizontal) {
    const maxVal = Math.max(...series.flatMap(s => s.values), 1);
    return `
      <div class="chart">
        ${categories.map((cat, ci) => `
          <div class="bar-row">
            <div class="bar-row-head">
              <span class="bar-label">${escapeHtml(cat)}</span>
              <span class="bar-value">${formatNumber(series[0]?.values[ci] || 0, 1)}${unit ? ` ${escapeHtml(unit)}` : ''}</span>
            </div>
            <div class="bar-track">
              ${series.map((s, si) => `
                <span class="bar-fill" style="width:${((s.values[ci] || 0) / maxVal) * 100}%; background:${getColor(si, s.color)}"></span>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const W = 560;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 50, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...series.flatMap(s => s.values), 1);
  const groupW = plotW / categories.length;
  const barW = Math.min(groupW * 0.6 / series.length, 40);
  const groupOffset = (groupW - barW * series.length) / 2;

  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const y = PAD.top + (i / 3) * plotH;
    const val = maxVal - (i / 3) * maxVal;
    return { y, label: formatNumber(val, 0) };
  });

  return `
    <div class="chart">
      <svg width="100%" viewBox="0 0 ${W} ${H}">
        ${gridLines.map(g => `
          <g>
            <line x1="${PAD.left}" y1="${g.y}" x2="${W - PAD.right}" y2="${g.y}" stroke="#e2e8f0" stroke-width="1" />
            <text x="${PAD.left - 8}" y="${g.y + 4}" text-anchor="end" fill="#94a3b8" font-size="10">${g.label}</text>
          </g>
        `).join('')}
        ${categories.map((cat, ci) => `
          <g>
            ${series.map((s, si) => {
              const val = s.values[ci] || 0;
              const barH = (val / maxVal) * plotH;
              const x = PAD.left + ci * groupW + groupOffset + si * barW;
              const y = PAD.top + plotH - barH;
              return `<rect x="${x}" y="${y}" width="${barW - 2}" height="${barH}" rx="2" fill="${getColor(si, s.color)}" />`;
            }).join('')}
            <text x="${PAD.left + ci * groupW + groupW / 2}" y="${H - 10}" text-anchor="middle" fill="#94a3b8" font-size="10">${escapeHtml(cat)}</text>
          </g>
        `).join('')}
      </svg>
      ${unit ? `<div class="chart-unit">${escapeHtml(unit)}</div>` : ''}
    </div>
  `;
};

const renderPieChart = (visual: Extract<ReportVisual, { type: 'pie_chart' }>): string => {
  const { slices, unit } = visual.data;
  if (!slices?.length) return '';

  const total = slices.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const rings = slices.map((slice, i) => {
    const frac = (slice.value || 0) / total;
    const dash = frac * circumference;
    const ring = `
      <circle
        r="${radius}"
        cx="80"
        cy="80"
        fill="transparent"
        stroke="${getColor(i, slice.color)}"
        stroke-width="18"
        stroke-dasharray="${dash} ${circumference - dash}"
        stroke-dashoffset="-${offset}"
      />
    `;
    offset += dash;
    return ring;
  }).join('');

  const legend = `
    <div class="chart-legend">
      ${slices.map((s, i) => `
        <span class="legend-item">
          <span class="legend-dot" style="background:${getColor(i, s.color)}"></span>
          ${escapeHtml(s.label)} ${unit ? `(${formatNumber(s.value, 1)}${escapeHtml(unit)})` : `(${formatNumber(s.value, 1)})`}
        </span>
      `).join('')}
    </div>
  `;

  return `
    <div class="chart chart-pie">
      <svg width="160" height="160" viewBox="0 0 160 160">
        ${rings}
      </svg>
      ${legend}
    </div>
  `;
};

const renderTable = (visual: Extract<ReportVisual, { type: 'table' }>): string => {
  const { headers, rows, columnAlignments } = visual.data;
  if (!headers?.length || !rows?.length) return '';

  return `
    <div class="chart">
      <table class="visual-table">
        <thead>
          <tr>
            ${headers.map((h, i) => `<th style="text-align:${columnAlignments?.[i] || 'left'}">${escapeHtml(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, ri) => `
            <tr class="${ri % 2 === 1 ? 'alt' : ''}">
              ${row.map((cell, ci) => `<td style="text-align:${columnAlignments?.[ci] || 'left'}">${escapeHtml(String(cell))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

const renderMetric = (visual: Extract<ReportVisual, { type: 'metric' }>): string => {
  const metrics = visual.data.metrics || [];
  if (!metrics.length) return '';

  return `
    <div class="chart">
      <div class="metric-grid" style="grid-template-columns: repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr));">
        ${metrics.map(m => `
          <div class="metric-cell">
            <div class="metric-value">${escapeHtml(String(m.value))}${m.trendValue ? ` <span class="metric-change">${escapeHtml(m.trendValue)}</span>` : ''}</div>
            <div class="metric-label">${escapeHtml(m.label)}</div>
            ${m.subLabel ? `<div class="metric-sub">${escapeHtml(m.subLabel)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

export const renderReportVisualToHtml = (
  visual: ReportVisual,
  citationMap: Map<string, number>
): string => {
  let body = '';

  switch (visual.type) {
    case 'line_chart':
      body = renderLineChart(visual);
      break;
    case 'bar_chart':
      body = renderBarChart(visual);
      break;
    case 'pie_chart':
      body = renderPieChart(visual);
      break;
    case 'table':
      body = renderTable(visual);
      break;
    case 'metric':
      body = renderMetric(visual);
      break;
    default:
      body = '';
  }

  if (!body) return '';

  return `
    <div class="report-visual">
      <div class="visual-title">${escapeHtml(visual.title)}</div>
      ${body}
      ${renderVisualFooter(visual, citationMap)}
    </div>
  `;
};

