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
// BEROE LOGO ICON
// ============================================

const BeroeLogo = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 30 30"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M14.7842 3.63885e-09C16.5464 -5.77794e-05 18.3322 0.688064 19.8955 1.58105C21.4965 2.4956 23.0674 3.74115 24.4473 5.12109C25.8271 6.50101 27.0728 8.0719 27.9873 9.67285C28.8801 11.236 29.5682 13.0214 29.5684 14.7832C29.5684 16.5453 28.8802 18.3312 27.9873 19.8945C27.0728 21.4955 25.8271 23.0664 24.4473 24.4463C23.0674 25.8262 21.4964 27.0717 19.8955 27.9863C18.3322 28.8793 16.5463 29.5682 14.7842 29.5684C13.137 29.5684 11.4186 28.9537 9.84961 28.085C8.2456 27.1968 6.62186 25.9461 5.12207 24.4463C3.62215 22.9464 2.37146 21.3218 1.4834 19.7178C0.614911 18.149 0.000331958 16.4317 0 14.7852C5.82123e-05 13.0229 0.687979 11.2363 1.58105 9.67285C2.49564 8.07181 3.74112 6.50107 5.12109 5.12109C6.50107 3.74112 8.07181 2.49564 9.67285 1.58105C11.2362 0.688014 13.022 0.00011151 14.7842 3.63885e-09ZM14.6484 3.62793C13.0746 3.6279 11.4687 3.81266 10.0342 4.2041C8.63338 4.58636 7.22272 5.21279 6.21777 6.21777C5.21286 7.22276 4.58637 8.63332 4.2041 10.0342C3.81266 11.4687 3.62796 13.0746 3.62793 14.6484C3.62793 16.2224 3.81262 17.829 4.2041 19.2637C4.56245 20.5768 5.13519 21.8986 6.0332 22.8867L6.21777 23.0801C7.15699 24.019 8.48688 24.6485 9.87695 25.0479C11.2982 25.4562 12.9377 25.6689 14.6484 25.6689C16.3591 25.6689 17.9987 25.4561 19.4199 25.0479C20.8099 24.6485 22.1398 24.0194 23.0791 23.0801C24.084 22.0751 24.7105 20.6645 25.0928 19.2637C25.4843 17.829 25.6689 16.2224 25.6689 14.6484C25.6689 13.0746 25.4842 11.4687 25.0928 10.0342C24.7105 8.63339 24.084 7.22268 23.0791 6.21777C22.0742 5.21295 20.6635 4.58637 19.2627 4.2041C17.8282 3.81264 16.2223 3.62796 14.6484 3.62793Z" />
  </svg>
);

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
            <BeroeLogo className="w-6 h-6 text-violet-600" />
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
            <BeroeLogo className="w-12 h-12 mx-auto text-slate-300 mb-3" />
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
