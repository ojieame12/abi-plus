// Dynamic Suggestion Engine
// Generates contextual, data-driven follow-up suggestions

import type { Supplier, RiskLevel } from '../types/supplier';
import type { DetectedIntent, IntentCategory } from '../types/intents';
import type { Suggestion } from '../types/chat';

// ============================================
// TYPES
// ============================================

export interface SuggestionContext {
  // Current response data
  intent: DetectedIntent;
  suppliers?: Supplier[];
  portfolio?: {
    totalSuppliers: number;
    totalSpend: number;
    distribution: {
      high: number;
      mediumHigh: number;
      medium: number;
      low: number;
      unrated: number;
    };
  };
  riskChanges?: Array<{
    supplierName: string;
    direction: 'worsened' | 'improved';
    previousScore: number;
    currentScore: number;
  }>;

  // Conversation state
  conversationHistory: string[]; // Previous intent categories
  askedQuestions: Set<string>;   // Questions already asked
  viewedSuppliers: Set<string>;  // Suppliers already viewed

  // Response metadata
  resultCount: number;
  hasHandoff: boolean;
}

export interface SuggestionRule {
  id: string;
  condition: (ctx: SuggestionContext) => boolean;
  generate: (ctx: SuggestionContext) => Suggestion;
  priority: (ctx: SuggestionContext) => number; // Higher = more important
  appliesTo: IntentCategory[];
  cooldown?: number; // Don't suggest again for N turns
}

// ============================================
// SUGGESTION RULES
// ============================================

