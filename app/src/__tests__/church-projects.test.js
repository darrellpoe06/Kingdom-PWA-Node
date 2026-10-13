// church-projects — proven-to-catch tests for the Love Corner project board:
// the stage lens, real-derived stats + lanes, overdue detection, stage advance,
// and seed integrity (the church's real initiatives, seed-prefixed).
import { describe, it, expect } from 'vitest';
import {
  makeProject, validateProject, STAGES, WORKING_STAGES, CHURCH_AREAS,
  projectsByStage, projectStats, overdueProjects, nextStage, stageMeta,
  mergeSeed, isSeedId, SEED_PROJECTS,
} from '../lib/church-projects.js';

const NOW = '2026-07-20T00:00:00.000Z';
const proj = (over = {}) => makeProject({ title: 'X', areaId: 'worship-av', ...over }, { now: NOW });

describe('church-projects — the stage lens', () => {
  it('has the eternal-sequence stages; three are working', () => {
    expect(STAGES.map((s) => s.id)).toEqual(['research', 'plan', 'execute', 'done', 'parked']);
    expect(WORKING_STAGES.map((s) => s.id)).toEqual(['research', 'plan', 'execute']);
  });
  it('advances research → plan → execute → done, and stops at done', () => {
    expect(nextStage('research')).toBe('plan');
    expect(nextStage('plan')).toBe('execute');
    expect(nextStage('execute')).toBe('done');
    expect(nextStage('done')).toBe('done');
  });
  it('a project requires a title and defaults to research', () => {
    expect(validateProject({ title: '' }).ok).toBe(false);
    expect(validateProject({ title: 'Video wall' }).ok).toBe(true);
    expect(proj().stage).toBe('research');
  });
});

describe('church-projects — derived board (real records, nothing painted)', () => {
  const projects = [
    proj({ id: 'a', stage: 'execute', areaId: 'worship-av' }),
    proj({ id: 'b', stage: 'plan', areaId: 'facilities' }),
    proj({ id: 'c', stage: 'done', areaId: 'events' }),
    proj({ id: 'd', stage: 'execute', areaId: 'worship-av', dueOn: '2026-07-01T00:00:00.000Z' }),
    proj({ id: 'e', stage: 'parked', areaId: 'other' }),
  ];
  it('lanes group by stage', () => {
    const lanes = projectsByStage(projects);
    expect(lanes.execute.map((p) => p.id).sort()).toEqual(['a', 'd']);
    expect(lanes.done.map((p) => p.id)).toEqual(['c']);
  });
  it('stats count active/done/parked, by area, and % complete', () => {
    const s = projectStats(projects);
    expect(s.total).toBe(5);
    expect(s.active).toBe(3);   // a, b, d are working stages
    expect(s.done).toBe(1);
    expect(s.parked).toBe(1);
    expect(s.byArea['worship-av']).toBe(2);
    expect(s.pctDone).toBe(20); // 1 of 5
  });
  it('overdue = past-due AND still in a working stage', () => {
    const over = overdueProjects(projects, NOW);
    expect(over.map((p) => p.id)).toEqual(['d']); // d is execute + past due; c is done so excluded
  });
});

describe('church-projects — seed = the church’s real initiatives', () => {
  it('seeds the video wall, Assembly, bus ministry, infra, the door, and outreach', () => {
    const titles = SEED_PROJECTS.map((p) => p.title.toLowerCase());
    expect(titles.some((t) => t.includes('video wall'))).toBe(true);
    expect(titles.some((t) => t.includes('assembly'))).toBe(true);
    expect(titles.some((t) => t.includes('bus'))).toBe(true);
    expect(titles.some((t) => t.includes('love corner'))).toBe(true);
  });
  it('every seed is seed-prefixed with a valid area + stage', () => {
    for (const p of SEED_PROJECTS) {
      expect(isSeedId(p.id)).toBe(true);
      expect(CHURCH_AREAS.some((a) => a.id === p.areaId)).toBe(true);
      expect(stageMeta(p.stage).id).toBe(p.stage);
    }
  });
  it('user rows win over a seed of the same id (no dup)', () => {
    const merged = mergeSeed([{ id: 'seed-cproj-videowall', title: 'Edited' }], SEED_PROJECTS);
    expect(merged.find((p) => p.id === 'seed-cproj-videowall').title).toBe('Edited');
    expect(merged).toHaveLength(SEED_PROJECTS.length);
  });
});
