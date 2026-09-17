// =============================================================================
// title-in-narrative — does the lesson's own name appear in the reader's text?
// =============================================================================
// Darrell 2026-09-17: "The title to these lessons should stay at the top of the
// presentations and as well as in the actual narrative so that people can
// remember what we're talking about."
//
// TWO HALVES, AND THIS MODULE IS ONLY THE SECOND. The first — the title holding
// position at the top of the presentation and of the in-app reader — is a
// display fix, shipped and gated in the-title-stays-in-view.test.jsx. This
// module measures the other half: whether the TEXT ITSELF names the lesson near
// its start, so a reader who is inside the narrative is reminded what he is in.
//
// MEASURED 2026-09-17 across 163 lessons: 471 of 652 bands open without naming
// their own lesson (child 146, youth 57, teen 132, senior 136) — 157 lessons
// carry at least one. So this ships as a SHRINK-ONLY RATCHET, the same shape as
// full-levels and reading-level: a NEW band that does not name its lesson fails
// the build, and recorded entries may only be removed.
//
// WHY NOT JUST PREFIX ALL 471. Because a blind sweep of 471 authored prose
// strings is the thing this repo forbids for exactly the reason it forbids a
// blind God->Yahweh sweep: it would corrupt good writing at scale to satisfy a
// counter. Each band gets its opening written FOR that age as the full-levels
// pass reaches it — L90's child band says "NO RESPECTER OF PERSONS - that means
// Yahweh has no favourites", its teen band says "keep that title in front of
// you, because every movement below is one of those three". Neither is a
// prefix; both are the title carried into that reader's register.
//
// THE PROXY, NAMED. "Names the lesson" cannot be read for sense by a machine.
// What can: whether the band's opening window contains at least half of the
// title's distinctive words (stop-words and short words dropped, punctuation
// and case normalised). A band may pass this and still orient the reader badly,
// and a band may fail it while naming the lesson in a synonym the author chose
// deliberately — which is why the recorded entries are debt to be READ, not a
// list to be mechanically cleared (the L92/L91/L90 lesson: a measurement of
// this kind reports DIFFERENCE, not absence).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TITLE_NARRATIVE_BASELINE_PATH = join(HERE, '..', 'app', 'src', 'lib', 'title-in-narrative-baseline.json');

export const TITLE_BANDS = ['child', 'youth', 'teen', 'senior'];

// How far into the band counts as "near its start". 200 characters is roughly
// the first two or three sentences — enough for a title line plus the opening
// of the first movement, and short enough that a title buried on page four
// does not count as orienting anybody.
export const OPENING_WINDOW = 200;

// Words too common to identify a lesson. A title made only of these (there are
// none today) would be unmeasurable, and scanTitleInNarrative skips it rather
// than reporting a false gap.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'of', 'in', 'to', 'is', 'it', 'for', 'on', 'that',
  'his', 'her', 'we', 'you', 'why', 'what', 'how', 'not', 'but', 'with', 'as',
  'at', 'be', 'are', 'this', 'from', 'who', 'our', 'their', 'one', 'no', 'all',
  'they', 'he', 'she', 'when', 'where', 'which', 'was', 'were', 'has', 'have',
  'had', 'does', 'did', 'will', 'can', 'its', 'them', 'then', 'than', 'been',
]);

export function normalise(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// The title's identifying words: longer than three letters and not a stop-word.
export function titleKeywords(title) {
  return normalise(title).split(' ').filter((w) => w.length > 3 && !STOP.has(w));
}

export function namesItsLesson(title, bandText, { window = OPENING_WINDOW } = {}) {
  const kw = titleKeywords(title);
  if (!kw.length) return true; // unmeasurable title — never reported as a gap
  const opening = normalise(String(bandText || '').slice(0, window));
  const hits = kw.filter((w) => opening.includes(w)).length;
  return hits >= Math.ceil(kw.length / 2);
}

export function unnamedBands(module, opts = {}) {
  const out = [];
  for (const band of TITLE_BANDS) {
    const text = module.levels && module.levels[band];
    if (!text) continue; // a MISSING band is full-levels' debt, not this gate's
    if (!namesItsLesson(module.title, text, opts)) out.push(band);
  }
  return out;
}

export function scanTitleInNarrative(modules, opts = {}) {
  const unnamed = {};
  let bandsUnnamed = 0;
  const perBand = { child: 0, youth: 0, teen: 0, senior: 0 };
  for (const m of modules) {
    if (!titleKeywords(m.title).length) continue;
    const bands = unnamedBands(m, opts);
    if (bands.length) {
      unnamed[m.id] = bands;
      bandsUnnamed += bands.length;
      for (const b of bands) perBand[b] += 1;
    }
  }
  return {
    measuredLessons: modules.length,
    lessonsUnnamed: Object.keys(unnamed).length,
    bandsUnnamed,
    perBand,
    unnamed,
  };
}

export function loadTitleNarrativeBaseline() {
  try {
    return JSON.parse(readFileSync(TITLE_NARRATIVE_BASELINE_PATH, 'utf8'));
  } catch {
    return { window: OPENING_WINDOW, measuredLessons: 0, lessonsUnnamed: 0, bandsUnnamed: 0, unnamed: {} };
  }
}

// Fresh offenders (not in the baseline) fail the build; healed entries are
// reported so the baseline can be shrunk deliberately rather than drifting.
export function ratchetTitleInNarrative(scan, baseline = loadTitleNarrativeBaseline()) {
  const known = baseline.unnamed || {};
  const fresh = [];
  const healed = [];
  for (const [id, bands] of Object.entries(scan.unnamed)) {
    const before = known[id] || [];
    for (const b of bands) if (!before.includes(b)) fresh.push(`${id} :: ${b}`);
  }
  for (const [id, bands] of Object.entries(known)) {
    const now = scan.unnamed[id] || [];
    for (const b of bands) if (!now.includes(b)) healed.push(`${id} :: ${b}`);
  }
  return { fresh, healed };
}

export function buildTitleNarrativeBaseline(scan) {
  return {
    window: OPENING_WINDOW,
    note: 'Shrink-only debt (Darrell 2026-09-17). Each entry names the bands of a lesson whose OPENING does not name its own lesson. A newly-unnamed band fails the build; entries are removed as bands are authored to carry the title, never added. Read the entries — this measures DIFFERENCE, not absence: a band may name its lesson in a synonym the author chose on purpose.',
    measuredLessons: scan.measuredLessons,
    lessonsUnnamed: scan.lessonsUnnamed,
    bandsUnnamed: scan.bandsUnnamed,
    perBand: scan.perBand,
    unnamed: Object.fromEntries(Object.entries(scan.unnamed).sort(([a], [b]) => a.localeCompare(b))),
  };
}
