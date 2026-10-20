# DR-1132: An emailed lesson lands in the app, not in a Claude session — and the lock moves from Google's store to ours

**Date:** 2026-10-20
**Status:** accepted
**Tier:** B (a new NAS reader that writes real lesson rows; no schema change, no money, no lesson text altered, nothing on a timer it does not already share)
**Type:** way

**Area:** `infra/nas-lesson-mail/` (new: `lesson_mail.py`, `install.sh`, `place_lesson_mail_key.sh`), `infra/nas-loops/services.json` (registered, enabled), `scripts/system-flow-registry.mjs` (the rider node), `.github/workflows/ci.yml` (the selftest step), `.github/workflows/loops-health.yml` (the witness now reads this loop), `app/src/__tests__/a-service-comes-home.test.js` (listed on the Way at birth), `app/src/__tests__/the-lessons-email-lands-in-the-app.test.js` (new).

**Grounds:** Darrell, 2026-10-20:

> *"I would like to make sure that the instead of email, instead of Claude looking at the email and having that be the pipeline, why can't we have something inside the app itself be the pipeline for collecting the lessons that come from email?"*

**Principles:** DR-0065 (the app is the primary artifact — default to building in it); DR-1091 (`church_mail.py`, the pattern this is a sibling of); DR-0610 (one teaching, one lesson; both lesson doors run in parallel until the Governor is confident the in-app reader is armed); DR-0545 (refuse an ambiguity rather than guess it); DR-0248 (the deterministic class carries budget + lock); DR-0247 (agreed work starts itself); DR-0076 §3 (proven-to-catch).

## Context

The question had a true premise and an answer better than "build one."

**The app's pipeline already exists, and email was the only lane bypassing it.** Every other way a lesson arrives writes an `agent_inbox` row, and the app's own machinery carries it from there: `lesson-inbox.js` reads it back into "Your lessons" with real states, migration 0252 rings the bell when one waits too long, `lesson_builder.py:1333` picks it up, migration 0237 gates a member's row behind the Governor, and `inbox-lessons-waiting.yml` counts it.

**Email alone went a different way.** `lesson-mail-watch.yml` peeked the inbox over read-only IMAP every five minutes and, on a hit, **commented on pull request #1346** to wake a Claude session, which then read the mail through a Gmail connector and built from it. Three consequences followed, and only of email:

- **Claude was load-bearing.** No session running, no lesson.
- **The words stayed in Google's store** until a session fetched them.
- **The app never saw it** — so it could not appear in "Your lessons", could not ring the bell, and was not in the waiting count. That is why the intake tick can report `0 waiting rows` while a lesson sits in the mailbox.

## What was measured

Measured 2026-10-20.

**The lock had already failed, three times, silently.** The Gmail lane's own brake is a label: *"label the thread Label_22 ONLY after its push succeeds"*, and *"the label on the thread is the lock."* Six threads came back uncaptured from the live query. Run through `scripts/lesson-already-built.mjs` (DR-1024), three of the six were **already built**:

| thread | verdict | the lesson |
|---|---|---|
| Concerns rise over 3-year bachelor's degrees | **ALREADY BUILT** | DR-1115 → `sov42` — the lesson on his screen that morning |
| DeepSeek's free model edged Opus 5 | **ALREADY BUILT** | DR-1114 → `sov41`, matched on timestamp *and* source+day |
| Why the future of capital projects (McKinsey) | **LIKELY ALREADY BUILT** | DR-1116 → `pm13`, source on that day |

All three pushed successfully and **none of their threads was ever labelled**, so that lane re-offered three captured teachings as new. The routine's own record says the near-miss cost: a broken `-label:Label_22` exclusion once returned 12 threads that were every one already captured, and taken at face value *"would have built TWELVE DUPLICATE LESSONS."*

**No duplicate was ever close to being built**, because the catalog check caught all three — but the lock that was supposed to hold did not, and nothing noticed. **A label in a third party's store can silently fail to be written. A tag on the row cannot, because it is written with the work.**

## Decision

**Make email just another writer into the inbox the app already owns.** `lesson_mail.py` reads Darrell's two addresses on the NAS and inserts an `agent_inbox` row tagged `lesson` with `source = 'email'`. Nothing downstream changes, because nothing downstream has to.

