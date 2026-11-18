// @vitest-environment node
// =============================================================================
// sov93 — every quotation is the corpus verbatim, the house is traced to its
// real records, and the lesson is whole in every band (DR-1560)
// =============================================================================
// Sovereign A.I. week 93, "The porter and the course", was built from one word
// Darrell typed above a forwarded Level Up Coding issue (Nikki Siapno), API
// Gateway vs Load Balancer: Do You Need Both?: Lesson. Gmail thread
// 1a1ca71b314895bf. Built 2026-11-18 by scripts/sov93-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name, so the same verbatim,
// voice, adversary, band, ladder, quiz and parable rules that bind a Living
// Lesson bind this week too; then the checks particular to this lesson.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. One teaching, one lesson (DR-0610):
// week 92 owns the agent that games its own test; this week owns the three
// questions in front of a request and the two components that answer them.
// The tiers are held apart (reported product features, established
// distinctions, measured house, not measured), and every house claim is pinned
// to the file that makes it true: the same-origin road, the path table, the
// lock on each door, the cap of two, the three strangers who answered, and the
// one machine behind every path.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { isVoiceAnswer } from '../lib/voice-service.js';
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

const ID = 'sov93-the-porter-and-the-course';
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
  ['2 Chronicles 23:19', 'he set the porters at the gates of the house of the LORD'],
  ['1 Chronicles 27:1', 'which came in and went out month by month'],
];
const REVIEW = 're-review: 2026-12-02';

// MEASURED 2026-11-18 on the spliced module (scripts/sov93-fill.mjs output):
// 24 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 24;
const QUOTED_FLOOR = 100;

