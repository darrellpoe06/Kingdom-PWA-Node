// =============================================================================
// sov38 — every verse it stands on is the KJV corpus, verbatim
// =============================================================================
// Darrell forwarded a CFO Dive email on 2026-10-13 with one word on it:
// "Lesson." The email is an advertisement; the lesson says so in its own first
// paragraph, keeps the observation and refuses the sales conclusion.
//
// This pins the sixteen verses sov38 teaches from against the corpus on disk,
// and pins the two things about this lesson that are easy to get wrong:
//   * the DR-0530 bright line — Wisdom, Understanding, Knowledge and Love carry
//     the capital in OUR prose and NEVER inside a quotation, where the KJV
//     lowercases them (and reads "charity", not "love").
//   * the lesson numbers its own sections exactly once — author numbering would
//     set hasExplicit and silently disable the caps-heading pass (DR-0520).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SOVEREIGN_AI_MODULES, SOVEREIGN_AI_SESSION_FLOW, SOVEREIGN_AI_SESSION_MINUTES,
} from '../lib/sovereign-ai-class.js';
import { placesMissingDirections } from '../lib/talk-together.js';
import { formatLessonText, lessonShareText } from '../lib/lesson-format.js';
import { parseRunOfShow } from '../lib/presentable.js';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

const PINNED = {
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Luke 14:29': 'Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,',
  'Luke 14:30': 'Saying, This man began to build, and was not able to finish.',
  'Proverbs 24:3': 'Through wisdom is an house builded; and by understanding it is established:',
  'Proverbs 24:4': 'And by knowledge shall the chambers be filled with all precious and pleasant riches.',
  'Proverbs 2:6': 'For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.',
  'Exodus 31:3': 'And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,',
  '1 Corinthians 13:2': 'And though I have the gift of prophecy, and understand all mysteries, and all knowledge; and though I have all faith, so that I could remove mountains, and have not charity, I am nothing.',
  'Matthew 7:24': 'Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock:',
  'Matthew 7:26': 'And every one that heareth these sayings of mine, and doeth them not, shall be likened unto a foolish man, which built his house upon the sand:',
  'Matthew 7:27': 'And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell: and great was the fall of it.',
  'Luke 16:2': 'And he called him, and said unto him, How is it that I hear this of thee? give an account of thy stewardship; for thou mayest be no longer steward.',
  'Luke 16:10': 'He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.',
  'Proverbs 27:23': 'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
  '1 Corinthians 4:2': 'Moreover it is required in stewards, that a man be found faithful.',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
};

const lesson = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov38-'));
const PLACES = () => ['lesson', 'child', 'youth', 'teen', 'senior'].map((k) => ({
  place: k, text: k === 'lesson' ? lesson.lesson : lesson.levels[k],
}));

/**
 * EVERY authored string in the module, not only the prose a reader scrolls.
 * A mutation proved this matters: capitalising a Resource inside the quotation
 * in `bigIdea` passed a check that read `lesson` and the bands alone. bigIdea,
 * inApp, anchor.theme, benefits, rpe, facilitator notes and quiz explanations
 * all quote Scripture too, so the bright line is asserted across all of them.
 */
const EVERY_TEXT = () => {
  const out = [...PLACES()];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('bigIdea', lesson.bigIdea);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  ((lesson.facilitator || {}).talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', (lesson.facilitator || {}).howToRun);
  ((lesson.facilitator || {}).discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q); push(`quiz[${i}].explain`, q.explain);
  });
  return out;
};

/** Sentences of a text, so a claim is judged where it is actually made. */
const sentencesOf = (t) => String(t || '').split(/(?<=[.!?])\s+/);

describe('sov38 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  for (const [ref, text] of Object.entries(PINNED)) {
    it(`${ref} matches the corpus on disk`, () => {
      expect(text).toBe(corpusText(ref));
    });
  }

  it('every pinned verse is quoted somewhere in the lesson', () => {
    const all = PLACES().map((p) => p.text).join('\n');
    expect(Object.values(PINNED).filter((t) => !all.includes(t))).toEqual([]);
  });

  // The generalised form of a real slip: an earlier draft of quiz[1].explain ended
  // Proverbs 24:3 with a full stop where the KJV has a colon, and the pinned-table
  // check above could not see it, because it only pins the table. This walks EVERY
  // "quote" (Reference) pair the module writes anywhere and holds it to the corpus.
  it('every quoted span that names a reference is that verse, character for character', () => {
    const RE = /"([^"]{12,})"\s*\((\d?\s?[A-Z][A-Za-z]+\s+\d+:\d+)\)/g;
    const offenders = [];
    let pairs = 0;
    for (const { place, text } of EVERY_TEXT()) {
      RE.lastIndex = 0;
      let m;
      while ((m = RE.exec(text))) {
        pairs += 1;
        const ref = m[2].replace(/\s+/g, ' ').trim();
        if (corpusText(ref) !== m[1]) offenders.push(`${place} :: ${ref}`);
      }
    }
    expect(pairs).toBeGreaterThan(90); // 104 on 2026-10-13; a collapse here means the walk stopped seeing them
    expect(offenders, 'the corpus on disk is the authority for every quotation').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on (DR-0734)', () => {
    const anchored = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    expect(Object.keys(PINNED).filter((r) => !anchored.has(r))).toEqual([]);
  });
});

