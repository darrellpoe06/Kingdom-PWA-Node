// =============================================================================
// ThinkingSpace — a sovereign diary with room to think (and a way to be heard)
// =============================================================================
// Darrell 2026-06-11: "Can people think and communicate with it and come back
// to their thoughts like a diary with an AI attached that is siloed for their
// sovereign purposes — growth and development in thinking — with the ability to
// seek help whenever they need it? Let's make notes feel intuitive."
//
// Two truths hold this together:
//   1. PRIVATE BY DEFAULT. A note is yours — siloed, never sold, never mined,
//      never used to train anything (project_photo_sovereignty applies to
//      thoughts too). Sharing is always a deliberate choice, never a default
//      (project_generous_collective_anthropology).
//   2. ONE INPUT, YOU DECIDE WHERE IT GOES. Like One Voice on the Church tab
//      (COUNCIL-CHAMBER): you write; you choose 📓 keep it private, or
//      💡 tell PoeTech (a build directive — captured for a person/session to
//      act on; it never auto-acts, per the three-brakes rule).
//
// "Seek help whenever they need it": the Test (Philippians 4:8) is a real,
// on-device reflection aid TODAY — examine a thought against eight filters.
// A deeper conversation with your OWN sovereign AI (on your NAS, opt-in,
// private) is the next layer — see docs/99-session-notes/2026-06-11-
// thinking-space-and-real-data.md. Nothing here pretends to be that yet.
import React, { useState } from 'react';

// The Test — MIND-OF-CHRIST / Philippians 4:8. A thought held to the light.
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

export function ThinkingSpace({ notes = [], addNote, updateNote, deleteNote, togglePinNote, sendToPoeTech, appDirectives = [] }) {
  const [draft, setDraft] = useState('');
  const [route, setRoute] = useState('private');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [testForId, setTestForId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState('');

  const save = () => {
    const t = draft.trim();
    if (!t) return;
    if (route === 'poetech') {
      if (sendToPoeTech) sendToPoeTech(t);
      setConfirm('💡 PoeTech heard you — it’s on the build inbox. You shape what gets built.');
    } else {
      if (addNote) addNote(t);
      setConfirm('📓 Kept — private to you. Come back to it anytime.');
    }
    setDraft('');
    setRoute('private');
  };

  const startEdit = (n) => { setEditingId(n.id); setEditText(n.text); };
  const commitEdit = () => { if (editingId && updateNote) updateNote(editingId, editText); setEditingId(null); };

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.createdAt || '').localeCompare(a.createdAt || ''));
  const shown = query.trim() ? sorted.filter(n => (n.text || '').toLowerCase().includes(query.toLowerCase())) : sorted;

  return (
    <div className="space-y-4 max-w-3xl">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🕊 Thinking Space · your diary</div>
        <p className="text-xs text-[#5A5751] italic mt-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Think out loud, then come back to it. Private to you by design — never sold, never mined, never used to train anything.
        </p>
        <textarea
          className={fieldCls}
          rows="3"
          placeholder="What are you thinking? A worry, an idea, a prayer, a plan, a thing you don't want to forget…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <button type="button" onClick={() => setRoute('private')} aria-pressed={route === 'private'} className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 min-h-[36px] border ${route === 'private' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>📓 Keep private</button>
          <button type="button" onClick={() => setRoute('poetech')} aria-pressed={route === 'poetech'} className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 min-h-[36px] border ${route === 'poetech' ? 'bg-[#B85838] text-white border-[#B85838]' : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>💡 Tell PoeTech</button>
          <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{route === 'poetech' ? '→ becomes a build directive (a person acts on it; never auto-built)' : '→ stays yours alone'}</span>
          <button type="button" onClick={save} disabled={!draft.trim()} className="ml-auto bg-[#1A1815] text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] disabled:opacity-30">Save</button>
        </div>
        {confirm && <p className="text-[11px] text-[#5A6E3D] font-semibold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{confirm}</p>}
      </section>

      {/* THE THOUGHTS — come back to them */}
      <section>
        <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your thoughts · {notes.length}</h2>
          {notes.length > 3 && (
            <input className="text-xs p-1.5 border border-[#E8E4DC] bg-white" placeholder="search your notes…" value={query} onChange={e => setQuery(e.target.value)} />
          )}
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
                    <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{n.pinned ? '📌 ' : ''}{n.text}{n.sentToPoeTech ? ' ' : ''}{n.sentToPoeTech && <span className="text-[9px] uppercase tracking-wider text-[#B85838]">· told PoeTech</span>}</p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
                      <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(n.createdAt || '').slice(0, 10)}</span>
                      <button type="button" onClick={() => setTestForId(testForId === n.id ? null : n.id)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">🔎 Examine it</button>
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

      {/* WHAT YOU'VE TOLD POETECH — the in-app build inbox */}
      {appDirectives.length > 0 && (
        <section className="bg-white border border-[#B85838] p-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">💡 What you’ve told PoeTech · {appDirectives.length}</h2>
          <p className="text-[11px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Yes — you can tell the app now. These shape the build (a person or session acts on them; nothing auto-builds). They’ll surface on the PoeTech Build board.
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
