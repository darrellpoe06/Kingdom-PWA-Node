# 2026-10-21 — The runner walks the road, and the door keeps its own (DR-1159, DR-1162, DR-1163, DR-1164)

**What changed and why**, in one page. Four records landed on `main` in one morning, every one from a thing Darrell said while looking at the live Properties tab or at the phone that had stopped ringing. The records are `docs/decisions/DR-1159-*.md`, `DR-1162-*.md`, `DR-1163-*.md`, `DR-1164-*.md`; this note is the working log behind them.

## The asks, in his words

- The phone alarm had been refused since 2026-10-20T22:20Z and the agent handed him a PowerShell block to paste the token: *"One move and why can't you use cli... or ssh?!!!!!"* then *"Make that mandatory... add to the Ways and documentation."*
- "Seen as a manager" on 805 North Prospect Avenue Apt 1, Cameras: *"my personal home cameras should be an option only I can give... not a property manager... camera location should be a significant issue for kpi... so they shouldn't be able to see my home cameras unless I give them that... so far only 805..."*
- "Seen as a 1099 worker" on 709 Commercial St, Pictures reading "No pictures on this property yet" while the Edit side's shelf showed 121 on the NAS: *"1099 worker won't see pictures of the property?"*, *"Yes it does on the other edit side... my point"*, *"Fix it... and whatever else makes more sense"*, *"Landlord chooses what to show some or all?"*
- *"Also... documents and renewal dates on a calendar with reminders etc..."*

## What was measured before anything was built

| finding | where | measured |
| --- | --- | --- |
| The bell's bearer had drifted from the NAS's own `announce-token.txt`; four "did not ring" notes on #2057 | `site-health.yml` → `scripts/ops-announce.mjs` | HTTP 401 from the relay on every ring since 22:20Z |
| The repository already reached the NAS from a runner over the tailnet, three workflows deep (`TS_AUTHKEY` + `NAS_SSH_KEY`), and the NAS held a repo+workflow GitHub token (DR-0085) | `deploy-cloudflare-pages.yml`, `push-sender-credentials.yml`, `cf-roads-worker.yml` | the road existed; the fix had been scoped to a sandbox with no route |
| The manager face was offered the NAS's whole camera list, the family's home cameras named on a manager's screen | `DoorCameras.jsx` | 33 cameras offered; "Not shared (21)" listed every name |
| A camera's place lives only in its name; the 805 cameras carry the house number, the home's carry none | the NAS camera registry (`id`, `name`, `kind`, `road`) | no place field exists yet |
| The worker's Pictures tab reads `property_photos` (0185 admits a delegated worker); the NAS archive is behind the family bearer and no other seat can read it | `DoorTabs.jsx`, `photo_server.py` | 709 had 0 filed rows and 121 on the archive |
| DR-1084's expiry registry and calendar proposals were mounted on the Books → Legal shelf only; a door's paper had no column for the day it stops being true; the door shelf's exact kind tokens never matched the registry's phrase patterns | `document-validity.js`, `DocSigning.jsx`, `property_documents` | a filed insurance policy read as "not watched" |

## What changed, record by record

**DR-1159 — a value the NAS holds comes to the lane by the runner, never by a hand (#2344, merged 07:31Z).**
`.github/workflows/announce-bearer-sync.yml`, dispatch-only, one at a time, no clock: joins the tailnet, reads `announce-token.txt` and `github-token.txt` from the NAS, masks both, installs `VITE_N8N_BEARER` with the NAS's own token, reads it back by name and date, rings once at the lowest priority through the witness's own script; a refusal fails the run. Nothing is printed. The order of roads is now a mandatory Way (amends DR-0108 §4): a runner over the tailnet first; ConnectBot second; a hand last, only for a value only Darrell can mint, with the reason. A paste handed for a NAS-held value is a Ways finding. Written into `CLAUDE.md` (the Layer 0 ceiling 57575 → 57891 bytes, recorded in the DR as DR-0621 did), `PRINCIPLES.md` (RUNNER-REACHES-THE-NAS), `THE-WAY-A-SERVICE-COMES-HOME.md`, `REVIEWS.md` (REV-0258). The flow registry carries the workflow (reads the NAS file on a dispatch, writes the secret and the announce road, seeds site-health).

**DR-1164 — a manager is offered the cameras at the door's address and no others (#2345, landed through #2346's squash, ced4f69).**
`door-cameras.js`: `splitCamerasByDoor` sorts a door's list into *here* (this address), *elsewhere* (another house number) and *unplaced* (no address in the name: the family's own, or not yet named); `offeredCameras('manager')` is the here-group, the owner is offered everything, the door's own first. `DoorCameras.jsx` takes `role`; the picker, what the tenant sees, what is not shared and the access desk read the offered set. A camera the owner shared beyond the address is counted on the manager's screen, kept through a manager's Share, never named. Deferred with a date: the place becomes a field on the NAS registry, not a prefix in the name, by `re-review: 2026-11-11` or the first camera at a second address.

