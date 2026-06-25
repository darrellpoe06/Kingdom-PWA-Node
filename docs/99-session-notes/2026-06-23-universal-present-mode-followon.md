# Universal Present Mode — research-gated follow-on

**Date:** 2026-06-23
**Status:** follow-on plan (NOT this PR). This PR (#289) shipped the reusable
**Presenter primitive + multi-surface step**; this document is the gated remainder.
**Grounds:** Darrell on live build 79dfccd — *"currently only one course can use the
live presenter instead of everyone and everything can."* The vision: **every user,
every age, presents their family's works — through the church.**

---

## What shipped in this PR (the incremental, low-risk step)

- **`lib/presentable.js`** — a surface-agnostic `presentable` contract: an ordered
  set of `scenes`, each with an `audience` render (what the room sees) and
  presenter-only `notes` (never broadcast). Pure helpers `buildSlideForScene` /
  `holdingSlide`, plus adapters `coursePresentable()` and `wordPresentable()`.
- **`components/Presenter.jsx`** — the shared primitive, extracted from the
  course-welded `TeachMode`. Renders ANY presentable; BroadcastChannel two-screen
  sync, timer, clicker, blank/resume, in-context scene nav, age-adaptive hook.
- **Surfaces now presentable:** every Learn course (was A.I.-only) + **The Word —
  Migdal** (sermon library). `TeachMode` is now a thin adapter; `AudienceWindow`
  reads generic `indexLabel`/`kicker`/`detailLabel` with legacy fallback.
- **The no-leak invariant** (DR-0076) is preserved and now test-covered: the
  broadcast payload carries audience fields ONLY.

The architecture is deliberately **open for one-more-adapter**: a new surface
becomes presentable by writing a `xPresentable(...)` function, with **no change** to
the primitive or the projector.

---

## Deferred to the research-gated full version

These need research-review + (some) Tier C soak before building. They are NOT in
this PR on purpose.

### 1. Documents / creation-workspace as a presentable
The 🎨 Create surface (contenteditable docs + SVG export) should present its pages
as scenes. Open question: a document has no fixed "scene" boundary — do we present
by heading, by page-break, by an author-marked slide split? **Research:** the
cleanest scene-segmentation contract for free-form documents that doesn't force the
author to re-author their doc as slides.

### 2. "Family works" — the real federation
The north star: a family puts *their own* works (a child's project, a photo essay, a
testimony, a finished build) up on the church screen. This needs:
- **An ownership + consent model** — whose work, who may present it, who may see it
  on a shared screen. Pairs with DATA-AS-EMPOWERMENT-NOT-EXTRACTION and the
  Loved-Ones privacy posture. A family work is private by default; presenting it is
  an explicit, per-work act.
- **A submission → curation → present path** — "through the church to present" as the
  canonical route (this PR seeds the *framing*; the federation builds the *pipeline*).
  Likely rides the existing cross-tenant review pipe (the same pattern as class
  interest + governance queue), Governor/leadership-curated.
- **Tier:** C — it touches identity (whose works), consent, and a COLG-facing
  surface.

### 3. Real-time multi-device audience (beyond one projector)
Today the audience is one popped window on a same-origin BroadcastChannel (one
laptop, one projector). The federation wants **remote** audience devices (a phone in
the pew, a viewer at home) following the live scene. **Research:** the transport —
a sovereign NAS relay (n8n / websocket on the family box) vs. a Supabase realtime
channel — measured against the sovereignty principle (internal-first) and the
three-brakes rule for anything always-on.

### 4. Age-ADAPTIVE rendering (not just an age hook)
This PR ships the **hook**: a child/teen/adult selector that coaches the *presenter*.
The full version adapts what the **audience** sees — type scale, density, vocabulary,
imagery — per the room's age band, reusing the Learn-framework `AGE_BANDS` /
`lessonPlanForAge` work. **Research:** how far audience-side adaptation can go before
it fragments the "one shared screen everyone sees together" experience.

### 5. Presenter-notes authoring in-app
Course notes come from the authored facilitator guide; sermon notes from the message
record. "Family works" will have no pre-authored notes — the presenter needs a
lightweight in-app way to jot scene notes. Small, but out of this PR's scope.

---

## Verification posture (DR-0076)

Each deferred item ships only with its own evidence: the no-leak gate extends to
every new adapter (a test that the broadcast payload of `xPresentable` never contains
a notes/consent/private field), and "family works" gets a tenancy/consent gate
(proven-to-catch) before any cross-family screen-sharing is possible.
