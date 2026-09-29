// @vitest-environment node
// =============================================================================
// OpenClaw on the 4070 tower -- the brakes, the approval gate, the denied
// classes, the config, and the surface's derivation, each PROVEN TO CATCH
// (DR-0076 s3). DR-0670.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, mkdtempSync, cpSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  decide, toHookResult, brightLinesHit, makeRunBudget, BRIGHT_LINES,
  READ_ONLY_TOOLS, STATE_CHANGING_TOOLS, makeHandler,
} from '../../../infra/openclaw-tower/gate.mjs';
import {
  validateRegistry, findRole, killState, decideRun, judgeRun, pauseAfter,
} from '../../../infra/openclaw-tower/brakes.mjs';
import { normalizeLane, buildReportPrompt } from '../../../infra/openclaw-tower/lane.mjs';
import { composeRecord, parseRecord, renderIssueBody, RECORD_MARKER } from '../lib/openclaw-tower-record.js';
import { deriveTowerStatus, STALE_AFTER_HOURS, fetchOpenclawTower } from '../lib/openclaw-tower.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const TOWER = join(ROOT, 'infra', 'openclaw-tower');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------------------------------------------------------------------------
// 1. The approval gate
// ---------------------------------------------------------------------------
describe('the approval gate in front of OpenClaw (gate.mjs)', () => {
  it('names the five bright lines STEP 4 s4.3 set', () => {
    expect([...BRIGHT_LINES]).toEqual(['money', 'credentials', 'phi', 'theological-voice', 'irreversible-os']);
  });

  it('allows a plain read, and a read never needs approval', () => {
    expect(decide({ toolName: 'read', params: { path: 'notes/today.md' } }).verdict).toBe('allow');
    expect(decide({ toolName: 'session_status', params: {} }).verdict).toBe('allow');
    expect(toHookResult(decide({ toolName: 'memory_search', params: { query: 'choir schedule' } }))).toBeUndefined();
  });

  it('asks a human before anything that sends, posts, writes or changes state', () => {
    for (const toolName of ['message', 'write', 'edit', 'apply_patch', 'sessions_send', 'cron', 'browser', 'gateway']) {
      const d = decide({ toolName, params: { text: 'The choir meets at 6.' } });
      expect(d.verdict, toolName).toBe('approve');
      const h = toHookResult(d, { toolName });
      expect(h.requireApproval.title).toContain(toolName);
      // asked every time: allow-always is withheld
      expect(h.requireApproval.allowedDecisions).toEqual(['allow-once', 'deny']);
    }
  });

  it('denies an unknown tool (default-deny, allowlist-up)', () => {
    const d = decide({ toolName: 'shiny_new_plugin_tool', params: {} });
    expect(d.verdict).toBe('deny');
    expect(toHookResult(d).block).toBe(true);
  });

  describe('every bright line is denied, and no approval can lift it', () => {
    const cases = [
      ['money', { toolName: 'message', params: { text: 'Send the tithe payment of $200 to the church account' } }],
      ['money', { toolName: 'stripe_charge', params: { amount: 50 } }],
      ['credentials', { toolName: 'write', params: { path: 'x.txt', content: 'the admin password is hunter2' } }],
      ['credentials', { toolName: 'read', params: { path: 'C:/Users/creed/.ssh/id_ed25519' } }],
      ['phi', { toolName: 'message', params: { text: 'Patient diagnosis attached for the intake' } }],
      ['phi', { toolName: 'read', params: { path: 'clinic/therapy/progress note.docx' } }],
      ['theological-voice', { toolName: 'message', params: { text: 'Here is this Sunday sermon on grace for the congregation' } }],
      ['irreversible-os', { toolName: 'exec', params: { command: 'rm -rf /home/node' } }],
      ['irreversible-os', { toolName: 'exec', params: { command: 'Remove-Item C:\\data -Recurse -Force' } }],
      ['irreversible-os', { toolName: 'exec', params: { command: 'git push origin main --force' } }],
      ['irreversible-os', { toolName: 'computer', params: { action: 'click' } }],
    ];
    for (const [line, call] of cases) {
      it(`${line}: ${call.toolName}`, () => {
        const d = decide(call);
        expect(d.verdict).toBe('deny');
        expect(d.lines).toContain(line);
        expect(toHookResult(d).block).toBe(true);
      });
    }
  });

  it('reading Scripture is not the theological-voice line; SENDING it in the family name is', () => {
    expect(decide({ toolName: 'read', params: { path: 'bible/john-1.txt' } }).verdict).toBe('allow');
    expect(brightLinesHit({ toolName: 'read', params: { path: 'bible/john-1.txt' } }, { changesState: false })).toEqual([]);
    expect(decide({ toolName: 'message', params: { text: 'bible verse for today' } }).verdict).toBe('deny');
  });

  it('word boundaries keep ordinary params from tripping a line (maxTokens is not a token)', () => {
    expect(brightLinesHit({ toolName: 'read', params: { maxTokens: 400, path: 'lane.json' } })).toEqual([]);
  });

  it('the report-only role (b) may read, and may do nothing else', () => {
    expect(decide({ toolName: 'read', params: { path: 'lane.json' } }, { role: 'report' }).verdict).toBe('allow');
    for (const toolName of ['message', 'write', 'web_fetch', 'exec', 'sessions_send']) {
      expect(decide({ toolName, params: {} }, { role: 'report' }).verdict, toolName).toBe('deny');
    }
  });

  it('the read and state-change lists never overlap (a tool is one or the other)', () => {
    for (const t of READ_ONLY_TOOLS) expect(STATE_CHANGING_TOOLS.has(t), t).toBe(false);
  });

  it('PROVEN TO CATCH: a gate that allowed state changes would fail these pins', () => {
    const broken = (call) => (READ_ONLY_TOOLS.has(call.toolName) || STATE_CHANGING_TOOLS.has(call.toolName) ? 'allow' : 'deny');
    expect(broken({ toolName: 'message' })).not.toBe(decide({ toolName: 'message', params: {} }).verdict);
  });
});

