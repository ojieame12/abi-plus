// Session Hook - Demo mode with auto-login and persona switching
import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserPermissions } from '../types/auth';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

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
  role?: string;
}

interface SessionData {
  status: 'authenticated' | 'verified' | 'anonymous' | 'loading';
  user: SessionUser | null;
  visitorId?: string;
  permissions: UserPermissions;
  csrfToken?: string;
  persona?: DemoPersona;
  demoMode?: boolean;
}

export type DemoPersona = 'admin' | 'approver' | 'member';

interface UseSessionReturn {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isAuthenticated: boolean;
  user: SessionUser | null;
  userId: string | null;
  permissions: UserPermissions;
  // Demo-specific
  persona: DemoPersona;
  switchPersona: (persona: DemoPersona) => Promise<void>;
  isDemoMode: boolean;
}

// ══════════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════════

const PERSONA_STORAGE_KEY = 'abi_demo_persona';
const DEFAULT_PERSONA: DemoPersona = 'admin';

// Default permissions - will be overridden by auth response
const DEFAULT_PERMISSIONS: UserPermissions = {
  canAccessChat: true,
  canReadCommunity: true,
  canAsk: true,
  canAnswer: true,
  canUpvote: true,
  canDownvote: true,
  canComment: true,
  canInvite: false,
  canModerate: false,
  inviteSlots: 0,
};

// Role-based permissions for demo mode
const ROLE_PERMISSIONS: Record<DemoPersona, Partial<UserPermissions>> = {
  admin: {
    canModerate: true,
    canInvite: true,
    inviteSlots: 10,
  },
  approver: {
    canModerate: true,
  },
  member: {},
};

// ══════════════════════════════════════════════════════════════════
// Storage Helpers
// ══════════════════════════════════════════════════════════════════

function getSavedPersona(): DemoPersona {
  // Always use admin - demo mode UI is disabled
  return 'admin';
}

function savePersona(persona: DemoPersona): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PERSONA_STORAGE_KEY, persona);
  }
}

// ══════════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════════

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData>({
    status: 'loading',
    user: null,
    permissions: DEFAULT_PERMISSIONS,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<DemoPersona>(getSavedPersona);

  // Track if we've initialized to prevent double-login
  const initializedRef = useRef(false);

  // Demo login function
  const demoLogin = useCallback(async (targetPersona: DemoPersona): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: targetPersona }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Demo login failed');
      }

      const data = await response.json();

      // Build permissions from role
      const rolePerms = ROLE_PERMISSIONS[targetPersona] || {};
      const permissions: UserPermissions = {
        ...DEFAULT_PERMISSIONS,
        ...rolePerms,
      };

      setSession({
        status: 'authenticated',
        user: data.user,
        permissions,
        csrfToken: data.csrfToken,
        persona: targetPersona,
        demoMode: true,
      });

      setPersona(targetPersona);
      savePersona(targetPersona);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo login failed';

      // Don't show error for expected production fallback
      // The demo-login endpoint returns this specific error when disabled
      const isExpectedProductionFallback = message === 'Demo login is not available in production';

      if (!isExpectedProductionFallback) {
        // For unexpected errors (network, user not found, etc.), show the error
        // but still allow the app to work in anonymous mode
        setError(message);
        console.warn('Demo login failed:', message);
      }

      // Fall back to anonymous session
      // demoMode: false if production fallback, true otherwise (to keep persona switcher in dev)
      setSession({
        status: 'anonymous',
        user: null,
        permissions: DEFAULT_PERMISSIONS,
        persona: targetPersona,
        demoMode: !isExpectedProductionFallback,
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch persona
  const switchPersona = useCallback(async (newPersona: DemoPersona): Promise<void> => {
    await demoLogin(newPersona);
  }, [demoLogin]);

  // Auto-login on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedPersona = getSavedPersona();
    demoLogin(savedPersona);
  }, [demoLogin]);

  // Refetch session
  const refetch = useCallback(() => {
    demoLogin(persona);
  }, [demoLogin, persona]);

  return {
    session,
    isLoading,
    error,
    refetch,
    isAuthenticated: session.status === 'authenticated' || session.status === 'verified',
    user: session.user,
    userId: session.user?.id || null,
    permissions: session.permissions,
    // Demo mode disabled - always use admin persona without UI
    persona,
    switchPersona,
    isDemoMode: false, // Disabled demo mode UI
  };
}
