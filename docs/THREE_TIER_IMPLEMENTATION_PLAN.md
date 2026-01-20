# Three-Tier Architecture Implementation Plan

> **Target**: April MVP (Phase 1)
> **Last Updated**: January 2025
> **Status**: Planning Complete - Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Locked Decisions](#locked-decisions)
4. [Phase 1 Scope](#phase-1-scope)
5. [Type Definitions](#type-definitions)
6. [Component Specifications](#component-specifications)
7. [Mock Data Specifications](#mock-data-specifications)
8. [Implementation Checklist](#implementation-checklist)
9. [File Change Map](#file-change-map)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### The Three Layers

| Layer | Name | Description | Cost Model |
|-------|------|-------------|------------|
| **L1** | Abi (Pure AI) | AI-generated from web + Beroe + partner data. Any category/region instantly. | FREE (unlimited) |
| **L2a** | Decision Grade - Managed | ~500 Beroe-validated categories. Client picks N based on "Slot Allowance". | FREE (uses subscription slots) |
| **L2b** | Decision Grade - On-Request | Upgrade any L1 report. Categories outside the 500. | CREDITS (1,500-3,000) |
| **L3** | Bespoke / White-Glove | External expert network. Strategic projects, negotiations. | CREDITS (5,000-15,000+) |

### Key P1 Deliverables

1. **Layer Badge System** - Visual provenance on all AI content
2. **Credit Ticker** - Header widget showing balance (read-only, mock data)
3. **Upgrade Flow** - CTA → Form → Success (logs to console)
4. **Expert Portal Demo** - Static dashboard showcasing the "Uber driver view"
5. **Community Removal** - Hide from nav and value ladder actions

---

## Architecture Overview

### Current System (Before)

```
┌─────────────────────────────────────────────────────────────┐
│  Value Ladder (4 Layers) - src/types/aiResponse.ts          │
│  ├── Layer 1: AI Response (base)                            │
│  ├── Layer 2: AnalystConnectArtifact                        │
│  ├── Layer 3: ExpertRequestArtifact                         │
│  └── Layer 4: CommunityEmbedArtifact ← TO BE REMOVED        │
└─────────────────────────────────────────────────────────────┘
```

### Target System (After)

```
┌─────────────────────────────────────────────────────────────┐
│  Three-Tier Architecture                                     │
│  ├── L1: Abi (Pure AI) - Unlimited                          │
│  ├── L2a: Managed Categories - Slot-based                   │
│  ├── L2b: On-Request Upgrades - Credit-based                │
│  └── L3: Bespoke Expert Network - Credit-based              │
│                                                              │
│  Cross-Cutting:                                              │
│  ├── Credit System (read-only in P1)                        │
│  ├── Approval Workflow (concept only in P1)                 │
│  ├── Org Hierarchy (Company → Teams → Users)                │
│  └── Expert Portal (demo in P1)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Locked Decisions

### 1. Credit Model

```
1 Credit = $1.00 (internal accounting)

Subscription Tiers with Bonus Credits:
┌────────────────┬──────────┬──────────┬────────┬─────────────────┐
│ Tier           │ Price    │ Credits  │ Bonus  │ Slot Allowance  │
├────────────────┼──────────┼──────────┼────────┼─────────────────┤
│ Starter        │ $25,000  │ 25,000   │ —      │ 10 categories   │
│ Professional   │ $50,000  │ 52,500   │ +5%    │ 20 categories   │
│ Business       │ $75,000  │ 80,000   │ +6.7%  │ 35 categories   │
│ Enterprise     │ $100,000 │ 110,000  │ +10%   │ 50 categories   │
└────────────────┴──────────┴──────────┴────────┴─────────────────┘

Credit Costs:
┌─────────────────────────────┬─────────┬──────────────────┐
│ Action                      │ Credits │ Approval         │
├─────────────────────────────┼─────────┼──────────────────┤
│ L1 AI Query                 │ FREE    │ —                │
│ L2a Managed Category        │ FREE    │ — (uses slot)    │
│ Analyst Q&A (async)         │ 250     │ Auto             │
│ Analyst Call (30 min)       │ 500     │ Auto             │
│ L2b Report Upgrade          │ 1,500-3k│ If >$500         │
│ Expert Consultation (1 hr)  │ 1,000   │ Approver         │
│ Expert Deep-Dive (2-3 hr)   │ 3,000   │ Approver         │
│ Bespoke Project             │ 5k-15k  │ Approver + Admin │
└─────────────────────────────┴─────────┴──────────────────┘
```

### 2. Managed Categories (L2a)

- Beroe maintains master catalog of ~500 validated categories
- Client subscription determines "Slot Allowance" (e.g., 35 slots)
- Client selects which categories from the 500 to activate
- Categories outside the 500 require L2b credit request

### 3. Expert Network (L3)

- **External** SME network (not internal Beroe analysts)
- Former CPOs, category managers, industry practitioners
- Higher rates, premium positioning
- SOW-based engagements for larger projects

### 4. Organization Model

```
Company (e.g., Acme Corp)
├── Subscription (tier, credits, slots)
├── Team: Direct Materials
│   ├── Credit Allocation: 40,000
│   ├── Sarah Chen (Admin)
│   ├── Michael Torres (Approver)
│   └── Emily Watson (User)
└── Team: Indirect Procurement
    ├── Credit Allocation: 40,000
    ├── David Kim (Approver)
    └── Lisa Chen (User)

Roles:
- Admin: Manages credit allocation across teams, approves all
- Approver (CPO/Director): Authorizes high-credit requests
- User (Category Manager): Consumes intelligence, requests upgrades
```

### 5. Approval Workflow

**Status**: Concept in P1, await confirmation before full implementation

```
Proposed Thresholds:
- < $500: Auto-approved
- $500-$2,000: Team Approver
- > $2,000: Admin

Escalation: 48h timeout → next level
```

---

## Phase 1 Scope

### In Scope (P1 - April)

| Category | Item | Notes |
|----------|------|-------|
| **Layer System** | LayerBadge component | L1/L2a/L2b/L3 variants with styling |
| | Badge integration | On all AI responses and artifacts |
| | Provenance copy | "Generated from...", "Validated by..." |
| **Credit System** | CreditTicker | Header widget, read-only, mock data |
| | CreditDrawer | Expanded mini-ledger view |
| | Cost display | Show estimates on upgrade forms |
| **Upgrade Flow** | Upgrade CTA | Replace community action |
| | UpgradeRequestForm | Lightweight modal |
| | Success state | Toast confirmation |
| | Data capture | Log to console (demo) |
| **Expert Portal** | ExpertDashboardView | Static demo with mock data |
| | Ratings display | Mock ratings and reviews |
| | Earnings summary | Mock earnings data |
| | Call schedule | Mock upcoming calls |
| **Cleanup** | Remove community | From ValueLadderActions |
| | Hide community nav | Keep code, hide routes |

### Out of Scope (Vision - Post-April)

- Real credit ledger / database tables
- Approval workflow backend
- Expert matching algorithm
- Managed categories admin UI
- Full org/team management UI
- Bespoke project rooms
- SOW management
- Nnamu integration

---

## Type Definitions

### File: `src/types/subscription.ts` (NEW)

```typescript
// Subscription tier definitions
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
    features: ['Unlimited AI queries', '10 managed categories', 'Email support'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 50000,
    baseCredits: 50000,
    bonusCredits: 2500,
    totalCredits: 52500,
    slotAllowance: 20,
    features: ['Unlimited AI queries', '20 managed categories', 'Analyst Q&A', 'Priority support'],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 75000,
    baseCredits: 75000,
    bonusCredits: 5000,
    totalCredits: 80000,
    slotAllowance: 35,
    features: ['Unlimited AI queries', '35 managed categories', 'Analyst calls', 'Expert network access'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 100000,
    baseCredits: 100000,
    bonusCredits: 10000,
    totalCredits: 110000,
    slotAllowance: 50,
    features: ['Unlimited AI queries', '50 managed categories', 'Dedicated analyst', 'Custom integrations'],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    price: 0,
    baseCredits: 0,
    bonusCredits: 0,
    totalCredits: 0,
    slotAllowance: 0,
    features: ['Custom pricing', 'Custom features'],
  },
};

// Credit transaction types
export type CreditTransactionType =
  | 'allocation'      // Initial or top-up allocation
  | 'analyst_qa'      // Analyst Q&A (async)
  | 'analyst_call'    // Analyst call (30 min)
  | 'report_upgrade'  // L2b report upgrade
  | 'expert_consult'  // Expert consultation
  | 'expert_deepdive' // Expert deep-dive session
  | 'bespoke_project' // Bespoke research project
  | 'refund'          // Credit refund
  | 'adjustment';     // Manual adjustment

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
export const CREDIT_COSTS: Record<string, { min: number; max: number; typical: number }> = {
  analyst_qa: { min: 200, max: 300, typical: 250 },
  analyst_call: { min: 400, max: 600, typical: 500 },
  report_upgrade: { min: 1500, max: 3000, typical: 2000 },
  expert_consult: { min: 800, max: 1500, typical: 1000 },
  expert_deepdive: { min: 2500, max: 4000, typical: 3000 },
  bespoke_project: { min: 5000, max: 15000, typical: 8000 },
};

// Subscription state for a company
export interface CompanySubscription {
  id: string;
  companyId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  slotAllowance: number;
  usedSlots: number;
  remainingSlots: number;
  activatedCategories: string[];  // Category IDs
}
```

### File: `src/types/organization.ts` (NEW)

```typescript
// User roles in the organization
export type OrgRole = 'admin' | 'approver' | 'user';

export interface OrgRoleConfig {
  id: OrgRole;
  name: string;
  description: string;
  canRequest: boolean;
  canApprove: boolean;
  canAllocate: boolean;
  canViewAllTeams: boolean;
  approvalLimit?: number;  // Max amount they can approve (undefined = unlimited)
}

export const ORG_ROLES: Record<OrgRole, OrgRoleConfig> = {
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Manages credit allocation across teams',
    canRequest: true,
    canApprove: true,
    canAllocate: true,
    canViewAllTeams: true,
    approvalLimit: undefined,  // Can approve any amount
  },
  approver: {
    id: 'approver',
    name: 'Approver',
    description: 'Authorizes high-credit requests for their team',
    canRequest: true,
    canApprove: true,
    canAllocate: false,
    canViewAllTeams: false,
    approvalLimit: 5000,  // Can approve up to $5,000
  },
  user: {
    id: 'user',
    name: 'User',
    description: 'Consumes intelligence and requests upgrades',
    canRequest: true,
    canApprove: false,
    canAllocate: false,
    canViewAllTeams: false,
  },
};

// Company (top-level organization)
export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  subscriptionId: string;
  createdAt: string;
}

// Team within a company
export interface Team {
  id: string;
  companyId: string;
  name: string;
  creditAllocation: number;   // Credits allocated to this team
  usedCredits: number;
  remainingCredits: number;
  memberCount: number;
  createdAt: string;
}

// Team member (user with role)
export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  companyId: string;
  role: OrgRole;
  displayName: string;
  email: string;
  avatarUrl?: string;
  title?: string;             // Job title
  joinedAt: string;
}

// Current user's org context
export interface OrgContext {
  company: Company;
  team: Team;
  member: TeamMember;
  subscription: CompanySubscription;
  permissions: OrgRoleConfig;
}
```

### File: `src/types/requests.ts` (NEW)

```typescript
import type { CreditTransactionType } from './subscription';

// Request status
export type RequestStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'denied'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Request type (maps to credit transaction type)
export type RequestType =
  | 'analyst_qa'
  | 'analyst_call'
  | 'report_upgrade'
  | 'expert_consult'
  | 'expert_deepdive'
  | 'bespoke_project';

// Upgrade request
export interface UpgradeRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;

  // Requester info
  requesterId: string;
  requesterName: string;
  teamId: string;
  companyId: string;

  // Request details
  title: string;
  description: string;
  context?: {
    reportId?: string;
    reportTitle?: string;
    categoryId?: string;
    categoryName?: string;
    queryText?: string;
  };

  // Cost
  estimatedCredits: number;
  actualCredits?: number;

  // Approval
  requiresApproval: boolean;
  approverId?: string;
  approverName?: string;
  approvalNote?: string;
  approvedAt?: string;
  deniedAt?: string;
  denialReason?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Approval thresholds
export const APPROVAL_THRESHOLDS = {
  autoApprove: 500,        // < $500 auto-approved
  approverLimit: 2000,     // $500-$2000 team approver
  adminRequired: 2000,     // > $2000 requires admin
  escalationHours: 48,     // Hours before escalation
} as const;

// Helper to determine approval requirement
export function getApprovalRequirement(credits: number): 'auto' | 'approver' | 'admin' {
  if (credits < APPROVAL_THRESHOLDS.autoApprove) return 'auto';
  if (credits <= APPROVAL_THRESHOLDS.approverLimit) return 'approver';
  return 'admin';
}
```

### File: `src/types/layers.ts` (NEW)

```typescript
// Content layer types
export type ContentLayer = 'L1' | 'L2a' | 'L2b' | 'L3';

export interface LayerConfig {
  id: ContentLayer;
  name: string;
  shortName: string;
  description: string;
  badgeText: string;
  badgeIcon: string;       // Lucide icon name
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  provenanceCopy: string;  // "Generated from...", "Validated by..."
}

export const LAYER_CONFIGS: Record<ContentLayer, LayerConfig> = {
  L1: {
    id: 'L1',
    name: 'AI Generated',
    shortName: 'AI',
    description: 'Generated by Abi using web and Beroe data',
    badgeText: 'AI Generated',
    badgeIcon: 'Bot',
    colorScheme: {
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-600',
      icon: 'text-slate-500',
    },
    provenanceCopy: 'Generated from Beroe data and web sources',
  },
  L2a: {
    id: 'L2a',
    name: 'Analyst Verified',
    shortName: 'Verified',
    description: 'Validated by Beroe category analysts',
    badgeText: 'Analyst Verified',
    badgeIcon: 'CheckCircle',
    colorScheme: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
      icon: 'text-teal-600',
    },
    provenanceCopy: 'Validated by Beroe analysts',
  },
  L2b: {
    id: 'L2b',
    name: 'Decision Grade',
    shortName: 'Decision',
    description: 'Custom analysis upgraded from AI report',
    badgeText: 'Decision Grade',
    badgeIcon: 'Star',
    colorScheme: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-700',
      icon: 'text-violet-600',
    },
    provenanceCopy: 'Custom analysis for your query',
  },
  L3: {
    id: 'L3',
    name: 'Bespoke',
    shortName: 'Bespoke',
    description: 'Strategic brief from expert network',
    badgeText: 'Bespoke',
    badgeIcon: 'Crown',
    colorScheme: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'text-amber-600',
    },
    provenanceCopy: 'Strategic brief by expert network',
  },
};

// Determine layer from response metadata
export function getContentLayer(metadata: {
  isManaged?: boolean;
  isUpgraded?: boolean;
  isBespoke?: boolean;
}): ContentLayer {
  if (metadata.isBespoke) return 'L3';
  if (metadata.isUpgraded) return 'L2b';
  if (metadata.isManaged) return 'L2a';
  return 'L1';
}
```

### File: `src/types/expert.ts` (NEW)

```typescript
// Expert availability status
export type ExpertAvailability = 'available' | 'busy' | 'offline';

// Expert profile (for L3 expert network)
export interface Expert {
  id: string;
  name: string;
  title: string;
  photo?: string;

  // Background
  formerCompany: string;
  formerTitle: string;
  yearsExperience: number;

  // Expertise
  specialties: string[];
  industries: string[];
  regions: string[];

  // Ratings
  rating: number;           // 1-5 scale
  totalRatings: number;
  totalEngagements: number;

  // Availability
  availability: ExpertAvailability;
  responseTime: string;     // "~24 hours"

  // Rates (in credits)
  hourlyRate: number;       // Credits per hour

  // Badges
  isTopVoice: boolean;
  isVerified: boolean;
}

// Expert engagement (completed or in-progress)
export interface ExpertEngagement {
  id: string;
  expertId: string;
  requestId: string;

  // Type
  type: 'consultation' | 'deep_dive' | 'bespoke_project';

  // Details
  title: string;
  description: string;

  // Schedule
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;        // Minutes

  // Cost
  credits: number;

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Rating (after completion)
  rating?: number;
  review?: string;
}

// Expert earnings summary (for expert portal)
export interface ExpertEarnings {
  expertId: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all_time';

  // Summary
  totalEngagements: number;
  totalHours: number;
  totalEarnings: number;    // In dollars

  // Breakdown
  consultations: number;
  deepDives: number;
  bespokeProjects: number;

  // Ratings
  averageRating: number;
  totalRatings: number;
}

// Expert dashboard stats (for expert portal view)
export interface ExpertDashboardStats {
  expert: Expert;
  earnings: ExpertEarnings;
  upcomingCalls: ExpertEngagement[];
  recentReviews: Array<{
    rating: number;
    review: string;
    clientName: string;
    date: string;
  }>;
}
```

### File: `src/types/managedCategories.ts` (NEW)

```typescript
// Managed category (from Beroe's 500 catalog)
export interface ManagedCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;        // For hierarchy

  // Classification
  domain: string;           // "Packaging", "Metals", "Logistics", etc.
  subDomain?: string;

  // Analyst coverage
  leadAnalyst: {
    id: string;
    name: string;
    photo?: string;
  };

  // Update frequency
  updateFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  lastUpdated: string;

  // Content availability
  hasMarketReport: boolean;
  hasPriceIndex: boolean;
  hasSupplierData: boolean;

  // SLA
  responseTimeSla: string;  // "24 hours"
}

