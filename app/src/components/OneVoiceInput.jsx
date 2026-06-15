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
// The ONLY per-surface differences live in SURFACES below (default route,
// framing, confirmation tone, source tag). Consolidates the previously
// copy-pasted send()/save() dispatch in ChurchOneVoice + ThinkingSpace
// (Darrell 2026-06-15: "consolidate the inputs to make a master multiinput").
import React, { useState, useRef } from 'react';
import { suggestDestination, destinationsFor } from '../lib/one-voice-routing.js';
import { useVoiceDictation } from '../lib/voice-dictation.js';

const SURFACES = {
  church: {
    defaultRoute: 'prayer',
    borderCls: 'border-[#B85838]',
    sourceTag: 'church-one-voice',
    sourceLabel: 'from Church One Voice',
    inquiryFrom: '(from church)',
    counselingNote: 'Requested counseling via Church One Voice. Their words stay private — TLC connects directly.',
    saveNoteOnCounseling: false,
    confirmations: {
      prayer:     '🙏 On the prayer list. The church is standing with you.',
      conference: '🎪 Received for the Assembly — it goes straight onto the build list.',
      poetech:    '💡 PoeTech heard you — program processes and procedures begin. It’s on the build inbox.',
      work:       '🛠 On the Action Queue as a work order — it can dispatch to a worker from Big Picture.',
      counseling: '💚 The practice knows you’d like to talk — your words stayed private here. Reaching out took courage.',
      serve:      '🤝 Leadership will see your serving hands — thank you.',
      pastor:     '⛪ A note to the pastors — received.',
      voice:      '💬 Heard and kept. Thank you for your voice.',
    },
  },
  notes: {
    defaultRoute: 'private',
    borderCls: 'border-[#1A1815]',
    sourceTag: 'thinking-space',
    sourceLabel: 'from Thinking Space',
    inquiryFrom: '(from notes)',
    counselingNote: 'Requested counseling via Thinking Space. Their words stay private on their device — TLC connects directly.',
    saveNoteOnCounseling: true,
    confirmations: {
      poetech:    '💡 PoeTech heard you — it’s on the build inbox. You shape what gets built.',
      prayer:     '🙏 On the prayer list. The church is standing with you.',
      pastor:     '⛪ A note to the pastors — they’ll see it on the Church tab.',
      serve:      '🤝 Leadership will see your serving hands — thank you.',
      work:       '🛠 On the Action Queue as a work order — dispatch it to a worker from Big Picture.',
      counseling: '💚 The practice knows you’d like to talk — your words stayed private here, for you to share with them directly. Reaching out took courage.',
      private:    '📓 Kept — private to you. Come back to it anytime.',
    },
  },
};

