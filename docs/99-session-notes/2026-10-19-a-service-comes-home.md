# 2026-10-19 — A service comes home by one Way (DR-1118)

**What Darrell sent.** A summary of a home-server video (one machine you own in place of about $1,000 a year of subscriptions: Jellyfin for films, Immich for photos, Audiobookshelf for audiobooks, cameras on your own network; the files on your own disk are the asset) and one line: *"Fix our processes and create a way."*

**What was true before.** The research road (DR-1101) had come home the night before and could not answer. It took three merges (#2257, #2258, #2259) and two and a half hours for the app to say why:
- the installer handed the model work to the NAS CPU and never tried the designated AI worker;
- fixed, it then exited at "no tower" before restarting the service onto the new code, so the old one kept hanging;
- the witness could say only "504".
By 04:04 UTC the road answered `/health 503` in 0.3 s with the reason in words. Both towers were off or asleep.

**What changed.**
1. **The Way:** `docs/00-foundations/_root/THE-WAY-A-SERVICE-COMES-HOME.md`, eight steps with a proof each. Routed in `docs/CONTEXT.md`, registered as `SERVICE-COMES-HOME` in `PRINCIPLES.md`, named in `required-reading.js`.
2. **The gate:** `app/src/__tests__/a-service-comes-home.test.js`. Every enabled installer exists and parses; research has every readable part; the 21 services born before the Way are listed with exactly what they lack, audited by 2026-11-15; a new service must join at birth.
3. **The register:** Immich (pilot, NAS), Jellyfin (hold) and Audiobookshelf (hold) weighed at their latest releases; the Infra Plan header is now counted from the rows and says what is built (Vane) instead of "none is installed".
4. **The ledger:** DR-1118; LESSONS-LEARNED 2026-10-19 entry and P73.

**Measured, not assumed.**
- The inbox, last twelve months: one subscription in the class, Google AI Plus (2 TB) (Google One), $9.99 a month. No Netflix, Hulu, Disney, Spotify, Audible, Plex, Prime Video or Apple TV receipt.
- The three repos shallow-cloned at their pins and read: licences, egress hosts, auth, CPU-only machine learning for Immich, port 13378 for Audiobookshelf.
- `services.json`: 23 enabled services; every installer parses under `sh -n`; the lacks ledger was read from the files and the gate was green on its first run.
- Proven to catch: the old installer (restart called from one path), a witness without the standing lines, a stale ledger entry.

**Held for Darrell.** Nothing. Immich's pilot is a dated step by the Way (2026-11-08); the towers being woken is the step that makes the research road answer (the PowerShell block is in the chat of 03:32 UTC).

**For the next session.**
- Bring Immich home by the Way: measure the pool first.
- The audit of the 21 older services, by blast radius, by 2026-11-15; strike each part from the ledger as it is built.
- Jellyfin and Audiobookshelf: name a library or a shelf, or re-date on 2026-12-01 with a why.
