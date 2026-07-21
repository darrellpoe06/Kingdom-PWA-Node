---
id: DR-0215
title: Curriculum design — the 25-min Love Corner slot, parable/story beats (funny AND solemn), the testimony-first Story Library, and courses for over-long lessons
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: none
amends: app/src/lib/lesson-flow.js, app/src/components/ChurchLearn.jsx, the Living Lessons course
principles: [SPOKEN-TEACHINGS-ARE-BUILD-INPUT (DR-0089), APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061/P15), EXCELLENCE-AND-RELATIONSHIP, TEACH-DONT-DEBATE (DR-0098), VERIFICATION-DOCTRINE (DR-0076), COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, DIVERSIFY (celebrated diversity), PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell, 2026-07-21, set the curriculum's teaching design across several turns:
- **"these lessons will be about 25 minutes at the Love Corner"** — the delivery
  unit is a ~25-minute facilitated group session.
- **"If any lesson is too long based on humans neurological situations let's make
  courses... or a course and lessons under that."**
- **"make it possible for it to be funny and fun... create or find short stories
  like Jesus did parables that educate during the long form speaking to humans in
  groups."** And: **"Add at least 2 stories to each 25 minute lesson, add more if
  they fit and make sense."** And: **"Solemn stories also when needed."**
- **"keep a running record of potential stories for biblical truth that users
  begin to become a curator for because they fit the Word."** **"add as needed...
  intuitive and dynamic."** **"I have personal stories that fit better than
  anything I've heard — imagine others who have experienced life."**

## The decisions

**1. The 25-minute Love Corner session is the design unit.** A lesson's core
teaching is paced to fit the slot (the arc engine already reflows to any target,
incl. 25 min — `reflowArcMinutes`). Silent-read length is not the measure; the
facilitated session is.

**2. Over-slot lessons become COURSES with ~25-min sessions.** Measured (spoken
~140 wpm): most lessons fit; **L42 (~29 min) and L50 (~24 min)** are the current
over/at-slot outliers and become multi-session courses (the least-invasive shape
under evaluation: one module carrying a `sessions: []` array the UI paginates, so
the `weeks === MODULES.length` gate stays honest). *Pending — the mechanics ship
after the arc-engine session support lands; not in this DR's shipped scope.*

**3. Parable/story beats are a first-class lesson element (SHIPPED).** Jesus
taught in short, vivid, memorable stories — "without a parable spake he not unto
them" (Matthew 13:34) — and used wry, unforgettable images (the camel through a
needle's eye, the plank in the eye). So each lesson carries a `stories: [{ tone,
title, body, verse, source? }]` array, rendered on the **audience** side of the
TEACH stage (`lesson-flow.js` → `teach.audience.stories`; `ChurchLearn.jsx` "Picture
this…" cards). **Standard: ≥2 stories per 25-min lesson, more where they fit.**
Both registers — **funny AND solemn**, matched to the moment. Learner-safe (no
facilitator keys → passes the no-leak guard).

**4. The Story Library (Layer 2, NEXT) — testimony-first, user-curated,
review-gated.** A running, searchable record of candidate illustrations tagged to
the biblical truth/verse they fit, that **users curate** ("does this fit the
Word?"). Centered on **real lived testimony** (Darrell's own and the community's —
"fit better than anything I've heard"), because lived experience is the richest,
most resonant illustration. Capture is **intuitive and dynamic** (low-friction
"add a story when it comes to mind"). States: submitted → in-review → approved →
in-lesson → retired. Feeds the lesson `stories` array on approval.

**5. Diversity is a standing curriculum requirement** — topic, format, AND tone
(not all long solemn deep-dives). Documented as an ongoing map.

## The guardrail (the parable/testimony gate)

Curation ≠ auto-publish. Before any story reaches a lesson it must pass, like the
verse-verification gate: **true-to-life · serves the verse · honorable, not
flippant (the Test) · distorts no doctrine (DR-0098) · every Scripture it quotes
is KJV-verbatim (DR-0076) · provenance clean (original or consented testimony;
attributed per DR-0190; no uncredited third-party material) · consent + privacy
for real testimonies (DATA-AS-EMPOWERMENT; minor protections).**

## Content preservation is a covenant (Darrell 2026-07-21)

**"Don't lose content or context over time — Yahweh's perspectives are
priceless."** Every teaching built here is durably preserved and must never be
lost to a session purge, a careless edit, or a restructure: it lives in git
(permanent history), is deployed live (verified Cloudflare success per merge),
and is documented in the decision ledger (DRs) + reviews (REVs) + memory (the
*why* and the *context*, not just the *what* — grounds DR-0065 APP-IS-PRIMARY).
**Binding on the course-split:** splitting L42/L50 into sessions is
**content-preserving — every word is MOVED, never deleted**; the parable/story
and testimony content is additive and equally preserved. A restructure that
would drop teaching is forbidden; the split only re-chunks what already exists.
The parable/testimony distinction (`kind: 'parable' | 'testimony'`, `source`)
renders as a **truth-committing label** — "Picture this…" (openly illustrative)
vs. "A true story" (real, attributed, consented) — never blurred (DR-0076).

## Verification (DR-0076)

Shipped this DR: the `stories` pipeline (`lesson-flow.js` teach.audience +
`ChurchLearn.jsx` render) and L50's first three stories (two light — "The Tenant
Who Never Left" / "The World's Best Cheerleader"; one solemn — "The Chariots You
Could Not See"). New `lesson-flow.test.js` cases: stories reach the teach audience,
carry no facilitator keys, and L50 has ≥2. Every story's cited verse + in-body
Scripture echo verified verbatim (L50 368 quotes, 0 issues; 2 Kings 6:16/6:17
body echoes verbatim). Contrast + legibility guards green (story cards use
themeable Tailwind classes). Full suite green. REV-0187; the Story Library (Layer
2) and the L42/L50 course-split are the tracked next steps.