**It is a sibling of `church_mail.py` (DR-1091), deliberately.** That reader already brings the church office's mail into the app's own store from the NAS by itself, with the brakes this class needs. Copying its shape beats inventing a second pattern for the same job: read-only `BODY.PEEK` so the mailbox is a source and never a workspace, a PID-checked single-flight lock, per-pass message **and** time budgets inside the installer's 480 s ceiling, progress saved after every message, set-aside-with-a-reason after `MAX_FAILS`, an honest named no-op with no credential, stdlib only.

**Idempotence rides on the row, not on a label.** The Message-ID becomes a `mail:` tag on the row itself, and `filed_tags()` asks the row store what is already filed — reading **tags only**, never a body. A lost state file or a changed `UIDVALIDITY` cannot make a filed lesson look new.

**It refuses rather than guesses.** `agent_inbox.created_by` is NOT NULL and an email carries an *address*. The address → (instance, account) map is a file on the NAS beside the credential, and a sender not on it is **skipped with a reason**. Inventing a uuid to make a row fit is DR-0545's refusal in another form. An audio attachment is **set aside naming the voice lane** (DR-0611) rather than read as text — a recording's words come from Whisper on our own machines, not from this reader guessing at a file it never opens.

**The credential lives where the house already keeps one.** I first invented a secrets-directory path; reading `place_church_mail_key.sh` said otherwise. `LESSON_MAIL_USER` / `LESSON_MAIL_APP_PASSWORD` go in `agent.env`, written only after Gmail itself accepts them over read-only IMAP, never on a command line, never on the screen, never prompting the NAS (`sudo -n`). The placer also **checks the roster and says which half is missing**, rather than leaving the next cycle to report a bare "dormant".

**Enabled, because it self-gates.** `services.json` carries `enabled: true`. That activates nothing: with no credential or no roster the pass prints which is missing and exits **0**. Arming it means the moment the key is placed it works, with no further step from anyone (DR-0247).

**It joins the Way at BIRTH, because the Way's own gate refused it otherwise.** The full suite went red on exactly one case of 27,894 — `a-service-comes-home.test.js`, *"lesson-mail is enabled but on neither list; a new service walks the Way"* (DR-1119). Enabling a loop whose witness has never heard of it is the **hollow** version of walking the Way: the name sits in the manifest and nothing ever says whether it ran. So `loops-health.yml` now reads this loop in the four places it reads every other one — the loop list it judges, the ledger it reads, the installer it checks is on the box, and the cron-log prefix it quotes — and its diagnosis says whether the mailbox credential is in `agent.env` **by name, with `grep -q`, never printing the value**, which is the one fact that decides whether this loop can work at all. DR-0621's "a new workflow joins the flow at birth" is a gate here, not a hope, and it caught me.

**The Gmail watcher STAYS.** I had said I would retire it; I am not, for two measured reasons. Its node writes `gh:signal-pr`, which `lesson-capture` reads (`system-flow-registry.mjs:215-223`), so removing the writer **orphans that resource** and the interconnect guard rejects it. And DR-0610 runs both lesson doors in parallel *"until the Governor is confident the in-app reader is armed"* — this reader cannot run at all until the credential exists, so retiring the working path for an inert one is backwards. **`re-review: 2026-11-20`** — retire the watcher once this reader has completed one real pass, and say so with the run that proves it.

## Impact

**What this buys.** A lesson emailed at 3am becomes a row in our own store within fifteen minutes, visible in "Your lessons", counted by the waiting query, picked up by the builder — with no session running and no Claude in the path. The three lessons whose threads went unlabelled are the argument: that failure mode disappears when the lock is written with the work.

**What this does not do.**

- **It changes no lesson, no schema and no downstream consumer.** It adds a writer to a table that already has several.
- **It does not retire the Gmail lane** (above), and it does not label the three threads that were missed — that is a write to Darrell's mailbox and a separate action.
- **It has never read a real mailbox.** Everything below is the files' discipline and the reader's own logic; the first real datum is the first pass after the credential is placed.
- **The App Password is a value only Darrell can mint**, behind 2-Step Verification on his own account. A genuine DR-0111 §2 carve-out, not a decision and not a must-be-by-hand premise to challenge — everything else installs itself.

