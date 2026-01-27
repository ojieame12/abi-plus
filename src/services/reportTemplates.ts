// Report Templates - Blueprints for structured report generation
// Each template defines the exact structure, required sections, and citation rules
// OPTIMIZED: Flat structure with ~8 sections to minimize API calls

export interface ReportSectionTemplate {
  id: string;
  title: string;
  required: boolean;
  minCitations: number;
  description: string;
  promptHints: string[];
  children?: ReportSectionTemplate[]; // Keep for backwards compatibility but don't use
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSectionTemplate[];
  minTotalCitations: number;
  requiredSourceTypes: ('beroe' | 'web' | 'internal')[];
}

// ============================================
// MARKET ANALYSIS TEMPLATE (8 sections)
// ============================================
export const MARKET_ANALYSIS_TEMPLATE: ReportTemplate = {
  id: 'market_analysis',
  name: 'Market Analysis Report',
  description: 'Comprehensive market intelligence report covering market dynamics, supplier landscape, and strategic recommendations',
  minTotalCitations: 15,
  requiredSourceTypes: ['web'],
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      minCitations: 2,
      description: 'High-level overview of key findings, market conditions, and strategic recommendations',
      promptHints: [
        'Start with market size and growth trajectory',
        'Highlight key supply-demand dynamics',
        'Summarize cost escalation trends',
        'Include 3-5 actionable recommendations for procurement leaders',
        'Use specific numbers and percentages',
        'Keep to 2-3 paragraphs'
      ]
    },
    {
      id: 'introduction',
      title: 'Introduction',
      required: true,
      minCitations: 1,
      description: 'Context setting and report scope',
      promptHints: [
        'Explain the importance of the market/category',
        'Define the scope (regions, timeframe)',
        'State the target audience and objectives',
        'Keep concise - 1-2 paragraphs'
      ]
    },
    {
      id: 'market_overview',
      title: 'Market Overview and Outlook',
      required: true,
      minCitations: 4,
      description: 'Comprehensive market analysis including size, trends, supply-demand dynamics, costs, and forecasts',
      promptHints: [
        'Include specific market size figures and CAGR',
        'Cover supply-demand dynamics and capacity constraints',
        'Analyze cost escalation trends by category (labor, materials, energy)',
        'Provide forward-looking projections for 2024-2026',
        'Compare regional differences where applicable',
        'Use tables for comparative data',
        'This is a comprehensive section - cover all market fundamentals'
      ]
    },
    {
      id: 'supplier_landscape',
      title: 'Supplier Landscape and Risk Profiles',
      required: true,
      minCitations: 3,
      description: 'Analysis of major suppliers, their capabilities, financial health, and risk profiles',
      promptHints: [
        'Name specific major suppliers by region',
        'Include financial health indicators where available',
        'Assess certifications and capabilities',
        'Cover operational, financial, and compliance risks',
        'Note supplier concentration risks',
        'Include a summary table of key suppliers'
      ]
    },
    {
      id: 'contracting_strategies',
      title: 'Contracting and Pricing Strategies',
      required: true,
      minCitations: 2,
      description: 'Analysis of contracting models, optimal strategies, and risk allocation',
      promptHints: [
        'Describe common contracting models (EPC, EPCM, Alliance, etc.)',
        'Recommend optimal strategies for different project types',
        'Analyze risk allocation by contract model',
        'Include escalation mechanisms and pricing trends',
        'Note regional variations in contracting practices'
      ]
    },
    {
      id: 'emerging_risks',
      title: 'Emerging Risks and Mitigation Strategies',
      required: true,
      minCitations: 3,
      description: 'Forward-looking risk analysis covering regulatory, environmental, and economic risks with mitigation recommendations',
      promptHints: [
        'Cover regulatory and compliance risks',
        'Address environmental and climate risks',
        'Analyze economic risks (inflation, currency, trade)',
        'Provide specific mitigation strategies for each risk category',
        'Include case examples where available'
      ]
    },
    {
      id: 'recommendations',
      title: 'Strategic Recommendations',
      required: true,
      minCitations: 1,
      description: 'Actionable recommendations for procurement teams',
      promptHints: [
        'Provide 5-7 specific, actionable recommendations',
        'Use bullet points for clarity',
        'Align recommendations with identified risks and opportunities',
        'Include both strategic and tactical recommendations',
        'Prioritize by impact and urgency'
      ]
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      required: true,
      minCitations: 0,
      description: 'Summary and call to action',
      promptHints: [
        'Synthesize key themes in 2-3 sentences',
        'Reinforce the most critical actions',
        'Provide forward-looking perspective',
        'Keep brief and impactful'
      ]
    }
  ]
};

