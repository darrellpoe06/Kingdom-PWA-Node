# DR-1219: Readiness is not production — the lesson-builder witness passed for four days while fifteen of Darrell's teachings waited up to 102 hours

**Date:** 2026-10-26
**Status:** accepted
**Tier:** A (one new judged dimension on an existing daily witness, plus the checkout it needs; no gate relaxed, no lane touched; 15 cases, 5 proven to catch, and the judge verified end to end on the real numbers)
**Type:** orchestration
**Area:**
- `scripts/loop-produces-or-it-is-dark.mjs` (new — `verdictOf`, `exitCodeOf`, `problemsOf`; readiness and the outcome are separate arguments on purpose)
- `scripts/lesson-loop-outcome.sql` (new — waiting | oldest hours | shipped in a day, reusing the existing predicates verbatim)
- `.github/workflows/lesson-builder-health.yml` (reads the three counts over the SSH it already opens; the judge appends the outcome verdict; gains the `actions/checkout` the tested script needs)
- `app/src/__tests__/loop-produces-or-it-is-dark.test.js` (new — 15 cases, weighted at the four days)

**Grounds:** measured 2026-10-26 on our own witness, while draining four days of queued intake notifications. Not reported by anyone: found because the hourly intake routine's queue read returned `COUNT: 15` when it should have returned 0, and the daily health witness for the same loop said PASS.
**Principles:** DR-0076 §3 (proven to catch — a gate that always passes is itself a lie), §4 (measure, never claim), §8 (name the method's limits); DR-0125 and DR-1186 (unknown never reads as fine; an unread queue is not an empty one); DR-0771 (the stale alarm, which did ring); DR-1210 (the deploy proof — the same mistake one layer out: a watcher reporting success it never observed); DR-0621 (hold the hand of the process); DR-0669 (the NAS lesson builder)

## Context

Darrell's in-app lesson lane is the PRIORITY lane — *"voice all day and night... priority lane actually!"* A teaching he speaks into the app becomes an `agent_inbox` row, the NAS builder claims it, writes the lesson and ships it; `lesson-builder-health.yml` is that loop's own witness and runs daily.

On 2026-10-26 the queue held **fifteen rows, every one of them his, the oldest waiting 102 hours.** Each had been claimed, grouped, had its verses fetched, been written, been gated — and failed, inside two seconds, twice each. Nothing had shipped in four days.

The witness ran on each of those days and passed on each of them. Its last run before this was read printed, in as many words:

```
verdict passed -- nothing to diagnose
```

It was not wrong about what it measured. It asks the builder for `lesson_builder.py --status` and judges exactly what comes back: the unit is active, the builder is not stopped, **a writer is ready**, the push credential is present. All of those were true the whole time. Read at `infra/nas-lesson-builder/lesson_builder.py`, `--status` prints `readiness()` plus the kill state **and nothing else** — it has no outcome field, so the witness could not have known. The one thing a reader takes `lesson-builder loop: PASS` to mean — that teachings are becoming lessons — was the one thing nobody measured.

**And the stale alarm did ring**, five times on the oldest row (DR-0771). So two witnesses disagreed for four days, and the one wired to the `incident` label is the one that said green.

**One thing the witness was right about, which sharpens what the gap actually is.** Every row sits at `attempt 2`, which is the builder's maximum: it claimed each row, tried twice, failed, and then **handed it back** — `handed back (last: failed), waiting for the intake`. That is the designed behaviour (`eligibility()` in `lesson_builder.py`), not a stuck loop. The NAS half did its job and said so.

What nothing watched is **the other half**. A handed-back row waits for the hourly cloud intake, and that intake's hundred-odd firings sat undelivered in a session queue while the rows aged. So the dark stretch was not the builder being broken; it was a row correctly handed to a second runner that no witness ever asked about. `lesson-builder-health.yml` watches the NAS, and watches it accurately. **Nothing at all watched whether a handed-back teaching was ever picked up** — which is why the check added here measures **the queue** rather than the builder: the queue is the one place both halves show up.

## What was measured

| | the witness before | with this change |
|---|---|---|
| unit / stopped / writer ready / credential | judged | judged, unchanged |
| **has anything shipped** | **never asked** | judged from three live counts |
| the real 2026-10-26 state (`15 \| 102 \| 0`) | **PASS** | **DARK-IN-EFFECT, exit 1** |
| the queue unreadable | PASS (it was never read) | UNKNOWN, exit 2 — fails |
| a garbled read | PASS | UNKNOWN, exit 2 — fails |
| nothing waiting | PASS | HEALTHY, exit 0 |
| 2 rows waiting 1h | PASS | HEALTHY — a row in flight is not a failure |

The judge was run end to end on those inputs rather than reasoned about, because the parsing between the SQL line and the verdict is where a wiring error would hide:

```
OUTCOME="15|102|0"      -> parsed: 15 102 0        | exit 1 | DARK-IN-EFFECT: the loop is READY AND PRODUCING NOTHING: 15 row(s) waiting, the oldest 102h
OUTCOME=""              -> parsed: None None None  | exit 2 | UNKNOWN: the queue could not be read...
OUTCOME="bad|line|here" -> parsed: None None None  | exit 2 | UNKNOWN: the queue could not be read...
OUTCOME="0|0|0"         -> parsed: 0 0 0           | exit 0 | HEALTHY: nothing is waiting, so nothing is owed
OUTCOME="2|1|0"         -> parsed: 2 1 0           | exit 0 | HEALTHY: ... still inside the 4h alarm
```

## The decision

**A loop that ships nothing is not healthy, however ready it is.** The outcome is judged as its own dimension, kept apart from readiness, with four outcomes and four exit codes:

- **HEALTHY (0)** — ready, and either nothing is waiting past the alarm or something shipped inside the window.
- **DARK_IN_EFFECT (1)** — **ready and producing nothing**: rows past the stale alarm, nothing shipped. This is the state that reported PASS for four days.
- **UNKNOWN (2)** — a judged number could not be read. **Never healthy**, the DR-1186 rule: a queue nobody could read is not an empty queue.
- **NOT_READY (3)** — no writer is ready. Kept separate from DARK on purpose: *"it cannot build"* and *"it builds and every build fails"* have different cures, and the second one is the one where restarting the unit changes nothing. The DARK message says so in its own words, because on those inputs every readiness field is already green and a reader who treats it as a readiness problem will restart a healthy unit while the gate keeps failing.

**Readiness and the outcome are separate arguments to `verdictOf`,** so no combination of ready-flags can answer for production — that substitution is the entire bug, and the type signature now forbids it.

**The predicates are not new.** "Waiting" is `lesson-inbox-waiting.sql` verbatim and "finished" is the `build:(published|duplicate|skipped-test)@<timestamp>` test from `lesson-inbox-progress.sql` verbatim, so this cannot drift into a second definition of either — the one-query-one-definition rule those two files already set.

## Impact — what this obligates

**Unresolved, the cost is the lane's whole purpose quietly not working.** These are spoken teachings on the lane Darrell named the priority lane, and the covenant in Layer 0 is that he speaks them here *because they get built*. Four days of silence with a green check is worse than four days of silence with a red one: the green actively told every session that looked that there was nothing to do.

**What the call obligates:**

- **A loop's witness judges what it produces, not only what it could produce.** This one now does; the same question is owed to any other loop whose witness only reads readiness.
- **The outcome verdict is reported in the witness's own words,** and an UNKNOWN is reported as UNKNOWN — never softened, the DR-0125 rule applied to production rather than freshness.
- **Nothing in the lane or the gates changed.** No required check, no merge path, no brake. The witness got one more thing it judges and the checkout it needs to judge it.
- **The fifteen waiting rows are not fixed by this record.** This makes the next one loud. The rows themselves, and the `cli-local` gate failure under them, are live work and named below.

### Limits, named rather than left (DR-0076 §8)

- **It says the loop is dark; it does not say why.** That is deliberate — guessing at the cause inside the witness is what produced a readiness-only judgement in the first place, and the two causes here are in different places (a build that fails its gate twice, and a handed-back row nobody collects). The message points the reader at the build's own stages instead.
- **Why those fifteen builds failed their gate is NOT known, and this record does not claim it.** `lesson-builder-versions.sql` keeps three days and the builds are four days old, so `running builds:` came back empty: the gate results are simply gone. The failure is real and twice-repeated per row, and it is unexplained. Diagnosing it needs a fresh build to fail where the versions can still be read — which is work, not a conclusion, and it is the next thing this points at.
- **The NAS copy of the repository must carry the new SQL file** before the check can read anything. It needs no manifest entry — `infra/nas-loops/loops/services-sync.sh` runs `git pull --ff-only` on the whole mirror every 15 minutes, so the file arrives on merge — but between the merge and that pull the read returns empty and the verdict is UNKNOWN, which **fails** the witness rather than passing it. That is the right direction and it is still not an answer. Note also that the same loop's own history records the mirror sitting a night stale twice, so "it will arrive" is a claim to verify rather than assume. `re-review: 2026-11-02`: confirm the first scheduled run after the pull reports a real verdict and not UNKNOWN.
- **"Shipped in the last day" is the build tag's window, not a lesson's deploy.** A lesson tagged `build:published` that never reached the live site would count here. DR-1210's deploy proof is the instrument for that question, and wiring the two together is a bigger change than this.
- **The 4-hour alarm is a constant** matching DR-0771. If that threshold moves, this constant is the thing to change; it is passed in rather than read from a shared place, which is a small coupling named here rather than hidden.
- **It judges the whole loop, not a row.** Fifteen rows failing and one row failing read the same. A per-row verdict would be a different and larger instrument.

## Proven to catch (DR-0076 §3)

15 cases. Five breaks proven with `prove-it-catches.mjs` (the DR-1207 operator), each restored byte-identical with the suite green on both sides:

| break | result |
|---|---|
| readiness answers for production (`ready => healthy`) — **the bug itself** | red |
| an unread queue defaults to 0, so it reads as empty | red |
| an unrecognised verdict exits 0 | red |
| the stale alarm is ignored, so any backlog passes | red |
| not-ready is folded into dark, losing the different cure | red |

```
all 5 break(s) proven to catch, and the tree is byte-identical.
```

The suite's weighting is deliberate. The heaviest case feeds `verdictOf` **the exact numbers the witness had on each of the four days it passed** (`writerReady: true, waiting: 15, oldestWaitHours: 102, shippedLastDay: 0`) and asserts DARK with a non-zero exit — the regression is pinned to the real event, not to a fixture resembling it. A second case sweeps every combination of a waiting count and an age past the alarm to assert that **readiness alone can never reach HEALTHY** while the queue starves, because that substitution is the defect and a single example would not hold the door shut.

**A wiring error was caught before this shipped, and is worth recording:** the first draft called the script from the judge step of a workflow that **has no `actions/checkout`** — this job had never needed the tree, only the NAS. The call would have failed on every run. It would have failed *loudly* (a non-zero exit becomes an UNKNOWN problem and fails the witness), so the failure direction was already right, but it would have been wrong and noisy every day. Found by checking the premise rather than the diff.
