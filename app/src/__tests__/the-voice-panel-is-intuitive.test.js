// The voice panel is intuitive (DR-0576).
//
// Darrell, 2026-09-23, five messages in a row on the voice surfaces:
//   "Popup's?!!! Where are my voices stored in my cellphone so I can
//    troubleshoot without having to do the recording over and over again"
//   "Make this easy!!!!!!!!!!!!" — on the 84-voice census paragraph
//   "Make those options inside the app that opens that space... for the
//    user... deduce the device?!!!!!!" / "Intuitive Design!!!!!!"
//   "Why does this need this?!!!!!!!!!!!" — on a row whose file paths took
//    three lines at Big Print / "Intuitive!!!!!!!!"
//   "How do we know which settings to change?!!!!" — three screenshots of
//    Samsung Settings searched for "voice", finding nothing that changes the
//    reading voice.
//
// Each one is a surface that handed the person a hunt. This pins the answers:
// the route to the phone's own voice screen is DEDUCED from the device and
// carries a one-tap door where a browser can open one; a pick in the device
// list is heard the moment it is made; the recorded sample can be downloaded
// and brought back as a file; the citation folds under the verdict; a read
// notice lives inside the reader's own chrome instead of floating over the
// Word; and a 404 from the studio names the road, not the device.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectVoiceDevice, deviceVoiceRoute, TTS_SETTINGS_INTENT } from '../lib/device-voice-route.js';
import { voiceErrorReason } from '../lib/voice-service.js';

const STUDIO = readFileSync(resolve(__dirname, '../components/VoiceStudio.jsx'), 'utf8');
const TTS = readFileSync(resolve(__dirname, '../components/TTSControl.jsx'), 'utf8');

// His phone, from the user agent Chrome sends for a Galaxy Z Fold.
const FOLD = 'Mozilla/5.0 (Linux; Android 15; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const PIXEL = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

describe('the device is deduced, never asked', () => {
  it('his Fold reads as a Samsung Android', () => {
    expect(detectVoiceDevice(FOLD)).toEqual({ platform: 'android', maker: 'samsung', os: 'other' });
  });
  it('a Pixel reads as Android, not Samsung', () => {
    expect(detectVoiceDevice(PIXEL)).toEqual({ platform: 'android', maker: 'other', os: 'other' });
  });
  it('iPhone, Windows and Mac each read as themselves', () => {
    expect(detectVoiceDevice(IPHONE).platform).toBe('ios');
    expect(detectVoiceDevice(WINDOWS)).toEqual({ platform: 'desktop', maker: 'other', os: 'windows' });
    expect(detectVoiceDevice(MAC)).toEqual({ platform: 'desktop', maker: 'other', os: 'mac' });
  });
  it('an empty or unknown agent still answers, and never throws', () => {
    expect(detectVoiceDevice('').platform).toBe('other');
    expect(detectVoiceDevice(null).platform).toBe('other');
  });
});

