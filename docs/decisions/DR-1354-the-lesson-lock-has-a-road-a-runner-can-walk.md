# DR-1354: The lesson lock has a road a runner can walk — the label was never missed, it was never reachable

**Date:** 2026-11-06
**Status:** Accepted
**Tier:** A (one dispatch-only workflow and its pure helper, both new; no product code, no schema, no money, no reader-facing text. It writes one allow-listed Gmail label and nothing else.)
**Type:** ways-review
**Declared by:** DR-0312 (the Gmail-lesson-intake Way, which has always said to label the thread) and DR-0108 (the order of roads: a runner over the tailnet first, a hand last), applied to the one step of that Way that had no road.
**Area:** `.github/workflows/lesson-mail-label.yml` · `scripts/gmail-thread-label.mjs` · `app/src/__tests__/the-lesson-lock-has-a-road.test.js`
**Found by:** trying to set the lock on pm14's thread after its deploy proved, and getting `MCP tool call requires approval` — for the second time in one session.
**Narrative:** [docs/99-session-notes/2026-11-06-the-lesson-lock-has-a-road.md](../99-session-notes/2026-11-06-the-lesson-lock-has-a-road.md)
**Considered, not built:** asking Darrell to approve each label write — rejected; it is the thing that failed for weeks. See Decision 1.
**Pairs with:** DR-0312 (the Way), DR-0108 (the order of roads), DR-1250 and DR-1270 (the ledger sweep that has been carrying this load alone), DR-0672 (the Your lessons screen reads these locks), DR-0076 (§3 proven-to-catch, §4 measure don't claim)

## Context

The intake Way's own words: a thread is labelled `Lesson-Captured` only after its lesson ships. Measured today: **that label had never been set on a single built thread.** It read as a long-standing oversight. It is not one.

The only road to it was a connector write that stops for a human approval **every time**. An unattended hourly lane cannot take that road, and the lock is exactly what an unattended lane needs. So the step was unreachable by the thing that was supposed to perform it, and nobody noticed because a different mechanism was silently covering for it.

## What was measured

**The intake query returns 28 unlabelled threads, and the ledger sweep says 7 of them are already-shipped lessons** — `1a18262cf26c9f77` (DR-1295), `1a164afce3d5ed0b` (DR-1332), `1a163d3dfa9641dc` (DR-1338), `1a163d000aaa1023` (DR-1325), `1a163a78c1d14d84` (DR-1322/1325/1332), `1a15f24a9e2291c3` (DR-1193), `1a15f615725825be` (DR-1192). Every duplicate that did not get built was prevented by `lesson-row-shipped-sweep.mjs` reading the ledger, not by the lock.

**A road already existed and was one line from being usable.** `lesson-mail-watch.yml` holds `GMAIL_WATCH_APP_PASSWORD` and reads this mailbox over IMAP every five minutes, declaring itself peek-only. **In Gmail's IMAP a label is a folder**, and `UID STORE … +X-GM-LABELS (Lesson-Captured)` adds one. The credential that reads could always have written the lock.

**The conversion is the part that fails silently.** A Gmail API thread id is hex (`1a163d58a4d068b6`); IMAP's `X-GM-THRID` is the same number in decimal (`1879757345405298870`). That value is past `Number.MAX_SAFE_INTEGER`, so `parseInt(id, 16)` **rounds**, and a rounded thread id matches no message and raises no error — which reads exactly like "already labelled". Nothing would ever have been set, and the run would have looked clean.

## Impact

A safeguard that cannot be reached by the process it guards is not a safeguard; it is a note. Worse, it was load-bearing in the documentation while something undocumented carried the weight, so the real protection (the ledger sweep) looked like belt-and-braces when it was the only belt.

This also removes a standing paste from Darrell's hands, which DR-1159 calls a Ways finding rather than a delivery.

## Decision

**1. The lock is set from a runner, not a hand.** `lesson-mail-label.yml` is dispatch-only (no schedule, so not the timer-driven class DR-0247 governs), carries a concurrency group and a timeout, writes **only** `Lesson-Captured` or `Lesson-Published` — `assertLabel` refuses anything else — takes at most 10 threads per run, and is idempotent. Asking for an approval per write was considered and rejected: that is precisely what failed.

**2. It mutates nothing but the label, and proves the mutation.** No delete, move, expunge or trash; it selects `[Gmail]/All Mail` rather than Inbox (a forwarded thread is often already archived, and Inbox would find nothing and look like success); it **reads the label back** instead of trusting `STORE`'s own word; and it exits non-zero when a thread is not found, so a silent miss cannot read as done. It prints thread ids and counts only — never a subject, never a body.

**3. Dormant without the secret, honestly.** No secret means a clean exit that says so and claims nothing.

## Verification

**18 cases green**, offline — the id conversion, the label allow-list, the IMAP plan, and the workflow's own narrowness, all without a mailbox.

**Proven to catch the defect that would have made this silently useless.** Replacing `BigInt` with `Number.parseInt` in the conversion turns **4 cases red**; file restored and verified byte-identical with `cmp`. The three thread ids in the fixtures are the real ones measured from the live mailbox, not invented.

**Two defects in my own checks, fixed rather than tolerated**, both recorded in the test file: a `new RegExp("uid('COPY")` that threw *Unterminated group* (a check that cannot run is not a check), and then a scan that matched the word "trash" inside this workflow's **own comment promising it never trashes anything** — the same false positive removed from the DR-0719 teacher registry hours earlier. It now scans the code with comment lines stripped. An occurrence count was also pinned at 4 without measuring (it is 3) and removed as brittle.

**Not yet exercised against the live mailbox:** `workflow_dispatch` needs the workflow on the default branch, so the first real run happens after this merges. The three threads waiting for it are pm14 `1a163d58a4d068b6`, sov69 `1a16401bf7c5898d`, ll283 `1a164aff48fa13de` — all merged and deploy-proved. `re-review: 2026-11-13` — confirm the live run set all three and that the intake query's unlabelled count falls by three.

---
_Generated by [Claude Code](https://claude.ai/code)_
