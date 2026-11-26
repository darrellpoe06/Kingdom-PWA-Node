// =============================================================================
// relationship-tracks -- guided walks through the Relationships lessons (DR-1702)
// =============================================================================
// Darrell 2026-11-26, on the Relationships section: "This is very good!!!!
// Relationships should be a good one... maybe we have a premium level of
// Relationships?" PREMIUM IN DEPTH, NOT IN PRICE: living lessons are formation
// and the Word is never sold (DR-0536), so the deeper level is free -- three
// guided tracks built from lessons already on the Relationships shelf.
//
// NOTHING HERE IS INVENTED (DR-0076):
//   - every step is a real mounted lesson id (a test fails the build otherwise);
//   - `why` is the lesson's OWN words: a span of its bigIdea, matched ignoring
//     only case, curly quotes and spacing. If the lesson is rewritten and the
//     span is gone, the line is dropped at run time and a test goes red;
//   - `prompt` is an index into the lesson's own facilitator.discussionPrompts
//     (the Reflection Questions its Study tab already shows);
//   - progress is the reader's own saved place (learn-resume, via
//     lesson-progress) and the read record (`done`). Nothing measured, no bar.
// A step marked `whenMounted` belongs to a lesson still in review; it joins the
// track the moment the lesson is in the catalog, and is simply absent before.
// =============================================================================

import { allLessons, presentLesson } from './presentation.js';
import { lessonProgress } from '../lesson-progress.js';

const step = (id, why, prompt, extra = {}) => Object.freeze({ id, why, prompt, ...extra });

export const RELATIONSHIP_TRACKS = Object.freeze([
  Object.freeze({
    id: 'couples',
    label: 'Couples',
    title: 'Six Weeks Together',
    note: 'One marriage lesson a week, read apart or together, then talked about together.',
    cover: 'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works',
    steps: Object.freeze([
      step(
        'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover',
        'It is very close to the question Yahweh has always put to a husband, and this lesson answers it from His Word first.',
        0
      ),
      step(
        'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works',
        'Marriage does not usually fall apart all at once; it gets slowly buried under everything else.',
        0
      ),
      step('ll157-what-is-love-in-depth-and-in-range-action-based-word-first', 'Love, in the Word, is fifteen verbs and not one feeling.', 1),
      step(
        'll121-know-your-own-post-her-provision-her-guard-and-the-beam-in-the-pointing-eye',
        'A person can become an expert in someone else’s assignment while never learning their own.',
        0
      ),
      step(
        'll115-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint',
        'Meek means strength under control and quiet means peace within.',
        0
      ),
      step('ll319-what-the-trust-could-not-keep', 'The money was planned for; the heart was not.', 0),
    ]),
  }),
  Object.freeze({
    id: 'parents',
    label: 'Parents',
    title: 'The House Still Teaches',
    note: 'The family and children lessons, in order, with a question for the table after each.',
    cover: 'll313-children-are-a-heritage-when-the-school-closes-the-house',
    steps: Object.freeze([
      step('ll313-children-are-a-heritage-when-the-school-closes-the-house', 'And it never handed their teaching to a building.', 1),
      step(
        'll46-ye-fathers-provoke-to-good-works',
        'A father is not neutral and not merely a watchman; he deliberately STIRS his child — the only question is toward what.',
        0
      ),
      step(
        'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same',
        'A child does not experience the parents’ love, a child experiences the way the parent shows up.',
        2
      ),
      step(
        'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools',
        'A child is entrusted, not a market to be farmed for attention.',
        1
      ),
      step(
        'll282-the-greater-work',
        'The flock at home is the greater work: the souls of our children and how they experience Yahweh matter more than job stress.',
        0
      ),
      step('ll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here', 'The Spirit-follow framework overrules the bloodline.', 0),
    ]),
  }),
  Object.freeze({
    id: 'repair',
    label: 'Repair',
    title: 'Offense, Forgiveness, Ruling Your Spirit',
    note: 'Where offense starts, how forgiveness and trust work, and how to stay steady.',
    cover: 'll16-rule-your-spirit-repair-the-bond',
    steps: Object.freeze([
      step(
        'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it',
        'That is why nine words can end a twenty-year friendship, and why one sentence can pull somebody back from a ledge.',
        2
      ),
      step('ll15-seasoned-with-salt', 'Asking IS drawing out the deep water.', 1),
      step('ll291-fruits-meet-for-repentance', 'Forgiveness is commanded before trust returns; trust is rebuilt by fruit.', 0),
      step('ll16-rule-your-spirit-repair-the-bond', 'The person who stays calm holds the room.', 3),
      // L346 (PR #2959) joins as the last step the moment it is in the catalog.
      step(
        'll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when',
        'The sting comes from loving the truth, and that is not the sin; what we do next is the test.',
        2,
        { whenMounted: true }
      ),
    ]),
  }),
]);

