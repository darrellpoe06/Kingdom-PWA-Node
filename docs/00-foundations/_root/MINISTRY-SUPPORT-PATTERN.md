# MINISTRY-SUPPORT-PATTERN.md — every ministry gets the same coordination spine

**Added 2026-07-12. Declared by Darrell after Deacon Anderson's bus-ministry
requirements call.** Layer 3 foundation (reference). Read this before building
the next ministry surface — it is the reusable spine, the review of which
ministries need it, and the opportunities/constraints (Ari + Claude) that came
out of building the first two.

> "Bear ye one another's burdens, and so fulfil the law of Christ." — Galatians
> 6:2 (KJV). A ministry is people carrying a load together; the software's whole
> job is to make the carrying *coordinated* instead of dependent on one person's
> memory and phone calls.

---

## 1. What Deacon Anderson actually needed (the source)

Deacon Anderson runs COLG's bus/van ministry. In his own words the live failure
was not scheduling — it was **the reminder that never went out**:

> "what's been happening is that they're not calling my drivers… this morning no
> one's on the phones… sister should've called him on Thursday and said you're
> scheduled." → "so once the schedule come out, the reminders need to go [out]."

And the second half of the ask, from the same call and Darrell's follow-up:

> "give me all your users… we'll create user accounts for them… you can message
> them, and you can see all the messages that happened, and everybody see it
> altogether… you'll be able to text me back." Plus a dev/ops loop: "tell me what
> more you need to add to it, and we'll do that."

**Every ministry has this same shape.** The choir already had it (0011). The bus
ministry now has it (0095). The pattern below is what the third, fourth, and
fifth ministries inherit instead of re-architecting.

---

## 2. The spine — six primitives, one template

A ministry surface is these six primitives, scoped to the church instance, RLS-
gated, realtime-synced. Reuse the choir/bus tables + helpers as the template.

| # | Primitive | Table shape | What it removes |
|---|-----------|-------------|-----------------|
| 1 | **Roster** (with phone + email + role) | `*_members` / `bus_drivers` | "who is even in this ministry" living in one person's head |
| 2 | **Schedule** (who, doing what, when, where) | `*_schedule` | the paper list nobody else can see |
| 3 | **Reminders** (fire N days before, tracked) | `bus_reminders` | "nobody called them" — the exact bus-ministry failure |
| 4 | **Shared thread** (everyone sees together) | `*_messages` | the group text nobody can catch up on |
| 5 | **1:1 direct + report-to-security** | `direct_messages`, `security_reports` | "I need to reach one person" and "get help *now*" |
| 6 | **Dev/ops intake** (requirements → build team) | `bus_requests` | waiting on a phone call to change the software |

**Access is always the same two-tier gate** (choir `deriveAccess`, reused
verbatim in `bus-ministry.js`): read = any ministry member (`user_in_<ministry>`
= owner/admin OR a roster row); edit = owner/admin (the coordinator, made admin).
RLS is the real enforcement; the client mirrors it only so the UI matches.

**The engineering shape is fixed too** (this is the Way — see §6):
- Pure logic in a `*.js` lib with **no Supabase import**, exhaustively unit-tested
  (the verification gate, DR-0076) — shapes, date math, coverage, reminder plan,
  load rules.
- Supabase I/O in a `*-sync.js` lib that `writeContext()`s the tenant before every
  write and streams via one `makeSubscriber` factory.
- A component that gates on `canSee/canEdit` and shows an honest "ask to be added"
  state to non-members instead of a painted surface (DR-0061).

---

## 3. Review of COLG's ministries — who gets this next

Ordered by the burden the reminder/coordination gap is placing on them today.
This is the "review the ministries and support after the bus ministry" pass.

1. **Bus / Van** — **built** (0095). The live pain; shipped first.
2. **Choir / Media / Sound** — **already has it** (0011). The template.
3. **Phone / Prayer ministry** (Sister Alexander) — named in the same call
   ("I'm not over the phone ministry, but that's an important part"). This is the
   ministry that was *supposed* to make the reminder calls. It needs the roster +
   a schedule of who's on the phones + the same reminder primitive turned on
   itself. **Strong next candidate** — it closes the exact loop that failed.
4. **Ushers + Security** — the `direct_messages` roster↔roster lane and
   `security_reports` were built *for* them (an usher tells security "come here";
   anyone reports to security). They need their rosters seeded (`security_team`
   exists) and the security↔Observation wiring (see SOVEREIGN-COMMS-AND-MEETINGS).
5. **Hospitality / Kitchen** — has adjacent surfaces already (KitchenInventory);
   the schedule + reminder + thread spine applies to serving rotations.
6. **Deacons / Missions / Hospitality visits** — schedule + roster + thread; the
   reminder primitive covers visitation rotations.

Each is the same six primitives with a different roster table and a different
`user_in_<ministry>()` helper. None is a new architecture.

