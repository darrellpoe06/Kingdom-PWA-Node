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
import { HISTORICAL_RESEARCH_MODULES } from '../app/src/lib/historical-research-course.js';
import { BUSINESS_RESEARCH_MODULES, BUSINESS_SOURCE_HOSTS } from '../app/src/lib/business-research-course.js';

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
async function fetchOnce(url) {
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
    return { status: res.status, text: stripTags(body), title: strict(title).slice(0, 120) };
  } catch (e) {
    return { status: 0, text: '', error: String(e && e.message || e) };
  } finally { clearTimeout(timer); }
}
// RETRY WHAT THE NETWORK OR THE HOST'S GATE ANSWERED, NOT THE RECORD
// (2026-09-24, runs 35938701897 and 35938904116): a docs-only push read
// "Dunmore, 1775 · HTTP 0 fetch failed" and the re-run found the voice 56/56;
// three minutes and three runs later teachingamericanhistory.org answered
// HTTP 403 to four voices it had served at 200 twice in the same window — a
// rate limit on the runner, not a missing phrase. A status 0 (socket), 403,
// 429 or 5xx is tried again after 5 s and then 20 s; a page that answers
// 200 is judged as before; a refusal that persists is reported as SOURCE
// REFUSED THE RUNNER with the status, so the line names the host's gate and
// never says "NOT IN SOURCE" about words it could not read. It still FAILS —
// a witness that could not read the page has not witnessed (DR-0076 §4).
const RETRY_WAITS_MS = [5000, 20000];
const shouldRetry = (r) => r.status === 0 || r.status === 403 || r.status === 429 || r.status >= 500;
async function fetchText(url) {
  if (cache.has(url)) return cache.get(url);
  let text = await fetchOnce(url);
  let attempts = 1;
  for (const wait of RETRY_WAITS_MS) {
    if (!shouldRetry(text)) break;
    await new Promise((r) => setTimeout(r, wait));
    const again = await fetchOnce(url);
    attempts += 1;
    const errs = [text.error, again.error].filter(Boolean).join('; ');
    text = shouldRetry(again) ? { ...again, error: errs, refused: again.status !== 0 } : { ...again, retried: attempts };
  }
  cache.set(url, text);
  return text;
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
        const sp = strict(page.text);
        const ws = strict(v.words).split(' ');
        let found = '';
        for (let k = 0; k + 3 <= ws.length && !found; k += 3) {
          const win = ws.slice(k, k + 3).join(' ');
          const at = sp.indexOf(win);
          if (at >= 0) found = `page holds near «${win}»: «${sp.slice(Math.max(0, at - 120), at + Math.min(360, strict(v.words).length + 120))}»`;
        }
        hint = `title: «${page.title || ''}» · ${found || 'no three-word window of the quotation is on the page'}`;
      }
      rows.push({ lesson: m.id, speaker: v.speaker, year: v.year, url: v.source.url, status: page.status, tier, error: page.error || '', retried: page.retried || 0, refused: !!page.refused, hint });
    }
  }
  return rows;
}

// PROBE MODE — the runner as the team's eye. `--probe` reads PROBES from the
// environment, one `url | phrase` per line, and prints each page's title and
// the text around the phrase (or the page's opening when the phrase is
// absent). Read-only; it is how a candidate record is checked before a voice
// cites it, from the one place that can reach it.
async function probe(spec) {
  for (const line of String(spec || '').split('\n')) {
    // `url | phrase | window` — window (chars, default 700) widens the read.
    const [rawUrl, rawPhrase = '', rawWindow = ''] = line.split('|');
    const url = (rawUrl || '').trim(); const phrase = rawPhrase.trim();
    const win = Math.min(12000, Number(rawWindow.trim()) || 700);
    if (!url) continue;
    const page = await fetchText(url);
    const sp = strict(page.text);
    console.log(`== ${url} · HTTP ${page.status}${page.error ? ' ' + page.error : ''} · title «${page.title || ''}»`);
    if (!phrase) { console.log(`   opens: «${sp.slice(0, win)}»`); continue; }
    const at = sp.indexOf(strict(phrase));
    if (at >= 0) console.log(`   around «${phrase}»: «${sp.slice(Math.max(0, at - Math.floor(win / 2)), at + win)}»`);
    else { const la = loose(sp).indexOf(loose(phrase)); console.log(`   «${phrase}» ${la >= 0 ? 'present on letters only (punctuation differs)' : 'NOT on the page'}; opens: «${sp.slice(0, Math.min(win, 400))}»`); }
  }
}

const main = async () => {
  if (process.argv.includes('--probe')) { await probe(process.env.PROBES); process.exit(0); }
  const selftest = process.argv.includes('--selftest-break');
  // Both History courses and the Business Research course carry voices; the
  // witness reads every one.
  let modules = [...HISTORY_MODULES, ...HISTORICAL_RESEARCH_MODULES, ...BUSINESS_RESEARCH_MODULES];
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
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.lesson} · ${r.speaker}, ${r.year} · HTTP ${r.status}${r.error ? ' ' + r.error : ''}${r.retried ? ` (answered on attempt ${r.retried})` : ''} · ${r.tier || (r.refused ? `SOURCE REFUSED THE RUNNER (HTTP ${r.status}, after retries)` : r.status === 0 ? 'UNREACHABLE (after retries)' : 'NOT IN SOURCE')} · ${r.url}`);
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
