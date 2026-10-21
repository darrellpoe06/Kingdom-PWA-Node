// =============================================================================
// The witness is not a constant (DR-0975)
// =============================================================================
// MEASURED on the instrument itself, 2026-10-12:
//
//   last green site-health run ... 37952054170, 2026-10-09T15:28:55Z
//   every run since ............. 22 consecutive FAILURES, ~65 hours
//   incident issue #2057 ........ 29 comments, all one cause
//
// A witness whose output has not changed in two and a half days cannot report
// a new fault. The case that matters most here is the one the old code could
// not express at all: A NEW FAULT ARRIVING DURING THE KNOWN OUTAGE. It used to
// append a clause to the same string inside an already-red run — same
// conclusion, same title, comment #30 on an unreadable issue.
//
// The reason strings below are the REAL ones, copied from run 38222589060's
// own `REASONS` env and from issue #2057's body, not paraphrases.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  classifyReasons,
  shouldWriteLedger,
  carveIsLive,
  oneLine,
  KNOWN_OUTAGES,
  KNOWN_MARKER,
} from '../../../scripts/site-health-verdict.mjs';

// Verbatim from run 38222589060, 2026-10-12T08:17:08Z, the REASONS env line.
const REAL_PAGES_REASON =
  "NO PAGES FUNCTION IS RUNNING — GET poetech.us/automation-status answered with 'text/html; charset=utf-8', the SPA shell, instead of its Function's JSON. When this is true EVERY NAS-backed road is dark at once: /sb sign-in, /n8n, /cams, /taxes, /openers, /llm, /reviews, /voice, /nas-photos, /ways, /scribe. Measured 2026-10-09 while a deploy logged 'Uploading Functions bundle' and '_routes.json' and the Functions still never ran, on the custom domain, on poetech-app.pages.dev AND on the per-deployment host — so it is Cloudflare-side and no code change reaches it";

// Verbatim from issue #2057's opening body, 2026-10-09T15:46:45Z.
const REAL_SIGNIN_REASON =
  "SIGN-IN IS DOWN — a POST to the app's own auth road (poetech.us/sb/auth/v1/token) returned an EMPTY BODY twice. The browser calls .json() on that and fails with 'Unexpected end of JSON input', so nobody can sign in by email link or by phone PIN. Note that GET /sb/auth/v1/health can still answer 200 while this is broken: a GET is not a sign-in";

// Inside the carve-out window for #2057 (since 2026-10-09, until 2026-10-26).
const DURING = '2026-10-12T08:17:08Z';

