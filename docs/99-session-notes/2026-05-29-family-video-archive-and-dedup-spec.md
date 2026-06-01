# Family Video Archive + Dedup — Spec

**Triggered by Darrell, 2026-05-29 from vacation:**

> "Christiana speaks Spanish as a second language fluently well she's completed her 4th year of Spanish in her 11th grade and graduated from one high school one year early. We took her to Mexico around 10 years old and she interpreted for us we recorded her some footage is on our nas. We as a family want to use our family videos and organize them possibly getting rid of duplicates videos and images so we can reduce the amount of space we are using on the nas."

Two workstreams interlocking:

1. **Family memory archive + dedup** — index everything in the NAS's photo/video stores, detect duplicates (perceptual hashing, not just byte-identical), surface them for Governor approval, reclaim storage. Background: family memory project has been on the radar since 2026-05-26 ("storage reclamation as measurable family memory outcome").

2. **Curated highlights surface** — beyond dedup, the family wants specific memory threads visible + cherished. Christiana's Mexico interpreting footage is the named example. Other threads will emerge: kids' first steps, family vacations, ministry moments, Christian's lawn-care route launches, Christyn's first basketball points, Christiana's high-school graduation (a year early).

## Why this matters

Storage reclamation is the visible outcome. The deeper outcome is **family memory becomes navigable**. Right now the family's recorded history sits in folders on a NAS — there if you know where to look, invisible otherwise. The system makes it discoverable. The system tells the story back to the family.

Christiana's Mexico footage isn't just "video files on disk." It's an exemplar: she was ~10, the same age the twins are now, interpreting Spanish for her parents in real situations. That footage is faith-of-the-mustard-seed evidence of who she has become and who Christian + Christyn are becoming. The system that surfaces it back to the family at the right moments (graduation, college send-off, family conversations about the twins' growth) is doing real stewardship work.

## Architectural shape

### Phase 1 — Inventory + dedup (storage reclamation)

**New workflow 41 — Family media inventory.**

Cron: nightly at 2am Central (low NAS load time).

