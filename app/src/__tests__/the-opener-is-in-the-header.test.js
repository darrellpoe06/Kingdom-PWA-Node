// @vitest-environment node
// =============================================================================
// The opener is in the header, it will not open by accident, and it never
// claims a door moved when nobody checked
// =============================================================================
// Darrell 2026-10-08: "Let's add the garage door opener and any system opener
// to the header in PoeTech App... so if your listening to you lesson as you
// drive when you get home the garage door opener button is there for easy
// access... make sense?"
//
// Three things are gated here, and every one of them is a real failure this
// feature invites rather than a hypothetical:
//   1. NOTHING IS PAINTED. No opener row, no button. A kind the NAS adapter
//      cannot drive, no button. A disabled row, no button. (DR-0061)
//   2. IT WILL NOT OPEN BY ACCIDENT. A press is a HOLD, letting go early sends
//      nothing, and a second press inside the cooldown is refused rather than
//      queued, because a door that gets two presses stops halfway.
//   3. IT NEVER LIES ABOUT THE DOOR. A press with no clear answer reads
//      'unknown' and tells the driver to look. Only a door that actually
//      reported movement reads 'confirmed'. (DR-0076)
//
// Proven-to-catch: each assertion below fails against the obvious wrong
// implementation (a tap instead of a hold, a queued second press, an optimistic
// 'opened', a demo opener in the list).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  openersFrom, openerToOffer, saveLastOpener, loadLastOpener,
  holdProgress, holdComplete, pressAllowed, pressBody, readPressResult,
  describeOpener, stillInFlight, knownKind, OPENER_KINDS,
  HOLD_MS, COOLDOWN_MS, PRESS_TIMEOUT_MS, LAST_OPENER_KEY, PRESS_PATH,
} from '../lib/openers.js';

/** A localStorage that lives in this test only. */
function store() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    size: () => m.size,
  };
}

const garage = { id: 'g1', name: 'Garage', kind: 'relay-http', place: 'House', enabled: true, reports: false };
const gate = { id: 'g2', name: 'Front gate', kind: 'mqtt', place: 'Drive', enabled: true, reports: true };

describe('nothing is painted: no real opener, no button', () => {
  it('an empty list offers nothing', () => {
    expect(openersFrom([])).toEqual([]);
    expect(openersFrom(null)).toEqual([]);
    expect(openerToOffer([], 'g1')).toBe(null);
  });

  it('a row the NAS adapter cannot drive is dropped, not drawn', () => {
    // The whole point: a button for a device nobody can press is worse than none.
    expect(openersFrom([{ id: 'x', name: 'Mystery', kind: 'telepathy', enabled: true }])).toEqual([]);
    expect(knownKind('telepathy')).toBe(false);
    for (const k of OPENER_KINDS) expect(knownKind(k.kind)).toBe(true);
  });

  it('a disabled row, or one with no name, is dropped', () => {
    expect(openersFrom([{ ...garage, enabled: false }])).toEqual([]);
    expect(openersFrom([{ ...garage, name: '   ' }])).toEqual([]);
    expect(openersFrom([{ ...garage, id: '' }])).toEqual([]);
  });

  it('a real row comes through with its own name and place, trimmed', () => {
    expect(openersFrom([{ ...garage, name: '  Garage  ', place: ' House ' }])).toEqual([
      { id: 'g1', name: 'Garage', kind: 'relay-http', place: 'House', reports: false },
    ]);
  });

  it('a door that does not report its position SAYS so in its own label', () => {
    expect(describeOpener(openersFrom([garage])[0])).toBe('Garage — House (does not report its position)');
    expect(describeOpener(openersFrom([gate])[0])).toBe('Front gate — Drive');
    expect(describeOpener(null)).toBe('No opener registered');
  });
});

describe('the header offers the one he used last', () => {
  it('remembers across a reset, and forgets on request', () => {
    const st = store();
    expect(saveLastOpener('g2', st)).toBe(true);
    expect(loadLastOpener(st)).toBe('g2');
    expect(st.getItem(LAST_OPENER_KEY)).toBe('g2');
    expect(saveLastOpener('', st)).toBe(true);
    expect(loadLastOpener(st)).toBe('');
    expect(st.size()).toBe(0);
  });

  it('offers the remembered one, and falls back to the first when it is gone', () => {
    const list = openersFrom([garage, gate]);
    expect(openerToOffer(list, 'g2').id).toBe('g2');
    expect(openerToOffer(list, 'deleted').id).toBe('g1');
    expect(openerToOffer(list, '').id).toBe('g1');
  });

  it('a storage that refuses to answer loses the memory and nothing else', () => {
    const bad = { getItem: () => { throw new Error('private mode'); }, setItem: () => { throw new Error('private mode'); }, removeItem: () => {} };
    expect(loadLastOpener(bad)).toBe('');
    expect(saveLastOpener('g1', bad)).toBe(false);
    expect(openerToOffer(openersFrom([garage, gate]), loadLastOpener(bad)).id).toBe('g1');
  });
});

