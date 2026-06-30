// =============================================================================
// church-lan-probe.mjs -- pure deterministic core for the on-church-network
// agent runner's LAN-VISIBILITY probe.
// =============================================================================
// WHY: from Darrell's home laptop the agent is blind to the church LAN. A runner
// homed ON the church network can LOOK at the wire directly -- discover NDI
// sources, list UniFi clients, ping the ATEM + the left Lenovo Legion (NDI->HDMI
// bridge) + the right OBS box, check NDI-discovery reachability, read Windows
// Firewall state. This upgrades infra diagnosis from "ask Darrell to check + tell
// me" to "look + confirm". Design note:
//   docs/99-session-notes/2026-06-29-on-church-network-agent-runner-design.md
//
// THIS FILE IS PURE (no network, no filesystem, no clock). Every decision is a
// deterministic function so it can be unit-tested proven-to-catch (DR-0076). The
// I/O wrapper that actually executes the steps is infra/church-runner/probe.mjs;
// it re-checks isReadOnlyCommand() before every exec (defense in depth).
//
// HARD INVARIANT: the probe can LOOK but NEVER TOUCH. Every step it emits is
// strictly read-only. A device's IP it does not know is marked SME-CONFIRM and
// reported as `unknown` -- it is NEVER fabricated up/down (DR-0076 / no-painted-
// data, "Reality-Trace Before Building Any Surface").
// =============================================================================

// The read-only probe kinds the runner understands. Each maps to a safe,
// look-only command template in buildProbePlan(). There is deliberately no
// "configure"/"set"/"write" kind -- the probe has no mutating verbs at all.
export const PROBE_KINDS = Object.freeze([
  'ping',            // ICMP reachability + latency
  'http-get',        // GET a health/status URL (read-only)
  'tcp-check',       // is a TCP port open (connect, no payload)
  'ndi-discovery',   // query the NDI discovery server / mDNS for sources
  'unifi-clients',   // GET the UniFi controller client list (read-only API)
  'firewall-state',  // read Windows Firewall profile state (show, not set)
  'tailscale-status',// read tailnet peer reachability (status, not up/down)
]);

// Substrings that indicate a command MUTATES state. Any probe command containing
// one is rejected. This is the single safety primitive the whole runner leans on:
// a read-only look can never become a write. Matched case-insensitively against a
// whitespace-normalized command, with word boundaries where a bare verb would be
// too broad ("start"/"stop"/"rm" etc. are matched as whole tokens).
const MUTATING_TOKENS = Object.freeze([
  'reboot', 'shutdown', 'poweroff', 'halt', 'restart',
  'delete', 'remove', 'format', 'reset', 'wipe', 'erase',
  'install', 'uninstall', 'modprobe',
  'configure', 'provision', 'flash', 'upgrade', 'downgrade',
]);
// Whole-word verbs (need boundary matching so e.g. "restart" above is separate
// and "status" never trips on "stat"). These are the ones that read as a noun or
// substring elsewhere, so we match them token-wise.
const MUTATING_WORDS = Object.freeze([
  'set', 'put', 'post', 'patch', 'write', 'create', 'update', 'add',
  'enable', 'disable', 'start', 'stop', 'kill', 'rm', 'mv', 'cp', 'dd',
  'chmod', 'chown', 'mkdir', 'touch', 'tee',
]);
// Phrase-level red flags for the specific tools this runner shells out to.
const MUTATING_PHRASES = Object.freeze([
  'netsh advfirewall set', 'netsh advfirewall firewall add',
  'netsh advfirewall firewall delete', 'firewall-cmd --add',
  'firewall-cmd --remove', 'iptables -a', 'iptables -i', 'iptables -d',
  'tailscale up', 'tailscale down', 'tailscale logout',
  'docker run', 'docker start', 'docker stop', 'docker restart',
  'docker rm', 'docker exec', 'systemctl start', 'systemctl stop',
  'systemctl restart', 'systemctl enable', 'systemctl disable',
  'curl -x post', 'curl -x put', 'curl -x delete', 'curl -x patch',
  'curl --request post', 'curl --request put', 'curl --request delete',
  'curl -d', 'curl --data', 'invoke-restmethod -method post',
]);

/**
 * True only if `cmd` is unambiguously read-only. Conservative: anything that
 * could write, configure, restart, or redirect output is rejected. Defense in
 * depth -- buildProbePlan only ever emits read-only templates, but probe.mjs
 * runs this on every command immediately before exec so a future edit cannot
 * sneak a mutation through.
 */
