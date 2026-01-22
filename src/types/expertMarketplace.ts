// Expert Marketplace Types
// Types for the expert marketplace feature including profiles, matching, and bookings

export type ExpertSpecialty =
  | 'metals'
  | 'packaging'
  | 'logistics'
  | 'chemicals'
  | 'energy'
  | 'it_services'
  | 'mro'
  | 'hr_services'
  | 'marketing'
  | 'facilities'
  | 'travel'
  | 'fleet';

export type AvailabilityStatus = 'available' | 'busy' | 'offline';

export type EngagementTier =
  | 'quick_question' // Free for managed, 50 credits otherwise
  | 'deep_dive' // 150 credits, 24hr response
  | 'consultation' // 300 credits, 30-min call
  | 'custom_report'; // Quote-based

export interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  photo?: string;
  availability: AvailabilityStatus;

  // Credentials
  yearsExperience: number;
  formerCompany?: string;
  formerTitle?: string;
  bio: string;

  // Expertise
  specialties: ExpertSpecialty[];
  categories: string[]; // Specific categories like "Carbon Steel", "Corrugated Packaging"
  regions: string[]; // NA, EMEA, APAC, LATAM

  // Track record
  questionsAnswered: number;
  rating: number; // 0-5
  reviewCount: number;
  responseTime: string; // "~4 hours", "< 24 hours"

  // Engagement rates
  rates: {
    quickQuestion: number;
    deepDive: number;
    consultation: number;
  };

  // Badges and achievements
  isTopVoice?: boolean;
  badges?: string[];

  // Recent activity
  recentActivity?: {
    type: 'question' | 'report' | 'insight';
    title: string;
    date: string;
  }[];
}

export interface ExpertReview {
  id: string;
  expertId: string;
  clientName: string; // Anonymized: "Procurement Manager, Fortune 500"
  rating: number;
  comment: string;
  date: string;
  engagementType: EngagementTier;
}

export interface ExpertMatch {
  expert: ExpertProfile;
  matchScore: number; // 0-100
  matchReasons: string[];
}

export interface EngagementSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface ExpertFilters {
  specialty?: ExpertSpecialty;
  availableNow?: boolean;
  minRating?: number;
  region?: string;
  searchQuery?: string;
}

export interface ExpertBooking {
  id: string;
  expertId: string;
  engagementType: EngagementTier;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledAt?: string; // ISO date for consultations
  question?: string; // For quick_question and deep_dive
  notes?: string;
  creditsCharged: number;
  createdAt: string;
}

// Helper functions
export function getSpecialtyLabel(specialty: ExpertSpecialty): string {
  const labels: Record<ExpertSpecialty, string> = {
    metals: 'Metals & Mining',
    packaging: 'Packaging',
    logistics: 'Logistics & Freight',
    chemicals: 'Chemicals',
    energy: 'Energy & Utilities',
    it_services: 'IT Services',
    mro: 'MRO & Industrial',
    hr_services: 'HR Services',
    marketing: 'Marketing',
    facilities: 'Facilities',
    travel: 'Travel & Events',
    fleet: 'Fleet Management',
  };
  return labels[specialty] || specialty;
}

export function getSpecialtyColor(specialty: ExpertSpecialty): string {
  const colors: Record<ExpertSpecialty, string> = {
    metals: 'text-slate-600 bg-slate-100',
    packaging: 'text-amber-600 bg-amber-50',
    logistics: 'text-blue-600 bg-blue-50',
    chemicals: 'text-emerald-600 bg-emerald-50',
    energy: 'text-yellow-600 bg-yellow-50',
    it_services: 'text-violet-600 bg-violet-50',
    mro: 'text-orange-600 bg-orange-50',
    hr_services: 'text-pink-600 bg-pink-50',
    marketing: 'text-indigo-600 bg-indigo-50',
    facilities: 'text-cyan-600 bg-cyan-50',
    travel: 'text-rose-600 bg-rose-50',
    fleet: 'text-teal-600 bg-teal-50',
  };
  return colors[specialty] || 'text-slate-600 bg-slate-100';
}

export function getAvailabilityColor(status: AvailabilityStatus): string {
  const colors: Record<AvailabilityStatus, string> = {
    available: 'bg-emerald-500',
    busy: 'bg-amber-500',
    offline: 'bg-slate-300',
  };
  return colors[status];
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  const labels: Record<AvailabilityStatus, string> = {
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline',
  };
  return labels[status];
}

export function getMatchScoreColor(score: number): string {
  if (score >= 90) return 'bg-emerald-100 text-emerald-700';
  if (score >= 80) return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

export function getEngagementTierConfig(tier: EngagementTier): {
  label: string;
  icon: string;
  color: string;
  description: string;
} {
  const configs: Record<
    EngagementTier,
    { label: string; icon: string; color: string; description: string }
  > = {
    quick_question: {
      label: 'Quick Question',
      icon: '💬',
      color: 'violet',
      description: 'Get a focused answer within 24 hours',
    },
    deep_dive: {
      label: 'Deep Dive',
      icon: '🔍',
      color: 'blue',
      description: 'Comprehensive analysis with supporting data',
    },
    consultation: {
      label: 'Consultation',
      icon: '📅',
      color: 'emerald',
      description: '30-minute video call with screen sharing',
    },
    custom_report: {
      label: 'Custom Report',
      icon: '📋',
      color: 'amber',
      description: 'Tailored research report on your specific needs',
    },
  };
  return configs[tier];
}
