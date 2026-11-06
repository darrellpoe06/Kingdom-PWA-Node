# DR-1355: A dormant road is not a road, and a green run that did nothing is a lie

**Date:** 2026-11-06
**Status:** Accepted
**Tier:** A (one dispatch-only workflow's exit path, three prose corrections, one rewritten case; no product code, no schema, no money, no reader-facing text)
**Type:** correction
**Declared by:** DR-0076 §8 (provenance, and honest uncertainty) against my own record, after the first live dispatch of the thing DR-1354 shipped.
**Area:** `.github/workflows/lesson-mail-label.yml` · `scripts/gmail-thread-label.mjs` · `app/src/__tests__/the-lesson-lock-has-a-road.test.js` · DR-1354 and its session note
**Found by:** dispatching `lesson-mail-label.yml` on three threads, minutes after DR-1354 merged, and reading what the run actually printed.
**Narrative:** [docs/99-session-notes/2026-11-06-the-lesson-lock-has-a-road.md](../99-session-notes/2026-11-06-the-lesson-lock-has-a-road.md)
**Considered, not built:** leaving the dormant exit at 0 and relying on the log line — refused; see Decision 2.
**Pairs with:** **DR-1354** (the record this corrects), DR-0076 (§8 provenance, §3 proven-to-catch), DR-0108 (the order of roads), DR-0312 (the Way whose lock this is), DR-1159 (a paste handed for a value a runner could fetch is a Ways finding)

## Context

DR-1354 built the capture lock a road and said the credential for it was already in place: *"`lesson-mail-watch.yml` holds `GMAIL_WATCH_APP_PASSWORD` and reads this mailbox over IMAP every five minutes… The credential that reads could always have written the lock."*

The first live dispatch — three threads named explicitly — printed `label road dormant: GMAIL_WATCH_APP_PASSWORD not set (honest no-op, nothing claimed)` and **exited 0**.

## What was measured

**The secret has never been set, and I never checked.** Confirmed independently of the dispatch, against the watcher's own history: every `lesson-mail-watch.yml` run prints `watcher dormant: GMAIL_WATCH_APP_PASSWORD secret not set (honest no-op)` and completes **success**. The five most recent (2026-11-05 08:24 through 2026-11-06 09:31) are all green and all dormant. So the watcher has never read this mailbox either — it has been a green no-op since DR-0312.

**The mechanism is still right.** `+X-GM-LABELS` adds a label, `X-GM-THRID` wants decimal, the `BigInt` conversion and the allow-list are all tested and unchanged. What was wrong was one claim about a key.

**I read the workflow's CODE and reported a credential that exists in form and never in fact** — inside a record whose entire subject is a road that looked usable and was not. The same error, one layer down. DR-0076 §8 asks for provenance on exactly this kind of claim, and `grep GMAIL_WATCH_APP_PASSWORD` is not provenance that a secret is *set*.

## Impact

Two of the three roads in DR-0108's order were closed, not one. The connector stops for a human approval; the runner road has no key. So the lock is still unset, and the thing that has actually been preventing duplicate lessons is still `lesson-row-shipped-sweep.mjs` alone — which is what DR-1354 measured and remains true.

**And the run went green.** A dispatch that was handed three thread ids and labelled none reported success. The log was honest and the exit code lied, which is worse than a silent failure, because the lane's own signal said the work was done.

## Decision

**1. The three prose claims are corrected in place** — the record, the session note, and the two file headers now say the mechanism existed and the key never did, and name this record as the correction. DR-1354 is not rewritten away: the false sentence is quoted and marked false, so a reader meets the error and its correction together.

**2. A dormant run that was asked to label threads now exits 1**, with a message naming the label, the number of threads that got none, where the secret comes from, and that `lesson-mail-watch.yml` needs the same one. Relying on the log line was considered and refused: `thread_ids` is a required input, so reaching that branch always means somebody asked for N locks and got none. The plan is parsed *before* the secret check so the message can count them.

**3. What is now blocked on a value only Darrell holds** (DR-0089's second carve-out): a Google App Password at `https://myaccount.google.com/apppasswords`, stored as `GMAIL_WATCH_APP_PASSWORD`. It unblocks both mail workflows at once.

## Verification

**19 cases green.** The honesty case is rewritten rather than extended: it used to require the words "dormant" and "nothing claimed" and called that honest, which is the same mistake in miniature — reading the message and ignoring the status.

**Proven to catch.** Restoring `sys.exit(0)` in the dormant branch turns **2 cases red** (`the dormant branch must exit non-zero`, and the thread-not-found case that shares the exit path); file restored and verified byte-identical with `cmp`.

**Not yet exercised against the live mailbox, and now honestly so:** the next dispatch will fail loudly instead of passing quietly until the secret exists. `re-review: 2026-11-13` — once it is set, dispatch on pm14's, sov69's and ll283's threads and confirm the unlabelled count falls by three.

---
_Generated by [Claude Code](https://claude.ai/code)_
