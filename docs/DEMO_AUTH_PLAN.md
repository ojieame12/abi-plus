# Demo Mode: Auto-Login + Seeded DB Implementation Plan

> **Goal:** Enable a fully functional, dynamic demo experience where stakeholders can interact with real APIs and see real database state changes - without manual authentication.

---

## Executive Summary

Keep real backend auth/authorization, but the app auto-logs a demo user and uses seeded data so the entire flow is persistent and end-to-end. Stakeholders see a "real" product; engineers maintain proper auth architecture.

---

## Phase 0: Decisions (Prerequisites)

> **Status:** PENDING - Need input before implementation

### 0.1 Demo Personas

Define 3-5 demo users with distinct roles:

| Persona | Name | Email | Role | Purpose |
|---------|------|-------|------|---------|
| `admin` | Sarah Chen | sarah.chen@acme-demo.com | Team Admin | Full access, can fulfill |
| `approver` | Michael Torres | mike.torres@acme-demo.com | Approver | Can approve/deny requests |
| `member` | Emily Watson | emily.watson@acme-demo.com | Member | Can submit requests |
| `member2` | James Park | james.park@acme-demo.com | Member | Secondary requester |
| `expert` | Dr. Lisa Chen | lisa.chen@acme-demo.com | Expert | Expert portal (optional) |

### 0.2 Organization Structure

```
Acme Corporation (company)
├── Direct Materials (team)
│   ├── Sarah Chen (admin)
│   ├── Michael Torres (approver)
│   └── Emily Watson (member)
│
└── Indirect Procurement (team)
    ├── Sarah Chen (admin)
    ├── James Park (member)
    └── Dr. Lisa Chen (expert)
```

### 0.3 Credit Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Subscription Tier | Enterprise | Unlocks all features |
| Base Credits | 50,000 | Monthly allocation |
| Bonus Credits | 5,000 | Enterprise bonus |
| Starting Balance | ~45,000 | After some demo usage |

### 0.4 Seeded Requests ("Wow" Scenarios)

| Request | Type | Status | Credits | Demo Purpose |
|---------|------|--------|---------|--------------|
| Steel Market Analysis Q1 | report_upgrade | `pending` | 2,000 | Show approval queue |
| Aluminum Supply Review | analyst_call | `pending` | 500 | Show auto-approve threshold |
| Q4 Procurement Strategy | expert_deepdive | `approved` | 3,500 | Show fulfill flow |
| Copper Market Deep Dive | report_upgrade | `fulfilled` | 1,500 | Show completed state |
| Cancelled Consultation | expert_consult | `cancelled` | 800 | Show cancelled state |
| Denied Analysis Request | report_upgrade | `denied` | 5,000 | Show denied state |

### 0.5 Environment Strategy

| Environment | DEMO_MODE | Access |
|-------------|-----------|--------|
| Local dev | `true` | Always enabled |
| Vercel Preview | `true` | Enabled for stakeholder demos |
| Production | `false` | Disabled (or token-gated) |

---

## Phase 1: Seed Script (Core Persistence)

> **Goal:** Create deterministic, idempotent seed script so state persists across refreshes/tabs.

### 1.1 Create Seed Script

**File:** `scripts/seed-demo.ts`

```typescript
/**
 * Demo Database Seeder
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts          # Seed (idempotent)
 *   npx tsx scripts/seed-demo.ts --reset  # Clear + reseed
 *
 * Requires:
 *   DATABASE_URL environment variable
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  users, profiles, companies, teams, teamMemberships,
  creditAccounts, ledgerEntries, creditHolds,
  approvalRequests, approvalEvents, approvalRules
} from '../src/db/schema';

// Stable UUIDs (deterministic for idempotency)
const DEMO_IDS = {
  company: '550e8400-e29b-41d4-a716-446655440001',
  users: {
    admin: '550e8400-e29b-41d4-a716-446655440010',
    approver: '550e8400-e29b-41d4-a716-446655440011',
    member: '550e8400-e29b-41d4-a716-446655440012',
    member2: '550e8400-e29b-41d4-a716-446655440013',
  },
  teams: {
    direct: '550e8400-e29b-41d4-a716-446655440020',
    indirect: '550e8400-e29b-41d4-a716-446655440021',
  },
  creditAccount: '550e8400-e29b-41d4-a716-446655440030',
  requests: {
    pending1: '550e8400-e29b-41d4-a716-446655440040',
    pending2: '550e8400-e29b-41d4-a716-446655440041',
    approved: '550e8400-e29b-41d4-a716-446655440042',
    fulfilled: '550e8400-e29b-41d4-a716-446655440043',
    cancelled: '550e8400-e29b-41d4-a716-446655440044',
    denied: '550e8400-e29b-41d4-a716-446655440045',
  },
};
```