const SUGGESTION_RULES: SuggestionRule[] = [
  // ==========================================
  // PORTFOLIO OVERVIEW FOLLOW-UPS
  // ==========================================
  {
    id: 'high_risk_drilldown',
    appliesTo: ['portfolio_overview'],
    condition: (ctx) => (ctx.portfolio?.distribution.high ?? 0) > 0,
    generate: (ctx) => ({
      id: 'high_risk_drilldown',
      text: `Review your ${ctx.portfolio!.distribution.high} high-risk supplier${ctx.portfolio!.distribution.high > 1 ? 's' : ''}`,
      icon: 'alert',
    }),
    priority: (ctx) => {
      const highCount = ctx.portfolio?.distribution.high ?? 0;
      return highCount > 3 ? 100 : highCount > 0 ? 80 : 0;
    },
  },
  {
    id: 'unrated_inquiry',
    appliesTo: ['portfolio_overview'],
    condition: (ctx) => (ctx.portfolio?.distribution.unrated ?? 0) > 0,
    generate: (ctx) => ({
      id: 'unrated_inquiry',
      text: `Why are ${ctx.portfolio!.distribution.unrated} suppliers unrated?`,
      icon: 'lightbulb',
    }),
    priority: (ctx) => (ctx.portfolio?.distribution.unrated ?? 0) > 5 ? 60 : 40,
  },
  {
    id: 'risk_by_category',
    appliesTo: ['portfolio_overview'],
    condition: (ctx) => (ctx.portfolio?.totalSuppliers ?? 0) > 10,
    generate: () => ({
      id: 'risk_by_category',
      text: 'View risk breakdown by category',
      icon: 'chart',
    }),
    priority: () => 50,
  },
  {
    id: 'setup_alerts_after_overview',
    appliesTo: ['portfolio_overview'],
    condition: (ctx) => !ctx.askedQuestions.has('setup_config'),
    generate: () => ({
      id: 'setup_alerts',
      text: 'Set up risk change alerts',
      icon: 'alert',
    }),
    priority: () => 30,
  },

  // ==========================================
  // FILTERED DISCOVERY FOLLOW-UPS
  // ==========================================
  {
    id: 'compare_filtered',
    appliesTo: ['filtered_discovery'],
    condition: (ctx) => ctx.resultCount >= 2 && ctx.resultCount <= 5,
    generate: (ctx) => ({
      id: 'compare_filtered',
      text: `Compare these ${ctx.resultCount} suppliers`,
      icon: 'compare',
    }),
    priority: (ctx) => ctx.resultCount <= 4 ? 90 : 70,
  },
  {
    id: 'export_large_list',
    appliesTo: ['filtered_discovery'],
    condition: (ctx) => ctx.resultCount > 5,
    generate: (ctx) => ({
      id: 'export_list',
      text: `Export all ${ctx.resultCount} suppliers`,
      icon: 'document',
    }),
    priority: () => 60,
  },
  {
    id: 'find_alternatives_for_risky',
    appliesTo: ['filtered_discovery'],
    condition: (ctx) => {
      const hasHighRisk = ctx.suppliers?.some(s => s.srs?.level === 'high');
      return hasHighRisk ?? false;
    },
    generate: (ctx) => {
      const highestRisk = ctx.suppliers?.find(s => s.srs?.level === 'high');
      return {
        id: 'find_alternatives',
        text: highestRisk
          ? `Find alternatives for ${highestRisk.name}`
          : 'Find alternatives for high-risk suppliers',
        icon: 'search',
      };
    },
    priority: () => 85,
  },
  {
    id: 'focus_worsening',
    appliesTo: ['filtered_discovery'],
    condition: (ctx) => {
      const worseningCount = ctx.suppliers?.filter(s => s.srs?.trend === 'worsening').length ?? 0;
      return worseningCount > 0;
    },
    generate: (ctx) => {
      const worseningCount = ctx.suppliers?.filter(s => s.srs?.trend === 'worsening').length ?? 0;
      return {
        id: 'focus_worsening',
        text: `Focus on ${worseningCount} worsening supplier${worseningCount > 1 ? 's' : ''}`,
        icon: 'alert',
      };
    },
    priority: () => 95,
  },

  // ==========================================
  // SUPPLIER DEEP-DIVE FOLLOW-UPS
  // ==========================================
  {
    id: 'explain_score',
    appliesTo: ['supplier_deep_dive'],
    condition: (ctx) => {
      const supplier = ctx.suppliers?.[0];
      return supplier?.srs?.level === 'high' || supplier?.srs?.level === 'medium-high';
    },
    generate: (ctx) => {
      const supplier = ctx.suppliers![0];
      return {
        id: 'explain_score',
        text: `Why is ${supplier.name.split(' ')[0]} ${supplier.srs.level.replace('-', ' ')} risk?`,
        icon: 'lightbulb',
      };
    },
    priority: () => 90,
  },
  {
    id: 'find_supplier_alternatives',
    appliesTo: ['supplier_deep_dive'],
    condition: (ctx) => {
      const supplier = ctx.suppliers?.[0];
      return supplier?.srs?.level === 'high' || supplier?.srs?.trend === 'worsening';
    },
    generate: (ctx) => {
      const supplier = ctx.suppliers![0];
      return {
        id: 'find_supplier_alternatives',
        text: `Find alternatives to ${supplier.name.split(' ')[0]}`,
        icon: 'search',
      };
    },
    priority: (ctx) => ctx.suppliers?.[0]?.srs?.trend === 'worsening' ? 100 : 80,
  },
  {
    id: 'compare_with_peers',
    appliesTo: ['supplier_deep_dive'],
    condition: (ctx) => ctx.suppliers?.[0] != null,
    generate: (ctx) => {
      const supplier = ctx.suppliers![0];
      return {
        id: 'compare_with_peers',
        text: `Compare with other ${supplier.category} suppliers`,
        icon: 'compare',
      };
    },
    priority: () => 60,
  },
  {
    id: 'view_risk_history',
    appliesTo: ['supplier_deep_dive'],
    condition: (ctx) => ctx.suppliers?.[0] != null,
    generate: (ctx) => {
      const supplier = ctx.suppliers![0];
      return {
        id: 'view_risk_history',
        text: `View ${supplier.name.split(' ')[0]}'s risk history`,
        icon: 'chart',
      };
    },
    priority: () => 50,
  },

  // ==========================================
  // TREND DETECTION FOLLOW-UPS
  // ==========================================
  {
    id: 'view_worsened_suppliers',
    appliesTo: ['trend_detection'],
    condition: (ctx) => {
      const worsened = ctx.riskChanges?.filter(c => c.direction === 'worsened') ?? [];
      return worsened.length > 0;
    },
    generate: (ctx) => {
      const worsened = ctx.riskChanges?.filter(c => c.direction === 'worsened') ?? [];
      return {
        id: 'view_worsened',
        text: `Review ${worsened.length} supplier${worsened.length > 1 ? 's' : ''} with increased risk`,
        icon: 'alert',
      };
    },
    priority: () => 95,
  },
  {
    id: 'investigate_biggest_change',
    appliesTo: ['trend_detection'],
    condition: (ctx) => (ctx.riskChanges?.length ?? 0) > 0,
    generate: (ctx) => {
      const biggest = ctx.riskChanges!.reduce((max, c) =>
        Math.abs(c.currentScore - c.previousScore) > Math.abs(max.currentScore - max.previousScore) ? c : max
      );
      return {
        id: 'investigate_change',
        text: `Why did ${biggest.supplierName}'s score change?`,
        icon: 'lightbulb',
      };
    },
    priority: () => 85,
  },
  {
    id: 'setup_alerts_after_trends',
    appliesTo: ['trend_detection'],
    condition: (ctx) => !ctx.askedQuestions.has('setup_config'),
    generate: () => ({
      id: 'setup_alerts_trends',
      text: 'Set up alerts for future changes',
      icon: 'alert',
    }),
    priority: () => 70,
  },

  // ==========================================
  // COMPARISON FOLLOW-UPS
  // ==========================================
  {
    id: 'pick_safest',
    appliesTo: ['comparison'],
    condition: (ctx) => (ctx.suppliers?.length ?? 0) >= 2,
    generate: (ctx) => {
      const safest = ctx.suppliers!.reduce((min, s) =>
        (s.srs?.score ?? 100) < (min.srs?.score ?? 100) ? s : min
      );
      return {
        id: 'pick_safest',
        text: `Why is ${safest.name.split(' ')[0]} the safest option?`,
        icon: 'lightbulb',
      };
    },
    priority: () => 80,
  },
  {
    id: 'find_more_options',
    appliesTo: ['comparison'],
    condition: () => true,
    generate: () => ({
      id: 'find_more_options',
      text: 'Find more supplier options',
      icon: 'search',
    }),
    priority: () => 60,
  },
  {
    id: 'export_comparison',
    appliesTo: ['comparison'],
    condition: () => true,
    generate: () => ({
      id: 'export_comparison',
      text: 'Export this comparison',
      icon: 'document',
    }),
    priority: () => 40,
  },

  // ==========================================
  // ACTION TRIGGER FOLLOW-UPS
  // ==========================================
  {
    id: 'confirm_action',
    appliesTo: ['action_trigger'],
    condition: () => true,
    generate: () => ({
      id: 'confirm_action',
      text: 'Confirm and proceed',
      icon: 'document',
    }),
    priority: () => 90,
  },
  {
    id: 'refine_search',
    appliesTo: ['action_trigger'],
    condition: (ctx) => ctx.intent.subIntent === 'find_alternatives',
    generate: () => ({
      id: 'refine_search',
      text: 'Refine search criteria',
      icon: 'search',
    }),
    priority: () => 70,
  },

  // ==========================================
  // MARKET CONTEXT FOLLOW-UPS
  // ==========================================
  {
    id: 'show_affected_suppliers',
    appliesTo: ['market_context'],
    condition: () => true,
    generate: () => ({
      id: 'show_affected',
      text: 'Show my affected suppliers',
      icon: 'search',
    }),
    priority: () => 90,
  },
  {
    id: 'industry_risk_overview',
    appliesTo: ['market_context'],
    condition: () => true,
    generate: () => ({
      id: 'industry_overview',
      text: 'View industry risk overview',
      icon: 'chart',
    }),
    priority: () => 70,
  },

  // ==========================================
  // RESTRICTED/HANDOFF FOLLOW-UPS
  // ==========================================
  {
    id: 'find_alternatives_after_handoff',
    appliesTo: ['restricted_query'],
    condition: () => true,
    generate: () => ({
      id: 'alternatives_handoff',
      text: 'Find alternative suppliers instead',
      icon: 'search',
    }),
    priority: () => 80,
  },
  {
    id: 'compare_after_handoff',
    appliesTo: ['restricted_query'],
    condition: () => true,
    generate: () => ({
      id: 'compare_handoff',
      text: 'Compare with other suppliers',
      icon: 'compare',
    }),
    priority: () => 70,
  },

  // ==========================================
  // GENERAL/FALLBACK FOLLOW-UPS
  // ==========================================
  {
    id: 'show_overview_general',
    appliesTo: ['general', 'explanation_why', 'setup_config', 'reporting_export'],
    condition: (ctx) => !ctx.conversationHistory.includes('portfolio_overview'),
    generate: () => ({
      id: 'show_overview',
      text: 'Show my risk overview',
      icon: 'chart',
    }),
    priority: () => 50,
  },
  {
    id: 'high_risk_general',
    appliesTo: ['general', 'explanation_why', 'setup_config', 'reporting_export'],
    condition: () => true,
    generate: () => ({
      id: 'high_risk_general',
      text: 'Which suppliers are high risk?',
      icon: 'search',
    }),
    priority: () => 40,
  },
];

