// =============================================================================
// LessonTeacher — the AI version of Darrell teaching the lesson, in the lesson
// =============================================================================
// Darrell, 2026-09-15: "Can I create some sort of AI version of myself, my
// voice, my image and likeness to be the teacher of these lessons... in the
// app?" — and, on being told it was staged as a decision: "nothing is waiting
// anymore." So it is built (DR-0430), in two halves the app already knows how
// to be honest about:
//   • the VOICE rides the sovereign voice studio and his recorded sample
//     (VoiceStudio → Record), exactly as read-aloud does;
//   • the LIKENESS rides the sovereign avatar studio and his enrolled portrait
//     (VoiceStudio → Likeness). Until that studio is armed, the portrait stays
//     still while the real voice speaks, and the label says so.
// The panel appears ONLY when he has enrolled his likeness himself (consent
// is a row). Every state is labelled AI-generated; nothing is ever called
// real that is not (DR-0076, DR-0138, DR-0382). The panel is chrome to the
// reader (data-read-skip): it is a teacher beside the lesson, not the lesson.
import React, { useEffect, useRef, useState } from 'react';
import { loadVoiceProfiles } from '../lib/voice-sync.js';
import { resolveTeacher, teacherIntroText, TEACHER_PERSONA } from '../lib/teacher.js';
import { isVoiceServiceReady, synthesizeSpeech, probeVoiceService } from '../lib/voice-service.js';
import { isAvatarServiceReady, renderTalkingPortrait } from '../lib/avatar-service.js';
import { loadReference, blobToDataUri, hasReference } from '../lib/voice-reference.js';
import { loadPortrait, hasPortrait } from '../lib/likeness-reference.js';
import { toSpokenForm } from '../lib/speech-text.js';
import { useTextToSpeech } from '../lib/tts.js';

