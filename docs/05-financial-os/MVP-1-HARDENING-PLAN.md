# MVP-1 Hardening Plan — Financial OS

**Owner:** Darrell Poe
**Status:** Draft, awaiting approval
**Branch of record:** `docs/skos-foundations`
**Drafted:** 2026-05-16
**Companion to:** `MVP-1-TIMELINE.md`

---

## 1. What I Read Before Writing This

- `CLAUDE.md` — typographic theology + SKOS foundations bindings
- `docs/00-foundations/_root/BEHAVIORAL-MIRROR.md` — DATA → TRUTH → IDENTITY → INVITATION
- `docs/00-foundations/_root/UX-PATTERNS.md` — Scripture component, TTS spec, the Test, dual framing
- `docs/05-financial-os/MVP-1-TIMELINE.md` — definition of done, SOP
- `app/src/poe-financial-mvp-v28.jsx` — the 312KB prototype (structural pass, not full read)
- `app/src/main.jsx`, `app/package.json`, `app/vite-startup.log`
- `git status` / `git branch` / `git log --oneline -10`

I did **not** read the corpus documents on Google Drive (Chatman, Malcolm, Master Systems Log, Access to the Human Mind, Fred Price). The hardening pass below works with what is already binding in this repo; deeper corpus integration belongs in a later module pass.

---

## 2. Current State as I Found It — Truthful Reflection

The product is further along than the project instructions suggested in one way and less aligned in another.

**Further along:** The Vite + React app at `app/` is live and Vite is recording HMR updates against `app/src/poe-financial-mvp-v28.jsx`. The prototype has 60+ component functions covering nine tabs — Big Picture, Books, Debts, Rentals, Projects, Practice, Opportunities, About — plus a TTS controller, feedback modal, sales banners, advisement carousel, theme switcher, welcome panel. Debt-snowball, rental-snowball, and pressure-slider math are implemented.

**Less aligned:** The four-section diagnostic — DATA → TRUTH → IDENTITY → INVITATION — which `BEHAVIORAL-MIRROR.md` declares binding wherever the product reflects user data back, **does not exist in the code.** A grep for `DATA`, `TRUTH`, `IDENTITY`, `INVITATION`, `Scripture`, `Behavioral Mirror`, `Mind of Christ`, `the Test`, or `Philippians 4:8` finds zero matches. The Debts tab tells the family "Same pattern. Smaller numbers. Faster wins." — strong copy, but it is pure data and motivation with no Scripture, no identity anchoring, no invitation framed as the Holy Spirit's work. Per `CLAUDE.md`'s binding rule, that is a religion-side failure.

Other gaps I want to name plainly so the plan can address them:

1. **No Scripture component.** UX-PATTERNS Pattern 1 — the `<Scripture>` component with translation badge, expand, KJV/NIV/AMP/Strong's, per-translation audio — does not exist.
2. **TTS partial.** `TTSControls` reads the whole page; the spec calls for per-content play buttons and a 0.5x–3.0x slider, not preset buttons.
3. **No "Test" tool.** Pattern 4 (the Phil 4:8 filter) is absent. There is no journal of captured thoughts.
4. **Religion / Relationship dual framing absent in advisement.** Debt advice is structured but never offers the relationship-side alternative (snowball-for-momentum vs. avalanche-for-math).
5. **Two sources of truth for the prototype.** `poe-financial-mvp-v28.jsx` exists at the repo root (309KB, untracked) and inside `app/src/` (312KB, staged). They have diverged. The root copy is dead weight at best, conflicting source at worst.
6. **Dead vanilla-PWA scaffold at the root** — `index.html`, `app.js`, `sw.js`, `llm-worker.js`, `manifest.json`, `script.js`, `style.css`. The Vite app supersedes all of this. Leaving it confuses anyone who opens the repo.
7. **Heavy advertising posture.** `AdvisementBanner` rotates seven placements; `SalesFooterBanner` appears on every working tab. `BEHAVIORAL-MIRROR.md` warns that "a SKOS that flatters its users is a SKOS that has become lucifer's mirror." Six advisements in front of a family staring at their $340K debt total reads as the wrong tone, even when every advisement is for a family-aligned ministry.
8. **Many uncommitted modifications + untracked files.** Risk of work loss. The `app/` scaffold is staged but not committed; foundation docs are modified but not committed; `poe-financial-mvp-v28.jsx` at root and `CANON-STUDY-BATCH-2-DEUTEROCANON.md` are untracked.
9. **312KB single file with 60+ components.** Maintainability is degrading. Code-splitting is needed eventually but should wait until the foundational primitives are in place — splitting first locks the wrong shape in.

