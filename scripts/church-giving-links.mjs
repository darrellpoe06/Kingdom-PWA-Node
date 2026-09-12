#!/usr/bin/env node
// =============================================================================
// church-giving-links — read the church's OWN published giving links
// =============================================================================
// A congregant, 2026-09-11 17:27: "Working: Cashapp and Givelify both work |
// Not working: My PayPal account won't connect."
//
// I first diagnosed this as the URL SHAPE — that `/donate?token=…` is a
// per-session artifact and cannot persist. That was WRONG, and Darrell
// corrected it by opening the church's own link, which is exactly that shape
// and loads "Donate to The Church Of The Living God" perfectly.
//
// The real defect was duller and I would have found it sooner without the
// theory: lib/giving.js simply held a DIFFERENT token from the church's
// current donate button, so PayPal had nothing to resolve. Hence "won't
// connect" while Cashapp and Givelify — whose links were right — worked.
//
// The lesson kept here on purpose: I reasoned about what a URL shape MUST mean
// instead of opening it. The check below therefore compares against what the
// church actually publishes; it no longer judges a link by its shape.
//
// The church publishes its real links on its own website, which is the
// authority — not this repo, and not a guess. This sandbox cannot reach that
// site (the egress proxy refuses it) but a GitHub runner can, which is the
// same lesson the whole night has been teaching: reachability is not identity,
// and the team's reach is wider than mine.
//
// Prints what the site actually publishes. It NEVER edits giving.js: money
// routing is the Governor's to change, and this only puts the truth in front
// of him.
//
// CLI:  node scripts/church-giving-links.mjs <url>
// =============================================================================

/** Every href on the page, with the text a person would have clicked. */
export function extractLinks(html = '') {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    out.push({ href: m[1].trim(), text });
  }
  return out;
}

/** The giving processors we care about, and how to recognise each. */
export const PROCESSORS = Object.freeze([
  ['paypal', /paypal\.(com|me)/i],
  ['givelify', /givelify\.com/i],
  ['cashapp', /cash\.app|cashapp\.com/i],
  ['venmo', /venmo\.com/i],
  ['givebutter', /givebutter\.com/i],
]);

/**
 * Name a PayPal link's shape. All of these are legitimate published donate
 * links — `?token=` included, which is what PayPal's own donate-button
 * generator emits and what this church actually uses.
 *
 * This deliberately makes NO durability judgement. The question that matters
 * is not "what shape is it" but "is it the one the church publishes", and that
 * is answered by matchesPublished() below, against the site — not by reasoning.
 */
export function paypalShape(href = '') {
  if (!/paypal\.(com|me)/i.test(href)) return null;
  if (/paypal\.me\//i.test(href)) return 'paypal.me';
  if (/hosted_button_id=/i.test(href)) return 'hosted_button_id';
  if (/[?&]token=/i.test(href)) return 'donate-button token';
  if (/business=/i.test(href)) return 'business';
  return 'other';
}

/**
 * The only question worth asking: does the link WE ship equal the link the
 * church publishes? A mismatch is the whole bug that was reported.
 */
export function matchesPublished(ours = '', published = []) {
  const norm = (u) => String(u || '').trim().replace(/\/$/, '');
  const mine = norm(ours);
  const hits = published.map(norm);
  if (!mine) return { ok: false, why: 'we ship no link at all' };
  if (hits.includes(mine)) return { ok: true };
  const sameProcessor = hits.filter((h) => paypalShape(h) && paypalShape(mine));
  return {
    ok: false,
    why: sameProcessor.length
      ? 'we ship a DIFFERENT PayPal link than the church publishes'
      : 'the church publishes no matching link',
    published: hits,
  };
}

/** Group the page's links by processor. */
export function givingLinks(html = '') {
  const links = extractLinks(html);
  const found = {};
  for (const [name, re] of PROCESSORS) {
    const hits = links.filter((l) => re.test(l.href));
    if (hits.length) found[name] = hits;
  }
  return found;
}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error('usage: church-giving-links.mjs <url>'); process.exit(2); }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) { console.error(`::error::${url} answered ${res.status}`); process.exit(1); }
  const html = await res.text();
  const found = givingLinks(html);
  console.log(`## Giving links published on ${url}\n`);
  if (!Object.keys(found).length) {
    console.log('No processor links found on the page itself — the giving page may be behind a menu link.');
  }
  for (const [name, hits] of Object.entries(found)) {
    console.log(`### ${name}`);
    for (const h of hits) {
      console.log(`  text: ${h.text || '(no text)'}`);
      console.log(`  href: ${h.href}`);
      const shape = paypalShape(h.href);
      if (shape) console.log(`  shape: ${shape}`);
    }
    console.log('');
  }
  // Every other link, so a giving page behind a menu is still findable.
  const all = extractLinks(html).filter((l) => /give|giving|tithe|offering|donate/i.test(`${l.href} ${l.text}`));
  if (all.length) {
    console.log('### Anything else that mentions giving');
    for (const l of all) console.log(`  ${l.text || '(no text)'} -> ${l.href}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('church-giving-links.mjs')) main();
