# DR-1249: The refusal says what it received — four teachings waited a hundred hours behind an undiagnosable sentence

**Date:** 2026-10-27
**Status:** Accepted
**Pairs with:** DR-1232 (the handed-back rows say why), DR-0669 (the NAS lesson builder; never a body), DR-1219 (readiness is not production), DR-1042 (the measurement that could not be reached), DR-0621 (hold the hand of the process)

## Context

Twelve teachings were waiting for the intake, the oldest **110 hours**, with **0 shipped in the window**. The `lesson-builder-health` witness called it correctly and in its own words:

> **DARK-IN-EFFECT: the loop is READY AND PRODUCING NOTHING** … Readiness is not production: every writer can be ready while every build fails the gate

Everything that answers "can it build" answered yes: the unit `active`, the builder's code hash identical to the repo's, the `claude` CLI present (2.1.284) and signed in, the primary `cli-local` writer `ok: true`, the push credential present, `state: ready`, `why: armed by record`. Asked **right then** with the builder's own flags, the writer returned `exit=0`, one valid JSON document, `is_error=False`, `api_error_status=None`, `result="ok"`.

So the loop was not broken in any way its readiness checks could see. The failures were per-row, and the probe (DR-1232's per-row gate verdict read) showed they were **not one cause but five**:

| cause | rows | shape |
| --- | --- | --- |
| session limit, `HTTP 429 … resets 2am (America/Winnipeg)` | 3 | fails in ~1.4–1.6s |
| OAuth refresh race, `another Claude Code process is refreshing it` | 2 | fails in ~8.6s |
| the builder's own clone: `could not lock config file .git/config: File exists`, and a fetch that could not update a local ref | 3 | `RuntimeError` |
| `unreadable reply: Expecting ',' delimiter: line 1 column 56241 / 72632` | 2 | ~700s, then a truncated reply |
| real content faults — `not-the-verse Matthew 10:8`; `not-the-verse Judges 2:13` + **`voice failed (lesson: capitalises Baal)`** | 2 | the gates working exactly as intended |

Only **two** of twelve had anything wrong with the teaching. The typography gate catching a capitalised `baal` is this repository's own binding rule being enforced by machine, which is the system working.

And then **four rows** whose entire recorded reason was one sentence:

```
structure failed (verdict must be lesson | test-only | not-a-lesson)
```

## What was measured

That sentence cannot be acted on from outside the box, and that is the finding.

It cannot distinguish between three different defects: a writer that used a word outside the three; an object that arrived with no `verdict` field at all (a truncated reply, which two *other* rows prove is happening); or `extract_json()` locking onto the first balanced `{` in a preamble and returning the wrong object entirely.

The obvious explanation was checked and **ruled out**: `lesson_writer.py:170-171` does offer all three words to the writer, `"lesson"` / `"test-only"` / `"not-a-lesson" (nothing to teach)`. (Measured carefully, because a first reading of a single grep line showed only two of the three and suggested a prompt/gate contract gap — the continuation line was cut off. There is no contract gap; nothing was changed on the strength of that misreading.)

With the prompt exonerated, there was nothing further to read. The only remaining place the cause is written down is the row's **body** — and that is the one place this system must never look (DR-0669, "never a body"). A gate whose refusal does not name what it refused sends its reader at the one door that is locked for good reason, and **four teachings sat behind it for roughly a hundred hours**.

## Impact — what this obligates, and the limits named rather than left

- **This does not ship a lesson by itself.** It makes the next failure legible. Four rows will fail again on the next build and will say which of the three defects they are; that is the step that was missing, not the fix for all twelve.
- **The other four causes are named and not addressed here.** The session limit is the account's own and clears on its clock; the OAuth race has a partial fix already (DR-1232 serialised the writer to one call at a time) and recurred anyway; the `.git/config` lock and the truncated reply at ~56–72KB are both real and both separate work. Naming them without fixing them is deliberate — this record is the diagnostic that tells the next pass which of them is still live, and a blind fix for five causes at once would be exactly the guessing DR-0076 forbids. `re-review: 2026-11-03`.
- **What is printed is schema, never content.** The received `verdict` is an enum-shaped field, bounded to 40 characters in case the writer put prose in it; the object's **key names** are its shape, not a person's words. No value from any other field is printed, and a case asserts that a planted sentence in `bigIdea` does not appear in the message.
- **Honest limit:** the key list is capped at 14 names, so a very wide alien object is reported by count plus the first names alphabetically. The count is what matters for telling a thin object from a full one.
- **Not claimed:** that this identifies which of the three defects is actually occurring. It does not. It makes the next run say so.

## Decision

`schema_problems()` names what arrived when the verdict is not one of the three words: the received value (`repr`, bounded to 40 characters, so `None` is distinguishable from `''`), the number of keys the object carried, and up to 14 of those key names.

The key list is the discriminator. A full lesson object that merely used the wrong word shows `title`, `slug`, `benefits` and the rest; a truncated or wrongly-extracted object shows a short or alien list. One sentence now separates the three cases that one sentence used to hide.

Nothing else moves: the three accepted words, the early return, and the prompt are untouched.

## Verification

- `python3 -m unittest test_lesson_builder` — **112 tests, OK** (111 existing, 1 added covering seven assertions).
- **Proven to catch (DR-0076 §3):** restoring the old silent message reddens the suite with *"\"'not a lesson'\" not found in 'verdict must be lesson | test-only | not-a-lesson'"*. Restored, green.
- The case pins all three discriminations: a wrong word is quoted; a missing field reads `None` and an empty one reads `''`, so they are not confused; a thin object reports `2 key(s)` with `foo` and **without** `title`, while the full object's message does contain `title`.
- The never-a-body rule is asserted, not assumed: `bigIdea` is set to a planted sentence and the message is checked not to contain it.
- A 400-character verdict yields a message under 300 characters, so a prose-stuffed field cannot turn a refusal into a dump.
- All three valid words still produce no verdict problem.
