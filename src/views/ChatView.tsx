import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '../components/layout/MainLayout';
import { ChatInput } from '../components/chat/ChatInput';
import { UserMessage } from '../components/chat/UserMessage';
import { AIResponse, Highlight } from '../components/chat/AIResponse';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    isLatest?: boolean;
}

const demoThoughtProcess = {
    duration: '2min',
    content: {
        queryAnalysis: {
            commodity: 'Lithium carbonate',
            informationNeeded: 'Pricing (current), Supply dynamics (factors), Outlook (forecast)',
            timeSensitivity: 'High - user needs "current" data',
            depthRequired: 'Comprehensive - multiple aspects requested',
        },
        searchStrategy: {
            priority: 'Priority 1 - Beroe Intelligence:',
            bullets: [
                'Check Beroe Lithium Market Reports (Q4 2024)',
                'Look for: pricing data, capacity analysis, forecast models',
                'Advantage: Beroe has deep commodity intelligence with historical context',
            ],
        },
        informationRetrieval: {
            sources: [
                'Beroe Lithium Market Report Q4 2024 (comprehensive)',
                'Reuters commodity pricing (Nov 15, 2024)',
                'Bloomberg energy analysis (Nov 18, 2024)',
                'S&P Global supply forecasts (Nov 17, 2024)',
            ],
            dataQuality: 'All sources current (within 10 days), authoritative publishers',
        },
    },
};

const demoFollowUps = [
    { id: '1', text: 'Show me my high-risk suppliers.', icon: 'alert' as const },
    { id: '2', text: "Why did Apple Inc.'s risk score increase?", icon: 'chat' as const },
    { id: '3', text: 'How can I get risk ratings for my unrated suppliers?', icon: 'search' as const },
];

interface ChatViewProps {
    userQuestion?: string;
}

