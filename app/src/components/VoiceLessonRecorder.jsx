// =============================================================================
// VoiceLessonRecorder — record a lesson on the Speak box; Whisper on our own
// machines turns it into words for the lesson intake (DR-0611)
// =============================================================================
// Shown on the Speak box only while the Lesson chip is chosen. Record, stop,
// listen back, then Send or Discard. Nothing is sent until Send. The send is
// lib/lesson-voice.js: the audio to the private lesson-audio bucket under the
// speaker's own folder, then one inbox row the NAS loop answers with the
// transcript. Failure is said here with its reason; the recording stays so it
// can be sent again.
// =============================================================================
import React, { useState, useEffect } from 'react';
import { useVoiceRecorder } from '../lib/voice-recording.js';
import { sendVoiceLesson, recordingProblem, formatClock, MAX_LESSON_SECONDS } from '../lib/lesson-voice.js';
import { relayThought } from '../lib/agent-inbox-sync.js';
import supabase from '../lib/supabase.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';

export default function VoiceLessonRecorder({ note = '', source = 'church-one-voice', recorder = null, send = sendVoiceLesson, deps = null }) {
  const own = useVoiceRecorder();
  const rec = recorder || own;
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  // A recording that runs past the cap stops itself.
  const { recording, seconds, stop } = rec;
  useEffect(() => { if (recording && seconds >= MAX_LESSON_SECONDS) stop(); }, [recording, seconds, stop]);

  const doSend = async () => {
    setBusy(true);
    setStatus('');
    const res = await send({ blob: rec.blob, seconds: rec.seconds, note, source, ...(deps || { supabase, relay: relayThought }) });
    setBusy(false);
    if (res.ok) {
      setStatus('Sent. Whisper on our own machines writes the words, and the lesson is built from them. You will hear what it became.');
      rec.reset();
    } else {
      setStatus(`Not sent (${res.reason}). The recording is still here; send it again when signed in.`);
    }
  };

  if (!rec.supported) {
    return <p className="text-[0.6875rem] text-[#5A5751] italic mt-2" style={SERIF} data-testid="voice-lesson-unsupported">This browser cannot record audio. Type the lesson, or open PoeTech in Chrome or Safari to speak it.</p>;
  }
  const problem = rec.blob ? recordingProblem({ blob: rec.blob, seconds: rec.seconds }) : '';

  return (
    <div className="mt-2 border border-[#E8E4DC] p-2 space-y-1.5" data-testid="voice-lesson-recorder">
      <p className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>
        Speak the lesson instead of typing it. The recording is transcribed by Whisper on our own machines, not by a browser service. The audio stays in your private folder until the NAS keeps it, then the cloud copy is removed.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {!rec.recording && !rec.blob && (
          <button type="button" data-testid="voice-lesson-record" onClick={rec.start} className={`${BTN} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}>Record the lesson</button>
        )}
        {rec.recording && (
          <button type="button" data-testid="voice-lesson-stop" onClick={rec.stop} className={`${BTN} bg-[#B85838] text-white border-[#B85838]`}>Stop</button>
        )}
        {(rec.recording || rec.blob) && (
          <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid="voice-lesson-clock">
            {formatClock(rec.seconds)} / {formatClock(MAX_LESSON_SECONDS)}
          </span>
        )}
        {rec.blob && !rec.recording && (
          <>
            {rec.url && <audio controls src={rec.url} className="h-9 max-w-full" data-testid="voice-lesson-playback" />}
            <button type="button" data-testid="voice-lesson-send" onClick={doSend} disabled={busy || !!problem} className={`${BTN} bg-[#1A1815] text-white border-[#1A1815]`}>{busy ? 'Sending' : 'Send the spoken lesson'}</button>
            <button type="button" data-testid="voice-lesson-discard" onClick={() => { rec.reset(); setStatus(''); }} disabled={busy} className={`${BTN} border-[#E8E4DC] text-[#5A5751]`}>Discard</button>
          </>
        )}
      </div>
      {problem && <p role="alert" className="text-[0.6875rem] text-[#B85838]" style={SERIF}>{problem}</p>}
      {rec.error && <p role="alert" className="text-[0.6875rem] text-[#B85838]" style={SERIF}>{rec.error}</p>}
      {status && <p role="status" className="text-[0.6875rem] text-[#5A6E3D] font-semibold" style={SERIF} data-testid="voice-lesson-status">{status}</p>}
    </div>
  );
}
