// @vitest-environment node
// =============================================================================
// The two Project Management courses — every quotation the Word, verbatim, and
// every claim checked where it does its job
// =============================================================================
// Darrell, 2026-09-17, asked for courses on project management AND software
// project management, "as many lessons in those as we can think of," under one
// governing frame: "I do believe PMP and ITIL are in the word of God."
//
// THE FIVE THINGS THESE COURSES COULD MOST EASILY HAVE GOT WRONG:
//
//   1. PMP-WITH-VERSES. The easy build is a project-management course with a
//      verse stapled to each module. The claim is the reverse — the discipline
//      is in the Word first and the standard is a VOCABULARY for it — so the
//      ordering is checked: the Word's own case, THEN the industry's name.
//   2. A QUOTATION THAT IS NOT THE WORD. Every double-quoted span in either
//      course must be verbatim Scripture resolvable from the module's own
//      references. Quoting our own words dresses them as His. The first audit
//      of these files found 18 such spans; they were dequoted, and this gate
//      is what stops the next one.
//   3. THE OVER-CLAIM. It would be easy, and flattering, to imply that
//      studying the Word raises a PMP or ITIL exam score. Nothing measured
//      that. Both courses state the refusal out loud and a check holds it.
//   4. THE CASE STUDIES GOING SOFT. The software course teaches from this
//      house's own recorded outages — a nine-hour stale site behind a green
//      pipeline, safeguards that never asked the product whether it was up.
//      Replacing those with invented examples would be the weaker teaching AND
//      an untraceable claim, so the DR citations are pinned.
//   5. THE COVENANT NAME. Our authored voice says Yahweh, never the generic
//      name; every quotation's own "God" and "the LORD" stays exactly as the
//      corpus carries it (DR-0210's bright line, DR-0076).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PROJECT_MANAGEMENT_META, PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_SESSION_FLOW,
  buildProjectManagementSchedule, projectManagementProgressSummary,
  exportProjectManagementCurriculumMarkdown, PROJECT_MANAGEMENT_TUTOR_META,
} from '../lib/project-management-course.js';
import {
  SOFTWARE_PM_META, SOFTWARE_PM_MODULES, SOFTWARE_PM_SESSION_FLOW,
  buildSoftwarePmSchedule, softwarePmProgressSummary,
  exportSoftwarePmCurriculumMarkdown, SOFTWARE_PM_TUTOR_META,
} from '../lib/software-project-management-course.js';

