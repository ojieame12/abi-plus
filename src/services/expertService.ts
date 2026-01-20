// Expert Service - API client for expert network endpoints

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export type ExpertAvailability = 'online' | 'busy' | 'offline';
export type ExpertEngagementType = 'consultation' | 'deep_dive' | 'bespoke_project';
export type ExpertEngagementStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Expert {
  id: string;
  name: string;
  title: string;
  photo: string | null;
  formerCompany: string;
  formerTitle: string;
  yearsExperience: number;
  specialties: string[];
  industries: string[];
  regions: string[];
  rating: number | null;
  totalRatings: number | null;
  totalEngagements: number | null;
  availability: ExpertAvailability | null;
  hourlyRate: number;
  isTopVoice: boolean | null;
  isVerified: boolean | null;
}

export interface ExpertTestimonial {
  rating: number | null;
  review: string | null;
  date: string | null;
}

export interface ExpertDetail extends Expert {
  createdAt: string;
}

export interface ExpertFilters {
  specialty?: string;
  industry?: string;
  region?: string;
  availability?: ExpertAvailability;
  topVoice?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Engagement {
  id: string;
  type: ExpertEngagementType;
  title: string;
  status: ExpertEngagementStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  credits: number;
  rating: number | null;
  review: string | null;
  createdAt: string;
  expert: {
    id: string;
    name: string;
    title: string;
    photo: string | null;
    isTopVoice?: boolean | null;
  };
}

export interface BookEngagementRequest {
  expertId: string;
  type: ExpertEngagementType;
  title: string;
  scheduledAt?: string;
  requestId?: string;
}

export interface ExpertDashboard {
  expert: {
    id: string;
    name: string;
    title: string;
    photo: string | null;
    availability: ExpertAvailability | null;
    rating: number | null;
    totalRatings: number | null;
    isTopVoice: boolean | null;
    isVerified: boolean | null;
  };
  stats: {
    totalEngagements: number;
    completedEngagements: number;
    pendingEngagements: number;
    totalEarnings: number;
    averageRating: string;
  };
  upcomingEngagements: Array<{
    id: string;
    type: ExpertEngagementType;
    title: string;
    status: ExpertEngagementStatus;
    scheduledAt: string | null;
    credits: number;
    client: {
      displayName: string;
      company: string | null;
      avatarUrl: string | null;
    };
  }>;
  recentEngagements: Array<{
    id: string;
    type: ExpertEngagementType;
    title: string;
    completedAt: string | null;
    credits: number;
    rating: number | null;
    review: string | null;
    client: {
      displayName: string;
      company: string | null;
    };
  }>;
}

// ══════════════════════════════════════════════════════════════════
// API Helpers
// ══════════════════════════════════════════════════════════════════

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/abi_csrf=([^;]+)/);
  return match ? match[1] : null;
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = { ...options.headers };

  if (options.method && options.method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
    if (!options.headers || !(options.headers as Record<string, string>)['Content-Type']) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════════════
// API Functions
// ══════════════════════════════════════════════════════════════════

/**
 * List available experts with filters
 */
export async function fetchExperts(filters: ExpertFilters = {}): Promise<{
  experts: Expert[];
  total: number;
}> {
  const params = new URLSearchParams();

  if (filters.specialty) params.set('specialty', filters.specialty);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.region) params.set('region', filters.region);
  if (filters.availability) params.set('availability', filters.availability);
  if (filters.topVoice) params.set('topVoice', 'true');
  if (filters.search) params.set('search', filters.search);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const queryString = params.toString();
  const url = queryString ? `/api/experts?${queryString}` : '/api/experts';

  return apiRequest(url);
}

/**
 * Get expert profile details
 */
export async function fetchExpertDetail(expertId: string): Promise<{
  expert: ExpertDetail;
  testimonials: ExpertTestimonial[];
}> {
  return apiRequest(`/api/experts/${expertId}`);
}

/**
 * Get expert dashboard (for users who are experts)
 */
export async function fetchExpertDashboard(): Promise<ExpertDashboard> {
  return apiRequest('/api/experts/dashboard');
}

/**
 * List user's expert engagements
 */
export async function fetchEngagements(): Promise<{
  engagements: Engagement[];
  total: number;
}> {
  return apiRequest('/api/experts/engagements');
}

/**
 * Book a new expert engagement
 */
export async function bookEngagement(request: BookEngagementRequest): Promise<{
  engagement: Engagement;
}> {
  return apiRequest('/api/experts/engagements', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update expert availability (for users who are experts)
 */
export async function updateAvailability(availability: ExpertAvailability): Promise<{
  expert: { id: string; name: string; availability: ExpertAvailability };
  message: string;
}> {
  return apiRequest('/api/experts/availability', {
    method: 'PUT',
    body: JSON.stringify({ availability }),
  });
}
