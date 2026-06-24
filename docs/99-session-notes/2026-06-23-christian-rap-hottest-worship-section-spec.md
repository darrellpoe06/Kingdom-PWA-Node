# Spec + Research-Review — "Hottest Christian Rap" Worship/Music Section (curated YouTube, Church tab)

**Date:** 2026-06-23
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — survey the live field with citations → recommendation → spec. **No feature code written.** This is the design + curation review that precedes the build.
**Status:** DRAFT for Darrell's review. Quality gate, not a hold parked on Darrell.
**Sibling lanes (do not collide):** `2026-06-23-research-review-body-study-to-course-materials-pipeline.md` (Body's-study → course pipeline), Choir / Pulpit / The Word / Engagement church-content surfaces. This surface **reuses** their primitives; it adds no new ones.

---

## TL;DR

Darrell wants an in-app section for the **hottest current Christian rap / hip-hop** ("like Lecrae and others"), built from **YouTube streams**. This review (a) researches who is *actually* hot right now (2026) with sources — because "hottest" decays and must not come from training-data memory — and (b) specs the surface.

- **What it is:** a **curated, refreshable, content-vetted grid of embedded YouTube videos** — artist · track · embed — under the Church tab.
- **Where it lives:** a new **`worship` sub-tab on the Church tab labeled "Worship"** (Christian rap is the launch shelf; the surface generalizes to all worship-music genres so it doesn't become a one-genre dead-end). Rationale + IA survey in §3.
- **What it reuses (builds nothing new):** the **Choir** curated-list + YouTube-embed pattern (`Choir.jsx`, `choir-sync.js` `youtubeEmbedUrl` at `choir-sync.js:174`), the **church-live** embed helpers (`church-live.js`), the **learn-framework age-band** for the kids-safe filter (`learnAgeBand`), and the **freshness** dot for "refreshed-on" honesty (`freshness.js`).
- **Freshness:** a **curated, admin-editable list** is the default and the *correct* default — YouTube's no-API-key embed path can play videos but cannot *rank* them ("hottest" needs chart/stream data the app cannot pull at scale without hitting the same fetch limits the SME/Gmail lanes already hit). The list is refreshed on the **continuous-reel cadence** by a curator. Any *automated* refresh is **Tier C + the three brakes** (budget / concurrency lock / kill-switch) and ships inactive.
- **Child-safety (BINDING — twins are 10):** every track is **content-checked and age-tagged before it surfaces.** Christian rap is generally clean/faith-centered, but "generally" is not a gate. A **clean/age-appropriate filter** (default = family-safe) and a **per-track vetted flag** are non-negotiable. A track that hasn't been vetted does not render. See §6.
- **Father's-Business framing:** evangelistic/worship content that reaches youth in the language they already listen in — Word-first, mission-aligned (§9).

**The honest constraint, stated up front (Verification Doctrine):** the YouTube **video IDs in the seed list below were gathered from web-search result titles on 2026-06-23, not from loading each video.** They are provenance-tagged, not embed-verified. **The curator verifies each embed plays AND the lyrics are clean before it surfaces** — that is step one of the build, and it is a real gate, not a formality.

---

## 1. RESEARCH — who is actually hot right now (2026), with sources

**Method:** WebSearch + WebFetch on 2026-06-23 against Rapzilla's "Most Streamed Christian Rap Artists of 2026" ranking (mirrored at lecrae.net), Billboard's Christian-chart reporting, and per-artist release/video lookups. Training-data memory was **not** used as a source for "hottest" — only live search results. Rapzilla's own domain 403'd a direct fetch; the identical ranking was read from the lecrae.net mirror (same list, same monthly-listener figures).

### 1a. The ranked field — Rapzilla / lecrae.net "30 Most Streamed Christian Rap Artists of 2026" (Spotify monthly listeners)

| # | Artist | Monthly listeners | Recent / notable |
|---|---|---|---|
| 1 | **Lecrae** | 2.98M | *Reconstruction* (2025), *Reconstruction: Second Story* (2026); podcasting |
| 2 | **Redimi2** | 2.36M | (Spanish-language CHH) |
| 3 | **Hulvey** | 2.72M | album *Could Be Tonight* (surprise-released Apr 8 2026); single "DAVE" (Mar 2026) |
| 4 | **Grits** | 2.21M | catalog/legacy streaming |
| 5 | **KB** | 1.92M | strong singles + visuals; no album since 2023 |
| 6 | **Funky** | 1.64M | *La Locura* (Spanish-language CHH) |
| 7 | **Caleb Gordon** | 1.67M | "GOD IS GOOD" w/ Forrest Frank; "War", "Rocky Road Pt. 2" |
| 8 | **Andy Mineo** | 1.16M | *The And* (2025); left Reach Sept 2024 for Miner League |
| 9 | **nobigdyl.** | 1.12M | indie tribe collective |
| 10 | **Torey D'Shaun** | 1.00M | *Come And See* (2024) |
| 11 | **Alex Jean** | 0.96M | *Thee Authors Ballad* |
| 12 | **gio.** | 0.84M | *FINE BY ME* |
| 13 | **Beacon Light** | 0.69M | |
| 14 | **Sondae** | 0.68M | *Northstar*, *BOY* |
| 15 | **Flame** | 0.58M | |
| 16 | **Futuristic** | 0.60M | |
| 17 | **1K Phew** | 0.55M | *What's Understood 3*; on Lecrae's "MOVE" |
| 18 | **Pregador Luo** | 0.53M | (Portuguese-language CHH) |
| 19 | **Jon Keith** | 0.50M | *GROW WINGS* |
| 20 | **Trip Lee** | 0.49M | Reach veteran |
| 21 | **Red Tips** | 0.49M | |
| 22 | **indie tribe** | 0.49M | collective (nobigdyl., etc.) |
| 23 | **Aaron Cole** | 0.48M | three Billboard #1 singles; "Peace At Last" (Feb 2026), "usher in the spirit" (May 2026) |
| 24 | **Miles Minnick** | 0.46M | Bay Area; on Lecrae/E-40 "The Method" |
| 25 | **Manafest** | 0.40M | |
| 26 | **Tedashii** | 0.40M | Reach veteran |
| 27 | **Dell Mac** | 0.40M | |
| 28 | **Pastor Mike Jr.** | 0.39M | (gospel/CHH crossover) |
| 29 | **Scootie Wop** | 0.39M | |
| 30 | **Nesk Only** | 0.39M | |

*Source: Rapzilla, "30 Most Streamed Christian Rap Artists of 2026" (Mar 2026), read via the lecrae.net mirror. Figures are Spotify monthly listeners as reported there.*

### 1b. Billboard context (the genre is surging — supports the Father's-Business framing)

Billboard reports Christian music surging on its charts — for the first time in ~11 years, two contemporary-Christian songs simultaneously charted in the Hot 100's all-genre Top 40. Christian hip-hop is riding that wave (Lecrae's longevity; Forrest Frank + Caleb Gordon's "God Is Good" crossover; Aaron Cole's three #1 singles). *This is the youth-reach the mission cares about — the music is already in the mainstream stream where the kids are.*

### 1c. Curation flags found in the research (decisions for Darrell/BG)

- **NF** — frequently surfaces in "Christian rap" searches and tours in 2026, but he **publicly rejects the "Christian rapper" label** ("I'm a Christian, but I don't make Christian music"). His lyrics also engage darker themes (mental health, profanity on some tracks). **Recommendation: exclude from the launch "Christian rap" shelf, or place only specific vetted tracks behind the strictest age tier with a note.** Do not auto-include on label alone.
- **Spanish/Portuguese-language CHH is genuinely top-of-field** (Redimi2 #2, Funky #6, Pregador Luo #18). For a multilingual congregation this is an *asset*, not noise — consider a "Sing in your language" shelf later. Out of launch scope; noted.
- **Andy Mineo** left Reach (Miner League) — affects where his official videos live, not his eligibility.
- **Lyric vs. official-video distinction matters for embeds:** several hot 2026 tracks shipped as *lyric* videos first (e.g., Hulvey "DAVE"). Lyric videos are fine to embed and are actually *better* for the clean-content gate (lyrics are on-screen and reviewable).

### 1d. Concrete seed list — official YouTube videos suitable for embedding

**Provenance: search-result titles, 2026-06-23. Embed-play and clean-lyric checks are PENDING (curator step one).** Each row is a *candidate*, not a confirmed-good embed.

| Artist | Track | YouTube watch URL | Embed-ready? | Notes |
|---|---|---|---|---|
| Lecrae | Resurrected (Official Music Video) | https://www.youtube.com/watch?v=3LkqJ5zHR84 | likely (official) | premiered Feb 10 2026 |
| Lecrae ft. 1K Phew | MOVE (Official Video) | https://www.youtube.com/watch?v=2irDsH6-5_E | likely (official) | |
| Lecrae ft. BEAM | Lift Me Up (Official Music Video) | https://www.youtube.com/watch?v=md-dSmNEZf4 | likely (official) | |
| Lecrae, Miles Minnick, E-40 | The Method (Official Music Video) | https://www.youtube.com/watch?v=jqALvfgdkXs | verify (E-40 feature — clean-check) | |
| Hulvey | DAVE (Official Lyric Video) | https://www.youtube.com/watch?v=jG9Q5QnBJyg | likely (official lyric) | lyric on-screen = easy clean-check |
| Aaron Cole | NUMBER ONE (Music Video) | https://www.youtube.com/watch?v=bxZHx2zJ1Rs | likely (official) | |
| Aaron Cole | MIRACLE (Official Music Video) | https://www.youtube.com/watch?v=Mdlo7wXbz-0 | likely (official) | |
| Aaron Cole | One More Day (Official Music Video) | https://www.youtube.com/watch?v=Hd7AL7gBtlg | likely (official) | |
| KB ft. Andy Mineo | 100 (Official Video) | https://www.youtube.com/watch?v=A0QfbztZ8A4 | likely (official) | |
| Forrest Frank & Caleb Gordon | God Is Good | (Spotify-confirmed; find official YouTube upload at curation) | find official upload | huge crossover; verify the *official* YT upload, not a fan re-up |

**Curator's launch target:** ~8–12 vetted tracks across ≥5 artists, family-safe tier, official uploads only. Keep it a *tight curated shelf*, not a dump — "hottest" means a short, fresh top list.

---

## 2. What this builds ON (proven pieces — reference, do NOT rebuild)

Every piece below is on the app today (verified by code survey 2026-06-23). The new surface is a *thin curated shelf* over them.

| Proven piece | Where it lives | What it already does | Role here |
|---|---|---|---|
| **Choir curated-list pattern** | `app/src/components/Choir.jsx` (SongRow ~52–105, SongForm ~110–150); `app/src/lib/choir-sync.js` | Curated, owner-editable list of songs with YouTube embeds, lyrics, scripture ref, service date; Supabase realtime sync; RLS owner-edit/member-read | **The exact template.** A "track" is a "song" with genre/artist/vetted/age-tag instead of service-date. |
| **`youtubeEmbedUrl`** | `app/src/lib/choir-sync.js:174` | Normalizes `watch?v=`, `youtu.be/`, `/embed/`, bare 11-char ID → `https://www.youtube.com/embed/{id}` | **The embed builder. Reuse verbatim** — do not write a new one. |
| **church-live embed helpers** | `app/src/lib/church-live.js:59–69` (`liveStreamEmbedUrl`, `latestUploadEmbedUrl`) | No-API-key channel/live/latest-upload embeds; service-window gating | Optional "live worship-set" shelf later; not needed for the curated grid. |
| **Iframe render contract** | `app/src/components/Choir.jsx:98–102` | `aspect-video` wrapper, `allow="encrypted-media; picture-in-picture"`, `allowFullScreen`, `loading="lazy"` | **The render contract. Copy it** — including `loading="lazy"` (bundle/perf) and the title attr (a11y). |
| **Age-band framework** | `learnAgeBand` state (`poe-financial-mvp-v28.jsx`), `learn-framework.js` (`AGE_BANDS`), `ChurchLearn.jsx` | Age-band selection already threaded through church content | **The kids-safe filter.** Tracks carry an age tag; the grid filters by the active band, default family-safe. |
| **Freshness dot** | `app/src/lib/freshness.js:38–69`, `app/src/components/FreshnessDot.jsx` | "Latest / update available" with color-not-sole-signal (WCAG 1.4.1) | **"Refreshed on {date}" honesty chip** so the shelf never *looks* fresher than it is. |
| **Church tab nav** | `poe-financial-mvp-v28.jsx:4758` | `[id,label]` tuple array; conditional staff-only tabs | Add one tuple: `['worship','Worship']`. |
| **TabScroll primitive** | `components/shared.jsx` (`<TabScroll>`) | Horizontal-scroll wrapper for sub-tab strips; overflow-guarded | The Church sub-tab strip already uses it; one more tab is free. |

> **Presenter note (verify before relying on it):** `MEMORY.md` records a Universal Presenter primitive (`Presenter.jsx` + `lib/presentable.js`, PR #306). **It is NOT present on this branch (`docs/feature-workflow-register`)** — `app/src/components/Presenter.jsx` does not exist here. It may be on `main` and behind this docs branch. **The build must confirm Presenter is on `main` before depending on it.** The spec does NOT require Presenter — the Choir pattern is sufficient and confirmed-present. A "play these as a worship-set presentation" mode is an optional later adapter *if* Presenter is confirmed.

---

## 3. PLACEMENT — recommendation + IA survey

**Church tab sub-tabs today** (`poe-financial-mvp-v28.jsx:4758`):
`Church (home)` · `Engagement` · `Choir` · `Learn` · `Conference` · `Venues` · `The Word (pulpit)` · *(staff)* `Video Wall` · `Observation`.

**Finding:** there is **no general worship/music/media surface** today. The closest is **Choir**, but Choir is purpose-scoped to the *worship team* (rehearsal repertoire, roster, schedule, director-edit) — it is **not** a congregation-facing "music to listen to" shelf, and overloading it would muddy a working tool. **The Word/Pulpit** is sermon content. So there is nothing to extend without distorting it.

**Recommendation: add a new Church sub-tab `worship` labeled "Worship."**

- **Why "Worship," not "Christian Rap":** Christian rap is the *launch shelf*, but a single-genre tab dead-ends and reads narrow. A "Worship" surface holds genre shelves (Christian Hip-Hop launches; Gospel, Worship/Praise, Spanish-language CHH, Kids can follow) — the same curated grid, more shelves. This matches the app's "new surface = new module" rule and keeps the door open without a rebuild.
- **Why under Church, not a top-level tab:** it's church/worship content for the Body; it belongs beside Choir / The Word / Engagement, and inherits the Church tab's audience and gating model. A top-level tab would over-promote a listening shelf above core financial/spiritual surfaces.
- **Visibility:** congregation-facing (all church users) for *playback*; **curator-edit gated to church staff** (same `isChurchStaff` gate the Video Wall / Observation tabs already use). Playback is open; curation is governed.
- **Module placement (code):** a **new component file** `app/src/components/ChurchWorship.jsx` + `app/src/lib/worship-sync.js` — **never in the monolith** (`project_new_surface_new_module`). One tuple added at `poe-financial-mvp-v28.jsx:4758` and one render line; everything else is new files (parallel-safe, no collision with the Body's-study or Choir lanes).

---

## 4. DESIGN — the curated grid

**Surface:** `ChurchWorship.jsx`, rendered when Church view = `worship`.

- **Header:** "Worship" + a **"Refreshed on {date}"** freshness chip (reuse `FreshnessDot` styling) + the **age-band selector** (default = Family-safe) + (staff only) a **"+ Add track"** button.
- **Genre shelf tabs** (TabScroll): launch with **"Christian Hip-Hop"** active; placeholders for Gospel / Praise & Worship / Español / Kids (empty shelves hidden until curated).
- **Grid of track cards** (responsive: 1-col mobile, 2–3-col desktop). Each card:
  - Thumbnail/`▶` → expands to the **`aspect-video` iframe** (Choir contract: `allow="encrypted-media; picture-in-picture"`, `allowFullScreen`, `loading="lazy"`, descriptive `title`). Lazy mount — iframe only mounts on play (perf + bundle, per `project_bundle_lazy_load`).
  - **Artist · Track** title; optional **scripture anchor** (reuse the Choir scripture-ref field — Word-first framing).
  - **Age-tag badge** (Family-safe / Teen+ ) and a small **"vetted ✓ {curator} {date}"** mark.
  - (Staff) edit / remove / reorder ("hottest" = curator-ordered top list).
- **Data shape** (`worship_tracks`, mirrors `choir_songs`):
  `{ id, genre, artist, title, youtubeUrl, scriptureRef, ageTag ('family'|'teen'), vetted (bool), vettedBy, vettedAt, sortOrder, status, addedBy, createdAt, updatedAt }`.
- **Empty/honest states:** an un-vetted or un-embeddable track **does not render to the congregation** (it shows only in the staff curation view with a "needs review" flag). No painted placeholder cards.

---

## 5. FRESHNESS — how it stays current (and why curated-default is correct)

**The constraint, stated plainly (Reality-Trace):** "hottest" is a *ranking*, and ranking needs chart/stream data (Billboard, Spotify/YouTube counts). The app's YouTube path is the **no-API-key embed** path (`church-live.js` proves this) — it can *play* a video but cannot *rank* the field. Pulling live chart/stream data at scale hits the **same fetch/quota walls** the SME-pipeline and Gmail lanes already hit. **So auto-ranking is not a free lunch; a curated list is the honest, sovereign default — not a fallback.**

**The model:**
1. **Default = curated, admin-editable list,** refreshed by a curator on the **continuous-reel cadence** (the reel is the established "keep things current" heartbeat; the curator updates the shelf when the reel surfaces it as due). Manual curation is **Tier B** (soak on preview), not autonomous.
2. **The "hottest" signal feeding the curator** = this research method, re-run: Rapzilla's periodic ranking + Billboard Christian reporting + per-artist new-release checks. The *human* re-runs it; the system reminds them it's due.
3. **Optional periodic refresh (LATER, gated):** a workflow that *proposes* additions for human approval — **never auto-publishes.** This is timer-driven automation and therefore **Tier C and ships inactive, with all three brakes** (budget ceiling per run, single-instance concurrency lock, dead-man kill-switch) per the binding `feedback_autonomous_automation_three_brakes` rule. It produces a *review queue*, not a live edit. A human approves every track before it surfaces. **Not in launch scope.**

---

## 6. AGE-APPROPRIATENESS — child-safety gate (BINDING)

Kids use this app; the twins are 10. Christian rap is *generally* clean and faith-centered — but "generally" is not a control, and CHH does include tracks with profanity, mature themes, or guest features from non-CHH artists (the research surfaced exactly this risk: NF's themes; an E-40 guest feature). **Child-safety is a real gate here, enforced structurally:**

1. **Per-track vetting is mandatory.** `vetted=false` ⇒ the track **does not render** to the congregation. There is no "default visible, vet later." (Verification Doctrine: unverified content does not ship.)
2. **Age-tag every track** (`'family'` | `'teen'`) and **default the grid to Family-safe.** Teen+ content is hidden unless the active age-band is raised (reuses `learnAgeBand`; a future kid-mode/PIN can lock the band — see `project_private_locations_pin`).
3. **Lyric review is part of vetting** — prefer official *lyric* videos for the launch shelf (lyrics on-screen = trivially reviewable). The curator confirms: no explicit content, no profanity, faith-consistent message.
4. **Curator + date recorded on the card** ("vetted ✓") so the gate is *visible* and auditable, not implicit trust.
5. **Report-a-track path** (reuse One-Voice routing → pastor/poetech) so a parent can flag anything that slips. (`one-voice-routing.js`.)
6. **Embeds are sandboxed** to the Choir contract (`allow="encrypted-media; picture-in-picture"` only — no broad permissions) and YouTube's own age-restriction still applies on top.

> **Proven-to-catch (DR-0076):** the build should add a tiny gate/test asserting that a `worship_tracks` row with `vetted=false` is filtered out of the congregation render — so the child-safety promise is machine-checked, not claimed. This is the LESSONS-LEARNED → new-gate discipline.

---

## 7. STANDARD SCREENS

### 7a. Sovereign-mesh tier

| Layer | Where it lives | Sovereignty note |
|---|---|---|
| Curated list data (`worship_tracks`) | Supabase cloud (`choir_songs` sibling), RLS by instance | Family/Church-owned rows; exportable; no third-party analytics on it (DATA-AS-EMPOWERMENT). |
| Video bytes | **YouTube (external) — embedded, never copied** | We embed, we do not host or scrape. The *list* (our curation, our taste, our vetting) is the sovereign asset; the playback is a pointer. This mirrors `church-live.js`'s posture exactly. |
| Age-band / kid-mode | device-local (`learnAgeBand`) | Stays on the device. |
| (Later) refresh proposer | NAS workflow, inactive, three brakes | Sovereign location; bounded compute. |

**Honest sovereignty caveat:** the *content* is on YouTube, so this shelf depends on a third-party platform (an embed can go private/region-locked). That is acceptable for a *listening* shelf (it's not system-of-record), and it's flagged so no one mistakes it for owned media. The owned, defensible asset is the **curated + vetted list**.

### 7b. Cost

- **Build:** low — a thin curated-list surface over existing primitives (Choir clone with different fields). One migration (`0041`).
- **Run:** **~$0 incremental.** No YouTube API key, no extra hosting (embeds stream from YouTube), Supabase rows are negligible. No GPU, no LLM at launch.
- **The only cost that can grow:** an automated refresh proposer (LLM calls to summarize new releases) — which is exactly why it's gated, braked, and out of launch scope.

### 7c. Father's-Business test (Matt 6:33; the mission filter)

- **Does it lift the family/community AND create rather than extract?** Yes — it surfaces Word-centered music to youth in the language they already listen in; it creates a curated, vetted, sovereign worship shelf; it extracts nothing (no ads, no data sale, no engagement-optimization — DATA-AS-EMPOWERMENT).
- **Word-first?** Yes — scripture-anchor field per track; Christian *rap* selected because the genre preaches; NF-style "Christian-but-not-Christian-music" excluded on purpose so the shelf stays Word-forward.
- **Serves COLG-first / youth-reach?** Yes — this is evangelistic content meeting young people where they are, aligned with COMMUNITY-FIRST-MISSION and the genre's documented mainstream surge (§1b).
- **The Test (Phil 4:8) on the content itself:** the per-track vetting gate (§6) *is* the Test applied to every track before it surfaces — true, pure, lovely, commendable, or it does not render.

**Verdict: passes.** Mission-aligned, non-extractive, child-safe-by-gate, sovereign-where-it-can-be and honest where it can't.

---

## 8. Tiering & rollout (RELEASE-TIERS)

- **The surface + curated list (manual): Tier B** — new feature + visual surface; soak on the feature-branch Vercel preview; family eyes before main. The COLG-facing + youth-content nature pushes the *content list itself* toward **Tier C judgment** (BG/Darrell sign-off on the launch tracklist) even though the mechanism is Tier B.
- **Any automated refresh: Tier C, inactive-on-ship, three brakes** (§5.3). Non-negotiable.
- **Migration:** next number is **`0041`** (highest existing = `0040-contractor-type.sql`). Schema-only; no real content in the public repo/bundle (curated tracks are public YouTube links, so no secrecy issue, but seed via Studio to keep the repo clean — mirrors the Video Wall convention).

---

## 9. Build order (for when Darrell greenlights — NOT done here)

1. **Curator vetting pass** — load each seed URL, confirm the embed plays AND lyrics are clean, set `ageTag` + `vetted`. (Closes the §1d provenance gap.)
2. `0041-worship-tracks.sql` (clone `choir_songs` shape + `genre`/`artist`/`ageTag`/`vetted`/`vettedBy`/`vettedAt`); apply via Studio; **verify the `db-migrate` run actually fired** (`project_db_migrate_trigger_gap`).
3. `lib/worship-sync.js` (clone `choir-sync.js`; **reuse `youtubeEmbedUrl`**, don't re-copy it — import it).
4. `components/ChurchWorship.jsx` (clone Choir render contract incl. lazy iframe + Choir iframe `allow` attrs).
5. Wire one tuple at `poe-financial-mvp-v28.jsx:4758` + one render line; staff-gate the curation controls.
6. **Proven-to-catch test:** `vetted=false` row is filtered from congregation render (§6).
7. Tier-B soak → BG/Darrell sign off the launch tracklist → land.

---

## 10. Institutional-Memory Event (church-work) — the in-app documentation entry

Per `INSTITUTIONAL-MEMORY-EVENTS.md:56`, until the Events module ships the **durable in-app form is a structured Event record carried in the session note** (typed, tagged, with learnings + artifacts) so it can be ingested wholesale when the module lands. This block IS that entry.

```json
{
  "id": "evt-20260623-worship-chh-shelf",
  "date": "2026-06-23",
  "type": "church-work",
  "title": "Spec: Hottest Christian Rap -> Worship/Music curated YouTube shelf (Church tab)",
  "description": "Research-first spec for a congregation-facing, curator-edited, content-vetted grid of embedded YouTube Christian hip-hop videos under a new Church 'Worship' sub-tab. Reuses the Choir curated-list + youtubeEmbedUrl + church-live embed pattern and the learn-framework age-band; adds no new primitives. Researched the live 2026 field with sources (Rapzilla/lecrae.net ranking, Billboard) rather than training-data memory.",
  "root_cause": null,
  "resolution": "Recommend new Church sub-tab 'worship' (generalizes beyond one genre); curated-default freshness (YouTube no-key embed cannot rank, only play); binding per-track child-safety vetting gate with proven-to-catch test; automated refresh deferred Tier C + three brakes, inactive on ship.",
  "tags": {
    "workflows": [],
    "modules": ["church", "worship", "choir", "learn-framework", "church-live"],
    "sector": ["church", "spiritual", "community"],
    "senders": ["dpoe"]
  },
  "provenance": { "who": "Claude (advisory)", "when": "2026-06-23", "source_surface": "research-review + code survey" },
  "learnings": "1) 'Hottest' decays - re-run live research, never recall from memory. 2) No-API-key YouTube embeds play but cannot rank; curated list is the correct sovereign default, not a fallback. 3) Child-safety is a structural gate: vetted=false must not render, machine-checked. 4) Name third-party-content dependency honestly (embed != owned). 5) NF excluded on label-rejection + theme grounds; exclude on content, not genre name.",
  "related_artifacts": [
    "docs/99-session-notes/2026-06-23-christian-rap-hottest-worship-section-spec.md",
    "app/src/components/Choir.jsx:98-102",
    "app/src/lib/choir-sync.js:174",
    "app/src/lib/church-live.js:59-69",
    "app/src/poe-financial-mvp-v28.jsx:4758"
  ],
  "status": "open"
}
```

---

## Sources

- [Rapzilla — 30 Most Streamed Christian Rap Artists of 2026 (Mar 2026)](https://rapzilla.com/2026-03-most-streamed-christian-rap-artists-2026/) (direct fetch 403'd; ranking read via mirror below)
- [lecrae.net mirror — 30 Most Streamed Christian Rap Artists of 2026](https://lecrae.net/2026/03/14/30-most-streamed-christian-rap-artists-of-2026/)
- [Rapzilla — Top 30 Most Popular Christian Rap Artists (Feb 2026)](https://rapzilla.com/2026-02-top-30-most-popular-christian-rap-artists/)
- [Billboard — Christian Music Is Surging on Billboard's Charts](https://www.billboard.com/music/chart-beat/christian-music-billboards-charts-surge-1235969363/)
- [Billboard — R&B/Hip-Hop genre charts](https://www.billboard.com/charts/genre/rb-hip-hop/)
- [YouTube — Lecrae, "Resurrected" (Official Music Video)](https://www.youtube.com/watch?v=3LkqJ5zHR84)
- [YouTube — Lecrae ft. 1K Phew, "MOVE" (Official Video)](https://www.youtube.com/watch?v=2irDsH6-5_E)
- [YouTube — Lecrae ft. BEAM, "Lift Me Up" (Official Music Video)](https://www.youtube.com/watch?v=md-dSmNEZf4)
- [YouTube — Lecrae, Miles Minnick, E-40, "The Method" (Official Music Video)](https://www.youtube.com/watch?v=jqALvfgdkXs)
- [YouTube — Hulvey, "DAVE" (Official Lyric Video)](https://www.youtube.com/watch?v=jG9Q5QnBJyg)
- [YouTube — Aaron Cole, "NUMBER ONE" (Music Video)](https://www.youtube.com/watch?v=bxZHx2zJ1Rs)
- [YouTube — Aaron Cole, "MIRACLE" (Official Music Video)](https://www.youtube.com/watch?v=Mdlo7wXbz-0)
- [YouTube — Aaron Cole, "One More Day" (Official Music Video)](https://www.youtube.com/watch?v=Hd7AL7gBtlg)
- [YouTube — KB ft. Andy Mineo, "100" (Official Video)](https://www.youtube.com/watch?v=A0QfbztZ8A4)
- [Spotify — Forrest Frank, Caleb Gordon, "GOD IS GOOD"](https://open.spotify.com/track/2gmqnkY0jrfz3vnO4FVS4p)
- [RadioU — Aaron Cole to release first 2026 single "Peace At Last"](https://radiou.com/musicnews/aaron-cole-to-release-first-single-of-2026-peace-at-last/)
- [Wikipedia — Hulvey, "Could Be Tonight" (2026 album)](https://en.wikipedia.org/wiki/Could_Be_Tonight)
- [Wikipedia — NF (rapper) — on rejecting the "Christian rapper" label](https://en.wikipedia.org/wiki/NF_(rapper))
