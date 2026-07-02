# Source-Adapter Interface — Sovereign Aggregator Backbone

**Date:** 2026-07-02  
**Status:** DESIGN / FEASIBILITY — implementation on hold until YouTube adapter (lane local_4d62ae64) is
verified working in production. The canonical-record spec here is the target shape; adapters are
written against it after the first live adapter proves what the seam actually needs.  
**Implementation notes:** Migration 0066 (`content_sources` + `source_platform` columns) and a draft
`rss-ingest.py` are committed on the current branch as proposals. They are treated as **draft** until
the YouTube lane completes; the guard (`scripts/source-adapter-guard.mjs`) is wired but not yet the
permanent shape. The canonical record spec in this document supersedes the draft.

---

## 1. Design Principles

### 1.1 Personal Life-Corpus: Maximal Owner-Consented Completeness

The aggregator's goal for Darrell's own accounts is **not just a content feed — it is a personal
life-corpus**: a sovereign, dated, searchable record of his online presence assembled into the
PoeTech store. Every post, photo, connection, engagement signal, and structured piece of metadata
he can lawfully retrieve about his own accounts belongs here.

This shapes every design decision:

- **Prefer completeness over convenience.** The "Download Your Data" export-archive path, where it
  returns the full owner history (all posts since account creation, full connection list, all
  messages), beats a live API that returns only a recent window. For personal-corpus building,
  one comprehensive archive beats 365 daily API calls.
- **Design for the timeline.** Dates are first-class: every item lands on a personal
  historical-events timeline (`service_date` / `published_at`). A post from 2014 is as valuable
  as one from today — it is evidence of a life lived.
- **Engagement is signal, not vanity.** `likes`, `reactions`, `shares`, `comments`, `views` tell
  which content resonated. The harvest layer uses this for what-resonated ranking, not for display
  metrics. It feeds harvest-type decisions: high-engagement posts get deeper processing.
- **Relationships are data.** Connections, followers, mentions, tags — these are the relational
  layer of the life-corpus. They are held in the sovereign store and never re-shared.
- **No overpromising.** If a platform caps what even the account owner can retrieve, this document
  names exactly what is and is not reachable, rather than designing around an assumption.

### 1.2 Platform-Agnostic Backbone

The backbone (`video_harvests`, `video_transcripts`, `content_sources`) is shared by every adapter.
No table, no column, no RLS policy, no harvest-math function carries a platform-specific assumption.
Adapters translate platform-native formats into `CanonicalItem`; the backbone never touches
platform-specific fields directly.

### 1.3 Data Asymmetry: Liberal IN, No-Leak OUT

Data flows one direction: **in**. Once a piece of personal content lands in the sovereign store it is:

- Stored under `instance_id` (per-tenant, no cross-tenant access, enforced by RLS)
- Never transmitted to a third-party service
- Never used for advertising, engagement-optimization, or data brokering
- Deletable on demand by the owner (verifiable, immediate)

This asymmetry is the structural difference from extractive mainstream tech. It is also the
compliance requirement for any platform ToS that permits "personal use" but not "redistribution."

---

## 2. The Canonical Item Record

Every adapter normalizes its platform-native item to this shape before writing to the backbone.
This is the seam contract: the canonical form the store speaks regardless of platform.

### 2.1 Core Identity Fields

```
CanonicalItem {
  # --- Identity ---
  item_key:         str   # Stable, globally-unique key within this (instance, platform).
                          # Namespace convention (§13):
                          #   YouTube:   raw video ID      e.g. "dQw4w9WgXcQ"
                          #   RSS:       "rss:{guid}"      e.g. "rss:https://…/ep/123"
                          #   Facebook:  "fb:{post_id}"    e.g. "fb:10150123456789012"
                          #   LinkedIn:  "li:{share_urn}"  e.g. "li:urn:li:share:7012345"
                          #   Instagram: "ig:{media_id}"
                          #   TikTok:    "tt:{video_id}"
                          #   X:         "x:{tweet_id}"

  platform:         str   # 'youtube' | 'rss' | 'facebook' | 'linkedin' | 'instagram'
                          # | 'tiktok' | 'x' | 'gphotos' | ...

  # --- Content ---
  title:            str   # headline or first-N-chars of post text. Required.
  body_text:        str?  # full post text, description, or article body.
                          # DISTINCT from description: description is a summary;
                          # body_text is the full original text, untruncated.
  published_at:     str   # ISO-8601 datetime of original publication. Required.
                          # Stored as service_date (date) in video_harvests.
  url:              str   # canonical permalink to the item (web view). Required.
  item_url:         str?  # direct media file URL (audio/video/image enclosure).
                          # NULL for text-only posts.
  source_kind:      str   # 'service' | 'lesson' | 'post' | 'article' | 'message'
                          # | 'photo' | 'video' | 'event' | 'other'
                          # Adapter infers from platform + content type.
}
```

### 2.2 Metadata Block (First-Class, Not Optional)

Metadata is **frequently the highest-value harvest input.** Dates → historical-events timeline;
engagement counts → what-resonated ranking; tags/topics → category signals for the harvest
extractors; privacy scope → governs whether something is personal-private or publicly shared.
Every adapter MUST populate this block as completely as the platform permits.

```
CanonicalItem.metadata = {

  # --- Temporal ---
  "created_at":       ISO-8601-datetime,  # first creation / draft (if platform exposes)
  "published_at":     ISO-8601-datetime,  # when it became visible to others
  "modified_at":      ISO-8601-datetime,  # last edit (if platform exposes)
  "fetched_at":       ISO-8601-datetime,  # when this adapter retrieved it

  # --- Attribution ---
  "author_id":            str,   # platform-native account/user ID
  "author_name":          str,   # display name at time of publication
  "author_handle":        str,   # @handle, profile URL slug, or canonical identifier
  "author_account_type":  str,   # 'personal' | 'page' | 'creator' | 'business'

  # --- Engagement (all integer counts; null = not available from this source path) ---
  "likes":            int | null,
  "reactions":        {str: int} | null,  # platform breakdown: {"love":12, "haha":3, ...}
                                          # (Facebook reactions, LinkedIn reactions, etc.)
  "comments":         int | null,
  "shares":           int | null,   # shares / retweets / reposts / forwards
  "views":            int | null,   # video views, profile impressions, story views
  "saves":            int | null,   # bookmarks, saves
  "clicks":           int | null,   # link clicks (if platform exposes)
  "reach":            int | null,   # unique accounts reached (often only for business)
  "impressions":      int | null,   # total exposures (often only for business)

  # --- Content Classification ---
  "content_type":     str,   # 'text_post' | 'photo' | 'video' | 'article' | 'story' |
                             # 'reel' | 'event' | 'podcast_episode' | 'livestream' |
                             # 'document' | 'poll' | 'check_in' | 'life_event' | 'link'
  "tags":             [str], # hashtags, topics, content labels
  "mentioned_accounts": [str], # @mentions, tagged people/pages
  "topics":           [str], # inferred or declared topic categories
  "language":         str,   # 'en' or BCP-47 code

  # --- Visibility / Privacy ---
  "visibility":       str,   # 'public' | 'connections' | 'friends' | 'close_friends' |
                             # 'only_me' | 'custom' | 'subscribers'
  "original_audience": str,  # raw platform privacy string (preserved as-is)

  # --- Media References ---
  "media": [
    {
      "type":             str,    # 'image' | 'video' | 'audio' | 'document' | 'link_preview'
      "url":              str,    # direct or CDN URL (may expire; capture at ingest time)
      "caption":          str,    # alt text or caption
      "duration_seconds": int,    # video/audio duration
      "width":            int,    # pixels
      "height":           int,
      "thumbnail_url":    str,
      "sovereign_path":   str,    # NAS path if media was downloaded to the sovereign store
    }
  ],

  # --- Platform-Specific Structured Fields ---
  # Hold whatever structured data the platform's API or export archive exposes.
  # Never flattened into the canonical fields above — preserved as-is for
  # platform-specific harvest passes. Examples:
  #
  # YouTube:   chapters, playlist, category_id, statistics, live_streaming_details,
  #            description (full), tags[], default_language, content_details
  # Facebook:  reactions_summary {type: count}, event {start_time, location, attendee_count},
  #            life_event {title, text}, album {name}, places {name, address, coords},
  #            link {title, description, url, thumbnail}
  # LinkedIn:  reshared_post_urn, article {published_url, thumbnail}, company_urn,
  #            author_title_at_time, original_post_author (for reshares)
  # X:         thread {position, tweet_id}, quoted_tweet_id, geo, source_app
  # RSS:       enclosure_type, itunes_duration, feed_title, season, episode_number
  # Instagram: album_type, location, product_tags, music {title, artist}
  "platform_fields": { str: any },

  # --- Privacy / Consent Flags ---
  "owner_consented":  bool,  # always True for owner's own exported data; the system never
                             # ingests content from other accounts without consent
  "source_path":      str,   # 'live_api' | 'export_archive' | 'rss_feed'
                             # records HOW this item entered the store (audit trail)
  "sensitive_signals": [str], # detected sensitive-metadata categories present:
                             # 'location' | 'contacts' | 'health' | 'financial' | 'minors'
                             # Used to apply stricter access controls; never leaked OUT.
}
```

