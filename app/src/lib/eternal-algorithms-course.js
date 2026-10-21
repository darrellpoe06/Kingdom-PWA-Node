// =============================================================================
// eternal-algorithms-course — the Learn tab carries the Eternal Algorithms as
// practical processing courses, DERIVED from the catalog (never re-typed)
// =============================================================================
// "The learn tab needs to have all of these courses added as practical
// learning opportunities — a time to deeply process these concepts from
// Yahweh." (Darrell, 2026-07-08, holding the Godhead Study catalog + the
// witness rooms.) And the standing law: "All knowledge spaces start with
// Yahweh's knowledge and/or perspectives if we have them." (Same sitting —
// DR-0127.)
//
// One course per Godhead-Study section (Torah & History, Wisdom & Psalms, the
// Prophets, the Gospels, the Epistles, Revelation), each session one PATTERN
// from the SAME catalog the Eternal Algorithms study renders
// (lib/godhead-study.js GODHEAD_ALGORITHMS) — so the study, the game, and the
// Learn courses can never disagree, and a pattern added to the catalog joins
// its course on the next build (DR-0121: no static data).
//
// WORD-FIRST BY CONSTRUCTION (DR-0127): every session's big idea BEGINS with
// the Scripture references and Yahweh's own conditional (the 4D — His
// knowledge), and only then the 3D practical processing. The verse text
// itself renders from the app's verified KJV corpus by reference — nothing
// here quotes from memory (DR-0076 / SCRIPTURE-REFERENCE-STANDARD).
//
// Pure + deterministic (proven-to-catch in eternal-algorithms-course.test.js).
// =============================================================================
import { GODHEAD_SECTIONS, GODHEAD_ALGORITHMS, godheadVerse } from './godhead-study.js';
import ETERNAL_STORIES from './eternal-algorithms-stories.json';
import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';
import { datedSchedule } from './lesson-dates.js';

// One derived module per catalog pattern. The 4D leads; the 3D follows.
// MULTI-NEUROLOGICAL LEVELS (Darrell 2026-07-08: "these lessons also need to
// be multi neurological level like the others"): the engine's levels contract
// (learn-framework resolveLevel — standard/teen/senior) is filled by DEPTH
// SELECTION over the catalog's own sentences — the same truth at three
// depths, exactly how the Scripture study levels — never an invented rephrase
// of doctrine (DR-0076).
// THE VERSES ARE IN THE LESSON (Darrell 2026-10-21, on Revelation — Deep
// Processing: "Even the verses of the lessons are not here in these courses...
// Inside each lesson... My family and friends and children will use them for
// clarity"). Each reference the pattern stands on is quoted, verbatim, from the
// verified KJV fetch the study renders (godheadVerse) — never typed here
// (DR-0076). A reference the fetch does not hold is left out of the quotes
// rather than invented; the census test names any such gap.
export function wordQuotes(refs) {
  return (refs || []).map((ref) => {
    const text = godheadVerse(ref);
    return text ? `"${text.trim()}" (${ref}, KJV)` : null;
  }).filter(Boolean);
}

export function moduleFromAlgorithm(alg) {
  const refs = (alg.refs || []).join(' · ');
  const quotes = wordQuotes(alg.refs);
  const word = quotes.length ? `The Word, read first:\n\n${quotes.join('\n\n')}` : null;
  const withWord = (parts) => [word, ...parts].filter(Boolean).join('\n\n');
  const standard = withWord([
    alg.threeD ? `3D · practical: ${alg.threeD}` : null,
    alg.outcome ? `The outcome — you win with it: ${alg.outcome}` : null,
  ]);
  // TWO STORIES TO A LESSON (DR-0215 / DR-0855), kept beside the catalog by
  // pattern id so the catalog the study renders stays untouched.
  const stories = Array.isArray(alg.stories) && alg.stories.length ? alg.stories : (ETERNAL_STORIES[alg.id] || null);
  return {
    id: `ea-${alg.id}`,
    title: alg.name,
    // WORD FIRST: the big idea opens with the references + Yahweh's own
    // conditional and consequence — His knowledge before any practice.
    bigIdea: `${refs} — IF ${alg.condition} THEN ${alg.consequence}`,
    lesson: standard,
    levels: {
      standard,
      // Teen — the shortest true read: the Word's own IF and the win, plain.
      teen: withWord([
        `The Word says: IF ${alg.condition}`,
        alg.outcome ? `You win with it: ${alg.outcome}` : null,
        'Small step: pick ONE thing this week that moves your side of the IF.',
      ]),
      // Senior — the whole depth: conditional, consequence, practice, and why
      // it works in a person (every sentence from the catalog itself).
      senior: withWord([
        `IF ${alg.condition}`,
        `THEN ${alg.consequence}`,
        alg.threeD ? `3D · practical: ${alg.threeD}` : null,
        alg.psyche ? `Why it works in you: ${alg.psyche}` : null,
        alg.outcome ? `The outcome — you win with it: ${alg.outcome}` : null,
      ]),
    },
    ...(stories ? { stories } : {}),
    inApp: 'Read the verses above aloud, slowly, as a house. Then take it to your Study (or the Council Chamber): write where this conditional is currently running in your house — and one obedience step this week that moves your side of the IF.',
    anchor: { ref: refs, theme: alg.condition },
    launch: { view: 'church', churchView: 'eternal-algorithms' },
  };
}

