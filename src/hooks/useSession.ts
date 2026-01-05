// Session Hook - DISABLED FOR NOW
import { useState } from 'react';
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
  isAuthenticated: boolean;
  user: SessionUser | null;
  userId: string | null;
  permissions: UserPermissions;
}

// Default permissions - allow everything for now
const DEFAULT_PERMISSIONS: UserPermissions = {
  canAsk: true,
  canAnswer: true,
  canUpvote: true,
  canDownvote: true,
  canComment: true,
  canModerate: false,
};

export function useSession(): UseSessionReturn {
  // Return mock session - auth disabled
  const [session] = useState<SessionData>({
    status: 'anonymous',
    user: null,
    permissions: DEFAULT_PERMISSIONS,
  });

  return {
    session,
    isLoading: false,
    error: null,
    refetch: () => {},
    isAuthenticated: false,
    user: null,
    userId: null,
    permissions: DEFAULT_PERMISSIONS,
  };
}
