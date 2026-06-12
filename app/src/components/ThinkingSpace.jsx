// =============================================================================
// ThinkingSpace — a sovereign diary with room to think (and every door open)
// =============================================================================
// Darrell 2026-06-11: a diary that is siloed for sovereign growth in thinking,
// with help available whenever needed — and (same day) "all options are in
// Notes: tell PoeTech, church pastors, 1099 workers, counseling — same system
// under the hood, just starting on the page of Note."
//
// The routing is the SHARED engine (lib/one-voice-routing.js — MODE-ROUTING
// made concrete): this surface starts PRIVATE by default; your words can pull
// the route anywhere in the system; the suggestion is visible and you always
// have the last word. Private notes are siloed by design — device-local,
// never sold, never mined, never used to train anything.
//
// "Seek help": the Test (Philippians 4:8) is the on-device reflection aid
// today; a conversation with your OWN sovereign AI (on your NAS, opt-in) is
// on the build board. Counseling routes capture an intake note to the
// practice — contact-level only; clinical content stays with the clinician
// (the TLC bright line).
import React, { useState } from 'react';
import { suggestDestination, destinationsFor } from '../lib/one-voice-routing.js';

const THE_TEST = [
  ['True', 'Is it factual — or a fear wearing facts?'],
  ['Honorable', 'Does it carry dignity, or contempt?'],
  ['Just', 'Is it fair — to them, and to you?'],
  ['Pure', 'Is it free of bitterness and manipulation?'],
  ['Lovely', 'Does it draw you toward good?'],
  ['Commendable', 'Would you say it out loud, unashamed?'],
  ['Excellent', 'Is it worth your best attention?'],
  ['Praiseworthy', 'Is it worth keeping and amplifying?'],
];

const fieldCls = 'w-full p-3 border border-[#1A1815] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const DESTS = destinationsFor('notes');

