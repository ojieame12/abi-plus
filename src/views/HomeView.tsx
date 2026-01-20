import { useState, type ComponentProps } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInput, type BuilderMetadata } from '../components/chat/ChatInput';

interface HomeViewProps {
    onOpenArtifact: () => void;
    onStartChat?: (question: string, builderMeta?: BuilderMetadata) => void;
    isTransitioning?: boolean;
    selectedQuestion?: string;
}

type TabType = 'recommended' | 'portfolio' | 'alerts' | 'actions';

const TAB_SUGGESTIONS: Record<TabType, string[]> = {
    recommended: [
        "What is the price trend for Corrugated Boxes in Europe?",
        "Show suppliers with recent risk changes in Packaging",
        "How is steel price volatility affecting my portfolio?",
    ],
    portfolio: [
        "Which commodity categories have the highest inflation?",
        "Show my supplier exposure in Asia Pacific",
        "What's the price forecast for aluminum this quarter?",
    ],
    alerts: [
        "Any price spikes above 5% this month?",
        "Which suppliers requested price increases above market?",
        "Show commodities with significant price movements",
    ],
    actions: [
        "Help me validate a 12% price increase request",
        "Find alternatives for high-risk packaging suppliers",
        "Create a scenario for 15% steel price increase",
    ],
};

export const HomeView = ({ onStartChat, isTransitioning = false, selectedQuestion = '' }: HomeViewProps) => {
    const [inputMessage, setInputMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('recommended');

    const isTyping = inputMessage.length > 0;

    type ChatInputOnSend = NonNullable<ComponentProps<typeof ChatInput>['onSend']>;
    const handleSend: ChatInputOnSend = (message, files, inputMode, builderMeta) => {
        console.log('Send:', message, files, 'mode:', inputMode, 'builderMeta:', builderMeta);
        if (message.trim()) {
            // TODO: Handle 'find' mode differently - show search results view
            onStartChat?.(message, builderMeta);
        }
    };

    const handleQuestionClick = (question: string) => {
        setInputMessage(question);
    };

    return (
        <motion.div
            className="flex flex-col h-full w-full relative z-10 overflow-auto"
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Centered Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                {/* Logo/Icon */}
                <motion.div
                    className="mb-6"
                    animate={{
                        opacity: isTransitioning ? 0 : 1,
                        scale: isTransitioning ? 0.8 : 1
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <img src="/Featured icon.svg" alt="Abi" className="w-14 h-14" />
                </motion.div>

                {/* Greeting */}
                <motion.h1
                    className="text-4xl md:text-5xl font-medium text-primary mb-10 text-center"
                    animate={{
                        opacity: isTransitioning ? 0 : 1,
                        y: isTransitioning ? -20 : 0
                    }}
                    transition={{ duration: 0.3 }}
                >
                    Good Morning, <span className="text-secondary">Stephen</span>
                </motion.h1>

                {/* Chat Input */}
                <motion.div
                    className="w-full max-w-[680px] mb-6"
                    animate={{
                        opacity: isTransitioning ? 0 : 1,
                        y: isTransitioning ? 20 : 0
                    }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                >
                    <ChatInput
                        value={inputMessage}
                        onSend={handleSend}
                        onMessageChange={setInputMessage}
                        showModeToggle={true}
                    />
                </motion.div>

                {/* Recommendations - Conditional rendering based on typing state */}
                <AnimatePresence mode="wait">
                    {isTyping ? (
                        /* Active State: Vertical list */
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-[680px]"
                        >
                            <span className="text-xs text-muted mb-3 block">Recommended</span>
                            <div className="flex flex-col">
                                <RecommendationItem
                                    text="What is the price trend for Corrugated Boxes in Europe?"
                                    onClick={() => handleQuestionClick("What is the price trend for Corrugated Boxes in Europe?")}
                                    isSelected={selectedQuestion === "What is the price trend for Corrugated Boxes in Europe?"}
                                />
                                <RecommendationItem
                                    text="Why did steel prices increase 8% this month?"
                                    onClick={() => handleQuestionClick("Why did steel prices increase 8% this month?")}
                                    isSelected={selectedQuestion === "Why did steel prices increase 8% this month?"}
                                />
                                <RecommendationItem
                                    text="Show my high-risk suppliers in Packaging"
                                    onClick={() => handleQuestionClick("Show my high-risk suppliers in Packaging")}
                                    isSelected={selectedQuestion === "Show my high-risk suppliers in Packaging"}
                                />
                                <RecommendationItem
                                    text="How does aluminum inflation affect my spend?"
                                    onClick={() => handleQuestionClick("How does aluminum inflation affect my spend?")}
                                    isSelected={selectedQuestion === "How does aluminum inflation affect my spend?"}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        /* Idle State: Tabs + Cards */
                        <motion.div
                            key="cards"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col items-center w-full max-w-[680px]"
                        >
                            {/* Quick Actions */}
                            <div className="flex items-center justify-center gap-4 mb-5 w-full">
                                <FilterTab label="Recommended" active={activeTab === 'recommended'} onClick={() => setActiveTab('recommended')} />
                                <span className="text-slate-300">·</span>
                                <FilterTab label="Portfolio" active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} />
                                <span className="text-slate-300">·</span>
                                <FilterTab label="Alerts" active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} />
                                <span className="text-slate-300">·</span>
                                <FilterTab label="Actions" active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} />
                            </div>

                            {/* Cards Grid */}
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"
                            >
                                {TAB_SUGGESTIONS[activeTab].map((text, i) => (
                                    <SuggestionCard
                                        key={i}
                                        text={text}
                                        onClick={() => handleQuestionClick(text)}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const FilterTab = ({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`text-sm transition-all whitespace-nowrap ${active ? 'text-primary font-medium' : 'text-muted hover:text-secondary'}`}
    >
        {label}
    </button>
);

const SuggestionCard = ({ text, onClick }: { text: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="text-left bg-white/60 hover:bg-white p-4 rounded-xl border border-slate-200/50 hover:border-slate-200 transition-all h-full flex flex-col justify-between min-h-[140px]"
    >
        <img src="/Abi.svg" alt="" className="w-5 h-5" />
        <p className="text-sm text-primary font-normal">
            {text}
        </p>
    </button>
);

interface RecommendationItemProps {
    text: string;
    onClick: () => void;
    isSelected?: boolean;
}

const RecommendationItem = ({ text, onClick, isSelected = false }: RecommendationItemProps) => (
    <motion.button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${
            isSelected ? 'bg-violet-50 scale-[1.02]' : 'hover:bg-slate-50'
        }`}
        layoutId={isSelected ? 'selected-question' : undefined}
        animate={{ scale: isSelected ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
    >
        <Globe size={16} className={`shrink-0 ${isSelected ? 'text-violet-500' : 'text-muted'}`} strokeWidth={1.5} />
        <span className="flex-1 text-sm text-primary text-left">{text}</span>
        <ArrowRight size={16} className={`shrink-0 ${isSelected ? 'text-violet-500' : 'text-muted group-hover:text-secondary'}`} strokeWidth={1.5} />
    </motion.button>
);
