import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from './components/layout/MainLayout';
import { ArtifactPanel } from './components/panel/ArtifactPanel';
import { InsightDetailArtifact } from './components/panel/InsightDetailArtifact';
import { HomeView } from './views/HomeView';
import { ChatHistoryView } from './views/ChatHistoryView';
import { CommunityView } from './views/CommunityView';
import { QuestionDetailView } from './views/QuestionDetailView';
import { AskQuestionView } from './views/AskQuestionView';
import { ManagedCategoriesView } from './views/ManagedCategoriesView';
import { ExpertDashboardView } from './views/ExpertDashboardView';
import { ExpertMarketplaceView } from './views/ExpertMarketplaceView';
import { ApprovalWorkflowView } from './views/ApprovalWorkflowView';
import { SettingsView } from './views/SettingsView';
import { useSession } from './hooks/useSession';
import { usePreloader } from './hooks/usePreloader';
import { Preloader } from './components/Preloader';
import { UserMessage } from './components/chat/UserMessage';
import { AIResponse } from './components/chat/AIResponse';
import { ThoughtProcess } from './components/chat/ThoughtProcess';
import { ChatInput, type BuilderMetadata } from './components/chat/ChatInput';
import type { AIResponse as AIResponseType, Milestone } from './services/ai';
import { sendMessage, confirmDeepResearchIntake, executeDeepResearch } from './services/ai';
import { submitRequest } from './services/approvalService';
import { DeepResearchMessage } from './components/chat/DeepResearchMessage';
import { ResearchCommandCenter } from './components/chat/ResearchCommandCenter';
import type { IntakeAnswers, DeepResearchResponse, CommandCenterProgress } from './types/deepResearch';
import { createInitialProgress } from './types/deepResearch';
import { buildResponseSources, getSourceReportData } from './utils/sources';
import { generateReportPdf } from './utils/generateReportPdf';
import { buildArtifactPayload, resolveArtifactType } from './services/artifactBuilder';
// Artifact system imports
import { ArtifactRenderer } from './components/artifacts/ArtifactRenderer';
import type {
  ArtifactType,
  ArtifactPayload,
  AnalystConnectPayload,
  ExpertRequestPayload,
  ReportViewerPayload,
} from './components/artifacts/registry';
import { getArtifactTitle, getArtifactMeta } from './components/artifacts/registry';
import { ResponseBody } from './components/response';
import type { ContentLayer, LayerMetadata } from './types/layers';
// Phase 2: Subscription & Organization
import { CreditDrawer } from './components/subscription/CreditDrawer';
import { UpgradeRequestForm } from './components/upgrade/UpgradeRequestForm';
import { ToastContainer, useToasts } from './components/ui/Toast';
import { MOCK_SUBSCRIPTION, MOCK_TRANSACTIONS } from './services/mockSubscription';
import { fetchCreditData } from './services/creditService';
import type { CreditTransaction } from './types/subscription';
// Notifications
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { getMockNotifications } from './services/notificationService';
import type { AppNotification } from './types/notifications';
import { MOCK_SLOT_SUMMARY, getManagedCategoryNames } from './services/mockCategories';
import type { CompanySubscription } from './types/subscription';
import { CREDIT_COSTS } from './types/subscription';
import type { RequestContext } from './types/requests';
import type { Supplier, RiskChange, RiskPortfolio } from './types/supplier';
import type { Portfolio } from './types/data';
import type { InsightDetailData } from './utils/insightBuilder';
import type { ResponseInsight } from './types/aiResponse';
import { PersonaSwitcher } from './components/demo/PersonaSwitcher';
import { DEMO_COMPANY_ID, DEMO_DEFAULT_TEAM_ID } from './constants/demo';
import './App.css';

// Type for database message with metadata
interface DatabaseMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}

type ViewState = 'home' | 'chat' | 'history' | 'community' | 'community-detail' | 'ask-question' | 'expert-dashboard' | 'expert-marketplace' | 'managed-categories' | 'approval-workflow' | 'settings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AIResponseType;
  isNew?: boolean; // Flag to trigger staggered animation
}

// Get visitor ID for persistence
// DEMO MODE: Using shared visitor ID
function getVisitorId(): string {
  return 'demo-user-001';
}

// API helpers for chat persistence
async function createConversation(title: string, category = 'general') {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId: getVisitorId(), title, category }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata?: unknown) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, role, content, metadata }),
  });
  if (!res.ok) throw new Error('Failed to save message');
  return res.json();
}

async function fetchConversation(id: string) {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}

async function updateConversationCategory(id: string, category: string) {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  return res.json();
}

// Map AI intent to conversation category (uses actual IntentCategory values from types/intents.ts)
function intentToCategory(intent?: { category?: string }): string {
  if (!intent?.category) return 'general';

  const mapping: Record<string, string> = {
    // Supplier-related intents
    'supplier_deep_dive': 'suppliers',
    'filtered_discovery': 'suppliers',
    'comparison': 'suppliers',
    // Risk-related intents
    'portfolio_overview': 'risk',
    'trend_detection': 'risk',
    'explanation_why': 'risk',
    // Research-related intents
    'market_context': 'research',
    // Action/config intents → general
    'action_trigger': 'general',
    'setup_config': 'general',
    'reporting_export': 'general',
    'restricted_query': 'general',
    'general': 'general',
  };

  return mapping[intent.category] || 'general';
}

function getArtifactLayerInfo(
  type: ArtifactType | null,
  payload: ArtifactPayload | null
): { contentLayer?: ContentLayer; layerMetadata?: LayerMetadata } {
  if (!type) return {};

  // L2a - Analyst-verified content
  if (type === 'analyst_connect' && payload) {
    const analystPayload = payload as AnalystConnectPayload;
    const analystName = analystPayload.analystConnect?.analyst?.name;
    return {
      contentLayer: 'L2a',
      layerMetadata: analystName ? { analystName } : undefined,
    };
  }

  // L3 - Expert content
  if (type === 'expert_request' && payload) {
    const expertPayload = payload as ExpertRequestPayload;
    const expertName = expertPayload.expertDeepDive?.matchedExpert?.name;
    return {
      contentLayer: 'L3',
      layerMetadata: expertName ? { expertName } : undefined,
    };
  }

  // L2a - Report viewer (analyst-authored reports)
  if (type === 'report_viewer' && payload) {
    const reportPayload = payload as ReportViewerPayload;
    const analystName = reportPayload.report?.author;
    return {
      contentLayer: 'L2a',
      layerMetadata: analystName ? { analystName } : undefined,
    };
  }

  // Utility/action artifacts - no badge
  const utilityArtifacts: ArtifactType[] = [
    'export_builder',
    'watchlist_manage',
    'alert_config',
    'assessment_request',
    'community_embed',
  ];
  if (utilityArtifacts.includes(type)) {
    return {}; // No layer badge for utility artifacts
  }

  // L1 - AI-generated content artifacts
  const aiContentArtifacts: ArtifactType[] = [
    'insight_detail',
    'trend_analysis',
    'factor_breakdown',
    'news_events',
    'supplier_detail',
    'supplier_comparison',
    'supplier_table',
    'supplier_alternatives',
    'category_overview',
    'portfolio_dashboard',
    'regional_analysis',
    'spend_analysis',
    'inflation_dashboard',
    'commodity_dashboard',
    'driver_analysis',
    'impact_analysis',
    'justification_report',
    'scenario_planner',
    'executive_presentation',
  ];
  if (aiContentArtifacts.includes(type)) {
    return { contentLayer: 'L1' };
  }

  // Default: no badge for unknown types
  return {};
}

