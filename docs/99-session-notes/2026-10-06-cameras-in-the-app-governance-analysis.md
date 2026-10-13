# 2026-10-06 — Cameras in the app: the governance analysis (DR-0756)

Darrell, mid-build: *"Flexibility with rigorous control of the system and
processes... Identify: missing information, assumptions, risks, dependencies,
decisions requiring human approval, opportunities, constraints, DRs review
fully, never guessed, always data driven, timeline, intuitive design — what
where when how and why — what is enforced and is synchronization of each
component occurring, database-driven review of workflows."*

This note is that review, run on the camera feature before it shipped. Its
shape is meant to be reused: the same twelve headings, in this order, for any
feature that touches a public door, a device, or a person's data. The record
of decision is DR-0756; this is the working layer behind it.

## 1. What was asked, in his words

*"I want to be able to see my wyze cam feeds inside my PoeTech App... and any
system I own..."* Two clauses. The first names a brand; the second forbids a
brand-shaped answer.

## 2. Established facts (measured or fetched this session, never recalled)

| Fact | Source | How verified |
|---|---|---|
| The Observation board has carried a camera registry with "RTSP · registered — awaiting NAS bridge" since 2026-06-16 | `app/src/lib/observation-cameras.js` | read |
| Home fleet: Wyze (primary, several), Ring (≥1), a third brand unidentified; cameras on the flat segments | `NETWORK-SOVEREIGNTY-UCG-MAX.md` §Camera infrastructure; `2026-09-18-love-corner-network-topology-and-exposure.md` | read |
| DR-0050: church backbone ONVIF 4K PoE, Wyze supplementary, Floodlight Pro "spottier" | `docs/decisions/DR-0050` | read |
| go2rtc v1.9.14, 2026-01-19, "Native Wyze camera support #2011"; native Ring since v1.9.9 | github.com/AlexxIT/go2rtc/releases | fetched |
| Docker Hub tag `alexxit/go2rtc:1.9.14` exists, amd64 + arm64 | hub.docker.com API | fetched |
| go2rtc Wyze: account sign-in once via WebUI; DTLS firmware required; Gwell models (Cam OG, Pan v4, Floodlight Pro) unsupported; stream URL `wyze://ip?uid&enr&mac&model&dtls` | go2rtc `internal/wyze/README.md` | fetched |
| go2rtc API: `/api/streams` (GET/PUT/PATCH/DELETE), `/api/frame.jpeg?src`, `/api/stream.mp4?src`, `/api/stream.m3u8?src&mp4`, `/api/hls/{playlist.m3u8,init.mp4,segment.m4s,segment.ts}?id=` | `website/api/openapi.yaml`, `internal/hls/hls.go` | fetched |
| Progressive MP4 does not play on Safari/iOS ("no!"); HLS plays natively there | go2rtc `internal/mp4/README.md`, `internal/hls/README.md` | fetched |
| go2rtc passes localhost requests without authorization; `api.listen`, `rtsp.listen`, `webrtc.listen: ""` control exposure; host networking recommended | go2rtc README, `internal/api/README.md` | fetched |
| docker-wyze-bridge 2.10.3: WB_EMAIL/WB_PASSWORD/WB_API/WB_API_KEY; ports 8554/8888/8889/5000; bundles MediaMTX | github.com/mrlt8/docker-wyze-bridge | fetched |
| Tailscale Funnel bandwidth: "non-configurable", undisclosed; reports of trouble above ~5 Mbit/s | tailscale.com (blocked from this sandbox) via community mirrors | fetched, second-hand — marked as such |
| The NAS runs docker only via `sudo -n`; python is 3.8; services-sync cycle is 15 min with a 480 s ceiling | `infra/nas-ytzero/install.sh`, `services.json` | read |
| Every sovereign Funnel row is a 127.0.0.1 backend; tailscale strips the mount path | `RECORDED-STATE.md`, `voice_forwarder.py` | read |
| The family bridge token self-provisions on family devices (DR-0613) and is the bearer the photo/tax/voice servers already gate on | `lib/bridge-provision.js`, `lib/nas-photos.js` | read |

## 3. Missing information (named, with what was done about each)

- **Which Wyze models and firmware he owns.** Unknown until the fleet is listed; the surface will show it (the restreamer lists what signs in). Until then the Gwell limitation is stated, not guessed. re-review: 2026-11-15.
- **Which Ring device(s) and the third brand.** The surface accepts them as config lines; the README says how. Phase 0 of the UCG-MAX plan (inventory) is now a screen rather than a spreadsheet.
- **Funnel throughput in his real conditions.** Unmeasurable from here; the app measures time-to-first-frame, stalls, bytes per frame and shows them. re-review: 2026-11-06 on those numbers.
- **The exact `md5:` triple-hash derivation go2rtc accepts for the Wyze password.** Not verified → not used; plaintext in a root-only 0600 file, named as a risk. re-review: 2026-10-20.
- **Whether DSM 7's port 5000 would collide.** It would for docker-wyze-bridge's WebUI (DSM uses 5000/5001); go2rtc uses 1984 and avoids it. Noted for the fallback path.

## 4. Assumptions (stated so a wrong one is caught in a sentence)

