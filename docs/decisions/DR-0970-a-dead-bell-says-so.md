---
id: DR-0970
title: A dead bell says so — curl -sS exits 0 on a 404, so the phone alarm reported itself as rung
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, THREE-BRAKES, SURFACE-SAYS-TRUTH]
source: 2026-10-11 — site-health run 38141832465, which captured the 404 verbatim
---

## Context

The family's phone alarm — the bell that fires when poetech.us is down or a
deploy fails its real-browser boot-check — **has been dark, and the code that
calls it has been reporting success.**

It surfaced while proving #2112's deploy. site-health run **38141832465** at
`2026-10-11T13:06:25Z` ended with this, verbatim:

```json
{"code":404,"message":"The requested webhook \"POST ops-announce\" is not registered.",
 "hint":"The workflow must be active for a production URL to run successfully..."}
```

That the webhook is unregistered was already suspected. **The part that was
wrong is the detector**, and it is worse than silence.

## What was measured

The guard at both call sites (`site-health.yml:612`,
`deploy-cloudflare-pages.yml:341`) was:

```bash
curl -sS -X POST "$RELAY/webhook/ops-announce" ... \
  || echo "::warning::announce relay unreachable — incident recorded on the ledger, phone push skipped"
```

**`curl -sS` without `-f` EXITS 0 ON AN HTTP 404.** A 404 is a perfectly
successful HTTP transaction as far as curl is concerned, so the `||` branch
**cannot fire on one** — it only catches a connection failure. Measured
consequence: **an unregistered, renamed, revoked or 500-ing webhook is
indistinguishable from a bell that rang.**

| Relay state | curl exit | Old reading | Truth |
|---|---|---|---|
| 200 accepted | 0 | rang | rang |
| **404 not registered** | **0** | **rang** | **dark** |
| 401/403 token refused | 0 | rang | dark |
| 500 relay broken | 0 | rang | dark |
| connection refused | non-zero | warning | dark |

Only the last row ever worked. The fail-soft was written to degrade gracefully
and instead degraded **invisibly** — the class DR-0076 §3 calls theater: a
check that cannot fail is not a check.

**It mattered the same day.** The deploy ran red for about two hours on
2026-10-11 morning with no bell, and nobody knew the bell itself was the broken
thing.

**And the same file already knew better.** site-health's own probe step uses
`curl -sS -o "$BODY_FILE" -w '%{http_code} %{redirect_url}'` and reads the
code. The correct pattern and the broken one sat forty lines apart. The bug was
not ignorance of how to do it; it was a path nobody made fail on purpose.

## Impact

This is the instrument class, so the cost is measured in **time spent not
knowing.** Every alarm raised while the bell is dark — a down site, a failed
boot-check — is written to the incident ledger and **reaches nobody**, while
the run log says the push was sent. The ledger is the record; the bell is the
only thing that reaches a phone, and DR-0125's whole point is that the site
needs a witness that speaks.

Second-order, and worse: a detector that always reports success **teaches the
team the bell works.** The next person reading that `|| echo` will conclude the
relay was fine. That is the invisible-in-review failure DR-0250 names.

Reversible: one new script, two call sites, one `actions/checkout` added to a
job. No table, no policy, no money, nothing on the merge path. **Tier C
because it touches the deploy workflow** (DR-0107), so it carries its own
deploy proof rather than riding someone else's.

## Decision

1. **`scripts/ops-announce.mjs`** — pure core plus a thin shell, the same split
   as `push-stranding-guard.mjs`. `classifyBellResponse({code, body,
   transportError})` answers *"did the bell ring, and if not, is it dead or
   merely unconfigured?"* with no network, no env and no clock.
2. **Only 2xx counts as rung. UNKNOWN IS NOT RUNG** (DR-0076 §8). There is no
   benefit-of-the-doubt branch: 0, 3xx, 4xx and 5xx all read as *did not ring*.
3. **The reason names the fix, not just the fault.** A 404 carrying *"not
   registered"* says the n8n workflow holding `POST ops-announce` is **not
   ACTIVE on the NAS** — a toggle no runner can reach — and states plainly that
   alarms raised meanwhile reach nobody. A 401/403 says the bearer is wrong,
   expired or revoked. Those are different human actions and must not share one
   message.