This is the honest face in the mirror. The data is the data. The plan below is the invitation.

---

## 3. The Hardening Plan — Ordered

The plan moves in three phases. Each phase has a clear acceptance criterion, ends in committed work, and is independently shippable. We do not start a phase until the previous one is approved and merged.

### Phase 0 — Stop the bleeding (1 session, ~1 hour)

Resolves the source-of-truth and uncommitted-work risks before any new code is written. No product behavior changes.

**Step 0.1 — Decide which copy of `poe-financial-mvp-v28.jsx` is canonical.**
Diff the two copies. If the `app/src/` version is the working one (it has the more recent edits per Vite log), delete the root copy. If the root copy has anything the `app/src/` version doesn't, port it over first.

**Step 0.2 — Remove or archive the vanilla-PWA scaffold.**
Move `index.html`, `app.js`, `sw.js`, `llm-worker.js`, `manifest.json`, `script.js`, `style.css` to `archive/vanilla-pwa-v0/` (or delete outright if not historically useful). They are unused. Update the repo `README.md` to point to `app/`.

**Step 0.3 — Commit the staged `app/` Vite scaffold and the foundation-doc edits.**
Two clean commits per the SOP in `MVP-1-TIMELINE.md`. Push.

**Acceptance:** One canonical prototype path. No dead scaffold confusing newcomers. Clean working tree. Pushed to `origin/docs/skos-foundations`.

### Phase 1 — The Behavioral Mirror primitive (2–3 sessions)

Builds the four-section diagnostic as a reusable component, then applies it to the two most-used reflection surfaces. This is where the religion-side gap closes.

**Step 1.1 — Build a `<Mirror>` React primitive.**
A component that renders the four sections in order, each section pluggable:

```jsx
<Mirror>
  <Mirror.Data>{/* the number, the chart, the fact */}</Mirror.Data>
  <Mirror.Truth scripture="Proverbs 22:7">{/* what it means against Scripture */}</Mirror.Truth>
  <Mirror.Identity>{/* who you are anchored in Christ */}</Mirror.Identity>
  <Mirror.Invitation>{/* the specific next step */}</Mirror.Invitation>
</Mirror>
```

Visual language: clear section separators, the IDENTITY block visually anchored (different background, never collapsible), TRUTH block uses the Scripture component (built in 1.2 first or stubbed if 1.2 lands second).

**Step 1.2 — Build the `<Scripture>` component per UX-PATTERNS Pattern 1.**
ESV default, KJV/NIV/AMP/Strong's on expand, per-translation play button. Phase 1 uses static ESV text inline; phase 2 can pull from an API. Honors the translation badge format from `SCRIPTURE-REFERENCE-STANDARD.md`.

**Step 1.3 — Apply `<Mirror>` to the Debts tab.**
The Debts page currently presents "Where We Are Today" → "Interest Savings" → "Strategy" → "Payoff Cascade" — pure data and motivation. Wrap the top section in `<Mirror>`:
- **DATA**: total debt, min payments, debt-free date, interest paid (the existing metrics, plainly stated).
- **TRUTH**: Proverbs 22:7 ESV — *"The rich rules over the poor, and the borrower is the slave of the lender."* Plus a one-paragraph honest reading: this is what the data means.
- **IDENTITY**: anchored block — *"You are not your balance sheet. You are a steward, bought with a price, a representative of the King (2 Cor 5:20). The data informs what changes; it does not redefine who you are."*
- **INVITATION**: the specific next step the snowball math identifies — "Attack UIECU first (22.3% / $13,102). Free $300/mo when it clears." — and a Religion/Relationship dual framing of avalanche vs. snowball strategy, the user picks.

