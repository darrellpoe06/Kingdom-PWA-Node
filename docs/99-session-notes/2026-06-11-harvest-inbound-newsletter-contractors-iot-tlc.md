# 2026-06-11 — The harvest batch: Inbound/phone, newsletter, contractor workspace, IoT sensors, TLC intake, local-AI trigger

Source: Darrell, rapid-fire batch. Each item organized per the 90%-doctrine:
name the existing workflows that do 90%, the missing hop, the timeline, the
constraints. Nothing fabricated; gates stated plainly.

## 1. The Inbound tab — what it does, does it work, and the cellphone plan

**What it does today (app side, working):** Inbound polls a backend every
5 minutes for voicemails left on the business lines (Twilio number →
voicemail → transcription → Cloudflare Worker → the app). Each voicemail
shows caller + transcript, and converts in ONE TAP to: a work order
(incident → the dispatch loop → text a 1099 worker), a Practice inquiry, or
a Project — then marks itself handled. The clinical TLC line is deliberately
NOT routed here (HIPAA bright line).

**Does the phone side work right now?** The app side is built and the
conversion loop is verified (it feeds the same dispatch pipeline tested this
session). The TELEPHONY side needs the Twilio decision Darrell paused on
("create an account?"): a Twilio number + the voicemail/transcription hook +
the worker URL/token entered in the app's Inbound setup. Until that's
decided, Inbound shows its setup state. (Check first whether a Twilio
account already exists under another email before creating one.)

**"Add my cellphone and it answers when I don't":** YES — that's standard
carrier conditional call forwarding. Keep the personal number; dial the
carrier's forward-when-unanswered code pointing at the Twilio number. Missed
calls → Twilio answers with the greeting → records + transcribes → lands in
Inbound → one-tap becomes a work order or inquiry. Setup once; no human
after. (Carrier codes vary — e.g. GSM *004*<number># class; confirm with
his carrier during the Twilio session.)

**"Everything evaluated and processed appropriately":** today the
evaluation is the human one-tap (deliberate — no auto-actions). The natural
90%-wire: run each transcript through the SAME One Voice classifier
(lib/one-voice-routing.js, shipped tonight) to PRE-SUGGEST the route
(work/counseling/prayer/poetech), person confirms. Small build; rides
tonight's router. Queued with the Twilio session.

## 2. Church newsletter automation — "highly disciplined strategic"

90% exists: wf32 already composes a daily "what shipped" summary on a
schedule; the church data lives in-app (conference, schedule, RSVPs,
serving, prayer counts (shared-with-church only), One Voice pastor notes,
livestream links); wf14/16-class Gmail plumbing can send. The build: a
weekly newsletter composer workflow that drafts from THIS data (never
fabricates), holds for BISHOP'S ONE-TAP APPROVE (the COLG risk-tiered gate
already ratified in project_colg_stream_to_marketing_pipeline — auto for
logistics, approve-gate for theological content), then sends/posts.
Constraints: review gate is non-negotiable for doctrine; no engagement-
optimization dark patterns (DATA-AS-EMPOWERMENT); recipients are an opt-in
list the church owns. Target: with the feedback-AI lane (2026-07-01+).

## 3. Contractor workspace — the handyman with 20 consistent clients

The thesis is strong: PoeTech already runs the LANDLORD side of dispatch;
the same rails inverted serve the WORKER side. 90% exists: contractors_1099
(cloud, live), the dispatch loop (work orders → text the job), scopes
(agreement templates incl. the Property Contractor template), per-property
records, conversation logs, the occupancy/portfolio math, 1099 YTD
tracking. Missing hops: (a) a contractor-facing workspace view — MY jobs
(today/this week), MY clients (the 20), MY scopes + invoices owed; (b) the
invoices + time_logs tables from the v2.4 schema file were NEVER APPLIED to
the live cloud DB (P13 verified: only contractors_1099 was created, by
v2.13) — apply a live-aligned slice when this builds; (c) client list =
reuse entities/renters pattern per contractor. This is also the 1099-
advertising + ratings tier-product (workers who advertise accept ratings).
Target: design 2026-07; pairs with hardware-advisory + ratings.

## 4. IoT sensors — cigar-lounge exhaust + user-owned device autonomy

Direct answer to "which option" for the smoke-triggered exhaust fan:
**the sovereign DIY stack** — laser particulate sensor (Sensirion SPS30
class) + ESP32 publishing MQTT → the family NAS as the hub (n8n or Home
Assistant container in the existing stack) → automation rule (rolling PM2.5
threshold + hysteresis + minimum on-time) → Shelly-class smart relay on the
fan. Opportunities: zero cloud dependency (sensor data stays on the NAS =
the data-autonomy module Darrell described), the exemplar for "modules
added to peripheral devices," and the pattern generalizes to every
user-owned IoT device feeding protective insights through PoeTech.
Constraints (non-negotiable): mains wiring on the fan relay = licensed
electrician (a dispatch-loop job for the 1099 bench!); code-required
smoke/fire detectors stay INDEPENDENT of this automation, never replaced by
it; failsafe = controller loss must not kill required ventilation; IL
ventilation/health codes for lounges verified before install; calibration +
threshold tuning on real data for a few days before trusting triggers.
Rides the gated IoT/Wyze module (research-first, Tier C) — this becomes its
first concrete exemplar. Parts list + automation code: produced when the
module's research step opens (on the board).

## 5. TLC therapist intake through the app — closest fruit of all

90%+ exists AS OF TONIGHT: the One Voice counseling route already creates a
Practice inquiry (contact-level), inquiries sync cross-device, the Practice
tab runs the intake statuses (new → attempting-contact → contacted →
scheduled-intake), and the PHI line is already engineered: once scheduled,
PHI lives in Acuity — never in the app; and per the brand-surface memory,
Hostinger (tlctherapysolutions.com host) gets NO PHI ever. Missing hops:
(a) per-therapist assignment on inquiries (clinician_assignments table
exists in the v2.3 schema file — verify live per P13 before wiring);
(b) a client-facing intake link/QR per therapist that opens straight into
the counseling intake; (c) routing/notification to the right 1099
therapist. Target: 2026-06-24 window — genuinely short, the rails are live.

## 6. "Local AI triggers the vendor AI so projects continue when you're back online"

This EXISTS as pipeline and is fed as of tonight: Tell-PoeTech directives →
wf26 thought-inbox (VERIFIED landing in poetech-briefing/inbox) → wf27
"Foundation Agent (autonomous inbox processor + Claude trigger)" is the
local-AI side that starts vendor-AI (Claude) sessions from that inbox.
The honest gate: wf27's AUTONOMOUS triggering is exactly what ran away on
2026-06-06 (the manual-shutdown incident) — so per the three-brakes binding
rule it operates only with budget + concurrency lock + kill-switch, shipped
inactive, activated supervised. Directives QUEUE safely while offline
either way — nothing is lost between sessions (the inbox is the handoff).
Recommendation: harden wf27's brakes as its own supervised session, like
wf21 tonight.

## Banking lane status (same session)
Gmail reconnect VERIFIED working (wf16's 15:00Z failure moved past OAuth to
a missing-folder defect — /data/chatin/_reconciled — which was created and
ownership-fixed). wf16's next hourly run is the full-green proof; wf21
active at 6h cadence. Remaining human steps: statement-emails on at banks.
