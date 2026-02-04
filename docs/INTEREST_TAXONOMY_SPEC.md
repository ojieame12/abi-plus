# Abi Plus Taxonomy, Worldview & Naming Conventions

Last updated: 2026-01-29

## 1) Purpose
Define a consistent taxonomy, data model, and naming conventions for how Abi Plus captures user interests (categories, suppliers, topics), expresses coverage, and avoids duplicate alerts. This spec is the base layer for onboarding, saved interests, recommendations, and reporting.

## 2) Product Principles
1. **Always answer**: if internal coverage is missing, fall back to web research.
2. **Interests are first-class**: users save what they care about, not just categories.
3. **Partial coverage is acceptable**: users can save incomplete interests (e.g., category only).
4. **Clarity over guesswork**: show what is covered and what is inferred.
5. **No duplicate alerts**: the most specific interest wins.

## 3) Vocabulary (Canonical Terms)
**Interest**  
A user-saved focus area. Can be category-based, supplier-based, or freeform topic-based.

**Topic**  
A system-recognized subject or ontology entry. Topics may map to categories, suppliers, or freeform text.

**Qualifier**  
Optional context that scopes an interest (e.g., region, grade/spec, industry, supplier).

**Coverage**  
Availability of internal (Beroe) or external (Web) data for an interest.

**Decision Grade**  
High-confidence internal coverage (Beroe-backed). Requires managed category + sufficient internal sources.

**Web Research**  
Coverage achieved through external web sources only.

**Partial Coverage**  
Some internal data exists but is incomplete vs. requested qualifiers.

**Interest Key**  
A canonical identifier used to deduplicate alerts and match interests.

## 4) Interest Model (Data Spec)
```ts
export type InterestType = 'category' | 'supplier' | 'topic';
export type MatchConfidence = 'exact' | 'partial' | 'broad' | 'custom';
export type CoverageLevel = 'decision_grade' | 'partial' | 'web_only' | 'unknown';

export interface InterestQualifier {
  regionId?: string;     // EU, NA, APAC, etc.
  countryId?: string;    // Optional; may be unsupported
  gradeId?: string;      // e.g., HRC, 6061-T6
  specId?: string;       // Standards/specs
  industryId?: string;   // Automotive, Pharma, etc.
}

export interface Interest {
  id: string;
  type: InterestType;
  name: string;           // Display name
  topicId?: string;       // Canonical ontology reference if known
  supplierId?: string;    // For supplier interests
  qualifiers: InterestQualifier;
  matchConfidence: MatchConfidence;
  coverage: {
    internal: boolean;    // Beroe coverage exists
    web: boolean;         // Web fallback possible
    level: CoverageLevel; // decision_grade | partial | web_only
    gapReason?: string;   // e.g., "No country-level data"
  };
  createdAt: string;
  updatedAt: string;
}
```

### 4.1 Interest Key (for dedupe)
```ts
function interestKey(i: Interest): string {
  return [
    i.type,
    i.topicId || i.name.toLowerCase(),
    i.qualifiers.regionId || '*',
    i.qualifiers.countryId || '*',
    i.qualifiers.gradeId || '*',
    i.qualifiers.specId || '*',
    i.qualifiers.industryId || '*',
    i.supplierId || '*',
  ].join('|');
}
```

## 5) Coverage Rules
1. **Decision Grade**  
   - Managed category + ≥2 internal sources  
2. **Partial**  
   - Internal sources exist but do not match all qualifiers (e.g., region missing)  
3. **Web Only**  
   - No internal sources; fall back to web  

Coverage resolution must return:
```ts
{
  internal: boolean,
  web: boolean,
  level: 'decision_grade' | 'partial' | 'web_only',
  gapReason?: string,
}
```

## 6) Alert Deduplication Rules
Goal: avoid duplicate alerts when interests overlap.

### Specificity score
```
score = 0
if supplierId -> +4
if gradeId/specId -> +3
if countryId -> +2
if regionId -> +1
```

### Dedupe rule
- For a given event, identify all matching interests.
- Keep only the interest with highest specificity score.
- If scores tie, prefer the one with Decision Grade coverage.

## 7) User Experience Implications
### 7.1 Interests Manager (single hub)
- Unified list of category interests, supplier interests, and custom topics.
- Coverage badge per interest: Decision Grade / Partial / Web Research.
- Optional “Fix coverage” action if gaps exist.

### 7.2 Onboarding / Interest Capture
Supported flows:
1. **Golden path**: category + region + grade (exact)
2. **Partial**: category only, region only, etc.
3. **Non‑standard topic**: custom string (e.g., “Lego minifigs”)

UI must explicitly show when qualifiers are missing or unsupported.

### 7.3 Answering UX
- If coverage is Decision Grade → surface internal sources.
- If Partial → show internal + suggest web expansion.
- If Web Only → clear “Web Research” label.

## 8) Naming Conventions (UI + Data)
| Concept | Preferred Term | Avoid |
|---|---|---|
| User-saved focus | Interest | Topic (user-facing) |
| Canonical ontology | Topic | Interest |
| Managed coverage | Decision Grade | “Internal Only” |
| Partial coverage | Partial Coverage | “Missing data” |
| External coverage | Web Research | “Unmanaged” |

## 9) Examples
### 9.1 Golden Path
Interest: “Caustic Soda · Europe · 50% grade”
Coverage: Decision Grade

### 9.2 Partial Coverage
Interest: “Automotive Resins · EU” (no grade data)
Coverage: Partial  
Gap: “Grade‑specific data not available”

### 9.3 No Internal Coverage
Interest: “Lego Minifigs”  
Coverage: Web Only

## 10) Open Questions
- Should custom topics appear in the same alerts queue as managed categories?
- How much of this should be auto‑inferred from chat history vs. explicit confirmation?
- Should we store “preferred qualifiers” even if unsupported (e.g., country)?

## 11) Implementation Checklist (MVP)
1. Add Interest model to data layer
2. Build Interests Manager UI
3. Implement coverage resolver + source confidence mapping
4. Add alert dedupe logic
5. Add “Save Interest” actions in chat / results
