// Chat Context - Global state management for conversations
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ChatMessage, Conversation } from '../types/chat';
import { generateId } from '../types/chat';
import type { AIResponse, ThinkingMode } from '../services/ai';
import type { Supplier } from '../types/supplier';
import { getPortfolioSummary } from '../services/mockData';

// State shape
interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isThinking: boolean;
  thinkingMode: ThinkingMode;
  webSearchEnabled: boolean;
  error: string | null;
  // Current response data for UI
  currentResponse: AIResponse | null;
  currentSuppliers: Supplier[];
  currentArtifact: {
    type: string;
    title?: string;
    isOpen: boolean;
    data?: unknown;
  } | null;
}

// Actions
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THINKING'; payload: boolean }
  | { type: 'SET_MODE'; payload: ThinkingMode }
  | { type: 'SET_WEB_SEARCH'; payload: boolean }
  | { type: 'ADD_USER_MESSAGE'; payload: { content: string; attachments?: ChatMessage['attachments'] } }
  | { type: 'ADD_AI_MESSAGE'; payload: AIResponse }
  | { type: 'START_CONVERSATION'; payload: { title: string } }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_SUPPLIERS'; payload: Supplier[] }
  | { type: 'OPEN_ARTIFACT'; payload: { type: string; title?: string; data?: unknown } }
  | { type: 'CLOSE_ARTIFACT' }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } };

// Initial state
const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  isLoading: false,
  isThinking: false,
  thinkingMode: 'fast',
  webSearchEnabled: false,
  error: null,
  currentResponse: null,
  currentSuppliers: [],
  currentArtifact: null,
};

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_THINKING':
      return { ...state, isThinking: action.payload };

    case 'SET_MODE':
      return { ...state, thinkingMode: action.payload };

    case 'SET_WEB_SEARCH':
      return { ...state, webSearchEnabled: action.payload };

    case 'ADD_USER_MESSAGE': {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: action.payload.content,
        timestamp: new Date(),
        attachments: action.payload.attachments,
      };
      return {
        ...state,
        messages: [...state.messages, userMessage],
        error: null,
      };
    }

    case 'ADD_AI_MESSAGE': {
      const aiResponse = action.payload;
      const aiMessage: ChatMessage = {
        id: aiResponse.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
        sources: aiResponse.sources,
        insight: aiResponse.insight,
        thoughtProcess: aiResponse.thinkingSteps ? {
          duration: aiResponse.thinkingDuration || '2s',
          steps: aiResponse.thinkingSteps,
        } : undefined,
      };

      // Auto-open artifact if response includes one
      const newArtifact = aiResponse.artifact && aiResponse.artifact.type !== 'none'
        ? {
          type: aiResponse.artifact.type,
          title: aiResponse.artifact.title,
          isOpen: true,
          data: {
            suppliers: aiResponse.suppliers,
            portfolio: aiResponse.portfolio,
            filters: aiResponse.artifact.filters,
            supplierId: aiResponse.artifact.supplierId,
          },
        }
        : state.currentArtifact;

      return {
        ...state,
        messages: [...state.messages, aiMessage],
        currentResponse: aiResponse,
        currentSuppliers: aiResponse.suppliers || state.currentSuppliers,
        currentArtifact: newArtifact,
        isLoading: false,
        isThinking: false,
      };
    }

    case 'START_CONVERSATION': {
      const newConversation: Conversation = {
        id: generateId(),
        title: action.payload.title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return {
        ...state,
        conversations: [newConversation, ...state.conversations],
        currentConversationId: newConversation.id,
        messages: [],
        currentResponse: null,
        currentSuppliers: [],
        currentArtifact: null,
      };
    }

    case 'CLEAR_CONVERSATION':
      return {
        ...state,
        messages: [],
        currentResponse: null,
        currentSuppliers: [],
        currentArtifact: null,
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isThinking: false,
      };

    case 'SET_CURRENT_SUPPLIERS':
      return { ...state, currentSuppliers: action.payload };

    case 'OPEN_ARTIFACT':
      return {
        ...state,
        currentArtifact: {
          type: action.payload.type,
          title: action.payload.title,
          isOpen: true,
          data: action.payload.data,
        },
      };

    case 'CLOSE_ARTIFACT':
      return {
        ...state,
        currentArtifact: state.currentArtifact
          ? { ...state.currentArtifact, isOpen: false }
          : null,
      };

    case 'UPDATE_MESSAGE': {
      const { id, updates } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === id ? { ...msg, ...updates } : msg
        ),
      };
    }

    default:
      return state;
  }
}

// Context
interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Selector hooks for specific state slices
export const useChatMessages = () => {
  const { state } = useChatContext();
  return state.messages;
};

export const useChatLoading = () => {
  const { state } = useChatContext();
  return { isLoading: state.isLoading, isThinking: state.isThinking };
};

export const useChatMode = () => {
  const { state, dispatch } = useChatContext();
  return {
    mode: state.thinkingMode,
    webSearchEnabled: state.webSearchEnabled,
    setMode: (mode: ThinkingMode) => dispatch({ type: 'SET_MODE', payload: mode }),
    setWebSearch: (enabled: boolean) => dispatch({ type: 'SET_WEB_SEARCH', payload: enabled }),
  };
};

export const useArtifact = () => {
  const { state, dispatch } = useChatContext();
  return {
    artifact: state.currentArtifact,
    openArtifact: (type: string, title?: string, data?: unknown) =>
      dispatch({ type: 'OPEN_ARTIFACT', payload: { type, title, data } }),
    closeArtifact: () => dispatch({ type: 'CLOSE_ARTIFACT' }),
  };
};

export const useCurrentSuppliers = () => {
  const { state } = useChatContext();
  return state.currentSuppliers;
};

export const useCurrentResponse = () => {
  const { state } = useChatContext();
  return state.currentResponse;
};
