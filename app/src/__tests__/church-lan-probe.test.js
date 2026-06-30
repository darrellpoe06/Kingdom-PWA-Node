// @vitest-environment node
//
// church-lan-probe -- proven-to-catch tests for the on-church-network runner's
// pure deterministic core (DR-0076 verification doctrine; anti-theater: a gate
// that only ever passes is itself a lie, so each test PROVES the gate catches its
// failure mode). Logic in scripts/lib/church-lan-probe.mjs. Design note:
// docs/99-session-notes/2026-06-29-on-church-network-agent-runner-design.md
import { describe, it, expect } from 'vitest';
import {
  isReadOnlyCommand,
  buildProbePlan,
  classifyProbeResult,
  shapeSnapshot,
  churchRunnerBrakeGate,
  PROBE_KINDS,
} from '../../../scripts/lib/church-lan-probe.mjs';

describe('isReadOnlyCommand -- the LOOK-but-never-TOUCH invariant', () => {
  it('ACCEPTS genuine read-only probe commands', () => {
    expect(isReadOnlyCommand('ping -c 2 -W 1 192.168.1.50')).toBe(true);
    expect(isReadOnlyCommand('curl -fsS -m 3 http://192.168.1.50:8080/health')).toBe(true);
    expect(isReadOnlyCommand('nc -z -w 3 192.168.1.50 5961')).toBe(true);
    expect(isReadOnlyCommand('netsh advfirewall show allprofiles state')).toBe(true);
    expect(isReadOnlyCommand('tailscale status --json')).toBe(true);
  });

  it('REJECTS commands that would mutate / configure / restart a device', () => {
    expect(isReadOnlyCommand('netsh advfirewall set allprofiles state off')).toBe(false);
    expect(isReadOnlyCommand('docker restart church-ollama')).toBe(false);
    expect(isReadOnlyCommand('tailscale up --hostname=church')).toBe(false);
    expect(isReadOnlyCommand('reboot')).toBe(false);
    expect(isReadOnlyCommand('rm -rf /state')).toBe(false);
    expect(isReadOnlyCommand('curl -X POST http://192.168.1.1/api/reboot')).toBe(false);
    expect(isReadOnlyCommand('systemctl restart unifi')).toBe(false);
  });

  it('REJECTS output redirection (a read that secretly writes)', () => {
    expect(isReadOnlyCommand('curl -fsS http://x/ > /state/out.json')).toBe(false);
    expect(isReadOnlyCommand('tailscale status | tee /tmp/peers')).toBe(false);
  });

  it('REJECTS empty / non-string input (fail closed)', () => {
    expect(isReadOnlyCommand('')).toBe(false);
    expect(isReadOnlyCommand('   ')).toBe(false);
    expect(isReadOnlyCommand(null)).toBe(false);
    expect(isReadOnlyCommand(undefined)).toBe(false);
  });
});

describe('buildProbePlan -- deterministic plan, every step read-only', () => {
  const targets = [
    { id: 'atem', label: 'ATEM switcher', role: 'video', ip: '192.168.1.40', probe: 'ping' },
    { id: 'legion-left', label: 'Lenovo Legion (NDI->HDMI bridge)', role: 'ndi-bridge', ip: '192.168.1.41', probe: 'ping' },
    { id: 'ndi-disc', label: 'NDI discovery', role: 'ndi', ip: '192.168.1.42', port: 5959, probe: 'ndi-discovery' },
    { id: 'unifi', label: 'UniFi controller', role: 'network', ip: 'SME-CONFIRM', probe: 'unifi-clients' },
    { id: 'fw', label: 'Windows Firewall (runner host)', role: 'host', ip: 'SME-CONFIRM', probe: 'firewall-state' },
  ];

  it('emits one step per device, in order', () => {
    const plan = buildProbePlan(targets);
    expect(plan).toHaveLength(5);
    expect(plan.map((s) => s.id)).toEqual(['atem', 'legion-left', 'ndi-disc', 'unifi', 'fw']);
  });

  it('EVERY emitted command is read-only (the core safety property)', () => {
    const plan = buildProbePlan(targets);
    for (const step of plan) {
      expect(step.readOnly).toBe(true);
      if (step.command !== null) {
        expect(isReadOnlyCommand(step.command), `step ${step.id}: ${step.command}`).toBe(true);
      }
    }
  });

  it('flags an unknown IP as SME (null command, never invents an address)', () => {
    const plan = buildProbePlan(targets);
    const unifi = plan.find((s) => s.id === 'unifi');
    expect(unifi.sme).toBe(true);
    expect(unifi.command).toBeNull();
    expect(unifi.target).toBe('SME-CONFIRM');
  });

  it('host-local probes (firewall-state) need no IP and are NOT marked SME', () => {
    const plan = buildProbePlan(targets);
    const fw = plan.find((s) => s.id === 'fw');
    expect(fw.sme).toBe(false);
    expect(fw.command).toContain('netsh advfirewall show');
  });

  it('honors the maxSteps budget ceiling', () => {
    const plan = buildProbePlan(targets, { maxSteps: 2 });
    expect(plan).toHaveLength(2);
  });

  it('throws on an unknown probe kind (no silent skip)', () => {
    expect(() => buildProbePlan([{ id: 'x', ip: '1.1.1.1', probe: 'configure' }])).toThrow();
    expect(PROBE_KINDS).not.toContain('configure');
  });
});