## Verification

**`lesson_mail.py --selftest`: 29 checks**, no network and no database, run by the installer **first every cycle** so a reader broken by an edit says so before it touches a mailbox, and by CI as its own step.

**`app/src/__tests__/the-lessons-email-lands-in-the-app.test.js`: 27 cases** — the outside reader, holding what must be true of the *files* from the JS side where CI already runs, because the selftest lives in the same file as the code it checks. The last four hold the witness to this loop, and exist because a gate refused the first version.

**The full suite: 1 failed | 27,893 passed of 27,894 across 1,612 files** — the one failure DR-1119's birth gate, named above and fixed. After the fix, **`a-service-comes-home.test.js` + the new file: 40 passed**, and `npm run verify:gates` green end to end.

`npm run lint` exit 0 · `interconnect-guard`: **208 nodes, 553 connections, 86 workflows + 35 NAS riders all placed, 0 findings** · the whole gate suite (24 guards) exit 0, `business-systems-guard` reading *"ledger whole (newest DR-1132, pointer correct)"* · `ci.yml` parses and the new step's exact command exits 0 from its own working directory · `loops-health.yml` parses, both embedded python blocks compile, and all four step scripts pass `bash -n` · `python3 -m py_compile` clean · `sh -n install.sh` and `bash -n place_lesson_mail_key.sh` clean · `services.json` diff is **6 insertions, 0 deletions** (no reflow of the other 28 services).

**Self-gating proven by running it, not asserting it:**

```
no credential        → "dormant: LESSON_MAIL_APP_PASSWORD not set in … (honest no-op)"   EXIT=0
credential, no roster → "dormant: no roster … a row needs a real instance and account;
                         one is never invented"                                          EXIT=0
```

**Proven to catch:**

| what was done | what went red |
| --- | --- |
| an unmapped sender attributed by inventing a uuid | **3**, including "an empty roster files nothing" |
| an audio attachment read as text instead of set aside | **2**, including "and it names the voice lane" |
| the time budget removed | **1** |
| `env_value`'s definition deleted with the call left in | **1** — "every function main() calls is defined in this file" |
| the services-sync entry disabled | **1** |
| the reader made to poke the signal PR again | **1** |
| the single-flight lock call removed | **1** — *after* the gate was fixed; see below |
| `lesson-mail` struck from loops-health's loop list | **1** — the witness stops asking after it |
| the witness pointed at church-mail's in-repo `out/` path | **1** — the path error I actually made |
| the credential check deleted from the diagnosis | **1** |
| `lesson-mail` struck from the Way's loop list | **2**, one of them DR-1119's own birth gate |

**Three false greens of my own, all the shape this record is about.**

1. **The selftest passed while `main()` was broken.** I called `env_value()` having borrowed the name from `church_mail.py` **without porting the function**. The selftest exercises the pure logic and never touches `main()`, so it went green — and on the NAS the first real pass would have died with a `NameError` after a clean install and a clean selftest. The selftest now walks `main()`'s own call graph and asserts every name resolves; deleting `env_value` makes it fail.
2. **My new outside gate passed with a brake deleted.** Replacing `if not take_lock():` with `if False:` left `def take_lock` and its message intact, and my case checked the *text*, not the *call*. Found only by breaking it. It now pins the call site, plus one case asserting **every** brake is called rather than merely defined — the same defect as DR-0748's exact-line import assertion, and the reason proven-to-catch exists at all.
3. **I pointed the witness at a file nothing writes.** Wiring `loops-health.yml` I copied church-mail's state path, `$REPO/infra/nas-church-mail/out/...`, into the lesson-mail reading. This reader keeps its state under `LESSON_MAIL_HOME` (`/volume1/PoeTech/lesson-mail`), the way `lesson-voice` and `db-backup` do — the installer says so on its own line. **A witness aimed at the wrong file does not fail; it reports "no ledger" forever,** which reads exactly like a loop that has never run, and would have been believed. Caught by reading the installer instead of trusting the sibling it was copied from, and now pinned both ways: the right path must be present and the copied one must be absent.
