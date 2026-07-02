# Source-Adapter Interface — Sovereign Aggregator Backbone

**Date:** 2026-07-02  
**Status:** Active — RSS adapter (adapter #2) proven against this seam.  
**Governs:** `infra/nas-sme-pipeline/*-ingest.py`, `infra/supabase/migrations-auto/0066-content-sources-platform-seam.sql`

---

## 1. Why This Document Exists

The PoeTech sovereign aggregator backbone was built for YouTube first (COLG-Champaign, adapter #1). This document codifies the adapter seam that makes the backbone platform-agnostic — proven by implementing a second, independent adapter (RSS/podcast, adapter #2) without touching the YouTube adapter or the shared backbone logic.

**Binding principle:** the backbone is platform-agnostic and multi-tenant/channel-scoped. COLG-Champaign is tenant #1, never hardcoded. Every table, every RLS policy, every harvest calculation is keyed on `instance_id` — not a channel ID, not a platform.

---

## 2. The Canonical Item Record

Every platform adapter normalizes its raw platform items to this shape before writing to the backbone store. This is the seam — the contract between any adapter and the shared store.

```
CanonicalItem {
  item_key:         str   -- stable, globally-unique key within this instance.
                          -- Namespace convention:
                          --   YouTube: raw video ID (no prefix) — backward compat
                          --   RSS:     "rss:{guid_or_link}"
                          --   Vimeo:   "vimeo:{video_id}"
                          -- Stored in video_harvests.video_id.

  platform:         str   -- 'youtube' | 'rss' | 'vimeo' | ...
                          -- Stored in video_harvests.source_platform (0066).

  title:            str   -- episode/video title. Required.
  published_at:     str   -- ISO-8601 date (YYYY-MM-DD). Required.
  url:              str   -- canonical web URL (watch page or episode page).
  item_url:         str?  -- direct media URL (audio/video file). NULL for YouTube
                          -- (the watch URL is derivable); required for RSS (the
                          -- enclosure URL) and Vimeo (the download URL).
  description:      str?  -- episode description or summary. Written as the
                          -- preliminary transcript text when no full transcript
                          -- is available (source = 'rss-feed' | 'youtube-asr' ...).

  source_kind:      str   -- 'service' | 'lesson' | 'other'
                          -- Adapter infers this from title/description keywords.
                          -- 'service' = a Sunday/Wednesday worship service.
                          -- 'lesson' = a teaching, study, class.
                          -- 'other' = everything else.

  platform_meta:    dict  -- raw adapter-specific fields (channel_id, feed_title,
                          -- itunes_duration, ...). Written to a `meta` JSONB column
                          -- if present; not required by the backbone.
}
```

---

## 3. The Adapter Contract

Every platform adapter is a Python script in `infra/nas-sme-pipeline/` that:

### 3.1 Must declare

```python
PLATFORM = '<platform>'  # 'youtube' | 'rss' | 'vimeo' | ...
```

This constant is the guard signal — the CI guard (`scripts/source-adapter-guard.mjs`) checks that every `*-ingest.py` that writes to `video_harvests` declares a `PLATFORM` constant.

### 3.2 Must implement (as functions or inline logic)

| Method | Signature | Description |
|---|---|---|
| `discover_items` | `(feed_config, max_items) → [RawItem]` | Pull the latest N items from the source. Uses only the platform-specific config (channel_id, feed_url, etc.). Returns raw platform items — not yet normalized. |
| `normalize` | `(raw_item) → CanonicalItem` | Map a raw platform item to the CanonicalItem shape. Must produce a stable `item_key` for the same item across calls (idempotent). |
| `fetch_transcript_text` | `(canonical_item) → str \| None` | Return the best available text for the item without GPU. YouTube: caption API. RSS: description text. Returns None when no text is available (triggers Whisper-on-NAS fallback path). |

### 3.3 Must honor the three-brakes rule (CLAUDE.md autonomous-automation)

1. **Budget** — `--max N` caps items per run. A run that reaches N stops; re-running picks up where it left off.
2. **Concurrency lock** — a `.{script}.lock` file in `out/`. A second run while the first is live SKIPS (exits 0).
3. **Stall guard** — exits non-zero (code 3) when a run advanced 0 items while gaps remain.

### 3.4 Must support `--dry-run`

`--dry-run` fetches + normalizes but writes NOTHING to the database. Prints the CanonicalItem rows that WOULD be written. Required for verification without a production write.

### 3.5 Must write to the backbone store

- **`video_harvests`** — one row per item, with `source_platform`, `item_url`, and an empty `harvests = {}` JSONB (the harvest extractors fill this later).
- **`video_transcripts`** — one row per item when text is available (caption text, or RSS description). Uses `source = 'rss-feed'` | `'youtube-asr'` | etc.

Writes use the Supabase REST API with the service-role key (bypasses RLS). The key lives at `/volume1/PoeTech/secrets/supabase.json` on the NAS, identical to the finance-ingest secret.

---

## 4. Registered Adapters

| Adapter | File | Platform | Auth | Status |
|---|---|---|---|---|
| YouTube caption-fetch | `load-transcripts.py` | `youtube` | None (public caption API via `youtube-transcript-api`) | Live — COLG Sunday/Wednesday videos |
| RSS / Podcast | `rss-ingest.py` | `rss` | None — open standard, no OAuth | Live — any RSS/Atom feed URL |

---

## 5. What Is Generic (Backbone) vs. What Is Platform-Specific (Adapters)

### Backbone — zero platform assumptions

| Component | Location | Platform-specific code |
|---|---|---|
| Harvest registry + coverage math | `app/src/lib/video-harvest.js` | None — operates on JSONB `harvests` blob; blind to platform |
| Text extractors | `app/src/lib/transcript-harvest.js` | None — operates on plain text; source platform irrelevant |
| Harvest ledger sync | `app/src/lib/harvest-ledger.js` | None — queries by `(instance_id, video_id)`; any string key works |
| Store schema | `video_harvests`, `video_transcripts` | `source_platform DEFAULT 'youtube'` (additive; YouTube rows unchanged) |
| RLS policies | All tables | Instance-scoped; no platform check anywhere |

### YouTube adapter — platform-specific code stays in the adapter

| What | Where |
|---|---|
| YouTube caption fetch | `youtube_transcript_api` import in `youtube-captions.py` and `load-transcripts.py` |
| YouTube channel RSS discovery | `CHANNEL_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id={}"` |
| `video_id` format (raw YouTube ID) | Implicit — YouTube items write raw IDs; no prefix |
| `choir_sermons` corpus dependency | `video_ids_from_cloud()` in `load-transcripts.py` reads from `choir_sermons` |

### What moved from backbone to adapters: nothing

The backbone was already structurally generic. The two additions in migration 0066 (`source_platform`, `item_url`) are the ONLY schema changes, both additive with safe DEFAULTs. Zero lines changed in `video-harvest.js`, `transcript-harvest.js`, or `harvest-ledger.js`.

---

## 6. Known Gap: Coverage Display Layer

`buildLedger()` in `video-harvest.js` computes the harvest coverage % by joining `choir_sermons` (a YouTube-sourced corpus table) OVER `video_harvests`. RSS items written to `video_harvests` with `source_platform = 'rss'` won't appear in the coverage surface until one of:

- **(A) Preferred:** The display layer queries `content_sources` to know the full corpus per-platform, and joins against `video_harvests` by `source_platform`. Keeps `choir_sermons` as YouTube-only.
- **(B) Simpler short-term:** RSS items also write a minimal row into `choir_sermons` with `video_id = rss:{guid}`, making the existing JOIN work.

This gap is in the **display layer** only. The **store is platform-agnostic today** — RSS items write and read from `video_harvests` without any coverage display. Path (A) is the right long-term direction.

---

## 7. Platform Feasibility Table

For platforms beyond YouTube and RSS. Note items for when they're added one at a time on proven non-leaking ground.

| Platform | Auth Model | API Limits | ToS Constraints | Feasibility Assessment |
|---|---|---|---|---|
| **Instagram / Facebook** | Meta Graph API + OAuth 2.0; app registration + business verification required; periodic re-auth | 200 API calls/hr per user token; video insights gated behind Meta Business Suite approval | Scraping prohibited; API restricted to owned content only; requires approved app + connected page/account | Feasible for COLG's own IG/FB page via Meta Graph API. No discovery of third-party content. App approval process is real friction (~weeks). |
| **TikTok** | TikTok for Developers + OAuth 2.0; app registration required; `video.list` endpoint for owned videos only | 100–1,000 API calls/day depending on tier; no bulk transcript API | ToS restricts third-party access; `video.list` is for the authenticated creator's own content only; no caption/transcript endpoint | Possible for COLG's own TikTok creator account. No caption API — Whisper-on-NAS would be the only transcript path. Low priority given limited church-video use. |
| **X / Twitter** | X API v2 + OAuth 1.0a or 2.0; paid access required (Basic tier ~$100/mo) | Free tier: 500 reads/month (effectively useless); Basic: 10K reads/month | ToS allows personal use; academic research needs approval; video has no native transcript API; media URLs are short-lived and require re-auth | Not recommended. Video access is not a first-class API citizen. High cost for low reach in church video context. Revisit only if COLG develops a significant X audience. |
| **Vimeo** | Vimeo API + OAuth 2.0; app registration (free tier available); personal access tokens for own content | 250 API calls/15min for Basic; 5,000/day for Pro | ToS allows API access for owned content; caption/transcript API available on Pro+ plans via `/videos/{id}/texttracks` | Strong fit. Vimeo has a real caption API. Many churches and ministries host content on Vimeo (especially paid/course content). Add after RSS is stable — adapter pattern is identical. |

---

## 8. Item Key Namespace Convention

To avoid key collisions between platforms within the same `(instance_id, video_id)` unique constraint:

| Platform | `video_id` format | Example |
|---|---|---|
| YouTube | Raw video ID (no prefix) — backward compat with existing rows | `dQw4w9WgXcQ` |
| RSS | `rss:{guid_or_link}` | `rss:https://example.com/episodes/123` |
| Vimeo | `vimeo:{video_id}` | `vimeo:987654321` |
| TikTok | `tiktok:{video_id}` | `tiktok:7123456789012345678` |

The `source_platform` column (added in 0066) provides a secondary disambiguation path, but the namespaced key is the structural guarantee — two platforms can never write conflicting rows into `(instance_id, video_id)` as long as each uses its prefix.

**Exception:** YouTube items written before this seam (all of them, as of 2026-07-02) use unprefixed IDs. The `source_platform = 'youtube'` DEFAULT applied retroactively is the correct discriminator for those rows.
