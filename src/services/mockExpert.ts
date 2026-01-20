// Mock expert data for P1 demo (Expert Portal / "Uber driver view")
// External SME network for Layer 3 (Bespoke)

import type {
  Expert,
  ExpertEngagement,
  ExpertEarnings,
  ExpertReview,
  ExpertDashboardStats,
} from '../types/expert';

// Mock experts in the network
export const MOCK_EXPERTS: Expert[] = [
  {
    id: 'expert_001',
    name: 'Michael Torres',
    title: 'Supply Chain Strategy Consultant',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    formerCompany: 'Procter & Gamble',
    formerTitle: 'VP Global Procurement',
    yearsExperience: 22,
    bio: 'Former VP of Global Procurement at P&G with 22 years of experience in strategic sourcing and supplier negotiations across FMCG categories.',
    specialties: ['Steel', 'Metals', 'Commodity Strategy', 'Supplier Negotiations', 'Cost Reduction'],
    industries: ['Manufacturing', 'Consumer Goods', 'Automotive'],
    regions: ['North America', 'Asia Pacific', 'Europe'],
    languages: ['English', 'Spanish'],
    rating: 4.8,
    totalRatings: 127,
    totalEngagements: 89,
    availability: 'available',
    responseTime: '~24 hours',
    hourlyRate: 1000,
    isTopVoice: true,
    isVerified: true,
    joinedAt: '2023-06-15T00:00:00Z',
  },
  {
    id: 'expert_002',
    name: 'Jennifer Walsh',
    title: 'Packaging & Sustainability Expert',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
    formerCompany: 'Unilever',
    formerTitle: 'Director of Sustainable Sourcing',
    yearsExperience: 18,
    bio: 'Sustainability leader with deep expertise in packaging innovation and circular economy strategies for global CPG companies.',
    specialties: ['Packaging', 'Sustainability', 'Circular Economy', 'Supplier Development'],
    industries: ['Consumer Goods', 'Food & Beverage', 'Retail'],
    regions: ['Europe', 'North America'],
    languages: ['English', 'French'],
    rating: 4.9,
    totalRatings: 84,
    totalEngagements: 62,
    availability: 'busy',
    responseTime: '~48 hours',
    nextAvailable: '2025-01-18T00:00:00Z',
    hourlyRate: 1200,
    isTopVoice: true,
    isVerified: true,
    joinedAt: '2023-08-01T00:00:00Z',
  },
  {
    id: 'expert_003',
    name: 'Robert Chang',
    title: 'Logistics & Supply Chain Optimization',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
    formerCompany: 'Amazon',
    formerTitle: 'Senior Director, Global Logistics',
    yearsExperience: 15,
    bio: 'Supply chain optimization expert with experience scaling logistics operations at Amazon and leading 3PL negotiations.',
    specialties: ['Logistics', 'Freight', 'Warehousing', 'Last Mile', 'Network Design'],
    industries: ['E-commerce', 'Retail', 'Technology'],
    regions: ['North America', 'Asia Pacific'],
    languages: ['English', 'Mandarin'],
    rating: 4.7,
    totalRatings: 56,
    totalEngagements: 41,
    availability: 'available',
    responseTime: '~24 hours',
    hourlyRate: 1100,
    isTopVoice: false,
    isVerified: true,
    joinedAt: '2024-01-10T00:00:00Z',
  },
];

// Mock expert being viewed in portal (Michael Torres)
export const MOCK_CURRENT_EXPERT: Expert = MOCK_EXPERTS[0];

