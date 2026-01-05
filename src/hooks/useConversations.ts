import { useState, useEffect, useCallback } from 'react';

// Types
export interface Conversation {
  id: string;
  visitorId: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  isArchived: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// Get or create visitor ID (SSR-safe)
// DEMO MODE: Using shared visitor ID to show seeded conversations
function getVisitorId(): string {
  // Demo mode - everyone sees the same seeded conversations
  return 'demo-user-001';
}

// API base URL - empty for same-origin
const API_BASE = '';

/**
 * Hook for listing and managing conversations
 */
export function useConversations(includeArchived = false) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const visitorId = getVisitorId();

  // Fetch conversations with optional search
  const fetchConversations = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        visitorId,
        includeArchived: includeArchived.toString(),
      });

      // Add search param if provided
      if (search && search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`${API_BASE}/api/conversations?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [visitorId, includeArchived]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Server-side search with debounce
  const search = useCallback((query: string) => {
    setSearchQuery(query);
    fetchConversations(query);
  }, [fetchConversations]);

  // Create new conversation
  const createConversation = useCallback(async (title: string, category = 'general') => {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, title, category }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const newConversation = await response.json();
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [visitorId]);

  // Update conversation (star, archive, rename)
  const updateConversation = useCallback(async (
    id: string,
    updates: Partial<Pick<Conversation, 'title' | 'isStarred' | 'isArchived' | 'category'>>
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation');
      }

      const updated = await response.json();

      setConversations(prev =>
        prev.map(c => (c.id === id ? updated : c))
      );

      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setConversations(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  return {
    conversations,
    isLoading,
    error,
    visitorId,
    searchQuery,
    refetch: fetchConversations,
    search,
    createConversation,
    updateConversation,
    deleteConversation,
  };
}

/**
 * Hook for a single conversation with messages
 */
export function useConversation(id: string | null) {
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation with messages
  const fetchConversation = useCallback(async () => {
    if (!id) {
      setConversation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/conversations/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setConversation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Add message to conversation
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!id) return null;

    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, role, content, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message');
      }

      const newMessage = await response.json();

      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          updatedAt: new Date().toISOString(),
        };
      });

      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [id]);

  return {
    conversation,
    messages: conversation?.messages || [],
    isLoading,
    error,
    refetch: fetchConversation,
    addMessage,
  };
}