**DR-1162 — the landlord files some or all of a door's NAS archive to its record in one move (#2346, merged 08:36Z, ced4f69).**
`DoorTabs.jsx` NasShelf: a tick on every unfiled tile; "File N ticked as records" / "Use N ticked on the listing"; on the door's own archive "File all N on this door's archive as records", paging the NAS 24 at a time (at most 50 pages), skipping what the door already holds (0285), filing each once through the same path a single pick uses, counting what landed and what did not, one refresh at the end (DR-0947). The empty gallery says what kind of none it is: "No pictures filed to this door's record yet", then on a family device with the archive in reach "This door's NAS archive is below: file some or all, and everyone on this door sees them"; on any other seat "The family keeps this door's archive on the NAS; what they file shows here." Deferred with a date: `re-review: 2026-11-11` on carrying only the source and thumbnail for a filed NAS picture.

**DR-1163 — a door's paper says when it stops being true, and proposes its renewal to the calendar (#2348, merged 08:58Z, 6c0f418).**
Migration 0305: `property_documents.expires_on` (date, nullable; null is "not read", never "does not expire"; RLS unchanged, 0154). `document-validity.js`: `insurance-door`, `inspection-door`, `permit-door`, matched as the whole field token so "Insurance claim dispute" and "About the insurance" stay nothing. `DocSigning.jsx` PapersPanel: the family's "Expires on" per paper (written with `patchDocument`), the validity sentence naming which date it judges by, and `DocumentRenewals` over the door's own papers when the calendar is in reach; a confirmed proposal becomes an ordinary calendar event with the kind's reminders. A tenant edits no date and is proposed nothing. The shell hands `addEvent` on the existing Properties mount line (5192 lines, the frozen budget holds). Deferred with a date (`re-review: 2026-11-04`): a reminder that reaches a closed phone (a braked NAS clock over `expires_on` through the sovereign push road), and a portfolio view of every door's renewals.

## Verification (runs, not claims)

| what | proof |
| --- | --- |
| The bell is back | announce-bearer-sync run 39562783913: ten steps green; `VITE_N8N_BEARER updated 2026-10-21 (read back from GitHub)`; `ops-announce: the announce relay accepted the push (HTTP 200)`; no value printed. Close-out comment on #2057. |
| Deploys proven, not assumed | Deploy (Cloudflare Pages) runs 39562686865 (5c7935d, DR-1159), 39570623189 (ced4f69, DR-1162 + DR-1164), 39573387121 (6c0f418, DR-1163): all `success`. |
| 0305 applied on the cloud database | db-migrate run 39573412203: `=== applying 0305-a-doors-paper-says-when-it-stops-being-true.sql ===` → `ALTER TABLE`, `COMMENT`; `summary: applied=1 skipped=303 failed=0`; live-definition witness 42 functions matched. |
| 0305 on the sovereign database | the same run's replay over the tailnet from the NAS checkout at 6c0f418: `applied 0 this run, ledger 309/305, frontier: none` (the NAS's own loop had already landed it); "The sovereign database now carries every migration this checkout holds." |
| Suites | cameras 18 (2 red with the offer rule mutated, 18 restored); gallery suites 86; `document-validity` 34 + `doc-signing` 7; source guards and interconnect 138; lint 0; business-systems and decision-citation guards OK on every push. |

## The ledger race, as it happened

Three sessions wrote records in the same hour. The camera record moved DR-1161 → DR-1164 when main took 1161; the stack's pointer sat on DR-1165 when #2339 took it, so every branch went dirty and was merged forward with `scripts/resolve-ledger-conflicts.mjs` (one conflict block each time, zero markers after, one `Next ID` line). One forward merge left nested markers the resolver refuses; the index was rebuilt from the clean base with this stack's rows. #2340 still claims DR-1162 and DR-1163 on its branch and landed second on both; by DR-1136 that renumber is its author's. Twelve migration prefixes are already shared, keyed by filename, so #2340's own 0305 and 0306 beside this 0305 are not a break.

## Still Darrell's hand, named

The poetech-roads Worker (DR-1158 carve-out, dies 2026-10-28) waits on a Cloudflare token with Workers Scripts:Edit and Workers Routes:Edit, a value only he can mint; `cf-roads-worker.yml` with `deploy=yes` is the one move once `CLOUDFLARE_API_TOKEN` carries it.
