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
import { resolveSurface } from '../lib/one-voice-surfaces.js';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import { readDraft, writeDraft, clearDraft } from '../lib/draft-autosave.js';

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
  // Optional: the church-office email. When set, a SENT entry offers an
  // explicit secondary "email a copy" link — target _blank, clearly labeled —
  // so the surface itself NEVER navigates (Darrell 2026-07-09: the old raw
  // mailto Send yanked the app into the mail client; "humans can get dizzy").
  officeEmail = null,
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
  const mic = useVoiceDictation({
    onTranscript: (t) => onText((latestText.current ? `${latestText.current} ${t}` : t).trim()),
  });

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
    };
    const plan = planDispatch(r, has, cfg.saveNoteOnCounseling);
    switch (plan.action) {
      case 'poetech':    sendToPoeTech(t); break;
      case 'prayer':     addPrayerRequest({ requester: who || 'church family', request: t, shareWithChurch: true }); break;
      case 'pastor':     voiceNote('pastor'); break;
      case 'serve':      voiceNote('serve'); break;
      case 'conference': updateConference({ feedback: [...((conference && conference.feedback) || []), { id: `cf-${Date.now()}`, text: t, from: who, at: new Date().toISOString() }] }); break;
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
    return plan.confirmationKey ? c[plan.confirmationKey] : null;
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const msg = dispatch(route, t, name.trim());
    if (msg) setConfirmation(msg);
    setLastSent({ text: t, who: name.trim() });
    setText('');
    setTouchedRoute(false);
    setRoute(cfg.defaultRoute);
    setRestoredDraft(false);
    clearDraft(surface); // delivered — the draft's job is done
  };

  const active = DESTS.find(d => d.key === route) || DESTS[0];
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
        placeholder={placeholder}
        value={text}
        onChange={e => onText(e.target.value)}
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
          {mic.listening && (
            <span className="text-[0.625rem] text-[#B85838] uppercase tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace' }}>listening…</span>
          )}
          {mic.error && (
            <span role="alert" className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{mic.error}</span>
          )}
        </div>
      )}
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
      <div className="flex gap-1.5 mt-2 flex-wrap items-center">
        <span className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {active.hint}</span>
        {showName && (
          <input className="flex-1 min-w-[140px] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder={cfg.namePlaceholder || 'Your name (optional)'} value={name} onChange={e => setName(e.target.value)} />
        )}
        <button type="button" onClick={send} disabled={!text.trim()} className="bg-[#1A1815] text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] disabled:opacity-30">{submitLabel}</button>
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

export default OneVoiceInput;