describe('sov93 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 93, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b]).toBe('string');
    expect(MODULE.levels.child.startsWith(MODULE.title)).toBe(true);
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

  it('PROVEN-TO-CATCH: one altered word inside a quotation, in a quiz explanation, is caught', () => {
    const L = clone();
    L.quiz.questions[0].explain += ` "And he set the porters at the doors of the house of the LORD." (2 Chronicles 23:19)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the author’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The newsletter said "use the simplest architecture that meets your requirements."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God keeps the gate. Satan answers for the voice.';
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
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });
});

describe('the Word opens and frames the hour; no newsletter stands above it', () => {
  it('in every teaching place both frame verses are quoted before a gateway or a load balancer is named', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const frame = Math.max(t.indexOf('(2 Chronicles 23:19)'), t.indexOf('(1 Chronicles 27:1)'));
      const tech = Math.min(...[/gateway/i, /load balancer/i].map((re) => t.search(re)).filter((i) => i >= 0));
      expect(frame, `${p} quotes both frame verses`).toBeGreaterThan(0);
      expect(Number.isFinite(tech), `${p} teaches the gateway and the balancer`).toBe(true);
      expect(frame, `${p}: the frame stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the three questions, both components, the check the gate does not replace, and the simplest arrangement', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toMatch(/gateway/i);
      expect(t, p).toMatch(/load balancer/i);
      expect(t, `${p} teaches the health check (the child band says a copy gets sick)`).toMatch(/health|gets sick/i);
      for (const ref of ['(Exodus 18:18)', '(Exodus 18:22)', '(John 10:3)', '(Proverbs 14:4)', '(2 Samuel 18:29)', '(John 10:9)', '(1 Corinthians 12:5)']) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
    }
  });

  it('Jesus is confessed as the Door and the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('the source is credited and the sponsor, links and table are left out', () => {
    expect(MODULE.lesson).toMatch(/Level Up Coding/);
    expect(MODULE.lesson).toMatch(/Nikki Siapno/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/https?:\/\/|sponsor(ed)? by|\(c\) 2026/i);
    }
  });

  it('one teaching, one lesson: week 92’s cheating benchmark is not re-taught here', () => {
    for (const s of stringsOf(MODULE)) expect(s).not.toMatch(/CheatBench|honeypot|reward hacking|goatskin/i);
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the newsletter as the source, and the unmeasured question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} names the newsletter as the carrier`).toMatch(/newsletter/i);
      expect(t, `${p} says the product claims were not checked`).toMatch(/did not check|were not checked|not checked against/i);
      expect(t, `${p} says the house question was not measured`).toMatch(/not (yet )?(been )?measured|nobody has counted|nothing in the house counts/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the records', () => {
  it('one shared function carries every road, because the tunnel throttled cross-origin browsers; it refuses another site’s writes and signs every answer', () => {
    const f = src('app/functions/_lib/funnel-proxy.js');
    expect(f).toMatch(/ONE implementation for every\n\/\/ same-origin route that fronts the NAS/);
    expect(f).toMatch(/the Funnel throttles cross-origin browser\n\/\/ fetches from poetech\.us with HTTP 503/);
    expect(f).toMatch(/code: 'cross-origin-write'/);
    expect(f).toMatch(/export const ROAD_HEADER = 'x-poetech-road'/);
    expect(src('app/functions/voice/[[path]].js')).toMatch(/makeFunnelProxy\(\{ upstreamPrefix: '\/voice', label: 'voice' \}\)/);
    expect(MODULE.lesson).toMatch(/One shared implementation does this for every road to the server/);
  });

  it('the path table: each path mounted to ONE local port, the database’s door is Kong, and the root is a different service', () => {
    const rs = src('infra/nas-transport/RECORDED-STATE.md');
    const table = rs.split('## The public Funnel')[1].split('\n## ')[0];
    const rows = table.split('\n').filter((l) => /^\| `\//.test(l));
    expect(rows.length).toBeGreaterThanOrEqual(10);
    for (const r of rows) {
      const backend = r.split('|')[2];
      expect((backend.match(/http:\/\/127\.0\.0\.1:\d+/g) || []).length, r.slice(0, 40)).toBe(1);
    }
    for (const p of ['/nas-photos', '/taxes', '/voice', '/sb'])
      expect(
        rows.some((r) => r.startsWith(`| \`${p}\``)),
        p
      ).toBe(true);
    expect(rows.find((r) => r.startsWith('| `/sb`'))).toMatch(/supabase kong gateway/);
    expect(rows.find((r) => r.startsWith('| `/` '))).toMatch(/\(n8n\)/);
    expect(MODULE.lesson).toMatch(/Each path in the table goes to one port on one machine/);
    expect(MODULE.lesson).toMatch(/Kong, the very product the newsletter names/);
  });

  it('a lock on each door: the tax archive fails closed, the photo server and the voice forwarder check the bearer, and the voice caps itself at two', () => {
    expect(src('infra/nas-tax-ingest/tax_auth.py')).toMatch(/FAIL CLOSED: no configured token means nobody gets in, never everybody\./);
    const photo = src('infra/nas-property-photos/photo_server.py');
    expect(photo).toMatch(/hmac\.compare_digest\(header_value\[7:\]\.strip\(\), expected\)/);
    expect(photo).toMatch(/self\._send\(401, \{"error": "unauthorized"/);
    const fwd = src('infra/voice-studio/voice_forwarder.py');
    expect(fwd).toMatch(/hmac\.compare_digest\(header_value\[7:\]\.strip\(\), expected\)/);
    expect(fwd).toMatch(/return self\._json\(401, \{"error": "unauthorized"\}\)/);
    expect(fwd).toMatch(/MAX_INFLIGHT = int\(os\.environ\.get\("VOICE_MAX_INFLIGHT", "2"\)\)/);
    expect(MODULE.lesson).toMatch(/two by default/);
  });

  it('three times a path with no mount was answered by a stranger, and the probe now asks whose answer it is', () => {
    expect(src('infra/nas-transport/RECORDED-STATE.md')).toMatch(
      /for ~7 weeks the upload POST reached a backend that was never started and the archive GET fell through the root/
    );
    const vs = src('app/src/lib/voice-service.js');
    expect(vs).toMatch(/answered HTTP 200 with n8n's editor/);
    expect(vs).toMatch(/Any 200 read as "up" for three days/);
    expect(src('docs/decisions/DR-1555-the-voice-answer-must-be-the-voices.md')).toMatch(
      /That is the camera forwarder's health, not the voice's\. The Funnel had no `\/voice` mount yet/
    );
    // The probe's own behaviour, run, not only read: the camera's measured body is not the voice.
    expect(isVoiceAnswer({ ok: true, go2rtc: '1.9.14', streams: 65 })).toBe(false);
    expect(isVoiceAnswer({ ok: true, engine: 'nas-clone' })).toBe(true);
    expect(MODULE.lesson).toMatch(/The fix was to ask whose answer it was/);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov93-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-18 by scripts/sov93-fill.mjs: adult 2,362 prose words;
    // child 0.522 / youth 0.621 / teen 0.616 / senior 0.630; grades 1.83 <
    // 4.35 < 5.38 < 8.49. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2300);
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
