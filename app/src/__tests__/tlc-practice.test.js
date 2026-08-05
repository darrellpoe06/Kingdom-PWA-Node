// =============================================================================
// tlc-practice — the shared PUBLIC practice record (one source, two surfaces:
// the main app's Practice tab + business doors' Practice tab). Pins that every
// roster entry is complete (a half-empty card on a public door reads broken)
// and that nothing clinical rides in this record — public marketing facts only.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { TLC_TEAM, TLC_INSURANCE } from '../lib/tlc-practice.js';

describe('the TLC clinical-team record', () => {
  it('every therapist card is complete: name, role, specialty, portal link, photo', () => {
    expect(TLC_TEAM.length).toBeGreaterThanOrEqual(7);
    for (const t of TLC_TEAM) {
      expect(t.name, 'name').toBeTruthy();
      expect(t.role, `${t.name} role`).toBeTruthy();
      expect(t.specialty, `${t.name} specialty`).toBeTruthy();
      expect(t.url, `${t.name} url`).toMatch(/^https:\/\/tlctherapysolutions\.me\//);
      expect(t.photo, `${t.name} photo`).toMatch(/^https:\/\//);
    }
  });

  it('Christina leads the roster; the insurance line names the carriers', () => {
    expect(TLC_TEAM[0].name).toContain('Christina Poe');
    expect(TLC_TEAM[0].role).toContain('Founder');
    for (const carrier of ['Blue Cross', 'Aetna', 'United Health Care', 'Veterans Affairs', 'Cigna']) {
      expect(TLC_INSURANCE).toContain(carrier);
    }
    expect(TLC_INSURANCE).toContain('Self-pay');
  });

  it('nothing clinical rides in the record — public marketing fields only', () => {
    const allowed = ['name', 'role', 'specialty', 'url', 'photo'];
    for (const t of TLC_TEAM) {
      expect(Object.keys(t).sort()).toEqual(allowed.sort());
    }
  });

  it('the operator Practice tab renders the team BEFORE services (same order as the public door)', () => {
    // Darrell: "The TLC tab should be arranged in the same order as this
    // showing the Team first" — the door already pins team-first
    // (tlc-public-door-render.test.jsx); this pins the operator tab too.
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '../components/Practice.jsx'), 'utf8');
    const team = src.indexOf('TLC_TEAM.map');
    const services = src.indexOf('TLC_SERVICES.map');
    expect(team).toBeGreaterThan(-1);
    expect(services).toBeGreaterThan(-1);
    expect(team, 'clinical team must render before the services list').toBeLessThan(services);
  });
});
