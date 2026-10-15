// =============================================================================
// ServiceActuals — the ACTUAL side of the Order of Service (Darrell 2026-06-25).
//
// "Order of service can also be updated based on what occurred and becomes a
// blueprint for the next service." This is the second half of the surface: after
// the service, the finalizer circle reconciles what REALLY happened against the
// plan (real minutes, what ran long, what was added, what was skipped), drawn
// from the service video + the real choir songs/sermon the choir already keeps.
// The reconciled actual is shown to the whole team as honest institutional
// memory — and becomes the BLUEPRINT that seeds the next service of this type.
//
// DESCRIPTIVE, NOT PRESCRIPTIVE (mirrors choir Song->Renditions): this records
// how we actually did it so the next plan starts from reality — it informs, it
// never dictates. Reconcile logic is pure + test-locked in lib/service-actuals.js
// (DR-0076). Real data only: minutes, songs, and the sermon are real records, and
// a planned segment with no actual reads as SKIPPED — never painted.
//
// Accessibility: white cards / #1A1815 body (>=16:1), #5A5751 secondary (~7:1),
// labelled inputs, visible #B85838 focus outline (WCAG AA, midnight-safe).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { sectorShort, SECTORS } from '../lib/service-program.js';
import {
  dispositionMeta,
  reconcileService, summarizeReconcile, harvestActualsForService,
  saveActual, deleteActual, seedActualsFromPlan, captureActualFromYouTube, markReconciled,
  clockLines, clockTotals, trackRecord, saveActualTimes, addedLine,
} from '../lib/service-actuals.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const SECTOR_OPTS = SECTORS.map((s) => [s.key, `${s.emoji} ${s.label}`]);

