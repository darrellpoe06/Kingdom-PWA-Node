# 2026-10-19 — Every family member's logins made for them; the libraries come home (DR-1121)

**What Darrell said, while Immich was being built.** *"No waiting for later.... why?!!!!!!"* · *"Why can't we use them for our audio tts... etc..."* · *"Your do everything so users can just use them... End to end workflows"* · *"Ready logins for the app automatically gets access.... right"* · *"No my family does.... other users can do it on their server... make sense?"*

**What changed.**
1. **Accounts are made, not set up.** Migration 0303 (`home_accounts`, owner-read RLS, no app write; `home_account_seen`; `home_accounts_roster(p_bridge_token)` for the service role only). The `home-accounts` loop on the services-sync clock reads THIS household's roster by this NAS's own family key, makes each server's admin once, each member's account, and the row. A person opens the Big Picture and sees their logins ready.
2. **The libraries road.** Jellyfin and Audiobookshelf on loopback with the real shelves mounted read-only, served on the tailnet (never the Funnel: their apps cannot carry the key; the Way now names the exception), a health-only door on `/libraries`, `libraries-health.yml`.
3. **Two premises corrected from the code:** `voice-lite` is a pruned cache, not a shelf; `/volume1/PoeTech/yt-dlp` is the binary, not media. The real shelves: `/volume1/PoeTech/lesson-voice` and `/volume1/docker/ytzero/downloads`, plus `/volume1/PoeTech/library/{video,audio}` for the household's own files.

4. **The libraries are declared, not clicked.** The same loop declares the six mounted shelves (three on each server) by name, path and kind before the first account, with Jellyfin's internet providers off; the gate pins every `:ro` mount to a declared path. Built in the same session, not dated.

**Measured.** Loop selftest 32 checks (7 fail with the declarations emptied); door selftest 15; `home-accounts.test.jsx` 12; the gate: `libraries` on the Way, `home-accounts` a loop on the Way; digests from ghcr.io; YAML, JSON, registry, lint, gates.

**Next, now, in this session:** the 22 older services brought up to the Way, Funnel doors first.
