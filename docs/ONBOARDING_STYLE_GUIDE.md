# Onboarding Screen — Style & Motion Guide

Derived from analysis of the Expert Portal, Deep Research Command, Report Artifact, HomeView, and ChatInput components.

---

## 1. Design Language Summary

Abi Plus uses a **soft glassmorphic** aesthetic on a neutral slate canvas. The system avoids hard edges and heavy shadows — everything floats with barely-there borders, translucent backgrounds, and muted ring accents. Color is used sparingly and semantically (violet = primary action, emerald = success/confirmed, blue = informational, amber = attention).

Typography is set in **ClashGrotesk** — a geometric sans-serif loaded in 3 weights (300 light, 400 regular, 500 medium). Headlines use medium weight with tight tracking; body text uses regular weight at 15px with relaxed leading.

Motion follows a **stagger-and-settle** pattern: elements fade in bottom-to-top with slight y-offset, staggered by ~50ms per item, using `ease-out` curves. Interactive elements use spring physics for tactile feedback.

---

## 2. Tokens Extracted from Codebase

### 2.1 Color Palette

```
Canvas / Page
  bg-[#fafafa]                    Page background (Expert Portal, global)
  rgb(248 250 252)                Body background (index.css → slate-50)

Card Surfaces
  bg-white                        Solid cards
  bg-white/80                     Frosted cards (floaty pattern)
  bg-white/60                     Suggestion cards (HomeView)
  bg-slate-50/50                  Recessed panels (Deep Research intake)
  bg-[#F7F8FB]                    Input backgrounds (Deep Research)

Borders
  border-white/60                 Floaty card border
  border-slate-100/60             Standard card border (Expert Portal)
  border-slate-200/50             Suggestion card border (HomeView)
  border-[#E8ECF1]                Deep Research separator

Accent — Violet (Primary)
  #682AF9 / violet-600            Primary buttons, active indicators (Deep Research)
  #8b5cf6 / violet-500            Standard violet actions
  #7c3aed / violet-600            Button hover
  violet-50                       Light tint backgrounds
  violet-100                      Chip selected bg
  violet-200                      Focus ring, selected border

Accent — Emerald (Success/Confirmed)
  #10b981 / emerald-500           Completed steps, decision_grade
  emerald-50                      Success backgrounds
  emerald-100                     Badge backgrounds

Accent — Blue (Info/Available)
  #3b82f6 / blue-500              Web sources, info
  blue-50                         Available coverage background
  #0039FF                         Insight banner (solid blue)

Accent — Amber (Attention/Warning)
  #f59e0b / amber-500             Warnings, TOP VOICE badge
  amber-50                        Warning backgrounds

Text Hierarchy
  #242F47 / text-primary          Headlines (custom CSS var)
  #1A1F36 / text-slate-900        Deep Research titles
  #5D6A89 / text-slate-600        Body text (Deep Research)
  #6B7A99 / text-secondary        Secondary text (custom CSS var)
  #7C83A1 / text-slate-500        Tertiary text
  #9BA8C2 / text-muted            Placeholder/muted (custom CSS var)
  #A0A8BE                         Disabled text (Deep Research)
```

### 2.2 Typography Scale

```
Display (HomeView greeting)
  text-4xl md:text-5xl            36px → 48px
  font-medium                     500
  text-primary                    #242F47
  tracking-tight                  -0.025em

Heading 1 (Report title)
  text-[28px] leading-[1.2]       28px
  font-medium tracking-[-0.02em]  500
  text-slate-900

Heading 2 (Section title)
  text-[20px] leading-[1.3]       20px
  font-medium                     500
  text-slate-900

Heading 3 (Card title, Expert Portal)
  text-lg / text-[17px]           17-18px
  font-medium                     500
  text-slate-800

Body (AI response, prose)
  text-[15px] leading-[1.75]      15px
  font-normal                     400
  text-slate-600 / #1D1D1D

Body Small (Labels, descriptions)
  text-[13px] leading-relaxed     13px
  font-normal                     400
  text-[#5D6A89]

Caption (Metadata, timestamps)
  text-[11px] / text-xs           11-12px
  font-medium uppercase           500
  tracking-widest / tracking-wide
  text-slate-400 / text-[#7C83A1]

Micro (Tiny badges)
  text-[10px]                     10px
  font-medium                     500
  uppercase tracking-wide
```

### 2.3 Spacing System

```
Consistent across all components:

  p-3  (12px)    Small chips, compact elements
  p-4  (16px)    Standard cards
  p-5  (20px)    Large cards, Expert Portal
  px-6 (24px)    Page-level horizontal padding

  gap-2  (8px)   Chip rows, tight elements
  gap-3  (12px)  Card grids, chip groups
  gap-4  (16px)  Section content
  gap-5  (20px)  Major sections

  space-y-2      Tight lists
  space-y-3      Card lists (interests)
  space-y-4      Standard sections
  space-y-5      Major sections (Expert Portal)
```

