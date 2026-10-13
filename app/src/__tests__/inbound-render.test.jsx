// @vitest-environment jsdom
// =============================================================================
// Inbound — the sovereign visual voicemail row, rendered
// =============================================================================
// Darrell 2026-07-29 (two carrier-app screenshots): the third-party app paywalls
// "READ YOUR VOICEMAILS — GO PREMIUM" (transcription) behind a CALL/MESSAGE bar.
// PoeTech does it natively and free. These tests pin the whole row a user meets:
//   · unconfigured Worker -> the REAL connect form, never a fake voicemail (DR-0076)
//   · configured -> play (audio) + FREE transcript + Call back (tel:) + Text back (sms:)
//   · an undialable caller -> NO Call/Text buttons (buildCallerActions refuses to
//     paint a dead action)
// Proven-to-catch: all of it fails if the reply row or the honest-state form is
// removed. Companion to inbound-convert.test.js (pure helpers) — this is the DOM.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Inbound from '../components/Inbound.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

const linkByText = (re) => Array.from(container.querySelectorAll('a')).find((a) => re.test(a.textContent || ''));

describe('Inbound — honest state when the Worker is not configured', () => {
  it('shows the real connect form (never a painted voicemail) when apiUrl/token are absent', () => {
    act(() => root.render(createElement(Inbound, { voiceOps: {}, setVoiceOpsConfig: () => {} })));
    expect(container.textContent).toContain('First-time setup');
    expect(container.querySelector('audio')).toBeNull(); // no fake rows
  });
});

describe('Inbound — the sovereign visual voicemail row (configured)', () => {
  const rows = [
    { id: 'r1', line: 'poe-properties', caller: '+12175551234', transcript: 'leak in 4B, please call back',
      voicemail_url: 'https://worker.test/rec/r1.mp3', voicemail_dur_sec: 12, status: 'new', created_at: '2026-07-29T08:50:00Z' },
    { id: 'r2', line: 'poetech', caller: 'unknown', transcript: 'anonymous note',
      voicemail_url: 'https://worker.test/rec/r2.mp3', voicemail_dur_sec: 3, status: 'new', created_at: '2026-07-29T08:40:00Z' },
  ];

  async function renderConfigured() {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ rows }), text: async () => '' })));
    await act(async () => {
      root.render(createElement(Inbound, { voiceOps: { apiUrl: 'https://api.test', apiToken: 'tok' }, setVoiceOpsConfig: () => {} }));
    });
    // let the mount fetch's microtasks flush into state
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  }

  it('plays the audio and shows the FREE transcript (the thing the carrier app paywalls)', async () => {
    await renderConfigured();
    const audio = container.querySelector('audio');
    expect(audio).toBeTruthy();
    expect(audio.getAttribute('src')).toContain('.mp3');
    expect(container.textContent).toContain('leak in 4B, please call back');
  });

  it('renders Call back (tel:) and Text back (sms:) for a dialable caller', async () => {
    await renderConfigured();
    const call = linkByText(/Call back/);
    const text = linkByText(/Text back/);
    expect(call).toBeTruthy();
    expect(call.getAttribute('href')).toBe('tel:+12175551234');
    expect(text).toBeTruthy();
    expect(text.getAttribute('href').startsWith('sms:+12175551234?')).toBe(true);
    expect(decodeURIComponent(text.getAttribute('href'))).toContain('Steward Real Estate');
  });

  it('refuses to paint Call/Text for an undialable caller — exactly one reply row total', async () => {
    await renderConfigured();
    // Two rows rendered, but only the dialable one gets a reply row.
    expect(Array.from(container.querySelectorAll('a')).filter((a) => /Call back/.test(a.textContent || '')).length).toBe(1);
    expect(Array.from(container.querySelectorAll('a')).filter((a) => /Text back/.test(a.textContent || '')).length).toBe(1);
    // The anonymous row is still present (transcript shown) — just no dead buttons.
    expect(container.textContent).toContain('anonymous note');
  });
});

describe('Messages wires the Voicemail sub-tab to the SAME Inbound component (no fork)', () => {
  it('mounts <Inbound> under a Voicemail tab and links to the full Inbound tab', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../components/Messages.jsx'), 'utf8');
    expect(src).toContain("import Inbound from './Inbound.jsx'");
    expect(src).toContain("['voicemail', 'Voicemail']");
    expect(src).toContain("tab === 'voicemail'");
    expect(src).toContain("setView('inbound')"); // "Open full Inbound ->" cross-link
    expect(src).toContain('voiceOps={voiceOps}'); // real config threaded, not a stub
  });
});
