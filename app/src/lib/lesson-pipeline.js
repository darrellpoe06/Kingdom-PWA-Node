// =============================================================================
// lesson-pipeline — each lesson, from arrival to live, with the time each step
// took (DR-0672)
// =============================================================================
// Darrell 2026-09-29: "Do we need claude? Can we build the workflows inside the
// PoeTech App?" / "Yes build it all in the app!!!" He asked for timeliness for
// each workflow. Your lessons already said whether Whisper had written a spoken
// lesson down (DR-0622); this derives the whole road, stage by stage, from the
// row's own tags and the real pull request:
//
//   recorded  the lesson row itself (its created_at)
//   words     the transcript row (voice-transcript + of:<id>), or the failure
//             row (voice-failed + of:<id>) and its stated reason. A typed
//             lesson's words arrive with it.
//   building  `lesson-building` (the builder says it started) or
//             `lesson-captured` (the builder pushed). A member's lesson waits
//             for the Governor's word first (lesson-approved / lesson-declined).
//   pr        `lesson-pr:<n>`, read live from GitHub (opened_at, merged_at).
//   live      the lesson named by `lesson-id:<id>` is in the catalog of the
//             build you are running. That is the evidence: not "merged", not
//             "deploys on merge", but the lesson present in this app.
//
// DR-0076: a stage is `done` only on evidence. With no evidence it is
// `unknown`, and the line says what is missing. Times come from real
// timestamps; a stage with no timestamp shows no time, never an estimate.
// Pure except fetchLessonPrs, whose reads are injected.
// =============================================================================
import { buildSituationIndex, defaultLessonCourses } from './lessons-for-situation.js';
import { SOVEREIGN_AI_MODULES } from './sovereign-ai-class.js';
import { lessonQuery } from './lesson-links.js';

export const STAGE_KEYS = Object.freeze(['recorded', 'words', 'building', 'pr', 'live']);
export const STAGE_LABELS = Object.freeze({
  recorded: 'Recorded',
  words: 'Words arrived',
  building: 'Being built',
  pr: 'PR open',
  live: 'Live',
});
// done: evidence it happened. now: evidence it is happening. waiting: the step
// before it is done and nothing says this one started. unknown: no evidence
// either way. failed / stopped: evidence it will not go on, with the reason.
// skipped: evidence this step was not needed.
export const STATUSES = Object.freeze(['done', 'now', 'waiting', 'unknown', 'failed', 'stopped', 'skipped']);

export const PR_TAG = 'lesson-pr:';
export const LESSON_ID_TAG = 'lesson-id:';
export const CAPTURED_AT_TAG = 'captured-at:';

const has = (tags, t) => Array.isArray(tags) && tags.includes(t);
const tagValue = (tags, prefix) => {
  const t = (Array.isArray(tags) ? tags : []).find((x) => String(x).startsWith(prefix));
  return t ? String(t).slice(prefix.length).trim() : '';
};
const validIso = (s) => (s && Number.isFinite(Date.parse(s)) ? s : null);

