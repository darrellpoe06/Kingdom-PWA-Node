// =============================================================================
// OneVoiceInput — the one master input box (type OR speak), routed for you
// =============================================================================
// One component under every "say it once" surface. The Church "Speak" box and
// the Thinking Space diary both render THIS: same shared classifier
// (lib/one-voice-routing), same dispatch to the real pipelines, and voice
// (lib/voice-dictation) built in — so a change lands everywhere at once and a
// new tab adds a full input in a few lines.
//
// Per MODE-ROUTING the suggested destination is always VISIBLE and the person
// always has the last word; nothing routes invisibly and nothing auto-acts.
// The per-surface differences (default route, framing, confirmation tone,
// source tag) live as pure data in lib/one-voice-surfaces.js — and a caller may
// pass its own `surfaceConfig` to adopt this primitive on a NEW surface without
// editing this file. Consolidates the previously copy-pasted send()/save()
// dispatch in ChurchOneVoice + ThinkingSpace (Darrell 2026-06-15: "consolidate
// the inputs to make a master multiinput").
import React, { useState, useRef, useEffect } from 'react';
import { suggestDestination, destinationsFor, planDispatch, composeNoteText } from '../lib/one-voice-routing.js';
import { uploadFeedback } from '../lib/feedback-sync.js';
import { resolveSurface, lessonConfirmationKey } from '../lib/one-voice-surfaces.js';
import { useVoiceDictation, LONG_FORM_SESSION_CAP_MS, VOICE_SESSION_CAP_MS, capMinutes } from '../lib/voice-dictation.js';
import { readDraft, writeDraft, clearDraft } from '../lib/draft-autosave.js';
import { relayThought } from '../lib/agent-inbox-sync.js';
import VoiceLessonRecorder from './VoiceLessonRecorder.jsx';
import LessonInbox from './LessonInbox.jsx';
import { sendVoiceLesson, formatClock } from '../lib/lesson-voice.js';
import LessonsForSituation from './LessonsForSituation.jsx';
import ConversationRecorder from './ConversationRecorder.jsx';
import { isMicCaptureSupported } from '../lib/workflow-scribe.js';
import { rememberPrompt, AUTO_REMEMBERED, USE_PROMPT_EVENT } from '../lib/saved-prompts.js';
import supabase from '../lib/supabase.js';
import { getInstanceId } from '../lib/table-sync.js';

// What a signed-out sender is told (DR-0622): the words are kept, where they are.
export const SIGNED_OUT_SAID = 'Kept on this device only — you are signed out, so it has not reached anyone yet. Sign in and send it again so it reaches them.';

