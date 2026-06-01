# COLG Per-Unit Documentation + Historical Knowledge Access — Spec

**Triggered by Darrell, 2026-05-31, after the church meeting in Maui with himself, Christina, and Bishop Gwin:**

> "We need to have documentation for the different units of the church. They need to be able to access historical information from the different units of church per BG Christina and myself in our after church meeting."

**Governor-level decision.** Bishop Gwin + Christina + Darrell aligned on this in their post-service meeting. It is added to the Church Module roadmap as a NEAR-TERM priority. The Church Module session note (`2026-05-29-colg-per-church-module-spec.md` if it exists, or the COMMUNITY-FIRST-MISSION foundation) gets this added as Tier-3 ministry-coordination capability accelerated.

## The need

The Church of the Living God operates through many ministry units (Deacons, Choir, Trustees, Sunday School, Youth Ministry, AV/Media, Hospitality, Outreach, etc. — exact list to be defined by Bishop Gwin + Christina). Each unit:

- Holds meetings, makes decisions, runs events, manages resources
- Generates documentation: meeting minutes, event plans, budgets, training materials, member rosters, historical records
- Has leadership transitions over time — the next deacon, the next choir director, the next ministry lead inherits the role + the responsibility
- Currently runs on a mix of tribal knowledge + scattered documents + people's individual memories + paper files

**The gap:** when a leadership transition happens, the institutional memory of the unit doesn't reliably transfer. A new ministry leader inherits responsibility without inheriting the historical context that informed prior decisions. New members can't easily learn what their unit has done, when, why, or what worked. Cross-unit coordination suffers when units can't see each other's relevant history.

**The desired state:** every unit has a documented history, searchable + accessible by its members, with leadership able to see across units they oversee. Knowledge compounds across decades + transitions rather than evaporating with each personnel change.

## Architectural shape

### Layer 1 — Per-unit document repository (on the church's sovereign infrastructure)

Each ministry unit gets a dedicated folder on the church's NAS (COLG's own NAS, post the Church Module Phase 1 NAS-at-church setup). Folder structure:

```
/volume1/COLG/units/
  /deacons/
    /meetings/
    /decisions/
    /members/
    /training/
    /historical-archive/
  /choir/
    /meetings/
    /rehearsal-notes/
    /repertoire/
    /events/
    /historical-archive/
  /trustees/
    /meetings/
    /financial-history/
    /property/
    /decisions/
  /sunday-school/
    /curriculum/
    /quarterly-plans/
    /teacher-resources/
  /youth-ministry/
    ...etc
```

Each folder structure is consistent enough to allow cross-unit search + reporting, but flexible per unit's actual practices.

### Layer 2 — Access control per unit

Members are assigned to one or more units via the Church Module's member directory (per workflow 54 spec). Access rules:

