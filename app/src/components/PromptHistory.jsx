// =============================================================================
// PromptHistory — "Your prompts": every lesson and PoeTech request you sent,
// plus the ones you chose to save; dated, sortable, searchable, reusable (DR-0615)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SORTS, sortPrompts, searchPrompts, dateText, listPrompts, setKept, deletePrompt, sendPromptToBox } from '../lib/saved-prompts.js';
import supabase from '../lib/supabase.js';
import { confirmThen } from '../lib/confirm-action.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border';
const LIVE = { supabase };

export default function PromptHistory({ deps = LIVE, refreshKey = 0 }) {
  const [state, setState] = useState({ ok: false, rows: [], reason: 'loading' });
  const [by, setBy] = useState('recent');
  const [query, setQuery] = useState('');
  const [said, setSaid] = useState('');

  const load = useCallback(() => { listPrompts(deps).then(setState); }, [deps]);
  useEffect(() => { load(); }, [load, refreshKey]);

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
      <ul className="mt-2 space-y-2">
        {shown.map((p) => (
          <li key={p.id} data-testid="prompt-row" className="border border-[#E8E4DC] p-2">
            <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>
              {dateText(p.last_used_at)}
              {p.destination ? ` · ${p.destination}` : ''}
              {p.use_count > 1 ? ` · used ${p.use_count} times, first ${dateText(p.created_at)}` : ''}
              {p.kept ? ' · kept' : ''}
            </p>
            {p.title && <p className="text-sm text-[#1A1815] font-semibold" style={SERIF}>{p.title}</p>}
            <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words" style={SERIF}>{p.body}</p>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              <button type="button" data-testid="prompt-use" onClick={() => { sendPromptToBox(p.body); setSaid('Put in the box above. Choose where it goes, then send.'); }} className={`${BTN} border-[#1A1815] text-[#1A1815]`}>Put it in the box</button>
              <button type="button" onClick={() => copy(p.body)} className={`${BTN} border-[#E8E4DC] text-[#5A5751]`}>Copy</button>
              <button type="button" data-testid="prompt-keep" aria-pressed={!!p.kept} onClick={async () => { if (await setKept({ ...deps, id: p.id, kept: !p.kept })) load(); }} className={`${BTN} ${p.kept ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'border-[#5A6E3D] text-[#5A6E3D]'}`}>{p.kept ? 'Kept' : 'Keep'}</button>
              <button type="button" data-testid="prompt-delete" onClick={confirmThen('Delete this prompt from your history? This cannot be undone.', async () => { if (await deletePrompt({ ...deps, id: p.id })) load(); })} className={`${BTN} border-[#E8E4DC] text-[#B85838]`}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