// ---------------------------------------------------------------------------
// The corpus, and the STRICT comparison
// ---------------------------------------------------------------------------
// STRICT is whitespace-only (DR-0456). Apostrophes are NEVER normalised: the
// corpus carries the typographic apostrophe (Moses’, watchman’s) and so must
// we, or a straight quote silently passes for the Word's own text.
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
// bookKey must NOT rewrite a leading numeral (DR-0457): 1Corinthians.json.
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) {
    const p = join(KJV, `${k}.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book);
  if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1];
  if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = a; i <= b; i += 1) nums.push(i);
  }
  const out = nums.map((n) => chap[n - 1]);
  return out.some((v) => v == null) ? null : out.join(' ');
};
const chapterOf = (book, ch) => {
  const bk = load(book);
  const chap = bk && bk.chapters[Number(ch) - 1];
  return chap ? chap.join(' ') : null;
};
const REF = /([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+?)(?=[)\s;,.]|$)/g;
const resolveRef = (r) => {
  const m = String(r).match(/^([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)$/);
  return m ? versesOf(m[1].trim(), m[2], m[3].trim()) : null;
};

// Every authored string of a module, in one blob.
const textOf = (m) => [
  m.title, m.bigIdea, m.inApp, m.anchor && m.anchor.theme,
  ...(m.benefits || []),
  m.levels && m.levels.teen, m.levels && m.levels.senior,
  ...((m.quiz && m.quiz.questions ? m.quiz.questions : []).flatMap((q) => [q.q, ...(q.options || []), q.explain])),
].filter(Boolean).join('\n');

// The verses a module is allowed to quote from: its anchor refs, plus every
// reference named anywhere in its own prose, plus those whole chapters — so a
// module that cites Exodus 18:22 may quote another phrase of Exodus 18, and
// nothing outside what it actually points the reader at.
const poolOf = (m) => {
  const text = textOf(m);
  const pool = [];
  for (const r of String((m.anchor && m.anchor.ref) || '').split(';').map((x) => x.trim()).filter(Boolean)) {
    const v = resolveRef(r);
    if (v != null) pool.push(v);
  }
  REF.lastIndex = 0;
  let x;
  while ((x = REF.exec(text))) {
    const v = versesOf(x[1].trim(), x[2], x[3].trim());
    if (v != null) pool.push(v);
    const c = chapterOf(x[1].trim(), x[2]);
    if (c != null) pool.push(c);
  }
  return norm(pool.join('  ~~  '));
};

const COURSES = [
  { name: 'Project Management', meta: PROJECT_MANAGEMENT_META, modules: PROJECT_MANAGEMENT_MODULES, flow: PROJECT_MANAGEMENT_SESSION_FLOW, build: buildProjectManagementSchedule, progress: projectManagementProgressSummary, exportMd: exportProjectManagementCurriculumMarkdown, tutor: PROJECT_MANAGEMENT_TUTOR_META },
  { name: 'Software Project Management', meta: SOFTWARE_PM_META, modules: SOFTWARE_PM_MODULES, flow: SOFTWARE_PM_SESSION_FLOW, build: buildSoftwarePmSchedule, progress: softwarePmProgressSummary, exportMd: exportSoftwarePmCurriculumMarkdown, tutor: SOFTWARE_PM_TUTOR_META },
];

describe('both courses are shaped like a course the app can actually render', () => {
  for (const c of COURSES) {
    it(`${c.name}: meta, flow, modules and the exporters are all real`, () => {
      expect(c.meta.key).toBeTruthy();
      expect(c.meta.title).toBeTruthy();
      expect(c.meta.category).toBe('Project Management');
      expect(c.meta.unit.selfPaced).toBe(true);
      expect(c.flow.length).toBeGreaterThan(2);
      expect(c.modules.length).toBeGreaterThanOrEqual(10);
      // weeks must track the module count, or the header lies about length
      expect(c.meta.weeks).toBe(c.modules.length);
      const rows = c.build();
      expect(rows).toHaveLength(c.modules.length);
      expect(rows.map((r) => r.week)).toEqual(c.modules.map((_, i) => i + 1));
      expect(typeof c.exportMd()).toBe('string');
      expect(c.exportMd().length).toBeGreaterThan(500);
      expect(c.progress({})).toBeTruthy();
    });

    it(`${c.name}: every lesson carries every field a lesson page renders`, () => {
      for (const m of c.modules) {
        expect(m.id, 'a lesson without an id cannot key a reader’s progress').toBeTruthy();
        expect(m.title).toBeTruthy();
        expect(m.bigIdea.length).toBeGreaterThan(200);
        expect(m.inApp.length).toBeGreaterThan(100);
        expect(m.anchor.ref, `${m.id} has no anchor reference`).toBeTruthy();
        expect(m.anchor.theme.length).toBeGreaterThan(80);
        expect(m.benefits.length).toBeGreaterThanOrEqual(3);
        expect(m.levels.teen.length).toBeGreaterThan(300);
        expect(m.levels.senior.length).toBeGreaterThan(500);
        expect(m.quiz.questions.length).toBeGreaterThanOrEqual(3);
        for (const q of m.quiz.questions) {
          expect(q.options.length).toBeGreaterThanOrEqual(3);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
          expect(q.explain, `${m.id} has an unexplained answer`).toBeTruthy();
        }
      }
    });

    it(`${c.name}: lesson ids are unique and stable progress keys`, () => {
      const ids = c.modules.map((m) => m.id);
      expect(new Set(ids).size, 'a duplicate id would merge two lessons’ progress').toBe(ids.length);
    });
  }

  it('the two courses do not collide on a key or an id', () => {
    expect(PROJECT_MANAGEMENT_META.key).not.toBe(SOFTWARE_PM_META.key);
    const a = new Set(PROJECT_MANAGEMENT_MODULES.map((m) => m.id));
    for (const m of SOFTWARE_PM_MODULES) expect(a.has(m.id)).toBe(false);
  });
});

describe('every quotation is the Word, verbatim, and pointed at', () => {
  for (const c of COURSES) {
    it(`${c.name}: every anchor reference resolves in the corpus`, () => {
      for (const m of c.modules) {
        for (const r of String(m.anchor.ref).split(';').map((x) => x.trim()).filter(Boolean)) {
          expect(resolveRef(r), `${m.id}: anchor reference ${r} does not resolve`).not.toBeNull();
        }
      }
    });

    it(`${c.name}: every double-quoted span is verbatim Scripture the module points at`, () => {
      // The failure this exists to stop: our own words in quotation marks,
      // which reads to a learner as the Word saying it. The first audit of
      // these two files found eighteen.
      for (const m of c.modules) {
        const hay = poolOf(m);
        for (const x of textOf(m).matchAll(/"([^"]*)"/g)) {
          const q = norm(x[1]).replace(/[.,;:]+$/, '');
          expect(
            hay.includes(q),
            `${m.id}: "${x[1]}" is in quotation marks but is not verbatim in any verse this lesson references`,
          ).toBe(true);
        }
      }
    });

    it(`${c.name}: no ellipsis inside a quotation (DR-0459)`, () => {
      for (const m of c.modules) {
        for (const x of textOf(m).matchAll(/"([^"]*)"/g)) {
          expect(/\.\.\.|…/.test(x[1]), `${m.id}: an elision inside a quotation — use a shorter verbatim span`).toBe(false);
        }
      }
    });

    it(`${c.name}: the meta tagline and footer quote only what they reference`, () => {
      const text = [c.meta.tagline, c.meta.footer, c.meta.audience].filter(Boolean).join('\n');
      const pool = [];
      REF.lastIndex = 0;
      let x;
      while ((x = REF.exec(text))) {
        const v = versesOf(x[1].trim(), x[2], x[3].trim());
        if (v != null) pool.push(v);
      }
      const hay = norm(pool.join('  ~~  '));
      for (const s of text.matchAll(/"([^"]*)"/g)) {
        const q = norm(s[1]).replace(/[.,;:]+$/, '');
        expect(hay.includes(q), `${c.name} meta: "${s[1]}" is quoted but not referenced`).toBe(true);
      }
    });
  }
});

describe('the typographic and covenant-name bindings hold', () => {
  for (const c of COURSES) {
    it(`${c.name}: OUR prose says Yahweh and never the generic name; His own words are untouched`, () => {
      // The bright line (DR-0210 / DR-0076): this governs our AUTHORED voice
      // only. Quotations are stripped first, so the KJV's own "God" and
      // "the LORD" inside a quoted span are never touched by this check.
      const ours = c.modules.map(textOf).join('\n').replace(/"[^"]*"/g, ' ');
      const generic = [...ours.matchAll(/.{0,60}\bGod\b.{0,60}/g)].map((m) => m[0]);
      expect(generic, `${c.name}: the generic name appears in our own voice`).toEqual([]);
      expect((ours.match(/Yahweh/g) || []).length, `${c.name}: our prose never names Him`).toBeGreaterThanOrEqual(3);
    });

    it(`${c.name}: no adversary name is capitalised anywhere`, () => {
      const all = [c.meta.tagline, c.meta.footer, c.meta.audience, c.tutor.posture, ...c.modules.map(textOf)].join('\n');
      const caps = all.match(/\b(Lucifer|Satan|The Devil|The Dragon|The Adversary|The Accuser|The Deceiver|Baal)\b/g) || [];
      expect(caps).toEqual([]);
    });
  }
});

describe('the Word comes FIRST and the standard is named as a vocabulary, not the authority', () => {
  for (const c of COURSES) {
    it(`${c.name}: the session flow reads the anchor before it names the practice`, () => {
      // The ordering IS the pedagogy — his own reported mechanism, and the one
      // L173 names: naming is faster than learning. A flow that taught the
      // method first and cited a verse afterward would be PMP-with-verses,
      // which is the thing this course is not.
      const names = c.flow.map((s) => s.name.toLowerCase());
      const anchorAt = names.findIndex((n) => /anchor/.test(n));
      const wordAt = names.findIndex((n) => /the word’s own case|the word's own case/.test(n));
      const industryAt = names.findIndex((n) => /industry calls it/.test(n));
      expect(anchorAt, `${c.name}: the flow never reads the anchor`).toBeGreaterThanOrEqual(0);
      expect(wordAt, `${c.name}: the flow never works the Word’s own case`).toBeGreaterThanOrEqual(0);
      expect(industryAt, `${c.name}: the flow never names the industry term`).toBeGreaterThanOrEqual(0);
      expect(anchorAt).toBeLessThan(wordAt);
      expect(wordAt, `${c.name}: the industry name comes before the Word’s case`).toBeLessThan(industryAt);
    });

    it(`${c.name}: the tutor is told to teach the Word first and the term second`, () => {
      const p = c.tutor.posture;
      // The property is the ORDER, not the literal word "second": one course
      // says "the industry's name for it second" and the other "then the
      // industry's name for the shape". Both must put the Word first and the
      // term after, so the check reads the positions rather than a word.
      const first = p.search(/Word’s own case FIRST|Word's own case FIRST/);
      const term = p.search(/industry’s name|industry's name|name for it second/i);
      expect(first, 'the tutor is not told to teach the Word’s own case first').toBeGreaterThanOrEqual(0);
      expect(term, 'the tutor is never told to name the industry term at all').toBeGreaterThanOrEqual(0);
      expect(term, 'the tutor names the industry term BEFORE the Word’s case').toBeGreaterThan(first);
      expect(p, 'the tutor must be forbidden from quoting from memory').toMatch(/never quote (a translation )?from memory/i);
      expect(p, 'the tutor must be told to say Yahweh in its own voice').toMatch(/Yahweh rather than the generic name/i);
    });
  }

  it('Project Management: every lesson names an industry term, so the vocabulary claim is actually carried', () => {
    // If a lesson taught the Word and never named what the industry calls it,
    // the course's whole thesis would go untaught in that lesson.
    for (const m of PROJECT_MANAGEMENT_MODULES) {
      const text = textOf(m);
      expect(
        /the industry calls|PMBOK|PMP|RACI|span of control|skills matrix|scope (control|creep)|schedule baseline|expert judgment|risk register|quality (assurance|control)|sunk cost|stage gate|closeout|lessons learned/i.test(text),
        `${m.id}: teaches the Word but never names what the industry calls it`,
      ).toBe(true);
    }
  });

  it('Software Project Management: every lesson names an industry term too', () => {
    for (const m of SOFTWARE_PM_MODULES) {
      const text = textOf(m);
      expect(
        /the industry calls|ITIL|acceptance criteria|definition of done|MoSCoW|cone of uncertainty|three-point|incident|problem|change (management|advisory)|smoke test|synthetic monitoring|mutation testing|fault injection|technical[- ]debt|post-mortem|runbook|bus factor/i.test(text),
        `${m.id}: teaches the Word but never names what the industry calls it`,
      ).toBe(true);
    }
  });
});

describe('the refusal is explicit — no claim about exam scores', () => {
  // The check most likely to be "improved" away by someone who wants the frame
  // to land harder. It is the honest part (DR-0076 §8, and the same refusal
  // L173 carries about his certification testimony).
  // WEAKNESS CAUGHT BY THE BREAK HARNESS: these read the WHOLE source file, so
  // deleting the refusal from the header comment still passed — the tutor
  // posture at the bottom of the same file says "none of that was measured"
  // and satisfied the pattern. The header refusal and the tutor refusal are two
  // separate obligations (the reader meets the tutor; a maintainer meets the
  // header), and each must be held in its own place. So the header block is now
  // sliced out before it is checked.
  const headerOf = (file) => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', file), 'utf8');
    const end = src.indexOf('export const');
    expect(end, `${file}: could not find where the header ends`).toBeGreaterThan(0);
    // The header is a wrapped comment block, so a two-word phrase can straddle
    // a line break as "exam\n// score" — which is exactly how the first version
    // of this check failed against a header that plainly carries the refusal.
    // Strip the comment markers and collapse whitespace before matching.
    return src.slice(0, end).replace(/^\s*\/\/ ?/gm, ' ').replace(/\s+/g, ' ');
  };

  it('Project Management refuses the exam-score claim in its own header', () => {
    const head = headerOf('project-management-course.js');
    expect(head).toMatch(/does not claim/i);
    expect(head).toMatch(/exam score/i);
    expect(head).toMatch(/has not been measured/i);
  });

  it('Software Project Management refuses the score, cycle-time AND defect-rate claims in its own header', () => {
    const head = headerOf('software-project-management-course.js');
    expect(head).toMatch(/does not claim/i);
    expect(head).toMatch(/exam score/i);
    expect(head).toMatch(/cycle/i);
    expect(head).toMatch(/defect rate/i);
    expect(head).toMatch(/None of that was measured/i);
  });

  for (const c of COURSES) {
    it(`${c.name}: the tutor is forbidden from making the claim too`, () => {
      // A refusal in a source comment that the tutor can talk past is not a
      // refusal — the learner meets the tutor, not the comment.
      expect(c.tutor.posture).toMatch(/NEVER claim/);
      expect(c.tutor.posture).toMatch(/exam score/i);
    });
  }
});

describe('the software course teaches from this house’s own recorded failures', () => {
  // Invented case studies in a repository that has real ones would be both the
  // weaker teaching and an untraceable claim. These citations are the trace.
  const byId = Object.fromEntries(SOFTWARE_PM_MODULES.map((m) => [m.id, textOf(m)]));

  it('the nine-hour stale site behind a green pipeline is cited with its DR and its mechanism', () => {
    const t = byId['spm6-green-is-not-deployed'];
    expect(t).toMatch(/DR-0107/);
    expect(t, 'the duration is the part that makes it a real cost').toMatch(/nine hours/i);
    // WEAKNESS CAUGHT BY THE BREAK HARNESS: /token/i survived because the word
    // appears twice, and the alternation's second branch ("never fired") let a
    // vague description stand in for the mechanism. The mechanism IS the lesson
    // — a token-authored merge raises no push event — so it is required whole.
    expect(t, 'the mechanism must be named, or it reads as a vague outage')
      .toMatch(/token[- ]authored merge|automation\u2019s own token/i);
    expect(t, 'the consequence of the mechanism must be stated')
      .toMatch(/does not (trigger|raise) the push/i);
  });

  it('the safeguards that never asked the product whether it was up are cited with their DR', () => {
    const t = byId['spm6-green-is-not-deployed'];
    expect(t).toMatch(/DR-0125/);
    expect(t).toMatch(/HTTP request/i);
    // WEAKNESS CAUGHT BY THE BREAK HARNESS: /unknown/i passed with the rule
    // deleted, because "unknown" appears nine other times in this file (the
    // honest unknown of estimation, unknown detection capability, unknown
    // freshness). A single common word is not a claim.
    expect(t, 'unknown must never be allowed to read as fine')
      .toMatch(/unknown[^.]{0,40}never[^.]{0,40}(reported as fine|fine)|not zero, it is unknown/i);
  });

  it('the proven-to-catch rule is cited, and the bad-break lesson with it', () => {
    const t = byId['spm7-a-gate-that-always-passes'];
    expect(t).toMatch(/DR-0076/);
    expect(t, 'the gate must be described as shipping only once it CATCHES') .toMatch(/catch/i);
    expect(t, 'a break that lands nowhere is a question about the break')
      .toMatch(/badly aimed|lands nowhere/i);
  });

  it('the why-plus-date rule for anything left rough is cited with its DR', () => {
    const t = byId['spm8-debt-named-and-dated'];
    expect(t).toMatch(/DR-0075/);
    expect(t).toMatch(/re-review date/i);
    expect(t, 'silence must be refused as consent to stall').toMatch(/silence is never consent/i);
  });

  it('the retrospective lesson carries the blocked-input mechanism, not just a posture', () => {
    const t = byId['spm9-the-retrospective-that-is-not-a-blame-meeting'];
    expect(t).toMatch(/blocked input/i);
    expect(t, 'the reason blame is expensive must be the information loss, not the feeling')
      .toMatch(/closest to (the failure|it)/i);
    expect(t).toMatch(/punishes being wrong/i);
  });
});

describe('the two courses answer the specific things he asked for', () => {
  // WEAKNESS CAUGHT BY THE BREAK HARNESS. The first version of this block
  // pooled BOTH courses' lesson text AND both metas into one haystack, so:
  //   - removing "skills matrix" from every lesson still passed, because
  //     "skill sets" survives in the META AUDIENCE — a marketing line was
  //     answering for a lesson;
  //   - removing ITIL from the software course still passed, because the other
  //     course names it.
  // A check that cannot say WHERE something is taught does not establish that
  // it is taught. So each ask is now assigned to the course that owes it, and
  // matched against LESSON TEXT ONLY — the meta is excluded on purpose.
  const pmLessons = PROJECT_MANAGEMENT_MODULES.map(textOf).join('\n');
  const spmLessons = SOFTWARE_PM_MODULES.map(textOf).join('\n');

  // [what he asked for, where it must be taught, the pattern]
  const ASKED = [
    ['counting those costs before we get involved', 'pm', /counteth the cost|count the cost|sufficient to finish/i],
    ['who should work', 'pm', /who (should|does) (the )?work|span of control|rulers of (thousands|tens)/i],
    ['what tasks to associate with which people', 'pm', /RACI|responsibility assignment|escalation|every small matter/i],
    ['what skill sets we need', 'pm', /skills matrix|skill sets|competenc/i],
    ['timeline and milestones', 'pm', /milestone|schedule baseline|fifty and two days/i],
    ['meetings to secure quality subject matter experts', 'pm', /counsellors|expert judgment|subject matter/i],
    ['the details so we can see clearly', 'pm', /see clearly|SEE clearly/],
    ['root cause of what we need to do and what we do not', 'pm', /root cause|search out a matter/i],
    ['properties, the church, flipped houses', 'pm', /rehab|renovation|property turn|church build/i],
    ['PMP', 'pm', /PMP|PMBOK/],
    // ITIL is the software course's own frame, so it is owed THERE, and naming
    // it in the companion course cannot answer for it.
    ['ITIL', 'spm', /ITIL/],
  ];

  for (const [what, where, re] of ASKED) {
    const label = where === 'pm' ? 'Project Management' : 'Software Project Management';
    it(`he asked for ${what} — and ${label} teaches it in a lesson`, () => {
      const hay = where === 'pm' ? pmLessons : spmLessons;
      expect(re.test(hay), `no LESSON of ${label} teaches: ${what}`).toBe(true);
    });
  }

  it('the asks are taught in the lessons, not only advertised in the meta', () => {
    // The specific failure above, held directly: every pattern must match the
    // lesson text with the meta removed from consideration entirely.
    const metaOnly = [
      PROJECT_MANAGEMENT_META.audience, PROJECT_MANAGEMENT_META.tagline, PROJECT_MANAGEMENT_META.footer,
      SOFTWARE_PM_META.audience, SOFTWARE_PM_META.tagline, SOFTWARE_PM_META.footer,
    ].join('\n');
    for (const [what, where, re] of ASKED) {
      const hay = where === 'pm' ? pmLessons : spmLessons;
      if (!re.test(hay) && re.test(metaOnly)) {
        throw new Error(`${what} is advertised in the meta but taught in no lesson`);
      }
    }
    expect(true).toBe(true);
  });
});