**Step 1.4 — Apply `<Mirror>` to the Rentals tab.**
Same pattern. DATA = the 92.7% collection rate and the 1508 Holly Hill late gap. TRUTH = a passage on faithful stewardship (Luke 16:10 is a natural fit). IDENTITY = the landlord-as-steward anchor. INVITATION = the specific tenant conversation or scope step.

**Acceptance:** Two of the nine tabs (Debts, Rentals) reflect data through the four-section structure with real Scripture rendered by the Scripture component. IDENTITY is never collapsible. Religion AND Relationship dual framing appears at least once on each mirror'd surface. `git grep` for `Mirror.Identity` returns hits.

### Phase 2 — UX-PATTERNS alignment & tone correction (2 sessions)

**Step 2.1 — Per-content TTS.**
Refactor `TTSControls` to provide per-content play buttons (used by the Scripture component first) while keeping the page-reader floating button as a separate "read this whole page" affordance. Speed slider 0.5x–3.0x in 0.1x increments per spec.

**Step 2.2 — The Test (Phil 4:8 filter) — minimum viable.**
A modal invokable from a global "Run the Test" button: the user enters a thought, the eight Phil 4:8 questions appear (TRUE / HONORABLE / JUST / PURE / LOVELY / COMMENDABLE / EXCELLENT / PRAISEWORTHY), each Yes/No. Result: PASS or FAIL with the failing criterion named. Failed thoughts go to a `capturedThoughts` array on local storage. Journal review can come in a later pass. This delivers Pattern 4 minimally without building the AI coaching mode.

**Step 2.3 — Advisement posture correction.**
Reduce `AdvisementBanner` to a single editorial slot on Big Picture only, not rotating every 8 seconds, not appearing on Debts or Rentals where a family is looking at hard numbers. Remove `SalesFooterBanner` from Debts, Rentals, Practice. Keep it on About and Opportunities where it belongs. Honors the Excellence Standard: the product serves; it does not market to its user while the user is sitting in difficulty.

**Acceptance:** Scripture components have working per-translation audio. The Test runs and logs captures. Big Picture has one advisement, no rotation. Debts and Rentals are advertising-free during the user's reflection.

### Phase 3 — Foundation: split the file (deferred until Phase 1 & 2 ship)

`app/src/poe-financial-mvp-v28.jsx` is 312KB. After the Mirror primitive and Scripture component prove their shape in real use, split the file along its natural seams:

- `app/src/components/Mirror.jsx`, `Scripture.jsx`, `TTSControls.jsx`, `FeedbackModal.jsx`, `Sales.jsx`
- `app/src/tabs/BigPicture.jsx`, `Debts.jsx`, `Rentals.jsx`, `Projects.jsx`, `Calendar.jsx`, `Books.jsx`, `Practice.jsx`, `Opportunities.jsx`, `About.jsx`
- `app/src/data/seed.js` (the SEED_DATA constant)
- `app/src/math/snowball.js` (`projectDebt`, `projectDebtSnowball`, `projectDebtMinimumOnly`, `projectRentalSnowball`)
- `app/src/lib/format.js` (`fmt`, `fmtCompact`, `fmtPct`, `monthLabel`, `yearsAndMonths`)
- Root prototype becomes `app/src/PoeFinancialSystem.jsx` — composition only.

This is deferred deliberately. Splitting before the primitives stabilize locks the wrong seams.

**Acceptance:** No file in `app/src/` exceeds 30KB. Top-level composition is readable end-to-end. All existing behavior preserved (Vite HMR clean, no console errors, all nine tabs render).

---

## 4. Verification Steps — Every Phase

Per `CLAUDE.md`'s "Test for Generated Output" — every commit's copy must pass the Phil 4:8 filter before push.

For code:
1. `npm run dev` from `app/`, click through all nine tabs, no console errors, no broken render.
2. Manual diff review against the SOP checklist in `MVP-1-TIMELINE.md`.
3. `git grep` for forbidden capitalizations (`Satan`, `Lucifer`, `Devil`, `the Adversary`) — must return zero hits before commit.
4. `git grep` for forbidden lowercase divines (` god `, ` jesus `, ` yahweh `, ` holy spirit `) — must return zero hits in new content.