### 2.3 How Metadata Feeds the Harvest

| Metadata field | Harvest type it feeds |
|---|---|
| `published_at`, `created_at` | Historical-events timeline (dates → dated events in the corpus) |
| `likes`, `reactions`, `views`, `shares` | What-resonated ranking: high-engagement items get deeper harvest processing priority |
| `tags`, `topics`, `mentioned_accounts` | Scripture/topic extraction signals; category routing |
| `content_type` | Routes to the correct harvest extractors (video → transcript path; text_post → direct text extraction) |
| `media[].url` + `sovereign_path` | Triggers media download → NAS storage → Whisper/vision harvest |
| `platform_fields` | Platform-specific harvest passes (YouTube chapters → lesson structure; FB life_events → timeline milestones) |
| `visibility` | Governs surface permissions: private items stay behind the PIN gate |

---

## 3. Adapter Contract

Every platform adapter is a script in `infra/nas-sme-pipeline/` (Python preferred — stdlib first,
pip deps only when unavoidable) that implements the following contract.

### 3.1 Required Declaration

```python
PLATFORM = "<platform_key>"   # the guard signal — scripts/source-adapter-guard.mjs checks this
```

### 3.2 Live-Fetch Path

Used for platforms with an API or public feed (YouTube, RSS, eventually some API-accessible social).

```
discover_latest(config: SourceConfig, max_items: int) → [RawItem]

  Discover the most recent N items from this source.
  Uses only config fields (channel_id, feed_url, access_token, ...).
  Returns raw platform items — NOT yet normalized. No side effects.

normalize(raw: RawItem) → CanonicalItem

  Map one raw platform item to the CanonicalItem shape.
  MUST produce a stable item_key for the same item across calls (idempotent).
  MUST populate metadata as completely as the platform permits — never omit
  metadata fields the platform exposes. Null is honest; absent is not.

fetch_detail(item_key: str, config: SourceConfig) → RawItem | None

  OPTIONAL. Fetch full detail for an item identified by item_key.
  Used when discover_latest returns stubs and full data requires a second call.
  Returns None if the item is no longer available.

fetch_transcript_text(canonical: CanonicalItem, config: SourceConfig) → str | None

  Return the best available text for transcript harvesting without GPU.
  YouTube: caption API. RSS: description. LinkedIn article: article body.
  Returns None when no text is available (triggers Whisper-on-NAS fallback).
```

### 3.3 Export-Archive Path

Used when the live API is too restrictive but the platform provides a "Download Your Data" archive.
This is the **preferred path for personal life-corpus building** on Facebook and LinkedIn.

```
ingest_archive(archive_path: str, config: SourceConfig) → [CanonicalItem]

  Parse the platform's downloaded export archive (zip/folder/CSV/JSON).
  Extract ALL items the archive contains (full history, not paginated).
  Normalize each item to CanonicalItem, populating metadata as completely
  as the archive format exposes.
  MUST be idempotent: running twice on the same archive produces the same output.
  archive_path: path to the unzipped export folder or zip file.

  Returns a list of CanonicalItems ready for upsert.
```

The archive path does not use a live-fetch lock (there is no concurrency risk from re-reading a
local file). It MUST support `--dry-run` to preview what would be written.

### 3.4 Three-Brakes (Live-Fetch Only)

All live-fetch adapters must implement three brakes per the CLAUDE.md autonomous-automation rule:

1. **Budget** — `--max N` caps items per run. Hit the cap → stop; re-run picks up where it left off.
2. **Concurrency lock** — a `.{adapter}.lock` file in `out/`. Second run while first is live → SKIP.
3. **Stall guard** — exit code 3 when a run advanced 0 items while gaps remain.

