# CHURCH-TAB-DIRECTORY.md — The Default Church Home + Multi-Church Directory Model

**Layer 3 (reference) foundation doc.** Added 2026-06-03. Governs the Church Tab surface in the PWA (`app/src/poe-financial-mvp-v28.jsx`, `Church` component) and every future church-facing surface.

This document is read through the worldview spine (`THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`) and under the binding rules of `CLAUDE.md` (Layer 0). Typographic theology applies to every line: Yahweh, Jesus, the Father, the Son, the Holy Spirit always capitalized; the adversary's names never. Scripture follows `SCRIPTURE-REFERENCE-STANDARD.md` (ESV primary).

---

## 1. The COLG / Love Corner default

The Church Tab's **default church home is The Church of the Living God** — known warmly as **The Love Corner** — in Champaign, IL. Every user who has not set their own church home lands here.

Verified facts (against the COLG site and the Bishop Gwin migration brief, `docs/99-session-notes/2026-06-03-bishop-gwin-colg-migration-brief.md`):

- **Name:** The Church of the Living God (official) · The Love Corner (warm/unofficial)
- **Location:** 312 E. Bradley Ave, Champaign, IL
- **Sunday Worship:** 11:00 AM
- **Wednesday Bible Study:** 1:00 PM and 6:00 PM
- **Online giving:** runs through the church's own secure page on TheChurchOfTheLivingGod.com (Turbify-hosted; see Hostinger research D15). No payment data passes through this app. The exact giving deep-link is confirmed with the church office and swapped in at V1; the site root carries the published giving link today.
- **Founded:** July 1946
- **Mission:** "Reviving Faith · Restoring Hope · Rebuilding Communities"
- **Pastoral authority:** Bishop Gwin

The canonical default object lives in code as `COLG_DEFAULT_CHURCH` (one source of truth; `SEED_DATA.church` references it). The `Church` component falls back to it whenever the user has not set a real custom church home.

### Why this is public, not a privacy leak

COLG's directory facts above are **public information about a public institution** — the platform's named first community per `COMMUNITY-FIRST-MISSION.md`. This is a **different category** from the family's *private financial seed* that the 2026-05-28 demo-background sanitization guards. That sanitization removed the family's private data from leaking behind the demo welcome modal; it did not bar COLG, the public anchor community, from being the explicit, labeled default church home. COLG-as-home-instance-default is established design intent (`docs/01-architecture/task-cards/2026-05-22-counseling-subtab-inside-church.md`). A demo viewer's anonymized `'Your home church'` placeholder resolves to the COLG **public directory entry** — never to the family's private data.

---

## 2. The Father's Business anchor

The Church Tab exists to serve souls and to give the unchurched a home network and a church. This is the soul-saving anchor: the Church Tab is **about the Father's business**.

> **ESV — Luke 2:49:** *"And he said to them, 'Why were you looking for me? Did you not know that I must be in my Father's house?'"*
> **KJV — Luke 2:49:** *"...wist ye not that I must be about my Father's business?"*

(The KJV's "Father's business" is the phrasing the anchor is named from; the ESV reads "Father's house." Both are surfaced per the translation rubric; neither is paraphrased.)

The unchurched visitor who navigates to the Church Tab is offered **OUR church** as their default home — a real congregation, real service times, a real giving path, real pastoral content. The "set your own in Settings" note keeps it a gift, not a lock: this is your default church home; if you have a church home, you can set it.

This pairs with the progressive-disclosure posture (Mars Hill, Option B): the visitor who navigates to the Church Tab has **opted in by their navigation**. The tab is the deeper-engagement surface; it does not need to soft-pedal the gospel for someone who walked through this door.

---

## 3. The multi-church directory model

One church today; a directory tomorrow.

- **V0 (shipped 2026-06-03):** COLG / The Love Corner is the single visible directory entry and the default church home for every user.
- The directory section ("Church Directory") shows COLG with a **Default** badge, a "More churches coming as they join PoeTech" line, and a **"Your church not here? Invite them"** CTA opening a skeleton form: "Tell us about your church home and we'll reach out about joining the PoeTech partner directory." (Local-only; full onboarding ships V2.)
- **"My church home"** user-config is a placeholder today (an alert): "Coming soon: pick your own church home. Default = The Church of the Living God."

As partner churches join, each becomes its own directory entry; users pick their own church home; COLG remains the default for anyone who has not chosen.

---

## 4. The Loved Ones cohort tie-in

The **first 100 Church of the Living God (The Love Corner) families** are the founding anchor cohort — the gated rail of the **Loved Ones · Founding Family** tier (free PoeTech+ for life). This is `project_loved_ones_cohort_includes_chosen_family`:

- **COLG community rail = PUBLIC as a category.** "First 100 Church of the Living God families" is intentionally public — COLG is the named first community. The Church Tab and the About card both name it.
- **Outside-community chosen-family rail = PRIVATE.** Category framing only ("chosen family invited directly by the Poe family"); specific admits are never enumerated on any public surface. Christina and Darrell hold joint discretion for that rail.

The Church Tab directory entry for COLG is the public face of the COLG community rail; it never enumerates the private chosen-family roster.

---

## 5. Partner-church alignment check (Q8 framework)

Partner churches are admitted under the **Word-first, Body-undivided** framework (`project_non_denominational_word_first_body_undivided`):

- **Word-first.** Scripture is the senior source (ESV primary per `SCRIPTURE-REFERENCE-STANDARD.md`); where a tradition's distinctive and the plain Word diverge, the Word governs.
- **Body undivided.** Non-denominational in posture (Galatians 3:28; Colossians 3:11). Shared orthodoxy — the creeds, the gospel — is centered over disputable distinctives (Romans 14).
- **Christ-confessing.** A partner church confesses Jesus as the Son, raised, Lord (Romans 10:9).

The exact per-tradition weighting and any COLG-specific tuning is a **Darrell + Bishop Gwin** judgment call, surfaced, not improvised by the agent (per the `CLAUDE.md` no-improvise-theology rule). The invite form's confirmation copy states the alignment posture plainly: "Partner churches are Word-first, non-denominational in posture, and Christ-confessing."

---

## 6. Naming conventions

| Context | Name to use |
|---|---|
| Official / formal | **The Church of the Living God** |
| Warm / unofficial | **The Love Corner** |
| Combined (default subtitle) | **Also known as The Love Corner — Champaign IL** |
| Internal shorthand (comments, session notes only) | COLG |

"COLG" is internal shorthand only — never the user-facing label. Every visible surface uses the official name, the warm name, or the combined form.

---

## 7. Roadmap

- **V0 (shipped 2026-06-03, D21):** Single-church default. COLG / The Love Corner as the default church home; directory skeleton with the COLG anchor entry; "invite your church" form skeleton; "My church home" settings placeholder; Bishop Gwin pastoral "Sermons coming soon" placeholder; Testimony Diary PIN-locked entry point.
- **V1:** Multi-church picker (user sets and switches their own church home); the real COLG giving deep-link swapped in once confirmed with the church office.
- **V2:** Partner-church onboarding flow (the invite form wires to a real intake pipeline) + a Bishop Gwin migration-brief template generalized for any partner church considering PoeTech.

---

## 8. The Test for this surface

- **Religion check:** Scripture-grounded (Luke 2:49; the Word-first alignment frame), structurally sound, doctrinally honest (no improvised theology; doctrinal calls reserved for Darrell + Bishop Gwin).
- **Relationship check:** Warm — "your default church home," "a gift of belonging, not a paywall," the Love Corner name. It meets the unchurched visitor where they are and offers them a home.

Both, in balance. Representatives of the King.
