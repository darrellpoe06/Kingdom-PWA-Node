---
id: DR-0329
title: Spoken input is captured for MEANING, not transcribed with its typos — and left raw wherever the raw form already works
date: 2026-09-06
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, TRUST-BUT-VERIFY, EXCELLENCE-STANDARD, DECISION-RECORDS]
source: 2026-09-06 — Darrell, mid-build of L128: "my writing is supposed to be fixed also to reflect the meaning not my typos... unless it works... without fixing... does that make sense to you?"
---

## Context

Layer 0 already binds the agent to treat Darrell's spoken teachings as build
input ("Spoken Teachings Are Build Input — Always Add It", 2026-07-03): capture
it, verify every verse, ship it, and tell him what his word became. What that
rule never settled is **how his words are rendered when they are QUOTED back**.

He speaks into this channel raw — voice-note style, mid-anything, on a phone.
That produces two kinds of artifact that are not part of what he said:

1. **Typos and spoken-grammar slips** — `loke` for "like", `studies` where the
   sense is "studied", `because of His Ways are keeping me protected` where the
   sense is "because His Ways are keeping me protected".
2. **Truncations** — a trailing `etc...` or a dangling `if...` where the thought
   completed in his head and the message ended.

Until this session the agent quoted him verbatim, artifacts included. On L128
that produced a quoted span reading *"the same thing His children studies to see
if..."* — which is not what he meant, is not good on the page, and would be read
by a stranger as either sloppiness or mockery. He corrected it directly, and then
asked whether it made sense, which it does.

The tension this rule resolves: DR-0076 forbids fabrication, and a naive reading
of it says quote every character exactly. But faithfully reproducing a phone
typo is not fidelity to the SPEAKER — it is fidelity to the KEYBOARD. The thing
being preserved must be his meaning and his voice, not his thumbs.

## Decision

**When Darrell's spoken words are quoted in any artifact — a lesson, a session
note, a commit message, a decision record, a PR body, a response — they are
rendered for MEANING.**

1. **Fix the artifact, keep the voice.** Typos, spoken-grammar slips and
   truncations are corrected. His vocabulary, cadence, emphasis, capitalisation
   choices and framing are NOT — those are the content.
2. **Unless it works without fixing.** Where the raw form already carries it,
   leave it exactly as spoken. This is the operative half of his instruction and
   it is not a tiebreaker: fragments, run-ons, all-caps emphasis, `etc...` used
   as a real gesture, and idiom are all "works" and stay. The default when in
   doubt is to leave it alone; a cleanup is only made where the raw text would
   MISLEAD or MISREAD.
3. **Never change the claim.** This licenses grammar and transcription repair
   ONLY. It does not license softening a hard statement, sharpening a soft one,
   completing a thought he did not complete, resolving an ambiguity in the
   agent's preferred direction, or improving his theology. Where a truncation
   removes something load-bearing, the fix is to ASK him, not to guess.
4. **Say which spans were cleaned.** Any artifact carrying cleaned quotations
   records that it did, and names the cleanups. On L128 that lives in the gate
   file header and the session note: three spans cleaned, six left as spoken.
5. **This is NOT the Scripture rule and never touches it.** DR-0076 and DR-0210
   are untouched and remain absolute: quoted Scripture is fetched verbatim and
   left EXACTLY as the corpus carries it, down to a typographic apostrophe or an
   emphasis capital. Cleaning applies to DARRELL'S OWN WORDS only. The two live
   side by side in the same lesson and must never be confused — which is why the
   per-lesson verse gates carry his spoken spans on an explicit
   `NOT_SCRIPTURE` allowlist rather than silently exempting them.

## Rationale

Because the point of capturing his spoken teaching is to carry HIM into the app,
and a phone typo is not him (WORD-FIRST, EXCELLENCE-STANDARD). Quoting `studies`
where he meant `studied` does not make the record more truthful; it makes it
less, because a reader now attributes to him a sentence he did not say and
would not defend.

And because the alternative failure is worse in the other direction: an agent
free to "improve" a principal's words will drift them toward its own register.
Hence the narrow scope (grammar and transcription only), the explicit
default-to-raw, the ban on completing an unfinished thought, and the disclosure
requirement — the same shape as every other verification rule in this repo:
the licence is small, bounded, and its exercise is stated in the open where a
reviewer can check it (VERIFICATION-DOCTRINE, TRUST-BUT-VERIFY).

## Consequences

- Applies to every artifact quoting him, not only lessons. The agent no longer
  reproduces phone artifacts into commit messages, PR bodies or session notes.
- The disclosure obligation is real work: an artifact with cleaned quotes names
  the cleanups. L128 is the worked example — `living-lessons-l128-verses.test.js`
  carries the rule in its header, the nine spoken spans on `NOT_SCRIPTURE`, and
  the gate additionally asserts that allowlist is honest (no entry is secretly
  Scripture) and not a dumping ground (every entry appears in the lesson).
- Where a truncation hides something load-bearing, this rule produces a QUESTION
  rather than a guess — one of the few places the agent is required to ask.
- **Open follow-up:** this belongs in Layer 0 beside "Spoken Teachings Are Build
  Input", since it governs how that rule is executed and is exactly the kind of
  thing a context compaction loses. Not folded in yet — DR-0245 fold discipline
  says every byte of `CLAUDE.md` is paid by every session, so the addition should
  be one or two sentences pointing here rather than a restatement.
  **re-review: 2026-09-13.**

## Links

`CLAUDE.md` "Spoken Teachings Are Build Input — Always Add It" (the rule this one
executes), [DR-0076] (verification doctrine — the fabrication ban this does not
touch), [DR-0210] (Yahweh in our voice; never inside a quotation — the same
bright line, on the Scripture side), [DR-0111] (do the work — this DR was written
rather than offered, after the ari-guard blocked an "if you want it" re-ask),
`app/src/__tests__/living-lessons-l128-verses.test.js` (the rule carried in code),
`docs/99-session-notes/2026-09-06-living-lesson-l128-the-prudent-man-studies.md`.
