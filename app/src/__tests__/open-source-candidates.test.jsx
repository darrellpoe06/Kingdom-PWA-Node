// =============================================================================
// THE TEN TOOLS ARE WEIGHED, NOT ADOPTED BY HABIT (DR-1099)
// =============================================================================
// Pins:
//   * the real register passes its own gate, all ten tools, each pinned to the
//     exact commit that was read;
//   * PROVEN-TO-CATCH: every rule in validateCandidates is broken on purpose and
//     must be named (an agent piloted without its three brakes, a pin that is
//     not a commit, an AGPL tool that does not say so, a pilot with no machine,
//     a missing re-review date, a gap that does not exist);
//   * the verdicts the record decided: five pilots, one hold, four declines,
//     and no tool that can run code is a pilot;
//   * the Infra Plan section renders each verdict, opens a tool's detail in
//     place under its own button, and says when a touched gap has passed its
//     re-review.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  OPEN_SOURCE_CANDIDATES, validateCandidates, summarizeCandidates, touchedGaps, pinnedUrl,
} from '../lib/open-source-candidates.js';
import OpenSourceCandidates from '../components/OpenSourceCandidates.jsx';
import ChurchInfraPlan from '../components/ChurchInfraPlan.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const byId = (id) => OPEN_SOURCE_CANDIDATES.find((c) => c.id === id);
const broken = (id, patch) => OPEN_SOURCE_CANDIDATES.map((c) => (c.id === id ? { ...c, ...patch } : c));