// Mock upcoming engagements for the expert
export const MOCK_UPCOMING_ENGAGEMENTS: ExpertEngagement[] = [
  {
    id: 'eng_001',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_010',
    type: 'consultation',
    clientId: 'user_003',
    clientName: 'Emily Watson',
    clientCompany: 'Acme Corporation',
    clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    title: 'Steel Pricing Strategy',
    description: 'Q2 pricing outlook and negotiation strategy for long-term steel contracts',
    topic: 'Steel',
    scheduledAt: '2025-01-15T14:00:00Z',
    status: 'scheduled',
    credits: 1000,
    meetingUrl: 'https://meet.beroe.com/exp001-acme-steel',
  },
  {
    id: 'eng_002',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_011',
    type: 'consultation',
    clientId: 'user_008',
    clientName: 'Amanda Foster',
    clientCompany: 'GlobalTech Inc',
    clientAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    title: 'Packaging Cost Reduction',
    description: 'Review current packaging spend and identify optimization opportunities',
    topic: 'Packaging',
    scheduledAt: '2025-01-15T16:30:00Z',
    status: 'scheduled',
    credits: 1000,
    meetingUrl: 'https://meet.beroe.com/exp001-globaltech-pkg',
  },
  {
    id: 'eng_003',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_012',
    type: 'deep_dive',
    clientId: 'user_003',
    clientName: 'Emily Watson',
    clientCompany: 'Acme Corporation',
    clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    title: 'Metals Category Strategy',
    description: 'Deep dive into Acme\'s metals category with portfolio analysis and supplier strategy',
    topic: 'Metals',
    scheduledAt: '2025-01-16T10:00:00Z',
    status: 'scheduled',
    credits: 3000,
    meetingUrl: 'https://meet.beroe.com/exp001-acme-metals-dd',
  },
];

// Mock past completed engagements (call history)
export const MOCK_PAST_ENGAGEMENTS: ExpertEngagement[] = [
  {
    id: 'eng_past_001',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_past_001',
    type: 'consultation',
    clientId: 'user_004',
    clientName: 'Sarah Chen',
    clientCompany: 'Acme Corporation',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    title: 'Steel Market Analysis',
    description: 'Asian steel markets review and Q2 outlook',
    topic: 'Steel',
    scheduledAt: '2025-01-10T14:00:00Z',
    completedAt: '2025-01-10T15:00:00Z',
    duration: 60,
    status: 'completed',
    credits: 1000,
    earnings: 750,
    rating: 5,
  },
  {
    id: 'eng_past_002',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_past_002',
    type: 'consultation',
    clientId: 'user_005',
    clientName: 'David Kim',
    clientCompany: 'TechFlow Industries',
    clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    title: 'Packaging Trends Deep Dive',
    description: 'Sustainable packaging options and supplier landscape',
    topic: 'Packaging',
    scheduledAt: '2025-01-08T10:00:00Z',
    completedAt: '2025-01-08T11:15:00Z',
    duration: 75,
    status: 'completed',
    credits: 1000,
    earnings: 750,
    rating: 4,
  },
  {
    id: 'eng_past_003',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_past_003',
    type: 'deep_dive',
    clientId: 'user_006',
    clientName: 'Maria Santos',
    clientCompany: 'Continental Manufacturing',
    clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    title: 'Supplier Negotiation Strategy',
    description: 'Comprehensive review of supplier contracts and negotiation tactics',
    topic: 'Strategy',
    scheduledAt: '2025-01-05T09:00:00Z',
    completedAt: '2025-01-05T12:00:00Z',
    duration: 180,
    status: 'completed',
    credits: 2700,
    earnings: 2025,
    rating: 5,
  },
  {
    id: 'eng_past_004',
    expertId: 'expert_001',
    expertName: 'Michael Torres',
    requestId: 'req_past_004',
    type: 'deep_dive',
    clientId: 'user_007',
    clientName: 'James Wilson',
    clientCompany: 'Apex Industries',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    title: 'Category Strategy Workshop',
    description: 'Full-day workshop on metals category optimization',
    topic: 'Metals',
    scheduledAt: '2024-12-28T09:00:00Z',
    completedAt: '2024-12-28T14:00:00Z',
    duration: 300,
    status: 'completed',
    credits: 4500,
    earnings: 3375,
    rating: 5,
  },
];