1. The NAS can reach the cameras on the LAN (same segment today; VLAN 40 must keep NAS→IoT reach when it ships).
2. The family bridge token on his devices is current (DR-0613 provisions it; a stale one reads "key refused" on the surface, not a blank).
3. A services-sync cycle can pull a ~20 MB image inside its ceiling (ytzero's precedent: a first pull that overruns fails loudly and the next cycle finishes).
4. The browser's `<video>` answers `canPlayType('application/vnd.apple.mpegurl')` truthfully on Safari/iOS/Fire TV Silk and falsy on Chrome/Firefox (standard behavior; tested in jsdom where it answers '').

## 5. Risks (with the control and the date)

| Risk | Control | Date |
|---|---|---|
| Funnel bandwidth ceiling throttles live video | snapshots default; 2 live streams; 300 s ceiling; measured numbers shown | re-review 2026-11-06 |
| go2rtc Wyze source is 9 months old | pinned version; docker-wyze-bridge documented fallback; selftest guards the door, not the vendor | re-review 2026-11-15 |
| A public Funnel row in front of a lockless program | the forwarder IS the lock; 50 selftest checks prove 401s, no URL leak, ticket scope, caps, dark-reads-502 | gates merge |
| Wyze cloud API change breaks listing | written stream lines keep working; listing is a one-time step | — |
| Plaintext Wyze password in config | 0600, root-only, never in repo; md5 form once verified | re-review 2026-10-20 |
| A phone left streaming all night | server-side 300 s brake + client stops sweeping when the tab is hidden | shipped |
| Cameras on flat segments (2026-09-18 finding) | unchanged by this work; the VLAN plan carries it | that plan's dates |

## 6. Dependencies

Tailscale Funnel up (funnel-watchdog loop) → Pages Function → forwarder → go2rtc → LAN → cameras; the family key (DR-0613) on the device; docker via `sudo -n` on the NAS; python3 on the NAS (3.8-compatible code). CI: `cams_forwarder.py --selftest`; vitest; the guards listed in DR-0756.

## 7. Decisions requiring Darrell (and only these)

1. **Place the Wyze secrets** (email, password, API ID, API Key — a secret value only he holds) — one paste-ready block.
2. **Sign in once through the restreamer's WebUI** over the SSH tunnel to list the cameras — one paste-ready block. (Both in README and in the app's empty state.)
3. **Accept the one-time Wyze cloud touch** for enumeration (recommended: yes; the alternative is replacing hardware, which is the UCG-MAX trajectory anyway and not blocked by this).
4. **Whether church cameras join the same road** (the Observation board's registry). Recommended: yes, as a follow-up on this same transport. re-review: 2026-10-20.

Not his to decide, already settled by standing rules: family-only gating (the home is the family's business), sovereign-first (no vendor cloud in the viewing path), no DB copy of the registry (P15), the brakes (DR-0248).

## 8. Opportunities

- The Observation board's "awaiting NAS bridge" chip can retire onto this road.
- Phase 0 of the camera trajectory (inventory) becomes a live screen.
- Recording and events (Frigate, DR-0050) have a restreamer to sit beside; not in scope here. re-review: 2026-12-01.
- The same door/ticket pattern serves any future media the NAS holds (audio, recordings).

## 9. Constraints honored

CLAUDE.md typography; Funnel-never-serve (RECORDED-STATE rule 1); every PowerShell block cd-first and ASCII; python 3.8 on the NAS; 127.0.0.1 backends only; no new n8n; no `:latest` tags; the still screen; focus rings and 36 px targets; full-width tab content; the decision-record guard.

## 10. DRs reviewed

DR-0050 (church cameras plan; Wyze supplementary; Floodlight Pro note matches go2rtc's Gwell limitation), DR-0061/DR-0065 (reality-trace; app is primary), DR-0076 (verification), DR-0100 (speak fact), DR-0103/DR-0107/DR-0125 (lane, deploy proof, site witness), DR-0236 (nothing waits), DR-0248 (budget + lock), DR-0268 and DR-0330 (the built-but-never-actuated route class — this feature ships with all three pieces at once), DR-0613 (family key), DR-0617/DR-0218 (zero n8n), DR-0691/DR-0381 (a surface never goes blank).

## 11. Timeline (measured cadences, not hopes)

- **T+0 (merge):** the lane squash-merges on green; deploy runs; the Pages Function is live.
- **≤15 min:** services-sync runs `install.sh`; first cycle pulls the image (may overrun the ceiling once and finish next cycle); seeds config; installs the forwarder; mounts `/cams` only after both answer `200`.
- **Then, his two steps** (minutes).
- **Seconds after step 2:** cameras appear in the app on the next list refresh.
- **Ongoing:** site-health probes `/cams/health` each run; re-review dates above.

## 12. Intuitive design — what, where, when, how, why

**What:** a Cameras tab. **Where:** top-level nav, family-only, hidden otherwise. **When:** snapshots while the tab is visible; motion on a tap. **How:** the device's own decoder (HLS or MP4), no player library; the frame comes to the finger (in-place open). **Why:** his cameras, his server, no vendor between his eye and his yard; and the surface tells the truth about the link it rides.

## 13. What is enforced, and how synchronization is proven

Each hop has a deterministic check, listed in DR-0756 §"What is enforced". The answer to *"is synchronization database-driven?"*: for cameras the single source of truth is the running restreamer, read live — there is deliberately no database table to synchronize, because a copy would be a second truth. The review ledger stays in the repo (this note, the DR) and in the app (the Cameras surface itself reports the live state; site-health's incident issue is the downtime ledger).

## 14. The next ask, received during this build

Darrell: *"I also want to be able to pull my passwords into the PoeTech App as a sort of password management manager for the users..."* Recorded here so it is not lost to compaction; it gets its own decision record and its own PR, designed zero-knowledge (the server never holds a plaintext, the key never leaves the device), on the sovereign stack, with import from the exports people already have. The research for it began the same session.