// Client's activated categories
export interface ActivatedCategory {
  categoryId: string;
  category: ManagedCategory;
  activatedAt: string;
  activatedBy: string;
}

// Category slot summary for a company
export interface CategorySlotSummary {
  companyId: string;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  activatedCategories: ActivatedCategory[];
}
```

---

## Component Specifications

### 1. LayerBadge Component

**File**: `src/components/ui/LayerBadge.tsx`

**Purpose**: Display content provenance badge (L1/L2a/L2b/L3)

**Props**:
```typescript
interface LayerBadgeProps {
  layer: ContentLayer;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;      // Show text label or icon only
  showProvenance?: boolean; // Show "Generated from..." text
  analystName?: string;     // For L2a: "Validated by Sarah Chen"
  expertName?: string;      // For L3: "Brief by Michael Torres"
  className?: string;
}
```

**Variants**:
- `sm`: Icon only (16px), used inline in lists
- `md`: Icon + short label (default), used on cards
- `lg`: Icon + full label + provenance, used on artifacts

**Visual Design**:
```
L1 (AI Generated):
┌─────────────────────┐
│ 🤖 AI Generated     │  Slate/neutral
└─────────────────────┘

L2a (Analyst Verified):
┌─────────────────────┐
│ ✓ Analyst Verified  │  Teal/Beroe
└─────────────────────┘

