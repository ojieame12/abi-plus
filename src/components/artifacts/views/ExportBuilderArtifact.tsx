// Export Builder Artifact
// Action panel for configuring and exporting reports

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Download,
  Calendar,
  Check,
  LayoutGrid,
  Table,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import {
  ArtifactSection,
  ArtifactFooter,
  FormGroup,
  TextInput,
  SelectInput,
  Checkbox,
} from '../primitives';

// ============================================
// TYPES
// ============================================

type ExportFormat = 'pdf' | 'xlsx' | 'csv' | 'png';
type ExportContext = 'supplier' | 'portfolio' | 'comparison';

interface ExportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  included: boolean;
}

interface ExportConfig {
  filename: string;
  format: ExportFormat;
  sections: ExportSection[];
  dateRange: 'all' | '30d' | '90d' | '1y';
  includeCharts: boolean;
  includeRawData: boolean;
}

export interface ExportBuilderArtifactProps {
  context?: ExportContext;
  entityName?: string;
  entityIds?: string[];
  onExport?: (config: ExportConfig) => void;
  onCancel?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const ExportBuilderArtifact = ({
  context = 'portfolio',
  entityName,
  entityIds = [],
  onExport,
  onCancel,
}: ExportBuilderArtifactProps) => {
  const getDefaultSections = (): ExportSection[] => {
    const baseSections = [
      {
        id: 'summary',
        label: 'Executive Summary',
        description: 'Overview and key metrics',
        icon: <LayoutGrid size={16} />,
        included: true,
      },
      {
        id: 'risk_scores',
        label: 'Risk Scores',
        description: 'Current scores and levels',
        icon: <PieChart size={16} />,
        included: true,
      },
      {
        id: 'trends',
        label: 'Trend Analysis',
        description: 'Historical score changes',
        icon: <TrendingUp size={16} />,
        included: true,
      },
    ];

    if (context === 'supplier') {
      return [
        ...baseSections,
        {
          id: 'factors',
          label: 'Risk Factors',
          description: 'Detailed factor breakdown',
          icon: <Table size={16} />,
          included: true,
        },
        {
          id: 'events',
          label: 'Recent Events',
          description: 'News and alerts',
          icon: <Calendar size={16} />,
          included: false,
        },
      ];
    }

    if (context === 'portfolio') {
      return [
        ...baseSections,
        {
          id: 'distribution',
          label: 'Risk Distribution',
          description: 'Portfolio breakdown by risk level',
          icon: <PieChart size={16} />,
          included: true,
        },
        {
          id: 'supplier_list',
          label: 'Supplier List',
          description: 'Full supplier table',
          icon: <Table size={16} />,
          included: true,
        },
      ];
    }

    return baseSections;
  };

  const [config, setConfig] = useState<ExportConfig>({
    filename: entityName
      ? `${entityName.replace(/\s+/g, '_')}_Report`
      : `Risk_Report_${new Date().toISOString().split('T')[0]}`,
    format: 'pdf',
    sections: getDefaultSections(),
    dateRange: '90d',
    includeCharts: true,
    includeRawData: false,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    setExported(true);
    onExport?.(config);

    setTimeout(() => setExported(false), 2000);
  };

  const toggleSection = (sectionId: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, included: !s.included } : s
      ),
    });
  };

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      icon: <FileText size={20} className="text-rose-500" />,
      description: 'Best for sharing and printing',
    },
    {
      value: 'xlsx',
      label: 'Excel Spreadsheet',
      icon: <FileSpreadsheet size={20} className="text-emerald-500" />,
      description: 'Best for data analysis',
    },
    {
      value: 'csv',
      label: 'CSV File',
      icon: <FileText size={20} className="text-slate-500" />,
      description: 'Raw data format',
    },
    {
      value: 'png',
      label: 'Image (PNG)',
      icon: <FileImage size={20} className="text-blue-500" />,
      description: 'Visual snapshot',
    },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const contextLabels: Record<ExportContext, string> = {
    supplier: 'Supplier Report',
    portfolio: 'Portfolio Report',
    comparison: 'Comparison Report',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-6">
        {/* Context Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <FileText size={20} className="text-slate-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {contextLabels[context]}
            </p>
            <p className="text-xs text-slate-500">
              {entityName || `${entityIds.length || 'All'} suppliers`}
            </p>
          </div>
        </motion.div>

        {/* Filename */}
        <FormGroup label="Report Name" required>
          <TextInput
            value={config.filename}
            onChange={(e) => setConfig({ ...config, filename: e.target.value })}
            placeholder="Enter report name"
          />
        </FormGroup>

        {/* Format Selection */}
        <ArtifactSection title="Export Format" collapsible={false}>
          <div className="grid grid-cols-2 gap-2">
            {formatOptions.map((format) => (
              <button
                key={format.value}
                onClick={() => setConfig({ ...config, format: format.value as ExportFormat })}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                  ${config.format === format.value
                    ? 'border-violet-500 bg-violet-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <div className="shrink-0">{format.icon}</div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{format.label}</p>
                  <p className="text-[11px] text-slate-400">{format.description}</p>
                </div>
              </button>
            ))}
          </div>
        </ArtifactSection>

        {/* Sections to Include */}
        <ArtifactSection
          title="Include Sections"
          badge={config.sections.filter((s) => s.included).length}
        >
          <div className="space-y-2">
            {config.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                  ${section.included
                    ? 'border-violet-200 bg-violet-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                  }
                `}
              >
                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
                  ${section.included
                    ? 'bg-violet-600 border-violet-600'
                    : 'border-slate-300'
                  }
                `}>
                  {section.included && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400">{section.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{section.label}</p>
                    <p className="text-[11px] text-slate-400">{section.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ArtifactSection>

        {/* Date Range */}
        <ArtifactSection title="Data Range" collapsible={false}>
          <SelectInput
            value={config.dateRange}
            onChange={(e) => setConfig({ ...config, dateRange: e.target.value as ExportConfig['dateRange'] })}
            options={dateRangeOptions}
          />
        </ArtifactSection>

        {/* Additional Options */}
        <ArtifactSection title="Options" defaultOpen={false}>
          <div className="space-y-3">
            <Checkbox
              checked={config.includeCharts}
              onChange={(checked) => setConfig({ ...config, includeCharts: checked })}
              label="Include charts & visualizations"
              description="Embed visual representations of data"
            />
            <Checkbox
              checked={config.includeRawData}
              onChange={(checked) => setConfig({ ...config, includeRawData: checked })}
              label="Include raw data tables"
              description="Append detailed data tables at the end"
            />
          </div>
        </ArtifactSection>
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: exported ? 'Downloaded!' : `Export as ${config.format.toUpperCase()}`,
          variant: 'primary',
          onClick: handleExport,
          loading: isExporting,
          icon: exported ? <Check size={16} /> : <Download size={16} />,
        }}
        secondaryAction={{
          id: 'cancel',
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => onCancel?.(),
        }}
      />
    </div>
  );
};

export default ExportBuilderArtifact;
