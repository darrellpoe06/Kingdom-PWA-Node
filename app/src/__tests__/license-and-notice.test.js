// license-and-notice — the repository states what it claims, and credits what it doesn't.
//
// WHY THIS GATE EXISTS. Measured 2026-09-19: 4,486 files published on a PUBLIC
// repository with NO LICENSE, NO NOTICE, and no `license` field in any
// package.json. The project was scrupulous about everyone else's rights — the
// WEB trademark honored, eBible.org credited, the ESV and SBLGNT correctly
// refused — and silent about its own. Default copyright reserved the rights;
// nothing told a reader so, and nothing recorded when the claim began.
//
// The gate is NOT "a LICENSE file exists" — that is theater, and it would pass
// forever on an empty promise. It is: every third-party component actually
// vendored in the tree is ALSO credited in NOTICE. The attribution list is
// DERIVED from the real `.vendor/` directory, so adding a dependency without
// crediting it FAILS THE BUILD. Attribution that drifts is attribution that
// lies, and a CC-BY or BSD obligation is not satisfied by a file that was
// accurate once.
//
// Proven-to-catch (DR-0076 §3): each rule below was broken and watched go red.
// See the per-test comments for the exact break.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

const LICENSE = read('LICENSE');
const NOTICE = read('NOTICE');

// LICENSE and NOTICE are hard-wrapped prose files, so a sentence assertion that
// straddles a line break fails on the newline rather than on the meaning. This
// caught its first real miss on the very first run ("claims no / right in the
// Word itself"). Prose is matched against the whitespace-collapsed form; the
// structural checks below still read the raw file.
const flat = (s) => s.replace(/\s+/g, ' ');
const LICENSE_PROSE = flat(LICENSE);
const NOTICE_PROSE = flat(NOTICE);
const VENDOR_DIR = join(repoRoot, 'infra/nas-agent/.vendor');

/** Every vendored distribution actually present in the tree, by package name. */
function vendoredPackages() {
  if (!existsSync(VENDOR_DIR)) return [];
  return readdirSync(VENDOR_DIR)
    .filter((d) => d.endsWith('.dist-info'))
    .map((d) => d.replace(/\.dist-info$/, '').replace(/-\d[\w.]*$/, ''))
    .map((n) => n.replace(/_/g, '-'))
    .sort();
}

describe('LICENSE — the repository says what it claims', () => {
  it('reserves rights and names the holder', () => {
    expect(LICENSE_PROSE).toMatch(/All rights reserved/i);
    expect(LICENSE_PROSE).toMatch(/Darrell Poe/);
  });

  it('states plainly that publication is not a grant', () => {
    // The whole point. A public repo with no licence reads as open to most
    // developers; this is the sentence that removes the ambiguity.
    expect(LICENSE_PROSE).toMatch(/is NOT a grant of any license/i);
    expect(LICENSE_PROSE).toMatch(/no open-source license applies/i);
  });

  it('carves out third-party and public-domain material instead of claiming everything', () => {
    // Overclaiming is its own failure (DR-0076). A licence that swept in the
    // public-domain Scripture and the BSD/MIT dependencies would be false on
    // its face. Break: delete section 4 -> this fails.
    expect(LICENSE_PROSE).toMatch(/NOT covered by this License/i);
    expect(LICENSE_PROSE).toMatch(/NOTICE file/);
  });

  it('claims no right in the Word itself', () => {
    // The bright line. We claim our commentary, arrangement and software.
    // We do not claim Scripture. Break: remove the sentence -> this fails.
    expect(LICENSE_PROSE).toMatch(/claims no right in the Word itself/i);
  });
});

describe('NOTICE — what we credit, derived from the real tree', () => {
  it('credits EVERY vendored package that actually exists', () => {
    // THE LOAD-BEARING CHECK. Derived, never pinned: vendor a new package and
    // forget the attribution and this fails. Proven-to-catch by removing the
    // `six` line from NOTICE -> red, naming `six`.
    const missing = vendoredPackages().filter((p) => !NOTICE_PROSE.includes(p));
    expect(missing, `vendored but not credited in NOTICE: ${missing.join(', ')}`).toEqual([]);
  });

  it('actually found packages to check, so the check cannot pass vacuously', () => {
    // A derived check over an empty list passes for the wrong reason. This is
    // the guard on the guard.
    expect(vendoredPackages().length).toBeGreaterThanOrEqual(5);
  });

  it('honors the World English Bible trademark while recording the text as public domain', () => {
    // The distinction that keeps the reproduction lawful: the TEXT is PD and
    // modifiable, the NAME is a trademark, so a modified text must be renamed.
    // We reproduce verbatim, so we may keep the name.
    expect(NOTICE_PROSE).toMatch(/World English Bible/);
    expect(NOTICE_PROSE).toMatch(/trademark/i);
    expect(NOTICE_PROSE).toMatch(/VERBATIM/);
    expect(NOTICE_PROSE).toMatch(/eBible\.org/);
  });

  it('records the KJV as public domain in the US and flags the UK Crown right', () => {
    // Under-claiming a real constraint is as much a failure as over-claiming a
    // right (DR-0100). UK distribution is genuinely a separate question.
    expect(NOTICE_PROSE).toMatch(/King James/i);
    expect(NOTICE_PROSE).toMatch(/Crown/);
  });

  it('records "The Way" as deliberately NOT claimed', () => {
    // Recorded so no later pass "helpfully" adds it to the mark list. It is
    // the Word's own language (Acts), not a coined mark.
    expect(NOTICE_PROSE).toMatch(/"The Way" is NOT claimed/);
    expect(NOTICE_PROSE).toMatch(/Acts 9:2/);
  });

  it('records the SKOS clearance risk rather than asserting a clean mark', () => {
    // An honest register names the collision instead of hiding it.
    expect(NOTICE_PROSE).toMatch(/W3C/);
    expect(NOTICE_PROSE).toMatch(/clearance/i);
  });

  it('does not claim a mark the register excludes', () => {
    // "The Way" must never appear in the claimed-marks list itself.
    const markLine = NOTICE.split('\n').find((l) => l.includes('PoeTech ·')) || '';
    expect(markLine).not.toMatch(/The Way/);
  });
});

describe('the package manifest declares the same posture', () => {
  it('app/package.json declares a licence instead of leaving it unstated', () => {
    // DR-0300 asserted an `UNLICENSED` field existed. Measured 2026-09-19: it
    // did not — a DR/reality drift. This gate closes it and keeps it closed.
    const pkg = JSON.parse(read('app/package.json'));
    expect(pkg.license).toBe('UNLICENSED');
    expect(pkg.private).toBe(true);
  });
});
