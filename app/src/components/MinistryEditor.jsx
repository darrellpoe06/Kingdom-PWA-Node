// =============================================================================
// MinistryEditor — the office edits its own volunteer list, in the app
// =============================================================================
// Darrell 2026-09-20, the morning of Back to Church and Volunteer Sunday: "we
// can add as we need and we have a list we can edit at anytime.... so
// expandable by staff and no need for technical work."
//
// This is the "no technical work" half. The table and the merge without a
// screen deliver none of what he asked for -- the office would still need an
// agent to add a ministry, which is the exact thing being removed.
//
// It renders for owner/admin only. Everyone else sees the list itself
// elsewhere; this is the editing surface, and a Retire button in front of a
// member is an invitation to an accident.
import React, { useCallback, useEffect, useState } from 'react';
import {
  getMinistryAccess, loadMinistries, saveMinistry, retireMinistry, blankMinistry, slugify,
} from '../lib/church-ministries-sync.js';

export default function MinistryEditor({ displayName }) {
  const [access, setAccess] = useState({ signedIn: false, canEdit: false, tenantId: null });
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const { list: rows } = await loadMinistries(displayName);
    setList(rows);
  }, [displayName]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const a = await getMinistryAccess(displayName);
      if (!alive) return;
      setAccess(a);
      await refresh();
    })();
    return () => { alive = false; };
  }, [displayName, refresh]);

  if (!access.canEdit) return null;

  const save = async () => {
    const name = (draft?.name || '').trim();
    if (!name) { setNotice('Give the ministry a name first.'); return; }
    // The slug is derived once, on CREATE, and never re-derived on an edit --
    // renaming a ministry must not orphan the volunteers already attached to
    // its old slug.
    const id = draft.id || slugify(name);
    if (!id) { setNotice('That name has no letters or numbers in it — try another.'); return; }
    setBusy(true);
    const res = await saveMinistry({ ...draft, id, name }, access);
    setBusy(false);
    if (!res.ok) { setNotice(`Could not save: ${res.error}`); return; }
    setNotice(`Saved “${name}”.`);
    setDraft(null);
    await refresh();
  };

  const retire = async (m) => {
    setBusy(true);
    const res = await retireMinistry(m.id, access);
    setBusy(false);
    setNotice(res.ok ? `Retired “${m.name}”. It stays in the records.` : `Could not retire: ${res.error}`);
    await refresh();
  };

  const field = (label, key, placeholder) => (
    <label className="block mb-2">
      <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{label}</span>
      <input
        value={draft[key] || ''}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full min-h-[44px] px-2 py-2 border-2 border-[#CFC9BD] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
      />
    </label>
  );

  return (
    <section data-testid="ministry-editor" className="mt-4 border-2 border-[#E8E4DC] p-3">
      <h3 className="text-sm font-semibold text-[#1A1815] mb-1">Ministries — the office's list</h3>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Add a ministry and it appears on the volunteer list straight away. Nobody has to write any code.
      </p>

      {notice && (
        <p role="status" data-testid="ministry-editor-notice" className="mb-2 text-[0.75rem] text-[#1A1815]">{notice}</p>
      )}

      <ul className="mb-3">
        {list.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 py-1 border-b border-[#F0EDE7]">
            <span className="text-[0.8125rem] text-[#1A1815]">
              {m.name}
              {!m.surface && <span className="text-[#5A5751]"> · no page yet</span>}
            </span>
            <span className="flex gap-1">
              <button
                type="button" onClick={() => setDraft({ ...m })} disabled={busy}
                className="px-2 py-1 min-h-[36px] text-[0.6875rem] border-2 border-[#CFC9BD] hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >Edit</button>
              <button
                type="button" onClick={() => retire(m)} disabled={busy}
                aria-label={`Retire ${m.name}`}
                className="px-2 py-1 min-h-[36px] text-[0.6875rem] border-2 border-[#CFC9BD] text-[#5A5751] hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >Retire</button>
            </span>
          </li>
        ))}
      </ul>

      {draft ? (
        <div className="border-2 border-[#B85838] p-2">
          {field('Name', 'name', 'Motorcycle Ministry')}
          {field('What it is', 'blurb', 'Riders who escort and serve at events.')}
          {field('How to join', 'join', 'Ask the coordinator about riding with us.')}
          <div className="flex gap-2 mt-2">
            <button
              type="button" onClick={save} disabled={busy}
              className="px-3 py-2 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >{busy ? 'Saving…' : 'Save'}</button>
            <button
              type="button" onClick={() => { setDraft(null); setNotice(''); }} disabled={busy}
              className="px-3 py-2 min-h-[44px] border-2 border-[#CFC9BD] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >Cancel</button>
          </div>
        </div>
      ) : (
        <button
          type="button" onClick={() => setDraft(blankMinistry(list.length + 1))}
          className="px-3 py-2 min-h-[44px] border-2 border-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >+ Add a ministry</button>
      )}
    </section>
  );
}
