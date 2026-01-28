// Deep Research Intake Engine
// Two-layer system: deterministic slot logic + optional LLM enhancement
// Generates dynamic, context-aware clarifying questions

import type { ChatMessage } from '../types/chat';
import type {
  StudyType,
  ClarifyingQuestion,
  IntakeState,
  QuestionInputType,
} from '../types/deepResearch';
import { MOCK_MANAGED_CATEGORIES } from './mockCategories';
import { MOCK_SUPPLIERS } from './mockData';

// ============================================
// TYPES
// ============================================

/** Extracted context from chat history + query */
export interface IntakeContext {
  query: string;
  studyType: StudyType;
  chatSummary: string;
  recentUserMessages: string[];
  extractedEntities: {
    category?: string;
    commodity?: string;
    region?: string[];
    timeframe?: string;
    suppliers?: string[];
  };
  portfolio: {
    categories: string[];
    suppliers: { name: string; region: string }[];
    regions: string[];
  };
  managedCategories: string[];
}

/** A slot represents a required piece of information for a study type */
type SlotId = 'category' | 'region' | 'timeframe' | 'suppliers' | 'risk_focus'
  | 'cost_drivers' | 'budget' | 'assessment_criteria' | 'supplier_scope' | 'study_type'
  | 'analysis_depth' | 'focus_areas' | 'output_format' | 'competitor_scope'
  | 'price_factors' | 'sustainability_focus';

interface SlotDefinition {
  id: SlotId;
  required: boolean;
  label: string;
  /** Which entity field(s) can fill this slot */
  filledBy: (ctx: IntakeContext) => string | string[] | undefined;
}

