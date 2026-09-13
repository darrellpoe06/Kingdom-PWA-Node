# DR-0375 — Ask the live database about any function, and reject the argument rather than escape it

**Date:** 2026-09-13 · **Status:** accepted · **Tier:** B · **Area:** infra · **Principles:** VERIFICATION-DOCTRINE, REVIEW-OUR-WAYS, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

No one asked for this. It comes out of DR-0374, where I made a false measurement and then had to correct a merged decision record: I read `crm_capture_lead`'s pipeline allowlist off the **hosted** Supabase project and wrote it up as the state of the live database. `infra/nas-supabase/REPOINT-ARMED` is committed, so the app runs on the **sovereign NAS** stack.

Per DR-0108, the way is reviewed, not just the bug. The way here was already half-built: `sovereign-read.yml` and `scripts/sovereign-read-over-tailnet.sh` landed 2026-09-12 for this exact blind spot — *"ask the database the app actually reads."* It did not help me, and the reason is worth naming.

## Why the existing instrument did not prevent it

Its `definitions` mode carried a **hard-coded list of seven** church and property function names. `crm_capture_lead` was not among them, and there was no argument to ask about anything else. Asking a new question required editing the script, opening a PR and merging it — so in practice **nobody asked**, and the default path stayed the hosted mirror that answers instantly and wrongly.

An instrument that only answers seven pre-chosen questions is not a general answer to "which database is this claim about." That is the defect, not my carelessness alone.

## Decisions

1. **`functions` is an argument.** `sovereign-read-over-tailnet.sh definitions [functions]`, surfaced as a `workflow_dispatch` input. Blank keeps the standing seven, so every existing use is unchanged.

2. **The argument is REJECTED, never escaped.** It is a caller-supplied string that ends up inside a SQL `IN` list, on a database reached by ssh with admin credentials. It is validated against `^[a-z0-9_]+(,[a-z0-9_]+)*$` before it touches any SQL. That character class cannot express a quote, a space, a semicolon or a comment marker, so there is no string a caller can pass that closes the list and starts a statement. Anything else exits 2 and reads nothing — no partial answer.

3. **Validation sits ahead of the `NAS_SSH_KEY` check**, so a rejected argument provably touches no network. Pinned by test.

4. **`bash`'s `[[ =~ ]]`, not `grep -Eq`.** This is the part worth keeping. The first implementation used `grep`, and **the test caught a real bypass**: `grep` matches line by line, so `crm_capture_lead\nSELECT 1` passes on its first line while carrying a second line behind it. In `[[ =~ ]]` the anchors bind the whole string. The tests **run the script** rather than reading it, which is the only reason that surfaced (DR-0076 §7 — an independent method, not a re-read of the code).

5. **The answer reports `md5(prosrc)` per function.** This is the drift check the whole class needed: an identical md5 on hosted and sovereign **proves** the two definitions are byte-identical, where *"db-migrate exited 0"* only reports that a script ran. It is cheap, it leaks nothing, and it converts a workflow's word into a comparable measurement.

6. **A function the database does not have is NAMED** (`---MISSING---`), because an empty result and a healthy result must not look alike. Silence never reads as fine.

7. **The trap is written where the next reader meets it.** `REPOINT-ARMED` now states plainly that while it exists the hosted project is **not** the live database; that schema is kept in step by `db-migrate` so a *definition* read from hosted is sound; and that **data is not replicated**, so counts, history and "has this ever happened" from hosted are false measurements. Definitions yes; counts no.

## Proof

- 19 new tests in `sovereign-reader-functions-arg.test.js`, ten of them hostile arguments, each **executing the real script** and requiring exit 2 with no network contact.
- **Proven-to-catch, and it caught something I actually shipped into the working tree**: the `grep` implementation failed the newline case on the first run. That is a gate earning its keep on its first day rather than a green check that means nothing (DR-0076 §3).
- The existing `sovereign-reader-guard.test.js` (12 tests) still passes unchanged — the confidentiality and masking guarantees are untouched.
- `npm run verify` green.

## Not done / open

- **The instrument has not been dispatched against the sovereign database.** It is dispatch-only by design and this sandbox cannot join the tailnet; the run belongs to a GitHub runner. The first real use is the one DR-0374 needs — `definitions` with `crm_capture_lead`, comparing `source_md5` against the hosted value — which would close DR-0374's remaining gap by measurement rather than by the replay step's word. **re-review: 2026-09-20.**
- **Only `definitions` mode takes the argument.** The same "ask about something the script was not built to name" limit still applies to `feedback` mode and to every other proof in this repo that reads hosted. DR-0368's re-review already tracks that wider question and is not duplicated here.
