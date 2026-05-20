# Task card — Fix white-screen on non-free tier selection

**Date:** 2026-05-18 · **Issued by:** Cowork → Claude Code · **Status:** open

---

**Foundation rules that apply:**
- `/docs/00-foundations/_root/SITUATIONAL-PEACE.md` — broken UI is the opposite of peace
- `/docs/00-foundations/_root/EXCELLENCE-STANDARD.md` — religion (the code must work) AND relationship (the user must trust it)
- `/docs/00-foundations/_root/IN-PLACE-FIRST.md` — when fixed, ensure the cart/preview still respects same-page UX (no jump-to-top)

---

**What to do:**

There's a runtime white-screen bug. When the user selects any pricing tier other than the free (Foundation) tier in the About tab — either by clicking the tier's "Subscribe →" button to open the cart drawer, OR by changing tier in the header TierSwitcher dropdown — the app goes to a blank white screen. Reproduce, identify the root cause via the browser console, fix it, verify the fix works for every tier (Foundation, PoeTech+, Family, Premium, Business, Loved Ones, Community, Community Partners).

---

**Reproduction steps for Claude Code to confirm:**

1. `cd C:\Users\dpoe\Kingdom-PWA-Node\app && npm run dev` (or build + serve preview-r39)
2. Open the resulting URL in Chrome with DevTools console open
3. Click the About tab
4. Click "Subscribe →" on a paid tier (e.g., PoeTech+ $39)
5. Observe: white screen + console error
6. Capture the console error message + stack trace
7. Separately: from the header TierSwitcher dropdown, change the previewed tier from Foundation to PoeTech+
8. Observe whether that path also white-screens
9. Document which path triggers and the exact error

---

**Files involved (start here, expand as the diagnosis requires):**

- `app/src/components/About.jsx` — contains the cart drawer logic + PricingTier render
- `app/src/components/shared.jsx` — contains `PricingTier` component (line ~19); onChoose handler at line ~52
- `app/src/poe-financial-mvp-v28.jsx` — contains `TierSwitcher` (line ~787), `setUserTier` (line ~1102), the entire view-render switch keyed off `data.userTier`
- Any tier-gated component that might fail on non-Foundation render: `Markets`, `Projects`, `Practice`, `Rentals` (via `tierMeets()` check)

---

**Hypothesis to verify first (Cowork's best guess; may be wrong):**

The bug is *probably* in the cart-drawer render path (when `cartTier.monthly !== '0'` triggers the billing-toggle branch at About.jsx line ~479). Parse is clean, helpers are defined, prop wiring looks correct — so the failure is likely a missing field on the tier object passed via `onChoose`, or a downstream component that breaks when re-rendered for a higher tier. Claude Code should NOT assume this is correct; verify via console error first.

Alternative possibility: the issue is in the header-side TierSwitcher path (`setUserTier(t)` → state change → re-render of a component that doesn't handle the new tier gracefully). Some component might assume `data.userTier === 'foundation'` and crash otherwise.

---

**Success criteria:**

- Clicking ANY tier's "Subscribe →" or "Claim it →" button opens the cart drawer cleanly with no white screen and no console errors.
- Changing tier in the header TierSwitcher dropdown from Foundation to any other tier re-renders the app cleanly with no white screen and no console errors.
- All other functionality remains unchanged (no regressions on Books, Real Estate, Projects, Practice, Big Picture).
- Build passes: `cd app && npx vite build`.
- Tier features still display correctly per-tier in the pricing grid.

---

**Verification commands:**

1. `cd app && npx vite build --base ./ --outDir preview-rNN` — must complete without errors
2. `cd app/preview-rNN && npx serve -p 4197` then open http://localhost:4197 in Incognito
3. In About tab, click each of the 8 tiers' main button. None should white-screen.
4. In header, cycle the TierSwitcher through every tier option. None should white-screen.
5. After fix: `git diff --stat` — confirm the scope is minimal (likely 1-3 files, < 50 lines changed)

---

**Out of scope (do NOT touch in this task):**

- Don't rewrite the cart drawer styling or copy.
- Don't change tier pricing or feature lists.
- Don't refactor PricingTier or TierSwitcher beyond what's needed to fix the bug.
- Don't add new features; this is a bug fix only.

---

**When done, report back:**

1. Final `git diff --stat`
2. Build output, last 5 lines
3. The original error from console (so we can update CLAUDE.md / foundation docs if the pattern is worth preventing)
4. One-line description of root cause
5. Any deviation from this spec + why

---

**Notes from Cowork:**

- Recent context: heavy refactor moved 13 components out of the monolith (Markets, Debts, Inbound, Rentals, Projects, DevOps, Practice, Cart, BooksEntities, Contractors1099, Legal, About, shared). The bug may be in one of those extractions if a prop was dropped during the move.
- If the root cause is a missing prop on a tier-gated child component, the right fix is to thread the prop, not to silence the error.
- After fix, please update `/docs/00-foundations/KPIS.md` if a new metric should be tracked, or `/docs/00-foundations/GLOSSARY.md` if a new term emerged. Neither is mandatory.
