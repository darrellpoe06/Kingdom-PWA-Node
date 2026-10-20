# DR-1121: The libraries come home on the tailnet, and every family member's logins on the home servers are made for them and shown to them, never set up

**Date:** 2026-10-19
**Status:** accepted
**Tier:** B (two new self-deploying NAS services, one new loop, one migration with RLS, one new Funnel health door; additive; the loop is the deterministic class with budget and lock)
**Type:** infrastructure
**Area:**
- `infra/supabase/migrations-auto/0303-home-accounts-ready-for-every-family-member.sql` (`home_accounts`, `home_account_seen`, `home_accounts_roster(p_bridge_token)`)
- `infra/nas-home-accounts/` (`home_accounts_sync.py`, `install.sh`)
- `infra/nas-libraries/` (`docker-compose.yml`, `libraries_forwarder.py`, `poetech-libraries.service`, `install.sh`)
- `infra/nas-loops/services.json` (`home-accounts`, `libraries`, before `research`), `infra/nas-loops/loops/funnel_watchdog.py`, `infra/nas-transport/RECORDED-STATE.md`
- `app/functions/libraries/[[path]].js`, `app/public/_routes.json`, `app/src/lib/native-shell.js`, `infra/cf-roads-worker/worker.js` and `wrangler.toml`
- `app/src/lib/home-accounts.js`, `app/src/components/HomeAccounts.jsx` on the Big Picture
- `.github/workflows/libraries-health.yml`, `.github/workflows/ci.yml` (two selftests gate merge)
- `scripts/system-flow-registry.mjs`; `app/src/lib/open-source-candidates.js` (Jellyfin and Audiobookshelf built); `THE-WAY-A-SERVICE-COMES-HOME.md` (the named exception; accounts are made)

**Amends:** DR-1119's holds (already turned to pilots in DR-1120); adds two clauses to the Way. Grounds: DR-1120, DR-0128 (the family key provisions itself), USER-ACCOUNTS-AND-HISTORIES-STANDARD (a user's own account and history, RLS-scoped), DATA-AS-EMPOWERMENT, DR-0060, DR-0248 (budget + lock), P71 (a secret never rides a query string).
**Declared by:** Darrell, 2026-10-19, in four messages while Immich was being built: *"No waiting for later.... why?!!!!!!"*, *"Why can't we use them for our audio tts... etc..."*, *"Your do everything so users can just use them... End to end workflows"*, *"Ready logins for the app automatically gets access.... right"*, and the scope: *"No my family does.... other users can do it on their server... make sense?"*

## Context