L2b (Decision Grade):
┌─────────────────────┐
│ ⭐ Decision Grade    │  Violet
└─────────────────────┘

L3 (Bespoke):
┌─────────────────────┐
│ 👑 Bespoke          │  Gold/Premium
└─────────────────────┘
```

---

### 2. CreditTicker Component

**File**: `src/components/subscription/CreditTicker.tsx`

**Purpose**: Header widget showing remaining credit balance

**Props**:
```typescript
interface CreditTickerProps {
  balance: number;
  totalCredits: number;
  usedCredits: number;
  periodEnd: string;        // Subscription period end date
  onExpand?: () => void;    // Open CreditDrawer
  className?: string;
}
```

**States**:
- **Healthy** (>50% remaining): Green accent
- **Warning** (20-50% remaining): Amber accent
- **Critical** (<20% remaining): Red accent

**Visual Design**:
```
Collapsed (header pill):
┌──────────────────────────┐
│ 💳 52,450 credits    ▼  │
└──────────────────────────┘

On hover/click → expands to CreditDrawer
```

---

### 3. CreditDrawer Component

**File**: `src/components/subscription/CreditDrawer.tsx`

**Purpose**: Expanded view of credit balance and recent transactions

**Props**:
```typescript
interface CreditDrawerProps {
  subscription: CompanySubscription;
  transactions: CreditTransaction[];
  team?: Team;
  onClose?: () => void;
  onViewFullStatement?: () => void;
}
```

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Your Subscription                    [X]       │
│  ─────────────────────────────────────────────  │
│  Business Plan · Renews Mar 15, 2025            │
│                                                 │
│  Credit Balance                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 52,450 / 80,000                         │   │
│  │ ████████████████████░░░░░░░  66%        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Recent Activity                                │
│  ─────────────────────────────────────────────  │
│  • Steel Report Upgrade      -2,000   Jan 12   │
│  • Analyst Call (M. Chen)    -500     Jan 10   │
│  • Packaging Assessment      -1,500   Jan 8    │
│                                                 │
│  [View Full Statement]                          │
└─────────────────────────────────────────────────┘
```

