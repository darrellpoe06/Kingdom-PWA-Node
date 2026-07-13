// =============================================================================
// referral-ops — the TLC Therapy Solutions REFERRAL DATABASE + assistant system
// =============================================================================
// Darrell 2026-07-12 (detailed spec): the Executive Administrative & Marketing
// Assistant role (supervisor Christina Poe, LCSW) built for a 17-year-old in
// training — clear systems + checklists so she works independently in 30–60 days.
// The heart of the role, in Darrell's words, is "the biggest growth opportunity":
// a REFERRAL DATABASE built with purpose — not "Google therapists," but a research
// process that answers "Who regularly interacts with people who may need
// counseling?" and grows into a 2,500–3,000-organization referral network over a
// year, a long-term business asset.
//
// This file is the pure model for that system:
//   • The referral-source TAXONOMY (Medical / Education / Community / Business /
//     Legal), the "who refers clients" lens.
//   • GEOGRAPHIC CIRCLES — Champaign-Urbana first, then expanding outward, so the
//     local network is strong before reaching out.
//   • The daily CATEGORY ROTATION (one category a day) + the daily/weekly TARGETS.
//   • The ORGANIZATION record (the spreadsheet schema Darrell drew) + OUTCOMES.
//   • The social-media weekly CONTENT THEMES.
//   • Derived roll-ups: the Daily Report + Weekly Goals, computed from REAL records.
//
// CONFIDENTIALITY / NO PHI (binding — matches the existing Practice "pre-patient,
// NO PHI" boundary): this database holds REFERRAL SOURCES — organizations and
// their office contacts — NOT clients and NOT any protected health information.
// No client names, no clinical data. That line is not crossed here.
//
// PURE + DETERMINISTIC (DR-0076): no localStorage / Date.now here — callers pass
// `now` (ISO). Persistence lives in use-referral-ops.js. REAL DATA, NOTHING
// PAINTED (DR-0061): every count on the surface derives from real org/post records.
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ---------------------------------------------------------------------------
// ARI_AUTOMATION_PATH — the vision (Darrell 2026-07-12): "have our Inbound learn
// the outbound so Ari can do this for us 24/7 eventually." This workspace is the
// substrate — it STRUCTURES the outbound (org → contact → message → outcome) so
// it becomes Ari's training signal, and it captures the INBOUND attribution that
// teaches which sources actually convert. Built stage-by-stage on the normal
// delivery lane; `built` marks what's shipped so far.
// ---------------------------------------------------------------------------
export const ARI_AUTOMATION_PATH = [
  { stage: 1, name: 'Assistant runs it', detail: 'The human assistant works the system; the workspace structures every action into a record — Ari’s training set.', built: true },
  { stage: 2, name: 'Ari drafts', detail: 'Ari suggests today’s targets and writes personalized outreach; the human reviews and sends.', built: false },
  { stage: 3, name: 'Ari sends approved', detail: 'Ari sends approved messages to verified contacts and schedules + logs follow-ups.', built: false },
  { stage: 4, name: 'Ari runs it 24/7', detail: 'Research → draft → send → follow-up → learn from inbound outcomes, around the clock.', built: false },
];
// The ACTUAL external constraints on automating outbound (not process caution):
export const OUTBOUND_CONSTRAINTS = [
  { id: 'compliance', label: 'Email/call law', detail: 'CAN-SPAM (real sender identity, physical address, working opt-out) for email; TCPA (consent, do-not-call) for automated calls/texts.' },
  { id: 'deliverability', label: 'Deliverability & reputation', detail: 'Volume cold-sending from a domain without SPF/DKIM/DMARC + warmup + pacing lands in spam and burns the domain — send through compliant infra.' },
  { id: 'verification', label: 'Contact accuracy', detail: 'Contact data goes stale and Ari can hallucinate; verify against a real source before any send so goodwill isn’t wasted on the wrong person.' },
  { id: 'human-touch', label: 'The relationship is human', detail: 'Physicians, pastors, and HR convert on trust; automation handles research/logistics, the relational touch stays human — especially early.' },
  { id: 'attribution', label: 'Attribution quality', detail: 'Inbound-learns-outbound only works if intake reliably records HOW each inquiry found TLC — bad attribution optimizes the wrong sources.' },
  { id: 'licensure', label: 'Service area', detail: 'Christina is licensed in Illinois — outreach beyond where TLC can actually serve is wasted or misleading.' },
];
export const ARI_AUTOMATION_NOTE =
  'Inbound learns outbound: when an inquiry names how it found TLC, that attribution teaches which referral sources actually convert — so Ari doubles down on what works.';
