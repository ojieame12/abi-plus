// Structured AI Response Types
// Defines the exact format we expect from AI responses

import type { WidgetType, WidgetData } from './widgets';
import type { DetectedIntent } from './intents';
import type { CanonicalResponse } from './responseSchema';

// ============================================
// INSIGHT STRUCTURE
// ============================================

export interface ResponseInsight {
  headline: string;        // Short, impactful statement: "Prices down 2.3%"
  explanation?: string;    // Context: "Month-over-month due to increased Chinese production" (legacy)
  summary?: string;        // NEW: 2-3 sentence explanation
  type?: 'risk_alert' | 'opportunity' | 'info' | 'action_required';
  sentiment: 'positive' | 'negative' | 'neutral';
  icon?: 'trending_up' | 'trending_down' | 'alert' | 'info' | 'check';
  // Rich insight data (populated by enhanceResponseWithData)
  factors?: Array<{
    title: string;
    detail: string;
    impact: 'positive' | 'negative' | 'neutral';
    trend?: 'up' | 'down' | 'stable';
  }>;
  entity?: {
    name: string;
    type: 'supplier' | 'category' | 'region' | 'portfolio';
  };
  metric?: {
    label: string;
    previousValue: number;
    currentValue: number;
    unit?: string;
    level?: string;
  };
  trendData?: number[];
  actions?: Array<{
    label: string;
    action: string;
    icon?: string;
  }>;
  sources?: {
    web?: Array<{ name: string; url?: string }>;
    internal?: Array<{ name: string; type: string }>;
  };
  confidence?: 'high' | 'medium' | 'low';
  generatedAt?: string;
}

// ============================================
// SOURCE STRUCTURE (Separated by type)
// ============================================

export interface WebSource {
  name: string;
  url: string;
  domain: string;
  snippet?: string;
  date?: string;
}

export interface InternalSource {
  name: string;
  type: 'beroe' | 'dun_bradstreet' | 'ecovadis' | 'internal_data' | 'supplier_data';
  dataPoints?: number;
  lastUpdated?: string;
  // Report data for clickable Beroe sources
  reportId?: string;
  category?: string;
  summary?: string;
  url?: string;
}

export interface ResponseSources {
  web: WebSource[];
  internal: InternalSource[];
  totalWebCount: number;
  totalInternalCount: number;
}

// ============================================
// FOLLOW-UP STRUCTURE
// ============================================

export interface FollowUpSuggestion {
  id: string;
  text: string;
  icon: 'search' | 'chart' | 'lightbulb' | 'document' | 'alert' | 'compare' | 'message';
  intent: string;          // What intent this would trigger
  priority: number;        // 1 = highest
}

// ============================================
// THOUGHT PROCESS STRUCTURE
// ============================================

export interface ThoughtStep {
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'complete';
  duration?: string;
}

export interface ThoughtProcess {
  duration: string;        // "2m 15s"
  steps: ThoughtStep[];
  queryAnalysis?: {
    detectedIntent: string;
    keyEntities: string[];
    dataNeeded: string[];
  };
  searchStrategy?: {
    sources: string[];
    priority: string;
  };
}

// ============================================
// RESPONSE ESCALATION
// ============================================

export interface ResponseEscalation {
  showInline: boolean;        // Show widget in chat
  expandToArtifact: boolean;  // Also open artifact panel
  resultCount: number;        // How many items in result
  threshold: number;          // What triggered this level
}

// ============================================
// HANDOFF STRUCTURE
// ============================================

export interface DashboardHandoff {
  required: boolean;
  reason: string;
  linkText: string;
  url: string;
  module: 'risk_profile' | 'supplier_detail' | 'analytics' | 'settings';
}

// ============================================
// VALUE LADDER (4-Layer System)
// ============================================

/** Layer 2: Analyst Connect - Quick validation from Beroe analysts */
export interface AnalystConnectAction {
  available: boolean;
  analyst?: {
    id: string;
    name: string;
    title: string;
    specialty: string;
    photo?: string;
    availability: 'available' | 'busy' | 'offline';
    responseTime: string; // "~2 hours"
  };
  cta: string; // "Ask Sarah about this"
  context?: {
    queryId: string;
    relevantSection?: string;
  };
}

/** Layer 4: Community - Related discussions and peer insights */
export interface CommunityAction {
  available: boolean;
  relatedThreadCount: number;
  topThread?: {
    id: string;
    title: string;
    replyCount: number;
    category: string;
  };
  cta: string; // "3 related discussions"
}

