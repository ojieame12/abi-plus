# Post-April Production Readiness Plan

> **Target**: Production-ready backend systems for Three-Tier Architecture
> **Prerequisite**: P1/MVP (April) complete
> **Last Updated**: January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Schema & API Design](#phase-1-schema--api-design)
3. [Phase 2: Credit Ledger System](#phase-2-credit-ledger-system)
4. [Phase 3: Approval Workflow](#phase-3-approval-workflow)
5. [Phase 4: AI Community Removal](#phase-4-ai-community-removal)
6. [Phase 5: Production Hardening](#phase-5-production-hardening)
7. [Schema Definitions](#schema-definitions)
8. [API Contracts](#api-contracts)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Current State (Post-April MVP)

- ✅ UI components built (CreditTicker, CreditDrawer, UpgradeRequestForm, etc.)
- ✅ Mock data services in place
- ✅ Frontend approval flow UI
- ⏳ Backend systems needed for production

### Target State

```
┌─────────────────────────────────────────────────────────────────┐
│  Production Backend Systems                                      │
│  ├── Credit Ledger Service                                       │
│  │   ├── Double-entry accounting                                 │
│  │   ├── Hold/Reserve/Spend operations                           │
│  │   └── Org/Team allocation management                          │
│  ├── Approval Workflow Service                                   │
│  │   ├── Request state machine                                   │
│  │   ├── Threshold-based routing                                 │
│  │   └── Escalation & notification engine                        │
│  ├── AI Service Updates                                          │
│  │   └── Community feature flag removal                          │
│  └── Cross-Cutting                                               │
│      ├── Observability & alerting                                │
│      ├── Audit logging                                           │
│      └── Migration tooling                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Dependencies

```
Credit Ledger ──────┐
                    ├──► Approval Workflow (consumes ledger)
Org/Team Model ─────┘

AI Community Removal ──► Independent (can parallel)
```

---

## Phase 1: Schema & API Design

**Duration**: 1-2 weeks
**Goal**: Finalize data models and API contracts before implementation

### Deliverables

- [ ] Credit ledger schema (reviewed by eng + finance)
- [ ] Approval workflow schema (reviewed by eng + product)
- [ ] API contract documentation (OpenAPI/Swagger)
- [ ] Migration strategy document
- [ ] Security review sign-off

### Key Decisions Required

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Credit expiry | Roll over vs. expire annually | Roll over (simpler) |
| Multi-currency | Single (USD) vs. multi | Single for MVP |
| Ledger immutability | Soft delete vs. append-only | Append-only (audit) |
| Approval persistence | SQL vs. event-sourced | SQL + audit events |

---

## Phase 2: Credit Ledger System

**Duration**: 3-4 weeks
**Dependencies**: Phase 1 complete, Org/Team model exists

### 2a: Core Ledger Tables

```sql
-- See Schema Definitions section for full DDL
- credit_accounts (one per company)
- ledger_entries (double-entry, immutable)
- credit_holds (reservations for pending approvals)
- credit_allocations (team-level budgets)
```

### 2b: Ledger Operations

| Operation | Description | Idempotency |
|-----------|-------------|-------------|
| `createHold` | Reserve credits for pending request | By request_id |
| `releaseHold` | Cancel reservation (denied/expired) | By hold_id |
| `convertHoldToSpend` | Approved → deduct from balance | By hold_id |
| `directSpend` | Auto-approved spend (< threshold) | By idempotency_key |
| `adjustBalance` | Admin credit/debit with reason | By adjustment_id |
| `allocateToTeam` | Set team budget from company pool | By allocation_id |

### 2c: Balance Derivation

```
available_credits = total_credits - used_credits - reserved_credits

WHERE:
  total_credits = SUM(ledger_entries WHERE type = 'credit')
  used_credits = SUM(ledger_entries WHERE type = 'debit' AND status = 'completed')
  reserved_credits = SUM(credit_holds WHERE status = 'active')
```

**Important**: Never store `available_credits` - always derive from ledger.

### 2d: Reconciliation Jobs

- [ ] Daily: Integrity check (ledger sum = account balance)
- [ ] Monthly: Statement generation
- [ ] On-demand: Refund/chargeback processing
- [ ] Annual: Rollover handling (if applicable)

---

## Phase 3: Approval Workflow

**Duration**: 3-4 weeks
**Dependencies**: Phase 2 (credit holds)

### 3a: State Machine

```
                    ┌──────────────┐
                    │    DRAFT     │
                    └──────┬───────┘
                           │ submit()
                           ▼
                    ┌──────────────┐
          ┌────────│   PENDING    │────────┐
          │        └──────┬───────┘        │
          │ deny()        │ approve()      │ expire()/cancel()
          ▼               ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │    DENIED    │ │   APPROVED   │ │  CANCELLED   │
   └──────────────┘ └──────┬───────┘ └──────────────┘
                           │ fulfill()
                           ▼
                    ┌──────────────┐
                    │  FULFILLED   │
                    └──────────────┘
```

### 3b: Approval Routing Rules

```typescript
interface ApprovalRule {
  id: string;
  companyId: string;
  minCredits: number;      // Threshold start
  maxCredits: number;      // Threshold end (null = unlimited)
  approverRole: 'auto' | 'approver' | 'admin';
  escalationHours: number; // Hours before escalation
}

// Default rules
const DEFAULT_RULES = [
  { min: 0,    max: 500,   approverRole: 'auto',     escalation: null },
  { min: 500,  max: 2000,  approverRole: 'approver', escalation: 48 },
  { min: 2000, max: null,  approverRole: 'admin',    escalation: 24 },
];
```

### 3c: Notification Triggers

| Event | In-App | Email | Slack |
|-------|--------|-------|-------|
| Request submitted | Requester | - | - |
| Pending approval | Approver | Approver | Optional |
| Approved | Requester | Requester | - |
| Denied | Requester | Requester | - |
| Escalation warning (4h before) | Approver | Approver | Optional |
| Escalated | New approver | Both | Optional |
| Expired | Requester + Approver | Both | - |

### 3d: UI Integration Points

- [ ] Chat: Show request status inline with responses
- [ ] Header: Approver badge with pending count
- [ ] Settings: "My Requests" + "Pending Approvals" tabs
- [ ] Toast: Real-time status updates via WebSocket/polling

---

## Phase 4: AI Community Removal

**Duration**: 1 week
**Dependencies**: None (can parallel with Phase 2-3)

### 4a: Feature Flag

```typescript
interface FeatureFlags {
  communityEnabled: boolean;  // Default: false post-April
}

// Check at:
// 1. Prompt template selection
// 2. Value ladder generation
// 3. Suggestion engine
// 4. UI rendering (already done)
```

### 4b: Code Changes

- [ ] `src/services/ai.ts`: Skip community in value ladder generation
- [ ] `src/services/mockData.ts`: Remove community from suggestions
- [ ] Prompt templates: Remove community mention
- [ ] Tests: Update snapshots/fixtures

### 4c: Verification

- [ ] No community suggestions in any AI response
- [ ] No community routes accessible (already hidden)
- [ ] Existing community data preserved (for potential future use)

---

## Phase 5: Production Hardening

**Duration**: 2 weeks
**Dependencies**: Phases 2-4 complete

### 5a: Observability

```yaml
Metrics:
  - credit_balance_by_company (gauge)
  - credit_spend_total (counter)
  - approval_requests_by_status (gauge)
  - approval_latency_seconds (histogram)
  - ledger_integrity_check_failures (counter)

Alerts:
  - Negative balance detected (critical)
  - Approval SLA breach (warning)
  - Ledger integrity mismatch (critical)
  - High denial rate > 50% (warning)
```

### 5b: Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Double charge | Idempotency key collision | Reject duplicate |
| Orphaned hold | Hold older than 7 days | Cleanup job releases |
| Notification failure | DLQ depth > 0 | Retry with backoff |
| Ledger drift | Integrity check fails | Manual reconciliation |
| Approval timeout | Escalation job | Auto-escalate or expire |

### 5c: Security Checklist

- [ ] Org-scoped queries (no cross-tenant data access)
- [ ] Audit log for all ledger mutations
- [ ] Rate limiting on approval endpoints
- [ ] PII handling (mask in logs)
- [ ] API authentication (JWT + org claim)

### 5d: Migration Plan

```
Stage 1: Deploy schema (empty tables)
Stage 2: Backfill companies → credit_accounts
Stage 3: Seed initial balances from subscription data
Stage 4: Enable writes (new requests use real ledger)
Stage 5: Deprecate mock services
Stage 6: Monitor & validate for 1 week
Stage 7: Remove mock fallback code
```

---

## Schema Definitions

### Credit Ledger Tables

```sql
-- Company credit account (one per company)
CREATE TABLE credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),

  -- Subscription info
  subscription_tier VARCHAR(50) NOT NULL,
  subscription_start DATE NOT NULL,
  subscription_end DATE NOT NULL,

  -- Credit allocation (from subscription)
  total_credits INTEGER NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id)
);

-- Immutable ledger entries (double-entry style)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id),

  -- Entry type
  entry_type VARCHAR(20) NOT NULL, -- 'credit' | 'debit'
  amount INTEGER NOT NULL,         -- Always positive

  -- Transaction classification
  transaction_type VARCHAR(50) NOT NULL,
  -- 'allocation' | 'spend' | 'hold_conversion' | 'refund' | 'adjustment' | 'expiry'

  -- Reference to source
  reference_type VARCHAR(50),      -- 'request' | 'subscription' | 'admin'
  reference_id UUID,

  -- Audit
  description TEXT NOT NULL,
  performed_by UUID,               -- User who triggered
  idempotency_key VARCHAR(255),    -- Prevent duplicates

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Immutable: no updated_at, no deletes
  UNIQUE(idempotency_key)
);

-- Credit holds (reservations for pending approvals)
CREATE TABLE credit_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id),
  request_id UUID NOT NULL REFERENCES approval_requests(id),

  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  -- 'active' | 'converted' | 'released' | 'expired'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  UNIQUE(request_id) -- One hold per request
);

