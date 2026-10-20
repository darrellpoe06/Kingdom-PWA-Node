# 2026-10-19 — Every family member's logins made for them; the libraries come home (DR-1121)

**What Darrell said, while Immich was being built.** *"No waiting for later.... why?!!!!!!"* · *"Why can't we use them for our audio tts... etc..."* · *"Your do everything so users can just use them... End to end workflows"* · *"Ready logins for the app automatically gets access.... right"* · *"No my family does.... other users can do it on their server... make sense?"*

**What changed.**
1. **Accounts are made, not set up.** Migration 0303 (`home_accounts`, owner-read RLS, no app write; `home_account_seen`; `home_accounts_roster(p_bridge_token)` for the service role only). The `home-accounts` loop on the services-sync clock reads THIS household's roster by this NAS's own family key, makes each server's admin once, each member's account, and the row. A person opens the Big Picture and sees their logins ready.
2. **The libraries road.** Jellyfin and Audiobookshelf on loopback with the real shelves mounted read-only, served on the tailnet (never the Funnel: their apps cannot carry the key; the Way now names the exception), a health-only door on `/libraries`, `libraries-health.yml`.
3. **Two premises corrected from the code:** `voice-lite` is a pruned cache, not a shelf; `/volume1/PoeTech/yt-dlp` is the binary, not media. The real shelves: `/volume1/PoeTech/lesson-voice` and `/volume1/docker/ytzero/downloads`, plus `/volume1/PoeTech/library/{video,audio}` for the household's own files.

4. **The libraries are declared, not clicked.** The same loop declares the six mounted shelves (three on each server) by name, path and kind before the first account, with Jellyfin's internet providers off; the gate pins every `:ro` mount to a declared path. Built in the same session, not dated.

**Measured.** Loop selftest 32 checks (7 fail with the declarations emptied); door selftest 15; `home-accounts.test.jsx` 12; the gate: `libraries` on the Way, `home-accounts` a loop on the Way; digests from ghcr.io; YAML, JSON, registry, lint, gates.

## The audit of the services born before the Way began the same night (2026-10-20)

Highest blast radius first: **cameras** (Darrell: "Cameras never work"). Two parts, both proven:
- `infra/nas-cameras/install.sh`: the forwarder restart is now one function, `forwarder_follows_code`, called before compose up and the go2rtc wait, and once more at the end. Before: "go2rtc silent after 60s" exited ahead of the restart and left the OLD forwarder serving with the new code's reason unread, the research road's stumble 2 in this installer. Proven under stubs: on the no-go2rtc path the unit is enabled, restarted and stamped (`systemctl restart poetech-cams`, `.forwarder.code.sha` written).
- `camera-health.yml`: a "where the install stands" step after a failed judge: checkout, forwarder and recorder running code against the repo's, the release epoch on both sides, each unit, go2rtc and the bridge from the box, the Funnel mount, the last lines of each.

Then **voice-lite** (the reading voice the phones fall back to) and **scribe** (every recording's door), the two that lacked only a witness:
- Each door now says why: voice-lite's 503 carries `reason` beside `piper-not-installed`; scribe's `/health` is 503 with the reason when the recordings folder is missing or not writable, instead of a 200 that meant nothing (DR-1000).
- Each installer's restart is one function, `server_follows_code`, called before the step that used to exit first (voice-lite: the piper and voice downloads, each an `exit 0`; scribe: the venv build under `set -e`) and once more at the end. Proven under stubs for scribe: on a box with no venv the function runs first, says "venv not ready yet", and the failing venv step is still loud.
- `voice-lite-health.yml` and `scribe-health.yml`, one shape: `/health`, one real question with the family key (one spoken sentence measured as audio bytes; one sessions read measured as a count), "where the install stands" on a failed verdict, a rolling incident issue each.

Then **tax-upload** (real money's road, DR-0330), whose witness was the site's: its door now says why (503 without a path when the drop folder is not writable; a reason when no archive is published yet); its restart is one function before the venv step and at the end, with a sha256 stamp written only on a successful restart (the old md5 stamp was written even when the restart had failed); `tax-upload-health.yml` asks for the archive with the family key and counts entries only.

Then **mcp** (the agent's own hand on the NAS, DR-0244): it had no open door at all, only the token-locked RPC, so nothing could say why without a token. Now `GET /health` (both spellings) answers ok, the tool count and the serving code's sha, or 503 with the reason when the token is unset or the briefing dir does not resolve; the installer's restart is one function before the venv step and at the end, and it probes the open door; `mcp-health.yml` keeps its outside-in Funnel probe as the first eye and adds the Way's: /health on loopback, one discover with the token read on the box, where the install stands on a failure, a rolling incident issue, a daily clock it never had.

The gate lists `cameras`, `voice-lite`, `scribe`, `tax-upload` and `mcp` on the Way. Seventeen remain in the ledger, each with what it lacks; the next is taken in the same order.