---

### 4. UpgradeRequestForm Component

**File**: `src/components/requests/UpgradeRequestForm.tsx`

**Purpose**: Modal for requesting L2b report upgrades

**Props**:
```typescript
interface UpgradeRequestFormProps {
  reportTitle: string;
  reportId: string;
  categoryName?: string;
  estimatedCredits: number;
  userBalance: number;
  onSubmit: (request: Partial<UpgradeRequest>) => void;
  onCancel: () => void;
}
```

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Request Decision-Grade Analysis          [X]   │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📊 Steel Pricing Forecast - Q2 2025            │
│                                                 │
│  What you'll get:                               │
│  ✓ Analyst validation of key data points        │
│  ✓ Confidence intervals on forecasts            │
│  ✓ Direct Q&A with category specialist          │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Estimated cost         ~2,000 credits   │   │
│  │ Your balance           52,450 credits   │   │
│  │ Requires approval      Yes (>$500)      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Additional context (optional):                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Need this for Q2 contract negotiations  │   │
│  │ with our primary steel supplier...      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Cancel]                    [Submit Request]   │
└─────────────────────────────────────────────────┘
```

---

### 5. SlotAllowanceCard Component

**File**: `src/components/subscription/SlotAllowanceCard.tsx`

**Purpose**: Display managed category slot usage

**Props**:
```typescript
interface SlotAllowanceCardProps {
  totalSlots: number;
  usedSlots: number;
  activatedCategories: ActivatedCategory[];
  onManageCategories?: () => void;
}
```

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Managed Categories                             │
│  ─────────────────────────────────────────────  │
│  28 of 35 slots used                            │
│  ████████████████████████░░░░░░░  80%           │
│                                                 │
│  Active: Steel, Aluminum, Packaging, ...        │
│                                                 │
│  [Manage Categories]                            │
└─────────────────────────────────────────────────┘
```

