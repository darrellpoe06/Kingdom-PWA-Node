// =============================================================================
// healthy-living-course — the 3rd-Dimension Witness, carried into Learn as a
// self-paced series, DERIVED from the witness data (never re-typed)
// =============================================================================
// Darrell 2026-08-10, holding the 3rd-Dimension Witness room on his phone: "is
// this inside the Learn space too? if not make these lessons from our data or a
// series for Healthy Living... data driven course/s."
//
// It was NOT in Learn. The witness room (Church → Eternal Algorithms →
// 3rd-Dimension Witness) held twelve cited works — fasting and meal timing,
// sleep, learning, the setback/dopamine loop, and the women's-physiology
// counter-witness — each one already bound to the Scripture that said it first.
// Learn carried none of it. This module closes that: ONE lesson per witness
// source, built from `lib/third-witness.js` at build time, so a source added to
// the witness room joins this series on the next build and the two can never
// disagree (DR-0121 — no static data; the same law the Eternal Algorithms
// processing courses ride).
//
// THE RULES OF THE WITNESS ROOM COME WITH IT — they are not restated here as
// decoration, they are enforced in the projection below and pinned in
// healthy-living-course.test.js:
//   • WORD FIRST (DR-0127): every lesson opens with the Scripture references
//     and the Word's own claim; the cited science follows as a witness. The
//     course DECLARES its own lead (3 John 1:2; 1 Corinthians 6:19-20) rather
//     than borrowing whichever lesson happens to sit first.
//   • EVERY EXPERT CITED (Romans 13:7 — honour to whom honour is due): the
//     expert, credential, work and the place IN the work ride on every claim.
//     No anonymous "studies show."
//   • EVERY VERSE VERBATIM (DR-0076): references resolve through witnessVerse →
//     the verified KJV corpus. Nothing here quotes Scripture from memory.
//   • PASTORAL, NOT CLINICAL (the TLC bright line): this helps the Body see; it
//     does not diagnose or treat. The care note rides EVERY lesson at EVERY
//     level, and the data's own counter-witness (fasting is often wrong for
//     active and midlife women — Sims, Haver) is carried, never dropped.
//
// Pure + deterministic: every function takes its data as an argument and
// defaults to the live catalog.
// =============================================================================
import { WITNESS_SOURCES, WITNESS_TAGLINE, witnessVerse } from './third-witness.js';
import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';

// The care frame, in the witness room's own posture. It rides every lesson and
// every level — a health series in a church cannot carry one without it.
export const HEALTHY_LIVING_CARE_NOTE = 'This room helps the Body see; it does not diagnose or treat. Talk to your physician before changing how you eat, fast, or sleep — and the counter-witness in this series is part of the witness: for many active and midlife women, fuelling well beats a long fast. It is never one-size.';

/** "Dr. Andrew Huberman, Neuroscientist — The Science of Learning & Memory" */
export function citeOf(source) {
  const s = (source && source.source) || {};
  const who = [s.expert, s.credential].filter(Boolean).join(', ');
  return [who, s.work].filter(Boolean).join(' — ');
}

/** Every Scripture reference this witness source binds itself to, in order. */
export function refsOf(source) {
  const seen = new Set();
  const out = [];
  for (const p of (source && source.pairs) || []) {
    for (const r of p.refs || []) {
      if (!seen.has(r)) { seen.add(r); out.push(r); }
    }
  }
  return out;
}

// One Learn lesson from one witness source. The Word leads each pair; the cited
// claim follows it. Nothing is invented: every sentence below is either the
// data's own text or the fixed frame this module owns.
export function moduleFromWitness(source) {
  const refs = refsOf(source);
  const cite = citeOf(source);
  const pairs = (source.pairs || []).filter(Boolean);

  const wordFirstBlock = (p) => {
    const r = (p.refs || []).join(' · ');
    const where = p.cite ? `, ${p.cite}` : '';
    return `The Word — ${r}: ${p.bridge}\n\nThe 3rd-dimension witness (${cite}${where}): ${p.claim}`;
  };

  const standard = [
    ...pairs.map(wordFirstBlock),
    HEALTHY_LIVING_CARE_NOTE,
  ].join('\n\n');

  return {
    id: `hl-${source.id}`,
    title: source.topic,
    // WORD FIRST: the references and His claim open the lesson; the witness and
    // its summary come after, plainly labelled as the 3rd dimension.
    bigIdea: `${refs.join(' · ')} — the Word says it first. The cited witness (${cite}) describes the frame Yahweh made: ${source.summary}`,
    lesson: standard,
    levels: {
      standard,
      // Teen — the shortest true read: what the Word says, one line of who
      // said the science, and the care note. Depth selection over the same
      // sentences, never a re-worded doctrine (the Eternal Algorithms rule).
      teen: [
        ...pairs.map((p) => `${(p.refs || []).join(' · ')} — ${p.bridge}`),
        `Who says the science: ${cite}.`,
        HEALTHY_LIVING_CARE_NOTE,
      ].join('\n\n'),
      // Senior — the whole depth: the Word, the claim, where in the work, and
      // the source's own summary of what it found.
      senior: [
        ...pairs.map(wordFirstBlock),
        `The work in full: ${cite}. ${source.summary}`,
        HEALTHY_LIVING_CARE_NOTE,
      ].join('\n\n'),
    },
    inApp: 'Open Church → Eternal Algorithms → 3rd-Dimension Witness and read this source with every verse verbatim. Then take ONE change to your own week — a meal time, a bedtime, a first small step after a setback — and bring it to your physician before you change anything medical.',
    anchor: { ref: refs.join(' · '), theme: source.topic },
    launch: { view: 'church', churchView: 'eternal-algorithms' },
    care: HEALTHY_LIVING_CARE_NOTE,
  };
}

