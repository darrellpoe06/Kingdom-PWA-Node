// On-site turnkey session — proven-to-catch. Guards the ordered sequence, that
// every step carries an ACTION + PROOF (execute-not-figure-out), the priority
// path (wall lit + tower on network as build node), and the lane coordination.
import { describe, it, expect } from 'vitest';
import {
  SESSION_GOAL, PRIORITY_PATH, PHASES, LANES,
  allSteps, isPriority, sessionProgress,
} from '../lib/onsite-session.js';

describe('the session is one technique: network -> wall -> tower build node', () => {
  it('phases run in order 0..5 ending with lock-in', () => {
    const ids = PHASES.map((p) => p.id);
    expect(ids).toEqual(['stage', 'network', 'wall', 'firstlight', 'tower', 'lockin']);
  });
  it('the goal names the two birds (wall + tower build node)', () => {
    expect(SESSION_GOAL).toMatch(/build node/i);
    expect(SESSION_GOAL).toMatch(/one technique/i);
  });
  it('network backbone comes BEFORE the wall and the tower', () => {
    const order = PHASES.map((p) => p.id);
    expect(order.indexOf('network')).toBeLessThan(order.indexOf('wall'));
    expect(order.indexOf('network')).toBeLessThan(order.indexOf('tower'));
  });
});

describe('every step is execute-not-figure-out (action + proof)', () => {
  it('each step has a stable id, an ACTION, and a PROOF', () => {
    for (const s of allSteps()) {
      expect(s.id, 'id').toBeTruthy();
      expect(s.action, `${s.id} action`).toBeTruthy();
      expect(s.proof, `${s.id} proof`).toBeTruthy();
    }
  });
  it('step ids are unique', () => {
    const ids = allSteps().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the critical safety + wiring facts are in the steps', () => {
  const byId = Object.fromEntries(allSteps().map((s) => [s.id, s]));
  it('LED data is DIRECT, one per column, never through a switch', () => {
    expect(byId['s2-led-data'].action).toMatch(/per COLUMN/i);
    expect(byId['s2-led-data'].action).toMatch(/NEVER through a switch/i);
  });
  it('power-on is staggered (inrush)', () => {
    expect(byId['s2-power'].action).toMatch(/STAGGER/i);
  });
  it('the tower is on its OWN circuit, not the wall circuits', () => {
    expect(byId['s4-power'].action).toMatch(/OWN circuit/i);
    expect(byId['s4-power'].action).toMatch(/NOT the wall/i);
  });
  it('first light expects lit-but-scrambled as a WIN', () => {
    expect(byId['s3-proof'].proof).toMatch(/scrambled|repeated|partial/i);
    expect(byId['s3-proof'].proof).toMatch(/WIN/);
  });
  it('the build node serves the app over LAN AND Tailscale', () => {
    expect(byId['s4-buildnode'].proof).toMatch(/LAN/);
    expect(byId['s4-buildnode'].proof).toMatch(/Tailscale/);
  });
});

describe('priority path = wall lit + tower on network as build node', () => {
  it('includes the wall-lit + tower-build-node steps, excludes lock-in polish', () => {
    expect(PRIORITY_PATH).toContain('s3-proof');       // wall lit
    expect(PRIORITY_PATH).toContain('s4-buildnode');   // tower build node
    expect(PRIORITY_PATH).not.toContain('s5-reboot');  // lock-in is not the first-pass
  });
  it('isPriority resolves membership', () => {
    expect(isPriority('s4-buildnode')).toBe(true);
    expect(isPriority('s5-label')).toBe(false);
  });
  it('every priority id is a real step', () => {
    const ids = new Set(allSteps().map((s) => s.id));
    for (const id of PRIORITY_PATH) expect(ids.has(id), id).toBe(true);
  });
});

describe('lane coordination — one technique, not separate tracks', () => {
  it('names the GPU/LLM lane and the NAS-driver lane with what they depend on', () => {
    const llm = LANES.find((l) => l.lane === 'local_2afc8728');
    const drv = LANES.find((l) => l.lane === 'local_0c6134f0');
    expect(llm.dependsOn).toMatch(/tower on the network|static IP|Tailscale/i);
    expect(drv.role).toMatch(/driver/i);
  });
});

describe('sessionProgress — tracks overall + priority completion', () => {
  it('counts done vs total and priority subset', () => {
    const p0 = sessionProgress({});
    expect(p0.done).toBe(0);
    expect(p0.total).toBe(allSteps().length);
    expect(p0.priorityTotal).toBe(PRIORITY_PATH.length);
    const p1 = sessionProgress({ 's3-proof': true, 's4-buildnode': true });
    expect(p1.done).toBe(2);
    expect(p1.priorityDone).toBe(2);
  });
  it('allDone flips only when every step is checked', () => {
    const map = Object.fromEntries(allSteps().map((s) => [s.id, true]));
    expect(sessionProgress(map).allDone).toBe(true);
  });
});
