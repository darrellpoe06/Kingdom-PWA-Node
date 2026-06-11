// =============================================================================
// ChurchOneVoice — one box for everything the church family wants to say
// =============================================================================
// Same routing engine as the Thinking Space (lib/one-voice-routing.js) — one
// system under the hood, different starting page: the Church surface expects
// spiritual sources (default: prayer), but if someone starts talking about
// development and the PoeTech pipeline, the route follows the words there
// (Darrell 2026-06-11). Per MODE-ROUTING the suggestion is visible and the
// person always has the last word. Built for Bishop Gwin first: the head
// shepherd, under the Shepherd and Overseer of souls (1 Peter 2:25).
import React, { useState } from 'react';
import { suggestDestination, destinationsFor } from '../lib/one-voice-routing.js';

const DESTS = destinationsFor('church');

export function ChurchOneVoice({ addPrayerRequest, updateConference, conference, addChurchVoice, churchVoice = [], sendToPoeTech, addIncident, addInquiry }) {
  const [text, setText] = useState('');
  const [route, setRoute] = useState('prayer');
  const [touchedRoute, setTouchedRoute] = useState(false);
  const [name, setName] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const onText = (v) => {
    setText(v);
    if (!touchedRoute) setRoute(suggestDestination(v, 'prayer'));
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const who = name.trim();
    if (route === 'prayer' && addPrayerRequest) {
      addPrayerRequest({ requester: who || 'church family', request: t, shareWithChurch: true });
      setConfirmation('🙏 On the prayer list. The church is standing with you.');
    } else if (route === 'conference' && updateConference) {
      updateConference({ feedback: [...((conference && conference.feedback) || []), { id: `cf-${Date.now()}`, text: t, from: who, at: new Date().toISOString() }] });
      setConfirmation('🎪 Received for the Assembly — it goes straight onto the build list.');
    } else if (route === 'poetech' && sendToPoeTech) {
      sendToPoeTech(t);
      setConfirmation('💡 PoeTech heard you — program processes and procedures begin. It’s on the build inbox.');
    } else if (route === 'work' && addIncident) {
      addIncident({ category: 'maintenance', description: t, urgency: 'incident', status: 'open', _note: 'from Church One Voice' });
      setConfirmation('🛠 On the Action Queue as a work order — it can dispatch to a worker from Big Picture.');
    } else if (route === 'counseling' && addInquiry) {
      addInquiry({ firstName: who || '(from church)', lastName: '', phone: '', email: '', source: 'church-one-voice', interest: 'counseling', bestTime: 'anytime', notes: t });
      setConfirmation('💚 A private intake note went to the practice. Reaching out took courage.');
    } else if (addChurchVoice) {
      const kind = route === 'serve' ? 'serve' : (route === 'pastor' ? 'pastor' : 'voice');
      addChurchVoice({ id: `vo-${Date.now()}`, kind, text: t, from: who, at: new Date().toISOString() });
      setConfirmation(kind === 'serve' ? '🤝 Leadership will see your serving hands — thank you.' : kind === 'pastor' ? '⛪ A note to the pastors — received.' : '💬 Heard and kept. Thank you for your voice.');
    }
    setText('');
    setTouchedRoute(false);
    setRoute('prayer');
  };

  const active = DESTS.find(r => r.key === route) || DESTS[0];
  const recent = (churchVoice || []).slice(-3).reverse();

  return (
    <section className="bg-white border-2 border-[#B85838] p-4 sm:p-5" aria-labelledby="onevoice-h">
      <h2 id="onevoice-h" className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🕊 Speak — one place for everything</h2>
      <p className="text-xs text-[#5A5751] italic mt-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Prayer, the Assembly, the pastors, serving, a repair, counseling, even an idea for the app — just say it. We&apos;ll suggest where it goes; you always have the last word.
      </p>
      <textarea
        className="w-full p-3 border border-[#1A1815] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
        rows="2"
        placeholder="e.g., Please pray for Sister Mae's recovery · The fellowship-hall sink is leaking · The app should show giving statements…"
        value={text}
        onChange={e => onText(e.target.value)}
      />
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {DESTS.map(r => (
          <button
            key={r.key}
            type="button"
            onClick={() => { setRoute(r.key); setTouchedRoute(true); }}
            aria-pressed={route === r.key}
            className={`text-[10px] uppercase tracking-wider px-2 py-1.5 min-h-[36px] border ${route === r.key ? 'bg-[#B85838] text-white border-[#B85838]' : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2 flex-wrap items-center">
        <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {active.hint}</span>
        <input className="flex-1 min-w-[140px] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
        <button type="button" onClick={send} disabled={!text.trim()} className="bg-[#1A1815] text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] disabled:opacity-30">Send</button>
      </div>
      {confirmation && <p className="text-[11px] text-[#5A6E3D] font-semibold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{confirmation}</p>}
      {recent.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[#E8E4DC]">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Recently heard</div>
          <ul className="space-y-0.5">
            {recent.map(v => (
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

export default ChurchOneVoice;
