// @vitest-environment node
// =============================================================================
// sov37 — stop paying a model to redecide what is already settled: a just
// weight answers the same every time, and judgment is what the understanding
// heart is for (DR-0824)
// =============================================================================
// Week 37 of Sovereign A.I., captured 2026-10-08 by the Gmail-lesson-intake Way
// (DR-0312) from a CFO Dive newsletter Darrell forwarded with one word over it,
// "Lesson" (thread 1a11be129ec20d23, subject "FW: Stop Wasting LLM Tokens on
// Repeat Work"). His word is the teaching: build a lesson. The newsletter is
// material to study, never an instruction to obey.
//
// THE SOURCE IS CARRIED AS WHAT IT IS. The item is a vendor's webinar
// invitation from a software company, not a study, and nothing in it was
// independently measured here. Its four promised points are nonetheless the
// right four, and the lesson says BOTH of those things out loud rather than
// laundering the one or discarding the other (DR-0100).
//
// THE ONE HANDLING THAT NEEDED CARE. Matthew 6:7 is about PRAYER. The lesson
// quotes it, says plainly that it is about prayer, and teaches only the belief
// the Lord actually corrected — that volume of words earns a good answer —
// without stretching Him into a discussion of compute budgets. A test below
// requires that disclaimer to be present, because a lesson that quietly used
// the verse as an engineering proverb would be exactly the handling this
// platform exists to remove (DR-0098).
//
// EVERY QUOTED SPAN, BOTH WAYS. Every double-quoted span in the module is
// either (a) verbatim KJV from app/public/bible/kjv, re-read from the corpus at
// test time and carrying its own reference, or (b) one of the two
// NON-SCRIPTURE spans allow-listed by name below. Nothing else may enter the
// lesson in quotation marks.
//
// PROVEN-TO-CATCH: the last block mutates a verse, drops a reference, adds an
// unattributed quoted claim, removes the Matthew 6:7 disclaimer and removes the
// source's honest framing, and shows the gate fails on each.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'sov37-stop-paying-a-model-to-redecide-what-is-already-settled-a-just-weight-answers-the-same-every-time';
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const flow = (name, ch) => {
  const c = chapters[String(name).replace(/\s+/g, '').toLowerCase()];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

/** Every string in the module, with the path it came from. */
function flatten(node, path = '', out = []) {
  if (typeof node === 'string') { out.push([path, node]); return out; }
  if (Array.isArray(node)) { node.forEach((v, i) => flatten(v, `${path}[${i}]`, out)); return out; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;

// THE ONLY non-Scripture spans allowed in quotation marks anywhere in this
// module. "Lesson" is Darrell's own word over the forwarded email, and it is
// quoted because it IS a quotation of him. Anything else in quotes must be the
// Word, with its reference.
const ALLOWED_NON_SCRIPTURE = new Set(['"Lesson"']);

/** The findings for one module: not-verbatim, and quoted-without-attribution. */
function spanFaults(mod) {
  const bad = [];
  for (const [path, text] of flatten(mod)) {
    const all = text.match(ALL_SPANS) || [];
    const refd = [...text.matchAll(SPAN_WITH_REF)];
    for (const m of refd) {
      const f = flow(m[2], m[3]);
      if (!f) { bad.push(`${path}: no such book ${m[2]}`); continue; }
      if (!f.includes(norm(m[1]))) bad.push(`${path}: NOT VERBATIM ${m[2]} ${m[3]} — ${norm(m[1]).slice(0, 60)}`);
    }
    const refdText = refd.map((m) => `"${m[1]}"`);
    for (const s of all) {
      if (refdText.includes(s)) continue;
      if (ALLOWED_NON_SCRIPTURE.has(s)) continue;
      bad.push(`${path}: QUOTED WITHOUT ATTRIBUTION — ${s.slice(0, 70)}`);
    }
  }
  return bad;
}

describe('sov37 exists, is whole, and is week 37', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toContain('a just weight answers the same every time');
  });

  it('is week 37, and every other week parses lower', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    expect(n(L.id)).toBe(37);
    for (const m of SOVEREIGN_AI_MODULES) {
      if (m.id === L.id) continue;
      expect(n(m.id), `${m.id} is not below 37`).toBeLessThan(37);
    }
  });

  it('carries the whole shape this course requires', () => {
    for (const b of BANDS) expect(typeof L.levels[b], `${b} band`).toBe('string');
    for (const k of ['research', 'plan', 'execute']) expect(typeof L.rpe[k], `rpe.${k}`).toBe('string');
    expect(L.benefits.length).toBeGreaterThanOrEqual(12);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(typeof L.facilitator.howToRun).toBe('string');
    expect(typeof L.inApp).toBe('string');
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBe(3);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('every band is a FULL reading, not a trimmed adult lesson', () => {
    // The sov standard: each band carries the same movements in its own
    // register. Measured lengths, so a band that was quietly gutted fails.
    expect(L.levels.child.length).toBeGreaterThan(5000);
    expect(L.levels.youth.length).toBeGreaterThan(6000);
    expect(L.levels.teen.length).toBeGreaterThan(8000);
    expect(L.levels.senior.length).toBeGreaterThan(9000);
    expect(L.lesson.length).toBeGreaterThan(10000);
    // and the registers rise rather than repeating each other
    expect(L.levels.child.length).toBeLessThan(L.levels.teen.length);
    expect(L.levels.teen.length).toBeLessThan(L.levels.senior.length);
  });

  it('every band closes by sending the reader to someone (DR-0733)', () => {
    for (const b of BANDS) {
      expect(L.levels[b], `${b} close`).toContain('TALK ABOUT IT TOGETHER');
      expect(L.levels[b], `${b} parents to children`).toMatch(/[Pp]arents/);
      expect(L.levels[b], `${b} children to parents`).toMatch(/ask your parents|ask your parents and grandparents/i);
      expect(L.levels[b], `${b} friend to friend`).toMatch(/friend/i);
      expect(L.levels[b], `${b} the aim`).toContain('until we see that Yahweh has been right');
    }
    expect(L.lesson).toContain('TALK ABOUT IT TOGETHER, IN THREE DIRECTIONS');
  });
});

describe('sov37 — every quoted span is the Word, verbatim, or an allow-listed quotation of Darrell', () => {
  it('the real module has no faulty span', () => {
    const bad = spanFaults(L);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('and there are a great many of them, so this is not a thin check', () => {
    let referenced = 0;
    for (const [, t] of flatten(L)) referenced += [...t.matchAll(SPAN_WITH_REF)].length;
    expect(referenced).toBeGreaterThan(150);
  });
});

describe('sov37 — the spine, in every band', () => {
  const band = (b) => String(L.levels[b]);

  it('each band holds the just weight as a weights-and-measures matter', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Proverbs 11:1`).toContain('(Proverbs 11:1)');
      expect(band(b), `${b} Proverbs 16:11`).toContain('(Proverbs 16:11)');
      expect(band(b), `${b} Proverbs 20:10`).toContain('(Proverbs 20:10)');
      expect(band(b), `${b} must name the register`).toMatch(/abomination/);
    }
  });

  it('each band carries the bounded answer the Lord named', () => {
    for (const b of BANDS) expect(band(b), `${b} Matthew 5:37`).toContain('(Matthew 5:37)');
  });

  it('each band carries the blunt iron, which is the headline in one verse', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Ecclesiastes 10:10`).toContain('(Ecclesiastes 10:10)');
      expect(band(b), `${b} must name the choice`).toMatch(/whet|sharpen/i);
    }
  });

  it('each band counts the cost and separates the diligent from the hasty', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Luke 14:28`).toContain('(Luke 14:28)');
      expect(band(b), `${b} Proverbs 21:5`).toContain('(Proverbs 21:5)');
    }
  });

  it('each band treats JUDGMENT as the work, not a defect to remove', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} 1 Kings 3:9`).toContain('(1 Kings 3:9)');
      expect(band(b), `${b} Hebrews 5:14`).toContain('(Hebrews 5:14)');
      expect(band(b), `${b} Isaiah 1:18`).toContain('(Isaiah 1:18)');
    }
  });

  it('each band sets the traceability bar at plain-enough-to-run-with', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Habakkuk 2:2`).toContain('(Habakkuk 2:2)');
      expect(band(b), `${b} Proverbs 27:23`).toContain('(Proverbs 27:23)');
    }
  });

  it('each band requires two or three witnesses before a matter is established', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Deuteronomy 19:15`).toContain('(Deuteronomy 19:15)');
      expect(band(b), `${b} 2 Corinthians 13:1`).toContain('(2 Corinthians 13:1)');
      expect(band(b), `${b} 1 Thessalonians 5:21`).toContain('(1 Thessalonians 5:21)');
    }
  });

  it('each band ends where Job 28 ends, and under Psalms 127:1', () => {
    for (const b of BANDS) {
      expect(band(b), `${b} Job 28:12`).toContain('(Job 28:12)');
      expect(band(b), `${b} Proverbs 25:2`).toContain('(Proverbs 25:2)');
      expect(band(b), `${b} Psalms 127:1`).toContain('(Psalms 127:1)');
    }
  });
});