Archive-path adapters are exempt (they're single-shot on a local file, not autonomous loops).

### 3.5 Source Configuration Shape

```python
SourceConfig = {
  "platform":      str,          # must match PLATFORM constant
  "source_key":    str,          # platform-specific feed ID (channel_id / feed_url / username)
  "instance_id":   str,          # Supabase instance UUID (the tenant)
  "label":         str,          # human name for the source
  "auth": {
    "type":        str,          # 'none' | 'oauth2' | 'api_key' | 'export_archive'
    "access_token": str | None,  # OAuth bearer token (live-fetch)
    "api_key":      str | None,  # API key (if used)
    "archive_path": str | None,  # local path to export folder (archive path)
  },
  "config": { str: any },        # platform-specific extra config
}
```

Auth tokens are NEVER stored in the codebase. They live in:
- `/volume1/PoeTech/secrets/{platform}-{slug}.json` on the NAS
- Environment variables `{PLATFORM}_ACCESS_TOKEN` / `{PLATFORM}_API_KEY`

The adapter reads credentials via the same `load_secrets()` pattern used by `load-transcripts.py`.
The system never stores or enters user credentials on behalf of the user. OAuth flows are
user-initiated: the user authorizes the connection in the PoeTech app UI, the token is stored in
the sovereign secrets store.

---

## 4. Platform Feasibility Table

Quick-reference across all platforms. Priority flags:
- 🟣 **PRIORITY IMMEDIATE** — Gmail/Email (richest quality data; reuses the proven Gmail-receipts lane; implement right after YouTube)
- 🔴 **PRIORITY #1** — Facebook (Darrell's own account; longest personal-history corpus)
- 🟠 **PRIORITY #2** — LinkedIn (professional life-corpus; professional history + connections)

| Platform | Auth Model | API Access to Own Content | ToS Constraints | Recommended Path | Completeness |
|---|---|---|---|---|---|
| YouTube | None (public) or Data API v3 | Full — own videos, playlists, comments, analytics | Scraping prohibited; API is the right path | Live API + caption fetch ✓ (adapter #1, implemented) | High |
| RSS/Podcast | None — open standard | N/A — feed is the source | Open standard; no ToS risk | RSS feed fetch ✓ (adapter #2, draft) | Complete for what feed publishes |
| **Gmail/Email 🟣** | Gmail API + OAuth 2.0 (live pull) — REUSE the Gmail-receipts lane (local_e63f400c) | Full owner mailbox — all messages, all time, structured + free-text | Personal use permitted; no scraping; OAuth is the correct path | **Live API via receipts-lane OAuth** — extend to dual output (see §7) | Very high — full mailbox history |
| **Facebook 🔴** | Meta Graph API + OAuth 2.0 (live) OR "Download Your Information" archive (offline) | API: very limited for personal profiles post-Cambridge Analytica; Archive: comprehensive | Personal-profile API severely restricted; archive is owner's legal right | **Export-archive preferred** (see §5) | Archive: very high; API: low |
| **LinkedIn 🟠** | LinkedIn API + OAuth 2.0 (live) OR "Get a copy of your data" archive (offline) | API: extremely limited for reading own historical posts; Archive: comprehensive | API Partner Program required for post-reading; archive is owner's legal right | **Export-archive preferred** (see §6) | Archive: high; API: very low |
| Instagram | Meta Graph (Business/Creator) or Basic Display (personal) + OAuth | Basic Display: photos/videos; Business: media + insights | Personal API requires app review; scraping prohibited | Export-archive OR Basic Display API | Archive: high; API: medium |
| TikTok | TikTok for Developers + OAuth 2.0 | video.list for own videos; export available | Own-content-only API; no bulk history access | Export-archive (JSON) | Archive: moderate |
| X / Twitter | X API v2 + OAuth 1.0a or 2.0 (paid tiers for volume) OR archive download | Full tweet history via archive; API is paid and rate-limited | Archive download is owner's right; API is expensive | **Export-archive strongly preferred** | Archive: very high (all tweets to account creation) |
| **Google Photos** | Google Photos API + OAuth 2.0 (ongoing sync) OR Google Takeout archive (corpus seed) | Full personal photo library — EXIF metadata (date taken, GPS, camera), album context, captions | Personal use permitted; OAuth scopes declared on Google consent screen; no redistribution | **Takeout for corpus seed; API for incremental sync** (see §11) | Takeout: very high; API: high |
| **Facebook Photos** | Included in Facebook "Download Your Information" archive — no separate auth or export | All uploaded photos with EXIF metadata + GPS preserved (archive retains GPS that Facebook strips from the public web) | Owner's legal right (GDPR Art. 20); same constraints as Facebook archive (§5) | Handled as photo-parser module within the Facebook archive adapter (see §5, §11) | Very high |

---

## 5. Facebook — Two-Path Analysis (PRIORITY #1)

### 5.1 Why Facebook is Priority #1

Facebook contains Darrell's longest personal online history — posts, life events, photos, messages,
and the social graph of friends and family built over years. The export archive is the most
complete personal data snapshot Facebook produces, and it is the account owner's legal right under
GDPR and CCPA to request it.

### 5.2 Path A — Official API + OAuth

**Scopes needed:** `user_posts`, `user_photos`, `user_videos`, `user_events`, `user_friends`
(friends who also use the app), `user_likes`

**What is actually reachable:**
- `/me/posts` — your own posts (text, link posts, photo posts) with timestamp, privacy, place
- `/me/photos` — photos you uploaded or were tagged in (subject to tagging person's privacy)
- `/me/videos` — videos you uploaded
- `/me/events` — events you RSVPed to or created
- `/me/feed` — your own timeline posts (subset of posts)
- Basic profile: name, birthday, hometown, work/education (with user_about_me)
- Reactions/comments ON your posts: accessible but require additional calls per post

**What is NOT reachable via API:**
- Friends' posts (your News Feed) — access removed entirely post-Cambridge Analytica
- Message/DM history — not in the Graph API at all
- Full friends list (only mutual friends who authorized the same app)
- Historical reactions to your posts (counts accessible; individual reactors limited)
- Stories (ephemeral; no API)
- Groups content (severely restricted)
- Account activity log, search history, ad preferences

**App-review requirement:** Required for most personal-data scopes (`user_posts`, etc.).
The review process takes 2–8 weeks, requires a video demo of the app, and Meta can reject or
revoke at any time. This is fragility risk for a sovereign pipeline.

**Rate limits:** 200 API calls/hour per user access token. At 1 call per post per reaction fetch,
a large archive would take many hours spread across many runs.

**ToS summary:** API use permitted for personal use, not redistribution. No scraping. Access tokens
expire and require periodic re-authorization (60-day token lifespan; refresh needed).

**Assessment:** The API path is workable for maintaining a live feed of NEW posts (incremental sync),
but is **too thin and too fragile for the one-time full-history personal-corpus build.** Use it
for ongoing incremental capture after the archive seeds the corpus.

---

### 5.3 Path B — "Download Your Information" Export-Archive (RECOMMENDED for corpus seed)

**How to request:** facebook.com → Settings → Your Facebook Information → Download Your Information.
Choose JSON format (NOT HTML — JSON is structured data; HTML is human-readable only).
Select time range: "All time." Select categories: all.

**What the archive includes (full history):**
- **Posts** — every post you ever made, with timestamp, privacy setting, content, attached
  photos/videos, place (if tagged), tagged people, all reactions and comments
- **Photos** — every photo you uploaded (full-resolution media files included in zip)
- **Videos** — every video you uploaded
- **Messages** — full message/DM history with all contacts, including group chats
  (WARNING: contains other people's messages — handle with extra-care privacy flag)
- **Friends list** — complete, with date of friendship and whether you followed them
- **Events** — all events RSVPed, created, or invited to, with details + your response
- **Groups** — groups you belong(ed) to, your posts in them
- **Life events** — manually added life milestones with date and description
- **Reactions** — posts you reacted to (including other people's posts; mark as EXTERNAL)
- **Search history** — your search queries on Facebook
- **Ad preferences** — interests Facebook inferred about you
- **Location history** — check-ins and location tag history
- **Comments** — all comments you made on posts (yours and others')
- **Profile information** — all profile fields you ever filled in, with history of changes

**What the archive does NOT include:**
- Other people's profiles in full (you get names + timestamps of friends; not their content)
- Your News Feed (other people's posts you saw)
- Private groups where you're not the admin (limited)
- Facebook Marketplace transactions in full detail
- Some deleted content (Facebook retains for 30–90 days post-deletion; archive may or may not include)
- Real-time engagement analytics for your posts (likes/comment counts are present; detailed analytics are not)

**Format:** ZIP file, JSON inside. Predictable schema: `posts/your_posts_N.json`, 
`messages/inbox/contact_name/message_1.json`, `photos_and_videos/`, etc. Meta publishes the
JSON schema and it has been stable for several years.

**Cadence:** Manual export only; cannot be automated (Facebook intentionally blocks automation of
archive requests). Typical generation time: 1–24 hours. Practical cadence: annual or semi-annual
full archive + API incremental sync for new posts in between.

**Metadata available in archive vs API:**

| Metadata Field | Export Archive | Live API |
|---|---|---|
| All post timestamps (full history) | ✓ All | Limited to recent window |
| Privacy setting per post | ✓ Yes | ✓ Yes |
| Reactions breakdown (love/haha/wow/sad/angry + who reacted) | ✓ Yes (reactor names) | Count only |
| Comment text + commenter name | ✓ Yes | ✓ Yes |
| Message history (DMs + group chats) | ✓ Yes (ALL) | Not available |
| Friends list with date-of-connection | ✓ Yes | Partial (mutual only) |
| Life events with dates | ✓ Yes | Limited |
| Location/check-in history | ✓ Yes (if enabled) | Per-post only |
| Media files (actual photos/videos) | ✓ Yes (downloaded) | URL only (may expire) |
| Ad preferences / inferred interests | ✓ Yes | Not available |
| Search history | ✓ Yes | Not available |
| Profile change history | ✓ Yes | Current only |

**Recommendation:** **Export-archive for the corpus seed; live API for incremental new-post sync.**
The archive is the only way to get full history, messages, and the complete social graph.
The API handles ongoing capture after the corpus is seeded.

**ToS fragility note:** The archive is the account owner's legal right under data-portability law
(GDPR Art. 20, CCPA). Meta cannot revoke this right. The API, by contrast, is subject to policy
changes (post-Cambridge Analytica, post-Cambridge Analytica era restrictions are permanent; further
restrictions are possible). Build the pipeline around the archive as the authoritative source.

**Privacy-sensitive signals in this data:**
- `messages/` — contains other people's messages; flag as `'contacts'` in `sensitive_signals`
- Location data — flag as `'location'`
- Reactions to external posts — these are about other people's content; hold separately

---

## 6. LinkedIn — Two-Path Analysis (PRIORITY #2)

### 6.1 Why LinkedIn is Priority #2

LinkedIn is the sovereign record of Darrell's professional life — career history, professional
relationships, articles and posts reaching a professional audience, skills and endorsements.
It is the professional-life layer of the personal life-corpus. The connections list alone is a
high-value relational record (who he knows professionally, when connections were made, current
company/role at connection time).

### 6.2 Path A — Official API + OAuth

**Scopes available without Partner Program:**
- `r_liteprofile` — basic profile (name, photo, headline, current position only)
- `r_emailaddress` — email address
- `w_member_social` — create/delete own posts (write only)
- `r_basicprofile` (deprecated; replaced by r_liteprofile)

**What is reachable without Partner Program (available to any OAuth app):**
- Current profile snapshot: name, photo, headline, current employer, current title
- Your email address
- Ability to post on behalf of user

**What requires LinkedIn Partner Program (gated, application required, not generally granted):**
- `r_member_social` — reading own posts, comments, reactions
- `r_organization_social` — organization (company page) content
- `rw_ads` — advertising data
- `r_ads_reporting` — ad analytics

**Reality check for the personal-corpus use case:** Without the Partner Program, the LinkedIn API
gives you essentially nothing useful for historical content ingestion. You can read the current
profile snapshot and write posts, but you cannot read your own historical posts, articles, comments,
or connection list via the API.

**Rate limits (when access is granted):** 100 calls/day for most standard endpoints. For a corpus
with hundreds of connections and posts, a live API approach would take months of daily runs.

**Assessment:** The LinkedIn API path is **effectively closed for personal corpus building** without
becoming a LinkedIn Partner (a months-long enterprise process with no guarantee). Use the API
ONLY for posting (publishing content TO LinkedIn from PoeTech) and current-profile sync.

---

### 6.3 Path B — "Get a copy of your data" Export-Archive (RECOMMENDED)

**How to request:** linkedin.com → Me → Settings & Privacy → Data Privacy → Get a copy of your data.
Choose "Download larger data archive" to get the full history.

**What the archive includes:**
- **Connections** — complete list: first name, last name, URL, email (if shared), company,
  position, connected-on date. This is the full professional network map with timestamps.
- **Messages** — full InMail and connection message history (all messages, all time)
- **Posts** — all posts you authored, with timestamp, text, media, visibility, reaction counts,
  comment counts (but NOT individual commenters/reactors — counts only)
- **Articles** — all LinkedIn articles you published, with full text, published date, view count
- **Comments** — all comments you made (your text + the post you commented on)
- **Reactions** — posts you reacted to (with timestamp and reaction type)
- **Profile** — all profile sections (summary, experience, education, skills, certifications,
  volunteer experience, publications, courses, projects, honors) with full history
- **Skills** — skills list
- **Endorsements received** — who endorsed which skill (name + date)
- **Recommendations given and received** — full text
- **Followers / Following** — accounts you follow / who follows you
- **Company follows** — companies you follow
- **Job applications** — jobs you applied for and when
- **Saved jobs** — jobs you bookmarked
- **Learning** — LinkedIn Learning courses started/completed
- **Invitations sent/received** — connection request history

**What the archive does NOT include:**
- Other people's full profiles (connections list has name + company only; no full profile text)
- Analytics beyond total counts for posts/articles (no demographic breakdown of who viewed)
- Messages from accounts that deactivated before export (sender info may be present but limited)
- LinkedIn Stories (ephemeral; deprecated by LinkedIn)
- Premium InMail if not accepted
- Detailed ad targeting data

**Format:** CSV files (most data), one CSV per category. Predictable headers documented by LinkedIn.
Notable: `Connections.csv`, `Messages.csv`, `Posts.csv`, `Articles.csv`, `Profile.csv`.
Post and article BODY TEXT is in the CSV; engagement counts are included.

**Cadence:** Manual request; archive generated in 10 minutes to 24 hours. LinkedIn recommends
not requesting more than once per 24 hours. Practical cadence: semi-annual full archive +
article-by-article API post sync (for newly published articles) in between.

**Metadata available in archive vs API:**

| Metadata Field | Export Archive | Live API (without Partner) |
|---|---|---|
| Full connection list with dates | ✓ Yes (all) | Not available |
| Historical posts with text | ✓ Yes | Not available |
| Full article text | ✓ Yes | Not available |
| Message history | ✓ Yes (all) | Not available |
| Reaction/comment counts per post | ✓ Yes (counts) | Not available |
| Recommendations (full text) | ✓ Yes | Not available |
| Endorsements with endorser names | ✓ Yes | Not available |
| Professional experience history | ✓ Yes (full) | Current role only |
| Skills with endorsement counts | ✓ Yes | Not available |
| Job application history | ✓ Yes | Not available |

**Recommendation:** **Export-archive exclusively** for personal corpus building. The LinkedIn API
without Partner access gives you a shadow of what the archive contains. The archive is the only
authoritative, complete source of your LinkedIn professional life.

**ToS fragility note:** The archive is the account owner's legal right (GDPR Art. 20). LinkedIn
cannot restrict your access to YOUR OWN data. The API terms can change (and have changed
significantly since 2018 — access has become more restricted, not less). Build the LinkedIn corpus
on the archive as the source of truth; use the API only for write operations (cross-posting to
LinkedIn) and profile sync.

**Privacy-sensitive signals:**
- `Messages.csv` — contains other people's messages; flag `'contacts'`
- `Connections.csv` — relational data; flag `'contacts'`
- Endorsement data — another person's professional assessment; hold with care

---

## 7. Gmail / Email — Analysis (PRIORITY IMMEDIATE)

### 7.1 Why Gmail is Priority Immediate

Darrell's framing (2026-07-02): *"a direct path to the Quality Data and historical events already
known and loved by the users, including myself."*

Email is fundamentally different from every other source in this roadmap: **it is verified factual
history, not inferred signal.** A flight confirmation IS a trip that happened. An order confirmation
IS a purchase that was made. A family email thread IS family history written in the family's own
words. A medical appointment confirmation IS a health event with a date and provider.

This is **Quality Data** — ground-truth records of real events, not engagement behavior:

- **Travel** — airline booking confirmations, hotel reservations, Airbnb stays, car rentals.
  Every trip in the personal timeline is probably in email, with confirmation numbers, dates,
  destinations, and fellow travelers.
- **Milestones** — graduation announcements, baby shower invites, moving announcements,
  condolence messages, wedding invitations, birthday letters.
- **Family correspondence** — direct family email threads: personal narrative written in the
  family's own voice, not mediated through a social platform.
- **Purchases** — Amazon orders, any e-commerce confirmation. Items, prices, dates — a purchase
  history rooted in real transactions.
- **Events attended** — Ticketmaster, Eventbrite, concert/church/conference confirmations.
  What was actually attended, not what was "interested" in.
- **Professional history** — job offer letters, contracts, project correspondence, client emails.
  The professional life-corpus as it actually unfolded.
- **Financial** — bank alerts, statement notifications, tax documents, insurance paperwork.
  The financial events timeline already being built (receipts lane) extended to all financial comms.
- **Medical** — appointment confirmations, lab result notifications, prescription orders.
  Health events with dates; sensitive by definition, requires `'health'` sensitive signal flag.
- **Photos/attachments** — family photos emailed directly between people, documents, receipts.
  Attachments are high-value content: they predate every photo-sharing platform and often contain
  events that were never posted publicly anywhere.

### 7.2 Design Principle: One Gmail Connection, Dual Output

The Gmail-receipts lane (lane `local_e63f400c`) is already being built to pull from Darrell's
Gmail via OAuth + the Gmail API. **Do not design a separate Gmail auth or pull path.** Extend the
existing lane to route emails to TWO downstream consumers:

```
Gmail API pull (proven receipts-lane OAuth)
          │
          ▼
  email normalizer
    ├──▶ RECEIPT / PURCHASE extractor → financial transactions store (existing receipts lane)
    └──▶ HISTORICAL EVENTS extractor → video_harvests (source_platform='gmail')
                                         + video_transcripts (source='email-body')
```

One OAuth connection, one pull per run, two outputs. The same email can feed both pipelines
simultaneously — a restaurant receipt is both a financial transaction AND a dated life event.

### 7.3 Auth Path: Gmail API + OAuth 2.0 (Reuse Receipts Lane)

**Scopes required (already used by receipts lane):**
- `https://www.googleapis.com/auth/gmail.readonly` — read all email; no send/modify access
- Optionally `https://www.googleapis.com/auth/gmail.metadata` for header-only scan (fast)

**Token management:** Same pattern as `load-transcripts.py` — refresh token stored in
`/volume1/PoeTech/secrets/gmail-{slug}.json`; access tokens refreshed automatically via the
Google OAuth2 refresh flow; the system never stores passwords, only authorized tokens.

**App registration:** Google Cloud Console, OAuth 2.0 client credentials (installed app type).
No app review required for personal-use scopes against a personal Google account — consent screen
shows the user exactly what access they're granting. Refresh tokens for personal accounts do not
expire as long as the app is used at least once every 6 months.

**Rate limits:** 250 quota units/second; 1 billion units/day — effectively unlimited for personal
mailbox use. A mailbox with 50,000 emails can be fully indexed in a single run.

**ToS:** Google's ToS permits reading your own email via the API for personal use. No redistribution.
The sovereign store receives the data; it never leaves.

### 7.4 What the Adapter Retrieves

**Full mailbox scope:**
- Every message ever received or sent in the Gmail account (all labels, all time)
- Message headers (From, To, Cc, Subject, Date, Message-ID, thread grouping)
- Message body (text/plain preferred; HTML stripped to text; multipart handled)
- Attachment metadata (filename, MIME type, size; actual file downloadable via attachment API)
- Label names (INBOX, SENT, STARRED, custom labels — these are classification signals)
- Thread grouping (Gmail thread_id groups a conversation)

**What Gmail API does NOT expose:**
- Spam and Trash are accessible but filtered by default (set `--include-spam-trash=false`)
- Emails deleted and permanently removed from Trash before the pull (gone)
- Encrypted S/MIME body content (the API returns the encrypted blob, not the plaintext)

**Incremental sync:** Gmail API provides a `historyId` mechanism — the adapter stores the
last-seen `historyId` and on subsequent runs only fetches messages added/modified since that point.
Efficient for ongoing incremental capture after the initial full-history pull.

### 7.5 Email Canonical Item Shape

Email maps to `CanonicalItem` as follows:

```
CanonicalItem (email) {
  item_key:     "gmail:{message_id}"           # Gmail's stable Message-ID
  platform:     "gmail"
  title:        subject line (normalized)       # "Re: …" stripped to root subject
  body_text:    email body (text/plain)         # full body, plain text; HTML stripped
  published_at: Date header (ISO-8601)          # when the email was sent/received
  source_kind:  inferred (see §7.6)

  metadata: {
    # Temporal
    created_at:      Date header (sent time)
    published_at:    Date header
    fetched_at:      when the adapter pulled it

    # Attribution
    author_id:        From email address
    author_name:      From display name
    author_handle:    From email address
    author_account_type: "personal"  # always

    # Email-specific via platform_fields
    platform_fields: {
      message_id:     str              # Gmail Message-ID (stable, unique)
      thread_id:      str              # Gmail thread — groups a conversation
      label_ids:      [str]            # INBOX, SENT, STARRED, custom labels
      snippet:        str              # Gmail's 200-char preview (for quick display)
      recipients:     [str]            # To + Cc addresses
      
      # Deterministically extracted structured fields (when parser matches):
      event_type:     str | null       # 'travel' | 'purchase' | 'event' | 'financial'
                                       # | 'medical' | 'milestone' | 'correspondence' | null
      
      travel: {                        # populated when event_type = 'travel'
        confirmation_number: str,
        carrier:             str,      # airline, hotel chain, car rental brand
        route:               str,      # "ORD → LAX" or "Chicago Marriott"
        departure_date:      date,
        return_date:         date | null,
        traveler_names:      [str],
      } | null,
      
      purchase: {                      # populated when event_type = 'purchase'
        order_number:  str,
        vendor:        str,
        order_date:    date,
        total_amount:  decimal | null,
        currency:      str | null,
        items:         [{name, qty, price}],  # extracted when structured data present
      } | null,
      
      event_booking: {                 # populated when event_type = 'event'
        event_name:    str,
        venue:         str | null,
        event_date:    date,
        ticket_count:  int | null,
        confirmation:  str | null,
      } | null,
      
      attachments: [
        {
          filename:       str,
          mime_type:      str,
          size_bytes:     int,
          attachment_id:  str,         # Gmail attachment ID for download
          sovereign_path: str | null,  # NAS path if downloaded
        }
      ],
    },

    # Standard fields
    content_type:       "email",
    tags:               label_ids (as tag list),
    visibility:         "private",    # email is always private
    owner_consented:    True,
    source_path:        "live_api",   # or "export_archive" if Takeout path used
    sensitive_signals:  [],           # populated per-email: 'health' | 'financial' | 'contacts'
  }
}
```

### 7.6 Source-Kind Inference and Parsing Strategy

#### Tier 1 — Deterministic structured parsing (no LLM)

Many high-value email categories have machine-readable signals:

| Signal | Detection | Source-kind |
|---|---|---|
| From domain: `@aa.com`, `@united.com`, `@delta.com`, `@booking.com`, `@airbnb.com`, travel agencies | Sender domain regex | `'event-confirmation'` / travel |
| Subject: "Your order", "Order confirmation", "Receipt for" + Amazon/Shopify/etc. sender | Subject + sender pattern | `'purchase'` |
| Subject: "Your reservation", "Booking confirmation" | Subject pattern | `'event-confirmation'` |
| Schema.org markup in HTML body (`@type: FlightReservation`, `OrderAction`, `EventReservation`) | HTML meta/JSON-LD extract | specific structured event |
| Bank/financial sender domains, subject: "Statement available", "Alert: transaction" | Sender + subject | `'financial'` |
| Appointment confirmation: medical provider domains, subject: "Appointment reminder/confirmation" | Sender domain + subject | `'medical'` |
| Calendar invite attachment (`text/calendar`, `.ics` file) | MIME type detection | `'event'` with event metadata |

Schema.org email markup (`email.schema.org`) is supported by Google, Amazon, Eventbrite, and many
travel platforms — it provides machine-readable structured data directly in the email envelope.
Parse this FIRST; it gives dates, locations, confirmation numbers without text extraction.

#### Tier 2 — Light LLM classification (Sonnet / local qwen2.5:14b)

For emails that pass Tier 1 without a match:
- Classify into `event_type` (travel / purchase / milestone / correspondence / other)
- Extract key metadata: event date, location, participants from free body text
- Generate a one-sentence event summary for the historical-events timeline display

**Never use Opus for routine email classification.** Sonnet (for cloud) or `qwen2.5:14b` (for
local NAS) is sufficient. Batch in groups of 20–50 per LLM call to keep costs low. Most emails
will be classified by Tier 1 alone.

### 7.7 Historical Events Timeline Feed

Every email item that produces a `service_date` (from the Date header) lands on the
historical-events timeline. The `source_kind` determines the timeline display:

| `source_kind` | Timeline event label |
|---|---|
| `event-confirmation` | "Trip / Event: {title}" |
| `purchase` | "Purchase: {vendor} — {order_date}" |
| `milestone` | "Milestone: {subject}" |
| `financial` | "Financial event: {subject}" |
| `medical` | "Health event: {subject}" [PIN-gated] |
| `correspondence` | "Correspondence: {subject}" [opt-in only] |

`correspondence` (personal/family email threads) is opt-in only for timeline display — not every
email thread should surface as a visible event, only ones the owner designates as milestones.

### 7.8 Sequencing

1. **YouTube adapter verified in production** (lane `local_4d62ae64` — seam is proven)
2. **Gmail-receipts lane verified** (lane `local_e63f400c` — OAuth pull is proven, receipt extraction works)
3. **THEN:** extend the Gmail pull to also extract historical events via the dual-output router
   (same OAuth, same pull, additional `source_kind` routing + `video_harvests` upsert)
4. Facebook/LinkedIn archive adapters can proceed after Gmail is live

Gmail has the shortest path to implementation because steps 1 and 2 are prerequisites for it and
for the project overall. Once both lanes clear, the Gmail historical-events extension is the
lowest-new-work, highest-value-return adapter in the roadmap.

### 7.9 Privacy Notes

- **Message bodies** — contain other people's text; flag all email as `sensitive_signals: ['contacts']`
- **Medical emails** — add `'health'`; access to these items requires PIN re-auth in the app
- **Financial emails** — add `'financial'`; held in the sovereign store; surface requires auth
- **Attachments** — if downloaded to NAS, flag `sovereign_path` and never re-upload to external services
- **Sent mail** — treated identically to received mail; part of the owner's record

---

## 8. Instagram — Analysis

**Archive path ("Download Your Information"):**
- Posts, stories (archived), reels, IGTV, profile photos, tagged photos
- Messages (all DMs and group messages)
- Followers/following lists with dates
- Comments you made
- Posts you liked
- Ads you interacted with
- Format: JSON or HTML (choose JSON)
- Completeness: high for YOUR content; stories are included if saved to archive

**API path (Instagram Basic Display API — personal accounts):**
- Requires Meta app registration + review
- Returns: media (photos, videos, reels) with caption, timestamp, media_type
- Does NOT return: messages, stories (current), analytics, followers list
- Access token: user-initiated OAuth

**API path (Instagram Graph API — Business/Creator accounts only):**
- Richer access: media insights, hashtag search, comments, mentions
- Requires the Instagram account to be connected to a Facebook page
- Scope: if Darrell has a Creator account, this path is richer

**Recommendation:** Export-archive for full history; Basic Display API for incremental capture of
new media posts. Business/Creator API if account is upgraded.

---

## 9. TikTok — Analysis

**Archive path ("Download My Data" on TikTok app → Privacy → Download Data):**
- Your videos (download link + metadata): video file, date posted, description, music used
- Profile information
- Following/follower lists
- Comments you made
- DMs (if enabled)
- Favorites / liked videos
- Format: ZIP with JSON files
- Completeness: moderate — TikTok's export is less comprehensive than FB/LinkedIn

**API path (TikTok for Developers):**
- `video.list` endpoint: your own videos, metadata, view/like/comment/share counts
- `video.query`: specific video by ID
- Scopes: `video.list` (free tier, up to 1000 videos)
- Does NOT include: DMs, full follower/following list, full watch history, liked videos
- Rate limits: 100–1000 calls/day depending on tier

**Recommendation:** API + archive combined. The API gives good video metadata + counts; the archive
fills in content the API misses. Lower priority than FB/LinkedIn for personal corpus building.

---

## 10. X / Twitter — Analysis

**Archive path ("Request your Twitter archive" via Settings → Your account → Download archive):**
- ALL tweets ever posted, with timestamp, full text, media, retweets, likes received
- DMs (full history)
- Likes you gave (tweet IDs, though tweet text is fetched separately)
- Followers/following lists
- Account info, profile history
- Format: JavaScript data files (essentially JSON arrays; header HTML loads them into a viewer)
- Completeness: very high — full account history to creation date

**API path (X API v2):**
- Free tier: 1500 reads/month — effectively unusable for corpus building
- Basic tier: ~$100/month, 10K reads/month
- Pro tier: ~$5000/month for research-grade access
- Requires OAuth 2.0; user access tokens have specific scopes
- `tweet.fields`: text, created_at, author_id, public_metrics (retweets/likes/replies/quotes/impressions)

**Assessment:** X API is prohibitively expensive for personal-corpus building. The archive path
is strongly preferred and very comprehensive (full history).

**Recommendation:** Archive-only for the personal life-corpus. API integration only if
cross-posting TO X becomes a use case.

---

## 11. Photo Sources — Analysis

### 11.1 Why Photo Sources Belong in the Life-Corpus

Photos are the densest dated-placed records in most people's digital life. A photo taken with GPS metadata IS a verifiable event — a trip, a gathering, a milestone — anchored to a specific date and location. EXIF data turns a pixel array into a life-corpus entry with:

- **Date taken** (`DateTimeOriginal`) — the moment of capture, not the upload date; anchors to the historical-events timeline
- **GPS coordinates** (latitude/longitude/altitude) — places the event geographically; held sovereign, never transmitted externally (§11.4)
- **Camera make + model** — identifies which family member shot it (every person's phone is a different model)
- **Album + caption** — the occasion and what the owner said about the moment
- **Tagged people** — who was present; the relational layer of the event

This feeds the historical-events timeline as *placed* events: not just "December 25, 2019" but "December 25, 2019 · Champaign, IL."

### 11.2 Google Photos — Two-Path Analysis

#### Path A — Google Photos API + OAuth 2.0 (Ongoing Sync)

**Scope required:**
- `https://www.googleapis.com/auth/photoslibrary.readonly` — read all media items and albums; no write access

**What is reachable:**
- Every photo and video in the library: filename, MIME type, `productUrl` (stable Google Photos permalink)
- **EXIF-derived metadata** via `mediaItem.mediaMetadata.photo`:
  - `cameraMake`, `cameraModel`, `focalLength`, `apertureFNumber`, `isoEquivalent`, `exposureTime`
  - `creationTime` — EXIF `DateTimeOriginal` when present; falls back to upload timestamp
  - `geoMetadata.latitude / .longitude / .altitude` — GPS when the original photo contained it
- Albums: `albums.list` (album titles, media counts); `mediaItems:search` by `albumId` (album members)

**What is NOT reachable via API:**
- Face/person groups (Google uses face recognition internally; groups are not exposed via API)
- Comments on shared albums
- Google-generated collages, animations, highlight videos (derivative content; originals are present)
- Photos permanently deleted from Trash before the pull

**Rate limits:**
- Media list/get: 10,000 requests/day; `mediaItems.batchGet` (up to 50 items per call) reduces quota cost
- Album list: 20 requests/day — sufficient; a personal library rarely requires more than a handful of album-list pages
- `baseUrl` (download URL): expires 60 minutes after fetch — media must be downloaded during the same adapter run, or the URL re-fetched before download

**App registration:** Google Cloud Console, same project as Gmail (`gmail.readonly` + `photoslibrary.readonly` on one consent screen). Development mode (≤100 test users) requires no app review — covers personal use. Multi-user deployment requires OAuth verification review (2–4 weeks).

**Incremental sync:** Store the `creationTime` of the most recently fetched item. Subsequent runs filter `mediaItems.list` by `dateFilter.ranges` — only new items are pulled. Very efficient for ongoing capture after the initial corpus seed.

---

#### Path B — Google Takeout (Export Archive — Corpus Seed)

**How to request:** `takeout.google.com` → Google Photos → "All photo albums included" → export as ZIP(s).

**What the archive includes:**
- **All original photo and video files** at original resolution
- **JSON sidecar per media file** (same filename + `.json` extension):
  - `photoTakenTime.timestamp` — UNIX timestamp of EXIF `DateTimeOriginal`
  - `creationTime.timestamp` — Google Photos upload time
  - `geoData.latitude / .longitude / .altitude` — GPS from EXIF (0.0 when no GPS present)
  - `geoDataExif.latitude / .longitude / .altitude` — EXIF GPS verbatim
  - `people[].name` — names manually tagged by the owner (not face-recognition exports)
  - `description` — photo caption
  - `title` — original filename

**What Takeout does NOT include:**
- Face recognition group names (internal to Google; not exported)
- Comments from shared albums
- Google-generated derivative content (collages, movies, highlights)

**Advantage over API:** Delivers actual media files with no URL-expiry problem. Retrieves the complete library history regardless of pagination edge cases or rate limits. EXIF timestamps are in the sidecar for every photo, including ones uploaded years before the API existed.

**Recommendation:** **Takeout archive for the corpus seed; Google Photos API for ongoing incremental sync.** Same pattern as Facebook (§5): the archive seeds the full history; the live API captures new additions efficiently.

---

#### Google Photos CanonicalItem Shape

```
CanonicalItem (Google Photos) {
  item_key:     "gphotos:{media_item_id}"       # stable Google Photos API ID
                                                 # "gphotos-arc:{sha256}" for Takeout items
                                                 # (SHA-256 of filename + photoTakenTime)
  platform:     "gphotos"
  title:        caption if present; else "{album_title} · {filename}"
  body_text:    description / caption (full text)
  published_at: EXIF DateTimeOriginal (ISO-8601); fall back to Google Photos creationTime
  source_kind:  "photo"
  url:          productUrl (stable Google Photos web link)
  item_url:     baseUrl (expiring download URL — capture at ingest; store sovereign_path thereafter)

  metadata: {
    content_type: "photo" | "video"
    published_at: EXIF DateTimeOriginal
    created_at:   Google Photos upload time (creationTime)
    fetched_at:   when the adapter pulled this item

    author_id:    owner Google account email (all items are the owner's own library)
    author_name:  owner display name

    location: {                              # sovereign — never transmitted externally (§11.4)
      latitude:    float | null,             # from EXIF GPS
      longitude:   float | null,
      altitude:    float | null,
      place_name:  str | null,               # reverse-geocoded locally (offline lib or NAS Nominatim)
    },

    platform_fields: {
      camera_make:    str | null,            # e.g. "Apple"
      camera_model:   str | null,            # e.g. "iPhone 14 Pro"
      focal_length:   float | null,          # mm
      aperture:       float | null,          # f/stop number
      iso:            int | null,
      exposure_time:  str | null,            # e.g. "1/120"
      album_title:    str | null,            # e.g. "Family Christmas 2019"
      album_id:       str | null,
      people_tagged:  [str],                 # owner-tagged names (not face recognition)
      filename:       str,
      mime_type:      str,                   # image/jpeg, video/mp4, etc.
      width:          int | null,
      height:         int | null,
      media_item_id:  str,                   # Google Photos stable API ID
    },

    visibility:         "private",           # always — items from the owner's own library
    owner_consented:    True,
    source_path:        "live_api" | "export_archive",
    sensitive_signals:  ["location"],        # GPS always present in scope; add "minors" when children tagged
  }
}
```

### 11.3 Facebook Photos — Handling Within the Facebook Archive Adapter

Facebook Photos are a module within the Facebook "Download Your Information" archive (§5.3 covers the full archive). No separate export or auth is needed — photos arrive in the same ZIP, under `photos_and_videos/`.

**What the archive includes for photos:**
- Every photo uploaded, organized by album in `photos_and_videos/` subdirectories
- Actual image files at original resolution
- JSON metadata per album (`album_name.json`), per-photo fields:
  - `creation_timestamp` — upload date (UNIX; NOT the photo capture date)
  - `media.media_metadata.photo_metadata.exif_data.date_taken_timestamp` — EXIF capture date when present
  - `media.media_metadata.photo_metadata.exif_data.latitude / longitude` — **GPS preserved in archive** even though Facebook strips GPS from the public web version (anti-stalking measure; the archive returns the original EXIF the owner uploaded)
  - `media.media_metadata.photo_metadata.exif_data.camera_make / camera_model`
  - `place.name`, `place.coordinate.latitude / longitude` — tagged location (separate from EXIF GPS)
  - `tags[].name` — people tagged in the photo
  - `media.description` — caption

**Critical field distinction:** `creation_timestamp` = upload date; `exif_data.date_taken_timestamp` = capture date. The adapter ALWAYS uses the EXIF capture date for `published_at` and the historical-events timeline. A photo taken at Christmas 2011 but uploaded in 2014 lands on December 25, 2011.

**Item key:** `fb-photo:{media_id}` — distinct from post-type items (`fb:{post_id}`) because a single photo can appear in multiple posts and albums.

**Deduplication:** The archive may include the same image in multiple albums. Dedup by SHA-256 hash of the image file content combined with EXIF capture date before upsert.

**Implementation:** Facebook photo handling is a parser module within `facebook-ingest.py` — not a separate adapter. The photo parser runs when the archive walker encounters `photos_and_videos/` paths.

### 11.4 Location Data Sovereignty Rule

GPS coordinates in photos are high-value (they place events geographically) and high-sensitivity (they reveal where the family was at specific times). The sovereignty rule is absolute:

1. **Store only.** GPS coordinates land in `video_harvests.harvests → metadata.location` (JSONB). Never in a separately queryable column that could be accidentally joined against external services.
2. **Reverse geocoding is local only.** Converting lat/lon to a human-readable place name uses:
   - `reverse_geocoder` Python library (bundled city + country database; zero network calls), OR
   - NAS-hosted Nominatim instance (OpenStreetMap; fully self-hosted)
   - Coordinates are NEVER sent to Google Maps, Mapbox, Apple Maps, or any external geocoding API.
3. `sensitive_signals: ["location"]` is mandatory for every item with GPS coordinates.
4. **App display:** the timeline may fetch map tiles for visual rendering; tile servers see bounding boxes, never raw coordinates of a specific photo. The lat/lon values themselves are never transmitted to external services.

### 11.5 Photo Adapter Sequencing

- **Google Photos API adapter:** implements after Gate 1 (YouTube seam proven) AND Gate 2 (Gmail OAuth proven end-to-end in the app — confirming the in-app OAuth flow works before adding Google Photos OAuth). The opt-in connect-flow primitive (§12) must ship first.
- **Facebook Photos:** implemented as a parser module within `facebook-ingest.py`; same gate as the Facebook archive adapter (Gate 3, after RSS validates the seam).
- **Connect-flow (§12):** must be designed and the `<ConnectSourceFlow>` component shipped BEFORE any OAuth-gated source adapter (Google Photos, Gmail live sync) goes live in the app.

---

## 12. Opt-In Connect-Flow Primitive

*Design only. No implementation until Gate 1 (YouTube seam) clears. The `<ConnectSourceFlow>` component ships before any OAuth-gated adapter (Google Photos, Gmail live sync) goes live in the app.*

### 12.1 The Experience Principle

Darrell's framing (2026-07-02): *"only for those who want their data, not mandatory, just possible, and easy to understand and implement with a short intuitive process inside the PoeTech App."*

This maps directly to `ANXIETY-CLARITY-PRINCIPLE.md`: the user who is uncertain needs to know what, when, why, and how — before anything happens. The user who does not want to connect anything needs a frictionless exit at every step.

**Five non-negotiables:**
1. **No surprises.** Every item that will be pulled is stated plainly, in user language, before auth.
2. **Preview before execute.** The user sees sample real results before the import begins.
3. **Deliberate confirm.** Auth callback alone does NOT start the import — a distinct confirm step is required.
4. **One-click disconnect.** Disconnect never deletes already-imported data. Two separate actions, two separate dialogs.
5. **Never mandatory.** Every step has "Not now" / "Cancel." Skipping changes nothing in the app.

### 12.2 Connect-Flow Steps

The same 7-step flow applies to every platform adapter. Platform-specific variation is copy and auth mechanism, not structure.

**Step 1 — Source discovery card**

A card on the Life History / Connections settings surface, one per available source:

```
[Platform icon]  Google Photos
  Your photos organized by date and location on your personal timeline.
  Status: Not connected

  [Connect]
```

No technical terms. The card describes the outcome, not the mechanism.

---

**Step 2 — Intent screen (plain-language explanation, before ANY auth prompt)**

```
Connect Google Photos

What you'll get:
  • Your photos organized by date and location on your personal timeline
  • Dates and GPS locations pulled from your photo metadata
  • Album names and captions preserved as context

What we won't do:
  • Your photos stay in Google Photos — we read metadata only
  • No sharing with anyone, ever
  • No data sent to any third party

Ready? Google will ask you to confirm what access you're granting.

  [Continue to Google sign-in]          [Not now]
```

Hover tooltip on "photo metadata": "Hidden data cameras attach to photos — like the date taken and GPS location. We use it to place photos on your personal timeline." Tooltip is supplementary; it is never the primary carrier of essential information.

---

**Step 3 — Auth or archive upload**

*OAuth sources (Google Photos, Gmail):*
Standard browser OAuth popup. User sees Google's own consent screen with exact scopes listed. After approval, returns to the app. PoeTech never handles credentials — only the resulting authorized token.

*Archive sources (Facebook, LinkedIn):*

```
Download and upload your Facebook archive

  1. Go to Facebook → Settings → Your Facebook Information
     → Download Your Information
  2. Choose: Format: JSON  ·  Time range: All time  ·  All categories
  3. Wait for the download email (up to 24 hours), then download the ZIP
  4. Upload the ZIP here:  [Choose file]

  The archive is processed on your NAS. It is never uploaded to any external server.
```

---

**Step 4 — Preview (mandatory preview-then-execute)**

The adapter runs a lightweight probe (dry-run) before writing anything to the store:

```
Here's what's ready from Google Photos

  3,847 items  ·  spanning Jan 2008 – Jul 2026  ·  1,204 with GPS location

  Sample items:
  📷  Jun 14, 2019  ·  Champaign, IL  ·  "Family Reunion" album
  📷  Dec 25, 2022  ·  Chicago, IL   ·  "Christmas" album
  📷  Mar 8, 2015   ·  no location   ·  no album

  [Import all 3,847]      [Import last 90 days only]      [Cancel]
```

This step is mandatory — no adapter may proceed from auth directly to import without showing a preview. The probe path is part of the adapter contract (§3.2: `discover_latest()` / `ingest_archive()` with `--dry-run`).

---

**Step 5 — Deliberate confirm**

```
Import 3,847 photos from Google Photos?

These will appear on your personal timeline. Your photos
stay in Google Photos — we're adding them to your PoeTech
life history, not moving them.

  [Yes, import my Google Photos]          [Cancel]
```

Button text uses the user's voice. The import does NOT begin until this button is tapped.

---

**Step 6 — Live progress (never silent)**

```
Importing Google Photos...
  ████████░░░░░░░░░  2,108 of 3,847  (~4 min remaining)

  You can close this screen. We'll notify you when it's done.
```

The adapter runs on the NAS; the app polls status and displays progress. Imports are resumable — if interrupted, the adapter picks up where it left off on the next run (idempotent upsert by `item_key`).

---

**Step 7 — Done**

```
Google Photos imported

  3,847 photos added to your timeline
  1,204 with GPS location
  Earliest: January 3, 2008

  [View my timeline]     [Connect another source]
```

### 12.3 Disconnect and Data Sovereignty

The source management card for a connected source:

```
Google Photos  ·  Connected  ·  Last synced Jul 2, 2026
3,847 items in your life history

  [Sync now]     [Disconnect]
```

Tapping "Disconnect":

```
Disconnect Google Photos?

  • Syncing will stop
  • Your 3,847 imported items stay in your PoeTech history
  • You can reconnect at any time

  [Yes, disconnect]     [Cancel]
```

After disconnect: the OAuth token is revoked via the platform's revocation endpoint. The NAS adapter stops scheduling runs for this source. **Imported data is NOT deleted** — the user owns it; it stays in the sovereign store until explicitly removed.

Data removal is a separate, distinct action ("Remove all Google Photos from my history") with its own confirmation dialog. Two separate buttons. Two separate intents. Disconnect and delete are never the same action.

### 12.4 The Reusable Primitive

This flow is not photo-specific. Every adapter in this roadmap (Gmail, Google Photos, Facebook, LinkedIn, X) goes through the same 7 steps. Platform variation is copy and auth mechanism, not structure.

**Future component shape:**

```jsx
<ConnectSourceFlow
  sourceKey="gphotos"                    // drives copy + icon from CONNECT_SOURCES config
  authType="oauth"                       // or "archive" — changes Step 3 UI
  onAuth={handleOAuthCallback}           // OAuth: called on token receipt
  onArchiveUpload={handleZipUpload}      // archive: called on file upload
  onProbe={runProbe}                     // returns { count, dateRange, sampleItems }
  onConfirm={startImport}               // triggers the NAS adapter run
  onProgress={pollImportStatus}          // live status: { done, total, etaSeconds }
  onDisconnect={revokeAndStop}          // OAuth revoke + stop NAS schedule
/>
```

Per-source copy lives in a `CONNECT_SOURCES` config — same pattern as `help-content.js` and `lib/feedback-triage.js`:

```js
const CONNECT_SOURCES = {
  gphotos: {
    name: "Google Photos",
    tagline: "Your photos organized by date and location on your personal timeline.",
    whatYouGet: [
      "Photos organized by date and location on your personal timeline",
      "Dates and GPS locations from your photo metadata",
      "Album names and captions preserved as context",
    ],
    whatWeWont: [
      "Your photos stay in Google Photos — we read metadata only",
      "No sharing with anyone, ever",
      "No data sent to any third party",
    ],
    authType: "oauth",
    previewLabel: "photos",
    confirmVerb: "import my Google Photos",
    disconnectNote: "Syncing stops; your imported photos stay in your history.",
    metadataTooltip: "Hidden data cameras attach to photos — like the date taken and GPS location.",
  },
  gmail:    { /* ... */ },
  facebook: { /* ... */ },
  linkedin: { /* ... */ },
};
```

### 12.5 Anxiety-Clarity Mapping

Per `ANXIETY-CLARITY-PRINCIPLE.md` — every surface answers what / when / why / how:

| User question | Answer in the connect-flow |
|---|---|
| "What will you take from my account?" | Step 2: "What you'll get" bullet list |
| "Will you share it with anyone?" | Step 2: "What we won't do" bullet list |
| "What will it look like in the app?" | Step 4 preview: real sample items before committing |
| "How much is this?" | Step 4 preview: count + date range |
| "What if I change my mind?" | "Not now" at Step 2; "Cancel" at Steps 3–5; "Disconnect" at Step 7 |
| "Will my data disappear if I disconnect?" | Disconnect dialog: "Your items stay in your history" |
| "Do I HAVE to connect anything?" | Source cards are optional; skipping changes nothing |

### 12.6 Design Constraints

- **No jargon in user-facing copy.** "OAuth" → "sign in to Google." "EXIF" → tooltip only. "API" → never visible.
- **Opt-in only.** Source tiles appear on the settings surface; nothing auto-connects or auto-imports.
- **Preview is mandatory.** No adapter may skip from auth callback to import without a probe step. The probe/dry-run is part of the adapter contract (§3.2).
- **Disconnect never deletes.** These are permanently separate actions with separate confirmation dialogs.
- **Mobile-first tap targets.** Minimum 44×44 px for all interactive elements. Tooltips explain jargon but are never the sole access path — an info icon with tap fallback is provided.
- **WCAG 2.1 AA throughout.** Same contrast and focus standards as the rest of the app (see `feedback_wcag_aa_binding_standard` memory).

---

## 13. Item-Key Namespace Convention

Ensures that two platforms can never write conflicting keys into the same `(instance_id, video_id)`
unique constraint, and that the platform of any existing row is recoverable from the key alone.

| Platform | Key format | Example |
|---|---|---|
| YouTube | Raw video ID (no prefix — backward compat) | `dQw4w9WgXcQ` |
| RSS | `rss:{guid}` | `rss:https://example.com/episodes/123` |
| Gmail / Email | `gmail:{message_id}` | `gmail:18f2a3b4c5d6e7f8` (Gmail Message-ID) |
| Facebook | `fb:{post_id}` | `fb:10150123456789012` |
| LinkedIn | `li:{share_urn}` (URL-encoded) | `li:urn:li:share:7012345678901234567` |
| Instagram | `ig:{media_id}` | `ig:17854360229135492` |
| TikTok | `tt:{video_id}` | `tt:7123456789012345678` |
| X | `x:{tweet_id}` | `x:1234567890123456789` |
| Archive items (FB) | `fb-arc:{hash}` | `fb-arc:a3f2...` (SHA-256 of guid from archive) |
| Google Photos (API) | `gphotos:{media_item_id}` | `gphotos:ALS3qF0Abcd1234EfGhi` (stable Google Photos API ID) |
| Google Photos (Takeout) | `gphotos-arc:{sha256}` | `gphotos-arc:a3f2...` (SHA-256 of filename + photoTakenTime) |
| Facebook Photos | `fb-photo:{media_id}` | `fb-photo:10155123456789012` (distinct from post-type `fb:{post_id}`) |

Archive-sourced items use the platform prefix + `-arc` suffix to distinguish them from live-API-sourced
items of the same content (useful when the same post exists in both the live API and an archive snapshot).

---

## 14. Known Gap — Coverage Display Layer

`buildLedger()` in `app/src/lib/video-harvest.js` computes the harvest coverage % by joining
`choir_sermons` (a YouTube-sourced corpus table) OVER `video_harvests`. Items from other platforms
(Facebook, LinkedIn, RSS) land in the **store** (`video_harvests`) but do not yet appear in the
coverage display surface until the display layer queries `content_sources` rows per-platform.

**Paths to close this gap (post-YouTube-verification):**
- **(A) Preferred:** The display layer queries `content_sources` to enumerate the full corpus
  per-platform and joins against `video_harvests` by `source_platform`. Keeps `choir_sermons`
  as YouTube-only; other platforms have their own corpus enumeration.
- **(B) Simpler short-term:** Each adapter also writes a minimal row into `choir_sermons` with a
  platform-namespaced `video_id`, making the existing JOIN work across platforms.

Path A is the right long-term direction — it avoids repurposing a YouTube-semantics table for
non-YouTube content.

---

## 15. Registered Adapters

| Adapter | File | Platform | Auth | Status |
|---|---|---|---|---|
| YouTube caption-fetch | `load-transcripts.py` | `youtube` | None (public caption API) | **Active — production** (COLG Sunday/Wednesday) |
| RSS / Podcast | `rss-ingest.py` | `rss` | None — open standard | **Draft — on hold** pending YouTube lane verification |
| Gmail / Email (historical events) | `gmail-ingest.py` (future) | `gmail` | Gmail API OAuth 2.0 — REUSE receipts-lane connection | **Design stage. PRIORITY IMMEDIATE** — implement after YouTube + receipts lane verified. |
| Gmail / Email (receipts, existing lane) | (lane `local_e63f400c`) | `gmail` | Gmail API OAuth 2.0 | In progress (receipts lane); foundation for historical events extension |
| Facebook (archive) | `facebook-ingest.py` (future) | `facebook` | Export archive — no OAuth | Design stage. PRIORITY #1. |
| LinkedIn (archive) | `linkedin-ingest.py` (future) | `linkedin` | Export archive — no OAuth | Design stage. PRIORITY #2. |
| Facebook (live API) | `facebook-api-ingest.py` (future) | `facebook` | OAuth 2.0 + Meta Graph API | Design stage — secondary to archive path; incremental new-post sync. |
| LinkedIn (live API) | `linkedin-api-ingest.py` (future) | `linkedin` | OAuth 2.0 — limited to write+profile | Design stage — write-only use case; post-reading not viable without Partner Program. |
| Instagram | (future) | `instagram` | Meta Basic Display or Graph API + OAuth | Post-FB/LinkedIn. |
| X / Twitter | (future) | `x` | Archive (primary); API (expensive) | Post-FB/LinkedIn. |
| TikTok | (future) | `tiktok` | API + archive combined | Lowest priority for personal corpus. |
| Google Photos | `gphotos-ingest.py` (future) | `gphotos` | Google Photos API OAuth 2.0 — same Google Cloud project as Gmail (`photoslibrary.readonly` scope) | Design stage. Implement after Gate 1 (YouTube seam proven) + Gate 2 (Gmail OAuth proven end-to-end in the app). Connect-flow primitive (§12) must ship first. |
| Facebook Photos | Module within `facebook-ingest.py` (future) | `facebook` | Facebook "Download Your Information" archive — no separate auth | Photo parser module within the Facebook archive adapter. Same gate as FB archive (Gate 3). See §11.3. |

---

## 16. Implementation Hold and Sequencing

### Gate 1 — YouTube adapter verified in production

Prerequisites for everything below. Lane `local_4d62ae64` must confirm:
- `load-transcripts.py` writing to `video_transcripts` for real COLG videos
- Harvest % climbing past the previous 22% stall
- The seam (CanonicalItem shape) matches what the live adapter actually needed

On hold until Gate 1:
- `rss-ingest.py` (draft committed) — activate after YouTube proves the seam
- `scripts/source-adapter-guard.mjs` (draft committed) — activate after RSS validates
- Migration 0066 (`content_sources` + `source_platform`) — apply to production after YouTube lane merges
- `<ConnectSourceFlow>` component (§12) — design and ship after Gate 1 clears, before any OAuth-gated adapter (Google Photos, Gmail live sync) goes live in the app

### Gate 2 — Gmail-receipts lane verified in production

Lane `local_e63f400c` must confirm Gmail OAuth pull is working and receipt extraction is live.

On hold until Gate 2 (in addition to Gate 1):
- Gmail historical-events extension — PRIORITY IMMEDIATE after Gate 2 clears
- This is the lowest-new-work, highest-value-return adapter: OAuth is proven, only dual-output
  routing + `video_harvests` upsert and the email-category parsers are new work

### Gate 3 — RSS adapter activated (seam proven by two adapters)

After both YouTube + RSS write through the same backbone without collisions:
- Facebook archive adapter — PRIORITY #1 (includes photo parser module, see §11.3)
- LinkedIn archive adapter — PRIORITY #2

### Connect-Flow Primitive (§12) — Prerequisite for OAuth Sources

The `<ConnectSourceFlow>` component ships after Gate 1, before any OAuth-gated source goes live.
Required for: Google Photos API adapter, Gmail live-sync UI, any future adapter with a user-facing authorization step.
Archive-only adapters (Facebook, LinkedIn) can use a simplified Step 3 (file upload) via the same component.

### Photo Adapters

- **Google Photos API (`gphotos-ingest.py`):** Gate 1 + Gate 2 must clear; connect-flow (§12) must ship first. The Gmail OAuth proof (Gate 2) confirms the in-app OAuth flow end-to-end before adding the Google Photos OAuth scope.
- **Facebook Photos:** parser module within `facebook-ingest.py`; same gate as the Facebook archive adapter (Gate 3). No separate auth or sequencing requirement.

### Sequence diagram

```
YouTube lane (local_4d62ae64)  ──▶  Gate 1 ──▶  RSS adapter (validate seam)
                                       │                    │
                              Connect-flow (§12)       Gate 2 (Gmail OAuth)
                              ships here                    │
                                                    Gmail historical events
                                                            │
                                                      Gate 3 ──▶  Facebook archive
                                                            │       (incl. FB photos module)
                                                       LinkedIn archive
                                                       Google Photos API
                                                       (Gate 2 + connect-flow required)
```

**The design contract in this document (CanonicalItem + metadata block + adapter contract + connect-flow primitive) is the
target shape.** Nothing implements until the gate above it clears. No fake green.
