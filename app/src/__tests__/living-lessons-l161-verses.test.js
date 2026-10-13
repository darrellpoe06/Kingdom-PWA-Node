// =============================================================================
// L161 — One source of truth: His voice is heard in His Word; be still, be
// engrafted, build each other. Verbatim KJV, and the rules this lesson is
// bound by.
// =============================================================================
// Darrell 2026-09-15, spoken: "The word of Yahweh is the only place you can
// hear the voice of God in the earth... one source of truth... it's true as a
// person... be quiet... engrafted... Christ-like mindset... love conquers a
// multitude of sin... the tree of knowledge of good and evil... he's a being
// that's outside of a man... all humans... he gets rid of those who don't
// love him... we just blind... let's not be demonizing each other... pray for
// each other... build each other." Rendered for meaning (DR-0331); the Word's
// own words where his differ (one blood / took part of the same; charity
// shall COVER); He removes AND He waits, both taught (DR-0098 / DR-0100).
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
const ID = 'll161-one-source-of-truth-his-voice-in-his-word-be-still-be-engrafted-build-each-other';
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

describe('L161 is in the series, whole', () => {
  it('exists, follows L160, and the painted count is real', () => {
    expect(start).toBeGreaterThan(-1);
    expect(m).toBeTruthy();
    const at = LIVING_LESSONS_MODULES.findIndex((x) => x.id === ID);
    expect(LIVING_LESSONS_MODULES[at - 1].id.startsWith('ll160-')).toBe(true);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
  it('carries the full teaching shape', () => {
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(m.lesson.length).toBeGreaterThan(15000);
    expect(m.anchor.ref.startsWith('Isaiah 8:20; John 10:27; John 14:6')).toBe(true);
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
  it('the directive: one source, be still and engrafted, the mind that locks you in, love covers, the tree, one blood, He removes and waits, we are blind, pray build move', () => {
    expect(m.lesson).toMatch(/THE DIRECTIVE\. Darrell, 2026-09-15, spoken/);
    for (const h of ['FIRST, ONE SOURCE OF TRUTH, AND IT IS HIS VOICE.', 'THIRD, BE STILL, AND LET THE WORD BE ENGRAFTED.', 'FOURTH, THE MIND THAT LOCKS YOU IN.', 'SIXTH, THE SAME CONVERSATION AT THE TREE.', 'EIGHTH, HE REMOVES, AND HE WAITS.', 'NINTH, WE ARE BLIND, SO STOP DEMONIZING EACH OTHER.', 'TENTH, PRAY FOR EACH OTHER, BUILD EACH OTHER, MOVE.']) expect(m.lesson).toContain(h);
  });
  it('the Word’s own words carry his meaning: one blood / took part of the same, love COVERS, both halves of removes-and-waits', () => {
    expect(m.lesson).toMatch(/He shares the blood of every human being who has ever lived/);
    expect(m.lesson).toMatch(/the Word's word is covers/);
    expect(m.lesson).toMatch(/He removes, and He waits, and every one of us still breathing is breathing inside the waiting/);
    expect(m.lesson).toMatch(/you cannot see well enough to be the judge/);
    for (const ref of ['Isaiah 8:20', 'John 10:27', 'John 12:48', 'John 14:6', 'Luke 24:32', 'Psalms 46:10', 'James 1:21', 'Psalms 119:18', 'Philippians 2:5', 'John 15:7', '1 Peter 4:8', 'Genesis 3:5', 'Ephesians 6:12', 'Revelation 12:12', 'Acts 17:26', 'Hebrews 2:14', 'Psalms 5:5', 'Ezekiel 33:11', '2 Peter 3:9', '2 Corinthians 4:4', '1 Corinthians 13:12', 'Matthew 7:3', 'James 4:11', 'James 5:16', '1 Thessalonians 5:11', 'Matthew 6:33']) expect(m.lesson).toContain(`(${ref})`);
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
  it('the child level teaches the real thing: the one place, the graft, the tree, one blood, He waits, the board in the eye, pray and build', () => {
    const c = m.levels.child;
    expect(c).toMatch(/Isaiah 8:20/);
    expect(c).toMatch(/Engrafted\./);
    expect(c).toMatch(/That was the first lie\./);
    expect(c).toMatch(/We are all made of one blood\./);
    expect(c).toMatch(/He takes no pleasure in it\./);
    expect(c).toMatch(/You cannot see well enough to be the judge\./);
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
    for (const [book, ch, v, label] of [['Isaiah', 8, 20, 'Isaiah 8:20'], ['John', 10, 27, 'John 10:27'], ['John', 14, 6, 'John 14:6'], ['Psalms', 46, 10, 'Psalms 46:10'], ['James', 1, 21, 'James 1:21'], ['Philippians', 2, 5, 'Philippians 2:5'], ['1 Peter', 4, 8, '1 Peter 4:8'], ['Genesis', 3, 5, 'Genesis 3:5'], ['Acts', 17, 26, 'Acts 17:26'], ['Hebrews', 2, 14, 'Hebrews 2:14'], ['Ezekiel', 33, 11, 'Ezekiel 33:11'], ['Matthew', 7, 3, 'Matthew 7:3'], ['James', 5, 16, 'James 5:16']]) {
      const file = book.replace(/ /g, '');
      expect(m.lesson, label).toContain(`"${verse(file, ch, v)}" (${label})`);
    }
    expect(m.anchor.theme).toContain(`"${verse('Isaiah', 8, 20)}" (Isaiah 8:20)`);
    expect(m.anchor.theme).toContain(`"${verse('James', 1, 21)}" (James 1:21)`);
  });
  it('PROVEN-TO-CATCH: one altered word inside a quote fails the span gate', () => {
    const tampered = l.replace('receive with meekness the engrafted word', 'receive with meekness the engraved word');
    const { spans } = quotedSpans(tampered);
    expect(spans.filter((s) => s.length >= 8 && !WHOLE_KJV.includes(s) && s.includes('engraved word')).length).toBeGreaterThan(0);
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
  it('the close is ten minutes of stillness and one name prayed', () => {
    expect(m.lesson).toMatch(/pray by name for the one person you were tempted to talk about today\. In Jesus' name\./);
  });
});
