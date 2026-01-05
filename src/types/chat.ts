// Message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  // AI response specific
  suggestions?: Suggestion[];
  sources?: Source[];
  insight?: string;
  thoughtProcess?: ThoughtProcessData;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: 'csv' | 'xlsx' | 'pdf' | 'doc' | 'other';
}

export interface Suggestion {
  id: string;
  text: string;
  icon: 'lightbulb' | 'message' | 'document' | 'chart' | 'search' | 'alert' | 'compare';
}

export interface Source {
  name: string;
  url?: string;
  date?: string;
  type?: 'web' | 'report' | 'news' | 'data' | 'analysis' | 'beroe' | 'dnd' | 'ecovadis' | 'internal_data' | 'supplier_data';
}

export interface ThoughtProcessData {
  duration: string;
  steps: ThoughtStep[];
}

export interface ThoughtStep {
  title: string;
  content: string;
  status: 'complete' | 'in_progress' | 'pending';
}

// Conversation state
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// AI Response format (what we expect from LLMs)
export interface AIResponseData {
  content: string;
  suggestions: Suggestion[];
  sources?: Source[];
  insight?: string;
}

// Chat context state
export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  isThinking: boolean;
  thinkingMode: 'fast' | 'reasoning';
  webSearchEnabled: boolean;
  error: string | null;
}

// Chat actions
export type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THINKING'; payload: boolean }
  | { type: 'SET_MODE'; payload: 'fast' | 'reasoning' }
  | { type: 'SET_WEB_SEARCH'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'START_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null };

// Utility type for generating IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