// ============================================
// SOURCING STUDY TEMPLATE (7 sections)
// ============================================
export const SOURCING_STUDY_TEMPLATE: ReportTemplate = {
  id: 'sourcing_study',
  name: 'Sourcing Study Report',
  description: 'Strategic sourcing analysis covering supplier evaluation, cost analysis, and sourcing recommendations',
  minTotalCitations: 12,
  requiredSourceTypes: ['web'],
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      minCitations: 2,
      description: 'Overview of sourcing landscape and key recommendations',
      promptHints: [
        'Summarize current sourcing landscape',
        'Highlight key supplier options',
        'Include cost and risk considerations',
        'Provide clear sourcing recommendations'
      ]
    },
    {
      id: 'introduction',
      title: 'Introduction and Scope',
      required: true,
      minCitations: 1,
      description: 'Define the sourcing need and study parameters',
      promptHints: [
        'Define the category/commodity being sourced',
        'Specify volume/value requirements',
        'Outline evaluation criteria'
      ]
    },
    {
      id: 'market_landscape',
      title: 'Market Landscape',
      required: true,
      minCitations: 3,
      description: 'Overview of the supply market including structure, pricing, and trends',
      promptHints: [
        'Map the supplier ecosystem',
        'Identify market concentration',
        'Cover pricing trends and cost drivers',
        'Note regional supply bases'
      ]
    },
    {
      id: 'supplier_analysis',
      title: 'Supplier Analysis',
      required: true,
      minCitations: 3,
      description: 'Detailed evaluation and comparison of potential suppliers',
      promptHints: [
        'Provide detailed profiles of shortlisted suppliers',
        'Evaluate against defined criteria',
        'Compare capabilities, capacities, and financial stability',
        'Include comparison tables'
      ]
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment',
      required: true,
      minCitations: 2,
      description: 'Sourcing risks and mitigation strategies',
      promptHints: [
        'Identify supply risks',
        'Assess supplier-specific risks',
        'Propose mitigation strategies'
      ]
    },
    {
      id: 'sourcing_strategy',
      title: 'Recommended Sourcing Strategy',
      required: true,
      minCitations: 1,
      description: 'Strategic sourcing recommendations and implementation roadmap',
      promptHints: [
        'Recommend supplier selection',
        'Propose sourcing model (single/dual/multi)',
        'Outline negotiation approach',
        'Include implementation roadmap'
      ]
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      required: true,
      minCitations: 0,
      description: 'Summary and next steps',
      promptHints: [
        'Summarize key recommendations',
        'Define next steps',
        'Note critical success factors'
      ]
    }
  ]
};

// ============================================
// RISK ASSESSMENT TEMPLATE (7 sections)
// ============================================
export const RISK_ASSESSMENT_TEMPLATE: ReportTemplate = {
  id: 'risk_assessment',
  name: 'Risk Assessment Report',
  description: 'Comprehensive risk analysis covering supply chain, supplier, and market risks',
  minTotalCitations: 10,
  requiredSourceTypes: ['web'],
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      minCitations: 2,
      description: 'Overview of key risks and mitigation priorities',
      promptHints: [
        'Summarize critical risks',
        'Highlight risk ratings',
        'Prioritize mitigation actions'
      ]
    },
    {
      id: 'introduction',
      title: 'Introduction',
      required: true,
      minCitations: 1,
      description: 'Scope and methodology of risk assessment',
      promptHints: [
        'Define assessment scope',
        'Explain methodology',
        'Note data sources'
      ]
    },
    {
      id: 'risk_landscape',
      title: 'Risk Landscape Overview',
      required: true,
      minCitations: 2,
      description: 'High-level view of the risk environment including supply chain, supplier, and market risks',
      promptHints: [
        'Categorize risk types',
        'Cover supply chain vulnerabilities',
        'Address supplier-specific risks',
        'Include external/market risks',
        'Assess overall risk level'
      ]
    },
    {
      id: 'detailed_risk_analysis',
      title: 'Detailed Risk Analysis',
      required: true,
      minCitations: 3,
      description: 'In-depth analysis of key risk categories',
      promptHints: [
        'Analyze geographic concentration risks',
        'Cover financial stability risks',
        'Address regulatory and compliance risks',
        'Include economic and geopolitical risks',
        'Assess environmental and climate risks'
      ]
    },
    {
      id: 'risk_matrix',
      title: 'Risk Matrix and Prioritization',
      required: true,
      minCitations: 0,
      description: 'Risk ranking and prioritization framework',
      promptHints: [
        'Create impact/likelihood assessment',
        'Rank risks by priority',
        'Identify critical risks requiring immediate attention',
        'Use a table format'
      ]
    },
    {
      id: 'mitigation_strategies',
      title: 'Mitigation Strategies',
      required: true,
      minCitations: 2,
      description: 'Recommended risk mitigation actions',
      promptHints: [
        'Map mitigations to specific risks',
        'Prioritize by impact',
        'Include implementation guidance',
        'Note monitoring requirements'
      ]
    },
    {
      id: 'conclusion',
      title: 'Conclusion and Monitoring Plan',
      required: true,
      minCitations: 0,
      description: 'Summary and ongoing monitoring recommendations',
      promptHints: [
        'Summarize critical actions',
        'Define monitoring cadence',
        'Note trigger points for escalation'
      ]
    }
  ]
};

