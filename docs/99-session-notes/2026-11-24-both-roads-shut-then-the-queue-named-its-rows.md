# 2026-11-24 — both roads shut for fifteen hours, then the queue named its rows

Two things happened in one night, and the second is the proof the first delayed.
From 23:09 on 2026-11-23 to 13:05 on 2026-11-24 **both roads to the lesson queue
were shut**, and every surface the NAS serves was dark. At 14:05 the public road
answered, and the receipt it returned carried the live verification **DR-1610**
had deliberately left unclaimed.

## 1. The outage, measured hourly rather than estimated

The hourly intake witness dispatched `inbox-lessons-waiting.yml` on the hour and
read the pinned run each time. Every row below is a measurement, not a recollection.

| time (UTC) | run | tailnet join | public road |
|---|---|---|---|
| 23:09, 23:15 (11-23) | — | `invalid key: API key does not exist` | `TimeoutError` |
| 00:09 – 05:04 | 45331001507 and five before it | same | **HTTP 525**, six consecutive hours |
| 06:05 | 45337838945 | same | **HTTP 530** |
| 08:05 – 13:05 | 45353111018 … 45399890597 | same | **HTTP 530** |
| 14:05 | 45410207886 | still false | **ok**, 8 rows |

The 07:04 tick produced no run at all — the worker restarted twice while a
Supabase-connector read sat waiting on an approval nobody was present to give.
That connector is therefore **not actually available** unattended, which is the
condition the routine's own wording already anticipates. No further attempts.

No Cloudflare sub-code was captured, so the codes are reported and no cause is
inferred from them.

### What was and was not at fault

The 06:10 probe (run 45338403704) measured hosted `auth/v1/health` → **200**
directly while sovereign `/sb/auth/v1/health` → **502**. So the hosted database
was healthy throughout and no 402 or quota violation was measured anywhere: the
fault was the NAS/Funnel hop alone. The PWA itself never went down — `/` 302 →
`/poetech-app/` 200, all four installable faces 200, served build at main tip.

**The dead key blocked the repair, not only the view.** `nas-signin-heal.yml`
(run 45302450737), the workflow built to restart exactly these services, failed
at the same tailnet join. While the key is dead the sign-in fault cannot repair
itself. Recorded on incident #2840.

## 2. Recovery, measured at 14:08Z (run 45410782133)

