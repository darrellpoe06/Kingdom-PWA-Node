# DR-0174 — The Love Corner gets its standalone branded install: the church's own door (approved, shipping ahead of the Assembly)

- **Status:** accepted — **APPROVED 2026-07-11** by the Governor (Darrell, COLG Director of Technology) AND Bishop Gwin, for release ahead of the National Assembly. The Tier C DR-0133/DR-0003 gate is SATISFIED; PR #787 released to `main`.
- **Tier:** C (COLG public identity — RELEASE-TIERS; DR-0133 §gate). The gate here is the church's own approval, and the church's own Director of Technology + Bishop gave it — so this ships. (Tier C means the church decides, not that the agent adds a wait the church didn't ask for.)
- **Scope:** `app/public/lovecorner/index.html` (the church-tagged entry page), `app/public/manifest-lovecorner.webmanifest` (the branded install), `app/public/_redirects` (`/church`, `/thelovecorner` aliases), `app/src/lib/church-own-door.js` (phase flipped to built + share constants), `app/src/__tests__/lovecorner-door.test.js` (proven-to-catch)
- **Date:** 2026-07-11
- **Principles:** COMMUNITY-FIRST (COLG is the named first community), APP-IS-PRIMARY, NO-STATIC-DATA (DR-0121 — the plan and the artifact never drift), VERIFICATION-DOCTRINE (DR-0076), GOVERN-EXECUTE-ADVISE, RELEASE-TIERS

## Directive

Darrell, 2026-07-11, choosing between the two readings of "The Love Corner App": **"standalone Love Corner–branded install or its own door at thechurchofthelivinggod.com."**

## The reality (traced before building)

DR-0133 already decided the *strategy* and the *architecture*: the church's app is a **registry row on the one door engine, like Moore Divahs — never a fork.** The `church` tab is already a registered door row (`moore-door.js` `DOOR_TABS`), and `?view=church` already mounts the church home inside the app. What did NOT exist was the **standalone branded install itself** — the Moore-equivalent artifacts. DR-0133 named it precisely: phase `install-identity`, *"Installable under the church's own name — entry page, manifest, share QR,"* status `planned`. This DR builds exactly that phase.

## Decision

The Moore pattern (`public/moore/index.html` + `manifest-moore.webmanifest` + `/mooredivahs` alias, DR-0114) applied to the church, byte-for-byte in shape:

1. **The shareable entry page** (`public/lovecorner/index.html`) carries the CHURCH's own OG tags, so a texted/shared link previews as "The Church of the Living God · The Love Corner" — not "PoeTech Family OS" — then meta-refreshes into the real church door (`/poetech-app/?view=church`). No inline JS (CSP-safe).
2. **The branded install** (`manifest-lovecorner.webmanifest`): Add-to-Home-Screen installs under **"The Love Corner"** with the church's name and a dignified ink theme, opening straight to the church view. So the congregation gets a church app icon on their phone, not a platform one.
3. **The share links** — `/church` and `/thelovecorner` alias to `/lovecorner/` (the entry page serves automatically at its own path), the URLs a bulletin, a QR, or a text can actually carry.
4. **The plan reflects the artifact (DR-0121).** `church-own-door.js` phase `install-identity` flips `planned → in-progress` (built, not yet publicly live) with the real file names in its detail and the gate named; `SHARE_DOOR_URL` / `INSTALL_MANIFEST` constants are the one source every share surface encodes. The proven-to-catch test pins that the manifest installs under the church's name (not PoeTech), the entry page previews as the church and refreshes to `?view=church`, the aliases resolve, and the plan/artifact never drift.

## Held — what "built" does and does not mean

The artifact EXISTS so the church can **see and approve** its own door. It is **not open publicly**: the PR is `hold`, and per DR-0133 / DR-0003 the church's public identity is doctrine-governed — **Bishop Gwin's sign-off + Governor review gate the opening.** Serving it at `thechurchofthelivinggod.com` (the domain cutover, replacing the current Weebly/Turbify site) is a separate, heavier Tier C phase (`phase-domain-cutover`) with its own DNS + doctrine gate — untouched here.

## Opportunities and constraints (routed)

- **Opportunity:** the church's OWN icon + brand color assets (the manifest reuses platform art today, exactly as Moore did until Shay's arrived) — an asset only COLG holds. `re-review: 2026-07-25`.
- **Opportunity:** a printable QR for the bulletin encoding `SHARE_DOOR_URL`. `re-review: 2026-07-25`.
- **Constraint (held, Governor + Bishop):** the door opens publicly only after doctrine sign-off; the `hold` label + the phase gate enforce it.
- **Constraint (verified):** the sandbox cannot exercise the real Add-to-Home-Screen install; the artifacts + the Moore-proven config are unit-pinned, and the install is confirmed on the reviewer pass, same posture as Moore's.

## Supersedes / pairs

Builds DR-0133's `phase-install-identity` (planned → built). Pairs with DR-0114 (the Moore door — the proven template), DR-0003 (the church's doctrine-gated domain), DR-0153 (install-door-is-first-class — the church door is now one too), DR-0104 (the reviewer pass that confirms the install before it opens). No supersession.
