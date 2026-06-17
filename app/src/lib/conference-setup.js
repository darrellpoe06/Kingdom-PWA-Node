// =============================================================================
// conference-setup — the SETUP CHECKLIST / config skeleton (organizer guidance)
// =============================================================================
// Darrell 2026-06-16: the conference is SET UP + MANAGED in the app for weeks
// before the event, so the organizer setup path must be usable NOW. This is the
// "config skeleton": it reads the REAL conference state (no painted numbers) and
// tells the organizer, step by ordered step, what is already done (the KNOWN
// facts — South Campus venue + its rooms are seeded by migration 0024) and what
// is still BLANK and must be filled (dates, schedule). It NEVER fabricates dates,
// theme, or sessions — a blank shows as "— not set —".
//
// Pure + testable (DR-0076). The component (ConferenceSetupChecklist) is a thin
// render over conferenceSetupSteps(state).

// Status vocabulary -> drives the dot/label in the UI.
//   done    — configured (green)
//   todo    — BLANK, the organizer must fill it (amber)
//   partial — started but incomplete (amber)
//   info    — informational, no action needed (neutral)
export const SETUP_STATUSES = ['done', 'partial', 'todo', 'info'];

const has = (v) => typeof v === 'string' ? v.trim().length > 0 : v != null;

// Build the ordered setup steps from the real, live state. Every value shown is
// traced to a real record; blanks are explicit.
export function conferenceSetupSteps({ conference, venues, rooms, sessions, registrations, headCount } = {}) {
  const vs = (venues || []).filter((v) => v && v.status !== 'archived');
  const rs = (rooms || []).filter((r) => r && r.status !== 'archived');
  const ss = (sessions || []).filter((s) => s && s.status !== 'archived');
  const regs = (registrations || []).filter((r) => r && r.status !== 'cancelled');

  // South Campus is the named venue for the Assembly (known fact, seeded by 0024).
  const south = vs.find((v) => /south campus/i.test(v.name || ''));
  // Bookable rooms (service/class/food) that still have no real seat count.
  const bookable = rs.filter((r) => !(r.useTypes || []).includes('facility'));
  const roomsMissingCap = bookable.filter((r) => !Number.isFinite(r.capacity) || r.capacity == null);

  const steps = [];

  steps.push({
    key: 'name', title: 'Conference created',
    status: has(conference?.name) ? 'done' : 'todo',
    value: conference?.name || '— not set —',
    hint: has(conference?.name) ? null : 'Edit the conference front door and set the name.',
  });

  steps.push({
    key: 'theme', title: 'Theme',
    status: has(conference?.theme) ? 'done' : 'todo',
    value: conference?.theme || '— not set —',
    hint: has(conference?.theme) ? null : 'Add the Assembly theme in the front door.',
  });

  steps.push({
    key: 'dates', title: 'Dates',
    status: has(conference?.datesLabel) ? 'done' : 'todo',
    value: conference?.datesLabel || '— not set —',
    hint: has(conference?.datesLabel) ? null : 'Set the dates in the front door once they are confirmed.',
  });

  steps.push({
    key: 'venue', title: 'Venue (building)',
    status: south ? 'done' : (vs.length ? 'partial' : 'todo'),
    value: south ? `${south.name}${south.address ? ` — ${south.address}` : ''}` : (vs[0]?.name || '— not set —'),
    hint: south ? null : 'Add the South Campus Event Center (1109 N 4th Street) as a building.',
  });

  const roomNames = rs.map((r) => r.name).join(', ');
  steps.push({
    key: 'rooms', title: 'Rooms',
    status: rs.length === 0 ? 'todo' : (roomsMissingCap.length ? 'partial' : 'done'),
    value: rs.length ? `${rs.length} room${rs.length === 1 ? '' : 's'}: ${roomNames}` : '— none —',
    hint: rs.length === 0
      ? 'Add the rooms (Main Sanctuary, Fellowship Hall, Kitchen, Bathrooms).'
      : (roomsMissingCap.length ? `Set seat counts for: ${roomsMissingCap.map((r) => r.name).join(', ')}.` : null),
  });

  steps.push({
    key: 'schedule', title: 'Schedule (sessions)',
    status: ss.length ? 'done' : 'todo',
    value: ss.length ? `${ss.length} session${ss.length === 1 ? '' : 's'}` : '— none yet —',
    hint: ss.length ? null : 'Add the main services and the breakouts that run alongside them.',
  });

  steps.push({
    key: 'meals', title: 'Meals & dietary',
    status: 'info',
    value: 'Preferences + allergies auto-collected at registration (Regular / Vegetarian / Vegan / Gluten-free / Other) and tallied for catering.',
    hint: 'A served-menu editor is not in-app yet — publish the menu via comms for now.',
  });

  steps.push({
    key: 'registration', title: 'Open registration',
    status: 'done',
    value: 'Share the no-login link so the congregation can register.',
    hint: 'Copy the registration link below and text/post it.',
  });

  const n = Number.isFinite(headCount) ? headCount : regs.reduce((a, r) => a + (Number.isFinite(r.partySize) ? r.partySize : 1), 0);
  steps.push({
    key: 'attendees', title: 'Attendees',
    status: 'info',
    value: `${n} registered so far`,
    hint: null,
  });

  return steps;
}

// Progress over the ACTIONABLE steps (done / partial / todo); info steps excluded.
export function setupProgress(steps) {
  const actionable = (steps || []).filter((s) => s.status !== 'info');
  const done = actionable.filter((s) => s.status === 'done').length;
  const total = actionable.length;
  const remaining = actionable.filter((s) => s.status === 'todo' || s.status === 'partial').map((s) => s.title);
  return { done, total, remaining, complete: total > 0 && done === total };
}