// ============================================
// SUPPLIER ASSESSMENT TEMPLATE (7 sections)
// ============================================
export const SUPPLIER_ASSESSMENT_TEMPLATE: ReportTemplate = {
  id: 'supplier_assessment',
  name: 'Supplier Assessment Report',
  description: 'In-depth analysis of a specific supplier or group of suppliers',
  minTotalCitations: 8,
  requiredSourceTypes: ['web'],
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      minCitations: 2,
      description: 'Overview of supplier assessment findings and recommendation',
      promptHints: [
        'Summarize overall assessment',
        'Highlight key strengths and weaknesses',
        'Provide clear recommendation'
      ]
    },
    {
      id: 'introduction',
      title: 'Introduction',
      required: true,
      minCitations: 1,
      description: 'Assessment scope, criteria, and methodology',
      promptHints: [
        'Define supplier(s) being assessed',
        'Outline evaluation criteria',
        'Note data sources'
      ]
    },
    {
      id: 'company_overview',
      title: 'Company Overview',
      required: true,
      minCitations: 2,
      description: 'Background on the supplier including history, scope, and footprint',
      promptHints: [
        'Company history and ownership',
        'Business scope and scale',
        'Geographic footprint',
        'Key products/services'
      ]
    },
    {
      id: 'capabilities_capacity',
      title: 'Capabilities and Capacity',
      required: true,
      minCitations: 2,
      description: 'Assessment of supplier technical capabilities, capacity, and certifications',
      promptHints: [
        'Technical capabilities',
        'Production capacity',
        'Quality certifications',
        'Innovation and R&D',
        'Track record and references'
      ]
    },
    {
      id: 'financial_analysis',
      title: 'Financial Analysis',
      required: true,
      minCitations: 1,
      description: 'Financial health assessment including revenue, profitability, and stability',
      promptHints: [
        'Revenue and profitability trends',
        'Balance sheet strength',
        'Credit ratings if available',
        'Financial risk indicators'
      ]
    },
    {
      id: 'risk_profile',
      title: 'Risk Profile',
      required: true,
      minCitations: 1,
      description: 'Supplier-specific risks across operational, financial, and compliance dimensions',
      promptHints: [
        'Operational risks',
        'Financial risks',
        'Compliance and regulatory risks',
        'Reputational risks'
      ]
    },
    {
      id: 'recommendation',
      title: 'Assessment Conclusion and Recommendation',
      required: true,
      minCitations: 0,
      description: 'Final assessment rating and recommendation',
      promptHints: [
        'Provide overall rating/score',
        'Summarize key strengths and weaknesses',
        'Make clear recommendation (approve/conditional/reject)',
        'Note conditions or caveats'
      ]
    }
  ]
};