### 1.2 Seed Entities (Order Matters)

```
1. Users + Profiles
   └── Real UUIDs, demo emails, display names, avatars

2. Company
   └── Single company: "Acme Corporation"

3. Teams
   └── Direct Materials, Indirect Procurement

4. Team Memberships
   └── Link users to teams with roles (admin, approver, member)

5. Credit Account
   └── Base credits, bonus credits, subscription dates

6. Ledger Entries
   └── Initial allocation entry (so balance computes from ledger)
   └── Some historical spend entries for realism

7. Approval Rules
   └── Default thresholds: auto (<500), approver (500-2000), admin (>2000)

8. Approval Requests + Events
   └── Pending requests with active holds
   └── Approved requests with converted holds
   └── Denied/cancelled requests with released holds
   └── Fulfilled requests with actualCredits recorded

9. Credit Holds
   └── Active holds for pending requests
   └── Converted/released holds for decided requests
```

### 1.3 Idempotency Strategy

```typescript
// Option A: Upsert by stable ID
await db.insert(users)
  .values(demoUser)
  .onConflictDoUpdate({
    target: users.id,
    set: { email: demoUser.email, updatedAt: new Date() }
  });

// Option B: Delete + reinsert (with --reset flag)
if (args.includes('--reset')) {
  await db.delete(approvalRequests).where(eq(companyId, DEMO_IDS.company));
  await db.delete(creditAccounts).where(eq(companyId, DEMO_IDS.company));
  // ... cascade deletes
}
```

### 1.4 NPM Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "seed:demo": "npx tsx scripts/seed-demo.ts",
    "seed:demo:reset": "npx tsx scripts/seed-demo.ts --reset",
    "db:setup": "npm run db:push && npm run seed:demo"
  }
}
```

### 1.5 Developer Documentation

**Add to README:**

```markdown
## Demo Setup

1. Set DATABASE_URL in .env.local
2. Run migrations: `npm run db:push`
3. Seed demo data: `npm run seed:demo`
4. Start dev server: `npm run dev`

To reset demo data: `npm run seed:demo:reset`
```

---

## Phase 2: Demo Login Endpoint

> **Goal:** Auto-login endpoint that is only active in demo mode.

### 2.1 Create Endpoint

**File:** `api/auth/demo-login.ts`

```typescript
/**
 * POST /api/auth/demo-login
 *
 * Auto-login for demo mode. Creates real session + CSRF.
 *
 * Query params:
 *   ?persona=admin|approver|member (default: member)
 *
 * Headers (optional):
 *   X-Demo-Token: <DEMO_LOGIN_TOKEN> (extra security for preview envs)
 *
 * Response:
 *   Same as GET /api/auth/session
 *   Sets: abi_session cookie, abi_csrf cookie
 */

