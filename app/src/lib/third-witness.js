// =============================================================================
// third-witness — high-quality 3rd-dimensional data cross-referenced with the
// 4th-dimensional Word (Darrell 2026-07-03: "I want a lot of these types of
// data or information to cross reference the scriptures so we can see this
// trauma from the 3rd-dimension better as a Body Of Christ. All experts cited
// however Yahweh's Perspectives are 4th dimensional so we mix with high
// quality 3rd-dimensional data and information intertwined for Yahweh's Way
// to make even more sense.")
// =============================================================================
// The rules of this space:
// - EVERY source is cited: expert, credential, work. No anonymous "studies
//   show." The 3rd dimension gets credit where credit is due (Romans 13:7).
// - EVERY verse is verbatim from the verified fetch (godhead-study-verses.json
//   via godheadVerse) — never from model memory (DR-0076).
// - The science is a WITNESS, not the authority: cited experts describe the
//   frame Yahweh made; His Word governs. Pastoral, not clinical — this space
//   helps the Body see, it does not diagnose or treat (the TLC bright line).
//
// Shape: one WITNESS_SOURCE per expert work; each `pairs[]` row binds one
// 3rd-dimensional claim (with its in-work cite) to the Scripture that said it
// first, plus the bridge that intertwines them.
import { godheadVerse } from './godhead-study';

export const WITNESS_TAGLINE = 'All experts cited — and Yahweh\'s Perspectives are 4th-dimensional: as high above the data as the heavens are above the earth. High-quality 3rd-dimensional witness, intertwined so His Way makes even more sense.';

export const WITNESS_SOURCES = [
  {
    id: 'w3-setback-neuroscience',
    topic: 'Setbacks, dopamine, and the ruminating mind',
    source: {
      expert: 'Dr. Tracey Marks',
      credential: 'Psychiatrist',
      work: 'The Neuroscience of Setbacks (video)',
      kind: 'video',
    },
    summary: 'How the brain responds to a setback — the dopamine crash, the stressed prefrontal cortex, the rumination loop — and the brain-based recovery moves: act before motivation, shrink the step, feed dopamine sustainably, anchor in routine, and treat yourself with compassion instead of threat.',
    pairs: [
      {
        id: 'w3p-dopamine-crash',
        claim: 'When reality fails to meet expectations, dopamine — the motivation chemical — drops, producing apathy and "mental whiplash."',
        cite: '1:12-2:04',
        refs: ['Proverbs 13:12'],
        bridge: 'The Word named the dopamine crash three thousand years early: hope deferred maketh the heart SICK — a physiological word, not a poetic one. And it names the recovery in the same verse: when the desire cometh, it is a tree of life.',
      },
      {
        id: 'w3p-executive-shutdown',
        claim: 'Setback stress inhibits the prefrontal cortex (planning, decisions) while activating the amygdala (the alarm), so simple tasks feel overwhelming.',
        cite: '2:06-3:06',
        refs: ['Isaiah 26:3', 'Philippians 4:6-7'],
        bridge: 'The mind STAYED on Yahweh is kept in perfect peace — the stayed mind is the regulated mind. Philippians gives the mechanism: requests handed to God in prayer, and the peace that passeth understanding GARRISONS the heart and mind — the alarm relieved of duty by a Guard that outranks it.',
      },
      {
        id: 'w3p-narrative-trap',
        claim: 'Labeling an external setback as a personal failure triggers the default mode network into a loop of negative rumination that reinforces inadequacy.',
        cite: '3:32-5:25',
        refs: ['2 Corinthians 10:5'],
        bridge: 'The rumination loop is the exact target of the oldest cognitive discipline on record: casting down imaginations, and bringing into captivity EVERY THOUGHT to the obedience of Christ. NOTICE → TEST → CAPTURE → REDIRECT is the Body\'s name for breaking the default-mode loop.',
      },
      {
        id: 'w3p-behavioral-activation',
        claim: 'Behavioral activation: do not wait for motivation — small structured actions (one email, a cleaned desk) jump-start the dopamine system.',
        cite: '5:38',
        refs: ['Ecclesiastes 9:10'],
        bridge: 'Whatsoever thy hand FINDETH to do — the hand moves first and the heart follows. The Word never waits on the feeling; faith is expressed in works, and the doing is itself the medicine.',
      },
      {
        id: 'w3p-micro-goals',
        claim: 'Micro-goals: breaking overwhelming tasks into tiny achievable steps avoids the stress response and rebuilds trust in your own capability.',
        cite: '6:31',
        refs: ['Zechariah 4:10'],
        bridge: 'For who hath despised the day of SMALL THINGS? The Kingdom pattern is seed-sized starts that Yahweh grows — the micro-goal is not a coping trick, it is how He builds temples: one course of stones, with rejoicing at the plumbline.',
      },
      {
        id: 'w3p-sustainable-dopamine',
        claim: 'Reset dopamine sustainably: move from quick-fix hits (scrolling, snacking) to durable sources — novelty, movement, connection, completed tasks.',
        cite: '7:05',
        refs: ['Jeremiah 2:13'],
        bridge: 'Two evils, one diagnosis: forsaking the FOUNTAIN of living waters, and hewing broken cisterns that can hold no water. The scroll and the snack are broken cisterns — the leak is in the container, not the thirst. The thirst is legitimate; take it to the Fountain.',
      },
      {
        id: 'w3p-routine-anchor',
        claim: 'Rebuild structure: routines act as anchors that reduce decision fatigue — but do not weaponize them with harsh self-talk.',
        cite: '7:53-8:37',
        refs: ['Daniel 6:10'],
        bridge: 'Daniel kneeled three times a day and prayed, AS HE DID AFORETIME — the routine was already anchored before the crisis, which is why the crisis could not move him. The anchor is set in calm water, and it held under a den of lions.',
      },
      {
        id: 'w3p-self-compassion',
        claim: 'Self-criticism activates the brain\'s threat systems; self-compassion engages the caregiving system, restoring balance and re-engaging the prefrontal cortex.',
        cite: '8:37-9:08',
        refs: ['Psalms 103:13-14'],
        bridge: 'Like as a father pitieth his children — the caregiving system is the Father\'s own posture toward you: He knoweth our frame; He remembereth that we are dust. Speaking to yourself the way He speaks to you is not softness, it is accuracy.',
      },
      {
        id: 'w3p-recalibration',
        claim: 'Setbacks are signals for recalibration, not verdicts of failure — worked with biologically, you recover and often emerge stronger.',
        cite: '9:08-9:47',
        refs: ['Proverbs 24:16'],
        bridge: 'For a just man falleth SEVEN TIMES, and riseth up again — the falling is in the verse about the just man. The setback was never the verdict; the rising is the identity. The Word used the beating as exercise.',
      },
    ],
  },
];