### 2.4 Border Radius

```
  rounded-full         Pills, chips, avatars, status dots
  rounded-3xl (24px)   Hero cards (Expert Portal)
  rounded-[20px]       Major cards (Expert Portal)
  rounded-2xl (16px)   Standard cards, buttons, inputs
  rounded-[1.25rem]    Floaty cards (interests)
  rounded-xl (12px)    Inner cards, callouts, inputs
  rounded-lg (8px)     Small elements, tables
  rounded-md (6px)     Tiny badges
```

### 2.5 Shadows

```
Floaty (primary card shadow)
  shadow-[0_8px_30px_rgb(0,0,0,0.04)]          Floaty cards (interests)
  shadow-[0_8px_40px_-12px_rgba(148,163,184,0.15)]  Expert Portal cards

Subtle
  shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]        Mini stat boxes
  shadow-sm                                      Icon boxes, small elements

Elevated
  shadow-lg                                      Hover lift
  shadow-2xl                                     Drawers

Chat Input
  shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]   Default input
  shadow-[0_8px_30px_rgb(0,0,0,0.04)]           Compact input

Ring accent (used with floaty shadow)
  ring-1 ring-black/[0.02]                       Default state
  ring-2 ring-violet-500/30                      Selected/focus state
```

### 2.6 Glassmorphism Recipe

```
The "floaty" card pattern (used in interests, compact input):

  bg-white/80
  backdrop-blur-sm
  border border-white/60
  shadow-[0_8px_30px_rgb(0,0,0,0.04)]
  ring-1 ring-black/[0.02]
  rounded-[1.25rem]

Hover enhancement:
  hover:shadow-[0_8px_30px_rgb(0,0,0,0.07)]
  hover:ring-black/[0.04]

Selected state:
  bg-white/90
  border-violet-200/60
  ring-2 ring-violet-500/30
  shadow-[0_8px_30px_rgb(0,0,0,0.06)]
```

---

## 3. Motion Patterns

### 3.1 Entrance Animations (Framer Motion)

```tsx
// Standard fade + slide up (most elements)
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: 'easeOut' }}

// Staggered children (lists, chip clouds)
transition={{ delay: index * 0.05 }}

// Scale entrance (logo, icons)
initial={{ opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.3 }}

// Spring entrance (celebratory, success)
transition={{ type: 'spring', stiffness: 400, damping: 15 }}
```

### 3.2 Interactive Motion

```tsx
// Button press
whileTap={{ scale: 0.98 }}

// Card hover lift
hover:-translate-y-0.5
// or
whileHover={{ scale: 1.02 }}

// Chip select (Deep Research)
animate={{ width: selected ? 14 : 0, opacity: selected ? 1 : 0 }}
transition={{ duration: 0.15 }}
```

### 3.3 Transition Animations

```tsx
// View transition (page to page)
exit={{ opacity: 0, y: -10 }}    // Current view exits up
initial={{ opacity: 0, y: 10 }}  // New view enters from below
transition={{ duration: 0.3 }}

// Drawer slide
initial={{ x: '100%' }}
animate={{ x: 0 }}
transition={{ type: 'spring', damping: 30, stiffness: 300 }}

// Collapse/expand
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
transition={{ duration: 0.2, ease: 'easeInOut' }}
```

### 3.4 Loading & Progress

```tsx
// Breathing pulse (Deep Research brain icon)
animate={{ scale: [0.82, 1, 0.82] }}
transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}

// Progress bar fill
initial={{ width: 0 }}
animate={{ width: `${percentage}%` }}
transition={{ duration: 0.5, ease: 'easeOut' }}

// Blinking dot (active status)
animate={{ opacity: [1, 0.3, 1] }}
transition={{ duration: 1.5, repeat: Infinity }}
```

---

## 4. Component Patterns to Reuse

### 4.1 Chip / Pill (from Deep Research intake + Source Enhancement)

```
Two variants used in the codebase:

A) Toggle Chip (Deep Research questions):
   Unselected: bg-[#F7F8FB] text-[#5D6A89] rounded-full px-3 py-[7px]
   Selected:   bg-[#682AF9]/10 text-[#682AF9] ring-1 ring-[#682AF9]/25
   + Check icon animates in from width 0 → 14px

B) Action Chip (Source Enhancement):
   bg-{color}-50 text-{color}-700 border-{color}-200
   hover:bg-{color}-100 hover:shadow-sm
   rounded-full px-2.5 py-1 text-xs font-medium
```

### 4.2 Input Field

