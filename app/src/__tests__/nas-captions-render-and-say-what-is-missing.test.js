// The NAS route gives exact words and NO timestamps — and must say so.
//
// Built 2026-09-22 after source-transcript.yml (the CI route) came back red with
// "Sign in to confirm you're not a bot": YouTube challenges datacenter IPs. That
// blocker was ALREADY measured and written down in this repo —
// infra/nas-loops/services.json's transcript-trickle entry says "the CI path is
// YouTube-IP-blocked ... from the NAS's residential IP". The NAS route reuses
// infra/nas-sme-pipeline/youtube-captions.py, which already works from that IP.
//
// The two routes differ in a way that matters to a lesson's provenance, and the
// difference is the reason these cases exist:
//   * the VTT route (scripts/vtt-to-text.mjs) keeps timestamps, and needs
//     de-duplication because a caption track is a rolling display;
//   * this route returns segments already joined (youtube-captions.py's
//     fetch_one), so there is nothing to de-duplicate and NO timestamp to cite.
// A quotation from this file can be attributed to the speaker but not pinned to
// a minute mark, so the renderer states that in the file itself.

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve(__dirname, '../../../scripts/captions-json-to-text.mjs');
const PRODUCER = resolve(__dirname, '../../../infra/nas-sme-pipeline/youtube-captions.py');

function render(json, videoId) {
  const dir = mkdtempSync(join(tmpdir(), 'caps-'));
  const file = join(dir, 'captions.json');
  writeFileSync(file, JSON.stringify(json));
  return execFileSync('node', [SCRIPT, file, videoId], { encoding: 'utf8' });
}

function renderFails(json, videoId) {
  try {
    render(json, videoId);
    return null;
  } catch (err) {
    return String(err.stderr || err.message);
  }
}

const VID = '18pppZ3egOg';
const OK = {
  [VID]: {
    text: 'we have been misled about biology for eighty years and the reason is a model '
      + 'that ignores the living cell and treats the gene as the sole commander of life '
      + 'when in fact the cell corrects its own errors and regulates its own genes',
    source: 'youtube-asr',
    lang: 'en',
    words: 44,
  },
};

describe('the renderer matches the shape the NAS fetcher actually writes', () => {
  it('reads the success shape the producer emits, not an invented one', () => {
    // Pinned against the real producer so a change there breaks this, loudly.
    const py = readFileSync(PRODUCER, 'utf8');
    expect(py).toContain('"text": text, "source": "youtube-asr", "lang": "en"');
    expect(py).toContain('"text": "", "error": err or "no-captions"');
    const out = render(OK, VID);
    expect(out).toContain('misled about biology for eighty years');
    expect(out).toContain('regulates its own genes');
  });

  it('keeps every word intact when wrapping — a transcript is evidence, not prose to tidy', () => {
    const out = render(OK, VID);
    const body = out.split('\n').filter((l) => !l.startsWith('#')).join(' ').replace(/\s+/g, ' ').trim();
    expect(body).toBe(OK[VID].text);
  });

  it('SAYS in the file that this route carries no timestamps', () => {
    const out = render(OK, VID);
    expect(out).toMatch(/NO TIMESTAMPS on this route/);
    expect(out).toMatch(/NOT cited to a minute mark/);
  });

  it('names the route and the reason for it, so a later reader knows which path produced this', () => {
    const out = render(OK, VID);
    expect(out).toMatch(/Fetched on the NAS from its residential IP/);
    expect(out).toMatch(/CI path is YouTube-IP-blocked/);
    expect(out).toMatch(/transcript-trickle/);
  });

  it('warns that auto-captions are a machine hearing a man', () => {
    const out = render(OK, VID);
    expect(out).toMatch(/machine's hearing, not the speaker's own/);
    expect(out).toMatch(/Verify any wording before quoting a person/);
  });
});

describe('a missing transcript is a real answer, reported rather than papered over', () => {
  it('prints WHAT the fetcher recorded when there is no caption text', () => {
    const err = renderFails({ [VID]: { text: '', error: 'IpBlocked: too many requests', source: 'youtube-asr' } }, VID);
    expect(err).toContain('No caption text');
    // The distinction that decides the next move: an IP ceiling means wait,
    // a no-captions video means fall back to whisper-gpu.
    expect(err).toContain('IpBlocked');
  });

  it('distinguishes a video with no captions from a rate ceiling', () => {
    const err = renderFails({ [VID]: { text: '', error: 'no-captions', source: 'youtube-asr' } }, VID);
    expect(err).toContain('no-captions');
  });

  it('refuses a JSON that has no entry for the requested id, and lists what it does have', () => {
    const err = renderFails({ someOtherId: { text: 'hello there friend' } }, VID);
    expect(err).toContain(`No entry for ${VID}`);
    expect(err).toContain('someOtherId');
  });

  it('exits non-zero on unparseable input rather than emitting a half file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'caps-'));
    const file = join(dir, 'captions.json');
    writeFileSync(file, '{ not json');
    let failed = false;
    try { execFileSync('node', [SCRIPT, file, VID], { encoding: 'utf8' }); }
    catch { failed = true; }
    expect(failed).toBe(true);
  });

  it('PROVEN TO CATCH: an empty-text row must never render as a successful transcript', () => {
    // The failure mode worth guarding: a blank body dressed up as a transcript,
    // which a lesson would then quote from as if it were the speaker.
    const err = renderFails({ [VID]: { text: '   ', source: 'youtube-asr' } }, VID);
    expect(err).toBeTruthy();
    expect(err).toContain('No caption text');
  });
});

describe('this route needs no de-duplicator, and that is asserted so nobody adds one', () => {
  it('joined segments carry no rolling-window repetition', () => {
    // The VTT route repeats the tail of each cue; this one does not, because the
    // segment API returns each phrase once. Same phrase twice here would be the
    // speaker actually saying it twice, and stripping it would falsify him.
    const repeated = { [VID]: { text: 'the cell corrects its own errors the cell corrects its own errors and so does the body again', source: 'youtube-asr', lang: 'en' } };
    const out = render(repeated, VID);
    const body = out.split('\n').filter((l) => !l.startsWith('#')).join(' ').replace(/\s+/g, ' ').trim();
    expect((body.match(/the cell corrects its own errors/g) || []).length).toBe(2);
  });
});