---

## 4. Opportunities — what works in our favor (Ari + Claude)

1. **The pattern is proven, so the second build was cheap.** The bus ministry is
   the choir's spine re-skinned — same RLS shape, same subscriber factory, same
   `deriveAccess`, same testable-pure-logic discipline. The third ministry is a
   template fill, not a design problem. **This is the moat**: each ministry makes
   the next one faster.
2. **The tenancy/RLS model generalizes every ministry for free.** `instances` +
   `instance_members` + `user_role_in_instance` already exist; a new ministry is
   one roster table + one SECURITY DEFINER access helper.
3. **Realtime + PWA meets the actual congregation.** COLG is an elderly, tech-
   novice community (COMMUNITY-FIRST). A phone that updates live, with a big-print
   accessible surface, is exactly the right delivery — no app store, no training.
4. **The reminder primitive kills a whole class of failures.** "Nobody called
   them" is not a bus problem; it is every scheduled ministry. One tested
   primitive (`buildReminderPlan` + `dueReminders`/`overdueReminders`) makes
   "was the reminder sent?" real, queryable state instead of a person's memory.
5. **The dev/ops intake makes ministries self-serve the roadmap.** `bus_requests`
   means Deacon Anderson types "add text reminders" into the app and it reaches
   the build team — no waiting on a call. This *is* the streamlined delivery loop
   (DR-0103) extended to the ministries.
6. **The comms lanes connect ministries operationally.** roster↔roster DMs +
   report-to-security mean the building coordinates end to end (usher → security →
   Observation cameras), not just within one ministry.

---

## 5. Constraints — the honest limits (Ari + Claude)

Stated plainly (DR-0100 — under-claiming is as much a failure as over-claiming):

1. **Account linking is the gating dependency.** A roster row with no `user_id`
   is a name + phone the coordinator manages, but that person can't confirm their
   own assignment, receive an in-app reminder, or DM until they have an account.
   The phone+PIN door (DR-0172) is the unblock; onboarding real accounts is the
   real next-step work, not a code gap.
2. **Reminders are in-app + coordinator-logged, not yet auto-SMS.** v1 tracks
   *that* a reminder is due and lets the coordinator mark it sent / the driver
   acknowledge. It removes the "did anyone remind them?" ambiguity. It does **not**
   yet send an automated text or robocall — that needs an SMS provider (Twilio)
   and the three-brakes (DR-0068), and is exactly what `bus_requests` is for.
   Honest status: the sister still makes the call, but the app now tells her
   which calls are due and remembers which were made.
3. **The sovereign OBS meeting engine is not built** — only scheduling + load
   rules (see SOVEREIGN-COMMS-AND-MEETINGS.md). Real-time video is Tier C.
4. **Minor-messaging is conservative-by-construction, not guardian-scoped.** The
   DM model can't reach a minor peer-to-peer (they're not on operational rosters
   or admins), but true guardian-scoped minor messaging is a documented follow-up.
5. **Security ↔ Observation is data-connected, not surfaced-together yet.**
   `security_reports` exist and the security team reads them; rendering that feed
   *inside* the Observation camera tab is the follow-up.

None of these is a reason to withhold what shipped; each is a named `re-review`
item (DR-0075), not a silent gap.

---

## 6. Add to our Ways — what this taught us

Recorded as WAYS-REVIEW findings (DR-0108), promoted here because they change how
the *next* ministry gets built:

- **A proven module is a template; the second instance reuses the first's spine,
  it does not re-architect.** Tables + `user_in_X()` helper + `makeSubscriber` +
  `deriveAccess` + pure-logic-in-a-testable-lib are copied and re-skinned. Building
  the bus ministry by cloning the choir's shape is why it took one session. When a
  request matches an existing module's shape, the first question is "what is the
  template," not "what is the design."
- **Capture the ministry's requirements *in* the ministry.** The dev/ops intake
  (`bus_requests`) is the sibling of SPOKEN-TEACHINGS-BUILD-INPUT: the people who
  run the ministry type what they need into the surface they use, and it reaches
  the build team without a call. Every ministry surface ships with this lane.
- **"Was it done?" must be real state, never a person's memory.** The reminder
  queue exists because "sister should've called on Thursday" is not verifiable.
  Any coordination step whose failure mode is "someone forgot" becomes a tracked
  row with a due date and a status — the same discipline as the verification
  doctrine, applied to human follow-through.

Grounded as **DR-0180** (bus ministry + this pattern), **DR-0181** (the 1:1 /
roster↔roster / report-to-security model), **DR-0182** (sovereign OBS meetings +
load rules). Pairs with: 0011-choir-module (the template), APP-IS-PRIMARY (built
in the app), COMMUNITY-FIRST (COLG is the first community), DR-0061 (real data,
no painted surfaces), DR-0076 (the pure logic is the gate), DR-0103 (the intake
feeds the streamlined loop).
