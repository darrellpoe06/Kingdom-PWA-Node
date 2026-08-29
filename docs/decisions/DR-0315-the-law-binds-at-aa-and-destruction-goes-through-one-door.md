# DR-0315 — The law binds at AA, and destruction goes through one door

- **Date:** 2026-08-29
- **Status:** accepted
- **Tier:** B
- **Surfaces:** every interactive control the app ships; UX-PATTERNS Pattern 2g; ui-standards-guard
- **Pairs with:** DR-0314 (measure before writing the standard), DR-0131 (fix the one primitive), DR-0076 (§3 proven-to-catch, §8 honest uncertainty), DR-0100 (speak established fact), DR-0075 (re-review dates), DR-0259 (the review lands in the registry)

## What Darrell said

2026-08-29, quoting the recorded 44-vs-36 conflict and the destructive-confirm
refusal back:

> "Research the best UIUX standard for accessibility because the US government
> has laws that fine those who dont comply with them starting soon... UIUC has
> been upgrading the websites to make sure sites and apps are compliant with
> the new policies."

And, on the destructive-confirm limit: *"solutions?!!!!!!!!!!"*

## Part 1 — What the law actually says (researched 2026-08-29, not from memory)

**The enforceable tier is WCAG Level AA, everywhere the law speaks.**

- **ADA Title II** (state/local governments): the DOJ final rule (28 CFR Part
  35, April 2024) requires **WCAG 2.1 Level AA** for web content and mobile
  apps. An interim final rule of April 20, 2026 extended compliance to
  **April 26, 2027** (entities serving ≥50,000) and **April 26, 2028**
  (smaller entities and special districts). Title II does not bind PoeTech —
  we are not a public entity.
- **ADA Title III** (private businesses): no codified technical standard, but
  courts and DOJ settlements use **WCAG 2.1/2.2 AA** as the de facto bar.
  3,117 federal web-accessibility suits were filed in 2025 (+27% year over
  year; ~69% against e-commerce). Religious organizations are exempt from
  Title III, but the **Properties app is tenant-facing**: rental services are
  the closest thing this platform has to a public accommodation, and state
  laws (e.g. California's Unruh Act) attach damages where the ADA does not.
- **WCAG 2.2 target size, the criterion under the 44-vs-36 conflict:**
  - **SC 2.5.8 Target Size (Minimum), Level AA — 24×24 CSS px** (with
    spacing/inline/equivalent-target exceptions). This is the tier the laws
    bind to.
  - **SC 2.5.5 Target Size (Enhanced), Level AAA — 44×44.** No law requires
    AAA; 44 is also the Apple HIG 44pt / Android 48dp platform guidance.
- **UIUC** (the precedent Darrell named; his own dpoe@illinois.edu campus)
  holds every university site and application to **WCAG 2.2 Level A + AA**,
  enforced by automated scanning of all campus sites plus manual evaluation.

## Part 2 — The decisions

1. **The house target posture is WCAG 2.2 Level AA** — the UIUC posture: the
   newest published standard at the legally-bound tier, enforced by machinery
   (gates) plus human review (DR-0104), not by memory.
2. **The 44-vs-36 conflict recorded in Pattern 2g.2 is RESOLVED, not
   conceded.** 44 and 24 were never the same kind of number: 24 is the AA
   legal floor, 44 the AAA aim. The house floor of 36 sits 1.5× above every
   legal requirement. The gate stays at 36; 44 stays the aim; the checklist
   line now says which tier each number belongs to. Nothing was lowered.
3. **Destruction goes through one door: `app/src/lib/confirm-action.js`
   (`confirmThen`).** The 2026-08-28 refusal to gate destructive-confirm named
   a limit of *scanning* (parent-component confirms are statically
   unresolvable). The solution is DR-0131's: fix the one primitive. When
   destruction routes through one named function, the question becomes one
   import, which a scan CAN answer. The gate is **HARD at zero** because its
   first run caught **six live unguarded destructions** — recipe, song idea,
   budget goal, calendar event/recurring/incident, several deleting cloud rows
   — and all six were fixed the same day, leaving nothing to baseline.
   `REVERSIBLE_BY_DESIGN` names the one exemption with its reason.
4. **A false baseline entry is debt that was never owed.** Teaching the
   focus-ring scan to resolve focus-carrying constants (`${FOCUS}`, `${BTN}`)
   healed **93 of the 326** frozen focus-ring entries — buttons that always
   had rings the literal tag couldn't show. The baseline shrank 341 → 248 with
   zero additions, proven by set-diff.

## Part 3 — The WCAG 2.2 AA criteria this repo does NOT yet gate

Named per DR-0076 §8 (unverified is a valid, required output), each with a
route and a date:

| Criterion | State today | Route | re-review |
|---|---|---|---|
| 1.4.3/1.4.11 contrast | GATED (per-theme contrast + form-control guards) | — | — |
| 2.4.7 focus visible | GATED (ratchet, 226 real debt) | heal the debt | 2026-10-01 |
| 2.5.8 target size | GATED above the bar (36 > 24) | walk 32/34px up | 2026-10-01 |
| 4.1.2 name/role/value | partially gated (icon-label HARD) | extend to inputs missing labels | 2026-10-15 |
| 2.5.7 dragging movements | not gated; app has little drag UI | measure first (DR-0314) | 2026-10-15 |
| 3.3.7 redundant entry | not gated | measure the forms that re-ask | 2026-10-15 |
| 3.2.6 consistent help | not gated; HelpButton exists per-surface | measure placement consistency | 2026-10-15 |
| 3.3.8 accessible authentication | PIN entry qualifies as cognitive-function test — needs review against the exception list | review the access gate | 2026-09-15 |

The 2026-09-15 and 2026-10-15 rows are the follow-through this DR promises;
each becomes a measured gate or a one-line why per DR-0075.

## Why this is a DR and not a chat reply

DR-0259: the review lands in the registry. The 2026-08-28 conflict record was
honest but unresolved; leaving the resolution in a chat message would repeat
the exact failure DR-0259 closed. The lineage (24 legal / 36 house / 44 aim)
now lives in the Ways beside the conflict it settles, and the gate carries the
enforcement.
