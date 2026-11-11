# 2026-11-10 — a lesson from an election email, and five findings it cost

Working note for **DR-1414** (L300, Put Not Your Trust In Princes), built from
the forward Darrell sent on 2026-10-22 with one word over it: Lesson
(Gmail thread `1a165328274f4784`). The record carries the decision; this note
carries the narrative the 60-line ratchet rightly keeps out of it.

## The handling of the source

The email is substantially an advertisement for a news app built around an
election tab. His standing rule is to ignore the ads unless they relate to the
lesson, and one paragraph did: weariness with the cost of living and with
leadership in the capital, bickering that settles nothing, and the conclusion
that *something has to give.*

Everything else in it is marketing and is unused. Its checkable claims — who is
dissatisfied, by how much, what is driving this election — need polling and
economic data this sandbox cannot reach, so under DR-0076 they are unverified and
appear nowhere in the lesson. That is also the reason the teaching is **Living
Lessons and not World Issues**: World Issues' method *is* verified claim-checking,
and on this material it could not have done its own job.

## Five findings

**1. DR-0456 recurred, and the lesson's own sweep caught it.** The child band
carried a RETYPED `Proverbs 21:1` with an ASCII apostrophe where the corpus has
U+2019. The cause was ordinary: that band was authored before the verse
substitution helper existed, so its verses were typed rather than fetched. Every
span is now filled FROM the corpus file, which makes a typed verse impossible
rather than discouraged. The lesson's gate replays this exact break, and on the
live module it fires three independent gates and names the verse.

**2. A check of mine was vacuous.** The first verbatim sweep iterated
`quotedTexts()` as if its entries were strings; they are `[where, text]` pairs, so
`q.text` was undefined, every span hit `continue`, and it printed "0 mismatches"
having examined nothing. It surfaced only because 5 spans for ~200 quotations is
implausible on its face. This is the failure DR-0076 §3 names: a check that cannot
fail is not a check, and it is invisible in review precisely because it is green.

**3. Movement numbers were lost two different ways (DR-0712).** The adult lesson
used `1.`–`8.` headings, for which `lesson-format.js` has no marker pattern, so
the formatter numbered only three auto-detected caps lines. The four bands used
the house `ONE.`–`EIGHT.` form but still lost numbers wherever a movement opened
straight after a verse citation that ended `(Ref)` with no full stop — the heading
merged into the preceding sentence. Both are fixed, and the flattener now
terminates a citation that closes a movement. All five texts render `[1..8]`.
The gate asserts the exact sequence rather than a count floor, because a floor
would have passed the broken version.

**4. The spelling scan's scope was too narrow.** Fixing the band texts left the
metadata British. Scanning only the fields `quotedTexts()` covers found three;
walking EVERY string in the module found two more, in `howToRun` and the
discussion prompts.

**5. My own repair script truncated a heading.** An `A ` alternative in a
lookahead stopped the caps run at "A KING", so heading TWO became "THE ASK FOR."
with the rest left as prose, in both the adult and child texts. Caught by
re-measuring the headings rather than by reading the diff.

## The renumber