export default async function handler(req, res) {
  // Guard: Only in demo mode
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Guard: Optional token check for preview environments
  const expectedToken = process.env.DEMO_LOGIN_TOKEN;
  if (expectedToken && req.headers['x-demo-token'] !== expectedToken) {
    return res.status(403).json({ error: 'Invalid demo token' });
  }

  // Get persona (default: member)
  const persona = req.query.persona || 'member';
  const demoUser = DEMO_USERS[persona];

  if (!demoUser) {
    return res.status(400).json({ error: 'Invalid persona' });
  }

  // Create session (reuse logic from api/auth/login.ts)
  const session = await createSession(demoUser.id);

  // Set cookies
  setCookie(res, 'abi_session', session.token, { ... });
  setCookie(res, 'abi_csrf', generateCsrf(), { ... });

  // Return session payload
  return res.status(200).json({
    user: demoUser,
    profile: demoUser.profile,
    company: DEMO_COMPANY,
    team: demoUser.defaultTeam,
    permissions: getPermissionsForRole(demoUser.role),
  });
}
```

### 2.2 Security Guards

| Guard | Purpose | Implementation |
|-------|---------|----------------|
| `DEMO_MODE=true` | Disable in production | Env check, return 404 if false |
| `DEMO_LOGIN_TOKEN` | Prevent accidental exposure | Optional header check |
| Rate limiting | Prevent abuse | Standard rate limiter |
| Logging | Audit trail | Log demo logins with persona |

### 2.3 Persona Mapping

```typescript
const DEMO_USERS = {
  admin: {
    id: DEMO_IDS.users.admin,
    email: 'sarah.chen@acme-demo.com',
    profile: { displayName: 'Sarah Chen', title: 'VP of Procurement' },
    role: 'admin',
    defaultTeam: DEMO_IDS.teams.direct,
  },
  approver: {
    id: DEMO_IDS.users.approver,
    email: 'mike.torres@acme-demo.com',
    profile: { displayName: 'Michael Torres', title: 'Director' },
    role: 'approver',
    defaultTeam: DEMO_IDS.teams.direct,
  },
  member: {
    id: DEMO_IDS.users.member,
    email: 'emily.watson@acme-demo.com',
    profile: { displayName: 'Emily Watson', title: 'Category Manager' },
    role: 'member',
    defaultTeam: DEMO_IDS.teams.direct,
  },
};
```

---

## Phase 3: Frontend Auto-Login

> **Goal:** Replace stubbed session hook with real session flow.

### 3.1 Update Session Hook

**File:** `src/hooks/useSession.ts`

```typescript
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData>({ status: 'loading' });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        // 1. Check for existing session
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setSession({ status: 'authenticated', ...data });
            setIsInitialized(true);
            return;
          }
        }

        // 2. No session + demo mode → auto-login
        if (import.meta.env.VITE_DEMO_MODE === 'true') {
          const persona = import.meta.env.VITE_DEMO_PERSONA || 'member';
          const loginResponse = await fetch(
            `/api/auth/demo-login?persona=${persona}`,
            { method: 'POST', credentials: 'include' }
          );

          if (loginResponse.ok) {
            const data = await loginResponse.json();
            setSession({ status: 'authenticated', ...data });
            setIsInitialized(true);
            return;
          }
        }

        // 3. Fallback: anonymous
        setSession({ status: 'anonymous', user: null });
      } catch (error) {
        console.error('Session init failed:', error);
        setSession({ status: 'error', error });
      } finally {
        setIsInitialized(true);
      }
    }

    initSession();
  }, []);

  return { ...session, isInitialized };
}
```

### 3.2 Persona Switcher Component (Optional but Recommended)

**File:** `src/components/demo/PersonaSwitcher.tsx`

```typescript
/**
 * Floating UI for switching demo personas during stakeholder demos.
 *
 * Shows current user and allows quick switching between:
 * - Admin (full access)
 * - Approver (can approve/deny)
 * - Member (can submit)
 */

export function PersonaSwitcher() {
  const { user, refetch } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const switchPersona = async (persona: string) => {
    await fetch(`/api/auth/demo-login?persona=${persona}`, {
      method: 'POST',
      credentials: 'include',
    });
    refetch(); // Refresh session
    window.location.reload(); // Ensure clean state
  };

  // Only show in demo mode
  if (import.meta.env.VITE_DEMO_MODE !== 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating button + dropdown */}
    </div>
  );
}
```

### 3.3 Add to App Layout

```typescript
// src/App.tsx or layout component
import { PersonaSwitcher } from './components/demo/PersonaSwitcher';

function App() {
  return (
    <>
      {/* ... app content ... */}
      <PersonaSwitcher />
    </>
  );
}
```

---

## Phase 4: Wire UI to Real APIs

> **Goal:** Make all user flows run through the API, not mocks.

### 4.1 Approval UI

| Component | Current | Target |
|-----------|---------|--------|
| `ApprovalQueue` | Real API | Keep (already correct) |
| `RequestList` | Real API | Keep (already correct) |
| `ApprovalWorkflowView` | Mock data | Switch to real API or remove |

**Actions:**
- Remove `MOCK_ALL_REQUESTS` usage from views
- Ensure status uses `pending` not `pending_approval`
- Connect to `approvalService` for all operations

### 4.2 Upgrade Flow

**File:** `src/App.tsx` (or upgrade flow component)

```typescript
// Before: Local state only
const handleUpgrade = (credits: number) => {
  setUsedCredits(prev => prev + credits);
};

