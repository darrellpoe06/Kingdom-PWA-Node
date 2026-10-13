#!/usr/bin/env node
// =============================================================================
// public-shelf-witness — THE STRANGER'S SCREEN GETS ITS OWN EYE
// =============================================================================
// 2026-10-11, after telling Darrell a fix was live when it was inert.
//
// WHAT HAPPENED, AND WHY A PIPELINE CHECK COULD NOT CATCH IT. DR-0952 shipped
// the co-living sentence for the public shelf. Every gate was green: tests
// passed, the migration applied, the deploy succeeded on the exact SHA. It was
// reported as live. It rendered NOTHING, for nine days, because it keyed on
// `rentals.rentable_level` — a column migration 0160 added and NOTHING IN THE
// APP EVER WRITES. The same NULL silently broke three things at once: the
// label said "1-bed multi-family" for half of a shared room, the housemates
// line never appeared, and a bed with no pictures of its own never borrowed
// its apartment's (`NULL IN ('room','bed')` is NULL, not false).
//
// Darrell found all three. From his phone. The system found none of them.
//
// THE GAP IS STRUCTURAL, NOT A LAPSE. Every instrument we have watches the
// PIPELINE — CI, the migration ledger, the deploy run, boot-check. Not one of
// them reads the page a stranger actually sees. site-health (DR-0125) proves
// the site is UP and FRESH; it has never had an opinion about whether a card
// tells the truth. So a listing could be confidently, specifically wrong while
// every check stayed green, and the only witness was the landlord noticing.
//
// WHAT THIS MEASURES, from the rendered DOM rather than from the database:
//
//   1. A card that announces a SHARED home must not also claim a bedroom
//      count. "Bed in a shared multi-family" and "1 bed" cannot both be true,
//      and the second is the one that makes somebody arrive with a car full of
//      belongings expecting their own place.
//   2. A card whose title says it is a bed or a room MUST carry the housemates
//      sentence. A shared home that does not say so is the DR-0952 failure
//      verbatim.
//   3. Every advertised card either shows photographs or says plainly that it
//      has none. "PHOTOGRAPHS COMING" on a door whose apartment holds 39 is
//      the borrow being broken, and it looks identical to a door nobody has
//      photographed.
//
// WHAT IT DELIBERATELY DOES NOT DO. It never signs in, never applies, never
// books, never reads a street address, and never asserts a specific door by
// name. Pinning "Bed B must say X" would break every time Darrell renames a
// door — and renaming a door is exactly what broke the old room_label match.
// The rules above hold for ANY door on ANY day, which is what makes this an
// instrument rather than a snapshot.
//
// READ-ONLY BY CONSTRUCTION. One page load, no input, no writes to the
// product. Its only power is to fail the run and print what it saw; the
// workflow files that on the incident ledger.
//
// UNKNOWN IS NOT PASS (DR-0076 §8). A shelf that will not load, or that
// renders zero cards, FAILS. "Nothing advertised" and "the page is broken"
// look identical from here, so neither is allowed to read as healthy.
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { judgeShelf, report } from './public-shelf-rules.mjs';

const BASE = process.env.BASE || 'https://poetech.us/properties/app/';
const OUT = process.env.OUT_DIR || 'shots';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 420, height: 1200 } });
  let cards = [];
  let loadError = null;
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

    // WALK THE PATH A STRANGER WALKS (DR-0974, from the first live run).
    //
    // The shelf is NOT the landing page. PropertiesDoor opens on "Who are
    // you?" and only calls loadPublicVacancies() once `who === 'applicant'`
    // (PropertiesDoor.jsx:321-330). The witness's first live run therefore
    // read ZERO CARDS from a shelf holding three — it had photographed the
    // chooser and judged that.
    //
    // It failed rather than passing, which is the only reason this was
    // visible within minutes instead of becoming a daily green tick over a
    // page nobody was reading. "Unknown is not pass" earned its keep on the
    // instrument's own first outing.
    //
    // "Looking for a place" is the single option needing no account
    // (WHO_OPTIONS[0], model.js:449). Clicked by its VISIBLE TEXT rather than
    // a testid, because that is what a stranger clicks and a testid would let
    // the button be renamed out from under the witness silently.
    const browse = page.getByRole('button', { name: /Looking for a place/i }).first();
    const sawChooser = await browse.count().catch(() => 0);
    if (sawChooser) await browse.click({ timeout: 10000 }).catch(() => {});

    // The cards arrive after a round trip to public_vacancies().
    await page.waitForSelector('li', { timeout: 25000 }).catch(() => {});
    cards = await page.$$eval('li', (nodes) => nodes
      .filter((n) => /apply|book a stay/i.test(n.textContent || ''))
      .map((n) => {
        const q = (sel) => (n.querySelector(sel)?.textContent || '').trim();
        const text = (n.textContent || '').replace(/\s+/g, ' ').trim();
        // The title is the card's heading; the size line follows the rent.
        const heading = (n.querySelector('h2, h3')?.textContent || '').trim();
        return {
          title: heading || text.slice(0, 80),
          size: (text.match(/(?:\$[\d,]+\/mo|Rent on request)[^·]*((?:·[^·]*)*)/) || [, ''])[1] || text,
          sharedLine: q('[data-testid="vacancy-shared-home"]'),
          photos: q('[data-testid="vacancy-photo-seeall"]') || text,
        };
      }));
  } catch (err) {
    loadError = (err && err.message) || String(err);
  }
  await page.screenshot({ path: `${OUT}/public-shelf.png`, fullPage: true }).catch(() => {});
  await browser.close();

  const result = loadError
    ? { findings: [`the shelf could not be read at all: ${loadError.split('\n')[0]}`], checked: 0 }
    : judgeShelf(cards);

  const text = report(result, BASE);
  console.log(text);
  writeFileSync(`${OUT}/result.json`, JSON.stringify({ base: BASE, ...result, cards }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, text, { flag: 'a' });
  }
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `findings<<EOF\n${result.findings.join('\n')}\nEOF\n`, { flag: 'a' });
  }
  if (result.findings.length) process.exit(1);
}

if (process.env.VITEST === undefined && import.meta.url.endsWith(process.argv[1]?.split('/').pop() || '')) {
  await main();
}