---

### 6. ExpertDashboardView (Demo)

**File**: `src/views/ExpertDashboardView.tsx`

**Purpose**: Static demo of expert portal ("Uber driver view")

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Expert Dashboard                        [Michael Torres] 👤    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  4.8 ⭐  │  │   127    │  │ $12,400  │  │    3     │        │
│  │  Rating  │  │  Calls   │  │  Earned  │  │ Pending  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                 │
│  Upcoming Calls                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Today 2:00 PM  │ Steel Pricing  │ Acme Corp     │ [Join]      │
│  Today 4:30 PM  │ Packaging      │ GlobalTech    │ [Prep]      │
│  Tomorrow 10am  │ Logistics      │ Acme Corp     │ [View]      │
│                                                                 │
│  Recent Reviews                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ⭐⭐⭐⭐⭐ "Incredibly knowledgeable on Asian markets"           │
│  Jan 10 · Sarah Chen, Acme Corp                                 │
│                                                                 │
│  ⭐⭐⭐⭐ "Good insights, call ran a bit long"                    │
│  Jan 8 · David Kim, TechFlow                                    │
│                                                                 │
│  Earnings This Month                                            │
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    $3,200                                │   │
│  │  ▁▂▃▄▅▆▇█▇▆▅  (chart)                                   │   │
│  │  Week 1  Week 2  Week 3  Week 4                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mock Data Specifications