export function OneVoiceInput({
  surface = 'church',
  surfaceConfig = null,        // optional per-surface override (one-voice-surfaces.js):
                               // lets a NEW surface reuse this primitive without editing it.
  destinations = null,         // optional explicit destination list for a custom surface;
                               // built-in church/notes keep destinationsFor() unchanged.
  heading,
  intro,
  placeholder,
  submitLabel = 'Send',
  showName = true,
  recent = null,               // optional "recently heard" list (church surface)
  // Destination handlers — pass the ones this surface supports; a route whose
  // handler is absent falls through to the surface's fallback (private note or
  // a general voice note). This is what unifies the two old dispatch copies.
  addPrayerRequest, updateConference, conference, sendToPoeTech,
  addIncident, addInquiry, addChurchVoice, addNote,
  // Fills a saved note in place (DR-0624): a recorded conversation is saved
  // on Stop and its words are added when they arrive.
  patchNote = null,
  // Optional: the church-office email. When set, a SENT entry offers an
  // explicit secondary "email a copy" link — target _blank, clearly labeled —
  // so the surface itself NEVER navigates (Darrell 2026-07-09: the old raw
  // mailto Send yanked the app into the mail client; "humans can get dizzy").
  officeEmail = null,
  // Called after a prompt is remembered (DR-0615), so a history on the same
  // page can refresh.
  onRemembered = null,
}) {
  const cfg = resolveSurface(surface, surfaceConfig);
  const DESTS = destinations || destinationsFor(surface === 'notes' ? 'notes' : 'church');

  // Google-Doc-style autosave (Christina 2026-07-10: "when you stall out with
  // time or forget and come back, your information is still there"). The box
  // opens holding the device-local draft; every edit re-saves it; a successful
  // Send clears it. All device-local (lib/draft-autosave.js).
  const draft = readDraft(surface);
  const [text, setText] = useState(draft ? draft.text : '');
  const [route, setRoute] = useState(draft && draft.route ? draft.route : cfg.defaultRoute);
  const [touchedRoute, setTouchedRoute] = useState(!!(draft && draft.route && draft.route !== cfg.defaultRoute));
  const [name, setName] = useState(draft ? draft.name : '');
  const [restoredDraft, setRestoredDraft] = useState(!!draft);
  const [confirmation, setConfirmation] = useState(null);
  const [lastSent, setLastSent] = useState(null); // the last delivered text — feeds the email-a-copy link

  const onText = (v) => {
    setText(v);
    // Suggestions are clamped to the destinations THIS surface offers — a
    // route with no visible chip must never be selected for the person.
    if (!touchedRoute) setRoute(suggestDestination(v, cfg.defaultRoute, DESTS.map(d => d.key)));
  };

  // Voice — same box, spoken. The mic only appears where the browser supports
  // speech; a spoken phrase appends and re-runs the suggestion, exactly like
  // typing. latestText keeps the append correct across async recognition.
  const latestText = useRef('');
  latestText.current = text;
  // LISTEN TO THE WHOLE THING (Darrell, 2026-09-22, screenshot of this very box
  // beside a reel playing). Two different jobs share one microphone: speaking a
  // note, and listening to something that PLAYS. The five-minute cap fits the
  // first and was a lid on the second. Opt in and the cap becomes three hours,
  // the same self-stop workflow-scribe already uses for a long capture.
  const [wholeThing, setWholeThing] = useState(false);
  // SPOKEN WORDS NEVER MOVE THE ROUTE (2026-09-24, Darrell's Action Queue
  // screenshot: a spoken conversation filed as an INCIDENT). Typed words may
  // suggest a destination; dictated words only append. A conversation says
  // "paint", "roof" or "fix" in passing, and under 400 characters the
  // suggestion used to flip the chip to Work between one sentence and the
  // next, so Save filed his words as a work order. Speech keeps the chip the
  // person chose (or the surface's own default); a tap on a chip still wins.
  const mic = useVoiceDictation({
    onTranscript: (t) => setText((latestText.current ? `${latestText.current} ${t}` : t).trim()),
    capMs: wholeThing ? LONG_FORM_SESSION_CAP_MS : VOICE_SESSION_CAP_MS,
  });

  // RECORD A CONVERSATION (DR-0624, Darrell 2026-09-24: "it would not even
  // save the note"). Where this surface keeps notes and the browser can
  // record, the long-listening job moves from the speech engine (which writes
  // nothing when it is unsure, and hears nothing during a phone call) to a
  // recording that is saved on Stop and written out afterwards. It takes the
  // place of "Listen to the whole thing" here; surfaces that keep no notes
  // keep that option.
  const canRecord = !!addNote && isMicCaptureSupported();
  const [recordRequest, setRecordRequest] = useState(0);
  // ONE SEND FOR A SPOKEN LESSON (DR-0636, Darrell 2026-09-24: "Can't push
  // send because nothing populated in the text box... make sense?!!!"). The
  // recorder records; the box always says what is happening; the box's own
  // Send sends the recording (with any typed words). There is no second send.
  const [lessonTake, setLessonTake] = useState(null);     // { blob, url, seconds, verdict }
  const [lessonLive, setLessonLive] = useState({ recording: false, seconds: 0 });
  const [lessonsSeen, setLessonsSeen] = useState(0);
  const [sending, setSending] = useState(false);
  const lessonRecording = route === 'lesson' && lessonLive.recording;
  const takeReady = route === 'lesson' && !!(lessonTake && lessonTake.verdict && lessonTake.verdict.ok);
  const onLessonTake = (take) => {
    setLessonTake(take);
    if (take && take.verdict && take.verdict.ok && !latestText.current.trim()) {
      setText(spokenLessonLine(take.seconds));
    }
  };
  // What the box shows: the words as they are heard while speaking, and a
  // plain line while a lesson records, so it is never an empty box.
  const shownText = lessonRecording
    ? (text.trim() ? text : `Recording your lesson… ${formatClock(lessonLive.seconds)}`)
    : (mic.listening && mic.interim ? `${text}${text ? ' ' : ''}${mic.interim}` : text);

  // YOUR PROMPTS (DR-0615): a prompt chosen in the history comes back into
  // this box through one window event; the person still chooses where it goes.
  useEffect(() => {
    const onUse = (e) => {
      const body = String(e?.detail?.body || '');
      if (!body) return;
      setText(body);
      setRestoredDraft(false);
      if (!touchedRoute) setRoute(suggestDestination(body, cfg.defaultRoute, DESTS.map(d => d.key)));
    };
    window.addEventListener(USE_PROMPT_EVENT, onUse);
    return () => window.removeEventListener(USE_PROMPT_EVENT, onUse);
  }, [touchedRoute, cfg.defaultRoute, DESTS]);

  const remember = (body, destination, keep) => rememberPrompt({ supabase, getInstanceId, body, destination, keep })
    .then((res) => { if (res.ok && onRemembered) onRemembered(); return res; });

  // Persist the draft as they type (lightly debounced); an emptied box clears it.
  useEffect(() => {
    const timer = setTimeout(() => { writeDraft(surface, { text, route, name }); }, 350);
    return () => clearTimeout(timer);
  }, [surface, text, route, name]);

  // The routing→action DECISION is the pure planDispatch (testable matrix); the
  // component only performs the side-effect the plan names. Same behavior as the
  // old send()/save(), now pinned by a characterization test.
  const dispatch = (r, t, who) => {
    const c = cfg.confirmations;
    const voiceNote = (kind) => addChurchVoice && addChurchVoice({ id: `vo-${Date.now()}`, kind, text: t, from: who, at: new Date().toISOString() });
    const has = {
      poetech: !!sendToPoeTech, prayer: !!addPrayerRequest, churchVoice: !!addChurchVoice,
      conference: !!updateConference, incident: !!addIncident, inquiry: !!addInquiry, note: !!addNote,
      // The lesson door needs no surface handler: it is the sovereign relay
      // itself (agent_inbox, DR-0218), the same one every surface shares.
      lesson: true,
    };
    const plan = planDispatch(r, has, cfg.saveNoteOnCounseling);
    switch (plan.action) {
      case 'poetech':    sendToPoeTech(t); break;
      case 'lesson':
        // THE LESSON DOOR (DR-0608): persist the words to the sovereign inbox,
        // tagged so the staged intake routine can find them. Best-effort and
        // honest: signed-out or a refused insert is SAID on the surface, never
        // swallowed, and the words stay in the box for the person to keep.
        relayThought({ body: t, tags: ['lesson'], source: cfg.sourceTag }).then(async (res) => {
          if (!res.ok) { setConfirmation(String(c.lessonFailed || 'Not sent as a lesson ({reason}) — keep it as a note and send it again signed in.').replace('{reason}', res.reason || 'unknown')); return; }
          // SAID TRUE FOR WHO SENT IT (DR-0630): the Governor's own row is read
          // into a new lesson; a member's is kept and reviewed first, and the
          // lessons that already speak to it stay on screen for them.
          let email;
          try { const { data } = await supabase.auth.getSession(); email = data?.session?.user?.email || ''; } catch (e) { email = ''; }
          setConfirmation(c[lessonConfirmationKey(email)] || c.lesson);
        });
        break;
      case 'prayer':     addPrayerRequest({ requester: who || 'church family', request: t, shareWithChurch: true }); break;
      case 'pastor':     voiceNote('pastor'); break;
      case 'serve':      voiceNote('serve'); break;
      case 'conference':
        updateConference({ feedback: [...((conference && conference.feedback) || []), { id: `cf-${Date.now()}`, text: t, from: who, at: new Date().toISOString() }] });
        // The Assembly feedback line had no reader: conference.feedback is
        // written here and read by nothing (DR-0622). The same words now take
        // the Conference module's own road — the feedback table, triaged in the
        // steward's queue, its status on the sender's receipt.
        uploadFeedback({ text: t, currentView: 'Conference · One Voice' }, { activeTab: 'conference' }).catch(() => {});
        break;
      case 'work':       addIncident({ category: 'maintenance', description: t, urgency: 'incident', status: 'open', _note: cfg.sourceLabel }); break;
      case 'counseling':
        // TLC bright line: inquiries is pre-intake, non-PHI, cloud-synced —
        // contact intent only; the words never cross. On the notes surface the
        // verbatim text is ALSO kept as a private device-local note.
        addInquiry({ firstName: who || cfg.inquiryFrom, lastName: '', phone: '', email: '', source: cfg.sourceTag, interest: 'counseling', bestTime: 'anytime', notes: cfg.counselingNote });
        if (plan.savesPrivateNote) addNote(cfg.nameIsLabel ? composeNoteText(t, who) : t);
        break;
      case 'private':
      case 'fallback-note': addNote(cfg.nameIsLabel ? composeNoteText(t, who) : t); break;
      case 'fallback-voice': voiceNote('voice'); break;
      default: break; // 'none' — no handler available
    }
    // The lesson door's confirmation is said once the relay answers (above).
    if (plan.action === 'lesson') return null;
    return plan.confirmationKey ? c[plan.confirmationKey] : null;
  };

  const sendSpokenLesson = async (t) => {
    setSending(true);
    const note = isSpokenLessonLine(t) ? '' : t;
    const res = await sendVoiceLesson({ blob: lessonTake.blob, seconds: lessonTake.seconds, note, source: cfg.sourceTag, supabase, relay: relayThought });
    setSending(false);
    if (!res.ok) {
      setConfirmation(`Not sent (${res.reason}). The recording and your words are still here; send again when signed in.`);
      return;
    }
    setConfirmation('Sent. Whisper on our own machines writes the words; they appear under Your lessons.');
    setLessonTake(null);
    setLessonsSeen((n) => n + 1);
    remember(t, 'lesson', false);
    setText('');
    setTouchedRoute(false);
    setRoute(cfg.defaultRoute);
    setRestoredDraft(false);
    clearDraft(surface);
  };

  const send = () => {
    const t = text.trim();
    if (!t || sending || lessonRecording) return;
    if (takeReady) { sendSpokenLesson(t); return; }
    const msg = dispatch(route, t, name.trim());
    if (msg) setConfirmation(msg);
    else if (route === 'lesson') setConfirmation(null); // its own line arrives with the relay's answer
    // SIGNED OUT, SAID PLAINLY (DR-0622: connected is not the same as
    // answered, for every audience). Signed out, every door but the private
    // note keeps the words on this device only — nobody else can read them —
    // so the screen says that instead of "received". The lesson door already
    // says its own refusal (lessonFailed).
    if (route !== 'private' && route !== 'lesson' && supabase && supabase.auth) {
      Promise.resolve(supabase.auth.getSession()).then((res) => {
        if (!(res && res.data && res.data.session)) setConfirmation(cfg.confirmations.signedOut || SIGNED_OUT_SAID);
      }).catch(() => {});
    }
    // A lesson or a PoeTech request is remembered in Your prompts (DR-0615).
    // Private notes and the rest are not: they are kept only on request.
    if (AUTO_REMEMBERED.includes(route)) remember(t, route, false);
    setLastSent({ text: t, who: name.trim(), route });
    setText('');
    setTouchedRoute(false);
    setRoute(cfg.defaultRoute);
    setRestoredDraft(false);
    clearDraft(surface); // delivered — the draft's job is done
  };

  const active = DESTS.find(d => d.key === route) || DESTS[0];
  // FROM THE WORD FOR THIS (DR-0630): the words being written under the Lesson
  // chip, or — once sent — the words just sent as a lesson, so the lessons
  // stay on screen with the confirmation instead of vanishing with the text.
  const lessonWords = route === 'lesson' && text.trim() && !isSpokenLessonLine(text) && !lessonRecording
    ? text
    : (!text.trim() && lastSent && lastSent.route === 'lesson' ? lastSent.text : '');
  const recentItems = recent ? (recent || []).slice(-3).reverse() : null;

  return (
    <section className={`bg-white border-2 ${cfg.borderCls} p-4 sm:p-5`} aria-labelledby="onevoice-h">
      {heading && <h2 id="onevoice-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{heading}</h2>}
      {intro && (
        <p className="text-xs text-[#5A5751] italic mt-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{intro}</p>
      )}
      <textarea
        className="w-full p-3 border border-[#1A1815] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
        rows="2"
        placeholder={mic.listening ? 'Listening… your words appear here as you speak.' : placeholder}
        value={shownText}
        readOnly={lessonRecording || (mic.listening && !!mic.interim)}
        onChange={e => onText(e.target.value)}
        data-testid="one-voice-text"
      />
      {restoredDraft && (
        <p role="status" className="text-[0.6875rem] text-[#5A6E3D] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Your unsent words were kept — everything here saves as you type, no Save needed.
        </p>
      )}
      {(mic.supported || mic.error) && (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {mic.supported && (
            <button
              type="button"
              onClick={mic.toggle}
              disabled={lessonRecording}
              aria-pressed={mic.listening}
              aria-label={mic.listening ? 'Stop voice input' : 'Start voice input — speak instead of typing'}
              className={`text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                mic.listening
                  ? 'bg-[#B85838] text-white border-[#B85838] animate-pulse'
                  : 'border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white'
              }`}
            >
              {mic.listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
          )}
          {mic.supported && !canRecord && (
            <label className="flex items-center gap-1.5 text-[0.625rem] text-[#5A5751] cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
              <input
                type="checkbox"
                data-testid="listen-whole-thing"
                checked={wholeThing}
                disabled={mic.listening}
                onChange={(e) => setWholeThing(e.target.checked)}
                className="accent-[#B85838]"
              />
              Listen to the whole thing
            </label>
          )}
          {mic.listening && !mic.nothingHeard && (
            <span className="text-[0.625rem] text-[#B85838] uppercase tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {mic.heard ? 'listening…' : 'starting the microphone…'} stops itself after {capMinutes(wholeThing ? LONG_FORM_SESSION_CAP_MS : VOICE_SESSION_CAP_MS)}
            </span>
          )}
          {mic.listening && mic.nothingHeard && (
            /* NEVER "LISTENING" OVER SILENCE (2026-09-24). */
            <span role="alert" className="text-[0.75rem] text-[#B85838] font-semibold" style={{ fontFamily: '"Fraunces", serif' }} data-testid="dictation-nothing-heard">
              Not hearing anything yet. If a phone call is on, the call is holding the microphone.
            </span>
          )}
          {mic.supported && wholeThing && !mic.listening && !canRecord && (
            /* THE LIMIT, SAID BEFORE HE RELIES ON IT. A web page cannot reach
               inside another app and take its audio; what this has is the
               microphone. So it hears a reel, a sermon or a class the way a
               person in the room hears it — played OUT LOUD — and it hears
               nothing at all through headphones. Saying that here costs one
               line; not saying it costs him a three-hour recording of silence. */
            <span className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }} data-testid="listen-whole-thing-limit">
              It listens through the microphone, so play the sound OUT LOUD — through headphones it hears nothing.
            </span>
          )}
          {mic.error && (
            <span role="alert" className="text-[0.75rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{mic.error}</span>
          )}
        </div>
      )}
      {/* THE EMPTY BOX, SAID (the 2026-09-24 defect): a session that wrote no
          words never leaves a silently empty box. */}
      {!mic.listening && mic.outcome === 'no-words' && (
        <div role="alert" className="mt-1.5 flex items-center gap-2 flex-wrap" data-testid="dictation-no-words">
          <span className="text-[0.8125rem] text-[#B85838] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
            The phone heard no words, so nothing was written and nothing was saved.
            {canRecord ? ' Record instead: a recording is always kept, and the words are written afterwards.' : ' Try again closer to the phone, or type it.'}
          </span>
          {canRecord && (
            <button type="button" data-testid="record-instead" onClick={() => { mic.clearOutcome(); setRecordRequest((n) => n + 1); }}
              className="text-[0.75rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
              Record instead
            </button>
          )}
        </div>
      )}
      {canRecord && <ConversationRecorder addNote={addNote} patchNote={patchNote} startRequest={recordRequest} />}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {DESTS.map(d => (
          <button
            key={d.key}
            type="button"
            onClick={() => { setRoute(d.key); setTouchedRoute(true); }}
            aria-pressed={route === d.key}
            className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 min-h-[36px] border ${route === d.key ? (d.key === 'private' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-[#B85838] text-white border-[#B85838]') : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}
          >
            {d.label}
          </button>
        ))}
      </div>
      {/* A SPOKEN LESSON (DR-0611): with the Lesson chip chosen, the lesson can
          be recorded and transcribed by Whisper on our own machines. */}
      {route === 'lesson' && (
        <VoiceLessonRecorder
          take={lessonTake}
          onTake={onLessonTake}
          onRecordingChange={setLessonLive}
          onDiscard={() => { setLessonTake(null); if (isSpokenLessonLine(text)) setText(''); }}
        />
      )}
      {/* THE SENDER SEES WHAT HAPPENED (DR-0636): every lesson they sent, its
          state, and the words Whisper wrote. The Notes tab shows it below. */}
      {route === 'lesson' && surface !== 'notes' && <LessonInbox refreshKey={lessonsSeen} />}
      {lessonWords && <LessonsForSituation words={lessonWords} />}
      {route === 'lesson' && cfg.lessonNotice && (
        /* SAID BEFORE THEY SEND (Darrell 2026-09-24): every time, above Send. */
        <p className="text-[0.75rem] text-[#1A1815] mt-2 border-l-2 border-[#B85838] pl-2" style={{ fontFamily: '"Fraunces", serif' }} data-testid="lesson-notice">
          {cfg.lessonNotice}
        </p>
      )}
      <div className="flex gap-1.5 mt-2 flex-wrap items-center">
        <span className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {active.hint}</span>
        {showName && (
          <input className="flex-1 min-w-[140px] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder={cfg.namePlaceholder || 'Your name (optional)'} value={name} onChange={e => setName(e.target.value)} />
        )}
        <button type="button" data-testid="one-voice-send" onClick={send} disabled={!text.trim() || sending || lessonRecording} className="bg-[#1A1815] text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[44px] disabled:opacity-30 focus:outline focus:outline-2 focus:outline-[#B85838]">{sending ? 'Sending' : (takeReady ? 'Send the lesson' : submitLabel)}</button>
        <button
          type="button"
          data-testid="save-as-prompt"
          onClick={() => remember(text.trim(), route, true).then((res) => setConfirmation(res.ok ? 'Saved to Your prompts. It stays in the box too.' : `Not saved to Your prompts (${res.reason}).`))}
          disabled={!text.trim()}
          className="border border-[#1A1815] text-[#1A1815] px-3 py-2 text-xs uppercase tracking-wider min-h-[36px] disabled:opacity-30"
        >
          Save as prompt
        </button>
      </div>
      {confirmation && <p className="text-[0.6875rem] text-[#5A6E3D] font-semibold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{confirmation}</p>}
      {confirmation && lastSent && officeEmail && (
        <p className="text-[0.6875rem] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          <a
            href={`mailto:${officeEmail}?subject=${encodeURIComponent('Yahweh Hears You note')}&body=${encodeURIComponent(`Sent from PoeTech Family OS · Church tab.

${lastSent.text}${lastSent.who ? `

— ${lastSent.who}` : ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#B85838] hover:text-[#1A1815]"
          >
            Email a copy to the church office ↗
          </a>
          <span className="text-[#5A5751]"> (opens your mail app — this page stays put)</span>
        </p>
      )}
      {recentItems && recentItems.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[#E8E4DC]">
          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Recently heard</div>
          <ul className="space-y-0.5">
            {recentItems.map(v => (
              <li key={v.id} className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                {v.kind === 'serve' ? '🤝' : v.kind === 'pastor' ? '⛪' : '💬'} “{v.text.slice(0, 90)}{v.text.length > 90 ? '…' : ''}”{v.from ? ` — ${v.from}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// The line the box holds for a spoken lesson with no typed words (DR-0636).
export function spokenLessonLine(seconds) {
  return `Spoken lesson, ${formatClock(seconds)} (the words come back from Whisper)`;
}
export function isSpokenLessonLine(t) {
  return /^Spoken lesson, \d+:\d\d \(the words come back from Whisper\)$/.test(String(t || '').trim());
}

export default OneVoiceInput;