interface SlotResult {
  slot: SlotDefinition;
  value?: string | string[];
  filled: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/** Question with prefill metadata */
export interface DynamicQuestion extends ClarifyingQuestion {
  prefilledFrom?: string; // e.g., "chat history", "portfolio data"
  prefillConfidence?: 'high' | 'medium';
}

/** Result of the intake generation */
export interface DynamicIntakeResult {
  questions: DynamicQuestion[];
  prefilledAnswers: Record<string, string | string[]>;
  canSkip: boolean;
  skipReason?: string;
}

// ============================================
// LAYER 1: CONTEXT BUILDING
// ============================================

/**
 * Build an IntakeContext from the query, chat history, and available data.
 * Normalizes all known information into a single context object.
 */
export function buildIntakeContext(
  query: string,
  studyType: StudyType,
  conversationHistory: ChatMessage[]
): IntakeContext {
  // Extract recent user messages (last 5)
  const recentUserMessages = conversationHistory
    .filter(m => m.role === 'user')
    .slice(-5)
    .map(m => m.content);

  // Build chat summary from recent messages
  const chatSummary = recentUserMessages.length > 0
    ? recentUserMessages.join(' | ')
    : '';

  // Extract entities from query + recent messages
  const allText = [query, ...recentUserMessages].join(' ');
  const extractedEntities = extractEntitiesFromText(allText);

  // Get portfolio data
  const portfolio = getPortfolioContext();

  // Get managed categories
  const managedCategories = MOCK_MANAGED_CATEGORIES.map(c => c.name);

  return {
    query,
    studyType,
    chatSummary,
    recentUserMessages,
    extractedEntities,
    portfolio,
    managedCategories,
  };
}

/**
 * Extract entities from combined text (query + chat history)
 */
function extractEntitiesFromText(text: string): IntakeContext['extractedEntities'] {
  const entities: IntakeContext['extractedEntities'] = {};
  const lower = text.toLowerCase();

  const normalizePhrase = (phrase: string) =>
    phrase
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const phraseToRegex = (phrase: string) => {
    const escaped = phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const spaced = escaped.replace(/\s+/g, '[\\s-]+');
    return new RegExp(`\\b${spaced}\\b`, 'i');
  };

  const matchesPhrase = (phrase: string) => {
    const normalized = normalizePhrase(phrase);
    if (!normalized) return false;
    return phraseToRegex(normalized).test(text);
  };

  // Extract commodity/category
  const knownCommodities = [
    'lithium carbonate', 'lithium', 'corrugated boxes', 'corrugated', 'steel',
    'aluminum', 'aluminium', 'copper', 'plastics', 'rubber', 'paper',
    'pulp', 'resins', 'silicones', 'natural gas', 'oil', 'packaging',
    'freight', 'zinc', 'nickel', 'cobalt', 'rare earth', 'polyethylene',
    'polypropylene', 'pvc', 'titanium', 'tin', 'lead', 'palladium',
    'platinum', 'gold', 'silver', 'iron ore', 'coal', 'lumber', 'cotton',
    'crude oil', 'gasoline', 'diesel', 'ethanol', 'stainless steel',
    'hdpe', 'ldpe', 'pet', 'nylon', 'abs',
  ];

  // Also check managed category names
  const categoryNames = MOCK_MANAGED_CATEGORIES.map(c => c.name.toLowerCase());

  // Check managed categories first (more specific) — store ID as category value to match option values
  for (const catName of categoryNames) {
    if (matchesPhrase(catName)) {
      const cat = MOCK_MANAGED_CATEGORIES.find(c => c.name.toLowerCase() === catName);
      if (cat) {
        entities.category = cat.id; // Store ID so it matches question option values
        entities.commodity = cat.name; // Store display name for context text
        break;
      }
    }
  }

  // Fall back to known commodities — use the name as both since no matching managed category
  if (!entities.commodity) {
    for (const commodity of knownCommodities) {
      if (matchesPhrase(commodity)) {
        const displayName = commodity.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        entities.commodity = displayName;
        // Try to find a matching managed category for the ID
        const matchedCat = MOCK_MANAGED_CATEGORIES.find(c =>
          c.name.toLowerCase().includes(commodity) || commodity.includes(c.name.toLowerCase())
        );
        entities.category = matchedCat ? matchedCat.id : displayName;
        break;
      }
    }
  }

  // Extract regions — store the option VALUE codes (na, eu, apac, etc.) so they match the question options
  const regionPatterns: Array<{ label: string; value: string; pattern: RegExp }> = [
    { label: 'North America', value: 'na', pattern: /\b(north\s+america|usa|united\s+states|canada|mexico|us\s+market)\b/i },
    { label: 'Europe', value: 'eu', pattern: /\b(europe|european|eu\b|uk\b|germany|france|western\s+europe)\b/i },
    { label: 'Asia Pacific', value: 'apac', pattern: /\b(asia|apac|china|japan|india|singapore|asia\s+pacific)\b/i },
    { label: 'Latin America', value: 'latam', pattern: /\b(latin\s+america|south\s+america|brazil|latam)\b/i },
    { label: 'Middle East & Africa', value: 'mea', pattern: /\b(middle\s+east|africa|mea|gulf|saudi)\b/i },
    { label: 'Global', value: 'global', pattern: /\b(global|worldwide|international)\b/i },
  ];

  const foundRegions: string[] = [];
  for (const region of regionPatterns) {
    if (region.pattern.test(text)) {
      foundRegions.push(region.value);
    }
  }
  if (foundRegions.length > 0) {
    entities.region = foundRegions;
  }

  // Extract timeframe
  const timeframePatterns: Array<[RegExp, string]> = [
    [/\b(this quarter|current quarter|q[1-4]\s*20\d{2})\b/i, '6m'],
    [/\b(last\s+(?:6|six)\s+months|past\s+(?:6|six)\s+months)\b/i, '6m'],
    [/\b(this year|last year|past year|last\s+12\s+months|annual)\b/i, '12m'],
    [/\b(last\s+(?:2|two)\s+years|past\s+(?:2|two)\s+years)\b/i, '2y'],
    [/\b(last\s+(?:5|five)\s+years|past\s+(?:5|five)\s+years|long.?term)\b/i, '5y'],
    [/\b(recent|latest|current|now)\b/i, '12m'],
  ];

  for (const [pattern, value] of timeframePatterns) {
    if (pattern.test(text)) {
      entities.timeframe = value;
      break;
    }
  }

  // Extract supplier names from known suppliers
  const knownSupplierNames = MOCK_SUPPLIERS.map(s => s.name.toLowerCase());
  const foundSuppliers: string[] = [];
  for (const supplier of MOCK_SUPPLIERS) {
    if (lower.includes(supplier.name.toLowerCase())) {
      foundSuppliers.push(supplier.name);
    }
  }
  if (foundSuppliers.length > 0) {
    entities.suppliers = foundSuppliers;
  }

  return entities;
}

/**
 * Get portfolio context from available data
 */
function getPortfolioContext(): IntakeContext['portfolio'] {
  // Extract unique regions from suppliers
  const regions = [...new Set(MOCK_SUPPLIERS.map(s => s.location?.region).filter(Boolean))] as string[];

  return {
    categories: MOCK_MANAGED_CATEGORIES.slice(0, 20).map(c => c.name),
    suppliers: MOCK_SUPPLIERS.slice(0, 20).map(s => ({
      name: s.name,
      region: s.location?.region || 'Unknown',
    })),
    regions: regions.length > 0 ? regions : ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Global'],
  };
}

// ============================================
// LAYER 1: SLOT DEFINITIONS
// ============================================

/** Required slots by study type */
const STUDY_SLOTS: Record<StudyType, SlotDefinition[]> = {
  market_analysis: [
    {
      id: 'category', required: true, label: 'Category/Commodity',
      filledBy: ctx => ctx.extractedEntities.category || ctx.extractedEntities.commodity,
    },
    {
      id: 'region', required: true, label: 'Region',
      filledBy: ctx => ctx.extractedEntities.region,
    },
    {
      id: 'timeframe', required: true, label: 'Timeframe',
      filledBy: ctx => ctx.extractedEntities.timeframe,
    },
    {
      id: 'focus_areas', required: false, label: 'Focus Areas',
      filledBy: () => undefined,
    },
    {
      id: 'analysis_depth', required: false, label: 'Analysis Depth',
      filledBy: () => undefined,
    },
    {
      id: 'competitor_scope', required: false, label: 'Competitor Scope',
      filledBy: () => undefined,
    },
  ],
  sourcing_study: [
    {
      id: 'category', required: true, label: 'Category/Commodity',
      filledBy: ctx => ctx.extractedEntities.category || ctx.extractedEntities.commodity,
    },
    {
      id: 'region', required: true, label: 'Region',
      filledBy: ctx => ctx.extractedEntities.region,
    },
    {
      id: 'timeframe', required: true, label: 'Timeframe',
      filledBy: ctx => ctx.extractedEntities.timeframe,
    },
    {
      id: 'supplier_scope', required: false, label: 'Supplier Scope',
      filledBy: ctx => ctx.extractedEntities.suppliers,
    },
    {
      id: 'budget', required: false, label: 'Annual Spend',
      filledBy: () => undefined,
    },
    {
      id: 'focus_areas', required: false, label: 'Sourcing Priorities',
      filledBy: () => undefined,
    },
  ],
  cost_model: [
    {
      id: 'category', required: true, label: 'Category/Commodity',
      filledBy: ctx => ctx.extractedEntities.category || ctx.extractedEntities.commodity,
    },
    {
      id: 'region', required: true, label: 'Region',
      filledBy: ctx => ctx.extractedEntities.region,
    },
    {
      id: 'timeframe', required: true, label: 'Timeframe',
      filledBy: ctx => ctx.extractedEntities.timeframe,
    },
    {
      id: 'cost_drivers', required: true, label: 'Cost Drivers',
      filledBy: () => undefined,
    },
    {
      id: 'analysis_depth', required: false, label: 'Analysis Depth',
      filledBy: () => undefined,
    },
  ],
  supplier_assessment: [
    {
      id: 'suppliers', required: true, label: 'Supplier(s)',
      filledBy: ctx => ctx.extractedEntities.suppliers,
    },
    {
      id: 'region', required: true, label: 'Region',
      filledBy: ctx => ctx.extractedEntities.region,
    },
    {
      id: 'timeframe', required: false, label: 'Timeframe',
      filledBy: ctx => ctx.extractedEntities.timeframe,
    },
    {
      id: 'assessment_criteria', required: true, label: 'Assessment Criteria',
      filledBy: () => undefined,
    },
    {
      id: 'sustainability_focus', required: false, label: 'Sustainability Focus',
      filledBy: () => undefined,
    },
  ],
  risk_assessment: [
    {
      id: 'category', required: true, label: 'Category/Commodity',
      filledBy: ctx => ctx.extractedEntities.category || ctx.extractedEntities.commodity,
    },
    {
      id: 'region', required: true, label: 'Region',
      filledBy: ctx => ctx.extractedEntities.region,
    },
    {
      id: 'timeframe', required: true, label: 'Timeframe',
      filledBy: ctx => ctx.extractedEntities.timeframe,
    },
    {
      id: 'risk_focus', required: true, label: 'Risk Focus',
      filledBy: () => undefined,
    },
    {
      id: 'sustainability_focus', required: false, label: 'ESG & Sustainability',
      filledBy: () => undefined,
    },
  ],
  custom: [
    {
      id: 'category', required: false, label: 'Category/Commodity',
      filledBy: ctx => ctx.extractedEntities.category || ctx.extractedEntities.commodity,
    },
    {
      id: 'region', required: true, label: 'Region',
      filledBy: ctx => ctx.extractedEntities.region,
    },
    {
      id: 'timeframe', required: true, label: 'Timeframe',
      filledBy: ctx => ctx.extractedEntities.timeframe,
    },
    {
      id: 'focus_areas', required: false, label: 'Focus Areas',
      filledBy: () => undefined,
    },
  ],
};

/**
 * Compute which slots are filled and which are missing
 */
function computeSlotResults(context: IntakeContext): SlotResult[] {
  const slots = STUDY_SLOTS[context.studyType] || STUDY_SLOTS.custom;

  return slots.map(slot => {
    const value = slot.filledBy(context);
    const filled = value !== undefined && value !== null &&
      (Array.isArray(value) ? value.length > 0 : String(value).trim().length > 0);

    // Determine confidence based on how the slot was filled
    let confidence: SlotResult['confidence'] = 'low';
    if (filled) {
      // If entity was found in the query itself (not just chat history), higher confidence
      const queryOnly = extractEntitiesFromText(context.query);
      const queryValue = slot.filledBy({ ...context, extractedEntities: queryOnly });
      if (queryValue !== undefined && queryValue !== null) {
        confidence = 'high';
      } else {
        confidence = 'medium'; // Found in chat history
      }
    }

    return { slot, value: filled ? value : undefined, filled, confidence };
  });
}

// ============================================
// OPTIONAL SLOT RELEVANCE
// ============================================

const OPTIONAL_SLOT_KEYWORDS: Partial<Record<SlotId, string[]>> = {
  focus_areas: ['focus', 'priority', 'priorities', 'drivers', 'trend', 'forecast', 'pricing', 'supply', 'demand', 'innovation', 'regulatory'],
  analysis_depth: ['deep', 'detailed', 'comprehensive', 'in-depth', 'full', 'dive'],
  competitor_scope: ['competitor', 'competitive', 'market share', 'players', 'rivals'],
  supplier_scope: ['supplier', 'suppliers', 'vendor', 'vendors', 'manufacturer'],
  price_factors: ['price', 'pricing', 'cost', 'costs', 'trend', 'forecast', 'inflation'],
  sustainability_focus: ['sustainability', 'esg', 'carbon', 'emissions', 'ethical', 'green'],
  budget: ['budget', 'spend', 'annual spend', 'cost target'],
  output_format: ['report', 'summary', 'deck', 'slides', 'presentation', 'pdf'],
  cost_drivers: ['cost', 'cost drivers', 'should-cost', 'raw materials', 'energy', 'labor', 'logistics'],
  risk_focus: ['risk', 'disruption', 'volatility', 'geopolitical', 'compliance', 'regulatory'],
};

const STUDY_SLOT_WEIGHTS: Partial<Record<StudyType, Partial<Record<SlotId, number>>>> = {
  market_analysis: { focus_areas: 2, competitor_scope: 1, analysis_depth: 1 },
  sourcing_study: { supplier_scope: 2, focus_areas: 1, analysis_depth: 1 },
  cost_model: { cost_drivers: 2, analysis_depth: 1 },
  supplier_assessment: { assessment_criteria: 2, sustainability_focus: 1 },
  risk_assessment: { risk_focus: 2, sustainability_focus: 1 },
};

function getSlotRelevanceScore(slotId: SlotId, context: IntakeContext): number {
  const text = `${context.query} ${context.chatSummary}`.toLowerCase();
  const keywords = OPTIONAL_SLOT_KEYWORDS[slotId] || [];
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 1;
  }
  const weight = STUDY_SLOT_WEIGHTS[context.studyType]?.[slotId] ?? 0;
  return score + weight;
}