/** Case, curly quotes, dashes and spacing set aside; the words must be the lesson's own. */
export function sameWords(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')
    .trim();
}

/** True when `why` is a span of the lesson's own bigIdea. Pure. */
export function whyIsTheLessons(lesson, why) {
  const w = sameWords(why);
  return !!w && sameWords(lesson && lesson.bigIdea).includes(w);
}

/** The lesson's own discussion prompt at `i`, or '' when it has none there. Pure. */
export function promptFrom(lesson, i) {
  const list = (lesson && lesson.facilitator && lesson.facilitator.discussionPrompts) || [];
  const p = list[i];
  return typeof p === 'string' ? p.trim() : '';
}

const NO_PLACE = () => null;

/**
 * The tracks, from the mounted catalog and the reader's own places. Pure.
 * @param findPlace (courseKey, lessonId) -> place | null   (lesson-progress placeLookup)
 * @param done      Set of lesson ids on the reader's read record
 */
export function relationshipTracks(courses, index, { preview = false, findPlace = NO_PLACE, done = null } = {}) {
  const at = new Map(allLessons(courses).map((x) => [x.lesson.id, x]));
  const present = (x) => {
    const p = presentLesson(x.lesson, x.course, index, { preview, lite: true });
    return p ? { ...x, p } : null;
  };
  return RELATIONSHIP_TRACKS.map((t) => {
    const steps = t.steps
      .map((s) => {
        const hit = at.get(s.id);
        const x = hit && present(hit);
        if (!x) return null;
        const progress = lessonProgress(findPlace(x.p.courseKey, x.p.lessonId));
        const finished = !!((done && done.has && done.has(s.id)) || (progress && progress.finished));
        return {
          x,
          why: whyIsTheLessons(x.lesson, s.why) ? s.why : '',
          prompt: promptFrom(x.lesson, s.prompt),
          progress,
          finished,
        };
      })
      .filter(Boolean);
    const coverHit = at.get(t.cover);
    const cover = (coverHit && present(coverHit)) || (steps[0] && steps[0].x) || null;
    const finishedCount = steps.filter((s) => s.finished).length;
    const nextAt = steps.findIndex((s) => !s.finished);
    const started = steps.some((s) => s.finished || (s.progress && s.progress.fraction > 0));
    return {
      id: t.id,
      label: t.label,
      title: t.title,
      note: t.note,
      cover,
      steps,
      total: steps.length,
      finishedCount,
      started,
      // The step the button opens: the first one not yet read, or step 1 again when all are read.
      next: steps.length ? { number: (nextAt >= 0 ? nextAt : 0) + 1, step: steps[nextAt >= 0 ? nextAt : 0] } : null,
      complete: steps.length > 0 && nextAt < 0,
    };
  }).filter((t) => t.steps.length);
}

/** What the track's button says. Pure. */
export function trackAction(t) {
  if (!t || !t.next) return '';
  if (t.complete) return 'Walk it again';
  return t.started ? `Continue step ${t.next.number}` : 'Start';
}
