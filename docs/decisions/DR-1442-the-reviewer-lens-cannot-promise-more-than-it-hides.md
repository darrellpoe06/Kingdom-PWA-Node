# DR-1442: The reviewer lens cannot promise more than it hides

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** B (the words the steward reviews by, and two surfaces that read his rows under them)
**Type:** decision
**Area:** `app/src/lib/reviewer-lens.js` (`STRANGER_HIDES`, `strangerHidesList`), `lib/reviewer-mode.jsx` + `lib/admin-console.js` (both lens descriptions generated), `components/WorkOrderTriage.jsx`, `components/PaymentsLedgerPanel.jsx`, `components/BooksTaxes.jsx`, `scripts/reviewer-lens-registry-guard.mjs` (new)
**Sent in by:** Darrell, 2026-11-12, reviewing as a new user on his phone, looking at his own Poe Properties work-order board: "Does the lessons access work? I can see all this as a new person with no record?! They can see our businesses?!" — then, mid-answer: "I'm using it as a reviewer!!!!"
**Pairs with:** DR-1240 (the lens has two modes), DR-0104 (review the live production push), DR-0076 §3 (proven to catch), DR-0381 (never blank without saying why), DR-0060 (RLS is the real gate)

## Context
The stranger lens is the one instrument the steward has for "what am I exposing?". He pointed it at his own board and it answered wrongly.

## What was measured
- **Nothing was exposed.** `infra/supabase/tests/0260-door-work-orders-smoke.sql` asserts a stranger reads none of the work orders — case **"S and O2 read nothing of I"** — and runs as a required CI job. RLS was never the hole; under the lens he is still signed in as himself, so the rows were his own.
- **The promise and the code agreed with each other, and both under-described the app.** The banner read *"A person with no invite sees this: your own doors, vault, contacts and research are hidden."* Four nouns typed into the copy; four surfaces honouring the lens; and `reviewer-mode.test.js` asserted the same literal four. A stale promise passing its own test.
- **The headline is global, the list was partial, and they are one sentence.** Anything in the gap read through under a promise that it would not. Two things were: the **work-order board** (his doors' own work, mounted twice — Projects and LifeHub) and the **live payments ledger**.
- **The payments ledger was worse: it read under a notice saying it would not.** `BooksTaxes` is handed `demo = isAnyDemoMode || reviewerMode || isIsolatedPreview()`, honours it for its own archive, and renders a notice naming "tax returns and **payments**" — then mounted `PaymentsLedgerPanel` with no `demo`. The Money tab is ungated in `nav-items.jsx`, so Money → Taxes was reachable with real settled payments in sample mode, in the isolated preview and under both lenses.

## Impact
A lens that under-hides is worse than none: it teaches the steward to distrust the only instrument he has for the question, or to trust a wall that is not there. The sentence is now generated from what the code actually hides, so it cannot outrun it again.

## Decision
- **One registry, `STRANGER_HIDES`,** naming the rows and the file that hides each: doors, work orders, vault, contacts, research, payments. It is the single source of **both** lens descriptions — the pinned banner and the two Admin cards. The nouns are never typed.
- **Both surfaces now honour the lens,** each reading it at its own cloud boundary rather than from a mount — a per-mount flag is how the board was missed in the first place. Quiet means three things: it does not show, it does not even **ask**, and it **says** which quiet it is in.
- **It never blames the database.** Under the lens these are the steward's own rows withheld on purpose, which `reviewerLensLine` says. Claiming RLS refused them would be the same lie pointed the other way.
- **A gate holds the sentence equal to the code.** Wire a surface and it must be named; name rows and a surface must hide them; type a noun by hand and the build fails.

## Verification
- **`reviewer-lens-registry-guard.test.js`, 8 green** — each rule broken on a real copy of the tree and shown to fail. **It found a hole in the guard:** breaking the lens *call* while leaving the import changed nothing, because the check looked only for the name. A file that imports the lens and never asks it is "wired" in name only, so the guard now requires a call site.
- **`the-stranger-lens-reaches-the-work-orders.test.jsx`, 4 green; `payments-ledger-panel.test.jsx`, 8 green; `books-taxes-render.test.jsx`, 16 green.** Proven to catch: stop hiding, or hide while still fetching, or blame the database — each fails by name. Every quiet case carries an anti-vacuity twin.
- **One break caught nothing, and that was the finding.** Deleting `demo` from the `PaymentsLedgerPanel` mount — the original defect — passed every suite in this repo. The panel can be perfectly honest and still be handed nothing; the one prop between them was unpinned. It has its own two cases now.
- **An audit I ran was the wrong instrument and is not cited as evidence.** An import-walk counted 225 components as "blind to the lens", but it counts *imports something that touches the database*, which makes `AuthBanner` and a colouring sheet look like leaks. The registry replaces it: a closed list that a gate can actually hold.
