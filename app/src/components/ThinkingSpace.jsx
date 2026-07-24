// =============================================================================
// ThinkingSpace — a sovereign diary with room to think (and every door open)
// =============================================================================
// Darrell 2026-06-11: a diary that is siloed for sovereign growth in thinking,
// with help available whenever needed — and "all options are in Notes: tell
// PoeTech, church pastors, 1099 workers, counseling — same system under the
// hood, just starting on the page of Note."
//
// The input box is the shared <OneVoiceInput> (the master input — same
// classifier, same dispatch, voice built in) configured for the NOTES surface:
// starts PRIVATE, the words can pull the route anywhere, the suggestion is
// visible, the person has the last word. Private notes are siloed by design —
// device-local, never sold, mined, or used to train anything. Around the input
// sits everything that is Thinking-Space-only: the notes list, search, the
// Philippians 4:8 "examine it" tool, and the PoeTech directives roll-up.
// Consolidated onto OneVoiceInput 2026-06-15.
import React, { useState } from 'react';
import { readDraft, writeDraft, clearDraft } from '../lib/draft-autosave.js';
import OneVoiceInput from './OneVoiceInput.jsx';

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

export function ThinkingSpace({ notes = [], addNote, updateNote, deleteNote, togglePinNote, toggleNoteSource, sendToPoeTech, appDirectives = [], addPrayerRequest, addChurchVoice, addIncident, addInquiry }) {
  const [sourcesOnly, setSourcesOnly] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateText, setUpdateText] = useState('');
  const [testForId, setTestForId] = useState(null);
  const [query, setQuery] = useState('');

  // Editing an existing note keeps the Google-Doc contract too (DR-0151,
  // Darrell 2026-07-10: "will the notes sections auto save notes for return to
  // keep editing?"): the in-progress edit drafts itself per note; reopening the
  // note offers the unsaved edit; Save or Cancel settles it.
  const editDraftKey = (id) => `notes-edit:${id}`;
  const startEdit = (n) => {
    const pending = readDraft(editDraftKey(n.id));
    setEditingId(n.id);
    setEditText(pending ? pending.text : n.text);
  };
  const onEditText = (v) => {
    setEditText(v);
    if (editingId) writeDraft(editDraftKey(editingId), { text: v });
  };
  const commitEdit = () => {
    if (editingId && updateNote) updateNote(editingId, editText);
    if (editingId) clearDraft(editDraftKey(editingId));
    setEditingId(null);
  };
  const cancelEdit = () => {
    if (editingId) clearDraft(editDraftKey(editingId)); // an abandoned edit is abandoned on purpose
    setEditingId(null);
  };

  // Add-onto (append) — a living note (a fast log, a prayer, the bills) grows
  // with a dated update while the ORIGINAL stays intact above it (Darrell +
  // Christina 2026-07-20: "edit AND add onto"). It appends a timestamped line to
  // the note's own text via the existing updateNote (no separate store, so the
  // monolith stays frozen); editing still gives full control over the whole
  // note. Same Google-Doc draft contract as editing.
  const updateDraftKey = (id) => `notes-addupdate:${id}`;
  const startUpdate = (n) => {
    const pending = readDraft(updateDraftKey(n.id));
    setUpdatingId(n.id);
    setUpdateText(pending ? pending.text : '');
  };
  const onUpdateText = (v) => {
    setUpdateText(v);
    if (updatingId) writeDraft(updateDraftKey(updatingId), { text: v });
  };
  const commitUpdate = () => {
    const t = updateText.trim();
    const base = notes.find(x => x.id === updatingId);
    if (updatingId && t && base && updateNote) {
      const today = new Date().toISOString().slice(0, 10);
      updateNote(updatingId, `${base.text}\n\n— update ${today}: ${t}`);
    }
    if (updatingId) clearDraft(updateDraftKey(updatingId));
    setUpdatingId(null);
    setUpdateText('');
  };
  const cancelUpdate = () => {
    if (updatingId) clearDraft(updateDraftKey(updatingId));
    setUpdatingId(null);
    setUpdateText('');
  };

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.createdAt || '').localeCompare(a.createdAt || ''));
  const queryFiltered = query.trim() ? sorted.filter(n => (n.text || '').toLowerCase().includes(query.toLowerCase())) : sorted;
  const shown = sourcesOnly ? queryFiltered.filter(n => n.spiritualSource) : queryFiltered;
  const sourceCount = notes.filter(n => n.spiritualSource).length;
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u.slice(0, 40); } };

  return (
    {/* Full-width (Darrell 2026-07-24: "why not fill up the whole page") — the
        old max-w-3xl cap left half a desktop empty; the whole-page rule is the
        consistency guard's width-cap class, one fewer grandfathered today. */}
    <div className="space-y-4">
      <OneVoiceInput
        surface="notes"
        heading="🕊 Thinking Space · your diary"
        intro="Think out loud, then come back to it. Private by default — and from right here your words can reach anyone in the system: PoeTech, the pastors, a worker, the practice. You always have the last word on where they go."
        placeholder="What are you thinking? A worry, an idea, a prayer, a repair, a question for the pastors…"
        submitLabel="Save"
        addNote={addNote}
        sendToPoeTech={sendToPoeTech}
        addPrayerRequest={addPrayerRequest}
        addChurchVoice={addChurchVoice}
        addIncident={addIncident}
        addInquiry={addInquiry}
      />

      <section>
        <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
          <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your thoughts · {notes.length}</h2>
          <div className="flex items-center gap-1.5">
            {sourceCount > 0 && (
              <button type="button" onClick={() => setSourcesOnly(!sourcesOnly)} aria-pressed={sourcesOnly} className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border ${sourcesOnly ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'text-[#5A6E3D] border-[#5A6E3D] hover:bg-[#FAF8F4]'}`}>📖 Sources · {sourceCount}</button>
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
                    <textarea className={fieldCls} rows="3" value={editText} onChange={e => onEditText(e.target.value)} />
                    <div className="flex gap-2 mt-1.5">
                      <button type="button" onClick={commitEdit} className="bg-[#1A1815] text-white px-3 py-1.5 text-[0.625rem] uppercase tracking-wider hover:bg-[#B85838]">Save</button>
                      <button type="button" onClick={cancelEdit} className="border border-[#1A1815] px-3 py-1.5 text-[0.625rem] uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{n.pinned ? '📌 ' : ''}{n.spiritualSource ? '📖 ' : ''}{n.text} {n.sentToPoeTech && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838]">· on the build list</span>}</p>
                    {(n.links || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(n.links || []).map(l => (
                          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white no-underline max-w-full truncate" title={l.url}>
                            🔗 {l.title || hostOf(l.url)}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
                      <span className="text-[0.5625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(n.createdAt || '').slice(0, 10)}</span>
                      <button type="button" onClick={() => setTestForId(testForId === n.id ? null : n.id)} className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">🔎 Examine it</button>
                      <button type="button" onClick={() => toggleNoteSource && toggleNoteSource(n.id)} className={`text-[0.625rem] uppercase tracking-wider ${n.spiritualSource ? 'text-[#5A6E3D] font-semibold' : 'text-[#5A5751]'} hover:text-[#1A1815]`}>{n.spiritualSource ? '📖 Source ✓' : '📖 Mark source'}</button>
                      <button type="button" onClick={() => { setUpdatingId(null); startEdit(n); }} className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white">Edit</button>
                      <button type="button" onClick={() => startUpdate(n)} className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white">Add update</button>
                      <button type="button" onClick={() => togglePinNote && togglePinNote(n.id)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">{n.pinned ? 'Unpin' : 'Pin'}</button>
                      {!n.sentToPoeTech && <button type="button" onClick={() => { if (sendToPoeTech) { sendToPoeTech(n.text, n.id); } }} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">💡 Tell PoeTech</button>}
                      <button type="button" onClick={() => { if (window.confirm('Delete this note?') && deleteNote) deleteNote(n.id); }} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete</button>
                    </div>
                    {updatingId === n.id && (
                      <div className="mt-2">
                        <textarea className={fieldCls} rows="2" placeholder="Add an update — the original stays; this appends below it with today's date…" value={updateText} onChange={e => onUpdateText(e.target.value)} />
                        <div className="flex gap-2 mt-1.5">
                          <button type="button" onClick={commitUpdate} className="bg-[#5A6E3D] text-white px-3 py-1.5 text-[0.625rem] uppercase tracking-wider hover:bg-[#1A1815]">Save update</button>
                          <button type="button" onClick={cancelUpdate} className="border border-[#1A1815] px-3 py-1.5 text-[0.625rem] uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
                        </div>
                      </div>
                    )}
                    {testForId === n.id && (
                      <div className="mt-2 bg-[#FAF8F4] border border-[#5A6E3D] p-2.5">
                        <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Hold it to the light · Philippians 4:8</div>
                        <ul className="space-y-0.5">
                          {THE_TEST.map(([k, q]) => (
                            <li key={k} className="text-[0.6875rem]" style={{ fontFamily: '"Fraunces", serif' }}><span className="font-semibold text-[#1A1815]">{k}.</span> <span className="text-[#5A5751]">{q}</span></li>
                          ))}
                        </ul>
                        <p className="text-[0.625rem] text-[#5A5751] italic mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>A deeper conversation with your own sovereign AI — on your NAS, private, opt-in — is coming. For now, this is yours to weigh.</p>
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
          <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">💡 What you’ve told PoeTech · {appDirectives.length}</h2>
          <p className="text-[0.6875rem] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
            These shape the build (a person or session acts on them; nothing auto-builds). They surface on the PoeTech Build board.
          </p>
          <ul className="space-y-1">
            {[...appDirectives].slice(-6).reverse().map(d => (
              <li key={d.id} className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>“{d.text.slice(0, 120)}{d.text.length > 120 ? '…' : ''}” <span className="text-[0.5625rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(d.at || '').slice(0, 10)}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ThinkingSpace;