function App() {
  // Preloader state
  const { progress, isDone, isExiting } = usePreloader();

  // Auth session - needed early for view gating
  const { isAuthenticated, userId, permissions, persona, isDemoMode } = useSession();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);
  const [viewState, setViewStateRaw] = useState<ViewState>('home');

  // Community views are parked in demo mode - gate navigation
  const COMMUNITY_VIEWS: ViewState[] = ['community', 'community-detail', 'ask-question'];
  const setViewState = useCallback((newState: ViewState) => {
    // Block community views in demo mode
    if (isDemoMode && COMMUNITY_VIEWS.includes(newState)) {
      console.log('[App] Community views parked, redirecting to home');
      setViewStateRaw('home');
      return;
    }
    setViewStateRaw(newState);
  }, [isDemoMode]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Map demo persona to user role for UI components
  const userRole = persona === 'admin' ? 'admin' : persona === 'approver' ? 'approver' : 'user';

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [liveMilestones, setLiveMilestones] = useState<Milestone[]>([]);
  const [mode, setMode] = useState<'fast' | 'reasoning'>('fast');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [previousWebSearchEnabled, setPreviousWebSearchEnabled] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<AIResponseType['artifact'] | null>(null);
  const [artifactData, setArtifactData] = useState<{ suppliers?: Supplier[]; portfolio?: Portfolio | RiskPortfolio; insight?: InsightDetailData } | null>(null);

  // New artifact system state
  const [artifactType, setArtifactType] = useState<ArtifactType | null>(null);
  const [artifactPayload, setArtifactPayload] = useState<ArtifactPayload | null>(null);

  // Phase 2: Subscription state - fetched from live API
  const [subscription, setSubscription] = useState<CompanySubscription>(MOCK_SUBSCRIPTION);
  const [transactions, setTransactions] = useState<CreditTransaction[]>(MOCK_TRANSACTIONS);
  const [isCreditLoading, setIsCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [isCreditDrawerOpen, setIsCreditDrawerOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<RequestContext | undefined>(undefined);

  // Notifications state
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Fetch credit balance from live API
  const refreshCredits = useCallback(async () => {
    try {
      setIsCreditLoading(true);
      setCreditError(null);
      const data = await fetchCreditData();
      setSubscription(data.subscription);
      setTransactions(data.transactions);
    } catch (err) {
      console.warn('[App] Failed to fetch credit data, using mock:', err);
      // Keep using mock data on failure
      setCreditError(err instanceof Error ? err.message : 'Failed to load credits');
    } finally {
      setIsCreditLoading(false);
    }
  }, []);

  // Fetch credits when authenticated (wait for demo-login to complete)
  useEffect(() => {
    if (isAuthenticated) {
      refreshCredits();
    }
  }, [isAuthenticated, refreshCredits]);

  // Helper to update a specific message by ID
  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, ...updates } : m
    ));
  }, []);

  // Load notifications on mount
  useEffect(() => {
    setNotifications(getMockNotifications());
  }, []);

  // Deep Research toggle handler - manages web search state
  const handleToggleDeepResearch = useCallback((enabled: boolean) => {
    if (enabled) {
      // Turning on: save current web search state and force it on
      setPreviousWebSearchEnabled(webSearchEnabled);
      setWebSearchEnabled(true);
      setDeepResearchEnabled(true);
    } else {
      // Turning off: restore previous web search state
      setWebSearchEnabled(previousWebSearchEnabled);
      setDeepResearchEnabled(false);
    }
  }, [webSearchEnabled, previousWebSearchEnabled]);

  // Handle URL deep-linking for reports
  // Example: ?report=steel-market-2025
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('report');

    if (reportId && isAuthenticated) {
      // Open report viewer artifact
      const reportPayload: ReportViewerPayload = {
        type: 'report_viewer',
        report: {
          id: reportId,
          title: `Report ${reportId}`, // Will be fetched/resolved by the artifact
          category: 'research',
          publishedDate: new Date().toISOString(),
        },
      };
      setArtifactType('report_viewer');
      setArtifactPayload(reportPayload);
      setCurrentArtifact({ type: 'report_viewer', title: 'Beroe Report' });
      setIsPanelOpen(true);

      // Clean up URL without reloading
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, [isAuthenticated]);

  // Toast notifications
  const { toasts, dismissToast, showSuccess, showPending } = useToasts();

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  // Auto-scroll only when explicitly requested (follow-up clicks)
  useEffect(() => {
    if (shouldScrollRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      shouldScrollRef.current = false;
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Open insight in artifact panel
  const openInsightPanel = (insightData: Record<string, unknown>) => {
    const data = insightData as unknown as InsightDetailData;
    setArtifactType('insight_detail');
    setArtifactPayload({ type: 'insight_detail', data });
    setCurrentArtifact({ type: 'insight_detail', title: 'Insight Details' });
    setArtifactData({ insight: data });
    setIsPanelOpen(true);
  };

  // Open artifact panel with specific type (new system)
  const openArtifact = (type: ArtifactType, payload: Partial<ArtifactPayload> = {}) => {
    const meta = getArtifactMeta(type);
    setArtifactType(type);
    setArtifactPayload({ type, ...payload } as ArtifactPayload);
    setCurrentArtifact({ type, title: meta.title });
    // Reset expansion if artifact doesn't allow it
    if (!meta.allowExpand) {
      setIsArtifactExpanded(false);
    }
    setIsPanelOpen(true);
  };

  const handleWidgetExpand = (artifactComponent: string, response: AIResponseType) => {
    const artifactType = resolveArtifactType(artifactComponent, response.artifact?.type);
    if (!artifactType) return;

    const payload = buildArtifactPayload(artifactType, {
      suppliers: response.suppliers,
      portfolio: response.portfolio,
      riskChanges: response.riskChanges,
      // Pass widget data for inflation artifacts
      widgetData: response.widget?.data as Record<string, unknown> | undefined,
    });

    if (!payload) {
      const fallbackArtifacts = new Set<ArtifactType>([
        'inflation_dashboard',
        'commodity_dashboard',
        'driver_analysis',
        'impact_analysis',
        'justification_report',
        'scenario_planner',
        'executive_presentation',
        'trend_analysis',
        'category_overview',
        'regional_analysis',
        'watchlist_manage',
        'assessment_request',
      ]);

      if (!fallbackArtifacts.has(artifactType)) {
        return;
      }

      openArtifact(artifactType, {
        aiContent: response.artifactContent,
      });
      return;
    }

    openArtifact(artifactType, {
      ...payload,
      sourceSuppliers: response.suppliers,
      sourceRiskChanges: response.riskChanges,
      // Pass AI-generated deep-dive content
      aiContent: response.artifactContent,
    });
  };

  // Handle artifact actions (from ArtifactRenderer callbacks)
  const handleArtifactAction = (action: string, data?: unknown) => {
    console.log('[App] Artifact action:', action, data);
    switch (action) {
      case 'alert_created':
        // Could show a toast or update state
        console.log('Alert created:', data);
        break;
      case 'export_complete':
        console.log('Export complete:', data);
        break;
      case 'export':
        if (data && typeof data === 'object') {
          openArtifact('export_builder', data as Partial<ArtifactPayload>);
        } else {
          openArtifact('export_builder');
        }
        break;
      case 'select_supplier':
        // Open supplier detail
        if (data && typeof data === 'object' && 'id' in data) {
          const supplierId = (data as { id: string }).id;
          const payloadWithSuppliers = artifactPayload as ArtifactPayload & { sourceSuppliers?: Supplier[]; sourceRiskChanges?: RiskChange[] };
          const sourceSuppliers = payloadWithSuppliers?.sourceSuppliers;
          const sourceRiskChanges = payloadWithSuppliers?.sourceRiskChanges;
          const matchedSupplier = Array.isArray(sourceSuppliers)
            ? sourceSuppliers.find((supplier) => supplier.id === supplierId)
            : null;

          if (matchedSupplier) {
            const detailPayload = buildArtifactPayload('supplier_detail', {
              suppliers: [matchedSupplier],
              riskChanges: sourceRiskChanges,
            });
            if (detailPayload) {
              openArtifact('supplier_detail', detailPayload);
              break;
            }
          }
        }

        if (data) {
          openArtifact('supplier_detail', { supplier: data });
        }
        break;
      case 'view_dashboard':
        // Could navigate to external dashboard
        console.log('Navigate to dashboard');
        break;
      case 'view_commodity':
        // Open commodity dashboard artifact
        if (data && typeof data === 'object') {
          openArtifact('commodity_dashboard', data as Partial<ArtifactPayload>);
        }
        break;
      case 'create_scenario':
        // Open scenario planner with pre-filled assumptions
        if (data && typeof data === 'object') {
          openArtifact('scenario_planner', data as Partial<ArtifactPayload>);
        } else {
          openArtifact('scenario_planner');
        }
        break;
      case 'select_scenario':
        // Handle scenario selection - could update state or open detail view
        console.log('Scenario selected:', data);
        break;
      case 'start_negotiation':
        // Open justification report for negotiation prep
        if (data && typeof data === 'object') {
          openArtifact('justification_report', data as Partial<ArtifactPayload>);
        } else {
          openArtifact('justification_report');
        }
        break;
      case 'share':
        // Handle sharing - could copy link or open share dialog
        if (data && typeof data === 'object' && 'url' in data) {
          navigator.clipboard?.writeText(String(data.url));
          console.log('Copied share link:', data);
        }
        break;
      // Value Ladder actions
      case 'schedule_call':
        console.log('Schedule call:', data);
        // Could integrate with calendar API
        break;
      case 'send_question':
        console.log('Send question to analyst:', data);
        // Could trigger message send
        break;
      case 'request_expert_intro':
        console.log('Request expert introduction:', data);
        // Could trigger expert network flow
        break;
      // Community features are parked - these actions are disabled
      case 'view_thread':
      case 'start_discussion':
      case 'view_all_discussions':
        console.log('[Community parked] Action disabled:', action, data);
        break;

      // Deeper Analysis artifact swaps
      case 'open_upgrade_confirm':
        {
          const deeperData = data as {
            category?: string;
            credits?: { upgrade: number };
          };
          openArtifact('upgrade_confirm', {
            category: deeperData?.category || 'General',
            credits: deeperData?.credits?.upgrade || CREDIT_COSTS.report_upgrade.typical,
            balanceAfter: subscription.remainingCredits - (deeperData?.credits?.upgrade || CREDIT_COSTS.report_upgrade.typical),
          });
        }
        break;

      case 'open_analyst_message':
        {
          const deeperData = data as {
            category?: string;
            isManaged?: boolean;
            queryText?: string;
            valueLadder?: { analystConnect?: { analyst?: unknown } };
            credits?: { analyst: number };
          };
          const analyst = deeperData?.valueLadder?.analystConnect?.analyst as {
            name?: string;
            specialty?: string;
            photo?: string;
            availability?: 'available' | 'busy' | 'offline';
            responseTime?: string;
          } | undefined;
          openArtifact('analyst_message', {
            analyst: analyst || {
              name: 'Dr. James Morrison',
              specialty: 'Metals & Mining',
              availability: 'available',
              responseTime: '~4 hours',
            },
            category: deeperData?.category || 'General',
            isManaged: deeperData?.isManaged || false,
            queryContext: deeperData?.queryText,
            credits: deeperData?.credits?.analyst || CREDIT_COSTS.analyst_call.typical,
          });
        }
        break;

      case 'open_expert_briefing':
        {
          const deeperData = data as {
            category?: string;
            valueLadder?: { expertDeepDive?: { matchedExpert?: unknown } };
            credits?: { expert: number };
          };
          const expert = deeperData?.valueLadder?.expertDeepDive?.matchedExpert as {
            id?: string;
            name?: string;
            title?: string;
            formerCompany?: string;
            expertise?: string;
            isTopVoice?: boolean;
          } | undefined;
          const expertCredits = deeperData?.credits?.expert || CREDIT_COSTS.expert_deepdive.typical;
          openArtifact('expert_briefing', {
            expert: expert || {
              id: 'expert-001',
              name: 'Sarah Mitchell',
              title: 'Director of Metals Research',
              formerCompany: 'ArcelorMittal',
              expertise: 'Steel Markets',
              isTopVoice: true,
            },
            category: deeperData?.category || 'General',
            credits: expertCredits,
            balanceAfter: subscription.remainingCredits - expertCredits,
            requiresApproval: expertCredits > 2000, // Approval required for high-credit items
          });
        }
        break;

      case 'back_to_deeper_analysis':
        // Go back to the deeper_analysis view
        // For now, just close the panel - in production would restore previous state
        setIsPanelOpen(false);
        break;

      case 'confirm_upgrade':
        console.log('Upgrade confirmed:', data);
        showSuccess('Report upgrade request submitted');
        break;

      case 'send_analyst_message':
        console.log('Analyst message sent:', data);
        showSuccess('Message sent to analyst');
        break;

      case 'submit_expert_request':
        console.log('Expert request submitted:', data);
        showSuccess('Expert deep-dive request submitted');
        break;

      case 'download_report_pdf': {
        const reportPayload = artifactPayload as import('./components/artifacts/registry').DeepResearchReportPayload;
        if (reportPayload?.report) {
          generateReportPdf(reportPayload.report);
        }
        break;
      }

      default:
        console.log('Unhandled action:', action);
    }
  };

  // Helper to get the user message that triggered a specific AI response
  const getUserMessageForResponse = (responseId: string): string | undefined => {
    const responseIndex = messages.findIndex(m => m.id === responseId);
    if (responseIndex <= 0) return undefined;
    // Look backwards from the AI response to find the preceding user message
    for (let i = responseIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }
    return undefined;
  };

  const normalizeCategoryValue = (value?: string): string =>
    value?.trim().toLowerCase() ?? '';

  const isManagedCategory = (candidates: Array<string | undefined>): boolean => {
    const normalizedCandidates = candidates
      .map(normalizeCategoryValue)
      .filter(Boolean);

    if (normalizedCandidates.length === 0) return false;

    const hasActivatedId = subscription.activatedCategories.some((categoryId) =>
      normalizedCandidates.includes(normalizeCategoryValue(categoryId))
    );
    if (hasActivatedId) return true;

    if (!isDemoMode) return false;

    return MOCK_SLOT_SUMMARY.activatedCategories.some((activation) => {
      const matchValues = [
        activation.categoryId,
        activation.category.name,
        activation.category.slug,
      ];
      return matchValues.some((value) =>
        normalizedCandidates.includes(normalizeCategoryValue(value))
      );
    });
  };

  // Value Ladder Handlers - Progressive disclosure pattern
  // Opens the deeper_analysis artifact with all upgrade options
  const handleOpenDeeperAnalysis = (response: AIResponseType) => {
    const valueLadder = response.canonical?.valueLadder;
    if (!valueLadder) return;

    // Extract category from response
    const extractedCategory = response.intent?.extractedEntities?.category;
    const extractedCommodity = response.intent?.extractedEntities?.commodity;
    const category = extractedCommodity || extractedCategory || 'General';

    const isManaged = isManagedCategory([extractedCategory, extractedCommodity]);

    // Build the deeper_analysis payload using centralized CREDIT_COSTS
    openArtifact('deeper_analysis', {
      queryText: getUserMessageForResponse(response.id) || '',
      category,
      valueLadder, // Pass original unchanged ValueLadder
      isManaged,
      credits: {
        upgrade: CREDIT_COSTS.report_upgrade.typical,
        analyst: CREDIT_COSTS.analyst_call.typical,
        expert: CREDIT_COSTS.expert_deepdive.typical,
      },
    });
  };

  // Direct analyst access - opens analyst_connect artifact directly
  const handleAskAnalyst = (response: AIResponseType) => {
    const valueLadder = response.canonical?.valueLadder;
    if (!valueLadder?.analystConnect) return;

    openArtifact('analyst_connect', {
      analystConnect: valueLadder.analystConnect,
      queryContext: {
        queryId: response.id,
        queryText: getUserMessageForResponse(response.id),
      },
    });
  };

  // Notification handlers
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationsClick = () => setIsNotificationDrawerOpen(true);

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationAction = (notification: AppNotification) => {
    // Route based on notification type and action
    console.log('[App] Notification clicked:', notification.id, notification.action?.onClick);

    if (notification.type === 'approval_update' && notification.metadata?.requestId) {
      // Navigate to approval workflow view
      setViewState('approval-workflow');
      setIsNotificationDrawerOpen(false);
    } else if (notification.type === 'alert_triggered') {
      // Could open supplier detail or alert dashboard
      console.log('[App] Alert notification - would open alert details');
    } else if (notification.type === 'badge_awarded' || notification.type === 'reputation_change') {
      // Could navigate to profile/achievements
      console.log('[App] Achievement notification - would open profile');
    }
  };

  // Deep Research Handlers
  const handleConfirmDeepResearch = async (
    messageId: string,
    currentResponse: AIResponseType,
    answers: IntakeAnswers
  ) => {
    const deepResearch = (currentResponse as AIResponseType & { deepResearch?: DeepResearchResponse }).deepResearch;
    if (!deepResearch) return;

    const studyType = deepResearch.studyType || deepResearch.intake?.studyType || 'market_analysis';

    try {
      // 1. Transition to processing phase
      const processingResponse = await confirmDeepResearchIntake(
        deepResearch.jobId,
        deepResearch.query,
        answers,
        studyType,
        deepResearch.creditsAvailable
      );

      // 2. Update message with processing state
      updateMessage(messageId, {
        response: {
          ...currentResponse,
          deepResearch: processingResponse,
        } as AIResponseType & { deepResearch: DeepResearchResponse },
      });

      // 3. Execute research — progress shows inline via ResearchCommandCenter (no artifact panel)
      const finalResponse = await executeDeepResearch(
        deepResearch.jobId,
        deepResearch.query,
        answers,
        studyType,
        (update) => {
          // Real-time progress updates — rendered inline by ResearchCommandCenter
          updateMessage(messageId, {
            response: {
              ...currentResponse,
              deepResearch: update,
            } as AIResponseType & { deepResearch: DeepResearchResponse },
          });
        }
      );

      // 5. Final update with report
      updateMessage(messageId, {
        response: {
          ...currentResponse,
          deepResearch: finalResponse,
        } as AIResponseType & { deepResearch: DeepResearchResponse },
      });

      // 4. Open report artifact in full view if complete
      if (finalResponse.phase === 'complete' && finalResponse.report) {
        openArtifact('deep_research_report', {
          type: 'deep_research_report',
          jobId: finalResponse.jobId,
          report: finalResponse.report,
        });
        setIsArtifactExpanded(true); // Full view for deep research reports
      }
    } catch (error) {
      console.error('[App] Deep research error:', error);
    }
  };

  const handleViewDeepResearchReport = (response: AIResponseType) => {
    const deepResearch = (response as AIResponseType & { deepResearch?: DeepResearchResponse }).deepResearch;
    if (deepResearch?.report) {
      openArtifact('deep_research_report', {
        type: 'deep_research_report',
        jobId: deepResearch.jobId,
        report: deepResearch.report,
      });
      setIsArtifactExpanded(true); // Full view for deep research reports
    }
  };

  const handleDownloadDeepResearchReport = (response: AIResponseType) => {
    const report = (response as AIResponseType & { deepResearch?: DeepResearchResponse }).deepResearch?.report;
    if (report?.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  const handleRetryDeepResearch = (messageId: string, originalQuery: string) => {
    // Remove failed message and retry
    setMessages(prev => prev.filter(m => m.id !== messageId));
    handleSendMessage(originalQuery, true);
  };

  const handleCancelDeepResearch = (messageId: string) => {
    // Update the message to show cancelled state
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.response) {
        const deepResearch = (m.response as AIResponseType & { deepResearch?: DeepResearchResponse }).deepResearch;
        if (deepResearch) {
          return {
            ...m,
            response: {
              ...m.response,
              deepResearch: {
                ...deepResearch,
                phase: 'error' as const,
                error: {
                  message: 'Research cancelled by user',
                  canRetry: true,
                },
              },
            },
          };
        }
      }
      return m;
    }));
  };

  // Handle upgrade request (L2b decision-grade upgrade)
  const handleUpgrade = (response: AIResponseType) => {
    // Build context from the response
    const context: RequestContext = {
      reportTitle: response.artifact?.title || conversationTitle,
      categoryId: response.intent?.extractedEntities?.category,
      categoryName: response.intent?.extractedEntities?.commodity || response.intent?.extractedEntities?.category,
      queryText: getUserMessageForResponse(response.id),
      conversationId: currentConversationId || undefined,
    };
    setUpgradeContext(context);
    setIsUpgradeModalOpen(true);
  };

  // Handle starting a chat from home
  const handleStartChat = (question: string, builderMeta?: BuilderMetadata, webSearch?: boolean, deepResearch?: boolean) => {
    const title = generateTitle(question);
    setConversationTitle(title);
    setIsTransitioning(true);

    // Set web search state if explicitly provided from HomeView
    if (webSearch !== undefined) {
      setWebSearchEnabled(webSearch);
    }
    // Sync deep research toggle state from HomeView
    if (deepResearch !== undefined) {
      handleToggleDeepResearch(deepResearch);
    }

    // Add user message immediately (optimistic UI)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages([userMsg]);

    // Fire-and-forget: persist conversation in background (don't block UI)
    let convIdRef: string | null = null;
    createConversation(title)
      .then(conv => {
        convIdRef = conv.id;
        setCurrentConversationId(conv.id);
        return saveMessage(conv.id, 'user', question);
      })
      .catch(err => {
        console.error('[App] Failed to persist conversation:', err);
        // Continue anyway - chat works without persistence
      });

    // Switch to chat view immediately after fade animation (don't wait for persistence)
    setTimeout(() => {
      setViewState('chat');
      setIsTransitioning(false);
      // Fetch AI response - pass builder metadata and web search preference
      fetchAIResponse(question, [], convIdRef, builderMeta, webSearch, deepResearch);
    }, 400);
  };

  // Fetch AI response
  const fetchAIResponse = async (question: string, history: Message[], convId?: string | null, builderMeta?: BuilderMetadata, forceWebSearch?: boolean, deepResearch?: boolean) => {
    console.log('[App] fetchAIResponse called with:', question, 'builderMeta:', builderMeta, 'forceWebSearch:', forceWebSearch, 'deepResearch:', deepResearch);
    setIsThinking(true);
    setLiveMilestones([]); // Clear previous milestones

    // Use provided convId or fall back to state
    const conversationId = convId ?? currentConversationId;

    // Use forceWebSearch if provided, otherwise use state
    const useWebSearch = forceWebSearch ?? webSearchEnabled;

    try {
      console.log('[App] Calling sendMessage...');
      const response = await sendMessage(question, {
        mode,
        webSearchEnabled: useWebSearch,
        conversationHistory: history.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        })),
        // Pass builder metadata for deterministic intent routing
        builderMeta,
        // Stream milestones in real-time
        onMilestone: (milestone) => {
          setLiveMilestones(prev => [...prev, milestone]);
        },
        // Deep research options
        deepResearchMode: deepResearch,
        creditsAvailable: subscription.remainingCredits,
      });

      console.log('[App] Got response:', response.id, response.content.slice(0, 100));

      // Add AI message with animation flag
      const aiMsg: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        response,
        isNew: true, // Trigger staggered entrance animation
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save AI response to database
      if (conversationId) {
        saveMessage(conversationId, 'assistant', response.content, {
          // Core response data
          intent: response.intent,
          sources: response.sources,
          artifact: response.artifact,
          // Widget/UI data for full restoration
          portfolio: response.portfolio,
          suppliers: response.suppliers,
          widget: response.widget,
          insight: response.insight,
          suggestions: response.suggestions,
          acknowledgement: response.acknowledgement,
          handoff: response.handoff,
          riskChanges: response.riskChanges,
          // AI-generated artifact panel content
          artifactContent: response.artifactContent,
          // Canonical response for consistent formatting
          canonical: response.canonical,
        }).catch(err => console.error('[App] Failed to save AI message:', err));

        // Auto-detect and update category from intent (only on first message)
        if (history.length === 0 && response.intent) {
          const category = intentToCategory(response.intent);
          if (category !== 'general') {
            updateConversationCategory(conversationId, category)
              .catch(err => console.error('[App] Failed to update category:', err));
          }
        }
      }

      // Clear isNew flag after animation completes (~4s)
      setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === response.id ? { ...m, isNew: false } : m
        ));
      }, 4000);

      // Store artifact data but DON'T auto-open - user must trigger it
      if (response.artifact && response.artifact.type !== 'none') {
        setCurrentArtifact(response.artifact);
        setArtifactData({
          suppliers: response.suppliers,
          portfolio: response.portfolio,
        });
        // Panel only opens when user explicitly clicks to view details
      }

    } catch (error) {
      console.error('[App] AI Error:', error);
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      console.log('[App] Setting isThinking to false');
      setIsThinking(false);
    }
  };

  // Handle follow-up messages
  const handleSendMessage = (content: string, deepResearch?: boolean) => {
    if (!content.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, userMsg]);

    // Save user message to database
    if (currentConversationId) {
      saveMessage(currentConversationId, 'user', content)
        .catch(err => console.error('[App] Failed to save user message:', err));
    }

    fetchAIResponse(content, [...messages, userMsg], currentConversationId, undefined, undefined, deepResearch);
  };

  // Handle suggestion clicks (follow-ups)
  const handleSuggestionClick = (item: { text: string }) => {
    shouldScrollRef.current = true; // Enable scroll for follow-up
    handleSendMessage(item.text);
  };

  // Handle new chat - reset everything and go back to home
  const handleNewChat = () => {
    setViewState('home');
    setIsTransitioning(false);
    setConversationTitle('');
    setCurrentConversationId(null);
    setMessages([]);
    setIsThinking(false);
    setCurrentArtifact(null);
    setArtifactData(null);
    setIsPanelOpen(false);
    // Reset new artifact system state
    setArtifactType(null);
    setArtifactPayload(null);
    setIsArtifactExpanded(false);
  };

  // Widget rendering is now handled by WidgetRenderer via widgetContext prop

  // Navigate to history view
  const handleNavigateToHistory = () => {
    setViewState('history');
    setIsPanelOpen(false);
  };

  // Navigate to community view
  const handleNavigateToCommunity = () => {
    setViewState('community');
    setSelectedQuestionId(null);
    setIsPanelOpen(false);
  };

  // Select a question to view details
  const handleSelectQuestion = (id: string) => {
    setSelectedQuestionId(id);
    setViewState('community-detail');
  };

  // Go back to community list
  const handleBackToCommunity = () => {
    setSelectedQuestionId(null);
    setViewState('community');
  };

  // Navigate to ask question view
  const handleNavigateToAskQuestion = () => {
    setViewState('ask-question');
    setIsPanelOpen(false);
  };

  // Handle successful question creation
  const handleQuestionCreated = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setViewState('community-detail');
  };

  // Load an existing conversation from history
  const handleLoadConversation = async (id: string) => {
    try {
      const data = await fetchConversation(id);

      // Set conversation metadata
      setCurrentConversationId(data.id);
      setConversationTitle(data.title);

      // Reset artifact state to prevent stale data from previous session
      setCurrentArtifact(null);
      setArtifactData(null);
      setArtifactType(null);
      setArtifactPayload(null);
      setIsArtifactExpanded(false);
      setIsPanelOpen(false);

      // Convert DB messages to app Message format
      const loadedMessages: Message[] = data.messages.map((m: DatabaseMessage) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        // Restore full response metadata for UI rehydration
        response: m.metadata ? {
          id: m.id,
          content: m.content,
          // Core response data
          intent: m.metadata.intent,
          sources: m.metadata.sources,
          artifact: m.metadata.artifact,
          // Widget/UI data
          portfolio: m.metadata.portfolio,
          suppliers: m.metadata.suppliers,
          widget: m.metadata.widget,
          insight: m.metadata.insight,
          suggestions: m.metadata.suggestions,
          acknowledgement: m.metadata.acknowledgement,
          handoff: m.metadata.handoff,
          riskChanges: m.metadata.riskChanges,
          // AI-generated artifact panel content
          artifactContent: m.metadata.artifactContent,
          // Canonical response for consistent formatting
          canonical: m.metadata.canonical,
        } : undefined,
        isNew: false,
      }));

      setMessages(loadedMessages);
      setViewState('chat');
    } catch (err) {
      console.error('[App] Failed to load conversation:', err);
    }
  };

  // Background opacity: 100 for home, 0 for community (hero has own bg), 30 for history, 10 for chat/transitioning
  const backgroundOpacity = viewState === 'home' && !isTransitioning
    ? 100
    : viewState === 'community'
      ? 0
      : (viewState === 'history' || viewState === 'community-detail')
        ? 30
        : 10;

  // Header variant
  const headerVariant = (viewState === 'home' || viewState === 'history' || viewState === 'community' || viewState === 'community-detail') && !isTransitioning ? 'home' : 'conversation';
  const artifactLayerInfo = getArtifactLayerInfo(artifactType, artifactPayload);

  // Close panel and reset expanded state
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setIsArtifactExpanded(false);
  };

  return (
    <>
      {/* Preloader */}
      <AnimatePresence>
        {!isDone && (
          <Preloader progress={progress} isExiting={isExiting} />
        )}
      </AnimatePresence>

      {/* Main app - animate in after preloader */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isDone ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <MainLayout
          headerVariant={headerVariant}
          conversationTitle={conversationTitle}
          backgroundOpacity={backgroundOpacity}
          isHeaderLoading={isTransitioning || isThinking}
          artifactCount={currentArtifact ? 1 : 0}
          hideHeader={viewState === 'community' || viewState === 'ask-question'}
          onNewChat={handleNewChat}
          onNavigateToHome={handleNewChat}
          onNavigateToHistory={handleNavigateToHistory}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToSettings={() => setViewState('settings')}
          onNavigateToExpertPortal={() => setViewState('expert-dashboard')}
          onNavigateToExpertMarketplace={() => setViewState('expert-marketplace')}
          showExpertPortal={true} // Demo mode: show expert portal access
          isArtifactExpanded={isArtifactExpanded}
          subscription={subscription}
          onCreditsClick={() => setIsCreditDrawerOpen(true)}
          notificationCount={unreadNotificationCount}
          onNotificationsClick={handleNotificationsClick}
          panel={
        <ArtifactPanel
          isOpen={isPanelOpen}
          title={artifactType ? getArtifactTitle(artifactType) : (currentArtifact?.title || 'Results')}
          onClose={handleClosePanel}
          isExpanded={isArtifactExpanded}
          onToggleExpand={() => setIsArtifactExpanded(!isArtifactExpanded)}
          defaultWidth={artifactType ? getArtifactMeta(artifactType).defaultWidth : '40%'}
          allowExpand={artifactType ? getArtifactMeta(artifactType).allowExpand : true}
          contentLayer={artifactLayerInfo.contentLayer}
          layerMetadata={artifactLayerInfo.layerMetadata}
        >
          {/* Use new ArtifactRenderer when artifactType is set */}
          {artifactType && artifactPayload ? (
            <ArtifactRenderer
              type={artifactType}
              payload={artifactPayload}
              isExpanded={isArtifactExpanded}
              onClose={handleClosePanel}
              onAction={handleArtifactAction}
              overlayContext={{
                remainingCredits: subscription.remainingCredits,
                creditCosts: {
                  upgrade: CREDIT_COSTS.report_upgrade.typical,
                  analyst: CREDIT_COSTS.analyst_call.typical,
                },
                // Compute isManaged from report's studyType if available
                isManaged: artifactType === 'deep_research_report'
                  ? isManagedCategory([(artifactPayload as { report?: { studyType?: string } })?.report?.studyType])
                  : false,
              }}
            />
          ) : (
            <div className="p-6">
              {/* Legacy artifact rendering for backwards compatibility */}
              {currentArtifact?.type === 'portfolio_dashboard' && artifactData?.portfolio && (
                <PortfolioWidget portfolio={artifactData.portfolio as Portfolio} />
              )}
              {currentArtifact?.type === 'supplier_table' && artifactData?.suppliers && (
                <SupplierTableWidget suppliers={artifactData.suppliers} />
              )}
              {currentArtifact?.type === 'supplier_detail' && artifactData?.suppliers?.[0] && (
                <SupplierDetailWidget supplier={artifactData.suppliers[0]} />
              )}
              {currentArtifact?.type === 'insight_detail' && artifactData?.insight && (
                <InsightDetailArtifact data={artifactData.insight} isExpanded={isArtifactExpanded} />
              )}
              {!currentArtifact && (
                <div className="text-center text-muted py-8">
                  No artifact to display
                </div>
              )}
            </div>
          )}
        </ArtifactPanel>
      }
    >
      <AnimatePresence mode="wait">
        {viewState === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 1 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <HomeView
              onOpenArtifact={() => setIsPanelOpen(true)}
              onStartChat={handleStartChat}
            />
          </motion.div>
        ) : viewState === 'history' ? (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ChatHistoryView
              onNewChat={handleNewChat}
              onSelectConversation={handleLoadConversation}
            />
          </motion.div>
        ) : viewState === 'community' ? (
          <motion.div
            key="community"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <CommunityView
              onSelectQuestion={handleSelectQuestion}
              onAskQuestion={handleNavigateToAskQuestion}
              canAsk={permissions.canAsk}
            />
          </motion.div>
        ) : viewState === 'ask-question' ? (
          <motion.div
            key="ask-question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <AskQuestionView
              onBack={handleBackToCommunity}
              onSuccess={handleQuestionCreated}
            />
          </motion.div>
        ) : viewState === 'managed-categories' ? (
          <motion.div
            key="managed-categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ManagedCategoriesView
              onBack={() => setViewState('home')}
            />
          </motion.div>
        ) : viewState === 'expert-dashboard' ? (
          <motion.div
            key="expert-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ExpertDashboardView
              onBack={() => setViewState('home')}
            />
          </motion.div>
        ) : viewState === 'expert-marketplace' ? (
          <motion.div
            key="expert-marketplace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ExpertMarketplaceView
              onBack={() => setViewState('home')}
            />
          </motion.div>
        ) : viewState === 'approval-workflow' ? (
          <motion.div
            key="approval-workflow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ApprovalWorkflowView
              onBack={() => setViewState('home')}
              userRole={userRole}
            />
          </motion.div>
        ) : viewState === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <SettingsView
              onBack={() => setViewState('home')}
              userRole={userRole}
              onNavigateToCategories={() => setViewState('managed-categories')}
              onNavigateToApprovals={() => setViewState('approval-workflow')}
            />
          </motion.div>
        ) : viewState === 'community-detail' && selectedQuestionId ? (
          <motion.div
            key="community-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <QuestionDetailView
              questionId={selectedQuestionId}
              onBack={handleBackToCommunity}
              onSelectQuestion={handleSelectQuestion}
              isAuthenticated={isAuthenticated}
              userId={userId}
              canUpvote={permissions.canUpvote}
              canDownvote={permissions.canDownvote}
              canAnswer={permissions.canAnswer}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            {/* Messages */}
            <div className="flex-1 overflow-auto scroll-smooth">
              <div className="max-w-3xl mx-auto px-6 py-6">
                {messages.map((msg, index) => {
                  // Determine what to show based on message position
                  const isAssistant = msg.role === 'assistant';
                  const isLastAssistantMessage = isAssistant && (
                    index === messages.length - 1 ||
                    (index === messages.length - 2 && messages[messages.length - 1]?.role === 'user')
                  );

                  // Widgets, insights, sources persist on ALL assistant messages
                  const hasResponse = isAssistant && !!msg.response;

                  // Follow-ups and thought process only on the LATEST assistant message
                  const showInteractive = isLastAssistantMessage && !isThinking;

                  // Build response sources with managed category context for confidence calculation
                  const detectedCategory = msg.response?.intent?.extractedEntities?.category
                    || msg.response?.intent?.extractedEntities?.commodity;
                  const responseSources = msg.response?.sources
                    ? buildResponseSources(msg.response.sources, {
                        detectedCategory,
                        managedCategories: getManagedCategoryNames(),
                        calculateConfidenceFlag: true, // Enable confidence calculation for "Expand to Web" button
                      })
                    : null;
                  const hasSources = responseSources
                    ? responseSources.totalWebCount > 0 || responseSources.totalInternalCount > 0
                    : false;

                  const deepResearchPayload = (msg.response as AIResponseType & { deepResearch?: DeepResearchResponse })?.deepResearch;
                  const deepResearchQuery =
                    deepResearchPayload?.query || getUserMessageForResponse(msg.id) || '';

                  return (
                    <motion.div
                      key={msg.id}
                      className="mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {msg.role === 'user' ? (
                        <UserMessage message={msg.content} initial="S" />
                      ) : deepResearchPayload ? (
                        // Deep Research flow - use ResearchCommandCenter for processing/complete phases
                        deepResearchPayload.phase === 'intake' || deepResearchPayload.phase === 'intake_confirmed' ? (
                          <DeepResearchMessage
                            response={deepResearchPayload}
                            onConfirmIntake={(answers) => handleConfirmDeepResearch(msg.id, msg.response!, answers)}
                            onViewReport={() => handleViewDeepResearchReport(msg.response!)}
                            onDownloadReport={() => handleDownloadDeepResearchReport(msg.response!)}
                            onRetry={() => handleRetryDeepResearch(msg.id, deepResearchQuery)}
                          />
                        ) : (
                          <ResearchCommandCenter
                            jobId={deepResearchPayload.jobId}
                            query={deepResearchQuery}
                            studyType={deepResearchPayload.studyType}
                            status={
                              deepResearchPayload.phase === 'complete' ? 'complete' :
                              deepResearchPayload.phase === 'error' ? 'error' :
                              'researching'
                            }
                            progress={deepResearchPayload.commandCenterProgress || createInitialProgress()}
                            report={deepResearchPayload.report}
                            error={deepResearchPayload.error?.message}
                            onCancel={() => handleCancelDeepResearch(msg.id)}
                            onViewReport={() => handleViewDeepResearchReport(msg.response!)}
                            onRetry={() => handleRetryDeepResearch(msg.id, deepResearchQuery)}
                          />
                        )
                      ) : (
                        <AIResponse
                          // 1. Thought Process - only on NEW messages (first render)
                          thoughtProcess={msg.isNew && hasResponse ? {
                            duration: msg.response!.thinkingDuration || '...',
                            milestones: msg.response!.milestones || [],
                            liveMilestones: liveMilestones,
                          } : undefined}
                          // 2. Acknowledgement - show on all responses
                          acknowledgement={hasResponse ? (msg.response?.acknowledgement || undefined) : undefined}
                          // 2.5 Detail Summary - AI-generated overview (from artifactContent or insight.summary)
                          detailSummary={hasResponse ? (msg.response?.artifactContent?.overview || (typeof msg.response?.insight === 'object' && 'summary' in msg.response.insight ? (msg.response.insight as { summary?: string }).summary : undefined)) : undefined}
                          // 3. Widget - PERSIST on all assistant messages with data
                          widgetContext={hasResponse ? {
                            intent: (msg.response!.intent?.category || 'general') as import('./types/intents').IntentCategory,
                            subIntent: msg.response!.intent?.subIntent,
                            portfolio: msg.response!.portfolio,
                            suppliers: msg.response!.suppliers,
                            supplier: msg.response!.suppliers?.[0],
                            riskChanges: msg.response!.riskChanges,
                            widgetData: msg.response!.widget as import('./types/widgets').WidgetData | undefined,
                            artifactContent: msg.response!.artifactContent,
                            renderContext: 'chat' as const,
                            onOpenArtifact: (type: string, payload: Record<string, unknown>) => openArtifact(type as ArtifactType, payload as Partial<ArtifactPayload>),
                          } : undefined}
                          // 4. Insight bar - PERSIST on all responses (pass full ResponseInsight for rich rendering)
                          insight={hasResponse ? msg.response?.insight as ResponseInsight | undefined : undefined}
                          // 5. Sources - PERSIST on all responses (pass even if empty so footer can show Expand to Web)
                          sources={hasResponse && responseSources ? responseSources : undefined}
                          // 6. Follow-ups - ONLY on latest message (avoid duplicate buttons)
                          followUps={showInteractive ? msg.response?.suggestions?.map(s => ({
                            id: s.id,
                            text: s.text,
                            icon: s.icon === 'chart' ? 'chart' as const :
                                  s.icon === 'alert' ? 'alert' as const :
                                  s.icon === 'search' ? 'search' as const :
                                  s.icon === 'document' ? 'document' as const :
                                  s.icon === 'lightbulb' ? 'lightbulb' as const :
                                  s.icon === 'message' ? 'message' as const :
                                  s.icon === 'compare' ? 'compare' as const :
                                  'chat' as const,
                          })) : undefined}
                          onFollowUpClick={handleSuggestionClick}
                          onWidgetExpand={(artifactComponent) => {
                            if (msg.response) {
                              handleWidgetExpand(artifactComponent, msg.response);
                            }
                          }}
                          // 7. Animation - only on NEW messages
                          isAnimating={msg.isNew}
                          // 8. Insight click - open in artifact panel
                          onInsightClick={openInsightPanel}
                          // 9. Value Ladder - Progressive disclosure triggers
                          valueLadder={hasResponse ? msg.response?.canonical?.valueLadder : undefined}
                          onOpenDeeperAnalysis={() => msg.response && handleOpenDeeperAnalysis(msg.response)}
                          onAskAnalyst={() => msg.response && handleAskAnalyst(msg.response)}
                          // 10. Source Enhancement
                          sourceEnhancement={hasResponse ? msg.response?.canonical?.sourceEnhancement : undefined}
                          onSourceEnhancement={(type) => {
                            if (!msg.response) return;
                            switch (type) {
                              case 'add_web':
                                // Enable web search and re-query
                                setWebSearchEnabled(true);
                                console.log('[App] Web search enabled for future queries');
                                break;
                              case 'deep_research':
                                // Switch to reasoning mode for deeper analysis
                                setMode('reasoning');
                                console.log('[App] Switched to reasoning mode');
                                break;
                              case 'analyst':
                                // Open analyst connect artifact
                                handleAskAnalyst(msg.response);
                                break;
                              case 'expert':
                                // Open deeper analysis artifact (has expert option)
                                handleOpenDeeperAnalysis(msg.response);
                                break;
                            }
                          }}
                          // 11. Expand to Web - enable web search and re-fetch response
                          onExpandToWeb={() => {
                            setWebSearchEnabled(true);
                            console.log('[App] Web search enabled via confidence CTA - re-fetching...');
                            // Find the user message that triggered this response
                            const userMessageIndex = index - 1;
                            const userMessage = messages[userMessageIndex];
                            if (userMessage?.role === 'user' && userMessage.content) {
                              // Remove the current AI response and re-fetch with web enabled
                              setMessages(prev => prev.slice(0, index));
                              // Re-fetch with web search enabled
                              fetchAIResponse(userMessage.content, messages.slice(0, userMessageIndex), currentConversationId, undefined, true);
                            }
                          }}
                        >
                          {/* Response content - use canonical ResponseBody if available, fallback to legacy formatMarkdown */}
                          {msg.response?.canonical ? (
                            <ResponseBody
                              canonical={msg.response.canonical}
                              hasWidget={!!msg.response?.widget || !!msg.response?.portfolio || !!msg.response?.suppliers?.length}
                              onSourceClick={(source) => {
                                // Handle source clicks - web sources open in new tab, internal open report viewer
                                if ('url' in source && source.url) {
                                  window.open(source.url, '_blank', 'noopener,noreferrer');
                                } else {
                                  // Internal/Beroe source - open report viewer artifact
                                  const sourceName = 'name' in source ? source.name : ('title' in source ? source.title : 'Source');
                                  const sourceType = 'type' in source ? source.type : 'beroe';
                                  const reportId = 'reportId' in source ? source.reportId : `report-${Date.now()}`;
                                  const category = 'category' in source ? source.category : 'General';
                                  const sourceSummary = 'summary' in source ? source.summary : undefined;

                                  // Get additional report data from registry if available
                                  const registryData = getSourceReportData(sourceName || '');
                                  const summary = sourceSummary || registryData?.summary || `Intelligence data from ${sourceName}`;

                                  openArtifact('report_viewer', {
                                    type: 'report_viewer',
                                    report: {
                                      id: reportId || registryData?.reportId || `report-${Date.now()}`,
                                      title: sourceName || 'Beroe Intelligence Report',
                                      category: category || registryData?.category || 'Market Intelligence',
                                      publishedDate: new Date().toISOString().split('T')[0],
                                      summary,
                                      sections: [
                                        {
                                          title: 'Overview',
                                          content: summary,
                                        },
                                        {
                                          title: 'Data Source',
                                          content: `This intelligence is sourced from ${sourceName} (${sourceType === 'beroe' ? 'Beroe Intelligence' : sourceType}). Data is regularly updated to ensure accuracy and relevance for procurement decisions.`,
                                        },
                                      ],
                                    },
                                  } as ReportViewerPayload);
                                }
                              }}
                            />
                          ) : (
                            <div dangerouslySetInnerHTML={{
                              __html: formatMarkdown(msg.content, !!msg.response?.widget || !!msg.response?.portfolio || !!msg.response?.suppliers?.length)
                            }} />
                          )}

                          {/* Handoff card */}
                          {msg.response?.handoff?.required && (
                            <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                              <p className="text-sm text-violet-800 mb-3">{msg.response.handoff.reason}</p>
                              <button className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
                                {msg.response.handoff.linkText}
                              </button>
                            </div>
                          )}
                        </AIResponse>
                      )}
                    </motion.div>
                  );
                })}

                {/* Live thinking indicator with milestones */}
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <ThoughtProcess
                      duration="..."
                      isThinking={true}
                      liveMilestones={liveMilestones}
                    />
                  </motion.div>
                )}

                {/* Scroll anchor with padding for sticky input */}
                <div ref={messagesEndRef} className="h-24" />
              </div>
            </div>

            {/* Chat input - sticky at bottom with gradient fade */}
            <div className="sticky bottom-0 left-0 right-0 z-20">
              <div className="max-w-3xl mx-auto px-6 pb-4">
                <ChatInput
                  onSend={(msg, _files, _inputMode, _builderMeta, _webSearch, deepResearch) =>
                    handleSendMessage(msg, deepResearch)}
                  mode={mode}
                  webSearchEnabled={webSearchEnabled}
                  deepResearchEnabled={deepResearchEnabled}
                  onModeChange={setMode}
                  onWebSearchChange={setWebSearchEnabled}
                  onDeepResearchChange={handleToggleDeepResearch}
                  disabled={isThinking}
                  variant="compact"
                  sources={{ web: 12, internal: 4 }}
                  creditsAvailable={subscription.remainingCredits}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
      </motion.div>

      {/* Phase 2: Credit Drawer */}
      <CreditDrawer
        isOpen={isCreditDrawerOpen}
        onClose={() => setIsCreditDrawerOpen(false)}
        subscription={subscription}
        slotSummary={MOCK_SLOT_SUMMARY}
        transactions={transactions}
        isLoading={isCreditLoading}
        error={creditError}
        onRetry={refreshCredits}
        onViewAllTransactions={() => {
          setIsCreditDrawerOpen(false);
          // Could navigate to transactions view
        }}
        onManageCategories={() => {
          setIsCreditDrawerOpen(false);
          setViewState('managed-categories');
        }}
        onContactSales={() => {
          console.log('Contact sales clicked');
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onNotificationClick={handleNotificationAction}
      />

      {/* Phase 2: Upgrade Request Modal */}
      <UpgradeRequestForm
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          setUpgradeContext(undefined);
        }}
        onSubmit={async (request) => {
          console.log('[App] Upgrade request submitted:', request);

          // All demo personas are in the same team (Direct Materials)
          // The backend uses the session userId, we just specify company/team for routing
          const response = await submitRequest({
            companyId: DEMO_COMPANY_ID,
            teamId: DEMO_DEFAULT_TEAM_ID,
            type: request.type,
            title: request.title,
            description: request.description,
            context: request.context,
            estimatedCredits: request.estimatedCredits,
          });

          console.log('[App] Request API response:', response);

          // Refresh credits from API to show updated balance/holds
          await refreshCredits();

          // Show notification based on approval level
          const requiresApproval = response.approvalLevel !== 'auto';
          if (requiresApproval) {
            showPending(
              'Request submitted for approval',
              `${request.estimatedCredits} credits reserved. Awaiting team lead approval.`
            );
          } else {
            showSuccess(
              'Request approved',
              `${request.estimatedCredits} credits deducted. Processing your request.`
            );
          }

          setIsUpgradeModalOpen(false);
          setUpgradeContext(undefined);
        }}
        subscription={subscription}
        context={upgradeContext}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Demo mode persona switcher */}
      <PersonaSwitcher />
    </>
  );
}

