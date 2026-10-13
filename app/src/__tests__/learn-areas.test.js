// =============================================================================
// Each area of Training explained, and shown complete from the learner's OWN
// records (DR-0355; Darrell: "explain each one possible on this tab... then
// just show it as complete when they do"). Never painted: an empty record is
// never done; an area with nothing to complete says so.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LEARN_AREA_GUIDE, learnAreaGuide, learnAreaExplain, learnAreaDone } from '../lib/learn-areas.js';
import { audienceTracks, DEFAULT_CERT_CATALOG, catalogForAudience, DEFAULT_REQUIRED_TRAININGS, makeHourEntry, IL_LCSW_REQUIREMENT } from '../lib/practice-academy.js';
import { makeCeEntry, getRuleset } from '../lib/ceu-tracker.js';
import { allCourses } from '../lib/tlc-training-library.js';

const AREAS = ['lessons', 'foryou', 'gain', 'courses', 'map', 'pathways', 'certificates', 'assigned', 'hours', 'ce', 'catalog'];

describe('every area is explained', () => {
  it('each area of the strip has what it is, what to do there, and (where there is something to complete) when it is complete', () => {
    for (const id of AREAS) {
      const g = learnAreaGuide(id);
      expect(g, id).toBeTruthy();
      expect(g.what.length, id).toBeGreaterThan(20);
      expect(g.doHere.length, id).toBeGreaterThan(20);
      expect(learnAreaExplain(id), id).toContain(g.what);
    }
    expect(LEARN_AREA_GUIDE.gain.doneWhen).toBeNull();
    expect(LEARN_AREA_GUIDE.pathways.doneWhen).toBeNull();
    expect(learnAreaExplain('hours')).toMatch(/Complete when the pathway’s required hours are logged\./);
    expect(learnAreaExplain('gain')).not.toContain('Complete when');
    expect(learnAreaExplain('nope')).toBe('');
  });
});

describe('complete only from real records', () => {
  it('an empty record is never done on any area; an informational area is null, never a check', () => {
    for (const id of AREAS) {
      const r = learnAreaDone(id, { tracks: audienceTracks('therapist'), audCatalog: catalogForAudience(DEFAULT_CERT_CATALOG, 'therapist'), audReqs: DEFAULT_REQUIRED_TRAININGS, libCourses: allCourses() });
      expect(r.done, id).not.toBe(true);
      expect(typeof r.detail, id).toBe('string');
    }
    expect(learnAreaDone('gain', {}).done).toBeNull();
    expect(learnAreaDone('pathways', {}).done).toBeNull();
  });
  it('hours: done when the pathway target is logged; the detail is the honest count', () => {
    const half = [makeHourEntry({ date: '2026-09-01', hours: IL_LCSW_REQUIREMENT.supervisedClinicalHours / 2, activity: 'direct-client' })];
    expect(learnAreaDone('hours', { myHours: half })).toMatchObject({ done: false });
    const full = [makeHourEntry({ date: '2026-09-01', hours: IL_LCSW_REQUIREMENT.supervisedClinicalHours, activity: 'direct-client' })];
    const r = learnAreaDone('hours', { myHours: full });
    expect(r.done).toBe(true);
    expect(r.detail).toMatch(/of \d+ hours/);
  });
  it('CE renewal: done only when the cycle hours AND every mandated topic are met', () => {
    const rs = getRuleset('IL');
    const cfg = { state: 'IL', credential: 'LCSW', renewalNumber: 2 };
    const general = [makeCeEntry({ date: '2026-09-01', hours: rs.totalHours })];
    expect(learnAreaDone('ce', { myCeus: general, ceuCfg: cfg }).done).toBe(false); // mandated topics unmet
    const mandated = (rs.credentials && rs.credentials.LCSW && rs.credentials.LCSW.mandatedTopics) || rs.mandatedTopics || [];
    const entries = [...general, ...mandated.map((t) => makeCeEntry({ date: '2026-09-01', hours: t.hours, topic: t.key }))];
    expect(learnAreaDone('ce', { myCeus: entries, ceuCfg: cfg }).done).toBe(true);
    expect(learnAreaDone('ce', { myCeus: [], ceuCfg: { ...cfg, renewalNumber: 1 } }).detail).toMatch(/exempt/);
  });
  it('assigned / for you: done when every lesson is reviewed, never when nothing was assigned', () => {
    expect(learnAreaDone('assigned', { assigned: { mine: [] } })).toEqual({ done: false, detail: 'nothing assigned yet' });
    expect(learnAreaDone('assigned', { assigned: { mine: [{ status: 'reviewed' }, { status: 'assigned' }] } })).toEqual({ done: false, detail: '1 of 2 reviewed' });
    expect(learnAreaDone('assigned', { assigned: { mine: [{ status: 'reviewed' }] } }).done).toBe(true);
    expect(learnAreaDone('foryou', { assigned: { forMe: [{ status: 'reviewed' }] } }).done).toBe(true);
  });
  it('courses and the map: done when every course of the library is completed; certificates when every offered one is earned; required trainings when all are current', () => {
    const courses = allCourses();
    expect(learnAreaDone('courses', { libCourses: courses, libLogged: courses.map((c) => c.id) }).done).toBe(true);
    expect(learnAreaDone('map', { libCourses: courses, libLogged: courses.slice(1).map((c) => c.id) })).toMatchObject({ done: false, detail: `${courses.length - 1} of ${courses.length} courses completed` });
    const offered = catalogForAudience(DEFAULT_CERT_CATALOG, 'therapist');
    expect(offered.length).toBeGreaterThan(0);
    expect(learnAreaDone('certificates', { audCatalog: offered, certs: offered.map((t) => ({ certId: t.id })) }).done).toBe(true);
    const reqs = DEFAULT_REQUIRED_TRAININGS.filter((r) => r.audienceKey === 'therapist');
    const completions = Object.fromEntries(reqs.map((r) => [r.id, '2026-09-01']));
    expect(learnAreaDone('catalog', { audReqs: reqs, reqCompletions: completions, now: '2026-09-10T00:00:00Z' }).done).toBe(true);
    expect(learnAreaDone('catalog', { audReqs: reqs, reqCompletions: {} }).detail).toBe(`0 of ${reqs.length} required trainings current`);
  });
});
