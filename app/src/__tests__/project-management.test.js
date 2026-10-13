import { describe, it, expect } from 'vitest';
import {
  stageOfStatus,
  stageOfProject,
  statusForStage,
  nextStage,
  stageProgress,
  lifeGroupOfProject,
  groupProjectsByLife,
  archivePatch,
  isArchived,
  markCompletePatch,
  reschedulePatch,
  stageBoard,
  lifecycleTrail,
  projectTimelineLanes,
  STAGE_KEYS,
} from '../lib/project-management.js';

describe('eternal-sequence stage mapping (derived from real status)', () => {
  it('maps each status 1:1 onto a stage', () => {
    expect(stageOfStatus('tbd')).toBe('research');
    expect(stageOfStatus('planning')).toBe('plan');
    expect(stageOfStatus('active')).toBe('execute');
    expect(stageOfStatus('ending-soon')).toBe('execute');
    expect(stageOfStatus('complete')).toBe('done');
    expect(stageOfStatus('on-hold')).toBe('parked');
  });
  it('defaults an unknown status to research (nothing vanishes)', () => {
    expect(stageOfStatus('weird')).toBe('research');
    expect(stageOfProject({ status: undefined })).toBe('research');
  });
  it('statusForStage sets the canonical status for a stage', () => {
    expect(statusForStage('execute')).toBe('active');
    expect(statusForStage('done')).toBe('complete');
    expect(statusForStage('parked')).toBe('on-hold');
  });
  it('nextStage walks research -> plan -> execute -> done, then stops', () => {
    expect(nextStage('research')).toBe('plan');
    expect(nextStage('plan')).toBe('execute');
    expect(nextStage('execute')).toBe('done');
    expect(nextStage('done')).toBe(null);
    expect(nextStage('parked')).toBe(null);
  });
});

describe('stageProgress (honest, never painted)', () => {
  it('reports entered-progress along the 3 working stages', () => {
    expect(stageProgress({ status: 'planning' })).toEqual({ stage: 'plan', step: 2, of: 3, pct: 67 });
    expect(stageProgress({ status: 'active' }).pct).toBe(100);
    expect(stageProgress({ status: 'complete' }).pct).toBe(100);
  });
  it('returns null pct for parked — no fake bar', () => {
    expect(stageProgress({ status: 'on-hold' })).toEqual({ stage: 'parked', step: null, of: 3, pct: null });
  });
});

describe('church vs personal grouping', () => {
  it('groups by the real domain field', () => {
    expect(lifeGroupOfProject({ domain: 'church' })).toBe('church');
    expect(lifeGroupOfProject({ domain: 'family' })).toBe('personal');
    expect(lifeGroupOfProject({ domain: 'business-poetech' })).toBe('personal');
  });
  it('splits a list into church + personal', () => {
    const g = groupProjectsByLife([
      { id: 'a', domain: 'church' },
      { id: 'b', domain: 'family' },
      { id: 'c', domain: 'church' },
    ]);
    expect(g.church.map((p) => p.id)).toEqual(['a', 'c']);
    expect(g.personal.map((p) => p.id)).toEqual(['b']);
  });
});

describe('archive (non-destructive, kept for the record)', () => {
  it('archivePatch parks with an archived note', () => {
    const patch = archivePatch();
    expect(patch.status).toBe('on-hold');
    expect(patch._note.toLowerCase()).toContain('archived');
  });
  it('isArchived reads the real lifecycle log', () => {
    const archived = { status: 'on-hold', lifecycle: { log: [
      { toPhase: 'planning' }, { toPhase: 'on-hold', note: 'archived — set down' },
    ] } };
    expect(isArchived(archived)).toBe(true);
  });
  it('a plain on-hold (not archived) is not archived', () => {
    const onHold = { status: 'on-hold', lifecycle: { log: [{ toPhase: 'on-hold', note: 'waiting on funds' }] } };
    expect(isArchived(onHold)).toBe(false);
  });
  it('an active project is never archived', () => {
    expect(isArchived({ status: 'active', lifecycle: { log: [] } })).toBe(false);
  });
});

