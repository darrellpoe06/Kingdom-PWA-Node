# SOVEREIGNTY-FIRST INSTALL PATTERN

> **Ratified 2026-05-26 (Dispatch, overnight session)** as a binding architectural
> principle for every infrastructure install, rollout, or migration this repo
> drives — past, present, and future.
>
> **Origin:** the n8n install on the DS1621xs (commits `67c8ad3` → `b24431b` →
> `ea228dd` → `bbc79a1` → `11f7c88`) is the case study where the lesson was
> learned the hard way. See "Case study" below.

## The principle

**Any install or rollout starts with "what works when the user walks away"
and builds the rest on top.** Autonomy first; polish later.

Before adding a single convenience feature — a richer UI, an advanced workflow,
a better dashboard, a nicer admin surface — verify:

1. The service comes back up on its own when the container, the host, or the
   network restarts.
2. Failures emit a notification the user will actually see, on at least two
   independent channels.
3. Operations that can fail transiently (HTTP, DB writes, LLM calls) retry
   with backoff before surrendering.
4. State that matters is backed up on a schedule the user did not have to
   start by hand.
5. Container health is observable from outside the container (a heartbeat,
   a log, a webhook, an endpoint) so a watchdog can act on it.

Only after those five are green do we earn the right to spend the user's
attention on convenience features.

## Why

Real users — Darrell, Christina, family, parishioners, tenants — cannot sit at
a desk clicking through a UI for hours. They are at work, on the road, on
vacation, asleep, in the field, in worship, in the hospital, in life.

The system has to **hold** while they are gone. If it doesn't hold, the user
returns to a broken thing and has to choose between two costs they shouldn't
have to pay:

- the cost of triaging an outage that started while they were absent, or
- the cost of distrusting the system and going back to manual work.

The wrong order — UI polish first, autonomy later — silently bills the user
both costs every time it happens. Sovereignty-first refuses to send that bill.

This is not a perfectionism principle. It is a **respect-for-the-operator's-life
principle.** Build what survives the operator being elsewhere first, then build
what shines when the operator is paying attention.

## The concrete pattern (in execution order)

For every install task this repo or Dispatch generates, the work plan must
list these phases in this order. Phase N may not begin until Phase N−1 is
verified.

```
  Phase A — AUTONOMY
    1. Dual-channel notifications (e.g. Pushover Direct API + email-to-push,
       or Pushover + ntfy, or any two independent transports). One channel
       can die and the other still delivers.
    2. Restart-on-crash (Docker restart policy = unless-stopped or always;
       systemd Restart=on-failure; Synology task auto-restart).
    3. Retry-on-fail in the workflow layer (n8n HTTP nodes with retry/backoff;
       any external API call wrapped in retry logic).
    4. Scheduled backups (offsite or at least off-volume; nightly is the floor).
    5. Container/service health surfaceable without SSH (heartbeat workflow,
       /health endpoint, scheduled ping → notification on miss).

  Phase B — CONVENIENCE
    6. Rich UI / editor / admin surface
    7. Advanced workflows, secondary models, optional features
    8. Observability dashboards, analytics, reports
    9. Documentation polish, screenshots, onboarding flows
```

**The line between A and B is a commit boundary.** When Phase A is done,
that's a commit ("feat(install): X autonomy baseline"). Only then do we open
Phase B work. If the work has to stop, the system as committed at the A/B
boundary is still safe to walk away from.

## POE binding — people over engineering elegance

The Sovereignty-First pattern is a direct application of POE. The temptation
in any infra install is to chase the **engineering-elegant** path: get the
beautiful surface working first because that's the visible win, then circle
back to the boring durability work later.

POE inverts that. The **people-first** path is: the user gets a system that
holds while they're gone, even if the surface is plainer than it could be.
Surface polish lands later; durability lands first.

This also lines up with the grace-and-mercy standard
(`docs/00-foundations/01-grace-and-mercy-standard.md`): the system should
behave toward the operator the way we want the operator to behave toward
themselves. Mercy on a tired operator looks like infrastructure that does
not punish their absence.

## How this binds future installs

From 2026-05-26 forward, **every infra task spawned by Dispatch** (any agent,
any session, any user-requested install) will include an "autonomy first"
checklist at the top of the prompt. The checklist is the five points from
"The principle" above, restated as gates:

