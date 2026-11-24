#!/usr/bin/env node
// =============================================================================
// church-calendar-read — read each office picture's events, once (DR-1644)
// =============================================================================
// Input:  <folder>/manifest.json + <folder>/files/ (church_calendar_reads.py
//         pull: the archive's calendars and flyers not yet read)
// Output: <folder>/reads.json  [{ sha256, kind, events: [...] , dropped }]
//         for church_calendar_reads.py file, which files each picture ONCE.
//
// The model only LISTS what the picture prints; app/src/lib/church-calendar-
// read.js checks every event (a real day inside the picture's month, a name,
// not a weekly service already shown, one per name per day) before it can be
// filed (DR-0076).
//
// BRAKES (AI class — vendor spend, CLAUDE.md three brakes):
//   budget      at most READ_MAX_PER_RUN pictures a run (the pull is capped
//               the same), one request each, max_tokens and a timeout on each;
//               a picture is read once EVER (church_calendar_reads), so the
//               spend is one request per picture the office posts
//   lock        the workflow's concurrency group (one run at a time)
//   kill-switch repository variable CHURCH_CALENDAR_READ=off skips reading
//               (the archive still keeps every picture); a run where every
//               read fails stops at the first two failures instead of
//               spending the rest of the budget.
// A picture whose read failed is NOT written to reads.json, so it is tried
// again on the next run; a picture read with no dated events IS written (an
// empty list), so it is not paid for twice.
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readRequest, answerJson, checkRead, picturesToRead, READ_TIMEOUT_MS, READ_MAX_PER_RUN } from '../app/src/lib/church-calendar-read.js';
import { COLG_DEFAULT_CHURCH } from '../app/src/lib/default-church.js';

const API = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** One picture read through the Messages API: { answer } or { error }. Never throws. */
export async function readOne(item, bytes, { fetchImpl = globalThis.fetch, apiKey, services = [], timeoutMs = READ_TIMEOUT_MS } = {}) {
  const body = readRequest({
    kind: item.kind,
    year: item.for_year,
    month: item.for_month,
    services,
    base64: Buffer.from(bytes).toString('base64'),
    mediaType: item.content_type,
  });
  try {
    const res = await fetchImpl(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': API_VERSION, 'anthropic-beta': FALLBACK_BETA },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const message = await res.json();
    if (message.stop_reason === 'refusal') return { error: 'refused' };
    if (message.stop_reason === 'max_tokens') return { error: 'cut off' };
    const answer = answerJson(message);
    return answer ? { answer } : { error: 'not JSON' };
  } catch (e) {
    return { error: e && e.name === 'TimeoutError' ? 'timeout' : 'unreachable' };
  }
}

/** Reads the folder's pictures: { reads, failed }. */
export async function readFolder(folder, { fetchImpl, apiKey, services = [], max = READ_MAX_PER_RUN, timeoutMs = READ_TIMEOUT_MS, log = () => {} } = {}) {
  const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8'));
  const reads = [];
  const failed = [];
  for (const item of picturesToRead(manifest.items, { max })) {
    const path = join(folder, 'files', item.file);
    if (!existsSync(path)) {
      failed.push({ sha256: item.sha256, why: 'bytes missing' });
      continue;
    }
    const got = await readOne(item, readFileSync(path), { fetchImpl, apiKey, services, timeoutMs });
    if (got.error) {
      failed.push({ sha256: item.sha256, why: got.error });
      log(`not read: ${item.kind} ${item.for_year}-${String(item.for_month).padStart(2, '0')} ${item.title} (${got.error})`);
      // Two failures and nothing read: the service is down or the key is wrong. Stop spending.
      if (failed.length >= 2 && reads.length === 0) break;
      continue;
    }
    const checked = checkRead(got.answer, { kind: item.kind, year: item.for_year, month: item.for_month, services });
    reads.push({ sha256: item.sha256, kind: item.kind, events: checked.events, dropped: checked.dropped });
    log(
      `read: ${item.kind} ${item.for_year}-${String(item.for_month).padStart(2, '0')} ${item.title}: ${checked.events.length} event(s)` +
        (checked.dropped
          ? `, ${checked.dropped} left out (${Object.entries(checked.reasons)
              .map(([k, v]) => `${k} ${v}`)
              .join(', ')})`
          : '')
    );
  }
  return { reads, failed };
}

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error('usage: church-calendar-read.mjs <pulled folder>');
    process.exit(2);
  }
  const say = (line) => {
    console.log(line);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`, { flag: 'a' });
  };
  if (String(process.env.CHURCH_CALENDAR_READ || '').toLowerCase() === 'off') {
    say('Calendar reading is OFF (repository variable CHURCH_CALENDAR_READ=off). Pictures are still kept.');
    return;
  }
  if (!existsSync(join(folder, 'manifest.json'))) {
    say('Nothing pulled to read.');
    return;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    say('NOT READ: no Anthropic API key is set where this runs. Pictures are still kept; they will be read the first run after one is.');
    return;
  }
  // The NAS pass sizes itself to fit its rider's time ceiling (DR-1649).
  const envInt = (name, dflt, lo, hi) => {
    const n = Number(process.env[name]);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : dflt;
  };
  const { reads, failed } = await readFolder(folder, {
    apiKey,
    services: COLG_DEFAULT_CHURCH.services || [],
    max: envInt('CHURCH_CALENDAR_READ_MAX', READ_MAX_PER_RUN, 1, READ_MAX_PER_RUN),
    timeoutMs: envInt('CHURCH_CALENDAR_READ_TIMEOUT_MS', READ_TIMEOUT_MS, 10000, READ_TIMEOUT_MS),
    log: say,
  });
  writeFileSync(join(folder, 'reads.json'), JSON.stringify(reads, null, 2));
  say(`CALENDAR-READ read=${reads.length} events=${reads.reduce((n, r) => n + r.events.length, 0)} failed=${failed.length}`);
  if (failed.length) {
    for (const f of failed) console.log(`::error::picture ${f.sha256.slice(0, 12)} not read: ${f.why}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
