// =============================================================================
// lesson-dates-core — the real day every lesson in every course was created
// (DR-0687). Pure logic, shared by scripts/derive-lesson-dates.mjs (which reads
// git and the mounted catalog) and its vitest gate (lesson-dates.test.js).
// =============================================================================
// Darrell 2026-09-30, looking at Learn -> "Latest lessons, every course", which
// said "One course records the day each lesson was added · 549 lessons in other
// courses have no recorded day, so they are not listed":
//   "Add all the days the lessons were created so we can have all of them in
//    each course so they can get done."
//
// THE RULE (DR-0076: a real record, never a guess). A lesson's day is the git
// author date (UTC) of the EARLIEST commit whose diff added the line that
// defines it, `id: '<lesson id>'`, anywhere under app/src (tests excluded).
// Two courses build their lessons from a source record rather than typing the
// lesson id: the Eternal Algorithms (`ea-${alg.id}` over godhead-study.js) and
// Healthy Living (`hl-${source.id}` over third-witness.js). Such a lesson did
// not exist until BOTH its record and the builder that turns it into a lesson
// existed, so its day is the later of those two commits.
//
// Living Lessons already records its days by hand (living-lessons-dates.js,
// DR-0626); those stay authoritative. Where git's first-commit day differs from
// the recorded day, the difference is REPORTED in the generated file, never
// silently overwritten.
//
// The cohort courses' `date` fields are SCHEDULED class dates, not creation
// days; they are never read here.
// =============================================================================

/** The courses whose lessons are built from a record in another file. */
export const DERIVED_LESSONS = [
  { prefix: 'ea-', source: 'app/src/lib/godhead-study.js', builder: '`ea-${alg.id}`', what: 'an Eternal Algorithms pattern (godhead-study.js)' },
  { prefix: 'hl-', source: 'app/src/lib/third-witness.js', builder: '`hl-${source.id}`', what: 'a Healthy Living witness (third-witness.js)' },
];

/** The course whose days are recorded by hand and stay authoritative. */
export const RECORDED_ELSEWHERE = { 'living-lessons': 'app/src/lib/living-lessons-dates.js' };

/** A new lesson authored on a branch lands on main in a squash commit a little later. */
export const SQUASH_GRACE_DAYS = 14;