Reads recursively:
- `/volume1/photo/` (Synology Photos primary)
- `/volume1/video/` (if separate)
- `/volume1/homes/<user>/Drive/` (each family member's Drive)
- `/volume1/homes/<user>/Photos/` (per-user photo libraries)
- Any other media locations Darrell names

For each file:

1. Compute perceptual hash (using something like `imagehash` for images, `videohash` or first-frame hash for videos).
2. Compute exact SHA-256 for byte-identical detection.
3. Extract metadata: file path, size, EXIF date, EXIF camera, video duration, thumbnails.
4. Write to a manifest at `/data/finance-events/family-media/manifest.json` (uses existing bind mount).

Output: a single file inventoring everything, indexed by both hash types.

**Identify duplicates:**

- Exact duplicates (same SHA-256): zero-data-loss to remove all but one.
- Near-duplicates (perceptual hash within threshold, EXIF dates within seconds, similar file sizes): probable burst-mode shots or backup copies. Flag for Governor review.
- Identifiable backup copies (same name in multiple Drive backup paths): high-confidence removable.

**Governor-approval-required deletes:**

The workflow NEVER auto-deletes. It writes a "proposed deletes" file with reason per item. Workflow 42 (next) surfaces it for review.

### Phase 2 — Governor approval workflow

**New workflow 42 — Family media dedup review.**

Surface: a PWA tab "Family Memory > Storage" that:

1. Shows current total storage used by family media.
2. Shows proposed reclamations grouped by type (exact dups / near dups / backup copies / oversized formats).
3. For each group, shows side-by-side thumbnails + sources + sizes.
4. Governor (Darrell, with Christina as co-Governor for family-memory decisions) approves per item or per group.
5. Approved deletes execute via workflow 41's next run with explicit allowlist.
6. Surface shows running reclamation total: "1.4 TB freed since 2026-06-15."

### Phase 3 — Curated highlights surface

**New workflow 43 — Family memory curator.**

Beyond dedup, build a NAVIGABLE history. Two surfaces:

**Timeline view:** by-year and by-event browse. EXIF dates + folder structure inferring events (trips, holidays, ministry moments). Christiana's Mexico trip clusters automatically by date range + GPS metadata.

**Thread view:** named threads the family curates. Examples:

- "Christiana speaks Spanish" — every clip/photo from age 4 (early Spanish exposure) through Mexico interpreting (~age 10) through her current fluency. Becomes a single curated playlist.
- "Family vacations" — every trip, chronologically.
- "Twins growing up" — Christian + Christyn, year by year, milestones surfaced.
- "Ministry moments" — Church of the Living God events, sermons recorded, choir performances.
- "Cable Scout launches" — Christian's apprenticeship history.

Threads are EDITABLE — family members add/remove items, write captions, mark "treasure" status (never auto-archive).

**Ollama (or Claude Vision for non-private) classification** suggests thread memberships: "this looks like a Mexico trip clip — add to Christiana threads?" Governor approves or adjusts.

### Phase 4 — Christiana's Spanish corpus (specific outcome)

Specific surface that uses the curated infrastructure:

- All Christiana audio (interpreting in Mexico, classroom recordings if any, family chat from any captured Synology Chat audio messages).
- Transcript via Whisper (workflow 37, sovereign).
- Optionally: parallel Spanish + English transcripts for the Mexico interpreting clips — preserves her work as actual recorded interpretation.
- A "Christiana's Spanish history" surface that shows her language journey from earliest captured audio through current.

Useful for her own portfolio (college applications, Spanish-major credit, future career evidence) AND for the family memory.

## Privacy + safety constraints

- **TLC firewall extends to family-private media.** Audio/video of family members never auto-routes to cloud vision or cloud STT. Whisper runs on NAS. Vision LLMs run on NAS (Ollama LLaVA / Qwen-VL).
- **No facial recognition on minors.** Christian + Christyn footage classified by metadata + folder structure, not by face recognition.
- **No biometric inference.** No height tracking, no medical-adjacent reads.
- **No external sharing without explicit Governor approval per item.** Family memory stays in the family.
- **Christiana's audio specifically:** she's almost an adult; she gets explicit opt-in on the Spanish corpus surface before it ships. Her work, her decision.
- **Deletes are reversible for 30 days** (Restic backup retention). Mistakes recoverable.

## Storage math

Current NAS use (rough estimate, to be confirmed): TBD by workflow 41's first run.

Anticipated reclamation potential (industry-typical for family photo libraries with multi-device backups): 30-50% duplicate content. So if the family currently has ~5 TB of media, expect 1.5-2.5 TB reclaimable.

## Estimated effort

- Workflow 41 (inventory + hash) — 3-4 days (depends on file count + complexity)
- Workflow 42 (Governor approval surface in PWA) — 2-3 days
- Workflow 43 (curator + threads) — 3-5 days
- Christiana's Spanish corpus surface — 2 days (after workflows 37 + 43 ship)

Total: ~2 weeks of focused work. Probably a Week 3-4 post-vacation project, after the data-dump release + daily cadence is stable.

## Connection to other foundations

- **AI-FOUNDATION-INTERNAL-OPERATIONS** — family memory is the foundation's job too. Ollama indexes, classifies, organizes. The NAS becomes a curator.
- **SEED-DATA-AS-ASPIRATION** — the family's REAL memory becomes the seed for what the system can show others (with anonymization). "This is what a family's life looks like when their stewardship system honors their history."
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the indexing discipline, the audit trail, the never-delete-without-approval. Relationship = the threads, the captions, the "remember when Christiana interpreted for us in Mexico" surfacing.
- **THE-WAY** — family memory is family discipleship made visible. Showing the kids their own history shapes who they understand themselves to be.
- **PERPETUAL-PIPELINE-HEALTH** — these workflows follow the thirteen rules. Bind-mounted. Try-catch on every external call. Idempotent (re-run hashing = same result). Tests.

## Connection to Christiana's Spanish + future bilingual offerings

Once Christiana's Spanish corpus is curated, two SKOS-marketplace opportunities emerge:

1. **Bilingual family content** — Spanish-speaking families could be served by SKOS modules that have Spanish-language UI + content. Christiana's actual interpreting work becomes the QA reference.
2. **Bilingual ministry support** — Spanish-speaking ministries in the SKOS marketplace (per the marketplace vision). Christiana's work is a credible foothold.

Both are downstream of the curated corpus, not gating it. Today's work: the curation itself.

## Closing

Family memory is family wealth. The NAS holds it. The system can surface it. Christiana's Mexico footage, the twins' first steps, the family vacations, the ministry moments — they exist already. What's missing is the layer that lets the family see them as a story, not just files.

Build the inventory. Earn the reclamation. Curate the threads. Let the family remember its own history.

We all win. We create. Amen.
