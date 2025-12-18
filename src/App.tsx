import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from './components/layout/MainLayout';
import { ArtifactPanel } from './components/panel/ArtifactPanel';
import { HomeView } from './views/HomeView';
import { UserMessage } from './components/chat/UserMessage';
import { AIResponse } from './components/chat/AIResponse';
import { ChatInput } from './components/chat/ChatInput';
import { ThoughtProcess } from './components/chat/ThoughtProcess';
import {
  RiskDistributionChart,
  SupplierMiniTable,
  SupplierRiskCard,
  RiskChangeAlert,
  TrendChangeIndicator,
  HandoffCard,
  PortfolioOverviewCard,
} from './components/risk';
import type { AIResponse as AIResponseType } from './services/ai';
import { sendMessage } from './services/ai';
import './App.css';

type ViewState = 'home' | 'chat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AIResponseType;
  isNew?: boolean; // Flag to trigger staggered animation
}

function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<'fast' | 'reasoning'>('fast');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<AIResponseType['artifact'] | null>(null);
  const [artifactData, setArtifactData] = useState<{ suppliers?: any[]; portfolio?: any } | null>(null);

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

  // Handle starting a chat from home
  const handleStartChat = (question: string) => {
    setConversationTitle(generateTitle(question));
    setIsTransitioning(true);

    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages([userMsg]);

    // Switch to chat view after fade
    setTimeout(() => {
      setViewState('chat');
      setIsTransitioning(false);
      // Fetch AI response
      fetchAIResponse(question, []);
    }, 400);
  };

  // Fetch AI response
  const fetchAIResponse = async (question: string, history: Message[]) => {
    console.log('[App] fetchAIResponse called with:', question);
    setIsThinking(true);

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

      // Clear isNew flag after animation completes (~4s)
      setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === response.id ? { ...m, isNew: false } : m
        ));
      }, 4000);

      // Handle artifact based on escalation logic
      if (response.artifact && response.artifact.type !== 'none') {
        setCurrentArtifact(response.artifact);
        setArtifactData({
          suppliers: response.suppliers,
          portfolio: response.portfolio,
        });
        // Only auto-open panel if escalation says to expand to artifact
        if (response.escalation?.expandToArtifact) {
          setIsPanelOpen(true);
        }
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
    setMessages([]);
    setIsThinking(false);
    setCurrentArtifact(null);
    setArtifactData(null);
    setIsPanelOpen(false);
  };

  // Render widget based on response type and data
  const renderResponseWidget = (msg: Message) => {
    const response = msg.response;
    if (!response) return undefined;

    const { responseType, portfolio, suppliers, handoff, intent } = response;

    // 1. Portfolio overview - show risk distribution chart
    if (portfolio && (responseType === 'widget' || intent?.category === 'portfolio_overview')) {
      return (
        <RiskDistributionChart
          distribution={portfolio.distribution}
          totalSuppliers={portfolio.totalSuppliers}
        />
      );
    }

    // 2. Handoff response - show handoff card
    if (responseType === 'handoff' && handoff) {
      return (
        <HandoffCard
          title="View in Dashboard"
          description={handoff.reason}
          linkText={handoff.linkText}
          linkUrl={handoff.url || '/dashboard'}
          restrictions={['Some data comes from partners with viewing restrictions']}
        />
      );
    }

    // 3. Alert/Trend response - show risk change alerts
    if (responseType === 'alert' && intent?.category === 'trend_detection') {
      // Extract risk changes from content or use mock
      return (
        <div className="space-y-3">
          <RiskChangeAlert
            supplierName="Apple Inc."
            previousScore={72}
            currentScore={85}
            currentLevel="High Risk"
            changeDate="3 days ago"
          />
          <RiskChangeAlert
            supplierName="Queen Cleaners Inc"
            previousScore={58}
            currentScore={41}
            currentLevel="Medium Risk"
            changeDate="7 days ago"
          />
        </div>
      );
    }

    // 4. Single supplier deep dive - show detailed risk card
    if (suppliers && suppliers.length === 1) {
      const s = suppliers[0];
      return (
        <SupplierRiskCard
          name={s.name}
          score={s.srs?.score || 0}
          level={s.srs?.level as any}
          trend={s.srs?.trend as any}
          category={s.category}
          location={`${s.location?.city}, ${s.location?.country}`}
          spend={s.spendFormatted}
          variant="standard"
        />
      );
    }

    // 5. Supplier list/table - show mini table
    if (suppliers && suppliers.length > 1 && (responseType === 'table' || intent?.category === 'filtered_discovery')) {
      return (
        <SupplierMiniTable
          suppliers={suppliers.slice(0, 5).map(s => ({
            id: s.id,
            name: s.name,
            score: s.srs?.score || null,
            level: s.srs?.level as any,
            trend: s.srs?.trend as any,
            category: s.category,
          }))}
          maxRows={5}
          onRowClick={(supplier) => console.log('Clicked supplier:', supplier.name)}
        />
      );
    }

    // 6. Comparison - show comparison table
    if (suppliers && suppliers.length > 1 && intent?.category === 'comparison') {
      return (
        <SupplierMiniTable
          suppliers={suppliers.map(s => ({
            id: s.id,
            name: s.name,
            score: s.srs?.score || null,
            level: s.srs?.level as any,
            trend: s.srs?.trend as any,
            category: s.category,
          }))}
          maxRows={5}
          onRowClick={(supplier) => console.log('Compare supplier:', supplier.name)}
        />
      );
    }

    return undefined;
  };

  // Background opacity: 100 for home, 10 for chat/transitioning
  const backgroundOpacity = viewState === 'home' && !isTransitioning ? 100 : 10;

  // Header variant
  const headerVariant = viewState === 'home' && !isTransitioning ? 'home' : 'conversation';

  return (
    <MainLayout
      headerVariant={headerVariant}
      conversationTitle={conversationTitle}
      backgroundOpacity={backgroundOpacity}
      isHeaderLoading={isTransitioning || isThinking}
      fileCount={0}
      artifactCount={currentArtifact ? 1 : 0}
      onNewChat={handleNewChat}
      panel={
        <ArtifactPanel
          isOpen={isPanelOpen}
          title={currentArtifact?.title || 'Results'}
          onClose={() => setIsPanelOpen(false)}
          isExpanded={false}
          onToggleExpand={() => { }}
        >
          <div className="p-6">
            {currentArtifact?.type === 'portfolio_dashboard' && artifactData?.portfolio && (
              <PortfolioWidget portfolio={artifactData.portfolio} />
            )}
            {currentArtifact?.type === 'supplier_table' && artifactData?.suppliers && (
              <SupplierTableWidget suppliers={artifactData.suppliers} />
            )}
            {currentArtifact?.type === 'supplier_detail' && artifactData?.suppliers?.[0] && (
              <SupplierDetailWidget supplier={artifactData.suppliers[0]} />
            )}
            {!currentArtifact && (
              <div className="text-center text-muted py-8">
                No artifact to display
              </div>
            )}
          </div>
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
                  // Only show follow-ups, insight, sources for the LAST assistant message
                  const isLastAssistantMessage = msg.role === 'assistant' &&
                    index === messages.length - 1 ||
                    (index === messages.length - 2 && messages[messages.length - 1]?.role === 'user');
                  const showExtras = isLastAssistantMessage && !isThinking;

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
                          // 1. Thought Process - show demo if no real data
                          thoughtProcess={showExtras ? {
                            duration: msg.response?.thinkingDuration || '2min',
                            content: msg.response?.thinkingSteps ? {
                              queryAnalysis: {
                                commodity: msg.response.intent?.category?.replace(/_/g, ' ') || 'Risk Analysis',
                                informationNeeded: msg.response.thinkingSteps[0]?.content || 'Analyzing supplier risk data',
                                timeSensitivity: 'Standard',
                                depthRequired: 'Comprehensive portfolio analysis',
                              },
                            } : {
                              queryAnalysis: {
                                commodity: 'Supplier Risk Portfolio',
                                informationNeeded: 'Risk distribution, high-risk suppliers, trends',
                                timeSensitivity: 'Standard',
                                depthRequired: 'Portfolio-level analysis',
                              },
                            },
                          } : undefined}
                          // 2. Acknowledgement header
                          acknowledgement={showExtras ? (msg.response?.acknowledgement || undefined) : undefined}
                          // 3. Widget - render based on response type
                          widget={showExtras ? renderResponseWidget(msg) : undefined}
                          // 4. Insight bar
                          insight={showExtras && msg.response?.insight ? {
                            text: typeof msg.response.insight === 'string'
                              ? msg.response.insight
                              : msg.response.insight.text || msg.response.insight.headline,
                            detail: typeof msg.response.insight === 'object' ? msg.response.insight.detail : undefined,
                            trend: typeof msg.response.insight === 'object' ? msg.response.insight.trend : undefined,
                          } : undefined}
                          // 5. Sources - proper format
                          sources={showExtras ? {
                            webPages: msg.response?.sources?.filter((s: any) => s.type === 'web').length || 12,
                            dataSources: msg.response?.sources?.filter((s: any) => s.type !== 'web').length || 4,
                            dataSourceName: 'Beroe Data Sources',
                          } : undefined}
                          // 6. Follow-ups
                          followUps={showExtras ? msg.response?.suggestions?.map(s => ({
                            id: s.id,
                            text: s.text,
                            icon: s.icon === 'chart' ? 'chart' as const :
                                  s.icon === 'alert' ? 'alert' as const :
                                  s.icon === 'search' ? 'search' as const :
                                  s.icon === 'document' ? 'document' as const :
                                  'chat' as const,
                          })) : undefined}
                          onFollowUpClick={handleSuggestionClick}
                          // 7. Animation - trigger staggered entrance for new messages
                          isAnimating={msg.isNew && showExtras}
                        >
                          <div dangerouslySetInnerHTML={{
                            __html: formatMarkdown(msg.content, !!renderResponseWidget(msg))
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

  return processed
    .replace(/\*\*(.*?)\*\*/g, '<span class="font-medium text-slate-800">$1</span>')
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
