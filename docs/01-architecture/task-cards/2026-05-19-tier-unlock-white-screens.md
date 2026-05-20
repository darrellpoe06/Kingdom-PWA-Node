# Task card — Fix white-screens on tab navigation after tier unlock

**Date:** 2026-05-19 · **Issued by:** Cowork → Claude Code · **Status:** open

---

**Foundation rules that apply:**

- `/docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` — extraction must not drop in-scope references
- `/docs/00-foundations/_root/SITUATIONAL-PEACE.md` — broken navigation = stress, the opposite of the system's purpose
- `/docs/00-foundations/_root/EXCELLENCE-STANDARD.md` — religion (code works) AND relationship (user trust)

---

**What's broken (founder report, 2026-05-19):**

Navigation across the top tabs (Big Picture, Books, Inbound, Debts, Real Estate, Projects, Practice, Dev/Ops, Markets, Church, About) goes to a white screen for tabs **unlocked at the user's current tier** when those tabs were touched by the recent extraction work (r33–r38). Specifically:

- **Foundation tier (free):** Big Picture → Books → Inbound → Debts → Real Estate (preview) → Projects (upgrade prompt) → Practice (upgrade prompt) → Dev/Ops = **WHITE SCREEN**. Markets / Church / About work afterwards (or maybe also break — verify).
- **PoeTech+ tier ($39):** Big Picture → Books → Inbound → Debts work. **Real Estate = WHITE SCREEN** (this is a tier-unlocked feature at $39 — full editor instead of preview).

Pattern strongly suggests a **`ReferenceError` or `TypeError`** thrown when the component for an unlocked tab first mounts. Causes the React tree to unmount to a blank page.

---

**Reproduction:**

1. `cd C:\Users\dpoe\Kingdom-PWA-Node\app && npm run dev`
2. Open URL in Chrome with **DevTools console open** before clicking anything
3. Set tier preview to Foundation. Click tabs left → right. Note which tab triggers the white screen + the EXACT console error (it will be a `ReferenceError: X is not defined` or `TypeError: Y is not a function` or similar — copy the message + stack trace).
4. Set tier preview to PoeTech+. Repeat — Real Estate is the suspected trigger.
5. Set tier preview to Family. Test all tabs.
6. Set tier preview to Premium. Test all tabs (Practice should unlock here).
7. Set tier preview to Business. Test all tabs.
8. Document the full set of errors with the tier × tab matrix.

---

**Hypothesis (Cowork's best guess; verify, don't assume):**

The recent extraction work moved 13 components out of the monolith. Each extraction either (a) deleted a constant/function from the monolith that the call site still references, OR (b) the extracted component expects a prop the call site doesn't pass, OR (c) the extracted component imports something from the wrong path.

Highest-suspicion files:
- `app/src/components/DevOps.jsx` — fresh extraction; I patched it to receive `OPPORTUNITY_LIBRARY`, `matchOpportunities`, `capacityDecisionForNewProject`, `TIER_LABEL` as props. Verify all are still in scope at the call site in the monolith AND that the import line wires them in correctly.
- `app/src/components/Rentals.jsx` — has its own local `projectRentalSnowball` duplicate but also receives `rentalSnowball` as a prop from the monolith. Verify the call site still computes and passes that prop.
- `app/src/components/Projects.jsx` — `ProjectsWrapper` and `Projects` both moved. `PROJECT_DOMAINS` and `PROJECT_STATUSES` were moved into Projects.jsx; verify nothing in the monolith still references those.
- `app/src/components/Practice.jsx` — Just patched for the statusHistory bug. Verify the patch landed cleanly and InquiryRow renders without further errors when an inquiry has multi-entry statusHistory.

---

**Success criteria:**

- Set tier preview to **EVERY** tier (Foundation, PoeTech+, Family, Premium, Business, Loved Ones, Community, Community Partners) and click **EVERY** top-nav tab. No white screens. No console errors.
- Books sub-tabs (Entities, Accounts, Tx, Cart, 1099s, Calendar, Legal) all work on Family+ tier.
- Build passes: `npx vite build`
- No regressions to existing inline-edit / RentCast / cart drawer behavior.

---

**Verification commands:**

1. `npx vite build` — must pass clean
2. `npm run dev` then walk the tier × tab matrix in Incognito with DevTools open
3. `git diff --stat` — fix should be small (likely 1-5 files, 5-50 lines)

---

**Out of scope (do NOT touch in this task):**

- Don't change tier definitions or VIEW_TIER_REQUIREMENTS.
- Don't redesign UpgradePrompt or any component's UI.
- Don't re-extract or re-modularize anything new.
- Don't update foundation docs unless a new binding rule emerged from the bug.
- This is bug fix only.

---

**When done, report back:**

1. Final `git diff --stat`
2. Build output (last 5 lines)
3. The console error(s) caught for each affected tier × tab combination
4. One-line root cause per file fixed
5. The fixed tier × tab matrix (now all green)
6. Any deviation from the spec + why

---

**Notes from Cowork:**

The "all-green tier × tab matrix" is the most important deliverable. If something stays broken because it's blocked on a foundation-level decision (e.g., "this component genuinely needs cloud auth"), flag it explicitly with the workaround you propose — don't leave it ambiguous.

If during diagnosis you find that one extracted component is fundamentally broken vs. just missing a prop, prefer fixing the prop over re-extracting. We want the modular structure to hold; we want the props to be honest about what each component needs.

If the fix touches the monolith (poe-financial-mvp-v28.jsx), keep edits surgical. The file is currently 5,815 lines; the truncation discipline in `MODULAR-EXTENSIBILITY.md` still applies in spirit even from Claude Code (which doesn't have the truncation problem) — small, scoped, traceable diffs.