// After: Real API call
const handleUpgrade = async (request: SubmitRequestPayload) => {
  const result = await submitRequest({
    ...request,
    companyId: session.company.id,
    teamId: session.team.id,
  });

  // Refresh credit balance
  const balance = await getAccountBalance();
  setCredits(balance);

  return result;
};
```

### 4.3 Credit Ledger Service

**File:** `src/services/creditLedgerService.ts`

```typescript
// Change from:
const USE_REAL_API = false;

// To:
const USE_REAL_API = true;
```

Ensure these endpoints exist and work:
- `GET /api/credits/balance` - Account balance
- `POST /api/credits/hold` - Create hold
- `POST /api/credits/release` - Release hold
- `POST /api/credits/convert` - Convert hold to spend
- `POST /api/credits/spend` - Direct spend

### 4.4 Restore Auth on Endpoints

Revert the "no auth" changes made earlier:

```typescript
// Restore withAuthenticated wrapper
export default withAuthenticated(handler);

// Restore authorization checks
const canApprove = await canUserApprove(userId, requestId);
if (!canApprove) {
  return res.status(403).json({ error: 'Cannot approve' });
}
```

**Files to restore:**
- `api/requests/index.ts`
- `api/requests/[id].ts`
- `api/requests/queue.ts`
- `api/requests/[id]/approve.ts`
- `api/requests/[id]/deny.ts`
- `api/requests/[id]/cancel.ts`
- `api/requests/[id]/fulfill.ts`
- `api/_middleware/approvals.ts` (requester check in cancelRequest)

---

## Phase 5: Verification / Demo Script

> **Goal:** End-to-end validation with seeded data.

### 5.1 Manual Test Script

```markdown
## Demo Verification Checklist

### Setup
- [ ] DATABASE_URL configured
- [ ] `npm run seed:demo` completed
- [ ] `DEMO_MODE=true` in environment
- [ ] App started with `npm run dev`

### Auto-Login Flow
- [ ] Open app → auto-login happens (no login screen)
- [ ] User context shows in UI (name, avatar)
- [ ] Session persists on page refresh

### Requester Flow (as Member)
- [ ] Switch to "Member" persona
- [ ] Navigate to upgrade/request flow
- [ ] Submit new request (500 credits)
- [ ] Verify: request appears in "My Requests"
- [ ] Verify: credit hold created (available credits reduced)

### Approver Flow (as Approver)
- [ ] Switch to "Approver" persona
- [ ] Navigate to approval queue
- [ ] See pending requests
- [ ] Approve one request
- [ ] Verify: status changes to "approved"
- [ ] Verify: hold converted to spend

### Admin Flow (as Admin)
- [ ] Switch to "Admin" persona
- [ ] Navigate to approved requests
- [ ] Fulfill a request
- [ ] Verify: status changes to "fulfilled"

### Deny Flow
- [ ] As approver, deny a request with reason
- [ ] Verify: status changes to "denied"
- [ ] Verify: hold released (credits restored)

### Cancel Flow
- [ ] As member, cancel own pending request
- [ ] Verify: status changes to "cancelled"
- [ ] Verify: hold released

### Persistence
- [ ] Refresh page → state persists
- [ ] Open new tab → same state visible
- [ ] Changes in tab A visible in tab B after refresh
```

### 5.2 Automated Test (Optional)

**File:** `scripts/verify-demo.ts`

```typescript
/**
 * Automated demo verification script
 * Runs through all flows programmatically
 */

async function verifyDemo() {
  // 1. Login as member
  // 2. Submit request
  // 3. Login as approver
  // 4. Approve request
  // 5. Login as admin
  // 6. Fulfill request
  // 7. Verify final state
}
```

---

## Phase 6: Safety & Cleanup

### 6.1 Environment Protection

```typescript
// api/auth/demo-login.ts
if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
  return res.status(404).json({ error: 'Not found' });
}
```

### 6.2 Documentation

**Add to `.env.example`:**

```bash
# Demo Mode Configuration
DEMO_MODE=false                    # Enable demo auto-login
DEMO_LOGIN_TOKEN=                  # Optional: token for demo-login endpoint
VITE_DEMO_MODE=false              # Frontend demo mode flag
VITE_DEMO_PERSONA=member          # Default persona for auto-login
```

### 6.3 Reset Script

**File:** `scripts/reset-demo.ts`

```typescript
/**
 * Reset demo data to initial state
 * Useful when demo data drifts during testing
 */

