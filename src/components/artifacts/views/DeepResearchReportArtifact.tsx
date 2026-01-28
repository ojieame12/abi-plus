// Deep Research Report — Editorial Document Layout
// Clean prose-first reading experience with proper heading hierarchy,
// generous whitespace, and no decorative chrome.

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Download, Share2, ExternalLink, ChevronLeft } from 'lucide-react';
import type {
  DeepResearchReport,
  ReportSection,
  ReportCitation,
  TocEntry,
} from '../../../types/deepResearch';
import type { CitationMap, Citation } from '../../../types/hybridResponse';
import type { WebSource, InternalSource } from '../../../types/aiResponse';
import { CitedParagraph } from '../../chat/CitedContent';
import { ReportVisualRenderer } from './ReportVisualRenderer';

// ============================================
// TYPES
// ============================================

interface DeepResearchReportArtifactProps {
  jobId: string;
  report: DeepResearchReport;
  onDownloadPdf?: () => void;
  onShare?: () => void;
  onClose?: () => void;
  onUpgradeReport?: () => void;
  onMessageAnalyst?: () => void;
}

// ============================================
// HELPERS
// ============================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const getStudyTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    sourcing_study: 'Sourcing Study',
    cost_model: 'Cost Model Analysis',
    market_analysis: 'Market Analysis',
    supplier_assessment: 'Supplier Assessment',
    risk_assessment: 'Risk Assessment',
    custom: 'Custom Research',
  };
  return labels[type] || 'Research Report';
};

const buildCitationMap = (
  citations: Record<string, ReportCitation> | undefined,
  allSources: { name?: string; url?: string; type?: string; snippet?: string }[]
): CitationMap => {
  const citationMap: CitationMap = {};

  if (citations) {
    for (const [id, reportCitation] of Object.entries(citations)) {
      const source = reportCitation.source;
      const citationType =
        source.type === 'beroe' || source.type === 'internal_data' ? 'beroe' : 'web';
      citationMap[id] = {
        id,
        type: citationType,
        name: source.name || `Source ${id}`,
        snippet: source.snippet,
        url: source.url,
        category: source.type,
      };
    }
  } else if (allSources.length > 0) {
    let beroeCount = 0;
    let webCount = 0;
    for (const source of allSources) {
      const isBeroe = source.type === 'beroe' || source.type === 'internal_data';
      const id = isBeroe ? `B${++beroeCount}` : `W${++webCount}`;
      citationMap[id] = {
        id,
        type: isBeroe ? 'beroe' : 'web',
        name: source.name || `Source ${id}`,
        snippet: source.snippet,
        url: source.url,
        category: source.type,
      };
    }
  }

  return citationMap;
};

// ============================================
// TABLE OF CONTENTS — minimal sidebar
// ============================================

