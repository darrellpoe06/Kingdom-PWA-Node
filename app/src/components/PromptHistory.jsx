// =============================================================================
// PromptHistory — "Your prompts": every lesson and PoeTech request you sent,
// plus the ones you chose to save; dated, sortable, searchable, reusable (DR-0615)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SORTS, sortPrompts, searchPrompts, dateText, listPrompts, setKept, deletePrompt, sendPromptToBox, addToBox, promptType, promptTypes } from '../lib/saved-prompts.js';
// ONE ROW PER TYPE, THE STANDARD SUB-TABS (DR-0116; Darrell 2026-10-20: "Can we
// sort based on type and use our standard subtab standard?"). The list is read
// through the same chip row every other surface uses, one type at a time, with
// All first; the Sort control gains "By type" for the All view.
import SectionTabs from './SectionTabs.jsx';
import supabase from '../lib/supabase.js';
import { confirmThen } from '../lib/confirm-action.js';
// THE WORDS COME BACK WHERE THE LINE WAS MADE (DR-1141). A spoken lesson's row
// here reads "the words come back from Whisper" — and kept reading it eleven
// days after they had (Darrell 2026-10-20: "Not working..."). The words land
// on the lesson rows (lib/lesson-inbox.js); this row now shows where they are.
import { fetchMyLessons } from '../lib/lesson-inbox.js';
import { wordsForPrompt, anySpokenLine } from '../lib/prompt-words.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border';
const LIVE = { supabase, lessons: () => fetchMyLessons({ supabase }) };
const NO_LESSONS = { ok: false, items: [] };