describe('the known outage is recognised, and still fails', () => {
  it('reads the REAL reason as KNOWN, naming the issue and the day', () => {
    const r = classifyReasons(REAL_PAGES_REASON, { now: DURING });
    expect(r.verdict).toBe('KNOWN');
    expect(r.anyNew).toBe(false);
    expect(r.knownIds).toEqual(['cf-pages-functions']);
    expect(r.days, '2026-10-09 to 2026-10-12 is day 2').toBe(2);
    expect(r.runName).toMatch(/#2057/);
    expect(r.runName).toMatch(/day 2/);
  });

  it('NEVER reports a broken site as healthy — KNOWN is still broken', () => {
    const r = classifyReasons(REAL_PAGES_REASON, { now: DURING });
    expect(r.broken, 'a known outage that read as not-broken would be the DR-0973 decision-4 violation').toBe(true);
    expect(r.verdict).not.toBe('UP');
  });

  it('says what it is and that nothing here reaches it', () => {
    const r = classifyReasons(REAL_PAGES_REASON, { now: DURING });
    expect(r.headline).toMatch(/nothing new/i);
    expect(r.headline).toMatch(/Cloudflare-side/);
    expect(r.headline).toMatch(/#2057/);
  });
});

describe('PROVEN-TO-CATCH: a new fault during the known outage', () => {
  it('a NEW reason alongside the known one reads NEW, not known', () => {
    const both = `${REAL_PAGES_REASON}; ${REAL_SIGNIN_REASON}`;
    const r = classifyReasons(both, { now: DURING });
    expect(r.verdict, 'THE CASE THE OLD CODE COULD NOT EXPRESS: a family locked out while #2057 ran would have looked identical to #2057 alone').toBe('NEW');
    expect(r.anyNew).toBe(true);
    expect(r.newPieces).toHaveLength(1);
    expect(r.newPieces[0]).toMatch(/SIGN-IN IS DOWN/);
    expect(r.knownIds, 'the known one is still acknowledged, not forgotten').toEqual(['cf-pages-functions']);
  });

  it('the run name puts NEW FAULT first, because that is all the Actions list shows', () => {
    const r = classifyReasons(`${REAL_PAGES_REASON}; ${REAL_SIGNIN_REASON}`, { now: DURING });
    expect(r.runName.startsWith('NEW FAULT'), `run name was: ${r.runName}`).toBe(true);
    expect(r.runName).toMatch(/known outage/);
  });

  it('SIGN-IN is deliberately NOT carved — a family locked out is always news', () => {
    const r = classifyReasons(REAL_SIGNIN_REASON, { now: DURING });
    expect(r.verdict).toBe('NEW');
    expect(
      KNOWN_OUTAGES.some((k) => /SIGN-IN/i.test(k.signature)),
      'carving sign-in would hide the worst fault this app has',
    ).toBe(false);
  });

  it('an unrecognised reason reads NEW — unknown is not pass', () => {
    const r = classifyReasons('root returned HTTP 503', { now: DURING });
    expect(r.verdict).toBe('NEW');
    expect(r.newPieces).toEqual(['root returned HTTP 503']);
    expect(r.days, 'no known hit, so no day count to report').toBe(null);
  });
});

describe('the carve-out expires, and expiry makes it LOUDER', () => {
  it('past `until`, the same known reason reads NEW again', () => {
    const r = classifyReasons(REAL_PAGES_REASON, { now: '2026-10-27T00:00:01Z' });
    expect(r.verdict, 'an expired carve-out must restore the loud behaviour, never extend itself').toBe('NEW');
    expect(r.knownIds).toEqual([]);
  });

  it('`until` is inclusive to the end of its own day', () => {
    expect(carveIsLive(KNOWN_OUTAGES[0], '2026-10-26T23:59:00Z')).toBe(true);
    expect(carveIsLive(KNOWN_OUTAGES[0], '2026-10-27T00:00:01Z')).toBe(false);
  });

  it('an entry with a missing or unparseable `until` is treated as expired', () => {
    expect(carveIsLive({ until: undefined }, DURING)).toBe(false);
    expect(carveIsLive({ until: 'soon' }, DURING)).toBe(false);
  });

  it('every shipped entry carries the four things that make it auditable', () => {
    for (const k of KNOWN_OUTAGES) {
      expect(k.signature, 'a carve-out with no signature matches everything').toBeTruthy();
      expect(k.issue, 'a carve-out with no issue has no evidence behind it').toBeTruthy();
      expect(Number.isFinite(Date.parse(k.since)), `since unparseable: ${k.since}`).toBe(true);
      expect(Number.isFinite(Date.parse(`${k.until}T00:00:00Z`)), `until unparseable: ${k.until}`).toBe(true);
      expect(Date.parse(`${k.until}T00:00:00Z`) > Date.parse(k.since), 'until must be after since').toBe(true);
    }
  });
});

describe('a bad parse makes it louder, never quieter', () => {
  it("THE REAL REASON CONTAINS AN EMBEDDED '; ' — the first version of this code split on it and broke", () => {
    // 'text/html; charset=utf-8' sits inside the one reason the carve-out
    // exists for. A '; ' split cut it in half, left the second half matching
    // nothing, and read NEW on every run. This case is why the fixture is the
    // verbatim string: a tidy paraphrase would have passed and shipped broken.
    expect(REAL_PAGES_REASON).toContain('; charset=utf-8');
    const r = classifyReasons(REAL_PAGES_REASON, { now: DURING });
    expect(r.verdict, 'the embedded semicolon must not defeat the carve-out').toBe('KNOWN');
    expect(r.newPieces).toEqual([]);
  });

  it('an unrecognised reason carrying its own semicolon still reads NEW', () => {
    const messy = 'app shell 200 but no #root mount (body starts: <!doctype html>; charset=utf-8)';
    const r = classifyReasons(messy, { now: DURING });
    expect(r.verdict).toBe('NEW');
    expect(r.newPieces.length).toBeGreaterThanOrEqual(1);
  });

  it('PROVEN-TO-CATCH: the head WITHOUT its tail is not carved — a re-worded add_fail goes loud', () => {
    // Excision needs both ends. If somebody re-words the end of that add_fail,
    // the carve-out stops working and the witness starts shouting again, which
    // is the only safe direction for a change nobody remembered to make here.
    const reworded = REAL_PAGES_REASON.replace('and no code change reaches it', 'and nothing here fixes it');
    const r = classifyReasons(reworded, { now: DURING });
    expect(r.verdict).toBe('NEW');
    expect(r.knownIds).toEqual([]);
  });

  it('a passing mention of the phrase is not carved either, for the same reason', () => {
    const r = classifyReasons('something else entirely mentioning NO PAGES FUNCTION IS RUNNING', { now: DURING });
    expect(r.verdict).toBe('NEW');
  });

  it('an empty reasons string is UP, and nothing claims a day count', () => {
    for (const empty of ['', '   ', null, undefined]) {
      const r = classifyReasons(empty, { now: DURING });
      expect(r.verdict).toBe('UP');
      expect(r.broken).toBe(false);
      expect(r.days).toBe(null);
    }
  });
});

describe('a reason carrying page bytes cannot corrupt $GITHUB_OUTPUT', () => {
  // Step 4 of the probe interpolates served page BODY BYTES into its reason
  // ("body starts: $(head -c 120 ...)"), so a reason really can contain
  // newlines — and a newline in a key=value file is both corruption and the
  // shape an injected `verdict=UP` line would take.
  const NASTY = 'app shell 200 but no #root mount (body starts: <!doctype html>\nverdict=UP\n<html lang="en">)';

  it('PROVEN-TO-CATCH: newlines are flattened, so no second key can be injected', () => {
    const flat = oneLine(NASTY);
    expect(flat).not.toMatch(/[\r\n]/);
    expect(flat.split('\n')).toHaveLength(1);
    expect(flat).toContain('verdict=UP'); // present as TEXT, not as a line
  });

  it('and such a reason still reads NEW, newlines and all', () => {
    const r = classifyReasons(NASTY, { now: DURING });
    expect(r.verdict).toBe('NEW');
    expect(oneLine(r.headline)).not.toMatch(/[\r\n]/);
  });

  it('oneLine is total — null, undefined and numbers all come back as one line', () => {
    expect(oneLine(null)).toBe('');
    expect(oneLine(undefined)).toBe('');
    expect(oneLine(2)).toBe('2');
    expect(oneLine('  padded\r\n ')).toBe('padded');
  });
});

describe('the ledger stays readable', () => {
  it('a NEW fault is always written, however recently anything else was', () => {
    const d = shouldWriteLedger({ anyNew: true, lastKnownAt: DURING, now: DURING });
    expect(d.write).toBe(true);
  });

  it('PROVEN-TO-CATCH: a known-only run within the day is NOT written', () => {
    // This is the 29-comments-in-65-hours behaviour. Each run wrote one.
    const d = shouldWriteLedger({ anyNew: false, lastKnownAt: '2026-10-12T02:18:52Z', now: DURING });
    expect(d.write, 'six hours after the last identical note, writing again is how a ledger stops being read').toBe(false);
    expect(d.why).toMatch(/nothing is new/);
  });

  it('a known-only run writes once the day has passed, so the record still shows duration', () => {
    const d = shouldWriteLedger({ anyNew: false, lastKnownAt: '2026-10-11T08:00:00Z', now: DURING });
    expect(d.write).toBe(true);
    expect(d.why).toMatch(/24h|2[4-9]h|\d\dh/);
  });

  it('nothing on record yet always writes', () => {
    expect(shouldWriteLedger({ anyNew: false, lastKnownAt: null, now: DURING }).write).toBe(true);
  });

  it('an undateable last note writes — unknown is not pass', () => {
    expect(shouldWriteLedger({ anyNew: false, lastKnownAt: 'who knows', now: DURING }).write).toBe(true);
  });

});

// Verbatim from run 39551336752, 2026-10-21T05:45:56Z, the REASONS env line:
// the one reason the probe has reported since #2285 taught it to look for the
// Worker (DR-1124). Not a paraphrase, for the reason note 3 of the script
// gives: the text carries 'text/html; charset=utf-8', and a split on '; '
// would cut it in half.
const REAL_WORKER_REASON =
  "THE WORKER ROADS ARE DARK TOO — GET poetech.us/edge/whoami answered 200 with 'text/html; charset=utf-8' instead of the JSON 401 edge.js returns to any unauthenticated caller. This is a DIFFERENT layer from the Pages Functions above: /edge/* is the poetech-roads Worker on a zone route, and it is the only road the Edge Guard and the Admin visitor count ride. If the Function probe above is failing too, the outage is wider than Pages and the wrangler zone route or the Worker's own deploy is the place to look";

// The four runs that each wrote "A FAULT NOT ALREADY ON RECORD" for this same
// unchanged reading, 2026-10-20/21 (issue #2057, comments 6303066583,
// 6303818861, 6305786987, 6309027619).
const FOUR_RUNS = ['2026-10-20T22:20:24Z', '2026-10-20T23:08:55Z', '2026-10-21T01:32:07Z', '2026-10-21T05:45:56Z'];

describe('the Worker roads are on the record too (DR-1158)', () => {
  it('reads the REAL Worker-roads reason as KNOWN, naming #2057, the day and the hand that fixes it', () => {
    const r = classifyReasons(REAL_WORKER_REASON, { now: FOUR_RUNS[3] });
    expect(r.verdict).toBe('KNOWN');
    expect(r.broken, 'still a failing run — the Worker really is dark').toBe(true);
    expect(r.knownIds).toEqual(['cf-roads-worker']);
    expect(r.days, '2026-10-20T22:20 to 2026-10-21T05:45 is day 0').toBe(0);
    expect(r.headline).toMatch(/#2057/);
    expect(r.headline).toMatch(/Workers Scripts:Edit/);
    expect(r.headline).toMatch(/zero zones/);
  });

  it('PROVEN-TO-CATCH: without the entry the same reading is NEW on every run — four notes in eight hours', () => {
    const without = KNOWN_OUTAGES.filter((k) => k.id !== 'cf-roads-worker');
    let notes = 0;
    for (const now of FOUR_RUNS) {
      const r = classifyReasons(REAL_WORKER_REASON, { now, known: without });
      expect(r.verdict).toBe('NEW');
      if (shouldWriteLedger({ anyNew: r.anyNew, lastKnownAt: null, now }).write) notes += 1;
    }
    expect(notes, 'the shape DR-0975 was written to end').toBe(4);
  });

  it('with the entry, the second, third and fourth runs of the night are not written', () => {
    let last = null;
    let notes = 0;
    for (const now of FOUR_RUNS) {
      const r = classifyReasons(REAL_WORKER_REASON, { now });
      const d = shouldWriteLedger({ anyNew: r.anyNew, lastKnownAt: last, now });
      if (d.write) { notes += 1; last = now; }
    }
    expect(notes, 'one note for the night, then silence until a day has passed').toBe(1);
  });

  it('both known outages at once read KNOWN, both acknowledged, the day counted from the older', () => {
    const r = classifyReasons(`${REAL_PAGES_REASON}; ${REAL_WORKER_REASON}`, { now: FOUR_RUNS[3] });
    expect(r.verdict).toBe('KNOWN');
    expect(r.knownIds.sort()).toEqual(['cf-pages-functions', 'cf-roads-worker']);
    expect(r.days, 'counted from 2026-10-09, the older of the two').toBe(11);
  });

  it('SIGN-IN arriving beside the known Worker outage is still NEW — the carve is one signature', () => {
    const r = classifyReasons(`${REAL_WORKER_REASON}; ${REAL_SIGNIN_REASON}`, { now: FOUR_RUNS[3] });
    expect(r.verdict).toBe('NEW');
    expect(r.newPieces).toHaveLength(1);
    expect(r.newPieces[0]).toMatch(/SIGN-IN IS DOWN/);
    expect(r.knownIds).toEqual(['cf-roads-worker']);
  });

  it('the entry dies on 2026-10-28, the date the token is re-reviewed, and the reading is loud again', () => {
    const entry = KNOWN_OUTAGES.find((k) => k.id === 'cf-roads-worker');
    expect(entry.until).toBe('2026-10-28');
    expect(classifyReasons(REAL_WORKER_REASON, { now: '2026-10-28T23:59:00Z' }).verdict).toBe('KNOWN');
    const r = classifyReasons(REAL_WORKER_REASON, { now: '2026-10-29T00:00:01Z' });
    expect(r.verdict).toBe('NEW');
    expect(r.knownIds).toEqual([]);
  });

  it('the head and tail are the words the workflow really writes, so a re-wording goes loud', () => {
    const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const wf = readFileSync(join(REPO_ROOT, '.github/workflows/site-health.yml'), 'utf8');
    const entry = KNOWN_OUTAGES.find((k) => k.id === 'cf-roads-worker');
    expect(wf).toContain(`add_fail "${entry.signature}`);
    expect(wf).toContain(`${entry.tail}"`);
  });
});

// SOURCE PINS. The classifier is pure and testable; the behaviour that keeps
// the witness honest lives in the workflow, so these read the real file.
// Without them the whole change could be reverted a line at a time and this
// suite would stay green (P44: a green check that never checked is not a check).
describe('source pins — the workflow still does what this record claims', () => {
  const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const wf = readFileSync(join(REPO_ROOT, '.github/workflows/site-health.yml'), 'utf8');

  it('A FAILING RUN STILL FAILS — the throttle never turns red into green', () => {
    expect(wf, 'the `exit 1` that makes a broken site a failing run must survive').toContain(
      'exit 1 # a failing probe is a failing run',
    );
  });

  it('the run log is written on EVERY run, with no throttle', () => {
    // DR-0514's contract: silence on the run log means the witness did not
    // run. Throttling that log would destroy it. Only the incident ledger and
    // the bell are throttled, and only for an unchanged observation.
    const logStep = wf.slice(wf.indexOf('Record the run (rolling log, pass or fail)'));
    const upToNext = logStep.slice(0, logStep.indexOf('Record the incident'));
    expect(upToNext).not.toMatch(/WRITE_LEDGER/);
    expect(upToNext).toMatch(/if: always\(\)/);
  });

  it('the marker the workflow writes is the marker it looks for, and both are this constant', () => {
    const inner = KNOWN_MARKER.replace('<!-- ', '').replace(' -->', '');
    expect(wf, 'the note must carry the marker').toContain(KNOWN_MARKER);
    expect(wf, 'the lookup must grep for the same text').toContain(`contains("${inner}")`);
  });

  it('the verdict is computed BEFORE the ledger and the bell can read it', () => {
    expect(wf.indexOf('id: verdict')).toBeGreaterThan(-1);
    expect(wf.indexOf('id: verdict')).toBeLessThan(wf.indexOf('Record the incident'));
    expect(wf.indexOf('id: verdict')).toBeLessThan(wf.indexOf('Record the run (rolling log'));
  });

  it('a crashed probe is given a reason that matches no carve-out, so it reads NEW', () => {
    expect(wf).toContain('REASONS="the probe crashed before reporting"');
    expect(classifyReasons('the probe crashed before reporting', { now: DURING }).verdict).toBe('NEW');
  });

  it('the verdict job exists only to put the label where a run name cannot go', () => {
    expect(wf).toMatch(/name: \$\{\{ needs\.probe\.outputs\.verdict_label/);
    expect(wf).toContain('verdict_label: ${{ steps.verdict.outputs.run_name }}');
  });
});
