# DR-1505: The Kids Zone's games read the Word, and Ari reads child mode

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** B (child-facing; no schema, no auth, no RLS, no money; nothing written about a child)
**Type:** decision
**Area:** `app/src/lib/kids/word-builder.js` (new), `app/src/lib/kids/who-am-i.js` (new), `app/src/lib/class-tutor.js` (the child-mode block), `app/src/__tests__/kids-word-builder.test.js`, `kids-who-am-i.test.js`, `class-tutor-child-mode.test.js` (new); the design proposal in `docs/design/love-corner-kids/` and the session note `docs/99-session-notes/2026-11-13-kids-zone-phases-d-e-audit-and-illustrated-proposal.md`
**Sent in by:** Darrell, 2026-11-13: take ownership of Phases D and E of the Love Corner redesign; *"Develop the Word Builder and Who Am I? Bible games"*; *"Preserve all existing lessons, Scripture content, AI functionality"*; show the design before implementing major visual changes; and, mid-review, *"I want our Black children to open this app and see themselves represented."*
**Pairs with:** DR-1456 (the Youth Zone, Phase 2), DR-0431 (Little Learners and the child-mode flag), DR-0076 (verification; verses verbatim), DR-0093 (no public child profile), DR-0061 (reality-trace before building), DR-1483 / DR-1484 (Phases A to C of the shell redesign)

## Context

The 2026-11-13 shell audit (§2.6) measured that `LITTLE_LEARNERS_TUTOR_META.childMode` has existed since DR-0431 and was never read: only its `intro` and `posture` prose reached the prompt, so a child-facing tutor carried its child rules as a suggestion in a sentence, not as a block the test could pin. The same audit's Phase E named two games for the Kids Zone that did not exist, with one rule: verses verbatim.

Darrell's brief set its own gate for the visual work: show the proposed design before implementing. That gate is honored (the six screens and the cast are in `docs/design/love-corner-kids/`, held on the PR). What does not depend on the visuals is built here: the two games' engines and the tutor's child mode, each proven.

## Decision

1. **Nothing in a game types a word of Scripture.** The Word Builder is handed the weekly verse's words by its caller, which loads them from the hosted King James text at play time (`verseText`); every word the child spells is one of those words, in verse order, four letters or more, once each. The Who Am I? roster carries only REFERENCES (three per person, hardest first); the verses load at play time and the only change on screen is the person's own name blanked while the child guesses, then shown whole.
2. **A clue that does not name its person cannot ship.** `kids-who-am-i.test.js` opens every clue reference in the in-repo KJV and asserts the name is in the verse as a whole word, for all 24 people and 72 references, and asserts the gate trips on a verse that does not (Genesis 1:1 does not name Noah; "Jonahs" is not "Jonah").
3. **The week's seed replays the same game on every device.** The shuffle is mulberry32 over the ISO week (`weekIndex`), so the letters, the phrase order and the four name choices are the same all week and change on their own with the calendar. A scramble is never the word itself; a shuffled verse is never in order.
4. **Stars are the round's alone.** Four for a word spelled with no hints, one fewer per hint, never below one; three, two or one for a person named on the first, second or third clue. Nothing is written about anyone: no play log, no record, no leaderboard (DR-0093). A wrong tap says "not yet" while a clue remains, never "wrong".
5. **Two forms, one engine.** Kids: spell one word from its shuffled letters with the verse as the hint. Teens: put the verse's phrases back in order (cut at the verse's own punctuation), then spell its longest word with no hint.
6. **Child mode is a structural block in the prompt.** `tutorSystemPrompt` reads `courseMeta.childMode === true` and inserts `CHILD_MODE_RULES`: short sentences; only the lesson and its verses; anything else to a grown-up; never a link, address, phone, email or meeting; never ask for name, age, school, address, photo or whereabouts, and never keep one offered; nothing scary, violent or romantic; always a grown-up at home or church, who can see what was said. A Living Lesson read at the Kids door passes a meta marked `childMode: true` and gets the same block.

## Verification

- `kids-word-builder.test.js`, 10 green; `kids-who-am-i.test.js`, 32 green; `class-tutor-child-mode.test.js`, 4 green. Neighbours green: `class-tutor.test.js` 6, `youth-zone.test.js` 11, `youth-zone-render.test.jsx` 8 (71 of 71 together).
- **Proven to catch (DR-0076 §3):** the clue gate trips on a verse that does not name its person; the child-mode test asserts every rule present with the flag on and every rule absent with it off or with no meta at all; the scramble test runs 200 seeds and asserts none equals the word.
- Lint 0 warnings on the new and changed files; `file-budget-guard`, `decision-citation-guard`, `module-boundary-guard` OK.
- **Not done here, by Darrell's own gate:** no surface mounts these engines yet, and nothing under `components/` changes. The Kids Zone shell, the art components and the game surfaces are Phase D1 and E1/E2, built once the screens are approved; the PR carries `hold`.
- `re-review: 2026-11-20` — the approval of the screens, or what to change.