-- Team-level credit allocations
CREATE TABLE credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id),
  team_id UUID NOT NULL REFERENCES teams(id),

  allocated_credits INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(account_id, team_id, period_start)
);

-- Indexes
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at);
CREATE INDEX idx_ledger_reference ON ledger_entries(reference_type, reference_id);
CREATE INDEX idx_holds_account_status ON credit_holds(account_id, status);
```

### Approval Workflow Tables

```sql
-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  requester_id UUID NOT NULL REFERENCES users(id),

  -- Request type
  request_type VARCHAR(50) NOT NULL,
  -- 'report_upgrade' | 'analyst_qa' | 'analyst_call' | 'expert_consult' | 'expert_deepdive' | 'bespoke_project'

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- 'draft' | 'pending' | 'approved' | 'denied' | 'cancelled' | 'expired' | 'fulfilled'

  -- Request details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  context JSONB,                   -- Report ID, category, query text, etc.

  -- Credits
  estimated_credits INTEGER NOT NULL,
  actual_credits INTEGER,          -- Set on fulfillment

  -- Approval routing
  current_approver_id UUID REFERENCES users(id),
  approval_level VARCHAR(20),      -- 'auto' | 'approver' | 'admin'
  escalation_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Indexes for common queries
  CONSTRAINT valid_status CHECK (
    status IN ('draft', 'pending', 'approved', 'denied', 'cancelled', 'expired', 'fulfilled')
  )
);

