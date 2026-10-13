---
id: DR-0327
title: Christina could not sign in — the witness was watching a backend the app had stopped calling, and an error page spoke in our place
date: 2026-09-03
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [poetech, church, moore, tlc]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, COMMUNITY-FIRST, LESSONS-LEARNED, PERPETUAL-IMPROVEMENT, SOVEREIGN-FIRST]
source: 2026-09-03 session — Darrell relaying Christina's screenshot: "My wife is locked out!!!! Why???!!!!", then "did you test with your access? cli.... ssh?" and "how you accomplish the goal has to be aligned with our Ways and documentation and historical information."
---

## Context

Christina's phone showed `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
under "Welcome back". Measured: the NAS left the tailnet between 05:09 and
09:28 UTC (`/sb/auth/v1/health` **200** at 05:09:40, **525** at 09:45:22; SSH
with the real key `Connection timed out` at 10:58:18 and again in the deploy at
11:18:24). Cloudflare could not complete TLS to the Funnel, so every sign-in
call returned Cloudflare's HTML 525 page; supabase-js parses every response as
JSON, and the parser's throw is what reached her screen. **site-health ran 17
minutes after she was locked out and wrote "UP. Fresh."**

One instrument DID see it: `node-availability` measured `poetech` **dark** in the
tailnet's own view and filed the incident at **10:17 UTC**, ~49 minutes before
Darrell asked why his wife was locked out. `kingdom-home` was dark in the same
reading (it was up on 2026-08-28) while all three TLC-side nodes stayed up —
a house-level power/network event, not a Synology fault. So the deeper gap is
not that nothing watched: **the device ledger and the product witness never
speak to each other.** "The NAS is dark" and "every app's sign-in is down" were
measured 64 minutes apart by two systems, and nothing joined them.

## Decision

1. **A witness follows the SERVED BUNDLE, never the configuration.** site-health
   now reads which backend the shipped JavaScript actually names (step 3b) and
   arms the `/sb` transport check on that. It probed the origin named by the CI
   *secrets* — the hosted project — while the app had called `/sb` since the
   2026-08-19 repoint. Configuration says what we believe; the bundle says what
   the family's browser does.
2. **An error page arriving where JSON belonged is a service failure, not the
   reader's problem.** `auth-error-message.js` classes every HTML-instead-of-JSON
   shape (four engines' wordings, `<!DOCTYPE`, `<html`), Cloudflare's 52x family,
   and the transport proxy's "upstream unreachable". The raw string survives as
   `detail`.
3. **DR-0310 §5's arming is executed, fifteen days late.** It promised
   observe-only "until /sb is live, incident-armed after." /sb went live
   2026-08-19; the arming never landed. **A promised arming is not a control
   until the line that fires exists** — an unarmed witness is an absent one.
4. **Unknown arms, never excuses.** An unreadable bundle arms the check
   (DR-0076); only a bundle positively naming the hosted origin disarms it.
5. **What we did NOT decide:** whether to revert `infra/nas-supabase/REPOINT-ARMED`.
   That moves where the family's data lives — hosted holds the 2026-08-19
   baseline, so two weeks of rows would go invisible and new writes would split
   across two backends. It is the Governor's call and was left with him, held
   ready and not fired.

## Rationale

Because DR-0303 built the backend witness and this incident proves a witness is
only as true as the origin it points at. Because DR-0317 already taught the
shape — a gap that is known, recorded and deliberate is only honest if something
observes what it costs — and today that lesson repeated against the same family
on the same stack. Because COMMUNITY-FIRST names elderly, tech-novice members as
who this is for, and a JavaScript parser error is the least actionable sentence
we have ever shown one of them.

## Consequences

- **Obligates:** every future backend/transport repoint updates the witness in
  the same merge that repoints, or ships an unwitnessed backend.
- **Enables:** the next occurrence files the rolling `incident` issue by itself,
  rather than arriving as a screenshot from the person locked out.
- **Carried, with a named carrier:** joining the device ledger to the product
  witness — a dark always-on node that fronts the app's backend should say so in
  the site's own incident, instead of leaving a person to connect two ledgers.
  The armed 525 message now names the ledger to check; the real join is the
  improvement. re-review: 2026-09-17.
- **Forecloses:** "observe-only for now, armed later" as a landing state — the
  arming rides the change that makes it true.
- **Reversibility:** both changes are additive; reverting either restores the
  prior (worse) behavior with no data effect.
- **Named NOT-done:** while the NAS is off the tailnet, `deploy-cloudflare-pages`
  fails at the sovereign key fetch by design (DR-0310 §2), so **this decision's
  own code is merged and undelivered** until the NAS answers. DR-0107's proof
  obligation is open, not waived.

## Links

DR-0303 (the backend's own witness — this is its recurrence), DR-0310 (§5 the
arming this executes; §2 the fail-loud deploy; §3 the off-switch not fired),
DR-0317 (a named NOT-done needs an observer), DR-0125 (the site's own witness),
DR-0107 (uptime is senior; merged is not delivered), DR-0076 (unknown never
reads as healthy), REV-0250,
`docs/99-session-notes/2026-09-03-christina-lockout-the-nas-went-dark.md`.
