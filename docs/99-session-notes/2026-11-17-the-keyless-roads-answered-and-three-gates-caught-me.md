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