-- Approval decisions (audit trail)
CREATE TABLE approval_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id),

  -- Event type
  event_type VARCHAR(50) NOT NULL,
  -- 'submitted' | 'approved' | 'denied' | 'escalated' | 'reassigned' | 'cancelled' | 'expired' | 'fulfilled'

  -- Actor
  performed_by UUID REFERENCES users(id),
  performed_by_system BOOLEAN DEFAULT FALSE, -- For auto/escalation

  -- Details
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  reason TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approval rules (per company, configurable thresholds)
CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),

  -- Threshold range
  min_credits INTEGER NOT NULL,
  max_credits INTEGER,             -- NULL = unlimited

  -- Routing
  approver_role VARCHAR(20) NOT NULL, -- 'auto' | 'approver' | 'admin'
  escalation_hours INTEGER,        -- NULL = no escalation

  -- Priority (lower = first match)
  priority INTEGER NOT NULL DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_requests_company_status ON approval_requests(company_id, status);
CREATE INDEX idx_requests_approver ON approval_requests(current_approver_id, status);
CREATE INDEX idx_requests_requester ON approval_requests(requester_id);
CREATE INDEX idx_requests_expires ON approval_requests(expires_at) WHERE status = 'pending';
CREATE INDEX idx_events_request ON approval_events(request_id);
CREATE INDEX idx_rules_company ON approval_rules(company_id, is_active, priority);
```

---

## API Contracts

### Credit Ledger APIs

```typescript
// GET /api/credits/balance
interface GetBalanceResponse {
  accountId: string;
  companyId: string;
  totalCredits: number;
  usedCredits: number;
  reservedCredits: number;
  availableCredits: number;  // Derived: total - used - reserved
  subscriptionTier: string;
  subscriptionEnd: string;
}

