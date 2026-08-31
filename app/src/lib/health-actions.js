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
  const { healthProgramsSync, weightEntriesSync, waterEntriesSync, foodEntriesSync, foodLibrarySync } = syncs;

  const programs = railCrud(healthProgramsSync, 'healthPrograms', 'health-programs-sync');
  const weights = railCrud(weightEntriesSync, 'weightEntries', 'weight-entries-sync');
  const waters = railCrud(waterEntriesSync, 'waterEntries', 'water-entries-sync');
  const foods = railCrud(foodEntriesSync, 'foodEntries', 'food-entries-sync');
  const library = railCrud(foodLibrarySync, 'foodLibrary', 'food-library-sync');

  // REMEMBER a food the person just confirmed, so next time it fills itself in.
  // Only writes when a real number was given -- remembering "no idea" would make
  // the library assert something it does not know. Re-logging the same food
  // UPDATES its one row rather than stacking a second, conflicting answer.
  const remember = (item) => {
    if (item.calories == null && item.proteinG == null) return;
    const key = String(item.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key) return;
    const existing = ((getData() || {}).foodLibrary || []).find((f) => f && f.nameKey === key);
    const now = new Date().toISOString();
    if (existing) {
      library.update(existing.id, {
        serving: item.serving || existing.serving || '',
        calories: item.calories == null ? existing.calories : item.calories,
        proteinG: item.proteinG == null ? existing.proteinG : item.proteinG,
        timesUsed: (Number(existing.timesUsed) || 1) + 1,
        lastUsedAt: now,
      });
      return;
    }
    library.add({
      id: `fl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: item.name, nameKey: key, serving: item.serving || '',
      calories: item.calories, proteinG: item.proteinG,
      source: item.source || 'entered', timesUsed: 1, lastUsedAt: now,
    });
  };

  return {
    startHealthProgram: (item) => programs.add({ ...item, id: `hp-${Date.now()}` }),

    // ACTUAL food. One row per ITEM, so removing one does not rewrite the rest
    // and a meal total is always derived from its items rather than stored.
    // Nothing here writes a planned value -- there is no planned food to write.
    addFoodEntry: (item) => {
      foods.add({
        ...item,
        id: `fd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      });
      remember(item);
    },
    updateFoodEntry: foods.update,
    deleteFoodEntry: foods.remove,

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
export { healthProgramsSync, weightEntriesSync, waterEntriesSync, foodEntriesSync, foodLibrarySync, healthRails } from './health-sync.js';
