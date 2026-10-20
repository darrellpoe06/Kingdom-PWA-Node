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

The gate lists `cameras` on the Way now. Twenty-one remain in the ledger, each with what it lacks; the next is taken in the same order.