```
  AUTONOMY-FIRST CHECKLIST (must be green before convenience features begin)
  [ ] Dual-channel notifications wired and tested with a real failure event
  [ ] Restart-on-crash verified by killing the container and watching it return
  [ ] Retry-on-fail wrapping every external call, with at least 1 backoff
  [ ] Scheduled backup running on its own cadence, with a notification on
      success AND on failure
  [ ] Health surfaceable from outside (heartbeat, /health, scheduled ping)
```

A prompt that does not contain this checklist is missing a foundational
constraint and should be sent back for revision before work begins.

For Dispatch agents specifically: when generating an install plan, **the first
five line items in your plan must map 1:1 to the five gates above.** If the
install doesn't need one of them (e.g. it's stateless so backups aren't
relevant), say so explicitly and explain why. Skipping silently is the failure
mode this principle exists to prevent.

For Claude Code sessions: when reviewing or editing an install task, the
sovereignty pass comes first. If a PR adds a UI feature to a service that
doesn't yet have autonomy gates green, the PR is paused (not rejected — paused)
and the autonomy work goes in first.

## Case study — the n8n install (2026-05-26)

The n8n stack on the DS1621xs shipped in this order, and the order itself
was the lesson:

1. Container compose file, port mapping, secret-cookie config — `67c8ad3`
2. Four week-1 workflows imported — `67c8ad3`
3. Quad-model Ollama follow-up — `b535b24`
4. Pushover dual-path notifications wired — `ea228dd`
5. PUSHOVER_* env var pass-through to the n8n container — `bbc79a1`
6. Stack B Phase 1 + dual-model follow-up — `b24431b`
7. End-of-session batch with the env-access fix, the fromEmail patch, the
   patch scripts, the gotchas document, the handoff — `11f7c88`

Look at the order. The container and the workflows shipped **first**, before
notifications were end-to-end reliable. The dual-path Pushover wiring
(autonomy-critical: it's how the user finds out anything happened) came after
the workflows that depended on it. The env-var pass-through (without which
Pushover Path A silently no-ops) came after that. The handoff doc with the
gotchas and patches came at the very end.

Darrell's feedback on this ordering, verbatim:

> **"This should have been first!!!!! You should understand to use our time
> wisely for our needs."**

He is exactly right. The notifications, the env-var pass-through, the retry
discipline, the restart policy — every one of those is "what works when the
user walks away." Every one of those was treated as a follow-up instead of
as the foundation. The workflows imported in phase 1 were running on an
autonomy substrate that didn't exist yet. The fact that the install ultimately
landed is because Dispatch circled back several times to close the gaps that
should have been Day 0.

The cost of that ordering was paid in Darrell's attention — the most
expensive resource in the entire system — across multiple sessions. The
Sovereignty-First pattern exists so we do not bill him that attention again.

## When this principle does NOT apply

Three narrow exceptions, each requires saying so explicitly in the work plan:

1. **Stateless, single-user, single-session diagnostic tools.** A throwaway
   script that runs once on a developer laptop doesn't need a backup story.
   The autonomy gates collapse to "does the script error usefully on fail."
2. **Read-only data fetches with a tolerable degraded mode.** If a workflow
   reads-only and the worst case on failure is "no fresh data this hour,"
   the retry/backup gates relax. Notification on miss still applies.
3. **Pre-production sandbox work that the user is sitting at right now.**
   If Darrell is at the keyboard supervising in real time, autonomy gates
   are deferred — but the work plan must call out the deferral and the gates
   must close before the sandbox is promoted to production.

In every other case, the principle binds.

## Related foundations

- `docs/00-foundations/01-grace-and-mercy-standard.md` — mercy on the operator
- `docs/00-foundations/10-kings-not-slaves.md` — the user is the king, the
  system is the servant; servants don't make kings work overtime
- `docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md` — the Stack B lock-in that
  picked n8n; Stack B's value is **only** realized if it's autonomous
- `infra/n8n/INSTALL.md` — the n8n install document (now reordered to lead
  with the autonomy phases per this principle)
- `setup-autonomy.ps1` — the laptop-side autonomy bootstrapper

## Revision history

- 2026-05-26 — Ratified by Darrell after the n8n install case study.
  Document authored by Dispatch (overnight session).
