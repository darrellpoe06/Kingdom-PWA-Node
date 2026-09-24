// =============================================================================
// ConversationRecorder — record a conversation on the Notes box; the note is
// saved the moment Stop is tapped, and its words arrive later (DR-0624)
// =============================================================================
// Darrell, 2026-09-24: "I tried to record a conversation with me and a friend
// like a meeting note taker and it would not even save the note." This is the
// Record button beside Speak. It records AUDIO (the scribe's chunked recorder,
// wake lock, 3-hour self-stop), after one tap that everyone agreed to be
// recorded. It never shows "recording" over a microphone that gives silence.
// On Stop the note is saved under Your thoughts at once, marked
// Transcribing, the audio is kept on this phone until it is sent, and the
// words come back into the note (lib/recorded-note.js).
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { useWorkflowScribe, silenceMessage, SCRIBE_MAX_DURATION_MIN } from '../lib/workflow-scribe.js';
import { formatClock } from '../lib/lesson-voice.js';
import {
  recordingConsent, recordedNoteText, sendNoteRecording, audioKeeper,
  NOTE_RECORDING_AUDIO, NOTE_RECORDING_BITRATE,
} from '../lib/recorded-note.js';
import { relayThought } from '../lib/agent-inbox-sync.js';
import supabase from '../lib/supabase.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.75rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';

export function plainSendReason(reason) {
  if (reason === 'signed-out') return 'you are signed out';
  if (reason === 'no-account-id') return 'your account could not be read';
  if (/^upload:/.test(String(reason || ''))) return 'the upload did not go through';
  return String(reason || 'no connection');
}

export default function ConversationRecorder({
  addNote, patchNote = null, startRequest = 0,
  recorder = null, deps = null, keeper = null, onSaved = null,
}) {
  const own = useWorkflowScribe();
  const rec = recorder || own;
  const [step, setStep] = useState('idle'); // idle | consent | recording
  const [saved, setSaved] = useState('');
  const startedRef = useRef(false);
  const handledRef = useRef(null);

  // "Record instead" from the Speak box opens the consent step.
  useEffect(() => { if (startRequest) { setSaved(''); setStep('consent'); } }, [startRequest]);

  const begin = async () => {
    setSaved('');
    startedRef.current = true;
    const res = await rec.start({
      kind: 'meeting',
      consent: recordingConsent(new Date().toISOString()),
      audio: NOTE_RECORDING_AUDIO,
      audioBitsPerSecond: NOTE_RECORDING_BITRATE,
      measureLevel: true,
    });
    setStep(res && res.ok ? 'recording' : 'idle');
    if (!(res && res.ok)) startedRef.current = false;
  };

  // SAVE ON STOP. The note exists before any network call; nothing waits on
  // the upload, and a failed upload keeps the audio on this phone.
  useEffect(() => {
    const result = rec.result;
    if (!result || !startedRef.current || handledRef.current === result) return;
    handledRef.current = result;
    startedRef.current = false;
    setStep('idle');
    const seconds = (result.manifest && result.manifest.seconds) || 0;
    const noteId = `nt-${Date.now()}`;
    const silent = !!(result.measured && !result.heardSound);
    const voice = {
      status: 'uploading', seconds, silent,
      consent: (result.manifest && result.manifest.consent) || null,
      recordedAt: new Date().toISOString(),
    };
    addNote(recordedNoteText({ startedAtIso: result.manifest && result.manifest.startedAt, seconds }), { id: noteId, voice });
    setSaved(silent
      ? 'Saved under Your thoughts. The microphone gave only silence the whole time, so there may be no words to write. The recording is kept.'
      : 'Saved under Your thoughts. Transcribing… the words appear in the note when they are written.');
    if (onSaved) onSaved(noteId);
    const d = deps || { supabase, relay: relayThought };
    const keep = keeper || audioKeeper();
    (async () => {
      try { await keep.put(noteId, result.blob); } catch (_) { /* the send below is the other copy */ }
      const res = await sendNoteRecording({ blob: result.blob, seconds, noteId, ...d });
      if (res.ok) {
        if (patchNote) patchNote(noteId, { voice: { status: 'transcribing', inboxId: res.id, path: res.path } });
        try { await keep.del(noteId); } catch (_) { /* harmless */ }
      } else if (patchNote) {
        patchNote(noteId, { voice: { status: 'not-sent', reason: plainSendReason(res.reason) } });
      }
    })();
  }, [rec.result]); // eslint-disable-line react-hooks/exhaustive-deps

  const warning = rec.recording ? silenceMessage({ silentSeconds: rec.silentSeconds }) : '';

  if (!rec.micSupported) {
    return (
      <p className="text-[0.75rem] text-[#5A5751] italic mt-2" style={SERIF} data-testid="record-unsupported">
        This browser cannot record audio. Open PoeTech in Chrome or Safari to record a conversation.
      </p>
    );
  }

  return (
    <div className="mt-2 border border-[#E8E4DC] p-2.5 space-y-1.5" data-testid="conversation-recorder">
      {step === 'idle' && !rec.recording && (
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" data-testid="record-conversation" onClick={() => { setSaved(''); setStep('consent'); }}
            className={`${BTN} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}>
            Record a conversation
          </button>
          <span className="text-[0.75rem] text-[#5A5751]" style={SERIF}>
            For a meeting, a talk with a friend, or anything played out loud. It is saved as a note, and the words are written afterwards.
          </span>
        </div>
      )}
      {step === 'consent' && !rec.recording && (
        <div className="space-y-1.5" data-testid="record-consent">
          <p className="text-[0.8125rem] text-[#1A1815]" style={SERIF}>
            Illinois law: everyone in the conversation has to agree to be recorded.
          </p>
          <p className="text-[0.75rem] text-[#5A5751]" style={SERIF}>
            A phone call on this same phone cannot be recorded here, because the call holds the microphone. For a call, put it on speaker and record on a second device.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" data-testid="consent-start" onClick={begin}
              className={`${BTN} bg-[#B85838] text-white border-[#B85838]`}>
              Everyone here agreed. Start recording
            </button>
            <button type="button" onClick={() => setStep('idle')} className={`${BTN} border-[#E8E4DC] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      )}
      {rec.recording && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" data-testid="record-stop" onClick={rec.stop}
              className={`${BTN} bg-[#1A1815] text-white border-[#1A1815]`}>
              Stop and save
            </button>
            <span className="text-[0.8125rem] text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid="record-clock">
              {formatClock(rec.seconds)}
            </span>
            <span className="text-[0.75rem] text-[#5A5751]" style={SERIF}>stops by itself at {SCRIBE_MAX_DURATION_MIN / 60} hours</span>
          </div>
          {warning ? (
            <p role="alert" className="text-[0.8125rem] text-[#B85838] font-semibold" style={SERIF} data-testid="record-silence">{warning}</p>
          ) : (
            <p className="text-[0.75rem] text-[#5A6E3D]" style={SERIF} data-testid="record-hearing">
              {rec.heardSound ? 'Recording. The microphone is hearing sound.' : 'Recording. Checking the microphone…'} Keep the screen on and the phone between you.
            </p>
          )}
        </div>
      )}
      {rec.errorMessage && <p role="alert" className="text-[0.8125rem] text-[#B85838]" style={SERIF} data-testid="record-error">{rec.errorMessage}</p>}
      {saved && <p role="status" className="text-[0.8125rem] text-[#5A6E3D] font-semibold" style={SERIF} data-testid="record-saved">{saved}</p>}
    </div>
  );
}
