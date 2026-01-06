import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from './components/layout/MainLayout';
import { ArtifactPanel } from './components/panel/ArtifactPanel';
import { InsightDetailArtifact } from './components/panel/InsightDetailArtifact';
import { HomeView } from './views/HomeView';
import { ChatHistoryView } from './views/ChatHistoryView';
import { CommunityView } from './views/CommunityView';
import { QuestionDetailView } from './views/QuestionDetailView';
import { AskQuestionView } from './views/AskQuestionView';
import { useSession } from './hooks/useSession';
import { usePreloader } from './hooks/usePreloader';
import { Preloader } from './components/Preloader';
import { UserMessage } from './components/chat/UserMessage';
import { AIResponse } from './components/chat/AIResponse';
import { ChatInput, type BuilderMetadata } from './components/chat/ChatInput';
import { ThoughtProcess, buildThoughtContent } from './components/chat/ThoughtProcess';
import { PortfolioOverviewCard } from './components/risk';
import type { AIResponse as AIResponseType, Milestone } from './services/ai';
import { sendMessage } from './services/ai';
import { buildResponseSources } from './utils/sources';
import { buildArtifactPayload, resolveArtifactType } from './services/artifactBuilder';
// Artifact system imports
import { ArtifactRenderer } from './components/artifacts/ArtifactRenderer';
import type { ArtifactType, ArtifactPayload } from './components/artifacts/registry';
import { getArtifactTitle, getArtifactMeta } from './components/artifacts/registry';
import './App.css';

type ViewState = 'home' | 'chat' | 'history' | 'community' | 'community-detail' | 'ask-question';

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