- **Unit member** can read all docs in their unit's folder + contribute new docs
- **Unit leader** can read + write + manage permissions within their unit
- **Cross-unit leadership** (Bishop Gwin, executive board) can read across all units
- **Cross-unit coordination** (e.g., Choir leadership needs to see Trustees' financial decisions affecting choir budget) granted per-unit-pair
- **Sensitive documents** (counseling notes, pastoral care, financial details affecting individuals) have tighter restrictions per unit's confidentiality norms

Synology Drive's permission system handles this natively. Each unit folder gets its own permission group; members get added to their unit groups via the Church Module's authentication system (post-Phase 4 multi-tenant).

### Layer 3 — Search + browse interface

**New workflow proposal: workflow 78 — Per-unit knowledge search.**

The Church Module PWA gets a Ministry Units tab. Each member sees:

- "Your units" — the units they belong to
- Per-unit dashboard — recent docs, upcoming meetings, action items
- Search within unit — natural-language search across all unit docs ("when did we last buy choir robes" → returns relevant past docs with dates + context)
- Search across permitted units (for cross-unit leadership)
- Document upload — drag-and-drop, mobile camera scan (for paper documents), voice memo (Whisper-transcribed)

Backed by nomic-embed-text indexing (per the responsiveness session note RAG architecture). Every document indexed; semantic search returns top-K relevant chunks per query.

### Layer 4 — Historical archive ingest

**New workflow proposal: workflow 79 — Historical document ingest.**

Many units have YEARS of paper documents, old digital files, scanned records. This workflow:

1. Member uploads a batch of historical documents (PDFs, scanned images, Word docs, old emails)
2. OCR runs on scanned images (Tesseract on NAS, sovereign)
3. Documents categorized by date + unit + topic (Ollama 14b assistance)
4. Indexed into the searchable corpus
5. Original files preserved (the OCR + index is supplementary, not replacement)

Lets units bring their historical archive INTO the system over time, not all at once. Each unit ingests at its own pace per its priorities.

### Layer 5 — Meeting documentation workflow

**New workflow proposal: workflow 80 — Meeting documentation.**

For unit meetings going forward:

1. Pre-meeting: agenda template, prior-meeting notes surfaced, action-items-from-last-time
2. During meeting: voice recording (Whisper-transcribed), notes typed live, action items captured
3. Post-meeting: auto-generated meeting minutes draft, sent to attendees for review, finalized into the unit archive
4. Decisions tagged: who decided what, what was the rationale (per the "decisions with rationale" principle)

Over time, every meeting becomes a searchable record. "What did the Trustees decide about the parking lot in 2023?" returns the meeting notes with full context.

### Layer 6 — Cross-unit reporting

For Bishop Gwin + executive leadership:

- Quarterly summary: what each unit has done, what's pending, where attention is needed
- Decision audit: cross-unit decisions surfaced + tracked
- Resource conflicts: e.g., when two units want the fellowship hall on the same Saturday — surfaced for resolution

Foundation Agent (Ollama 14b) generates these summaries on cron from the unit-archive corpus.

## Privacy + safety constraints

Per COMMUNITY-FIRST-MISSION + DATA-AS-EMPOWERMENT-NOT-EXTRACTION + IDENTITY-ROLES-AUDIT:

1. **All documentation stays on COLG's sovereign infrastructure.** Never cloud-hosted. Never exposed externally.
2. **Per-unit access controlled.** Members see only their units' docs (plus cross-unit they're explicitly granted).
3. **Sensitive content protected.** Pastoral care notes, counseling records, individual financial information get tighter access controls — typically pastor + designated officers only.
4. **Audit log on every access.** Per IDENTITY-ROLES-AUDIT foundation. Who read what, when, from where. Surfaces inappropriate access patterns.
5. **No AI analysis without explicit unit consent.** Workflow 79's classification + workflow 80's transcription + cross-unit reporting all require the unit's leader to opt in for that unit specifically.
6. **Exportable always.** Each unit can export its full archive at any time. If COLG ever changes platforms, the units' historical knowledge leaves with them.
7. **Minor protections.** Youth Ministry documentation involving minors has additional access restrictions + parental visibility per COMMUNITY-FIRST-MISSION Commitment 7.
8. **Deletion deliberate, not casual.** Documents can be archived (hidden from default view) but full deletion requires unit leader + cross-unit leadership approval. Historical knowledge shouldn't be casually erasable.

## Accessibility per COMMUNITY-FIRST-MISSION Commitment 2

The elderly support staff at COLG need this to be USABLE. Specifically:

- **Large fonts default**
- **Voice input** for adding meeting notes or search queries
- **Mobile camera scan** for paper documents (don't make them dig out a scanner)
- **Simple flat hierarchy** — no nested-menus-of-doom
- **Forgiving** — easy undo, no surprise modal states, drafts auto-save
- **Trained UP-front** — when this rolls out, in-person training session with each unit's members, plus recorded video tutorials they can rewatch
- **Tech-comfortable family members + youth become the unit-trainers** — Christian's apprenticeship pattern applies here too; he + Christiana + young COLG members teach the older members + each other

## Sequencing

This depends on Church Module foundational work. Honest timeline:

**Prerequisite (must land first):**

- Phase 1 security pass (post-vacation Week 1)
- Phase 4 multi-tenant + workflow 21 (member authentication) — Months 2-4 post-vacation
- COLG's own NAS acquired + set up (probably Q3 2026 — Governor decision pending)

**Per-unit documentation MVP (post-prerequisites, ~6 weeks of focused work):**

- Week 1-2: workflow 78 (search interface) + unit folder structure on COLG NAS + permission groups
- Week 3: workflow 79 (historical document ingest with OCR)
- Week 4: workflow 80 (meeting documentation v1)
- Week 5: PWA Ministry Units tab
- Week 6: training + rollout to first 2-3 pilot units (probably Deacons + Trustees + AV/Media since Darrell knows AV well)

**Months following MVP:**

- Roll out to additional units one at a time (paced per each unit's readiness)
- Historical archive ingest pace per unit's priorities
- Cross-unit reporting once 5+ units are actively using the system
- Foundation Agent quarterly summary generation

Realistic timeline from post-vacation kickoff to "all major COLG units actively using their documentation": 6-9 months.

## The decisions, with their rationale

Per "give from understanding" principle:

### Decision 1 — Build on Synology Drive + Church Module rather than external SaaS (Notion, SharePoint, Google Workspace)

**We chose:** sovereign infrastructure (Synology Drive on COLG's NAS, Church Module PWA, local Ollama for AI assistance).

**We did NOT choose:** Notion / SharePoint / Google Workspace / Confluence / Microsoft 365.

**Because:** Per DATA-AS-EMPOWERMENT-NOT-EXTRACTION + COMMUNITY-FIRST-MISSION, the church's institutional knowledge should live with the church. External SaaS creates ongoing cost (typically $10-25/user/month at small-team scale → $1-3K/month for the full congregation) + lock-in risk + dependency on a vendor that can change policy + access concerns. Sovereign infrastructure is one-time capex (NAS already partially planned) + perpetual ownership. Also: Synology Drive is already a familiar interface for many — easier rollout than learning Notion from scratch.

### Decision 2 — Per-unit folders rather than one shared knowledge base

**We chose:** structured per-unit folder hierarchy with unit-specific access control.

**We did NOT choose:** one big shared wiki accessible to everyone.

**Because:** Different units have different sensitivity (counseling notes vs choir rehearsal notes vs trustees' financial decisions vs Sunday school curriculum). One-shared-pool either overshares (privacy violations) or undershares (defensive lock-down of everything). Per-unit access matches how units actually operate + how leadership actually delegates. Cross-unit access granted intentionally where coordination is needed.

### Decision 3 — Voice input + mobile camera scan as first-class inputs

**We chose:** Whisper transcription + camera OCR as standard data-entry paths.

**We did NOT choose:** keyboard typing as the only way to add information.

**Because:** COMMUNITY-FIRST-MISSION Commitment 2 is binding. Elderly staff don't want to type long meeting notes; voice memo + transcription is FASTER + LESS ERROR-PRONE + more accessible. Paper documents (old meeting minutes, scanned receipts, handwritten notes) should be added via phone camera, not by hunting for a scanner. The technology meets people where they are; meeting people where they are IS the mission.

### Decision 4 — Historical archive ingest happens at each unit's pace, not all at once

**We chose:** workflow 79 (per-unit historical ingest) runs whenever a unit's leader decides to add historical content.

**We did NOT choose:** front-load a massive "digitize everything" project at MVP.

**Because:** Asking every unit to bring all their historical records on day 1 would (a) overwhelm the units, (b) defer the MVP indefinitely, (c) prioritize completeness over usefulness. Better: ship a working system that each unit ADOPTS at its own pace + brings its history in as they're ready. After 6-12 months of use, the archive is rich. After 5 years, it's the institutional memory.

### Decision 5 — Foundation Agent does cross-unit reporting; humans don't have to ask for it

**We chose:** automatic quarterly summaries surfaced to executive leadership.

**We did NOT choose:** make Bishop Gwin manually request reports from each unit.

**Because:** AI-FOUNDATION-INTERNAL-OPERATIONS — anything that's a click today should be a workflow tomorrow. Bishop Gwin's time is for ministry, not for chasing units for status updates. The system auto-surfaces; he reviews what surfaces; he focuses on what matters.

### Decision 6 — Decisions captured with rationale (per the broader principle)

**We chose:** workflow 80 (meeting documentation) explicitly captures the WHY behind each decision, not just the WHAT.

**We did NOT choose:** classic meeting-minutes-as-list-of-decisions.

**Because:** Per [[feedback-decisions-with-rationale]] — future stewards inheriting the unit's history need the WHY to make analogous decisions. "We decided to repaint the fellowship hall taupe and not gray because the choir robes were getting lost against the gray." Tiny example; huge for institutional memory.

## Specific units COLG may have (NOT EXHAUSTIVE — Bishop Gwin + Christina define the real list)

Common ministry units in an African American Non-Denominational church of COLG's size + history (78 years, 44,000 sqft):

- Pastoral / Ministerial Staff
- Deacons / Deaconesses
- Trustees / Finance Committee
- Choir / Music Ministry (Christina = Choir Director per memory)
- Praise & Worship Team
- AV / Media / Streaming Ministry (Darrell does AV per memory)
- Sunday School / Christian Education
- Children's Church
- Youth Ministry
- Young Adults / College Ministry (UIUC connection significant)
- Hospitality / Greeters / Ushers
- Outreach / Evangelism
- Missions
- Women's Ministry
- Men's Ministry
- Marriage Ministry
- Singles Ministry
- Health Ministry
- Transportation Ministry
- Building & Grounds / Maintenance
- Prayer Ministry / Intercessory Prayer
- Special Events Committee
- Building Fund Committee
- 77th National Assembly (per the website)
- E-MEG Christian Center (per the website)

The exact list + structure to be defined by Bishop Gwin + Christina + Darrell. The system supports whatever they name; doesn't impose a template.

## Connection to other foundations

- **COMMUNITY-FIRST-MISSION** — COLG-first. Accessibility default. Train-the-community. Family-and-community voices on design.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — workflows handle the operational layer; staff sees only the relevant surfaces.
- **DATA-AS-EMPOWERMENT-NOT-EXTRACTION** — the church owns its history. Never leaks. Never aggregated for external benefit.
- **VISION-FAIRNESS-STANDARD** — OCR of historical documents must work equally well on documents from all era + paper qualities (extends to "document fairness" as a discipline).
- **IDENTITY-ROLES-AUDIT** — every access logged. Per-unit access controlled. Existing foundation framework applies.
- **PERPETUAL-PIPELINE-HEALTH** — unit documentation can't disappear because a container restarted. Bind mounts + backups + thirteen-rule resilience applies fully.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the access control + audit trail + indexing rigor. Relationship = the elderly deacon comfortably finding the 1987 meeting minutes she half-remembers.
- **THE-WAY** — institutional memory is institutional discipleship. The faith handed down depends on the records kept.
- **BUSINESS-PROCESS-CONNECTIONS** — each unit's documentation surface is one end of a connection; the other end (the workflows + training + ongoing usage) must be wired before the surface ships.
- **QUALITY-OF-LIFE-AS-NORTH-STAR** — unit leaders + members spending less time chasing tribal knowledge IS a QoL improvement. The mission is served.

## What I need from BG + Christina + you (no rush)

For when you have a window post-vacation:

1. **List of COLG's actual ministry units** — the real list (not my guess above)
2. **Per-unit leadership structure** — who leads each unit, who reports to whom
3. **Sensitivity tiers per unit** — which units handle highly confidential content (pastoral care, counseling, individual financial matters) vs which are more open
4. **Pilot units for MVP rollout** — which 2-3 units would be the most-receptive + highest-value to start with (suggestion: Deacons + Trustees + AV/Media, but Bishop Gwin's call)
5. **Bishop Gwin's preferences for cross-unit reporting** — what summaries does he actually want surfaced to him, and how often
6. **Current state of unit documentation** — what already exists in physical files, in members' personal Google Drives, in old church website backups, etc. (helps scope the historical ingest work)

If Christina is willing to capture these answers in the @nas chat or a simple Word doc over the next week, the post-vacation Church Module build kicks off with the right specifics.

## Closing

The Church of the Living God has 78 years of institutional knowledge. Right now most of it lives in members' memories, in physical files, in scattered personal devices. Within a year of post-vacation work, that knowledge can live in COLG's own sovereign infrastructure — searchable, durable, transferable across leadership generations, accessible by the units who need it.

The Bishop + Christina + Darrell named this in the after-church meeting in Maui. The decision is captured. The work is sequenced. The path is honest.

We all win. We create. Amen.
