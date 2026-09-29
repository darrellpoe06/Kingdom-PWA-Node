// @vitest-environment node
// =============================================================================
// Tower parity: the Python measures ARE the house gates (DR-0671)
// =============================================================================
// The parity loop (infra/nas-lesson-parity/parity_core.py) runs on the NAS in
// Python, but its reading level, band fullness and verse gate are the house's
// JavaScript gates, ported. A port that drifts would score the towers against a
// different standard than the one every lesson is gated by. This runs the
// Python on real corpus lessons and requires the SAME numbers as the JS gates.
// Also pins the documented lesson_versions shape (DR-0669) the loop reads.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureLesson } from '../../../scripts/reading-level.mjs';
import { measureFullness, FULL_FLOOR, FULL_BANDS } from '../../../scripts/full-levels.mjs';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CORE = join(REPO, 'infra/nas-lesson-parity/parity_core.py');

function runPython(modules) {
  const dir = mkdtempSync(join(tmpdir(), 'parity-'));
  try {
    const f = join(dir, 'bodies.json');
    writeFileSync(f, JSON.stringify(modules));
    return JSON.parse(execFileSync('python3', [CORE, '--measure', f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Every 6th lesson: 30+ real lessons across the whole corpus, old and new.
const SAMPLE = LIVING_LESSONS_MODULES.filter((_, i) => i % 6 === 0);
const PY = runPython(SAMPLE);

describe('the Python port measures exactly what the JS gates measure', () => {
  it('reading level per band (Flesch-Kincaid, our prose only), rounded the same way', () => {
    expect(SAMPLE.length).toBeGreaterThan(30);
    for (const [i, m] of SAMPLE.entries()) {
      const js = measureLesson(m).bands;
      const py = PY[i].reading;
      for (const band of Object.keys(js)) expect(py[band], `${m.id} ${band}`).toBe(js[band].authored);
      expect(Object.keys(py).sort()).toEqual(Object.keys(js).sort());
    }
  });

  it('band words and share of the adult lesson, and the same floor', () => {
    for (const [i, m] of SAMPLE.entries()) {
      const js = measureFullness(m);
      const py = PY[i].fullness;
      expect(py.adultWords, m.id).toBe(js.adultWords);
      for (const b of FULL_BANDS) {
        expect(py.bands[b].words, `${m.id} ${b}`).toBe(js.bands[b].words);
        expect(py.bands[b].share, `${m.id} ${b}`).toBe(js.bands[b].share);
      }
    }
    const src = readFileSync(CORE, 'utf8');
    expect(src).toContain(`FULL_FLOOR = ${JSON.stringify(FULL_FLOOR).replace(/:/g, ': ').replace(/,/g, ', ')}`);
  });

  it('the verse gate agrees with the house verse gate on every sampled lesson', () => {
    for (const [i, m] of SAMPLE.entries()) {
      const js = scanQuotedVerses([m], quotedTexts);
      const jsPass = js.spans > 0 && js.faults.filter((f) => f.kind !== 'lowered').length === 0;
      expect(PY[i].verseGate, m.id).toBe(jsPass);
    }
  });

  it('PROVEN-TO-CATCH: a misquote planted in a lesson fails the Python gate as it fails the JS gate', () => {
    const m = JSON.parse(JSON.stringify(LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll180-'))));
    m.lesson = m.lesson.replace('power to get wealth, that he may', 'power to get riches, that he may');
    const [py] = runPython([m]);
    expect(py.verseGate).toBe(false);
    expect(scanQuotedVerses([m], quotedTexts).faults.length).toBeGreaterThan(0);
  });
});

describe('calibration on the whole house corpus (the numbers DR-0671 cites)', () => {
  it('every four-band lesson against itself is 1.0 with no gap; a different lesson never counts toward promotion', () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-cal-'));
    try {
      const f = join(dir, 'all.json');
      writeFileSync(f, JSON.stringify(LIVING_LESSONS_MODULES));
      const cal = JSON.parse(execFileSync('python3', [CORE, '--calibrate', f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
      expect(cal.lessons).toBeGreaterThanOrEqual(127);
      expect(cal.selfMin).toBe(1);
      expect(cal.selfGaps).toBe(0);
      expect(cal.selfFloorFailures).toBe(0);
      expect(cal.crossCounted).toBe(0);
      expect(cal.crossMax).toBeLessThan(0.95);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60000);
});

describe('the lesson_versions shape the loop reads (the builder\u2019s own migration, DR-0669)', () => {
  // The builder's migration, found by what it creates (its ordinal is its own to choose).
  const MIGS = join(REPO, 'infra/supabase/migrations-auto');
  const builderFile = readdirSync(MIGS).find((f) => /CREATE TABLE IF NOT EXISTS (public\.)?lesson_versions \(\s*\n\s*id\s[^;]*build_id/.test(readFileSync(join(MIGS, f), 'utf8')));
  const BUILDER = builderFile ? readFileSync(join(MIGS, builderFile), 'utf8') : '';
  it('the builder\u2019s migration is on this checkout and sorts after the parity repair (0242)', () => {
    expect(builderFile, 'the lesson builder (#1837) must land first').toBeTruthy();
    expect(builderFile > '0242-').toBe(true);
  });
  const MIG = readFileSync(join(REPO, 'infra/supabase/migrations-auto/0242-a-tower-writer-is-measured-against-the-reference-until-it-matches.sql'), 'utf8');
  const LOOP = readFileSync(join(REPO, 'infra/nas-lesson-parity/parity_loop.py'), 'utf8');
  it('every column the loop selects is a column the builder creates', () => {
    const at = BUILDER.search(/CREATE TABLE IF NOT EXISTS (public\.)?lesson_versions \(/);
    const table = BUILDER.slice(at, BUILDER.indexOf(');', at));
    const select = /"lesson_versions", "select=([^"]+)"\s*\n?\s*"([^"&]+)&/.exec(LOOP);
    expect(select, 'the loop names its columns').toBeTruthy();
    const cols = (select[1] + select[2]).split(',').map((c) => c.trim()).filter(Boolean);
    expect(cols.length).toBeGreaterThanOrEqual(12);
    for (const col of cols) expect(table, col).toMatch(new RegExp(`\\n\\s+${col}\\s`));
  });
  it('the parity migration never creates or alters the builder\u2019s table', () => {
    expect(MIG).not.toMatch(/(CREATE|ALTER) TABLE[^;]*lesson_versions/);
    // the one statement that touches it is the guarded removal of the empty early copy
    expect(MIG).toMatch(/NOT EXISTS \(SELECT 1 FROM public\.lesson_versions\) THEN\s*\n\s*DROP TABLE public\.lesson_versions;/);
  });
  it('the parity tables are the Governor’s: no write policy, read only by is_lesson_governor()', () => {
    for (const t of ['lesson_parity', 'lesson_crossref', 'lesson_parity_fixes', 'lesson_parity_promotion']) {
      expect(MIG).toMatch(new RegExp(`CREATE POLICY ${t}_governor_read ON public\\.${t} FOR SELECT USING \\(public\\.is_lesson_governor\\(\\)\\)`));
    }
    expect(MIG).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/);
  });
  it('no model identifier is committed in the parity service', () => {
    for (const f of ['parity_core.py', 'parity_loop.py', 'install.sh', 'fixes/verse_retrieval.py']) {
      const s = readFileSync(join(REPO, 'infra/nas-lesson-parity', f), 'utf8');
      expect(s, f).not.toMatch(/claude-(opus|sonnet|haiku)|gpt-4|gpt-5|gemini-\d|llama\d|qwen\d/i);
    }
  });
});
