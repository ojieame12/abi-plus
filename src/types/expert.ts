// Expert types for Layer 3 (Bespoke) - External SME Network

// Expert availability status
export type ExpertAvailability = 'available' | 'busy' | 'offline';

// Expert profile
export interface Expert {
  id: string;
  name: string;
  title: string;
  photo?: string;

  // Background
  formerCompany: string;
  formerTitle: string;
  yearsExperience: number;
  bio?: string;

  // Expertise
  specialties: string[];
  industries: string[];
  regions: string[];
  languages?: string[];

  // Ratings
  rating: number;           // 1-5 scale
  totalRatings: number;
  totalEngagements: number;

  // Availability
  availability: ExpertAvailability;
  responseTime: string;     // "~24 hours"
  nextAvailable?: string;   // ISO date string

  // Rates (in credits)
  hourlyRate: number;       // Credits per hour

  // Badges/Status
  isTopVoice: boolean;
  isVerified: boolean;
  joinedAt: string;
}

// Engagement types
export type EngagementType = 'consultation' | 'deep_dive' | 'bespoke_project';

// Expert engagement (completed or in-progress)
export interface ExpertEngagement {
  id: string;
  expertId: string;
  expertName: string;
  requestId: string;

  // Type
  type: EngagementType;

  // Client info
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientAvatar?: string;

  // Details
  title: string;
  description: string;
  topic?: string;

  // Schedule
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;        // Minutes

  // Cost
  credits: number;
  earnings?: number;        // In dollars (for expert view)

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

  // Call details
  meetingUrl?: string;
  meetingNotes?: string;

  // Rating (after completion)
  rating?: number;
  review?: string;
  reviewDate?: string;
}

// Expert earnings summary (for expert portal)
export interface ExpertEarnings {
  expertId: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all_time';

  // Summary
  totalEngagements: number;
  totalHours: number;
  totalEarnings: number;    // In dollars

  // Breakdown by type
  consultations: { count: number; hours: number; earnings: number };
  deepDives: { count: number; hours: number; earnings: number };
  bespokeProjects: { count: number; hours: number; earnings: number };

  // Ratings
  averageRating: number;
  totalRatings: number;

  // Trends
  earningsChange?: number;  // % change from previous period
  engagementsChange?: number;
}

// Expert review
export interface ExpertReview {
  id: string;
  engagementId: string;
  expertId: string;
  clientName: string;
  clientCompany: string;
  clientAvatar?: string;
  rating: number;
  review: string;
  createdAt: string;
  isPublic: boolean;
}

// Expert dashboard stats (for expert portal view)
export interface ExpertDashboardStats {
  expert: Expert;
  earnings: ExpertEarnings;
  upcomingCalls: ExpertEngagement[];
  pastEngagements: ExpertEngagement[];  // Call history
  recentReviews: ExpertReview[];
  pendingRequests: number;
  // Lifetime stats
  lifetimeEarnings: number;
  lifetimeEngagements: number;
  acceptanceRate: number;  // % of requests accepted
}

// Helper functions

export function getAvailabilityDisplay(availability: ExpertAvailability): {
  label: string;
  color: string;
  dotColor: string;
} {
  switch (availability) {
    case 'available':
      return {
        label: 'Available',
        color: 'text-emerald-600',
        dotColor: 'bg-emerald-500',
      };
    case 'busy':
      return {
        label: 'Busy',
        color: 'text-amber-600',
        dotColor: 'bg-amber-500',
      };
    case 'offline':
      return {
        label: 'Offline',
        color: 'text-slate-400',
        dotColor: 'bg-slate-300',
      };
  }
}

export function getEngagementTypeDisplay(type: EngagementType): {
  label: string;
  duration: string;
  description: string;
} {
  switch (type) {
    case 'consultation':
      return {
        label: '1-Hour Consultation',
        duration: '1 hour',
        description: 'Quick expert call for specific questions',
      };
    case 'deep_dive':
      return {
        label: 'Deep-Dive Session',
        duration: '2-3 hours',
        description: 'Extended session with prep materials',
      };
    case 'bespoke_project':
      return {
        label: 'Bespoke Research',
        duration: '2-4 weeks',
        description: 'Custom research with deliverables',
      };
  }
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatEarnings(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