const asArr = (v) => (Array.isArray(v) ? v : []);
const rid = (p, seed) => `${p}-${asStr(seed) || Math.random().toString(36).slice(2, 9)}`;

export const NO_PHI_NOTE =
  'Referral sources only — organizations and office contacts, never clients or any protected health information. TLC keeps client data out of this workspace.';

// ---------------------------------------------------------------------------
// REFERRAL_CATEGORIES — "who regularly interacts with people who may need
// counseling?" Each category carries its sub-types + the search terms the
// assistant uses, straight from Darrell's research process.
// ---------------------------------------------------------------------------
export const REFERRAL_CATEGORIES = [
  { id: 'medical', label: 'Medical', types: ['Primary care physicians', 'Pediatricians', 'OB/GYN offices', 'Nurse practitioners', 'Urgent care', 'Hospitals', 'Oncology / cancer centers', 'Neurology', 'Pain management', "Women's health clinics"],
    searches: ['primary care physician Champaign IL', 'family medicine Champaign IL', 'OBGYN Champaign IL', 'pediatrician Urbana IL'] },
  { id: 'education', label: 'Education', types: ['School counselors', 'School social workers', 'School psychologists', 'College counseling centers', 'University student affairs', 'Special education coordinators'],
    searches: ['school district Champaign', 'private schools Champaign', 'Christian schools Champaign', 'college counseling center Urbana'] },
  { id: 'community', label: 'Community', types: ['Churches', 'Pastors', 'Community centers', 'Youth organizations', 'Domestic violence organizations', 'Homeless shelters', 'Food pantries', 'Pregnancy resource centers'],
    searches: ['churches Champaign IL', 'Black churches Champaign IL', 'churches Urbana IL', 'community center Champaign'] },
  { id: 'business', label: 'Business', types: ['Human Resources departments', 'Employee Assistance Programs (EAPs)', 'Large employers', 'Manufacturing companies', 'Banks', 'City & county government'],
    searches: ['large employers Champaign IL', 'HR department Champaign', 'manufacturing Champaign IL'] },
  { id: 'legal', label: 'Legal', types: ['Family law attorneys', 'Divorce attorneys', 'Guardianship attorneys', 'Probation offices'],
    searches: ['family law attorney Champaign IL', 'divorce attorney Champaign IL', 'guardianship attorney Champaign'] },
];
export const referralCategory = (id) => REFERRAL_CATEGORIES.find((c) => c.id === asStr(id)) || null;

// ---------------------------------------------------------------------------
// GEO_CIRCLES — expand the network in circles: complete Champaign-Urbana first,
// then work outward. `order` drives the "finish the inner circle first" view.
// ---------------------------------------------------------------------------
export const GEO_CIRCLES = [
  'Champaign-Urbana', 'Danville', 'Rantoul', 'Mahomet', 'Monticello', 'Savoy',
  'St. Joseph', 'Tuscola', 'Decatur', 'Bloomington-Normal', 'Springfield', 'Rest of Illinois',
].map((name, i) => ({ id: rid('circle', String(i)), name, order: i }));
export const geoCircle = (name) => GEO_CIRCLES.find((c) => c.name === asStr(name)) || null;

// ---------------------------------------------------------------------------
// OUTCOMES — how a contact responded (Darrell's list) + a neutral "not yet".
// ---------------------------------------------------------------------------
export const OUTCOMES = [
  { id: 'none', label: 'No response yet', open: true },
  { id: 'interested', label: 'Interested', good: true },
  { id: 'requested-info', label: 'Requested more information', good: true },
  { id: 'referral-coordinator', label: 'Has a referral coordinator', good: true },
  { id: 'call-back', label: 'Call back', open: true },
  { id: 'not-interested', label: 'Not interested' },
  { id: 'has-therapist', label: 'Already has a therapist' },
];
export const outcome = (id) => OUTCOMES.find((o) => o.id === asStr(id)) || OUTCOMES[0];

