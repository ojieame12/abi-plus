/* eslint-disable react-refresh/only-export-components -- Context files export hooks alongside providers by design */
import { createContext, useContext, useState, ReactNode } from 'react';

type ViewState = 'home' | 'transitioning' | 'chat';
type TransitionPhase = 'idle' | 'launch' | 'transform' | 'reveal' | 'complete';

interface TransitionState {
    viewState: ViewState;
    transitionPhase: TransitionPhase;
    selectedQuestion: string;
    conversationTitle: string;
}

interface TransitionContextType {
    state: TransitionState;
    startTransition: (question: string) => void;
    completeTransition: () => void;
    goHome: () => void;
}

const initialState: TransitionState = {
    viewState: 'home',
    transitionPhase: 'idle',
    selectedQuestion: '',
    conversationTitle: '',
};

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TransitionState>(initialState);

    const startTransition = (question: string) => {
        // Phase 1: Launch - fade out other elements
        setState({
            viewState: 'transitioning',
            transitionPhase: 'launch',
            selectedQuestion: question,
            conversationTitle: '',
        });

        // Phase 2: Transform - animate question to bubble
        setTimeout(() => {
            setState(prev => ({
                ...prev,
                transitionPhase: 'transform',
            }));
        }, 150);

        // Phase 3: Reveal - show chat content with skeleton
        setTimeout(() => {
            setState(prev => ({
                ...prev,
                transitionPhase: 'reveal',
            }));
        }, 400);

        // Phase 4: Complete - resolve skeleton, show full content
        setTimeout(() => {
            setState(prev => ({
                ...prev,
                viewState: 'chat',
                transitionPhase: 'complete',
                conversationTitle: generateTitle(question),
            }));
        }, 1200);
    };

    const completeTransition = () => {
        setState(prev => ({
            ...prev,
            viewState: 'chat',
            transitionPhase: 'complete',
        }));
    };

    const goHome = () => {
        setState(initialState);
    };

    return (
        <TransitionContext.Provider value={{ state, startTransition, completeTransition, goHome }}>
            {children}
        </TransitionContext.Provider>
    );
};

export const useTransition = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error('useTransition must be used within TransitionProvider');
    }
    return context;
};

// Helper to generate a title from the question
const generateTitle = (question: string): string => {
    // Simplify the question into a title
    const cleaned = question
        .replace(/^(what'?s?|who|how|where|when|why|can you|could you|please|help me)/i, '')
        .replace(/\?$/, '')
        .trim();

    // Capitalize first letter and truncate if needed
    const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
};
