// =============================================================================
// ServiceProgram — the Order of Service surface (Darrell 2026-06-24).
//
// ONE master program per Sunday worship, built by the steward (owner/admin), from
// which every staff member reads THEIR sector's derived view of the same source
// of truth. The steward sees the full editable run-of-show; a choir member sees
// their selections + when they're up; the preacher sees the sermon slot; media
// sees what to display when; ushers see their offering cue; etc. The whole team
// reads the same master (RLS read = user_in_choir); the per-sector view is a
// client-side LENS (lib/service-program.js deriveSectorView), not a wall.
//
// Real data only (DR-0076 reality-trace): segments soft-link the REAL choir songs
// and the REAL sermon the choir already maintains (choir-sync), resolved live and
// shown in each part — never painted placeholders. Times come from real planned
// minutes; the reflow control recomputes the schedule when the service runs
// long/short, keeping the sermon (a fixed segment) uncompressed.
//
// Accessibility: white cards / #1A1815 body (>= 16:1), #5A5751 secondary (~7:1),
// labelled inputs, visible #B85838 focus outline (WCAG AA, midnight-safe).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { SectionTitle, TabScroll } from './shared.jsx';
import { onAuthChange } from '../lib/supabase.js';
import { subscribeSongs, subscribeSermons } from '../lib/choir-sync.js';
import {
  SECTORS, STEWARD, sectorShort,
  deriveSectorView, reflowProgram, formatClock,
  getServiceProgramAccess, subscribePrograms, subscribeSegments, subscribeChanges, subscribeFinalizerMembers,
  saveProgram, deleteProgram, saveSegment, deleteSegment, seedProgramSegments, seedDefaultOrder, setFinalizer,
} from '../lib/service-program.js';
import ServiceActuals from './ServiceActuals.jsx';
import { subscribeActuals, blueprintFromActual, pickBlueprintProgram, seedSegmentsFromBlueprint } from '../lib/service-actuals.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const SECTOR_OPTS = SECTORS.map((s) => [s.key, `${s.emoji} ${s.label}`]);

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); }
  catch { return d; }
};
// Status badges use only midnight-covered palette tokens (contrast-guard): the
// background stays cream, the olive/grey text + border carry the distinction.
const STATUS_STYLE = {
  draft: 'bg-[#FAF8F4] text-[#5A5751] border-[#E8E4DC]',
  published: 'bg-[#FAF8F4] text-[#5A6E3D] border-[#5A6E3D]',
  archived: 'bg-[#FAF8F4] text-[#8A857C] border-[#D8D3CB]',
};