export function modulesForSection(sectionKey, catalog = GODHEAD_ALGORITHMS) {
  return catalog.filter((a) => a && a.section === sectionKey).map(moduleFromAlgorithm);
}

// The course descriptor set — shape-identical to the other Learn courses
// (living-lessons is the self-paced exemplar). Sections with no catalog
// entries yield NO course (honest empty — nothing painted).
export function buildEternalProcessingCourses({ sections = GODHEAD_SECTIONS, catalog = GODHEAD_ALGORITHMS } = {}) {
  const out = [];
  for (const s of sections) {
    const modules = modulesForSection(s.key, catalog);
    if (!modules.length) continue;
    const meta = {
      key: `eternal-${s.key}`,
      title: `${s.label} — Deep Processing`,
      category: 'The Eternal Algorithms',
      // The declared purpose, in Darrell's own spoken words (into the app,
      // 2026-07-09): "Yahweh expects us to understand situational analysis —
      // the only way for us to listen to Him is to analyze His algorithms,
      // His ways... these are the algorithms we want to process and understand."
      audience: 'anyone ready to process these patterns from Yahweh slowly, honestly, and in the app — the only way to listen to Him is to analyze His algorithms, His ways',
      tagline: s.blurb,
      format: 'Self-paced · one pattern at a time · the Word first, then the practice',
      cadenceDays: 7,
      weeks: modules.length,
      handsOnLabel: 'Process it in the app',
      unit: { noun: 'pattern', nounPlural: 'patterns', cap: 'Pattern', selfPaced: true, sessionLabel: 'How to process it (alone or as a house)' },
      // The Word-first lead the Learn header renders before ANY course
      // material (DR-0127): Yahweh's knowledge opens the space.
      wordFirst: {
        ref: (modules[0].anchor && modules[0].anchor.ref) || '',
        frame: 'These are Yahweh\'s own conditionals — His knowledge, as high above the data as the heavens are above the earth. Read every verse verbatim; the practice below serves the Word, never the other way around.',
      },
    };
    out.push({
      key: meta.key,
      meta,
      sessionFlow: [],
      // `added`: the day each pattern became a lesson (DR-0687, lesson-dates.js).
      schedule: datedSchedule(meta.key, modules.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }))),
      cohortStart: null,
      cohortConfirmed: false,
      setCohortStart: null,
      confirmCohort: null,
      progressSummary: (p) => progressSummaryFor(modules, p),
      exportMarkdown: () => exportCurriculumMarkdownFor({ meta, modules, sessionFlow: [] }),
      downloadName: `${meta.key}-deep-processing.md`,
      submitInterest: null,
      roster: null,
      interestCopy: null,
      tutorCourseMeta: null,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// wordFirstLead — the DERIVED Word-first opening for ANY course (DR-0127):
// the course's own declared lead when present, else its first session's
// Scripture anchor. A course with neither returns null — the census test
// reports it as a finding instead of this module inventing a lead.
// ---------------------------------------------------------------------------
export function wordFirstLead(course) {
  const meta = course && course.meta;
  if (meta && meta.wordFirst && meta.wordFirst.ref) return meta.wordFirst;
  const sched = (course && course.schedule) || [];
  for (const m of sched) {
    if (m && m.anchor && m.anchor.ref) {
      return { ref: m.anchor.ref, frame: m.anchor.theme || '' };
    }
  }
  return null;
}
