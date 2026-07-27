# Messaging — Comprehensive Review (process + capabilities, opportunities + constraints)

**Date:** 2026-07-27 · **Directive:** Darrell (with live screenshots of `?view=message`): "Comprehensive review of the messaging process and capabilities of the PoeTech App... opportunities and constraints... we want it to be intuitive and grow it iterative and robustness is important with this one... Ways and documentation and strategies for implementation and development efficiency so not bloated with effective communication Frameworks and algorithms that are scalable perpetually."

**Method:** DR-0219 spec-conformance (SHOULD from Ways/docs → ARE from the real code, `file:line` receipts → GAPS → CLOSE with dates). Closes DR-0231's past-due `re-review: 2026-07-26`.

---

## SHOULD — the documented intent

- **DR-0231** (2026-07-23): every role's group chat lives IN-APP, no phone numbers anywhere; contact info in-app and remembered. Phases: P1 group threads · P2 member contact cards · P3 web push · P4 roster-by-roster migration. SMS bridge = non-goal (sovereignty).
- **DR-0181** (2026-07-12): 1:1 DMs roster↔roster + leader lanes; only the two participants read a DM; conservative-by-construction for minors; report-to-security.
- **SOVEREIGN-COMMS-AND-MEETINGS.md**: the person-to-person comms foundation (access model, scripture anchors — Ephesians 4:29 / Matthew 18:15 / Colossians 4:6).
- **IN-APP-MESSAGING-LAYER-1-DESIGN.md** (2026-05-26): an older, richer `conversations/conversation_members/messages` schema — **never implemented**; the shipped model is the flat pair. Disposition `deferred-next-cycle`.
- **CONVERSATIONAL-SPACE-ARCHITECTURE.md**: governs the separate PUBLIC many-to-many discussion room (skeleton; deliberately post-vacation). Not the DM/group rail.

## ARE — what is actually built (receipts)

**Strong, and lean.** Client ≈ 952 lines total (Messages.jsx 190 · DirectMessages.jsx 176 · direct-messages.js 128 · direct-messages-sync.js 242 · group-messages.js 67 · dm-encryption.js 149) + ≈ 401 SQL lines (0096/0117/0118). A registered feature surface behind the module boundary (surfaces.js:65), three-line monolith footprint. **Not bloated — this is the baseline to protect.**

