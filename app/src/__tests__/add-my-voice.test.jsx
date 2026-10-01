// =============================================================================
// Add my voice (DR-0720): consent before any upload, the sample only in the
// person's own folder, removal deletes the consent and says so, the held
// labels, the psalm verbatim from the KJV on disk, and the screen showing
// only what the person's own row says.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VOICE_PASSAGE, VOICE_CONSENT_TEXT, VOICE_CONSENT_POINTS, sendVoiceSample, removeMyVoice, agreeToVoice,
  labelProblem, suggestLabel, normalizeLabel, voiceState, sampleProblem, loadVoiceLabels,
} from '../lib/voice-enroll.js';
import AddMyVoice from '../components/AddMyVoice.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const UID = 'f13843f2-742b-4f8a-82af-7ecfbdc536ec';
const NOW = Date.parse('2026-10-01T15:30:00Z');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function fakeSupabase({ uid = UID, row = null, rpcErrors = {}, rpcData = {} } = {}) {
  const calls = { upload: [], remove: [], rpc: [], select: 0 };
  return {
    calls,
    auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid, email: 'member@example.test' } } : null } }) },
    from: (t) => ({
      select: () => ({
        eq: (col, val) => ({
          maybeSingle: async () => { calls.select += 1; return { data: t === 'voice_enrollments' && val === uid ? row : null, error: null }; },
        }),
      }),
    }),
    rpc: async (name, args) => {
      calls.rpc.push({ name, args });
      if (rpcErrors[name]) return { data: null, error: { message: rpcErrors[name] } };
      return { data: rpcData[name] ?? { ok: true }, error: null };
    },
    storage: {
      from: (b) => ({
        upload: async (path, body, opts) => { calls.upload.push({ b, path, opts }); return { error: null }; },
        remove: async (paths) => { calls.remove.push({ b, paths }); return { error: null }; },
      }),
    },
  };
}
const blob = (size = 4096, type = 'audio/webm') => ({ size, type });
const consented = { user_id: UID, label: 'JM', display_name: 'Jane Mercy', status: 'consented', enrolled_at: null };

describe('the psalm is the Word, verbatim', () => {
  it('matches Psalm 23 in the KJV on disk, word for word', () => {
    const kjv = JSON.parse(readFileSync(join(HERE, '../../public/bible/kjv/Psalms.json'), 'utf8'));
    expect(VOICE_PASSAGE.verses).toEqual(kjv.chapters[22]);
    expect(VOICE_PASSAGE.translation).toBe('KJV');
  });
});

describe('consent comes before any upload', () => {
  it('PROVEN TO CATCH: with no consent row, nothing is uploaded and nothing is filed', async () => {
    const sb = fakeSupabase({ row: null });
    const r = await sendVoiceSample({ supabase: sb, blob: blob(), seconds: 25, nowMs: NOW });
    expect(r).toEqual({ ok: false, reason: 'consent-required' });
    expect(sb.calls.select).toBe(1); // the database was asked
    expect(sb.calls.upload).toEqual([]);
    expect(sb.calls.rpc).toEqual([]);
  });

  it('signed out: nothing leaves the device', async () => {
    const sb = fakeSupabase({ uid: null });
    const r = await sendVoiceSample({ supabase: sb, blob: blob(), seconds: 25, nowMs: NOW });
    expect(r.ok).toBe(false);
    expect(sb.calls.upload).toEqual([]);
  });

  it('with consent, the sample goes to the person\'s own folder and is filed for the NAS', async () => {
    const sb = fakeSupabase({ row: consented });
    const r = await sendVoiceSample({ supabase: sb, blob: blob(), seconds: 25, nowMs: NOW, suffix: 'v1' });
    expect(r.ok).toBe(true);
    expect(sb.calls.upload[0].b).toBe('lesson-audio');
    expect(sb.calls.upload[0].path).toBe(`${UID}/20261001T153000Z-v1.webm`);
    expect(sb.calls.rpc).toEqual([{ name: 'send_voice_sample', args: { p_path: `${UID}/20261001T153000Z-v1.webm` } }]);
  });

  it('a refused filing removes the upload, so nothing waits without consent', async () => {
    const sb = fakeSupabase({ row: consented, rpcErrors: { send_voice_sample: 'send_voice_sample: agree first; no voice is taken without consent' } });
    const r = await sendVoiceSample({ supabase: sb, blob: blob(), seconds: 25, nowMs: NOW, suffix: 'v1' });
    expect(r).toEqual({ ok: false, reason: 'agree first; no voice is taken without consent' });
    expect(sb.calls.remove).toEqual([{ b: 'lesson-audio', paths: [`${UID}/20261001T153000Z-v1.webm`] }]);
  });

  it('too short or empty is refused before upload', async () => {
    expect(sampleProblem({ blob: blob(), seconds: 9 })).toMatch(/at least 15 seconds/);
    expect(sampleProblem({ blob: blob(0), seconds: 25 })).toBe('Nothing was recorded.');
    const sb = fakeSupabase({ row: consented });
    expect((await sendVoiceSample({ supabase: sb, blob: blob(), seconds: 9, nowMs: NOW })).ok).toBe(false);
    expect(sb.calls.upload).toEqual([]);
  });
});

