// @vitest-environment node
// =============================================================================
// The shared Living Lesson gate catches what each copied gate caught (DR-1477)
// =============================================================================
// helpers/living-lesson-gate.js holds, once, the checks L305–L308 each copied
// whole. A shared gate that passes everything is theater (DR-0076 §3), so here
// it is run on a real lesson (L308) — every check clean — and then each defect
// is planted into a copy of that lesson and the one check that owns it must
// name it. The gate is also mounted on L308 as a new lesson's test would mount
// it, so the describe block itself runs green on real content.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll308-only-yahweh-can-judge-me.js';
import {
  livingLessonGate,
  lessonGateFaults,
  spineFaults,
  verbatimFaults,
  bareQuoteFaults,
  yahwehInQuoteFaults,
  voiceFaults,
  adversaryFaults,
  directionFaults,
  bandShareFaults,
  overlapFaults,
  ladderFaults,
  quizFaults,
  storyFaults,
  stringsOf,
} from './helpers/living-lesson-gate.js';

const ID = 'll308-only-yahweh-can-judge-me';
const SPINE = [
  ['James 4:12', 'There is one lawgiver, who is able to save and to destroy'],
  ['2 Timothy 2:15', 'Study to shew thyself approved unto God'],
  ['Nehemiah 8:10', 'the joy of the LORD is your strength'],
  ['Proverbs 27:17', 'Iron sharpeneth iron'],
  ['Ephesians 6:12', 'we wrestle not against flesh and blood'],
  ['Mark 3:25', 'if a house be divided against itself, that house cannot stand'],
  ['Romans 8:2', 'the law of the Spirit of life in Christ Jesus'],
];
// L308 names Tupac's song by its title, which is not our voice (its own test allows it the same way).
const SONG = [/\bonly God can judge me\b/gi];
const clone = () => JSON.parse(JSON.stringify(lesson));
const withBand = (band, text) => {
  const L = clone();
  L.levels[band] = text;
  return L;
};

// Mounted exactly as a new lesson's test mounts it.
livingLessonGate({ id: ID, lesson, ORDER, ADDED, order: 308, added: '2026-11-13', spine: SPINE, UNCHECKED, minQuoted: 150, voiceAllow: SONG });

describe('the shared gate reads a real lesson clean, check by check', () => {
  it('every check is empty on L308', () => {
    const all = lessonGateFaults(lesson, { spine: SPINE, voiceAllow: SONG });
    for (const [name, faults] of Object.entries(all)) expect(faults, name).toEqual([]);
  });
});

describe('PROVEN TO CATCH: each planted defect is named by the check that owns it', () => {
  it('a band that drops a spine verse', () => {
    const youth = lesson.levels.youth.split('Iron sharpeneth iron').join('Iron is sharp');
    expect(youth).not.toBe(lesson.levels.youth);
    expect(spineFaults(withBand('youth', youth), SPINE)).toEqual(['youth drops Proverbs 27:17']);
  });

  it('a spine span that is not in its verse', () => {
    expect(spineFaults(lesson, [['James 4:12', 'There is one judge over all']])[0]).toMatch(/is not in the verse/);
  });

  it('one altered word inside a quotation', () => {
    const broken = lesson.lesson.replace('Iron sharpeneth iron', 'Iron sharpeneth steel');
    expect(broken).not.toBe(lesson.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('a mid-verse span that capitalises its first word', () => {
    const broken = '"The joy of the LORD is your strength" (Nehemiah 8:10)';
    expect(verbatimFaults([broken])).toEqual(['(Nehemiah 8:10) is not the verse: The joy of the LORD is your strength']);
    expect(verbatimFaults(['"the joy of the LORD is your strength" (Nehemiah 8:10)'])).toEqual([]);
  });

  it('Darrell’s words put in double quotes, with no reference after them', () => {
    const L = clone();
    L.lesson += ' Darrell said "only Yahweh can judge me, so I study what He judges."';
    expect(bareQuoteFaults(L)).toEqual(['only Yahweh can judge me, so I study what He judges.']);
  });

  it('Yahweh put inside a quotation', () => {
    const L = clone();
    L.lesson += ' "the joy of Yahweh is your strength" (Nehemiah 8:10)';
    expect(yahwehInQuoteFaults(L)).toHaveLength(1);
  });

  it('a generic God in our own voice, while the quotations keep theirs', () => {
    const L = clone();
    L.levels.teen += ' God gives the power to get wealth.';
    expect(voiceFaults(L, SONG)).toEqual(['God :: ' + L.levels.teen.slice(0, 60)]);
    expect(voiceFaults(lesson, SONG), 'the corpus’ God inside a quote is never counted').toEqual([]);
    expect(voiceFaults(lesson).length, 'and the allowance is what lets the song title through').toBeGreaterThan(0);
  });

  it('a capitalised adversary', () => {
    const L = clone();
    L.levels.senior += ' Satan accuses.';
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });

  it('a band whose friend line is stripped is named alone', () => {
    const friend = /Friends, tell one friend this week three things[^.]*\./.exec(lesson.levels.youth);
    expect(friend, 'the youth friend sentence moved').toBeTruthy();
    expect(directionFaults(withBand('youth', lesson.levels.youth.replace(friend[0], '')))).toEqual(['youth is missing friends']);
  });

  it('a band cut short of its share', () => {
    const teen = lesson.levels.teen.slice(0, 600);
    expect(bandShareFaults(withBand('teen', teen))).toContain('teen');
  });

  it('a band that is a reworded copy of another', () => {
    expect(overlapFaults(withBand('teen', lesson.levels.senior)).length).toBeGreaterThan(0);
  });

  it('a child band that reads above its ceiling', () => {
    expect(ladderFaults(withBand('child', lesson.levels.senior)).length).toBeGreaterThan(0);
  });

  it('an eight-question quiz, and an answer out of range', () => {
    const L = clone();
    L.quiz.questions = L.quiz.questions.slice(0, 8);
    expect(quizFaults(L)).toEqual(['the quiz has 8 questions, not 10']);
    const M = clone();
    M.quiz.questions[0].answer = 9;
    expect(quizFaults(M)).toEqual(['question 1: answer out of range']);
  });

  it('a missing parable', () => {
    const L = clone();
    L.stories = L.stories.slice(0, 1);
    expect(storyFaults(L)).toContain('1 stories, not 2');
  });

  it('the module walk reaches every string, so a defect cannot hide in a quiz or a note', () => {
    const L = clone();
    L.quiz.questions[3].explain += ' Satan';
    expect(stringsOf(L).some((s) => s.endsWith(' Satan'))).toBe(true);
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });
});