// ============================================
// LAYER 1: QUESTION GENERATION
// ============================================

/**
 * Build a dynamic question for a slot, using context for options
 */
function buildQuestionForSlot(slotId: SlotId, context: IntakeContext): DynamicQuestion {
  const prioritizeOptions = (
    options: Array<{ label: string; value: string }>,
    preferredValues?: string[]
  ) => {
    if (!preferredValues || preferredValues.length === 0) return options;
    const preferred = new Set(preferredValues);
    return [...options].sort((a, b) => {
      const aPref = preferred.has(a.value);
      const bPref = preferred.has(b.value);
      if (aPref && !bPref) return -1;
      if (!aPref && bPref) return 1;
      return 0;
    });
  };

  switch (slotId) {
    case 'category': {
      // Use managed categories as options, prioritize popular ones
      const popularCategories = MOCK_MANAGED_CATEGORIES
        .filter(c => c.isPopular)
        .slice(0, 8)
        .map(c => ({ label: c.name, value: c.id }));

      const otherCategories = MOCK_MANAGED_CATEGORIES
        .filter(c => !c.isPopular)
        .slice(0, 12)
        .map(c => ({ label: c.name, value: c.id }));

      return {
        id: 'category',
        question: 'What category or commodity should we research?',
        type: 'category_picker' as QuestionInputType,
        options: [...popularCategories, ...otherCategories],
        required: true,
        placeholder: 'Search categories...',
        helpText: context.chatSummary
          ? 'We couldn\'t detect a specific category from your conversation.'
          : 'Select the procurement category to analyze.',
      };
    }

    case 'region': {
      // Build region options from portfolio + standard regions
      const standardRegions = [
        { label: 'Global', value: 'global' },
        { label: 'North America', value: 'na' },
        { label: 'Europe', value: 'eu' },
        { label: 'Asia Pacific', value: 'apac' },
        { label: 'Latin America', value: 'latam' },
        { label: 'Middle East & Africa', value: 'mea' },
      ];

      return {
        id: 'region',
        question: 'Which regions should we focus on?',
        type: 'multiselect' as QuestionInputType,
        options: prioritizeOptions(standardRegions, context.extractedEntities.region),
        required: true,
        defaultValue: ['global'],
        helpText: 'Select one or more regions for the analysis.',
      };
    }

    case 'timeframe': {
      const commodity = context.extractedEntities.commodity;
      const questionText = commodity
        ? `What timeframe would be most relevant for analyzing ${commodity}?`
        : 'What timeframe should the analysis cover?';
      const helpText = commodity
        ? `This helps us capture relevant historical data for ${commodity}.`
        : 'Select the time period for the analysis.';

      const timeframeOptions = [
        { label: 'Last 6 months', value: '6m' },
        { label: 'Last 12 months', value: '12m' },
        { label: 'Last 2 years', value: '2y' },
        { label: 'Last 5 years', value: '5y' },
      ];
      const preferredTimeframe = context.extractedEntities.timeframe ? [context.extractedEntities.timeframe] : undefined;

      return {
        id: 'timeframe',
        question: questionText,
        type: 'select' as QuestionInputType,
        options: prioritizeOptions(timeframeOptions, preferredTimeframe),
        required: true,
        defaultValue: context.extractedEntities.timeframe || '12m',
        helpText,
      };
    }

    case 'suppliers': {
      // Top suppliers from portfolio
      const supplierOptions = context.portfolio.suppliers
        .slice(0, 10)
        .map(s => ({ label: `${s.name} (${s.region})`, value: s.name }));

      return {
        id: 'suppliers',
        question: 'Which supplier(s) should we assess?',
        type: 'multiselect' as QuestionInputType,
        options: supplierOptions.length > 0 ? supplierOptions : [
          { label: 'Enter supplier name', value: 'custom' },
        ],
        required: true,
        helpText: 'Select from your portfolio or type a supplier name.',
      };
    }

    case 'risk_focus': {
      return {
        id: 'risk_focus',
        question: 'Which risk categories should we prioritize?',
        type: 'multiselect' as QuestionInputType,
        options: [
          { label: 'Supply chain disruption', value: 'supply_chain' },
          { label: 'Price volatility', value: 'price' },
          { label: 'Geopolitical risk', value: 'geopolitical' },
          { label: 'Regulatory/compliance', value: 'regulatory' },
          { label: 'ESG/sustainability', value: 'esg' },
          { label: 'Financial stability', value: 'financial' },
        ],
        required: true,
        defaultValue: ['supply_chain', 'price'],
      };
    }

    case 'cost_drivers': {
      return {
        id: 'cost_drivers',
        question: 'Which cost drivers are most important to analyze?',
        type: 'multiselect' as QuestionInputType,
        options: [
          { label: 'Raw materials', value: 'raw_materials' },
          { label: 'Labor costs', value: 'labor' },
          { label: 'Energy costs', value: 'energy' },
          { label: 'Logistics', value: 'logistics' },
          { label: 'Packaging', value: 'packaging' },
          { label: 'Overhead', value: 'overhead' },
        ],
        required: true,
        defaultValue: ['raw_materials', 'labor'],
      };
    }

    case 'budget': {
      return {
        id: 'budget',
        question: 'What is your approximate annual spend in this category?',
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Under $1M', value: 'under_1m' },
          { label: '$1M - $10M', value: '1m_10m' },
          { label: '$10M - $50M', value: '10m_50m' },
          { label: 'Over $50M', value: 'over_50m' },
        ],
        required: false,
        helpText: 'This helps calibrate our analysis scope.',
      };
    }

    case 'assessment_criteria': {
      return {
        id: 'assessment_criteria',
        question: 'What criteria matter most for supplier evaluation?',
        type: 'multiselect' as QuestionInputType,
        options: [
          { label: 'Financial stability', value: 'financial' },
          { label: 'Quality certifications', value: 'quality' },
          { label: 'Sustainability / ESG', value: 'sustainability' },
          { label: 'Geographic coverage', value: 'geography' },
          { label: 'Innovation capability', value: 'innovation' },
          { label: 'Cost competitiveness', value: 'cost' },
        ],
        required: true,
        defaultValue: ['financial', 'quality'],
      };
    }

    case 'supplier_scope': {
      return {
        id: 'supplier_scope',
        question: 'How many suppliers should we evaluate?',
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Top 5 suppliers', value: 'top_5' },
          { label: 'Top 10 suppliers', value: 'top_10' },
          { label: 'All available suppliers', value: 'all' },
          { label: 'Specific suppliers only', value: 'specific' },
        ],
        required: false,
        defaultValue: 'top_5',
      };
    }

    case 'study_type': {
      return {
        id: 'study_type',
        question: 'What type of analysis would be most useful?',
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Market Analysis', value: 'market_analysis' },
          { label: 'Sourcing Study', value: 'sourcing_study' },
          { label: 'Cost Model', value: 'cost_model' },
          { label: 'Supplier Assessment', value: 'supplier_assessment' },
          { label: 'Risk Assessment', value: 'risk_assessment' },
        ],
        required: true,
        helpText: 'We\'ll tailor the research and report structure to your needs.',
      };
    }

    case 'focus_areas': {
      // Contextual options based on study type
      const focusOptions: Record<string, Array<{ label: string; value: string }>> = {
        market_analysis: [
          { label: 'Market size & growth', value: 'market_size' },
          { label: 'Key players & market share', value: 'key_players' },
          { label: 'Price trends & forecasts', value: 'price_trends' },
          { label: 'Supply-demand dynamics', value: 'supply_demand' },
          { label: 'Innovation & technology', value: 'innovation' },
          { label: 'Regulatory landscape', value: 'regulatory' },
        ],
        sourcing_study: [
          { label: 'Cost optimization', value: 'cost_optimization' },
          { label: 'Supplier diversification', value: 'diversification' },
          { label: 'Supply security', value: 'supply_security' },
          { label: 'Quality improvement', value: 'quality' },
          { label: 'Sustainability goals', value: 'sustainability' },
          { label: 'Lead time reduction', value: 'lead_time' },
        ],
        default: [
          { label: 'Cost & pricing', value: 'cost' },
          { label: 'Market trends', value: 'trends' },
          { label: 'Competitive landscape', value: 'competitive' },
          { label: 'Risk factors', value: 'risks' },
          { label: 'Innovation', value: 'innovation' },
        ],
      };

      return {
        id: 'focus_areas',
        question: `What aspects of ${context.extractedEntities.commodity || 'this category'} matter most for your research?`,
        type: 'multiselect' as QuestionInputType,
        options: focusOptions[context.studyType] || focusOptions.default,
        required: false,
        defaultValue: [],
        helpText: 'Select all that apply. This helps us prioritize the most relevant analysis.',
      };
    }

    case 'analysis_depth': {
      return {
        id: 'analysis_depth',
        question: 'How deep should the analysis go?',
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Executive overview (key highlights)', value: 'overview' },
          { label: 'Standard analysis (balanced depth)', value: 'standard' },
          { label: 'Deep dive (comprehensive detail)', value: 'deep_dive' },
        ],
        required: false,
        defaultValue: 'standard',
        helpText: 'Deeper analysis uses more sources and takes longer.',
      };
    }

    case 'competitor_scope': {
      return {
        id: 'competitor_scope',
        question: `How broad should the competitive landscape analysis be?`,
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Top 5 players only', value: 'top_5' },
          { label: 'Top 10 players', value: 'top_10' },
          { label: 'Full market landscape', value: 'full' },
          { label: 'Skip competitive analysis', value: 'skip' },
        ],
        required: false,
        defaultValue: 'top_10',
        helpText: 'We\'ll identify and analyze key competitors in this space.',
      };
    }

    case 'price_factors': {
      return {
        id: 'price_factors',
        question: 'Which pricing factors are most relevant?',
        type: 'multiselect' as QuestionInputType,
        options: [
          { label: 'Raw material costs', value: 'raw_materials' },
          { label: 'Energy & fuel costs', value: 'energy' },
          { label: 'Currency fluctuations', value: 'currency' },
          { label: 'Tariffs & trade policy', value: 'tariffs' },
          { label: 'Seasonal patterns', value: 'seasonal' },
          { label: 'Contract structures', value: 'contracts' },
        ],
        required: false,
        defaultValue: ['raw_materials', 'energy'],
      };
    }

    case 'sustainability_focus': {
      return {
        id: 'sustainability_focus',
        question: 'Should the research include ESG & sustainability analysis?',
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Yes, include detailed ESG analysis', value: 'detailed' },
          { label: 'Brief sustainability overview', value: 'brief' },
          { label: 'Not needed', value: 'skip' },
        ],
        required: false,
        defaultValue: 'brief',
        helpText: 'Covers carbon footprint, ethical sourcing, and regulatory compliance.',
      };
    }

    case 'output_format': {
      return {
        id: 'output_format',
        question: 'What output format do you prefer?',
        type: 'select' as QuestionInputType,
        options: [
          { label: 'Full report with charts', value: 'full_report' },
          { label: 'Executive summary only', value: 'executive' },
          { label: 'Data-focused with tables', value: 'data_focused' },
        ],
        required: false,
        defaultValue: 'full_report',
      };
    }
  }
}

