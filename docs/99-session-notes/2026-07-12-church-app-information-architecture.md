# Church app — information architecture (consolidation proposal)

**Recorded:** 2026-07-12 · **Source:** Darrell (screenshot + "we need to make sure we
have this organized well... consolidate tabs possibly, Ari and Claude thoughts").
Reality-traced against the live church sub-nav (`poe-financial-mvp-v28.jsx` ~4501) and
`ChurchHome.jsx`. **Status:** proposal awaiting Darrell's nod on the grouping (COLG-facing
IA is Tier C — the grouping benefits from the Director of Technology's read before we cut).

## What's there now — 15 flat sub-tabs (the sprawl)

**Member (10):** Church (home) · Engagement · Choir · Order of Service · Learn ·
Eternal Algorithms · Conference · Venues · The Word (Pulpit) · Scripture
**Staff (5, isChurchStaff):** Harvest · Video Wall · Devices · Infra Plan · Observation
**Home sections (5):** Worship · Speak · Prayer · Give & Serve · Times

Problem: four separate teaching tabs (Learn, Scripture, The Word, Eternal Algorithms),
five separate staff facilities tabs, and the prayer wall + directory + "about the church"
are hard to find. Too much horizontal scroll for elderly/tech-novice staff (COMMUNITY-FIRST).

## Proposed — 5 member tabs + 1 staff tab

1. **Home (Church)** — the landing. Sections: Worship (live) · Speak (Council Chamber) ·
   Prayer · Give & Serve · Times · **+ About this church** (identity: since 1946, Bishop
   Gwin, address, history — anchors trust + SEO at domain cutover) and the on-page Church
   Directory (already here; the "invite your church" pointer was fixed to aim here, not the
   hidden About tab).
2. **The Word (Learn)** — *the biggest consolidation.* Merge **Learn + Scripture + The Word
   (Pulpit) + Eternal Algorithms** into one tab with sections. Four teaching tabs → one,
   sectioned. Directly answers "the Learn tab should have some."
3. **Worship** — **Choir + Order of Service** (the worship-team + service-flow surfaces).
4. **Community** — **Engagement (family thread) + Venues/Events** (where the family connects
   and gathers).
5. **Conference** — the 77th Assembly, kept prominent through Jul 16; folds into Community/
   Events after.

**Building & Ops (staff, 1 tab)** — group **Video Wall + Devices + Infra Plan + Observation
+ Harvest** into one "Building" tab with sections. Directly answers "the Projects need to go
under that tab like Video Wall." Five staff tabs → one.

Net: ~5 member tabs + 1 staff tab vs 15 flat — fewer taps, clearer model, kinder to novices.

## "What else so we support our church well" (Ari)

- **Prayer wall — a real decision to make.** Today Prayer is a *personal* device-local log
  that emails the office (screenshot: "Logged locally on your device"). The schema
  (`prayer_requests`, audience enum, RLS) already supports a **shared congregation wall**
  where members see and pray for one another with visibility controls. Personal-log vs
  shared-wall is a pastoral choice for Bishop Gwin — not the agent's to decide.
- **About this church** — a clear identity section (Est. 1946, Bishop Gwin, address, phone,
  service times, brief history) is the trust anchor and the SEO win when the domain cuts over.
- **My Giving This Year** — an honest year-to-date statement (real source pending; honest
  empty state until connected — no painted numbers).
- **Accessibility dividend** — consolidation IS a COMMUNITY-FIRST improvement: fewer tabs =
  fewer taps for elderly/tech-novice staff.

## Claude (engineering) note

- Low-risk: the sub-nav is one `.map` array + a `churchView` switch. Merging tabs = grouping
  existing components behind section tabs (the `SectionTabs` pattern ChurchHome already uses);
  no data changes, no schema, no money — Tier A/B mechanically.
- The one guard to respect: `feedback-area-guard.mjs` scans the church sub-nav for feedback
  coverage — new grouped ids need matching FEEDBACK_AREAS keys or the build goes red (by design).
- Staff-gating (`isChurchStaff`) stays on the Building tab; RLS/tenancy unchanged.
- Sequence: **The Word merge** + **Building grouping** are the two highest-value, lowest-risk
  moves — ship first; Worship/Community regroup second.

## Governance

COLG-facing IA is Tier C — the grouping goes to Darrell/Bishop Gwin before it's cut. The
mechanics are safe to build behind the existing church-door path; nothing opens doctrine or money.
