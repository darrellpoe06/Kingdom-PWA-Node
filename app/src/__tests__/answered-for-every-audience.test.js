// =============================================================================
// Answered for every audience (DR-0629) — connected is not the same as answered.
// =============================================================================
// Walks every intake door as each audience (the Governor, a signed-in MEMBER,
// someone signed out): the chip is taken through the real planDispatch with
// the handlers each surface really mounts, and the declared outcome for that
// audience must name a return path that exists in the code. A door whose
// outcome is "none" with no genuine blocker FAILS — that is the Lesson chip
// for a member today, and this gate stays red until the real answer lands.
// =============================================================================
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INTAKE_DOORS, SURFACE_HANDLERS, AUDIENCES, judge } from '../lib/intake-outcomes.js';
import { planDispatch, destinationsFor } from '../lib/one-voice-routing.js';

const ROOT = path.resolve(__dirname, '../../..');
const fileText = (rel) => {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { return null; }
};

// The handler props each surface really passes to <OneVoiceInput>, read from
// the mount — so SURFACE_HANDLERS cannot drift from the code it mirrors.
const PROP_FOR = { poetech: 'sendToPoeTech', prayer: 'addPrayerRequest', churchVoice: 'addChurchVoice', conference: 'updateConference', incident: 'addIncident', inquiry: 'addInquiry', note: 'addNote' };
const MOUNT = { notes: 'app/src/components/ThinkingSpace.jsx', church: 'app/src/components/ChurchOneVoice.jsx' };
function mountedProps(rel) {
  const t = fileText(rel);
  const i = t.indexOf('<OneVoiceInput');
  const end = t.indexOf('/>', i);
  return t.slice(i, end);
}

const byRoute = new Map(INTAKE_DOORS.filter((d) => d.route).map((d) => [d.route, d]));

describe('the surfaces mount the handlers the walk assumes', () => {
  for (const [surface, rel] of Object.entries(MOUNT)) {
    it(`${surface}: SURFACE_HANDLERS matches ${rel}`, () => {
      const props = mountedProps(rel);
      for (const [key, prop] of Object.entries(PROP_FOR)) {
        expect(new RegExp(`\\b${prop}=`).test(props), `${surface}.${key} (${prop})`).toBe(!!SURFACE_HANDLERS[surface][key]);
      }
    });
  }
});

describe('every chip on every surface lands on a declared door', () => {
  for (const surface of Object.keys(SURFACE_HANDLERS)) {
    for (const { key } of destinationsFor(surface)) {
      it(`${surface} · ${key}: planDispatch keeps the chip on its own route`, () => {
        const plan = planDispatch(key, SURFACE_HANDLERS[surface]);
        expect(plan.action, `${surface}/${key} fell through to ${plan.action}`).toBe(key);
        expect(byRoute.has(key), `${key} has no declared outcome`).toBe(true);
      });
    }
  }
  it('every declared route door is a real chip', () => {
    const keys = new Set(destinationsFor('notes').concat(destinationsFor('church')).map((d) => d.key));
    for (const r of byRoute.keys()) expect(keys.has(r), r).toBe(true);
  });
});

describe('every door is answered, for every audience', () => {
  for (const door of INTAKE_DOORS) {
    for (const audience of AUDIENCES) {
      it(`${door.id} · ${audience}`, () => {
        const v = judge(door, audience, fileText);
        expect(v.ok, v.why).toBe(true);
      });
    }
  }
});

describe('the gate catches its breaks (proven-to-catch)', () => {
  const door = (o) => ({ id: 't', outcomes: { member: o } });
  const real = { file: 'app/src/lib/one-voice-surfaces.js', token: 'lessonFailed' };
  it('fails an outcome of "none" with no blocker', () => {
    expect(judge(door({ kind: 'none', where: 'x', proof: real }), 'member', fileText).ok).toBe(false);
  });
  it('fails "being built" as a blocker', () => {
    expect(judge(door({ kind: 'none', where: 'x', proof: real, open: { blocker: 'being-built', why: 'soon', reReview: '2026-10-01' } }), 'member', fileText).ok).toBe(false);
  });
  it('fails a blocker without a re-review date', () => {
    expect(judge(door({ kind: 'none', where: 'x', proof: real, open: { blocker: 'bright-line', why: 'his call' } }), 'member', fileText).ok).toBe(false);
  });
  it('fails a return path whose token is not in the code', () => {
    expect(judge(door({ kind: 'answer', where: 'x', proof: { file: real.file, token: 'no-such-return-path-xyz' } }), 'member', fileText).ok).toBe(false);
  });
  it('fails a return path in a file that does not exist', () => {
    expect(judge(door({ kind: 'answer', where: 'x', proof: { file: 'app/src/no-such-file.js', token: 'a' } }), 'member', fileText).ok).toBe(false);
  });
  it('fails an audience with no declared outcome', () => {
    expect(judge(door({ kind: 'answer', where: 'x', proof: real }), 'signed-out', fileText).ok).toBe(false);
  });
  it('fails a chip that silently falls through to another route', () => {
    expect(planDispatch('conference', SURFACE_HANDLERS.notes).action).not.toBe('conference');
  });
  it('passes a named bright line with a date, and says so', () => {
    const v = judge(door({ kind: 'none', where: 'x', proof: real, open: { blocker: 'bright-line', why: 'his call', reReview: '2026-10-01' } }), 'member', fileText);
    expect(v.ok && v.open).toBe(true);
  });
});