// ============================================
// LAYER 1: MAIN GENERATOR
// ============================================

/**
 * Generate dynamic clarifying questions based on context.
 * Returns questions only for missing slots, with prefills for known ones.
 */
export function generateClarifyingQuestions(context: IntakeContext): DynamicIntakeResult {
  const slotResults = computeSlotResults(context);

  const requiredQuestions: DynamicQuestion[] = [];
  const optionalCandidates: Array<{ question: DynamicQuestion; score: number }> = [];
  const prefilledAnswers: Record<string, string | string[]> = {};

  for (const result of slotResults) {
    if (result.filled) {
      prefilledAnswers[result.slot.id] = result.value!;
    }

    // If required and confidently filled from the query, skip asking it to keep intake concise.
    if (result.slot.required && result.filled && result.confidence === 'high') {
      continue;
    }

    const question = buildQuestionForSlot(result.slot.id, context);

    if (result.filled && result.confidence === 'medium') {
      question.prefilledFrom = 'chat history';
      question.prefillConfidence = 'medium';
      question.defaultValue = result.value!;
      if (!question.helpText) {
        question.helpText = 'Detected from your conversation — please confirm.';
      }
    }

    if (result.slot.required) {
      requiredQuestions.push(question);
    } else {
      const score = getSlotRelevanceScore(result.slot.id, context);
      if (score > 0) {
        optionalCandidates.push({ question, score });
      }
    }
  }

  // Rank optional questions by relevance and cap to keep intake short
  const MAX_OPTIONAL_QUESTIONS = 2;
  optionalCandidates.sort((a, b) => b.score - a.score);
  const optionalQuestions = optionalCandidates.slice(0, MAX_OPTIONAL_QUESTIONS).map(c => c.question);

  // Determine if we can skip intake entirely
  const requiredSlots = slotResults.filter(r => r.slot.required);
  const filledRequiredSlots = requiredSlots.filter(r => r.filled);
  const missingRequired = requiredSlots.filter(r => !r.filled);
  const allRequiredFilled = missingRequired.length === 0;

  // If every required slot is confidently filled and no optional questions are relevant,
  // keep the intake minimal by not showing the prefilled required questions.
  const allRequiredHigh = requiredSlots.every(r => r.filled && r.confidence === 'high');
  const questions = allRequiredHigh && optionalQuestions.length === 0
    ? []
    : [...requiredQuestions, ...optionalQuestions];

  // Only ask questions that are actually missing (not prefilled)
  const unansweredRequired = questions.filter(q => {
    const slot = slotResults.find(r => r.slot.id === q.id);
    return slot?.slot.required && !slot?.filled;
  });

  const canSkip = allRequiredFilled || (
    missingRequired.length <= 1 &&
    filledRequiredSlots.length >= 2
  );

  const skipReason = allRequiredFilled
    ? `All required information detected from your ${context.recentUserMessages.length > 0 ? 'conversation' : 'query'}.`
    : canSkip && unansweredRequired.length <= 1
      ? 'Most required information was detected. You can skip to start with defaults.'
      : undefined;

  return {
    questions,
    prefilledAnswers,
    canSkip,
    skipReason,
  };
}