async function resetDemo() {
  // 1. Delete all demo requests
  // 2. Delete all demo holds
  // 3. Delete all demo ledger entries (except initial allocation)
  // 4. Re-run seed script
}
```

**NPM Script:**

```json
{
  "scripts": {
    "demo:reset": "npx tsx scripts/reset-demo.ts"
  }
}
```

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `scripts/seed-demo.ts` | Database seeding script |
| `scripts/reset-demo.ts` | Reset demo data script |
| `scripts/verify-demo.ts` | Automated verification (optional) |
| `api/auth/demo-login.ts` | Demo login endpoint |
| `src/components/demo/PersonaSwitcher.tsx` | Persona switcher UI |

### Modified Files

| File | Change |
|------|--------|
| `src/hooks/useSession.ts` | Add real session check + auto-login |
| `src/services/creditLedgerService.ts` | Set `USE_REAL_API = true` |
| `src/App.tsx` | Add PersonaSwitcher, wire upgrade to API |
| `api/requests/*.ts` | Restore `withAuthenticated` |
| `api/_middleware/approvals.ts` | Restore requester check |
| `package.json` | Add seed/reset scripts |
| `.env.example` | Document demo env vars |

---

## Implementation Order

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 0: Decisions                                    (30 min)  │
│ - Confirm personas, org structure, credit config                │
│ - Confirm seeded request scenarios                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: Seed Script                                  (2-3 hrs) │
│ - Create scripts/seed-demo.ts                                   │
│ - Seed all entities in correct order                            │
│ - Test idempotency                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: Demo Login Endpoint                          (1-2 hrs) │
│ - Create api/auth/demo-login.ts                                 │
│ - Add security guards                                           │
│ - Test with curl/Postman                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: Frontend Auto-Login                          (1-2 hrs) │
│ - Update useSession hook                                        │
│ - Add PersonaSwitcher component                                 │
│ - Test auto-login flow                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: Wire UI to Real APIs                         (2-3 hrs) │
│ - Restore auth on endpoints                                     │
│ - Switch credit service to real API                             │
│ - Connect upgrade flow to API                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: Verification                                 (1-2 hrs) │
│ - Run through manual test script                                │
│ - Fix any issues found                                          │
│ - Document any gotchas                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: Safety & Cleanup                             (30 min)  │
│ - Verify production guards                                      │
│ - Update documentation                                          │
│ - Create reset script                                           │
└─────────────────────────────────────────────────────────────────┘

Total Estimated Time: 8-12 hours
```

---

## Open Decisions

> **Action Required:** Please confirm or adjust these before implementation.

### 1. Demo Personas

```
[ ] Sarah Chen (admin) - sarah.chen@acme-demo.com
[ ] Michael Torres (approver) - mike.torres@acme-demo.com
[ ] Emily Watson (member) - emily.watson@acme-demo.com
[ ] James Park (member2) - james.park@acme-demo.com
[ ] Add/remove/rename any?
```

### 2. Company & Team Names

```
[ ] Company: "Acme Corporation"
[ ] Team 1: "Direct Materials"
[ ] Team 2: "Indirect Procurement"
[ ] Change any names?
```

### 3. Credit Configuration

```
[ ] Base credits: 50,000
[ ] Bonus credits: 5,000
[ ] Subscription tier: Enterprise
[ ] Adjust amounts?
```

### 4. Seeded Request Scenarios

```
[ ] 2 pending requests (different credit amounts)
[ ] 1 approved request (ready to fulfill)
[ ] 1 fulfilled request (completed)
[ ] 1 denied request (with reason)
[ ] 1 cancelled request
[ ] Add/remove any?
```

### 5. Environment Deployment

```
[ ] Local only (npm run dev)
[ ] Vercel Preview (for stakeholder demos)
[ ] Production demo instance
[ ] Where should demo mode be enabled?
```

---

## Success Criteria

| Criteria | Measurement |
|----------|-------------|
| **Zero-click demo** | App opens → user is logged in → ready to use |
| **Real dynamism** | Submit request → see it in queue → approve → see credits change |
| **Role demonstration** | Switch personas → see different permissions/queues |
| **Persistence** | Refresh page → state remains |
| **Multi-tab** | Changes in one tab visible in another |
| **No auth errors** | No 401/403 errors during normal demo flow |
| **Stakeholder ready** | Non-technical user can experience full flow |
