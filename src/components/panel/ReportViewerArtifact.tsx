// ReportViewerArtifact - View Beroe research reports in the sidebar
// Supports PDF embed, rich text sections, and external links

import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  User,
  ExternalLink,
  Download,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

// ============================================
// TYPES
// ============================================

interface ReportSection {
  title: string;
  content: string;
}

interface ReportData {
  id: string;
  title: string;
  category: string;
  publishedDate: string;
  author?: string;
  summary?: string;
  url?: string;
  pdfUrl?: string;
  sections?: ReportSection[];
}

interface ReportViewerArtifactProps {
  report: ReportData;
  queryContext?: {
    queryText?: string;
    highlightTerms?: string[];
  };
}

// ============================================
// HELPER COMPONENTS
// ============================================

const SectionAccordion = ({
  section,
  index,
  highlightTerms,
}: {
  section: ReportSection;
  index: number;
  highlightTerms?: string[];
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);

  // Highlight matching terms in content
  const highlightContent = (text: string) => {
    if (!highlightTerms || highlightTerms.length === 0) return text;

    let result = text;
    highlightTerms.forEach((term) => {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, '<mark class="bg-yellow-100 text-yellow-900 px-0.5 rounded">$1</mark>');
    });
    return result;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-slate-200/60 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">{section.title}</span>
        {isOpen ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-3 bg-white"
        >
          <div
            className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: highlightContent(section.content) }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ReportViewerArtifact = ({
  report,
  queryContext,
}: ReportViewerArtifactProps) => {
  const [showPdf, setShowPdf] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/60">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-100 rounded-xl">
            <FileText size={24} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-violet-600 uppercase tracking-wider">
              {report.category}
            </span>
            <h2 className="text-lg font-medium text-slate-900 mt-1 leading-tight">
              {report.title}
            </h2>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formatDate(report.publishedDate)}</span>
              </div>
              {report.author && (
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{report.author}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {report.pdfUrl && (
            <button
              onClick={() => setShowPdf(!showPdf)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPdf
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen size={16} />
              {showPdf ? 'Hide PDF' : 'View PDF'}
            </button>
          )}

          {report.url && (
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink size={16} />
              Open Full Report
            </a>
          )}

          {report.pdfUrl && (
            <a
              href={report.pdfUrl}
              download
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* PDF Viewer */}
        {showPdf && report.pdfUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 400 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-xl overflow-hidden border border-slate-200/60"
          >
            <iframe
              src={report.pdfUrl}
              className="w-full h-[400px]"
              title={report.title}
            />
          </motion.div>
        )}

        {/* Summary */}
        {report.summary && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Executive Summary</h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {report.summary}
            </p>
          </div>
        )}

        {/* Sections */}
        {report.sections && report.sections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Report Sections</h3>
            {report.sections.map((section, index) => (
              <SectionAccordion
                key={index}
                section={section}
                index={index}
                highlightTerms={queryContext?.highlightTerms}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!report.summary && (!report.sections || report.sections.length === 0) && !report.pdfUrl && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              Report content not available for preview.
            </p>
            {report.url && (
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 mt-2"
              >
                Open full report <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Query context footer */}
      {queryContext?.queryText && (
        <div className="px-6 py-3 border-t border-slate-200/60 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            <span className="font-medium">Found via:</span> "{queryContext.queryText}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportViewerArtifact;
