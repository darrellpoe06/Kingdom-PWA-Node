#!/usr/bin/env node
// =============================================================================
// history-voices-witness — THEIR words, fetched not remembered (DR-0580)
// =============================================================================
// The History course quotes historical figures (`voices` on every lesson).
// The KJV is on disk, so Scripture is pinned by a plain test; these sources
// are not, and the cloud sandbox that writes the lessons has NO road to them
// (measured 2026-09-23: CONNECT 403 from the egress gateway for every host).
// So the verification runs where the network is open — a GitHub runner — the
// same DR-0108 move as site-health and level-witness: send a runner, do not
// report one member's limit as the team's.
//
// WHAT IT PROVES, per voice: the named source URL answers, and the quoted
// words are IN it. Two tiers, both reported:
//   strict — whitespace, quote glyphs and dashes normalised; punctuation kept.
//   loose  — letters and digits only. Editions differ in commas and colons;
//            the WORDS may not. A loose-only match is printed as such.
// A voice that fails both fails the run.
//
// PROVEN-TO-CATCH (DR-0076 §3): `--selftest-break` fetches the first voice's
// source, must FIND the true words there, and must REFUSE the same words with
// one changed — or the run fails. Both halves are required: a dark network
// refuses everything, and a witness that cannot see is not a witness.
//
// BRAKES: one fetch per distinct URL (cached), 30 s each, no writes anywhere.
// =============================================================================
import { HISTORY_MODULES } from '../app/src/lib/history-course.js';

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…',
};
export const decodeEntities = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => (ENTITIES[n.toLowerCase()] ?? m));
export const stripTags = (html) => String(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ');
export const strict = (t) => decodeEntities(String(t))
  .normalize('NFKC')
  .replace(/[’‘`´]/g, "'").replace(/[“”«»]/g, '"')
  .replace(/[—–‐‑‒−]|--/g, '-')
  .replace(/\s+/g, ' ').trim().toLowerCase();
export const loose = (t) => strict(t).replace(/[^a-z0-9]+/g, '');

/** Where the words sit in the page: 'strict', 'loose', or '' when absent. */
export function tierOf(pageText, words) {
  const page = strict(pageText);
  if (page.includes(strict(words))) return 'strict';
  if (loose(page).includes(loose(words))) return 'loose';
  return '';
}

const cache = new Map();
async function fetchText(url) {
  if (cache.has(url)) return cache.get(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) poetech-history-voices-witness', accept: 'text/html,text/plain;q=0.9,*/*;q=0.5' },
      redirect: 'follow',
    });
    const body = await res.text();
    const title = (body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1];
    const text = { status: res.status, text: stripTags(body), title: strict(title).slice(0, 120) };
    cache.set(url, text);
    return text;
  } catch (e) {
    const text = { status: 0, text: '', error: String(e && e.message || e) };
    cache.set(url, text);
    return text;
  } finally { clearTimeout(timer); }
}

async function witness(modules) {
  const rows = [];
  for (const m of modules) {
    for (const v of m.voices || []) {
      const page = await fetchText(v.source.url);
      const tier = page.status === 200 ? tierOf(page.text, v.words) : '';
      // On a refusal, say what the page DOES hold where the words should be:
      // its title, and the passage that follows the quotation's first four
      // words if they occur — the runner is the only eye that can read it.
      let hint = '';
      if (!tier && page.status === 200) {
        const first = strict(v.words).split(' ').slice(0, 4).join(' ');
        const at = strict(page.text).indexOf(first);
        hint = at >= 0 ? `page holds: «${strict(page.text).slice(at, at + Math.min(320, strict(v.words).length + 80))}»` : `first words «${first}» not on the page`;
        hint = `title: «${page.title || ''}» · ${hint}`;
      }
      rows.push({ lesson: m.id, speaker: v.speaker, year: v.year, url: v.source.url, status: page.status, tier, error: page.error || '', hint });
    }
  }
  return rows;
}

const main = async () => {
  const selftest = process.argv.includes('--selftest-break');
  let modules = HISTORY_MODULES;
  if (selftest) {
    // The true words must be FOUND and the altered words REFUSED, in the same
    // page. A dark network refuses both, and that is not a catch — it is a
    // witness with its eyes shut, and it fails here.
    const first = HISTORY_MODULES[0];
    const v0 = first.voices[0];
    const broken = { ...v0, speaker: `${v0.speaker} (one word altered)`, words: v0.words.replace(/\b(\w+)\b/, 'notthatword') };
    modules = [{ id: first.id, voices: [v0, broken] }];
  }
  const rows = await witness(modules);
  let bad = 0;
  for (const r of rows) {
    const ok = r.tier !== '';
    if (!ok) bad += 1;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.lesson} · ${r.speaker}, ${r.year} · HTTP ${r.status}${r.error ? ' ' + r.error : ''} · ${r.tier || 'NOT IN SOURCE'} · ${r.url}`);
    if (r.hint) console.log(`     ${r.hint}`);
  }
  if (selftest) {
    const [real, altered] = rows;
    if (real.tier !== '' && altered.tier === '') { console.log('selftest-break: the true words were found and the altered word was refused — the witness measures something'); process.exit(0); }
    if (real.tier === '') { console.log('selftest-break: the TRUE words were not found (source unreachable or changed) — the witness cannot see, so nothing it says counts'); process.exit(1); }
    console.log('selftest-break: the altered word PASSED — the witness is theatre'); process.exit(1);
  }
  console.log(`${rows.length - bad}/${rows.length} voices found in their sources`);
  process.exit(bad ? 1 : 0);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
