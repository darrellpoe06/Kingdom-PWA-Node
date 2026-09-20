// @vitest-environment jsdom
// =============================================================================
// Fast-forward that a remote can reach
// =============================================================================
// Darrell 2026-09-20, watching the announcements reel on the TV: "Need a way to
// fast forward videos.... can't"
//
// He could not because YouTube's scrub bar lives INSIDE the iframe. On a phone
// it is a thumb-drag; on a television it is a four-pixel line you are meant to
// hit by pushing a cursor with a D-pad, and the frame never holds focus so the
// arrow keys YouTube itself would honour never reach it. The controls had to
// become ours: real buttons in our own DOM, which the remote navigation walks
// and the focus ring outlines.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  isYouTubeEmbed, withJsApi, command, listenCommand, readPlayerInfo, nextSeek, SKIPS, YT_ORIGIN,
} from '../lib/youtube-embed-control.js';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

describe('enabling the API never disturbs the URL that was working', () => {
  const real = 'https://www.youtube.com/embed/abc123?list=UUxyz&rel=0';

  it('keeps every existing parameter', () => {
    // `list` and `rel=0` are load-bearing in worshipPlayerSrc: the playlist is
    // what keeps the service rolling, and losing it would be a worse bug than
    // the one being fixed.
    const out = new URL(withJsApi(real, 'https://poetech.us'));
    expect(out.searchParams.get('list')).toBe('UUxyz');
    expect(out.searchParams.get('rel')).toBe('0');
    expect(out.searchParams.get('enablejsapi')).toBe('1');
    expect(out.searchParams.get('origin')).toBe('https://poetech.us');
    expect(out.pathname).toBe('/embed/abc123');
  });

  it('leaves a non-YouTube source completely alone', () => {
    expect(withJsApi('https://example.com/video.mp4', 'https://poetech.us')).toBe('https://example.com/video.mp4');
    expect(withJsApi('', 'x')).toBe('');
  });

  it('recognises the embed forms we actually use', () => {
    expect(isYouTubeEmbed('https://www.youtube.com/embed/x')).toBe(true);
    expect(isYouTubeEmbed('https://www.youtube-nocookie.com/embed/x')).toBe(true);
    expect(isYouTubeEmbed('https://www.youtube.com/watch?v=x')).toBe(false);
    expect(isYouTubeEmbed('https://vimeo.com/embed/x')).toBe(false);
  });
});

describe('the seek lands somewhere real', () => {
  it('skips forward and back from the current position', () => {
    expect(nextSeek(100, 30, 600)).toBe(130);
    expect(nextSeek(100, -10, 600)).toBe(90);
  });

  it('never goes before the start', () => {
    expect(nextSeek(5, -10, 600)).toBe(0);
    expect(nextSeek(0, -10, 600)).toBe(0);
  });

  it('never goes past the end', () => {
    expect(nextSeek(590, 30, 600)).toBe(600);
  });

  it('a LIVE stream still skips forward — unknown duration is not zero', () => {
    // A live stream reports duration 0 or Infinity. Treating that as a ceiling
    // would clamp every forward skip to the start, which is the opposite of
    // what the button says it does.
    expect(nextSeek(100, 30, 0)).toBe(130);
    expect(nextSeek(100, 30, Infinity)).toBe(130);
    expect(nextSeek(100, -10, 0)).toBe(90);
  });

  it('a missing current time is treated as the start, not as NaN', () => {
    expect(nextSeek(undefined, 30, 600)).toBe(30);
    expect(nextSeek(NaN, 30, 600)).toBe(30);
  });
});

describe('only a real player report moves the position', () => {
  // A page receives messages from extensions, other frames and anything that
  // can reach window.postMessage. Treating a stray one as a playback time
  // would send the video somewhere random on the next press.
  it('reads currentTime and duration out of an infoDelivery message', () => {
    const msg = JSON.stringify({ event: 'infoDelivery', info: { currentTime: 42.5, duration: 600 } });
    expect(readPlayerInfo(msg)).toEqual({ currentTime: 42.5, duration: 600 });
  });

  it('accepts an already-parsed object too', () => {
    expect(readPlayerInfo({ event: 'infoDelivery', info: { currentTime: 1 } })).toEqual({ currentTime: 1 });
  });

  it('refuses anything that is not a state report', () => {
    for (const junk of ['', 'not json', '{}', '[]', null, undefined, 42, JSON.stringify({ event: 'other' })]) {
      expect(readPlayerInfo(junk), `accepted junk: ${String(junk)}`).toBe(null);
    }
  });

  it('refuses an info object carrying nothing we asked for', () => {
    expect(readPlayerInfo({ info: { volume: 50 } })).toBe(null);
  });
});

describe('the commands are the shape the embed accepts', () => {
  it('seekTo carries its arguments', () => {
    expect(JSON.parse(command('seekTo', [130, true]))).toEqual({
      event: 'command', func: 'seekTo', args: [130, true], id: 1, channel: 'widget',
    });
  });

  it('the listen handshake is sent, or nothing is ever reported back', () => {
    expect(JSON.parse(listenCommand()).event).toBe('listening');
  });
});

describe('it is wired where a viewer can reach it', () => {
  it('both the docked and the popped-out player carry the skips', () => {
    expect(read('app/src/components/ChurchHome.jsx')).toMatch(/<VideoSkip frameRef=\{frameRef\}/);
    expect(read('app/src/components/FloatingPlayer.jsx')).toMatch(/<VideoSkip frameRef=\{frameRef\}/);
  });

  it('the iframe KEY stays the bare src, so enabling the API cannot remount it', () => {
    // Keying on the js-api URL would make the parameter look like a different
    // video and restart playback on deploy — the exact class of bug the
    // floating player was just fixed for.
    const ch = read('app/src/components/ChurchHome.jsx');
    expect(ch).toMatch(/key=\{playerSrc\}/);
    expect(ch).toMatch(/src=\{playerEmbedSrc\}/);
  });

  it('messages from anywhere but YouTube are ignored', () => {
    expect(read('app/src/components/VideoSkip.jsx')).toMatch(/e\.origin !== YT_ORIGIN\) return/);
    expect(YT_ORIGIN).toBe('https://www.youtube.com');
  });

  it('the buttons are remote-sized and say what they do', () => {
    const c = read('app/src/components/VideoSkip.jsx');
    expect(c).toMatch(/min-h-\[44px\]/);
    expect(c).toMatch(/aria-label=\{`Skip \$\{s\.label\}`\}/);
    expect(SKIPS.map((s) => s.delta)).toEqual([-10, 30]);
  });
});
