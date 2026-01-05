// Session Hook - Fetch and cache auth state
import { useState, useEffect, useCallback } from 'react';
import type { UserPermissions } from '../types/auth';

interface UserProfile {
  id: string;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  reputation: number;
}

interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: UserProfile | null;
}

interface SessionData {
  status: 'authenticated' | 'verified' | 'anonymous';
  user: SessionUser | null;
  visitorId?: string;
  permissions: UserPermissions;
  csrfToken?: string;
}

interface UseSessionReturn {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // Convenience accessors
  isAuthenticated: boolean;
  user: SessionUser | null;
  userId: string | null;
  permissions: UserPermissions;
}

// Default permissions for anonymous users
const DEFAULT_PERMISSIONS: UserPermissions = {
  canAsk: false,
  canAnswer: false,
  canUpvote: false,
  canDownvote: false,
  canComment: false,
  canModerate: false,
};

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      setSession(data);
      setError(null);
    } catch (err) {
      console.error('Session fetch error:', err);
      setError('Failed to load session');
      // Set anonymous session on error
      setSession({
        status: 'anonymous',
        user: null,
        permissions: DEFAULT_PERMISSIONS,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const isAuthenticated = session?.status === 'authenticated' || session?.status === 'verified';

  return {
    session,
    isLoading,
    error,
    refetch: fetchSession,
    // Convenience accessors
    isAuthenticated,
    user: session?.user || null,
    userId: session?.user?.id || null,
    permissions: session?.permissions || DEFAULT_PERMISSIONS,
  };
}