describe('classifyProbeResult -- honest status, never fabricated', () => {
  const upStep = { id: 'atem', label: 'ATEM', role: 'video', kind: 'ping', sme: false };
  const smeStep = { id: 'unifi', label: 'UniFi', role: 'network', kind: 'unifi-clients', sme: true };

  it('a successful probe is up with latency', () => {
    const r = classifyProbeResult(upStep, { ok: true, ms: 4, stdout: '2 packets received' });
    expect(r.status).toBe('up');
    expect(r.reachable).toBe(true);
    expect(r.latencyMs).toBe(4);
  });

  it('a failed / timed-out probe is down', () => {
    expect(classifyProbeResult(upStep, { ok: false, code: 1, stderr: 'no route' }).status).toBe('down');
    expect(classifyProbeResult(upStep, { ok: false, timedOut: true }).status).toBe('down');
  });

  it('an SME-CONFIRM target is UNKNOWN -- never guessed up or down', () => {
    const r = classifyProbeResult(smeStep, {});
    expect(r.status).toBe('unknown');
    expect(r.reachable).toBeNull();
    expect(r.detail).toMatch(/not yet confirmed/i);
  });
});

describe('shapeSnapshot -- honest summary + SME-pending surfaced', () => {
  it('counts up/down/unknown and lists what is still SME-pending', () => {
    const steps = [
      { id: 'atem', label: 'ATEM', role: 'video', kind: 'ping', sme: false },
      { id: 'legion', label: 'Legion', role: 'ndi-bridge', kind: 'ping', sme: false },
      { id: 'unifi', label: 'UniFi', role: 'network', kind: 'unifi-clients', sme: true },
    ];
    const results = [
      classifyProbeResult(steps[0], { ok: true, ms: 3 }),
      classifyProbeResult(steps[1], { ok: false, code: 1 }),
      classifyProbeResult(steps[2], {}),
    ];
    const snap = shapeSnapshot(steps, results, '2026-06-29T12:00:00Z', { runner: 'church-runner' });
    expect(snap.generated_at).toBe('2026-06-29T12:00:00Z');
    expect(snap.summary).toEqual({ total: 3, up: 1, down: 1, unknown: 1 });
    expect(snap.sme_pending).toEqual(['unifi']);
    expect(snap.devices).toHaveLength(3);
  });
});

describe('churchRunnerBrakeGate -- proven-to-catch on all three brakes', () => {
  // a fully-armed, in-budget, unlocked state (probe + dispatch both clear)
  const armed = {
    killSwitch: false,
    probeArmed: true,
    dispatchArmed: true,
    lockHeld: false,
    stepBudget: { max: 40, requested: 12 },
    usdBudget: { perTask: 0.5, daily: 5, spent: 1 },
  };

  it('ships INERT: default (empty) state blocks both probe and dispatch', () => {
    const g = churchRunnerBrakeGate({});
    expect(g.probe.go).toBe(false);
    expect(g.dispatch.go).toBe(false);
    expect(g.probe.reason).toMatch(/kill-switch/i);
  });

  it('KILL-SWITCH brake: engaged kill-switch blocks even a read-only look', () => {
    const g = churchRunnerBrakeGate({ ...armed, killSwitch: true });
    expect(g.probe.go).toBe(false);
    expect(g.dispatch.go).toBe(false);
    expect(g.probe.reason).toMatch(/kill-switch/i);
  });

  it('CONCURRENCY brake: a held single-flight lock blocks the probe', () => {
    const g = churchRunnerBrakeGate({ ...armed, lockHeld: true });
    expect(g.probe.go).toBe(false);
    expect(g.probe.reason).toMatch(/lock/i);
  });

  it('BUDGET brake (steps): an unset or exceeded step ceiling blocks the probe', () => {
    expect(churchRunnerBrakeGate({ ...armed, stepBudget: { max: 0, requested: 1 } }).probe.go).toBe(false);
    expect(churchRunnerBrakeGate({ ...armed, stepBudget: { max: 10, requested: 11 } }).probe.go).toBe(false);
  });

  it('ARM brake: probe needs PROBE_ARMED; dispatch additionally needs DISPATCH_ARMED', () => {
    expect(churchRunnerBrakeGate({ ...armed, probeArmed: false }).probe.go).toBe(false);
    // probe armed but dispatch NOT armed: may look, may not dispatch
    const g = churchRunnerBrakeGate({ ...armed, dispatchArmed: false });
    expect(g.probe.go).toBe(true);
    expect(g.dispatch.go).toBe(false);
    expect(g.dispatch.reason).toMatch(/dispatch disarmed/i);
  });

  it('BUDGET brake ($): dispatch needs a set, under-ceiling $ budget', () => {
    expect(churchRunnerBrakeGate({ ...armed, usdBudget: { perTask: 0, daily: 0, spent: 0 } }).dispatch.go).toBe(false);
    expect(churchRunnerBrakeGate({ ...armed, usdBudget: { perTask: 1, daily: 5, spent: 5 } }).dispatch.go).toBe(false);
  });

  it('ALL brakes clear: probe and dispatch both GO (so green means something)', () => {
    const g = churchRunnerBrakeGate(armed);
    expect(g.probe.go).toBe(true);
    expect(g.dispatch.go).toBe(true);
  });
});
