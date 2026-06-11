// =============================================================================
// ChurchOneVoice — one box for everything the church family wants to say
// =============================================================================
// Darrell 2026-06-11: "Can we make all these inputs one, with all the options
// and opportunities of each, to streamline and make it feel more like this
// experience with you?" This is the Church tab's expression of the
// COUNCIL-CHAMBER foundation: ONE input, the system deduces the needed
// process — and per MODE-ROUTING, the deduction is VISIBLE and the person
// always has the last word (the suggested route lights up as a badge; tap a
// different one to override; nothing auto-routes invisibly).
//
// Routes (each lands in its real destination, not a junk drawer):
//   🙏 Prayer      → the church prayer list (addPrayerRequest)
//   ⛪ Conference  → the Assembly feedback line (conference.feedback)
//   🤝 Serve       → a serving-hands note leadership can act on (churchVoice)
//   💬 Voice       → ideas, questions, testimony, anything (churchVoice)
// Built for Bishop Gwin first: the head shepherd, under the Shepherd and
// Overseer of souls (1 Peter 2:25), should find this effortless.
import React, { useState } from 'react';

const ROUTES = [
  { key: 'prayer', label: '🙏 Prayer', hint: 'goes to the prayer list' },
  { key: 'conference', label: '⛪ Conference', hint: 'goes to the Assembly feedback line' },
  { key: 'serve', label: '🤝 Serve', hint: 'tells leadership you want to help' },
  { key: 'voice', label: '💬 Voice', hint: 'ideas, questions, testimony — anything' },
];

// Keyword classifier-lite: SUGGESTS a route; never silently decides.
export function suggestRoute(text) {
  const t = (text || '').toLowerCase();
  if (/\bpray|prayer|intercede|heal|comfort|grie[fv]|salvation\b/.test(t)) return 'prayer';
  if (/conference|assembly|register|rsvp|hotel|program|session/.test(t)) return 'conference';
  if (/\bserve|volunteer|usher|hospitality|help with|sign me up|kitchen|media team\b/.test(t)) return 'serve';
  return 'voice';
}

export function ChurchOneVoice({ addPrayerRequest, updateConference, conference, addChurchVoice, churchVoice = [] }) {
  const [text, setText] = useState('');
  const [route, setRoute] = useState('voice');
  const [touchedRoute, setTouchedRoute] = useState(false);
  const [name, setName] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const onText = (v) => {
    setText(v);
    if (!touchedRoute) setRoute(suggestRoute(v));
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (route === 'prayer' && addPrayerRequest) {
      addPrayerRequest({ requester: name.trim() || 'church family', request: t, shareWithChurch: true });
      setConfirmation('🙏 On the prayer list. The church is standing with you.');
    } else if (route === 'conference' && updateConference) {
      updateConference({ feedback: [...((conference && conference.feedback) || []), { id: `cf-${Date.now()}`, text: t, from: name.trim(), at: new Date().toISOString() }] });
      setConfirmation('⛪ Received for the Assembly — it goes straight onto the build list.');
    } else if (addChurchVoice) {
      addChurchVoice({ id: `vo-${Date.now()}`, kind: route === 'serve' ? 'serve' : 'voice', text: t, from: name.trim(), at: new Date().toISOString() });
      setConfirmation(route === 'serve' ? '🤝 Leadership will see your serving hands — thank you.' : '💬 Heard and kept. Thank you for your voice.');
    }
    setText('');
    setTouchedRoute(false);
    setRoute('voice');
  };

  const active = ROUTES.find(r => r.key === route) || ROUTES[3];
  const recent = (churchVoice || []).slice(-3).reverse();

  return (
    <section className="bg-white border-2 border-[#B85838] p-4 sm:p-5" aria-labelledby="onevoice-h">
      <h2 id="onevoice-h" className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🕊 Speak — one place for everything</h2>
      <p className="text-xs text-[#5A5751] italic mt-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Prayer, the Assembly, serving, an idea, a question — just say it. We&apos;ll suggest where it goes; you always have the last word.
      </p>
      <textarea
        className="w-full p-3 border border-[#1A1815] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
        rows="2"
        placeholder="e.g., Please pray for Sister Mae's recovery · We need a printable Assembly program · I can help with media on Sundays…"
        value={text}
        onChange={e => onText(e.target.value)}
      />
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {ROUTES.map(r => (
          <button
            key={r.key}
            type="button"
            onClick={() => { setRoute(r.key); setTouchedRoute(true); }}
            aria-pressed={route === r.key}
            className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 min-h-[36px] border ${route === r.key ? 'bg-[#B85838] text-white border-[#B85838]' : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}
          >
            {r.label}
          </button>
        ))}
        <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {active.hint}</span>
      </div>
      <div className="flex gap-1.5 mt-2 flex-wrap items-center">
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
                {v.kind === 'serve' ? '🤝' : '💬'} “{v.text.slice(0, 90)}{v.text.length > 90 ? '…' : ''}”{v.from ? ` — ${v.from}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default ChurchOneVoice;