interface TocProps {
  entries: TocEntry[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  referencesCount: number;
  onReferencesClick: () => void;
}

const Toc = ({ entries, activeId, onNavigate, referencesCount, onReferencesClick }: TocProps) => (
  <nav className="space-y-0.5">
    {entries.map((entry) => {
      const isActive = activeId === entry.id;
      return (
        <button
          key={entry.id}
          onClick={() => onNavigate(entry.id)}
          className={`
            w-full text-left py-1.5 transition-colors text-[13px] leading-snug border-l-2
            ${entry.level === 0 ? 'pl-3' : entry.level === 1 ? 'pl-6' : 'pl-9'}
            ${
              isActive
                ? 'border-l-slate-900 text-slate-900'
                : 'border-l-transparent text-slate-400 hover:text-slate-600 hover:border-l-slate-200'
            }
          `}
        >
          {entry.title}
        </button>
      );
    })}
    {referencesCount > 0 && (
      <button
        onClick={onReferencesClick}
        className="w-full text-left py-1.5 pl-3 text-[13px] leading-snug border-l-2 border-l-transparent text-slate-400 hover:text-slate-600 hover:border-l-slate-200 mt-3"
      >
        References
      </button>
    )}
  </nav>
);

// ============================================
// ARTICLE SECTION — heading + flowing prose
// ============================================

interface ArticleSectionProps {
  section: ReportSection;
  citations: CitationMap;
  onSourceClick?: (citation: Citation | WebSource | InternalSource) => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

const ArticleSection = ({ section, citations, onSourceClick, sectionRef }: ArticleSectionProps) => {
  // Heading element based on level
  const Heading = section.level === 0 ? 'h2' : section.level === 1 ? 'h3' : 'h4';

  const headingClass =
    section.level === 0
      ? 'text-[20px] leading-[1.3] font-medium text-slate-900 mb-4 mt-10 first:mt-0 pb-2 border-b border-slate-200'
      : section.level === 1
      ? 'text-[16px] leading-[1.35] font-medium text-slate-800 mb-3 mt-8'
      : 'text-[15px] leading-[1.4] font-normal text-slate-700 mb-2 mt-6';

  // Split visuals by placement
  const beforeVisuals = (section.visuals || []).filter(v => v.placement === 'before_prose');
  const afterVisuals = (section.visuals || []).filter(v => v.placement !== 'before_prose');

  return (
    <div ref={sectionRef} id={`section-${section.id}`} className="scroll-mt-8 pb-8">
      <Heading className={headingClass}>{section.title}</Heading>

      {/* Visuals placed before prose */}
      {beforeVisuals.map(v => (
        <ReportVisualRenderer key={v.id} visual={v} citations={citations} />
      ))}

      {/* Section prose */}
      {section.content && (
        <div className="text-[15px] leading-[1.75] text-slate-600 tracking-[-0.01em]">
          <CitedParagraph
            content={section.content}
            citations={citations}
            onSourceClick={onSourceClick}
            block
          />
        </div>
      )}

      {/* Visuals placed after prose */}
      {afterVisuals.map(v => (
        <ReportVisualRenderer key={v.id} visual={v} citations={citations} />
      ))}

      {/* Child sections — rendered inline, no nesting boxes */}
      {section.children && section.children.length > 0 && (
        <div className="mt-6">
          {section.children.map((child) => (
            <div key={child.id} className="mt-5">
              <h4 className="text-[15px] leading-[1.4] font-normal text-slate-700 mb-2">
                {child.title}
              </h4>
              <div className="text-[15px] leading-[1.75] text-slate-600 tracking-[-0.01em]">
                <CitedParagraph
                  content={child.content}
                  citations={citations}
                  onSourceClick={onSourceClick}
                  block
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// REFERENCES — clean numbered list
// ============================================

interface ReferencesProps {
  references: ReportCitation[];
  highlightedId: string | null;
}

const References = ({ references, highlightedId }: ReferencesProps) => {
  if (!references || references.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-slate-150">
      <h2 className="text-[20px] leading-[1.3] font-medium text-slate-900 mb-6">References</h2>
      <ol className="space-y-3">
        {references.map((citation, index) => (
          <li
            key={citation.id}
            id={`ref-${citation.id}`}
            className={`
              flex items-baseline gap-3 py-1.5 transition-colors scroll-mt-8 rounded-md px-2 -mx-2
              ${highlightedId === citation.id ? 'bg-amber-50' : ''}
            `}
          >
            <span className="text-[13px] text-slate-400 tabular-nums flex-shrink-0 w-6 text-right">
              {index + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] text-slate-700">{citation.source.name}</span>
              {citation.source.url && (
                <a
                  href={citation.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-[13px] text-slate-400 hover:text-violet-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {citation.source.snippet && (
                <p className="text-[13px] text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                  {citation.source.snippet}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

// ============================================
// SCROLL SPY — track active section on scroll
// ============================================

const useScrollSpy = (
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>,
  sectionIds: string[]
) => {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] || null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveId(id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    for (const id of sectionIds) {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds, sectionRefs]);

  return activeId;
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DeepResearchReportArtifact = ({
  report,
  onDownloadPdf,
  onShare,
  onUpgradeReport,
  onMessageAnalyst,
}: DeepResearchReportArtifactProps) => {
  const [highlightedCitation, setHighlightedCitation] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const referencesRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const sectionIds = useMemo(() => report.sections.map((s) => s.id), [report.sections]);

  const activeSection = useScrollSpy(sectionRefs, sectionIds);

  const citationMap = useMemo(
    () => buildCitationMap(report.citations, report.allSources),
    [report.citations, report.allSources]
  );

  const navigateToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSourceClick = useCallback((citation: Citation | WebSource | InternalSource) => {
    const citationId = 'id' in citation ? citation.id : undefined;
    if (citationId) {
      setHighlightedCitation(citationId);
      const refEl = document.getElementById(`ref-${citationId}`);
      if (refEl) refEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedCitation(null), 2500);
    }
  }, []);

  const tableOfContents: TocEntry[] =
    report.tableOfContents ||
    report.sections.map((s) => ({ id: s.id, title: s.title, level: s.level }));

  const references = report.references || Object.values(report.citations || {});

  return (
    <div className="h-full flex bg-white">
      {/* ── Sidebar TOC ── */}
      {showToc && (
        <div className="w-56 flex-shrink-0 border-r border-slate-100 flex flex-col">
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Contents</p>
          </div>
          <div className="flex-1 overflow-auto px-3 py-4">
            <Toc
              entries={tableOfContents}
              activeId={activeSection}
              onNavigate={navigateToSection}
              referencesCount={references.length}
              onReferencesClick={() =>
                referencesRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            />
          </div>

          {/* Sidebar widget — Ask Analyst card */}
          <div className="flex-shrink-0 px-3 pb-4">
            <div className="rounded-2xl border border-slate-100/80 bg-slate-50 p-4">
              <div className="flex items-start justify-between mb-3">
                <img
                  src="/analyst-avatar.jpg"
                  alt="Dr. James Morrison"
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
              <p className="text-sm font-medium text-slate-900">Ask Analyst</p>
              <p className="text-[12px] text-slate-500 mt-0.5 mb-3">Dr. James Morrison</p>
              <button
                onClick={onMessageAnalyst}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-medium transition-colors"
              >
                Message Analyst
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main reading area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Top bar — minimal actions ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!showToc && (
              <button
                onClick={() => setShowToc(true)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {showToc && (
              <button
                onClick={() => setShowToc(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-[12px] text-slate-400">
              {getStudyTypeLabel(report.studyType)} · {report.allSources.length} sources · {formatTime(report.totalProcessingTime)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            {onDownloadPdf && (
              <button
                onClick={onDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable document ── */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          <div className="max-w-[680px] mx-auto px-8 py-10">
            {/* ── Title block ── */}
            <header className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[13px] text-slate-400">
                  {getStudyTypeLabel(report.studyType)}
                </p>
                {report.reportNumber && (
                  <>
                    <span className="text-[13px] text-slate-300">·</span>
                    <p className="text-[13px] text-slate-400 font-mono">
                      {report.reportNumber}
                    </p>
                  </>
                )}
              </div>
              <h1 className="text-[28px] leading-[1.2] font-medium text-slate-900 tracking-[-0.02em]">
                {report.title}
              </h1>
              {report.subtitle && (
                <p className="text-[16px] leading-[1.5] text-slate-500 mt-2 tracking-[-0.01em]">
                  {report.subtitle}
                </p>
              )}
              <p className="text-[14px] text-slate-400 mt-3">
                {formatDate(report.generatedAt)}
                {report.metadata?.customer && ` · ${report.metadata.customer}`}
                {report.metadata?.region && ` · ${report.metadata.region}`}
              </p>
            </header>

            {/* ── Key finding callout ── */}
            {report.keyFinding && (
              <div className="mb-10 rounded-lg border border-violet-100 bg-violet-50/50 px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-violet-500 mb-1.5 font-medium">
                  Key Finding
                </p>
                <p className="text-[15px] leading-[1.6] text-slate-700">
                  {report.keyFinding}
                </p>
              </div>
            )}

            {/* ── Executive summary ── */}
            {report.summary && (
              <div className="mb-12 pb-8 border-b border-slate-100">
                <h2 className="text-[20px] leading-[1.3] font-medium text-slate-900 mb-4">
                  Executive Summary
                </h2>
                <div className="text-[15px] leading-[1.85] text-slate-600 tracking-[-0.01em]">
                  <CitedParagraph
                    content={report.summary}
                    citations={citationMap}
                    onSourceClick={handleSourceClick}
                    block
                  />
                </div>
              </div>
            )}

            {/* ── Sections — flowing prose ── */}
            <div>
              {report.sections.map((section) => (
                <ArticleSection
                  key={section.id}
                  section={section}
                  citations={citationMap}
                  onSourceClick={handleSourceClick}
                  sectionRef={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                />
              ))}
            </div>

            {/* ── References ── */}
            <div ref={referencesRef}>
              <References references={references} highlightedId={highlightedCitation} />
            </div>

            {/* ── Upgrade Report card ── */}
            <div className="mt-12 rounded-2xl border border-slate-100/80 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                    <img src="/Container.svg" alt="" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Upgrade Report</p>
                    <p className="text-[12px] text-slate-500">Decision Grade Market Analysis</p>
                  </div>
                </div>
                <button
                  onClick={onUpgradeReport}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white text-[13px] font-medium transition-all"
                >
                  Request Upgrade
                </button>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="mt-16 pt-6 border-t border-slate-100 pb-12">
              <p className="text-[12px] text-slate-400 leading-relaxed">
                This report was generated from {report.allSources.length} sources in{' '}
                {formatTime(report.totalProcessingTime)}.
                {report.qualityMetrics &&
                  ` ${report.qualityMetrics.sectionsWithCitations} of ${report.qualityMetrics.totalSections} sections include citations.`}
              </p>
              <p className="text-[12px] text-slate-300 mt-1">
                Original query: {report.queryOriginal}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepResearchReportArtifact;
