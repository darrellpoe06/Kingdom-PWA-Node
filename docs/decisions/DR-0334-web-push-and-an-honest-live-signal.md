---
id: DR-0334
title: Web Push, and a live signal we can stand behind — the phone was never notified because nothing was ever built
date: 2026-09-06
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [colg, poetech]
grounds: [VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, EXECUTION-OUTCOME-OBSERVABILITY, COMMUNITY-FIRST-MISSION, LEGAL-PRIVACY-BOUNDARY, SOVEREIGN-FIRST, LESSONS-LEARNED]
source: 2026-09-06 — Darrell: "My phone didn't notify me of the livestream inside the Love Corner App... why not... fix that so users are prompted the sermon is live... and also to notifications from users who text us... asap.... comprehensive understanding of the workflows and implementation of the process we need..."
---

## Context — the traced answer to "why not"

The question had a blunt answer, and it was not a bug. **Nothing was ever built.**
Traced end-to-end before a line was written:

| Capability | State before this change |
|---|---|
| `push` handler in `app/public/sw.js` | **Absent.** Four listeners existed — install, activate, message, fetch. |
| `notificationclick` handler | **Absent.** |
| `pushManager.subscribe` anywhere | **Absent.** |
| VAPID key, in any form | **Absent** — comments and docs only. |
| `push_subscriptions` table | **Absent** across every schema and all 150+ migrations. |
| A sender (Pages Function / NAS / n8n / edge fn) | **Absent.** No `web-push`, no FCM, no APNs, no OneSignal. |
| Real YouTube live detection | **Absent.** |

Every notification the app could raise was a **foreground** `new Notification()`
requiring the tab to still be open (`app/src/lib/dm-notify.js:66`,
`app/src/poe-financial-mvp-v28.jsx:2262`). So a phone with the app closed could
not be notified of anything, ever.

The repository had already said so about itself. The 2026-07-27 messaging review
records *"No web push (P3 unbuilt): sw.js has zero push handlers; no
`push_subscriptions`, no VAPID. Delivery is realtime-while-open only — the
single biggest 'intuitive' gap,"* and DR-0231 §P3 lists it as staged work. It
stayed staged until a person in the congregation missed a service.

**And there was a second, quieter gap.** Even with push built, there was nothing
to push *on*. `app/src/lib/church-live.js:132` computes `live` from a hardcoded
weekly schedule window — Sunday 11:00, Wednesday 13:00 and 18:00, minus 20 and
plus 210 minutes — and never asks whether a stream actually started. The file
says so in its own header: *"We cannot truthfully detect live state on the
client... painting our own 'LIVE' badge would be a fabricated state
(Reality-Trace P15)."* That honesty was correct and is preserved.

## Decision

**Build Web Push end to end, and trigger it only on a live signal we can stand
behind.**

### 1. The live signal is DECLARED, never inferred

`church_live_state` (migration 0170) holds one row per church, and `is_live` is
true only because **someone with authority said so** — a director pressing Go
Live, or the NAS go-live pipeline. `source` records which, so any surface can
answer *"how do we know?"* — the question a painted badge cannot answer.

**The schedule window stays exactly what it was: a UI hint, and never a
notification trigger.** Announcing a service at 11:00 on a Sunday the stream
never started is a fabricated state delivered into someone's pocket, which is
worse than silence. `validateSendRequest` refuses a `live` send without a
confirmed transition, and that refusal is asserted in the suite.

### 2. Authorization is proven BY THE DATABASE, not re-implemented

For a `live` send the function first writes `church_live_state` **using the
caller's own JWT**. That table's RLS already restricts writes to the church
roster. If the write succeeds the caller was authorized — by the same policy
every other surface obeys; if RLS rejects it, so do we. The service key is used
only afterwards, for the two things a user genuinely cannot do: read other
people's subscription rows and write the send ledger.

A function-side copy of the roster rule would drift from the real one, and a
drifted authorization check is how someone eventually buzzes a congregation they
do not belong to.

### 3. Payloads are encrypted to the subscriber; the vendor is a dumb pipe

`webpush-crypto.js` implements RFC 8291 (`aes128gcm`) and RFC 8292 (VAPID) on
`crypto.subtle` alone — no `web-push` npm dependency, which is Node-only and
would not run in the Pages Function that actually sends. Google, Mozilla and
Apple relay a blob none of them can read.

### 4. A message notification names the sender and NEVER the message