// ============================================
// COST MODEL TEMPLATE (7 sections)
// ============================================
export const COST_MODEL_TEMPLATE: ReportTemplate = {
  id: 'cost_model',
  name: 'Cost Model Analysis',
  description: 'Detailed cost breakdown and modeling for procurement planning',
  minTotalCitations: 10,
  requiredSourceTypes: ['web'],
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      minCitations: 2,
      description: 'Overview of cost structure, key drivers, and optimization opportunities',
      promptHints: [
        'Summarize total cost of ownership',
        'Highlight key cost drivers',
        'Note cost reduction opportunities'
      ]
    },
    {
      id: 'introduction',
      title: 'Introduction and Scope',
      required: true,
      minCitations: 1,
      description: 'Define the cost model scope, assumptions, and methodology',
      promptHints: [
        'Define product/service being modeled',
        'Specify key assumptions',
        'Note methodology and data sources'
      ]
    },
    {
      id: 'cost_structure',
      title: 'Cost Structure Analysis',
      required: true,
      minCitations: 3,
      description: 'Comprehensive breakdown of all cost components including direct and indirect costs',
      promptHints: [
        'Break down direct costs (materials, labor, energy)',
        'Include indirect costs and overheads',
        'Show percentage breakdown',
        'Use tables for clarity',
        'Compare to industry benchmarks'
      ]
    },
    {
      id: 'cost_drivers',
      title: 'Key Cost Drivers',
      required: true,
      minCitations: 2,
      description: 'Analysis of primary factors driving costs and their volatility',
      promptHints: [
        'Identify and rank primary cost drivers',
        'Quantify impact of each driver',
        'Note volatility and risk factors',
        'Include market price trends'
      ]
    },
    {
      id: 'benchmarking',
      title: 'Cost Benchmarking',
      required: true,
      minCitations: 2,
      description: 'Comparison to market benchmarks and competitors',
      promptHints: [
        'Compare to industry benchmarks',
        'Note regional variations',
        'Identify gaps and opportunities',
        'Include should-cost analysis'
      ]
    },
    {
      id: 'projections_optimization',
      title: 'Cost Projections and Optimization',
      required: true,
      minCitations: 1,
      description: 'Forward-looking cost forecasts and optimization recommendations',
      promptHints: [
        'Project costs over 2-3 years',
        'Include scenarios (base, optimistic, pessimistic)',
        'Identify savings opportunities',
        'Quantify potential cost reductions',
        'Prioritize optimization actions'
      ]
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      required: true,
      minCitations: 0,
      description: 'Summary of should-cost and negotiation leverage points',
      promptHints: [
        'Summarize should-cost estimate',
        'Note key negotiation leverage points',
        'Recommend next steps'
      ]
    }
  ]
};

// ============================================
// TEMPLATE REGISTRY
// ============================================
export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  market_analysis: MARKET_ANALYSIS_TEMPLATE,
  sourcing_study: SOURCING_STUDY_TEMPLATE,
  risk_assessment: RISK_ASSESSMENT_TEMPLATE,
  supplier_assessment: SUPPLIER_ASSESSMENT_TEMPLATE,
  cost_model: COST_MODEL_TEMPLATE,
  custom: MARKET_ANALYSIS_TEMPLATE, // Default to market analysis for custom
};

// Helper to get template by study type
export const getReportTemplate = (studyType: string): ReportTemplate => {
  return REPORT_TEMPLATES[studyType] || MARKET_ANALYSIS_TEMPLATE;
};

// Flatten template sections for iteration (no children now, but keep for compatibility)
export const flattenSections = (template: ReportTemplate): ReportSectionTemplate[] => {
  const flatten = (sections: ReportSectionTemplate[]): ReportSectionTemplate[] => {
    return sections.reduce((acc, section) => {
      acc.push(section);
      if (section.children) {
        acc.push(...flatten(section.children));
      }
      return acc;
    }, [] as ReportSectionTemplate[]);
  };
  return flatten(template.sections);
};

// Generate table of contents from template
export const generateTableOfContents = (
  template: ReportTemplate
): { id: string; title: string; level: number }[] => {
  const toc: { id: string; title: string; level: number }[] = [];

  const addToToc = (sections: ReportSectionTemplate[], level: number) => {
    for (const section of sections) {
      toc.push({ id: section.id, title: section.title, level });
      if (section.children) {
        addToToc(section.children, level + 1);
      }
    }
  };

  addToToc(template.sections, 0);
  return toc;
};

// Validate section has minimum citations
export const validateSectionCitations = (
  sectionId: string,
  content: string,
  template: ReportTemplate
): { valid: boolean; found: number; required: number } => {
  const sections = flattenSections(template);
  const section = sections.find(s => s.id === sectionId);

  if (!section) {
    return { valid: true, found: 0, required: 0 };
  }

  // Count citations in content (matches [1], [2], [B1], [W1], etc.)
  const citationMatches = content.match(/\[\d+\]|\[[BW]\d+\]/g) || [];
  const found = new Set(citationMatches).size; // Unique citations

  return {
    valid: found >= section.minCitations,
    found,
    required: section.minCitations
  };
};
