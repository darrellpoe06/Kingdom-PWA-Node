// @vitest-environment node
//
// What the congregation's own answers tell the church — and what they must
// never be made to say.
//
// Darrell 2026-09-11: "a process for analytics and services to be created based
// on the information; workflows are added to become MVP's until we are
// systematizing our users lives..."
//
// DR-0357 decision 8 is the rule this is built on: every finding is ARITHMETIC,
// and what a calculation can say is never handed to a model. Most of these
// tests are therefore not about the arithmetic — they are about the four things
// a church analytic must never do.
import { describe, it, expect } from 'vitest';
import { churchInsights, ministriesAwaitingASurface, NEVER_COMPUTED, memberFieldLabel } from '../lib/church-insights.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CH = COLG_DEFAULT_CHURCH;
const run = (records) => churchInsights({ records, church: CH });
const byId = (out, id) => out.findings.find((f) => f.id === id);

const ruth = { fullName: 'Ruth', standing: 'A member', needsRide: true, rideServices: ['svc-sun'], servingInterest: ['band', 'choir'], newMemberWelcome: true, howYouFoundUs: 'The bus ministry', prayerRequest: 'for my mother', prayerShareable: 'Only the pastor' };
const amos = { fullName: 'Amos', standing: 'New member', canDrive: true, servingInterest: ['band'], howYouFoundUs: 'The bus ministry', accessNeeds: 'a ramp' };
const mae  = { fullName: 'Mae', standing: 'Visiting for the first time', needsRide: true, rideServices: ['svc-wed2'], accessibleNeeded: true, servingInterest: ['ushers'] };

describe('no rows, no findings', () => {
  it('says so plainly instead of showing an empty dashboard', () => {
    const out = run([]);
    expect(out.ok).toBe(false);
    expect(out.findings).toEqual([]);
    expect(out.unavailable).toMatch(/nothing true to say/i);
  });

  it('survives junk', () => {
    expect(churchInsights().ok).toBe(false);
    expect(churchInsights({ records: null }).ok).toBe(false);
    expect(run([null, undefined]).ok).toBe(false);
  });
});

describe('THE WALLS — what a church analytic must never do', () => {
  const out = run([ruth, amos, mae]);
  const allText = JSON.stringify(out);

  it('NEVER reads a prayer request — it counts, and that is all', () => {
    // Ruth's request is real and aimed at the pastor ALONE. It must not appear
    // anywhere in the output, not even summarized or themed.
    expect(allText).not.toMatch(/for my mother/);
    const f = byId(out, 'prayer');
    expect(f).toBeTruthy();
    expect(f.data).toMatch(/1 request/);
    expect(f.data).toMatch(/1 for the pastor alone/);
    expect(f.truth).toMatch(/Counted only/i);
    // Its basis reads the AUDIENCE, never the request.
    expect(f.basis.join(' ')).toContain('prayerShareable');
    expect(f.basis.join(' ')).not.toContain('record.prayerRequest');
  });

  it('computes NOTHING over a giving amount — there is nothing to compute', () => {
    for (const k of ['givingAmount', 'givingTotal', 'income']) {
      expect(NEVER_COMPUTED).toContain(k);
      expect(allText).not.toMatch(new RegExp(k));
    }
    // Even if one somehow arrived on a row, normalizing strips it before any
    // arithmetic sees it.
    const sneaky = run([{ ...ruth, givingAmount: 500, givingTotal: 9999 }]);
    expect(JSON.stringify(sneaky)).not.toMatch(/500|9999/);
  });

  it('RANKS NO PERSON — the aggregates carry no names', () => {
    for (const f of out.findings) {
      expect(`${f.data} ${f.truth} ${f.invitation}`, f.id).not.toMatch(/Ruth|Amos|Mae/);
    }
  });

  it('states that offers are offers, not assignments', () => {
    expect(byId(out, 'serving').truth).toMatch(/offers, not assignments/i);
    expect(byId(out, 'serving').truth).toMatch(/nobody here has been contacted/i);
  });

  it('the file itself reaches for no model', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../lib/church-insights.js'), 'utf8');
    expect(src).not.toMatch(/\bfetch\(|openai|anthropic|\bllm\b|embedding/i);
  });
});

