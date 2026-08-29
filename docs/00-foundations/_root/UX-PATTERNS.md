# UX Patterns
> *"Let all things be done decently and in order."* — 1 Corinthians 14:40 (KJV)
## What This Document Is
This document specifies the user experience patterns used consistently across the SKOS PWA. It is the bridge between the theological foundations (`THE-WAY.md`, `MIND-OF-CHRIST.md`, `EXCELLENCE-STANDARD.md`, `SCRIPTURE-REFERENCE-STANDARD.md`) and the technical implementation in the platform layer.
When a developer implements a new feature in SKOS, this document tells them how scripture should render, how audio should play, how depth should be revealed, and what consistency to maintain.
## Design Principles (Derived from Foundations)
These principles cascade from `EXCELLENCE-STANDARD.md`:
1. **Progressive disclosure.** Default views are clean. Depth is available on expand.
2. **Religion AND relationship.** Every screen has both backbone and warmth.
3. **Comprehensive but uncluttered.** Hide depth without removing it.
4. **Speed serves the user, not the developer.** The product is built to be fast for the user's brain, not fast for the developer's convenience.
5. **Accessibility is non-negotiable.** Screen readers, keyboard navigation, color contrast, and reduced motion are first-class.
6. **Inline, no jumping (DR-0201, Darrell 2026-07-20).** When a user acts on something, the response — a confirmation, a bulk-action bar, a revealed control, an updated value — appears **where the eye already is**: in the flow, next to the thing acted on, on-screen. It never forces the eye to jump to another part of the screen, and never lands off-screen. A selection/action bar stays in view with the selection (floats/pins, not parked at the top); a revealed control opens at its trigger; a changed value updates in place. The ONE allowed movement is an **explicit** "take me there" (e.g. a "View" that opens a panel elsewhere) via a *smooth scroll that carries the eye with it* — continuity, not a jump; a response the user did not ask to relocate must not relocate. **Applied (DR-0202, 2026-07-20):** the Imported "Inspect" toggle on a learned-duplicate group expands the candidate rows (date · account · full description) *in place* rather than opening a detail elsewhere — inspection where the eye already is, so a merge decision is made with the facts in front of it. Pairs with a data-safety rule: an irreversible merge across **different dates** warns first (same-payee-different-date is usually two separate payments, e.g. a salary that posts twice a month), and shows the actual dates.
## Pattern 1: Scripture Component
### Specification
Every scripture reference in the SKOS PWA renders through a unified `<Scripture>` component.
### Default State

```
[ESV] Philippians 4:8                                  [⌃]
"Finally, brothers, whatever is true, whatever is 
honorable, whatever is just, whatever is pure..."
                                                  [▷ 1.0x]
```