describe('the register', () => {
  it('passes its own gate', () => {
    const v = validateCandidates();
    expect(v.errors).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('holds the ten tools from the first video and the three from the home-server video, each pinned to a commit', () => {
    expect(OPEN_SOURCE_CANDIDATES.map((c) => c.id).sort()).toEqual(
      ['ace-step', 'audiobookshelf', 'dyad', 'freellmapi', 'immich', 'invokeai', 'jellyfin', 'odysseus', 'openmanus', 'openshorts', 'upscayl', 'vane', 'voicestudio'],
    );
    expect(OPEN_SOURCE_CANDIDATES.filter((c) => c.drRef === 'DR-1119').map((c) => c.id).sort()).toEqual(['audiobookshelf', 'immich', 'jellyfin']);
    for (const c of OPEN_SOURCE_CANDIDATES) expect(c.pin.sha).toMatch(/^[0-9a-f]{40}$/);
    expect(pinnedUrl(byId('invokeai'))).toBe('https://github.com/invoke-ai/InvokeAI/tree/438246b846391385b074eae82bdbc82df2938007');
  });

  it('records the verdicts DR-1099 and DR-1119 decided', () => {
    const s = summarizeCandidates();
    // Jellyfin and Audiobookshelf were holds for a day: Darrell 2026-10-19,
    // "Why can't we use them for our audio tts... etc..." -- the shelves exist
    // (the voice's lesson readings, the sermon harvests), so they are pilots.
    expect(s.byVerdict).toEqual({ pilot: 8, hold: 1, decline: 4 });
    expect(OPEN_SOURCE_CANDIDATES.filter((c) => c.verdict === 'pilot').map((c) => c.id).sort())
      .toEqual(['ace-step', 'audiobookshelf', 'immich', 'invokeai', 'jellyfin', 'openshorts', 'upscayl', 'vane']);
    expect(OPEN_SOURCE_CANDIDATES.filter((c) => c.canExecuteCode && c.verdict === 'pilot')).toEqual([]);
    expect(s.byPlace).toEqual({ nas: 4, 'dev-gpu-node-1': 3, 'dev-gpu-node-2': 1 });
    // Only what is built says so; the rest is not installed (never a painted status).
    expect(OPEN_SOURCE_CANDIDATES.filter((c) => c.builtRef).map((c) => c.id)).toEqual(['vane', 'immich']);
  });

  it('never pilots InvokeAI from its alpha branch', () => {
    expect(byId('invokeai').pin.ref).toBe('v6.14.2');
  });
});

describe('the gate catches each break (proven to catch)', () => {
  const fails = (list, re) => {
    const v = validateCandidates(list);
    expect(v.ok).toBe(false);
    expect(v.errors.join('\n')).toMatch(re);
  };
  it('an agent piloted without its three brakes', () => {
    fails(broken('openmanus', { verdict: 'pilot', placement: 'dev-gpu-node-2', frontedBy: 'a forwarder' }), /openmanus: a tool that can run code cannot be piloted without its budget/);
  });
  it('a pin that is not a commit', () => {
    fails(broken('vane', { pin: { ref: 'v1.12.2', sha: 'latest' } }), /vane: pin needs a ref and a 40-character commit/);
  });
  it('an AGPL tool that does not say so', () => {
    fails(broken('upscayl', { codeLicense: 'Open source', constraints: ['No tests.'] }), /upscayl: an AGPL tool must say so/);
  });
  it('a pilot with no machine, and a decline placed on one', () => {
    fails(broken('vane', { placement: 'none' }), /vane: a pilot must name the machine/);
    fails(broken('dyad', { placement: 'nas' }), /dyad: only a pilot is placed on a machine/);
  });
  it('a pilot with nothing in front of it', () => {
    fails(broken('openshorts', { frontedBy: 'Not placed' }), /openshorts: a pilot must say what stands in front of it/);
  });
  it('a missing or backdated re-review', () => {
    fails(broken('ace-step', { reReview: 'soon' }), /ace-step: missing re-review date/);
    fails(broken('ace-step', { reReview: '2026-01-01' }), /ace-step: re-review 2026-01-01 is before the record/);
  });
  it('a gap that is not recorded', () => {
    fails(broken('invokeai', { gapRef: 'gap-imaginary' }), /invokeai: gapRef "gap-imaginary" is not a recorded sovereignty gap/);
  });
  it('a duplicate tool and an unknown verdict', () => {
    fails([...OPEN_SOURCE_CANDIDATES, byId('vane')], /vane: duplicate id/);
    fails(broken('vane', { verdict: 'adopt' }), /vane: unknown verdict "adopt"/);
  });
});

describe('the gaps these tools touch', () => {
  it('says when a gap has passed its re-review', () => {
    const g = touchedGaps('2026-10-18');
    const voice = g.find((x) => x.id === 'gap-voice-clone');
    expect(voice.candidates).toEqual(['VoiceStudio']);
    expect(voice.overdue).toBe(true);
    expect(touchedGaps('2026-01-01').every((x) => x.overdue === false)).toBe(true);
  });
});

describe('the Infra Plan section', () => {
  let host; let root;
  beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const text = () => host.textContent.replace(/\s+/g, ' ');

  it('renders every verdict group and every tool, with no detail open', async () => {
    await act(async () => { root.render(createElement(OpenSourceCandidates, { today: '2026-10-18' })); });
    const t = text();
    expect(t).toMatch(/Open-source tools, weighed/);
    expect(t).toMatch(/8 bring home next/);
    expect(t).toMatch(/1 hold/);
    expect(t).toMatch(/4 decline/);
    for (const c of OPEN_SOURCE_CANDIDATES) expect(t).toContain(c.name);
    // The header is counted from the rows: which record weighed how many, and what is built.
    expect(t).toMatch(/10 under DR-1099, 3 under DR-1119/);
    expect(t).toMatch(/Built: Vane \(DR-1101\), Immich \(DR-1120\)\. The rest are not installed\./);
    expect(t).toMatch(/Immich: the phones’ photos, backed up at home/);
    expect(t).not.toMatch(/None of them is installed yet/);
    expect(host.querySelectorAll('[aria-expanded="true"]').length).toBe(0);
    expect(t).not.toMatch(/Leaves our network/);
    expect(t).toMatch(/has passed/);
  });

  it('opens one tool’s detail in place under its own button, and closes it', async () => {
    await act(async () => { root.render(createElement(OpenSourceCandidates, { today: '2026-10-18' })); });
    const article = [...host.querySelectorAll('article')].find((a) => /OpenManus/.test(a.getAttribute('aria-label')));
    const btn = article.querySelector('button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    await act(async () => { btn.click(); });
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const detail = article.querySelector(`#${btn.getAttribute('aria-controls')}`);
    expect(detail).not.toBeNull();
    expect(detail.textContent).toMatch(/use_sandbox is false by default/);
    expect(detail.querySelector('a').getAttribute('href')).toMatch(/FoundationAgents\/OpenManus\/tree\/[0-9a-f]{40}$/);
    expect(host.querySelectorAll('[aria-expanded="true"]').length).toBe(1);
    await act(async () => { btn.click(); });
    expect(article.querySelector(`#${btn.getAttribute('aria-controls')}`)).toBeNull();
  });

  it('is mounted on the Infra Plan', async () => {
    await act(async () => { root.render(createElement(ChurchInfraPlan)); });
    expect(text()).toMatch(/Open-source tools, weighed/);
    expect(text()).toMatch(/Church Infrastructure Plan/);
  });
});
