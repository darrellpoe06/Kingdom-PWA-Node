# SOVEREIGN-COMMS-AND-MEETINGS.md — 1:1 messaging, report-to-security, and our own OBS-based meetings

**Added 2026-07-12. Declared by Darrell**, expanding the bus-ministry work.
Layer 3 foundation (reference). This is the source of truth for how PoeTech does
person-to-person communication and video meetings — sovereignly, on our own
stack, grounded in Yahweh's perspective.

> "Let no corrupt communication proceed out of your mouth, but that which is good
> to the use of edifying, that it may minister grace unto the hearers." —
> Ephesians 4:29 (KJV). Communication on this platform exists to edify; the rules
> below are so that "all things be done decently and in order" (1 Corinthians
> 14:40), and so we "count the cost… whether he have sufficient to finish it"
> (Luke 14:28) before we spend the environment on a meeting.

---

## 1. Darrell's declaration (the source)

> "we also need users to be able to only speak to each other individually in the
> choir and the whole app or in a Zoom or Teams meeting with rules for not
> overloading the environment however we want good content and context from
> Yahweh's perspectives."

And, on how private messaging and meetings should work:

> "[leaders can DM anyone] and the rosters can DM rosters so an usher can tell
> security to come here, and anyone can report to security who has access to the
> Observation tab with all camera feeds in the building including the broadcast."

> "We want our own OBS-based Zoom/Teams version for PoeTech."

Two decisions fall out of this: **the messaging access model** (built now), and
**the meeting engine** (sovereign, OBS-based — scheduling shell built now, the
real-time engine is the Tier-C target).

---

## 2. Direct messages — the access model (built: 0096)

1:1 messaging where **only the two participants ever read a message** (RLS:
`auth.uid()` in {sender, recipient}). Who may *start* a DM is decided server-side
by `users_can_dm(instance, other)`:

- **A leader (owner/admin of a shared instance) may DM anyone in it**, and anyone
  may DM a leader (report up).
- **A roster member may DM another roster member in the same instance** —
  roster↔roster. "On a roster" = a row in any ministry roster (`bus_drivers`,
  `choir_members`, `security_team`; extended as rosters are added). This is the
  "an usher tells security 'come here'" lane.
- **Conservative for minors by construction:** a minor is not an owner/admin and
  is not on an operational roster, so a minor can only be reached by a leader
  initiating — messaging is never opened peer-to-peer to minors. True guardian-
  scoped minor messaging is a follow-up (hooks into the guardian model; noted,
  not fabricated — DR-0076 / DATA-AS-EMPOWERMENT minor protections).

**Report to security:** any instance member files a `security_reports` row; the
security team (owner/admin OR a `security_team` roster row) reads and triages it
(new → acknowledged → resolved). The security team is, by design, the group that
also holds **Observation-tab access to the building camera feeds + the
broadcast** — so a report raised here reaches the people who can *see* the room.

The pure threading/shape logic is in `lib/direct-messages.js` (unit-tested); the
I/O in `lib/direct-messages-sync.js`; the reusable surfaces are
`components/DirectMessages.jsx` (1:1, reusable across choir/bus/app) and
`components/SecurityPanel.jsx` (report + triage).

**Follow-up (re-review 2026-08-15):** render the `security_reports` feed *inside*
the Observation tab so the camera-feed holders see reports beside the feeds.

---

## 3. Meetings — our own OBS-based engine (scheduling built: 0097; engine = Tier C)

Darrell asked for **our own** Zoom/Teams — sovereign, on our broadcast stack, not
an external integration. This is consistent with the whole platform's spine
(DATA-AS-EMPOWERMENT, sovereign infrastructure, AI-MEDIA-PRODUCTION-PLATFORM).

### What is built now (real, tested, usable)

The **scheduling + guardrail record** (`ministry_meetings`) and the **load
rules** (`lib/ministry-meetings.js`, unit-tested and proven-to-catch). A leader
picks a **room**, schedules a meeting (title, time, duration, participant cap,
provider, optional join link), and the load rules gate it **before** it can be
created.

**Two meeting rooms (declared by Darrell 2026-07-12), sized to the real on-site
stack (see §3.5):**

- **Main meeting space** — for **admin staff + monthly meetings**, up to **50
  people**. It is **exclusive** (a 50-person sovereign video meeting takes the
  whole stack, so nothing else may overlap it) and **admin-only to book** (RLS in
  `0098` enforces this, not just the UI).
- **Ministry meeting** — a working meeting for a ministry (bus sync, choir), up
  to **25** (12 typical); several can run within the concurrency cap.