// `id: '…'` in JS, `"id": "…"` in a JSON-shaped block.
const DEF = /(?:^|[\s{,(])(['"]?)id\1:\s*(['"`])([a-z0-9][a-z0-9-]*)\2/g;
// A course that defines each lesson as the KEY of a spec table.
export const KEYED_LESSONS = [
  { prefix: 'whohe', source: 'app/src/lib/who-he-is-course.js', what: 'the key of WHO_HE_IS_LESSON_SPECS' },
];
const KEY_DEF = /^\+\s*(['"])([a-z0-9][a-z0-9-]*)\1\s*:\s*\{/;
const ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const utcDay = (unixSeconds) => new Date(Number(unixSeconds) * 1000).toISOString().slice(0, 10);
export const isIsoDay = (d) => typeof d === 'string' && ISO.test(d);
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/**
 * A scanner over `git log -p --unified=0 --format=%x01%H %at` output, fed one
 * line at a time. It keeps, per defined id, the EARLIEST commit that added its
 * definition line — overall, and within each derived source file — and the
 * earliest commit that added each derived builder.
 */
export function createScanner(derived = DERIVED_LESSONS) {
  const firstDef = new Map(); // id -> { ts, sha, file }
  const firstInSource = new Map(); // `${file}::${id}` -> { ts, sha, file }
  const firstBuilder = new Map(); // builder text -> { ts, sha, file }
  const sources = new Set(derived.map((d) => d.source));
  let cur = null;
  let file = null;
  const keep = (map, key, hit) => {
    const prev = map.get(key);
    if (!prev || hit.ts < prev.ts || (hit.ts === prev.ts && hit.sha < prev.sha)) map.set(key, hit);
  };
  return {
    line(raw) {
      if (raw.charCodeAt(0) === 1) {
        const [sha, ts] = raw.slice(1).trim().split(/\s+/);
        cur = { sha, ts: Number(ts) };
        file = null;
        return;
      }
      if (raw.startsWith('+++ ')) { file = raw.startsWith('+++ b/') ? raw.slice(6) : null; return; }
      if (!cur || !file || raw[0] !== '+' || file.includes('/__tests__/')) return;
      const hit = { ts: cur.ts, sha: cur.sha, file };
      DEF.lastIndex = 0;
      let m;
      while ((m = DEF.exec(raw))) {
        keep(firstDef, m[3], hit);
        if (sources.has(file)) keep(firstInSource, `${file}::${m[3]}`, hit);
      }
      const k = KEY_DEF.exec(raw);
      if (k && KEYED_LESSONS.some((x) => x.source === file && k[2].startsWith(x.prefix))) keep(firstDef, k[2], hit);
      for (const d of derived) if (raw.includes(d.builder)) keep(firstBuilder, d.builder, hit);
    },
    result() { return { firstDef, firstInSource, firstBuilder }; },
  };
}

const asEntry = (hit) => ({ date: utcDay(hit.ts), sha: hit.sha.slice(0, 8), ts: hit.ts });

/**
 * Git's day for one lesson, or { reason } when its definition cannot be traced.
 * `scan` is createScanner().result().
 */
export function gitDayFor(id, scan, derived = DERIVED_LESSONS) {
  const d = derived.find((x) => id.startsWith(x.prefix));
  if (d) {
    const rec = scan.firstInSource.get(`${d.source}::${id.slice(d.prefix.length)}`);
    const built = scan.firstBuilder.get(d.builder);
    if (!rec) return { reason: `its record id "${id.slice(d.prefix.length)}" was never defined in ${d.source}` };
    if (!built) return { reason: `the builder ${d.builder} was never committed` };
    return asEntry(rec.ts >= built.ts ? rec : built);
  }
  const hit = scan.firstDef.get(id);
  return hit ? asEntry(hit) : { reason: `no commit ever added a line defining id: '${id}'` };
}

/**
 * Is a committed entry still true against git? Returns null when it is, or the
 * reason it is not. An entry whose commit is in history must match git's day
 * and commit exactly. An entry whose commit is NOT in history (the lesson was
 * dated on its branch, or before its first commit — 'working-tree' — and then
 * squash-merged) must be on or before git's day and within SQUASH_GRACE_DAYS.
 */
export function judgeEntry(entry, git, reachable) {
  if (!entry || !isIsoDay(entry.date)) return 'no recorded day';
  if (entry.sha === 'working-tree' && git && git.reason) return null; // still uncommitted
  if (!git || git.reason) return `git cannot trace it (${git ? git.reason : 'no record'})`;
  if (entry.sha && reachable.has(entry.sha)) {
    if (entry.sha !== git.sha) return `recorded commit ${entry.sha} is not the first commit that defined it (${git.sha})`;
    if (entry.date !== git.date) return `recorded ${entry.date}, but commit ${git.sha} is dated ${git.date}`;
    return null;
  }
  const gap = daysBetween(entry.date, git.date);
  if (gap < 0) return `recorded ${entry.date} is AFTER the day it first reached history (${git.date})`;
  if (gap > SQUASH_GRACE_DAYS) return `recorded ${entry.date} is ${gap} days before it first reached history (${git.date}); more than ${SQUASH_GRACE_DAYS} is not a squash`;
  return null;
}

/**
 * Build the dates file from the catalog, git's scan, the committed file (kept
 * where still true), and the hand-recorded Living Lessons days.
 * catalog: [{ key, ids: [lessonId] }]. Returns { file, problems } — problems are
 * the entries of `previous` that git no longer supports (the drift the check
 * mode fails on).
 */
export function buildDatesFile({ catalog, scan, reachable, previous = null, recorded = {}, today = null }) {
  const courses = {};
  const undated = {};
  const disagreements = [];
  const problems = [];
  const counts = {};
  const prevCourses = (previous && previous.courses) || {};
  for (const c of catalog) {
    const handKept = RECORDED_ELSEWHERE[c.key];
    const out = {};
    let dated = 0;
    for (const id of c.ids) {
      const git = gitDayFor(id, scan);
      if (handKept) {
        const rec = recorded[id];
        if (isIsoDay(rec)) {
          dated += 1;
          if (git.reason) disagreements.push({ course: c.key, id, recorded: rec, git: null, why: git.reason });
          else if (git.date !== rec) disagreements.push({ course: c.key, id, recorded: rec, git: git.date, sha: git.sha });
        } else {
          undated[`${c.key}/${id}`] = `no line in ${handKept}`;
        }
        continue;
      }
      const prevRow = prevCourses[c.key] && prevCourses[c.key][id];
      const prev = Array.isArray(prevRow) ? { date: prevRow[0], sha: prevRow[1] } : null;
      if (prev) {
        const why = judgeEntry(prev, git, reachable);
        if (!why) { out[id] = [prev.date, prev.sha]; dated += 1; continue; }
        problems.push({ course: c.key, id, why });
      }
      if (!git.reason) { out[id] = [git.date, git.sha]; dated += 1; continue; }
      if (today && !prev && scan.workingTree && scan.workingTree.has(id)) {
        // A lesson written in the working tree and not yet committed: dated
        // today, marked 'working-tree'; judgeEntry holds it to git's day once
        // it lands (on or before it, within the squash grace).
        out[id] = [today, 'working-tree'];
        dated += 1;
        continue;
      }
      undated[`${c.key}/${id}`] = git.reason;
    }
    courses[c.key] = handKept ? undefined : out;
    counts[c.key] = { lessons: c.ids.length, dated, undated: c.ids.length - dated };
  }
  for (const k of Object.keys(courses)) if (courses[k] === undefined) delete courses[k];
  const total = Object.values(counts).reduce((t, x) => t + x.lessons, 0);
  const datedTotal = Object.values(counts).reduce((t, x) => t + x.dated, 0);
  // Only the days and the reasons are committed: counts and the Living Lessons
  // report change with every lesson and would make every lesson branch collide
  // in this file, so they are printed by the script (and asserted in the test).
  return {
    file: {
      _generated: 'by scripts/derive-lesson-dates.mjs (DR-0687) — do not edit by hand; re-run: cd app && npm run lesson-dates',
      rule: 'Each day is the UTC author date of the earliest commit that added the line defining the lesson (id: \'...\') under app/src; a lesson built from a record (Eternal Algorithms, Healthy Living) takes the later of its record\'s commit and its builder\'s commit. Living Lessons keeps its own recorded days (living-lessons-dates.js).',
      courses,
      undated,
    },
    report: { totals: { lessons: total, dated: datedTotal, undated: total - datedTotal }, counts, livingLessonsDisagreements: disagreements },
    problems,
  };
}