### File: `src/services/mockSubscription.ts`

```typescript
// Mock subscription for demo
export const MOCK_SUBSCRIPTION: CompanySubscription = {
  id: 'sub_001',
  companyId: 'comp_001',
  tier: 'business',
  startDate: '2024-03-15',
  endDate: '2025-03-15',
  totalCredits: 80000,
  usedCredits: 27550,
  remainingCredits: 52450,
  slotAllowance: 35,
  usedSlots: 28,
  remainingSlots: 7,
  activatedCategories: [
    'cat_steel', 'cat_aluminum', 'cat_copper',
    'cat_corrugated', 'cat_flexible_packaging',
    // ... 28 total
  ],
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
    createdBy: 'user_001',
  },
  {
    id: 'txn_002',
    type: 'analyst_call',
    amount: -500,
    balance: 54450,
    description: 'Analyst Call - Sarah Chen (Steel)',
    createdAt: '2025-01-10T14:00:00Z',
    createdBy: 'user_001',
  },
  // ... more transactions
];
```

### File: `src/services/mockOrganization.ts`

```typescript
// Mock company
export const MOCK_COMPANY: Company = {
  id: 'comp_001',
  name: 'Acme Corporation',
  logo: '/logos/acme.svg',
  industry: 'Manufacturing',
  subscriptionId: 'sub_001',
  createdAt: '2024-01-15T00:00:00Z',
};

// Mock teams
export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_001',
    companyId: 'comp_001',
    name: 'Direct Materials',
    creditAllocation: 40000,
    usedCredits: 15000,
    remainingCredits: 25000,
    memberCount: 4,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'team_002',
    companyId: 'comp_001',
    name: 'Indirect Procurement',
    creditAllocation: 40000,
    usedCredits: 12550,
    remainingCredits: 27450,
    memberCount: 3,
    createdAt: '2024-01-15T00:00:00Z',
  },
];

// Mock team members
export const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'member_001',
    userId: 'user_001',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'admin',
    displayName: 'Sarah Chen',
    email: 'sarah.chen@acme.com',
    avatarUrl: '/avatars/sarah.jpg',
    title: 'VP of Procurement',
    joinedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'member_002',
    userId: 'user_002',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'approver',
    displayName: 'Michael Torres',
    email: 'michael.torres@acme.com',
    avatarUrl: '/avatars/michael.jpg',
    title: 'Director, Direct Materials',
    joinedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'member_003',
    userId: 'user_003',
    teamId: 'team_001',
    companyId: 'comp_001',
    role: 'user',
    displayName: 'Emily Watson',
    email: 'emily.watson@acme.com',
    avatarUrl: '/avatars/emily.jpg',
    title: 'Category Manager, Metals',
    joinedAt: '2024-03-01T00:00:00Z',
  },
  // ... more members
];

// Current user context (for demo)
export const MOCK_CURRENT_USER: TeamMember = MOCK_MEMBERS[2]; // Emily Watson (User role)
```

### File: `src/services/mockExpert.ts`

```typescript
// Mock expert for portal demo
export const MOCK_EXPERT: Expert = {
  id: 'expert_001',
  name: 'Michael Torres',
  title: 'Supply Chain Strategy Consultant',
  photo: '/avatars/expert-michael.jpg',
  formerCompany: 'Procter & Gamble',
  formerTitle: 'VP Global Procurement',
  yearsExperience: 22,
  specialties: ['Steel', 'Metals', 'Commodity Strategy', 'Supplier Negotiations'],
  industries: ['Manufacturing', 'Consumer Goods', 'Automotive'],
  regions: ['North America', 'Asia Pacific'],
  rating: 4.8,
  totalRatings: 127,
  totalEngagements: 89,
  availability: 'available',
  responseTime: '~24 hours',
  hourlyRate: 1000,
  isTopVoice: true,
  isVerified: true,
};

// Mock expert dashboard stats
export const MOCK_EXPERT_DASHBOARD: ExpertDashboardStats = {
  expert: MOCK_EXPERT,
  earnings: {
    expertId: 'expert_001',
    period: 'month',
    totalEngagements: 8,
    totalHours: 14,
    totalEarnings: 12400,
    consultations: 5,
    deepDives: 2,
    bespokeProjects: 1,
    averageRating: 4.8,
    totalRatings: 8,
  },
  upcomingCalls: [
    {
      id: 'eng_001',
      expertId: 'expert_001',
      requestId: 'req_010',
      type: 'consultation',
      title: 'Steel Pricing Strategy',
      description: 'Q2 pricing outlook and negotiation strategy',
      scheduledAt: '2025-01-15T14:00:00Z',
      status: 'scheduled',
      credits: 1000,
    },
    // ... more calls
  ],
  recentReviews: [
    {
      rating: 5,
      review: 'Incredibly knowledgeable on Asian steel markets. Gave us actionable insights for our Q2 negotiations.',
      clientName: 'Sarah Chen',
      date: '2025-01-10',
    },
    {
      rating: 4,
      review: 'Good insights on packaging trends. Call ran a bit long but valuable overall.',
      clientName: 'David Kim',
      date: '2025-01-08',
    },
  ],
};
```