- **1:1 DMs LIVE + E2E-encrypted** (device-held ECDH P-256 → AES-256-GCM, `e2e:v1` envelope; honest plaintext fallback + `· encrypted` marker; 6 proven tests). RLS: only sender/recipient read; `users_can_dm` = leader→anyone, anyone→leader, roster↔roster; recipient-only read receipts.
- **Group threads LIVE** (P1 shipped #1035/#1057): `group_messages` with `user_in_group` RLS on both SELECT and INSERT; **append-only by construction** (no UPDATE policy); realtime.
- **Report-to-security LIVE** (0096, triage new→acknowledged→resolved).
- Adjacent stores: `family_messages` (dormant-complete, awaiting UI), `business-messages` (separate lane), synology-chat import.
- Tests: pure-logic suites for shapes, threading, unread math, encryption symmetry/tamper, group split + error mapping. **No render/integration test for Messages.jsx or DirectMessages.jsx.**

## GAPS — every divergence, named plainly

1. **Owner sees "No one to message yet" (the screenshot defect).** `list_dm_contacts` (0118:59-92) legitimately returns nothing for a solo owner: invited-but-unclaimed people (post-DR-0187 no bare-email grant) are invisible until `claim_invite`; paper-roster members without accounts (`user_id` null) are filtered; branch 1 excludes self. Real cause = no `instance_members` rows yet — but the surface reads as "messaging is broken." **Fix: show invited/roster people as visible-but-pending states, not an empty world.**
2. **Two instance resolvers inside one surface (robustness defect).** Groups render against `getInstanceId()` (family/business default, 0119) while the rosters authorizing choir/bus/security are CHURCH-instance tables; `sendDirectMessage` stamps every DM with `churchInstanceId()` regardless of which instance surfaced the contact → `send-blocked` / `{skipped:'no-instance'}` mismatches. `loadDmContacts` drops the `instance_id` the RPC returns, so the send path cannot know the right one. **Fix: one resolver per contact — carry `instance_id` through the contact object into the send.**
3. **Deep-link fragility:** `?view=message` (singular — the URL in the Governor's own screenshots) is not in the `VALID` allowlist (monolith :1026) and silently falls back to overview. **Fix: alias singular→plural.**
4. **No web push (P3 unbuilt):** sw.js has zero push handlers; no `push_subscriptions`, no VAPID. Delivery is realtime-while-open only — the single biggest "intuitive" gap.
5. **No global unread badge:** `unreadDmCount` is built + tested and has **zero call sites**; groups have no read-state column, so group unread is impossible today.
6. **Scale cliff in the sync pattern:** every DM change triggers a **full refetch of every row** (no limit, no filter, no debounce, no reconnect resync) and re-decrypt; groups fetch newest-200 with no cursor/"load older." Fine at family scale; wrong shape for congregation scale.
7. **P2 member contact cards unbuilt** (zero matches for `member_contacts`).
8. **Group E2EE** tracked follow-up (multi-party sender-keys); RLS privacy is the honest interim and the surface says so truthfully.
9. **DM key portability:** device-bound private key; a new phone renders old history as `LOCKED_PLACEHOLDER` (honest limit, documented).
10. **Three overlapping designs** exist on paper (shipped flat pair · dormant family_messages · unimplemented Layer-1 conversations schema). Left unreconciled, this is the bloat vector.
11. No render tests for the two components (the empty-roster defect would have been caught by one).

## OPPORTUNITIES

- Push (P3) multiplies the value of everything already built — reach without numbers, the covenant of DR-0231 completed.
- The roster system already models the org: generalizing `user_in_group` to a membership view makes ANY future roster a thread with ~0 new code (scalable perpetually by predicate, not by table).
- Unread badge is nearly free (function already written + tested) and is the #1 intuitiveness win.
- Contact cards (P2) + "invited/pending" DM states turn the empty-roster confusion into an onboarding funnel.
- The lean flat model **is** the efficient framework — the Layer-1 conversations schema should be formally retired-in-place (superseded by practice) so no one builds the heavy parallel spine later.

## CONSTRAINTS (stated plainly)

- Until P3: delivery only while the app is open. iOS push requires installed PWA + iOS 16.4+.
- E2EE vs multi-device is a real tension: sovereignty says device-held keys; convenience wants escrow. Any key-transport design is Tier C review.
- Group E2EE (sender keys) is genuinely complex; do not fake it — RLS + append-only + honest label until designed.
- Minors: conservative-by-construction stands (leader-initiates only); every new lane inherits it. Consent/assent flow (DR-0093) precedes any child-facing messaging beyond family.
- SMS bridge stays a NON-goal. Supabase realtime fan-out is fine at congregation scale; measure before sharding (no speculative partitioning — anti-bloat).

## CLOSE — the iterative roadmap (each increment small, testable, shippable alone)

**Timeline method (binding for this thread — Darrell 2026-07-27: "stop giving
nonsense none data driven timelines... deduct the best timelines from our best
data available").** Timelines below are DEDUCED from the lane's own telemetry,
never painted calendar spacing. The measurements: merged-PR throughput over the
last 7 days = 28 (07-23), 20 (07-24), 2 (07-25), 7+ (07-27 so far) — an active
working day lands 7–28 PRs; today's directive→merged cycle ran 25–90 minutes
per item (e.g. #1059 spoken→merged ~25 min; #1062 screenshot→merged ~35 min);
DB migrations ship same-day on the self-applying lane (DR-0084). Every
increment below is single-PR-sized (150–400 lines + tests) — the same shape as
today's merged PRs. **Deduction: increments 1, 1b, 2, 3, 4 are five PRs ≈ one
active working day at the measured pace; they are pulled IN ORDER per DR-0103
(idle turns pull the next item — no calendar gating). The only genuinely slower
lane is Tier-C review items (E2EE designs), which are governance-gated, not
build-gated.** Backstop re-review derives from the WORST observed day (2
PRs/day): five PRs ≤ 3 active days.

| Order | Ships | Measured size precedent |
|---|---|---|
| **1 — Robustness** | One instance resolver per contact (carry instance_id); `?view=message` alias; wire `unreadDmCount` nav badge; adopt table-sync debounce/reconnect; render tests for Messages/DirectMessages; invited/pending roster states | ≈ #1062 (one component + tests: ~35–90 min cycle) |
| **1b — User-created groups** | see below | ≈ #1035 (store + rail: same-day) |
| **2 — P3 web push** | sw push handler; `push_subscriptions`; VAPID in Governor custody; per-member OPT-IN; DB trigger fan-out on insert | ≈ 0117+surface (#1035→#1057 shape) |
| **3 — P2 contact cards** | `member_contacts` (self-writable, visibility member-chooses); directory reads roster+cards; invite-by-email on every roster surface | ≈ 0096-class migration + one panel |
| **4 — Scale rails** | Keyset pagination (created_at,id) both rails; incremental append instead of full refetch; group read-state as per-user high-water mark (O(1) per user-thread, never per-message rows) | ≈ lib-level change + tests (smallest) |
| **5 — Deepen (dated, not promised)** | Group sender-keys E2EE design (Tier C); DM multi-device key transport design (Tier C); P4 roster-by-roster migration; family_messages folded into the group rail (ONE spine) or awakened with why | Depth after breadth | re-review **2026-08-17** |

**Increment 1b — user-created groups (Darrell 2026-07-27 same-day: "How do I create a group of friends inside the app?... how can any user create a group?").** TODAY'S honest answer: no user can — the four group threads are FIXED rosters (`GROUP_ROSTERS` + choir/bus/security tables + `user_in_group`), populated by leaders/stewards; a member joins a group by being placed on a roster, never by creating one. THE BUILD (the generalization the review already named): a `custom_groups` table (id, instance_id, name, created_by) + `custom_group_members` (group_id, user_id, added_by) with RLS — creator adds/removes members drawn ONLY from people they could already DM (`users_can_dm` reused as the invite predicate, so the minors model and instance walls inherit for free); `group_messages.roster` gains a `custom:<group_id>` form and `user_in_group` gains one membership-check branch; UI = a "New group" button on the Groups tab (name it, pick members from your DM contacts) reusing the existing thread panel unchanged. Constraints: creator-managed (no admin approval needed — the DM predicate IS the safety); groups are instance-scoped (no cross-instance mixing); same not-yet-E2EE honesty label; deletion = creator-only, leaves the append-only history intact per retention. **Sequenced after Increment 1, before push — so push fan-out ships covering custom groups too** (size precedent: the #1035 store+rail PR, same-day at measured pace).

**Development-efficiency law for this rail (anti-bloat):** grow the shipped flat model by predicate and column, never by parallel store; every increment ≤ ~300 lines with its proven-to-catch test; the Layer-1 conversations schema is retired-in-place; the public conversational space stays a separate, later surface per its own doc.

**DR-0231 re-review closure:** P1 CONFIRMED shipped (#1035/#1057, live in the Governor's screenshots). P2/P3 sequenced above on measured pace. New `re-review: 2026-07-30` (the worst-observed-cadence backstop: five single-PR increments ≤ 3 active days) recorded in DR-0231.
