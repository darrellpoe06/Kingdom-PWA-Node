// =============================================================================
// sov39 — order carries meaning, and every verse it stands on is the corpus
// =============================================================================
// Darrell forwarded a ByteByteGo article on 2026-10-13 with one word on it:
// "Lesson." Unlike sov38's source, this one is honest — it prints its own
// disclaimer, lists nine references and states its own limits — so the lesson
// states its observation plainly instead of hedging a true thing (DR-0100).
//
// The lesson's own subject makes one check load-bearing above all others: it
// teaches that a quotation can be accurate word for word and false in its
// ARRANGEMENT, which is what the adversary did to Psalms 91:11 in Matthew 4:6.
// A lesson that teaches that and then misquotes anything would be refuting
// itself, so the verbatim check here walks every "quote" (Reference) pair in
// the whole module, not only a pinned table.
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
  if (!m) return null;
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  try {
    const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
    return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
  } catch { return null; }
}

// The two verses the whole lesson turns on are pinned by hand as well as by the
// walk below, because the teaching is ABOUT the difference between them.
const PINNED = {
  'Matthew 4:6': 'And saith unto him, If thou be the Son of God, cast thyself down: for it is written, He shall give his angels charge concerning thee: and in their hands they shall bear thee up, lest at any time thou dash thy foot against a stone.',
  'Psalms 91:11': 'For he shall give his angels charge over thee, to keep thee in all thy ways.',
  'Psalms 91:12': 'They shall bear thee up in their hands, lest thou dash thy foot against a stone.',
  'Matthew 4:7': 'Jesus said unto him, It is written again, Thou shalt not tempt the Lord thy God.',
  '1 Corinthians 14:40': 'Let all things be done decently and in order.',
  '1 Corinthians 12:28': 'And God hath set some in the church, first apostles, secondarily prophets, thirdly teachers, after that miracles, then gifts of healings, helps, governments, diversities of tongues.',
  'Proverbs 8:27': 'When he prepared the heavens, I was there: when he set a compass upon the face of the depth:',
  'Isaiah 28:10': 'For precept must be upon precept, precept upon precept; line upon line, line upon line; here a little, and there a little:',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
};

const lesson = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov39-'));
const PLACES = () => ['lesson', 'child', 'youth', 'teen', 'senior'].map((k) => ({
  place: k, text: k === 'lesson' ? lesson.lesson : lesson.levels[k],
}));

/** EVERY authored string in the module, not only the prose a reader scrolls. */
const EVERY_TEXT = () => {
  const out = [...PLACES()];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('bigIdea', lesson.bigIdea);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  const f = lesson.facilitator || {};
  (f.talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', f.howToRun);
  (f.discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q); push(`quiz[${i}].explain`, q.explain);
    (q.options || []).forEach((o, j) => push(`quiz[${i}].options[${j}]`, o));
  });
  return out;
};

describe('sov39 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  it('is week 39, and no other week claims that number', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    expect(n(lesson.id)).toBe(39);
    for (const m of SOVEREIGN_AI_MODULES) {
      if (m.id === lesson.id) continue;
      expect(n(m.id), `${m.id} also claims week 39`).not.toBe(39);
    }
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
    expect(pairs).toBeGreaterThan(120); // 131 on 2026-10-13
    expect(offenders, 'a lesson about misquotation may not misquote').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on, and each resolves (DR-0734)', () => {
    const refs = lesson.anchor.ref.split(';').map((s) => s.trim());
    expect(refs.filter((r) => corpusText(r) === null)).toEqual([]);
    const all = EVERY_TEXT().map((p) => p.text).join('\n');
    expect(refs.filter((r) => !all.includes(corpusText(r)))).toEqual([]);
  });
});