export function isReadOnlyCommand(cmd) {
  if (typeof cmd !== 'string' || cmd.trim() === '') return false;
  const norm = cmd.toLowerCase().replace(/\s+/g, ' ').trim();

  // Output redirection / in-place write operators.
  if (/(^|\s)>>?(\s|$)/.test(norm)) return false;
  if (/\|\s*(tee|dd|out-file|set-content|add-content)\b/.test(norm)) return false;

  for (const phrase of MUTATING_PHRASES) {
    if (norm.includes(phrase)) return false;
  }
  for (const tok of MUTATING_TOKENS) {
    if (norm.includes(tok)) return false;
  }
  for (const word of MUTATING_WORDS) {
    // token boundary: surrounded by start/end or non-word char
    const re = new RegExp(`(^|[^a-z0-9-])${word}([^a-z0-9-]|$)`);
    if (re.test(norm)) return false;
  }
  return true;
}

// Read-only command templates per probe kind. Each returns a string command the
// I/O layer runs. They are intentionally simple and portable (busybox/PowerShell
// friendly). The runner OS is decided by the deploy; both forms are read-only.
function commandFor(kind, dev, opts) {
  const ip = dev.ip;
  const port = dev.port;
  switch (kind) {
    case 'ping':
      // -n/-c count, short timeout; reachability + RTT only.
      return `ping -c 2 -W 1 ${ip}`;
    case 'http-get':
      return `curl -fsS -m ${opts.timeoutSec} ${dev.url || `http://${ip}:${port}/`}`;
    case 'tcp-check':
      // connect-only check; no payload sent.
      return `nc -z -w ${opts.timeoutSec} ${ip} ${port}`;
    case 'ndi-discovery':
      // read the NDI discovery server's source list (GET), or mDNS browse.
      return `curl -fsS -m ${opts.timeoutSec} http://${ip}:${port || 5959}/v1/sources`;
    case 'unifi-clients':
      // UniFi controller read-only client list. URL carries no credentials in
      // git; the I/O layer attaches the API key from the local .env at runtime.
      return `curl -fsS -m ${opts.timeoutSec} ${dev.url || `https://${ip}/proxy/network/api/s/default/stat/sta`}`;
    case 'firewall-state':
      // SHOW profile state -- read-only. (Windows runner.)
      return `netsh advfirewall show allprofiles state`;
    case 'tailscale-status':
      return `tailscale status --json`;
    default:
      return null;
  }
}

/**
 * Build the ordered, deterministic probe plan from a device registry.
 * @param {Array} targets  device descriptors {id,label,role,ip,port,probe,url}
 * @param {Object} opts     {timeoutSec=3, maxSteps=64}
 * @returns {Array} steps  {id,device,label,role,kind,target,command,readOnly,sme}
 *
 * A device with ip === 'SME-CONFIRM' (or missing) still yields a step so the
 * snapshot lists it -- but the step is flagged sme:true with a null command, and
 * the I/O layer reports it `unknown`. We never invent an address to probe.
 */
export function buildProbePlan(targets, opts = {}) {
  const timeoutSec = Number.isFinite(opts.timeoutSec) ? opts.timeoutSec : 3;
  const maxSteps = Number.isFinite(opts.maxSteps) ? opts.maxSteps : 64;
  if (!Array.isArray(targets)) throw new Error('buildProbePlan: targets must be an array');

  const steps = [];
  for (const dev of targets) {
    if (steps.length >= maxSteps) break; // budget brake (deterministic ceiling)
    const kind = dev.probe;
    if (!PROBE_KINDS.includes(kind)) {
      throw new Error(`buildProbePlan: unknown probe kind "${kind}" for device "${dev.id}"`);
    }
    const sme = !dev.ip || dev.ip === 'SME-CONFIRM';
    // firewall-state / tailscale-status are host-local (no IP needed).
    const hostLocal = kind === 'firewall-state' || kind === 'tailscale-status';
    const isSme = sme && !hostLocal;

    const command = isSme ? null : commandFor(kind, dev, { timeoutSec });
    // Hard invariant: anything we emit to run must be read-only.
    if (command !== null && !isReadOnlyCommand(command)) {
      throw new Error(`buildProbePlan: refused non-read-only command for "${dev.id}": ${command}`);
    }
    steps.push({
      id: dev.id,
      device: dev.id,
      label: dev.label || dev.id,
      role: dev.role || '',
      kind,
      target: isSme ? 'SME-CONFIRM' : (dev.url || dev.ip || 'host-local'),
      command,
      readOnly: true,
      sme: isSme,
    });
  }
  return steps;
}

/**
 * Classify one executed step's raw result into an honest status.
 * @param {Object} step   a step from buildProbePlan
 * @param {Object} raw    {ok, stdout, stderr, code, ms, error, timedOut}
 * @returns {Object} {device,label,role,kind,status,reachable,latencyMs,detail,sme}
 *
 * status is one of: 'up' | 'down' | 'unknown'. An SME-CONFIRM step is ALWAYS
 * 'unknown' (we never probed it). A real step is 'up' on success, 'down' on
 * failure/timeout. No third interpretation is invented.
 */
