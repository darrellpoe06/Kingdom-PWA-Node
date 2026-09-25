#!/usr/bin/env node
// =============================================================================
// mic-record-probe — the spoken-lesson recorder, MEASURED in a real Chromium
// with a fake microphone (DR-0636)
// =============================================================================
// Darrell, 2026-09-24, on his Fold: the clock ticked to 0:22 and "Never
// recorded". jsdom has no MediaRecorder, no AudioContext and no microphone, so
// the component tests can only drive fakes. This bundles the REAL
// VoiceLessonRecorder (and the real recorder hook under it) with esbuild,
// serves it on localhost (a secure context, as the microphone requires), and
// drives it in Chromium started with --use-fake-device-for-media-stream, which
// feeds a real tone into getUserMedia:
//   record 5 s -> bytes captured > 0 while recording -> the level bar moves ->
//   Stop -> the take's blob size > 0, verdict ok -> playback is shown.
//
// --selftest-break (anti-theater, DR-0076 §3): the same run with the
// microphone track DISABLED (true zeros, what a phone call does to a page).
// The pass checks must FAIL, and the silence alert and "Nothing was recorded"
// must appear instead; otherwise the probe could not tell the difference and
// exits 1.
// =============================================================================
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'app');
const SELFTEST = process.argv.includes('--selftest-break');
const requireApp = createRequire(join(APP, 'package.json'));
const esbuild = requireApp('esbuild');
const { chromium } = createRequire(join(ROOT, 'package.json'))('playwright-core');

const dir = mkdtempSync(join(tmpdir(), 'mic-probe-'));
const entry = join(dir, 'entry.jsx');
writeFileSync(entry, `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import VoiceLessonRecorder from ${JSON.stringify(join(APP, 'src/components/VoiceLessonRecorder.jsx'))};
window.__takes = [];
function Harness() {
  const [take, setTake] = useState(null);
  return <VoiceLessonRecorder take={take} onTake={(t) => { setTake(t); if (t) record(t); }} />;
}
// The recorded audio itself is decoded and its loudest sample measured, so the
// probe knows whether the TAKE has sound, independent of the live meter.
async function record(t) {
  const row = { size: t.blob ? t.blob.size : 0, seconds: t.seconds, verdict: t.verdict, decodedPeak: -1 };
  window.__takes.push(row);
  try {
    const ctx = new AudioContext();
    const audio = await ctx.decodeAudioData(await t.blob.arrayBuffer());
    let p = 0;
    for (let c = 0; c < audio.numberOfChannels; c += 1) for (const v of audio.getChannelData(c)) p = Math.max(p, Math.abs(v));
    row.decodedPeak = p;
  } catch (e) { row.decodedPeak = -2; }
}
createRoot(document.getElementById('root')).render(<Harness />);
`);
// The network half (Supabase, the inbox relay) is not what is measured here.
const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /(\/|^)(supabase|agent-inbox-sync)\.js$/ }, (a) => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export default {}; export const relayThought = async () => ({ ok: false });', loader: 'js' }));
  },
};
await esbuild.build({
  entryPoints: [entry], bundle: true, outfile: join(dir, 'app.js'), format: 'esm', jsx: 'automatic',
  loader: { '.js': 'jsx' }, plugins: [stubs], nodePaths: [join(APP, 'node_modules')], logLevel: 'error',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
});
const html = '<!doctype html><meta charset="utf-8"><body><div id="root"></div><script type="module" src="/app.js"></script>';
const js = readFileSync(join(dir, 'app.js'));
const server = createServer((req, res) => {
  if (req.url === '/app.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(js); return; }
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

// A voice-level tone the whole time, fed as the microphone. Measured
// 2026-09-24: Chromium's built-in fake microphone (no file) reads true zeros
// through Web Audio for seconds at a time while its recording has sound, so it
// cannot stand in for a person speaking; a WAV file can.
function toneWav(seconds = 12, rate = 48000) {
  const n = seconds * rate;
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i += 1) b.writeInt16LE(Math.round(0.3 * 32767 * Math.sin((2 * Math.PI * 220 * i) / rate)), 44 + i * 2);
  return b;
}
const wav = join(dir, 'voice.wav');
writeFileSync(wav, toneWav());
const args = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required', `--use-file-for-fake-audio-capture=${wav}`];
const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true, args }
  : { channel: 'chrome', headless: true, args };
let browser;
try { browser = await chromium.launch(launchOpts); } catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args }); }

async function run({ muted }) {
  const page = await browser.newPage();
  if (muted) {
    await page.addInitScript(() => {
      const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (c) => { const s = await real(c); s.getAudioTracks().forEach((t) => { t.enabled = false; }); return s; };
    });
  }
  await page.goto(url);
  await page.click('[data-testid="voice-lesson-record"]');
  const during = [];
  for (let i = 0; i < 5; i += 1) {
    await page.waitForTimeout(1000);
    during.push(await page.evaluate(() => ({
      bytes: (document.querySelector('[data-testid="voice-lesson-bytes"]') || {}).textContent || '',
      level: ((document.querySelector('[data-testid="voice-lesson-level"]') || {}).style || {}).width || '0%',
      silence: !!document.querySelector('[data-testid="voice-lesson-silence"]'),
    })));
  }
  await page.click('[data-testid="voice-lesson-stop"]');
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({
    takes: window.__takes,
    playback: !!document.querySelector('[data-testid="voice-lesson-playback"]'),
    nothing: (document.querySelector('[data-testid="voice-lesson-nothing"]') || {}).textContent || '',
  }));
  await page.close();
  return { during, after };
}

function passChecks(r) {
  const take = r.after.takes[r.after.takes.length - 1] || {};
  const bytesGrew = r.during.some((d) => /\d+ (KB|bytes) captured/.test(d.bytes) && !/ 0 bytes captured/.test(d.bytes));
  const levelMoved = r.during.some((d) => parseInt(d.level, 10) > 0);
  return [
    ['bytes captured while recording', bytesGrew],
    ['the level bar moved', levelMoved],
    ['no silence alert', r.during.every((d) => !d.silence)],
    ['the take has audio (blob size > 0)', (take.size || 0) > 0],
    ['the recorded audio itself has sound (decoded peak > 0.01)', (take.decodedPeak || 0) > 0.01],
    ['the take is ready to send', !!(take.verdict && take.verdict.ok)],
    ['playback is shown', r.after.playback],
  ];
}

let failed = false;
try {
  const r = await run({ muted: SELFTEST });
  const checks = passChecks(r);
  const take = r.after.takes[r.after.takes.length - 1] || {};
  console.log(`take: ${take.size || 0} bytes, ${take.seconds || 0} s, decoded peak ${take.decodedPeak}; last live line: "${r.during[r.during.length - 1].bytes}", level ${r.during.map((d) => d.level).join(' ')}`);
  if (!SELFTEST) {
    for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    failed = checks.some(([, ok]) => !ok);
  } else {
    const anyPassWouldFail = checks.some(([, ok]) => !ok);
    const saidSilence = r.during.some((d) => d.silence);
    const saidNothing = /^Nothing was recorded/.test(r.after.nothing);
    console.log(`selftest (muted microphone): pass checks rejected = ${anyPassWouldFail}; silence alert shown = ${saidSilence}; "${r.after.nothing}"`);
    failed = !(anyPassWouldFail && saidSilence && saidNothing);
    if (failed) console.error('FAIL  the probe could not tell a silent microphone from a working one');
  }
} finally {
  await browser.close();
  server.close();
  rmSync(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
