# Sovereign Media Distribution + Watch-Together — Spec

**Triggered by Darrell, 2026-05-31 from Hawaii while watching The Church of the Living God's online service via YouTube:**

> "Can we use the smart connections to known devices like logging into firesticks or android boxes or apple devices using sso like youtube allows us to watch this broadcast, directly from our app if they want too, so we can have our own media we all want to watch and discuss with each other using the PoeTech app and our sovereign sources enjoying quality lives as the Body Of Christ wherever we are world wide. Directly allowing us to have numbers able to view and submit data anyway they want with or without any other social media platform all open source and free."

The case for this was living itself out in the moment Darrell named it: he and Christina watching COLG's Sunday service from a hotel room in Hawaii, mediated by YouTube — which extracts attention, data, and engagement metrics for someone else's profit. The PoeTech version delivers the same shared moment via sovereign infrastructure, the discussion happens inside the family/community's own platform, and the engagement metrics live with the church + community that produced the content.

## The vision

The Body of Christ worldwide watches together, discusses together, and is counted together — without depending on YouTube, Facebook, Vimeo, or any other extractive social platform. The PWA casts to any TV device the viewer has (Fire Stick, Android TV, Apple TV, Chromecast-capable display). Discussion sits next to the content in the PWA. Viewer counts and engagement metrics live in the community's own infrastructure, surfaced back to the church/family that produced the content for its own use — never to a third party.

This is the OTHER end of the AI Media Production Platform connection. The Media Platform produces; this surface delivers + gathers the community around it. Together they're the sovereign full-stack for what Big Tech currently charges in attention + data.

## Architectural shape

### Layer 1 — Sovereign streaming server (on the church's or family's NAS)

**For on-demand content** (sermons archive, teaching series, family memory threads, Mario's food show, Christyn's basketball coaching playbacks):