```
From ChatInput (compact variant):
   bg-white/80 backdrop-blur-xl rounded-2xl
   border border-white/60 → border-violet-300 (focus)
   shadow-[0_8px_30px_rgb(0,0,0,0.04)]
   ring-1 ring-black/[0.02]
   text-[15px] text-primary placeholder:text-muted

From Deep Research intake:
   bg-[#F7F8FB] border border-[#E8ECF1] rounded-lg
   text-[13px] text-[#1A1F36] placeholder:text-[#A0A8BE]
   focus:ring-2 focus:ring-[#682AF9]/15 focus:border-[#682AF9]/30
```

### 4.3 Primary Button

```
Expert Portal style:
   py-2.5 px-4 rounded-xl
   bg-violet-600 text-white text-sm font-medium
   hover:bg-violet-700 transition-colors

Deep Research style:
   px-4 py-2.5 rounded-lg
   bg-[#682AF9] text-white text-[13px] font-medium
   hover:bg-[#5a23d6] active:scale-[0.98]

HomeView suggestion card style:
   bg-white/60 hover:bg-white
   border border-slate-200/50 hover:border-slate-200
   rounded-xl p-4
```

### 4.4 Coverage Dot (from InterestsSection)

```
   w-2 h-2 rounded-full

   decision_grade: bg-emerald-500
   available:      bg-blue-500
   partial:        bg-amber-500
   web_only:       bg-slate-400
```

### 4.5 Gradient Header (from Expert Portal + Deep Research)

```
Expert Portal hero:
   bg-gradient-to-br from-violet-100 via-slate-50 to-pink-50
   h-32 rounded-t-[20px]

Deep Research processing:
   bg-gradient-to-r from-violet-50/50 to-blue-50/50

Insight banner:
   bg-[#0039FF] with positioned background image
```

---

## 5. Onboarding Screen Recommendations

Based on the above analysis, here's how the onboarding screen should be styled to feel native:

### 5.1 Page Container

```tsx
// Match the HomeView centered layout
<div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 py-8">
  <div className="w-full max-w-[520px]">
    {/* Content */}
  </div>
</div>
```

**Rationale**: HomeView uses `flex-col items-center justify-center`. Max-width of 520px matches the deep research intake card width and keeps the form intimate.

### 5.2 Logo + Greeting

```tsx
// Match HomeView greeting animation
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
  className="mb-6"
>
  <img src="/Abi.svg" className="w-14 h-14 mx-auto" />
</motion.div>

<motion.h1
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="text-3xl md:text-4xl font-medium text-primary text-center mb-2"
>
  Hi <span className="text-secondary">{name}</span>.
</motion.h1>

<motion.p
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0.05 }}
  className="text-[15px] text-muted text-center mb-8"
>
  Let's personalize Abi Plus for you.
</motion.p>
```

**Rationale**: Uses the exact same greeting pattern as HomeView (text-primary + text-secondary split, scale entrance for logo, slide entrance for text). Subtitle uses the muted color at 15px body size.

### 5.3 Interest Input

```tsx
// Use the compact ChatInput glassmorphic style
<div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60
  shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]
  focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200
  focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
  transition-all px-4 py-3">
  <input
    className="w-full bg-transparent text-[15px] text-primary
      placeholder:text-muted focus:outline-none"
    placeholder="e.g., Steel, Packaging, IT Services"
  />
</div>
```

**Rationale**: The compact ChatInput already uses this exact glassmorphic pattern. Reusing it creates visual continuity between the onboarding input and the chat input the user will see next.

### 5.4 Saved Interest Chips

```tsx
// Floaty chip with coverage dot — matches interest cards in Settings
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  className="inline-flex items-center gap-2 px-3 py-2
    bg-white/80 backdrop-blur-sm
    border border-white/60
    shadow-[0_8px_30px_rgb(0,0,0,0.04)]
    ring-1 ring-black/[0.02]
    rounded-xl"
>
  {/* Coverage dot */}
  <span className="w-2 h-2 rounded-full bg-emerald-500" />
  {/* Text */}
  <span className="text-sm font-medium text-slate-700">Steel</span>
  {/* Remove button */}
  <button className="ml-1 text-slate-400 hover:text-slate-600 transition-colors">
    <X className="w-3.5 h-3.5" />
  </button>
</motion.div>
```

**Rationale**: Uses the floaty pattern from interest cards. Spring entrance gives a satisfying "pop" when a new chip appears (same spring physics as Deep Research success state).

### 5.5 Starter Chips (Domain Cloud)