export default function LessonTeacher({ module, className = '' }) {
  const tts = useTextToSpeech();
  const [teacher, setTeacher] = useState(null);
  const [portraitUrl, setPortraitUrl] = useState('');
  const [media, setMedia] = useState(null); // { kind: 'video'|'audio', url }
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const mediaRef = useRef(null);

  // Resolve what the Teacher can honestly do on THIS device.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { profiles } = await loadVoiceProfiles();
      const profile = (profiles || []).find((p) => p.personKey === TEACHER_PERSONA) || null;
      const [hasVoiceSample, portraitHere] = await Promise.all([hasReference(TEACHER_PERSONA), hasPortrait(TEACHER_PERSONA)]);
      if (!alive) return;
      // ASK THE STUDIO, DO NOT READ THE CONFIG. voiceReady decides whether the
      // teacher is introduced as speaking in a REAL cloned voice or as a
      // labelled stand-in, and isVoiceServiceReady() stopped being able to tell
      // them apart when /voice became a same-origin route — it answers true on
      // every device now, so the teacher would have claimed a real voice on a
      // night the studio was dark. The probe is cached for a minute, so this
      // costs one request per page rather than one per lesson.
      const studioHealth = await probeVoiceService();
      if (!alive) return;
      const t = resolveTeacher({ profile, voiceReady: isVoiceServiceReady() && studioHealth !== 'down', avatarReady: isAvatarServiceReady(), hasVoiceSample, hasPortrait: portraitHere });
      setTeacher(t);
      if (portraitHere) {
        const blob = await loadPortrait(TEACHER_PERSONA);
        if (alive && blob) setPortraitUrl(URL.createObjectURL(blob));
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => {
    try { if (portraitUrl) URL.revokeObjectURL(portraitUrl); } catch (_) { /* best-effort */ }
    try { if (media && media.url) URL.revokeObjectURL(media.url); } catch (_) { /* best-effort */ }
    try { tts.stop(); } catch (_) { /* best-effort */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!teacher || !teacher.enrolled) return null;

  const text = teacherIntroText(module);

  const stop = () => {
    try { tts.stop(); } catch (_) { /* ignore */ }
    if (mediaRef.current) { try { mediaRef.current.pause(); } catch (_) { /* ignore */ } }
    setMedia(null); setBusy(false);
  };

  const teach = async () => {
    if (!text || busy) return;
    setNotice(''); setBusy(true);
    try {
      // 1. The voice: his cloned voice from the sovereign studio when it is
      //    armed and his sample is here; else the labelled device stand-in.
      let audioUrl = null;
      if (teacher.voice === 'real') {
        const refBlob = await loadReference(TEACHER_PERSONA);
        const referenceDataUri = refBlob ? await blobToDataUri(refBlob) : null;
        const { url, error } = await synthesizeSpeech({ text: toSpokenForm(text), voiceId: 'voice-dp', personKey: TEACHER_PERSONA, referenceDataUri });
        if (url && !error) audioUrl = url;
        else setNotice('The voice studio did not answer — teaching in the stand-in device voice.');
      }
      if (!audioUrl) {
        if (tts.supported) tts.speak(text);
        else setNotice('This device cannot read aloud.');
        setBusy(false);
        return;
      }
      // 2. The likeness: a talking portrait when the avatar studio is armed;
      //    otherwise the real voice over the still portrait, said plainly.
      if (teacher.likeness === 'real') {
        const [audioBlob, portraitBlob] = await Promise.all([fetch(audioUrl).then((r) => r.blob()), loadPortrait(TEACHER_PERSONA)]);
        const { url, error } = await renderTalkingPortrait({ audioBlob, portraitBlob, personKey: TEACHER_PERSONA });
        if (url && !error) { setMedia({ kind: 'video', url }); setBusy(false); return; }
        setNotice(`The likeness studio did not render (${error}) — the portrait stays still while his voice teaches.`);
      }
      setMedia({ kind: 'audio', url: audioUrl });
    } catch (e) {
      setNotice('Could not start the teacher — ' + ((e && e.message) || 'unknown error'));
    }
    setBusy(false);
  };

  const speaking = busy || !!media || tts.isReading;

  return (
    <div className={`border border-[#E8E4DC] bg-white p-3 ${className}`} data-read-skip data-testid="lesson-teacher">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-20 h-20 shrink-0 overflow-hidden border border-[#1A1815] bg-[#FAF8F4]">
          {media && media.kind === 'video' ? (
            <video ref={mediaRef} src={media.url} autoPlay playsInline onEnded={() => setMedia(null)} className="w-full h-full object-cover" aria-label={`${teacher.name}, AI-generated talking portrait`} />
          ) : portraitUrl ? (
            <img src={portraitUrl} alt={`${teacher.name}, enrolled portrait (AI teacher)`} className={`w-full h-full object-cover ${speaking ? 'ring-2 ring-[#B85838]' : ''}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[0.625rem] text-[#5A5751]">no portrait here</div>
          )}
          {media && media.kind === 'audio' && (
            <audio ref={mediaRef} src={media.url} autoPlay onEnded={() => setMedia(null)} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Teacher</div>
          <div className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{teacher.name}</div>
          <div className="text-[0.625rem] text-[#5A5751]" data-testid="lesson-teacher-label">{teacher.label}</div>
        </div>
        <div className="flex items-center gap-2">
          {!speaking ? (
            <button type="button" onClick={teach} disabled={!text} className="bg-[#1A1815] text-white px-3 py-2 min-h-[36px] text-[0.625rem] uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Let {teacher.name.split(' ')[0]} teach this</button>
          ) : (
            <button type="button" onClick={stop} className="border border-[#1A1815] text-[#1A1815] px-3 py-2 min-h-[36px] text-[0.625rem] uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
          )}
        </div>
      </div>
      {notice && <p className="text-[0.6875rem] text-[#B85838] mt-2" role="status">{notice}</p>}
    </div>
  );
}
