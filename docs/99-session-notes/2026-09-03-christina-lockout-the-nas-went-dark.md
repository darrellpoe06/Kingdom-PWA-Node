# 2026-09-03 — Christina's lockout: the NAS went dark, and the witness said "UP"

**What she saw.** Under "Welcome back", in the line reserved for our voice:

```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

She could not sign in. Neither could anyone else — this was never her account.

## SHOULD / ARE / GAPS / CLOSE (DR-0219)

### SHOULD

- The app's auth calls reach GoTrue on the sovereign stack through the
  same-origin transport `poetech.us/sb` (`app/functions/sb/[[path]].js` →
  Tailscale Funnel → kong → GoTrue). DR-0310 armed that repoint 2026-08-19.
- A sign-in failure the reader cannot act on is translated into our own voice,
  never printed raw (`app/src/lib/auth-error-message.js`, DR-0303 dimension 3).
- The live site has its own outside-in witness, and unknown never reads as
  healthy (`.github/workflows/site-health.yml`, DR-0125 / DR-0076).
- DR-0310 §5, verbatim: the sovereign transport probe is *"observe-only until
  /sb is live, incident-armed after."*

### ARE (measured, not inferred)

| when (UTC) | measurement | source |
|---|---|---|
| 05:09:40 | `GET poetech.us/sb/auth/v1/health` → **200** | site-health run 33717706745 |
| ~09:28 | Christina's screenshot: the parser error | her phone, 4:28 AM CDT |
| 09:45:21 | `/nas-photos/healthz` → **525**, `/property-history` → **525** | site-health run 33740584429 |
| 09:45:22 | `poetech.us/sb/auth/v1/health` → **525** | same run |
| 09:45:23 | **"UP. Fresh."** — run concluded *success* | same run |
| 10:58:18 | `ssh poetech.tail5a2f35.ts.net` → **connection timed out** | nas-health run 33747092767 |

**Root cause:** the NAS left the tailnet between 05:09 and 09:28 UTC. Cloudflare
could not complete TLS to the Funnel, so every call to `/sb` came back as
Cloudflare's **HTTP 525 HTML error page**. supabase-js parses every response as
JSON; parsing `<!DOCTYPE html>` throws, and that throw is what reached her
screen. Nothing was wrong with her account, her email, or her PIN. The hosted
project was answering 200 the whole time — the app simply no longer calls it.

### GAPS (three, plainly)

1. **The witness watched the wrong backend.** Step 7 probes the origin named by
   the CI *secrets* — still the hosted project. Since 2026-08-19 the served app
   calls `/sb`. The one line that did measure `/sb` was observe-only, so the
   probe wrote "UP. Fresh." with the family's sign-in door returning 525. The
   arming DR-0310 §5 promised was never done: **fifteen days** in which the
   app's real backend could fail without moving the instrument one inch.
2. **An error page where JSON belonged was an unclassified failure class.**
   `NOT_YOUR_FAULT` covers quota, 5xx and "failed to fetch" — not a JSON parse
   error standing in for an unreachable service. So the raw parser complaint
   fell through to the reader: the exact 2026-08-14 defect wearing new clothes.
3. **The only witness that noticed was Christina.** She had to screenshot it and
   text it. That is the failure DR-0125 exists to prevent.

### CLOSE

- **Gap 2** — `auth-error-message.js` now classes every HTML-instead-of-JSON
  shape (four browser engines' wordings, `<!DOCTYPE`, `<html`), Cloudflare's
  52x family, and the transport proxy's own "upstream unreachable" as service
  failures. She would have read: *"We can't reach our service right now… This is
  on our end — nothing you typed was wrong, and your account is fine."* The raw
  string still rides as `detail` for whoever can act on it.
- **Gap 1** — the sovereign transport line is **armed** (DR-0310 §5, fifteen
  days late). It now files the incident. It is armed against the **served
  bundle**, not configuration: step 3b reads which backend the shipped
  JavaScript actually names, so the probe follows the app instead of the
  secrets, and an unreadable bundle arms it too (unknown never reads healthy).
- **Gap 3** — closed by the same arming: the next occurrence opens the rolling
  `incident` issue and pushes, without anyone having to text a screenshot.

### Proven-to-catch (DR-0076 §3)

- `auth-speaks-in-our-voice.test.js` — removing any HTML/JSON-parse pattern, or
  the 52x codes, fails the pins. Written first against Firefox's wording, which
  the initial patch missed and the test caught before it shipped.
- The armed gate, run against today's readings: `(served=/sb, 525)` → incident;
  `(unreadable, 525)` → incident; `(served=/sb, 000)` → incident; `200`/`401` →
  green; `(hosted build, 525)` → green.

## Still open — the NAS itself

Code cannot reach a box that is off the network. Until the NAS is back on the
tailnet, **no one can sign in**: phone+PIN, password and email all ride the same
`/sb` door. Two ways back, in order:

1. **Bring the NAS back** — power, network, or Tailscale on the Synology.
   Nothing diverges; everything heals the moment it answers.
2. **Repoint to hosted** — revert `infra/nas-supabase/REPOINT-ARMED` and
   dispatch `deploy-cloudflare-pages` (DR-0310 §3; the hosted backend measured
   **200** throughout). This restores sign-in in one deploy, at a cost that is
   Darrell's call, not the agent's: the hosted rows are the 2026-08-19 baseline,
   so the family would see a two-week-old library and new writes would land on a
   second backend to reconcile later. Held ready, not fired.