export const HEALTHY_LIVING_SESSION_FLOW = [
  { minutes: 5, name: 'The Word first — read every verse verbatim' },
  { minutes: 10, name: 'The witness — the cited claim and where it sits in the work' },
  { minutes: 10, name: 'The bridge — how the Word said it first' },
  { minutes: 5, name: 'The counter-witness — where it is not one-size' },
  { minutes: 5, name: 'One change to carry, and who to ask before you make it' },
];

export const HEALTHY_LIVING_META = {
  key: 'healthy-living',
  title: 'Healthy Living — the 3rd-Dimension Witness',
  audience: 'the whole Body and the whole house — anyone stewarding the body Yahweh gave them, at any age, with their physician in the loop',
  tagline: WITNESS_TAGLINE,
  format: 'Self-paced · one cited witness at a time · the Word first, then the science',
  cadenceDays: 7,
  // Derived, never typed (DR-0121): the series is exactly as long as the
  // witness room is deep.
  weeks: WITNESS_SOURCES.length,
  handsOnLabel: 'Take it to the room',
  unit: { noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true, sessionLabel: 'How to work one witness (alone or as a house)' },
  // WORD-FIRST, DECLARED (DR-0127 / DR-0282). Health material is charged
  // enough that the opening frame must be chosen for the space rather than
  // inherited from whichever witness sits first. Both texts are VERBATIM from
  // the repo's verified KJV corpus (gated in healthy-living-course.test.js —
  // change one word and the build fails).
  wordFirst: {
    ref: '3 John 1:2; 1 Corinthians 6:19-20',
    frame: 'Yahweh sets the order before any expert speaks: "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth." — He wants you well, body AND soul, and He names the soul as the measure. And whose body it is: "What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God’s." Health here is stewardship of what He bought, not self-improvement. The science below is a witness to the frame He made; His Word governs it.',
  },
  care: HEALTHY_LIVING_CARE_NOTE,
};

/** The schedule: one row per witness source, in the room's own order. */
export function buildHealthyLivingSchedule(sources = WITNESS_SOURCES) {
  return (sources || []).map((s, i) => ({
    ...moduleFromWitness(s),
    week: i + 1,
    date: null,
    weekday: null,
  }));
}

export function healthyLivingProgressSummary(progress = {}, sources = WITNESS_SOURCES) {
  return progressSummaryFor(buildHealthyLivingSchedule(sources), progress);
}

export function exportHealthyLivingCurriculumMarkdown(sources = WITNESS_SOURCES) {
  return exportCurriculumMarkdownFor({
    meta: HEALTHY_LIVING_META,
    modules: buildHealthyLivingSchedule(sources),
    sessionFlow: HEALTHY_LIVING_SESSION_FLOW,
  });
}

/**
 * Every Scripture reference this series will show, deduped — the list the
 * verse-integrity gate walks so a lesson can never cite a verse the verified
 * corpus does not hold.
 */
export function healthyLivingRefs(sources = WITNESS_SOURCES) {
  const seen = new Set();
  for (const s of sources || []) for (const r of refsOf(s)) seen.add(r);
  return [...seen];
}

/** Refs that do NOT resolve verbatim in the corpus. Empty is the passing state. */
export function unresolvedHealthyLivingRefs(sources = WITNESS_SOURCES, resolve = witnessVerse) {
  return healthyLivingRefs(sources).filter((r) => !String(resolve(r) || '').trim());
}

export const HEALTHY_LIVING_INTEREST_TAG = '[Healthy Living]';
export const HEALTHY_LIVING_HELPER_TAG = '[Healthy Living helper]';

export const HEALTHY_LIVING_TUTOR_META = {
  name: 'Healthy Living — the 3rd-Dimension Witness',
  blurb: 'Ask about any cited source in this series — what the expert actually said, where in the work, and the Scripture it is bound to. Ari will not diagnose or prescribe; medical decisions belong with your physician.',
};