describe('WHICH settings screen, in the phone’s own words — the question his screenshots asked', () => {
  const samsung = deviceVoiceRoute(detectVoiceDevice(FOLD));

  it('on his Samsung, names General management → Text-to-speech, the screen his search for "voice" did not find', () => {
    expect(samsung.steps.join(' ')).toMatch(/General management → Text-to-speech/);
  });

  it('tells him the WORD to search, because "voice" is proven empty', () => {
    expect(samsung.searchWord).toBe('Text-to-speech');
    expect(samsung.steps[0]).toMatch(/searching “voice” does not find it/);
  });

  it('carries a one-tap door to that screen from a browser', () => {
    expect(samsung.href).toBe(TTS_SETTINGS_INTENT);
    expect(TTS_SETTINGS_INTENT).toMatch(/^intent:#Intent;action=com\.android\.settings\.TTS_SETTINGS;end$/);
    expect(samsung.hrefLabel).toMatch(/Open the phone’s Text-to-speech settings/);
  });

  it('a Pixel is routed through Accessibility, with the older path named too', () => {
    const pixel = deviceVoiceRoute(detectVoiceDevice(PIXEL));
    expect(pixel.steps.join(' ')).toMatch(/Accessibility → Text-to-speech output/);
    expect(pixel.steps.join(' ')).toMatch(/Languages & input/);
    expect(pixel.href).toBe(TTS_SETTINGS_INTENT);
  });

  it('inside the local app the door is withheld honestly: the WebView cannot open an intent link yet', () => {
    const shell = deviceVoiceRoute(detectVoiceDevice(FOLD), { nativeShell: true });
    expect(shell.href).toBeNull();
    expect(shell.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('iPhone, Windows and Mac get their own screens and no Android door', () => {
    expect(deviceVoiceRoute(detectVoiceDevice(IPHONE)).steps.join(' ')).toMatch(/Accessibility → Spoken Content → Voices/);
    expect(deviceVoiceRoute(detectVoiceDevice(WINDOWS)).steps.join(' ')).toMatch(/Time & Language → Speech/);
    expect(deviceVoiceRoute(detectVoiceDevice(MAC)).steps.join(' ')).toMatch(/Spoken Content → System voice/);
    for (const ua of [IPHONE, WINDOWS, MAC]) expect(deviceVoiceRoute(detectVoiceDevice(ua)).href).toBeNull();
  });

  it('every route ends with what to do back in the app', () => {
    for (const ua of [FOLD, PIXEL, IPHONE, WINDOWS, MAC, '']) {
      const r = deviceVoiceRoute(detectVoiceDevice(ua));
      expect(r.after).toMatch(/come back here/);
      expect(r.title.length).toBeGreaterThan(20);
    }
  });
});

describe('the studio surface uses the route instead of a sentence', () => {
  it('deduces the device from the live user agent and the shell flag', () => {
    expect(STUDIO).toMatch(/deviceVoiceRoute\(\n\s*detectVoiceDevice\(typeof navigator !== 'undefined' \? navigator\.userAgent : ''\),\n\s*\{ nativeShell: typeof window !== 'undefined' && isNativeShell\(window\) \},/);
  });

  it('renders the door, the steps and the after-line', () => {
    expect(STUDIO).toMatch(/data-testid="device-voice-route"/);
    expect(STUDIO).toMatch(/data-testid="device-voice-settings-door"/);
    expect(STUDIO).toMatch(/href=\{voiceRoute\.href\}/);
    expect(STUDIO).toMatch(/voiceRoute\.steps\.map/);
    expect(STUDIO).toMatch(/\{voiceRoute\.after\}/);
  });

  it('the old one-size sentence is gone', () => {
    expect(STUDIO).not.toMatch(/On Android the working route is/);
    expect(STUDIO).not.toMatch(/choose a \{v\.gender\} voice in <strong>Settings → Text-to-speech<\/strong>/);
  });

  it('a pick in the device list is HEARD the moment it is made', () => {
    const block = STUDIO.slice(STUDIO.indexOf('const pinDeviceVoice'), STUDIO.indexOf('const pinDeviceVoice') + 900);
    expect(block).toMatch(/tts\.speak\(SAMPLE_SHORT, voiceURI \|\| ''\)/);
  });
});

describe('the sample can be kept and brought back — no recording over and over', () => {
  it('a Download makes the sample a file', () => {
    expect(STUDIO).toMatch(/data-testid="saved-sample-download"/);
    expect(STUDIO).toMatch(/download=\{`poetech-voice-\$\{enrolKey\}\.webm`\}/);
  });

  it('Use a recording file takes one back, into the same store under the same key', () => {
    expect(STUDIO).toMatch(/data-testid="saved-sample-import"/);
    const block = STUDIO.slice(STUDIO.indexOf('const loadRecordingFile'), STUDIO.indexOf('const loadRecordingFile') + 1200);
    expect(block).toMatch(/saveReference\(enrolKey, file\)/);
    expect(block).toMatch(/loadReference\(enrolKey\)/);
    expect(block).toMatch(/enrollMyVoice\(/);
  });

  it('says plainly that it is NOT a file in the Files app, and folds the exact location', () => {
    expect(STUDIO).toMatch(/not as a file you can find in your Files app/);
    expect(STUDIO).toMatch(/<summary[^>]*>Exactly where<\/summary>/);
  });
});

describe('the citation folds under the verdict', () => {
  it('each check’s "where" is a details fold, not a third line of file paths', () => {
    const block = STUDIO.slice(STUDIO.indexOf('{checks.map((c) =>'), STUDIO.indexOf('{checks.map((c) =>') + 2200);
    expect(block).toMatch(/<summary[^>]*>Where this is decided<\/summary>/);
    expect(block).toMatch(/\{c\.where\}/);
  });
});

describe('a read notice is not a popup', () => {
  it('the notice is rendered INSIDE the open panel, under the header', () => {
    const panelStart = TTS.indexOf('Read Aloud</div>');
    const noticeAt = TTS.indexOf('data-testid="read-aloud-notice"');
    const awakeAt = TTS.indexOf('data-testid="screen-awake-row"');
    expect(panelStart).toBeGreaterThan(0);
    expect(noticeAt).toBeGreaterThan(panelStart);
    expect(noticeAt).toBeLessThan(awakeAt);
  });

  it('there is exactly one notice block, and it is not in the fixed stack above the panel', () => {
    expect((TTS.match(/data-testid="read-aloud-notice"/g) || []).length).toBe(1);
    const stackStart = TTS.indexOf('className="tts-controls fixed');
    const interruptedAt = TTS.indexOf('data-testid="reading-interrupted"');
    const between = TTS.slice(stackStart, interruptedAt);
    expect(between).not.toMatch(/data-testid="read-aloud-notice"/);
  });

  it('the pill and the speaker button carry a mark when a notice is waiting', () => {
    expect((TTS.match(/data-testid="read-aloud-notice-mark"/g) || []).length).toBe(2);
    expect(TTS).toMatch(/aria-label=\{`A message is waiting: \$\{notice\}`\}/);
  });

  it('no timer takes the notice down while it is being read', () => {
    expect(TTS).not.toMatch(/setTimeout\(\(\) => setNotice\(''\), 12000\)/);
  });

  it('the door and the dismiss survive the move', () => {
    expect(TTS).toMatch(/data-testid="read-aloud-notice-action"/);
    expect(TTS).toMatch(/data-testid="read-aloud-notice-dismiss"/);
  });
});

describe('a 404 names the road, not the device', () => {
  it('says the studio’s door is not mounted and that the recording is safe', () => {
    const msg = voiceErrorReason('voice-service-404');
    expect(msg).toMatch(/not open right now \(HTTP 404\)/);
    expect(msg).toMatch(/not mounted/);
    expect(msg).toMatch(/Nothing on this device is wrong/);
    expect(msg).toMatch(/your recording is safe/);
  });
  it('other 4xx and 5xx keep the generic sentence', () => {
    expect(voiceErrorReason('voice-service-502')).toMatch(/HTTP 502/);
  });
});