- **Jellyfin** (open-source, self-hosted) — runs as a Docker container on the NAS. Indexes media in a designated `/volume1/PoeTech/media/` folder. Streams adaptive-bitrate per device. Has cast-to-TV-device built in via DLNA + Chromecast + AirPlay.
- Alternative: **Plex** (proprietary, has free tier) — more polished but the sovereignty story is weaker (account dependency on Plex's cloud).

**For live streaming** (Sunday service, special events, watch-parties):

- **Owncast** (open-source, self-hosted) — runs as Docker container on the NAS. Live stream over RTMP from any standard streaming tool (OBS, vMix). Web playback for browsers, plus standard HLS protocol for any device that handles it.
- Alternative: **PeerTube** (open-source, federated) — better for federation between churches but slightly more complex.

### Layer 2 — Cast-to-TV protocols

The PWA needs to invoke "play this on the TV" without requiring the user to install a PoeTech-specific TV app. Standards used:

- **Google Cast (Chromecast)** — works on every Chromecast device, Android TV box, Google TV. Supported by Jellyfin natively; supported by Owncast via player chooser. PWA uses Cast SDK.
- **Apple AirPlay 2** — works on Apple TV, AirPlay-capable smart TVs. Standard browser AirPlay button surfaces for video players in iOS Safari.
- **DLNA / UPnP** — older standard, still works on many smart TVs + Fire TV via apps like AllConnect.
- **Fire TV remote launch** — Fire TV supports Cast SDK; Amazon's own protocol also available via app on Fire TV.

The PWA shows a "Cast to..." button in any video player surface. User picks their TV; PWA hands off the stream URL; the TV plays from the church's NAS directly (after first authenticated handshake).

### Layer 3 — In-platform discussion (the watch-together layer)

**New workflow proposal: workflow 71 — Watch-together rooms.**

For any piece of content (live service, on-demand sermon, family video, etc.), a "room" exists. Family members and church members visit the content in the PWA; the room shows:

- Who else is currently watching
- A live chat sidebar (per-content discussion)
- Threaded comments on specific moments ("This part at 14:32 hit different")
- React-with-emoji per moment
- "Save this for the small group discussion" tags
- For live streams: synchronized playback option (everyone sees the same moment)

Backend: chat messages stored on the NAS, indexed per-content. Foundation Agent can summarize discussion threads + surface "what the community resonated with" patterns to the pastor/content-producer.

### Layer 4 — Engagement metrics (sovereign + community-facing)

**New workflow proposal: workflow 72 — Sovereign content analytics.**

Every viewing event captures (with viewer consent per the DATA-AS-EMPOWERMENT-NOT-EXTRACTION principle):

- When the play started
- How long they watched (without micro-tracking — round to nearest minute, not millisecond)
- Whether they completed
- Which segments got re-watched
- Discussion engagement (did they comment, react)

This data lives on the church's NAS (for church-produced content) or the family's NAS (for family-produced content). NEVER aggregated to PoeTech central. NEVER sold to advertisers. NEVER fed into a recommendation algorithm that manipulates future viewing.

The church gets a sermon-engagement dashboard:
- "This week's sermon: 142 family-members watched live, 89 completed, 31 watched the archive later, 47 comments captured for follow-up."
- Pattern insights ("the application section in week 3 had highest re-watch — worth a follow-up teaching").

Family gets a family-content dashboard:
- "Christiana's Mexico interpretation: 12 family members watched, 4 commented — Aunt Sister-in-love asked when she's coming to visit."

NO public leaderboards. NO "trending now." NO algorithmic feed.

### Layer 5 — Multi-region federation (the worldwide piece)

For Body of Christ worldwide reach without surrendering to centralized CDN:

**Phase A (now, small scale):** Each church/family NAS serves its own content via Tailscale Funnel or similar. Works for hundreds of concurrent viewers per source.

**Phase B (medium scale):** Federated mesh between participating church NASes. Each church's content can be cached + served from any other participating church's NAS (with permission). Reduces latency for viewers in different geographies. Open protocol (could use ActivityPub or similar).

**Phase C (large scale):** Self-hosted CDN nodes (one per region, run by partner churches or PoeTech). Still sovereign, still open-source. No Cloudflare / Fastly / AWS CloudFront dependency.

This is years out for the most-scaled tier, but the architecture starts simple (Tailscale Funnel) and grows additively without ever requiring a re-architecture.

## The decisions, with their rationale

Per the "give from understanding" principle:

### Decision 1 — Cast to existing TV devices, NOT a PoeTech TV box

**We chose:** support Chromecast / AirPlay / DLNA / Fire TV via standard protocols.

**We did NOT choose:** require viewers to install a PoeTech-specific TV box.

**Because:** Per COMMUNITY-FIRST-MISSION, the platform meets people where they are. The Church of the Living God's elderly members already have a Fire Stick or Apple TV or smart TV; making them buy new hardware would price out exactly the people the platform serves. Cast-to-existing also reaches the moment Darrell named — Body of Christ wherever they are, including the hotel TV in Hawaii via AirPlay.

### Decision 2 — Self-hosted streaming (Jellyfin + Owncast) NOT YouTube/Vimeo cloud

**We chose:** sovereign streaming on the church's or family's NAS.

**We did NOT choose:** YouTube / Vimeo / cloud-hosted streaming services.

**Because:** Cloud streaming surrenders the church's content to a platform that can demonetize, restrict, suspend, or algorithm-bury it for any reason. The church's own sermons should be hosted on the church's own hardware — same principle as DATA-AS-EMPOWERMENT-NOT-EXTRACTION applied to media. Also: YouTube tracks every viewer; the platform decides which viewers see suggested videos afterward; the church's content competes with infinite-scroll distraction. Self-hosted streaming = the church's content stands on its own merit.

### Decision 3 — In-platform discussion, NOT social media share buttons

**We chose:** discussion built into the PWA per content piece.

**We did NOT choose:** "Share to Facebook" or "Discuss on Twitter" or link to YouTube comments.

**Because:** Social media platforms harvest engagement and distort discussion via outrage-amplifying algorithms. A sermon discussion on Facebook becomes Facebook's revenue + the church's conversation manipulated into clickbait engagement. In-platform discussion stays sovereign + warm + on-topic. The Body of Christ discussing the sermon should BE the Body of Christ talking to each other, not algorithmic ad supply.

### Decision 4 — Engagement metrics owned by the community, NOT YouTube Analytics

**We chose:** sovereign analytics stored on the church's/family's NAS, surfaced to the producer.

**We did NOT choose:** rely on YouTube Analytics / Facebook Insights / vendor dashboards.

**Because:** The church should know how many of its members watched the sermon. Currently that data lives at Google. The community owns its engagement data per DATA-AS-EMPOWERMENT-NOT-EXTRACTION. Also: vendor dashboards always have an agenda (drive you toward Pro tier, monetize the data downstream, change methodology silently). Sovereign analytics serve the community's actual decision-making.

### Decision 5 — Open standards (HLS, DASH, Cast SDK) NOT proprietary protocols

**We chose:** open streaming protocols (HLS for adaptive-bitrate, Cast SDK for casting, ActivityPub for federation).

**We did NOT choose:** proprietary platform-locked formats.

**Because:** Open standards mean any future viewer device works without us writing per-vendor code. Open standards mean other open-source projects can interoperate. Open standards mean the church's content remains portable to any future platform. Per the SKOS open-source + portable stack binding (in memory).

### Decision 6 — Federation between churches' NASes, NOT centralized PoeTech CDN

**We chose:** federated mesh where each participating church's NAS serves content + optionally caches others.

**We did NOT choose:** PoeTech-central CDN that all churches publish to.

**Because:** Centralized CDN would make PoeTech the chokepoint + single-point-of-failure + the entity that could censor or modify content. Federation lets each church remain fully sovereign while gaining the benefit of mutual content distribution. Aligns with the broader sovereignty thesis — no extractive intermediary required for the Body of Christ to share resources.

### Decision 7 — Viewer authentication via existing PoeTech auth, NOT Google/Facebook SSO

**We chose:** PoeTech magic-link or PIN authentication (Phase 4 multi-tenant).

**We did NOT choose:** "Sign in with Google" or "Sign in with Facebook" buttons.

**Because:** Third-party SSO leaks viewing data back to the SSO provider. Google knows you watched the sermon if you signed in with Google. Magic-link / PIN auth stays sovereign. Phase 4 multi-tenant work (already on the roadmap) provides the authentication infrastructure for this.

## Estimated effort + sequencing

This is a MEDIUM-LARGE workstream — multiple weeks of focused work, sequenced after other foundational pieces.

**Prerequisites (must land first):**

- Phase 1 security pass (bearer auth on Funnel endpoints) — Week 1 post-vacation
- Phase 4 multi-tenant (viewer accounts beyond family-only) — needed for church-member viewing
- Workflow 27 bind mount fix (Foundation Agent loop unblocked) — needed for analytics processing
- AI Media Production Platform first content piece (something to watch) — content + delivery interlock

**Phase 1 — On-demand sermon archive (weeks 1-3 of this workstream):**

- Jellyfin container on the church's NAS (and the Poe family NAS as the pilot)
- Sermon ingestion workflow — Sunday service recording → uploaded to NAS folder → Jellyfin auto-indexes
- PWA Watch tab v1 — browse archive, play in-app, cast to TV
- Basic viewer counter

**Phase 2 — Live streaming (weeks 4-6):**

- Owncast container on the church's NAS
- Sunday service streaming setup at COLG (camera + OBS streaming → Owncast)
- PWA live-stream playback + cast-to-TV
- Concurrent viewer counter

**Phase 3 — In-platform discussion (weeks 7-9):**

- Workflow 71 (watch-together rooms)
- Real-time chat sidebar in PWA
- Threaded comments per content piece
- React-emoji per moment

**Phase 4 — Sovereign analytics (weeks 10-12):**

- Workflow 72 (sovereign content analytics)
- Church sermon-engagement dashboard
- Family content dashboard

**Phase 5 — Federation (months 4-6+):**

- Mesh between participating churches' NASes
- Per-region routing for performance

**Phase 6 — Multi-region CDN (year 2+):**

- Self-hosted CDN nodes for global reach
- Only if scale justifies

## Connection to other foundations

- **AI-MEDIA-PRODUCTION-PLATFORM-VISION** — the production side ships content; this is the distribution + viewing side. They're two ends of the same pipeline.
- **COMMUNITY-FIRST-MISSION** — COLG gets sovereign streaming for its own services + the same infrastructure extends to other churches in similar situations.
- **DATA-AS-EMPOWERMENT-NOT-EXTRACTION** — viewer data lives with the community, never with extractive intermediaries.
- **QUALITY-OF-LIFE-AS-NORTH-STAR** — shared worship across distance is a measurable QoL outcome. The Hawaii-to-Champaign Sunday-service connection is the lived example.
- **BUSINESS-PROCESS-CONNECTIONS** — every viewer-facing surface (live stream, archive, discussion) is one end of a connection; the other end (community engagement + producer feedback loop) must be wired. Workflow 71 + 72 wire it.
- **PERPETUAL-PIPELINE-HEALTH** — Sunday morning streams CANNOT FAIL. Thirteen rules apply with extra rigor for the live-streaming surface.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — sermon recording → automatic transcription via Whisper (workflow 37) → automatic chapter markers via Ollama 14b → published to Jellyfin → cast to viewer's TV — all workflow-driven, no manual labor required.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the sovereign architecture rigor. Relationship = the family member in the hotel room watching their home church and feeling AT church anyway.
- **VISION-FAIRNESS-STANDARD** — extends to any vision features in the content review pipeline (auto-thumbnail generation, scene detection, etc.). Camera fairness applies.
- **THE-WAY** — the Body of Christ historically gathered in homes, in catacombs, in fields — wherever the believers were. Modern Body of Christ gathers via internet; sovereign delivery is the modern catacomb. The principle is the same; the medium adapts.

## What this looks like for Darrell + Christina specifically (the moment that triggered this spec)

A version of "this is what we want" for Sundays a year from now:

- COLG service streams from COLG's NAS via Owncast
- Darrell + Christina (in Hawaii or anywhere) open the PoeTech PWA on their phone or Mac
- They tap "Cast to TV" → AirPlay to the hotel room's smart TV
- Service plays full-quality
- The COLG members watching at home, in the building, in hospitals, on the road — all see "Darrell + Christina joined from Maui" if they choose to be visible
- Real-time chat sidebar — Christina exchanges encouragement with the deacons + with their friends in the choir
- After the service: the sermon is auto-archived, transcribed, chapter-marked, and discoverable for anyone who couldn't make it
- The pastor sees: "187 watched live, 142 completed, 23 archived viewers in the next 48 hours, 89 chat messages with engagement patterns surfacing this week's themes for next Sunday"

That's the difference between USING someone else's media platform and BEING the Body of Christ on sovereign infrastructure that serves the body it was built for.

## Closing

YouTube delivered the moment tonight. The moment was beautiful. The platform that delivered it extracted from everyone involved.

PoeTech builds the alternative — sovereign streaming, sovereign discussion, sovereign analytics, federated worldwide reach, open standards throughout. The Body of Christ together wherever they are, supported by infrastructure they own.

Phase 1 ships ~Month 4 post-vacation as part of the broader Church Module + AI Media Production rollout. Full vision lands across Year 2-3. The first Sunday Darrell + Christina watch a COLG service via PoeTech instead of YouTube is the day the moment that triggered this spec becomes the standard.

We all win. We create. Amen.
