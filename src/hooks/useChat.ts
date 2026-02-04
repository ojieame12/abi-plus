// useChat Hook - Clean API for chat interactions
import { useCallback } from 'react';
import { useChatContext } from '../context/ChatContext';
import type { AIResponse, ThinkingMode } from '../services/ai';
import { sendMessage } from '../services/ai';
import type { ChatMessage, Suggestion, FileAttachment } from '../types/chat';

interface UseChatOptions {
  userInterests?: string[];
}

interface UseChatReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isThinking: boolean;
  error: string | null;
  mode: ThinkingMode;
  webSearchEnabled: boolean;
  currentResponse: AIResponse | null;

  // Actions
  send: (message: string, attachments?: FileAttachment[]) => Promise<void>;
  sendSuggestion: (suggestion: Suggestion) => Promise<void>;
  setMode: (mode: ThinkingMode) => void;
  setWebSearch: (enabled: boolean) => void;
  clearConversation: () => void;
  startNewConversation: (title?: string) => void;
}

// Simulate a typing delay for more natural feel
const THINKING_DELAY_MS = 1500; // 1.5 seconds minimum "thinking" time

export const useChat = (options?: UseChatOptions): UseChatReturn => {
  const { state, dispatch } = useChatContext();
  const userInterests = options?.userInterests;

  // Send a message
  const send = useCallback(async (message: string, attachments?: FileAttachment[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // Add user message to state
    dispatch({
      type: 'ADD_USER_MESSAGE',
      payload: { content: message, attachments },
    });

    // Set loading state
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_THINKING', payload: true });

    // Start thinking delay
    const startTime = Date.now();

    try {
      // Call AI service
      const response = await sendMessage(message, {
        mode: state.thinkingMode,
        webSearchEnabled: state.webSearchEnabled,
        conversationHistory: state.messages,
        userInterests,
      });

      // Ensure minimum thinking time for UX
      const elapsed = Date.now() - startTime;
      if (elapsed < THINKING_DELAY_MS) {
        await new Promise(resolve => setTimeout(resolve, THINKING_DELAY_MS - elapsed));
      }

      // Add AI response to state
      dispatch({ type: 'ADD_AI_MESSAGE', payload: response });

    } catch (error) {
      console.error('Chat error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [dispatch, state.thinkingMode, state.webSearchEnabled, state.messages, userInterests]);

  // Send a suggestion (tap-to-send)
  const sendSuggestion = useCallback(async (suggestion: Suggestion) => {
    await send(suggestion.text);
  }, [send]);

  // Set thinking mode
  const setMode = useCallback((mode: ThinkingMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, [dispatch]);

  // Set web search
  const setWebSearch = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_WEB_SEARCH', payload: enabled });
  }, [dispatch]);

  // Clear current conversation
  const clearConversation = useCallback(() => {
    dispatch({ type: 'CLEAR_CONVERSATION' });
  }, [dispatch]);

  // Start new conversation
  const startNewConversation = useCallback((title?: string) => {
    dispatch({
      type: 'START_CONVERSATION',
      payload: { title: title || 'New Conversation' },
    });
  }, [dispatch]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isThinking: state.isThinking,
    error: state.error,
    mode: state.thinkingMode,
    webSearchEnabled: state.webSearchEnabled,
    currentResponse: state.currentResponse,

    // Actions
    send,
    sendSuggestion,
    setMode,
    setWebSearch,
    clearConversation,
    startNewConversation,
  };
};

// Utility hook for just reading chat state (no actions)
export const useChatState = () => {
  const { state } = useChatContext();
  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isThinking: state.isThinking,
    error: state.error,
    mode: state.thinkingMode,
    webSearchEnabled: state.webSearchEnabled,
  };
};

// Utility hook for suggestions
export const useSuggestions = () => {
  const { state } = useChatContext();
  const lastMessage = state.messages[state.messages.length - 1];

  // Return suggestions from the last AI message, or default suggestions
  if (lastMessage?.role === 'assistant' && lastMessage.suggestions) {
    return lastMessage.suggestions;
  }

  // Default entry point suggestions
  return [
    { id: '1', text: 'Show my risk overview', icon: 'chart' as const },
    { id: '2', text: 'Which suppliers are high risk?', icon: 'search' as const },
    { id: '3', text: 'Any recent risk changes?', icon: 'alert' as const },
  ];
};
