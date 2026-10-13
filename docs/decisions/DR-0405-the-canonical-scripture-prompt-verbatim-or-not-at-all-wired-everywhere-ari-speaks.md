# DR-0405 — The canonical Scripture prompt: verbatim or not at all, wired everywhere Ari speaks

- **Status:** accepted
- **Tier:** B (how the platform's A.I. handles the Word — user-facing, doctrine-adjacent)
- **Date:** 2026-09-14
- **Scope:** `app/src/lib/scripture-prompt.js` (new), `app/src/lib/ari.js` (`ARI_PERSONA` folds it in), `app/src/__tests__/scripture-prompt.test.js` (new)
- **Principles:** APP-IS-PRIMARY (DR-0065), VERIFICATION-DOCTRINE / no fabrication (DR-0076), WORD-FIRST, SOURCE-OF-ANSWERS, DECISION-RECORDS (DR-0011)
- **Grounds:** `docs/00-foundations/_root/SCRIPTURE-REFERENCE-STANDARD.md` (the verbatim gate + citation pattern), CLAUDE.md (Typographic Theology, "Teach the Word, Do Not Debate It", Source of Answers)

## The report

Darrell, 2026-09-14: *"What is our biblical scriptures prompt... what are the best ones?"* — then, when the agent surveyed options instead of acting: *"Build it... of course.... why asking?"*

## What was actually wrong, traced (not guessed)

Read end-to-end: the live tutor prompt is `class-tutor.js` → `tutorSystemPrompt` → `ari.js` → `ariSystemPrompt` → `ARI_PERSONA`. `ARI_PERSONA` (ari.js) carried the persona and one Scripture-relevant line — *"Capitalize references to God… Never capitalize the adversary"* — and **nothing that stopped the model from paraphrasing or inventing a verse.** So any A.I. answer that touched the Scriptures could put quotation marks around words that are not in the text. That is the exact fabrication the SCRIPTURE-REFERENCE-STANDARD verbatim gate and DR-0076 forbid for *lessons*, but the rule was never told to the *live tutor*. The best of our practice existed (sov9/sov10 Word-first, the verbatim gate) — it was simply never gathered into the prompt the A.I. actually speaks from. "Get it from our historical institution systems" — it was there; it wasn't wired.

## Decision

**A single canonical `SCRIPTURE_PROMPT`** (scripture-prompt.js) — a pure, testable, NAS-identical constant — gathers the best of our practice into the one instruction every A.I. surface carries:
1. **Word first** — the passage leads; Scripture explains Scripture; teach what the Word shows, do not stage man's disagreement as equal to the text (CLAUDE.md "Teach the Word, Do Not Debate It").
2. **Never invent or paraphrase a verse** — a quotation mark around Scripture is a claim the words are exact; if not certain, give the reference and say plainly it is not being quoted from memory.
3. **His name in our voice, the translation in the quote** — say "Yahweh" for the Father in our own words; never substitute "Yahweh" into a quotation.
4. **Capitalize** references to God; never the adversary.
5. **Honest where the Word is reticent** — teach what is written and stop; flag real uncertainty.

It is **folded into `ARI_PERSONA`** (not appended in `ariSystemPrompt`), which preserves ari.js's composition contract exactly — `ariSystemPrompt('') === ARI_PERSONA`, persona still first — so **every surface Ari speaks on** (the class tutor, the reading voice, the Council Chamber) now carries it, app-wide, from one source (DR-0079 one canonical primitive per axis). The prompt itself quotes **no** verse — a prompt that quoted Scripture from memory would break its own rule.

## Verification (proven-to-catch)

`scripture-prompt.test.js`: pins the five load-bearing rules; asserts the prompt carries no `Book Chapter:Verse` citation and no capitalized adversary name; and — the wiring half — asserts `ARI_PERSONA` contains it, `ariSystemPrompt('') === ARI_PERSONA` still holds, and the real `tutorSystemPrompt` output carries "WORD FIRST" and "NEVER INVENT OR PARAPHRASE A VERSE". Remove the fold from `ari.js` and the wiring assertions fail. Lint clean; ari + tutor + sovereign-tutor suites green.

## Limits, stated

- A prompt **instructs**; it does not machine-verify a live model's output the way the lesson verse-gates do. For authored, shipped content the verbatim gate remains the proof; this closes the *live-A.I.* gap the gates never covered.
- Concurrency: minted DR-0405 off `origin/main` (its Next ID); a concurrent Learn-flow full-width/refs branch is also minting in this range, so renumber-on-merge per DR-0052 reconciles whichever lands second.
- Not changed: the NAS-side model still generates the words; this raises the floor of what it is told, which is where the fix belongs.