```tsx
// Match the Deep Research toggle chip pattern
<button className={`
  inline-flex items-center gap-1.5 px-3 py-[7px]
  rounded-full text-[13px] font-normal
  transition-all
  ${isAdded
    ? 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/25'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  }
`}>
  {isAdded && <Check className="w-3.5 h-3.5" />}
  {label}
</button>
```

**Rationale**: The Deep Research intake form already uses toggle chips with the same add/remove behavior. The violet tint on selection matches the app's primary action color. The check icon animates in width from 0→14px for a subtle confirmation.

### 5.6 Section Divider (Before Starter Chips)

```tsx
// Match the Deep Research separator + report section pattern
<div className="flex items-center gap-3 my-6">
  <div className="flex-1 h-px bg-slate-200/60" />
  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
    Or pick from popular topics
  </span>
  <div className="flex-1 h-px bg-slate-200/60" />
</div>
```

**Rationale**: Uses the `text-[11px] uppercase tracking-widest` label style from the Deep Research research brief header and the Report sidebar's TOC header.

### 5.7 "Build My Dashboard" Button

```tsx
// Match the Deep Research submit button style
<motion.button
  whileTap={{ scale: 0.98 }}
  disabled={interestCount === 0}
  className={`
    w-full flex items-center justify-center gap-2
    px-4 py-3 rounded-2xl
    text-[15px] font-medium
    transition-all
    ${interestCount > 0
      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
    }
  `}
>
  Build My Dashboard
  <ArrowRight className="w-4 h-4" />
</motion.button>
```

**Rationale**: Uses `bg-slate-900` (dark button from Report Artifact's "Ask Analyst" CTA) rather than violet — this avoids competing with the violet chip selections above. The rounded-2xl and py-3 match the ChatInput's send-button family.

### 5.8 "Skip for now" Link

```tsx
<button className="text-sm text-muted hover:text-secondary transition-colors mt-3">
  Skip for now
</button>
```

**Rationale**: Uses the text-muted → text-secondary hover pattern from the HomeView tab navigation.

### 5.9 Transition to Dashboard

```tsx
// Exit animation for onboarding
<motion.div
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3 }}
>

// Interstitial
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex flex-col items-center gap-4"
>
  <motion.div
    animate={{ scale: [0.82, 1, 0.82] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <img src="/Abi.svg" className="w-12 h-12" />
  </motion.div>
  <p className="text-[15px] text-secondary">Personalizing Abi for you...</p>
</motion.div>

// Dashboard entrance
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

**Rationale**: The breathing pulse on the Abi logo uses the exact same `scale: [0.82, 1, 0.82]` pattern from the Deep Research brain icon. Exit up / enter from below matches standard page transition direction in the app.

---

## 6. Motion Timeline

```
T=0ms     Logo fades in (scale 0.8 → 1, 300ms)
T=50ms    Greeting slides up (y: -20 → 0, 300ms)
T=100ms   Subtitle slides up (y: -10 → 0, 300ms)
T=200ms   Input field fades in (opacity 0 → 1, 300ms)
T=300ms   Divider + "Or pick from popular topics" fades in (300ms)
T=350ms   Starter chips stagger in (index * 50ms, 200ms each)
T=800ms   "Build My Dashboard" + "Skip" fade in (300ms)

On interest add:
  T=0ms   Chip springs in (scale 0.9 → 1, spring, 200ms)
  T=0ms   If starter chip, check icon grows (width 0 → 14, 150ms)
  T=0ms   Input clears, cursor blinks

On "Build My Dashboard":
  T=0ms     Page fades out (opacity → 0, y → -10, 300ms)
  T=300ms   Interstitial fades in (opacity → 1, 200ms)
  T=300ms   Abi logo starts breathing pulse
  T=1100ms  Dashboard fades in (opacity 0 → 1, y: 10 → 0, 300ms)
```

---

## 7. Responsive Considerations

```
Mobile (< 640px):
  - max-w-full with px-5 padding
  - Greeting: text-3xl (30px)
  - Starter chips: flex-wrap, 2 per row feels natural
  - Saved chips: flex-wrap, full width

Tablet (640px - 1024px):
  - max-w-[520px] centered
  - Greeting: text-4xl (36px)
  - Starter chips: 3-column grid

Desktop (> 1024px):
  - max-w-[520px] centered (don't stretch wider)
  - Same as tablet layout
  - Optionally: subtle gradient or ambient decoration at edges
```

---

## 8. Accessibility Checklist

From patterns observed across codebase:

```
[x] focus:ring-2 focus:ring-violet-200 on all interactive elements
[x] aria-label on input, chips, buttons
[x] role="status" on coverage badge tooltips
[x] prefers-reduced-motion: skip all framer-motion animations
[x] Color not sole indicator — text labels accompany coverage dots
[x] Keyboard: Tab order (input → saved chips → starter chips → Build → Skip)
[x] Enter on input = submit interest (match ChatInput behavior)
[x] Delete on chip = remove interest
[x] WCAG AA contrast: all text-slate-600+ on white passes
```