The load rules are the **three brakes** (CLAUDE.md: Autonomous Automation Requires
Three Brakes) applied to meetings so the environment can't be overloaded:

- **Budget** — participant cap = the **room's** cap (main 50 / ministry 25),
  duration cap (≤ 180 min), max concurrent *ministry* meetings per instance (≤ 3).
- **Concurrency lock** — one meeting per ministry at a time; the main room is
  exclusive against everything.
- **Guardrail** — scheduling required (a real future start time; no unbounded
  ad-hoc meeting).

Raising any cap is a decision (DR-0075), not a silent tweak. The provider field
already includes `poetech-obs` as the first-class default; `zoom`/`teams`/`other`
are accepted as a pasted-link fallback until the engine lands.

### 3.5 Opportunities & constraints — grounded in the real stack (Ari + Claude)

The infrastructure project Ari & Claude are researching is the sovereign compute
stack: the **on-site Synology NAS** (`192.168.1.26`, LAN/Tailscale-only — it
already hosts the workflows + local models) and the planned **5× RTX 3090 rig**
(ChurchInfraPlan; 24 GB/card). The caps are grounded in that hardware, not
aspiration:

**Opportunities**
- **Sovereign by default.** A NAS/rig-hosted meeting means the admin staff's
  monthly meeting never leaves the building's control — no Zoom account, no
  third-party recording of church business (DATA-AS-EMPOWERMENT, COMMUNITY-FIRST).
- **The broadcast stack is already there.** OBS + NDI + the video wall + the GPU
  rig are the exact primitives a 50-person room needs; the meeting engine extends
  the broadcast investment, it doesn't start a new one (AI-MEDIA-PRODUCTION).
- **The rig makes 50 realistic.** Multi-GPU transcode/compositing on the 3090 rig
  is what lets one room carry the whole admin staff at once.

**Constraints (honest — DR-0100)**
- **One uplink.** A 50-person meeting saturates the sovereign uplink, so the main
  room is **exclusive** — a hardware fact encoded as a rule, not a preference.
  Bigger-than-50, or main-plus-ministry concurrent, is a **cloud/hybrid** question,
  not something the on-site box should promise.
- **NAS-first, rig-pending.** Until the 3090 rig is stood up, the NAS alone bounds
  real concurrent video; the ≤ 3 ministry-meeting cap reflects the conservative
  present. Caps rise **with measured capacity** (DR-0076), not before.
- **LAN/Tailscale reach.** The sovereign path is reachable in-building and over
  Tailscale; a public 50-person meeting is a separate networking decision (Funnel
  throttles cross-origin — the n8n same-origin memory).

### What is the Tier-C target (NOT built — do not paint it)

The **real-time OBS-based video engine** — self-hosted media routing on our
broadcast stack (OBS + the existing NDI/video-wall/broadcast infrastructure),
producing a PoeTech join surface instead of a Zoom/Teams link. This is real-time
infrastructure that cannot be stood up and verified in the cloud sandbox, and a
painted "join call" button on a surface whose value is trust would violate the
reality-trace rule (DR-0061). It is a **Tier-C architecture item** (new
architecture + real-time infra; RELEASE-TIERS) with these known building blocks:

- The broadcast stack already present: `ChurchVideoWall`, `NdiProgramOutput`,
  `LiveWorshipBar`, `lib/broadcast-class.js`, the NAS/GPU rig (ChurchInfraPlan).
- WebRTC/SFU routing bounded by the *same* load rules already built here (the
  scheduling shell is deliberately the front door the engine plugs into).
- The Observation/broadcast tie-in (§2) so a meeting can pull a camera/broadcast
  feed under the sovereignty and VISION-FAIRNESS gates.

**Re-review 2026-09-01** — revisit once the GPU rig + broadcast routing are ready
to host a first internal meeting *with someone watching* (never self-activated
unattended — three brakes, DR-0068).

---

## 4. Grounding — good content and context from Yahweh's perspective

Every comms surface carries the Word, not as decoration but as the standard the
communication is held to:

- **Group + direct messages:** Ephesians 4:29 (edifying speech), Colossians 4:6
  ("let your speech be alway with grace, seasoned with salt"), Matthew 18:15 (1:1
  is the Word's own pattern for going to a brother).
- **Meetings + load rules:** Luke 14:28 (count the cost), 1 Corinthians 14:40
  (decently and in order).

All verses are KJV-verbatim from the in-repo Bible data (verified, not from
memory — DR-0076 / SCRIPTURE-REFERENCE-STANDARD). Recorded as **DR-0181**
(messaging model) and **DR-0182** (sovereign OBS meetings + load rules).