main landed ll298, ll299 and DR-1402..1411 (#2600) and DR-1412 (#2603) while this
branch was building. Before renumbering, the question that mattered was whether
either new lesson *was* this teaching: they are "What Programs You" and "Read with
the Heart", and nothing in the catalog is built from this forward. So the lesson
moved ll298 → ll300 and the record DR-1411 → DR-1414.

`resolve-ledger-conflicts.mjs` refused the collision mid-merge and printed the
order to fix it; `renumber-decision-record.mjs` renamed the record and rewrote the
four citing files. On the second pass the resolver re-based the budget raise
`31608→31755` into `31897→32044`, preserving the delta — the DR-1388 behavior
working on a real conflict rather than a fixture.

**Two defects that exposed.** The class file had shipped the literal placeholder
`DR-DRNUM` in the lesson's banner comment, because the number was substituted into
the GENERATED block and then reverted by the next regeneration from the template;
the number now lives in the template. And the resolver's re-based landing (32044)
sat two lines ABOVE the ceiling it had just re-frozen (32042), so it was corrected
DOWN to the measured count — a chain end above the ceiling is the same staleness
class DR-1388 exists to prevent.

## Adjacent, reported not fixed: the priority lane is unreadable

`inbox-lessons-waiting.yml` failed three consecutive runs (2026-11-06, 2026-11-09,
and one dispatched for this firing). The cause is not the workflow:

```
backend error: invalid key: API key does not exist
Tailnet join FAILED using the authkey credential.
```

`TS_AUTHKEY` has expired, so every NAS road over the tailnet is dark — including
the road the voice/in-app priority lane reads its queue through. The workflow
behaved correctly and recorded **UNKNOWN, never zero**, on its rolling log
(#2378), because an unread queue is not an empty one. Stated plainly: whether any
voice or in-app rows are waiting right now is NOT known. Unblocking needs one
value only the Governor holds — a fresh Reusable + Ephemeral auth key, or better
the OAuth client the error itself names, which does not expire.

## CORRECTION: which database that census came from (2026-11-10 23:10Z)

**Read this before the census below.** The count was taken through the Supabase
MCP connector, which reaches the HOSTED project `mjjlevhdufpaplypnqrv`. The
lane's own reader does not use that road: `inbox-lessons-waiting.yml` joins the
tailnet and runs `scripts/live-sql.sh`, which goes ssh → `docker exec psql`
inside `supabase-db` **on the NAS**. That script's own header records why
(DR-0310, DR-0618): *"The app has read the NAS's own Supabase since
REPOINT-ARMED (2026-08-19)... Five monitors still read the hosted project
through the SUPABASE_DB_URL secret, so their green and red described a database
nobody uses."*

So the honest statement is narrower than the one below: **35 rows are waiting in
the hosted project.** Whether that is the same queue the lane reads is NOT
established here, and it is the exact failure that header was written about — a
measurement of the wrong store reading as a measurement of the live one.

**What argues the hosted project is NOT dead for this table:** the rows are
current and coherent — newsletter items dated 2026-11-09, and seventeen
research-road rows carrying the NAS lesson builder's own `build:`/`build-failed`
telemetry from 2026-10-22/23. A store abandoned in August does not accumulate
November writes from the NAS builder. So either `agent_inbox` still lives
hosted, or the two are synced, or the repoint is partial — and this session
cannot tell which from the cloud, because the NAS road needs the expired key.

**Not resolved, and not to be papered over:** until the NAS database is readable,
the census below should be cited as "the hosted project's queue", never as "the
lane's queue". `re-review: 2026-11-13` — once a road to the NAS database exists,
run the same count there and compare the two.

## The hosted project's lesson queue, counted (2026-11-10 22:05Z)

The Supabase connector became available later in the session and answered for
the HOSTED project what the tailnet road could not answer for the NAS's.
**35 rows are waiting there**, every one created by
`c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc` — Darrell's phone account, one of his two,
so none of them waits on member approval. None is tagged plain `voice` (which
would mean a recording still waiting for its words) and none is `voice-failed`.
Counted by road, never by body:

- **2 typed teachings** from `thinking-space`, the oldest **2026-09-29** and
  carrying a 54,115-character body.
- **4 voice transcripts** (`voice-transcript`, `whisper:nas-cpu`), dated
  2026-09-30 to 2026-10-09. Two carry `speakers:marked`; one carries
  `speakers:unmarked` with its reason recorded; the name tags name Bishop Gwin,
  Freedom Yeshua, and one homework recording. These are buildable: the transcript
  row holds the words.
- **17 research-road rows** from 2026-10-22 and 2026-10-23, **every one tagged
  `build-failed`**, and every reason the same shape: `no version passed every
  gate (1 written) ... api_error_status: 429`. The NAS lesson builder claimed,
  grouped, fetched verses, wrote, gated and failed — seventeen times — against a
  rate limit. Several rows show it tried twice.
- **12 newsletter items** split from research (`chat-split`, `newsletter-item`),
  2026-11-06 to 2026-11-09, each carrying its own `newsletter-title:`.

**What the 17 say about the builder.** The lock worked exactly as designed: a
crashed build leaves its row unmarked, so nothing was lost and the next run
retries it. What did not work is anything noticing that the same failure repeated
seventeen times in two days and then stopped being retried at all. A brake that
preserves work is not the same as a witness that reports it, and this queue had
the first without the second. The run log on #2378 is that witness for the READ;
the builder's own failures have no equivalent.

## Sixth finding: the Way's own gate caught the new loop (2026-11-11 00:00Z)

`a-service-comes-home.test.js` failed PR #2604 by name on the live head:
`lesson-queue-census is enabled but on neither list`. The loop was written into
`infra/nas-loops/services.json` as enabled and never added to the Way's lists —
exactly the "joins at birth" omission that gate was built for (DR-0621 /
DR-1119). It is worth recording that it was caught by machinery and not by
attention: five local guards, the flow registry and 106 targeted tests were all
green, because this check reads `services.json` against a list in a test file
and nothing I ran locally paired them.

The fix is the one the gate's own comment demands. A name listed beside a
witness that never looks at it is the hollow version of walking the Way, so
`loops-health.yml` was made to read the loop the way it reads `nas-heartbeat`:
its `last-run.json` in its own home, its install path, its `lesson-queue-census:`
cron lines, a red when that ledger says the count could not be written, and a
line in the dark-loop diagnosis. Then the name was added. Sixteen workflow
lines, ceiling raised to the measured total.

**The limit, stated (P66).** That witness rides the runner's tailnet key, which
is the expired road this whole loop exists to route around. So until a fresh
`TS_AUTHKEY` is in place, the loop's live witness is the app-side reader, which
reads an uncounted queue as uncounted and never as empty. Neither witness has
yet seen a stamp from this loop: it counts as working when one of them does,
not now.

## Seventh finding: the loop was not actually in the app (2026-11-11 00:06Z)

Then a stop hook caught me citing `THE-WAY-A-SERVICE-COMES-HOME.md` without
having opened it this session — a fair catch, because what I had actually read
was the gate's comments, and citing the Way itself claimed more than I'd done.
Reading it changed the work.

The Way says plainly: **"A loop is a service too. A batch loop with no door
keeps steps 1, 2, 4, 6, 7 and 8."** Step 7 is *"it shows in the app... never a
painted status"* and step 8 is *"it seeds the next — a service that answers to
no one is not home."* I had built `app/src/lib/lesson-queue-census.js` with 16
checks and **imported it nowhere**: the NAS would count its queue and no screen
would read it. `nas-heartbeat`, the loop I mirrored in every other respect,
shows on the OpsBoard; mine did not. The gate could not catch this, because the
gate reads the installer and the witness, not the app.

So the strip was built beside the heartbeat's: the count, what KIND of work
waits broken out by shape, and the oldest wait. **Nine checks, proven to catch**
— rendering an absent census as `0 lesson rows waiting` (the natural wrong
version, the `total ?? 0` reflex) fails `PROVEN TO CATCH: no census row says
NEVER COUNTED and shows no zero` by name. That is the DR-1186 failure exactly:
a reader who sees "0 waiting" when nobody could count stops looking, and this
queue is 35 rows deep.

**The finding under the finding.** Two gates passed a loop that was not home,
because between them nothing asked "does this show up where Darrell looks?"
That is DR-0065's standing default — the app is the primary artifact — and it
was carried here by a Way document rather than by any check. Worth a gate of
its own, and the honest version of this note says I did not build one:
`re-review: 2026-11-18` — teach `a-service-comes-home.test.js` to require that
a loop on the Way has a reader that some component imports, so step 7 is
machinery and not a document someone has to remember to read.
