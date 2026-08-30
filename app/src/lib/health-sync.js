// =============================================================================
// health-sync — cross-device rails for the Road to 150 program, weigh-ins, water
// =============================================================================
// Three flat-table rails in the goals-sync / forecast-sync shape: every local
// field maps to a column, `slug` carries the stable local id, and the surface
// owns the subscription directly so no monolith data-pipeline change is needed.
// Backed by migration 0162.
//
// PLANNED DATA IS NOT HERE, ON PURPOSE. The 26 weekly targets, the 64 oz goal
// and the meal/walk/strength plan are program CONTENT (lib/road-to-150-program.js)
// and are never uploaded as user rows. These rails carry only what the person
// ACTUALLY did. There is consequently no code path that writes an actual into a
// planned field — the separation Darrell stated three times is structural.
//
// ONE EXCEPTION, DELIBERATE: `weeklyTargets` is stored on the enrollment row.
// Darrell's brief: "Do not automatically alter historical target values...
// target changes must be explicit and stored separately from the original Road
// to 150 roadmap." Freezing the roadmap AS ENROLLED means a later edit to the
// repo template cannot silently rewrite someone's history.
//
// PRIVACY: these rows are owner-only at the database (0162 RLS scopes every one
// to created_by = auth.uid()). A family member cannot read another's weigh-ins,
// and neither can an instance admin. The client never widens that.
import { createTableSync } from './table-sync.js';

// ── the enrollment ───────────────────────────────────────────────────────────
export const healthProgramsSync = createTableSync({
  localKey: 'healthPrograms',
  remoteTable: 'health_programs',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:     tenantId,
      created_by:      userId,
      slug:            item.id,
      template_slug:   item.templateSlug || 'road-to-150',
      name:            item.name || 'Road to 150',
      start_date:      item.startDate || null,
      start_weight_lb: Number(item.startWeightLb) || 0,
      goal_weight_lb:  Number(item.goalWeightLb) || 0,
      weeks:           Number(item.weeks) || 0,
      water_goal_oz:   Number(item.waterGoalOz) || 64,
      weekly_targets:  item.weeklyTargets || [],
      active:          item.active !== false,
    };
  },

  fromRow(row) {
    return {
      id:            row.slug || `hp-remote-${row.id}`,
      remoteUuid:    row.id,
      templateSlug:  row.template_slug || 'road-to-150',
      name:          row.name || 'Road to 150',
      startDate:     row.start_date || null,
      startWeightLb: Number(row.start_weight_lb) || 0,
      goalWeightLb:  Number(row.goal_weight_lb) || 0,
      weeks:         Number(row.weeks) || 0,
      waterGoalOz:   Number(row.water_goal_oz) || 64,
      weeklyTargets: row.weekly_targets || [],
      active:        row.active !== false,
      createdAt:     row.created_at,
    };
  },
});

// ── ACTUAL weigh-ins ─────────────────────────────────────────────────────────
export const weightEntriesSync = createTableSync({
  localKey: 'weightEntries',
  remoteTable: 'weight_entries',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      slug:        item.id,
      day:         item.day,
      weight_lb:   Number(item.weightLb),
      note:        item.note || '',
    };
  },

  fromRow(row) {
    return {
      id:         row.slug || `wt-remote-${row.id}`,
      remoteUuid: row.id,
      day:        row.day,
      // Number() not `|| 0`: a real 0 is impossible for a body weight, and a
      // fallback of 0 would turn a bad read into a fake reading. The engine
      // drops a non-finite weight rather than charting it (health-program.js).
      weightLb:   Number(row.weight_lb),
      note:       row.note || '',
      createdAt:  row.created_at,
    };
  },
});

// ── ACTUAL water ─────────────────────────────────────────────────────────────
export const waterEntriesSync = createTableSync({
  localKey: 'waterEntries',
  remoteTable: 'water_entries',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      slug:        item.id,
      day:         item.day,
      oz:          Number(item.oz),
      drank_at:    item.at || new Date().toISOString(),
    };
  },

  fromRow(row) {
    return {
      id:         row.slug || `wa-remote-${row.id}`,
      remoteUuid: row.id,
      day:        row.day,
      oz:         Number(row.oz),
      at:         row.drank_at || row.created_at,
      createdAt:  row.created_at,
    };
  },
});
