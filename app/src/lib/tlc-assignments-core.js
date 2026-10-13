// Pure half of lib/tlc-assignments.js (no supabase import) so the rules are
// testable in node and shared by the seam and the surfaces.
export function normalizeEmail(e) { return String(e || '').trim().toLowerCase(); }

export function validAssignment({ clientEmail, lesson, dueOn = null, note = '' }) {
  const problems = [];
  const email = normalizeEmail(clientEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) problems.push('a valid client email');
  if (!lesson || !lesson.id || !lesson.title) problems.push('a lesson');
  if (dueOn && !/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) problems.push('a due date as YYYY-MM-DD');
  if (note && note.length > 500) problems.push('a note under 500 characters');
  return problems;
}

// The rows split for a client's "For you" area.
export function splitAssignments(rows = []) {
  const due = rows.filter((r) => r.status !== 'reviewed');
  const done = rows.filter((r) => r.status === 'reviewed');
  return { due, done };
}