// ============================================
// ENGINE
// ============================================

export class SuggestionEngine {
  private conversationHistory: string[] = [];
  private askedQuestions: Set<string> = new Set();
  private viewedSuppliers: Set<string> = new Set();
  private suggestionCooldowns: Map<string, number> = new Map();
  private turnCount: number = 0;

  /**
   * Generate suggestions for a response
   */
  generateSuggestions(
    intent: DetectedIntent,
    data: {
      suppliers?: Supplier[];
      portfolio?: SuggestionContext['portfolio'];
      riskChanges?: SuggestionContext['riskChanges'];
      resultCount?: number;
      hasHandoff?: boolean;
    }
  ): Suggestion[] {
    this.turnCount++;

    // Build context
    const context: SuggestionContext = {
      intent,
      suppliers: data.suppliers,
      portfolio: data.portfolio,
      riskChanges: data.riskChanges,
      conversationHistory: this.conversationHistory,
      askedQuestions: this.askedQuestions,
      viewedSuppliers: this.viewedSuppliers,
      resultCount: data.resultCount ?? data.suppliers?.length ?? 0,
      hasHandoff: data.hasHandoff ?? false,
    };

    // Update state
    this.conversationHistory.push(intent.category);
    if (data.suppliers?.length === 1) {
      this.viewedSuppliers.add(data.suppliers[0].id);
    }

    // Find applicable rules
    const applicableRules = SUGGESTION_RULES.filter(rule => {
      // Check if rule applies to this intent
      if (!rule.appliesTo.includes(intent.category)) return false;

      // Check cooldown
      const lastUsed = this.suggestionCooldowns.get(rule.id);
      if (lastUsed && rule.cooldown && (this.turnCount - lastUsed) < rule.cooldown) {
        return false;
      }

      // Check condition
      return rule.condition(context);
    });

    // Score and sort by priority
    const scoredRules = applicableRules
      .map(rule => ({
        rule,
        priority: rule.priority(context),
        suggestion: rule.generate(context),
      }))
      .sort((a, b) => b.priority - a.priority);

    // Take top 3, avoiding duplicates
    const suggestions: Suggestion[] = [];
    const usedTexts = new Set<string>();

    for (const { rule, suggestion } of scoredRules) {
      if (suggestions.length >= 3) break;
      if (usedTexts.has(suggestion.text)) continue;

      suggestions.push(suggestion);
      usedTexts.add(suggestion.text);

      // Record cooldown
      if (rule.cooldown) {
        this.suggestionCooldowns.set(rule.id, this.turnCount);
      }
    }

    // If we don't have 3, add defaults
    while (suggestions.length < 3) {
      const defaults = [
        { id: 'default_overview', text: 'Show my risk overview', icon: 'chart' as const },
        { id: 'default_high_risk', text: 'Which suppliers are high risk?', icon: 'search' as const },
        { id: 'default_changes', text: 'Any recent risk changes?', icon: 'alert' as const },
      ];

      for (const def of defaults) {
        if (!usedTexts.has(def.text) && suggestions.length < 3) {
          suggestions.push(def);
          usedTexts.add(def.text);
        }
      }
      break;
    }

    return suggestions;
  }

  /**
   * Record that user asked a specific type of question
   */
  recordQuestion(intentCategory: string) {
    this.askedQuestions.add(intentCategory);
  }

  /**
   * Reset conversation state (new conversation)
   */
  reset() {
    this.conversationHistory = [];
    this.askedQuestions.clear();
    this.viewedSuppliers.clear();
    this.suggestionCooldowns.clear();
    this.turnCount = 0;
  }

  /**
   * Get conversation stats (for debugging/analytics)
   */
  getStats() {
    return {
      turnCount: this.turnCount,
      historyLength: this.conversationHistory.length,
      questionsAsked: this.askedQuestions.size,
      suppliersViewed: this.viewedSuppliers.size,
    };
  }
}

// Singleton instance
export const suggestionEngine = new SuggestionEngine();

// Convenience function
export const generateSuggestions = (
  intent: DetectedIntent,
  data: Parameters<SuggestionEngine['generateSuggestions']>[1]
): Suggestion[] => {
  return suggestionEngine.generateSuggestions(intent, data);
};
