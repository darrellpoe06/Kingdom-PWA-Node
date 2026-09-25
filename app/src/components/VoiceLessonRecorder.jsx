// =============================================================================
// VoiceLessonRecorder — record a lesson on the Speak box; Whisper on our own
// machines turns it into words for the lesson intake (DR-0611, DR-0636)
// =============================================================================
// Shown on the Speak box while the Lesson chip is chosen. It RECORDS; the box's
// one Send sends (DR-0636: "Can't push send because nothing populated in the
// text box"). There is no second send button here any more.
//
// Darrell, 2026-09-24 4:41pm, on his Fold: the clock read 0:22 / 30:00 with
// Send showing, and "Never recorded". The old recorder had no timeslice, no
// level, no byte count, did not release the Speak button's hold on the
// microphone, and offered Send for an empty take. It now rides the same
// recorder as Record a conversation (lib/workflow-scribe.js):
//   * audio handed over every second, so "captured" grows while he speaks;
//   * a live level bar, so he SEES it hearing him;
//   * three seconds of silence or no bytes is said, with the likely cause and
//     one tap to start again;
//   * the Speak button's speech engine is stopped before the microphone is
//     asked for;
//   * an empty or silent take says "Nothing was recorded — <why>" and is never
//     offered to Send; any take with audio has playback.
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  useWorkflowScribe, buildConsent, silenceMessage, takeVerdict, formatBytes,
} from '../lib/workflow-scribe.js';
import { formatClock, MAX_LESSON_SECONDS } from '../lib/lesson-voice.js';
import { confirmThen } from '../lib/confirm-action.js';
import { NOTE_RECORDING_AUDIO, NOTE_RECORDING_BITRATE } from '../lib/recorded-note.js';
import { useMicPresent } from '../lib/mic-presence.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.75rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';
export const LESSON_SILENCE_SECONDS = 3;

export default function VoiceLessonRecorder({
  take = null, onTake = () => {}, onRecordingChange = () => {}, onDiscard = () => {}, recorder = null,
}) {
  const own = useWorkflowScribe();
  const rec = recorder || own;
  const micPresent = useMicPresent();
  const startedRef = useRef(false);
  const handledRef = useRef(null);

  const begin = async () => {
    startedRef.current = true;
    onTake(null);
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
  const again = () => { rec.stop(); setTimeout(begin, 300); };

  // Tell the Speak box what is happening, so its text box is never empty.
  useEffect(() => { onRecordingChange({ recording: rec.recording, seconds: rec.seconds }); }, [rec.recording, rec.seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // A 30-minute take stops itself.
  const { recording, seconds, stop } = rec;
  useEffect(() => { if (recording && seconds >= MAX_LESSON_SECONDS) stop(); }, [recording, seconds, stop]);

  // On stop, hand the take (with its verdict) to the Speak box.
  useEffect(() => {
    const r = rec.result;
    if (!r || !startedRef.current || handledRef.current === r) return;
    handledRef.current = r;
    startedRef.current = false;
    const secs = (r.manifest && r.manifest.seconds) || 0;
    onTake({ blob: r.blob, url: r.url || '', seconds: secs, verdict: takeVerdict(r) });
  }, [rec.result]); // eslint-disable-line react-hooks/exhaustive-deps

  // A device with no microphone (a TV) is offered no Record that cannot work
  // (DR-0657). The Speak box above already says why, in NO_MICROPHONE_LINE,
  // so this says nothing more. A take already made still shows as before.
  if (micPresent === false && !take && !rec.recording) return null;
  if (!rec.micSupported) {
    return <p className="text-[0.75rem] text-[#5A5751] italic mt-2" style={SERIF} data-testid="voice-lesson-unsupported">This browser cannot record audio. Type the lesson, or open PoeTech in Chrome or Safari to speak it.</p>;
  }
  const warning = rec.recording
    ? silenceMessage({ silentSeconds: rec.silentSeconds, warnAfter: LESSON_SILENCE_SECONDS, recordingSeconds: rec.seconds, bytes: rec.bytes })
    : '';
  const levelPct = Math.min(100, Math.round((Number(rec.level) || 0) * 250));

  return (
    <div className="mt-2 border border-[#E8E4DC] p-2 space-y-1.5" data-testid="voice-lesson-recorder">
      <p className="text-[0.75rem] text-[#1A1815]" style={SERIF}>
        Speak the lesson instead of typing it. When you stop, tap Send below. Whisper on our own machines writes the words, and they come back to you under Your lessons.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {!rec.recording && (
          <button type="button" data-testid="voice-lesson-record" onClick={begin} className={`${BTN} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}>
            {take ? 'Record it again' : 'Record the lesson'}
          </button>
        )}
        {rec.recording && (
          <button type="button" data-testid="voice-lesson-stop" onClick={rec.stop} className={`${BTN} bg-[#B85838] text-white border-[#B85838]`}>Stop</button>
        )}
        {(rec.recording || take) && (
          <span className="text-[0.75rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid="voice-lesson-clock">
            {formatClock(rec.recording ? rec.seconds : (take ? take.seconds : 0))} / {formatClock(MAX_LESSON_SECONDS)}
          </span>
        )}
      </div>
      {rec.recording && (
        <div className="space-y-1" data-testid="voice-lesson-live">
          <div className="h-2 w-full bg-[#E8E4DC]" aria-hidden="true">
            <div className="h-2 bg-[#5A6E3D]" style={{ width: `${levelPct}%` }} data-testid="voice-lesson-level" />
          </div>
          <p className="text-[0.75rem] text-[#5A5751]" style={SERIF} data-testid="voice-lesson-bytes">
            {rec.heardSound ? 'Hearing you.' : 'Checking the microphone…'} {formatBytes(rec.bytes)} captured.
          </p>
        </div>
      )}
      {warning && (
        <div role="alert" className="space-y-1" data-testid="voice-lesson-silence">
          <p className="text-[0.8125rem] text-[#B85838] font-semibold" style={SERIF}>{warning}</p>
          <button type="button" data-testid="voice-lesson-restart" onClick={again} className={`${BTN} border-[#B85838] text-[#B85838]`}>Start again</button>
        </div>
      )}
      {!rec.recording && take && (
        <div className="space-y-1">
          {take.url && take.blob && take.blob.size > 0 && <audio controls src={take.url} className="h-9 w-full" data-testid="voice-lesson-playback" />}
          {take.verdict && !take.verdict.ok && (
            <p role="alert" className="text-[0.8125rem] text-[#B85838] font-semibold" style={SERIF} data-testid="voice-lesson-nothing">{take.verdict.reason}</p>
          )}
          <button
            type="button"
            data-testid="voice-lesson-discard"
            onClick={confirmThen('Discard this recording? It has not been sent.', onDiscard)}
            className={`${BTN} border-[#E8E4DC] text-[#5A5751]`}
          >
            Discard
          </button>
        </div>
      )}
      {rec.errorMessage && <p role="alert" className="text-[0.75rem] text-[#B85838]" style={SERIF}>{rec.errorMessage}</p>}
    </div>
  );
}