describe('one-tap closing from the row (2026-06-23 closure-lifecycle fix)', () => {
  it('markCompletePatch writes the terminal complete status + a lifecycle note', () => {
    const patch = markCompletePatch();
    expect(patch.status).toBe('complete');
    expect(patch._by).toBe('user');
    expect(patch._note.toLowerCase()).toContain('complete');
  });
  it('reschedulePatch sets the new end date + records the slip in the note', () => {
    const patch = reschedulePatch('2026-09-30');
    expect(patch.endDate).toBe('2026-09-30');
    expect(patch.status).toBeUndefined(); // reschedule does NOT close the project
    expect(patch._note).toContain('2026-09-30');
  });
});

describe('stageBoard + lifecycleTrail (real tallies / real history)', () => {
  it('tallies projects into each stage', () => {
    const board = stageBoard([
      { status: 'tbd' }, { status: 'planning' }, { status: 'active' },
      { status: 'active' }, { status: 'complete' }, { status: 'on-hold' },
    ]);
    expect(board).toEqual({ research: 1, plan: 1, execute: 2, done: 1, parked: 1 });
    expect(Object.keys(board).sort()).toEqual([...STAGE_KEYS].sort());
  });
  it('lifecycleTrail returns the real log newest-first', () => {
    const trail = lifecycleTrail({ lifecycle: { log: [
      { at: '1', toPhase: 'planning' }, { at: '2', toPhase: 'active' },
    ] } });
    expect(trail.map((e) => e.at)).toEqual(['2', '1']);
  });
  it('is safe with no lifecycle', () => {
    expect(lifecycleTrail({})).toEqual([]);
  });
});

// projectTimelineLanes — proven-to-catch (DR-0076): the timeline is a LIVE view
// of real projects when no board is loaded, never a dead end or a painted lane.
describe('projectTimelineLanes — projects ride the timeline when no board is loaded', () => {
  it('returns [] for no projects (empty stays empty — never painted)', () => {
    expect(projectTimelineLanes([])).toEqual([]);
    expect(projectTimelineLanes(null)).toEqual([]);
    expect(projectTimelineLanes(undefined)).toEqual([]);
  });
  it('derives a lane per project from the shared engine (stage + real dates)', () => {
    const lanes = projectTimelineLanes([
      { id: 'p1', title: 'Church infra plan', status: 'active', endDate: '2026-09-01' },
      { id: 'p2', title: 'Sponsor outreach', status: 'planning' },
    ]);
    expect(lanes).toHaveLength(2);
    expect(lanes[0]).toMatchObject({ id: 'p1', title: 'Church infra plan', stage: 'execute', stageLabel: 'Execute', pct: 100, endDate: '2026-09-01' });
    expect(lanes[1]).toMatchObject({ id: 'p2', stage: 'plan', stageLabel: 'Plan' });
  });
  it('reports parked pct as null (honest, not 0)', () => {
    const [lane] = projectTimelineLanes([{ id: 'p3', title: 'Paused', status: 'on-hold' }]);
    expect(lane.pct).toBeNull();
    expect(lane.stage).toBe('parked');
  });
  it('excludes archived projects (kept for the record, off the live timeline)', () => {
    const archived = { id: 'p4', title: 'Done deal', status: 'on-hold', lifecycle: { log: [{ toPhase: 'on-hold', note: 'archived for the record' }] } };
    expect(projectTimelineLanes([archived])).toEqual([]);
  });
  it('excludes completed projects (live timeline is open work, matching the list default)', () => {
    const lanes = projectTimelineLanes([
      { id: 'p6', title: 'Taxes filed', status: 'complete' },
      { id: 'p7', title: 'Roof repair', status: 'active' },
    ]);
    expect(lanes.map((l) => l.id)).toEqual(['p7']);
  });
  it('falls back to a title so a lane is never blank', () => {
    const [lane] = projectTimelineLanes([{ id: 'p5', status: 'active' }]);
    expect(lane.title).toBe('Untitled project');
  });
});
