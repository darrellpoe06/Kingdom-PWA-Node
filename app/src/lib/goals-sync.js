// =============================================================================
// goals-sync — cross-device sync for budget GOALS (the goal-driven engine)
// =============================================================================
// A goal is the family's own stated target — "save $X by date Y" or "pay off Z".
// This wrapper pools goals on the family instance so the plan the budget engine
// computes (budget-engine.js) is the same on every device the family signs in
// from. Flat-table wholesale pattern, identical in shape to forecast-sync.js:
// every local field maps to a column. See migration 0065-budget-goals.sql.
//
// SELF-CONTAINED: the BudgetPlanner surface owns this subscription directly
// (like Forecast owns forecastSync), so no monolith data-pipeline change is
// needed — add/edit/archive a goal writes here and the realtime feed fans it out.
import { createTableSync } from './table-sync.js';

// The full column set for one goal. Mirrors the goal shape the engine reads.
export function goalColumns(item) {
  return {
    slug:           item.id,
    name:           item.name || '',
    goal_type:      item.goalType || 'save',       // 'save' | 'payoff'
    scope:          item.scope || 'consolidated',  // 'consolidated' | entityId
    target_amount:  Number(item.targetAmount) || 0,
    target_date:    item.targetDate || null,
    start_date:     item.startDate || null,
    current_amount: Number(item.currentAmount) || 0,
    linked_debt_id: item.linkedDebtId || null,
    priority:       Number(item.priority) || 0,
    note:           item.note || '',
    archived:       !!item.archived,
  };
}

export const goalsSync = createTableSync({
  localKey: 'budgetGoals',
  remoteTable: 'budget_goals',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      ...goalColumns(item),
    };
  },

  fromRow(row) {
    return {
      id:            row.slug || `goal-remote-${row.id}`,
      remoteUuid:    row.id,
      name:          row.name || '',
      goalType:      row.goal_type || 'save',
      scope:         row.scope || 'consolidated',
      targetAmount:  Number(row.target_amount) || 0,
      targetDate:    row.target_date || null,
      startDate:     row.start_date || null,
      currentAmount: Number(row.current_amount) || 0,
      linkedDebtId:  row.linked_debt_id || null,
      priority:      Number(row.priority) || 0,
      note:          row.note || '',
      archived:      !!row.archived,
      createdAt:     row.created_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
