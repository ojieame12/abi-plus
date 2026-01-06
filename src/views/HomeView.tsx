import { useState } from 'react';
import { Globe, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInput } from '../components/chat/ChatInput';
import { PromptBuilder } from '../components/chat/PromptBuilder';
import { routeBuilderSelection } from '../services/promptBuilder/BuilderRouter';

interface HomeViewProps {
    onOpenArtifact: () => void;
    onStartChat?: (question: string) => void;
    isTransitioning?: boolean;
    selectedQuestion?: string;
}

type TabType = 'recommended' | 'portfolio' | 'alerts' | 'actions';

const TAB_SUGGESTIONS: Record<TabType, string[]> = {
    recommended: [
        "Give me a summary of my supplier risk portfolio",
        "Which of my suppliers need immediate attention?",
        "Are there any new risk alerts I should know about?",
    ],
    portfolio: [
        "Show me my portfolio risk distribution",
        "What's my total spend at risk?",
        "Which categories have the highest risk exposure?",
    ],
    alerts: [
        "Show me suppliers with recent risk changes",
        "Are there any critical alerts today?",
        "Which suppliers moved to high risk this week?",
    ],
    actions: [
        "What actions should I take on high-risk suppliers?",
        "Help me create a risk mitigation plan",
        "Find alternatives for my riskiest suppliers",
    ],
};

export const HomeView = ({ onOpenArtifact, onStartChat, isTransitioning = false, selectedQuestion = '' }: HomeViewProps) => {
    const [inputMessage, setInputMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('recommended');
    const [showBuilder, setShowBuilder] = useState(false);

    const isTyping = inputMessage.length > 0;

    // Handle Prompt Builder submission
    const handleBuilderSubmit = (prompt: string, routeResult: ReturnType<typeof routeBuilderSelection>) => {
        console.log('[HomeView] Builder submit:', prompt, routeResult);
        setShowBuilder(false);
        // Use the generated prompt to start chat
        if (prompt && onStartChat) {
            onStartChat(prompt);
        }
    };

    const handleSend = (message: string, files: File[], inputMode?: 'ask' | 'find') => {
        console.log('Send:', message, files, 'mode:', inputMode);
        if (message.trim()) {
            // TODO: Handle 'find' mode differently - show search results view
            onStartChat?.(message);
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

                {/* Prompt Builder or Builder trigger */}
                <AnimatePresence mode="wait">
                    {showBuilder ? (
                        <motion.div
                            key="builder"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-[680px] mb-6"
                        >
                            <PromptBuilder
                                onSubmit={handleBuilderSubmit}
                                isDisabled={isTransitioning}
                            />
                        </motion.div>
                    ) : (
                        <motion.button
                            key="builder-trigger"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBuilder(true)}
                            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full
                                bg-gradient-to-r from-violet-500/10 to-purple-500/10
                                border border-violet-200/50 text-violet-600 text-sm font-medium
                                hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-300/50
                                transition-all duration-200 shadow-sm"
                        >
                            <Sparkles size={16} strokeWidth={2} />
                            <span>Build a prompt</span>
                        </motion.button>
                    )}
                </AnimatePresence>

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
                                    text="What's my current risk exposure across my supplier portfolio?"
                                    onClick={() => handleQuestionClick("What's my current risk exposure across my supplier portfolio?")}
                                    isSelected={selectedQuestion === "What's my current risk exposure across my supplier portfolio?"}
                                />
                                <RecommendationItem
                                    text="Show me all high-risk suppliers in my electronics category"
                                    onClick={() => handleQuestionClick("Show me all high-risk suppliers in my electronics category")}
                                    isSelected={selectedQuestion === "Show me all high-risk suppliers in my electronics category"}
                                />
                                <RecommendationItem
                                    text="Which suppliers have moved to high risk in the last 30 days?"
                                    onClick={() => handleQuestionClick("Which suppliers have moved to high risk in the last 30 days?")}
                                    isSelected={selectedQuestion === "Which suppliers have moved to high risk in the last 30 days?"}
                                />
                                <RecommendationItem
                                    text="Find alternatives for my high-risk semiconductor suppliers"
                                    onClick={() => handleQuestionClick("Find alternatives for my high-risk semiconductor suppliers")}
                                    isSelected={selectedQuestion === "Find alternatives for my high-risk semiconductor suppliers"}
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