// ---------------------------------------------------------------------------
// DAILY_ROTATION — one category a day, so research has a clear focus (the schedule
// Darrell laid out; Sat/Sun light). weekday() is JS 0=Sun..6=Sat.
// ---------------------------------------------------------------------------
export const DAILY_ROTATION = {
  1: 'medical',     // Monday — Primary care physicians
  2: 'medical',     // Tuesday — OB/GYN (medical sub-focus)
  3: 'community',   // Wednesday — Churches
  4: 'education',   // Thursday — Schools
  5: 'business',    // Friday — Large employers
  6: 'legal',       // Saturday — light: legal / catch-up
  0: 'community',   // Sunday — light: community
};
export function categoryForDay(nowIso) {
  const t = Date.parse(asStr(nowIso));
  if (!Number.isFinite(t)) return null;
  return referralCategory(DAILY_ROTATION[new Date(t).getUTCDay()]);
}

// ---------------------------------------------------------------------------
// TARGETS — the daily/weekly goals + the year-long network goal.
// ---------------------------------------------------------------------------
export const DAILY_TARGET_CONTACTS = 12;              // "10–15 new contacts every day"
// Weekly targets as ranges (Darrell's Friday goals); pct measures against the min.
export const WEEKLY_TARGETS = {
  contacts: { min: 75, max: 100 }, emails: { min: 50, max: 75 }, calls: { min: 25, max: 40 },
  posts: { min: 5, max: 7 }, reels: { min: 2, max: 2 }, flyers: { min: 1, max: 2 },
};
export const NETWORK_GOAL = { low: 2500, high: 3000 };  // over a year

// ---------------------------------------------------------------------------
// DAY_BLOCKS — the 12:00–5:00 PM shift, time-blocked (Darrell's schedule). The
// afternoon is chosen on purpose: businesses are open, people answer phones/email,
// and Christina can meet at the start or end of the shift.
// ---------------------------------------------------------------------------
export const DAY_BLOCKS = [
  { time: '12:00–12:20', name: 'Daily CEO meeting', detail: 'Review priorities, check the calendar and deadlines, and write today’s task list.' },
  { time: '12:20–1:20', name: 'Marketing', detail: 'Create social posts, schedule content, design flyers in Canva, update the website.' },
  { time: '1:20–2:30', name: 'Business development', detail: 'Research referral sources, send emails, make outreach calls, update the outreach spreadsheet.' },
  { time: '2:30–3:15', name: 'Poe Tech', detail: 'Test app features, record bugs/suggestions, enter customer + worker payments, verify.' },
  { time: '3:15–4:15', name: 'Executive support', detail: 'Enter QVS appointments, organize the calendar, reminders, grocery list + order (with approval), prep tomorrow.' },
  { time: '4:15–5:00', name: 'Wrap up', detail: 'Organize files + spreadsheets, finish tasks, write the daily summary, review tomorrow together (last 10–15 min debrief).' },
];

// WEEKLY_PLAN — the Mon–Fri focus, so each day has a clear shape.
export const WEEKLY_PLAN = [
  { day: 'Monday', focus: ['Weekly planning meeting', 'Create the week’s social schedule', 'Build the outreach list', 'Organize the calendar', 'Set weekly priorities'] },
  { day: 'Tuesday', focus: ['Outreach calls + emails', 'Social media creation', 'Poe Tech testing'] },
  { day: 'Wednesday', focus: ['Follow-up calls', 'Send flyers', 'Administrative work', 'Update spreadsheets'] },
  { day: 'Thursday', focus: ['Outreach to new organizations', 'Poe Tech testing', 'Calendar management', 'Marketing content'] },
  { day: 'Friday', focus: ['Finish follow-ups', 'Weekly marketing report', 'Weekly outreach report', 'Organize next week', 'Review meeting'] },
];