export function OneVoiceInput({
  surface = 'church',
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
}) {
  const cfg = SURFACES[surface] || SURFACES.church;
  const DESTS = destinationsFor(surface === 'notes' ? 'notes' : 'church');

  const [text, setText] = useState('');
  const [route, setRoute] = useState(cfg.defaultRoute);
  const [touchedRoute, setTouchedRoute] = useState(false);
  const [name, setName] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const onText = (v) => {
    setText(v);
    if (!touchedRoute) setRoute(suggestDestination(v, cfg.defaultRoute));
  };

  // Voice — same box, spoken. The mic only appears where the browser supports
  // speech; a spoken phrase appends and re-runs the suggestion, exactly like
  // typing. latestText keeps the append correct across async recognition.
  const latestText = useRef('');
  latestText.current = text;
  const mic = useVoiceDictation({
    onTranscript: (t) => onText((latestText.current ? `${latestText.current} ${t}` : t).trim()),
  });

  const dispatch = (r, t, who) => {
    const c = cfg.confirmations;
    const voiceNote = (kind) => addChurchVoice && addChurchVoice({ id: `vo-${Date.now()}`, kind, text: t, from: who, at: new Date().toISOString() });
    switch (r) {
      case 'poetech':    if (sendToPoeTech)    { sendToPoeTech(t); return c.poetech; } break;
      case 'prayer':     if (addPrayerRequest) { addPrayerRequest({ requester: who || 'church family', request: t, shareWithChurch: true }); return c.prayer; } break;
      case 'pastor':     if (addChurchVoice)   { voiceNote('pastor'); return c.pastor; } break;
      case 'serve':      if (addChurchVoice)   { voiceNote('serve'); return c.serve; } break;
      case 'conference': if (updateConference) { updateConference({ feedback: [...((conference && conference.feedback) || []), { id: `cf-${Date.now()}`, text: t, from: who, at: new Date().toISOString() }] }); return c.conference; } break;
      case 'work':       if (addIncident)      { addIncident({ category: 'maintenance', description: t, urgency: 'incident', status: 'open', _note: cfg.sourceLabel }); return c.work; } break;
      case 'counseling': if (addInquiry) {
        // TLC bright line: inquiries is pre-intake, non-PHI, cloud-synced —
        // contact intent only; the words never cross. On the notes surface the
        // verbatim text is ALSO kept as a private device-local note.
        addInquiry({ firstName: who || cfg.inquiryFrom, lastName: '', phone: '', email: '', source: cfg.sourceTag, interest: 'counseling', bestTime: 'anytime', notes: cfg.counselingNote });
        if (cfg.saveNoteOnCounseling && addNote) addNote(t);
        return c.counseling;
      } break;
      case 'private':    if (addNote)          { addNote(t); return c.private; } break;
      default: break;
    }
    // Fallback: a private note where the surface keeps one, else a general
    // voice note for leadership.
    if (addNote)       { addNote(t); return c.private; }
    if (addChurchVoice) { voiceNote('voice'); return c.voice; }
    return null;
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const msg = dispatch(route, t, name.trim());
    if (msg) setConfirmation(msg);
    setText('');
    setTouchedRoute(false);
    setRoute(cfg.defaultRoute);
  };

  const active = DESTS.find(d => d.key === route) || DESTS[0];
  const recentItems = recent ? (recent || []).slice(-3).reverse() : null;

  return (
    <section className={`bg-white border-2 ${cfg.borderCls} p-4 sm:p-5`} aria-labelledby="onevoice-h">
      {heading && <h2 id="onevoice-h" className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{heading}</h2>}
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
      {(mic.supported || mic.error) && (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {mic.supported && (
            <button
              type="button"
              onClick={mic.toggle}
              aria-pressed={mic.listening}
              aria-label={mic.listening ? 'Stop voice input' : 'Start voice input — speak instead of typing'}
              className={`text-[11px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                mic.listening
                  ? 'bg-[#B85838] text-white border-[#B85838] animate-pulse'
                  : 'border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white'
              }`}
            >
              {mic.listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
          )}
          {mic.listening && (
            <span className="text-[10px] text-[#B85838] uppercase tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace' }}>listening…</span>
          )}
          {mic.error && (
            <span role="alert" className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{mic.error}</span>
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
            className={`text-[10px] uppercase tracking-wider px-2 py-1.5 min-h-[36px] border ${route === d.key ? (d.key === 'private' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-[#B85838] text-white border-[#B85838]') : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2 flex-wrap items-center">
        <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {active.hint}</span>
        {showName && (
          <input className="flex-1 min-w-[140px] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
        )}
        <button type="button" onClick={send} disabled={!text.trim()} className="bg-[#1A1815] text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] disabled:opacity-30">{submitLabel}</button>
      </div>
      {confirmation && <p className="text-[11px] text-[#5A6E3D] font-semibold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{confirmation}</p>}
      {recentItems && recentItems.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[#E8E4DC]">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Recently heard</div>
          <ul className="space-y-0.5">
            {recentItems.map(v => (
              <li key={v.id} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
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
