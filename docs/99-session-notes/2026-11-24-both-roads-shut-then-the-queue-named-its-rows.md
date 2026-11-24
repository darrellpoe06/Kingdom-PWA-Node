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
