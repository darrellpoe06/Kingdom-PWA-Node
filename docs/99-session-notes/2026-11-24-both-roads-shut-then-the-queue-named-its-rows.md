# 2026-11-24 — both roads shut for fifteen hours, then the queue named its rows

Two things happened in one night, and the second is the proof the first delayed.
From 23:09 on 2026-11-23 to 13:05 on 2026-11-24 **both roads to the lesson queue
were shut**, and every surface the NAS serves was dark. At 14:05 the public road
answered, and the receipt it returned carried the live verification **DR-1610**
had deliberately left unclaimed.

## 1. The outage, measured hourly rather than estimated

The hourly intake witness dispatched `inbox-lessons-waiting.yml` on the hour and
read the pinned run each time. Every row below is a measurement, not a recollection.

| time (UTC) | run | tailnet join | public road |
|---|---|---|---|
| 23:09, 23:15 (11-23) | — | `invalid key: API key does not exist` | `TimeoutError` |
| 00:09 – 05:04 | 45331001507 and five before it | same | **HTTP 525**, six consecutive hours |
| 06:05 | 45337838945 | same | **HTTP 530** |
| 08:05 – 13:05 | 45353111018 … 45399890597 | same | **HTTP 530** |
| 14:05 | 45410207886 | still false | **ok**, 8 rows |

The 07:04 tick produced no run at all — the worker restarted twice while a
Supabase-connector read sat waiting on an approval nobody was present to give.
That connector is therefore **not actually available** unattended, which is the
condition the routine's own wording already anticipates. No further attempts.

No Cloudflare sub-code was captured, so the codes are reported and no cause is
inferred from them.

### What was and was not at fault

The 06:10 probe (run 45338403704) measured hosted `auth/v1/health` → **200**
directly while sovereign `/sb/auth/v1/health` → **502**. So the hosted database
was healthy throughout and no 402 or quota violation was measured anywhere: the
fault was the NAS/Funnel hop alone. The PWA itself never went down — `/` 302 →
`/poetech-app/` 200, all four installable faces 200, served build at main tip.

**The dead key blocked the repair, not only the view.** `nas-signin-heal.yml`
(run 45302450737), the workflow built to restart exactly these services, failed
at the same tailnet join. While the key is dead the sign-in fault cannot repair
itself. Recorded on incident #2840.

## 2. Recovery, measured at 14:08Z (run 45410782133)

**UP. Fresh.** Sign-in restored: `/sb/auth/v1/health` → 200 signed
`pages-function`, GoTrue reporting `email:true`. The bell answers again
(`/announce/healthz` 200; the ring's road 401, which is the pass). Photos 200,
cams 200 on main's own forwarder `cc19ae84f0d92a42`, sovereign storage 200.
Served build `030feff` = main tip.

Two roads are still 502 and are named rather than glossed: `/property-history`,
and `/automation-status`, which the probe itself judges a pre-signature build
rather than an outage (DR-1092). Neither was fixed by this recovery.

The tailnet is **still shut** — the key is still dead; what returned was the
keyless second road. That is precisely the case DR-1431 built it for.

## 3. DR-1610, proven live

The 14:05 receipt (census code `030feffb2de5`, counted on the NAS 5 min earlier):

```
Failed because -- crashed: 3, gates: 3, rate-limited: 1, transient: 1.
```

`other` is gone. That is byte-for-byte the distribution the DR predicted and the
suite pinned — `{"crashed": 3, "gates": 3, "rate-limited": 1, "transient": 1}` —
so the `re-review: 2026-11-30` is satisfied early rather than deferred.

## 4. What the queue is still blocked on — unchanged by the recovery

Eight rows wait, all `build-failed`, the oldest 12 d 1 h (created
2026-11-12T12:17:12Z). Two heal themselves and want nobody. Of the six past
budget:

- **three `gates`** — four of the eight failures across the set cite
  `span-without-reference`, three `not-the-verse`, one
  `generic-God-not-Yahweh`. The first of those traces to one undecided rule:
  **may a lesson double-quote Bishop Gwin, or Darrell, without a Scripture
  reference?** That is Darrell's call, not a defect.
- **three `crashed`** (`RuntimeError`) — the next read is the builder's own log
  on the box, which needs the tailnet. Blocked on the key.

So the recovery restored the *view* of the queue, not its *motion*. The two
things that would move it are both outside this session: the key, and the
quotation-gate decision.
