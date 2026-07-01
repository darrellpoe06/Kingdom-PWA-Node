// =============================================================================
// board-tasks-sync — cross-device sync for the Project Boards items (0058)
// =============================================================================
// The ProjectBoards module owns its own data lifecycle (the monolith is frozen —
// DR-0078 — so a NEW surface must not thread state through the shell). This
// controller is the module's substrate: subscribe() streams the instance's
// board_tasks and pushes realtime changes; upload/updateRow/deleteRow are the
// CRUD the board UI calls directly. All methods no-op signed-out, so the board
// works from local state alone and sync resumes on sign-in.
//
// Local shape (camelCase, what the board UI holds):
//   { id, slug, boardSlug, boardTitle, title, status, owner, group,
//     startDate, dueDate, sortRank, notes, links, remoteUuid }
// Remote shape (0058 board_tasks row): snake_case columns below.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export const boardTasksSync = createTableSync({
  localKey: 'boardTasks',
  remoteTable: 'board_tasks',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      slug:        item.slug,
      board_slug:  item.boardSlug ?? '',
      board_title: item.boardTitle ?? '',
      title:       item.title ?? '',
      status:      item.status ?? 'not-started',
      owner:       item.owner ?? null,
      group_label: item.group ?? null,
      start_date:  item.startDate ?? null,
      due_date:    item.dueDate ?? null,
      sort_rank:   item.sortRank != null ? Number(item.sortRank) : null,
      notes:       item.notes ?? null,
      links:       item.links && typeof item.links === 'object' ? item.links : {},
    };
  },

  fromRow(row) {
    return {
      id:         row.slug ?? `bt-remote-${row.id}`,
      remoteUuid: row.id,
      slug:       row.slug,
      boardSlug:  row.board_slug,
      boardTitle: row.board_title,
      title:      row.title ?? '',
      status:     row.status ?? 'not-started',
      owner:      row.owner ?? null,
      group:      row.group_label ?? null,
      startDate:  row.start_date ?? null,
      dueDate:    row.due_date ?? null,
      sortRank:   row.sort_rank ?? null,
      notes:      row.notes ?? null,
      links:      row.links && typeof row.links === 'object' ? row.links : {},
      createdAt:  row.created_at,
      updatedAt:  row.updated_at,
    };
  },

  idOf(item) {
    return item.slug ?? item.id;
  },
});

// Merge a fresh cloud list with the current local list, preserving any
// locally-created task whose INSERT hasn't landed yet (non-UUID slug id) — same
// data-loss guard the other syncs use (unionPreservingLocal keys off id).
export function mergeRemoteBoardTasks(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
