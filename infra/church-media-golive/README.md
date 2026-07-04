# church-media-golive — the weekly go-live pipeline (braked Python, no n8n)

**Started 2026-07-04, declared by Darrell:** "start the project for the church
infrastructure and this media scripts for our go lives each week — add it to the
PoeTech App build so we can run these projects as a team."

Per **DR-0083** every loop here is plain, headless Python — no n8n, no UI, no
login wall. The team board for this program lives in the app: **Projects →
"Church media go-live — weekly pipeline"** (`board-media-golive` in
`app/src/lib/board.js`). The board is the coordination surface; these scripts are
the doing layer.

## The weekly rhythm

| When | What | Script | Runs on |
|---|---|---|---|
| Wednesday | BG emails PROCLAIM scriptures/points/order (.docx) → app | `gmail_ingest.py` | NAS (scheduled, braked) |
| Wednesday | Index the Proclaim team's local docx archive (backfill + belt-and-suspenders) | `proclaim_docx_index.py` | Tower 2 (on demand) |
| Sunday −1h | GO/NO-GO check: disk, GPU, tailnet, targets | `preservice_check.py` | Booth laptop / tower (human runs it) |
| Sunday | Wall go-live = **VX Preset 1** (one button, already saved) | — (front panel) | Booth |
| After service | List channel uploads → whisper queue | `youtube_index.py` | Tower (on demand / scheduled) |
| After service | Transcribe (faster-whisper, RTX 4070) | tower pipeline (see tower CLAUDE.md) | Tower |

## Binding rules (same as every loop)

- **Ships inert.** Nothing here self-schedules. NAS scheduling goes through the
  `infra/nas-loops` runner (registry + `LOOPS_ARMED` + per-loop DSM entry), which
  enforces the **three brakes**: budget (timeout/caps), single-instance lock,
  kill-switch. Tower scripts are run by a human or a resident Claude on request.
- **Run-state is emitted, never painted.** Every run appends one JSON line to
  `events.jsonl` beside the script (`{at, script, ok, processed, note}`), which
  the Loops surface can read through — observing can never break the loop.
- **Assistive on Sundays.** Nothing autonomous during live service. Scripts
  report; humans press.
- **Credentials:** `gmail_ingest.py` needs a Gmail OAuth token only Darrell can
  mint (see the script header). Until then it exits with a clear message — it
  never half-runs.

## Provenance (verified 2026-07-03/04)

- BG's weekly email: `bg@thechurchofthelivinggod.com`, subject `MM-DD-YYYY
  PROCLAIM ...`, content in a .docx attachment; 200+ threads deep in the CC'd
  mailbox. The email body is only a signature — the attachment is the payload.
- The YouTube channel's published services are the **exact program output**
  (camera switches as broadcast) — both harvest source and future assistive-ATEM
  ground truth.
- Wall preset, tower specs, tailnet: `docs/99-session-notes/2026-07-03-led-wall-commissioning.md`.