// Mock recent reviews
export const MOCK_EXPERT_REVIEWS: ExpertReview[] = [
  {
    id: 'rev_001',
    engagementId: 'eng_past_001',
    expertId: 'expert_001',
    clientName: 'Sarah Chen',
    clientCompany: 'Acme Corporation',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    review: 'Incredibly knowledgeable on Asian steel markets. Gave us actionable insights for our Q2 negotiations that will save us millions.',
    createdAt: '2025-01-10T15:30:00Z',
    isPublic: true,
  },
  {
    id: 'rev_002',
    engagementId: 'eng_past_002',
    expertId: 'expert_001',
    clientName: 'David Kim',
    clientCompany: 'TechFlow Industries',
    clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    rating: 4,
    review: 'Good insights on packaging trends. Call ran a bit long but valuable overall. Would recommend for strategic sourcing discussions.',
    createdAt: '2025-01-08T11:00:00Z',
    isPublic: true,
  },
  {
    id: 'rev_003',
    engagementId: 'eng_past_003',
    expertId: 'expert_001',
    clientName: 'Maria Santos',
    clientCompany: 'Continental Manufacturing',
    clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    rating: 5,
    review: 'Michael\'s experience with P&G negotiations was exactly what we needed. He helped us restructure our supplier approach completely.',
    createdAt: '2025-01-05T09:15:00Z',
    isPublic: true,
  },
  {
    id: 'rev_004',
    engagementId: 'eng_past_004',
    expertId: 'expert_001',
    clientName: 'James Wilson',
    clientCompany: 'Apex Industries',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 5,
    review: 'Outstanding deep dive session. The prep materials were thorough and the recommendations were immediately actionable.',
    createdAt: '2024-12-28T14:00:00Z',
    isPublic: true,
  },
];

// Mock earnings data
export const MOCK_EXPERT_EARNINGS: ExpertEarnings = {
  expertId: 'expert_001',
  period: 'month',
  totalEngagements: 8,
  totalHours: 14,
  totalEarnings: 12400,
  consultations: { count: 5, hours: 5, earnings: 5000 },
  deepDives: { count: 2, hours: 6, earnings: 5400 },
  bespokeProjects: { count: 1, hours: 3, earnings: 2000 },
  averageRating: 4.8,
  totalRatings: 8,
  earningsChange: 15, // 15% up from last month
  engagementsChange: 23, // 23% up from last month
};

// Mock weekly earnings for chart
export const MOCK_WEEKLY_EARNINGS = [
  { week: 'Week 1', earnings: 2800 },
  { week: 'Week 2', earnings: 3200 },
  { week: 'Week 3', earnings: 4100 },
  { week: 'Week 4', earnings: 2300 },
];

// Full expert dashboard stats
export const MOCK_EXPERT_DASHBOARD: ExpertDashboardStats = {
  expert: MOCK_CURRENT_EXPERT,
  earnings: MOCK_EXPERT_EARNINGS,
  upcomingCalls: MOCK_UPCOMING_ENGAGEMENTS,
  pastEngagements: MOCK_PAST_ENGAGEMENTS,
  recentReviews: MOCK_EXPERT_REVIEWS,
  pendingRequests: 3,
  // Lifetime stats (Uber-style metrics)
  lifetimeEarnings: 89250,  // Total earned since joining
  lifetimeEngagements: 89,
  acceptanceRate: 94,        // 94% of requests accepted
};

// Helper functions

export function getMockExpert(expertId: string): Expert | undefined {
  return MOCK_EXPERTS.find(e => e.id === expertId);
}

export function getMockExpertDashboard(expertId: string): ExpertDashboardStats {
  const expert = getMockExpert(expertId) || MOCK_CURRENT_EXPERT;
  return {
    ...MOCK_EXPERT_DASHBOARD,
    expert,
  };
}

export function getMockAvailableExperts(specialty?: string): Expert[] {
  let experts = MOCK_EXPERTS.filter(e => e.availability !== 'offline');
  if (specialty) {
    experts = experts.filter(e =>
      e.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    );
  }
  return experts;
}
