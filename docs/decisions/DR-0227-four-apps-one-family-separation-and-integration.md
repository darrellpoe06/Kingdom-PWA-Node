---
id: DR-0227
title: Four apps, one family — separate on every phone, integrated on one spine; the shared-scope morph and its perpetual fixes
status: accepted
date: 2026-07-23
tier: B
declared_by: Darrell
supersedes: []
amends: [DR-0152 (per-brand packages), DR-0174 (Love Corner install identity), DR-0217 (single access surface)]
principles: [TECHNOLOGY-CHOICE (DR-0226), APP-IS-PRIMARY (DR-0065), COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE (DR-0076), DR-0107 (prove the deploy), DR-0060 (RLS is the gate)]
---

## Context — the ask and the field observation

Darrell 2026-07-23: *"Can [I] have each App PoeTech has built or is building on my
cellphone using my Samsung? PoeTech LoveCorner TLCTherapySolutions & MooreDivahs
without issues?"* — *"Separated?"* — *"Anyone anywhere is the goal and expected to be
able to use them independently"* — *"And interconnected or integrated if in the
PoeTech App build family."* Then the field observation that named the real defect:
*"the installed PoeTech App turns into the Love Corner App when clicking on the
icon... actually I think it will be whatever it was last... Investigate opportunities
and constraints solutions for perpetual fixes."*

## The mechanism, traced (DR-0076 — characterized before changed)

The separation is largely SHIPPED by design: four manifests with distinct
`id`/`start_url` (own names, own icons), own-name entry pages (`/moore`,
`/lovecorner` + `/church`, `/tlc`), and Moore/TLC door components that swap the
page's manifest link when they render. Two real defects remained:

1. **The install-offer miss (the screenshot):** a church boot
   (`?view=church` or an alias deep link) never swapped the manifest — the page
   carried the default PoeTech manifest, so Chrome's install sheet said "This app
   is already installed" (the PoeTech id) instead of offering The Love Corner.
2. **The morph (the deeper one):** all four brands share ONE scope
   (`/poetech-app/` — PWA scope is path-based; query params can't split it), so
   Android has ONE window for all four identities. Tapping any icon RESUMES that
   window wherever it last sat — the installed PoeTech app "turns into" whatever
   brand was used last. Not a boot bug (`getInitialView` is URL-only); it is
   OS resume + shared scope.

## Decision — three layers, each honest about what it fixes

1. **SHIPPED — boot-time install identity (`applyBootBrandManifest`,
   PwaPrompts):** the launch URL is read ONCE at page load (install identity is a
   page-load property; mid-session SPA manifest swaps are flaky in Chrome) and a
   church boot links `manifest-lovecorner.webmanifest`. Fixes the screenshot: a
   fresh church link now offers "Install The Love Corner." Family boots keep the
   PoeTech manifest — no hijack. Proven in pwa-prompts-render tests.
   (Plus TLC icon parity: real 192/512 PNGs so all four brands install with
   raster icons.)

   **Correction, same sitting (Darrell): the Moore icon stall was an unverified
   premise.** The first draft of this record repeated the old board note that her
   artwork was "a value only she holds" — Darrell: *"how do you know that?
   Obviously I also hold it,"* and *"there is already a requirement to have
   separate icons — what is undermining my intention?"* What undermined it: an
   open dependency parked with no date, no interim, and an unchecked constraint
   (the WAYS-REVIEW question 2 failure — an asserted "can't" nobody verified).
   Closed the same sitting: **Moore Divahs now installs under HER OWN mark** —
   an MD monogram with the stitch line, derived from her real brand record
   (`MOORE_BRAND`: rust `#B85838`, her craft), rendered to full raster parity
   (192/512 any + maskable + apple-touch), wired into her manifest, her entry
   page (incl. the texted-link preview image), and her TWA matrix row. Supplied
   artwork replaces it as a one-file swap whenever she or Darrell provides it —
   an upgrade path, no longer a blocker.

2. **SHIPPED — four real Android apps (the phone-side perpetual fix):**
   `android-package.yml` is now a four-brand matrix (us.poetech.app /
   .lovecorner / .tlc / .moore) — each a distinct TWA package with its own task,
   icon, and resume state, so the morph cannot happen between them. Dispatch-only
   (DR-0152 lane; per-run testing keys; the Play keystore stays a Governor
   custody step). This is the family's "separated, without issues" answer today,
   and the Play-store road for anyone-anywhere tomorrow.

3. **DATED — web-layer scope separation (the PWA perpetual fix):** the full fix
   for browser installs is per-brand PATH boots (`/lovecorner-app/`, `/tlc-app/`,
   `/moore-app/` serving the same bundle) so each manifest gets its OWN scope —
   four separate PWA windows, no cross-brand resume, install always offered.
   **Constraints that earn the date:** it touches the serve/deploy layer where the
   P26/P32 incident classes live (asset guard, SW scope, per-path service workers
   or SW-less installability) and must land with the DR-0107 watched-deploy
   proof; per-brand localStorage keying rides along (one origin = shared storage).
   `re-review: 2026-08-01` — designed here, built through the lane with the
   proof, not blind-shipped at the end of a long day.

## Integrated where it counts (the other half of the ask)

One origin, one data spine is WHY the integration is cheap and real: the
interconnection loops are file-verified live (`interconnect-manifest` gate —
crm-federation across the business family, choir↔songbook, feedback→concerns),
and RLS remains the real boundary (DR-0060): a Moore customer sees only their
orders no matter which door they entered. Separation is an INSTALL-identity
concern; integration is a DATA-spine fact. The two don't trade off — that is the
architecture working as declared (DR-0217).