4. **A missing bearer is NOT a dead bell.** Nothing was attempted, so it exits
   0 and writes nothing. Calling it dead would put a false alarm on the ledger
   on every run of a repo without the secret.
5. **A dead bell is recorded where humans look** — a comment on the same
   rolling `incident` issue as the outage itself, not a `::warning::` in a log
   nobody reads (P53). Exit code **3** is reserved for "reached, but the bell is
   broken", distinct from 1, so callers can branch on it.
6. **The token is never printed** — read from the environment, sent in a
   header, absent from every reason string; and the `LEDGER_LINE=` output line
   is masked in the run log so the ledger carries it once.
7. **`--relay=` exists so the exit codes can be proven** against a local
   server. The workflows never pass it. Without it, the exit-3 path both
   callers key their ledger write on would ship having never once run (P44).
8. **NOT decided:** moving `ops-announce` off n8n to a sovereign Python
   endpoint. DR-0132 is explicit that **n8n is NOT ripped out**, and this bell
   is reliability-critical on the inbound n8n hop, which is an argument for
   moving it — but that is a NAS-side build, not a detector fix.
   `re-review: 2026-10-25`.
9. **NOT fixed here:** `db-migrate.yml:182` has the same `curl -sS ... && echo`
   shape against the **GitHub API** (dispatching rls-isolation). Same latent
   class, different blast radius and different semantics; listed so it is not
   lost. `re-review: 2026-10-18`.

## Verification

- `a-dead-bell-says-so.test.js` — **16 tests**, keyed on the **real 404 body**
  from run 38141832465 rather than a paraphrase: the measured 404 is dead and
  names "not ACTIVE"; a bare 404 gets a narrower reason; every code in
  `{0,301,302,400,401,403,404,418,429,500,502,503}` reads as not-rung; 2xx is
  the only acceptance; a refused token reads as a token problem; a transport
  error is one line; `ledgerLine` is empty on a working day; a missing bearer
  is not dead; and **the bearer never appears in any reason** at 200/401/404/500.
- **Proven-to-catch:** restoring the original semantics — *anything that got an
  HTTP answer counts as rung*, which is exactly what `curl -sS` did — fails
  **9 of 16**. Restored: 16 pass.
- **Exit codes proven end-to-end against a live local relay**, because the
  workflows branch on them:

  | Relay | stdout | exit |
  |---|---|---|
  | 404 "not registered" | the full reason + `LEDGER_LINE=` | **3** |
  | 200 | "accepted the push (HTTP 200)" | **0** |
  | 401 | "refused the token (HTTP 401)" | **3** |

- **The workflow shell block itself was run**, not just read: against the fake
  dead relay it produced `bell=3`, parsed the ledger line correctly, masked it
  in the log, and **`grep -c test-token` on the log returned 0.**
- **A harness error worth recording.** The first run of that block printed *"no
  announce bearer is configured"* and took the no-op branch — because I set
  `N8N_BEARER` as a shell variable instead of exporting it. The script was
  right and my harness was wrong; confirmed by reading the step's `env:` block,
  where `N8N_BEARER: ${{ secrets.VITE_N8N_BEARER }}` is a real step env and so
  is exported. Had I not re-checked, I would have "fixed" a script that was
  already correct.
- Both YAML files parse (`yaml.safe_load`).
- **Not proven from this sandbox:** a real push reaching a real phone. That
  needs the n8n workflow switched ACTIVE on the NAS, which is Darrell's toggle.
  Until then the new detector's job is to say so on the ledger every time —
  which is itself the live proof, and will appear on the next failing
  site-health run. `re-review: 2026-10-13`.

## Links

[DR-0156] (announce, not only record — the bell this repairs), [DR-0125] (the
site's own witness, which raises the alarms the bell was dropping),
[DR-0107] (prove the deploy — why this is Tier C), [DR-0132] (n8n is NOT ripped
out; the relay stays where it is for now), `push-stranding-guard.mjs` (the
pure-core-plus-thin-shell shape this follows).