### File: `src/services/mockCategories.ts`

```typescript
// Sample of the 500 managed categories
export const MOCK_MANAGED_CATEGORIES: ManagedCategory[] = [
  {
    id: 'cat_steel',
    name: 'Steel',
    slug: 'steel',
    domain: 'Metals',
    subDomain: 'Ferrous',
    leadAnalyst: {
      id: 'analyst_001',
      name: 'Sarah Chen',
      photo: '/avatars/sarah.jpg',
    },
    updateFrequency: 'weekly',
    lastUpdated: '2025-01-12T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
  },
  {
    id: 'cat_aluminum',
    name: 'Aluminum',
    slug: 'aluminum',
    domain: 'Metals',
    subDomain: 'Non-Ferrous',
    leadAnalyst: {
      id: 'analyst_002',
      name: 'James Park',
      photo: '/avatars/james.jpg',
    },
    updateFrequency: 'weekly',
    lastUpdated: '2025-01-11T00:00:00Z',
    hasMarketReport: true,
    hasPriceIndex: true,
    hasSupplierData: true,
    responseTimeSla: '24 hours',
  },
  // ... ~500 total categories
];

// Domains for grouping
export const CATEGORY_DOMAINS = [
  { id: 'metals', name: 'Metals', count: 18 },
  { id: 'packaging', name: 'Packaging', count: 12 },
  { id: 'logistics', name: 'Logistics', count: 15 },
  { id: 'it_services', name: 'IT Services', count: 22 },
  { id: 'chemicals', name: 'Chemicals', count: 25 },
  { id: 'energy', name: 'Energy', count: 14 },
  // ... more domains
];
```

---

## Implementation Checklist

### Phase 1a: Foundation (Types & Mock Data) ✅

- [x] Create `src/types/subscription.ts`
- [x] Create `src/types/organization.ts`
- [x] Create `src/types/requests.ts`
- [x] Create `src/types/layers.ts`
- [x] Create `src/types/expert.ts`
- [x] Create `src/types/managedCategories.ts`
- [x] Create `src/services/mockSubscription.ts`
- [x] Create `src/services/mockOrganization.ts`
- [x] Create `src/services/mockExpert.ts`
- [x] Create `src/services/mockCategories.ts`

### Phase 1b: Layer Badge System ✅

- [x] Create `src/components/ui/LayerBadge.tsx`
- [x] Add layer field to AI response types
- [x] Integrate LayerBadge into `AIResponse.tsx`
- [x] Integrate LayerBadge into artifact headers (conditional on contentLayer prop)
- [x] Test all badge variants (L1/L2a/L2b/L3)

### Phase 1c: Credit System UI ✅

- [x] Create `src/components/subscription/CreditTicker.tsx`
- [x] Create `src/components/subscription/CreditDrawer.tsx`
- [x] Create `src/components/subscription/SlotAllowanceCard.tsx`
- [x] Add CreditTicker to `MainHeader.tsx`
- [x] Create subscription state in App.tsx (useState, not context)
- [x] Wire mock data to components
- [x] Wire SlotAllowanceCard into CreditDrawer

### Phase 1d: Upgrade Flow ✅

- [x] Create `src/components/upgrade/UpgradeRequestForm.tsx`
- [x] Create `src/components/upgrade/UpgradeCTA.tsx`
- [x] Modify `ValueLadderActions.tsx` - remove community, add upgrade
- [x] Wire upgrade CTA to form modal
- [x] Implement form submission with credit deduction
- [x] Create `src/components/ui/Toast.tsx` for success/pending notifications

### Phase 1e: Expert Portal Demo ✅

- [x] Create `src/views/ExpertDashboardView.tsx` (includes inline sub-components)
- [x] Expert stats, calls, reviews, earnings all in single view file
- [x] Add route via viewState='expert-dashboard'
- [x] Add nav item in Sidebar (Crown icon, amber highlight, demo mode enabled)