export function classifyProbeResult(step, raw = {}) {
  const base = {
    device: step.id,
    label: step.label,
    role: step.role,
    kind: step.kind,
    sme: !!step.sme,
  };
  if (step.sme) {
    return { ...base, status: 'unknown', reachable: null, latencyMs: null,
      detail: 'address not yet confirmed (SME-CONFIRM) -- not probed' };
  }
  const ms = Number.isFinite(raw.ms) ? raw.ms : null;
  if (raw.ok === true && !raw.timedOut) {
    return { ...base, status: 'up', reachable: true, latencyMs: ms,
      detail: summarize(raw.stdout) };
  }
  return { ...base, status: 'down', reachable: false, latencyMs: ms,
    detail: raw.timedOut ? 'timed out' : summarize(raw.stderr || raw.error || `exit ${raw.code}`) };
}

function summarize(s) {
  if (!s) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > 200 ? t.slice(0, 197) + '...' : t;
}

/**
 * Assemble the snapshot the runner writes (and serves over Tailscale).
 * @param {Array} steps     the plan
 * @param {Array} results   classifyProbeResult outputs, parallel to steps
 * @param {String} nowIso   caller-supplied timestamp (purity: no clock here)
 * @param {Object} meta     {runner, site}
 */
export function shapeSnapshot(steps, results, nowIso, meta = {}) {
  const devices = results.map((r) => ({
    device: r.device, label: r.label, role: r.role, kind: r.kind,
    status: r.status, latencyMs: r.latencyMs, detail: r.detail,
  }));
  const summary = devices.reduce((acc, d) => {
    acc.total += 1;
    if (d.status === 'up') acc.up += 1;
    else if (d.status === 'down') acc.down += 1;
    else acc.unknown += 1;
    return acc;
  }, { total: 0, up: 0, down: 0, unknown: 0 });
  const sme_pending = devices.filter((d) => d.status === 'unknown').map((d) => d.device);
  return {
    generated_at: nowIso || null,
    runner: meta.runner || 'church-runner',
    site: meta.site || 'church',
    summary,
    devices,
    sme_pending,
  };
}

/**
 * The three-brake gate, evaluated purely so it is proven-to-catch (DR-0076).
 * Mirrors infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh semantics,
 * specialized for a runner with TWO privilege tiers:
 *
 *   probe (read-only LOOK)  -- needs: kill-switch CLEAR + PROBE_ARMED + a step
 *                              budget set & not exceeded + the single-flight lock.
 *   dispatch (send work to a GPU tower / summon an LLM worker) -- needs ALL of
 *                              the probe brakes PLUS DISPATCH_ARMED + a $ budget
 *                              set & under the daily ceiling.
 *
 * Ships INERT: killSwitch present (true) + both ARM flags absent (false) + zero
 * budgets => everything is `go:false`. Nothing runs until Darrell removes the
 * kill-switch and arms, with someone watching (CLAUDE.md three-brakes rule).
 *
 * @param {Object} s {killSwitch, probeArmed, dispatchArmed, lockHeld,
 *                    stepBudget:{max,requested}, usdBudget:{perTask,daily,spent}}
 */
export function churchRunnerBrakeGate(s = {}) {
  const killSwitch = s.killSwitch !== false; // default ENGAGED (fail safe)
  const probeArmed = s.probeArmed === true;
  const dispatchArmed = s.dispatchArmed === true;
  const lockHeld = s.lockHeld === true;

  const sb = s.stepBudget || {};
  const stepMax = Number(sb.max || 0);
  const stepReq = Number(sb.requested || 0);
  const stepBudgetOk = stepMax > 0 && stepReq <= stepMax;

  const ub = s.usdBudget || {};
  const usdBudgetOk = Number(ub.perTask || 0) > 0 && Number(ub.daily || 0) > 0
    && Number(ub.spent || 0) < Number(ub.daily || 0);

  // probe gate
  let probeReason = 'all probe brakes clear';
  let probeGo = true;
  if (killSwitch) { probeGo = false; probeReason = 'kill-switch engaged'; }
  else if (!probeArmed) { probeGo = false; probeReason = 'disarmed (no PROBE_ARMED flag)'; }
  else if (lockHeld) { probeGo = false; probeReason = 'single-flight lock held by another run'; }
  else if (!stepBudgetOk) { probeGo = false; probeReason = 'step budget brake (ceiling unset or exceeded)'; }

  // dispatch gate (strict superset of probe)
  let dispatchReason = probeGo ? 'all dispatch brakes clear' : `blocked by probe gate: ${probeReason}`;
  let dispatchGo = probeGo;
  if (dispatchGo && !dispatchArmed) { dispatchGo = false; dispatchReason = 'dispatch disarmed (no DISPATCH_ARMED flag)'; }
  else if (dispatchGo && !usdBudgetOk) { dispatchGo = false; dispatchReason = '$ budget brake (ceiling unset or daily limit reached)'; }

  return {
    probe: { go: probeGo, reason: probeReason },
    dispatch: { go: dispatchGo, reason: dispatchReason },
    brakes: { killSwitch, probeArmed, dispatchArmed, lockHeld, stepBudgetOk, usdBudgetOk },
  };
}