The default shows:
- Translation badge (user's primary, default ESV)
- Reference (book chapter:verse)
- Verse text in user's chosen translation
- Expand control (chevron)
- Audio playback control with current speed
### Expanded State (after user taps chevron)

```
[ESV] Philippians 4:8                                  [⌄]
"Finally, brothers, whatever is true..."
                                                  [▷ 1.0x]
────────────────────────────────────────────────────────
[KJV] "Finally, brethren, whatsoever things are 
true, whatsoever things are honest..."            [▷ 1.0x]
[NIV] "Finally, brothers and sisters, whatever is 
true, whatever is noble..."                       [▷ 1.0x]
[AMP] "Finally, believers, whatever is true, 
whatever is honorable and worthy of respect..."   [▷ 1.0x]
> Greek: logizomai (G3049) — accounting/reckoning.
  "Think" here is active calculation, not passive 
  musing.
```


The expand reveals:
- KJV (always shown when expanded)
- NIV (always shown when expanded)
- AMP (always shown when expanded)
- Strong's word-study (when annotated by content author)
- Per-translation audio playback
### User Preference Override
In Settings → Reading, the user can:
- Change their primary translation (which shows by default)
- Choose which secondary translations appear in the expand
- Disable Strong's annotations if desired
- Set default expand behavior (always collapsed, always expanded, remember last state per content)
### Component API (Implementation Reference)

```typescript
interface ScriptureProps {
  reference: string;          // e.g., "Philippians 4:8"
  primaryText: string;        // ESV by default, or user's chosen primary
  alternateTexts?: {
    kjv?: string;
    niv?: string;
    amp?: string;
  };
  wordStudy?: WordStudy[];    // Strong's annotations from content author
  initiallyExpanded?: boolean;
}
```


## Pattern 2: Audio (TTS) Component
### Specification
Every piece of readable content in SKOS — scriptures, foundation docs, module copy, teaching content — has a play button.
### Implementation Approach (Phase 1)
**Voice provider: Browser default (Web Speech API).** Works everywhere, free, no per-character cost. Voice quality is acceptable; speed and pause control are excellent.
**Architecture:** The TTS implementation is wrapped behind an interface (`ITTSProvider`). The browser implementation is one provider. A premium provider (ElevenLabs, AWS Polly Neural, Google Cloud TTS, etc.) can be swapped in later without touching feature code.

```typescript
interface ITTSProvider {
  speak(text: string, options: TTSOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  getVoices(): Voice[];
}
interface TTSOptions {
  rate: number;       // 0.5 to 3.0
  voice?: string;     // voice identifier
  onEnd?: () => void;
}
```


When SKOS later upgrades to a premium voice provider, only the provider class changes. All feature code that calls `tts.speak(...)` continues to work.
### Per-Content Controls
Every play button has:
- **Play / Pause toggle**
- **Speed indicator and slider** (default app-wide preference, override per content)
- **Voice selector** (when multiple voices are available)
Speed slider range: **0.5x to 3.0x**, in 0.1x increments. Default app-wide: **1.0x**.
### App-Wide Speed Preference
In Settings → Reading & Audio:
- **Default reading speed** (slider, 0.5x to 3.0x)
- **Default voice** (dropdown of available browser voices)
- **Auto-play scripture** (toggle — when a scripture component renders, should it auto-play? Default: off)
### Why Speed Control Matters
People process language at different speeds. A reader who thinks fast can absorb a passage at 1.5x or 2x in less time without losing comprehension. A reader who needs more time can drop to 0.8x or 0.7x. Both should be served.
This is `EXCELLENCE-STANDARD.md` enacted: the product respects the user's cognition.
### Current implementation (shipped)
The read-aloud primitive lives in `app/src/lib/tts.js` (engine + `useTextToSpeech` hook) with the floating control in `app/src/components/TTSControl.jsx` — the HEAR half of the see/hear accessibility pair (its SEE companion is the large-print / text-size primitive shipping alongside). It is the browser Web Speech provider behind a swappable engine. Text is SEGMENTED into short, sentence-sized utterances so a speed change re-speaks the current segment at the new rate (audible live, from where the listener was) — this also sidesteps Chrome's ~15s long-utterance cutoff and iOS Safari truncation. Voice enumeration handles the async `voiceschanged` event and picks the most natural English voice; rate + voice persist per device; an unsupported device degrades to nothing (no crash). Unit-tested, proven-to-catch in `app/src/__tests__/tts.test.js`.
### Phase 2 — better voices (DEFERRED; not now)
The Web Speech voices are *acceptable*, not natural. Two upgrade paths exist for when we need them; both keep the swappable-provider seam above so feature code calling the engine never changes:
- **Cloud TTS** (ElevenLabs / AWS Polly Neural / Google Cloud TTS) — the most natural voices, lowest effort. Cost: per-character billing and audio leaving our infrastructure to a vendor — a DATA-AS-EMPOWERMENT-NOT-EXTRACTION tension; acceptable only for non-sensitive public copy, never for private family/financial content.
- **Sovereign local TTS** (Piper / Coqui) — natural AND sovereign: the model runs on the planned GPU / AI-media hardware (`AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`), no audio leaves the house, no per-character cost. Higher setup; the right long-term home for anything private.
- **Bishop Gwin's own voice (custom cloned voice) — DEFERRED, gated, NOT conference-critical.** A future option: read sermon / study content aloud in Bishop Gwin's *actual* voice. Sovereign approach only — an open-source voice-cloning model (Coqui XTTS-v2, a custom Piper voice, or similar) trained on his existing YouTube sermon-stream audio, running on the planned GPU / AI-media hardware so **his voice stays in-house, no vendor cloud**. This is one provider behind the same swappable seam; it does not change feature code. **Two hard gates before any build:**
  1. **Hardware** — rides the perpetual-LLM / GPU box; it is NOT feasible on the current CPU NAS.
  2. **Bishop Gwin's EXPLICIT CONSENT + guardrails** — his voice and likeness are his to authorize. The cloned voice may read ONLY his real, authored content; every synthesized playback is clearly labeled as synthesized; it never fabricates him saying things he did not say. Consent is revocable and governs the whole capability (pairs with `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, and family/community voice governance).
  Status: deferred, not a now item, gated on hardware **and** his blessing.
**When:** this rides the local-LLM / GPU hardware build-out — not a now item. Until then the browser provider is the correct, free, unbreakable default. The speed-fix + native-best Web Speech control is what ships now; everything in this Phase 2 list (including the Bishop Gwin voice) is a documented future path, not current work. Recorded here so the path isn't re-derived later.
## Pattern 2b: Large-Print / Text-Size — CONTENT scales, DISPLAY CHROME is capped (PoeTech Standard)

**Binding standard, declared by Darrell 2026-07-14:**

> "when the fonts get bigger the main header H1 dont change sizes ... only the text fonts get larger as you increase size so it doesnt over run the screens all apps ... We need all TEXT THAT IS EXPECTED TO BE READ OR READ ALOUD USING THE STANDARD TTS ... TO GET BIGGER, NOT BIG TEXT ALREADY."

The large-print control (the SEE half of the see/hear accessibility pair; its HEAR companion is Pattern 2's TTS) exists to grow the text a person actually **reads** — body copy, cards, labels, list items, the reading surfaces, and **anything the TTS reads aloud**. It must **not** grow the already-large **display type** (the page-title `<h1>`, the primary/secondary nav). Big display text that scales with the control **overruns the screen** (a giant "Real Solutions for Real Life." pushed the whole app off a phone). That is the bug this standard prevents.

**The rule (applies to every app / surface on the platform):**

- **CONTENT scales fully** — body/cell text, card bodies, labels, form text, reading bodies, and any string the TTS speaks. This is the text expected to be read; it inherits the root-font scale for free (author new reading text in `rem`, never fixed `px`, so it participates).
- **DISPLAY CHROME is capped** — the main header `<h1>`/page title and the nav rows grow only gently (≈1.12x at "Largest"), never balloon. They are *already big*; the point of the control is not to make them bigger.

**Mechanism (already in the platform — reuse it, do not reinvent):** `lib/text-size.js` scales the document root font-size (all `rem` content grows) and publishes `--ts-chrome-scale`. Mark any display/nav row with the shared **`.ts-chrome-region`** class (defined in `index.css`) and it applies that variable as `zoom`, capping the region's font **and** box together. At **Normal** size it is an **exact no-op** (pixel-identical to today), so default users see zero change. Apply `.ts-chrome-region` **only** to rows holding rem-driven display/nav type and **no** already-fixed-`px` controls (so nothing already fixed is shrunk).

**Where it lives (source of truth):** the shared `SectionTitle` primitive (`components/shared.jsx`) carries `.ts-chrome-region`, so **every** surface that uses it inherits the capped page-title for free. Standalone doors that render their own display `<h1>` (e.g. `TlcPublicDoor.jsx`) wrap the title unit in `.ts-chrome-region` the same way. Regression-guarded in `__tests__/text-size.test.js` (the pure cap math: Normal = 1, Largest ≈ 1.125).

**The one-line test for any new surface:** *"When a low-vision user maxes the text size, does the readable content grow while the header stays put — or does the header overrun the screen?"* If the header scales, it is missing `.ts-chrome-region`.

## Pattern 2c: Reclaim screen real-estate — collapsing banner + back/forward nav (PoeTech Standard)

**Binding standard, declared by Darrell 2026-07-14:** *"PoeTech standard banner mover for more screen real-estate and the forward and back arrows etc — all standard PoeTech Builds."*

Two chrome primitives ship as **standards on every PoeTech build**, so the frame never wastes the small phone viewport:

1. **The banner mover (collapse for real-estate).** The tall display banner (brand, version, comfort controls, page title) must be **collapsible** so the reader can trade it for content height and bring it back on demand. Two sanctioned forms:
   - **Explicit toggle** — the chevron in the main app's nav row hides/shows the banner (the form shown in the Family OS shell).
   - **Auto-hide on scroll** — the header drops up as you read down and returns when you scroll up (`lib/use-auto-hide-header.js`, the standard collapsing top bar; used on the TLC door). Either satisfies the standard; pick per surface.
2. **Back / forward navigation arrows.** The in-app `← →` pair behaves like a browser's history within the app's views — `NavControls` (`components/shared.jsx`) driven by `useBrowserHistoryNav` (`lib/nav-history.js`). Any app with **more than a couple of navigable views** carries them; a 2-tab door does not need them (nothing to navigate back through), and forcing them there would be chrome with no function.

**The rule:** a standard PoeTech build never pins a tall, immovable banner over the content, and any multi-view app gives the user real back/forward. Reuse the primitives above — do not reinvent per app. (Ties to Pattern 2b: the collapsed/again-shown chrome is capped, never ballooned, under large text.)

## Pattern 2d: Floating controls — rest, get out of the way, then remind (PoeTech Standard)

**Declared by Darrell 2026-07-14:** *"those buttons shouldn't get bigger with text changes and they should move out the way after a certain amount of time and come up when the users move the screen as gentle reminders that those options exist for them — best practice."*

Floating action buttons (the **Feedback** launcher, the **read-aloud** button, and any future floater) follow two rules on every build:

1. **They do NOT scale with the text-size control.** They are chrome, not reading text — cap them with the shared **`.ts-chrome-region`** class (the same zoom-cap the page title + nav use, Pattern 2b), so raising text size grows the readable content and leaves the floaters put. A giant Feedback pill at A44 is the bug this prevents. (Use the region cap, NOT hardcoded `text-[12px]` — the consistency-guard requires fonts stay rem so the control *can* scale them; the cap bounds the region without breaking that invariant.)
2. **They rest, settle out of the way when idle, and re-reveal on movement.** Visible at rest; after a few idle seconds they **dim + settle** (opacity down, a small translate — still tappable, never gone); the instant the user **scrolls or touches**, they **spring back to full** — the reappearance is the *gentle reminder* the option exists. `lib/use-idle-reveal.js` is the shared primitive (returns `visible`; the caller maps it to opacity/translate). An **open** control panel is in active use and must never fade — idle-reveal applies to the collapsed/at-rest button only.

Regression-guarded in `__tests__/use-idle-reveal.test.jsx` (visible → hides after the idle window → re-reveals on scroll).

## Pattern 2e: The Still Screen — content opens in place; the screen never flies (PoeTech Standard)

**Binding standard, declared by Darrell 2026-07-09 (DR-0131) and re-asserted 2026-08-05 on the TV Time wall (DR-0274):** *"this needs to open in place and not move fast from that location because humans can get dizzy."* Fast programmatic screen movement is a vestibular-accessibility failure, not a polish preference — it pairs with this document's accessibility bar ("Reduced motion mode respected (no auto-animation)").

The three sanctioned forms of screen movement, in order of preference:

1. **In-place open (the default).** Content a tap summons renders **at the tap** — an expanding row, a full-width grid row directly under the tapped tile (the TV Time wall card), an inline panel — never far away with a compensating scroll flight. If a surface "needs" a scroll to show what just opened, the placement is the bug; fix the placement, not the flight. (`gentleReveal` in `lib/gentle-motion.js` may then nudge the view by at most the small overshoot when the opened content's top edge starts below the fold — usually it moves nothing.)
2. **User-invited travel.** When the user explicitly asks to *go* somewhere (a "back to top" control, a "full editor ↗" jump, read-aloud follow), the trip is sanctioned — but it animates only for users whose OS has not requested reduced motion: `behavior: motionBehavior()` (never a hardcoded `'smooth'`).
3. **The instant cut for view navigation.** Entering a different view (a lesson space, a new tab) repositions **instantly** (`behavior: 'auto'`) — an instant cut reads as a page change, not as movement; there is no flight to get dizzy on. ChurchLearn's lesson open/close is the reference implementation.

**Mechanism (reuse, do not reinvent):** `lib/gentle-motion.js` — `prefersReducedMotion()`, `motionBehavior()`, `gentleReveal(el)`. **Machinery, not memory:** the source-scan guard `__tests__/still-screen-motion.test.js` fails the build if any surface hardcodes `behavior: 'smooth'` outside the helper (proven-to-catch against the 16-file pre-sweep tree); the wall's in-place open + held-still screen is pinned in `__tests__/tv-time-wall.test.jsx`.

**The one-line test for any new surface:** *"When this opens, does the content come to the finger — or does the screen fly to the content?"* If the screen flies, it is the DR-0274 class.

## Pattern 2f: The form inherits the standard — plural pickers, no dead-end dropdowns, a refusal that explains itself (PoeTech Standard)

**Darrell, 2026-08-28**, on the Properties picture form: *"review what we have
built before building... we have multiple pictures upload etc... options to add
options to dropdowns... all these features need to be applied as we build
without needing to keep saying it.... our standards are higher than this build...
we have intuitive SaaS."*

**Why this pattern exists at all.** The standards below were ALREADY MET in five
or six places each. They had never been written down. So a review of every Way
in this repo — done honestly and in full — would still not have found them, and
the sixth implementation shipped without them. A standard that lives only in
implementations is not a standard; it is a coincidence that keeps holding until
it doesn't. Writing it here, and gating it, is the difference.

### 2f.1 — A picker for something PLURAL accepts many

Photographing a property, a room, or a piece of damage is a plural act. A picker
whose subject is naturally plural carries `multiple`, compresses and QUEUES each
file with its own name and size, NAMES and skips a bad file rather than failing
the batch, and lets the person remove one from the queue before anything is
written.

Reference: `LifeGallery.jsx`, `FeedbackCenter.jsx`, `ChurchObservation.jsx`,
`Rentals.jsx` (room + maintenance photos), `DoorTabs.jsx` (`GalleryTab`).

SINGULAR IS A DECISION, NOT A DEFAULT. One receipt belongs to one transaction;
one recipe has one photo. Those are named in the guard's `SINGULAR_BY_DESIGN`
list WITH the reason — the list is the argument.

### 2f.2 — A dropdown never leaves a person with nowhere to go

If a select can be legitimately empty, it offers the way to fill it IN PLACE.
The Room picker on a door with no rooms offered exactly one choice ("Not a
specific room") and no way to make one without abandoning the pictures already
chosen. It now offers `+ Add a room…`, which opens a box in the same form,
creates the room through the SAME builder and table the Rooms tab uses (one way
to make a room, reachable from two places), and selects it.

The empty state also SAYS it is empty ("No rooms yet — …") rather than looking
like a considered single option.

### 2f.3 — A disabled control says what it is waiting for

A greyed button with no sentence beside it is the app refusing without
explaining itself. Every disabled primary action carries the condition in plain
words: "Choose at least one picture to enable this."

### The gate

`app/src/__tests__/ui-standards-guard.test.js` reads the real components and
fails the build on all three. Written BEFORE the fix and observed failing on all
three real defects — proven-to-catch (DR-0076 §3), not a green light that has
never been red. Governed by **DR-0314**.

## Pattern 2g: The rest of the standard set — reach, hit, name, and confirm (PoeTech Standard)

**Darrell, 2026-08-28:** *"build the rest of the UI standard set now."*

Every rule here was **MEASURED in the real component tree before it was written
down** (DR-0314). None is a preference; each is something this codebase already
does in the overwhelming majority of places, which is what makes it a standard
rather than an opinion.

| Standard | Already kept | Gaps found | Gate |
|---|---|---|---|
| A control shows **focus** | 2,817 uses across 152 of 218 files | 226 real (93 of the first freeze's 326 were buttons styled through focus-carrying constants — never owed) | ratchet |
| A **touch target** clears the floor | 225 uses of `min-h-[36px]`, 74 files | 69 under 36px | ratchet |
| A glyph-only button has an **aria-label** | every one | 0 | HARD, locked at zero |
| A **destructive** action confirms | 66 `confirm()` across 35 files | 6 found unguarded 2026-08-29, all fixed same-day | HARD, via `confirmThen` |

### 2g.1 — A keyboard can see where it is

Every styled `<button>` carries `focus:outline` (or `focus-visible:`). A control
with no `className` is styled by a wrapper and is not judged; `sr-only` and
`hidden` controls cannot show a ring by definition. 326 gaps existed when this
was written and are FROZEN in `scripts/ui-standards-baseline.json` — that list
may **shrink, never grow**.

### 2g.2 — A thumb can hit it — the 44-vs-36 conflict, RESOLVED by the law itself

**The accessibility checklist in this very document (below) has said 44x44 since
it was written. The code does not meet it.** Measured 2026-08-28 across every
declared height:

    36px  225      44px   47      40px  24
    32px   54      48px   10      34px   7      28px  5

The conflict was recorded 2026-08-28 as an open wound. Darrell then directed the
question be settled by RESEARCH, not by preference — *"the US government has
laws that fine those who dont comply"* — and the research (2026-08-29, DR-0315)
dissolves it, because **44 and 24 were never the same kind of number**:

- **24×24 CSS px** is the LEGAL floor — WCAG 2.2 success criterion **2.5.8
  Target Size (Minimum), Level AA**. This is the tier the enforceable rules
  bind to: the DOJ's ADA Title II final rule (28 CFR Part 35, Apr 2024) sets
  WCAG 2.1 AA for state/local governments (deadlines extended Apr 2026 to
  **Apr 26 2027 / Apr 26 2028** by entity size); Title III courts and DOJ
  settlements use WCAG 2.1/2.2 **AA** as the de facto standard for private
  entities (3,117 federal web-accessibility suits in 2025, +27%); the EU's
  EAA (in force Jun 2025) binds to the same AA tier.
- **44×44** is WCAG **2.5.5 Target Size (Enhanced), Level AAA** — plus the
  Apple HIG 44pt / Android 48dp platform guidance. No law requires AAA.
- **36px, the house floor, sits ABOVE every legal AA requirement** — 1.5× the
  24px criterion. The doc's 44 line was an AAA aim written as if it were the
  compliance bar; the code was never out of compliance on this criterion.

So: **24 is the law's floor · 36 is the enforced house floor · 44 stays the
AAA aim.** The gate stays at 36 — enforcing above the legal requirement — and
the house target posture is **WCAG 2.2 AA** across the board (the standard the
University of Illinois holds its whole campus to, with automated scans plus
manual evaluation — the same shape as this repo's gates plus DR-0104 live
review).

**re-review: 2026-10-01** — walk the 54 controls at 32px and the 7 at 34px up to
36 at least (they exceed the law but sit under the house floor), and decide
with measurement whether 44 is reachable for the touch-first surfaces. The
WCAG 2.2 AA criteria this repo does NOT yet gate are inventoried in DR-0315
with their own dates.

### 2g.3 — A glyph is not a label

A button whose entire content is `×` or an emoji carries `aria-label`. This one
had **zero** offenders, so it is HARD-gated rather than baselined: the cheapest
moment to make a standard permanent is before the first regression, and a
baseline entry can never be added for a hard kind.

### 2g.4 — A destructive action confirms — GRADUATED from Way to hard gate

Delete, Remove and Archive confirm before they destroy (66 `confirm()` guards
across 35 files). On 2026-08-28 this was recorded as **not statically
gateable** — 37 of 68 destructive buttons confirm in a PARENT via a prop
callback no scan resolves — with the note that a new instrument would graduate
it. Darrell answered *"solutions?!!!"* and the solution existed within a day
(DR-0315, per DR-0131 — fix the ONE primitive):

**`lib/confirm-action.js` exports `confirmThen(message, action)`.** When
destruction routes through one named function, "does it confirm?" stops being a
question about somebody's parent component and becomes a question about one
import — which a scan CAN answer. The gate flags a `<button>` wired to a
delete/destroy/erase handler in a file that carries neither a `confirm(` nor
the `confirm-action` import. The parent-confirm limit still stands for what it
was: files that confirm anywhere pass at the file level, stated plainly.

**The gate found six live unguarded destructions the day it ran** — recipe
(cloud row included), song idea (cloud), budget goal (cloud), and calendar
event / recurring / incident — every one deleting records with no question
asked. All six were fixed the same day with `confirmThen`, which is why this
kind is **HARD at zero** rather than ratcheted: there was nothing left to
baseline. `REVERSIBLE_BY_DESIGN` names the one exemption with its reason
(BibleReader's `eraseSpan` un-highlights a selection; nothing is destroyed).
`remove`-verb handlers are deliberately out of scope — they overwhelmingly mean
"take this row out of the draft form", and a guard firing on benign edits is
how a guard gets deleted.

### The gate

`scripts/ui-standards-guard.mjs` + `app/src/__tests__/ui-standards-set.test.js`.
Proven-to-catch on synthetic input for all four gated kinds BEFORE the real
tree is asserted clean — and destructive-confirm was proven on six REAL
defects, which it caught and whose fixes it verified the day it was written. `node scripts/ui-standards-guard.mjs` prints regressions,
tracked debt, and **healed** — the number that should fall over time (DR-0075).

## Pattern 3: Progressive Disclosure
### When to Use
Anywhere SKOS has both a simple essential view AND deeper informational/comparative content:
- Scripture (ESV default; KJV, NIV, AMP, Strong's on expand)
- Module dashboard tiles (summary number visible; detail on tap)
- Decision tools (the recommended option visible; the reasoning and alternatives on expand)
- Glossary terms (definition visible; etymology, scripture cross-references, and history on expand)
### Implementation Pattern

```
[Essential View]
  [▾ Show more]
(Expanded:)
[Essential View]
  [▴ Show less]
  ──────────────
  [Detailed Content]
```


### What Progressive Disclosure Is NOT
Not for hiding important information that the user must see (warnings, decisions they must make, consents).
Not for adding friction to common tasks (the most-used action should not be hidden behind an expand).
Not for content that's purely promotional — SKOS does not have promotional content.
## Pattern 4: The Test (Mental Stewardship Tool)
### Specification
A user can invoke the Test (from `MIND-OF-CHRIST.md`) on any thought, content, decision, or piece of writing at any time.
### Entry Points
- Global navigation: "Run the Test"
- Within a journal entry: "Test this thought"
- Within content reading: "Test this content"
- Within scripture study: "Test my response to this verse"
### Flow
1. User invokes the Test
2. User enters or selects the thought/content to test
3. The eight questions appear (Phil 4:8 filter), Adult or Kids version selectable
4. The user answers each Yes/No, optionally with notes
5. Result: PASS (all 8 yes) or FAIL (any 1 no) with the specific criterion that failed
6. If FAIL: capture and redirect workflow appears
### Output
- A timestamped record in the user's journal
- The captured thought (if it failed) is stored in a "captive thoughts log" for the user to review patterns over time
- The redirection chosen (scripture, prayer, action) is also logged
### AI Coaching Mode
In Settings, a user can enable "AI-coached Test" which uses Claude (or the configured AI provider) to walk through each criterion with the user, explain reasoning, and suggest redirections. This is `MIND-OF-CHRIST.md` Mode B.
## Pattern 5: Religion / Relationship Dual Framing
### Specification
Throughout the app, where SKOS provides advice, the response should show both a structured (religion) and a personal (relationship) angle when applicable.
### Example
In a financial module's recommendation:
**Structured (Religion):** *"Based on the avalanche method, prioritize the 24% APR credit card. Mathematically optimal."*
**Personal (Relationship):** *"Some families benefit from quick wins for momentum. If the smallest debt would feel like a victory and keep you going, the snowball method is also faithful stewardship."*
Both. The user is empowered to choose the path that holds both biblical wisdom (structure) and personal fit (life context).
### When NOT to Use
When the choice is unambiguous (e.g., "don't lie"), do not artificially create a "relationship-flavored" alternative. The dual framing serves discernment within a faithful range, not relativism.
## Accessibility (A11y) Requirements
These apply to every pattern above:
- All controls keyboard-accessible
- All non-text content has text alternatives
- Color contrast meets WCAG AA minimum (AAA where feasible)
- Audio playback has visual transcript fallback
- Reduced motion mode respected (no auto-animation)
- Screen reader semantics correct (proper headings, ARIA where needed)
- Touch targets minimum 44×44pt on mobile — **the AAA AIM (WCAG 2.5.5), not the legal bar. The law binds at WCAG 2.2 AA's 24×24 (SC 2.5.8); the enforced house floor is 36px, above every legal requirement. Lineage, citations and re-review date in Pattern 2g.2 / DR-0315.**
## Religion AND Relationship in This Standard
**Religion-side:** Disciplined consistency. Every scripture component renders the same way. Every play button works the same way. Every progressive disclosure follows the same pattern.
**Relationship-side:** The user is met where they are — at their reading speed, in their primary translation, with the depth they want available but not forced. The product breathes with the user, not against them.
Both.
---
*See also:* `EXCELLENCE-STANDARD.md` (the principles these patterns enact), `SCRIPTURE-REFERENCE-STANDARD.md` (the translation citation pattern these UX patterns implement), `MIND-OF-CHRIST.md` (the foundation that the Test pattern serves), `THE-WAY.md` (the meta-frame).