// POST /api/credits/hold
interface CreateHoldRequest {
  requestId: string;         // Links to approval request
  amount: number;
  idempotencyKey: string;
}
interface CreateHoldResponse {
  holdId: string;
  amount: number;
  status: 'active';
  availableCredits: number;  // Updated balance
}

// POST /api/credits/hold/:holdId/release
interface ReleaseHoldResponse {
  holdId: string;
  amount: number;
  status: 'released';
  availableCredits: number;
}

// POST /api/credits/hold/:holdId/convert
interface ConvertHoldResponse {
  holdId: string;
  amount: number;
  status: 'converted';
  ledgerEntryId: string;
  availableCredits: number;
}

// POST /api/credits/spend (direct spend for auto-approved)
interface DirectSpendRequest {
  amount: number;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  description: string;
  idempotencyKey: string;
}

// GET /api/credits/transactions
interface GetTransactionsRequest {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}
interface GetTransactionsResponse {
  transactions: LedgerEntry[];
  total: number;
  hasMore: boolean;
}
```

### Approval Workflow APIs

```typescript
// POST /api/requests
interface SubmitRequestRequest {
  type: RequestType;
  title: string;
  description?: string;
  context?: RequestContext;
  estimatedCredits: number;
}
interface SubmitRequestResponse {
  requestId: string;
  status: 'pending' | 'approved'; // Auto-approved if under threshold
  holdId?: string;
  approvalLevel: 'auto' | 'approver' | 'admin';
  currentApproverId?: string;
}

// GET /api/requests
interface GetRequestsRequest {
  status?: RequestStatus[];
  role?: 'requester' | 'approver';
  limit?: number;
  offset?: number;
}

// GET /api/requests/:id
interface GetRequestResponse {
  request: ApprovalRequest;
  events: ApprovalEvent[];
  hold?: CreditHold;
}

// POST /api/requests/:id/approve
interface ApproveRequest {
  reason?: string;
}
interface ApproveResponse {
  requestId: string;
  status: 'approved';
  decidedAt: string;
}

// POST /api/requests/:id/deny
interface DenyRequest {
  reason: string;  // Required
}
interface DenyResponse {
  requestId: string;
  status: 'denied';
  decidedAt: string;
  holdReleased: boolean;
}

// POST /api/requests/:id/cancel
interface CancelResponse {
  requestId: string;
  status: 'cancelled';
  holdReleased: boolean;
}