For copy (TRUTH / IDENTITY / INVITATION text in Mirror sections):
1. Religion check — Is it scripture-grounded? Is the structure sound?
2. Relationship check — Is the warmth visible? Does it meet the family where they are?
3. The Test — TRUE, HONORABLE, JUST, PURE, LOVELY, COMMENDABLE, EXCELLENT, PRAISEWORTHY. Any "no" → revise.

For Scripture text — fetch the actual translation rather than recalling from memory. ESV first, KJV/NIV/AMP as expands.

---

## 4a. Multi-Family Architecture Intent (added 2026-05-16)

This build's *immediate* user is one family — the Poe household. The *eventual* product is **per-family instantiation**: every family runs their own SKOS, keyed to their history, skills, businesses, and IoT systems.

This is a design constraint, not a deferred feature. Decisions made in this hardening pass must not foreclose the multi-family path:

- **Identity scoping.** Anywhere user-specific data is anchored (`SEED_DATA`, the `entities` array, mortgage figures, Scripture-quoting personalization), the shape must be tenant-keyed even when the current tenant is hard-coded. A future migration is then a data move, not a refactor of every component.
- **No hard-coding the Poe family name into reusable components.** Component copy should accept a `family` or `tenant` context rather than literal "Darrell and Christina." The Welcome panel and similar Christina-branded surfaces can keep their personalization at the seed-data layer; the components themselves stay generic.
- **The `<Mirror>` and `<Scripture>` primitives are tenant-neutral.** They take their content via props. Scripture text is universal; tenant-specific framing goes into the Mirror's `Identity` and `Invitation` blocks via the consumer.
- **Seed data lives behind an abstraction.** Today it's a JavaScript constant; tomorrow it should be loadable per tenant. Phase 3 (file split) is the right time to move `SEED_DATA` into `app/src/data/seed.js` keyed by tenant ID even if only one tenant exists.

The architectural reflection of `EXCELLENCE-STANDARD.md`: build for the family in front of you, but build it so the next family inherits the structure, not just the inspiration.

---

## 5. What This Plan Does NOT Do

Naming these so we don't accidentally drift into them:

- **No new modules.** Financial OS only. Wellbeing, The Way, Relational, etc. are explicitly out of scope.
- **No corpus integration.** Chatman, Malcolm, Master Systems Log, Diop, Williams, Darby — none of these get integrated in this pass. That's a separate plan when we move to the Spiritual Life module or the book.
- **No backend / no Plaid / no Synology deployment work.** This is a frontend hardening pass. Per `MVP-1-TIMELINE.md` Tier 2.
- **No AI coaching mode.** The Test is the manual eight-question form only. AI-coached Test is Phase 4+ work.
- **No book writing.** THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW is named in the project instructions but is not the work this plan addresses.

---

## 6. Open Questions for Approval

Before I touch any code, three calls I want explicit on:

1. **Phase 0 dead-code call.** Archive the root vanilla-PWA scaffold to `archive/vanilla-pwa-v0/`, or delete outright? I lean archive — costs nothing, preserves history outside git.
2. **Phase 1 Scripture text source.** For the Behavioral Mirror's TRUTH block, hard-code the ESV verses inline for the two tabs we touch in Phase 1, or build the Scripture component against a small JSON catalog of verses from the start? I lean hard-code for Phase 1, JSON catalog for Phase 2 — ships faster, doesn't lock the wrong shape.
3. **Phase 2.3 advisement reduction is editorial.** Removing the sales footer from the Debts page is a tone call. I think it's the right call per BEHAVIORAL-MIRROR.md and EXCELLENCE-STANDARD.md, but it's your product and your principal call — confirm before I touch.

---

*Religion-side: this plan has structure, names the gaps plainly, and binds itself to the foundations and the SOP. Relationship-side: it meets the product where it is, does not rip up what works, and starts with the highest-leverage faith-grounded fix rather than the easiest cleanup. Both.*