// ============================================
// LAYER 2: LLM-ENHANCED QUESTIONS (OPTIONAL)
// ============================================

// Gemini API constants (imported indirectly to avoid circular deps)
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const tryParseJsonLoose = (text: string): unknown | null => {
  // Strip markdown fences/backticks
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/`/g, '')
    .trim();

  // Find JSON start
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
  if (start >= 0) cleaned = cleaned.slice(start);

  // Find matching end brace/bracket
  const openChar = cleaned.startsWith('[') ? '[' : '{';
  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escape = false;
  let endIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === openChar) depth++;
    if (c === closeChar) {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  if (endIdx > 0) cleaned = cleaned.slice(0, endIdx + 1);

  const repaired = cleaned
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/'/g, '"');

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
};

/**
 * Enhance questions with LLM-generated phrasing and options.
 * Falls back to deterministic questions on any failure.
 */
export async function enhanceQuestionsWithLLM(
  context: IntakeContext,
  baseQuestions: DynamicQuestion[]
): Promise<DynamicQuestion[]> {
  if (!GEMINI_API_KEY || baseQuestions.length === 0) {
    return baseQuestions;
  }

  const prompt = `You are a procurement research assistant preparing clarifying questions for a deep research study.

CONTEXT:
- Query: ${context.query}
- Study Type: ${context.studyType}
- Chat Summary: ${context.chatSummary || 'No prior conversation'}
- Known Info: ${JSON.stringify(context.extractedEntities)}

CURRENT QUESTIONS TO ENHANCE:
${baseQuestions.map((q, i) => `${i + 1}. [${q.id}] ${q.question} (type: ${q.type}, options: ${q.options?.map(o => o.label).join(', ') || 'free text'})`).join('\n')}

For each question, suggest:
1. A better phrased question that references the user's specific context
2. Reordered options (most likely first) based on the query context
3. A brief "why we're asking" help text

Return JSON array:
[
  { "id": "question_id", "question": "improved question text", "helpText": "why we're asking", "topOptions": ["most_likely_value", "second_likely"] }
]

Rules:
- Keep question IDs exactly as given
- Only return questions that need improvement
- Keep questions concise (1 sentence)
- Help text should be 1 short sentence`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(GEMINI_API_URL + `?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1536,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                question: { type: 'STRING' },
                helpText: { type: 'STRING' },
                topOptions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['id'],
            },
          },
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[IntakeLLM] Gemini API error:', response.status);
      return baseQuestions;
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) return baseQuestions;

    let enhancements: Array<{ id: string; question?: string; helpText?: string; topOptions?: string[] }> = [];
    const parsed = tryParseJsonLoose(textContent);
    if (parsed) {
      if (Array.isArray(parsed)) {
        enhancements = parsed as Array<{ id: string; question?: string; helpText?: string; topOptions?: string[] }>;
      } else if (typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const maybeArray = obj.questions || obj.enhancements || obj.items;
        if (Array.isArray(maybeArray)) {
          enhancements = maybeArray as Array<{ id: string; question?: string; helpText?: string; topOptions?: string[] }>;
        }
      }
    }

    if (enhancements.length === 0) {
      console.warn('[IntakeLLM] Failed to parse response. Raw:', textContent.slice(0, 300));
      return baseQuestions;
    }

    // Apply enhancements to base questions
    return baseQuestions.map(q => {
      const enhancement = enhancements.find(e => e.id === q.id);
      if (!enhancement) return q;

      const enhanced = { ...q };

      if (enhancement.question && enhancement.question.length > 10) {
        enhanced.question = enhancement.question;
      }

      if (enhancement.helpText) {
        enhanced.helpText = enhancement.helpText;
      }

      // Reorder options if suggested
      if (enhancement.topOptions && enhanced.options) {
        const reordered = [...enhanced.options].sort((a, b) => {
          const aIdx = enhancement.topOptions!.indexOf(a.value);
          const bIdx = enhancement.topOptions!.indexOf(b.value);
          if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
          if (aIdx >= 0) return -1;
          if (bIdx >= 0) return 1;
          return 0;
        });
        enhanced.options = reordered;
      }

      return enhanced;
    });
  } catch (err) {
    console.warn('[IntakeLLM] Enhancement failed, using base questions:', err);
    return baseQuestions;
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Main entry point: Build context, generate questions, optionally enhance with LLM.
 * Returns a complete IntakeState ready for the UI.
 */
export async function generateDynamicIntake(
  query: string,
  studyType: StudyType,
  conversationHistory: ChatMessage[],
  options?: { useLLM?: boolean }
): Promise<IntakeState> {
  const context = buildIntakeContext(query, studyType, conversationHistory);
  const result = generateClarifyingQuestions(context);

  // Only call the LLM enhancer if there are ≥2 required questions without prefilled answers.
  // When most slots are already filled from conversation context, the 10s LLM round-trip
  // adds latency without meaningfully improving the questions.
  let finalQuestions = result.questions;
  if (options?.useLLM && result.questions.length > 0) {
    const unfilledRequired = result.questions.filter(
      q => q.required && !result.prefilledAnswers[q.id]
    );
    if (unfilledRequired.length >= 2) {
      finalQuestions = await enhanceQuestionsWithLLM(context, result.questions);
    } else {
      console.log('[Intake] Skipping LLM enhancement — only', unfilledRequired.length, 'unfilled required slots');
    }
  }

  return {
    questions: finalQuestions,
    prefilledAnswers: result.prefilledAnswers,
    canSkip: result.canSkip,
    skipReason: result.skipReason,
    estimatedCredits: getCreditsForStudy(studyType),
    estimatedTime: getEstimatedTime(studyType),
    studyType,
  };
}

// Helper: credits per study type
function getCreditsForStudy(studyType: StudyType): number {
  const map: Record<StudyType, number> = {
    sourcing_study: 750,
    cost_model: 600,
    market_analysis: 500,
    supplier_assessment: 400,
    risk_assessment: 450,
    custom: 500,
  };
  return map[studyType] || 500;
}

// Helper: estimated time per study type
function getEstimatedTime(studyType: StudyType): string {
  const map: Record<StudyType, string> = {
    sourcing_study: '8-12 minutes',
    cost_model: '6-10 minutes',
    market_analysis: '5-8 minutes',
    supplier_assessment: '4-7 minutes',
    risk_assessment: '5-8 minutes',
    custom: '5-10 minutes',
  };
  return map[studyType] || '5-10 minutes';
}