### Phase 1f: Community Cleanup ✅

- [x] Remove CommunityAction from `ValueLadderActions.tsx`
- [x] Hide community from navigation sidebar (commented out)
- [x] Community routes preserved but not navigable (code kept for future)
- [ ] Update AI response generation to exclude community suggestions (deferred)
- [x] Community parked per leadership direction

### Phase 1g: Integration & Polish ✅

- [x] SlotAllowanceCard wired into CreditDrawer
- [x] Expert Portal navigable from sidebar
- [x] Toast notifications for upgrade requests
- [x] Credit balance updates on request submit
- [x] Lint clean (0 errors, 0 warnings)
- [x] TypeScript clean
- [x] Tests passing (686 tests)
- [x] End-to-end flow testing
- [x] Responsive design check
- [x] Loading states and skeletons (CreditDrawer skeleton)
- [x] Error states (CreditDrawer, UpgradeRequestForm)
- [x] Accessibility review (ARIA labels, keyboard nav, focus management)

### Bonus: Approval Workflow (UI Complete, Backend Pending)

- [x] Create `src/views/ApprovalWorkflowView.tsx`
- [x] Route via viewState='approval-workflow'
- [ ] Wire API for actual approval/rejection
- [ ] Add approver notification badge in nav

---

## File Change Map

### New Files (Create)

```
src/types/
├── subscription.ts        # Subscription tiers, credits, transactions
├── organization.ts        # Company, team, user roles
├── requests.ts            # Upgrade requests, approvals
├── layers.ts              # Content layer definitions (L1/L2a/L2b/L3)
├── expert.ts              # Expert profiles, engagements
└── managedCategories.ts   # Managed category catalog

src/services/
├── mockSubscription.ts    # Mock subscription data
├── mockOrganization.ts    # Mock org structure
├── mockExpert.ts          # Mock expert data
└── mockCategories.ts      # Mock managed categories

src/components/ui/
└── LayerBadge.tsx         # Layer provenance badge

src/components/subscription/
├── CreditTicker.tsx       # Header credit widget
├── CreditDrawer.tsx       # Expanded credit view
└── SlotAllowanceCard.tsx  # Managed category slots

src/components/requests/
├── UpgradeRequestForm.tsx # Upgrade request modal
└── UpgradeCTA.tsx         # Upgrade call-to-action

src/components/expert/
├── ExpertStatsCard.tsx    # Expert stats summary
├── UpcomingCallsList.tsx  # Upcoming calls list
├── RecentReviewsList.tsx  # Recent reviews
└── EarningsChart.tsx      # Earnings visualization

src/views/
└── ExpertDashboardView.tsx # Expert portal (demo)
```

### Modified Files (Update)

```
src/types/aiResponse.ts
├── Add ContentLayer field to responses
├── Update ValueLadder to remove community
└── Add layer metadata types

src/components/chat/ValueLadderActions.tsx
├── Remove CommunityAction rendering
├── Add UpgradeCTA component
└── Update styling for new actions

src/components/chat/AIResponse.tsx
├── Import and render LayerBadge
└── Pass layer info to badge

src/components/artifacts/ArtifactRenderer.tsx
├── Add LayerBadge to artifact headers
└── Pass layer info from payload

src/components/layout/MainHeader.tsx
├── Import CreditTicker
└── Add to header layout

src/App.tsx
├── Add ExpertDashboardView route
├── Conditionally hide community routes
└── Add subscription context provider

src/services/mockData.ts
├── Update generateValueLadder() to exclude community
└── Add layer metadata to mock responses
```

---

## Testing Strategy

### Unit Tests

- [ ] LayerBadge renders correct variant for each layer
- [ ] CreditTicker displays correct balance and status colors
- [ ] UpgradeRequestForm validation works
- [ ] getApprovalRequirement returns correct thresholds

### Integration Tests

- [ ] Upgrade flow: CTA → Form → Submit → Success
- [ ] Credit display updates on mock transactions
- [ ] Layer badges appear on all AI responses
- [ ] Expert portal renders with mock data

### Visual/Manual Tests

- [ ] All layer badge variants visible in different contexts
- [ ] Credit ticker responsive at different widths
- [ ] Upgrade form modal opens/closes correctly
- [ ] Expert portal layout on desktop/tablet
- [ ] Community removed from all visible surfaces

---

## Open Items (Post-P1)

1. **Approval Workflow Backend** - Await confirmation before implementing
2. **Real Credit Ledger** - Database tables and API
3. **Expert Matching Algorithm** - ML-based expert selection
4. **Managed Categories Admin** - UI for slot management
5. **Org/Team Management** - Full admin interface
6. **Bespoke Project Rooms** - Collaboration workspace
7. **Nnamu Integration** - Negotiation tooling connection

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| Jan 2025 | Claude | Initial plan created |

