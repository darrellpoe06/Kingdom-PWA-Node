# The Way a Service Comes Home

**Status:** Foundation (one of our Ways). Declared by Darrell 2026-10-19. Recorded as **DR-1104**. Principle ID **SERVICE-COMES-HOME** (see `docs/decisions/PRINCIPLES.md`).
**Pairs with:** DR-0621 (hold the hand of the process), DR-1099 (the candidates register and its gate), DR-1101 (the research road, the first service to walk this Way and the one whose stumbles wrote it), DR-1000 (a 200 is not an answer), DR-0756 (the locked-door forwarder), DR-0770 (the running process follows the code), DR-0076 (verification), DR-0108 (review our Ways).

---

## In his words

> "Fix our processes and create a way."

(Darrell, 2026-10-19, sent with a summary of a home-server video: replace about $1,000 a year of subscriptions with one machine you own; serve your own films with Jellyfin, back up your own photos with Immich, shelve your own audiobooks with Audiobookshelf, keep your own cameras on your own network. The point he carried from it: the raw files on your own disk are the asset; each app is only the interface that turns them into a library.)

The night before, the research road (DR-1101) had come home and could not answer. It took three merges and two and a half hours for the app to say *why*. The three stumbles were all process, not code:

1. **The installer gave the work to the wrong machine** (the NAS's own processor, which cannot run a 14B model in time) and never tried the designated AI worker.
2. **The installer stopped before it moved the running code.** With no tower found, it exited early, so the old service kept hanging for 180 seconds on every question while the new one, which would have said the reason in seconds, was never started.
3. **The witness could say only that it failed.** It could not say which code the box was on, which dependency had been chosen, or whether the dependency answered from where the service runs.

Each one was found by a measurement and fixed the same night. This Way is those fixes written down once, so the next service that comes home walks past them instead of into them.

---

## What "home" means

A service has come home when a job a subscription used to do is done on hardware we own, with files we own, and the app can use it or say plainly why it cannot. Not installed, not "up", not green in a pipeline: **usable from the app, or honest in the app.**

The video's own rule holds first: **the files are ours before the app is.** A photo backup that only Immich can read is not a backup. Every service names the folder on the NAS pool where its files live, and that folder outlives the service. Remove the container and the library is still a folder of files.

---

## The Way: eight steps, each leaving a proof

A service comes home in this order. Each step leaves something a gate can read, so "it came home" is never a claim.

1. **Weigh it.** It enters the candidates register (`app/src/lib/open-source-candidates.js`) pinned to the exact commit that was read, with its licence, what it sends off our network, whether it can run code, which of our machines it fits, and what it replaces, with the receipt that proves the bill or the plain statement that there is none. `validateCandidates` is the gate. A tool that fails it is not a candidate.
2. **Own the files.** Its data lives in a named folder under `/volume1/docker/<service>` or the pool, written in the record. Nothing it needs is inside its container alone.
3. **One door, locked.** It listens on loopback only. The public Funnel reaches it through a forwarder behind the family key, the shape the cameras and the research road use (DR-0756). The road is written in `REHOMED_ROUTES`, `_routes.json`, the roads Worker, `RECORDED-STATE.md` and the Funnel watchdog, and the wiring test for that service pins all of them.
4. **It installs itself, and the running code follows the repo on every path.** A `services.json` entry and an idempotent `install.sh` that services-sync runs every fifteen minutes. The restart that moves the service onto the repo's code is one function, called on every path the installer can take, including "the dependency is not there". An installer that exits before that call leaves the old code running and the new code's reason unread; that is stumble 2, and the gate counts the calls.
5. **It says why.** `/health` answers with a `reason` in plain words, not only a code (DR-1000). A question that cannot be answered is refused in seconds, never left to hang. The thing it depends on, a tower, a model, a key, a folder, is probed **from where the service runs**, before the question is accepted, with a short timeout.
6. **A witness that says where the install stands.** A workflow asks it one real question on a schedule and on dispatch. When the answer is wrong, the witness prints, before anything else: the box's checkout, the dependency the installer chose, the code the service is running against the code in the repo, and whether each dependency answers from the box. Then it times each stage. A witness that can say only "it failed" is stumble 3.
7. **It shows in the app.** The surface shows the live `/health` and the service's own reason, verbatim, never a painted status. The register row on the Infra Plan names what was built.
8. **It seeds the next.** Its output is consumed by something (a lesson, a record, a witness, a person), and that consumer's proof now includes it (DR-0621). A service that answers to no one is not home.

**A loop is a service too.** A batch loop with no door (a harvest, a sync) keeps steps 1, 2, 4, 6, 7 and 8; its "says why" is the row it writes and the witness that reads it.

---

## The processes fixed on 2026-10-19

| Stumble | Where it was | The fix | Proven by |
|---|---|---|---|
| The NAS CPU was the last-resort model host; the designated AI worker was never tried | `infra/nas-research/install.sh`, `OLLAMA_CANDIDATES` | GPU towers only, the LEFT tower first; the choice recorded in `ollama.url` | `research_forwarder.py --selftest` (the NAS CPU refused as a tower; 44 checks, 6 fail with the check stubbed) |
| The forwarder restart sat after the dependency check, so "no tower" exited before it | `install.sh`, the early `exit 0` | `forwarder_follows_code`, one function, called on both paths | `research-road.test.jsx` (fails on the old file); a stubbed no-tower run restarts the unit and stamps the code |
| The witness said only "504" | `research-health.yml` | "where the install stands": checkout, chosen tower, running vs repo code, each tower from the NAS; then each stage timed | Run 39197259344: `/health 503` in 0.3 s with the reason, both towers named as not answering |

The whole night is recorded in DR-1101, with the timestamps.

---

## The four jobs the video names, against what we run

| Job the video brings home | Tool it names | What we already run | Verdict (DR-1104) |
|---|---|---|---|
| Cameras on our own network | — | `infra/nas-cameras` (go2rtc behind the family key, DR-0756), live in the app | **Already home** |
| Phone photos backed up to our own disk | Immich | `infra/nas-property-photos` reads the Synology phone backups for property and family albums; nothing backs the phones up except Google | **Pilot on the NAS.** The inbox holds one subscription in this class: Google AI Plus (2 TB) (Google One), $9.99 a month, charged on the 14th. Immich does the storage half of that job on our pool. |
| Our own films and shows | Jellyfin | nothing; the sermon archive is served by `church-media-golive` | **Hold.** No video subscription in the inbox and no library of our own films named. Re-read when a library exists. |
| Our own audiobooks | Audiobookshelf | nothing | **Hold.** No Audible receipt and no shelf of audiobooks named. Re-read when one exists. |

The rows live in the candidates register and show on the Infra Plan. A hold is not a no: it is the honest answer until there is a library to serve, with a date.

---

## The gate

`app/src/__tests__/a-service-comes-home.test.js` reads `infra/nas-loops/services.json` and holds every enabled service to this Way:

- every installer exists and parses;
- a service on the Way has a witness that says where the install stands, a door that answers with a reason, and an installer whose restart is one function called from more than one path;
- every service born before the Way is listed with exactly the parts it still lacks and one re-review date; the list must match the files (a part that was added must be struck from the list), and a date that has passed fails the build;
- a new service must be on one list or the other, so it joins the Way at birth (DR-0621).

The gate is proven to catch: the old installer, a witness without its standing lines, and a stale ledger entry each fail it.

---

## What this Way does not do

- It does not cancel a bill. The register says which bills exist (one, today) and which jobs have no bill behind them, so the gain is named honestly as control, or as money, never assumed.
- It does not run a tool that fails the candidates gate, the three brakes, or the licence review.
- It does not audit the twenty-two services born before it in one night. They are listed with what they lack and a date, and each is brought up to the Way in order of blast radius.