// ---------------------------------------------------------------------------
// CONTENT_THEMES — the weekly social-media themes (Darrell's calendar).
// ---------------------------------------------------------------------------
export const CONTENT_THEMES = [
  { day: 'Monday', theme: 'Mental Health Monday' },
  { day: 'Tuesday', theme: 'Therapy Tip Tuesday' },
  { day: 'Wednesday', theme: 'Wellness Wednesday' },
  { day: 'Thursday', theme: 'Testimonial Thursday' },
  { day: 'Friday', theme: 'Faith & Wellness Friday' },
  { day: 'Saturday', theme: 'Meet the Therapist' },
  { day: 'Sunday', theme: 'Inspirational Quote' },
];
export const SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn'];
export const POST_STATUSES = ['idea', 'drafted', 'scheduled', 'posted'];

// ---------------------------------------------------------------------------
// Templates — the email script + the phone script (copy, change the name).
// ---------------------------------------------------------------------------
export const EMAIL_TEMPLATE =
  'Subject: A local counseling resource for the people you serve\n\n' +
  'Good afternoon [Name],\n\n' +
  'My name is [Your name] with TLC Therapy Solutions here in Champaign-Urbana. ' +
  'We provide compassionate, faith-friendly counseling, and we partner with offices ' +
  'like yours so you have a trusted place to refer clients who could use support.\n\n' +
  'I’ve attached our flyer. If you have a referral coordinator, I’d be glad to connect. ' +
  'Thank you for the care you give your community.\n\n' +
  'Warmly,\n[Your name]\nTLC Therapy Solutions';
export const CALL_SCRIPT =
  'Good afternoon! My name is [Your name]. I’m calling from TLC Therapy Solutions. ' +
  'Could you tell me who handles community referrals or provider information?';

// ---------------------------------------------------------------------------
// Factories (pure)
// ---------------------------------------------------------------------------
export function makeOrg(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('org'),
    organization: asStr(p.organization),
    categoryId: referralCategory(p.categoryId) ? p.categoryId : 'medical',
    type: asStr(p.type),                 // the sub-type (e.g. "Primary care physicians")
    circle: geoCircle(p.circle) ? p.circle : GEO_CIRCLES[0].name,
    contactPerson: asStr(p.contactPerson),
    jobTitle: asStr(p.jobTitle),
    email: asStr(p.email),
    phone: asStr(p.phone),
    website: asStr(p.website),
    address: asStr(p.address),
    flyerSent: !!p.flyerSent,
    emailedOn: asStr(p.emailedOn) || null,
    calledOn: asStr(p.calledOn) || null,
    followUpOn: asStr(p.followUpOn) || null,
    outcomeId: outcome(p.outcomeId).id,
    // Inbound-learns-outbound: how many inbound inquiries have been attributed to
    // this source. The signal that teaches which referral sources actually convert
    // (wired to the Inbound system in Stage 2). Real count, never painted.
    clientsReferred: Math.max(0, asNum(p.clientsReferred, 0)),
    notes: asStr(p.notes),
    addedIso: asStr(p.addedIso) || asStr(now) || null,
  };
}

export function makePost(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('post'),
    theme: asStr(p.theme),
    caption: asStr(p.caption),
    platforms: asArr(p.platforms).filter((x) => SOCIAL_PLATFORMS.includes(x)),
    hashtags: asStr(p.hashtags),
    status: POST_STATUSES.includes(p.status) ? p.status : 'idea',
    isReel: !!p.isReel,
    scheduledFor: asStr(p.scheduledFor) || null,
    createdIso: asStr(p.createdIso) || asStr(now) || null,
  };
}

// A saved "social media idea" the assistant keeps (the ideas folder).
export function makeIdea(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return { id: asStr(p.id) || rid('idea'), text: asStr(p.text), createdIso: asStr(p.createdIso) || asStr(now) || null };
}