describe('sov38 — the Resources carry the capital in OUR voice only (DR-0530)', () => {
  // The KJV lowercases wisdom, understanding and knowledge inside the very
  // verses this lesson stands on, and reads "charity" where we say Love. A
  // blind capitalisation sweep is forbidden: it would corrupt the Word to
  // decorate our point. So this is asserted in both directions.
  const RESOURCES = ['Wisdom', 'Understanding', 'Knowledge', 'Love'];

  it('no Resource is capitalized inside a quotation, ANYWHERE in the module', () => {
    const offenders = [];
    for (const { place, text } of EVERY_TEXT()) {
      const quoted = (String(text).match(/"[^"]*"/g) || []).join(' ');
      for (const w of RESOURCES) if (quoted.includes(w)) offenders.push(`${place}:${w}`);
    }
    expect(offenders, 'the corpus is the authority; our prose is ours').toEqual([]);
  });

  it('the quoted Proverbs 24:3 keeps its lowercase wording everywhere it appears', () => {
    for (const { place, text } of EVERY_TEXT()) {
      if (!/is an house builded/.test(text)) continue;
      expect(text, `${place} altered the quotation`).toContain('Through wisdom is an house builded; and by understanding it is established:');
    }
  });

  it('the quoted verses keep the KJV wording, including charity', () => {
    const all = PLACES().map((p) => p.text).join('\n');
    expect(all).toContain('and have not charity, I am nothing.');
    expect(all).toContain('Through wisdom is an house builded; and by understanding it is established:');
  });
});

describe('sov38 — the sections are numbered exactly once (DR-0520)', () => {
  it('every band and the lesson head the same number of sections', () => {
    const counts = PLACES().map(({ place, text }) => ({
      place, n: formatLessonText(text).items.filter((i) => i.kind === 'heading').length,
    }));
    const n = counts[0].n;
    expect(n).toBeGreaterThan(9);
    expect(counts.filter((c) => c.n !== n)).toEqual([]);
  });

  it('the share text numbers its sections and keeps every word', () => {
    const share = lessonShareText(lesson.lesson);
    expect(share).toMatch(/^1\. /m);
    expect(share.replace(/^\d+\.\s/gm, '').replace(/\s+/g, ' ').trim())
      .toBe(String(lesson.lesson).replace(/\s+/g, ' ').trim());
  });

  it('no author numbering remains, which would disable the caps-heading pass', () => {
    const offenders = PLACES().filter(({ text }) => /(?:^|\n\n)(?:MOVEMENT\s+)?(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|[1-9])\.\s+[A-Z]/.test(text));
    expect(offenders.map((o) => o.place)).toEqual([]);
  });
});

describe('sov38 — the facilitator guide is whole', () => {
  // This is the check I did not have. The lesson shipped with talkingPoints alone,
  // and the COURSE-wide suite caught the two missing fields in CI rather than this
  // one, which is the wrong place for a lesson's own witness to be silent. The
  // run-of-show is pinned to the course's six-segment, 75-minute shape so a guide
  // that parses into the wrong flow fails here, not on a Sunday.
  it('carries all three facilitator fields', () => {
    const f = lesson.facilitator;
    expect(f.talkingPoints.length).toBeGreaterThan(0);
    expect(typeof f.howToRun).toBe('string');
    expect(f.discussionPrompts.length).toBeGreaterThan(0);
  });

  it('the run of show is the course session flow, and it sums to 75 minutes', () => {
    const segs = parseRunOfShow(lesson.facilitator.howToRun);
    expect(segs.map((s) => s.name)).toEqual(SOVEREIGN_AI_SESSION_FLOW.map((s) => s.name));
    expect(segs.map((s) => s.estimatedMin)).toEqual(SOVEREIGN_AI_SESSION_FLOW.map((s) => s.minutes));
    expect(segs.reduce((t, s) => t + s.estimatedMin, 0)).toBe(SOVEREIGN_AI_SESSION_MINUTES);
    expect(segs.filter((s) => !s.detail)).toEqual([]);
  });

  it('every discussion prompt opens on a verse and then asks something', () => {
    for (const p of lesson.facilitator.discussionPrompts) {
      expect(p, 'a prompt opens with the quotation').toMatch(/^"[^"]+"\s*\([^)]+\)/);
      expect(p.trim(), 'and it ends on a question').toMatch(/\?$/);
    }
  });
});

describe('sov38 — every band sends the reader in all three directions', () => {
  it('no place is short of a direction', () => {
    expect(placesMissingDirections(lesson)).toEqual([]);
  });
});

describe('sov38 — the advertisement is named, and its unproven figure refused', () => {
  // DR-0100: an advertiser's headline percentage with no study behind it is
  // unverified, and under-claiming is as much a failure of truth as
  // over-claiming. The lesson must say WHICH it is, in its own text.
  it('says plainly that the source is an advertisement', () => {
    const all = PLACES().map((p) => p.text).join('\n');
    expect(all).toContain('It is an advertisement');
    expect(all.toLowerCase()).toContain('never something to obey');
  });

  it('never repeats the unsourced figure as fact — judged sentence by sentence', () => {
    // A mutation proved the whole-text version too weak: replacing the refusal
    // with a bare assertion still passed, because the word "unverified" sat in
    // a NEIGHBOURING sentence. The claim is judged where it is made.
    const REFUSES = /(asserts|claims?|subject line|says|unverified|no study|not established|cites no|decline|will not)/i;
    const offenders = [];
    for (const { place, text } of EVERY_TEXT()) {
      for (const sent of sentencesOf(text)) {
        if (!/ninety-one per cent|\b91\s?%/i.test(sent)) continue;
        if (!REFUSES.test(sent)) offenders.push(`${place}: ${sent.trim().slice(0, 90)}`);
      }
    }
    expect(offenders, 'the figure may be NAMED in order to refuse it, never asserted').toEqual([]);
  });
});