/** The pull request number a row names (`lesson-pr:<n>` or `lesson-pr:#<n>`), or null. */
export function lessonPrOf(tags) {
  const v = tagValue(tags, PR_TAG).replace(/^#/, '');
  return /^\d+$/.test(v) ? Number(v) : null;
}

/** The lesson id a row names (`lesson-id:<id>` or `lesson-id:<course>/<id>`), or ''. */
export function lessonIdOf(tags) {
  return tagValue(tags, LESSON_ID_TAG);
}

// THE BUILDER'S OWN STAGE TAGS (DR-0669, the NAS lesson builder): every stage
// writes `build:<stage>@<UTC ISO>` on every row of the teaching, in this order;
// the other roads are failed, released, deferred, duplicate, skipped-test,
// awaiting-review and decided. `build-reason:` says why it stopped and
// `build-lesson:L<n>` names the lesson number, whose branch is
// claude/lesson-l<n>-<slug>.
export const BUILD_STAGES = Object.freeze(['claimed', 'grouped', 'verses-fetched', 'writing', 'written', 'gated', 'selected', 'numbered', 'files-written', 'test-generated', 'reconciled', 'tested', 'committed', 'pushed', 'published']);
export const BUILD_STAGE_WORDS = Object.freeze({
  claimed: 'claimed', grouped: 'grouped with its twin', 'verses-fetched': 'fetching the verses', writing: 'writing',
  written: 'written', gated: 'gated', selected: 'a version chosen', numbered: 'numbered', 'files-written': 'files written',
  'test-generated': 'its verse test written', reconciled: 'counts reconciled', tested: 'tested', committed: 'committed',
  pushed: 'pushed', published: 'published',
});

/** { stage: ISO time } from `build:<stage>@<time>` tags (the latest time per stage). */
export function buildStageTimes(tags) {
  const out = {};
  for (const t of Array.isArray(tags) ? tags : []) {
    const m = /^build:([a-z-]+)@(.+)$/.exec(String(t));
    if (!m || !validIso(m[2])) continue;
    if (!out[m[1]] || out[m[1]] < m[2]) out[m[1]] = m[2];
  }
  return out;
}

/** The lesson number the builder reserved (`build-lesson:L197`), or null. */
export function buildLessonNumberOf(tags) {
  const m = /^L?(\d+)$/i.exec(tagValue(tags, 'build-lesson:'));
  return m ? Number(m[1]) : null;
}
export const branchPrefixForLesson = (n) => `claude/lesson-l${n}-`;

// Every lesson the running build carries: the self-paced catalog (every course
// Learn shows) plus the Sovereign A.I. class, whose weeks are a cohort course.
let CATALOG = null;
function defaultCatalog() {
  if (!CATALOG) {
    const entries = buildSituationIndex(defaultLessonCourses()).entries.map((e) => ({ courseKey: e.courseKey, lessonId: e.lessonId, title: e.title }));
    for (const m of SOVEREIGN_AI_MODULES) if (m && m.id) entries.push({ courseKey: 'sovereign-ai', lessonId: m.id, title: String(m.title || '') });
    CATALOG = entries;
  }
  return CATALOG;
}

/** The catalog entry a lesson id names in THIS build, or null. */
export function findLessonInCatalog(id, catalog = defaultCatalog()) {
  const raw = String(id || '').trim();
  if (!raw) return null;
  const slash = raw.indexOf('/');
  const course = slash > 0 ? raw.slice(0, slash) : '';
  const lessonId = slash > 0 ? raw.slice(slash + 1) : raw;
  const hit = (catalog || []).find((e) => e.lessonId === lessonId && (!course || e.courseKey === course));
  if (!hit) return null;
  const m = /^[a-z]+(\d+)/i.exec(hit.lessonId);
  return { ...hit, number: m && hit.courseKey === 'living-lessons' ? `L${m[1]}` : '', href: lessonQuery({ courseKey: hit.courseKey, lessonId: hit.lessonId }) };
}

/** "3 min", "2 h 5 min", "4 d 1 h". Null for a missing or negative span. */
export function formatSpan(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.round(ms / 60000);
  if (min < 1) return 'under a minute';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
}

function shortTime(iso) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

const stage = (key, status, at, line) => ({ key, label: STAGE_LABELS[key], status, at: validIso(at), line });

/**
 * One lesson's road. `item` is a lessonItems() entry; `prs` maps a PR number to
 * { number, createdAt, mergedAt, closedAt, state } as read from GitHub (or is
 * missing). `owner` is true for the Governor, whose own lessons need no review.
 * `catalog` is what this build carries (injected in tests).
 */
export function deriveLessonPipeline(item, { prs = null, owner = false, prRead = 'ok', catalog } = {}) {
  const it = item || {};
  const tags = Array.isArray(it.progressTags) ? it.progressTags : [];
  const spoken = !!it.spoken;
  const stages = [];

  // 1. RECORDED — the row exists; its created_at is the arrival.
  stages.push(stage('recorded', 'done', it.createdAt, spoken ? 'Your recording arrived.' : 'Your typed lesson arrived.'));

  // 2. WORDS — the transcript row, or the failure row and its reason.
  let wordsDone = false;
  let failed = null;
  if (!spoken) {
    wordsDone = true;
    stages.push(stage('words', 'done', it.createdAt, 'Typed, so the words came with it.'));
  } else if (it.state === 'written') {
    wordsDone = true;
    stages.push(stage('words', 'done', it.transcriptAt, it.rung ? `Written down by Whisper on ${it.rung}.` : 'Written down by Whisper.'));
  } else if (it.state === 'failed') {
    failed = String(it.why || '').trim() || 'The transcriber gave up without a stated reason.';
    stages.push(stage('words', 'failed', it.failedAt, failed));
  } else {
    stages.push(stage('words', 'waiting', null, 'Waiting for Whisper to write it down.'));
  }

  // 3. BEING BUILT — the builder's own tags, after the Governor's word for a member.
  const captured = has(tags, 'lesson-captured');
  const compared = has(tags, 'parallel-compared') || has(tags, 'build-duplicate');
  const times = buildStageTimes(tags);
  const reason = tagValue(tags, 'build-reason:');
  const lessonNumber = buildLessonNumberOf(tags);
  const prNumber = lessonPrOf(tags);
  // The PR: named by the row (lesson-pr:<n>), or the builder's branch for its lesson number.
  const pr = (prNumber && prs ? prs[prNumber] : null)
    || (lessonNumber && prs && prs.byBranch ? prs.byBranch[branchPrefixForLesson(lessonNumber)] : null) || null;
  const prLabel = pr ? `PR #${pr.number}` : prNumber ? `PR #${prNumber}` : '';
  const pushedAt = times.pushed || times.published || validIso(tagValue(tags, CAPTURED_AT_TAG)) || null;
  const capturedAt = pushedAt || (pr && pr.createdAt) || null;
  const latest = BUILD_STAGES.filter((k) => times[k]).sort((a, b) => (times[a] < times[b] ? 1 : -1))[0] || null;
  const review = it.review || null;
  let buildDone = false;
  if (!wordsDone) {
    stages.push(stage('building', failed ? 'stopped' : 'waiting', null, failed ? 'Nothing to build until the words are written.' : 'Starts once the words arrive.'));
  } else if (captured || pushedAt) {
    buildDone = true;
    stages.push(stage('building', 'done', capturedAt, compared
      ? 'Already a lesson: the builder compared the two and built nothing new.'
      : pushedAt ? `Built and pushed${times.claimed ? ` (started ${shortTime(times.claimed)})` : ''}.`
        : capturedAt ? 'Built and pushed; timed by its PR opening.' : 'Built and pushed. When is not recorded on the row.'));
  } else if (times.failed || has(tags, 'build-failed')) {
    stages.push(stage('building', 'failed', times.failed || null, reason ? `The builder stopped: ${reason}` : 'The builder stopped without stating why.'));
  } else if (compared) {
    stages.push(stage('building', 'skipped', times.duplicate || null, 'Already a lesson: the builder compared the two and built nothing new.'));
  } else if (times['skipped-test']) {
    stages.push(stage('building', 'skipped', times['skipped-test'], 'A test of the recorder: nothing to build.'));
  } else if (has(tags, 'awaiting-review') || times['awaiting-review']) {
    stages.push(stage('building', 'waiting', times['awaiting-review'] || null, owner
      ? 'Every version is written and waits for your decision (Lessons to decide).'
      : 'Written, and waiting for the Governor to choose a version.'));
  } else if (times.decided) {
    stages.push(stage('building', 'now', times.decided, 'The decision is being gated and built.'));
  } else if (times.deferred) {
    stages.push(stage('building', 'waiting', times.deferred, reason ? `Handed to the hourly lesson Routine: ${reason}` : 'Handed to the hourly lesson Routine.'));
  } else if (has(tags, 'lesson-building') || latest) {
    stages.push(stage('building', 'now', times.claimed || null, latest ? `Now ${BUILD_STAGE_WORDS[latest] || latest}, since ${shortTime(times[latest])}.` : 'The builder has started on it.'));
  } else if (!owner && review && review.state === 'declined') {
    stages.push(stage('building', 'stopped', null, 'Not written as a new lesson (see the Governor\u2019s reason).'));
  } else if (!owner && !(review && review.state === 'approved')) {
    stages.push(stage('building', 'waiting', null, 'Waiting for the Governor\u2019s review.'));
  } else {
    stages.push(stage('building', 'unknown', null, it.withReader
      ? 'Handed to the lesson builder. It has not reported back to the app yet.'
      : 'The lesson builder has not reported back to the app yet.'));
  }

  // 4. PR OPEN — the lesson's pull request, as GitHub says it is right now.
  if (compared) {
    stages.push(stage('pr', 'skipped', null, 'No new PR: the teaching was already a lesson.'));
  } else if (pr) {
    const closedUnmerged = !pr.mergedAt && (pr.state === 'closed' || pr.closedAt);
    stages.push(stage('pr', closedUnmerged ? 'failed' : 'done', pr.createdAt, closedUnmerged ? `${prLabel} was closed without merging.` : `${prLabel} opened.`));
  } else if (prNumber) {
    stages.push(stage('pr', 'unknown', null, prRead === 'ok'
      ? `${prLabel} was not found among the pull requests read.`
      : `${prLabel}: GitHub could not be read just now (${prRead}).`));
  } else if (buildDone && lessonNumber) {
    stages.push(stage('pr', 'unknown', null, prRead === 'ok'
      ? `No pull request for L${lessonNumber} (${branchPrefixForLesson(lessonNumber)}\u2026) among those read.`
      : `L${lessonNumber}: GitHub could not be read just now (${prRead}).`));
  } else if (buildDone) {
    stages.push(stage('pr', 'unknown', null, 'The builder did not name its PR or lesson number on the row.'));
  } else {
    stages.push(stage('pr', 'waiting', null, 'Opens when the lesson is pushed.'));
  }

  // 5. LIVE — the named lesson is in the build you are running.
  const lessonId = lessonIdOf(tags);
  const lesson = lessonId ? findLessonInCatalog(lessonId, catalog) : null;
  const merged = pr && pr.mergedAt ? pr.mergedAt : null;
  if (lesson) {
    stages.push({ ...stage('live', 'done', merged, merged ? 'In the app you are running. Merged at the time shown.' : 'In the app you are running.'), lesson });
  } else if (lessonId) {
    stages.push(stage('live', merged ? 'waiting' : 'unknown', null, merged
      ? `Merged, but ${lessonId} is not in the build you are running yet. Refresh the app after the deploy.`
      : `${lessonId} is not in the build you are running.`));
  } else if (compared) {
    stages.push(stage('live', 'skipped', null, 'The lesson it matched is already live.'));
  } else if (merged) {
    stages.push(stage('live', 'unknown', null, `${prLabel} merged, but the row does not name the lesson, so it cannot be found or linked.`));
  } else if (stages[3].status === 'failed') {
    stages.push(stage('live', 'stopped', null, 'Not published.'));
  } else {
    stages.push(stage('live', buildDone || pr || prNumber ? 'unknown' : 'waiting', null, buildDone || pr || prNumber ? 'Not in the app yet, as far as the row says.' : 'Goes live when its PR merges and deploys.'));
  }

  // Elapsed: each timed stage measured from the last earlier timed stage.
  let prevAt = null;
  for (const s of stages) {
    s.elapsed = null;
    if (!s.at) continue;
    // The same moment twice (a capture timed by its PR opening) is one event,
    // not a step that took "under a minute".
    if (prevAt && s.at !== prevAt) s.elapsed = formatSpan(Date.parse(s.at) - Date.parse(prevAt));
    prevAt = s.at;
  }
  const liveStage = stages[4];
  const total = liveStage.status === 'done' && liveStage.at ? formatSpan(Date.parse(liveStage.at) - Date.parse(stages[0].at || '')) : null;
  // Where it stands: the first stage that is not done or skipped.
  const current = stages.find((s) => s.status !== 'done' && s.status !== 'skipped') || liveStage;
  return { stages, current, total, failed: !!failed || stages[2].status === 'failed', failReason: failed || (stages[2].status === 'failed' ? stages[2].line : ''), prNumber: pr ? pr.number : prNumber, lessonNumber, lesson };
}

// --- live PR state, reusing the OpsBoard's reads -----------------------------
// Open pull requests come from fetchOps (the OpsBoard's own shared read) and
// merged ones from fetchDeliveryRecord (the newest 100 closed); both share one
// ETag cache and the 60/hr budget (github-ops.js). A PR in neither is read on
// its own, at most MAX_DIRECT_PR_READS per render. No PR tag, no GitHub read.
export const MAX_DIRECT_PR_READS = 4;

export async function fetchLessonPrs(numbers, { fetchOps, fetchDeliveryRecord, getPull, branchPrefixes = [] } = {}) {
  const want = [...new Set((numbers || []).filter((n) => Number.isInteger(n) && n > 0))];
  const prefixes = [...new Set((branchPrefixes || []).filter(Boolean))];
  const prs = { byBranch: {} };
  if (!want.length && !prefixes.length) return { prs, read: 'ok' };
  let read = 'ok';
  const keep = (p) => {
    if (want.includes(p.number)) prs[p.number] = p;
    const branch = String(p.branch || '');
    for (const pre of prefixes) if (branch.startsWith(pre) && (!prs.byBranch[pre] || String(prs.byBranch[pre].createdAt) < String(p.createdAt))) prs.byBranch[pre] = p;
  };
  try {
    const [ops, delivery] = await Promise.all([
      fetchOps ? fetchOps().catch(() => null) : null,
      fetchDeliveryRecord ? fetchDeliveryRecord().catch(() => null) : null,
    ]);
    for (const p of (ops && ops.pulls) || []) keep({ number: p.number, branch: p.branch, createdAt: p.createdAt || null, mergedAt: null, closedAt: null, state: 'open' });
    for (const m of (delivery && delivery.merges) || []) keep({ number: m.number, branch: m.branch, createdAt: m.createdAt, mergedAt: m.mergedAt, closedAt: m.mergedAt, state: 'closed' });
    if ((ops && ops.ok === false) || (delivery && delivery.ok === false)) read = (delivery && delivery.notice) || (ops && ops.notice) || 'unreachable';
    const missing = want.filter((n) => !prs[n]).slice(0, MAX_DIRECT_PR_READS);
    if (getPull) {
      for (const n of missing) {
        try {
          const p = await getPull(n);
          if (p && p.number) prs[n] = { number: p.number, branch: (p.head && p.head.ref) || '', createdAt: p.created_at || null, mergedAt: p.merged_at || null, closedAt: p.closed_at || null, state: p.state || '' };
        } catch (e) {
          read = e && e.rateLimited ? 'rate-limited' : (e && e.message) || 'unreachable';
        }
      }
    }
  } catch (e) {
    read = (e && e.message) || 'unreachable';
  }
  return { prs, read };
}