// Simple markdown formatter
// Strip markdown tables from content (when showing widget instead)
function stripMarkdownTables(text: string): string {
  // Remove markdown table blocks (lines starting with |)
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    // Skip table rows and separator rows
    return !trimmed.startsWith('|') && !trimmed.match(/^\|?[-:]+\|/);
  });
  return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function formatMarkdown(text: string, hasWidget: boolean = false): string {
  // If we have a widget, strip tables from the text
  let processed = hasWidget ? stripMarkdownTables(text) : text;

  // Handle markdown tables (convert to HTML table)
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
  processed = processed.replace(tableRegex, (match, header, body) => {
    const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
    const rows = body.trim().split('\n').map((row: string) =>
      row.split('|').map((cell: string) => cell.trim()).filter(Boolean)
    );

    return `<table class="w-full text-sm border-collapse my-4">
      <thead>
        <tr class="border-b border-slate-200">
          ${headers.map((h: string) => `<th class="text-left py-2 px-3 font-medium text-slate-700">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row: string[]) => `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            ${row.map((cell: string) => `<td class="py-2 px-3 text-slate-600">${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  });

  // First apply number styling BEFORE bold (to avoid matching inside CSS classes)
  // Only match numbers that are: preceded by space/start OR followed by space/end/punctuation
  // Skip numbers that are part of CSS classes (preceded by hyphen like slate-800)
  processed = processed.replace(/(?<![-\w])(\$[\d,.]+[BMK]?|\d{1,3}(?:,\d{3})*(?:\.\d+)?%?)(?![\w-])/g, '<span class="font-medium">$1</span>');

  return processed
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-slate-800">$1</strong>')
    .replace(/\n- /g, '<br/>• ')
    .replace(/\n\* /g, '<br/>• ')
    .replace(/\n/g, '<br/>');
}

