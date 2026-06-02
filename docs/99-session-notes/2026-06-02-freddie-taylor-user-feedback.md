# Freddie Taylor — Beta User Feedback (PoeTech PWA)

**Date / context:** 2026-06-02, ~10:23am text exchange (Darrell on Maui). Freddie beta-tested the PoeTech PWA the night before (2026-06-01) and sent a substantive feedback text.

**Status:** First-class external signal. Captured per `project-input-visibility-to-claude` + `project-institutional-memory-events`. Analysis + decision register below; no code shipped in this pass (copy reorder awaits Darrell's approval).

---

## Source

**Freddie Taylor** — Darrell's childhood friend. Beta tester of the PoeTech PWA, evaluating it for his own personal use. **NOT** in the Church of the Living God (COLG) "Loved Ones · Founding Family" cohort (the first-100 free-PoeTech+-for-life tier). A non-COLG warm-market friend — which raises a tier-eligibility judgment call for Darrell (see Open Questions).

This is a real user voice from outside the family. It is exactly the kind of generous, specific early-adopter feedback the platform was built to honor.

---

## Verbatim message (Freddie, 2026-06-02 ~10:23am)

> "I checked out the app last night, and it seems like it could be a really useful app. I'll send you a screenshot of the UI setups I liked the most. I also think I would prefer to use it on my laptop vs as an app on my phone, so I would recommend having a desktop version option. Overall it's a pretty cool app. I also noticed the $89/month subscription. That seems kinda high for any monthly subscription. I would recommend lowering the price to deliver the results if the ultimate goal is to build kings not slaves. Can I start using it to load my own data into it? I can then provide a more detailed assessment once I've had a chance to use it with my specific situation."

**Darrell's reply (9:34am, before the 10:23am screenshot timestamp on Freddie's side — time-zone offset, Maui):**

> "Understood. Put your feedback in the feedback link in the bottom left of the app. The app is also a desktop app and apple and works on your laptop too go to PoeTech.us"

**Pending from Freddie:** the UI-setup screenshots he said he'd send ("screenshot of the UI setups I liked the most"). Not yet received.

---

## Three substantive feedback items + analysis

### 1. Desktop preference ("I would prefer to use it on my laptop... recommend having a desktop version option")

**Finding: already supported.** PoeTech is a PWA. The manifest (`app/dist/manifest.webmanifest`) declares `"display": "standalone"`, `"name": "PoeTech Family OS"`, `"short_name": "PoeTech"` — meaning it runs in any desktop browser at **poetech.us** and is installable to the desktop/dock (Chrome/Edge "Install app", Safari "Add to Dock"). Darrell's reply confirmed this correctly: "The app is also a desktop app and apple and works on your laptop too go to PoeTech.us."

**The real gap: discoverability of install, not capability.** A repo search finds no *user-facing* "how to install PoeTech to your desktop" instruction. The docs that mention installation (`VACATION-BUDDY-LAPTOP-SETUP.md`, `SYNOLOGY-DEPLOY-PLAN.md`) are internal infra docs, not something Freddie would see. Freddie assumed phone-app-only because nothing on the surface told him otherwise.

