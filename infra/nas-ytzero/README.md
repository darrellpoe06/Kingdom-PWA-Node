# nas-ytzero — YT Zero, the sovereign chosen-channels-only YouTube inbox

**What this is.** YT Zero (`ghcr.io/pelski/ytzero`, pinned `0.25.3`) is a
self-hosted YouTube inbox: it pulls the **public RSS feeds** of only the
channels we choose into its own SQLite database on the NAS. No Google account,
no API key, no recommendation algorithm — a clean chronological feed we can
schedule, archive, and tag on our own terms. Optional yt-dlp integration
downloads videos for offline playback in its built-in player; profiles + locks
fit household use; SponsorBlock and DeArrow are supported. Source guide:
mariushosting, 2026-08-02 (their Portainer path is replaced here by our own
services-sync lane).

## Why it belongs here (the mission read)

The recommendation feed is the video-shaped version of the ratings posture
this platform exists to remove (DR-0098/DR-0100): an engine that decides what
the family sees next, optimized for watch time, not truth. YT Zero inverts
that — **only the channels we chose, in the order they published, on our own
hardware.** That is the sovereign direction (born-Python/NAS class, DR-0132
posture: a new capability lands as a NAS service, never a new n8n webhook),
applied to the family's video intake.

## Reality trace (DR-0061, run before building)

1. **Real data:** YT Zero reads public YouTube RSS and writes its own SQLite +
   downloads under `/volume1/docker/ytzero` — real state, no painted numbers.
2. **End-to-end:** the cloud sandbox has NO route to the NAS; the live proof is
   the services-sync run log plus the paste-block probe below (named honestly,
   not claimed).
3. **The surface the user uses:** YT Zero's own web UI at
   `http://192.168.1.26:3701` (LAN/Tailscale). No PWA wiring ships in v1 —
   see the tracked items below for why.
4. **Premises:** Container Manager present (proven by the running n8n stack);
   host port 3701 unclaimed across `infra/` (checked 2026-08-03); NAS repo
   mirror at `/volume1/PoeTech/repos/Kingdom-PWA-Node`; services-sync armed by
   `infra/nas-loops/ARMED-BY-RECORD` (DR-0247).

## How it deploys (no Portainer, no hand)

This service rides the self-deploy manifest (`infra/nas-loops/services.json`,
DR-0236): **merging this folder to `main` IS the deploy.** The NAS mirror
pulls, the services-sync loop runs `install.sh` (idempotent — data dir,
docker/compose discovery with the Synology absolute-path fallback, `compose up
-d` against the repo's pinned compose file, health probe). The image is pinned
to `0.25.3` — a version bump is a one-line PR through the gates, never a
silent `:latest` drift (DR-0076).

**First-cycle note:** the very first image pull can outlast the services-sync
480s ceiling. That cycle fails loudly, the next cycle resumes the pull and
finishes — self-healing, never silent.

## Verify after merge (Darrell's hand, optional but satisfying)

Plain: after the PR merges, the NAS installs it on its own next services-sync
cycle. To watch it happen or force it now, SSH in and run the installer
directly, then open the UI.

Ready to paste (works from anywhere, PS 5.x):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "cd /volume1/PoeTech/repos/Kingdom-PWA-Node; git pull"
ssh dpoe@192.168.1.26 "sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-ytzero/install.sh"
ssh dpoe@192.168.1.26 "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3701/"
```

A `200` on the last line means YT Zero is up. Then from any LAN/Tailscale
browser: `http://192.168.1.26:3701` — click **+ Add channels**, search a
channel, **Follow**. Downloads: left sidebar **Downloads** → **Configuration**
tab → switch **Allow downloads for this profile** on; downloaded files land in
`/volume1/docker/ytzero/downloads/`.

## Stop-paths (deterministic, per DR-0248 posture)

- Set `"enabled": false` on the `ytzero` entry in
  `infra/nas-loops/services.json` in a PR (stops repair/reinstall), and/or
- stop the container: DSM Container Manager → `ytzero` → Stop (or
  `sudo /var/packages/ContainerManager/target/usr/bin/docker stop ytzero`).

Note the container restart policy is `unless-stopped`: a deliberate stop
sticks across reboots; only a re-run of the installer (services-sync while
`enabled: true`) brings it back — so flip the manifest flag first when parking
it.

## Opportunities (what this opens)

- **Family video sanity:** per-person profiles with locks — kids see only the
  followed channels, chronologically. No autoplay rabbit hole, no Shorts feed.
- **COLG / teaching intake:** follow sermon, worship-tech, and sound-
  engineering channels; archive keepers offline via yt-dlp for the sanctuary
  workflow (pairs with the nas-sme-pipeline sources).
- **Offline + travel:** downloads live on the NAS; the built-in player serves
  them over Tailscale without YouTube in the loop at all.
- **$0/mo, zero vendor:** public RSS + our hardware. No API key to revoke, no
  account to profile us.
- **SponsorBlock/DeArrow built in:** sponsor segments skipped, clickbait
  titles/thumbnails normalized — less manipulation surface for the household.

## Constraints (named plainly, DR-0100 — no hedging, no hiding)

- **LAN/Tailscale only in v1.** The cloud PWA cannot reach it, and a naive
  in-app link would be broken off-LAN. Fronting it via the same-origin
  transport needs a proven Caddy route (WebSocket required per upstream) and
  most such apps misbehave under a path prefix — unverified, so not shipped
  (DR-0076). Tracked below with a re-review date.
- **RSS shows only each channel's most recent ~15 videos.** It is an inbox for
  what's NEW, not a full back-catalog mirror. Back-catalog archiving is a
  separate yt-dlp job if ever wanted.
- **yt-dlp breaks when YouTube changes.** Downloads (not the RSS feed) will
  periodically stop until the image is bumped. The pin makes bumps deliberate;
  the cadence item below keeps them from stalling.
- **Storage is real:** video downloads accumulate under
  `/volume1/docker/ytzero/downloads/` with no auto-pruning; the existing
  restic/backup discipline should EXCLUDE downloads (re-fetchable) and include
  the SQLite db.
- **Downloads are for personal/household use** — keep it to time-shifting and
  offline playback of channels we follow, not redistribution.
- **Third-party single-maintainer image.** The pin (not `:latest`) is the
  mitigation; every bump is a PR a human can see.

## Perpetual-improvement ledger (DR-0075 — why + re-review)

- **In-app surface / same-origin route:** not shipped — cross-origin Funnel
  throttling (the transport memory) and unproven path-prefix behavior.
  `re-review: 2026-08-17`.
- **Version-bump cadence:** pinned `0.25.3`; check ghcr.io tags and bump in a
  PR when yt-dlp downloads break or monthly, whichever first.
  `re-review: 2026-09-03`.
- **Download pruning / backup exclusion:** not wired in v1 (no data yet to
  size it). `re-review: 2026-09-03`.