describe('the gate as OpenClaw sees it (the before_tool_call handler)', () => {
  it('blocks, asks, or stays silent exactly as the gate decides', () => {
    const h = makeHandler({ role: 'act', maxToolCallsPerRun: 12 });
    expect(h({ toolName: 'read', params: { path: 'a' }, runId: 'r1' }, {})).toBeUndefined();
    expect(h({ toolName: 'message', params: { text: 'hi' }, runId: 'r1' }, {}).requireApproval).toBeTruthy();
    expect(h({ toolName: 'message', params: { text: 'wire the payment' }, runId: 'r1' }, {}).block).toBe(true);
  });

  it('BUDGET: past the per-run ceiling every call in that run is blocked, other runs are not', () => {
    const h = makeHandler({ role: 'act', maxToolCallsPerRun: 3 });
    for (let i = 0; i < 3; i += 1) expect(h({ toolName: 'read', params: {}, runId: 'r1' }, {})).toBeUndefined();
    const over = h({ toolName: 'read', params: {}, runId: 'r1' }, {});
    expect(over.block).toBe(true);
    expect(over.blockReason).toMatch(/budget/);
    expect(h({ toolName: 'read', params: {}, runId: 'r2' }, {})).toBeUndefined();
  });

  it('makeRunBudget counts per run', () => {
    const b = makeRunBudget({ maxToolCallsPerRun: 1 });
    expect(b.take('x').ok).toBe(true);
    expect(b.take('x').ok).toBe(false);
    expect(b.take('y').ok).toBe(true);
  });

  it('the plugin file registers exactly this handler on before_tool_call', () => {
    const src = readFileSync(join(TOWER, 'plugin', 'poetech-gate.mjs'), 'utf8');
    expect(src).toMatch(/api\.on\(\s*'before_tool_call'/);
    expect(src).toMatch(/import \{ makeHandler \} from '\.\.\/gate\.mjs'/);
    expect(src).toMatch(/id: 'poetech-gate'/);
  });
});

// ---------------------------------------------------------------------------
// 2. The three brakes
// ---------------------------------------------------------------------------
const REG = readJson(join(TOWER, 'registry.json'));
const REPORT = findRole(REG, 'chat-ops-report');

describe('the registry (brakes.mjs validateRegistry)', () => {
  it('the committed registry is sound', () => {
    expect(validateRegistry(REG)).toEqual([]);
  });
  it('PROVEN TO CATCH: a missing cap is a missing brake', () => {
    const r = JSON.parse(JSON.stringify(REG));
    delete r.roles[0].timeout_seconds;
    delete r.roles[0].max_turns;
    const errs = validateRegistry(r);
    expect(errs.join(' ')).toMatch(/timeout_seconds/);
    expect(errs.join(' ')).toMatch(/max_turns/);
  });
  it('PROVEN TO CATCH: a disabled role must say why and when it is re-reviewed', () => {
    const r = JSON.parse(JSON.stringify(REG));
    r.roles[0].enabled = false;
    expect(validateRegistry(r).join(' ')).toMatch(/disabled_why/);
  });
  it('the build/CI role (c) does not exist', () => {
    expect(REG.roles.map((x) => x.role).sort()).toEqual(['act', 'report']);
  });
});

describe('KILL: the record stops it', () => {
  it('armed by record when enabled and ARMED-BY-RECORD is present', () => {
    expect(killState({ entry: REPORT, armedByRecord: true, paused: null }).live).toBe(true);
    expect(existsSync(join(TOWER, 'ARMED-BY-RECORD'))).toBe(true);
  });
  it('registry enabled:false stops it', () => {
    const k = killState({ entry: { ...REPORT, enabled: false }, armedByRecord: true });
    expect(k.live).toBe(false);
    expect(k.reason).toMatch(/enabled:false/);
  });
  it('deleting ARMED-BY-RECORD stops it', () => {
    expect(killState({ entry: REPORT, armedByRecord: false }).reason).toMatch(/ARMED-BY-RECORD/);
  });
  it('an auto-pause holds until a PR raises arm_epoch', () => {
    const paused = { arm_epoch: REPORT.arm_epoch, reason: 'overrun' };
    expect(killState({ entry: REPORT, armedByRecord: true, paused }).live).toBe(false);
    expect(killState({ entry: { ...REPORT, arm_epoch: REPORT.arm_epoch + 1 }, armedByRecord: true, paused }).live).toBe(true);
  });
});

describe('decideRun: kill, hold, lock, budget -- in that order', () => {
  const base = { entry: REPORT, armedByRecord: true, paused: null, lock: { held: false, ageSeconds: 0 }, runsToday: 0 };
  it('goes when every brake is clear', () => {
    expect(decideRun(base).go).toBe(true);
  });
  it('LOCK: a held, fresh lock SKIPS (never stacks)', () => {
    const d = decideRun({ ...base, lock: { held: true, ageSeconds: 30 } });
    expect(d.go).toBe(false);
    expect(d.brake).toBe('lock');
  });
  it('LOCK: a stale lock is reclaimed', () => {
    expect(decideRun({ ...base, lock: { held: true, ageSeconds: REPORT.stale_lock_seconds + 1 } }).go).toBe(true);
  });
  it('BUDGET: runs-per-day ceiling', () => {
    const d = decideRun({ ...base, runsToday: REPORT.max_runs_per_day });
    expect(d.go).toBe(false);
    expect(d.brake).toBe('budget');
  });
  it('HOLD: STREAMING_HOLD (DR-0012) wins over a free lock and budget', () => {
    expect(decideRun({ ...base, streamingHold: true }).brake).toBe('hold');
  });
  it('KILL outranks everything', () => {
    expect(decideRun({ ...base, armedByRecord: false, streamingHold: true }).brake).toBe('kill');
  });
  it('an unsound registry is a no-go', () => {
    expect(decideRun({ ...base, registryErrors: ['x'] }).go).toBe(false);
  });
});

describe('BUDGET after the run, and the auto-pause (judgeRun / pauseAfter)', () => {
  const ok = { ok: true, status: 'ok', final: 'Main is green.', assistantTurns: 1, toolSummary: { calls: 0 } };
  it('a clean run is inside its budget', () => {
    expect(judgeRun({ exitCode: 0, envelope: ok }, REPORT).ok).toBe(true);
  });
  it('a timeout (exit 2) is an overrun and pauses the role', () => {
    const j = judgeRun({ exitCode: 2, envelope: { ...ok, ok: false, status: 'timeout' } }, REPORT);
    expect(j.overrun).toBe(true);
    expect(pauseAfter({ judged: j, entry: REPORT })).toMatchObject({ arm_epoch: REPORT.arm_epoch });
  });
  it('too many turns is an overrun', () => {
    expect(judgeRun({ exitCode: 0, envelope: { ...ok, assistantTurns: REPORT.max_turns + 1 } }, REPORT).overrun).toBe(true);
  });
  it('too many tool calls is an overrun', () => {
    expect(judgeRun({ exitCode: 0, envelope: { ...ok, toolSummary: { calls: REPORT.max_tool_calls + 1 } } }, REPORT).overrun).toBe(true);
  });
  it('the wall-clock kill is an overrun', () => {
    expect(judgeRun({ exitCode: 137, envelope: null, killedAtWallClock: true }, REPORT).overrun).toBe(true);
  });
  it('repeated failures pause it; one failure does not', () => {
    const fail = judgeRun({ exitCode: 1, envelope: { ok: false, status: 'error', error: { message: 'model not found' } } }, REPORT);
    expect(fail.overrun).toBe(false);
    expect(pauseAfter({ judged: fail, consecutiveFailures: 1, entry: REPORT })).toBeNull();
    expect(pauseAfter({ judged: fail, consecutiveFailures: REPORT.max_consecutive_failures, entry: REPORT })).not.toBeNull();
  });
});

// Behavioural: the real runner, a fake OpenClaw CLI, a temp state dir.
describe('run.mjs on a fake OpenClaw: the brakes bite in the real runner', () => {
  let dir;
  let state;
  const fake = (body) => writeFileSync(join(dir, 'fake-openclaw.mjs'), body);
  const run = (...args) => spawnSync(process.execPath, [join(dir, 'run.mjs'), '--role=chat-ops-report', ...args], {
    env: { ...process.env, POETECH_OPENCLAW_STATE: state, POETECH_OPENCLAW_BIN: `${process.execPath} ${join(dir, 'fake-openclaw.mjs')}` },
    encoding: 'utf8',
  });
  const status = () => readJson(join(state, 'status.json'));

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oc-tower-'));
    state = join(dir, 'state');
    for (const f of ['run.mjs', 'brakes.mjs', 'lane.mjs', 'registry.json', 'ARMED-BY-RECORD']) cpSync(join(TOWER, f), join(dir, f));
    writeFileSync(join(dir, 'lane.json'), JSON.stringify({ openCount: 0, open: [], held: [], mainRuns: [] }));
    fake(`process.stdin.resume(); process.stdin.on('end', () => { console.log(JSON.stringify({ ok: true, status: 'ok', final: 'Main is green. Nothing on hold.', assistantTurns: 1, toolSummary: { calls: 0 }, provider: 'ollama', model: 'qwen3:8b' })); });`);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('runs once, writes the report, and frees the lock', () => {
    const r = run();
    expect(r.status).toBe(0);
    expect(status()).toMatchObject({ verdict: 'ran', ok: true, turns: 1, report: 'Main is green. Nothing on hold.' });
    expect(existsSync(join(state, 'chat-ops-report.lock'))).toBe(false);
  });

  it('KILL: without ARMED-BY-RECORD it does not run', () => {
    rmSync(join(dir, 'ARMED-BY-RECORD'));
    run();
    expect(status()).toMatchObject({ verdict: 'no-go', brake: 'kill' });
  });

  it('LOCK: a held lock makes the second fire skip', () => {
    mkdirSync(state, { recursive: true });
    mkdirSync(join(state, 'chat-ops-report.lock'));
    run();
    expect(status()).toMatchObject({ verdict: 'no-go', brake: 'lock' });
  });

  it('BUDGET: the day ceiling stops the next fire', () => {
    mkdirSync(state, { recursive: true });
    writeFileSync(join(state, `runs-chat-ops-report-${new Date().toISOString().slice(0, 10)}.txt`), String(REPORT.max_runs_per_day));
    run();
    expect(status()).toMatchObject({ verdict: 'no-go', brake: 'budget' });
  });

  it('KILL (auto-pause): a timed-out run pauses the role, and the next fire is refused', () => {
    fake(`process.stdin.resume(); process.stdin.on('end', () => { console.log(JSON.stringify({ ok: false, status: 'timeout' })); process.exit(2); });`);
    expect(run().status).toBe(1);
    expect(existsSync(join(state, 'paused-chat-ops-report.json'))).toBe(true);
    fake(`process.stdin.resume(); process.stdin.on('end', () => console.log('{}'));`);
    run();
    expect(status()).toMatchObject({ verdict: 'no-go', brake: 'kill' });
    expect(status().reason).toMatch(/auto-paused/);
  });

  it('HOLD: --streaming-hold refuses the run', () => {
    run('--streaming-hold');
    expect(status()).toMatchObject({ verdict: 'no-go', brake: 'hold' });
  });

  it('the fake CLI receives the pinned report config, the model and the timeout', () => {
    fake(`process.stdin.resume(); process.stdin.on('end', () => { console.log(JSON.stringify({ ok: true, status: 'ok', final: process.argv.slice(2).join(' ') + ' role=' + process.env.POETECH_OPENCLAW_ROLE, assistantTurns: 1 })); });`);
    run();
    const rep = status().report;
    expect(rep).toContain('agent exec');
    expect(rep).toContain('report.json');
    expect(rep).toContain('--model ollama/qwen3:8b');
    expect(rep).toContain(`--timeout ${REPORT.timeout_seconds}`);
    expect(rep).toContain('role=report');
  });

  it('--status reads the state and changes nothing', () => {
    const r = run('--status');
    const s = JSON.parse(r.stdout.trim().split('\n').pop());
    expect(s.lock).toEqual({ held: false, ageSeconds: 0 });
    expect(existsSync(join(state, 'status.json'))).toBe(false);
    expect(readdirSync(state).filter((f) => f.startsWith('runs-'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. The config: Ollama-local-first on the tower's GPU
// ---------------------------------------------------------------------------
describe('the OpenClaw configs (openclaw.json, report.json)', () => {
  const gw = readJson(join(TOWER, 'openclaw.json'));
  const rep = readJson(join(TOWER, 'report.json'));
  const refs = (c) => [c.agents.defaults.model.primary, ...(c.agents.defaults.model.fallbacks || [])];

  for (const [name, c] of [['openclaw.json', gw], ['report.json', rep]]) {
    it(`${name}: local only -- one provider, ollama, on the tower; every model ref is ollama/`, () => {
      expect(Object.keys(c.models.providers)).toEqual(['ollama']);
      const p = c.models.providers.ollama;
      expect(p.api).toBe('ollama');
      expect(p.baseUrl).toBe('http://host.docker.internal:11434');
      expect(p.baseUrl).not.toMatch(/ollama\.com|\/v1$/);
      for (const r of refs(c)) expect(r.startsWith('ollama/'), r).toBe(true);
      expect(c.agents.defaults.model.fallbacks).toBeUndefined();
    });
    it(`${name}: the 4070 model, bounded to what 12 GB holds, and it yields VRAM (DR-0012)`, () => {
      const m = c.models.providers.ollama.models[0];
      expect(m.id).toBe('qwen3:8b');
      expect(c.agents.defaults.model.primary).toBe('ollama/qwen3:8b');
      expect(m.contextTokens).toBe(m.params.num_ctx);
      expect(m.params.num_ctx).toBeLessThanOrEqual(32768);
      expect(m.params.keep_alive).toBe(0);
    });
    it(`${name}: the gate plugin is loaded from the read-only mount`, () => {
      expect(c.plugins.load.paths).toEqual(['/home/node/.openclaw/poetech/plugin/poetech-gate.mjs']);
      expect(c.plugins.entries['poetech-gate'].enabled).toBe(true);
    });
    it(`${name}: no vendor key anywhere`, () => {
      expect(JSON.stringify(c)).not.toMatch(/sk-|ANTHROPIC|OPENAI|GEMINI|api\.openai|anthropic\.com/i);
    });
  }

  it('openclaw.json: non-main sessions sandboxed, pairing DM policy, no channel enabled', () => {
    expect(gw.agents.defaults.sandbox.mode).toBe('non-main');
    for (const ch of Object.values(gw.channels || {})) {
      expect(['pairing', 'allowlist']).toContain(ch.dmPolicy);
      expect(ch.enabled).toBe(false);
    }
  });

  it('openclaw.json: the dangerous tool groups are denied at the policy layer too', () => {
    for (const g of ['group:runtime', 'group:nodes', 'group:automation', 'group:ui']) expect(gw.tools.deny).toContain(g);
    expect(gw.tools.loopDetection.enabled).toBe(true);
  });

  it('report.json: the pilot has no tools at all', () => {
    expect(rep.tools.profile).toBe('minimal');
    for (const g of ['group:runtime', 'group:fs', 'group:web', 'group:messaging', 'group:sessions', 'group:automation']) expect(rep.tools.deny).toContain(g);
  });

  it('only keys verified against OpenClaw 2026.9.6 are used (the real validator rejected channels.defaults.dmPolicy)', () => {
    const allowedTop = ['gateway', 'models', 'agents', 'tools', 'plugins', 'channels'];
    for (const k of Object.keys(gw)) expect(allowedTop, k).toContain(k);
    expect(gw.channels.defaults).toBeUndefined();
  });

  it('the compose pins the official image by tag AND digest, loopback-only, no docker socket', () => {
    const y = readFileSync(join(TOWER, 'docker-compose.yml'), 'utf8');
    expect(y).toMatch(/ghcr\.io\/openclaw\/openclaw:2026\.9\.6@sha256:[0-9a-f]{64}/);
    expect(y).toMatch(/"127\.0\.0\.1:18789:18789"/);
    expect(y).not.toMatch(/^\s*-\s*\/var\/run\/docker\.sock/m);
    expect(y).toMatch(/\.\/:\/home\/node\/\.openclaw\/poetech:ro/);
    expect(y).toMatch(/no-new-privileges:true/);
  });

  it('the lane validates the config inside the pinned image BEFORE it starts the gateway', () => {
    const wf = readFileSync(join(ROOT, '.github', 'workflows', 'openclaw-tower.yml'), 'utf8');
    const validate = wf.indexOf('config validate --json');
    const start = wf.indexOf('docker compose up -d openclaw-gateway');
    expect(validate).toBeGreaterThan(0);
    expect(start).toBeGreaterThan(validate);
    expect(wf).toMatch(/concurrency:\s*\n\s*group: openclaw-tower/);
    expect(wf).toMatch(/Stop what the record says is off/);
  });
});

// ---------------------------------------------------------------------------
// 4. Lane facts and the pilot's prompt
// ---------------------------------------------------------------------------
describe('the report-only pilot is handed facts (lane.mjs)', () => {
  const lane = normalizeLane({
    pulls: [
      { number: 1840, title: 'OpenClaw on the towers', head: { ref: 'claude/openclaw-on-the-towers' }, labels: [], draft: false },
      { number: 1838, title: 'A parked change', head: { ref: 'claude/x' }, labels: [{ name: 'hold' }] },
    ],
    runs: { workflow_runs: [{ name: 'CI', head_branch: 'main', status: 'completed', conclusion: 'success' }, { name: 'CI', head_branch: 'feature', conclusion: 'failure' }] },
    measuredAt: '2026-09-29T12:00:00Z',
  });
  it('carries open PRs, holds and main runs only', () => {
    expect(lane.openCount).toBe(2);
    expect(lane.held).toEqual([1838]);
    expect(lane.mainRuns).toEqual([{ name: 'CI', status: 'completed', conclusion: 'success', at: null }]);
  });
  it('the prompt states report-only and carries the facts', () => {
    const p = buildReportPrompt(lane);
    expect(p).toMatch(/Report only/);
    expect(p).toMatch(/never guess/);
    expect(p).toContain('#1838 [hold]');
    expect(p).toContain('CI: success');
  });
  it('missing facts read as unknown, never invented', () => {
    expect(buildReportPrompt(null)).toMatch(/Measured at: unknown/);
  });
});

// ---------------------------------------------------------------------------
// 5. The surface: record round trip and derivation, unknown when unknown
// ---------------------------------------------------------------------------
describe('the witness record and the OpsBoard derivation', () => {
  const NOW = Date.parse('2026-09-29T12:00:00Z');
  const roles = [
    { name: 'chat-ops-report', role: 'report', live: true, reason: 'armed by record' },
    { name: 'family-agent-eval', role: 'act', live: true, reason: 'armed by record' },
  ];
  const good = composeRecord({
    measuredAt: '2026-09-29T11:00:00Z', host: 'tlcmediadpt', reachable: true, road: 'key',
    healthz: '200', readyz: '200', containerState: 'running', model: 'qwen3:8b', modelPresent: true,
    status: { at: '2026-09-29T11:00:05Z', loop: 'chat-ops-report', verdict: 'ran', ok: true, reason: 'inside its budget', turns: 1, toolCalls: 0, report: 'Main is green.' },
    roles, budgetOk: true, lockHeld: false,
  });

  it('round-trips through the issue body', () => {
    const body = renderIssueBody(good);
    expect(body).toContain(RECORD_MARKER);
    expect(parseRecord(body)).toEqual(good);
  });
  it('an unreadable body is null, never a guess', () => {
    expect(parseRecord('no record here')).toBeNull();
    expect(parseRecord(`<!-- ${RECORD_MARKER} -->\n\`\`\`json\n{broken\n\`\`\``)).toBeNull();
  });

  it('up: healthz 200, model pulled, brakes armed', () => {
    const s = deriveTowerStatus(good, { nowMs: NOW });
    expect(s.state).toBe('up');
    expect(s.model).toEqual({ name: 'qwen3:8b', present: true });
    expect(s.lastRun.verdict).toBe('ran');
    expect(s.brakes).toMatchObject({ budget: true, lock: true, kill: true });
    expect(s.reportLive).toBe(true);
  });
  it('UNKNOWN: no record', () => {
    expect(deriveTowerStatus(null, { nowMs: NOW }).state).toBe('unknown');
  });
  it('UNKNOWN: the witness could not reach the tower -- with the reason', () => {
    const s = deriveTowerStatus(composeRecord({ measuredAt: '2026-09-29T11:00:00Z', reachable: false, reason: 'the tower refuses the CI key for creed' }), { nowMs: NOW });
    expect(s.state).toBe('unknown');
    expect(s.reason).toMatch(/refuses the CI key/);
    expect(s.brakes).toMatchObject({ budget: null, lock: null, kill: null });
  });
  it('UNKNOWN: a stale record is not a live reading', () => {
    const old = { ...good, measuredAt: new Date(NOW - (STALE_AFTER_HOURS + 1) * 3600000).toISOString() };
    expect(deriveTowerStatus(old, { nowMs: NOW }).state).toBe('unknown');
  });
  it('UNKNOWN: health not read', () => {
    expect(deriveTowerStatus({ ...good, gateway: { ...good.gateway, healthz: null } }, { nowMs: NOW }).state).toBe('unknown');
  });
  it('down: gateway not answering', () => {
    expect(deriveTowerStatus({ ...good, gateway: { ...good.gateway, healthz: 0 } }, { nowMs: NOW }).state).toBe('down');
  });
  it('down: model not pulled', () => {
    expect(deriveTowerStatus({ ...good, model: { name: 'qwen3:8b', present: false } }, { nowMs: NOW }).state).toBe('down');
  });
  it('kill holding: a role switched off by record is named', () => {
    const off = { ...good, brakes: { ...good.brakes, kill: [roles[0], { ...roles[1], live: false, reason: 'registry enabled:false' }] } };
    const s = deriveTowerStatus(off, { nowMs: NOW });
    expect(s.brakes.kill).toBe(false);
    expect(s.brakes.killReason).toMatch(/family-agent-eval: registry enabled:false/);
  });
  it('PROVEN TO CATCH: a derivation that defaulted to up would disagree on every unknown case', () => {
    const naive = (r) => (r && r.gateway && r.gateway.healthz === 200 ? 'up' : 'up');
    expect(naive(null)).not.toBe(deriveTowerStatus(null, { nowMs: NOW }).state);
  });

  it('fetch reads the labeled issue live and degrades to unknown on failure', async () => {
    const body = renderIssueBody({ ...good, measuredAt: new Date(Date.now() - 3600000).toISOString() });
    const okFetch = async () => ({ status: 200, ok: true, headers: { get: () => null }, json: async () => [{ title: 'openclaw-tower: OpenClaw on the 4070 tower -- witness record', body, html_url: 'https://github.com/x/1' }] });
    const got = await fetchOpenclawTower({ fetch: okFetch });
    expect(got.ok).toBe(true);
    expect(got.status.state).toBe('up');
    expect(got.url).toBe('https://github.com/x/1');
    const bad = await fetchOpenclawTower({ fetch: async () => { throw new Error('offline'); } });
    expect(bad.ok).toBe(false);
    expect(bad.status.state).toBe('unknown');
  });
});
