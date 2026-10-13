// =============================================================================
// L162 — Do not take a death so personal that you undermine your way home;
// let Him be Him. Verbatim KJV, and the rules this lesson is bound by.
// =============================================================================
// Darrell 2026-09-15, spoken: "Don't take anyone's death so personal that you
// undermine your way home. Yeah, we got hurt when people die, always. But it's
// never to the end... he existed before time already anyway. So why be so
// angry with him that we don't do what he say? When he is still him. Let him
// be him. Lesson."
//
// Built to the L127/L154 program: ten numbered sections, every verse verbatim
// from app/public/bible/kjv with its reference beside it, four authored bands
// (child, youth, teen, senior — DR-0418), quiz, facilitator notes. Sovereign
// and good are spoken in one breath (1 Samuel 2:6 beside Lamentations 3:33)
// and the gate pins it (DR-0098 / DR-0100).
// PROVEN-TO-CATCH: the whole-span check fails on one altered word inside any
// double quote.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';
import { formatLessonText } from '../lib/lesson-format.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => { const rest = src.slice(start); const end = rest.indexOf('\n  },\n'); return end > -1 ? rest.slice(0, end) : rest; })();
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j; try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();
const verse = (file, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')).chapters[ch - 1][v - 1];
const unescape = (text) => text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\"/g, '"').replace(/\\'/g, "'");
const quotedSpans = (text) => {
  const u = unescape(text);
  const at = [...u.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(u.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};
const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L162 is in the series, whole', () => {
  it('exists, follows L161, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll161-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('John 11:35; 1 Thessalonians 4:13-18; Matthew 5:4')).toBe(true);
  });
  it('reads as ten numbered sections', () => {
    const { items, sectionCount } = formatLessonText(m.lesson);
    expect(sectionCount).toBe(10);
    expect(items.filter((it) => it.kind === 'heading').map((it) => it.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});

describe('Darrell’s word is in the lesson (CLAUDE.md: always add it)', () => {
  it('the directive: the hurt, never to the end, the hope older than the grief, the anger named, let Him be Him', () => {
    expect(m.lesson).toMatch(/THE DIRECTIVE\. Darrell, 2026-09-15, spoken/);
    expect(m.lesson).toMatch(/do not take anyone's death so personal that you undermine your way home/);
    for (const h of ['FIRST, WE GET HURT, ALWAYS, AND THE WORD SAYS SO.', 'SECOND, IT IS NEVER TO THE END.', 'THIRD, THE HOPE IS OLDER THAN THE GRIEF.', 'FOURTH, THE ANGER, NAMED.', 'SEVENTH, LET HIM BE HIM.', 'EIGHTH, HE IS STILL HIM, SO WHAT HE SAID STILL STANDS.', 'NINTH, THE WAY HOME IS STILL OPEN.']) expect(m.lesson).toContain(h);
  });
  it('sovereign and good in one breath; he stopped stopping; the road is open unless you close it', () => {
    expect(m.lesson).toMatch(/He is Him: sovereign, and good, and both at once/);
    expect(m.lesson).toMatch(/He did not stop grieving; the Word records his grief\. He stopped undermining his way home\./);
    expect(m.lesson).toMatch(/the road to it is not closed by grief unless you close it/);
    for (const ref of ['John 11:35', '1 Thessalonians 4:13', 'Psalms 34:18', 'John 11:25', 'Revelation 21:4', '1 Corinthians 15:26', 'Psalms 90:2', 'Hebrews 13:8', 'Ruth 1:20', 'Jonah 4:9', 'Hebrews 12:15', 'Ephesians 4:27', 'Job 1:21', 'Job 13:15', 'Job 42:5', '2 Samuel 12:23', '1 Samuel 2:6', 'Lamentations 3:33', 'Isaiah 55:9', 'Genesis 50:20', 'John 14:2', 'Psalms 62:8', 'Micah 7:8']) expect(m.lesson).toContain(`(${ref})`);
  });
});

describe('every age band is served text authored for IT (DR-0418: youth included)', () => {
  it('child, youth, teen and senior levels are all authored, none a stub', () => {
    for (const key of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[key]).toBe('string');
      expect(m.levels[key].length, `${key} level is a stub`).toBeGreaterThan(1500);
    }
  });
  it('the ADULT band reads the lesson itself', () => {
    const r = resolveForAge(m, 'adult', null);
    expect(r.levelId).toBe('standard');
    expect(r.text).toBe(m.lesson);
  });
  it('each band gets genuinely different prose, ascending child < teen < senior', () => {
    const texts = AGE_BANDS.map((b) => resolveForAge(m, b.id, null).text);
    expect(texts.every((t) => t.length > 1500)).toBe(true);
    expect(m.levels.child.length).toBeLessThan(m.levels.teen.length);
    expect(m.levels.teen.length).toBeLessThan(m.levels.senior.length);
  });
  it('the child level teaches the real thing: it is okay to be sad, not the end, He was before time, the weed, Job, David, let Him be Him', () => {
    const c = m.levels.child;
    expect(c).toMatch(/Even Jesus cried\./);
    expect(c).toMatch(/John 11:25/);
    expect(c).toMatch(/Psalms 90:2/);
    expect(c).toMatch(/root of bitterness/);
    expect(c).toMatch(/He stopped stopping\./);
    expect(c).toMatch(/Let Him be Him\./);
    for (const heavy of ['necromancer', 'witch', 'sexual', 'slaughter', 'fornication', 'bastard']) expect(c.toLowerCase().includes(heavy), `child level carries adult freight: ${heavy}`).toBe(false);
  });
});

describe('NO in-quote alteration — the whole-span gate (DR-0076)', () => {
  it('the lesson’s double quotes are balanced', () => { expect(quotedSpans(l).balanced).toBe(true); });
  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(100);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (part.length < 8) continue;
        if (WHOLE_KJV.includes(part)) continue;
        altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });
  it('the anchors are quoted whole, letter for letter, with the reference beside each', () => {
    for (const [book, ch, v, label] of [['John', 11, 35, 'John 11:35'], ['1 Thessalonians', 4, 13, '1 Thessalonians 4:13'], ['John', 11, 25, 'John 11:25'], ['Psalms', 90, 2, 'Psalms 90:2'], ['Ruth', 1, 20, 'Ruth 1:20'], ['Hebrews', 12, 15, 'Hebrews 12:15'], ['Job', 13, 15, 'Job 13:15'], ['2 Samuel', 12, 23, '2 Samuel 12:23'], ['1 Samuel', 2, 6, '1 Samuel 2:6'], ['Lamentations', 3, 33, 'Lamentations 3:33'], ['John', 14, 2, 'John 14:2'], ['Psalms', 62, 8, 'Psalms 62:8']]) {
      const file = book.replace(/ /g, '');
      expect(m.lesson, label).toContain(`"${verse(file, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('John', 11, 35)}" (John 11:35)`);
    expect(m.anchor.theme).toContain(`"${verse('1Samuel', 2, 6)}" (1 Samuel 2:6)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('Though he slay me, yet will I trust in him', 'Though he slay me, yet will I trust him');
    const { spans } = quotedSpans(tampered);
    expect(spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('yet will I trust him')).length).toBeGreaterThan(0);
  });
});

describe('the house rules this lesson is bound by (CLAUDE.md, DR-0210, DR-0076)', () => {
  const ours = (() => {
    let out = unescape(l);
    for (const s of quotedSpans(l).spans) out = out.replace(`"${s}"`, '""');
    return out;
  })();
  it('names Yahweh in our voice; the generic term appears only as the quoted word under discussion', () => {
    expect(ours).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
  });
  it('the adversary is never capitalized in our voice', () => {
    expect(ours).not.toMatch(/\b(Satan|Lucifer|The devil|The Adversary)\b/);
  });
  it('the close is the name said to Him and the one thing He said, done', () => {
    expect(m.lesson).toMatch(/do one thing He told you to do that you have been leaving undone since the funeral\./);
  });
});
