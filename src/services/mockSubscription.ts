// Mock subscription and credit data for P1 demo
// This will be replaced with real API calls post-April

import type {
  CompanySubscription,
  CreditTransaction,
  SubscriptionTier,
} from '../types/subscription';
import { SUBSCRIPTION_TIERS } from '../types/subscription';

// Mock subscription for demo (Acme Corp on Business tier)
export const MOCK_SUBSCRIPTION: CompanySubscription = {
  id: 'sub_001',
  companyId: 'comp_001',
  tier: 'business' as SubscriptionTier,
  tierConfig: SUBSCRIPTION_TIERS.business,
  startDate: '2024-03-15',
  endDate: '2025-03-15',

  // Credits: $75k plan with bonus = 80,000 credits, 27,550 used
  totalCredits: 80000,
  usedCredits: 27550,
  reservedCredits: 0,         // No pending approvals initially
  remainingCredits: 52450,    // Available = total - used - reserved

  // Slots: 35 allowed, 28 used
  slotAllowance: 35,
  usedSlots: 28,
  remainingSlots: 7,
  activatedCategories: [
    'cat_steel',
    'cat_aluminum',
    'cat_copper',
    'cat_corrugated',
    'cat_flexible_packaging',
    'cat_rigid_plastics',
    'cat_contract_logistics',
    'cat_ocean_freight',
    'cat_air_freight',
    'cat_it_staffing',
    'cat_cloud_services',
    'cat_software_licensing',
    'cat_industrial_chemicals',
    'cat_specialty_chemicals',
    'cat_natural_gas',
    'cat_electricity',
    'cat_mro_supplies',
    'cat_industrial_equipment',
    'cat_marketing_services',
    'cat_media_buying',
    'cat_temp_staffing',
    'cat_benefits_admin',
    'cat_facility_management',
    'cat_security_services',
    'cat_corporate_travel',
    'cat_fleet_management',
    'cat_legal_services',
    'cat_consulting',
  ],

  isActive: true,
  daysRemaining: 59, // About 2 months until renewal
};

// Mock recent transactions
export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'txn_001',
    type: 'report_upgrade',
    amount: -2000,
    balance: 52450,
    description: 'Steel Pricing Report Upgrade',
    requestId: 'req_001',
    createdAt: '2025-01-12T10:30:00Z',
    createdBy: 'user_003',
  },
  {
    id: 'txn_002',
    type: 'analyst_call',
    amount: -500,
    balance: 54450,
    description: 'Analyst Call - Sarah Chen (Steel Market)',
    createdAt: '2025-01-10T14:00:00Z',
    createdBy: 'user_003',
  },
  {
    id: 'txn_003',
    type: 'report_upgrade',
    amount: -1500,
    balance: 54950,
    description: 'Packaging Cost Assessment',
    requestId: 'req_002',
    createdAt: '2025-01-08T09:15:00Z',
    createdBy: 'user_004',
  },
  {
    id: 'txn_004',
    type: 'expert_consult',
    amount: -1000,
    balance: 56450,
    description: 'Expert Consultation - Logistics Strategy',
    requestId: 'req_003',
    createdAt: '2025-01-05T16:00:00Z',
    createdBy: 'user_002',
  },
  {
    id: 'txn_005',
    type: 'analyst_qa',
    amount: -250,
    balance: 57450,
    description: 'Analyst Q&A - Aluminum Price Outlook',
    createdAt: '2025-01-03T11:30:00Z',
    createdBy: 'user_003',
  },
  {
    id: 'txn_006',
    type: 'report_upgrade',
    amount: -2500,
    balance: 57700,
    description: 'Chemical Procurement Analysis',
    requestId: 'req_004',
    createdAt: '2024-12-28T14:45:00Z',
    createdBy: 'user_005',
  },
  {
    id: 'txn_007',
    type: 'expert_deepdive',
    amount: -3000,
    balance: 60200,
    description: 'Expert Deep-Dive - Supply Chain Risk',
    requestId: 'req_005',
    createdAt: '2024-12-20T10:00:00Z',
    createdBy: 'user_002',
  },
  {
    id: 'txn_008',
    type: 'allocation',
    amount: 80000,
    balance: 63200,
    description: 'Annual credit allocation (Business Plan + Bonus)',
    createdAt: '2024-03-15T00:00:00Z',
    createdBy: 'system',
  },
];

// Helper to get subscription by company ID (mock)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockSubscription(_companyId: string): CompanySubscription {
  // In real app, this would fetch from API
  return MOCK_SUBSCRIPTION;
}

// Helper to get transactions for a company (mock)
export function getMockTransactions(_companyId: string, limit?: number): CreditTransaction[] {
  const transactions = [...MOCK_TRANSACTIONS];
  return limit ? transactions.slice(0, limit) : transactions;
}

// Simulate credit deduction (for demo)
export function simulateCreditDeduction(
  subscription: CompanySubscription,
  amount: number,
  description: string
): { subscription: CompanySubscription; transaction: CreditTransaction } {
  const newBalance = subscription.remainingCredits - amount;

  const updatedSubscription: CompanySubscription = {
    ...subscription,
    usedCredits: subscription.usedCredits + amount,
    remainingCredits: newBalance,
  };

  const transaction: CreditTransaction = {
    id: `txn_${Date.now()}`,
    type: 'report_upgrade',
    amount: -amount,
    balance: newBalance,
    description,
    createdAt: new Date().toISOString(),
    createdBy: 'current_user',
  };

  return { subscription: updatedSubscription, transaction };
}
