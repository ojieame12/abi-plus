// API Client - Centralized fetch with auth/CSRF handling

const API_BASE = '';

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)abi_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Make an API request with automatic CSRF handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  // requiresAuth could be used for auth checks in future
  const { requiresAuth: _requiresAuth, ...fetchOptions } = options;
  void _requiresAuth; // Explicitly mark as unused for future use

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Add CSRF token for state-changing requests
  const method = (fetchOptions.method || 'GET').toUpperCase();
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies
  });

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  let data: unknown = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data && 'error' in data && typeof (data as Record<string, unknown>).error === 'string'
      ? (data as Record<string, unknown>).error as string
      : typeof data === 'string' && data.trim()
        ? data
        : 'Request failed';
    const details = typeof data === 'object' && data ? data as Record<string, unknown> : { raw: data };
    throw new ApiError(errorMessage, response.status, details);
  }

  return (data ?? {}) as T;
}

/**
 * API Error class with status and details
 */
export class ApiError extends Error {
  status: number;
  details: Record<string, unknown>;

  constructor(message: string, status: number, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