export function ThinkingSpace({ notes = [], addNote, updateNote, deleteNote, togglePinNote, toggleNoteSource, sendToPoeTech, appDirectives = [], addPrayerRequest, addChurchVoice, addIncident, addInquiry }) {
  const [sourcesOnly, setSourcesOnly] = useState(false);
  const [draft, setDraft] = useState('');
  const [route, setRoute] = useState('private');
  const [touchedRoute, setTouchedRoute] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [testForId, setTestForId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState('');

  const onDraft = (v) => {
    setDraft(v);
    if (!touchedRoute) setRoute(suggestDestination(v, 'private'));
  };

  const save = () => {
    const t = draft.trim();
    if (!t) return;
    const who = name.trim();
    if (route === 'poetech' && sendToPoeTech) {
      sendToPoeTech(t);
      setConfirm('💡 PoeTech heard you — it’s on the build inbox. You shape what gets built.');
    } else if (route === 'prayer' && addPrayerRequest) {
      addPrayerRequest({ requester: who || 'church family', request: t, shareWithChurch: true });
      setConfirm('🙏 On the prayer list. The church is standing with you.');
    } else if (route === 'pastor' && addChurchVoice) {
      addChurchVoice({ id: `vo-${Date.now()}`, kind: 'pastor', text: t, from: who, at: new Date().toISOString() });
      setConfirm('⛪ A note to the pastors — they’ll see it on the Church tab.');
    } else if (route === 'serve' && addChurchVoice) {
      addChurchVoice({ id: `vo-${Date.now()}`, kind: 'serve', text: t, from: who, at: new Date().toISOString() });
      setConfirm('🤝 Leadership will see your serving hands — thank you.');
    } else if (route === 'work' && addIncident) {
      addIncident({ category: 'maintenance', description: t, urgency: 'incident', status: 'open', _note: 'from Thinking Space' });
      setConfirm('🛠 On the Action Queue as a work order — dispatch it to a worker from Big Picture.');
    } else if (route === 'counseling' && addInquiry) {
      // TLC bright line (2026-06-12 fix): the inquiries table is PRE-INTAKE,
      // non-PHI, and cloud-synced — the verbatim diary text must never land
      // there. Only contact intent crosses; the words themselves stay in a
      // private note on this device for the person to share with the
      // clinician directly.
      addInquiry({ firstName: who || '(from notes)', lastName: '', phone: '', email: '', source: 'thinking-space', interest: 'counseling', bestTime: 'anytime', notes: 'Requested counseling via Thinking Space. Their words stay private on their device — TLC connects directly.' });
      if (addNote) addNote(t);
      setConfirm('💚 The practice knows you’d like to talk — your words stayed private here, for you to share with them directly. Reaching out took courage.');
    } else {
      if (addNote) addNote(t);
      setConfirm('📓 Kept — private to you. Come back to it anytime.');
    }
    setDraft('');
    setTouchedRoute(false);
    setRoute('private');
  };

  const startEdit = (n) => { setEditingId(n.id); setEditText(n.text); };
  const commitEdit = () => { if (editingId && updateNote) updateNote(editingId, editText); setEditingId(null); };

  const active = DESTS.find(d => d.key === route) || DESTS[0];
  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.createdAt || '').localeCompare(a.createdAt || ''));
  const queryFiltered = query.trim() ? sorted.filter(n => (n.text || '').toLowerCase().includes(query.toLowerCase())) : sorted;
  const shown = sourcesOnly ? queryFiltered.filter(n => n.spiritualSource) : queryFiltered;
  const sourceCount = notes.filter(n => n.spiritualSource).length;
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u.slice(0, 40); } };

  return (
    <div className="space-y-4 max-w-3xl">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🕊 Thinking Space · your diary</div>
        <p className="text-xs text-[#5A5751] italic mt-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Think out loud, then come back to it. Private by default — and from right here your words can reach anyone in the system: PoeTech, the pastors, a worker, the practice. You always have the last word on where they go.
        </p>
        <textarea
          className={fieldCls}
          rows="3"
          placeholder="What are you thinking? A worry, an idea, a prayer, a repair, a question for the pastors…"
          value={draft}
          onChange={e => onDraft(e.target.value)}
        />
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {DESTS.map(d => (
            <button key={d.key} type="button" onClick={() => { setRoute(d.key); setTouchedRoute(true); }} aria-pressed={route === d.key} className={`text-[10px] uppercase tracking-wider px-2 py-1.5 min-h-[36px] border ${route === d.key ? (d.key === 'private' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-[#B85838] text-white border-[#B85838]') : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>{d.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {active.hint}</span>
          <input className="flex-1 min-w-[140px] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
          <button type="button" onClick={save} disabled={!draft.trim()} className="bg-[#1A1815] text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] disabled:opacity-30">Save</button>
        </div>
        {confirm && <p className="text-[11px] text-[#5A6E3D] font-semibold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{confirm}</p>}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your thoughts · {notes.length}</h2>
          <div className="flex items-center gap-1.5">
            {sourceCount > 0 && (
              <button type="button" onClick={() => setSourcesOnly(!sourcesOnly)} aria-pressed={sourcesOnly} className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${sourcesOnly ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'text-[#5A6E3D] border-[#5A6E3D] hover:bg-[#FAF8F4]'}`}>📖 Sources · {sourceCount}</button>
            )}
            {notes.length > 3 && (
              <input className="text-xs p-1.5 border border-[#E8E4DC] bg-white" placeholder="search your notes…" value={query} onChange={e => setQuery(e.target.value)} />
            )}
          </div>
        </div>
        {notes.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
            <div className="text-2xl mb-1" aria-hidden="true">🪶</div>
            <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>A quiet place to think.</p>
            <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Write the first thing on your mind above. It stays here, just for you, until you decide otherwise.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map(n => (
              <div key={n.id} className={`bg-white border p-3 ${n.pinned ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}>
                {editingId === n.id ? (
                  <>
                    <textarea className={fieldCls} rows="3" value={editText} onChange={e => setEditText(e.target.value)} />
                    <div className="flex gap-2 mt-1.5">
                      <button type="button" onClick={commitEdit} className="bg-[#1A1815] text-white px-3 py-1.5 text-[10px] uppercase tracking-wider hover:bg-[#B85838]">Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className="border border-[#1A1815] px-3 py-1.5 text-[10px] uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{n.pinned ? '📌 ' : ''}{n.spiritualSource ? '📖 ' : ''}{n.text} {n.sentToPoeTech && <span className="text-[9px] uppercase tracking-wider text-[#B85838]">· told PoeTech</span>}</p>
                    {(n.links || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(n.links || []).map(l => (
                          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white no-underline max-w-full truncate" title={l.url}>
                            🔗 {l.title || hostOf(l.url)}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
                      <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(n.createdAt || '').slice(0, 10)}</span>
                      <button type="button" onClick={() => setTestForId(testForId === n.id ? null : n.id)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">🔎 Examine it</button>
                      <button type="button" onClick={() => toggleNoteSource && toggleNoteSource(n.id)} className={`text-[10px] uppercase tracking-wider ${n.spiritualSource ? 'text-[#5A6E3D] font-semibold' : 'text-[#5A5751]'} hover:text-[#1A1815]`}>{n.spiritualSource ? '📖 Source ✓' : '📖 Mark source'}</button>
                      <button type="button" onClick={() => startEdit(n)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
                      <button type="button" onClick={() => togglePinNote && togglePinNote(n.id)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">{n.pinned ? 'Unpin' : 'Pin'}</button>
                      {!n.sentToPoeTech && <button type="button" onClick={() => { if (sendToPoeTech) { sendToPoeTech(n.text, n.id); } }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">💡 Tell PoeTech</button>}
                      <button type="button" onClick={() => { if (window.confirm('Delete this note?') && deleteNote) deleteNote(n.id); }} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete</button>
                    </div>
                    {testForId === n.id && (
                      <div className="mt-2 bg-[#FAF8F4] border border-[#5A6E3D] p-2.5">
                        <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Hold it to the light · Philippians 4:8</div>
                        <ul className="space-y-0.5">
                          {THE_TEST.map(([k, q]) => (
                            <li key={k} className="text-[11px]" style={{ fontFamily: '"Fraunces", serif' }}><span className="font-semibold text-[#1A1815]">{k}.</span> <span className="text-[#5A5751]">{q}</span></li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-[#5A5751] italic mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>A deeper conversation with your own sovereign AI — on your NAS, private, opt-in — is coming. For now, this is yours to weigh.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {appDirectives.length > 0 && (
        <section className="bg-white border border-[#B85838] p-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">💡 What you’ve told PoeTech · {appDirectives.length}</h2>
          <p className="text-[11px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
            These shape the build (a person or session acts on them; nothing auto-builds). They surface on the PoeTech Build board.
          </p>
          <ul className="space-y-1">
            {[...appDirectives].slice(-6).reverse().map(d => (
              <li key={d.id} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>“{d.text.slice(0, 120)}{d.text.length > 120 ? '…' : ''}” <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(d.at || '').slice(0, 10)}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ThinkingSpace;
