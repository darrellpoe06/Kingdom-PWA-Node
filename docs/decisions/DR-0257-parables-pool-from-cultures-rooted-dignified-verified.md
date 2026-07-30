---
id: DR-0257
title: Parables pool from the world's cultures — rooted, dignified, verified
status: accepted
date: 2026-07-30
tier: B
declared_by: Darrell
supersedes: none
builds_on: [DR-0215 (parable vs testimony labels), DR-0076 (no fabrication), DR-0098 (Word-first, no debate-staging), DR-0100 (three-tier honesty), DR-0190 (attribution), DR-0216 (comprehensive lessons)]
principles: [COMMUNITY-FIRST-MISSION, WORD-FIRST (DR-0127), SOURCE-OF-ANSWERS]
---

## Context

Darrell, 2026-07-30:

> "can our parables pool from cultures also so it feels more authentic?"

The Living Lessons parables (mandated 2026-07-21 — "short stories like Jesus
did parables... at least 2 to each 25-minute lesson"; truth-labels governed by
DR-0215) are original fiction, and to date their settings have defaulted to
setting-neutral Americana: a bakery, a locksmith's shop, a piano teacher, a
family farm. Warm and true — but drawn from one narrow well.

## Decision

**Yes — the parable pool draws deliberately from the world's cultures.** Two
grounds make this fidelity, not decoration:

1. **It is the Master's own method.** Jesus' parables were culturally
   SITUATED — vineyards, shepherds, day-laborers, Galilean weddings, the
   exact textures of His hearers' world (Matthew 13:34). A parable rooted in a
   real culture's daily life is closer to the form He used, not further from it.
2. **It is who the platform serves.** COLG — a historically African American
   congregation — is the first community, and the Body the lessons teach is
   "out of every kindred, and tongue, and people, and nation" (Revelation 5:9,
   the celebrated-diversity frame already taught in L47). Stories should sound
   like the whole household.

## The rails (binding)

- **Dignity, not costume.** A cultural setting is rendered with specificity
  and honor — real places, real trades, real rhythms — never caricature,
  stereotype, or dialect-mimicry. The culture is the home the story lives in,
  not a prop it wears.
- **Openly illustrative stays openly illustrative (DR-0215).** A parable set
  in Accra or Seoul or San Juan is still "Picture this" — it is never passed
  off as a real event, a real person, or an authentic folk tale.
- **No fabricated provenance (DR-0076).** Never invent "an old African proverb
  says…" or attribute a saying to a real culture, tribe, or tradition without
  verification. A real cultural proverb may be quoted only when verified and
  attributed; when it cannot be verified, write the truth in our own words
  with no borrowed authority.
- **The Word stays senior (DR-0098).** Cultural wisdom serves as witness,
  never co-authority; no imported spiritual frameworks (ancestor veneration,
  karma, fatalism) ride in as truth. The anchoring verse governs the parable,
  exactly as the `verse` field already requires.
- **Broad by default, tokenized never.** Across the library the settings
  deliberately range — West African market life, African-American church and
  family life, Caribbean, Latino, Asian, Middle-Eastern agrarian (the Bible's
  own soil), European, American rural and urban — chosen because the lesson's
  point LIVES well there, never as a quota checkbox.

## Increments

1. **This session:** exemplar shipped — a culturally-rooted third parable on
   L69 ("The Market Queen of Makola," Accra market stewardship, Luke 19:17),
   plus the authoring guidance recorded beside the modules array in
   `app/src/lib/living-lessons-class.js` so every future session inherits it.
2. **Standing:** every new captured lesson draws its parables from the pool by
   default; existing lessons pick up cultural range as they are revisited
   (DR-0075 perpetual improvement — no big-bang rewrite).

## Enforcement note (honest scope)

The dignity/authenticity judgment is editorial and is NOT CI-gatable; what the
machine holds is the DR-0215 kind-labels (existing no-leak/label tests), the
Scripture-verbatim gate (living-lessons verses test), and the no-bare-stat
attribution gate. The rails above are the standing editorial standard the
agent applies and the Governor reviews.
