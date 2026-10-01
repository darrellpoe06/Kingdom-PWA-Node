// =============================================================================
// AddMyVoice — a person adds their own voice, with their own consent, so a
// class recording puts their name beside their words; and can take it back
// (DR-0720)
// =============================================================================
// Darrell, 2026-10-01: "can we somehow validate people using only their voice
// so we can tag people who are speaking when we record?" / "Can you get my
// voice the same way?"
//
// Lives in My profile (the header face, and the Engagement tab's My profile),
// and is linked from the lesson recorder and Your lessons (AddMyVoiceLink).
// Every state on screen is read from the person's own voice_enrollments row
// (lib/voice-enroll.js), written by the database or by the NAS: nothing here
// claims a voice is added until the NAS has said so.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import supabase from '../lib/supabase.js';
import {
  VOICE_PASSAGE, VOICE_CONSENT_POINTS, MAX_SAMPLE_SECONDS, MIN_SAMPLE_SECONDS,
  loadMyVoice, agreeToVoice, sendVoiceSample, removeMyVoice, loadVoiceLabels,
  voiceState, suggestLabel, normalizeLabel, labelProblem, sampleProblem,
} from '../lib/voice-enroll.js';
import { useWorkflowScribe, buildConsent, takeVerdict, formatBytes } from '../lib/workflow-scribe.js';
import { formatClock } from '../lib/lesson-voice.js';
import { NOTE_RECORDING_AUDIO, NOTE_RECORDING_BITRATE } from '../lib/recorded-note.js';
import { mayCompareVersions } from '../lib/lesson-versions.js';
import { confirmThen } from '../lib/confirm-action.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const BTN = 'text-[0.75rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const TONE = { added: 'text-[#5A6E3D]', refused: 'text-[#B85838]', waiting: 'text-[#8B6F47]', consented: 'text-[#2A5A8E]', none: 'text-[#5A5751]' };

// The live client, read defensively: a screen that mounts My profile in a test
// with a partial mock of lib/supabase.js still renders (signed out).
function liveSupabase() {
  try { return supabase; } catch (_) { return null; }
}

export default function AddMyVoice({ deps = null, recorder = null }) {
  const db = (deps && deps.supabase) || liveSupabase();
  const own = useWorkflowScribe();
  const rec = recorder || own;
  const [state, setState] = useState({ loading: true, ok: false, row: null, reason: '' });
  const [who, setWho] = useState({ uid: '', email: '' });
  const [name, setName] = useState('');
  const [letters, setLetters] = useState('');
  const [keep, setKeep] = useState(false);
  const [take, setTake] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [labels, setLabels] = useState([]);
  const startedRef = useRef(false);
  const handledRef = useRef(null);

  const load = useCallback(async () => {
    const r = await loadMyVoice({ supabase: db });
    setState({ loading: false, ...r });
    try {
      const { data } = await db.auth.getSession();
      const u = data?.session?.user;
      if (u) setWho({ uid: u.id || '', email: u.email || '' });
    } catch (_) { /* signed out */ }
    if (r.ok) setLabels(await loadVoiceLabels({ supabase: db }));
  }, [db]);
  useEffect(() => { load(); }, [load]);

  const isGovernor = mayCompareVersions(who);

  // A sample stops itself at the ceiling.
  const { recording, seconds, stop } = rec;
  useEffect(() => { if (recording && seconds >= MAX_SAMPLE_SECONDS) stop(); }, [recording, seconds, stop]);
  useEffect(() => {
    const r = rec.result;
    if (!r || !startedRef.current || handledRef.current === r) return;
    handledRef.current = r;
    startedRef.current = false;
    setTake({ blob: r.blob, url: r.url || '', seconds: (r.manifest && r.manifest.seconds) || 0, verdict: takeVerdict(r) });
  }, [rec.result]);

  const begin = async () => {
    startedRef.current = true;
    setTake(null);
    setMsg('');
    const res = await rec.start({
      kind: 'meeting',
      consent: buildConsent([{ name: 'The speaker', consented: true }]),
      audio: NOTE_RECORDING_AUDIO,
      audioBitsPerSecond: NOTE_RECORDING_BITRATE,
      measureLevel: true,
      timesliceMs: 1000,
    });
    if (!(res && res.ok)) startedRef.current = false;
  };

  const agree = async () => {
    const l = normalizeLabel(letters || suggestLabel(name));
    const problem = labelProblem(l, { isGovernor });
    if (problem) { setMsg(problem); return; }
    setBusy(true);
    const r = await agreeToVoice({ supabase: db, label: l, displayName: name, keepSample: keep, isGovernor });
    setBusy(false);
    setMsg(r.ok ? 'Thank you. Your consent is recorded with the time. Now read the psalm aloud.' : r.reason);
    if (r.ok) load();
  };

  const send = async () => {
    setBusy(true);
    const r = await sendVoiceSample({ supabase: db, blob: take.blob, seconds: take.seconds });
    setBusy(false);
    if (r.ok) { setTake(null); setMsg(''); load(); return; }
    setMsg(r.reason === 'consent-required' ? 'Agree first: no voice is taken without your consent.' : r.reason);
  };

  const remove = async () => {
    setBusy(true);
    const r = await removeMyVoice({ supabase: db });
    setBusy(false);
    setMsg(r.ok ? r.line : `Not removed: ${r.reason}`);
    if (r.ok) { setTake(null); load(); }
  };

  if (state.loading) return <p className="text-[0.75rem] text-[#5A5751]" style={SERIF} data-testid="add-my-voice">Reading your voice…</p>;
  if (!state.ok && state.reason === 'signed-out') {
    return <p className="text-[0.75rem] text-[#5A5751]" style={SERIF} data-testid="add-my-voice">Sign in to add your voice.</p>;
  }

  const row = state.row;
  const vs = voiceState(row);
  const takeProblem = take ? (take.verdict && !take.verdict.ok ? take.verdict.reason : sampleProblem(take)) : '';

  return (
    <section className="border border-[#E8E4DC] p-3 space-y-2 bg-white" aria-label="Add my voice" data-testid="add-my-voice">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Add my voice</h3>
      {!state.ok && <p role="alert" className="text-[0.75rem] text-[#B85838]" style={SERIF}>Your voice could not be read ({state.reason}).</p>}
      <p className={`text-[0.8125rem] font-semibold ${TONE[vs.state]}`} style={SERIF} role="status" data-testid="voice-status" data-state={vs.state}>{vs.line}</p>

      {state.ok && !row && (
        <div className="space-y-2" data-testid="voice-consent">
          <p className="text-[0.8125rem] text-[#1A1815]" style={SERIF}>When a class is recorded, our own machine can tell voices apart. If you add your voice, your words are marked with your name. Please read this first:</p>
          <ul className="list-disc pl-5 space-y-1">
            {VOICE_CONSENT_POINTS.map((p) => <li key={p} className="text-[0.75rem] text-[#1A1815]" style={SERIF}>{p}</li>)}
          </ul>
          <label className="block"><span className={LABEL}>Your name, as the transcript shows it</span>
            <input className={FIELD} value={name} maxLength={80} data-testid="voice-name"
              onChange={(e) => { setName(e.target.value); if (!letters) setMsg(''); }} placeholder="e.g., Jane Mercy" /></label>
          <label className="block"><span className={LABEL}>Your letters (two or three)</span>
            <input className={FIELD} value={letters} maxLength={3} data-testid="voice-letters" style={MONO}
              onChange={(e) => setLetters(e.target.value.toUpperCase())} placeholder={suggestLabel(name) || 'JM'} /></label>
          <label className="flex items-start gap-2 text-[0.75rem] text-[#1A1815]" style={SERIF}>
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} data-testid="voice-keep" className="mt-1" />
            Keep my recording on our home server too (so the signature can be remade later). Leave this off and it is deleted.
          </label>
          <button type="button" disabled={busy} onClick={agree} data-testid="voice-agree" className={`${BTN} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}>I agree — add my voice</button>
        </div>
      )}

      {row && (
        <div className="space-y-2" data-testid="voice-record">
          <p className="text-[0.75rem] text-[#5A5751]" style={SERIF}>
            {vs.added ? 'To refresh your signature, read the psalm again.' : `Read this aloud at an even pace, alone in a quiet room. It takes about 25 seconds (at least ${MIN_SAMPLE_SECONDS}).`}
          </p>
          <blockquote className="border-l-2 border-[#C9BFA8] pl-3" data-testid="voice-passage">
            <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={MONO}>{VOICE_PASSAGE.translation} — {VOICE_PASSAGE.ref}</p>
            {VOICE_PASSAGE.verses.map((v, i) => <p key={i} className="text-sm text-[#1A1815]" style={SERIF}><sup className="text-[#5A5751]">{i + 1}</sup> {v}</p>)}
          </blockquote>
          {!rec.micSupported && <p className="text-[0.75rem] text-[#5A5751] italic" style={SERIF}>This browser cannot record audio. Open PoeTech in Chrome or Safari to add your voice.</p>}
          {rec.micSupported && (
            <div className="flex items-center gap-2 flex-wrap">
              {!rec.recording && <button type="button" disabled={busy} onClick={begin} data-testid="voice-record-start" className={`${BTN} border-[#B85838] text-[#B85838]`}>{take ? 'Record again' : 'Start reading'}</button>}
              {rec.recording && <button type="button" onClick={rec.stop} data-testid="voice-record-stop" className={`${BTN} bg-[#B85838] text-white border-[#B85838]`}>Stop</button>}
              {(rec.recording || take) && <span className="text-[0.75rem] text-[#5A5751]" style={MONO}>{formatClock(rec.recording ? rec.seconds : take.seconds)}{rec.recording ? ` · ${formatBytes(rec.bytes)}` : ''}</span>}
            </div>
          )}
          {!rec.recording && take && (
            <div className="space-y-1">
              {take.url && take.blob && take.blob.size > 0 && <audio controls src={take.url} className="h-9 w-full" />}
              {takeProblem
                ? <p role="alert" className="text-[0.8125rem] text-[#B85838]" style={SERIF} data-testid="voice-take-problem">{takeProblem}</p>
                : <button type="button" disabled={busy} onClick={send} data-testid="voice-send" className={`${BTN} bg-[#1A1815] text-white border-[#1A1815]`}>Send my voice</button>}
            </div>
          )}
          {rec.errorMessage && <p role="alert" className="text-[0.75rem] text-[#B85838]" style={SERIF}>{rec.errorMessage}</p>}
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={load} className={`${BTN} border-[#E8E4DC] text-[#5A5751]`}>Check again</button>
            <button type="button" disabled={busy} data-testid="voice-remove"
              onClick={confirmThen('Remove your voice? Your voice signature and your consent are deleted, and class recordings show you as S1, S2 again.', remove)}
              className={`${BTN} border-[#C9BFA8] text-[#5A5751]`}>Remove my voice</button>
          </div>
        </div>
      )}

      {msg && <p className="text-[0.75rem] text-[#1A1815]" style={SERIF} role="status" data-testid="voice-message">{msg}</p>}

      {labels.length > 0 && (
        <div data-testid="voice-labels">
          <p className={LABEL}>Voices added (labels only; the signatures stay on the NAS)</p>
          <ul className="text-[0.75rem] text-[#1A1815]" style={MONO}>
            {labels.map((l) => <li key={l.label}>{l.label} · {l.display_name || '—'} · {l.enrolled_at ? 'added' : l.status}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
