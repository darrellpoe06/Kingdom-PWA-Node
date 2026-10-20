# 2026-10-19 — Immich comes home by the Way (DR-1120)

**What Darrell said.** *"Bring Immich home by the Way now."* Then, on the dated items in my report: *"No waiting for later.... why?!!!!!!"* And on the two holds: *"Why can't we use them for our audio tts... etc..."*

**What changed.** The first service born by THE-WAY-A-SERVICE-COMES-HOME, the day after it was written:
1. **Own the files:** the library at `/volume1/PoeTech/immich` on the pool, the database under `/volume1/docker/immich`.
2. **One door, locked:** Immich on `127.0.0.1:2283`; `immich_forwarder.py` on `127.0.0.1:8803` (8801 until 2026-10-20, when the first live witness found Supabase Studio already on it) passes only `/api/*` under `X-Family-Key` (the key stripped before Immich; Immich's login still behind it); pages are 404. Brakes: 6 in flight, 4 GB per body, 600 s, uploads paused under 50 GB free.
3. **Installs itself:** `services.json` (last), `install.sh` that moves the forwarder onto the repo's code before any step that can stop it, measures the pool, seeds the password once, waits for Immich's ping, mounts `/photo-backup` only after the whole road answers.
4. **Says why:** `/health` reasons in words (library missing, pool under the floor with the numbers, Immich not answering, a wrong ping).
5. **Witness:** `immich-health.yml`, a version lookup through the door with the family key; on failure, where the install stands first.
6. **In the app:** `PhotoBackupStatus` on the Infra Plan: the live reason, the four phone steps, the server URL and header, Copy the family key (never printed).
7. **Seeds the next:** the library is what the albums read next, and the proof before the Google plan's storage is cancelled.

**Two premises corrected** (in DR-1120 and the Way's table): the app already has a foreground pick-and-verify backup lane; Immich is the background one a PWA cannot be. And the "no library" holds were wrong: the voice's lesson readings, the spoken lessons and the sermon harvests are libraries on the pool. Jellyfin and Audiobookshelf are pilots on the NAS, next by the Way.

**Measured.**
- Forwarder selftest: 38 checks OK, each proven to catch.
- Installer under stubs: no-docker path restarts and stamps the forwarder before stopping; pool-floor path stops after it.
- Digests resolved from ghcr.io for the two Immich images; valkey and postgres by the release's own digests.
- `photo-backup-road` 11, `a-service-comes-home` 9, `open-source-candidates` 16 (8 / 1 / 4), `research-road` 16, the route test 31; YAML and JSON parse; lint; the gate scripts green.

**A person's step, by nature:** the Immich app on a phone is set up once with the header and the key from the panel. The panel carries the steps.

**Next, now:** Jellyfin and Audiobookshelf by the same Way; the 22 older services brought up to the Way, starting with the doors on the public Funnel.