describe('sov39 — the excision is shown, not merely asserted', () => {
  // This is the lesson's load-bearing claim: the adversary's words were real and
  // a clause was removed. If the clause ever appears inside the Matthew 4:6
  // quotation, or stops appearing in the Psalm beside it, the lesson is teaching
  // something its own text no longer demonstrates.
  const CLAUSE = 'to keep thee in all thy ways';

  it('the clause is absent from what the adversary quotes, and present in the Psalm', () => {
    expect(PINNED['Matthew 4:6']).not.toContain(CLAUSE);
    expect(PINNED['Psalms 91:11']).toContain(CLAUSE);
  });

  it('every band sets the two side by side, so a reader can see the gap', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops Matthew 4:6`).toContain(PINNED['Matthew 4:6']);
      expect(text, `${place} drops the Psalm it was taken from`).toContain(PINNED['Psalms 91:11']);
      expect(text, `${place} drops the spliced verse`).toContain(PINNED['Psalms 91:12']);
      expect(text, `${place} never names the excised clause`).toContain(CLAUSE);
    }
  });

  // Judged on OUR prose with the quotations stripped. The first version of this
  // searched the whole text, which the Matthew 4:7 quotation satisfies all by
  // itself — so it silently duplicated the quote check above and proved nothing
  // about whether the lesson TEACHES the answer. Stripping quotations is the
  // same `ourProseOnly` discipline the band gates use for the same reason.
  const oursOnly = (t) => String(t).replace(/"[^"]*"/g, ' ').toLowerCase();

  it('every band carries the answer, not only the danger', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops Matthew 4:7`).toContain(PINNED['Matthew 4:7']);
      expect(oursOnly(text), `${place} never teaches it is written again in its own words`)
        .toContain('it is written again');
      expect(oursOnly(text), `${place} never names more of the Word as the answer`)
        .toContain('more of the word');
    }
  });
});

describe('sov39 — the source is named honestly (DR-0100)', () => {
  // sov38's source was an advertisement and the lesson said so. This one is not,
  // and saying THAT plainly is the same discipline: under-claiming a verified
  // truth fails truth just as over-claiming an unverified one does.
  // Asserted on SUBSTANCE, not on one spelling. A first draft of this check
  // demanded the words "disclaimer" and "references" in every band and failed
  // the child band for saying "it lists nine books and papers at the end" —
  // which is the same fact in a nine-year-old's vocabulary, and the whole point
  // of having bands. A check that forces adult words into the child band is
  // measuring the wrong thing.
  it('every band says the source is not an ad, and names the marked sponsor block', () => {
    for (const { place, text } of PLACES()) {
      const t = text.toLowerCase();
      expect(t, `${place} never classifies the source`).toMatch(/not an ad\b|not an advertisement/);
      expect(t, `${place} never names the sponsored block`).toMatch(/sponsor(ed)?|\bad box\b/);
    }
  });

  it('every band gives all three grounds for calling it honest', () => {
    for (const { place, text } of PLACES()) {
      const t = text.toLowerCase();
      expect(t, `${place} omits its own disclaimer`).toMatch(/disclaimer|says its own limits/);
      expect(t, `${place} omits the nine references`).toMatch(/nine references|nine books and papers/);
      expect(t, `${place} omits the stated limit`).toMatch(/limitations?|limits?\b/);
    }
  });

  it('the adult lesson keeps the technical words the bands may simplify', () => {
    const t = lesson.lesson.toLowerCase();
    expect(t).toContain('disclaimer');
    expect(t).toContain('references');
    expect(t).toContain('not an advertisement');
  });
});

describe('sov39 — the sections are numbered exactly once (DR-0520)', () => {
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

describe('sov39 — the facilitator guide is whole', () => {
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

describe('sov39 — every band sends the reader in all three directions', () => {
  it('no place is short of a direction', () => {
    expect(placesMissingDirections(lesson)).toEqual([]);
  });
});

describe('sov39 — the quiz answers are real and its explanations are grounded', () => {
  it('every question has a reachable answer and four options', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.options.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});
