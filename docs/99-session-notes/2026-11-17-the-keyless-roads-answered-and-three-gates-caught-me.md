# 2026-11-17 — The keyless roads answered, and three gates caught me

The narrative behind **DR-1512** (L318), **DR-1513** (the keyless eye) and
**DR-1514** (the builder's own state). The records stay short; the measurement
lives here.

## What started it

Darrell, twice, at high intensity: *Isn't there other ways built,!!?!!!!!??* and
*Multiple paths?!!!! Tested!!!!??* He was right both times. Every finding below
came out of taking that question seriously instead of restating the blocker.

## 1. The queue named its rows, keyless — run 44010537006

Dispatched `inbox-lessons-waiting.yml` on main `7a0fc7508b1`. The tailnet join
failed as expected (`TAILNET: false`, the key refused since 2026-11-04) and the
public road answered anyway: `SERVED_READ: ok`, `SERVED_COUNT: 6`,
`SERVED_AGE: 14`. Comment 6937294694 on issue 2378.

**Migration 0326 had reached the NAS on its own clock** — merged at 03:00 in
#2701, applied by `replay-on-clock.sh` within two services-sync cycles, with no
key and nobody's hand. That was DR-1511's one unclaimed proof, and it held.

For the first time the road named every row:

```
65241324  2026-11-12 12:17  research-inbox  build-failed/transient
29d2c703  2026-11-12 12:17  research-inbox  build-failed/other
7a79db92  2026-11-12 12:17  research-inbox  build-failed/other
825019ca  2026-11-12 12:32  research-inbox  plain
2e7ef925  2026-11-12 12:32  research-inbox  plain
f60ed2a5  2026-11-17 03:02  research-inbox  plain
```

Six, not the five of the previous four firings; `f60ed2a5` arrived tonight
through the app's research door. Oldest wait 4 d 15 h, the same row that read
4 d 8 h / 4 d 10 h / 4 d 11 h / 4 d 13 h on earlier samples — live data, not a
fixture.

**The sweep ran against real ids for the first time** (DR-1250 makes it
mandatory, and it takes ids, which is exactly what the aggregates could not
give): `none of 6 row(s) is named in a decision record`. No phantom backlog, and
no duplicate risk.

**Still open, and stated rather than papered over:** six teachings can be named
and not one can be read. The only road to a body is `inbox-lesson-body.yml`,
which needs the dead key. `live-sql.sh` with `LIVE_SQL_LOCAL=1` reads them on
the box with no key (DR-1443), so the paste handed to Darrell is the sanctioned
second road; handing a paste at all is itself a Ways finding (DR-0108). The
filter in it was proven against a real PostgreSQL 16 with decoys: it returned
only his two rows and excluded a member's words, a `lesson-captured` row, a
`lesson-building` row the NAS owns, and an `awaiting-review` row.

**A credential road exists in shape and was NOT built.** The `/sb` proxy carries
GoTrue and PostgREST from a runner with no tailnet (proven by this same run), so
a signed-in JWT could read those rows under RLS — but that needs an account
credential living in a public repo's Actions secrets, which is worse than the
problem it solves. The anon-key bright line stands.

## 2. L318 — merged, deployed, witnessed

Built from the one word Darrell sent with a YouTube link. Not a rebuttal: the
lesson lets Peter answer the question about Peter three times in his own words
(Acts 4:11, 1 Peter 2:4-7, 1 Peter 5:1), and both halves of Matthew 16 are read.
113 quotations, every one filled from `app/public/bible/kjv`.

- PR #2702 merged as **`b581eec500f`**; main carries the lesson module and
  DR-1512.
- `Deploy (Cloudflare Pages)` run **44017086452**, success, `head_sha` =
  `b581eec500f` — matched **by commit**, never by list position (DR-0107 / P62).
- `site-health.yml` run **44018028448**, success — the site itself answering,
  not only the pipeline (DR-0125).

## 3. The outside eye had been dark for two weeks

`nas-health.yml` holds the only outside-in probe of poetech.us the team can run.
Every command in that step is a plain `curl` over the public internet. It had
been placed **after** `Verify the tailnet actually joined`, which `exit 1`s on a
dead `TS_AUTHKEY` — so from 2026-11-04 a dead **network** key silently took the
team's **keyless** eye with it, for a reason with nothing to do with the site.
Its `if:` was wrong too: the gate checks that `TS_AUTHKEY` and `NAS_SSH_KEY` are
*present*, and the probe needs neither.

Moved ahead of the join, `if:` removed; the ssh steps keep their gate, so
nothing gains reach. Proven to catch on the real file: restoring the old order
fails 3 of 10 cases, naming both steps.

## 4. The builder now says whether it is running

Three of the six rows had failed **on the NAS lesson builder**, whose own state
was reachable only by `lesson-builder-status.sh --nas` — ssh, same dead key. A
failure count with no service state is not actionable: `build-failed: 3` means
one thing under a live builder and another under a dead one.

The census already runs on the box, so it reads four local paths with no key:
the unit's systemd word, `.code.sha`, the `locks` directory, `status.json`.
Migration **0327** publishes them, generated from **0326's** live definition —
not 0322's or 0320's, each of which replaced this function, so starting from an
older body would have deleted `waiting` the way starting from 0320 would have
deleted `by_stall`.

Applied to a real PostgreSQL 16 with a hostile builder block planted — an error
string quoting a member, a `last_row_body`, a prose "sha", a lock named for a
waiting row, a stray `secret`, a systemd sentence. `anon` received **none** of
it: the service word read `unknown` rather than `inactive`, a leak scan over the
whole 609-byte receipt found nothing, and `anon` was still refused the table —
*permission denied for table agent_inbox*. A census with no builder block
answers `? 'builder'` false, so absent never reads as healthy.

## 5. Three gates caught me, and one tool version lied

Worth recording plainly, because the pattern repeated three times in one night:
**I ran the guards I thought of, not the ones governing what I touched.**

1. **`decision-chain` failed `DR-1512 missing impact`** — 8949 passed, 1 failed,
   on `6475e5ed108`. I had run the shared Living Lesson gate, four catalog-wide
   gates, the full guard chain and lint, and reported all of it, and never ran
   the gate that governs the *record* rather than the lesson. Fixed at the
   60-line ratchet, paid for by tightening five other lines.
2. **`workflow-register.json` stale**, because editing a workflow changes the
   register the app reads.
3. **`.github/workflows` 23166 lines against a ceiling of 23156** — the 11-line
   comment I wrote cost exactly the 10 it went over. **The ceiling was not
   raised**: the explanation already lives in the record and the test, so the
   workflow keeps a one-line pointer (DR-0245 fold), and the register is back at
   23156 exactly.

**And a tool version that would have lied:** this sandbox ships ruff **0.16.9**
while CI pins **0.17.3** (`infra/requirements-ci.txt`). Under 0.16.9 the
unmodified files from main showed 8 findings; under CI's version, 3 — and those
3 were an artifact of my own copy losing the executable bit. Judging by the
local version would have meant either fixing phantom findings in old code or
missing real ones in new. Under 0.17.3 all five findings were mine: an unsorted
import, two `noqa` directives for rules that are not enabled, a combinable
branch, and a blind `except` — which is declared with its reason rather than
narrowed into a lie, because the census must not die over a status word.

Also caught by my own new test, before CI saw it: it flagged `ssh` and
`tailscale` inside the probe step, and both hits were in **my own comment
prose**. My earlier claim that the step was pure-curl had come from grepping 85
of its 143 lines. The conclusion held; the method did not, and a truncated grep
read as a verification is the DR-0076 §8 error I had been naming at other
people's code the same night. The guard now reads code, never comments or step
names — it had also fired on a *checkout* step whose title contains
"join-tailnet".

## 6. Not claimed

- Nothing in DR-1513 or DR-1514 is exercised on the NAS yet. Both arrive by the
  services-sync pull and `replay-on-clock.sh`, both keyless, neither run by me.
  `re-review: 2026-11-24` on each.
- `nas-health` was not dispatched; the key is still dead, so a real run is what
  proves the probe reports while the ssh steps skip.
- The L318 video was never watched here — youtu.be is unreachable from the
  sandbox. The speaker's claims ride `UNCHECKED` as **his**,
  `re-review: 2026-12-17`, and no movement of the lesson rests on any of them.
- `f60ed2a5` matches L318's teaching by arrival time and road, but the body
  cannot be read from here, so it is **not** tagged on that inference.
- One CI failure on #2703 is not that PR's: `selftests + build + probes` died on
  a go2rtc/wyze check the diff does not touch, and the identical job passed on
  #2702's head five minutes earlier off the same base.

## Needs Darrell only

A fresh **Reusable + Ephemeral** `TS_AUTHKEY` in Settings → Secrets and
variables → Actions. It reopens the body road, the builder's ssh half and
`nas-health`'s ssh half together. Nothing above is waiting on it.

## 7. The layer every one of those fields missed (DR-1522, 22:11)

DR-1518's fix worked on the first cycle: the 22:04 read came back stamped
`Written by census code 2b6f74894a49`, which is main's HEAD, and the code at
that sha carries `OWNER_IDS`, `waits-for-governor`, `no-words`,
`empty_body_query` and `_head_from_files`. So the verdicts were readable at
last — and they said four of Darrell's teachings are genuinely eligible beside
a builder `active` with `building now: 0`.

Then the number I had not thought to compare across two reads:

| read | builder heartbeat | attempts on the three failed rows |
|---|---|---|
| 21:04 tick | `at: 2026-11-17T20:51:29Z` | 1, 1, 2 |
| 22:04 tick | `at: 2026-11-17T21:51:31Z` | 1, 1, 2 |

The heartbeat advances every hour. The attempts have not moved since
**2026-11-12**. An hourly process that records no attempt is not working the
queue — and `lesson_builder.py:2545` says exactly how that happens:

    if kind not in ("sweep", "row") or not ready: return started

When `readiness()` is false, `consider()` returns **before `db.pending()` is
ever called**. No row is read, no attempt is recorded, no `lesson-building` tag
is written — and `write_status(st)` at :2523 has already run, so the heartbeat
keeps advancing over a builder that is touching nothing.

**Five records asked better and better questions about the rows. The rows were
never the problem.** 0327 through 0331 narrowed *which* rows are real; none of
them could see the gate in front of the whole loop.

### What I could NOT settle, and did not pretend to

Attempts-frozen is consistent with **two** causes, because `eligibility()`
failing also just `continue`s without recording an attempt (:2550):

- **(a)** readiness refuses — the fix is a writer or a push credential on the box.
- **(b)** readiness passes and eligibility refuses on DR-1519's one unmirrorable
  branch, a whitespace-only body — the fix is that those teachings have no words.

I cannot tell them apart from here. `state` can, and it was one of the four
withheld fields — which is why the night's earlier attempt at the withheld
fields was worth repeating, but **only** in a form my own gate accepts.

### Why this one is safe when last night's was not

| | last night (refused) | tonight |
|---|---|---|
| published | the withheld **key names** | one key's **value** |
| accepted by | a shape, `^[a-z][a-z0-9_]{0,23}$` | **identity** against 4 literals |
| hostile case | `error_from_mary_smith` **passes** | not identical to any literal |
| bytes on the road | derived from the builder | the census's **own constant** |

DR-1514's shape test is not weakened; this field simply does not use it. Proven
on a real PostgreSQL 16.15: four states ride verbatim, and six hostile values —
including `"waiting on a writer for Mary Smith"` and a `/volume1` path — read
**absent**, with no name anywhere in the receipt.

### Three mistakes caught in the act

1. **Two bad drift tests.** The first swept every quoted string in
   `lesson_builder.py` and "found" ten states that do not exist (`merge`,
   `lesson`, `wait`) because `else "..."` matches any ternary. The second picked
   up `": "` and `", "` out of the dict literals beside the field. It parses the
   syntax tree now — a test that cries wolf gets deleted.
2. **`&& echo "GUARD CLEAN"` after a `tail`.** I printed GUARD CLEAN while
   `record-length-guard` still had a finding, because the `&&` was reading
   `tail`'s success, not the guard's. Read the gate's own exit code.
3. **Ruff 0.16.9 again.** Five findings on `served-lesson-queue.py` lines I never
   touched. `/root/.local/bin/ruff` shadows the 0.17.3 CI pins; at the pinned
   version, clean. Same trap as §4, one night later.

### Needs Darrell only — unchanged, and narrower

Still the one value: a fresh **Reusable + Ephemeral** `TS_AUTHKEY`. But the
question it answers is now smaller. If the next census says
`state: waiting on a writer` or `waiting on a push credential`, **the teachings
are fine and the box needs a credential**. If it says `ready`, the refusal is in
`eligibility()` and those four bodies are whitespace. Either way the next read
answers it without a key.

## 8. The answer, and the layer after it (DR-1524)

**2026-11-17T23:25:22Z, census code `d64cf1e3fac`:**

    state: waiting on a writer
    It is NOT working the queue: readiness() refuses for want of a writer it
    can reach, so the builder returns before it ever reads a row.

Withheld fields went 4 → 3, exactly as one new field riding predicts. Six
records had each asked a better question about the ROWS; the answer was that
the rows were never the problem. **Darrell's seven teachings are real, eligible
and his own, and the builder had never looked at one of them.**

### The chain that delivered it, every link keyless

| step | evidence |
|---|---|
| merge | `d258b27d375` (#2718), record + 0332 present by exact commit |
| deploy | `Deploy (Cloudflare Pages)` success on that exact sha (DR-0107) |
| hosted DB | `applied=1 skipped=330 failed=0` |
| sovereign DB | **`##[error]NAS unreachable`** — the reach-in failed on the dead key |
| the actual proof | `migration-receipt: newest 0332…, 0 not applied`, written **23:15:25** |

I read that `##[error]` as "the NAS never got it" and said so. Wrong: it is only
the optional hurry-up. The step after it reads the live database's **own**
receipt over `poetech.us/sb` with the anon key and waits up to 25 minutes for
the NAS's 15-minute clock — and it confirmed 0332. DR-1269/DR-1398 handled a
dead key exactly as designed; I had mistaken a hurry-up for the verdict.

Also retired an assumption: the sandbox genuinely **cannot** reach poetech.us
(`CONNECT tunnel failed, response 403`), so the runner really is the only eye.

### What `state` still could not say, and why it mattered enough to build

One word covers three writers. It cannot tell **none configured** from **one
configured and failing** — and those are different jobs for a person: a setup,
or a single login. `readiness()` knows per writer, but its entry carries `why`
(the probe's own words — live: *"claude at /usr/local/bin/claude but NOT signed
in"*) and `writer` (a **name** out of `lesson-writers.json`).

So DR-1524 **rebuilds** each entry from `kind`/`ok`/`configured` rather than
filtering one. A filter keeps whatever it did not think to remove; proven by
swapping the rebuild for a pass-through, which leaked all three writer names,
the `/usr/local/bin` path and the Anthropic text at once.

The reader now ends on the sentence a person can act on:

    The writer to fix is CONFIGURED AND FAILING: cli-local. It was set up and
    has stopped answering -- for a `claude` CLI that is almost always a sign-in
    that lapsed, which is one login on the box, not a setup.
    Also never configured (optional, not the fix): api, cli-ssh.

That is a FIXTURE on a real PostgreSQL 16.15, not the live answer — the live
one needs 0333 on the NAS.

### Four more things caught me, and three were my own gates

1. **DR-1514's closed set refused the new field** until it was declared. That is
   the whole value of a closed set, and the widening is now deliberate.
2. **The `never a body` guard** refused one sentence of DR-1522's prose, comments
   included. I changed the prose, not the guard — and then my *fix's own comment*
   named the guard it was explaining and was refused for the same word.
3. **A time-bomb I wrote an hour earlier.** DR-1522's reader fixture hardcoded a
   census stamp; it passed when written and went red once real time crossed an
   hour, because the reader rightly calls a census older than the NAS's
   15-minute clock stale. Fixtures are relative to now.
4. **Ruff's suggested fix would have broken the NAS.** UP017 wanted
   `datetime.UTC`; the repo's own `# noqa: UP017 -- the NAS runs Python 3.8`
   says why that is wrong. `ruff --fix` here would have shipped a crash.

### Needs Darrell — one value, and now a named one

Still only this: whichever writer the next census names. If it says
**`cli-local`, configured and failing**, it is one `claude` login on the box —
and the code's own words are the instruction: *"run `claude` once on that
machine and sign in."* A Claude sign-in is a value only he can mint, so that
one is legitimately his hand (Drive-Don't-Delegate exception 2). If instead
nothing is configured, it is a setup and I will bring the plan.

Not claimed: 0333 is not on the NAS yet, and WHICH writer is still unknown.
`re-review: 2026-11-24`.

## 9. Review of the series' own open claims (asked for, 2026-11-18)

Every record in this chain cites THIS note as its `Measurement`, which is where
an answered "Not claimed" belongs — the records are append-only and are not
rewritten. Eight of the ten open items are now closed by evidence, and the two
that are not are named as such so the `2026-11-24` sweep asks only those.

| record | the open question it wrote down | answered | by what |
|---|---|---|---|
| DR-1511 | nothing proven on the NAS itself | **yes** | census names all 7 rows by id |
| DR-1513 | does the probe report while the ssh steps skip | **yes** | run 44176139872, 21:05:33Z |
| DR-1514 | builder state not exercised on the box | **yes** | `service: active; building now: 0` |
| DR-1515 | verdicts not exercised | **yes** | `failed after 1/1/2`, four `ready` |
| DR-1516 | are the rows a member's or Darrell's own | **yes, HIS** | no row reads `waits-for-governor`, from code carrying the owner check |
| DR-1517 | which code computed the verdicts | **yes** | `Written by census code d64cf1e3fac0` |
| DR-1518 | does the file read deliver the sha | **yes** | field arrived on the first cycle |
| DR-1522 | cause (a) readiness, or (b) eligibility | **yes, (a)** | `state: waiting on a writer`, 23:25:22Z |
| DR-1519 | is the empty-body filter exercised | **NO** | `no-words` never appeared — equally consistent with no empty rows and with a refused filter. Still open. |
| DR-1524 | which writer is failing | **NO** | 0333 merged 00:31; not on the NAS yet |

### DR-1513's proof, which existed and went unread

    success   Outside-in transport proof (the runner IS the outside)
    failure   Join the tailnet (ephemeral)
    skipped   Verify the tailnet actually joined
    skipped   Observe (read-only -- GPU, containers, services, disk, uptime)

Exactly what the record predicted: the keyless probe reports, the ssh steps
skip, and the dead key no longer takes the witness dark. **It landed at 21:05
and I did not read it** — while writing three later records resting on the same
keyless-road premise. The cost is not a wrong record; it is that DR-1513 sat
"unproven" for three hours after it was proven, and I kept telling Darrell the
key was still the blocker for that witness.

### What else was checked, and held

- **Every `file:line` in DR-1522 and DR-1524 still resolves** to the line it
  claims (`:2251` the state ternary, `:2516` the stopped write, `:2523` the
  heartbeat write, `:2545` the early return, `:2550` the eligibility continue).
  Line numbers drift; these had not. Checked, not assumed.
- All eleven records pass `decision-record-guard`, `decision-citation-guard` and
  `record-length-guard`: five headings, resolvable citations, 60-line ceiling,
  700-character INDEX rows.

### The one thing this review changes going forward

Eight identical `re-review: 2026-11-24` dates would have re-asked settled
questions. The dates stay in the records (append-only), and this table is what
the sweep reads first. **Only DR-1519 and DR-1524 still carry real questions.**

---

## 10. The ninth read said `other: 6` — and that is where the series stopped being about the key (DR-1534)

**Measured 2026-11-18 05:12Z, run 44242079320.** The hourly intake tick fired
at 05:04. The tailnet step failed five times over 200 seconds
(`invalid key: API key does not exist` — the key is still dead; the incident
entry on #2517 last moved 7.0 h ago), the keyless road answered as designed,
and the queue read exactly as it had at 04:08: **7 waiting, 0 building,
attempts 4,2,2,2,2,2,2** — every row past its tries, the handoff stable.

Nothing to report, by the routine's own closing line. So I read the rest of
what the census said, which is where the real finding was:

```
By shape -- build-failed: 7.
Failed because -- other: 6, transient: 1.
The oldest has waited 5 d 16 h.
The builder -- service: active; building now: 0; state: ready
```

### The series had been asking the wrong half of the question

DR-1514 → DR-1524 each added a field about **the builder's readiness**, and by
DR-1524 that question was closed: a lapsed `claude` sign-in, which Darrell
fixed from his laptop at 00:52. The builder then went `ready`, attempted every
row — **and every build failed.** Readiness was never the thing that would
build a lesson. `other: 6` is.

And `other` is not a cause. It means "not one of the two classes that retry
themselves". Six teachings, five days old, and the one word the road could give
a reader sends nobody anywhere — while a missing writer, a draft the gates
refuse, a red test and a missing push token are four different hands.

### What it cost to find, and what made it cheap

The builder **already names its site every time**, in its own authored prose,
at every place that composes a failure: `lesson_builder.py:487, 1055, 1135,
1147, 1506, 2641, 2643` and `lesson_gates.py:471`. Eight openings. The census
was reading none of them — it tested two prefixes and gave up.

One site genuinely resists this: `:1029` tags an unexpected crash
`<ExceptionType>: <message>`, whose opening is a class name, not a literal.
That one stays `other`, published as the limit rather than discovered later,
and the durable fix for it is a class word at the **source** — which reaches
only failures built after it ships, and so could not have re-classed the six
rows waiting right now. That ordering is why 0334 went first and the source
change is queued behind it.

### Two gates, and one of them could not have caught this before today

`the-queue-is-readable-without-the-key` already cross-checks the census's
vocabulary against the migration's allowlists — and it reads `STALLS`, which
does not hold the site classes, plus `returnsOf('stall_of')`, whose literal
returns are only `'other'` because the function returns a variable. So a site
class absent from `k_stalls` would have been dropped on the public road and
read as nothing at all, silently. The gate now reads `FAILURE_SITES` too, and
dropping `no-writer` from 0334 fails it by name.

The drift risk is the other way round: a prefix match rots the moment the
builder re-words a message. A case reads both builder files and fails if any
literal is no longer prose the builder writes — proven by re-wording one.

### The second wrong answer, found while reading rather than while failing

`why_of` asked `stall_of(row) == "rate-limited"`. But
`lesson_builder.rate_limited()` treats `transient` **identically** and allows
`MAX_ATTEMPTS + RATE_LIMIT_RETRIES` tries. A `transient` row at 2 attempts
therefore read `failed` with `attempts: 2`, and a reader comparing against
MAX_ATTEMPTS=2 would call exhausted a row the builder would still offer twice
more. Nothing was failing; the answer was simply wrong, and only reading both
sides against each other showed it. Corrected in the same change.

### What is NOT claimed

Nothing here is measured live. Until the NAS pulls this census on its own
15-minute clock the six rows still read `other`, and the first real test of
0334 is the next read after it lands. `re-review: 2026-11-25`.

---

## 11. The instrument worked, and then told me to stop building instruments (DR-1537)

**0334's first live read, 07:09Z, run 44256161123, census code `ab7672790dfc`**
— main's own code, so the NAS had pulled it:

```
Failed because -- other: 6, transient: 1.
  1 x transient -- a passing moment (the CLI's sign-in refresh raced), waited
                   out by the builder itself -- nothing for a person
  6 x other -- its reason matches no site this road knows: the builder's log on
               the box is the next read, and a new site name is the fix
  65241324-... | research-inbox | build-failed/transient | rate-limited after 4
```

Three things proved themselves on live data, within eleven minutes of the
deploy landing:

1. **The class carries its job.** Each line now says what it asks of a person.
2. **DR-1534's second correction is visible.** `65241324` reads `rate-limited
   after 4`; every read before it said `failed after 4`. That is `why_of`
   treating `transient` as self-healing, which is what the builder does.
3. **The six matched nothing.** On the new code. Which leaves `:1029`'s
   `<ExceptionType>: <message>` crash — the limit 0334 published rather than
   hid — as the standing hypothesis, and it is still a hypothesis.

### The move I did not make, and why that is the finding

A fifth receipt could narrow this without anyone's hand: the opening of a
`:1029` reason is a single token before its colon, where every builder literal
has spaces, so the census could test that on the box and publish one more
constant word. It would have worked. **DR-1526, written nine hours earlier,
says that is the wrong move** — building a receipt to infer what a direct read
states outright. The roads in order are the runner (key dead since 11-04),
Darrell's own ssh, his hand. Road 2 answers it outright.

So the build was the TOOL FOR ROAD 2, not another receipt:
`infra/nas-lesson-builder/why_the_builds_failed.py`, reading the records
`_store` already writes at `lesson_builder.py:1251`. One path, no quoting:

```
ssh dpoe@192.168.1.26 "python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-lesson-builder/why_the_builds_failed.py"
```

### What it may print, and what it may never

Those records hold `body` — the drafted lesson — and `prompt_text`, which
quotes the teaching. So the diagnostic prints the row id, the writer, the
elapsed time, `error` to a stated cut, and the **names** of the gates that did
not pass with their fault **counts**. Not a fault's text: the verse gate's
faults quote both the draft and the verse. `--faults` exists for a person
reading their own box on purpose and its help says so in those words.

Proven to catch: a version that prints `body` fails the marker case. An empty
or missing store exits non-zero saying *"which is not 'no failures'"* — DR-0076
§8 on the diagnostic itself.

**Not claimed:** it has not been run. Only Darrell's ssh can run it, the output
is his to read, and the six rows' cause is still unnamed. Four consecutive
reads (05:12, 06:09, 07:09, 08:09) were otherwise identical: 7 waiting, 0
building, the handoff stable.

---

## 12. "Fix it!!!!!! So we don't need anything!!!!!!!" — and the answer was on the box (DR-1542)

**Six consecutive reads, 05:12 → 13:10, every one the same:** 7 waiting, 0
building, `Failed because -- other: 6, transient: 1`, the oldest teaching
passing 6 d 0 h. 0334 told me *which site* refused — and for six rows said
`other`, which is the honest word for "not one of the two that retry
themselves" and tells a person nothing about what to do.

At 13:10 a peer session relayed Darrell's own words from ~12:28Z, about every
item parked on his hand: **"Fix it!!!!!! So we don't need anything!!!!!!! For
all of these.... obviously!!!!!"**

That reverses the call I had made two hours earlier. I had looked at exactly
this and decided to leave it to road 2, citing DR-1526. I was reading DR-1526
as "don't instrument" when what it actually records is an ORDER: don't
instrument *instead of* asking. The direct read now exists — it is DR-1537 —
so building the keyless field is no longer the premature move. It is the
remaining one.

### What was already on the box, unread

Two artifacts the census can open locally, with no key and no ssh:

1. **`versions/<build_id>.json`**, written by `lesson_builder._store` at
   `:1251`, carries `gate_results` — so the NAMES of the gates that refused
   are right there.
2. **The crashed build's own reason tag** opens with its exception class name,
   because `:1029` writes `"{}: {}".format(type(e).__name__, e)`. That is the
   one site 0334 publishes as `other` precisely because the opening is a class
   name and not a fixed literal.

### Why these may ride when prose may not

A gate's name is a fixed word, listed in `GATE_NAMES` and in `k_gates`. The
exception name is matched against **the interpreter's own `BaseException`
subclasses** — an allowlist this repository does not write and therefore cannot
let drift from Python. `Mary` is not an exception class; neither is
`MarySmith`, nor `mary_smith`. All three are refused, and that is a case.

The lookup is a **dict**, not a set, so what gets published is this file's own
string and never the bytes that came off the row — the same discipline 0333
keeps with `k_kinds[array_position(...)]`.

And a fault's TEXT is read on neither side. The verse gate's faults quote both
the draft and the verse; the same record holds `body` and `prompt_text`. A case
plants markers in all three and asserts none reaches the census.

### The thing I am most likely to be wrong about

**The six rows may have no stored records at all.** `_store` is not called on
every failure path — a build that crashed at `:1029` before storing leaves
nothing. If so, the next read says `cause not stored` for those six, which is
the honest answer and not a regression: absent is unread, never "no cause"
(DR-0076 §8). DR-1537's diagnostic is then still the read that answers it, and
the exception name may yet come from the reason tag alone.

Nothing here is measured live. `re-review: 2026-11-25`.

---

## 13. Six days of `other: 6`, answered in one read — and the answer was not a credential (DR-1551)

**0335's first live read, 14:11Z, run 44320331578, census code f444ab511df7:**

```
65241324 | research-inbox | build-failed/transient | gates refused: quotation | rate-limited after 4
29d2c703 | research-inbox | build-failed/other     | crashed: RuntimeError   | failed after 2
7a79db92 | research-inbox | build-failed/other     | crashed: RuntimeError   | failed after 2
825019ca | research-inbox | build-failed/other     | gates refused: quotation | crashed: RuntimeError
2e7ef925 | research-inbox | build-failed/other     | gates refused: verse
f60ed2a5 | research-inbox | build-failed/other     | gates refused: quotation+verse+voice
c671009b | research-inbox | build-failed/other     | gates refused: quotation+verse
```

Six days. One read. **And the thing I had been chasing since 05:12 was never a
credential at all** — not the dead Tailscale key, not the lapsed sign-in. It is
the drafts: `quotation` refused four of seven, `verse` three, `voice` one, and
three builds crashed with `RuntimeError`. The `:1029` hypothesis DR-1534
published as its limit is confirmed, and the class is named.

### The next wrong turn I nearly took

`MAX_ATTEMPTS = 2` and five rows sit at exactly `failed after 2`, so the
obvious move is to raise the budget. I checked the premise first (DR-0076 §5)
and it does not support that:

- `lesson_writer.py:85-90, 116` **already states** every quotation rule to the
  writer — every double-quoted span is Scripture and carries its reference, no
  ellipsis inside a quotation, straight quotes, no record id, no percentage.
- `previous_failures` (`lesson_builder.py:814`) **does** read the earlier
  build's stored gate results and feed those lines into the next prompt.

So these rows failed on attempt 2 **with the first attempt's feedback in hand**,
against rules the prompt had already stated. A third attempt is a guess, not a
fix.

### Why the gate name still was not enough

`quotation_gate` refuses five different things, and they call for OPPOSITE work:

| what refused | whose work |
|---|---|
| a double-quoted span with no reference | the writer's prompt — or the gate itself |
| an ellipsis inside a quotation | the writer, learnable |
| curly double quotes | the writer, mechanical |
| a recited `DR-####` | the writer, mechanical |
| a stated percentage | the writer, mechanical |

The first line is the one that matters: a model writing teaching prose will
double-quote a phrase of the teacher's for emphasis, and the gate reads every
double-quoted span as Scripture. If that is what is firing, the fix is not more
attempts and not a better prompt — **it is a decision about how a lesson may
quote its own teacher, and that is Darrell's call, not mine.** One word tells
that apart from a mis-quoted verse. The gate's name cannot.

So 0336 publishes the KIND: eleven of them, five from the quotation gate, three
from voice, three from verse.

### The one that required care

`lesson_gates.py:279` and `:282` interpolate a NAME into their problem strings
— "capitalises Satan", "writes yahweh in lower case". So the prose is **matched**
and the census's own kind word is **published**: `capitalises-the-adversary`,
`lowercases-His-Name`. A case plants both and asserts the receipt carries the
kinds and neither name, nor any fragment of the prose.

I also caught myself writing `lowercases-a-name-of-god` as a kind token. In our
own authored voice that lower-cases a Name of Yahweh, which the typographic rule
forbids — and it would have ridden a public endpoint. Renamed before it shipped.

### What is still unknown

`kinds` is **unioned across a row's builds**, so it cannot yet say whether the
same problem repeated on attempt 2 or a different one appeared. That is exactly
the question that decides whether a third attempt would help. Named here rather
than guessed at. `re-review: 2026-11-25`.
