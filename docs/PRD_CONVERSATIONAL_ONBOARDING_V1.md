# Abi Plus - Conversational Onboarding (V1)

| Field | Value |
|---|---|
| **Status** | Draft |
| **Target Release** | MVP (V1) |
| **Owner** | Stephen Moser |
| **Design Lead** | Nathan Ojieame |
| **Last Updated** | 2026-02-04 |
| **Dependencies** | Interest System (shipped), Coverage Bridge (shipped), Three-Tier Architecture |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Users & Personas](#4-users--personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
   - 6.1 [The "Tell Us About Your World" Screen](#61-the-tell-us-about-your-world-screen)
   - 6.2 [The "Buying Need" Selector (V1.5)](#62-the-buying-need-selector-v15)
   - 6.3 [Backend Processing (The "Setup" Orchestrator)](#63-backend-processing-the-setup-orchestrator)
   - 6.4 [The Landing (First Dashboard View)](#64-the-landing-first-dashboard-view)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Data Model](#8-data-model)
9. [UX/UI Flow](#9-uxui-flow)
10. [Error States & Edge Cases](#10-error-states--edge-cases)
11. [Analytics & Instrumentation](#11-analytics--instrumentation)
12. [Technical Architecture](#12-technical-architecture)
13. [Scope & Phasing](#13-scope--phasing)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Open Questions](#15-open-questions)
16. [Future Scope (V2)](#16-future-scope-v2)

---

## 1. Executive Summary

Abi Plus replaces the legacy taxonomy-heavy setup wizard with a low-friction conversational onboarding flow. Users define their "Worldview" in plain language by listing topics they manage or clicking popular domain chips. The system parses those inputs, maps them to Beroe managed categories when possible, and stores them as structured `Interest` objects with computed coverage levels.

On submission, the system:
1. Parses input into discrete interest entities.
2. Fuzzy-matches each entity against Beroe's managed category catalog (~500 categories) via the Coverage Bridge (`categoryMatcher.ts`).
3. Creates `Interest` objects with coverage levels: `decision_grade`, `available`, `partial`, or `web_only`.
4. Injects interests into Abi's system prompt so the chat experience is immediately personalized.
5. Redirects to a personalized Home Dashboard with suggested questions seeded from the user's interests.

This reduces time-to-value, avoids the "blank slate" experience, and eliminates the coverage perception gap where users assumed missing dropdown matches meant no Beroe data.

### What Already Exists

The interest system infrastructure is fully shipped. This PRD adds the **first-run screen** that collects interests *before* the user reaches the dashboard.

| Component | Status | Location |
|---|---|---|
| Interest types & factories | Shipped | `src/types/interests.ts` |
| Coverage Bridge (category matcher) | Shipped | `src/services/categoryMatcher.ts` |
| Interest CRUD service | Shipped | `src/services/interestService.ts` |
| `useUserInterests` hook | Shipped | `src/hooks/useUserInterests.ts` |
| Interest management UI (Settings) | Shipped | `src/components/settings/InterestsSection.tsx` |
| Interest detail drawer | Shipped | `src/components/settings/InterestDetailDrawer.tsx` |
| Chat-inferred interest tracking | Shipped | `src/components/chat/SaveInterestPrompt.tsx` |
| AI context injection | Shipped | `src/services/ai.ts` → `buildInterestContext()` |
| Home personalization | Shipped | `src/views/HomeView.tsx` → `generatePersonalizedSuggestions()` |
| Interest API endpoints | Shipped | `api/interests/index.ts`, `api/interests/[id].ts` |
| DB schema (interests + onboardingStep) | Shipped | `profiles.interests` (JSONB), `profiles.onboardingStep` |

---

## 2. Problem Statement

### 2.1 Legacy Friction

The previous onboarding required users to navigate complex dropdown trees: Category > Region > Specification. Users who couldn't locate their exact Beroe taxonomy name (e.g., searching for "automotive resins" when the catalog entry is "Thermoplastic Resins") abandoned the flow or selected incorrect categories.

### 2.2 The "Blank Slate" Issue

New users land on the Home Dashboard with generic suggested questions ("What is the price trend for Corrugated Boxes in Europe?"). These static defaults have no relationship to the user's actual responsibilities. The chat system prompt includes no interest context, so Abi's responses are unpersonalized.

### 2.3 Coverage Perception Gap

If a user searched the legacy dropdown for "fleet management" and found no match, they assumed Beroe had no coverage. In reality, the managed catalog contains "Fleet Management" under the Fleet domain with full decision-grade data. The taxonomy tree structure obscured coverage breadth.

### 2.4 Current-State Baseline

| Metric | Current State | Problem |
|---|---|---|
| Onboarding completion | ~60% (estimated) | Users abandon at taxonomy selection |
| Time to first insight | 3-5 minutes | Requires category selection, page loads, manual exploration |
| Zero-result searches (week 1) | High | Users search for terms not matching taxonomy labels |
| Interest adoption | Low | Interests only addable via Settings or chat inference |

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals

| # | Goal | Rationale |
|---|---|---|
| G1 | Reduce time from "Login" to "First Insight" to under 60 seconds | Onboarding completable in <30s; first personalized suggestion clickable within another 30s |
| G2 | Every user lands on a dashboard with at least 3 personalized suggestions | `generatePersonalizedSuggestions()` produces 3 per tab; onboarding ensures interests exist to seed it |
| G3 | Zero taxonomy knowledge required | Users express interests in natural language; the system resolves to Beroe categories silently |

### 3.2 Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Onboarding completion rate | >= 90% | Users who submit >= 1 interest / total new users |
| First-session card engagement | >= 50% | % users who click a dashboard suggestion in session 1 |
| Time to first interest created | <= 30 seconds | Timestamp delta: screen render → first interest saved |
| Mean interests per new user | >= 3 | Average interest count after onboarding submission |
| Zero-result searches (week 1) | Reduction >= 30% | Search queries returning no results / total queries (vs. baseline) |
| Interest accuracy | >= 80% | Interests with `matchedCategory` defined / total interests |

### 3.3 Non-Goals (V1)

- Dashboard content cards seeded from interests (deferred to post-MVP).
- Auto-importing legacy "Followed Categories" from the old platform.
- Role-based onboarding templates ("I am a... Procurement Manager").
- The "Buying Need" selector (deferred to V1.5).
- Scheduled alerts or monitoring agents.
- Team sharing of interests.

---

## 4. Users & Personas

| Persona | Description | Onboarding Behavior |
|---|---|---|
| **Procurement Manager (General)** | Manages 3-8 categories across regions. Knows their domain but not Beroe's taxonomy labels. | Types 3-5 interests in plain English. May add region qualifiers ("Steel - Europe"). |
| **Category Lead (Domain Expert)** | Deep specialist in 1-2 categories. Wants grade-level specificity. | Types specific terms ("Hot Rolled Coil," "Caustic Soda 50%"). May use fewer but more precise interests. |
| **New User (Unsure)** | Just got access, exploring what Abi Plus offers. Doesn't know what to type. | Relies on starter chips. Clicks 2-3 domain chips and submits. May skip entirely. |

---

## 5. User Stories

| ID | Persona | Story | Acceptance Criteria |
|---|---|---|---|
| ON-1 | New User (General) | As a new user, I want to list my areas in plain English without hunting for taxonomy codes. | Free-text input accepts multiple topics (comma-separated or one per Enter). Each is saved as an `Interest` with auto-computed coverage. Saved interests appear as chips below the input. |
| ON-2 | New User (Unsure) | As a new user who is unsure, I want suggestions to get started quickly. | UI displays clickable starter chips grouped by domain (e.g., "Steel," "Packaging," "IT Services") that add topics to the interest list on click. |
| ON-3 | System | As the system, I need to distinguish Beroe-mapped terms from web-only terms during setup. | Each input is fuzzy-matched via `matchCategory()`. Matched → `decision_grade` or `available` badge. Unmatched → `web_only` badge. All are saved regardless. |
| ON-4 | New User (Impatient) | As a new user, I want to skip onboarding and go straight to the app. | "Skip for now" link bypasses onboarding, sets `onboardingStep = 'complete'`, and lands on the generic Home Dashboard. Interests addable later via Settings. |
| ON-5 | Returning User | As a returning user, I should never see the onboarding screen again. | `onboardingStep === 'complete'` gates the flow. Returning users go directly to Home. |
| ON-6 | New User (Multi-Region) | As a procurement manager covering multiple regions, I want to specify region context alongside my categories. | Input supports structured entry: "Steel - Europe" or "Copper - Asia Pacific". The system parses region qualifiers via `extractInterestContext()` and stores them as `Interest.region`. |

---

## 6. Functional Requirements

### 6.1 The "Tell Us About Your World" Screen

#### 6.1.1 Trigger Condition

The onboarding screen renders when:
```
profiles.onboardingStep !== 'complete'
```

The `onboardingStep` column exists in the schema (`src/db/schema.ts:43`) with default `'profile'`. The flow progresses: `'profile'` → `'interests'` → `'complete'`.

#### 6.1.2 Screen Layout

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              [Abi Logo]                              │
│                                                      │
│         Hi [Name]. Let's personalize                 │
│              Abi Plus for you.                       │
│                                                      │
│   ┌──────────────────────────────────────────┐       │
│   │  What categories or topics do you manage? │       │
│   │  e.g., Steel, Packaging, IT Services     │       │
│   └──────────────────────────────────────────┘       │
│                                                      │
│   Saved interests appear here as chips:              │
│   ┌──────────┐ ┌───────────────┐ ┌──────────┐       │
│   │ Steel  ✕ │ │ Packaging  ✕  │ │ Copper ✕ │       │
│   │ 🟢 DG   │ │ 🟢 DG        │ │ 🔵 Avail │       │
│   └──────────┘ └───────────────┘ └──────────┘       │
│                                                      │
│   ── Or pick from popular topics ──                  │
│                                                      │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│   │ IT Services│ │ Chemicals  │ │ Marketing  │      │
│   ├────────────┤ ├────────────┤ ├────────────┤      │
│   │    MRO     │ │   Energy   │ │  Logistics │      │
│   ├────────────┤ ├────────────┤ ├────────────┤      │
│   │   Fleet    │ │   Metals   │ │ Packaging  │      │
│   └────────────┘ └────────────┘ └────────────┘      │
│                                                      │
│   ┌──────────────────────────────────────────┐       │
│   │         Build My Dashboard →             │       │
│   └──────────────────────────────────────────┘       │
│                                                      │
│              Skip for now                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### 6.1.3 Input Mechanism

**Free-Text Field**
- Placeholder: `"e.g., Steel, Packaging, IT Services, North America Logistics"`
- Behavior: On Enter or comma, the system:
  1. Trims whitespace and strips trailing punctuation.
  2. Calls `addInterest({ text, source: 'manual' })` from `useUserInterests`.
  3. The hook runs `computeCoverage()` → `matchCategory()` behind the scenes.
  4. On success, the interest appears as a chip below the input with its coverage badge.
  5. On duplicate detection (`isDuplicate()` returns true), show inline feedback: "Already added."
  6. Input clears, ready for the next entry.
- Supports multiple interests separated by commas or newlines.
- Region/grade parsing: If the user types "Steel - Europe" or "Copper Asia Pacific", `extractInterestContext()` splits topic from qualifiers. The interest is created with `region` populated.

**Starter Chips (Suggestion Cloud)**
- Source: Derived from `MOCK_MANAGED_CATEGORIES` domains. One representative chip per domain.
- Domains: Metals, Packaging, IT Services, Chemicals, Energy, MRO, Marketing, HR Services, Facilities, Travel, Fleet, Logistics.
- Behavior: Clicking a chip calls `addInterest({ text: chipLabel, source: 'manual' })`. The chip transitions from "available" to "added" state (filled background, checkmark).
- Chips matching already-saved interests show as pre-selected (via `hasInterest()` from the hook).

**Saved Interest Chips**
- Rendered below the input field in a flex-wrap layout.
- Each chip shows:
  - Interest text (e.g., "Steel")
  - Coverage indicator: colored dot (emerald = decision_grade, blue = available, slate = web_only)
  - Remove button (x) that calls `removeInterest(id)`.
- Use the floaty card pattern: `bg-white/80 border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] backdrop-blur-sm rounded-xl`.

#### 6.1.4 Validation & Constraints

| Rule | Behavior |
|---|---|
| Empty submission | "Build My Dashboard" is disabled until >= 1 interest is saved |
| Onboarding cap (10) | After 10 interests, show inline hint: "Great start! You can add more anytime in Settings." Input remains functional (system MAX is 50). |
| Duplicate detection | `isDuplicate()` checks canonical key match + 80% token overlap. Show inline message, don't create duplicate. |
| Gibberish input | No validation on content. `computeCoverage()` returns `web_only` for unrecognized terms. User proceeds normally. |
| Very long input | Truncate chip display at 60 characters. Store full text. |

#### 6.1.5 "Build My Dashboard" Action

On click:
1. Set `onboardingStep = 'complete'` via API call (`PATCH /api/profiles`).
2. Transition to the Home Dashboard view with a brief loading animation.
3. Interests are already persisted (saved individually as chips were added).
4. The Home Dashboard immediately uses interests for personalized suggestions.

#### 6.1.6 "Skip for Now" Action

On click:
1. Set `onboardingStep = 'complete'` via API call.
2. Navigate to Home Dashboard with generic (non-personalized) suggestions.
3. No interests are created. User can add them later via Settings > My Interests.

---

### 6.2 The "Buying Need" Selector (V1.5)

> **Scope**: Deferred from V1 MVP. Documented here for alignment.

After interests are entered, an optional second step asks: **"What matters most to you right now?"**

**Options (Multi-Select):**

| Need | System Prompt Modifier |
|---|---|
| Price Trends / Inflation | Prioritize pricing data, forecasts, and cost impact analysis |
| Supply Chain Risk / Geopolitics | Emphasize risk scores, geopolitical disruptions, supply continuity |
| Supplier Discovery | Focus on alternative suppliers, market entry, vendor evaluation |
| Sustainability / ESG | Highlight environmental metrics, compliance, circular economy |
| Innovation / Market Trends | Surface emerging technologies, market shifts, competitive intelligence |

**Implementation Notes:**
- Selected needs modify the system prompt preamble appended by `buildInterestContext()`.
- Stored as `profiles.buyingNeeds: string[]` (new JSONB column, V1.5).
- Affects the tab ordering on the Home Dashboard (e.g., selecting "Price Trends" makes the "Alerts" tab default).
- Can be skipped. Selection is optional.

---

### 6.3 Backend Processing (The "Setup" Orchestrator)

#### 6.3.1 Interest Creation Pipeline (V1 — Already Implemented)

Each interest submission follows this pipeline:

```
User Input ("Steel - Europe")
    │
    ▼
1. Parse: Split by commas/newlines into individual topics
    │
    ▼
2. Normalize: Trim whitespace, strip trailing punctuation
    │
    ▼
3. Extract: extractInterestContext(text)
    → { text: "Steel", region: "Europe", grade: undefined }
    │
    ▼
4. Clean: cleanTopicText(text, region, grade)
    → Strips region/grade from text to avoid duplication
    │
    ▼
5. Dedupe: isDuplicate(existing, text, { region, grade })
    → Canonical key match + 80% token overlap
    → If duplicate: reject with inline message
    │
    ▼
6. Match: computeCoverage(text, region, grade)
    │
    ├── matchCategory(text, MANAGED_CATEGORIES, ACTIVATED_IDS, { region, grade })
    │   → Fuzzy token matching: recall * 0.6 + precision * 0.4 + boost
    │   → Returns best match if score >= 0.4
    │
    ├── Match + activated  → { level: 'decision_grade', matchedCategory: {...} }
    ├── Match + not active → { level: 'available', matchedCategory: {...} }
    ├── Match + low score  → { level: 'partial', matchedCategory: {...} }
    └── No match           → { level: 'web_only', gapReason: 'No Beroe coverage' }
    │
    ▼
7. Create: createInterest({ text, source, region, grade, coverage })
    → Generates id, canonicalKey, savedAt
    │
    ▼
8. Persist: POST /api/interests → profiles.interests (JSONB)
    → Original query stored as searchContext
```

#### 6.3.2 Dashboard Seeding Pipeline (Post-MVP)

> **Not in V1 scope.** Documented for future reference.

After onboarding submission, the system will trigger asynchronous jobs:

| Coverage Level | Data Source | Job |
|---|---|---|
| `decision_grade` | Beroe L2a | Pull latest market summary, price chart, key metrics |
| `available` | Beroe catalog | Show category info card with "Activate for full coverage" CTA |
| `web_only` | Perplexity L1 | Trigger web search: `"[Interest] market trends [current year]"` |

Results populate dashboard cards asynchronously. Skeleton cards show while jobs complete.

---

### 6.4 The Landing (First Dashboard View)

#### 6.4.1 Transition Animation

After "Build My Dashboard" click:
1. The onboarding screen fades out (opacity 0, y: -10, 300ms).
2. Brief interstitial: "Personalizing Abi for you..." with Abi logo and subtle pulse (800ms).
3. The Home Dashboard fades in (opacity 0 → 1, y: 10 → 0, 300ms).

Total perceived transition: ~1.4 seconds.

#### 6.4.2 Personalized Home Dashboard (V1 — Already Implemented)

The Home Dashboard (`src/views/HomeView.tsx`) already supports personalization via `userInterests`:

- `generatePersonalizedSuggestions(interests)` builds tab-specific questions:
  - **Recommended**: "What is the price trend for {interest}?"
  - **Portfolio**: "How is {interest} price volatility affecting my portfolio?"
  - **Alerts**: "Show recent risk changes for {interest}"
  - **Actions**: "Find alternative suppliers for {interest}"

- When interests exist, the greeting shifts from generic to personalized:
  - Generic: "What can I help with today?"
  - Personalized: "Your interests are set up. Ask me anything about Steel, Packaging, or Copper."

#### 6.4.3 Dashboard Requirements

1. Redirect to Home/Dashboard after onboarding submission.
2. Show loading state if data fetch > 5s.
3. Show at least 3 personalized suggestions.
4. Each suggestion references a user interest.
5. Allow user to click a suggestion to deepen analysis in chat.

#### 6.4.4 Loading & Empty States

| State | Behavior |
|---|---|
| Interests exist, suggestions ready | Show personalized suggestion tabs immediately |
| No interests (skipped onboarding) | Show static `TAB_SUGGESTIONS` defaults |
| Interest API slow/failing | Fall back to mock interests (existing fallback in `getInterests()`) |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target | Implementation |
|---|---|---|
| Interest save latency | < 500ms per interest | `POST /api/interests` with optimistic UI update via `useUserInterests` |
| Coverage computation | < 100ms per interest | `matchCategory()` uses WeakMap-memoized category tokens; O(n) scan of ~500 categories |
| Onboarding screen render | < 200ms | Single component, no data fetching on mount; starter chips are static |
| Onboarding input submission | < 1s total | Parsing + matching + persistence |
| Initial dashboard render | < 3s | Suggestions computed client-side from interest array |
| Card placeholders | < 1s if data pending | Skeleton cards shown immediately (post-MVP) |

### 7.2 Resilience

| Scenario | Behavior |
|---|---|
| API down during interest save | `interestService.ts` falls back to in-memory mock storage. Interests persist for the session. |
| `matchCategory()` returns null for all inputs | All interests get `web_only` coverage. User proceeds normally. No blocking errors. |
| Gibberish input ("asdfghjk") | Saved as a `web_only` interest. Always create an interest if mapping fails — never hard fail. |
| Network timeout during onboarding | Retry logic on "Build My Dashboard" click. Show inline error after 2 retries. |

### 7.3 Security

| Requirement | Detail |
|---|---|
| CSRF protection | `addInterest()` includes CSRF token via `getCsrfToken()` (already implemented). |
| Input sanitization | Interest text stored as-is, rendered with React's built-in XSS protection. No PII extraction beyond what user enters. |
| Rate limiting | API endpoints: max 10 interest creates per minute per user. |
| Auth gating | Onboarding screen requires authenticated session. Unauthenticated users redirect to login. |
| User-owned data | Inputs stored as user-owned content within their profile. |

### 7.4 Accessibility

| Requirement | Detail |
|---|---|
| Keyboard navigation | Tab between input, chips, starter cloud, and buttons. Enter to submit, Delete/Backspace to remove last chip. |
| Screen reader | `aria-label` on input ("Add an interest"), chips ("Steel, Decision Grade coverage, press delete to remove"), starter chips ("Add Steel to your interests"). |
| Color contrast | Coverage badge colors meet WCAG AA. Don't rely solely on color — include text labels. |
| Motion | Respect `prefers-reduced-motion`. Skip transition animations. |

---

## 8. Data Model

### Interest Object

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Auto-generated: `interest_{timestamp}_{random}` |
| `text` | `string` | Clean topic name: "Steel" (no region/grade) |
| `canonicalKey` | `string` | Normalized dedupe key: `"europe|hrc|steel"` (sorted tokens) |
| `source` | `InterestSource` | `'manual'` / `'chat_inferred'` / `'csm_imported'` |
| `region` | `string?` | Optional: "Europe", "Asia Pacific" |
| `grade` | `string?` | Optional: "HRC", "CRC", "virgin" |
| `coverage` | `InterestCoverage` | Computed coverage with level + matched category info |
| `matchedCategory` | `MatchedCategoryInfo?` | Populated when matched to a managed category (nested in coverage) |
| `savedAt` | `string` | ISO timestamp |
| `searchContext` | `string?` | Original user query for chat-inferred interests |
| `conversationId` | `string?` | Link to chat session for chat-inferred interests |

### Coverage Levels

| Level | Meaning | Badge Color |
|---|---|---|
| `decision_grade` | Managed category activated; full Beroe analyst coverage | Emerald |
| `available` | In Beroe catalog but not activated for this client | Blue |
| `partial` | Activated but grade-level specificity missing | Orange |
| `web_only` | No Beroe match; fallback to web sources | Slate |

### Persistence

- Stored in `profiles.interests` (JSONB column, `src/db/schema.ts`).
- Onboarding state in `profiles.onboardingStep`: `'profile'` → `'interests'` → `'complete'`.

---

## 9. UX/UI Flow

### 9.1 Happy Path

```
1. User logs in for the first time
       │
       ▼
2. System checks profiles.onboardingStep → 'profile'
       │
       ▼
3. Onboarding Screen renders
   "Hi Sarah. Let's personalize Abi Plus for you."
       │
       ▼
4. User types "Steel" → presses Enter
   → Chip appears: [Steel 🟢 Decision Grade ✕]
       │
       ▼
5. User clicks "Packaging" starter chip
   → Chip appears: [Packaging 🟢 Decision Grade ✕]
       │
       ▼
6. User types "Fleet Management" → presses Enter
   → Chip appears: [Fleet Management 🟢 Decision Grade ✕]
       │
       ▼
7. User clicks "Build My Dashboard"
       │
       ▼
8. Transition: "Personalizing Abi for you..." (1.4s)
       │
       ▼
9. Home Dashboard renders with personalized suggestions:
   - Recommended: "What is the price trend for Steel?"
   - Portfolio:   "How is Packaging price volatility affecting my portfolio?"
   - Alerts:      "Show recent risk changes for Fleet Management"
       │
       ▼
10. User clicks a suggestion → enters chat with interest context injected
```

### 9.2 Unsure User Path

```
1. User sees onboarding screen, doesn't know what to type
       │
       ▼
2. Scans starter chip cloud:
   [IT Services] [Chemicals] [Marketing] [MRO] [Energy]
   [Logistics]   [Metals]    [Packaging] [Fleet] [Travel]
       │
       ▼
3. Clicks [Chemicals] and [Energy]
   → Two chips appear with coverage badges
       │
       ▼
4. Clicks "Build My Dashboard"
   → Dashboard personalizes around Chemicals and Energy
```

### 9.3 Skip Path

```
1. User sees onboarding screen
       │
       ▼
2. Clicks "Skip for now"
       │
       ▼
3. onboardingStep → 'complete', no interests saved
       │
       ▼
4. Home Dashboard renders with static TAB_SUGGESTIONS
   → User adds interests later via Settings → My Interests
```

### 9.4 Full Walkthrough Example

1. **Welcome**: "Hi Sarah. Let's personalize Abi Plus for you."
2. **Input**: Text box with placeholder: *e.g., Steel, Packaging, IT Services*
3. **Entry**: User types "Fleet Management" and clicks the "Energy" chip.
4. **Feedback**: Chips appear with coverage badges (both green — Decision Grade).
5. **Transition**: "Personalizing Abi for you..."
6. **Dashboard**:
   - Card 1: "Fleet Management" — "What is the price trend for Fleet Management?"
   - Card 2: "Energy" — "Show recent risk changes for Energy"
   - Card 3: "Fleet Management" — "Find alternative suppliers for Fleet Management"

---

## 10. Error States & Edge Cases

| # | Scenario | Behavior |
|---|---|---|
| 1 | **Input empty** | CTA disabled. Show helper text: "Add at least one topic to continue." |
| 2 | **Gibberish input** ("asdf") | Create a `web_only` interest. No validation error. Dashboard shows generic web suggestion. |
| 3 | **Duplicate topic** | `isDuplicate()` detects via canonical key + token overlap. Show inline: "Already added." Don't create duplicate. |
| 4 | **Onboarding soft cap reached** (10) | Show hint: "Great start! You can add more anytime in Settings." Input remains functional up to system MAX of 50. |
| 5 | **No category match** | Label "Web Only." User proceeds normally. |
| 6 | **User types a sentence** ("I manage all indirect procurement in Europe") | `extractInterestContext()` attempts keyword extraction. If a commodity is found, extract it. Otherwise, save the full text as `web_only`. |
| 7 | **User adds 1 interest, hits Build** | Valid. Dashboard cycles that single interest across all suggestion templates. |
| 8 | **User adds then removes all interests** | CTA re-disables. State returns to "add at least one." |
| 9 | **API failure during save** | Fall back to in-memory mock. User sees no error. Re-sync on next successful API call. |
| 10 | **User on mobile (narrow viewport)** | Input full-width. Starter chips in 2-column grid. Saved chips wrap naturally. |

---

## 11. Analytics & Instrumentation

### 11.1 Events

| Event | Trigger | Properties |
|---|---|---|
| `onboarding_viewed` | Onboarding screen renders | `userId`, `timestamp` |
| `onboarding_completed` | "Build My Dashboard" clicked | `userId`, `interestCount`, `timeToComplete` (ms), `chipSourceCount` (how many from starter chips) |
| `onboarding_skipped` | "Skip for now" clicked | `userId`, `timestamp` |
| `interest_created` | Interest saved during onboarding | `userId`, `interestText`, `source` (`manual` vs chip click), `coverageLevel` |
| `interest_mapped` | Interest matched to a managed category | `userId`, `interestText`, `categoryId`, `categoryName`, `isActivated`, `matchScore` |
| `interest_web_only` | Interest saved with no category match | `userId`, `interestText` |
| `interest_removed` | Interest chip removed during onboarding | `userId`, `interestId` |
| `dashboard_first_card_click` | User clicks first suggestion on post-onboarding dashboard | `userId`, `suggestionText`, `interestText`, `tab` |
| `starter_chip_clicked` | A starter chip is clicked | `userId`, `chipLabel`, `wasAlreadyAdded` |

### 11.2 Funnel

```
onboarding_viewed
    → interest_created (1st)
    → interest_created (2nd, 3rd...)
    → onboarding_completed
    → dashboard_first_card_click
```

Track drop-off at each stage. Alert if `onboarding_viewed → onboarding_completed` < 90%.

---

## 12. Technical Architecture

### 12.1 New Components

| Component | Location | Responsibility |
|---|---|---|
| `OnboardingView` | `src/views/OnboardingView.tsx` | Top-level view gated by `onboardingStep`. Composes input + chips + CTA. |
| `WorldviewInput` | `src/components/onboarding/WorldviewInput.tsx` | Free-text input with enter-to-add. Calls `useUserInterests.addInterest()`. |
| `StarterChips` | `src/components/onboarding/StarterChips.tsx` | Cloud of popular domain chips. Sources from managed category domains. |
| `SavedInterestChips` | `src/components/onboarding/SavedInterestChips.tsx` | Flex-wrap display of added interests with coverage dots and remove buttons. |

### 12.2 Modified Components

| Component | Change |
|---|---|
| `App.tsx` | Add routing guard: if `onboardingStep !== 'complete'`, render `OnboardingView` instead of `HomeView`. |

### 12.3 Existing Infrastructure (No Changes Required)

| System | Usage |
|---|---|
| `useUserInterests` hook | State management, CRUD, duplicate checking |
| `interestService.ts` | `addInterest()`, `removeInterest()`, `isDuplicate()`, `computeCoverage()` |
| `categoryMatcher.ts` | Fuzzy matching against managed categories |
| `api/interests/` | REST endpoints for persistence |
| `profiles.onboardingStep` | DB column gating the flow |
| `profiles.interests` | JSONB storage for Interest objects |
| `HomeView.tsx` | Already accepts `userInterests` and personalizes suggestions |

### 12.4 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  OnboardingView                                             │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐     │
│  │ WorldviewInput   │───▶│ useUserInterests.addInterest │    │
│  │ (free text)      │    │                              │    │
│  └─────────────────┘    │  ┌─────────────────────┐     │    │
│                          │  │ interestService.ts   │     │    │
│  ┌─────────────────┐    │  │  ├─ isDuplicate()    │     │    │
│  │ StarterChips     │───▶│  │  ├─ computeCoverage()│    │    │
│  │ (click to add)   │    │  │  │   └─ matchCategory│    │    │
│  └─────────────────┘    │  │  └─ createInterest() │     │    │
│                          │  └─────────────────────┘     │    │
│  ┌─────────────────┐    │                               │    │
│  │ SavedInterestChips│◀──│  interests: Interest[]       │    │
│  │ (coverage badges)│    │  (reactive state)             │    │
│  └─────────────────┘    └─────────────────────────────┘     │
│                                                             │
│  [Build My Dashboard] ──▶ PATCH profiles.onboardingStep     │
│                          → Navigate to HomeView             │
│                          → Interests in system prompt       │
│                          → Suggestions auto-personalize     │
└─────────────────────────────────────────────────────────────┘
```

### 12.5 Starter Chip Derivation

```ts
const STARTER_DOMAINS = [...new Set(
  MOCK_MANAGED_CATEGORIES.map(c => c.domain)
)];
// → ["Metals", "Packaging", "IT Services", "Chemicals", "Energy",
//    "MRO", "Marketing", "HR Services", "Facilities", "Travel",
//    "Fleet", "Logistics"]
```

Each domain chip adds the domain name as an interest. `matchCategory()` handles mapping to the best matching category.

---

## 13. Scope & Phasing

### V1 (This PRD — MVP)

| Feature | In Scope |
|---|---|
| Onboarding screen with free-text input | Yes |
| Starter chips from managed category domains | Yes |
| Real-time coverage badge on saved interests | Yes |
| "Build My Dashboard" → personalized Home | Yes |
| "Skip for now" bypass | Yes |
| `onboardingStep` gating (show once) | Yes |
| Analytics events (Section 11) | Yes |
| Dashboard content cards seeded from interests | No |
| "Buying Need" selector | No |
| Role-based templates | No |
| Legacy import | No |
| Scheduled alerts | No |
| Team sharing | No |
| Real-time refresh of web cards | No |

### V1.5 (Fast Follow)

| Feature | Description |
|---|---|
| Buying Need Selector | Multi-select needs that modify system prompt emphasis |
| Region quick-select | Chip set for common regions alongside interest input |
| Onboarding analytics dashboard | Completion rate, time-to-complete, most-selected chips |

### V2 (Future)

See [Section 16](#16-future-scope-v2).

---

## 14. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Users type long sentences instead of keywords | Medium | Low | `extractInterestContext()` extracts commodity keywords. Worst case: saved as `web_only`, still functional. |
| R2 | Starter chips don't cover user's domain | Low | Medium | 12 domains from managed catalog. Free-text handles everything else. `web_only` ensures no dead ends. |
| R3 | API failure during onboarding | Low | High | `interestService.ts` falls back to in-memory mock storage. Re-sync on reconnect. |
| R4 | User adds 20+ interests during onboarding | Low | Low | Soft cap at 10 with hint. System max is 50. `generatePersonalizedSuggestions()` cycles through them. |
| R5 | Coverage badges confuse users | Medium | Medium | Add tooltip: "Decision Grade: Full Beroe analyst coverage", "Available: Can be activated", "Web Only: Using web sources". |
| R6 | Users expect immediate "real data" for web-only topics | Medium | Medium | Clearly label coverage tier with badge. Show "Web Research" label. |
| R7 | Mapping quality is inconsistent | Low | Medium | Category matcher uses confidence threshold (>= 0.4). Allow user edits in Settings. |
| R8 | Onboarding competes with existing interest entry points | Low | Low | No conflict. Onboarding is first-run only. Settings and Chat are ongoing. All use same hook and API. |

---

## 15. Open Questions

| # | Question | Options | Recommendation |
|---|---|---|---|
| OQ-1 | Should we ask for region/grade in onboarding, or infer later? | **A)** Include optional region/grade fields in onboarding. **B)** Infer from text ("Steel - Europe") and let users refine in Settings. | **B** — keep onboarding minimal. Text parsing handles the common case; Settings handles refinement. |
| OQ-2 | Should onboarding allow "Upload CSV of interests"? | **A)** Add CSV upload for power users. **B)** Defer to V2 / CSM import. | **B** — low priority for V1. CSV import is a power-user flow better suited to admin tools. |
| OQ-3 | Do we want multi-step onboarding or one-screen only? | **A)** Single screen (interests only). **B)** Two steps (interests → buying needs). **C)** Progressive (interests now, needs later via prompt). | **A** for V1 — single screen reduces friction. Buying needs deferred to V1.5. |
| OQ-4 | Should "Skip" still set default interest seeds? | **A)** Skip = no interests, fully generic. **B)** Skip = seed 3 default interests (e.g., top domains). | **Open** — both valid. Seeding reduces blank-slate risk but may confuse users who expect a clean start. |
| OQ-5 | Should coverage badges be visible during onboarding, or only after? | **A)** Show badges on chips during onboarding (current spec). **B)** Hide badges during onboarding, reveal in Settings/Dashboard. | **A** — badges reinforce that the system "understood" the input. Builds trust. |

---

## 16. Future Scope (V2)

### 16.1 Import Legacy Followed Categories

For existing Beroe customers migrating to Abi Plus:
- Auto-import "Followed Categories" from the legacy platform.
- Map legacy category IDs to managed categories using `matchCategory()`.
- Source: `'csm_imported'` (already defined in `InterestSource` type).
- Show: "We imported X categories from your previous setup."

### 16.2 Role-Based Onboarding Templates

Pre-configured interest sets based on job function:

| Role | Template Interests |
|---|---|
| Category Manager (Metals) | Steel, Aluminum, Copper, Zinc, Nickel |
| Category Manager (Packaging) | Corrugated, Flexible Packaging, Labels, Pallets |
| Procurement Director | Cross-category: top 5 by spend |
| Supply Chain Manager | Logistics, Freight, Warehousing, Fleet |

Implementation: "I am a... [Role Selector]" → pre-fills interests.

### 16.3 Dashboard Content Cards

Seed the Home Dashboard with content cards per interest:

| Card Type | Source | Content |
|---|---|---|
| Price Card | L2a (Beroe) | Latest price chart, % change, forecast |
| Risk Card | L2a (Beroe) | Supply risk score, key disruptions |
| Market Summary | L1 (Web) | AI-generated summary from web sources |
| Activation CTA | Catalog | "Activate [Category] for full coverage" |

### 16.4 Alerts and Monitoring Agents

- Per-interest alert configuration: price thresholds, risk score changes, news triggers.
- Alert deduplication via Interest Key specificity scoring (per INTEREST_TAXONOMY_SPEC.md).
- Delivery: in-app notifications, email digest, Slack/Teams.

### 16.5 Progressive Profiling

Learn interests over time:
- Infer from chat behavior (already implemented via `extractTopicFromResponse()`).
- Suggest: "You've asked about Lithium 5 times. Want to track it?" (TrackInterestButton already built).
- Reduce onboarding friction to near-zero for returning users.

### 16.6 Team Onboarding

For enterprise deployments:
- Admin sets default interests for the team/org.
- New team members inherit team interests on first login.
- Individual members can add/remove their own on top.

### 16.7 Intelligent Starter Chips

Replace static domain chips with:
- Industry-specific suggestions based on `profiles.industry`.
- Company-specific suggestions based on org's activated managed categories.
- Trending categories across the Beroe platform.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **Interest** | A user-saved focus area. Can map to a Beroe managed category or be freeform. |
| **Managed Category** | One of ~500 Beroe-curated procurement categories with analyst coverage. |
| **Coverage Level** | Data availability: `decision_grade` / `available` / `partial` / `web_only`. |
| **Canonical Key** | Normalized, sorted, pipe-delimited token string for deduplication. |
| **Starter Chips** | Clickable topic suggestions on the onboarding screen, derived from managed category domains. |
| **Worldview** | The user's declared set of procurement interests that personalizes their Abi Plus experience. |
| **L1 / L2a / L2b / L3** | Content tiers. L1 = AI/web (free), L2a = managed categories (slot-based), L2b = on-request (credits), L3 = bespoke expert (credits). |

## Appendix B: Related Documents

| Document | Location |
|---|---|
| Interest Taxonomy Spec | `docs/INTEREST_TAXONOMY_SPEC.md` |
| Three-Tier Architecture Plan | `docs/THREE_TIER_IMPLEMENTATION_PLAN.md` |
| Post-April Production Plan | `docs/POST_APRIL_PRODUCTION_PLAN.md` |
| Feature Roadmap Status | `docs/FEATURE_ROADMAP_STATUS.md` |
| Demo Auth Plan | `docs/DEMO_AUTH_PLAN.md` |

## Appendix C: Test Plan

| Test Area | Cases | Owner |
|---|---|---|
| **Onboarding Gate** | `onboardingStep` values route correctly; returning users skip; skip link works | Engineering |
| **Interest Input** | Free-text entry, enter-to-add, comma separation, region parsing, duplicate rejection, gibberish handling | Engineering |
| **Starter Chips** | Click-to-add, pre-selected state for existing interests, coverage badge accuracy | Engineering |
| **Coverage Accuracy** | "Steel" → `decision_grade`, "Rare Earth" → `available`, "Unicorn Farming" → `web_only` | Engineering |
| **Dashboard Personalization** | Suggestions reference saved interests, tab cycling with 1-10+ interests | Engineering |
| **Skip Flow** | No interests created, generic suggestions shown, Settings accessible | Engineering |
| **Analytics** | All 9 events fire correctly, funnel tracking works | Engineering |
| **Soft Cap** | Hint shown at 10 interests, input remains functional to 50 | Engineering |
| **Mobile Responsive** | Input, chips, buttons render correctly at 375px | Design |
| **Accessibility** | Keyboard navigation, screen reader labels, color contrast | Design + Engineering |
| **API Resilience** | Interests save when API is down (fallback), re-sync on reconnect | Engineering |
