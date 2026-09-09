// live-player-prefs — one remembered choice for both players (Darrell 2026-09-09).
import { describe, it, expect, beforeEach } from 'vitest';
import { __resetLivePlayerPrefs, getLivePlayerScale, setLivePlayerScale, setLiveBarCollapsed, LIVE_PLAYER_SCALE_KEY, LIVE_BAR_COLLAPSED_KEY } from '../lib/live-player-prefs.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, rel), 'utf8');

beforeEach(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ } __resetLivePlayerPrefs(); });

describe('the scale is remembered on the device and defaults to medium', () => {
  it('defaults to m; a choice persists; a bad value is refused', () => {
    expect(getLivePlayerScale()).toBe('m');
    setLivePlayerScale('l');
    expect(getLivePlayerScale()).toBe('l');
    expect(localStorage.getItem(LIVE_PLAYER_SCALE_KEY)).toBe('l');
    setLivePlayerScale('huge');
    expect(getLivePlayerScale()).toBe('l');
  });
  it('the bar\'s hide-video choice is a SESSION memory, never a device one', () => {
    setLiveBarCollapsed(true);
    expect(sessionStorage.getItem(LIVE_BAR_COLLAPSED_KEY)).toBe('1');
    expect(localStorage.getItem(LIVE_BAR_COLLAPSED_KEY)).toBeNull();
    setLiveBarCollapsed(false);
    expect(sessionStorage.getItem(LIVE_BAR_COLLAPSED_KEY)).toBeNull();
  });
});

describe('PROVEN-TO-CATCH: both players read the ONE store — no private size state may return', () => {
  it('ChurchHome takes its scale from useLivePlayerPrefs and writes through setLivePlayerScale', () => {
    const src = read('../components/ChurchHome.jsx');
    expect(src).toMatch(/const \{ scale: playerScale \} = useLivePlayerPrefs\(\)/);
    expect(src).toMatch(/const setPlayerScale = setLivePlayerScale/);
    expect(src).not.toMatch(/useState\('m'\)/);
  });
  it('LiveWorshipBar takes scale + collapsed from the store and sizes its frame by barFrameStyle', () => {
    const src = read('../components/LiveWorshipBar.jsx');
    expect(src).toMatch(/const \{ scale, barCollapsed: collapsed \} = useLivePlayerPrefs\(\)/);
    expect(src).toMatch(/style=\{barFrameStyle\(scale\)\}/);
    expect(src).not.toMatch(/useState\(false\); *\/\/ collapsed|const \[collapsed, setCollapsed\] = useState/);
    expect(src).not.toMatch(/max-w-4xl/);
  });
});
