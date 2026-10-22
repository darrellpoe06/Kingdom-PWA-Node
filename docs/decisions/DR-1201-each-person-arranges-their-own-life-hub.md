# DR-1201: Each person arranges their own Life Hub — the front screens' opportunities and constraints

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one front screen's sections ordered and hidden per device; no data, no door, nothing another person sees changes)
**Type:** surface
**Area:**
- `app/src/lib/hub-layout.js` (new): the sections, the order, hide, the render runs, the device store
- `app/src/components/LifeHub.jsx`: the sections by name, rendered in the reader's order; the Arrange panel under the header; the hidden-sections line
- Tests: `hub-layout.test.js` (new), `life-hub.test.jsx` (two cases)

**Grounds:** DR-0464 (the Hub's per-device preferences and their honest limit), DR-1046 (the Hub is the home), DR-0381 (a surface never goes blank), UX-PATTERNS 2e (open in place), 2g (focus, 36px, a glyph carries its name), DR-0065 (the app is the primary artifact).
**Declared by:** Darrell, 2026-10-21: *"Would like to be able to edit our front screens so all sections can be edited by users to arrange as they please? Opportunities and constraints... unless it undermines."*

## Context

**SHOULD.** A person arranges the front screen they use: what they use first goes on top, what they never use goes away, and nothing that keeps the app honest or safe can be arranged out of sight.

**ARE.** The Life Hub (the home since DR-1046) rendered its sections in one fixed order: the welcome, the six tiles, then Recent Messages, Today's focus and goals, and Quick Actions with Recent Activity in one row. The only per-device choices were the density and Current View (`home-view-prefs.js`); the camera block could already be closed (DR-1191).

**The evaluation he asked for, screen by screen.**

| front screen | opportunity | constraint | call |
|---|---|---|---|
| **Life Hub** (the home) | each person orders and hides its five sections | per device, not per account (DR-0464's honest limit); the header with Arrange must stay, or there is no way back | **built here** |
| **Learn** (Courses) | order the departments a person studies | the course order is the curriculum's; the sub-tab strip (DR-1190) is already the arrangement of areas | next: a "my departments first" order, `re-review: 2026-10-28` |
| **Properties front door** | the family orders the portals and the shelf | it is the public face tenants and applicants meet: arranged by the FAMILY, never per visitor; the shelf already has the family's order (showcase, DR-0157) | the family's order of the six portals, `re-review: 2026-10-28` |
| **Church / Love Corner door** | the church orders its own sections | mission identity: the church's staff decide its face, never a visitor (Tier C front-door identity, RELEASE-TIERS) | not by a visitor; a staff-arranged order is its own decision |

**What must never be arrangeable away, on any screen — the "unless it undermines":** a sentence that keeps the app honest (an unverified label, a could-not-be-reached card, an offline line), a consent or privacy notice (the lesson notice, the name choice), a safety or money banner ("projections, not promises"), and the way back to the standard order. A person may move them; no setting hides them.

## What was measured

| what | before | after |
|---|---|---|
| Life Hub sections a person can order | 0 | 5 |
| Life Hub sections a person can hide | 1 (the cameras) | 5, plus the cameras |
| what a hidden section leaves | — | one line, with Arrange beside it |
| the controls that can never be arranged away | — | the header: Arrange, the densities, Current View |

## Decision

1. **The Life Hub's five sections are the reader's to order and hide,** in an Arrange panel that opens in place under the header: Up, Down, Hide or Show per section, and Back to the standard order. Kept on this device; the standard order removes the stored key.
2. **The header is fixed,** because it holds the way back. A hidden section leaves one line saying so, with Arrange beside it, so the home is never blank.
3. **The cards keep their row.** Consecutive cards render side by side whatever their order; a card moved between blocks gets its own row.
4. **The other front screens follow the table above,** each with its own owner of the order (the person, the family, or the church's staff), never a visitor's for a public door.

## Impact

Each person opens a home arranged for what they do first. Nothing honest or safe can be arranged out of sight, and the standard order is always one tap back.

## Verification

- `hub-layout.test.js` (7 cases): a stored layout is always whole; moves stop at the ends; the header is not a section; the runs keep cards side by side; storage that throws or holds garbage reads as the standard order (**proven to catch**); a hidden section is said in one line.
- `life-hub.test.jsx`: Arrange opens in place; Quick Actions moved above the tiles renders above them; hiding the tiles removes them and leaves the line with the way back; the device keeps it; the standard order returns and clears the key (**proven to catch** on the rendered page). With the Life Hub, camera, Big Picture, presence, UI-standards, consistency and contrast suites: green. Lint 0.
- Not seen rendered: the live pass is the stewards' after deploy (DR-0104).
