# Brief — Health-check workflow + ntfy alerts

**Why this exists:** Today the only way Darrell knows the sovereign loop is broken is by opening the PWA and seeing stale data. Reactive, not proactive. The vacation runbook lists the symptoms and fixes — this workflow turns those checks into a 10-minute cron that pings his phone the moment something breaks.

**Stack assumption:** ntfy is already deployed on the NAS at port 80 (per existing memory). Topic naming follows the existing `poetech-*` convention.

## What this workflow checks

Every 10 minutes, in order, with early-exit on first failure:

1. **Funnel reachability**: `curl https://poetech.tail5a2f35.ts.net/webhook/imported-transactions?limit=1` from the n8n container itself. Failure means Tailscale Funnel is down or n8n's webhook system isn't responding.
2. **n8n self-check**: `curl http://localhost:5678/healthz` from inside the container. Failure means n8n process is unhealthy.
3. **Workflow 15 freshness**: scan `/data/finance-events/bank/*/_balance.json` and find the most recent `captured_at`. If older than 24h, workflow 15 has stopped firing. (Banks export QFX at most daily, so >24h is the threshold.)
4. **Workflow 16 freshness**: read `/data/chatin/_reconcile_state.json` and find the most recent `at`. If older than 90 min (cron is hourly), workflow 16 has stopped firing.
5. **Active workflow count**: query n8n's API at `http://localhost:5678/api/v1/workflows?active=true`. If count drops (someone deactivated something), alert with which workflow.
6. **State file size**: `_reconcile_state.json` size delta vs last check. Sudden 0-byte means corruption.
7. **Disk space**: `df /volume1` for the bind-mount target. If <5GB free, alert.

Pass → write success record to `/data/finance-events/_health/<date>.json`, do nothing else.
Fail → write failure record, push ntfy alert with severity, increment per-check failure counter.

## Alert design

ntfy topic: `poetech-health`. Severity priority maps to ntfy priority:

| Severity | Triggers | ntfy priority | Tag |
|---|---|---|---|
| CRITICAL | Funnel unreachable, n8n unhealthy, disk <1GB | 5 (max) | rotating_light |
| HIGH | Workflow 15 silent >24h, workflow 16 silent >2h | 4 | warning |
| MEDIUM | Active workflow count dropped, disk <5GB | 3 | wrench |
| LOW | First minor anomaly (state file shrank by 10%, etc.) | 2 | information_source |

Each alert includes:
- The specific check that failed
- The timestamp of the failure
- The relevant remediation command from the vacation runbook (e.g. "ssh dpoe@192.168.1.26 ...")

**Suppression:** if a check has failed continuously, only alert on transition (first failure) and re-alert every 6 hours until resolved. Prevents alert storms during extended outages.

**Recovery alert:** when a previously-failing check passes again, push a "RESOLVED" notification. Closes the loop so Darrell knows the system is back without checking himself.

## Implementation

New file: `docs/00-foundations/n8n-workflows/20-health-check.json`

Three nodes:

1. **Schedule trigger** — cron `0 */10 * * * *` (every 10 min on the :00 second).
2. **Code node** — runs all the checks, builds a result object, writes the history file, decides on alerts. Reads previous run's history to detect transitions.
3. **HTTP request node** — pushes to `http://ntfy:80/poetech-health` (use the existing docker-compose service name; not localhost). Headers include `Title`, `Priority`, `Tags`. Only fires if alerts array is non-empty.

The code node should be largely a port of the vacation runbook's diagnostics into JavaScript. Pseudo-code:

```js
const checks = [
  { name: 'funnel', fn: async () => fetch('https://poetech.tail5a2f35.ts.net/webhook/imported-transactions?limit=1').then(r => r.ok) },
  { name: 'n8n', fn: async () => fetch('http://localhost:5678/healthz').then(r => r.ok) },
  { name: 'wf15-fresh', fn: () => latestBalanceFileAge() < 24 * 3600_000 },
  { name: 'wf16-fresh', fn: () => latestReconcileAge() < 90 * 60_000 },
  { name: 'active-workflows', fn: async () => activeWorkflowCount() >= 5 },
  { name: 'state-size', fn: () => stateFileSize() > 0 },
  { name: 'disk-free', fn: () => freeBytesOnVolume1() > 5 * 1024 ** 3 }
];

const results = [];
for (const c of checks) {
  try { results.push({ name: c.name, ok: !!(await c.fn()), at: now }); }
  catch (e) { results.push({ name: c.name, ok: false, error: String(e), at: now }); }
}
```

Then transition detection by reading the last history file:

```js
const lastRun = readLastHistory();
const alerts = [];
for (const r of results) {
  const wasOk = lastRun.results.find(x => x.name === r.name)?.ok ?? true;
  if (!r.ok && wasOk) alerts.push({ ...r, severity: severityFor(r.name), transition: 'failing' });
  if (r.ok && !wasOk) alerts.push({ ...r, severity: 'INFO', transition: 'resolved' });
}
```

Plus 6-hour re-alert for ongoing failures:

```js
for (const r of results) {
  if (r.ok) continue;
  const lastAlert = lastRun.lastAlerts?.[r.name];
  if (lastAlert && (now - lastAlert) > 6 * 3600_000) alerts.push({ ...r, severity: 'reminder' });
}
```

## How to test it before vacation

After importing, manually trigger by:
- Deactivating workflow 15 in the UI. Within 24 hours (or by faking the captured_at check), workflow 20 detects and pings ntfy. Re-activate to clear.
- SSH to the NAS and `pkill -9 -f n8n` (wait, this kills the workflow that runs the check too). Better: stop the Tailscale Funnel via `tailscale funnel reset`. Workflow 20 detects funnel unreachable in next tick and pings.

Don't test by filling the disk — gross.

## Files to touch

- `docs/00-foundations/n8n-workflows/20-health-check.json` — new.
- Update vacation runbook to mention "you'll get an ntfy push if anything below breaks; this is the proactive layer."

## Estimated effort

- Initial workflow + ntfy wiring: 2-3 hours.
- Adding more checks (Vercel deploy status, last Chase QFX upload age, etc.): incremental, optional.

## Open questions for Darrell

- ntfy topic name preference (`poetech-health` ok, or want something else)?
- Phone notification override (Critical-Always-On even in Do Not Disturb): worth a separate channel, or trust user-side ntfy app config?
- Should the workflow also notify a second phone (Christina) for CRITICAL, so if Darrell's phone is dead someone still gets the alert?