// Verbatim verse text for a witness ref — same verified rail as the Godhead
// Study, no second source of truth.
export function witnessVerse(ref) {
  return godheadVerse(ref);
}

// -----------------------------------------------------------------------------
// THE SEPARATION (Darrell 2026-07-03: "the separation is the same content for
// Practice for those who don't want the mixture so differentiate the lessons
// and also the level of the brain so all learners can learn" — refined:
// "separates for the practice only, stays mixed for those of us who need
// that"). Two renderings of the same content, one per house:
//   * the study room — ALWAYS intertwined: science + Word together, for those
//     of us who need the mixture;
//   * the Practice — this builder: a client-track psychoeducation module,
//     expert cited, NO Scripture in the clinical space, differentiated child
//     through senior so all learners can learn.
// -----------------------------------------------------------------------------
// Engine-shaped module (learn-framework levels + quiz) for the TLC client
// track: psychoeducation, not treatment; rides the track's LCSW validation
// gate like every other client lesson.
export function witnessClientModule() {
  return {
    id: 'cl4-bouncing-back-setbacks',
    title: 'Bouncing back from a setback (brain-based)',
    bigIdea: 'Setbacks cause a real dopamine dip and stress response — recovery is biological as well as emotional: act small before motivation arrives, shrink the step, feed dopamine sustainably, anchor in routine, and practice self-compassion. Source: Dr. Tracey Marks (psychiatrist), The Neuroscience of Setbacks.',
    source: 'Dr. Tracey Marks, psychiatrist — The Neuroscience of Setbacks (video)',
    levels: {
      child: 'When something goes wrong, your brain\'s happy fuel dips and everything feels heavy for a while. That is normal! Try one tiny job — like tidying one shelf — and your engine starts again. And be kind to yourself, the way you would be to a friend.',
      teen: 'A setback makes your brain\'s motivation chemical (dopamine) drop — so feeling flat is not laziness, it is biology. Do not wait to feel motivated: do one small thing (send one message, clear one corner). Break big tasks into tiny steps, skip the endless scroll (a quick fix that fades), move your body, see a friend — and talk to yourself kindly. Your brain works better with a coach than a bully.',
      standard: 'When reality misses expectations, dopamine drops (apathy, "mental whiplash"), stress dampens the prefrontal cortex while the amygdala over-fires, and rumination can relabel an external setback as personal failure. Brain-based recovery: behavioral activation (small structured action before motivation), micro-goals (steps small enough not to trip the stress response), sustainable dopamine (movement, connection, novelty, completed tasks — not scrolling or snacking), routine as an anchor without harsh self-talk, and self-compassion, which engages the caregiving system and re-engages the prefrontal cortex.',
      senior: 'Setbacks framed as recalibration, not verdict: expectation-violation lowers dopaminergic tone; stress shifts control from prefrontal to limbic systems; default-mode rumination consolidates a failure narrative. Evidence-informed countermeasures — behavioral activation, graded micro-goals, sustainable reward scheduling, routine to reduce decision fatigue, and self-compassion as threat-system down-regulation — offered as psychoeducation with a clear invitation to professional support where needed.',
    },
    quiz: { questions: [
      { q: 'Feeling flat after a setback is best understood as…', options: ['Laziness or weak character', 'A real dopamine dip — biology, not a verdict', 'A sign you should give up'], answer: 1, explain: 'The motivation dip is physiological. Understanding it removes the shame and opens the recovery moves.' },
      { q: 'The most effective first move when motivation is gone is to…', options: ['Wait until motivation returns', 'Take one small structured action', 'Push through the biggest task on the list'], answer: 1, explain: 'Behavioral activation: small action jump-starts the dopamine system — motivation follows action, not the other way around.' },
    ] },
  };
}