// -----------------------------------------------------------------------------
// Program (master) metadata form
// -----------------------------------------------------------------------------
function ProgramForm({ initial, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    id: initial?.id || null,
    serviceDate: initial?.serviceDate || todayIso(),
    serviceType: initial?.serviceType || 'sunday',
    serviceSlot: initial?.serviceSlot || '',
    title: initial?.title || 'Order of Worship',
    theme: initial?.theme || '',
    scriptureRef: initial?.scriptureRef || '',
    startTime: initial?.startTime || '11:00',
    targetMinutes: initial?.targetMinutes != null ? String(initial.targetMinutes) : '',
    status: initial?.status || 'draft',
    notes: initial?.notes || '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form className="bg-white border-2 border-[#1A1815] p-3 mb-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, targetMinutes: f.targetMinutes ? Number(f.targetMinutes) : null }); }}>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="sp-date">Service date</label><input id="sp-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} required /></div>
        <div><label className={LABEL} htmlFor="sp-type">Service</label>
          <select id="sp-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday</option><option value="wednesday">Wednesday</option><option value="special">Special</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="sp-start">Start time (24h)</label><input id="sp-start" type="time" className={FIELD} value={f.startTime} onChange={set('startTime')} /></div>
        <div><label className={LABEL} htmlFor="sp-target">Target length (min)</label><input id="sp-target" type="number" min="0" className={FIELD} value={f.targetMinutes} onChange={set('targetMinutes')} placeholder="e.g. 90" /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="sp-title">Title</label><input id="sp-title" className={FIELD} value={f.title} onChange={set('title')} /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="sp-theme">Theme / series</label><input id="sp-theme" className={FIELD} value={f.theme} onChange={set('theme')} placeholder="optional" /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="sp-scr">Anchoring scripture</label><input id="sp-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="e.g. Psalm 100:1-5 (ESV)" /></div>
        <div><label className={LABEL} htmlFor="sp-status">Status</label>
          <select id="sp-status" className={FIELD} value={f.status} onChange={set('status')}>
            <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="sp-slot">Slot (optional)</label><input id="sp-slot" className={FIELD} value={f.serviceSlot} onChange={set('serviceSlot')} placeholder="1pm / evening" /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="sp-notes">Notes (all sectors)</label><textarea id="sp-notes" rows={2} className={FIELD} value={f.notes} onChange={set('notes')} /></div>
      </div>
      <div className="flex gap-2 mt-3">
        <button type="submit" disabled={busy} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>{busy ? 'Saving…' : 'Save master'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Cancel</button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Segment add/edit form (a single line of the run-of-show)
// -----------------------------------------------------------------------------
function SegmentForm({ initial, programSongs, programSermons, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    id: initial?.id || null,
    title: initial?.title || '',
    sector: initial?.sector || 'worship',
    ownerName: initial?.ownerName || '',
    plannedMinutes: initial?.plannedMinutes != null ? String(initial.plannedMinutes) : '5',
    flexible: initial?.flexible !== false,
    scriptureRef: initial?.scriptureRef || '',
    sermonId: initial?.sermonId || '',
    songIds: Array.isArray(initial?.songIds) ? initial.songIds : [],
    cues: initial?.cues && typeof initial.cues === 'object' ? { ...initial.cues } : {},
    notes: initial?.notes || '',
    sortOrder: initial?.sortOrder ?? 0,
  });
  const [cuesOpen, setCuesOpen] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleSong = (id) => setF((p) => ({ ...p, songIds: p.songIds.includes(id) ? p.songIds.filter((x) => x !== id) : [...p.songIds, id] }));
  const setCue = (sectorKey) => (e) => setF((p) => ({ ...p, cues: { ...p.cues, [sectorKey]: e.target.value } }));
  return (
    <form className="bg-white border-2 border-[#5A6E3D] p-3 mb-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, plannedMinutes: Number(f.plannedMinutes) || 0, sermonId: f.sermonId || null }); }}>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2"><label className={LABEL} htmlFor="sg-title">Segment</label><input id="sg-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="Call to Worship, Sermon, Benediction…" required /></div>
        <div><label className={LABEL} htmlFor="sg-sector">Owned by sector</label>
          <select id="sg-sector" className={FIELD} value={f.sector} onChange={set('sector')}>
            {SECTOR_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div><label className={LABEL} htmlFor="sg-owner">Owner (person)</label><input id="sg-owner" className={FIELD} value={f.ownerName} onChange={set('ownerName')} placeholder="Bishop Gwin / Christina" /></div>
        <div><label className={LABEL} htmlFor="sg-min">Planned minutes</label><input id="sg-min" type="number" min="0" className={FIELD} value={f.plannedMinutes} onChange={set('plannedMinutes')} /></div>
        <div className="flex items-end"><label className="flex items-center gap-2 text-xs text-[#1A1815]"><input type="checkbox" checked={f.flexible} onChange={(e) => setF((p) => ({ ...p, flexible: e.target.checked }))} /> Flexible (compress on reflow)</label></div>
        <div><label className={LABEL} htmlFor="sg-order">Order</label><input id="sg-order" type="number" className={FIELD} value={f.sortOrder} onChange={(e) => setF((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))} /></div>
        <div><label className={LABEL} htmlFor="sg-scr">Scripture</label><input id="sg-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="optional" /></div>
        <div className="col-span-2"><label className={LABEL} htmlFor="sg-sermon">Linked sermon (real)</label>
          <select id="sg-sermon" className={FIELD} value={f.sermonId} onChange={set('sermonId')}>
            <option value="">— none —</option>
            {programSermons.map((s) => <option key={s.id} value={s.id}>{s.title}{s.speaker ? ` · ${s.speaker}` : ''}</option>)}
          </select>
        </div>
        {programSongs.length > 0 && (
          <div className="col-span-2">
            <span className={LABEL}>Linked choir songs (real)</span>
            <div className="flex flex-wrap gap-1.5">
              {programSongs.map((s) => (
                <button type="button" key={s.id} onClick={() => toggleSong(s.id)} aria-pressed={f.songIds.includes(s.id)}
                  className={`text-[0.6875rem] px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${f.songIds.includes(s.id) ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#1A1815] border-[#E8E4DC]'}`}>{s.title}</button>
              ))}
            </div>
          </div>
        )}
        <div className="col-span-2"><label className={LABEL} htmlFor="sg-notes">Run-of-show note (all sectors)</label><textarea id="sg-notes" rows={2} className={FIELD} value={f.notes} onChange={set('notes')} /></div>
      </div>
      <button type="button" onClick={() => setCuesOpen((o) => !o)} className={`${BTN} text-[#B85838] mt-2`} aria-expanded={cuesOpen}>{cuesOpen ? '▾ Hide per-sector cues' : '＋ Per-sector cues'}</button>
      {cuesOpen && (
        <div className="grid grid-cols-1 gap-1.5 mt-1 bg-[#FAF8F4] border border-[#E8E4DC] p-2">
          {SECTORS.filter((s) => s.key !== 'general').map((s) => (
            <div key={s.key}><label className={LABEL} htmlFor={`cue-${s.key}`}>{s.emoji} {s.short} cue</label>
              <input id={`cue-${s.key}`} className={FIELD} value={f.cues[s.key] || ''} onChange={setCue(s.key)} placeholder={`What ${s.short} does here…`} /></div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button type="submit" disabled={busy} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>{busy ? 'Saving…' : 'Save segment'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Cancel</button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// One flow row (read). Shows time, who's up, the viewer's own cue + real links.
// -----------------------------------------------------------------------------
function FlowRow({ item, adjustedMin, isStewardLens }) {
  const mine = item.isOwner;
  return (
    <div className={`border-l-4 pl-3 py-2 ${mine ? 'border-[#B85838] bg-[#FAF8F4]' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          {item.startClock && <span className="text-[0.6875rem] tabular-nums text-[#5A5751] w-[68px] inline-block">{item.startClock}</span>}
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-[#1A1815]">{item.title}</span>
          {mine && <span className="text-[0.5625rem] uppercase tracking-wider bg-[#B85838] text-white px-1.5 py-0.5">You're up</span>}
        </div>
        <div className="flex items-center gap-2 text-[0.6875rem] text-[#5A5751]">
          <span>{sectorShort(item.ownerSector)}{item.ownerName ? ` · ${item.ownerName}` : ''}</span>
          <span className="tabular-nums">{Number.isFinite(adjustedMin) && adjustedMin !== item.plannedMinutes ? `${adjustedMin}′ (was ${item.plannedMinutes}′)` : `${item.plannedMinutes}′`}{item.flexible === false ? ' · fixed' : ''}</span>
        </div>
      </div>
      {item.scriptureRef && <p className="text-[0.6875rem] text-[#5A6E3D] mt-0.5 ml-[76px]">{item.scriptureRef}</p>}
      {item.myCue && <p className="text-xs text-[#B85838] mt-1 ml-[76px]" style={{ fontFamily: '"Fraunces", serif' }}><span className="font-semibold">Your cue:</span> {item.myCue}</p>}
      {item.notes && <p className="text-[0.6875rem] text-[#5A5751] italic mt-0.5 ml-[76px]" style={{ fontFamily: '"Fraunces", serif' }}>{item.notes}</p>}
      {item.sermon && <p className="text-xs text-[#1A1815] mt-1 ml-[76px]">📖 <span className="font-semibold">{item.sermon.title}</span>{item.sermon.speaker ? ` — ${item.sermon.speaker}` : ''}{item.sermon.scriptureRef ? ` · ${item.sermon.scriptureRef}` : ''}</p>}
      {item.songs?.length > 0 && (
        <ul className="ml-[76px] mt-1 space-y-0.5">
          {item.songs.map((s) => (
            <li key={s.id} className="text-xs text-[#1A1815]">🎵 <span className="font-semibold">{s.title}</span>{s.scriptureRef ? ` · ${s.scriptureRef}` : ''}{s.notes ? <span className="text-[#5A5751] italic"> — {s.notes}</span> : null}</li>
          ))}
        </ul>
      )}
      {isStewardLens && Object.keys(item.cues || {}).length > 0 && (
        <div className="ml-[76px] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(item.cues).map(([k, v]) => v ? <span key={k} className="text-[0.625rem] text-[#5A5751]"><span className="uppercase tracking-wider text-[#8A857C]">{sectorShort(k)}:</span> {v}</span> : null)}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main surface
// -----------------------------------------------------------------------------
export default function ServiceProgram() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ canSee: false, canEdit: false, sector: 'worship' });
  const [programs, setPrograms] = useState([]);
  const [segments, setSegments] = useState([]);
  const [songs, setSongs] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [lens, setLens] = useState('worship');
  const [programForm, setProgramForm] = useState(null);
  const [segmentForm, setSegmentForm] = useState(null);
  const [reflowMin, setReflowMin] = useState('');
  const [changes, setChanges] = useState([]);
  const [members, setMembers] = useState([]);
  const [actuals, setActuals] = useState([]);
  const [manageFinalizers, setManageFinalizers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const a = await getServiceProgramAccess();
      if (!active) return;
      setSignedIn(a.signedIn);
      setAccess(a);
      setLens(a.canEdit ? STEWARD : a.sector);
    };
    load();
    const off = onAuthChange(() => load());
    return () => { active = false; try { off && off(); } catch { /* noop */ } };
  }, []);

  useEffect(() => {
    if (!signedIn || !access.canSee) return undefined;
    const unsubs = [
      subscribePrograms(setPrograms),
      subscribeSegments(setSegments),
      subscribeSongs(setSongs),
      subscribeSermons(setSermons),
      subscribeChanges(setChanges),
      subscribeActuals(setActuals),
      ...(access.canEdit ? [subscribeFinalizerMembers(setMembers)] : []),
    ];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, [signedIn, access.canSee, access.canEdit]);

  const isSteward = access.role === 'owner' || access.role === 'admin';

  const program = useMemo(() => programs.find((p) => p.id === selectedId) || programs[0] || null, [programs, selectedId]);
  const programSegments = useMemo(() => segments.filter((s) => program && s.programId === program.id), [segments, program]);
  const programSongs = useMemo(() => {
    if (!program) return [];
    const onDate = songs.filter((s) => s.serviceDate === program.serviceDate);
    return onDate.length ? onDate : songs;
  }, [songs, program]);
  const programSermons = useMemo(() => {
    if (!program) return [];
    const onDate = sermons.filter((s) => s.serviceDate === program.serviceDate);
    return onDate.length ? onDate : sermons;
  }, [sermons, program]);

  const view = useMemo(() => program ? deriveSectorView(program, programSegments, lens, { songs, sermons }) : null, [program, programSegments, lens, songs, sermons]);
  const reflow = useMemo(() => {
    const n = Number(reflowMin);
    if (!program || !Number.isFinite(n) || n <= 0) return null;
    return reflowProgram(programSegments, n);
  }, [reflowMin, program, programSegments]);
  const adjById = useMemo(() => {
    const m = new Map();
    if (reflow) reflow.segments.forEach((s) => m.set(s.id, s.adjustedMinutes));
    return m;
  }, [reflow]);
  const programChanges = useMemo(() => (program ? changes.filter((c) => c.programId === program.id).slice(0, 20) : []), [changes, program]);
  const finalizerMembers = useMemo(() => members.filter((m) => m.userId), [members]);

  // The BLUEPRINT for THIS service: the most recent reconciled service of the
  // same type seeds the next plan. Offered only when this program has no segments
  // yet (a fresh service to build), so the steward starts from what worked.
  const blueprint = useMemo(() => {
    if (!program || programSegments.length > 0) return null;
    const src = pickBlueprintProgram(programs, { serviceType: program.serviceType, beforeDate: program.serviceDate, excludeId: program.id });
    if (!src) return null;
    const srcSegments = segments.filter((s) => s.programId === src.id);
    const srcActuals = actuals.filter((a) => a.programId === src.id);
    return blueprintFromActual(src, srcSegments, srcActuals);
  }, [program, programSegments, programs, segments, actuals]);

  const report = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Your change was not stored — try again.`); else setErr(''); return res; };

  const onSeedBlueprint = async () => {
    if (!program || !blueprint) return;
    setBusy(true);
    report(await seedSegmentsFromBlueprint(program.id, blueprint));
    setBusy(false);
  };

  const onSaveProgram = async (f) => {
    setBusy(true);
    const res = report(await saveProgram(f));
    if (res?.id) setSelectedId(res.id);
    setBusy(false); setProgramForm(null);
  };
  const onSaveSegment = async (f) => {
    if (!program) return;
    setBusy(true);
    report(await saveSegment(program.id, f));
    setBusy(false); setSegmentForm(null);
  };
  const onSeed = async () => {
    if (!program) return;
    setBusy(true);
    report(await seedProgramSegments(program.id));
    setBusy(false);
  };
  const onToggleFinalizer = async (m) => {
    setBusy(true);
    report(await setFinalizer(m.userId, !m.isFinalizer));
    setBusy(false);
  };
  const onDeleteProgram = async () => {
    if (!program) return;
    if (!window.confirm('Delete this whole order of service? Segments are removed too.')) return;
    setBusy(true);
    report(await deleteProgram(program.id));
    setSelectedId(null);
    setBusy(false);
  };

  if (!signedIn) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · order of service">Order of Service</SectionTitle>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to see Sunday's order of worship and your part in it.</p>
      </div>
    );
  }
  if (!access.canSee) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · order of service">Order of Service</SectionTitle>
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">📋</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>This is the worship team's order of service.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Ask a steward to add you to the team, then Sunday's run-of-show — and your sector's part — will show up here.</p>
        </div>
      </div>
    );
  }

  const lensButtons = [...(access.canEdit ? [STEWARD] : []), ...SECTORS.filter((s) => s.key !== 'general').map((s) => s.key)];
  const isStewardEditing = access.canEdit && lens === STEWARD;

  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Church · order of service">Order of Service</SectionTitle>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>One master program per Sunday. Every section runs their part from the same source of truth — choose your sector below to see your cues, your songs, and when you're up.</p>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {/* Program picker + steward controls */}
      <div className="flex items-end gap-2 flex-wrap mb-3">
        {programs.length > 0 && (
          <div className="flex-1 min-w-[180px]">
            <label className={LABEL} htmlFor="sp-pick">Service</label>
            <select id="sp-pick" className={FIELD} value={program?.id || ''} onChange={(e) => setSelectedId(e.target.value)}>
              {programs.map((p) => <option key={p.id} value={p.id}>{fmtDate(p.serviceDate)} · {p.title}{p.status !== 'published' ? ` (${p.status})` : ''}</option>)}
            </select>
          </div>
        )}
        {access.canEdit && (
          <button type="button" onClick={() => setProgramForm({ initial: null })} className={`${BTN} bg-[#1A1815] text-white font-semibold`}>＋ New service</button>
        )}
      </div>

      {programForm && access.canEdit && <ProgramForm initial={programForm.initial} busy={busy} onSave={onSaveProgram} onCancel={() => setProgramForm(null)} />}

      {!program && !programForm && (
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">📋</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>No order of service yet.</p>
          {access.canEdit
            ? <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Create this Sunday's master program, then add segments or start from a standard order.</p>
            : <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>A steward hasn't published this Sunday's order yet. Check back soon.</p>}
        </div>
      )}

      {program && (
        <>
          {/* Lens selector — the per-sector view-as strip */}
          <TabScroll className="mb-3" label="View as sector">
            {lensButtons.map((key) => (
              <button key={key} type="button" role="tab" aria-selected={lens === key} onClick={() => setLens(key)}
                className={`px-3 py-2 whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${lens === key ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>
                {key === STEWARD ? '🛠 Master' : `${SECTORS.find((s) => s.key === key)?.emoji} ${sectorShort(key)}`}
              </button>
            ))}
          </TabScroll>

          {/* Program header */}
          <div className="bg-white border border-[#1A1815] p-3 mb-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <div className="text-lg text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{program.title}</div>
                <div className="text-xs text-[#5A5751]">{fmtDate(program.serviceDate)}{program.startTime ? ` · starts ${formatClock((Number(program.startTime.split(':')[0]) * 60) + Number(program.startTime.split(':')[1]))}` : ''}{program.serviceSlot ? ` · ${program.serviceSlot}` : ''}</div>
              </div>
              <span className={`text-[0.5625rem] uppercase tracking-wider px-2 py-1 border ${STATUS_STYLE[program.status] || STATUS_STYLE.draft}`}>{program.status}</span>
            </div>
            {program.theme && <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}><span className="text-[#8A857C] uppercase tracking-wider text-[0.5625rem]">Theme</span> · {program.theme}</p>}
            {program.scriptureRef && <p className="text-xs text-[#5A6E3D] mt-0.5">{program.scriptureRef}</p>}
            {view && (
              <p className="text-[0.6875rem] text-[#5A5751] mt-1.5 tabular-nums">
                {view.plannedTotalMinutes}′ planned across {view.flow.length} segment{view.flow.length === 1 ? '' : 's'}
                {program.targetMinutes ? ` · target ${program.targetMinutes}′` : ''}
                {!isStewardEditing && ` · you own ${view.mineCount}`}
              </p>
            )}
            {program.notes && <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{program.notes}</p>}
          </div>

          {/* Reflow control */}
          <div className="flex items-end gap-2 flex-wrap mb-3 bg-[#FAF8F4] border border-[#E8E4DC] p-2">
            <div>
              <label className={LABEL} htmlFor="sp-reflow">If the service has only this long (min), reflow</label>
              <input id="sp-reflow" type="number" min="0" className={`${FIELD} w-32`} value={reflowMin} onChange={(e) => setReflowMin(e.target.value)} placeholder={String(view?.plannedTotalMinutes || '')} />
            </div>
            {reflow && <p className="text-[0.6875rem] text-[#5A5751] flex-1">{reflow.feasible ? `Flexible segments scaled to ${(reflow.scale * 100).toFixed(0)}% (fixed ${reflow.fixedTotal}′ kept).` : `⚠ Fixed segments alone need ${reflow.fixedTotal}′ — more than ${reflowMin}′ available.`}{reflowMin && <button type="button" onClick={() => setReflowMin('')} className="ml-2 underline text-[#B85838]">clear</button>}</p>}
          </div>

          {/* Steward editor controls */}
          {isStewardEditing && (
            <div className="flex gap-2 flex-wrap mb-3">
              <button type="button" onClick={() => setSegmentForm({ initial: { sortOrder: (programSegments.length + 1) * 10 } })} className={`${BTN} bg-[#5A6E3D] text-white font-semibold`}>＋ Add segment</button>
              <button type="button" onClick={() => setProgramForm({ initial: program })} className={`${BTN} text-[#5A5751] hover:text-[#1A1815] border border-[#E8E4DC]`}>Edit master</button>
              {programSegments.length === 0 && <button type="button" onClick={onSeed} disabled={busy} className={`${BTN} text-[#B85838] border border-[#B85838] disabled:opacity-50`}>Start from standard order ({seedDefaultOrder().length})</button>}
              {programSegments.length === 0 && blueprint && (
                <button type="button" onClick={onSeedBlueprint} disabled={busy} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>
                  Start from last {program.serviceType === 'wednesday' ? 'Wednesday' : program.serviceType === 'sunday' ? 'Sunday' : program.serviceType}&apos;s actual ({blueprint.segments.length})
                </button>
              )}
              <button type="button" onClick={onDeleteProgram} className={`${BTN} text-[#991B1B] hover:underline`}>Delete service</button>
            </div>
          )}
          {segmentForm && isStewardEditing && <SegmentForm initial={segmentForm.initial} programSongs={programSongs} programSermons={programSermons} busy={busy} onSave={onSaveSegment} onCancel={() => setSegmentForm(null)} />}

          {/* Finalizer circle — who can finalize the whole master (collaborative) */}
          {isStewardEditing && (
            <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span className="text-[#1A1815] font-semibold">Worship-team finalizers</span> edit the whole master together (BG · Christina · the keyboardist · Darrell). Everyone else gets their sector view.
                  {access.isFinalizer && !isSteward && ' You can finalize.'}
                </p>
                {isSteward && <button type="button" onClick={() => setManageFinalizers((o) => !o)} className={`${BTN} text-[#B85838]`} aria-expanded={manageFinalizers}>{manageFinalizers ? '▾ Hide' : 'Manage circle'}</button>}
              </div>
              {isSteward && manageFinalizers && (
                <div className="mt-2 border-t border-[#E8E4DC] pt-2">
                  {finalizerMembers.length === 0
                    ? <p className="text-[0.6875rem] text-[#5A5751]">No roster members linked yet. Add the keyboardist (and others) to the choir roster first, then mark them a finalizer here. BG, Christina and Darrell already finalize as stewards.</p>
                    : (
                      <ul className="space-y-1">
                        {finalizerMembers.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#1A1815]">{m.displayName}<span className="text-[#8A857C]"> · {m.choirRole}</span></span>
                            <button type="button" onClick={() => onToggleFinalizer(m)} disabled={busy} aria-pressed={m.isFinalizer}
                              className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50 ${m.isFinalizer ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC]'}`}>
                              {m.isFinalizer ? '✓ Finalizer' : 'Make finalizer'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Activity trail — who changed what (institutional memory) */}
          {isStewardEditing && programChanges.length > 0 && (
            <details className="bg-white border border-[#E8E4DC] p-2 mb-3">
              <summary className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] cursor-pointer">Recent changes ({programChanges.length})</summary>
              <ul className="mt-2 space-y-0.5">
                {programChanges.map((c) => (
                  <li key={c.id} className="text-[0.6875rem] text-[#5A5751]">
                    <span className="text-[#1A1815] font-semibold">{c.actorName || 'Someone'}</span> · {c.summary}
                    {c.createdAt && <span className="text-[#8A857C]"> · {(() => { try { return new Date(c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } })()}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* The flow */}
          {view && view.flow.length === 0 && (
            <p className="text-sm text-[#5A5751] text-center py-6" style={{ fontFamily: '"Fraunces", serif' }}>No segments yet.{isStewardEditing ? ' Add the first one above, or start from the standard order.' : ' A steward is still building this order.'}</p>
          )}
          {view && view.flow.length > 0 && (
            <div className="space-y-1">
              {!isStewardEditing && view.mineCount === 0 && (
                <p className="text-xs text-[#5A5751] bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-1" style={{ fontFamily: '"Fraunces", serif' }}>You don't own a segment in this service — here's the full flow for context.</p>
              )}
              {view.flow.map((item) => (
                <div key={item.id} className="group">
                  <FlowRow item={item} adjustedMin={adjById.get(item.id)} isStewardLens={isStewardEditing} />
                  {isStewardEditing && (
                    <div className="flex gap-2 ml-3 mb-1 opacity-70">
                      <button type="button" onClick={() => setSegmentForm({ initial: item.__seg || programSegments.find((s) => s.id === item.id) })} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
                      <button type="button" onClick={async () => { report(await deleteSegment(item.id, { programId: program.id, title: item.title })); }} className="text-[0.625rem] uppercase tracking-wider text-[#991B1B] hover:underline">Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* The ACTUAL side: what really happened -> reconcile -> blueprint.
              Shown to the whole team (read); the finalizer circle reconciles. */}
          {view && view.flow.length > 0 && (
            <ServiceActuals program={program} plannedSegments={programSegments} actuals={actuals} songs={songs} sermons={sermons} canEdit={access.canEdit} />
          )}
        </>
      )}
    </div>
  );
}
