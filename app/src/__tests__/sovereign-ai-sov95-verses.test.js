// @vitest-environment node
// =============================================================================
// sov95 — every quotation is the corpus verbatim, the house is traced to its
// real code, the household stays private, and the lesson is whole in every
// band (DR-1564)
// =============================================================================
// Sovereign A.I. week 95, "He that taketh warning", was built from one word
// Darrell typed above a forwarded account security alert: Lesson. Gmail thread
// 1a1f08def44cc672. Built 2026-11-18 by scripts/sov95-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name; then the checks
// particular to this lesson.
//
// ONE TEACHING, ONE LESSON (DR-0610). Week 46 owns whether to give a helper
// wide sight; week 93 owns the porter at the gate. This week owns the AFTER:
// the alert has sounded - check, do not ignore, do not panic, take back.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';
import {
  lessonGateFaults,
  stringsOf,
  corpusText,
  quotedPairs,
  verbatimFaults,
  voiceFaults,
  adversaryFaults,
  bareQuoteFaults,
} from './helpers/living-lesson-gate.js';

const ID = 'sov95-he-that-taketh-warning';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const clone = () => JSON.parse(JSON.stringify(MODULE));

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (['child', 'youth', 'teen', 'senior'].includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Ezekiel 33:5', 'he that taketh warning shall deliver his soul'],
  ['Nehemiah 13:8', 'I cast forth all the household stuff of Tobiah out of the chamber'],
];
const REVIEW = 're-review: 2026-12-02';

// MEASURED 2026-11-18 on the spliced module (scripts/sov95-fill.mjs output):
// 21 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 21;
const QUOTED_FLOOR = 70;

describe('sov95 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 95, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.indexOf(MODULE)).toBe(SOVEREIGN_AI_MODULES.length - 1);
    for (const b of FOUR_BANDS) {
      expect(typeof MODULE.levels[b]).toBe('string');
      expect(MODULE.levels[b].startsWith(MODULE.title), b).toBe(true);
    }
  });
});

