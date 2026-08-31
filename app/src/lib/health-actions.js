// =============================================================================
// health-actions — the Road to 150 write paths, out of the frozen shell
// =============================================================================
// The monolith shell (poe-financial-mvp-v28.jsx) is frozen to bug-fixes only and
// its line count may go DOWN, never UP (monolith-budget-guard). So the program's
// CRUD lives here and the shell keeps one call. That is the hybrid-modular rule
// working as intended: a new feature's logic goes in lib/, not in the shell.
//
// THE INVARIANT THIS MODULE ENFORCES: there is no setter here for a PLANNED
// value. The 26 weekly targets, the water goal and the meal/walk/strength plan
// are program CONTENT (lib/road-to-150-program.js, frozen). Every function below
// writes only what the person ACTUALLY did, so no code path exists by which
// recording an actual overwrites a planned figure -- the rule Darrell stated
// three times in the brief, held structurally rather than by convention.

/**
 * Build the program's write paths.
 *
 * @param railCrud  the shell's synced-list CRUD factory (sync, key, label)
 * @param getData   () => the live data object, for the same-day weigh-in lookup
 */
export function makeHealthActions(railCrud, getData, syncs) {
  const { healthProgramsSync, weightEntriesSync, waterEntriesSync } = syncs;

  const programs = railCrud(healthProgramsSync, 'healthPrograms', 'health-programs-sync');
  const weights = railCrud(weightEntriesSync, 'weightEntries', 'weight-entries-sync');
  const waters = railCrud(waterEntriesSync, 'waterEntries', 'water-entries-sync');

  return {
    startHealthProgram: (item) => programs.add({ ...item, id: `hp-${Date.now()}` }),

    // One weigh-in per day: re-weighing the same day CORRECTS that day rather
    // than stacking a second reading the graph would have to choose between.
    addWeightEntry: (item) => {
      const existing = ((getData() || {}).weightEntries || []).find((e) => e.day === item.day);
      if (existing) {
        weights.update(existing.id, { weightLb: item.weightLb, note: item.note || '' });
        return;
      }
      weights.add({ ...item, id: `wt-${Date.now()}`, createdAt: new Date().toISOString() });
    },

    // Timestamped and additive -- a day's total is DERIVED by filtering on `day`,
    // so a new day reads 0 without anything being cleared or lost.
    addWaterEntry: (item) => waters.add({
      ...item,
      id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }),

    deleteWaterEntry: waters.remove,
  };
}

// Re-exported so the frozen shell reaches every health helper through one
// import line (the budget guard holds it at exactly 5331 lines).
export { canSeeHealthTab } from './health-program.js';
export { healthProgramsSync, weightEntriesSync, waterEntriesSync, healthRails } from './health-sync.js';
