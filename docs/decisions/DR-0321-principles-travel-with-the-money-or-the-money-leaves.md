# DR-0321 — Principles travel with the money, or the money leaves

- **Status:** accepted
- **Tier:** B — a new free course in an existing catalog, a new system mounted inside an existing tab (zero shell lines), and one new table that auto-applies on merge (DR-0084). No front-door change, no money moves, no new identity claim.
- **Scope:** `app/src/lib/legacy-provisions-course.js`, `lib/family-trust.js`, `lib/family-trust-store.js`, `lib/family-trust-sync.js`, `lib/learn-catalog.js` (registration), `lib/table-sync.js` (unhandled-rejection hardening), `components/LegacyProvisions.jsx`, `components/FamilyPlan.jsx` (mount), migration `0167` (`family_trust_records`), tests `legacy-provisions-course.test.js`, `family-trust.test.js`, `legacy-provisions-render.test.jsx`
- **Date:** 2026-09-02
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), SPOKEN-TEACHINGS-ARE-BUILD-INPUT, COMMUNITY-FIRST-MISSION, WORD-FIRST (DR-0127 / DR-0282)

## Directive

Darrell, 2026-09-02, speaking the three provisions he wrote into the family trust:

> *"Number one, we reference our family constitution... because if you pass down
> money without passing down principles, there's a good chance the wealth
> disappears by the second or even third generation."*

> *"Number two is a spendthrift provision... a lot of families think the biggest
> threat to generational wealth is taxes. Sometimes it's not. Sometimes it's
> lawsuits, creditors, bad business decisions, divorce, or even the wrong
> marriage... because the assets remain owned by the trust, not them
> individually."*

> *"And number three, forced income production baked into the trust... our
> beneficiaries don't just take distributions, they also learn how to produce,
> build, invest, and contribute value back into it."*

And the build order:

> *"lesson.. and business system built into PoeTech App right now... integrate
> this process into the system and prepopulate it for our family to use within
> the system and also educate our children and users will be able to educate
> theirs using our platform."*

## What arrived, and what we did with it

The teaching arrived attached to a funnel — a countdown timer over a "free LIVE
masterclass," a seat that costs an email address, an upsell waiting at the end.
**The substance is sound and the delivery is a toll booth** in front of the one
thing a household cannot afford to skip. So the decision is not whether to teach
it; it is to build it in WHOLE and FREE, with the working system beside it, and
to make it adoptable by any other family here. That is Psalm 78:6 as a product
decision — the generation to come is supposed to arise and declare it, so we hand
them something plain enough to run with (Habakkuk 2:2).

## The decision, in four parts

### 1. The lesson is free, in the app, and age-adaptive

`legacy-provisions-course.js` — "Secure the Legacy: The Provisions That Hold" —
six self-paced lessons registered in `LEARN_CATALOG` (a course that is built but
not surfaced is not shipped, DR-0318's class), each with `levels.child` and
`levels.senior`, a quiz, facilitator notes, and a DECLARED `meta.wordFirst`
rather than a borrowed anchor (DR-0282). It pairs with **Handed Forward** rather
than duplicating it: that course forms the HEIR, this one teaches the STRUCTURE
the heir inherits. Every KJV fragment is verbatim from the repo's public-domain
corpus and re-pinned by the test — **observed failing** on a one-word drift
("Occupy till I come" → "until") before it was trusted.

### 2. The business system is a system, not a brochure

`family-trust.js` splits the same way `0052-recipes` and Road-to-150 split:
the AUTHORED half (ten prepopulated constitution articles for the Poe family, the
three provision records with their drafting checklists, the production policy,
the ten spendthrift review questions) ships as version-controlled code so the
canonical family document can never be lost; the COMPUTED half reads real ledger
rows. `0167` holds only what a family actually DID — a production entry, a
distribution, an attestation, an exemption, a spendthrift answer.

**Family-scoped, deliberately diverging from DR-0319.** A weigh-in is one
person's alone; a trust ledger is the house's shared record, because a trustee
being able to read a beneficiary's standing IS the mechanism of the third
provision. RLS scopes rows to the instance (owner/admin/member), never across
families.

### 3. Every honest failure mode is a gate, and each was observed catching

The system's whole value is that its numbers can be trusted, so the honesty rules
are machinery, not prose. Painting the engine two ways — summing absent amounts
as zero, and letting an empty ledger read as a pass — turned **ten** tests red:

- an empty ledger reports `no-record` with a **null** total, never zero and never a pass;
- a check whose inputs are missing reports `unknown`, never `pass`;
- `distributionReview` **never returns `clear` on unknown or no-record** — the gate fails safe toward the governor, not toward the money;
- an unanswered spendthrift item reads `unreviewed`, never `protected`, and one exposure keeps the whole posture unconfirmed;
- an answer older than the review interval goes **stale** — reviewed once is not reviewed forever;
- an attestation is a real record that does **not** manufacture a production standing.

### 4. The limits are rendered WITH the provision, never buried

A spendthrift clause oversold is a clause that fails when it is needed. The
limits ride in the data (`TRUST_PROVISIONS[].limits`) so every surface that shows
a provision shows what it does NOT do: self-settled trusts, child support and
certain government claims, and funds already received. The course states the same
limits in the lesson prose, and the tests require both. This is teaching and a
family operating system — **not legal advice**; a licensed estate attorney in the
governing state drafts and executes the instrument.

## Where it mounts, and why not a new tab

The shell sits exactly at its frozen budget (5,335 lines,
`monolith-budget-guard`). The provisions belong beside the family's written
money, so `LegacyProvisions` mounts INSIDE Books → Plan: `FamilyPlan` now renders
the plan document and the provisions system, and the provisions render whether or
not a `family_plans` row exists, because the document's early returns are about
the DOCUMENT. Cost to the shell: **zero lines.**

## One thing found on the way

Mounting a synced surface inside `FamilyPlan` surfaced that `table-sync`'s
subscribe IIFE is un-awaited and un-caught — anything it throws became an
**unhandled rejection** rather than a handled failure. Sync is best-effort by
contract (local-first; the courier is optional), so it now logs and the surface
keeps working on its device-local records. That is every sync in the app, not
only this one.

## Carried

- The in-app **adopt** flow is copy-to-clipboard today (`adoptConstitution` exists and is tested; no UI writes another family's articles yet) — **re-review: 2026-10-02**.
- The **beneficiary roster** is device-local and unioned with whoever the synced entries name; a roster row of its own would let a family name an heir before any entry exists — **re-review: 2026-10-02**.
- A **Help** entry for the surface (`surface-help.js` / `help-content.js`) — the surface self-explains inline today — **re-review: 2026-09-16**.