DR-1120 brought Immich home with a panel that ended in four steps a person takes on their phone, one of them pasting the family key. Darrell's answer was the standard: the system does everything so users just use them. Two gaps were real:
1. **Accounts.** Each home server has its own login, and nothing made one for anybody. A person would have had to be set up by an admin, on three servers.
2. **The libraries.** The holds on Jellyfin and Audiobookshelf rested on "no library named", which was false: the spoken lessons with their transcripts live at `/volume1/PoeTech/lesson-voice`, the harvested sermon and worship video under `/volume1/docker/ytzero/downloads`, and nothing could browse either. (`/volume1/PoeTech/voice-lite` is a pruned 400 MB cache of the reading voice's clips, not a shelf; `/volume1/PoeTech/yt-dlp` holds the yt-dlp binary, not media. Both corrected from the code.)

**The scope he set:** this NAS serves his family. A household running PoeTech on their own server serves theirs. So the roster is bound to the key that already binds this box to this family: `family_secure_config.chat_bridge_token` (0128) equal to the token in `/volume1/PoeTech/secrets/chat-bridge-token.txt`. A wrong key lists nobody.

## Decision

1. **`home_accounts` (0303).** One row per (person, service): login, first password, server URL, header name, ready and seen times. RLS: a person reads only their own rows; no app write policy at all (the service role writes from the NAS). `home_account_seen(service)` clears the first password when the person says they have it. `home_accounts_roster(p_bridge_token)`: owner, admin and member of the non-church instance(s) whose family token equals the one passed; SECURITY DEFINER (it reads `auth.users`), granted to `service_role` only.
2. **The `home-accounts` loop** rides services-sync: one pass per cycle reads this household's roster with this NAS's own key, probes each home server on loopback, makes the server's admin ONCE on first contact (Immich's `admin-sign-up`, Jellyfin's startup wizard, Audiobookshelf's `/init`; credentials written to `/volume1/PoeTech/secrets/home-accounts.json`, mode 600, before the account exists), makes each missing account (Immich by email with a forced first-password change; Jellyfin and Audiobookshelf by the email's local part), and inserts the row. Idempotent; never deletes or rewrites; an account that already exists gets a row with no password. Brakes: 240 s budget, single-flight lock, 12 accounts per pass; no credential or no key is a named quiet no-op.
3. **The libraries road.** Jellyfin 12.2 and Audiobookshelf 2.37.1, pinned by digest, on loopback, with the shelves mounted read-only (`/volume1/PoeTech/library/{video,audio}` for the household's own files, the harvest and the spoken lessons). **The Way's named exception:** their TV and phone apps cannot carry the family key, so neither is on the Funnel; each is served on the TAILNET on its own port (`tailscale serve --https=8096`, `--https=13378`, never `funnel`), behind its own login. The Funnel gets `/libraries` → `libraries_forwarder.py` on 8802: `/health` only, each server's reason in words. The installer moves the door onto the repo's code before any step that can stop it (and once more at the end), and serves the tailnet ports only after both servers answer and the door is 200.
4. **`HomeAccounts` on the Big Picture.** For a signed-in family member: each server's own health verbatim; their own login; the first password with Copy and "I have it"; the server URL with Copy; for Photos, the header and Copy the family key (never printed); where to get the app. No row yet reads "being made on the NAS", which is true for one cycle. No session, or no key and no rows, renders nothing.
5. **The register:** Jellyfin and Audiobookshelf carry `builtRef: 'DR-1121'`.

## What was measured

- `home_accounts_sync.py --selftest`: 25 checks against fake servers and a fake PostgREST, all proven to catch: the admin made once and never twice, two people × three servers = six rows, a second pass creates nothing, a new member gets exactly three, an existing account gets a row with no password, the cap per pass, the lock, a server down named and skipped while the others are served, another household's key listing nobody, no key skipping with the why, the roster always asked with this NAS's key.
- `libraries_forwarder.py --selftest`: 15 checks (both versions in `/health`, a fresh server live with its note, a missing shelf 503 naming it, six server paths 404, origins, both reasons when both are down).
- `home-accounts.test.jsx`: 12 tests (the state per server from its own door, rows read and never thrown on, "I have it" only when the RPC confirms, the panel's three states, copy and clear, the migration's RLS and household-scoped roster, the loop's key and selftest in CI, the road wired, the compose pinned and read-only, the installer's order, tailnet never funnel).
- Image digests resolved from ghcr.io: `jellyfin/jellyfin:12.2`, `advplyr/audiobookshelf:2.37.1`.
- The gate `a-service-comes-home.test.js`: `libraries` on the Way with every part; `home-accounts` a loop on the Way lacking only what a loop lacks by nature.

## Impact and what is still open

- Nothing runs until services-sync pulls this merge; the two large first pulls (this road and Immich) are in separate cycles' shadows by their order in the manifest.
- `0303` applies through db-migrate; until it has, the loop's roster call answers 404 and the loop records that in its ledger, which `libraries-health.yml` reads.
- Jellyfin's libraries and Audiobookshelf's shelves are created by their admins on first run through their own UIs or APIs; the loop makes the logins, not the library definitions. That is the next step of this road, built the same way: the loop declares the libraries from the mounted folders (Jellyfin `/Library/VirtualFolders`, Audiobookshelf `/api/libraries`). `re-review: 2026-10-26` with the live ledger.
- A person's part: install the app, sign in once. For Photos, the one header setting; for Video and Audio, Tailscale on when away from the house.

## Verification

- Selftests OK (25 and 15); vitest suites in the session note; YAML, JSON and the registry parse; lint; the gate scripts green.