describe('the findings a church actually acts on', () => {
  const out = run([ruth, amos, mae]);

  it('LEADS with the ministries people volunteered for that have no page', () => {
    // The church band case, generalized: the congregation telling the build
    // team what to build next, in numbers.
    expect(out.findings[0].id).toBe('serving-no-page');
    expect(out.findings[0].data).toMatch(/Church Band: 2/);
    expect(out.findings[0].invitation).toMatch(/Build Church Band next/);
  });

  it('answers the bus ministry’s real question', () => {
    const f = byId(out, 'rides');
    expect(f.data).toMatch(/2 asking for a ride/);
    expect(f.data).toMatch(/1 offering to drive/);
    expect(f.data).toMatch(/1 needing the accessibility van/);
    expect(f.truth).toMatch(/More people need a ride than have offered/);
  });

  it('splits the rides by SERVICE — Sunday and Wednesday are different runs', () => {
    const f = byId(out, 'rides-by-service');
    expect(f.data).toMatch(/Sunday 11:00 AM: 1/);
    expect(f.data).toMatch(/Wednesday 6:00 PM: 1/);
  });

  it('names the gap when nobody has offered to drive at all', () => {
    const f = byId(run([ruth, mae]), 'rides');
    expect(f.truth).toMatch(/nobody has offered to drive/i);
    expect(f.weight).toBeGreaterThan(4);
  });

  it('counts who is waiting on a welcome', () => {
    const f = byId(out, 'welcome');
    expect(f.data).toMatch(/1 asked for the welcome/);
    expect(f.data).toMatch(/2 new or visiting/);
  });

  it('says which door actually reached people', () => {
    expect(byId(out, 'doors').truth).toMatch(/The bus ministry/);
  });

  it('treats access needs as the ushers’ work, never a medical record', () => {
    expect(byId(out, 'access').truth).toMatch(/never a medical record/i);
  });

  it('every finding shows the rows it came from', () => {
    for (const f of out.findings) {
      expect(f.basis.length, f.id).toBeGreaterThan(0);
      expect(f.data, f.id).toBeTruthy();
      expect(f.truth, f.id).toBeTruthy();
      expect(f.invitation, f.id).toBeTruthy();
    }
  });

  it('reports coverage without scolding anyone', () => {
    const f = byId(out, 'coverage');
    expect(f.data).toMatch(/3 records/);
    expect(f.data).not.toMatch(/barely started/);
    expect(f.invitation).toMatch(/Keep it current/);

    // And when someone HAS given little more than a name, the copy still does
    // not nag. The welcome is the moment a record gets finished — a church does
    // not chase its own people with reminder mail.
    const thin = byId(run([ruth, amos, mae, { fullName: 'Jo' }]), 'coverage');
    expect(thin.data).toMatch(/1 barely started/);
    expect(thin.truth).toMatch(/little more than a name/);
    expect(thin.invitation).toMatch(/not a reminder email/);
  });
});

describe('ministriesAwaitingASurface — the build queue, from the congregation', () => {
  it('ranks by how many people offered', () => {
    expect(ministriesAwaitingASurface([ruth, amos, mae], CH))
      .toEqual([{ id: 'band', name: 'Church Band', offers: 2 }, { id: 'ushers', name: 'Ushers', offers: 1 }]);
  });

  it('leaves out ministries that already HAVE a page', () => {
    // Ruth also offered for the choir, which has a surface.
    expect(ministriesAwaitingASurface([ruth], CH).map((m) => m.id)).not.toContain('choir');
  });

  it('is empty, not broken, with nothing offered', () => {
    expect(ministriesAwaitingASurface([], CH)).toEqual([]);
    expect(ministriesAwaitingASurface(null)).toEqual([]);
  });

  it('names a field for a reader', () => {
    expect(memberFieldLabel('fullName')).toBe('Your full name');
    expect(memberFieldLabel('nope')).toBe('nope');
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a prayer request leaking into a finding', () => {
    const out = run([{ ...ruth, prayerRequest: 'UNIQUE-SECRET-PHRASE', prayerShareable: 'The whole church' }]);
    // Even when the person chose the WIDEST audience, this surface does not
    // republish the words — the roll carries them, to the audience chosen.
    expect(JSON.stringify(out)).not.toMatch(/UNIQUE-SECRET-PHRASE/);
  });

  it('CATCHES an analytic that produced findings from nothing', () => {
    expect(run([]).findings).toEqual([]);
    expect(run([{}]).findings.length).toBeGreaterThan(0); // a real (if thin) row does produce one
  });

  it('CATCHES a build queue that stopped following the ministries registry', () => {
    // A ministry that gains a page must drop off the queue on its own.
    expect(ministriesAwaitingASurface([{ servingInterest: ['bus'] }], CH)).toEqual([]);
  });
});