- **GAP (low effort):** Add a one-line in-app hint near the header/About — e.g. "Works on any device. Install to your desktop: browser menu -> Install PoeTech (or Add to Dock on Mac)." Answers the *how* for the laptop-first user. Ties to `ANXIETY-CLARITY-PRINCIPLE` (answer the *how*, don't make the user guess).

### 2. "$89/month... seems kinda high... build kings not slaves"

**Finding: the philosophy is already aligned; the problem is pure discoverability.**

Freddie saw the **Family tier** — `app/src/poe-financial-mvp-v28.jsx:761` `TIER_LABEL['family'] = 'Family ($89/mo)'`. In the running app, that number reaches a new user through a gating surface, not through the entry point:

- `UpgradePrompt` (`poe-financial-mvp-v28.jsx:818`) renders in place of a gated tab (Projects, Practice, Real Estate editor, full Dev/Ops) and names the required tier as the price-to-unlock what the user just tapped.
- `TierSwitcher` (`poe-financial-mvp-v28.jsx:1178`, rendered in the header) shows tier labels including "Family ($89/mo)".

So Freddie, exploring a sample, tapped something gated and met **$89 as the headline price** — when the actual entry point is **Foundation, free forever** (`poe-financial-mvp-v28.jsx:759` `'foundation': 'Foundation (free)'`; default `userTier: 'foundation'` at line 165).

Critically, **PoeTech's stated pricing philosophy occupies the exact moral space Freddie invoked.** `app/src/components/DevOps.jsx:551`: "Fair pricing both ways. **Not slave wages. Not extortion.**" Lines 557, 560: "Foundation tier free forever... **No one is priced out of stewardship.**" Freddie's "build kings not slaves" is the same principle, independently arrived at. The platform agrees with him. He simply never saw the free door because $89 was the number the UI put in front of him.

- This is a **UX / copy discoverability bug on the pricing surface**, NOT a price-setting question. The price doesn't need to change; the *order of what a new user sees* does. Proposed reorder below.

### 3. "Can I start using it to load my own data into it?"

**Finding: NOT built yet. This is the most consequential gap.** Today a non-Poe-family user cannot load their own data. Two evidence points in `poe-financial-mvp-v28.jsx`:

- **"Drop your bank file" routes to a waitlist, not an upload** (lines 2541-2551). The comment is explicit: the real-data file read (OFX/QFX/CSV) is "in build," gated behind **workflows 33/34/35 (data-upload Layer 1 pipeline)** that have not yet deployed to n8n. Copy promises "real-data view ships late June."
- **"Start your own setup" was deliberately removed 2026-05-28** (lines 2553-2559). Reason in the comment: the real app behind that button would load `SEED_DATA` — Darrell's **real** entities, accounts, balances, addresses — because Multi-user **Layer B PIN auth** hasn't shipped. Until it does, `SEED_DATA` must never reach a viewer who hasn't established a saved profile (lines 1346-1349). So manual own-data entry is blocked too.

The only paths available to Freddie today: explore a demo persona sample (`/?demo=family-of-4`), or join the waitlist. **The honest answer to his question is: not yet — the load-your-own-data path ships when wf33/34/35 deploy (targeted late June 2026) for file import, and manual entry unlocks when Multi-user Layer B PIN auth ships.** Darrell's "go to PoeTech.us" gets Freddie onto desktop, but he will hit the waitlist wall the moment he tries to load his own numbers. Freddie should be told this directly so his "more detailed assessment once I've loaded my data" expectation is set honestly.

- **GAP (Phase-2 spec):** see "Data-import onboarding gap" section below.

---

## Pricing discoverability — proposed copy reorder (NOT yet shipped)

Target surface: `app/src/components/About.jsx`, "What you actually get" -> "Tiers" section (lines ~103-122), plus the gating prompts that put $89 in front of new users.

**Current state.** The About grid already renders **Foundation first with `highlight`** (line 111) — good. But three things bury the free entry point in practice:

1. The Tiers intro paragraph (lines 104-105) **leads with the paid framing**: "Paid tiers reflect the real value being delivered... priced like the premium platform it is, not like a hobby app." The "free for every family" sentence opens it, but the paragraph's *weight* lands on premium pricing.
2. In the 8-card grid, the **four paid cards ($39/$89/$149/$249) sit between Foundation and the three FREE community cards** (Loved Ones, Community, Community Partners are cards 6-8, below the fold on a laptop). "Free PoeTech+ for life" is the last thing a scroller reaches, not the first.
3. The **gating UI** (`UpgradePrompt`, `TierSwitcher`) surfaces $89 to a new user *before* they have ever seen the About page. This is where Freddie met the number.

**Proposed reorder (copy only, for Darrell's approval):**

- **A. Lead the Tiers intro with the free door, not the premium frame.** Reorder lines 104-105 so the first sentence is the promise: "The Financial Control System is **free for every family, forever** — no card, no trial clock. Paid tiers add the ecosystem layer (tenant/contractor/client portals, multi-entity, Projects) for those who need it; each replaces several SaaS subscriptions." Move the "priced like the premium platform" line to the *end* of the paragraph, reframed as justification for the paid tiers rather than the headline.

- **B. Add a one-line free-first banner above the grid.** A small band before line 107: "Two ways in are always free: **Foundation** (every family) and **Loved Ones** (warm-market founding families). The paid tiers below are options, not the gate." Makes "free is the default, paid is a choice" legible at a glance.

- **C. Visually group the free tiers together and surface Loved Ones higher.** Either move the three FREE cards (Foundation, Loved Ones, Community/Community-Partner) into a "Free access" cluster *above* the paid cluster, or add a "FREE" ribbon to all four free-or-free-for-cohort cards so a scanner sees free options without reading every card. Keeps the $89 Family card present as **one option among several**, not the headline.

- **D. Soften the gating prompts (`UpgradePrompt`, line 818).** When a new user on Foundation taps a gated tab, the prompt currently leads with the required paid tier. Add a first line that affirms the free baseline: "You're on **Foundation — free forever**, and most of the daily what-to-do-today work lives right here. {ViewLabel} is a paid add-on ({tier}) for households that need it." This way the *first* impression of pricing is "you already have a lot, free," not "$89 to continue."

**Principle check.** This reorder makes the surface tell the truth it already believes (`DevOps.jsx`: "Not slave wages. Not extortion."; About line 121: "Foundation is free forever"). It is brand/UX work, not data sanitization — nothing is stripped or changed in substance, only re-ordered for honest first-impression (`feedback-distinguish-data-from-brand` honored).

---

## Data-import onboarding gap — Phase-2 spec line

**Gap:** No first-run flow lets a non-Poe-family user clear the sample and load their own data. File import is waitlisted (wf33/34/35, ~late June 2026); manual entry is blocked until Multi-user Layer B PIN auth ships (SEED_DATA leak risk).

**Smallest possible "load my own data" flow for Freddie** (answers what/when/why/how at the empty state per `ANXIETY-CLARITY-PRINCIPLE`):

1. **Empty-state wizard (manual entry), gated behind a saved local profile.** The unblock that does NOT require the n8n upload pipeline: when a brand-new user chooses "Start fresh," create an **empty local profile** (no `SEED_DATA`, no demo data) and walk them through the minimum viable setup:
   - *What:* "Let's set up your money picture." One entity (their household), a few accounts (name + balance), their top debts.
   - *When:* "5 minutes now; you can add more anytime."
   - *Why:* "Everything stays on this device. Nothing uploads. This is what makes today's next-action accurate for you."
   - *How:* 3-4 short steps with a skip on each; lands them on the Big Picture dashboard running on *their* numbers.
   - This is safe ONLY once it starts from a blank profile (never `SEED_DATA`). The blank-profile primitive is the prerequisite — it is the same gate Layer B PIN auth was protecting.
2. **CSV / OFX / QFX upload (Layer 1 pipeline)** — already speced, waitlisted behind wf33/34/35. Honest copy already holds the promise on the landing ("real-data view ships late June"). No new spec needed; just deploy.
3. **Recommendation:** ship (1) the manual empty-state wizard first as the unblock for friends like Freddie, since it has no n8n dependency — only the blank-local-profile primitive. (2) follows when the upload workflows deploy.

**Until then:** tell Freddie plainly that loading his own data is days away (file upload) / pending a setup wizard (manual), so his "detailed assessment with my specific situation" lands on real capability, not the waitlist wall.

---

## Decision register (what we're doing + why)

| # | Decision | Why |
|---|----------|-----|
| 1 | Capture Freddie's feedback as a first-class session note + memory; do NOT lose it in a text thread. | External warm-market voice is first-class signal (`project-input-visibility-to-claude`, `feedback-decisions-with-rationale`). He gave generous, specific time. |
| 2 | Treat $89 as a **discoverability bug**, not a pricing change. Draft a copy reorder (free-first), hold for Darrell's approval before shipping. | The philosophy ("Not slave wages. Not extortion." / Foundation free forever) already matches Freddie's "kings not slaves." The price is right; the *first impression* is wrong. Copy changes to a public surface get Darrell's sign-off. |
| 3 | File the **load-your-own-data** gap as the highest-value next build; recommend the manual empty-state wizard (no n8n dependency) as the fast unblock. | Freddie explicitly wants to load his data, and today he literally can't. This is the difference between "cool demo" and "I use this." `ANXIETY-CLARITY-PRINCIPLE` at the empty state. |
| 4 | Add a small in-app "install to desktop" hint. Darrell already answered Freddie correctly; close the discoverability gap so the next user doesn't have to ask. | Capability exists (PWA standalone). Only the *how* is missing on the surface. Low effort, answers Freddie's stated laptop-first preference. |

---

## Open question for Darrell (true judgment call)

**Do we extend the "Loved Ones · Founding Family" free-PoeTech+-for-life tier beyond the first-100 COLG cohort to non-COLG warm-market friends like Freddie?**

Freddie is a childhood friend giving real beta feedback, but he is not part of the Church of the Living God founding cohort that the Loved Ones tier is currently scoped to (`About.jsx:116`: "First 100 families through Church of the Living God or by direct invitation"). The card already includes **"or by direct invitation"** — so honoring Freddie may be *within* the existing language, at Darrell's discretion, rather than a tier redefinition.

`COMMUNITY-FIRST-MISSION.md` names COLG as the **first** community, not the only one — the mission generalizes to communities the mainstream overlooked. A childhood friend who beta-tests is arguably exactly the "warm-market relationships that make PoeTech viable" the Loved Ones rationale honors (`About.jsx:121`). But the first-100 slot scarcity ("tier closes when filled") is a deliberate constraint, and extending it ad hoc could erode it.

This is Darrell's call (relational + strategic, not derivable from the repo): (a) invite Freddie under the existing "by direct invitation" clause, (b) keep Loved Ones strictly COLG and give Freddie Foundation-free + a personal thank-you, or (c) define a separate "Founding Friends" lane. Not actioned pending his decision.

---

## Phil 4:8 Test + Religion AND Relationship check (run before commit)

- **True:** Every claim is anchored to a file/line or the manifest; the "not built yet" findings are quoted from the code comments. No fabrication.
- **Honorable / Just / Pure:** Freddie's words are quoted in full and taken at face value; the analysis credits his instinct rather than defending the price.
- **Lovely / Commendable:** The tone honors that a friend gave generous time; the open question protects the relationship by leaving the warm-market call to Darrell.
- **Excellent / Praiseworthy:** Named gaps, no hand-waving; the honest "tell Freddie it's not built yet" recommendation chooses truth over polish.
- **Religion (backbone):** honest analysis, named gaps, file-cited. **Relationship (warmth):** Freddie is a friend; the recommendations set his expectations honestly so his next assessment lands on real capability.