describe('it will not open by accident', () => {
  it('a tap sends nothing: the hold has to finish', () => {
    expect(holdProgress({ startedAt: 1000, now: 1000 })).toBe(0);
    expect(holdComplete({ startedAt: 1000, now: 1000 })).toBe(false);
    // A real thumb tap is tens of milliseconds. It must not reach the door.
    expect(holdComplete({ startedAt: 1000, now: 1060 })).toBe(false);
    expect(holdComplete({ startedAt: 1000, now: 1000 + HOLD_MS - 1 })).toBe(false);
    expect(holdComplete({ startedAt: 1000, now: 1000 + HOLD_MS })).toBe(true);
  });

  it('the hold fills smoothly, so the button can show how far it has got', () => {
    expect(holdProgress({ startedAt: 0, now: 5000 })).toBe(0); // never started
    expect(holdProgress({ startedAt: 1000, now: 1000 + HOLD_MS / 2 })).toBeCloseTo(0.5, 5);
    expect(holdProgress({ startedAt: 1000, now: 1e12 })).toBe(1); // never over 1
  });

  it('a second press inside the cooldown is REFUSED, never queued', () => {
    const o = openersFrom([garage])[0];
    expect(pressAllowed({ opener: o, lastPressAt: 0, now: 5000 })).toEqual({ ok: true });
    const blocked = pressAllowed({ opener: o, lastPressAt: 5000, now: 5000 + COOLDOWN_MS - 3000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.why).toMatch(/stopped halfway/);
    expect(blocked.why).toMatch(/3 more seconds/);
    expect(pressAllowed({ opener: o, lastPressAt: 5000, now: 5000 + COOLDOWN_MS }).ok).toBe(true);
  });

  it('one second left is said in the singular, because the sentence is read aloud in a car', () => {
    const o = openersFrom([garage])[0];
    expect(pressAllowed({ opener: o, lastPressAt: 0 + 1, now: 1 + COOLDOWN_MS - 1 }).why).toMatch(/1 more second\b/);
  });

  it('a press already in the air blocks another, and offline says so plainly', () => {
    const o = openersFrom([garage])[0];
    expect(pressAllowed({ opener: o, inFlight: true }).why).toMatch(/already on its way/);
    expect(pressAllowed({ opener: o, online: false }).why).toMatch(/offline/);
  });

  it('with no opener registered there is nothing to press, and it says that', () => {
    expect(pressAllowed({ opener: null }).why).toMatch(/No opener is registered/);
  });
});

describe('the press goes by the same-origin road, and carries no device detail', () => {
  it('the path is the sovereign route, never the Funnel URL (DR-0083)', () => {
    expect(PRESS_PATH).toBe('/openers/press');
    expect(PRESS_PATH.startsWith('/')).toBe(true);
    expect(PRESS_PATH).not.toMatch(/ts\.net|http/);
  });

  it('the body names the opener by its id, and nothing about the hardware', () => {
    const body = pressBody(openersFrom([garage])[0]);
    expect(body.opener).toBe('g1');
    expect(body.kind).toBe('relay-http');
    // No address, no pin, no topic, no URL: only the NAS knows those.
    expect(Object.keys(body).sort()).toEqual(['at', 'kind', 'opener']);
    expect(JSON.stringify(body)).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    expect(pressBody(null)).toBe(null);
  });
});

describe('it never claims a door moved when nobody checked (DR-0076)', () => {
  it('a confirmed move is the ONLY thing that reads confirmed', () => {
    const r = readPressResult({ ok: true, pressed: true, confirmed: true });
    expect(r.state).toBe('confirmed');
    expect(r.text).toMatch(/reported that it moved/);
  });

  it('a press on a door that cannot report reads SENT, and tells him to look', () => {
    const r = readPressResult({ ok: true, pressed: true });
    expect(r.state).toBe('sent');
    expect(r.state).not.toBe('confirmed');
    expect(r.text).toMatch(/look before you drive away/);
  });

  it('silence reads UNKNOWN, never opened', () => {
    for (const res of [null, undefined, {}, 'yes', { ok: true }, { pressed: true }]) {
      const r = readPressResult(res);
      expect(r.state, JSON.stringify(res)).toBe('unknown');
      expect(r.text).toMatch(/did not answer/);
    }
  });

  it('a failure carries the house’s own reason, not a generic apology', () => {
    const r = readPressResult({ ok: false, reason: 'The relay did not answer on the house network.' });
    expect(r.state).toBe('failed');
    expect(r.text).toBe('The relay did not answer on the house network.');
    // A failure with no reason is not dressed up as one.
    expect(readPressResult({ ok: false }).state).toBe('unknown');
    expect(readPressResult({ ok: false, reason: '   ' }).state).toBe('unknown');
  });

  it('a press that never came back stops being in flight and becomes unknown', () => {
    expect(stillInFlight({ sentAt: 0 })).toBe(false);
    expect(stillInFlight({ sentAt: 1000, now: 1000 })).toBe(true);
    expect(stillInFlight({ sentAt: 1000, now: 1000 + PRESS_TIMEOUT_MS - 1 })).toBe(true);
    expect(stillInFlight({ sentAt: 1000, now: 1000 + PRESS_TIMEOUT_MS })).toBe(false);
  });
});

// The arithmetic above is the library's. These pin the SURFACE to it, so the
// library could not be right while the header shipped a plain tap.
describe('the header is wired to it', () => {
  const SRC = readFileSync(join(process.cwd(), 'src/components/OpenerButton.jsx'), 'utf8');
  const NAV = readFileSync(join(process.cwd(), 'src/components/TopNavRow.jsx'), 'utf8');
  const SHELL = readFileSync(join(process.cwd(), 'src/poe-financial-mvp-v28.jsx'), 'utf8');

  it('the control holds rather than taps', () => {
    expect(SRC).toContain('holdComplete');
    expect(SRC).toContain('onPointerDown');
    expect(SRC).toContain('onPointerUp');
    expect(SRC, 'letting go early must cancel').toContain('cancelHold');
    expect(SRC, 'a plain click must not press the door').not.toMatch(/onClick=\{\s*press\s*\}/);
  });

  it('the control asks the library whether a press is allowed', () => {
    expect(SRC).toContain('pressAllowed(');
    expect(SRC).toContain('readPressResult(');
    expect(SRC).toContain('PRESS_PATH');
  });

  it('the control renders NOTHING when there is no real opener', () => {
    expect(SRC).toMatch(/if \(!offer\) return null;/);
  });

  it('the header row mounts it in BOTH of its shapes', () => {
    expect(NAV).toContain("import OpenerButton from './OpenerButton.jsx'");
    // Both branches: the many-tab row and the one-tab brand row.
    expect(NAV.match(/<OpenerButton \/>/g) || []).toHaveLength(2);
  });

  it('the FROZEN shell is untouched by this feature (DR-0078)', () => {
    // The monolith budget guard caught the first version of this, which added
    // 21 lines to the shell for a new feature. The control owns its own read
    // and the row mounts it, so the shell changed by zero lines.
    expect(SHELL, 'no opener code belongs in the frozen shell').not.toMatch(/OpenerButton|OpenersPanel|subscribeOpeners/);
    const panel = readFileSync(join(process.cwd(), 'src/components/DevOps.jsx'), 'utf8');
    expect(panel, 'the panel lives in a feature module').toContain('OpenersPanel');
  });

  it('it asks the household record itself, and RLS is the gate (DR-0060)', () => {
    expect(SRC).toContain('subscribeOpeners');
    const sync = readFileSync(join(process.cwd(), 'src/lib/openers-sync.js'), 'utf8');
    expect(sync).toContain("from('household_openers')");
    // A failed read must NOT read as "this house has none".
    expect(sync).toMatch(/return null;/);
    // and the SELECTED COLUMNS never carry the hardware the NAS alone should
    // know (the prose above them names those only to say they are excluded).
    const cols = (sync.match(/OPENER_COLUMNS = '([^']+)'/) || [])[1] || '';
    expect(cols).toBe('id, name, place, kind, enabled, reports');
    for (const secret of ['url', 'pin', 'topic', 'broker', 'address']) {
      expect(cols, `columns must not carry ${secret}`).not.toContain(secret);
    }
  });

  it('every press is KEPT, with the honest result', () => {
    // db:opener_presses was an orphan until the flow graph said so: the ledger
    // existed and nothing wrote to it.
    expect(SRC).toContain('recordPress(');
    const sync = readFileSync(join(process.cwd(), 'src/lib/openers-sync.js'), 'utf8');
    expect(sync).toContain("from('opener_presses').insert");
    expect(sync, 'the stored result is the one readPressResult read').toContain('result: read.state');
  });

  it('it is chrome, so it does not grow with the body text (DR-0816)', () => {
    expect(SRC).toContain('ts-chrome-region');
    // and it is still a real target for a thumb in a car
    expect(SRC).toContain('min-h-[44px]');
  });

  it('the same-origin transport exists and rides the one proxy factory', () => {
    const fn = readFileSync(join(process.cwd(), 'functions/openers/[[path]].js'), 'utf8');
    expect(fn).toContain('makeFunnelProxy');
    expect(fn).toContain("upstreamPrefix: '/openers'");
  });
});