// Portfolio Widget
function PortfolioWidget({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-primary">Risk Portfolio Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="text-2xl font-medium text-primary">{portfolio.totalSuppliers}</div>
          <div className="text-sm text-muted">Total Suppliers</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="text-2xl font-medium text-primary">{portfolio.spendFormatted}</div>
          <div className="text-sm text-muted">Total Spend</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: 'High Risk', count: portfolio.distribution.high, color: 'bg-red-500' },
          { label: 'Medium-High', count: portfolio.distribution.mediumHigh, color: 'bg-orange-500' },
          { label: 'Medium', count: portfolio.distribution.medium, color: 'bg-yellow-500' },
          { label: 'Low', count: portfolio.distribution.low, color: 'bg-green-500' },
          { label: 'Unrated', count: portfolio.distribution.unrated, color: 'bg-gray-300' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="font-medium">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Supplier Table Widget
function SupplierTableWidget({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-primary">Suppliers ({suppliers.length})</h3>
      <div className="space-y-2">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-primary">{supplier.name}</div>
                <div className="text-xs text-muted">{supplier.category} · {supplier.location?.country}</div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${
                  supplier.srs?.level === 'high' ? 'text-red-600' :
                  supplier.srs?.level === 'medium-high' ? 'text-orange-600' :
                  supplier.srs?.level === 'medium' ? 'text-yellow-600' :
                  supplier.srs?.level === 'low' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {supplier.srs?.score || '—'}
                </div>
                <div className="text-xs text-muted">{supplier.spendFormatted}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Supplier Detail Widget
function SupplierDetailWidget({ supplier }: { supplier: Supplier }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-primary">{supplier.name}</h3>
        <p className="text-sm text-muted">{supplier.category} · {supplier.location?.city}, {supplier.location?.country}</p>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl text-center">
        <div className={`text-4xl font-medium ${
          supplier.srs?.level === 'high' ? 'text-red-600' :
          supplier.srs?.level === 'medium-high' ? 'text-orange-600' :
          supplier.srs?.level === 'medium' ? 'text-yellow-600' :
          supplier.srs?.level === 'low' ? 'text-green-600' : 'text-gray-400'
        }`}>
          {supplier.srs?.score || '—'}
        </div>
        <div className="text-sm text-muted capitalize">{supplier.srs?.level?.replace('-', ' ')} Risk</div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="text-muted">Your Spend</span>
          <span className="font-medium">{supplier.spendFormatted}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="text-muted">Trend</span>
          <span className="font-medium capitalize">{supplier.srs?.trend}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-muted">Last Updated</span>
          <span className="font-medium">{supplier.srs?.lastUpdated}</span>
        </div>
      </div>
      <button className="w-full py-2 px-4 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium">
        View Full Profile in Dashboard
      </button>
    </div>
  );
}

// Helper to generate title
const generateTitle = (question: string): string => {
  const cleaned = question
    .replace(/^(what'?s?|who|how|where|when|why|can you|could you|please|help me)/i, '')
    .replace(/\?$/, '')
    .trim();

  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return title.length > 50 ? title.substring(0, 47) + '...' : title;
};

export default App;