describe('the consent is plain and recorded', () => {
  it('says what is kept, where, what for, and that it can be removed', () => {
    const t = VOICE_CONSENT_POINTS.join(' ');
    expect(t).toMatch(/list of numbers/);
    expect(t).toMatch(/not the recording/);
    expect(t).toMatch(/our own server at home \(the NAS\)/);
    expect(t).toMatch(/never sent to a cloud company/);
    expect(t).toMatch(/put your name beside your words/);
    expect(t).toMatch(/remove your voice at any time/);
  });

  it('the tap to agree sends the exact words and the chosen letters', async () => {
    const sb = fakeSupabase();
    const r = await agreeToVoice({ supabase: sb, label: 'jm', displayName: ' Jane Mercy ', keepSample: false });
    expect(r.ok).toBe(true);
    expect(sb.calls.rpc[0]).toEqual({ name: 'give_voice_consent', args: { p_label: 'JM', p_display_name: 'Jane Mercy', p_consent_text: VOICE_CONSENT_TEXT, p_keep_sample: false } });
  });

  it('BG is held; DP is Darrell\'s alone; letters are two or three', async () => {
    expect(labelProblem('BG')).toMatch(/Bishop Gwin/);
    expect(labelProblem('DP')).toMatch(/Darrell Poe/);
    expect(labelProblem('DP', { isGovernor: true })).toBe('');
    expect(labelProblem('J')).toMatch(/two or three/);
    expect(labelProblem('S1')).toMatch(/two or three/);
    expect(normalizeLabel(' jm ')).toBe('JM');
    expect(suggestLabel('Jane Mercy')).toBe('JM');
    const sb = fakeSupabase();
    expect((await agreeToVoice({ supabase: sb, label: 'BG' })).ok).toBe(false);
    expect(sb.calls.rpc).toEqual([]);
  });
});

describe('Remove my voice', () => {
  it('deletes the consent, removes a waiting sample, and says so', async () => {
    const sb = fakeSupabase({ rpcData: { remove_my_voice: { removed: true, label: 'JM', sample_path: `${UID}/a.webm` } } });
    const r = await removeMyVoice({ supabase: sb });
    expect(sb.calls.rpc).toEqual([{ name: 'remove_my_voice', args: undefined }]);
    expect(sb.calls.remove).toEqual([{ b: 'lesson-audio', paths: [`${UID}/a.webm`] }]);
    expect(r.line).toMatch(/Your voice is removed/);
    expect(r.line).toMatch(/consent is deleted now/);
    expect(r.line).toMatch(/not used from this moment/);
  });

  it('nothing to remove is said plainly', async () => {
    const sb = fakeSupabase({ rpcData: { remove_my_voice: { removed: false, label: null, sample_path: null } } });
    expect((await removeMyVoice({ supabase: sb })).line).toBe('There was no voice to remove.');
  });
});

describe('the state is read from the row, never claimed', () => {
  it('names each state', () => {
    expect(voiceState(null).state).toBe('none');
    expect(voiceState(consented).state).toBe('consented');
    expect(voiceState({ ...consented, status: 'sample-sent' }).line).toMatch(/sample is sent/);
    expect(voiceState({ ...consented, status: 'refused', reason: 'The recording was too short.' }).line).toMatch(/not added\. The recording was too short/);
    const added = voiceState({ ...consented, status: 'enrolled', enrolled_at: '2026-10-01T16:00:00Z' });
    expect(added.state).toBe('added');
    expect(added.line).toBe('Your voice is added. Class recordings show your words as JM (Jane Mercy).');
  });

  it('the label list is empty for anyone the database refuses', async () => {
    const sb = fakeSupabase({ rpcErrors: { voice_enrollment_labels: 'only the Governor' } });
    expect(await loadVoiceLabels({ supabase: sb })).toEqual([]);
  });
});

describe('the screen', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const rec = { micSupported: true, recording: false, seconds: 0, stop: () => {}, start: async () => ({ ok: true }), result: null, bytes: 0 };
  async function render(sb) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<AddMyVoice deps={{ supabase: sb }} recorder={rec} />); });
    await act(async () => {});
  }
  const q = (id) => container.querySelector(`[data-testid="${id}"]`);

  it('without consent: the consent is shown and there is nothing to record', async () => {
    await render(fakeSupabase({ row: null }));
    expect(q('voice-consent')).not.toBeNull();
    expect(q('voice-record-start')).toBeNull();
    expect(q('voice-status').dataset.state).toBe('none');
  });

  it('with consent: the psalm and the recorder; added says so', async () => {
    await render(fakeSupabase({ row: { ...consented, status: 'enrolled', enrolled_at: '2026-10-01T16:00:00Z' } }));
    expect(q('voice-consent')).toBeNull();
    expect(q('voice-passage').textContent).toContain('The LORD is my shepherd; I shall not want.');
    expect(q('voice-record-start')).not.toBeNull();
    expect(q('voice-status').textContent).toBe('Your voice is added. Class recordings show your words as JM (Jane Mercy).');
    expect(q('voice-remove')).not.toBeNull();
  });

  it('signed out: asks to sign in', async () => {
    await render(fakeSupabase({ uid: null }));
    expect(q('add-my-voice').textContent).toBe('Sign in to add your voice.');
  });
});
