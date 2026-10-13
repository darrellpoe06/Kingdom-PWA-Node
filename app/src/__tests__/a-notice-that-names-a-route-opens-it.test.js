// Telling someone where to go is not the same as taking them there.
//
// Darrell, 2026-09-22, on a read-aloud notice that said "Record a voice sample
// first": "also how can it do what it is claims to be able to do? I can't find
// how to do that add a voice?!!!!!!"
//
// The first fix named the tab and warned it might be behind the nav overflow.
// That was accurate and still wrong: it handed the finding back to him. The
// Voice tab is real (surfaces.js, id 'voice'), it is a scrolling top-nav strip,
// and on his phone it renders as "Voi" plus a chevron. A surface that tells a
// reader to do something in another tab should OPEN that tab.
//
// So a notice may now carry a door — { href, label } — and the panel draws it
// as a button. Three properties hold that honest, and each has a case here:
//
//   1. The address has to WORK from where the reader is standing. TTSControl is
//      mounted on four surfaces and three of them have no nav shell, so this is
//      a real href resolved against the current location, not a prop.
//   2. It has to keep him in HIS face of the app. A Love Corner visitor who
//      taps it must not land in the plain PoeTech app — that is precisely what
//      PRESERVED_PARAMS exists for.
//   3. A door must never outlive its message. A stale action under a new notice
//      would send someone somewhere the new message never meant.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hrefForView, PRESERVED_PARAMS } from '../lib/nav-history.js';

const r = (p) => readFileSync(resolve(__dirname, p), 'utf8');
const HOOK = r('../lib/use-read-aloud.js');
const TTS = r('../components/TTSControl.jsx');
const SURFACES = r('../surfaces.js');

describe('hrefForView builds an address that actually opens the tab', () => {
  it('writes the view the shell reads on boot', () => {
    expect(hrefForView('voice', { pathname: '/poetech-app/', search: '' }))
      .toBe('/poetech-app/?view=voice');
  });

  it('keeps the app base path, so the NAS build does not get sent to the site root', () => {
    expect(hrefForView('voice', { pathname: '/lovecorner/app/', search: '' }))
      .toMatch(/^\/lovecorner\/app\/\?/);
  });

  it('carries the door params through — a church visitor stays in the church face', () => {
    const href = hrefForView('voice', { pathname: '/lovecorner/app/', search: '?lovecorner=1&view=church' });
    expect(href).toContain('lovecorner=1');
    expect(href).toContain('view=voice');
    expect(href).not.toContain('view=church');
  });

  it('carries every preserved param, not a subset someone remembered', () => {
    const search = `?${PRESERVED_PARAMS.map((p) => `${p}=x`).join('&')}`;
    const href = hrefForView('voice', { pathname: '/', search });
    for (const p of PRESERVED_PARAMS) expect(href, p).toContain(`${p}=x`);
  });

  it('drops params that are NOT preserved, so a stale token does not ride along', () => {
    const href = hrefForView('voice', { pathname: '/', search: '?join=secret-token&view=books' });
    expect(href).not.toContain('join');
    expect(href).not.toContain('secret-token');
  });

  it('still returns a usable address when there is no search at all', () => {
    expect(hrefForView('voice', { pathname: '/', search: '' })).toBe('/?view=voice');
  });
});

describe('the voice notice hands over the door', () => {
  it('the hook attaches the Voice tab to that one message', () => {
    expect(HOOK).toMatch(/hrefForView\('voice'\)/);
    expect(HOOK).toMatch(/label: 'Open the Voice tab'/);
  });

  it('the tab it opens is a real route', () => {
    expect(SURFACES).toMatch(/id: 'voice',\s+label: 'Voice',\s+nav: 'top',\s+view: 'voice'/);
  });

  it('the panel draws it as a button', () => {
    expect(TTS).toMatch(/data-testid="read-aloud-notice-action"/);
    expect(TTS).toMatch(/href=\{noticeAction\.href\}/);
  });

  it('and draws nothing when a notice carries no door', () => {
    expect(TTS).toMatch(/\{noticeAction\?\.href && \(/);
  });
});

describe('a door never outlives its message', () => {
  it('the raw setter is wrapped, so an ordinary setNotice clears the action', () => {
    expect(HOOK).toMatch(/const \[notice, setNoticeRaw\] = useState\(''\);/);
    expect(HOOK).toMatch(/setNoticeAction\(msg \? action : null\);/);
  });

  it('the wrapper defaults the action to null rather than leaving the last one', () => {
    expect(HOOK).toMatch(/const setNotice = useCallback\(\(msg, action = null\) =>/);
  });

  it('the raw setter is not exported — only the wrapper is', () => {
    // Exporting setNoticeRaw would let a caller set a message while the old
    // door stayed underneath it, which is the exact failure the wrapper exists
    // to make impossible.
    const ret = HOOK.slice(HOOK.lastIndexOf('return {'));
    expect(ret).toMatch(/\n {4}setNotice,/);
    expect(ret).not.toMatch(/setNoticeRaw/);
    expect(ret).toMatch(/\n {4}noticeAction,/);
  });
});
