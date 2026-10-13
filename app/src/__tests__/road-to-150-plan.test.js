// =============================================================================
// The plan, taken from his document — verbatim, and nothing more
// =============================================================================
// Darrell: "you create a tracking plan based on the pdf my wife gave you."
// These pin BOTH halves of that: what the document said is carried exactly, and
// what it never said is still absent. A per-food calorie table would be
// fabricated nutrition in a weight-loss log (DR-0076/DR-0319), so the pantry
// must carry names and no numbers.
import { describe, it, expect } from 'vitest';
import {
  PLANNED_DAILY, PLANNED_WALK, PLANNED_STRENGTH, PROGRAM_PANTRY, PLAN_MEALS,
  pantryWithKnown, plannedVsActual, strengthChecklist, exerciseLabel,
} from '../lib/road-to-150-plan.js';

describe('his numbers, verbatim', () => {
  it('carries the planned daily totals he stated', () => {
    expect(PLANNED_DAILY.calories).toBe(1604);
    expect(PLANNED_DAILY.proteinG).toBe(141.7);
    expect(PLANNED_DAILY.waterOz).toBe(64);
  });
  it('carries the walk exactly as written, marked an estimate', () => {
    expect(PLANNED_WALK).toMatchObject({ minutes: 28, mph: 2.5, estimatedCalories: 135, estimate: true });
  });
  it('carries the strength round exercise for exercise', () => {
    expect(PLANNED_STRENGTH.rounds).toBe(2);
    expect(PLANNED_STRENGTH.exercises.map((e) => [e.name, e.reps])).toEqual([
      ['Chair squats', 10], ['Wall push-ups', 10], ['Glute bridges', 12],
      ['Knee raises', 10], ['Calf raises', 15], ['Bird dogs', 8],
    ]);
  });
  it('keeps his "each leg" / "each side" phrasing', () => {
    expect(exerciseLabel(PLANNED_STRENGTH.exercises[3])).toBe('10 knee raises each leg');
    expect(exerciseLabel(PLANNED_STRENGTH.exercises[5])).toBe('8 bird dogs each side');
    expect(exerciseLabel(PLANNED_STRENGTH.exercises[0])).toBe('10 chair squats');
  });
  it('is his four meals, in his order', () => {
    expect(PLAN_MEALS).toEqual(['morning', 'lunch', 'snack', 'dinner']);
  });
});

describe('the pantry — his foods, his order, no invented nutrition', () => {
  it('is the nineteen foods he listed, in order', () => {
    expect(PROGRAM_PANTRY).toHaveLength(19);
    expect(PROGRAM_PANTRY[0].name).toBe('Homemade juice');
    expect(PROGRAM_PANTRY[18].name).toBe('Dressing');
    expect(PROGRAM_PANTRY.map((f) => f.name)).toContain('Orgain plant protein');
    expect(PROGRAM_PANTRY.map((f) => f.name)).toContain('Small baked potato');
  });
  it('PROVEN-TO-CATCH: NO food carries a calorie or protein number', () => {
    // He listed foods, not nutrition. A number here would be invented.
    for (const f of PROGRAM_PANTRY) {
      expect(f.calories).toBeUndefined();
      expect(f.proteinG).toBeUndefined();
    }
  });
  it('fills a food in only once she has confirmed it', () => {
    const withKnown = pantryWithKnown([{ name: 'Broccoli', serving: '1 cup', calories: 55, proteinG: 3.7 }]);
    const broc = withKnown.find((f) => f.name === 'Broccoli');
    expect(broc.calories).toBe(55);
    expect(broc.known).toBe(true);
    const salmon = withKnown.find((f) => f.name === 'Salmon');
    expect(salmon.calories).toBeNull();   // never 0
    expect(salmon.known).toBe(false);
  });
  it('survives an empty library', () => {
    expect(pantryWithKnown([]).every((f) => f.known === false)).toBe(true);
    expect(pantryWithKnown(null)).toHaveLength(19);
  });
});

describe('planned vs actual — planned never moves', () => {
  it('reports the gap without judgement', () => {
    const vs = plannedVsActual({ calories: 1487, proteinG: 132, waterOz: 56 });
    expect(vs.calories).toMatchObject({ planned: 1604, actual: 1487, gap: -117, recorded: true });
    expect(vs.protein.gap).toBe(-9.7);
    expect(vs.water.gap).toBe(-8);
  });
  it('PROVEN-TO-CATCH: an unrecorded actual is NULL, not zero', () => {
    const vs = plannedVsActual({});
    expect(vs.calories.actual).toBeNull();   // a 0 here reads as "ate nothing"
    expect(vs.calories.gap).toBeNull();
    expect(vs.calories.recorded).toBe(false);
    expect(vs.calories.planned).toBe(1604);  // planned still shows
  });
  it('planned is identical whatever the actual', () => {
    expect(plannedVsActual({ calories: 9999 }).calories.planned).toBe(1604);
    expect(plannedVsActual({}).calories.planned).toBe(1604);
  });
});

describe('the strength checklist', () => {
  it('is one box per exercise per round', () => {
    const list = strengthChecklist();
    expect(list).toHaveLength(12);
    expect(list.filter((c) => c.round === 1)).toHaveLength(6);
    expect(list.filter((c) => c.round === 2)).toHaveLength(6);
  });
  it('gives every box a unique id', () => {
    const ids = strengthChecklist().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