describe('the shared Living Lesson gate, run on this week check by check', () => {
  it('every check is empty', () => {
    const all = lessonGateFaults(MODULE, { spine: SPINE });
    for (const [name, faults] of Object.entries(all)) expect(faults, name).toEqual([]);
  });

  it(`at least ${QUOTED_FLOOR} referenced quotations are swept, so the sweep is not vacuous`, () => {
    const n = stringsOf(MODULE).reduce((a, t) => a + quotedPairs(t).filter((p) => p.ref).length, 0);
    expect(n).toBeGreaterThanOrEqual(QUOTED_FLOOR);
  });

  it('PROVEN-TO-CATCH: one altered word inside a quotation is caught', () => {
    const L = clone();
    L.quiz.questions[0].explain += ` "But he that taketh warning shall save his soul." (Ezekiel 33:5)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the alert’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The alert said "check activity and secure your account."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God sounds the trumpet. Satan forges the alert.';
    expect(voiceFaults(L).length).toBeGreaterThan(0);
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const refs = MODULE.anchor.ref
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const quoted = new Set(
    READER_PLACES.flatMap((p) =>
      quotedPairs(place(MODULE, p))
        .map((q) => q.ref)
        .filter(Boolean)
    )
  );

  it(`the anchor carries exactly ${ANCHOR_COUNT} references, each resolving in the corpus`, () => {
    expect(refs.length).toBe(ANCHOR_COUNT);
    for (const r of refs) expect(corpusText(r), r).not.toBeNull();
    expect(refs.slice(0, 2)).toEqual(['Ezekiel 33:5', 'Nehemiah 13:8']);
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });

  it('neither frame verse is the anchor of an earlier week of this course', () => {
    const earlier = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID).map((m) =>
      String((m.anchor && m.anchor.ref) || '')
        .split(';')[0]
        .trim()
    );
    expect(earlier).not.toContain('Ezekiel 33:5');
    expect(earlier).not.toContain('Nehemiah 13:8');
  });
});

describe('the Word opens and frames the hour; no app stands above it', () => {
  it('in every teaching place the trumpet is quoted before an app, a drive or a link is named', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const frame = t.indexOf('(Ezekiel 33:4)');
      const body = t.slice(t.indexOf('THE WORD FIRST') >= 0 ? t.indexOf('THE WORD FIRST') : t.indexOf('THE FRAME'));
      const tech = body.search(/\b(allow|password|link|recovery)\b/i);
      expect(frame, `${p} quotes Ezekiel 33:4`).toBeGreaterThan(0);
      expect(tech, `${p} teaches the check`).toBeGreaterThan(0);
      expect(body.indexOf('(Ezekiel 33:4)'), `${p}: the trumpet stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the chamber, the calm, the careful step, the recovery address and the take-back', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(Ezekiel 33:4)',
        '(Ezekiel 33:5)',
        '(Nehemiah 13:7)',
        '(Nehemiah 13:8)',
        '(Psalms 112:7)',
        '(Proverbs 14:15)',
        '(Psalms 121:4)',
        '(John 17:12)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
      expect(t, `${p} says not to use the alert's link`).toMatch(
        /not (tap|use) the (button|link)|never (use|through) the (alert's )?link|never through (the message|its link)|not to follow the message's link|never the link/i
      );
      expect(t, `${p} names taking access back`).toMatch(/take (it|the key|access)? ?back|revoke|withdraw/i);
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/(recovery|backup) (address|email)/i);
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('one teaching, one lesson: the earlier weeks are named as theirs', () => {
    expect(MODULE.lesson).toMatch(/Week forty-six of this course asks whether to give a helper wide sight/);
    expect(MODULE.lesson).toMatch(/Week ninety-three is the porter at the gate/);
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id === 'sov46-the-helper-that-must-see-everything')).toBe(true);
    expect(SOVEREIGN_AI_MODULES.some((m) => m.id === 'sov93-the-porter-and-the-course')).toBe(true);
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('PRIVACY: a personal account email is taught generically', () => {
  it('no address, link, thread id, provider or product name, and no date from the email reaches any string', () => {
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/@|https?:\/\/|www\.|\.com\b|1a1f08def44cc672|Google|Gmail|Claude|Anthropic|ChatGPT|OpenAI|Gemini|Copilot/i);
    }
  });

  it('the generator, which records provenance, names only the thread id', () => {
    const g = src('scripts/sov95-fill.mjs');
    expect(g).toMatch(/1a1f08def44cc672/);
    expect(g).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the alert as reported, and the unverified question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says the account was not seen`).toMatch(/did not see the account|account itself was not seen|did not check (it|the alert)/i);
      expect(t, `${p} says the household's grant is not verified`).toMatch(/not verified/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the code', () => {
  const sql = src('infra/supabase/migrations-auto/0114-governed-support-door.sql');
  const lib = src('app/src/lib/support-access.js');

  it('one record, a required reason, an hour by default, a day at most, an expiry and a revoke, every read logged, PHI never offered', () => {
    expect(sql).toMatch(/expires_at\s+timestamptz NOT NULL/);
    expect(sql).toMatch(/revoked_at\s+timestamptz/);
    expect(sql).toMatch(/greatest\(1, least\(coalesce\(minutes_in, 60\), 1440\)\)/);
    expect(sql).toMatch(/LOGS EVERY READ to audit_log/);
    expect(sql).toMatch(/clinical\/PHI is never break-glass-able/);
    expect(lib).toMatch(/reason: 'reason-required'/);
    expect(lib).toMatch(/resourceType, resourceId, reason, minutes = 60\)/);
    expect(lib).toMatch(/export async function revokeSupportAccess\(grantId\)/);
    expect(MODULE.lesson).toMatch(/an hour unless the owner chooses otherwise, and never more than a day/);
    expect(MODULE.lesson).toMatch(/We did not query the live database/);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov95-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-18 by scripts/sov95-fill.mjs: adult 1,874 prose words;
    // child 0.566 / youth 0.629 / teen 0.632 / senior 0.657; grades 1.75 <
    // 4.36 < 5.21 < 7.94. Pinned with tolerance.
    expect(words(MODULE.lesson)).toBeGreaterThanOrEqual(1800);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });
});