export default function PromptHistory({ deps = LIVE, refreshKey = 0 }) {
  const [state, setState] = useState({ ok: false, rows: [], reason: 'loading' });
  const [by, setBy] = useState('recent');
  const [query, setQuery] = useState('');
  const [said, setSaid] = useState('');
  // The person's own lesson rows, read once per load and only when a row here
  // is a spoken-lesson line; every other prompt costs nothing.
  const [lessons, setLessons] = useState(NO_LESSONS);
  const [opened, setOpened] = useState({});

  const load = useCallback(() => { listPrompts(deps).then(setState); }, [deps]);
  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => {
    if (!state.ok || !anySpokenLine(state.rows)) return;
    const read = deps.lessons || (() => fetchMyLessons({ supabase: deps.supabase }));
    let live = true;
    Promise.resolve().then(read).then((r) => { if (live) setLessons(r && r.ok ? r : NO_LESSONS); }).catch(() => { if (live) setLessons(NO_LESSONS); });
    return () => { live = false; };
  }, [state, deps]);

  const shown = useMemo(() => {
    const sorted = sortPrompts(state.rows, by);
    return query.trim() ? searchPrompts(sorted, query) : sorted;
  }, [state.rows, by, query]);

  const copy = async (body) => {
    try { await navigator.clipboard.writeText(body); setSaid('Copied.'); } catch { setSaid('Copy is not allowed in this browser; use "Put it in the box".'); }
  };

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4" data-testid="prompt-history">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your prompts · {state.rows.length}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-[0.625rem] text-[#5A5751]" style={SERIF}>
            Sort{' '}
            <select data-testid="prompt-sort" value={by} onChange={(e) => setBy(e.target.value)} className="min-h-[44px] border border-[#E8E4DC] bg-white px-2 text-xs text-[#1A1815]">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <input data-testid="prompt-search" aria-label="Find a prompt, or similar ones" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="find this, or similar…" className="min-h-[44px] border border-[#E8E4DC] bg-white px-2 text-xs text-[#1A1815]" />
        </div>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF}>
        Every lesson and PoeTech request you send is kept here, dated, with how often you used it. Anything else is kept when you choose Save as prompt. Only you can see these.
      </p>
      {said && <p role="status" className="text-[0.6875rem] text-[#5A6E3D] mt-1" style={SERIF}>{said}</p>}
      {!state.ok && state.reason !== 'loading' && (
        <p className="text-[0.6875rem] text-[#B85838] mt-2" style={SERIF} data-testid="prompt-unavailable">Your prompts could not be read ({state.reason}). Sign in, then reopen this page.</p>
      )}
      {state.ok && state.rows.length === 0 && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={SERIF}>Nothing kept yet. Send a lesson or a PoeTech request above, or choose Save as prompt.</p>
      )}
      {state.ok && state.rows.length > 0 && shown.length === 0 && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={SERIF}>No prompt shares a word with that search.</p>
      )}
      {state.ok && state.rows.length > 0 && (
        <SectionTabs
          variant="sub"
          idBase="prompts"
          ariaLabel="Prompts by type"
          defaultId="all"
          sections={[
            { id: 'all', label: `All · ${shown.length}`, render: () => renderRows(shown) },
            ...promptTypes(shown).map((t) => ({ id: t.key, label: `${t.label} · ${t.count}`, render: () => renderRows(shown.filter((p) => promptType(p) === t.key)) })),
          ]}
        />
      )}
    </section>
  );

  function renderRows(rows) {
    return (
      <ul className="mt-2 space-y-2" data-testid="prompt-list">
        {rows.map((p) => (
          <li key={p.id} data-testid="prompt-row" className="border border-[#E8E4DC] p-2">
            <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>
              {dateText(p.last_used_at)}
              {p.destination ? ` · ${p.destination}` : ''}
              {p.use_count > 1 ? ` · used ${p.use_count} times, first ${dateText(p.created_at)}` : ''}
              {p.kept ? ' · kept' : ''}
            </p>
            {p.title && <p className="text-sm text-[#1A1815] font-semibold" style={SERIF}>{p.title}</p>}
            <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words" style={SERIF}>{p.body}</p>
            {(() => {
              const w = wordsForPrompt(p, lessons.items);
              if (!w) return null;
              if (w.state === 'written') {
                return (
                  <div className="mt-1 border-l-2 border-[#5A6E3D] pl-2" data-testid="prompt-words" data-state="written">
                    <p className="text-[0.6875rem] text-[#5A6E3D]" style={SERIF}>
                      The words came back {dateText(w.at)}{w.rung ? `, written by Whisper on ${w.rung}` : ''}. They are under Your lessons too.
                    </p>
                    {opened[p.id] && <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF} data-testid="prompt-words-text">{w.words}</p>}
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <button type="button" data-testid="prompt-words-show" aria-expanded={!!opened[p.id]} onClick={() => setOpened((o) => ({ ...o, [p.id]: !o[p.id] }))} className={`${BTN} border-[#5A6E3D] text-[#5A6E3D]`}>{opened[p.id] ? 'Hide the words' : 'Show the words'}</button>
                      <button type="button" data-testid="prompt-words-use" onClick={() => { sendPromptToBox(w.words); setSaid('The words are in the box above. Choose where they go, then send.'); }} className={`${BTN} border-[#1A1815] text-[#1A1815]`}>Put the words in the box</button>
                      <button type="button" data-testid="prompt-words-add" onClick={() => { addToBox(w.words); setSaid('The words were added under what the box holds. Gather what belongs together, choose where it goes, then send.'); }} className={`${BTN} border-[#5A6E3D] text-[#5A6E3D]`}>Add the words to the box</button>
                    </div>
                  </div>
                );
              }
              if (w.state === 'failed') {
                return <p className="text-[0.6875rem] text-[#B85838] mt-1" style={SERIF} data-testid="prompt-words" data-state="failed">Whisper could not write this one{w.at ? ` (${dateText(w.at)})` : ''}{w.why ? `: ${w.why}` : '.'} The recording is kept on our own machine and is tried again when a Whisper computer answers.</p>;
              }
              if (w.state === 'waiting') {
                return <p className="text-[0.6875rem] text-[#8B6F47] mt-1" style={SERIF} data-testid="prompt-words" data-state="waiting">Still waiting for the words: the recording reached our own machine {dateText(w.at)}, and Whisper there has not written it yet. A long recording is worked through across several passes.</p>;
              }
              return <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF} data-testid="prompt-words" data-state="unmatched">No recording of {w.clock} is on record for this line{lessons.ok ? '' : ' (your lessons could not be read; sign in, then reopen this page)'}. A line sent while signed out, or whose upload failed, has no words to come back.</p>;
            })()}
            <div className="flex gap-1.5 mt-1 flex-wrap">
              <button type="button" data-testid="prompt-use" onClick={() => { sendPromptToBox(p.body); setSaid('Put in the box above. Choose where it goes, then send.'); }} className={`${BTN} border-[#1A1815] text-[#1A1815]`}>Put it in the box</button>
              <button type="button" data-testid="prompt-add" onClick={() => { addToBox(p.body); setSaid('Added under what the box holds. Gather what belongs together, choose where it goes, then send.'); }} className={`${BTN} border-[#5A6E3D] text-[#5A6E3D]`}>Add to the box</button>
              <button type="button" onClick={() => copy(p.body)} className={`${BTN} border-[#E8E4DC] text-[#5A5751]`}>Copy</button>
              <button type="button" data-testid="prompt-keep" aria-pressed={!!p.kept} onClick={async () => { if (await setKept({ ...deps, id: p.id, kept: !p.kept })) load(); }} className={`${BTN} ${p.kept ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'border-[#5A6E3D] text-[#5A6E3D]'}`}>{p.kept ? 'Kept' : 'Keep'}</button>
              <button type="button" data-testid="prompt-delete" onClick={confirmThen('Delete this prompt from your history? This cannot be undone.', async () => { if (await deletePrompt({ ...deps, id: p.id })) load(); })} className={`${BTN} border-[#E8E4DC] text-[#B85838]`}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    );
  }
}
