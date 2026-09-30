// capacityDecisionForNewProject — the outcomes are pinned exactly as the
// comment above the function documents them (DR-0690). Before 2026-09-30 the
// over-100% prompt said "Cancel to keep it out entirely" while Cancel added the
// project ACTIVE; and profiles that all read 0 hrs/wk waved every project
// through silently. Both are pinned here so they cannot come back.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { capacityDecisionForNewProject, capacitySnapshot, CAPACITY_CHECKED_FLOWS } from '../lib/opportunity-capacity.js';

const projects = [
  { id: 'a', title: 'A', status: 'active', hoursPerWeek: 10 },
  { id: 'b', title: 'B', status: 'tbd', hoursPerWeek: 30 },
];
const profiles20 = [{ id: 's', name: 'Adam', hoursPerWeek: 20 }];

let confirmSpy;
beforeEach(() => { confirmSpy = vi.spyOn(window, 'confirm'); });
afterEach(() => { confirmSpy.mockRestore(); });

describe('capacityDecisionForNewProject', () => {
  it('no profiles: add-active with a not-enforced note, no prompt', () => {
    const d = capacityDecisionForNewProject(projects, [], 5);
    expect(d.decision).toBe('add-active');
    expect(d.note).toMatch(/not enforced/);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('profiles with no hours: add-active with a not-enforced note, no prompt', () => {
    const d = capacityDecisionForNewProject(projects, [{ id: 's', hoursPerWeek: 0 }], 5);
    expect(d.decision).toBe('add-active');
    expect(d.note).toMatch(/No weekly hours set/);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('fits (<= 80%): add-active, no prompt, no note (tbd projects do not count)', () => {
    const d = capacityDecisionForNewProject(projects, profiles20, 6); // 16/20 = 80%
    expect(d).toEqual({ decision: 'add-active' });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('tight (80-100%): OK parks as TBD, Cancel adds active', () => {
    confirmSpy.mockReturnValue(true);
    expect(capacityDecisionForNewProject(projects, profiles20, 8).decision).toBe('add-tbd'); // 90%
    confirmSpy.mockReturnValue(false);
    expect(capacityDecisionForNewProject(projects, profiles20, 8).decision).toBe('add-active');
    expect(confirmSpy.mock.calls[0][0]).toMatch(/Tight fit/);
  });

  it('over (> 100%): OK parks as TBD, Cancel keeps it OUT, as the prompt says', () => {
    confirmSpy.mockReturnValue(true);
    expect(capacityDecisionForNewProject(projects, profiles20, 20).decision).toBe('add-tbd'); // 150%
    confirmSpy.mockReturnValue(false);
    expect(capacityDecisionForNewProject(projects, profiles20, 20).decision).toBe('cancel');
    expect(confirmSpy.mock.calls[1][0]).toMatch(/Click Cancel to keep it out entirely/);
  });
});

describe('capacitySnapshot — states and the rows behind the number', () => {
  it('names the state and the contributing active projects', () => {
    expect(capacitySnapshot(projects, []).state).toBe('no-profiles');
    expect(capacitySnapshot(projects, [{ hoursPerWeek: 0 }]).state).toBe('no-hours');
    const s = capacitySnapshot(projects, profiles20);
    expect(s.state).toBe('measured');
    expect(s.committed).toBe(10);
    expect(s.contributors.map((c) => c.id)).toEqual(['a']);
  });
  it('lists only flows that really call the check', () => {
    expect(CAPACITY_CHECKED_FLOWS.join(' ')).not.toMatch(/Tenant/);
  });
});
