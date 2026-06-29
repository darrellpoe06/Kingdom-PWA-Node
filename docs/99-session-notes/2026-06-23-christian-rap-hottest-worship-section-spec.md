# Spec + Research-Review — "Hottest Christian Rap" Worship/Music Section (curated YouTube, Church tab)

**Date:** 2026-06-23
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — survey the live field with citations → recommendation → spec. **No feature code written.** This is the design + curation review that precedes the build.
**Status:** DRAFT for Darrell's review. Quality gate, not a hold parked on Darrell.
**Sibling lanes (do not collide):** `2026-06-23-research-review-body-study-to-course-materials-pipeline.md` (Body's-study → course pipeline), Choir / Pulpit / The Word / Engagement church-content surfaces. This surface **reuses** their primitives; it adds no new ones.
**See also §11 ADDENDUM** — Darrell's added inputs (2026-06-23): **YouTube Music** as an additional source, two **no-credential ingestion paths** (shared playlist URL / Google Takeout CSV), his **5 featured artists**, and his **"Fire" playlist** transcribed as the authoritative personal seed (rap/hip-hop **+ gospel/worship crossover**). The §11 seed list supersedes the §1d sketch.

---

## TL;DR

Darrell wants an in-app section for the **hottest current Christian rap / hip-hop** ("like Lecrae and others"), built from **YouTube streams**. This review (a) researches who is *actually* hot right now (2026) with sources — because "hottest" decays and must not come from training-data memory — and (b) specs the surface.

- **What it is:** a **curated, refreshable, content-vetted grid of embedded YouTube AND YouTube Music videos** — artist · track · embed — under the Church tab. (YouTube Music tracks are YouTube-backed, so the same embed/link path works; §11.1 covers normalizing a `music.youtube.com` URL vs a `youtube.com/watch` URL.)
- **Where it lives:** a new **`worship` sub-tab on the Church tab labeled "Worship"** (Christian hip-hop is the launch *emphasis*, but Darrell's own "Fire" playlist spans rap **and** gospel/worship — Tasha Cobbs Leonard, Tye Tribbett, Kirk Franklin, Maverick City — so the surface is **rap/hip-hop-forward with gospel/worship crossover**, organized by sub-category shelves, not a one-genre dead-end). Rationale + IA survey in §3; sub-categories in §11.4.
- **Darrell's sources (§11):** plain YouTube **+ YouTube Music** (his service). His **personal library** is large; pulling it directly needs his Google account (OAuth/connector) — **there is no YouTube Music connector in the registry, so we do NOT log in as him.** Instead two **no-credential** ingestion paths he controls: (a) a shared **playlist URL** we parse, or (b) a **Google Takeout CSV** he drops in. Default stays the curated public list so the section is populated regardless.
- **What it reuses (builds nothing new):** the **Choir** curated-list + YouTube-embed pattern (`Choir.jsx`, `choir-sync.js` `youtubeEmbedUrl` at `choir-sync.js:174`), the **church-live** embed helpers (`church-live.js`), the **learn-framework age-band** for the kids-safe filter (`learnAgeBand`), and the **freshness** dot for "refreshed-on" honesty (`freshness.js`).
- **Freshness:** a **curated, admin-editable list** is the default and the *correct* default — YouTube's no-API-key embed path can play videos but cannot *rank* them ("hottest" needs chart/stream data the app cannot pull at scale without hitting the same fetch limits the SME/Gmail lanes already hit). The list is refreshed on the **continuous-reel cadence** by a curator. Any *automated* refresh is **Tier C + the three brakes** (budget / concurrency lock / kill-switch) and ships inactive.
- **Child-safety (BINDING — twins are 10):** every track is **content-checked and age-tagged before it surfaces.** Christian rap is generally clean/faith-centered, but "generally" is not a gate. A **clean/age-appropriate filter** (default = family-safe) and a **per-track vetted flag** are non-negotiable. A track that hasn't been vetted does not render. See §6.
- **Content policy (BINDING, FINAL — §12):** the **only** hard-exclusion criterion is **profanity / explicit cursing.** Clean songs stay regardless of genre or a **secular guest** artist (e.g. Lecrae ft. Ty Dolla $ign — KEEP). Editorial identity is **Christ-centered FIRST**: the section is overwhelmingly Christian (rap, R&B, gospel, worship), featured + sorted first; a **fully-secular-but-clean** track is a *rare tolerated exception* (The Marías "No One Noticed" — Darrell: KEEP) that is **never featured.** Only **1** track in the whole seed is excluded: Kendrick "Not Like Us" (cursing). Excluded tracks are logged, never silently dropped.
- **Scriptural foundation (Word-first — §15.0):** **Proverbs 22:6** — *"Train up a child in the way he should go; even when he is old he will not depart from it."* (ESV) This verse IS the section's mission: the music + lyrics-as-curriculum **train children in The Way so it stays.** Printed in the section's mission copy, not just implied.
- **Dual purpose (BINDING — §15):** flowing from Prov 22:6 — **(1) positively FORM impressionable children** with *"good quality, healthy-thinker music"* (curation prioritizes substance + edifying, Christ-centered messaging) **and (2) PROMOTE those promoting Yahweh** — actively uplift the Kingdom artists, not just play them. Both first-class.
- **Multi-type library + favorites (§17):** spans **types** — Christian Rap, R&B, Gospel, Worship (Christ-centered first) — with **personal favorites / "Your Music"** (the ❤️ love reaction doubles as the save/favorite signal).
- **Shared reaction primitive (BINDING, cross-app — §18):** **one reusable ❤️/🙏/🔥/🙌 reaction control** (positive, age-appropriate only — no negative reactions) in `components/shared.jsx`, applied **uniformly to songs AND every video surface** (Worship, Choir, The Word, Song Workshop, Church-Live/Video Wall). Engagement only, no payments; feeds favorites/most-loved sorting + the feedback loop.
- **Community RADIO stations (§19):** continuous auto-play stations **ranked by community ratings** — the reactions/favorites ARE the rating signal. **"Most Loved"** (flagship) + per-type radios (rap/R&B/gospel/worship) + a personal "Your Favorites" radio; queue auto-fills from the ranked pool, re-ranks live as ratings come in. **Profanity-free + Christ-centered-only** govern the pool (secular-clean never plays on a radio); now-playing credits + promotes the artist (§16). User-initiated, no autonomous automation.
- **Lyrics-as-curriculum, for child formation (§13):** *"words and lyrics so we educate our children with the data."* Each song carries an **educational-data layer** — scripture references, themes, vocabulary, theology, kid discussion questions — pitched at age-appropriate levels (twins are 10) to form healthy, faith-grounded thinking. **Copyright bright line (binding):** derived teaching data is rights-clean and is the core; **full copyrighted lyrics are NEVER stored/displayed without a license** (licensed provider or church/artist-owned only).
- **Artist-promotion layer (BINDING — §16):** each artist gets a promotable presence — official channel / site / socials / where-to-support (store, merch, streaming) — driving listeners **to** the artists; a featured rotation shares visibility across Kingdom artists. **No payment processing built by us** (outbound links/visibility only; monetization stays Darrell's hand). The same "promote those promoting Yahweh" pattern is a broader app principle (extends to ministries/creators/churches).
- **Father's-Business framing:** evangelistic/worship content that reaches youth in the language they already listen in, Word-first; it **forms the children** through Scripture in the songs they love *and* **advances the Kingdom by uplifting its artists** (§9, §13, §15, §16).

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
  "description": "Research-first spec for a congregation-facing, curator-edited, content-vetted grid of embedded YouTube AND YouTube Music videos under a new Church 'Worship' sub-tab (rap/hip-hop-forward + gospel/worship crossover). Reuses the Choir curated-list + youtubeEmbedUrl + church-live embed pattern and the learn-framework age-band; adds no new primitives. Researched the live 2026 field with sources (Rapzilla/lecrae.net, Billboard) and seeded from Darrell's own 5 featured artists + his two playlists ('Fire' 104 + 'Inspirational', transcribed) + the public hot list, de-duped: ~161 unique seed, ~144 candidate videos resolved, 1 excluded (Kendrick 'Not Like Us', profanity).",
  "root_cause": null,
  "resolution": "New Church sub-tab 'worship' (genre-general, Christ-centered-first); curated-default freshness (no-key embed cannot rank, only play); YouTube + YouTube Music both supported (extend youtubeEmbedUrl regex for music.youtube.com; store source+sourceUrl); personal-library sync needs a Google connector that does NOT exist, so two no-credential ingestion paths (playlist-URL parse / Google Takeout CSV) + de-dup; FINAL content rule = profanity/cursing is the ONLY exclusion (clean Christian-with-secular-guest KEPT; secular-clean = rare never-featured exception; only Kendrick 'Not Like Us' excluded); proven-to-catch gate (no-profanity render + secular-clean-never-featured); DUAL PURPOSE = form children with quality/healthy-thinker music (curation rubric §15.1) + promote those promoting Yahweh (artist-promotion layer §16: outbound channel/site/support links + featured rotation, NO payment processing by us); lyrics-as-curriculum for child formation (derived rights-clean data, full lyrics licensed-only); scriptural foundation = Proverbs 22:6 (train up a child) printed in mission copy (Word-first); multi-type library (rap/R&B/gospel/worship) + personal favorites ('Your Music', love=favorite signal); ONE shared reaction primitive (love/amen/fire/praise, positive-only, in components/shared.jsx) applied uniformly to songs + EVERY video surface (Choir/Pulpit/Song Workshop/Church-Live/Video Wall), engagement only no payments, table media_reactions 0042; community RADIO stations ranked by those ratings (Most Loved flagship + per-type + personal favorites radio, continuous auto-play, re-ranks live; profanity-free + Christ-centered-only pool, secular-clean never plays; now-playing promotes artist; user-initiated client-side, needs YouTube IFrame Player API for auto-advance); automated refresh deferred Tier C + three brakes, inactive on ship.",
  "tags": {
    "workflows": [],
    "modules": ["church", "worship", "choir", "learn-framework", "church-live", "sme-pipeline", "scripture", "engagement", "presenter"],
    "sector": ["church", "spiritual", "community", "education"],
    "senders": ["dpoe"]
  },
  "provenance": { "who": "Claude (advisory)", "when": "2026-06-23", "source_surface": "research-review + code survey + Darrell's two playlists (Fire 104, Inspirational)" },
  "learnings": "1) 'Hottest' decays - re-run live research, never recall from memory. 2) No-API-key YouTube/YT-Music embeds play but cannot rank; curated list is the correct sovereign default, not a fallback. 3) Child-safety is a structural gate: vetted=false must not render, machine-checked. 4) Name third-party-content dependency honestly (embed != owned). 5) FINAL content rule: profanity/cursing is the ONLY exclusion criterion (refined from an earlier over-broad 'exclude secular' draft). Clean stays regardless of genre or a secular GUEST; only explicit/cursing is out (Kendrick 'Not Like Us'). Editorial identity = Christ-centered FIRST; fully-secular-but-clean (The Marias 'No One Noticed', Darrell KEEP) is a rare never-featured exception. Don't over-filter on a guest's secular status. 6) Personal-library sync needs a Google connector that does NOT exist -> two no-credential paths (playlist URL / Takeout CSV), never log in as him. 7) Lyrics-as-curriculum: teach via DERIVED data (scripture refs / themes / vocab / questions = rights-clean, reuse the SME faithfulness-gate to extract refs not lyric text); FULL lyrics only via licensed provider or church-owned - never scrape/store copyrighted lyrics. 8) DUAL PURPOSE is the spec's spine: (a) FORM impressionable children with quality/healthy-thinker music (curation rubric on top of the gate: substance, edifying, Christ-centered, age-fit, healthy patterns) and (b) PROMOTE those promoting Yahweh (outbound channel/site/support links + featured rotation; NO payment processing by us - monetization stays Darrell's hand). 9) 'Promote those promoting Yahweh' is a CROSS-APP principle -> extend the promotable-entity pattern to ministries/creators/churches (candidate DR). 10) Scriptural foundation goes IN the surface (Prov 22:6 in mission copy), Word-first, verified-not-from-memory (fetched ESV+KJV). 11) Reactions/favorites are a SHARED primitive (one <Reactions> in components/shared.jsx, generic media_reactions table keyed by target_type+target_id) applied to EVERY video surface, not forked per surface; positive-only emoji set (kids); love doubles as the favorite signal; engagement only, no payments.",
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

## 11. ADDENDUM (2026-06-23) — Darrell's inputs: YouTube Music + the "Fire" playlist

Darrell added: *"Google music too"* — he listens on **YouTube Music**. He also gave his **5 featured artists** and his **"Fire" playlist** (transcribed from screenshots; the playlist is likely private, so the transcription — not URL rendering — is the authoritative seed). This addendum supersedes the §1d sketch for the seed list.

### 11.1 YouTube Music as an additional source + URL normalization

YouTube Music tracks are **YouTube-backed** — the same video ID powers both surfaces — so the existing embed path works with a small normalization step. The two URL shapes:

| Shape | Example | How to handle |
|---|---|---|
| `youtube.com/watch?v=ID` / `youtu.be/ID` / `/embed/ID` / bare ID | `https://www.youtube.com/watch?v=oHFMZd065nM` | Already handled by **`youtubeEmbedUrl` (`choir-sync.js:174`)** — reuse verbatim. |
| `music.youtube.com/watch?v=ID` | `https://music.youtube.com/watch?v=oHFMZd065nM` | Same `v=` param → **extend the existing regex** so `youtubeEmbedUrl` also matches the `music.youtube.com` host. One added alternative in the existing pattern; still emits the standard `https://www.youtube.com/embed/{id}`. |
| `music.youtube.com/playlist?list=PL...` | his "Fire" list | A **playlist**, not a single video — handled by the ingestion path (§11.2), not the per-track embedder. The `list=PL...` ID is a standard YouTube playlist ID, so `youtube.com/playlist?list=PL...` is the equivalent. |

**Design rule:** store **both** a canonical `videoId` (for the embed) **and** the original `sourceUrl` + a `source` enum (`'youtube'` | `'ytmusic'`) so a card can deep-link back to *his* service ("Open in YouTube Music") while still embedding the standard player inline. The embed itself is identical; only the "open in" link differs by source.

### 11.2 Ingesting his personal library — no-credential, his-account-step flagged

**Pulling his actual YouTube Music library/history/playlists requires account integration (OAuth/connector). There is NO YouTube Music connector in the registry, so we do NOT authenticate as Darrell.** That is a deliberate his-account/connector step, *not* something this spec auto-does. The section's **default is the curated, editable public list** (so it is always populated). His personal list seeds it via either of two **no-credential** paths — he provides the link/file; we never log in as him:

| Path | Input | How it works | Trust/limits |
|---|---|---|---|
| **(a) Playlist-URL parse** | a **public or unlisted** YouTube/YT-Music playlist URL | YouTube/YT-Music pages are JS-rendered, so plain fetch returns a shell — render with the Chrome MCP (navigate → read_page) to extract title/artist/`videoId` per row. | Works only if public/unlisted. **A private playlist will not render without login → falls back to the transcription path / the curated list.** No credentials used either way. |
| **(b) Google Takeout CSV import** | a CSV he exports from Google Takeout (his music library/playlist) and drops in | Parse rows → artist/title → resolve each to an official `videoId` (same resolution as the curated list). | He owns the export; no auth on our side. Best for a *large* library. |

Both paths feed the **same de-dup step** (key on `videoId`, fall back to normalized `artist+title`) against the curated public hot list, so nothing double-lists. Each imported row still passes the **child-safety vetting gate (§6)** before it surfaces — import ≠ vetted.

> **For THIS spec:** the "Fire" playlist is **likely private**, so per Darrell we used his **screenshot transcription** as the authoritative seed (path-(a) rendering was not attempted — it would fail on a private list). The transcription is the durable input; if he later makes it public/unlisted, path-(a) can refresh it.

### 11.3 Featured artists (priority/featured seed)

From his YouTube Music "Artists on repeat" — these get a **`featured` flag** (pinned/lead placement on the shelf): **Lecrae, Hulvey, Trip Lee, nobigdyl., Jackie Hill Perry.** (All five are also in the §1 public ranking — Lecrae #1, Hulvey #3, Trip Lee #20, nobigdyl. #9 — so his taste and the live field agree; Jackie Hill Perry is a prominent CHH/spoken-word voice and 116/Reach collaborator.)

### 11.4 Naming / structure (broadened — his list spans genres)

The "Fire" playlist is **not pure rap** — it carries gospel/worship (Tasha Cobbs Leonard, Tye Tribbett, Kirk Franklin, Maverick City, Mali Music, Jonathan McReynolds) alongside the hip-hop. This **confirms the §3 decision to name the tab "Worship," not "Christian Rap."** Within it, organize by **sub-category shelves**:

- **Christian Hip-Hop / Rap** (launch emphasis — Lecrae, Hulvey, Trip Lee, Aaron Cole, Caleb Gordon, Aha Gazelle, Stevie Rizo…)
- **Gospel & Worship crossover** (Maverick City, Tasha Cobbs Leonard, Tye Tribbett, Kirk Franklin, Koryn Hawthorne…)
- **(later)** Praise & Worship / Español / Kids — empty until curated.

The data model's `genre`/`subcategory` field (already in §4) carries this; a track lands on the right shelf by tag.

### 11.5 Data-model additions (delta to §4)

Add to the `worship_tracks` shape: `source` (`'youtube'|'ytmusic'`), `sourceUrl` (the original link, for "open in his service"), `featured` (bool), `importSource` (`'curated'|'playlist'|'takeout'|'manual'`), `playlistName` (e.g. `'Fire'`). `videoId` is the de-dup key.

### 11.6 SEED LIST — resolved (the build's starting data)

Resolution method: bulk official-upload lookup via web search, 2026-06-23. **Confidence is tagged per row; these are *candidate* official IDs — the curator still confirms each embed plays + lyrics are clean before it surfaces (§6).** `CONTENT-CHECK` = extra lyric review warranted (mainstream/secular guest feature or theme).

**A) "Fire" playlist — tracks 1–34** (his personal seed; `playlistName: 'Fire'`):

| # | Artist | Track | videoId | conf | flag |
|---|---|---|---|---|---|
| 1 | Evan and Eris | Everything | ShEQR9SVb6I | high | |
| 2 | CèJae & MelodicB | Promises | NzZhJWWcOFo | high | |
| 3 | Koryn Hawthorne | Excellent | VxpBI4b8RkE | med | |
| 4 | Hulvey | All For You | kZA2Z6T6p3Q | high | |
| 5 | Maverick City Music | God Problems (Not By Power) (ft. Miles Minnick) | cH70j6KmHKc | high | |
| 6 | Tribl & Maverick City Music | Rest on Us (ft. Mariah Adigun & Jekalyn Carr) | Xr_Aq2dY934 | high | |
| 7 | CèJae | Psalm 51 | 5Tv28_JFByw | med | |
| 8 | Terrian | Stayed On Him (Isaiah 26:3) | p2I0Al8rhmk | high | |
| 9 | Sam Rivera & Caleb Gordon | Yahweh (Remix) | X5wvrGJdCog | high | |
| 10 | Lathan Warlick | Holy (ft. SVRCINA) | NChOGu7DvgU | med | CONTENT-CHECK |
| 11 | Mission | Thank the Lord (ft. V. Rose) | mRgReXR25ls | high | |
| 12 | Forrest Frank | GOOD DAY | eO7-9WzLDZo | high | |
| 13 | Lecrae & 1K Phew | WILDIN | oHFMZd065nM | high | |
| 14 | Transformation Worship | Eagle (Live) (ft. Osby Berry, KB & Kierra Sheard) | M8f7edGVgos | med | |
| 15 | Stevie Rizo & Mike Teezy | The Light | bAFJsQQk2wo | med | |
| 16 | Aaron Cole | MIRACLE | Mdlo7wXbz-0 | high | |
| 17 | Sam Rivera & Limoblaze | Lord & Savior | GYEyYAG3TQM | high | |
| 18 | Forrest Frank & Hulvey | ALL I NEED | xH1L-RxuL50 | high | |
| 19 | Franchesca | Praise On Repeat | XmmjFRoPwjY | high | |
| 20 | Lee Vasi | Baptize Me | tbfuQxRo4JY | med | |
| 21 | Jonathan McReynolds | All Along | x5FIs-dS-PY | high | |
| 22 | Evan and Eris | Glory | Rxn0goLZ41U | high | |
| 23 | Torey D'Shaun, 1K Phew & The Worship Shed STL | So Good | 696l3L4xXxM | med | |
| 24 | Hollyn | All I Need Is You | bWLlB_QrvLQ | med | |
| 25 | AHJAH | Can't Get Enough | Hw4pUE0SOeU | med | |
| 26 | Eris Ford | Talk | Yi0PtHHUpKU | high | |
| 27 | Marie Love | Guide Me | YX8tiq4MfMA | med | |
| 28 | Ariel Fitz-Patrick | God Love | JH9RKuTk6f8 | med | |
| 29 | Kingdom Business Cast | For Every Mountain (Remix) (ft. Tytist) | UNRESOLVED | low | resolve at curation |
| 30 | Jor'Dan Armstrong & Erica Campbell | Call | GcyN2tXNDME | med | |
| 31 | Stevie Rizo | LIONS | xkD9VtYfjJk | med | |
| 32 | Jordan May | Triggers | NNehk2xS-OY | med | |
| 33 | Aha Gazelle | Brand New (ft. D.TALL) | vDK1_iGvvJc | high | |
| 34 | Aha Gazelle | Balloons | 4AgdjpJ-dZE | high | |

**"Fire" playlist — tracks 35–67** (continuation; track 67's lead artist was cut off in the source and resolved to **Aaron Cole**):

| # | Artist | Track | videoId | conf | flag |
|---|---|---|---|---|---|
| 35 | Trip Lee | Standby (ft. Hulvey) | Ku6PoWEN6wQ | high | |
| 36 | Stevie Rizo | STAYING | UNRESOLVED | low | resolve at curation |
| 37 | Eris Ford & Evan and Eris | Bad Energy (ft. V. Rose) | 3K5mY4BCGVA | high | |
| 38 | Jonathan Traylor | High Up | pts3xlmqCPw | high | |
| 39 | Stevie Rizo | YHWH (ft. GED) | FjDecXd88tQ | high | |
| 40 | Jackie Legere | Did It For Me | YrHZx6Vj0yc | high | |
| 41 | Koryn Hawthorne | Top Two | k_pxJA2SaCg | high | |
| 42 | Jordan May | LOVE LOCKDOWN | UNRESOLVED | low | resolve at curation (wrong-artist matches) |
| 43 | Jackie Legere | Do More (ft. Jekasole) | t8EcNcBFKOY | high | |
| 44 | Trip Lee & Kirk Franklin | Mercy | 8jr-5Oq1r6M | high | |
| 45 | MTM Isaiah | Real Talk (ft. Shawndy) | ERVIp9rOaA0 | high | |
| 46 | CèJae | Fill Me Up | MZiUP3A_Sbk | high | |
| 47 | Lecrae & Tasha Cobbs Leonard | Your Power | JJhacXgWBJ0 | high | |
| 48 | Dee-1 | I'm Not Perfect | 73AVDoRT408 | high | |
| 49 | Pastor Mike Jr. | Winning | C0X_0VKCM6Y | high | |
| 50 | Zauntee | Wartime | caDnBcCF6FE | high | |
| 51 | Aha Gazelle | Hard To Find (ft. MainMain) | j3RO4d_D3uo | high | |
| 52 | Kirk Whalum | Now 'Til Forever | vdlfpEFS-RU | med | official audio |
| 53 | Caleb Gordon | Keep It 100 | csYBBPJqNJU | high | |
| 54 | Theresa Phondo, Marizu & Noël Mio | Blessings (Remix) (ft. Kingdmusic) | -07PUMKBvtk | high | |
| 55 | Franchesca | I Am Loved | GBV_i91Bmw8 | high | |
| 56 | V. Rose | Tells Me So | UNRESOLVED | low | resolve at curation |
| 57 | Franchesca | Rough Day | VYBkzl4jbcA | high | |
| 58 | Maverick City Music & Forrest Frank | No Longer Bound (I'm Free) (ft. Chandler Moore) | 9cZE-_0seRY | high | |
| 59 | Kai Uriah | Presence of God | 4-UkImJrnFA | med | official audio |
| 60 | Tasha Cobbs Leonard & Mary Mary | Counting My Blessings (Live) | Hdrv-JzigpQ | high | |
| 61 | Tye Tribbett | Only One Night Tho (Live) | kWF_gsv6Esw | high | |
| 62 | Stevie Rizo | BEST PART | UNRESOLVED | low | resolve at curation |
| 63 | Koryn Hawthorne | Look At God | thlsU1-ivZM | high | |
| 64 | Hulvey & Forrest Frank | Altar | 5lyb3mDBEW0 | high | |
| 65 | YB | KEEP FIGHTING | UNRESOLVED | low | resolve at curation (wrong-artist matches) |
| 66 | Mali Music | Let Go | MzlGcIp1qsc | high | |
| 67 | Aaron Cole | WATER 4 ME (ft. Parris Chariz & Not Klyde) | HAKykqTlc1U | high | CONTENT-CHECK (lead artist inferred; content clean CHH) |

**"Fire" playlist — tracks 68–104** (completes "Fire"; YT Music authoritative total = **104 tracks, 6h16m**. #90 & #91 are **excluded by policy** — see §12; #104 was not in the captured screenshots — 1 track to transcribe):

| # | Artist | Track | videoId | conf | flag |
|---|---|---|---|---|---|
| 68 | Hulvey, Torey D'Shaun & Alex Jean | Love Like That | uKUdN23FUZA | high | |
| 69 | Jonathan Traylor | Purpose Over Pleasure | 08EfwtUgLww | high | |
| 70 | Evan and Eris | Hands in It | I-nH_y-942s | high | CONTENT-CHECK (Pastor Mike Todd sermon excerpt) |
| 71 | Marcus Rogers | Light It Up | UNRESOLVED | low | resolve at curation |
| 72 | Lecrae & Gwen Bunn | Nothing Left to Hide | gjMh2BrcRTk | high | |
| 73 | Hulvey, KB & Lecrae | Can't Tell It All (Remix) | Imlt9qozNNk | high | |
| 74 | Tauren Wells | Famous For (I Believe) [Dove Awards Version] | wQwfs4YtrTM | high | |
| 75 | DOE | When I Pray | yJ9wQNCmJRo | high | |
| 76 | PJ Morton & JoJo | My Peace (ft. Mr. Talkbox) | SurdkFO8X3k | high | CONTENT-CHECK (JoJo = mainstream feature) |
| 77 | V. Rose | I Got You (ft. Eris Ford) | 2IokulC8Ex0 | high | |
| 78 | Jor'Dan Armstrong | CAN'T | vThZ6oP7css | med | |
| 79 | blssd music | TAYLORMADE - All For Me | uzahVAQJ_QM | high | |
| 80 | DOE | Brighter | ykEUTNoFhaA | high | |
| 81 | DOE | Good Now | U3uzpJh_YaA | high | |
| 82 | Naomi Raine | Won One | UNRESOLVED | low | resolve at curation |
| 83 | V. Rose | I Surrender | JlJgt2J2xMg | med | |
| 84 | Blanca & Jekalyn Carr | New Day | dropiKvqXOw | high | |
| 85 | Evan and Eris | You Know. | cMg8nT8DyLo | high | |
| 86 | Jekalyn Carr | Major (Official Live Video) | 99O0ixqM5HY | high | |
| 87 | Tye Tribbett | New | 7xyQrpdv5vo | high | |
| 88 | Travis Greene | Just Want You (ft. Jordan Connell & Chandler Moore) | xRE0LIQAqNg | med | |
| 89 | Koryn Hawthorne | Pray (Remix) (ft. KB) | mARoXUxxGR8 | high | |
| ~~90~~ | ~~Kendrick Lamar~~ | ~~Not Like Us~~ | **EXCLUDED** | — | **§12.1 — profanity/explicit (the only exclusion criterion)** |
| 91 | The Marías | No One Noticed | *resolve at curation* | — | KEEP — `secular-clean` exception (§12.2): clean, allowed, **never featured** |
| 92 | Forrest Frank | NO L's | 0UR7Ss_3GpQ | high | |
| 93 | 116 | Man up Anthem (ft. Lecrae, Tedashii, Trip Lee & KB) | D_K9sjB2pKM | high | |
| 94 | Spillhouse | Clean Heart (Psalm 51) | t1GQBbM0yDs | high | |
| 95 | Spillhouse | Shield Around Me (Psalm 3) | OzVMgpV3Ljs | high | |
| 96 | Spillhouse | My God, My God (Psalm 22) | UNRESOLVED | low | resolve at curation |
| 97 | Soul_Remedy | Let God Take Control | avPphgm73Ts | med | CONTENT-CHECK (AI-generated voices) |
| 98 | YiShai | Still Here | UNRESOLVED | low | resolve at curation |
| 99 | Bryson Gray | Ezekiel 3 (ft. Kidd Lee & NobleOfficial) | pi6rIIerSpE | high | CONTENT-CHECK — verify clean → KEEP; political persona is an editorial note for Darrell, not a profanity exclusion (§12.1) |
| 100 | Bizzle (God Over Money) | Way Up (ft. Sevin) | S_OJUMESC04 | high | |
| 101 | Hulvey | Beautiful | zDsE4BPuFRQ | high | |
| 102 | Mission | YAHWEH | UNRESOLVED | low | resolve at curation (artist ambiguous) |
| 103 | 1K Phew | Havin' | qbR4F4n7krY | high | |
| 104 | *(not captured)* | *(not captured)* | — | — | transcribe at curation (104 per YT Music) |

**B) Featured-artist representative tracks** (`featured: true`):

| # | Artist | Track | videoId | conf | flag |
|---|---|---|---|---|---|
| F1 | Lecrae | Headphones (ft. Killer Mike & T.I.) | -tdLw2EqfVc | high | CONTENT-CHECK — secular features; **prefer a cleaner lead track for kids (e.g. "Resurrected" `3LkqJ5zHR84`)** |
| F2 | Hulvey | HE WILL RETURN | 5WT8YcHkfk4 | high | |
| F3 | Trip Lee (116, ft. Lecrae, Jackie Hill Perry, Alexxander) | King David | 2iogKeCglCg | high | |
| F4 | nobigdyl. | ONE WAY | UFLG_1Qx15U | med | |
| F5 | Jackie Hill Perry | I Ain't Worried | 3GJfmcLESgM | high | |

**C) Public hot list (§1d)** — Lecrae "Resurrected"/"MOVE"/"Lift Me Up", Aaron Cole "NUMBER ONE", KB "100", Forrest Frank & Caleb Gordon "God Is Good" — fold in **de-duped** (drop any whose `videoId`/artist+title already appears in A or B; e.g. Lecrae/Hulvey/Aaron Cole already represented).

**D) "Inspirational" playlist** (§14; worship/gospel-leaning; **already de-duped vs "Fire"** — exact overlaps *Just Want You*, *I Am Loved*, *Can't Tell It All (Remix)*, *Look At God*, *Beautiful*, *YAHWEH* dropped; *Old Church Basement* handled as a full-album link, not a single embed):

| # | Artist | Track | videoId | conf | flag |
|---|---|---|---|---|---|
| 1 | Tasha Cobbs | For Your Glory (Live) | aKetXJjMUZ0 | high | |
| 2 | Travis Greene | Intentional | VH3f0ellNv8 | high | |
| 3 | Jekalyn Carr | You're Bigger | Z-ZV61eDLXI | high | |
| 4 | Mali Music | Loved By You (ft. Jazmine Sullivan) | h7LTt9_fYMY | med | CONTENT-CHECK (mainstream R&B feature) |
| 5 | Lecrae | Blessings (ft. Ty Dolla $ign) | i58IH2D8sWQ | high | KEEP — clean Christian song; secular guest allowed (§12.1) |
| 6 | Lecrae & Tori Kelly | I'll Find You | Jv8IqJm6q7w | high | |
| 7 | Lecrae | Tell the World (ft. Mali Music) | Yc8x33lAnAk | high | |
| 8 | Lecrae | All I Need Is You | 6iRTBh1gCjk | high | |
| 9 | Lecrae | Background (ft. Andy Mineo) | LHnZRZiCYHE | high | |
| 10 | Lecrae | If I Die Tonight (ft. Novel) | mQHXJjTpBlc | med | |
| 11 | Lecrae | Lost My Way (ft. King Mez & Daniel Day) | NSoVgyyJFkM | med | |
| 12 | Tasha Page-Lockhart | Why Not Me | mivDKdKHgHg | low | lyric video; verify MV |
| 13 | Tasha Cobbs Leonard | Your Spirit (ft. Kierra Sheard) | BZT8jqsc8lQ | high | |
| 14 | Jekalyn Carr | It Has Been Established | 8HKCYGA-Mv8 | high | |
| 15 | Kierra Sheard | Something Has To Break (Live) (ft. Tasha Cobbs Leonard) | ZuZJUXmKBeM | high | |
| 16 | William McDowell | Spirit Break Out (ft. Trinity Anderson) | wOSLtqxD-bM | high | |
| 17 | Jekalyn Carr | You Will Win | umkZnzmSTP0 | high | |
| 18 | Jubilee Worship | No Bondage | 3H_NwhsAqwM | high | |
| 19 | Tasha Cobbs Leonard | You Know My Name (ft. Jimi Cravity) | t7owFiihXgg | high | |
| 20 | Lecrae | Worth It (ft. Kierra Sheard & Jawan Harris) | ml22-t1-mxU | med | official audio |
| 21 | Lecrae | 8:28 | KPXV-VWcEAY | med | official audio (Romans 8:28) |
| 22 | Marvin Sapp | My Testimony | PZG8B8xYc7g | high | |
| 23 | Greg O'Quin 'N Joyful Noyze | I Told The Storm | gJM8GZ375pw | med | |
| 24 | Travis Greene | You Waited [Live] (Extended) | cyzbge2QEF4 | high | |
| 25 | Isaac Carree | So Glad (ft. Kierra Sheard, Kirk Franklin & Lecrae) | bvnVKHFyOAk | med | |
| 26 | Shana Wilson | Give Me You (Live) | RxKBVoEEcT0 | high | |
| 27 | Lecrae & Marc E. Bassy | Wheels Up | 0S2CrXY8CTg | high | KEEP — clean Christian song; secular guest allowed (§12.1) |
| 28 | CynthiaShantel (cover of Tye Tribbett) | Everything | UNRESOLVED | low | CONTENT-CHECK (cover, not label-official) |
| 29 | Tye Tribbett | The Worship Medley (Live) | mQe9MV3GJHY | high | |
| 30 | Lamar Campbell & Spirit Of Praise | More Than Anything | FA5WelLIXb8 | med | official audio |
| 32 | Maverick City Music & Kirk Franklin | Kingdom (ft. Chandler Moore & Naomi Raine) | 13PYVofBFRc | high | |
| 33 | Aaron Cole, Tauren Wells & TobyMac | LIKE YOU | v0RmisSm7aY | high | |
| 34 | Koryn Hawthorne | Know You (ft. Steffany Gretzinger) | lqJZgxhWxrM | med | |
| 35 | Elevation Worship & Maverick City | Old Church Basement | *(full album — album link)* | — | handle as album, not single embed |
| 36 | Limoblaze, Lecrae & Happi | Jireh (My Provider) | oIS_8Qotb08 | high | |
| 37 | Tye Tribbett | New (Live, Vevo) | 3uRt7CLapic | high | |
| 38 | Kierra Sheard | Miracles (ft. Pastor Mike Jr.) | sFyVhUCudus | high | |
| 40 | Franchesca | Saved Wave | UNRESOLVED | low | resolve at curation |
| 41 | Hulvey | Holy Spirit | CAKTH7HIX-w | high | |
| 43 | Hulvey | Can't Tell It All | UyHh9tSU7JA | high | |
| 44 | Hulvey | Higher (ft. Zach Paradis) | jufCDyNAtoM | high | |
| 47 | Elevation Worship | Trust In God (ft. Chris Brown) | QS04WbSnxok | high | KEEP — clean worship song; secular guest allowed (§12.1) |
| 48 | Lee Vasi | Teach Me | -lddOg1eJoc | high | |
| 49 | Franchesca | Faith In Me | BYe1VWJKXPQ | med | |
| 50 | Maverick City Music | Firm Foundation (He Won't) (ft. Chandler Moore & Cody Carnes) | uOP4s8fOEm0 | high | |
| 51 | Elevation Worship | More Than Able (ft. Chandler Moore & Tiffany Hudson) | dQ1xxoP7NJk | high | |

**FINAL SEED COUNT (combined, de-duped):**

| Source | Tracks in | Resolved (candidate videoId) | Unresolved / to-transcribe | Excluded by policy (§12) |
|---|---|---|---|---|
| "Fire" 1–34 | 34 | 33 | 1 (#29) | 0 |
| "Fire" 35–67 | 33 | 28 | 5 (#36, #42, #56, #62, #65) | 0 |
| "Fire" 68–104 | 37 | 29 | 5 (#71, #82, #96, #98, #102) + 1 to transcribe (#104) | 2 (#90 Kendrick, #91 Marías) |
| **"Fire" (COMPLETE, 104/YT Music)** | **104** | **90** | **11 + 1** | **2** |
| Featured artists F1–F5 | 5 | 5 | 0 | 0 |
| "Inspirational" (de-duped vs Fire) | 44 | 41 + 1 album link | 2 (#28, #40) | 0 |
| Public hot list (§1d/§C, de-duped) | ~8 | ~8 | 0 | 0 |
| **COMBINED UNIQUE SEED** | **~161** | **≈ 144 resolved + 1 album** | **13 to resolve + 1 to transcribe** | **2 excluded** |

**Headline (under the FINAL profanity-only rule, §12):** **≈144 clean candidate videos resolved** across his two playlists + featured artists + the public hot list, de-duped; **14 to resolve + 1 to transcribe at curation**; **exactly 1 hard-excluded** (Kendrick "Not Like Us" — profanity). Every resolved row is a *candidate* until the curator confirms embed + profanity-free (§6, §12.1).

**Composition (Christ-centered-first, §12.2):**

| Class | Count | Treatment |
|---|---|---|
| `christian` (incl. Christian songs w/ a secular guest) | **≈143** (the overwhelming majority) | featured + sorted first — the face of the section |
| `secular-clean` (rare tolerated exception) | **1** (The Marías "No One Noticed" — Darrell: KEEP) | kept, **never featured**, deprioritized |
| `explicit` (excluded) | **1** (Kendrick "Not Like Us") | hard-excluded, logged |

**Held for Darrell's decision: 0** — the earlier "secular guest" flags (Lecrae "Blessings"/"Wheels Up", Elevation "Trust In God", Bryson Gray "Ezekiel 3") are **all KEEP** under the final rule (clean Christian songs; profanity is the only gate).

**`CONTENT-CHECK` (clean-likely, profanity-verify at vetting — KEEP if clean):** #10 Holy (SVRCINA), #67 WATER 4 ME, #70 Hands in It (sermon excerpt), #76 My Peace (JoJo feature), #97 Let God Take Control (AI voices), #99 Ezekiel 3 (political persona — editorial note only), Inspirational #4 Loved By You (Jazmine Sullivan), #28 "Everything" (cover, not label-official). Plus the Lecrae "Headphones" featured-track swap noted at F1.

### 11.7 Screens delta

- **Sovereign-mesh:** unchanged posture — the **curated/imported list (his taste + vetting) is the owned asset**; YouTube **and** YouTube Music bytes are embedded, never copied. No-credential ingestion keeps it sovereign (we never hold his Google auth). A future YT-Music connector, if one ever lands in the registry, would be the only path to live personal-library sync and is explicitly out of scope until then.
- **Cost:** still ~$0 incremental at launch (embeds stream from YouTube/YT-Music; CSV/playlist parse is one-time, human-triggered). The only cost-growth vector (LLM-assisted bulk resolution/refresh) stays gated + braked.
- **Father's-Business:** strengthened — seeding from *his own* worship/rap rotation means the shelf reflects the family's actual devotional listening, Word-first, reaching the kids in the music already playing in the house. Passes.

---

## 12. BINDING content policy — profanity-free gate + Christ-centered identity (refined by Darrell)

**Final rule, declared by Darrell 2026-06-23 (refined across the day — supersedes the earlier "exclude secular" draft):** *"as long as they don't curse we're fine with the music that has a featured artist that is secular"* and the section should be *"preferably ONLY or MOSTLY Christ / Christian — rap, R&B, gospel, worship, etc."* Two parts: a **hard exclusion gate** and a **Christ-centered editorial identity.**

### 12.1 The hard gate — PROFANITY / explicit cursing is the ONLY exclusion criterion

A track is **excluded only if it contains profanity / cursing or carries an explicit marker.** That single bright line is enforced by default for **all users** (child-safe — the twins use the app).

- **NOT a reason to exclude:** a song's genre, or a **secular guest artist** on an otherwise-clean Christian song. Clean Christian songs that feature a mainstream guest are **KEPT.**
- **Verify clean per track:** platform **explicit flag** + a curator clean-check at vetting. Exclude only on cursing/explicit — never on genre or a guest's secular status.

**Excluded (the only one in the entire seed):**

| Track | Artist | Why |
|---|---|---|
| Not Like Us | Kendrick Lamar | explicit / cursing |

**Reinstated under the final rule** (previously over-flagged, now KEEP — clean Christian songs with secular guests): Lecrae "Blessings" (ft. Ty Dolla $ign), Lecrae "Wheels Up" (ft. Marc E. Bassy), Elevation Worship "Trust In God" (ft. Chris Brown). Likewise KEEP (clean-verify): Mali Music "Loved By You" (ft. Jazmine Sullivan), PJ Morton "My Peace" (ft. JoJo). Bryson Gray "Ezekiel 3" → KEEP if clean (its political persona is an editorial note for Darrell's awareness, **not** a profanity exclusion).

**Logged, never silently dropped.** An excluded track is recorded with `excluded:true` + `excludeReason` (audit) so Darrell sees what was filtered; it simply does not render.

### 12.2 The editorial identity — Christ-centered FIRST

The section is **overwhelmingly Christian / Christ-centered across genres** (Christian rap, Christian R&B, gospel, worship). That is the heart, the default, and the **featured + sorted-first** material — the face of the section.

- **Christian (incl. Christian-with-secular-guest):** `contentClass: 'christian'` → eligible to be featured/sorted first.
- **Fully-secular-but-clean** (e.g. The Marías "No One Noticed" — **Darrell's call: KEEP**, it's clean): allowed only as a **RARE tolerated exception.** `contentClass: 'secular-clean'` → **deprioritized in sort, NEVER featured, never the face of the section.** It stays in the data; it does not represent the section.
- **Cursing/explicit:** hard-excluded (§12.1).

**Effectively: Christian-first ordering; secular-clean is a tolerated minority, never the identity.** A curation rule enforces a clear Christian majority in featured/surfaced positions. **On top of this gate + identity sits the quality / healthy-thinking curation rubric (§15.1)** — what shapes a young mind well ranks first.

### 12.3 Data model + gate

`contentClass` (`'christian' | 'secular-clean' | 'explicit'`), `hasProfanity` (bool — the gate), `excluded` (bool, set only for explicit/profanity), `excludeReason`, `featuredEligible` (bool — true for `christian`, false for `secular-clean`). Sort + feature logic ranks `christian` first; `secular-clean` is never featured.

**How classification is sourced (no autonomous drop without a record):** explicit flag from platform metadata; Christian-vs-secular from artist/label (Reach, Gotee, Tribl, Maverick City, Provident, RCA Inspiration = Christian). An automated pre-filter may *flag* a suspected profane/secular row; a human confirms. Nothing is auto-removed from existence — flagged, recorded, classified.

**Proven-to-catch test (extends §6, DR-0076):** (a) a row with `hasProfanity=true` / `contentClass='explicit'` / `excluded=true` **must not render to anyone** — ship only after it CATCHES a planted Kendrick-style cursing row; (b) `secular-clean` rows **must not appear in featured / top-sorted positions.** Both promises machine-checked, not claimed.

---

## 13. Lyrics-as-curriculum — educational-data layer (copyright-safe)

**Declared by Darrell 2026-06-23:** *"words and lyrics so we educate our children with the data."* He wants each song's words/lyrics to become **educational data** — teaching the children themes, scripture, vocabulary, and theology *through the music they already love*. This is the bridge from "a shelf to listen to" into the **kids' learning layer**.

### 13.0 The copyright bright line (BINDING)

**Do NOT store, reproduce, or display FULL copyrighted song lyrics without a license.** Full-lyric reproduction is a legal line we do not cross. The design is rights-clean by construction: the **teaching value lives in DERIVED data** (which is not copyrightable), and full lyrics are an **opt-in, licensed-only** add-on.

### 13.1 Layer A — DERIVED educational data (rights-clean; this is the core "educate with the data" payload)

For each (clean, in-policy) song, capture **facts about the song**, not its lyric text:

- **Scripture references** the song cites — **Bible verse text is public-domain/freely usable** (and the app already has the Scripture component + `SCRIPTURE-REFERENCE-STANDARD.md`: ESV primary, KJV secondary). This is the spine of the teaching layer.
- **Themes / topics** (e.g. perseverance, grace, identity in Christ, repentance).
- **Key vocabulary** (theological terms a 10-year-old can learn — "atonement," "covenant," "redemption") with kid-level definitions.
- **Theology notes** — the doctrinal idea the song carries, checked against the Worldview spine.
- **Discussion / teaching questions** for kids — what / when / why / how (ANXIETY-CLARITY-PRINCIPLE), so a parent or teacher can turn a song into a 5-minute lesson.

**How we source the derived data WITHOUT reproducing lyrics (three clean methods, in order of cost):**

1. **Title-embedded scripture refs — free and immediate.** Many tracks name the verse in the title/parenthetical. From his own seed: *"Stayed On Him (Isaiah 26:3)"*, *"Clean Heart (Psalm 51)"*, *"Shield Around Me (Psalm 3)"*, *"My God, My God (Psalm 22)"*, *"Ezekiel 3"*, *"8:28"* (Romans 8:28), *"Yahweh / YHWH"*, *"Famous For (I Believe)"*. These parse straight into `scriptureRefs` with zero rights issue.
2. **The sovereign SME / course-materials pipeline (reuse the sibling lane).** The 2026-06-23 body-study research-review already specs a **local Whisper transcribe → scripture-aware extraction → faithfulness gate** that *detects every scripture reference* in spoken/sung audio. Re-point it at a song's audio to extract **refs + themes as derived facts** — we keep the **refs and the analysis, NOT the transcript/lyric text.** Sovereign, local (NAS Ollama `qwen2.5:14b`), already built. This is the same engine, a new input.
3. **Curator / BG annotation + local LLM** generates themes, vocab, and kid discussion questions **from the derived data + a public summary** (not from stored lyrics). Human-reviewed (faithfulness gate) before it teaches.

### 13.2 Layer B — FULL LYRICS display (optional, LICENSED-ONLY, gated)

If full on-screen lyrics are ever wanted in-app, **only** via:
- A **licensed lyrics provider** — **Musixmatch / LyricFind / Genius API** under their terms, **with required attribution** (`lyricsLicense` + `lyricsAttribution` fields; `lyricsText` populated only from the licensed feed at render time per terms, ideally not persisted if the license forbids caching), **or**
- **Church/artist-OWNED content** — songs COLG or a partnering artist owns/licenses to us (`lyricsLicense: 'owned'`). For COLG-owned worship recordings this is fully clean.

**Never** scrape/store full lyrics from unlicensed sources. `lyricsText` defaults `null`; the absence of a license simply means Layer A teaches and Layer B is hidden.

### 13.3 Data-model additions (educational layer)
`scriptureRefs: string[]`, `themes: string[]`, `vocabulary: [{term, kidDefinition}]`, `theologyNotes: string`, `discussionQuestions: string[]`, `lyricsLicense: null|'musixmatch'|'genius'|'lyricfind'|'owned'`, `lyricsAttribution: string|null`, `lyricsText: string|null` (only when licensed/owned).

### 13.4 Where it plugs in (ties named by Darrell)
- **Kids' LMS / learning** — a song becomes an **age-banded mini-lesson** via `learn-framework.js` (`AGE_BANDS`, `chunkLessonForAge`): listen → read the scripture it cites → discuss. Psychoeducation/learning layer.
- **Course-materials pipeline** — the educational data is the *same MODULES-shaped output* the body-study lane produces; songs feed the catalog beside sermons/studies.
- **Presenter / Study / Engagement** — a song's scripture + questions present live (Presenter), seed reflection (Study), and become trivia (Engagement) — all existing surfaces.
- **Father's-Business** — the Word taught through music the children already choose to hear. Word-first, mission-true, and it turns passive listening into discipleship.

---

## 14. Second source — "Inspirational" playlist + ongoing sourcing

Darrell shared a **second playlist, "Inspirational"** (worship/gospel-leaning — Tasha Cobbs Leonard, Travis Greene, Jekalyn Carr, Maverick City, Elevation Worship, plus a deep Lecrae catalog). It is **de-duped across "Fire"** (key on `videoId`, fallback `artist+title`): exact overlaps dropped (e.g. *Just Want You* — Travis Greene, *I Am Loved* — Franchesca, *Can't Tell It All (Remix)*, *Look At God*, *Beautiful* — Hulvey, *YAHWEH* — Mission). One entry — *Old Church Basement* (Elevation Worship & Maverick City) — is a **full album (1:43:58)**, handled as an **album/playlist link**, not a single embed. Resolved table in §11.6-D. *(Darrell noted "Inspirational" may still be scrolling; the table extends the same way.)*

**Bonus expansion candidates** (YT Music surfaced these *alongside* the playlist, NOT in it — optional "you might add," content-vetted before surfacing): *Faith and Favor* — Stevie Rizo; *Fruits of My Labor* — Caleb Gordon; *More Like You* — Jordan May; *NO LONGER BOUND* — Forrest Frank & Hulvey; *Yeshua!* — Vic Lucas; *My Soul (feat. Noah Surratt)* — Marcus Rogers; *Forever in Faith* — Alex Jean.

**Related playlists for ongoing sourcing** (the curator's recurring "what's fresh" inputs, per §5): YT Music *"Christian R&B"*, *"Christian-Pop Party"*, *"Gospel"*, *"Right now"* (Taylor Haynes). These join the Rapzilla/Billboard re-run as the human refresh inputs — none auto-pulled.

---

## 15. PURPOSE — form the children + promote those promoting Yahweh (BINDING, dual goal)

### 15.0 Scriptural foundation (Word-first — the heart of the section)

**The section's purpose is grounded in Scripture, declared by Darrell 2026-06-23:**

**ESV — Proverbs 22:6:** *"Train up a child in the way he should go; even when he is old he will not depart from it."*

**KJV — Proverbs 22:6:** *"Train up a child in the way he should go: and when he is old, he will not depart from it."*

This verse **is** the section's mission. The child-formation goal — good-quality, healthy-thinker, Christ-centered music **plus** the lyrics-as-curriculum layer (§13) — **is training children in The Way so it stays with them** when they are old. The music is the medium; *training a child in The Way* is the work. Per the Word-first principle ([[project_non_denominational_word_first_body_undivided]]: Scripture senior to tradition), this verse is the **explicit, stated foundation** of the section — printed in the section's mission copy, not just implied. It is the heart, held alongside promoting those promoting Yahweh (§16).

**Declared by Darrell 2026-06-23:** the section exists to *"impact our impressionable children with good quality, healthy-thinker music"* and to *"help PROMOTE those promoting Yahweh."* These are **two first-class design goals** flowing from Proverbs 22:6 — not entertainment-with-extras. Every curation and design choice serves one or both.

### 15.1 Goal 1 — positively FORM impressionable children (quality + healthy thinking)

The section is **formative, not just a player.** On top of the profanity-free gate (§12.1) and the Christ-centered-first identity (§12.2), curation applies a **quality + healthy-thinking criterion** — what shapes a young mind *well*:

**Curation rubric (prioritize for featuring/sorting; the twins are 10):**
- **Substance** — the song says something true and worth absorbing (not empty repetition).
- **Edifying / hope-oriented** — builds up; models healthy identity, resilience, and emotion in Christ (Phil 4:8 — the Test: true, lovely, commendable, excellent).
- **Christ-centered formation** — points to Yahweh; theologically sound (checked against the Worldview spine).
- **Age-fit** — singable, comprehensible, and shaping for a 10-year-old; deeper cuts ride higher age bands.
- **Healthy patterns** — does not glorify harm, despair, or contempt *even when profanity-free*; a clean-but-cynical song is deprioritized, not featured.

This rubric **ranks featured/surfaced content**; it does not hard-exclude (only profanity does). It is the "good quality, healthy-thinker" filter Darrell named, sitting above the gate.

### 15.2 Goal 2 — PROMOTE those promoting Yahweh

The section actively **uplifts the Kingdom artists** — see the artist-promotion layer (§16). Visibility is a gift the section gives the artists, shared across the field, not hoarded on a few.

### 15.3 How the educational layer serves child formation

The lyrics-as-curriculum layer (§13) is **explicitly FOR forming impressionable children's thinking** — healthy, faith-grounded:
- **Scripture refs** turn a song into time in the Word (a 10-year-old reads Isaiah 26:3 because "Stayed On Him" sent them there).
- **Themes + theology** name the healthy idea the song carries, so it's absorbed *consciously*.
- **Vocabulary** grows a child's faith-language at their level (kid-definitions).
- **Discussion questions** let a parent/teacher shape the takeaway (what/when/why/how — ANXIETY-CLARITY).
- **Age-pitched** via `learn-framework` age bands — the same song forms a 10-year-old and a teen differently.

**The formation loop:** *love the song → meet its Scripture → understand its theme → talk it through → carry it.* Music the kids already choose becomes discipleship that shapes how they think.

---

## 16. ARTIST-PROMOTION LAYER — uplift those promoting Yahweh (BINDING)

**Per Darrell: "we want to help PROMOTE those promoting Yahweh."** The section is not just a player — it **drives listeners TO the artists** and shares visibility across the Kingdom field. First-class, not an afterthought.

### 16.1 Promotable artist presence (every artist)

An **artist entity** (not just free-text per track) carries the promotion links:
`{ name, officialYouTube, officialYTMusic, site, socials[], supportLinks[] (store / merch / streaming), bio, featured (bool), promotesYahweh (bool) }`.

On each track card and the artist's profile: **"Follow on their channel," "Visit site," "Support this artist"** affordances → **outbound links** to the artist's own YouTube/YT-Music channel, official site/socials, and where to support them (store/merch/streaming).

### 16.2 Featured rotation (shared visibility)

A **featured-artist spotlight** rotates across Kingdom artists — Darrell's 5 (**Lecrae, Hulvey, Trip Lee, nobigdyl., Jackie Hill Perry**) **plus the wider field** (§1 ranking + his playlists) — so visibility is *shared*, not concentrated. Rotation is **curator-set or simple deterministic** (e.g. by week); any *automated* rotation respects the three brakes (§5.3) and ships inactive — but a static/curated rotation needs none.

### 16.3 No payment processing by us (bright line)

These are **outbound links and visibility only — NOT transactions.** We do **not** build payment processing, take a cut, or hold money; monetization stays **Darrell's hand**. We send listeners to the artist's own support channels; the artist receives directly. (Aligns with DATA-AS-EMPOWERMENT / serve-not-extract.)

### 16.4 Broader app principle (note for the ledger)

*"Promote those promoting Yahweh"* is **a cross-app principle, not just this section.** The same promotable-entity + visibility pattern should extend to **ministries, creators, and churches** elsewhere (a Kingdom directory, content surfaces, COLG-first per COMMUNITY-FIRST-MISSION). Recommend recording it as a Decision Record so it governs future surfaces, with this section as the first instance.

### 16.5 Father's-Business

The section's purpose **is** the Father's Business: **advancing the Kingdom** (forming children in the Word, surfacing Christ-centered art) **and supporting those advancing it** (driving real visibility + support to the artists promoting Yahweh). Serve-not-extract; we create and uplift, we don't skim.

---

## 17. Multi-type library + personal favorites

**Per Darrell:** the section spans **multiple TYPES/genres** and supports **personal FAVORITES** — a multi-type library + a "your music" view, not a single flat list.

### 17.1 Multi-type (genre/type facet — Christ-centered first)

Tracks carry a **type/genre** facet so the library spans the field, Christian-first (§12.2): **Christian Rap / Hip-Hop** (launch emphasis), **Christian R&B**, **Gospel**, **Worship/Praise** (and later Español, Kids). This extends the §11.4 sub-category shelves into a first-class filter:
- **Browse by type** — the TabScroll sub-shelves (§4) are the type filter; "All" + per-type views.
- **`genre`/`type` field** on `worship_tracks` (already in §4/§11.5) drives the shelf a track lands on. His two playlists already populate every type — "Fire" (rap-forward + gospel/worship), "Inspirational" (worship/gospel + Christian R&B).
- Christian types are featured/sorted first (§12.2); secular-clean is never a featured type.

### 17.2 Favorites / "Your Music"

Users **mark/save favorite songs** and get a **Favorites ("Your Music") view**:
- **The ❤️ love reaction IS the favorite signal** (§18) — one action, two jobs: loving a track adds it to the user's "Your Music." (No separate save button to learn; consistent with the reaction primitive.)
- **"Your Music" view** = the user's loved tracks across all types, newest-loved first; device-local + synced per the user scope.
- Favorites are **per-user** (owner-scoped, PIN-optional per [[project_private_locations_pin]]); aggregate "most-loved" is community-scoped (§18.3).
- Favorites/most-loved **feed sorting** (§5) and the feedback loop — a real engagement signal, not a vanity counter.

---

## 18. Shared reaction primitive — ❤️ love + wholesome emojis, EVERY video (BINDING, cross-app)

**Per Darrell: "like love and other emojis" on songs AND "same for all videos."** This is **one shared, reusable reaction control applied uniformly** — not a per-surface fork (shared-primitives/consistency principle, like [[project_tab_overflow_scroll_primitive]]: `TabScroll` lives once in `components/shared.jsx` and is reused).

### 18.1 The component

A new `<Reactions targetType targetId scope />` in **`app/src/components/shared.jsx`** (alongside `TabScroll`). There is **no existing reactions/favorites primitive** in the app (verified) — so this is the single canonical one; every surface imports it, none re-implements it.

- **Reaction set (POSITIVE / edifying / age-appropriate only — kids use this, no negative/harmful reactions):** ❤️ **love**, 🙏 **amen/pray**, 🔥 **fire**, 🙌 **praise**. A small, wholesome, fixed set. No 👎 / angry / sad — by design, per the child-safety posture (§6) and QUALITY-OF-LIFE (system mirrors, never judges).
- **Render:** a compact row of emoji buttons with per-emoji counts; the user's own active reactions highlighted; `aria-label` per button (WCAG); tap toggles.
- **❤️ love doubles as favorite** (§17.2) — loving adds to "Your Music."

### 18.2 Applied UNIFORMLY across every video/song surface

The same control drops onto every media surface (verified video surfaces in the app):

| Surface | File | Apply to |
|---|---|---|
| Worship music tracks | `ChurchWorship.jsx` (new, this spec) | each track card |
| Choir songs | `app/src/components/Choir.jsx` | each `SongRow` |
| The Word / sermons | `app/src/components/Pulpit.jsx` | each message video |
| Song Workshop | `app/src/components/ChoirSongWorkshop.jsx` | each workshop video |
| Church-Live stream / Video Wall | `church-live.js` render + `ChurchVideoWall.jsx` | the live/latest embed |
| Any content/Presenter video | future surfaces | the embed |

**One control everywhere** → consistent UX, one place to maintain, one data path. New video surfaces get reactions for free by importing it.

### 18.3 Data + scope

- **Generic table `media_reactions`** (migration `0042`, after this spec's `0041` worship_tracks): `{ id, target_type ('worship_track'|'choir_song'|'sermon'|'church_live'|'content_video'|…), target_id, user_in_instance, emoji, created_at }`, RLS-scoped, unique `(target_type, target_id, user, emoji)` so toggles are idempotent. Keyed by `(targetType, targetId)` so it spans all surfaces with one schema.
- **Scope = owner / community per the PIN-optional-community-default** sharing model ([[project_private_locations_pin]], [[project_loved_ones_cohort_includes_chosen_family]]): a user's own reactions are theirs; **aggregate counts are community-scoped within the instance** by default; private mode keeps them owner-only.
- **Engagement signal:** counts feed **favorites/most-loved sorting** (§5, §17) and the feedback/Loop-Health engine ([[project_loop_health_self_review]]). 
- **No payments, engagement only** — reactions are visibility/affinity signals, never transactions.

### 18.4 Tiering

Shared primitive + additive table → **Tier B** soak. The cross-app reach (touches every video surface) means a careful preview pass, but it adds no autonomous automation (no brakes needed — it's user-triggered).

---

## 19. Community-driven RADIO stations (reactions → ratings → station ranking)

**Per Darrell:** *"music RADIOS from the most-liked / from the community ratings."* A radio is a **continuous auto-play station ranked by COMMUNITY RATINGS** — the love/emoji reactions + favorites from §18 ARE the rating signal. This closes the loop: **reactions become ratings become the station ranking.**

### 19.1 The stations

| Station | Pool | Rank by |
|---|---|---|
| **Most Loved** (the top/flagship station) | all clean Christian tracks | aggregate community rating, highest first |
| **Christian Rap radio** | `type='rap'` | community rating *within type* |
| **Christian R&B radio** | `type='r&b'` | community rating within type |
| **Gospel radio** | `type='gospel'` | community rating within type |
| **Worship radio** | `type='worship'` | community rating within type |
| **Your Favorites radio** (personal) | the user's ❤️-loved tracks (§17.2) | the user's own (recency/affinity) |

Each station is **continuous**: it auto-advances and the queue **auto-fills from the ranked pool** (when the tail nears, more top-ranked tracks append). The flagship "Most Loved" is the default the section can open into.

### 19.2 How ratings drive the ranking (the loop)

- **Rating signal = the §18 reactions + favorites**, aggregated per track into a **`ratingScore`** — e.g. weighted sum (❤️ love weighted highest since it doubles as favorite; 🙏/🔥/🙌 add positive weight), normalized by reach so a new great track isn't buried. *(Exact weighting is a tunable curation constant, set at build and adjustable.)*
- **Source of truth:** the generic `media_reactions` table (§18.3, migration `0042`) aggregated for `target_type='worship_track'` → a **ranking view** (`worship_track_ratings`, or computed client-side from the realtime reaction stream).
- **Refreshed as ratings come in:** a Supabase **realtime subscription** on reactions (the Choir-sync pattern) re-ranks the pool live; the continuous queue re-fills from the updated order. Ties directly to the **most-loved sorting (§5/§17)** and the **feedback / Loop-Health engine** ([[project_loop_health_self_review]]) — one signal, many surfaces.
- **No autonomous automation:** playback + re-ranking are **user-initiated and client-side** (a station only runs while someone is listening). No timer-driven server compute → the three-brakes rule (§5.3) does not apply here.

### 19.3 The filters still govern everything a radio plays (BINDING)

A radio is a **prominent, featured surface**, so the policy applies in full to every track it can play:
- **Profanity-free only** (§12.1) — the gate; excluded tracks (Kendrick) can never enter a radio pool.
- **Christ-centered first** (§12.2) — radios play `contentClass='christian'` **only**; `secular-clean` (e.g. The Marías) is *never* eligible for any radio, since radios are a featured surface and secular-clean is "never featured." It stays browsable in the library, but no radio plays it.
- **Vetted + clean** (§6) — only `vetted=true` tracks play; child-safe by construction.
- **Quality/healthy rubric (§15.1)** influences rank as a curation weight, so radios lean toward the substantive/edifying even within "most-loved."

### 19.4 Promote those promoting Yahweh (§16) on the radio

The **now-playing** view credits the artist and carries the **promotion affordances** (§16): channel / site / "support this artist" outbound links. A continuous station is continuous *exposure* for Kingdom artists — radio is one of the strongest promotion surfaces. No payments; visibility only.

### 19.5 Playback (honest technical note — Verification Doctrine)

Continuous auto-advance across YouTube/YT-Music embeds needs the **YouTube IFrame Player API** (free, no API key; load `https://www.youtube.com/iframe_api`, listen for the `ENDED` state, load the next ranked `videoId`). This is a step beyond the static `<iframe>` embed used elsewhere (§2) — flag it as the one new technical piece the radio needs; everything else reuses existing primitives. Per-video embedding still uses `youtubeEmbedUrl`; the player API just sequences them.

### 19.6 Tiering

Derived stations over existing data (reactions/ratings) + a client-side continuous player → **Tier B** soak. Additive; user-initiated; no autonomous automation.

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
- [BibleGateway — Proverbs 22:6 (ESV)](https://www.biblegateway.com/passage/?search=Proverbs+22%3A6&version=ESV) — verified verse text for the §15.0 scriptural foundation (ESV primary, KJV secondary per SCRIPTURE-REFERENCE-STANDARD)
- [YouTube Music — about / web player (music.youtube.com)](https://music.youtube.com/) — Darrell's listening service; tracks are YouTube-backed (shared video IDs)
- [Google Takeout — export your data (YouTube/YouTube Music)](https://takeout.google.com/) — the no-credential CSV ingestion path (§11.2b)
- §11 seed-video IDs resolved via bulk official-upload web search (Reach/Gotee/Tribl/Maverick City/artist channels), 2026-06-23 — candidate IDs, curator-verified at build (§6)
- Darrell's inputs (2026-06-23): featured artists (Lecrae, Hulvey, Trip Lee, nobigdyl., Jackie Hill Perry); "Fire" playlist `https://music.youtube.com/playlist?list=PL-5ghB0zx80GcMXpdSBDt-JwDowJsWSNt` (likely private — seeded from screenshot transcription, not URL render)