// Disposition badge — cream background, olive/rust/grey text+border carry the
// distinction (contrast-guard: no inline accent backgrounds).
const TONE_STYLE = {
  good:      'text-[#5A6E3D] border-[#5A6E3D]',
  attention: 'text-[#B85838] border-[#B85838]',
  idle:      'text-[#8A857C] border-[#D8D3CB]',
};
function DispositionBadge({ disposition }) {
  const meta = dispositionMeta(disposition);
  return <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border bg-[#FAF8F4] ${TONE_STYLE[meta.tone] || TONE_STYLE.idle}`}>{meta.short}</span>;
}

// One row of the reconciled flow (read + inline edit when finalizing).
function ActualRow({ row, songs, sermons, canEdit, busy, onEdit, onRemove }) {
  const [open, setOpen] = useState(false);
  const isSkipped = row.kind === 'skipped';
  const songTitle = (id) => songs.find((s) => s.id === id)?.title || null;
  const sermonTitle = (id) => sermons.find((s) => s.id === id)?.title || null;
  return (
    <div className={`border-l-4 pl-3 py-2 ${isSkipped ? 'border-[#D8D3CB] opacity-70' : row.disposition === 'as-planned' ? 'border-[#5A6E3D] bg-[#FAF8F4]' : 'border-[#B85838] bg-[#FAF8F4]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className={`text-[#1A1815] ${isSkipped ? 'line-through' : ''}`}>{row.title}</span>
          <DispositionBadge disposition={row.disposition} />
          {row.needsReview && <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#B85838] text-[#B85838] bg-[#FAF8F4]">Review</span>}
        </div>
        <div className="flex items-center gap-2 text-[0.6875rem] text-[#5A5751]">
          <span>{sectorShort(row.sector)}</span>
          {!isSkipped && (
            <span className="tabular-nums">
              {Number.isFinite(row.actualMinutes) ? `${row.actualMinutes}′` : '—'}
              {Number.isFinite(row.deltaMinutes) && row.deltaMinutes !== 0 ? ` (plan ${row.plannedMinutes}′, ${row.deltaMinutes > 0 ? '+' : ''}${row.deltaMinutes})` : (Number.isFinite(row.plannedMinutes) ? '' : '')}
            </span>
          )}
          {isSkipped && <span className="tabular-nums">planned {row.plannedMinutes}′ · not done</span>}
        </div>
      </div>
      {row.note && <p className="text-[0.6875rem] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{row.note}</p>}
      {row.sermonId && sermonTitle(row.sermonId) && <p className="text-xs text-[#1A1815] mt-0.5">📖 <span className="font-semibold">{sermonTitle(row.sermonId)}</span></p>}
      {row.songs?.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {row.songs.map((id) => songTitle(id) ? <li key={id} className="text-xs text-[#1A1815]">🎵 {songTitle(id)}</li> : null)}
        </ul>
      )}
      {canEdit && !isSkipped && (
        <div className="flex gap-2 mt-1">
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]" aria-expanded={open}>{open ? 'Close' : 'Adjust'}</button>
          <button type="button" disabled={busy} onClick={() => onRemove(row)} className="text-[0.625rem] uppercase tracking-wider text-[#991B1B] hover:underline disabled:opacity-50">{row.disposition === 'added' ? 'Remove' : 'Mark skipped'}</button>
        </div>
      )}
      {canEdit && open && !isSkipped && (
        <ActualEditForm row={row} songs={songs} sermons={sermons} busy={busy} onSave={(patch) => { onEdit(row, patch); setOpen(false); }} onCancel={() => setOpen(false)} />
      )}
    </div>
  );
}

function ActualEditForm({ row, songs, sermons, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    actualMinutes: Number.isFinite(row.actualMinutes) ? String(row.actualMinutes) : '',
    note: row.note || '',
    actualSermonId: row.sermonId || '',
    actualSongs: Array.isArray(row.songs) ? row.songs : [],
  });
  const toggleSong = (id) => setF((p) => ({ ...p, actualSongs: p.actualSongs.includes(id) ? p.actualSongs.filter((x) => x !== id) : [...p.actualSongs, id] }));
  return (
    <div className="bg-white border border-[#E8E4DC] p-2 mt-2 grid grid-cols-2 gap-2">
      <div><label className={LABEL} htmlFor={`am-${row.key}`}>Actual minutes</label><input id={`am-${row.key}`} type="number" min="0" className={FIELD} value={f.actualMinutes} onChange={(e) => setF((p) => ({ ...p, actualMinutes: e.target.value }))} /></div>
      <div><label className={LABEL} htmlFor={`asm-${row.key}`}>Sermon preached</label>
        <select id={`asm-${row.key}`} className={FIELD} value={f.actualSermonId} onChange={(e) => setF((p) => ({ ...p, actualSermonId: e.target.value }))}>
          <option value="">— none —</option>
          {sermons.map((s) => <option key={s.id} value={s.id}>{s.title}{s.speaker ? ` · ${s.speaker}` : ''}</option>)}
        </select>
      </div>
      <div className="col-span-2"><label className={LABEL} htmlFor={`an-${row.key}`}>What happened (note)</label><input id={`an-${row.key}`} className={FIELD} value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="BG extended the altar call…" /></div>
      {songs.length > 0 && (
        <div className="col-span-2">
          <span className={LABEL}>Songs actually sung</span>
          <div className="flex flex-wrap gap-1.5">
            {songs.map((s) => (
              <button type="button" key={s.id} onClick={() => toggleSong(s.id)} aria-pressed={f.actualSongs.includes(s.id)}
                className={`text-[0.6875rem] px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${f.actualSongs.includes(s.id) ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#1A1815] border-[#E8E4DC]'}`}>{s.title}</button>
            ))}
          </div>
        </div>
      )}
      <div className="col-span-2 flex gap-2">
        <button type="button" disabled={busy} onClick={() => onSave({ actualMinutes: f.actualMinutes ? Number(f.actualMinutes) : null, note: f.note, actualSermonId: f.actualSermonId || null, actualSongs: f.actualSongs })} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>Save</button>
        <button type="button" onClick={onCancel} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Cancel</button>
      </div>
    </div>
  );
}

// Add an unplanned moment that occurred but wasn't on the plan. (Songs/sermon
// can be linked afterward via the row's "Adjust" editor.)
function AddedForm({ nextOrder, busy, onSave, onCancel }) {
  const [f, setF] = useState({ title: '', sector: 'worship', actualMinutes: '5', note: '' });
  return (
    <form className="bg-white border-2 border-[#B85838] p-3 mb-2" onSubmit={(e) => { e.preventDefault(); onSave({ plannedSegmentId: null, disposition: 'added', title: f.title, sector: f.sector, actualOrder: nextOrder, actualMinutes: f.actualMinutes ? Number(f.actualMinutes) : null, note: f.note, source: 'manual' }); }}>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2"><label className={LABEL} htmlFor="ad-title">What happened (unplanned)</label><input id="ad-title" className={FIELD} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} placeholder="Spontaneous testimony, extra song…" required /></div>
        <div><label className={LABEL} htmlFor="ad-sector">Sector</label>
          <select id="ad-sector" className={FIELD} value={f.sector} onChange={(e) => setF((p) => ({ ...p, sector: e.target.value }))}>{SECTOR_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <div><label className={LABEL} htmlFor="ad-min">Minutes</label><input id="ad-min" type="number" min="0" className={FIELD} value={f.actualMinutes} onChange={(e) => setF((p) => ({ ...p, actualMinutes: e.target.value }))} /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="ad-note">Note</label><input id="ad-note" className={FIELD} value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} /></div>
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={busy} className={`${BTN} bg-[#B85838] text-white font-semibold disabled:opacity-50`}>Add what happened</button>
        <button type="button" onClick={onCancel} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Cancel</button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Clock the service (DR-1029): every planned line with the minutes it really
// took, typed beside the plan and saved in one tap. Prefilled with what is
// recorded, else the plan ("we did exactly this"); clear a line and it reads
// as skipped. The deeper reconcile tools below stay for songs, sermon, notes.
// -----------------------------------------------------------------------------
function ClockTheService({ program, plannedSegments, actuals, busy, onSave }) {
  const base = useMemo(() => clockLines(plannedSegments, actuals), [plannedSegments, actuals]);
  const [edits, setEdits] = useState({});
  const [added, setAdded] = useState([]);           // sections that took place but were not on the order
  const [addForm, setAddForm] = useState(null);     // { title, minutes, after }
  const planned = useMemo(() => base.map((l) => ({
    ...l,
    actualMinutes: Object.prototype.hasOwnProperty.call(edits, l.plannedSegmentId)
      ? (edits[l.plannedSegmentId] === '' ? null : Number(edits[l.plannedSegmentId]))
      : (Number.isFinite(l.actualMinutes) ? l.actualMinutes : l.plannedMinutes),
  })), [base, edits]);
  const lines = useMemo(() => [...planned, ...added].sort((a, b) => a.sortOrder - b.sortOrder), [planned, added]);
  const totals = clockTotals(lines);
  const lastSort = base.reduce((n, l) => Math.max(n, l.sortOrder), 0);
  if (!base.length) return null;
  const commitAdd = () => {
    if (!addForm || !addForm.title.trim()) return;
    const after = addForm.after === '' ? null : Number(addForm.after);
    setAdded((p) => [...p, addedLine({ title: addForm.title, actualMinutes: addForm.minutes === '' ? null : Number(addForm.minutes), afterSortOrder: after, lastSortOrder: lastSort + (p.length * 5) })]);
    setAddForm(null);
  };
  return (
    <form className="bg-white border-2 border-[#1A1815] p-3 mb-3" onSubmit={(e) => { e.preventDefault(); onSave(lines); }} data-testid="clock-the-service">
      <p className="text-xs text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Clock the service: what took place, against the order the Bishop asked for</p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Type the minutes each line really took. A line left blank did not happen. Something happened that was not on the order? Add it where it took place.</p>
      <div className="space-y-1">
        {lines.map((l) => l.added ? (
          <div key={`added-${l.sortOrder}-${l.title}`} className="flex items-center gap-2 border-b border-[#E8E4DC] py-1 bg-[#FAF8F4]" data-testid="clock-added-line">
            <span className="flex-1 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{l.title}<span className="text-[0.6875rem] text-[#B85838]"> · not on the order</span></span>
            <span className="w-20 text-right text-sm tabular-nums text-[#1A1815]">{Number.isFinite(l.actualMinutes) ? `${l.actualMinutes}′` : '—'}</span>
            <button type="button" onClick={() => setAdded((p) => p.filter((x) => x !== l))} className="w-14 text-right text-[0.625rem] uppercase tracking-wider text-[#991B1B] hover:underline">Remove</button>
          </div>
        ) : (() => {
          const v = Object.prototype.hasOwnProperty.call(edits, l.plannedSegmentId) ? edits[l.plannedSegmentId] : String(Number.isFinite(l.actualMinutes) ? l.actualMinutes : '');
          const d = Number.isFinite(l.actualMinutes) && Number.isFinite(l.plannedMinutes) ? l.actualMinutes - l.plannedMinutes : null;
          return (
            <div key={l.plannedSegmentId} className="flex items-center gap-2 border-b border-[#E8E4DC] py-1">
              <label className="flex-1 text-sm text-[#1A1815]" htmlFor={`ct-${l.plannedSegmentId}`} style={{ fontFamily: '"Fraunces", serif' }}>{l.title}<span className="text-[0.6875rem] text-[#8A857C]"> · plan {l.plannedMinutes ?? '—'}′</span></label>
              <input id={`ct-${l.plannedSegmentId}`} type="number" min="0" inputMode="numeric" className={`${FIELD} w-20 text-right tabular-nums`} value={v}
                onChange={(e) => setEdits((p) => ({ ...p, [l.plannedSegmentId]: e.target.value }))} aria-label={`Actual minutes for ${l.title}`} />
              <span className={`w-14 text-right text-[0.6875rem] tabular-nums ${d == null ? 'text-[#8A857C]' : d === 0 ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>{d == null ? 'skipped' : d === 0 ? 'on time' : `${d > 0 ? '+' : ''}${d}′`}</span>
            </div>
          );
        })())}
      </div>
      {addForm ? (
        <div className="grid grid-cols-2 gap-2 mt-2 bg-[#FAF8F4] border border-[#E8E4DC] p-2" data-testid="clock-add-form">
          <div className="col-span-2"><label className={LABEL} htmlFor="ct-add-title">What took place (not on the order)</label><input id="ct-add-title" className={FIELD} value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))} placeholder="Testimony, extra song, a word from the Bishop…" /></div>
          <div><label className={LABEL} htmlFor="ct-add-min">Minutes</label><input id="ct-add-min" type="number" min="0" inputMode="numeric" className={FIELD} value={addForm.minutes} onChange={(e) => setAddForm((p) => ({ ...p, minutes: e.target.value }))} /></div>
          <div><label className={LABEL} htmlFor="ct-add-after">After</label>
            <select id="ct-add-after" className={FIELD} value={addForm.after} onChange={(e) => setAddForm((p) => ({ ...p, after: e.target.value }))}>
              <option value="">— the end —</option>
              {base.map((l) => <option key={l.plannedSegmentId} value={l.sortOrder}>{l.title}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="button" onClick={commitAdd} disabled={!addForm.title.trim()} className={`${BTN} bg-[#B85838] text-white font-semibold disabled:opacity-50`}>Add it</button>
            <button type="button" onClick={() => setAddForm(null)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddForm({ title: '', minutes: '5', after: '' })} className={`${BTN} text-[#B85838] border border-[#B85838] mt-2`}>＋ Add a line that took place</button>
      )}
      <p className="text-xs text-[#1A1815] tabular-nums mt-2" style={{ fontFamily: '"Fraunces", serif' }} data-testid="clock-totals">
        <span className="font-semibold">Planned {totals.planned}′</span> · actual {totals.actual}′
        {totals.delta != null && totals.delta !== 0 && <span className="text-[#B85838]"> · {totals.delta > 0 ? '+' : ''}{totals.delta}′</span>}
        {totals.delta === 0 && <span className="text-[#5A6E3D]"> · on time</span>}
        {totals.window && <span className={totals.window.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}> · {totals.window.say}</span>}
        {!totals.complete && <span className="text-[#8A857C]"> · {totals.total - totals.entered} line{totals.total - totals.entered === 1 ? '' : 's'} blank</span>}
      </p>
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={busy} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>{busy ? 'Saving…' : `Save actual times${program?.reconciledAt ? '' : ' (marks reconciled)'}`}</button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// The track record (DR-1029): every clocked service, newest first, and how
// often each kind of service kept its timeline. Read by the whole team.
// -----------------------------------------------------------------------------
const TYPE_LABEL = { sunday: 'Sunday', wednesday: 'Wednesday', rehearsal: 'Rehearsal', special: 'Special', both: 'Both' };
export function TrackRecord({ programs = [], segments = [], actuals = [] }) {
  const rec = useMemo(() => trackRecord(programs, segments, actuals), [programs, segments, actuals]);
  const fmt = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d || ''; } };
  if (!rec.rows.length) {
    return (
      <p className="text-xs text-[#5A5751] bg-white border border-[#E8E4DC] p-3" style={{ fontFamily: '"Fraunces", serif' }} data-testid="track-record-empty">
        No service clocked yet. After a service, open Actual times and save the minutes each line took; every clocked Sunday and Wednesday lands here, read against the 75–90′ window the service is to run.
      </p>
    );
  }
  return (
    <div data-testid="track-record">
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-2">
        <p className="text-xs text-[#1A1815] tabular-nums" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="font-semibold">Kept the {rec.window.minMinutes}–{rec.window.maxMinutes}′ window {rec.overall.kept} of {rec.overall.services}</span> ({rec.overall.keptPct}%)
          {rec.overall.avgDelta !== 0 && <span> · on average {rec.overall.avgDelta > 0 ? '+' : ''}{rec.overall.avgDelta}′</span>}
          {rec.overall.streak > 1 && <span className="text-[#5A6E3D]"> · {rec.overall.streak} in a row</span>}
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {rec.types.map((t) => (
            <li key={t.serviceType} className="text-[0.6875rem] text-[#5A5751] tabular-nums">{TYPE_LABEL[t.serviceType] || t.serviceType}: {t.kept} of {t.services} kept{t.avgDelta !== 0 ? ` · ${t.avgDelta > 0 ? '+' : ''}${t.avgDelta}′ avg` : ''}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-1">
        {rec.rows.map((r) => (
          <div key={r.programId} className={`border-l-4 pl-3 py-2 ${r.kept ? 'border-[#5A6E3D]' : 'border-[#B85838]'} bg-white`}>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmt(r.serviceDate)} <span className="text-[0.6875rem] text-[#8A857C] font-normal">· {TYPE_LABEL[r.serviceType] || r.serviceType}</span></span>
              <span className={`text-[0.6875rem] tabular-nums ${r.kept ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>{r.actualTotal}′ of {r.plannedTotal}′ planned{r.delta !== 0 ? ` (${r.delta > 0 ? '+' : ''}${r.delta}′)` : ''} · {r.window.say}</span>
            </div>
            <p className="text-[0.6875rem] text-[#5A5751] tabular-nums mt-0.5">
              {r.linesOnTime} of {r.linesTimed} line{r.linesTimed === 1 ? '' : 's'} on time
              {r.skipped ? ` · ${r.skipped} skipped` : ''}{r.added ? ` · ${r.added} added` : ''}
              {r.worst ? ` · ${r.worst.title} ${r.worst.delta > 0 ? 'ran ' + r.worst.delta + '′ long' : 'ran ' + Math.abs(r.worst.delta) + '′ short'}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ServiceActuals({ program, plannedSegments, actuals: allActuals = [], songs = [], sermons = [], canEdit = false }) {
  const [adding, setAdding] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const actuals = useMemo(() => allActuals.filter((a) => program && a.programId === program.id), [allActuals, program]);
  const reconciled = !!program?.reconciledAt;
  const reconcile = useMemo(() => reconcileService(plannedSegments, actuals, { reconciled }), [plannedSegments, actuals, reconciled]);
  const programSongs = useMemo(() => {
    const onDate = songs.filter((s) => s.serviceDate === program?.serviceDate);
    return onDate.length ? onDate : songs;
  }, [songs, program]);
  const programSermons = useMemo(() => {
    const onDate = sermons.filter((s) => s.serviceDate === program?.serviceDate);
    return onDate.length ? onDate : sermons;
  }, [sermons, program]);
  const nextOrder = useMemo(() => (actuals.reduce((m, a) => Math.max(m, a.actualOrder || 0), 0) || 0) + 10, [actuals]);

  // What the YouTube service recording shows (already-ingested choir_songs +
  // sermon for this date — no re-fetch). The primary source for the actual.
  const harvest = useMemo(() => harvestActualsForService(program, plannedSegments, { songs, sermons }), [program, plannedSegments, songs, sermons]);
  const hasHarvested = useMemo(() => actuals.some((a) => a.source === 'harvest'), [actuals]);

  const report = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Try again.`); else setErr(''); return res; };

  const onSeed = async () => { if (!program) return; setBusy(true); report(await seedActualsFromPlan(program.id, plannedSegments)); setBusy(false); };
  const onPullYouTube = async () => { if (!program) return; setBusy(true); report(await captureActualFromYouTube(program, plannedSegments, songs, sermons)); setBusy(false); };
  const onEditRow = async (row, patch) => { setBusy(true); report(await saveActual(program.id, { id: row.actual?.id, plannedSegmentId: row.plannedSegmentId, title: row.title, sector: row.sector, actualOrder: row.actual?.actualOrder ?? row.sortKey, disposition: row.disposition, ...patch }, undefined)); setBusy(false); };
  const onRemoveRow = async (row) => {
    if (!row.actual?.id) return;
    if (!window.confirm(row.disposition === 'added' ? 'Remove this unplanned item?' : `Mark "${row.title}" as skipped (it didn't happen)?`)) return;
    setBusy(true); report(await deleteActual(row.actual.id, { programId: program.id, title: row.title })); setBusy(false);
  };
  const onAdd = async (item) => { setBusy(true); report(await saveActual(program.id, item)); setBusy(false); setAdding(false); };
  const onClock = async (lines) => { setBusy(true); report(await saveActualTimes(program, lines)); setBusy(false); };

  if (!program) return null;
  const hasActuals = actuals.length > 0;

  return (
    <div className="mt-4 border-t-2 border-[#1A1815] pt-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <h3 className="text-base text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>📹 What actually happened</h3>
        {reconciled && program.reconciledAt && (
          <span className="text-[0.5625rem] uppercase tracking-wider px-2 py-1 border bg-[#FAF8F4] text-[#5A6E3D] border-[#5A6E3D]">Reconciled</span>
        )}
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        The faithful record of how the service really went — drawn from the service video and the real songs and message. It informs the next plan; it never dictates it.
      </p>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {/* Clock the service: the minutes each line took, saved in one tap (DR-1029) */}
      {canEdit && <ClockTheService program={program} plannedSegments={plannedSegments} actuals={actuals} busy={busy} onSave={onClock} />}

      {/* Planned-vs-actual variance summary (visible to the whole team) */}
      {(hasActuals || reconciled) && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-2">
          <p className="text-xs text-[#1A1815] tabular-nums" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="font-semibold">Planned {reconcile.plannedTotalMinutes}′</span> · actual {reconcile.actualTotalMinutes}′
            {reconcile.totalsVariance && reconcile.deltaMinutes !== 0 && <span className="text-[#B85838]"> · {reconcile.deltaMinutes > 0 ? '+' : ''}{reconcile.deltaMinutes}′</span>}
          </p>
          <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">{summarizeReconcile(reconcile)}</p>
          {program.actualNotes && <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{program.actualNotes}</p>}
          {program.harvestSource && <p className="text-[0.625rem] text-[#8A857C] mt-1 break-all">Source: {program.harvestSource}</p>}
        </div>
      )}

      {/* Finalizer reconcile controls. The PRIMARY source is the YouTube service
          recording (Darrell's confirmed source); reconcile-from-plan is the
          no-video fallback. */}
      {canEdit && (
        <div className="flex gap-2 flex-wrap mb-2">
          {!hasHarvested && harvest.items.length > 0 && (
            <button type="button" onClick={onPullYouTube} disabled={busy} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>
              ▶ Pull from service video ({harvest.scope.songs} song{harvest.scope.songs === 1 ? '' : 's'}{harvest.scope.sermon ? ' + sermon' : ''})
            </button>
          )}
          {!hasActuals && <button type="button" onClick={onSeed} disabled={busy} className={`${BTN} text-[#5A5751] border border-[#E8E4DC] disabled:opacity-50`}>Reconcile from plan ({plannedSegments.length})</button>}
          {hasActuals && <button type="button" onClick={() => setAdding((o) => !o)} className={`${BTN} text-[#B85838] border border-[#B85838]`}>＋ Add unplanned</button>}
          {hasActuals && <button type="button" onClick={() => setRecapOpen((o) => !o)} className={`${BTN} text-[#5A5751] border border-[#E8E4DC]`} aria-expanded={recapOpen}>{reconciled ? 'Edit recap' : 'Mark reconciled'}</button>}
        </div>
      )}
      {canEdit && !hasHarvested && harvest.items.length > 0 && (
        <p className="text-[0.625rem] text-[#8A857C] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          From the YouTube recording of this service — {harvest.scope.matched} auto-matched to the plan, {harvest.scope.unmatched} unplanned. Each lands for review; confirm before it&apos;s trusted.
        </p>
      )}
      {canEdit && adding && <AddedForm nextOrder={nextOrder} busy={busy} onSave={onAdd} onCancel={() => setAdding(false)} />}
      {canEdit && recapOpen && (
        <RecapForm program={program} reconcile={reconcile} busy={busy} onSaved={() => setRecapOpen(false)} setErr={setErr} setBusy={setBusy} />
      )}

      {/* The reconciled flow */}
      {!hasActuals && !reconciled && (
        <p className="text-xs text-[#5A5751] bg-white border border-[#E8E4DC] p-3" style={{ fontFamily: '"Fraunces", serif' }}>
          {canEdit
            ? (harvest.items.length > 0
                ? 'After the service, tap “Pull from service video” to bring in what was actually sung and preached from the YouTube recording, then confirm each.'
                : 'After the service, once the YouTube recording is harvested, pull the actual from it here — or “Reconcile from plan” to start from what was scheduled and adjust.')
            : 'Not reconciled yet — a finalizer will record what actually happened after the service.'}
        </p>
      )}
      {reconcile.rows.length > 0 && (
        <div className="space-y-1">
          {reconcile.rows.map((row) => (
            <ActualRow key={row.key} row={row} songs={programSongs} sermons={programSermons} canEdit={canEdit} busy={busy} onEdit={onEditRow} onRemove={onRemoveRow} />
          ))}
        </div>
      )}
    </div>
  );
}

// The program-level recap: real start, real total (defaults to the summed
// actual), what worked / change next time, the harvest source — then stamp it
// reconciled (after which planned-without-actual reads as skipped).
function RecapForm({ program, reconcile, busy, onSaved, setErr, setBusy }) {
  const [f, setF] = useState({
    actualStartTime: program.actualStartTime || program.startTime || '',
    actualTotalMinutes: Number.isFinite(program.actualTotalMinutes) ? String(program.actualTotalMinutes) : String(reconcile.actualTotalMinutes || ''),
    actualNotes: program.actualNotes || '',
    harvestSource: program.harvestSource || '',
  });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await markReconciled(program, {
      actualStartTime: f.actualStartTime || null,
      actualTotalMinutes: f.actualTotalMinutes ? Number(f.actualTotalMinutes) : null,
      actualNotes: f.actualNotes || null,
      harvestSource: f.harvestSource || null,
    });
    if (res?.skipped) setErr(`Could not save (${res.skipped}). Try again.`); else { setErr(''); onSaved(); }
    setBusy(false);
  };
  return (
    <form className="bg-white border-2 border-[#1A1815] p-3 mb-2" onSubmit={submit}>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Stamp the service recap. Once reconciled, anything planned but not recorded above reads as <span className="font-semibold">skipped</span>.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="rc-start">Actual start (24h)</label><input id="rc-start" type="time" className={FIELD} value={f.actualStartTime} onChange={(e) => setF((p) => ({ ...p, actualStartTime: e.target.value }))} /></div>
        <div><label className={LABEL} htmlFor="rc-total">Actual total (min)</label><input id="rc-total" type="number" min="0" className={FIELD} value={f.actualTotalMinutes} onChange={(e) => setF((p) => ({ ...p, actualTotalMinutes: e.target.value }))} /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="rc-src">Service video / harvest source</label><input id="rc-src" className={FIELD} value={f.harvestSource} onChange={(e) => setF((p) => ({ ...p, harvestSource: e.target.value }))} placeholder="YouTube URL of the service, or SME spec ref" /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="rc-notes">What worked / change next time</label><textarea id="rc-notes" rows={2} className={FIELD} value={f.actualNotes} onChange={(e) => setF((p) => ({ ...p, actualNotes: e.target.value }))} /></div>
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={busy} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>{busy ? 'Saving…' : 'Mark reconciled'}</button>
      </div>
    </form>
  );
}