Direct messages are end-to-end encrypted (`dm-encryption.js`). A push renders on
a **lock screen, in public**. Putting plaintext there would quietly undo the
encryption for the last three feet and make a prayer request readable over
someone's shoulder on a bus. The push says **who**; the app says **what**.

### 5. The brakes (CLAUDE.md 2026-06-08), fitted to what this actually is

This is **event-driven, not timer-driven** — nothing fires on a clock, so it is
not the runaway class that rule was written for. It still carries the brakes
that matter when a system buzzes people:

- **BUDGET** — `MAX_DEVICES_PER_SEND = 2000`, a payload ceiling, and a title/body
  cap. Hitting the cap is **reported**, never a silent truncation.
- **LOCK** — a `UNIQUE` `dedupe_key` insert. A double-tapped Go Live button or a
  retried webhook returns `deduped` having sent **nothing**. `fanOut` throws
  without a dedupe key, so the lock cannot be skipped by forgetting a field.
- **STOP** — per-device, per-topic **opt-in**; absence of consent is the default.
  `disablePush` tears down the browser subscription **even when the database
  delete fails** — being unable to stop a notification you consented to is not a
  guarantee, it is a trap.

## Verification (DR-0076)

**140 new tests**, all green, plus the full suite at **845 files / 12,228
passed / 1 skipped**, lint clean, real build clean.

**Real defects this work produced, caught by its own gates, and now standing
assertions:**

1. **A phishing primitive I wrote myself.** The first draft accepted any `url`
   beginning `/`. `//evil.example/steal` begins with `/` and is
   protocol-relative — a notification tap would have opened any site while
   wearing the church's icon. The test caught it; the fix rejects a second
   character of `/` or `\`, and both forms are asserted.
2. **A replay that would have silently reverted the overlay.** Migration 0170
   redefines `apply_viewer_readonly_overlay()`; the `viewer-readonly`
   rls-isolation leg re-applies 0125, which defines it too. `migration-replay-order`
   caught that a replay would revert 0170. Fixed by listing 0170 in that leg.
3. **The tenancy guard** refused the migration until the overlay was re-run
   (DR-0060/DR-0241), which is exactly its job.

**The end-to-end cryptographic check**: the body the sender puts on the wire is
decrypted back to the exact plaintext using only the subscriber's private key
and auth secret — the operation a real browser performs. Wrong auth secret,
wrong subscriber, and a single flipped bit of salt or ciphertext each **fail**
rather than returning garbage.

### What is NOT proven, stated plainly

- **Interoperability with a real push service is UNVERIFIED.** RFC 8291 §5
  publishes a worked example with an expected ciphertext, and asserting against
  it is the strongest available check. This suite does not: `www.rfc-editor.org`
  is blocked by the sandbox's egress proxy, and writing the vector from memory is
  the fabrication DR-0076 forbids. A round trip proves self-consistency, not
  conformance — a wrong HKDF info string would still round-trip here and still
  fail on a device. The info strings are pinned as literal constants to guard
  that, **and the claim only closes when a real phone receives a real
  notification.** `re-review: 2026-09-13`.
- **Not yet wired, and therefore not yet working for anyone:** the subscribe
  control on a real surface, the Go Live control in Pulpit, the DM insert →
  push call, and the VAPID keys in the Cloudflare environment. The plumbing is
  built and tested; **the feature is not live until those land and a phone
  buzzes.** Recorded here rather than implied by a green suite.

## Consequences

- A closed phone can be reached, for the first time.
- "Did the notification go out?" has a measured answer — `push_sends` records
  device count, successes, failures and prunes per send.
- Dead subscriptions are pruned on 404/410, so the success rate keeps meaning
  something instead of dragging a growing tail.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and optionally
  `PUSH_SEND_TOKEN` must exist in the Pages environment. Absent them the sender
  answers **`not-configured` (503)** rather than failing — the difference between
  "nobody set this up" and "it broke" is exactly what kept the original gap
  invisible.

## Grounds

DR-0076 (verify; measure, do not claim; proven-to-catch), DR-0060 + DR-0241
(tenancy and the viewer overlay), DR-0231 (P3 web push, per-member opt-in, and
the SMS-bridge non-goal this respects), Reality-Trace P15 (a surface is a live
view of real state), LEGAL-PRIVACY-BOUNDARY (the lock-screen decision),
COMMUNITY-FIRST-MISSION (the congregation is who this is for).
