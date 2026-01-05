// LiveChatView - Chat view with real AI integration
// Drop this in when you're ready to wire up the AI
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMessage } from '../components/chat/UserMessage';
import { AIResponse } from '../components/chat/AIResponse';
import { ChatInput } from '../components/chat/ChatInput';
import type { AIResponse as AIResponseType, ThinkingMode } from '../services/ai';
import { sendMessage } from '../services/ai';
import type { ChatMessage } from '../types/chat';
import { generateId } from '../types/chat';
import type { Supplier } from '../types/supplier';
import { buildResponseSources } from '../utils/sources';

interface LiveChatViewProps {
  initialQuestion?: string;
  onArtifactChange?: (artifact: AIResponseType['artifact'], suppliers?: Supplier[], portfolio?: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AIResponseType;
}

export const LiveChatView = ({ initialQuestion, onArtifactChange }: LiveChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<ThinkingMode>('fast');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle initial question
  useEffect(() => {
    if (initialQuestion && !hasInitialized.current) {
      hasInitialized.current = true;
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // Build conversation history for context
      const history: ChatMessage[] = messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(),
      }));

      // Call AI
      const response = await sendMessage(content, {
        mode,
        webSearchEnabled,
        conversationHistory: history,
      });

      // Add AI response
      const aiMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        response,
      };
      setMessages(prev => [...prev, aiMessage]);

      // Notify parent about artifact
      if (response.artifact && response.artifact.type !== 'none') {
        onArtifactChange?.(response.artifact, response.suppliers, response.portfolio);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (item: { text: string }) => {
    handleSendMessage(item.text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                {msg.role === 'user' ? (
                  <UserMessage message={msg.content} initial="S" />
                ) : (
                  <AIResponse
                    thoughtProcess={msg.response?.thinkingSteps ? {
                      duration: msg.response.thinkingDuration || '2s',
                      content: {
                        queryAnalysis: {
                          commodity: msg.response.intent?.category.replace('_', ' ') || 'Analysis',
                          informationNeeded: msg.response.thinkingSteps[0]?.content,
                        },
                        searchStrategy: msg.response.thinkingSteps[1] ? {
                          priority: msg.response.thinkingSteps[1].title,
                          bullets: [msg.response.thinkingSteps[1].content],
                        } : undefined,
                      },
                    } : undefined}
                    // Widget context for WidgetRenderer - enables context-based widget selection
                    widgetContext={msg.response ? {
                      intent: msg.response.intent?.category || 'general',
                      portfolio: msg.response.portfolio,
                      suppliers: msg.response.suppliers,
                      supplier: msg.response.suppliers?.[0],
                      riskChanges: msg.response.riskChanges,
                      widgetData: msg.response.widget,
                      renderContext: 'chat',
                    } : undefined}
                    insight={msg.response?.insight}
                    sources={(() => {
                      if (!msg.response?.sources?.length) return undefined;
                      const responseSources = buildResponseSources(msg.response.sources);
                      return responseSources.totalWebCount > 0 || responseSources.totalInternalCount > 0
                        ? responseSources
                        : undefined;
                    })()}
                    followUps={msg.response?.suggestions?.map(s => ({
                      id: s.id,
                      text: s.text,
                      icon: mapIcon(s.icon),
                    }))}
                    onFollowUpClick={handleSuggestionClick}
                  >
                    <div
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                    />

                    {/* Handoff card if needed */}
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
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 mt-2"
            >
              <motion.div
                className="w-2 h-2 bg-violet-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 bg-violet-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-violet-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input at bottom */}
      <div className="sticky bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <ChatInput
            onSend={(msg) => handleSendMessage(msg)}
            mode={mode}
            webSearchEnabled={webSearchEnabled}
            onModeChange={setMode}
            onWebSearchChange={setWebSearchEnabled}
            disabled={isThinking}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );
};

// Helper to format markdown
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br />')
    .replace(/^(.*)$/, '<p class="mb-3">$1</p>');
}

// Map icon string to allowed icon types
function mapIcon(icon: string): 'lightbulb' | 'message' | 'document' {
  switch (icon) {
    case 'chart':
    case 'lightbulb':
    case 'alert':
      return 'lightbulb';
    case 'search':
    case 'compare':
    case 'document':
      return 'document';
    default:
      return 'message';
  }
}

export default LiveChatView;
