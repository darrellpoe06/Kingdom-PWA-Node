# ARCHIVED — `voice-ops/` (TypeScript v0)

**Status:** Archived 2026-05-18. Replaced by the canonical implementation at `/backend/voice-worker/`.

---

## Why this is archived

There were two Cloudflare Worker codebases in the repo, both named `poetech-voice-ops` and both targeting the same Twilio voicemail integration:

| | This folder (archived) | `/backend/voice-worker/` (canonical) |
|---|---|---|
| Language | TypeScript (`worker.ts`) | JavaScript (`index.js`) |
| Webhook style | Two endpoints: `/webhook/twilio/recording-complete` + `/webhook/twilio/transcription-complete` | One endpoint: `/webhook/twilio` |
| Schema | `inbound_calls` + `audit_log` | `inbound_calls` + `usage_monthly` |
| Usage cost tracking | None | `usage_monthly` table — the PWA's Voice Ops cost panel reads this |
| Health check | None | `/healthz` |
| R2 audio archival | Bound (commented as optional in wrangler.toml) | Not bound |
| Audit log | `audit_log` table for every action | Not present |
| HIPAA guard | Implicit | Explicit `ALLOWED_LINES` rejection |
| Compatibility date | 2026-05-01 | 2025-05-01 |
| Tracked by git | Yes (before this consolidation) | No (added during this consolidation) |
| PWA references it | No | Yes — `app/src/poe-financial-mvp-v28.jsx` lines 5866, 5874, 5999 + README link |

The PWA's 📞 Inbound tab, Voice Ops cost panel, and public README link all point at `/backend/voice-worker/`. That made it unambiguously canonical. This TypeScript version pre-dated those PWA features and was never wired to anything live.

## What's worth porting later (do NOT delete this folder)

Three pieces in this archive are worth porting into the canonical worker when there's reason to:

1. **`audit_log` table** (in `schema.sql`) — every webhook hit, status change, and worker action records a row with `at`, `actor`, `action`, `call_id`, `payload`. Useful for HIPAA-adjacent compliance posture (even though TLC stays out of this pipeline) and for debugging Twilio Studio flow misconfigurations. Port when the first real customer ships and audit trail becomes a sales requirement.

2. **R2 bucket binding** for long-term voicemail audio archival. Twilio purges recordings after a default retention window; mirroring to R2 (Cloudflare's $0.015/GB-month storage) gives indefinite retention for compliance, dispute resolution, or training-data purposes. Port when voicemail volume justifies it.

3. **Dual-webhook pattern** (`recording-complete` + `transcription-complete` as separate endpoints) — slightly more robust if Twilio's transcription is slow or fails, because the row is created on `recording-complete` and only enriched later by `transcription-complete`. The canonical single-endpoint pattern is simpler but requires Twilio's transcription to be synchronous (which it usually is, but not guaranteed). Port if you ever see "transcript: null" rows in production.

## How to reactivate this version (don't)

If for some reason you need to restore this as the live worker:

1. `mv _archive/voice-ops-typescript-v0 ../voice-ops`
2. Update `app/src/poe-financial-mvp-v28.jsx` lines 5866, 5874, 5999 to point at the TS endpoints (note: endpoint URLs differ — `/webhook/twilio/recording-complete` vs `/webhook/twilio`).
3. Remove the `usage_monthly`-dependent UI in the PWA Voice Ops cost panel, OR backport `usage_monthly` from `/backend/voice-worker/migrations/0001_init.sql` into `schema.sql`.
4. Update Twilio Studio flow to call both webhooks instead of one.

You almost certainly should not do any of that. Port specific features (above) into the canonical worker instead.

## Original deploy runbook

See `README.md` in this folder for the original deploy steps. The canonical runbook lives at `/backend/voice-worker/README.md`.

---

*Archived as part of the 2026-05-18 infrastructure consolidation pass. Git history before this date preserves the active state of this folder under its original path `/voice-ops/`.*