export const ChatView = ({ userQuestion = "Give me a summary of my supplier risk portfolio." }: ChatViewProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', type: 'user', content: userQuestion },
        { id: '2', type: 'ai', content: 'initial', isLatest: true },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages are added or loading state changes
    useEffect(() => {
        // Small delay to ensure DOM has updated
        const timer = setTimeout(() => {
            if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    const handleFollowUpClick = (item: { id: string; text: string }) => {
        const newUserMessage: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: item.text,
        };

        // Single state update: mark all as not latest AND add new user message
        setMessages(prev => [
            ...prev.map(msg => ({ ...msg, isLatest: false })),
            newUserMessage
        ]);

        // Simulate AI response loading
        setIsLoading(true);
        setTimeout(() => {
            const newAiMessage: Message = {
                id: `ai-${Date.now()}`,
                type: 'ai',
                content: item.text,
                isLatest: true,
            };
            setMessages(prev => [...prev, newAiMessage]);
            setIsLoading(false);
        }, 1500);
    };

    const handleSend = (message: string) => {
        if (!message.trim()) return;

        const newUserMessage: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: message,
        };

        // Single state update: mark all as not latest AND add new user message
        setMessages(prev => [
            ...prev.map(msg => ({ ...msg, isLatest: false })),
            newUserMessage
        ]);

        // Simulate AI response
        setIsLoading(true);
        setTimeout(() => {
            const newAiMessage: Message = {
                id: `ai-${Date.now()}`,
                type: 'ai',
                content: message,
                isLatest: true,
            };
            setMessages(prev => [...prev, newAiMessage]);
            setIsLoading(false);
        }, 1500);
    };

    // Render AI response content based on the message
    const renderAIContent = (message: Message) => {
        // Initial response
        if (message.content === 'initial') {
            return (
                <>
                    <p className="mb-6">
                        You are currently monitoring <Highlight>14 suppliers</Highlight> with a total spend of <Highlight>$10.0B</Highlight>.
                    </p>

                    <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Risk Breakdown:</h4>
                        <ul className="space-y-1.5 text-[15px]" style={{ color: '#1D1D1D' }}>
                            <li>• 2 suppliers are High Risk</li>
                            <li>• 1 supplier is Medium-High Risk</li>
                            <li>• 2 suppliers are Medium Risk</li>
                            <li>• 1 supplier is Low Risk</li>
                            <li>• 8 suppliers are Unrated</li>
                        </ul>
                    </div>

                    <p>
                        Your high-risk suppliers are <Highlight>Apple Inc.</Highlight> and <Highlight>Coca Cola Corp</Highlight>. Apple Inc.'s risk score recently worsened from 72 to 85, while Queen Cleaners' risk score improved from 58 to 41.
                    </p>
                </>
            );
        }

        // Response for "Show me my high-risk suppliers"
        if (message.content.toLowerCase().includes('high-risk')) {
            return (
                <>
                    <p className="mb-6">
                        You have <Highlight>2 high-risk suppliers</Highlight> in your portfolio:
                    </p>
                    <div className="mb-6">
                        <div className="space-y-3">
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">Apple Inc.</span>
                                    <span className="text-sm font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">SRS: 85</span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">Score increased from 72 → 85 in the last 30 days</p>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">Coca Cola Corp</span>
                                    <span className="text-sm font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">SRS: 85</span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">Consistent high risk level over the past 90 days</p>
                            </div>
                        </div>
                    </div>
                    <p>
                        Both suppliers are in your <Highlight>Electronics</Highlight> category and represent <Highlight>$2.4B</Highlight> in annual spend.
                    </p>
                </>
            );
        }

        // Default response for any other question
        return (
            <p>
                I understand you're asking about "{message.content}". Let me analyze your supplier portfolio to provide relevant insights.
            </p>
        );
    };

    // Get follow-ups based on AI message content
    const getFollowUps = (message: Message) => {
        if (message.content === 'initial') {
            return demoFollowUps;
        }
        if (message.content.toLowerCase().includes('high-risk')) {
            return [
                { id: '1', text: 'Find alternatives for Apple Inc.', icon: 'search' as const },
                { id: '2', text: 'What factors contributed to their high risk scores?', icon: 'chat' as const },
                { id: '3', text: 'Compare these suppliers side by side', icon: 'chart' as const },
            ];
        }
        return [
            { id: '1', text: 'Tell me more about this', icon: 'chat' as const },
            { id: '2', text: 'Show related suppliers', icon: 'search' as const },
        ];
    };

    return (
        <MainLayout
            headerVariant="conversation"
            conversationTitle="Supplier risk portfolio summary"
            fileCount={6}
            artifactCount={4}
        >
            <div ref={scrollRef} className="max-w-3xl mx-auto px-4 py-6">
                <AnimatePresence mode="sync">
                    {messages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            {message.type === 'user' ? (
                                <UserMessage
                                    message={message.content}
                                    initial="S"
                                />
                            ) : (
                                <AIResponse
                                    thoughtProcess={message.isLatest ? demoThoughtProcess : undefined}
                                    insight={message.isLatest ? {
                                        text: "Portfolio shows limited risk visibility: Over half of suppliers are unrated, limiting risk assessment",
                                    } : undefined}
                                    sources={message.isLatest ? { webPages: 22, dataSources: 4, dataSourceName: 'Beroe Data Sources' } : undefined}
                                    followUps={message.isLatest ? getFollowUps(message) : undefined}
                                    onFollowUpClick={handleFollowUpClick}
                                    onFeedback={(type) => console.log('Feedback:', type)}
                                    onDownload={() => console.log('Download')}
                                    onRefresh={() => console.log('Refresh')}
                                >
                                    {renderAIContent(message)}
                                </AIResponse>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading state */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 py-4 text-slate-400"
                    >
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm">Thinking...</span>
                    </motion.div>
                )}

                {/* Scroll anchor - extra padding for sticky input */}
                <div ref={bottomRef} className="h-32" />
            </div>

            {/* Sticky Chat Input at bottom */}
            <div className="sticky bottom-0 left-0 right-0 z-20">
                <div className="max-w-3xl mx-auto px-4 pb-4">
                    <ChatInput
                        onSend={handleSend}
                        variant="compact"
                        sources={{ web: 12, internal: 4 }}
                    />
                </div>
            </div>
        </MainLayout>
    );
};