/** Layer 3: Expert Network - Premium bespoke research */
export interface ExpertDeepDiveAction {
  available: boolean;
  matchedExpert?: {
    id: string;
    name: string;
    title: string;
    formerCompany: string;
    expertise: string;
    isTopVoice: boolean;
  };
  isPremium: true;
  cta: string; // "Request expert intro"
  recommendedBy?: {
    analystName: string;
    reason: string;
  };
}

/** Value Ladder - Actions shown under AI response widget */
export interface ValueLadder {
  analystConnect?: AnalystConnectAction;
  community?: CommunityAction;
  expertDeepDive?: ExpertDeepDiveAction;
}

// ============================================
// SOURCE ENHANCEMENT SUGGESTIONS
// ============================================

export type SourceEnhancementType = 'add_web' | 'deep_research' | 'analyst' | 'expert';

export interface SourceEnhancementSuggestion {
  type: SourceEnhancementType;
  text: string;
  description?: string;
  icon: 'globe' | 'search' | 'user' | 'sparkles';
}

export interface SourceEnhancement {
  currentSourceType: 'beroe_only' | 'beroe_plus_partners' | 'beroe_plus_web' | 'web_only' | 'all';
  suggestions: SourceEnhancementSuggestion[];
}

// ============================================
// MAIN STRUCTURED RESPONSE
// ============================================

export interface StructuredAIResponse {
  // Identification
  id: string;
  timestamp: string;

  // Thought process (collapsible in UI)
  thought: ThoughtProcess;

  // Main response content
  response: {
    text: string;              // Main conversational text (markdown supported)
    tone: 'informative' | 'advisory' | 'cautionary' | 'neutral';
  };

  // Widget (optional)
  widget?: WidgetData;

  // Insight highlight (optional)
  insight?: ResponseInsight;

  // Sources (separated by type)
  sources: ResponseSources;

  // Follow-up suggestions
  followUps: FollowUpSuggestion[];

  // Metadata
  metadata: {
    intent: DetectedIntent;
    provider: 'gemini' | 'perplexity' | 'local';
    escalation: ResponseEscalation;
    processingTime: number;    // ms
  };

  // Dashboard handoff (if needed)
  handoff?: DashboardHandoff;

  // Canonical response layer (added alongside existing fields for backward compatibility)
  // This normalized format is used by the new response rendering system
  canonical?: CanonicalResponse;
}

// ============================================
// AI OUTPUT FORMAT (What we tell AI to return)
// ============================================

// This is the JSON schema we instruct the AI to follow
export interface AIOutputFormat {
  thought: string;             // Brief reasoning about how to respond
  response: string;            // Main text response (markdown)
  widget?: {
    type: WidgetType;
    title: string;
    data: Record<string, unknown>;
  };
  insight?: {
    headline: string;
    explanation: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  followUps: string[];         // 2-4 suggested follow-up questions
  dataSources: string[];       // What data was used
}

// ============================================
// RESPONSE BUILDER HELPERS
// ============================================

export const createEmptyResponse = (): StructuredAIResponse => ({
  id: '',
  timestamp: new Date().toISOString(),
  thought: {
    duration: '0s',
    steps: [],
  },
  response: {
    text: '',
    tone: 'neutral',
  },
  sources: {
    web: [],
    internal: [],
    totalWebCount: 0,
    totalInternalCount: 0,
  },
  followUps: [],
  metadata: {
    intent: {
      category: 'general',
      subIntent: 'none',
      confidence: 0,
      responseType: 'summary',
      artifactType: 'none',
      extractedEntities: {},
      requiresHandoff: false,
      requiresResearch: false,
      requiresDiscovery: false,
    },
    provider: 'local',
    escalation: {
      showInline: true,
      expandToArtifact: false,
      resultCount: 0,
      threshold: 0,
    },
    processingTime: 0,
  },
});

export const mapIconToFollowUp = (
  icon: string
): FollowUpSuggestion['icon'] => {
  const iconMap: Record<string, FollowUpSuggestion['icon']> = {
    chart: 'chart',
    search: 'search',
    lightbulb: 'lightbulb',
    document: 'document',
    alert: 'alert',
    compare: 'compare',
    message: 'message',
  };
  return iconMap[icon] || 'message';
};

// ============================================
// VALIDATION
// ============================================

export const validateAIOutput = (output: unknown): output is AIOutputFormat => {
  if (typeof output !== 'object' || output === null) return false;

  const obj = output as Record<string, unknown>;

  // Required fields
  if (typeof obj.response !== 'string') return false;
  if (!Array.isArray(obj.followUps)) return false;

  // Optional widget validation
  if (obj.widget !== undefined) {
    if (typeof obj.widget !== 'object' || obj.widget === null) return false;
    const widget = obj.widget as Record<string, unknown>;
    if (typeof widget.type !== 'string') return false;
  }

  return true;
};