// GET /api/requests/queue (approver view)
interface GetApprovalQueueResponse {
  pending: ApprovalRequest[];
  totalPending: number;
  nearingEscalation: ApprovalRequest[]; // < 4 hours to SLA
}
```

---

## Implementation Checklist

### Phase 1: Schema & API Design ✅
- [x] Credit ledger schema created (`server/migrations/001_credit_ledger.sql`)
- [x] Approval workflow schema created (`server/migrations/002_approval_workflow.sql`)
- [x] TypeScript types created (`src/types/creditLedger.ts`, `src/types/requests.ts`)
- [x] API service stubs created (`src/services/creditLedgerService.ts`, `src/services/approvalService.ts`)
- [x] Types index for clean imports (`src/types/index.ts`)
- [ ] Review schemas with engineering
- [ ] Security review sign-off
- [ ] Migration strategy approved
- [ ] Finalize credit expiry policy decision

### Phase 2: Credit Ledger System ✅
- [x] Add Drizzle schema tables (`src/db/schema.ts`): companies, teams, teamMemberships, creditAccounts, ledgerEntries, creditHolds, creditAllocations
- [x] Implement credit middleware (`api/_middleware/credits.ts`): balance calculation, hold operations
- [x] Implement `credit_accounts` balance derivation (separate subqueries to avoid join multiplication)
- [x] Implement `ledger_entries` append operations with idempotency
- [x] Implement `credit_holds` operations:
  - [x] createHold (`POST /api/credits/hold`)
  - [x] releaseHold (`POST /api/credits/hold/[id]/release`)
  - [x] convertHoldToSpend (`POST /api/credits/hold/[id]/convert`)
- [x] Implement balance endpoint (`GET /api/credits/balance`)
- [x] Implement direct spend (`POST /api/credits/spend`)
- [x] Implement transactions history (`GET /api/credits/transactions`)
- [x] Implement active holds list (`GET /api/credits/holds`)
- [x] Wire frontend service to real API (`src/services/creditLedgerService.ts`)
- [ ] Implement team allocations (deferred - not needed for MVP)
- [ ] Create reconciliation job (Phase 5)
- [ ] Add integrity check job (Phase 5)
- [x] Write unit tests for API endpoints (66 tests in `api/credits/__tests__/`)
- [ ] Write integration tests

### Phase 3: Approval Workflow ✅
- [x] Create database migrations
- [x] Implement request state machine
- [x] Implement approval routing rules engine
- [x] Implement escalation job
- [x] Implement expiration job
- [ ] Add notification service integration
  - [ ] In-app notifications
  - [ ] Email notifications
  - [ ] Slack integration (optional)
- [ ] Add WebSocket/polling for real-time updates
- [x] Update UI to use real APIs
- [ ] Add approver queue badge
- [x] Write unit tests
- [ ] Write integration tests

### Phase 4: AI Community Removal
- [ ] Add `communityEnabled` feature flag
- [ ] Update prompt templates
- [ ] Update value ladder generator
- [ ] Update suggestion engine
- [ ] Update mock data
- [ ] Update test fixtures/snapshots
- [ ] Verify no community references in responses

### Phase 5: Production Hardening
- [ ] Add observability metrics
- [ ] Configure alerts
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Set up DLQ for notifications
- [ ] Create manual recovery tooling
- [ ] Write runbooks
- [ ] Load testing
- [ ] Security penetration testing
- [ ] Execute migration plan
  - [ ] Stage 1: Deploy schema
  - [ ] Stage 2: Backfill accounts
  - [ ] Stage 3: Seed balances
  - [ ] Stage 4: Enable writes
  - [ ] Stage 5: Deprecate mocks
  - [ ] Stage 6: Monitor 1 week
  - [ ] Stage 7: Remove mock code

---

## Open Questions

1. **Credit expiry**: Do unused credits roll over annually or expire?
2. **Multi-currency**: USD only, or support EUR/GBP?
3. **Notification channels**: Email required? Slack optional or required?
4. **Delegation**: Can approvers delegate to others during PTO?
5. **Override**: Can admins override denied requests?
6. **Audit retention**: How long to keep ledger/event history?

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| Jan 2025 | Claude | Initial plan created |
