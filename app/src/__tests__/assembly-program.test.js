// =============================================================================
// assembly-program-2026 — the printed program, transcribed faithfully and
// loaded idempotently (DR-0164)
// =============================================================================
// Locks: (1) the transcription carries the family's own session (the reason
// the program reached the app) and the whole printed set; (2) the Day-3 date
// typo is corrected WITH its receipt, never silently; (3) loading twice adds
// nothing (idempotence by day+title); (4) room matching never invents a room;
// (5) the conference identity derives from the one facts registry (DR-0159).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  ASSEMBLY_PROGRAM_2026, ASSEMBLY_FACILITATORS_2026, ASSEMBLY_DAY3_DATE_NOTE,
  ASSEMBLY_NAME, missingProgramSessions, matchRoomId,
} from '../lib/assembly-program-2026.js';
import { FAMILY_MINISTRIES } from '../lib/family-ministries.js';

describe('the transcribed program', () => {
  it('carries all 12 printed sessions with day, date, time, and title', () => {
    expect(ASSEMBLY_PROGRAM_2026).toHaveLength(12);
    for (const p of ASSEMBLY_PROGRAM_2026) {
      expect(p.day, p.title).toMatch(/^(Wed Jul 15|Thu Jul 16)$/);
      expect(p.sessionDate, p.title).toMatch(/^2026-07-1[56]$/);
      expect(p.time, p.title).toMatch(/\d/);
      expect(p.title.length, p.title).toBeGreaterThan(3);
      expect(['main_service', 'breakout', 'other']).toContain(p.sessionType);
    }
  });

  it("carries the family's session — Every Day Tech Confidence, Wed 11:00, Sanctuary", () => {
    const s = ASSEMBLY_PROGRAM_2026.find((p) => p.title === 'Every Day Tech Confidence');
    expect(s).toBeTruthy();
    expect(s.speaker).toContain('Darrell Poe');
    expect(s.speaker).toContain('Clifton Reed');
    expect(s.room).toBe('Sanctuary');
    expect(s.sessionDate).toBe('2026-07-15');
  });

  it('corrects the printed Day-3 date typo WITH a receipt, never silently', () => {
    // The printed program says "Thursday, July 15" — the same date as Wednesday.
    const day3 = ASSEMBLY_PROGRAM_2026.filter((p) => p.day === 'Thu Jul 16');
    expect(day3.length).toBe(7);
    for (const p of day3) expect(p.sessionDate).toBe('2026-07-16');
    expect(ASSEMBLY_DAY3_DATE_NOTE).toMatch(/July 15/);
    expect(ASSEMBLY_DAY3_DATE_NOTE).toMatch(/July 16/);
  });

  it('the facilitator bios ride with the program', () => {
    expect(ASSEMBLY_FACILITATORS_2026.map((f) => f.name)).toEqual(['Darrell Poe', 'Clifton Reed']);
    for (const f of ASSEMBLY_FACILITATORS_2026) expect(f.bio.length).toBeGreaterThan(100);
  });

  it('the conference identity derives from the one facts registry', () => {
    expect(ASSEMBLY_NAME).toBe(FAMILY_MINISTRIES.assembly.name);
  });
});

describe('idempotent loading', () => {
  it('an empty instance needs the whole program', () => {
    expect(missingProgramSessions([])).toHaveLength(12);
  });

  it('loading twice adds nothing (day+title, case/space-insensitive)', () => {
    const loaded = ASSEMBLY_PROGRAM_2026.map((p) => ({ day: p.day.toUpperCase(), title: `  ${p.title}  ` }));
    expect(missingProgramSessions(loaded)).toHaveLength(0);
  });

  it('a hand-added session with the same title on ANOTHER day does not block the program', () => {
    const existing = [{ day: 'Tue Jul 14', title: 'Lunch' }];
    expect(missingProgramSessions(existing)).toHaveLength(12);
  });
});

describe('room matching never invents', () => {
  const rooms = [{ id: 'r1', name: 'Sanctuary' }, { id: 'r2', name: 'cafe' }];
  it('matches by name, case-insensitive', () => {
    expect(matchRoomId(rooms, 'Sanctuary')).toBe('r1');
    expect(matchRoomId(rooms, 'Cafe')).toBe('r2');
  });
  it('no match = null (the session loads with its room unassigned)', () => {
    expect(matchRoomId(rooms, '3 - 5 Meeting Room')).toBeNull();
    expect(matchRoomId([], 'Sanctuary')).toBeNull();
  });
});