export function validateOrg(partial) {
  if (!asStr(partial && partial.organization).trim()) return { ok: false, error: 'An organization name is required.' };
  if (!referralCategory(partial.categoryId)) return { ok: false, error: 'Pick a category.' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Derivations — the roll-ups, all from real records
// ---------------------------------------------------------------------------
function sameDay(aIso, bIso) {
  const a = Date.parse(asStr(aIso)); const b = Date.parse(asStr(bIso));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const da = new Date(a); const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
}
function withinDays(iso, nowIso, days) {
  const t = Date.parse(asStr(iso)); const n = Date.parse(asStr(nowIso));
  if (!Number.isFinite(t) || !Number.isFinite(n)) return false;
  const diff = (n - t) / 86400000;
  return diff >= 0 && diff < days;
}

export function orgStats(orgs) {
  const list = asArr(orgs);
  const byCategory = {};
  const byCircle = {};
  for (const o of list) {
    byCategory[o.categoryId] = (byCategory[o.categoryId] || 0) + 1;
    byCircle[o.circle] = (byCircle[o.circle] || 0) + 1;
  }
  return {
    total: list.length,
    byCategory,
    byCircle,
    flyersSent: list.filter((o) => o.flyerSent).length,
    interested: list.filter((o) => outcome(o.outcomeId).good).length,
  };
}

// Contacts whose follow-up date is due (on or before now) and still open.
export function followUpsDue(orgs, nowIso) {
  const n = Date.parse(asStr(nowIso));
  return asArr(orgs).filter((o) => {
    if (!o.followUpOn) return false;
    const t = Date.parse(o.followUpOn);
    return Number.isFinite(t) && Number.isFinite(n) && t <= n && outcome(o.outcomeId).open;
  });
}

// The Daily Report — today's real activity, matching Darrell's summary sheet.
export function dailyReport(orgs, posts, nowIso) {
  const list = asArr(orgs);
  const contactsAdded = list.filter((o) => sameDay(o.addedIso, nowIso)).length;
  const emailsSent = list.filter((o) => sameDay(o.emailedOn, nowIso)).length;
  const callsMade = list.filter((o) => sameDay(o.calledOn, nowIso)).length;
  const postsCreated = asArr(posts).filter((p) => sameDay(p.createdIso, nowIso)).length;
  return {
    contactsAdded,
    emailsSent,
    callsMade,
    followUpsNeeded: followUpsDue(list, nowIso).length,
    postsCreated,
    dailyTarget: DAILY_TARGET_CONTACTS,
    metTarget: contactsAdded >= DAILY_TARGET_CONTACTS,
  };
}

// Weekly progress vs the weekly targets (last 7 days of real records).
export function weeklyProgress(orgs, posts, nowIso) {
  const list = asArr(orgs);
  const pl = asArr(posts);
  const contacts = list.filter((o) => withinDays(o.addedIso, nowIso, 7)).length;
  const emails = list.filter((o) => withinDays(o.emailedOn, nowIso, 7)).length;
  const calls = list.filter((o) => withinDays(o.calledOn, nowIso, 7)).length;
  const postsMade = pl.filter((p) => withinDays(p.createdIso, nowIso, 7)).length;
  const reels = pl.filter((p) => p.isReel && withinDays(p.createdIso, nowIso, 7)).length;
  const row = (n, t) => ({ n, min: t.min, max: t.max, pct: t.min > 0 ? Math.min(100, Math.round((n / t.min) * 100)) : 100 });
  return {
    contacts: row(contacts, WEEKLY_TARGETS.contacts),
    emails: row(emails, WEEKLY_TARGETS.emails),
    calls: row(calls, WEEKLY_TARGETS.calls),
    posts: row(postsMade, WEEKLY_TARGETS.posts),
    reels: row(reels, WEEKLY_TARGETS.reels),
  };
}

// Which referral SOURCES actually convert — the inbound-learns-outbound signal.
// Sources ranked by attributed inbound inquiries; also rolls up by category so
// Ari (and the assistant) can double down on the categories that produce clients.
export function topConvertingSources(orgs, limit = 5) {
  const list = asArr(orgs).filter((o) => asNum(o.clientsReferred, 0) > 0)
    .sort((a, b) => asNum(b.clientsReferred, 0) - asNum(a.clientsReferred, 0));
  const byCategory = {};
  let totalReferred = 0;
  for (const o of asArr(orgs)) {
    const n = asNum(o.clientsReferred, 0);
    if (n > 0) { byCategory[o.categoryId] = (byCategory[o.categoryId] || 0) + n; totalReferred += n; }
  }
  return { sources: list.slice(0, limit), byCategory, totalReferred };
}

// Progress toward the year-long 2,500–3,000 network goal.
export function networkGoal(orgs) {
  const total = asArr(orgs).length;
  return { total, low: NETWORK_GOAL.low, high: NETWORK_GOAL.high, pct: Math.min(100, Math.round((total / NETWORK_GOAL.low) * 100)) };
}

// ---------------------------------------------------------------------------
// Seed (SEED-DATA-AS-ASPIRATION) — a few clearly-sample referral sources so the
// database renders real derived numbers. Generic office names (no real people).
// `seed-` ids so a future sync filters them from any cloud upload.
// ---------------------------------------------------------------------------
export const SEED_ORGS = [
  makeOrg({ id: 'seed-org-01', organization: 'Sample Family Medicine (CU)', categoryId: 'medical', type: 'Primary care physicians', circle: 'Champaign-Urbana', jobTitle: 'Practice Manager', flyerSent: true, emailedOn: '2026-07-10T15:00:00.000Z', followUpOn: '2026-07-17T15:00:00.000Z', outcomeId: 'requested-info', clientsReferred: 3, addedIso: '2026-07-10T15:00:00.000Z' }),
  makeOrg({ id: 'seed-org-02', organization: 'Sample Community Church (CU)', categoryId: 'community', type: 'Churches', circle: 'Champaign-Urbana', jobTitle: 'Administrative Assistant', flyerSent: true, emailedOn: '2026-07-10T16:00:00.000Z', outcomeId: 'interested', clientsReferred: 2, addedIso: '2026-07-10T16:00:00.000Z' }),
  makeOrg({ id: 'seed-org-03', organization: 'Sample School District (CU)', categoryId: 'education', type: 'School counselors', circle: 'Champaign-Urbana', jobTitle: 'School Counselor', outcomeId: 'none', addedIso: '2026-07-11T14:00:00.000Z' }),
  makeOrg({ id: 'seed-org-04', organization: 'Sample Employer HR (CU)', categoryId: 'business', type: 'Employee Assistance Programs (EAPs)', circle: 'Champaign-Urbana', jobTitle: 'HR Manager', calledOn: '2026-07-11T18:00:00.000Z', outcomeId: 'call-back', followUpOn: '2026-07-15T18:00:00.000Z', addedIso: '2026-07-11T18:00:00.000Z' }),
  makeOrg({ id: 'seed-org-05', organization: 'Sample Family Law Office (CU)', categoryId: 'legal', type: 'Family law attorneys', circle: 'Champaign-Urbana', jobTitle: 'Office Manager', outcomeId: 'none', addedIso: '2026-07-12T15:00:00.000Z' }),
];

export const SEED_POSTS = [
  makePost({ id: 'seed-post-01', theme: 'Mental Health Monday', caption: 'Sample caption — a gentle reminder that asking for help is strength.', platforms: ['Facebook', 'Instagram'], hashtags: '#MentalHealthMonday #TLCTherapy', status: 'posted', createdIso: '2026-07-06T13:00:00.000Z' }),
  makePost({ id: 'seed-post-02', theme: 'Therapy Tip Tuesday', caption: 'Sample caption — name the feeling, then choose the next small step.', platforms: ['Instagram', 'LinkedIn'], hashtags: '#TherapyTipTuesday', status: 'scheduled', createdIso: '2026-07-07T13:00:00.000Z' }),
];

export function mergeSeed(userRows, seeds) {
  const byId = new Map();
  for (const s of asArr(seeds)) if (s && s.id) byId.set(s.id, s);
  for (const u of asArr(userRows)) if (u && u.id) byId.set(u.id, u);
  return Array.from(byId.values());
}
export const isSeedId = (id) => typeof id === 'string' && id.startsWith('seed-');
