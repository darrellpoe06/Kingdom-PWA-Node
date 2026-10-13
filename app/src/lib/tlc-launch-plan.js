// =============================================================================
// tlc-launch-plan — the TLCTS LAUNCH tracker, as a board inside the app
// =============================================================================
// Darrell, 2026-09-10: "why would you use Google?! fix it build the whole
// process workflows!" The launch task tracker (Christina, Nov–Dec 2025, a
// sheet) is now data here and a live board on the Team section: every task
// with its category, owner and cadence, in the sheet's own words, and a
// status the office edits in the app (tlc_office_tasks, migration 0188) so
// Christina, Darrell and the assistant see the same board. The sheet's own
// status column read TBD on all but one row; those are `todo` here.
export const LAUNCH_STATUSES = ['todo', 'in-progress', 'done'];
export const LAUNCH_STATUS_LABEL = { todo: 'Not started', 'in-progress': 'In progress', done: 'Completed' };
export const LAUNCH_PHASES = ['Website', 'Marketing', 'Soft Launch', 'Full Launch', 'Post-Launch'];

export const LAUNCH_TASKS = Object.freeze([
  { key: 'website-therapist-pages', phase: 'Website', task: 'Create individual therapist pages with photos, bios, booking links', owner: 'Christina/Darrell', cadence: 'Weekly', due: '2025-11-24', seedStatus: 'done' },
  { key: 'website-test-booking', phase: 'Website', task: 'Test booking system / intake forms / Billing', owner: 'Darrell/Christina', cadence: 'Weekly', due: '2025-11-24', seedStatus: 'todo' },
  { key: 'marketing-social-pages', phase: 'Marketing', task: 'Create social media pages (FB, IG, LinkedIn)', owner: 'Darrell/Christina', cadence: 'Weekly', due: '2025-11-25', seedStatus: 'todo' },
  { key: 'marketing-initial-posts', phase: 'Marketing', task: 'Prepare initial posts (therapist intros, tips, quotes)', owner: 'Darrell/Christina', cadence: 'Daily', due: '2025-11-26', seedStatus: 'todo' },
  { key: 'marketing-google-booking', phase: 'Marketing', task: 'Test Google booking system', owner: 'Darrell/Christina', cadence: 'Daily', due: '2025-11-24', seedStatus: 'todo' },
  { key: 'marketing-ad-campaigns', phase: 'Marketing', task: 'Prepare ad campaigns (Google, FB, IG)', owner: 'Darrell/Christina', cadence: 'Daily', due: '2025-11-26', seedStatus: 'todo' },
  { key: 'marketing-therapy-sites', phase: 'Marketing', task: 'Make accounts for all therapy sites', owner: 'Christina/Darrell', cadence: 'Weekly', due: '2025-12-05', seedStatus: 'todo' },
  { key: 'soft-launch-friends-family', phase: 'Soft Launch', task: 'Invite friends/family to test booking — new system processes perfected by impact or value added', owner: 'Darrell/Christina/System', cadence: '', due: '2025-12-24', seedStatus: 'todo' },
  { key: 'full-launch-social', phase: 'Full Launch', task: 'Social media announcement', owner: 'Christina/System', cadence: '', due: '2025-12-05', seedStatus: 'todo' },
  { key: 'full-launch-email', phase: 'Full Launch', task: 'Email announcement to mailing list', owner: 'Christina/System', cadence: '', due: '2025-12-05', seedStatus: 'todo' },
  { key: 'full-launch-paid-ads', phase: 'Full Launch', task: 'Launch paid ad campaigns', owner: 'Darrell/System', cadence: '', due: '2025-12-08', seedStatus: 'todo' },
  { key: 'full-launch-outreach', phase: 'Full Launch', task: 'Community outreach (workshops, partnerships)', owner: 'Christina/Darrell/System', cadence: '', due: '2025-12-08', seedStatus: 'todo' },
  { key: 'post-launch-weekly-posts', phase: 'Post-Launch', task: 'Weekly social media posts', owner: 'Christina/Darrell/System', cadence: 'Weekly', due: '', seedStatus: 'todo' },
  { key: 'post-launch-analytics', phase: 'Post-Launch', task: 'Monitor analytics & adjust', owner: 'Christina/Darrell/System', cadence: 'Weekly', due: '', seedStatus: 'todo' },
  { key: 'post-launch-follow-up', phase: 'Post-Launch', task: 'Client follow-up & reviews', owner: 'Christina/Darrell/System', cadence: 'Weekly', due: '', seedStatus: 'todo' },
]);

export function launchTasksByPhase(statusByKey = {}) {
  return LAUNCH_PHASES.map((phase) => ({
    phase,
    tasks: LAUNCH_TASKS.filter((t) => t.phase === phase).map((t) => ({ ...t, status: normalizeStatus(statusByKey[t.key] || t.seedStatus) })),
  }));
}

export function normalizeStatus(s) { return LAUNCH_STATUSES.includes(s) ? s : 'todo'; }

export function launchProgress(statusByKey = {}) {
  const all = LAUNCH_TASKS.map((t) => normalizeStatus(statusByKey[t.key] || t.seedStatus));
  const done = all.filter((s) => s === 'done').length;
  const inProgress = all.filter((s) => s === 'in-progress').length;
  return { total: all.length, done, inProgress, pct: Math.round((done / all.length) * 100) };
}
