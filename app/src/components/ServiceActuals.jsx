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