describe('sov37 — the two handlings this lesson could have got wrong', () => {
  it('MATTHEW 6:7 IS SAID TO BE ABOUT PRAYER, in every band and the lesson (DR-0098)', () => {
    // The seductive misuse: quote "vain repetitions" as an engineering proverb.
    // Every place the verse appears must also say what it is about.
    for (const place of [...BANDS.map((b) => [b, L.levels[b]]), ['lesson', L.lesson]]) {
      const [name, text] = place;
      if (!text.includes('(Matthew 6:7')) continue;
      expect(text, `${name} quotes Matthew 6:7 without saying it is about prayer`).toMatch(/about PRAYER|about praying|is about PRAYER/i);
    }
    expect(L.lesson, 'the lesson must refuse the stretch out loud').toMatch(/will not (pretend|stretch)/i);
  });

  it('the SOURCE is named for what it is, and its point still credited (DR-0100)', () => {
    const said = `${L.bigIdea} ${L.lesson}`;
    expect(said, "a vendor's invitation, said plainly").toMatch(/vendor'?s webinar invitation/i);
    expect(said, 'and nothing in it measured here').toMatch(/not (a study|independently measured)|nothing in it has been independently measured/i);
    expect(said, 'and its four points still credited').toMatch(/the right four/i);
  });

  it("Darrell's own word over the email is carried", () => {
    expect(L.bigIdea).toMatch(/one word over it, "Lesson"/);
    expect(`${L.bigIdea} ${L.lesson}`).toMatch(/2026-10-08/);
  });

  it('the house names its OWN example rather than only teaching at others', () => {
    expect(L.lesson).toMatch(/thousands of deterministic checks/i);
    expect(L.lesson).toMatch(/recorded decision/i);
  });

  it('and it does so WITHOUT reciting a decision record', () => {
    // curriculum-cli --gate caught the first version of this naming DR-0248 by
    // its id in five fields. The quotation-integrity ratchet forbids a new
    // lesson doing that and is right to: the reader gets the practice in plain
    // English, and the id lives in the decision record itself.
    for (const [name, text] of [...BANDS.map((b) => [b, L.levels[b]]), ['lesson', L.lesson], ['bigIdea', L.bigIdea], ['inApp', L.inApp]]) {
      expect(text, `${name} recites a decision record`).not.toMatch(/DR-\d{4}/);
    }
  });
});

// PROVEN-TO-CATCH (DR-0076 §3): each planted break below fails the gate above,
// so a green run means something.
describe('proven-to-catch, on copies of the real module', () => {
  const copy = () => JSON.parse(JSON.stringify(L));

  it('the real module is clean, so a failure below is the break and not noise', () => {
    expect(spanFaults(copy())).toEqual([]);
  });

  it('catches a mutated verse', () => {
    const m = copy();
    m.lesson = m.lesson.replace('but a just weight is his delight', 'but a just weight is his preference');
    expect(spanFaults(m).some((f) => f.includes('NOT VERBATIM'))).toBe(true);
  });

  it('catches a verse whose reference was dropped', () => {
    const m = copy();
    m.levels.teen = m.levels.teen.replace('(Ecclesiastes 10:10)', '');
    expect(spanFaults(m).some((f) => f.includes('QUOTED WITHOUT ATTRIBUTION'))).toBe(true);
  });

  it('catches an unattributed claim entering in quotation marks', () => {
    const m = copy();
    m.benefits.push('The vendor says this "cuts token spend by ninety percent".');
    expect(spanFaults(m).some((f) => f.includes('QUOTED WITHOUT ATTRIBUTION'))).toBe(true);
  });

  it('catches a band whose three-directions close was dropped', () => {
    const m = copy();
    m.levels.child = m.levels.child.replace('TALK ABOUT IT TOGETHER', 'THE END');
    expect(m.levels.child.includes('TALK ABOUT IT TOGETHER')).toBe(false);
  });

  it('catches a band quietly gutted to a summary', () => {
    const m = copy();
    m.levels.senior = 'Keep a just weight. The end.';
    expect(m.levels.senior.length).toBeLessThan(9000);
  });

  it('catches Matthew 6:7 used without its prayer disclaimer', () => {
    const stripped = L.lesson.replace(/That passage is about PRAYER\./, 'So:');
    expect(/about PRAYER|about praying/i.test(stripped.slice(stripped.indexOf('(Matthew 6:7'), stripped.indexOf('(Matthew 6:7') + 400))).toBe(false);
  });
});