function App() {
  // Preloader state
  const { phase, progress, isDone, isExiting } = usePreloader();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Auth session
  const { isAuthenticated, userId, permissions } = useSession();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [liveMilestones, setLiveMilestones] = useState<Milestone[]>([]);
  const [mode, setMode] = useState<'fast' | 'reasoning'>('fast');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<AIResponseType['artifact'] | null>(null);
  const [artifactData, setArtifactData] = useState<{ suppliers?: any[]; portfolio?: any; insight?: any } | null>(null);

  // New artifact system state
  const [artifactType, setArtifactType] = useState<ArtifactType | null>(null);
  const [artifactPayload, setArtifactPayload] = useState<ArtifactPayload | null>(null);

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
  const openInsightPanel = (insightData: any) => {
    setArtifactType('insight_detail');
    setArtifactPayload({ type: 'insight_detail', data: insightData });
    setCurrentArtifact({ type: 'insight_detail', title: 'Insight Details' });
    setArtifactData({ insight: insightData });
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
          const sourceSuppliers = (artifactPayload as any)?.sourceSuppliers;
          const sourceRiskChanges = (artifactPayload as any)?.sourceRiskChanges;
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
      default:
        console.log('Unhandled action:', action);
    }
  };

  // Handle starting a chat from home
  const handleStartChat = async (question: string, builderMeta?: BuilderMetadata) => {
    const title = generateTitle(question);
    setConversationTitle(title);
    setIsTransitioning(true);

    // Add user message immediately (optimistic UI)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages([userMsg]);

    // Create conversation and save user message in background
    let convId: string | null = null;
    try {
      const conv = await createConversation(title);
      convId = conv.id;
      setCurrentConversationId(conv.id);
      // Save the initial user message
      await saveMessage(conv.id, 'user', question);
    } catch (err) {
      console.error('[App] Failed to persist conversation:', err);
      // Continue anyway - chat works without persistence
    }

    // Switch to chat view after fade
    setTimeout(() => {
      setViewState('chat');
      setIsTransitioning(false);
      // Fetch AI response - pass builder metadata for deterministic intent
      fetchAIResponse(question, [], convId, builderMeta);
    }, 400);
  };

  // Fetch AI response
  const fetchAIResponse = async (question: string, history: Message[], convId?: string | null, builderMeta?: BuilderMetadata) => {
    console.log('[App] fetchAIResponse called with:', question, 'builderMeta:', builderMeta);
    setIsThinking(true);
    setLiveMilestones([]); // Clear previous milestones

    // Use provided convId or fall back to state
    const conversationId = convId ?? currentConversationId;

    try {
      console.log('[App] Calling sendMessage...');
      const response = await sendMessage(question, {
        mode,
        webSearchEnabled,
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
  const handleSendMessage = (content: string) => {
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

    fetchAIResponse(content, [...messages, userMsg]);
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
      const loadedMessages: Message[] = data.messages.map((m: any) => ({
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
        } : undefined,
        isNew: false,
      }));

      setMessages(loadedMessages);
      setViewState('chat');
    } catch (err) {
      console.error('[App] Failed to load conversation:', err);
    }
  };

  // Background opacity: 100 for home, 30 for history/community, 10 for chat/transitioning
  const backgroundOpacity = viewState === 'home' && !isTransitioning
    ? 100
    : (viewState === 'history' || viewState === 'community' || viewState === 'community-detail')
      ? 30
      : 10;

  // Header variant
  const headerVariant = (viewState === 'home' || viewState === 'history' || viewState === 'community' || viewState === 'community-detail') && !isTransitioning ? 'home' : 'conversation';

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
          onNewChat={handleNewChat}
          onNavigateToHistory={handleNavigateToHistory}
          onNavigateToCommunity={handleNavigateToCommunity}
          isArtifactExpanded={isArtifactExpanded}
          panel={
        <ArtifactPanel
          isOpen={isPanelOpen}
          title={artifactType ? getArtifactTitle(artifactType) : (currentArtifact?.title || 'Results')}
          onClose={handleClosePanel}
          isExpanded={isArtifactExpanded}
          onToggleExpand={() => setIsArtifactExpanded(!isArtifactExpanded)}
          defaultWidth={artifactType ? getArtifactMeta(artifactType).defaultWidth : '40%'}
          allowExpand={artifactType ? getArtifactMeta(artifactType).allowExpand : true}
        >
          {/* Use new ArtifactRenderer when artifactType is set */}
          {artifactType && artifactPayload ? (
            <ArtifactRenderer
              type={artifactType}
              payload={artifactPayload}
              isExpanded={isArtifactExpanded}
              onClose={handleClosePanel}
              onAction={handleArtifactAction}
            />
          ) : (
            <div className="p-6">
              {/* Legacy artifact rendering for backwards compatibility */}
              {currentArtifact?.type === 'portfolio_dashboard' && artifactData?.portfolio && (
                <PortfolioWidget portfolio={artifactData.portfolio} />
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

                  const responseSources = msg.response?.sources
                    ? buildResponseSources(msg.response.sources)
                    : null;
                  const hasSources = responseSources
                    ? responseSources.totalWebCount > 0 || responseSources.totalInternalCount > 0
                    : false;

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
                          detailSummary={hasResponse ? (msg.response?.artifactContent?.overview || (typeof msg.response?.insight === 'object' && 'summary' in msg.response.insight ? msg.response.insight.summary : undefined)) : undefined}
                          // 3. Widget - PERSIST on all assistant messages with data
                          widgetContext={hasResponse ? {
                            intent: msg.response!.intent?.category || 'general',
                            subIntent: msg.response!.intent?.subIntent,
                            portfolio: msg.response!.portfolio,
                            suppliers: msg.response!.suppliers,
                            supplier: msg.response!.suppliers?.[0],
                            riskChanges: msg.response!.riskChanges,
                            widgetData: msg.response!.widget,
                            artifactContent: msg.response!.artifactContent,
                            renderContext: 'chat',
                            onOpenArtifact: (type, payload) => openArtifact(type as ArtifactType, payload as Partial<ArtifactPayload>),
                          } : undefined}
                          // 4. Insight bar - PERSIST on all responses (pass full ResponseInsight for rich rendering)
                          insight={hasResponse ? msg.response?.insight : undefined}
                          // 5. Sources - PERSIST on all responses
                          sources={hasResponse && hasSources ? responseSources : undefined}
                          // 6. Follow-ups - ONLY on latest message (avoid duplicate buttons)
                          followUps={showInteractive ? msg.response?.suggestions?.map(s => ({
                            id: s.id,
                            text: s.text,
                            icon: s.icon === 'chart' ? 'chart' as const :
                                  s.icon === 'alert' ? 'alert' as const :
                                  s.icon === 'search' ? 'search' as const :
                                  s.icon === 'document' ? 'document' as const :
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
                        >
                          <div dangerouslySetInnerHTML={{
                            __html: formatMarkdown(msg.content, !!msg.response?.widget || !!msg.response?.portfolio || !!msg.response?.suppliers?.length)
                          }} />

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

                {/* Minimal loading indicator while waiting for API */}
                {isThinking && (
                  <motion.div
                    className="flex items-center gap-2 text-slate-500 text-sm py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                    <span>Thinking...</span>
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
                  onSend={(msg) => handleSendMessage(msg)}
                  mode={mode}
                  webSearchEnabled={webSearchEnabled}
                  onModeChange={setMode}
                  onWebSearchChange={setWebSearchEnabled}
                  disabled={isThinking}
                  variant="compact"
                  sources={{ web: 12, internal: 4 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
      </motion.div>
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
          ${headers.map((h: string) => `<th class="text-left py-2 px-3 font-semibold text-slate-700">${h}</th>`).join('')}
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
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
    .replace(/\n- /g, '<br/>• ')
    .replace(/\n\* /g, '<br/>• ')
    .replace(/\n/g, '<br/>');
}

// Portfolio Widget
function PortfolioWidget({ portfolio }: { portfolio: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Risk Portfolio Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-primary">{portfolio.totalSuppliers}</div>
          <div className="text-sm text-muted">Total Suppliers</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-primary">{portfolio.totalSpendFormatted}</div>
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
function SupplierTableWidget({ suppliers }: { suppliers: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Suppliers ({suppliers.length})</h3>
      <div className="space-y-2">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-primary">{supplier.name}</div>
                <div className="text-xs text-muted">{supplier.category} · {supplier.location?.country}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${
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
function SupplierDetailWidget({ supplier }: { supplier: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">{supplier.name}</h3>
        <p className="text-sm text-muted">{supplier.category} · {supplier.location?.city}, {supplier.location?.country}</p>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl text-center">
        <div className={`text-4xl font-bold ${
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
