---
id: DR-0261
title: The install-scope split extends to Moore Divahs and TLC — every installable face on poetech.us is now disjoint
status: accepted
date: 2026-08-01
tier: C
declared_by: Darrell (2026-08-01 screenshots: "PoeTech and Love Corner work not TLC nor MooreDivahs work independently as apps")
supersedes: the MooreDoor/TlcPublicDoor runtime manifest swaps (retired)
builds_on: [DR-0258 (the scope-split pattern, proven on-device), DR-0114 (client business factory), DR-0174 (install identity), DR-0076 (verification doctrine)]
principles: [VERIFICATION-DOCTRINE, GATE-THE-CLASS (DR-0239), MACHINERY-OVER-MEMORY (DR-0250)]
---

## Context

Darrell, 2026-08-01, three screenshots: **the DR-0258 fix is proven on real
hardware** — PoeTech and The Love Corner now install side by side — and the
two faces the DR carried as the same collision class hit exactly the
predicted wall: at `?moore=1` and `?tlc=1` Chrome's install sheet says "This
app is already installed" with Moore's/TLC's icons. Their manifests still
declared `scope: /poetech-app/`. The Governor directing this on his own
screenshots closes the "Moore migration is a Governor decision" hold the DR
recorded — pulled forward from its 2026-08-07 re-review date.

## Decision

The proven DR-0258 pattern, applied verbatim to both faces:

1. **Manifests:** Moore → `id`/`scope: /moore/`, `start_url:
   /moore/app/?moore=1`; TLC → `id`/`scope: /tlc/`, `start_url:
   /tlc/app/?tlc=1`. All four faces now pairwise disjoint.
2. **Served pages:** two new Vite MPA inputs (`app/moore/app/index.html`,
   `app/tlc/app/index.html`) serving the same app with each brand's manifest,
   icons, title, and theme-color in STATIC markup.
3. **Runtime swaps retired** in `MooreDoor.jsx` and `TlcPublicDoor.jsx`
   (title/theme branding stays; the manifest link is never touched at
   runtime — post-split a swap would make the page un-installable entirely).
4. **Share doors repointed:** `/moore/` and `/tlc/` now refresh into
   `/moore/app/` and `/tlc/app/` — printed QRs and aliases unchanged.
5. **The gate generalized:** the disjoint-scope test now sweeps ALL FOUR
   manifests pairwise (id-in-scope, start_url-in-scope, no scope contains
   another) — a fifth face joins the list or CI goes red.
6. **Cache headers:** both new shells + both manifests no-store on both
   hosts' config files.

## Migration (honest costs)

Same shape as the church's: any device holding an old Moore or TLC install
(old identity, scope `/poetech-app/`) keeps working but blocks the PoeTech
install sheet on that device until the old app is uninstalled and reinstalled
from its own door (`poetech.us/moore/`, `poetech.us/tlc/`). Moore's printed
QRs encode URLs, not scopes — they keep working and now land in her own
scope. TLC's door remains Tier-C-held for its public send; the install
identity being correct is a precondition of that send, not a widening of it.

## Verification

Structural: the all-faces gate + static-link pins run in CI on every merge;
full suite + build green before merge. On-device: Darrell's install pass on
`/moore/` and `/tlc/` after deploy — until reported, this DR claims the
structural fix only (DR-0076 §8).
