// Subscription and credit system types
// 1 Credit = $1.00 (with bonus credits for higher tiers)
// Note: See creditLedger.ts for production API types

export type SubscriptionTier =
  | 'starter'
  | 'professional'
  | 'business'
  | 'enterprise'
  | 'custom';

export interface SubscriptionTierConfig {
  id: SubscriptionTier;
  name: string;
  price: number;           // Annual price in dollars
  baseCredits: number;     // Credits without bonus
  bonusCredits: number;    // Additional bonus credits
  totalCredits: number;    // baseCredits + bonusCredits
  slotAllowance: number;   // Number of managed categories
  features: string[];      // Feature list for display
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 25000,
    baseCredits: 25000,
    bonusCredits: 0,
    totalCredits: 25000,
    slotAllowance: 10,
    features: [
      'Unlimited AI queries',
      '10 managed categories',
      'Email support',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 50000,
    baseCredits: 50000,
    bonusCredits: 2500,
    totalCredits: 52500,
    slotAllowance: 20,
    features: [
      'Unlimited AI queries',
      '20 managed categories',
      'Analyst Q&A access',
      'Priority support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 75000,
    baseCredits: 75000,
    bonusCredits: 5000,
    totalCredits: 80000,
    slotAllowance: 35,
    features: [
      'Unlimited AI queries',
      '35 managed categories',
      'Analyst calls',
      'Expert network access',
      'Custom reports',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 100000,
    baseCredits: 100000,
    bonusCredits: 10000,
    totalCredits: 110000,
    slotAllowance: 50,
    features: [
      'Unlimited AI queries',
      '50 managed categories',
      'Dedicated analyst',
      'Expert network priority',
      'Custom integrations',
      'SLA guarantees',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    price: 0,
    baseCredits: 0,
    bonusCredits: 0,
    totalCredits: 0,
    slotAllowance: 0,
    features: [
      'Custom pricing',
      'Custom features',
      'Negotiated terms',
    ],
  },
};

// Credit transaction types
export type CreditTransactionType =
  | 'allocation'       // Initial or top-up allocation
  | 'analyst_qa'       // Analyst Q&A (async) - 250 credits
  | 'analyst_call'     // Analyst call (30 min) - 500 credits
  | 'report_upgrade'   // L2b report upgrade - 1,500-3,000 credits
  | 'expert_consult'   // Expert consultation - 1,000 credits
  | 'expert_deepdive'  // Expert deep-dive - 3,000 credits
  | 'bespoke_project'  // Bespoke project - 5,000-15,000 credits
  | 'refund'           // Credit refund
  | 'adjustment';      // Manual adjustment

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  amount: number;         // Positive = credit, negative = debit
  balance: number;        // Balance after transaction
  description: string;
  requestId?: string;     // Link to upgrade request
  createdAt: string;
  createdBy: string;      // User ID
}

// Credit costs by action type
export const CREDIT_COSTS: Record<string, { min: number; max: number; typical: number; label: string }> = {
  analyst_qa: {
    min: 200,
    max: 300,
    typical: 250,
    label: 'Analyst Q&A (async)',
  },
  analyst_call: {
    min: 400,
    max: 600,
    typical: 500,
    label: 'Analyst Call (30 min)',
  },
  report_upgrade: {
    min: 1500,
    max: 3000,
    typical: 2000,
    label: 'Report Upgrade to Decision Grade',
  },
  expert_consult: {
    min: 800,
    max: 1500,
    typical: 1000,
    label: 'Expert Consultation (1 hr)',
  },
  expert_deepdive: {
    min: 2500,
    max: 4000,
    typical: 3000,
    label: 'Expert Deep-Dive (2-3 hr)',
  },
  bespoke_project: {
    min: 5000,
    max: 15000,
    typical: 8000,
    label: 'Bespoke Research Project',
  },
};

// Subscription state for a company
export interface CompanySubscription {
  id: string;
  companyId: string;
  tier: SubscriptionTier;
  tierConfig: SubscriptionTierConfig;
  startDate: string;
  endDate: string;

  // Credits
  totalCredits: number;
  usedCredits: number;
  reservedCredits: number;    // Credits held for pending approval requests
  remainingCredits: number;   // Available = total - used - reserved

  // Managed category slots
  slotAllowance: number;
  usedSlots: number;
  remainingSlots: number;
  activatedCategories: string[];  // Category IDs

  // Status
  isActive: boolean;
  daysRemaining: number;
}

// Credit balance status (for UI indicators)
export type CreditStatus = 'healthy' | 'warning' | 'critical';

export function getCreditStatus(remaining: number, total: number): CreditStatus {
  const percentage = (remaining / total) * 100;
  if (percentage > 50) return 'healthy';
  if (percentage > 20) return 'warning';
  return 'critical';
}

// Format credit amount for display
export function formatCredits(amount: number): string {
  return amount.toLocaleString();
}

// Format credit cost range
export function formatCreditRange(type: string): string {
  const cost = CREDIT_COSTS[type];
  if (!cost) return 'N/A';
  if (cost.min === cost.max) return formatCredits(cost.min);
  return `${formatCredits(cost.min)}-${formatCredits(cost.max)}`;
}
