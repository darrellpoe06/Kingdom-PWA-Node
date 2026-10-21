# DR-1169: The Research section takes what he sends, and a link or a question he sends is looked into without him asking twice

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a new top-level app surface, and one new scheduled workflow of the deterministic class carrying budget + lock; additive — it reads the person's own rows and writes only child rows of a row they already sent)
**Type:** feature
**Area:**
- `app/src/lib/research-items.js` (the tag contract, the pairing, the states, `verified:false` as a constant) and `app/src/components/ResearchSection.jsx` (the surface)
- `app/src/surfaces.js` (the `research` entry and its export), `app/src/poe-financial-mvp-v28.jsx` (the route allow-list and the one render-switch line), `app/src/lib/nav-items.jsx` (the tab, its words, its icon, its group)
- `.github/workflows/research-inbox.yml` (the pick-up lane), `scripts/research-inbox-waiting.sql` (one definition of "waiting"), `scripts/research-answer-text.mjs` (the road's JSON as the text a row carries)
- `scripts/system-flow-registry.mjs` (the `research-section` app node, the `research-inbox` workflow, `db:agent_inbox#research` and `db:agent_inbox#research-answer`)
- `scripts/monolith-budget.json` (5192 → 5193, the render-switch line, with its reason)
- `app/src/__tests__/research-items.test.js` (17 cases), `app/src/__tests__/research-section-render.test.jsx` (7 cases)
- `docs/99-session-notes/sources/tvtyme-options-aqgxzvsjwwg/` (the first real item's words)

**Grounds:** DR-0065 (the app is the primary artifact), DR-0061 (reality-trace), DR-0076 (no claim without evidence; unknown is not a no; proven-to-catch), DR-1101 (the research road and its `verified:false`), DR-0669 (the lesson lane, the worked pattern this copies), DR-0723 (the NAS's residential address is the only one of ours YouTube answers), DR-0768 (a row that cannot say "taken" cannot stop), DR-0248 (the deterministic class carries budget + lock), DR-0247 (agreed work starts itself), DR-0726 (a control never vanishes by accident), DR-0099 (true red is reserved).
**Sibling in flight:** the research-lane Way (`THE-RESEARCH-LANE.md`, PR #2350) binds the practice; this builds the section and the lane it describes. Neither cites the other's number, because neither record was on `main` when the other was written.
**Declared by:** Darrell, 2026-10-21, across one hour: he sent `https://youtu.be/aQgXzVSjwWg` with *"Link to the research for our tvtyme"*; then, when the reply was that it would be read in a sandbox and summarised in chat, **"Research section of the app?!!!!!!"** and **"Make that automation from my prompts..."**; then **"Also options in that link... review it..."** and **"Fix it so it works!!!!!!!!!!"**; then **"All we need is the words from the videos to deduce the requirements!!!!!!!!!!!"**; and finally, stopping a rebuild of a road that already existed, **"Already worked !!!!!!"**.

## Context

**What the six exclamation marks were about, measured.** Before this change the research road had exactly one surface in the app: `ResearchTry`, a one-question ask box, mounted inside "Open-source tools, weighed" on the Church → Infra Plan (`OpenSourceCandidates.jsx:137`), behind the church-staff gate. There was no place a research item could *live*. A link he sent could become a chat summary and nothing else — and a chat summary is lost at the next compaction, which is the same failure the spoken-teachings covenant exists to prevent.

**The premise I was given, and what was actually true.** The brief said there was "no on-ramp today" for an arbitrary video URL, and that the only thing I had measured — this sandbox cannot reach YouTube — meant a road had to be built. The first measurement was right and the conclusion was wrong:

- Measured here, 2026-10-21: `curl` to `youtu.be`, `www.youtube.com` and the `timedtext` caption endpoint all return `CONNECT tunnel failed, response 403`. That is a true fact about **this sandbox** and says nothing about what PoeTech can do.
- `.github/workflows/source-transcript.yml` already existed on `main`, taking a **URL as an input**, and already handed the link to `source-transcript-nas.yml` when YouTube challenged the runner — which calls `infra/nas-sme-pipeline/youtube-captions.py --ids <id>` on the NAS's residential address.

I dispatched that existing workflow rather than building anything. Run **39557721839**: the runner probe was bot-challenged in one second exactly as its own header predicts, the NAS job then fetched the captions, and the words landed. **No new fetch path was written for this record**, and the pick-up lane below calls that same loader. This is DR-0108's rule earning itself again: *a stated "we can't" is an unverified premise to challenge, not a place to stop.*

(Two smaller premise corrections for the next reader: `research-ask.yml` and DR-1127 **do** exist on `main` — my first check read a stale working tree. And the number moved **twice**, which is DR-1160's measured problem happening to this record in real time: DR-1165, the number I was given, was taken by `claude/ll257-count-our-days`, with 1166 and 1167 in flight, so I took 1168 — and PR **#2349** had moved onto 1168 at 06:50, before my push. By DR-1136 the second claimant moves and that was me, so this is **DR-1169**, done with `renumber-decision-record.mjs` on a clean tree and the pointer set by `resolve-ledger-conflicts.mjs`, which is the order DR-1021 prescribes. Three numbers for one record in one hour.)

**Legibility, measured after the renumber:** the regenerated `legibility-health.json` goes 362 → 363 pages and 349 → **350 passing**, with `trackedDebtPages` unchanged at 13 and 0 regressions — so the new page passes on its own and adds no debt.

## Decision

**The reality-trace, first, out loud.** The surface reads and writes `public.agent_inbox` on the database the app actually reads (the NAS's own Supabase since REPOINT-ARMED, DR-0310) — the same table, the same writer and the same parent/child tag shape the lessons already use, so nothing new is trusted:

| | |
|---|---|
| **writes** | one row per item, `tags: ['research']`, via `relayThought` (`agent-inbox-sync.js`), `source: 'research-section'` |
| **reads** | that person's own rows tagged `research` / `research-answer` / `research-failed`, `created_by = uid`, newest first |
| **reads** | `/research/health`, live, for whether the road can answer at all — never a painted status |
| **fields** | `id`, `body`, `tags`, `created_at`, `created_by`, `instance_id` |

Every value on screen is a real row, a real tag or a real timestamp. There is no painted count and no placeholder item.

**The states are facts in the row's own tags, never inferred from a clock:**

```
research                   the item he sent (a link, or a question)
research-claimed           ONE reader has taken it          -> "Being looked into now"
research-answer + of:<id>  the answer row                   -> "An answer came back"
research-failed  + of:<id> the road could not, and says why -> "Could not be looked into"
research-answered          on the item, once an answer exists (ends the waiting)
```

An item with none of these reads **"Waiting to be looked into"** however old it is, and the screen says *"Nothing has looked into this yet."* A queue that reads as finished is how an item he sent gets lost, so that is the behaviour under gate.

**The lock is the tag.** `research-inbox.yml` writes `research-claimed` **before** it spends the road, and the waiting query excludes a claimed row. On 2026-10-06 a row that could not say "taken" was claimed, failed, released and re-claimed six times in an hour (DR-0768); this is that lesson carried over.

**The pick-up lane reuses both roads that already existed.** Every 15 minutes (minute 7/22/37/52, off the fleet's `:00`) and on dispatch, it takes the oldest waiting row, claims it, and:
- a **link** → `youtube-captions.py --ids <id> --max 1` on the NAS, the same call `source-transcript-nas.yml` makes. Captions only. It **never** falls back to audio transcription: that spends the tower's GPU and is a decision to take on purpose, so a video with no captions is recorded as exactly that and the run stops.
- a **question** → `POST /ask` on the NAS behind the family key, the door DR-1101 brought home, with the question carried there as a **file** so it cannot appear in a process list or a log.

Then it writes the answer as a child row `created_by` **the sender**, so RLS returns it to the person who sent the item and to nobody else, and tags the parent `research-answered`.

**`verified:false` cannot be edited away.** It is asserted in three places on purpose, because presenting a model's answer as established fact is the one failure here that would reach a reader: the road stamps it (`research.js:120`); `research-answer-text.mjs` **refuses to write** an answer whose road stopped stamping it; and `research-items.js` sets it as a **constant on every item** rather than reading it from a row, so no row can arrive claiming to be checked. The sentence — *"Unverified: this came from a web search and our own model. Read the source before relying on a sentence."* — is the answer row's **first line** and is printed on every answered item and above the list. A video's description of what some platform allows is the speaker's claim, not ours, and it is the class of claim that is wrong six months later.

**What comes back is material to study, never instructions to obey.** A transcript or page that tells its reader to do something is a string in a document. The lane stores it; nothing in it acts on it.

**A 200 is not a ring, and the old wording was a promise the road is not keeping.** `classifyHealth` returns `live` on a `/health` 200, and the Infra Plan's ask box renders that as *"Live on the NAS · answering with X"*. **Measured 2026-10-21:** `/health` has been 200 with both models named (`qwen2.5:14b-instruct-q4_K_M`, `nomic-embed-text:latest`) while `POST /ask` answers **504, "no answer within 180s"** — the research-health witness has failed its last two daily runs (2026-10-19 and 2026-10-20) and incident **#2255** has been open since 2026-10-19 with seven comments. Reachable is not answering, which is DR-1110's own rule. This surface therefore says the narrower true thing: *"The road is reachable on the NAS and names its model (X). Reachable is not answering — a question can still time out."* The ask box's existing wording on the Infra Plan is left alone in this change: it is a real finding, it belongs to the road's own record rather than this one, and changing copy on a second surface mid-incident would bury it. **re-review: 2026-10-22** with the road's incident.

**What this means for the lane, stated plainly:** the **question** half of `research-inbox.yml` will fail while the road is dark, and it fails *honestly* — a `research-failed` child row carrying the road's own words, which the section shows. The **link** half, which is what Darrell actually sent, does not touch the research road at all: it rides the NAS captions loader, proven working tonight on run 39557721839. So the section and the half that matters tonight stand; the question path is degraded and says so.

**A read that failed is never an empty list.** `fetchMyResearch` returns `ok:false` with the reason, and the screen says *"your items could not be read, so this list is not empty — it is unknown"* with the reason given — different words from *"You have not sent anything to look into yet."* The waiting query treats a failed database read as an error, never as "no items waiting" (DR-0076).

**No bodies, no keys, in the logs.** The body travels base64 from SQL into a file and is never echoed; the step summary carries ids, kinds, characters and verdicts only. The family key is read on the NAS and never leaves it.

## What his link actually said, and the review he asked for

The first real item. Fetched on the NAS, 1083 words, auto-generated captions (a machine's hearing — wording is not safe to quote as the speaker's own), kept at `docs/99-session-notes/sources/tvtyme-options-aqgxzvsjwwg/`. It is a self-hosting pitch that opens on Sony deleting purchased films from the PlayStation Store and names **six options**. Measured against what this repository already runs:

| The video's option | Here |
|---|---|
| A **Raspberry Pi** or an old laptop as the home server | **Already past it** — a Synology NAS plus a 4070 tower, self-deploying by `services.json` |
| **Jellyfin** for your own films and shows | **Already running** — `poetech-jellyfin` on :8096, `infra/nas-libraries`, `libraries-health.yml` (DR-1121) |
| **Immich** ("Image" in the captions) for photos | **Already running** — `infra/nas-immich`, `immich-health.yml` (DR-1120) |
| **Audiobookshelf** for audiobooks | **Already running** — `poetech-audiobookshelf` on :13378 (DR-1121) |
| **Local cameras**, feeds never leaving the house | **Already running** — `infra/nas-cameras`, the Cameras tab (DR-0756, DR-0778) |
| "Websites where you can **acquire free movies**" | **Declined on principle, not capability.** He says "legally of course" and "something I would never ever do myself" over a description of piracy. We do not take it. Thrift-store DVDs ripped to our own library is the same option without the theft, and that is the one worth having. |

So the honest answer to *"review it"*: **the video's whole list is already running in this house, except the one option we decline.** Its value is confirmation, not a change (the DR-0143 house-first check), and the single thing it names that we have not built is a shelf of ripped DVDs — content, not capability.

**Unverified in it, flagged narrowly (DR-0100 tier 2):** the Sony claim as stated, the "$1,000 a year" figure and "one day to set up" are the speaker's, checked by nobody here.

## Proven to catch

| Break | Result |
|---|---|
| an unanswered row defaults to `answered` | **3 red**, restored 17 green |
| `verified` read from the row instead of a constant | **1 red**, restored 17 green |
| a failed read rendered as an empty list | **1 red**, restored 7 green |
| the health line put back to "answering with X" | **1 red**, restored 8 green |

25 cases across the two files. The surface test also pins that the shell still mounts the view, by reading the shell's own source.

## What is NOT closed

- **The new surface is not in `feature-registry.json`.** A new registry *surface* needs a walk in the shared `feature-presence` harness, and that file mocks neither the `agent_inbox` read nor the writer this section needs — adding a global supabase mock there would reach the other eleven surfaces it guards. The mount is pinned instead in `research-section-render.test.jsx`, where both seams are already mocked, with the same effect. No registered control was moved or dropped: `ResearchTry` keeps working on the Infra Plan and is additionally mounted here. **re-review: 2026-11-04.**
- **Nobody has seen it rendered.** This sandbox cannot reach poetech.us or a preview (403 at the egress proxy), so the surface is proven by tests and the layout probe, not by a human eye. The live review pass belongs to the stewards after the deploy (DR-0104).
- **The pick-up lane has not run against a real row.** It ships armed by merge (DR-0247) and its first fire is its own proof; its brakes are budget + lock, which is what the deterministic class carries (DR-0248). **re-review: 2026-10-22**, on its first real run.
- **No migration.** The section reads under the existing own-rows policy, so a member sees only their own items. If research items ever need a Governor's two-door view the way the lessons have one, that is a migration and its own record.