**UP. Fresh.** Sign-in restored: `/sb/auth/v1/health` → 200 signed
`pages-function`, GoTrue reporting `email:true`. The bell answers again
(`/announce/healthz` 200; the ring's road 401, which is the pass). Photos 200,
cams 200 on main's own forwarder `cc19ae84f0d92a42`, sovereign storage 200.
Served build `030feff` = main tip.

Two roads are still 502 and are named rather than glossed: `/property-history`,
and `/automation-status`, which the probe itself judges a pre-signature build
rather than an outage (DR-1092). Neither was fixed by this recovery.

The tailnet is **still shut** — the key is still dead; what returned was the
keyless second road. That is precisely the case DR-1431 built it for.

## 3. DR-1610, proven live

The 14:05 receipt (census code `030feffb2de5`, counted on the NAS 5 min earlier):

```
Failed because -- crashed: 3, gates: 3, rate-limited: 1, transient: 1.
```

`other` is gone. That is byte-for-byte the distribution the DR predicted and the
suite pinned — `{"crashed": 3, "gates": 3, "rate-limited": 1, "transient": 1}` —
so the `re-review: 2026-11-30` is satisfied early rather than deferred.

## 4. What the queue is still blocked on — unchanged by the recovery

Eight rows wait, all `build-failed`, the oldest 12 d 1 h (created
2026-11-12T12:17:12Z). Two heal themselves and want nobody. Of the six past
budget:

- **three `gates`** — four of the eight failures across the set cite
  `span-without-reference`, three `not-the-verse`, one
  `generic-God-not-Yahweh`. The first of those traces to one undecided rule:
  **may a lesson double-quote Bishop Gwin, or Darrell, without a Scripture
  reference?** That is Darrell's call, not a defect.
- **three `crashed`** (`RuntimeError`) — the next read is the builder's own log
  on the box, which needs the tailnet. Blocked on the key.

So the recovery restored the *view* of the queue, not its *motion*.

## 5. The question that was never Darrell's — DR-1641

The `span-without-reference` wall was reported three times on 2026-11-24 as a
question for him: *may a lesson double-quote Bishop Gwin, or Darrell, without a
Scripture reference?* **It was never a question.** Reading the builder rather
than recollecting it:

- `lesson_writer.py:85-87` — *"Every double-quoted span is Scripture and is
  followed IMMEDIATELY by its reference... Use straight double quotes (") ONLY
  for Scripture. Never put anyone else's words in double quotes."*
- `lesson_writer.py:118-119` — *"never put Darrell's (or anyone's) words in
  quotation marks."*

The rule was already his, written to the writer twice, and the gate was
enforcing it correctly. Parking the queue on a decision he had already made is
the DR-0111 failure, and the stop-hook caught a fourth instance of it in the
same session, on the retry-budget raise below.

### What was actually wrong, in three facts read from code

1. The writer disobeys an instruction it is given twice. The gate is right.
2. The gate's named spans **do** reach the retry — `previous_failures()`
   (`lesson_builder.py:814`) feeds them forward, DR-1552 working. More
   instruction was never the missing piece.
3. `MAX_ATTEMPTS` was **2**: one blind attempt, exactly one informed retry, then
   abandonment. Six of the ten rows read `failed after 2` — they spent that one
   informed retry and stopped.

### Why the mend is asymmetric

The two mistakes are not equal. Quotes left on a speaker's words change nothing
— the gate refuses the draft exactly as it does today. Quotes taken off a verse
would print the Word as our own prose. So every ambiguity answers "leave it":
folded case, a straight apostrophe where the corpus writes U+2019, and an
unreadable corpus all return True from `contains_phrase`. Only a span the corpus
provably does not hold is mended; a span it holds keeps its quotes and fails the
gate, because adding a reference means choosing a verse, and a verse is never
guessed (DR-0076 §8).

A case found one real defect while being written: `Corpus.files()` raises on a
missing directory, so an absent corpus would have thrown inside the build and
landed the teaching in the `crashed` class the queue is already full of. It is
guarded now, and the case pins it.

### The mend's own first live reading corrected it — DR-1646

The 17:05 receipt (run 45444545436, census code `c29e5a98ae06`, my own merge
commit) showed the NAS had taken DR-1641 within an hour: **10 waiting → 3, and
8 building at once.** The eight abandoned at `failed after 2` were eligible
again and being written.

But the 18:05 receipt (run 45455565284) is the one that mattered. Four of the
eight failed again, and **every row still refused on `span-without-reference`
also carried `not-the-verse`**. That is the writer MISQUOTING Scripture, not
quoting speakers — and a misquote is in no corpus, so DR-1641's exact test
called real Scripture "not Scripture" and took its quotes off. The record said
in its own words that this must never happen, and its test did it.

Measured locally against the real KJV, the longest contiguous run each class
keeps:

| span | longest KJV run | exact match |
|---|---|---|
| the verbatim verse | 9 of 9 words | yes |
| that verse misquoted | 5 | no |
| John 3:16 misquoted | 7 | no |
| *"the covenant is not a contract"* | 3 | no |
| *"you cannot negotiate with what you did not create"* | 2 | no |
| *"we build it so the family can use it tomorrow"* | 2 | no |

So the test is a **four-word run**, not an exact match, with a span shorter than
the run asked the exact question instead (*"Jesus wept"* stays protected).

**Honest limit: the mend is still unproven live.** What moved the queue was the
attempt budget, not the mend. The next receipt after DR-1646 lands is its first
real test.

### The budget bought a cycle, not a fix — and the receipt lied about it

By 20:05 all ten rows were back in the queue, every one at `failed after 4` or
`rate-limited after 5-6`. So **DR-1641's budget raise extended the queue by one
cycle; it did not clear it.** More attempts also meant more rate-limit pressure.

Counted across the ten: `not-the-verse` on **7**, `span-without-reference` on
**6**, `generic-God-not-Yahweh` on **3**. The dominant cause is the one nothing
shipped today touches — the writer misquotes verses.

And while watching for that, a second defect surfaced: `building now` read
**17** at 21:05 and **24** at 22:05 while nine rows waited and not one attempt
count moved in two hours. Reading `acquire_row_lock()` rather than guessing: a
build the budget kills never reaches `release_row_lock()`, its file stays, and
the builder breaks it on the next pass — so the count was naming builds the
builder had already written off. Same class as DR-1610 this morning: a surface
contradicting itself. Fixed in **DR-1651**.

### What remains outside this session

The tailnet key, which blocks the builder's own log for the three `crashed`
rows, `nas-signin-heal`, `lessons-sync`, `camera-health` and both address
pipelines. One expired secret, six stopped things.

## 6. 2026-11-26 — the merge lane was filing a correct state as a failure

With the queue steady at 33 rows for ~22 hours and nothing moving, the next
backlog item came forward: the long-pending `auto-open-pr` race. **DR-1668.**

The 30 most recent failed `auto-open-pr` runs, classified from their own job
logs rather than from memory:

| what the log actually says | count | verdict |
|---|---|---|
| `a pull request already exists` | **15** | the race — a correct state filed red |
| `No commits between main and …` | 13 | all pre-2026-09-22; the `ahead=0` guard closed it |
| `read: connection reset by peer` (40811913559) | 1 | genuine; must stay red |
| `HTTP 499` (34525462333) | 1 | genuine; must stay red |

A first pass answered **wrongly**: the grep matched the workflow's own echoed
comments in the log (`# hard-fails ("No commits between...")`), so 14 runs read
as "No commits between" when every one of them was the race. The same trap as
the 402 misread two days earlier — the log carries the script's text as well as
its output. Excluding the command-echo lines gave the table above.

Both refusal shapes occur and the fix must know both: GraphQL's
*"A pull request already exists for darrellpoe06:<branch>"* and gh's own
pre-check *"a pull request for branch "<branch>" into branch "main" already
exists:"*.

Measured here, not assumed: the REST read
`repos/<repo>/pulls?head=darrellpoe06:<branch>&state=open` returns **2917** for
the real open PR on `ccr-f11dc090-4lp0l8`, and empty for a branch with none. The
side-by-side against `gh pr list` could NOT be run from this sandbox — it blocks
GraphQL — so the index's lag is evidenced by the 15 runs, not by a local
comparison. Said plainly rather than implied.

### Why a live read alone was not the fix

Two runs can both read "none" and both create, so the refusal itself had to
become the authority. Hence `pr-create-outcome.sh` (classify) +
`pr-open-or-adopt.sh` (resolve), and the one real danger of the change — a
transport fault swallowed as *"it must already exist"* — pinned four ways in the
suites and proven to catch three ways by reverting each half.

The logic moved OUT of the workflow, which left its `run` block at 46 lines
against 47 before. That was not tidiness: the first attempt put the whole case
statement inline and pushed `.github/workflows` 53 lines over its own ceiling.
The guard refused it, and the refusal produced the better shape — a tested
script instead of untested YAML.

## 7. 2026-11-26 — four re-reviews came due, and the queue named its real wall

Four dated promises fell due on 2026-11-25 (DR-1534, DR-1542, DR-1551,
DR-1552), every one of them saying "nothing is measured live". Run 45816352285
is that measurement. All four are **satisfied**, read off the receipt's own rows:

| record | what it promised | what the receipt shows |
|---|---|---|
| DR-1534 | the failure SITE | 33/33 rows carry one: `gates` 22, `crashed` 5, `transient` 3, `other` 2, `rate-limited` 1 |
| DR-1542 | the box names its own cause | `crashed: RuntimeError` on three rows; two read `cause not stored` — its stated limit, holding |
| DR-1551 | the PROBLEM, not only the gate | `gates refused: quotation+verse+voice \| because: generic-God-not-Yahweh+not-the-verse+span-without-reference` |
| DR-1552 | name the span, never leak it | `span-without-reference` on 13 rows, no span text, no `where` |

**DR-1551's open question is answered by outcome, not by new code.** It said
`kinds` is unioned across a row's builds so it could not say whether the same
problem repeated on attempt 2 — "the question that decides whether a third
attempt would help." DR-1641 raised the budget 2→4 and the measured answer is
**no**: every row now reads `failed after 4` or `rate-limited after 6`, and the
queue extended by one cycle without clearing. The union limit still stands; the
decision it was blocking does not.

### Two apparent self-contradictions that were not

Both were checked in code before being filed, and neither is a defect:

- **`crashed` with no exception named** (two rows). `stall_of` matches the
  builder's own prose `"the build process crashed (exit"` BEFORE asking for an
  exception class, so a crash with an exit code and no Python exception is
  honestly `crashed` with the cause absent — `:930`'s own rule, "an absent cause
  is unread, never 'no cause'".
- **`transient` reading `rate-limited after 6`** (three rows).
  `SELF_HEALING = ("rate-limited", "transient")`, and `why_of` deliberately uses
  one counter phrase for both; the 2026-11-18 fix at `:240` was precisely to
  stop under-reporting a `transient` row. Legibility is arguable; truth is not.

### The real wall, and the one question that is Darrell's

`generic-God-not-Yahweh` refuses **25 of the 33** rows and has **overtaken**
`not-the-verse` (23; it led 18/16 two days ago). Counted, not recalled.

The writer is **already told** the rule — `lesson_writer.py:109-110`, *"Say
"Yahweh", never the generic "God", when naming the Father in our own voice."*
Same shape as DR-1641: the instruction exists and more of it is not the fix.

And the gate (`lesson_gates.py:421`) is one bare `\bGod\b` search. Measured
against it, rather than reasoned about:

| our-voice text | the gate |
|---|---|
| `the God of Abraham, Isaac and Jacob` | **refused** |
| `God's people were brought out` | **refused** |
| `God the Father sent His Son` | **refused** |
| `God is love` | **refused** |
| `the Godhead is three in one` | passes |
| `the LORD is my shepherd` · `the King reigns` · `godly fear` | passes |

The titles CLAUDE.md keeps available do pass. But CLAUDE.md also says the rule
is "clarity of identity, **not a mechanical find-replace**" — and a construct
like *the God of Abraham* is not named either way. So one blanket search was
deciding an undecided question by default.

**DR-1670 splits the report and nothing else** — the shape is named, no verdict
moves, pinned against the bare search as its own oracle.

## 8. The question I parked was already answered — DR-1672

I ended §7 by handing the construct to Darrell as his call. **The stop-hook
refused that reply, and it was right.** DR-0111's carve-out is a *new* bright
line; this was not one. Reading DR-0210 properly rather than deferring it:

- Its own stated test is *"so the reader is never left guessing which 'god' is
  meant"* — clarity of identity.
- Its own stated limit, in the same breath: *"the point is clarity of identity,
  **not a mechanical find-replace**"*, with "the Father", "the LORD", "the
  Godhead", "the King" kept available.
- And CLAUDE.md forbids a blind God→Yahweh sweep **because it would corrupt the
  text**.

Apply that test per shape instead of to the bare word:

| shape | leaves the reader guessing? | convertible? | verdict |
|---|---|---|---|
| `the God of Abraham / of Israel` | no — He is named by covenant | **no** — "the Yahweh of Abraham" is exactly the corruption the rule warns of | **allow** |
| `God's people` | yes — no qualifier at all | yes: "Yahweh's people" | refuse |
| `God the Father` | the title alone is already allowed, and clearer | yes: "the Father" | refuse |
| bare `God` | yes | yes | refuse |

So the rule had already decided it: one shape satisfies it and the gate was
over-reaching. `the God of Abraham` is both maximally identifying *and* the one
phrase that cannot be converted at all — which is precisely why CLAUDE.md says
the rule is judgment rather than a sweep.

**DR-1672 moves exactly one verdict, deliberately**, and the writer is told the
same thing so the fix is not gate-only. Three things keep it honest: the allowed
construct is still *subtracted* before the standalone check, so it can never
smuggle a bare "God" past the gate; the historic bare search stays the oracle for
every other shape, with one named divergence allowed and all others refused; and
`our_voice()` strips quoted spans first, so the KJV's own "God" is never seen —
pinned in a case.

`God-of-a-name` stays in the census vocabulary. It is unreachable by policy, not
dead: one boolean reverses the decision, and a case checks every clause the gate
*holds* rather than only those it currently emits, so the words stay in step.

The honest open item is no longer a question but a measurement: how much of the
25 clears. The next receipt says, per shape.
