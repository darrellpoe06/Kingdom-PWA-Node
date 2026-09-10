// =============================================================================
// TlcRecordEditor — fill any cell of an intake record, later (DR-0354)
// =============================================================================
// Darrell 2026-09-10: "at least create a place for all items on the intake
// form even if Christina needs to add the data later or even have users add
// their own data... we need the cells to accommodate the data."
//
// Every question of the office's LIVE form (lib/tlc-office-forms.js) is a
// cell here, section by section, filled by whoever may: the office
// (owner/admin) on a packet at any status or on a not-yet-opened prefilled
// invite; a colleague on their own record. Only the cells that CHANGED are
// sent, with an optional note that lands in the audit row. Files and the
// three signatures are named but not filled here — they stay the colleague's
// to make in the packet; banking stays behind the wall (0198 guard).
//
// Presentation only: the pure middle is lib/tlc-record-cells.js; the write is
// whatever onSave the parent hands in (patchPacket or patchInvitePrefill).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { INPUT, TextField, YesNo, MultiSelect, Availability } from './TlcFieldInputs.jsx';
import { editableSections, keptForThePacket, cellDraft, cellsPatch, cellsFilled } from '../lib/tlc-record-cells.js';
import UiIcon from './UiIcon.jsx';

const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_PRIMARY = 'min-h-[36px] px-4 py-2 text-sm font-semibold bg-[#B85838] text-white hover:bg-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/**
 * @param {object} props
 * @param {Array} props.sections   liveSections(...) of the office's form
 * @param {object} props.record    the packet body (or an invite's prefill)
 * @param {(patch: object, note: string) => Promise<{ok: boolean, message?: string, view?: object}>} props.onSave
 * @param {'office'|'self'} props.who   who is filling — sets the words
 * @param {string} [props.title]
 */
export default function TlcRecordEditor({ sections, record, onSave, who = 'office', title = 'The cells' }) {
  const editable = useMemo(() => editableSections(sections), [sections]);
  const kept = useMemo(() => keptForThePacket(sections), [sections]);
  const [base, setBase] = useState(() => cellDraft(record, sections));
  const [draft, setDraft] = useState(() => cellDraft(record, sections));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone: 'good'|'bad', text }
  const [openId, setOpenId] = useState(null);

  // A new record (another packet opened, a save that returned the row) resets the baseline.
  useEffect(() => { const d = cellDraft(record, sections); setBase(d); setDraft(d); }, [record, sections]);

  const patch = useMemo(() => cellsPatch(base, draft), [base, draft]);
  const changed = Object.keys(patch).length;
  const count = cellsFilled(draft);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    if (!changed || busy) return;
    setBusy(true); setMsg(null);
    const res = await onSave(patch, note.trim());
    setBusy(false);
    if (!res || !res.ok) { setMsg({ tone: 'bad', text: (res && res.message) || 'That could not be saved.' }); return; }
    setBase(draft); setNote('');
    setMsg({ tone: 'good', text: `Saved ${changed} ${changed === 1 ? 'cell' : 'cells'}.` });
  };
  const discard = () => { setDraft(base); setMsg(null); };

  return (
    <section className="border border-[#E8E4DC] bg-white p-3 space-y-3" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-[#1A1815]">{title}</div>
          <p className="text-xs text-[#5A5751]">
            {count.filled} of {count.total} cells hold an answer.
            {who === 'office' ? ' Fill what the office knows; the colleague sees it on their record.' : ' Fill or correct your own answers; the office sees the change.'}
          </p>
        </div>
        <span className="text-[0.6875rem] text-[#8A857C]">{changed ? `${changed} unsaved` : 'nothing unsaved'}</span>
      </div>

      <ol className="space-y-2">
        {editable.map((s) => {
          const open = openId === s.id;
          const filledHere = s.fields.filter((f) => { const c = cellsFilled({ [f.key]: draft[f.key] }); return c.filled > 0; }).length;
          return (
            <li key={s.id} className="border border-[#E8E4DC]">
              <button type="button" onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open} aria-controls={`cells-${s.id}`}
                className="w-full min-h-[36px] px-3 py-2 flex items-center justify-between gap-2 text-left focus:outline focus:outline-2 focus:outline-[#B85838]">
                <span className="text-sm font-semibold text-[#1A1815]">{s.title}</span>
                <span className="text-[0.6875rem] text-[#5A5751] whitespace-nowrap">{filledHere} of {s.fields.length} · <UiIcon name={open ? 'chevronUp' : 'chevronDown'} className="w-3 h-3 inline" /></span>
              </button>
              {open && (
                <div id={`cells-${s.id}`} className="px-3 pb-3 border-t border-[#F0ECE4]">
                  {s.blurb && <p className="text-xs text-[#5A5751] mt-2 mb-2">{s.blurb}</p>}
                  {s.fields.map((f) => {
                    const v = draft[f.key];
                    if (f.type === 'yesno') return <YesNo key={f.key} field={f} value={v} onChange={(x) => set(f.key, x)} editable={!busy} idPrefix="c" />;
                    if (f.type === 'multiselect') return <MultiSelect key={f.key} field={f} value={v} onChange={(x) => set(f.key, x)} editable={!busy} />;
                    if (f.type === 'availability') return <div key={f.key} className="mb-3"><div className="text-xs font-semibold text-[#1A1815] mb-1">{f.label}</div><Availability value={v} onChange={(x) => set(f.key, x)} editable={!busy} /></div>;
                    return <TextField key={f.key} field={f} value={v} onChange={(x) => set(f.key, x)} editable={!busy} idPrefix="c" />;
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {kept.length > 0 && (
        <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed">
          Not filled here: {kept.map((k) => k.label).join(' · ')}. Files and signatures are the colleague&apos;s to make in the packet; direct deposit stays behind the wall.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="cells-note" className="block text-xs font-semibold text-[#1A1815]">A note for the record (optional)</label>
        <input id="cells-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={who === 'office' ? 'e.g. from her CAQH profile, 2026-09-10' : 'e.g. new phone number'} className={INPUT} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={save} disabled={!changed || busy} className={`${BTN_PRIMARY}`}>{busy ? 'Saving…' : `Save ${changed ? `${changed} ${changed === 1 ? 'cell' : 'cells'}` : 'cells'}`}</button>
          <button type="button" onClick={discard} disabled={!changed || busy} className={`${BTN}`}>Discard changes</button>
          {msg && <span className={`text-xs ${msg.tone === 'good' ? 'text-[#3F5226]' : 'text-[#B85838]'}`} role={msg.tone === 'good' ? 'status' : 'alert'}>{msg.text}</span>}
        </div>
      </div>
    </section>
  );
}
