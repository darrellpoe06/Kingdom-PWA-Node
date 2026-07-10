// =============================================================================
// HarvestLedger — the coverage ledger surface: "no video lost" made visible
// =============================================================================
// Binding principle (Darrell 2026-06-25):
//   "No video should be lost to that Sunday or Wednesday — we need each video to
//    give us new content and context to something."
//
// One source, many harvests. Every ingested service recording fans out into the
// message, worship songs, lessons, Scripture, discernment context, testimony,
// trivia, and events-as-data. This surface MEASURES that: every ingested video,
// what it has already been mined into, and — surfaced first — the ones still
// owed. The numbers come from the real corpus (choir_sermons + choir_songs)
// joined over the video_harvests ledger (harvest-ledger.js), never painted
// (DR-0076). Honest empty / partial / orphan states throughout.
//
// Access: read = any choir member (getChoirAccess.canSee); record = owner/admin
// (canEdit). RLS (0050) is the real wall; the client mirrors it.
//
// THEMING: structural colors use the church palette CLASS tokens that already
// carry midnight remaps (#1A1815/#5A5751/#B85838/#5A6E3D/#E8E4DC/#FAF8F4/white).
// Status/flag tints (green/amber/red) are applied as INLINE styles — a cream
// card with dark text reads at AA in every theme, and inline color avoids
// introducing un-remapped class tokens (contrast-guard token coverage).
// Accessibility: #1A1815 body, #5A5751 secondary, status colors at AA on light,
// visible #B85838 focus outline, aria-live on load.
// =============================================================================
import React, { useEffect, useState, useCallback } from 'react';
import { SectionTitle } from './shared.jsx';
import SectionTabs from './SectionTabs.jsx';
import RecordsLog from './RecordsLog.jsx';
import { onAuthChange } from '../lib/supabase.js';
import { getChoirAccess } from '../lib/choir-sync.js';
import { HARVEST_TYPES, harvestMapFor, harvestType, TRANSCRIPT_DERIVED_KEYS } from '../lib/video-harvest.js';
import { aboutFor } from '../lib/surface-help.js';

// LIGHT inline self-explanation — declared centrally in surface-help.js so the
// Help-freshness gate can verify the deep Help entry stays current with it.
const HARVEST_ABOUT = aboutFor('church:harvest');

// Which harvests are mined from the service transcript (now auto-sourced from the
// video's YouTube captions, no GPU) vs. derived from the row the instant it lands.
const FROM_TRANSCRIPT = new Set(TRANSCRIPT_DERIVED_KEYS);
import { subscribeLedger, recordHarvest, markHarvestNotApplicable } from '../lib/harvest-ledger.js';
import { corpusCoverage } from '../lib/corpus-coverage.js';
import { OPS_JOBS, queueCommand, cancelCommand, subscribeOpsCommands, runnerHint } from '../lib/ops-commands.js';

const fmtDate = (d) => {
  if (!d) return 'undated';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};
const serviceLabel = (t) => (t === 'wednesday' ? 'Wednesday Bible study' : t === 'sunday' ? 'Sunday service' : t || 'service');

// Status -> AA-on-light visual (inline). complete = green, partial = amber,
// na = muted strike, none = the honest gap.
const STATUS_STYLE = {
  complete: { color: '#166534', border: '#166534', bg: '#F0FAF1', glyph: '✓' },
  partial:  { color: '#92400E', border: '#B8893B', bg: '#FBF6EC', glyph: '◐' },
  na:       { color: '#5A5751', border: '#E8E4DC', bg: '#FAF8F4', glyph: '—' },
  none:     { color: '#8A857C', border: '#E8E4DC', bg: '#FFFFFF', glyph: '·' },
};
const FLAG_STYLE = {
  orphan:  { label: 'Not yet mined', color: '#991B1B', bg: '#FCEDEC', border: '#991B1B', fill: '#C9A227' },
  partial: { label: 'Partly mined', color: '#92400E', bg: '#FBF6EC', border: '#B8893B', fill: '#B85838' },
  ok:      { label: 'Fully mined', color: '#166534', bg: '#F0FAF1', border: '#166534', fill: '#5A6E3D' },
};

function CoverageBar({ pct, flag }) {
  const fill = (FLAG_STYLE[flag] || FLAG_STYLE.partial).fill;
  return (
    <div className="h-2 w-full rounded" style={{ background: '#EFEBE3' }} role="img" aria-label={`${pct}% harvested`}>
      <div className="h-2 rounded" style={{ width: `${Math.max(pct, flag === 'orphan' ? 3 : 0)}%`, background: fill }} />
    </div>
  );
}

// One harvest-type chip. In edit mode, clicking opens record actions.
function TypeChip({ typeKey, record, canEdit, onRecord, onNa }) {
  const [open, setOpen] = useState(false);
  const t = harvestType(typeKey);
  const st = STATUS_STYLE[record.status] || STATUS_STYLE.none;
  const evidence = record.evidenced ? ' · verified' : '';
  const label = `${t.short}${record.count ? ` ${record.count}` : ''}`;
  const title = `${t.label}: ${record.status}${evidence}${record.status === 'none' ? ' — not yet harvested' : ''}`;
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => canEdit && setOpen((o) => !o)}
        className="text-[10px] px-1.5 py-0.5 border rounded mr-1 mb-1 focus:outline focus:outline-2 focus:outline-[#B85838]"
        style={{ color: st.color, borderColor: st.border, background: st.bg, cursor: canEdit ? 'pointer' : 'default', textDecoration: record.status === 'na' ? 'line-through' : 'none' }}
        title={title}
        aria-label={title}
      >
        {st.glyph} {label}{record.evidenced ? ' ✦' : ''}
      </button>
      {open && canEdit && (
        <span className="absolute z-10 left-0 top-full mt-1 flex flex-col bg-white border border-[#1A1815] shadow text-left min-w-[150px]" role="menu">
          <span className="px-2 py-1 text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#E8E4DC]">{t.label}</span>
          <button type="button" role="menuitem" className="px-2 py-1.5 text-left text-[11px] hover:bg-[#FAF8F4]" style={{ color: '#166534' }} onClick={() => { onRecord('complete'); setOpen(false); }}>✓ Mark fully harvested</button>
          <button type="button" role="menuitem" className="px-2 py-1.5 text-left text-[11px] hover:bg-[#FAF8F4]" style={{ color: '#92400E' }} onClick={() => { onRecord('partial'); setOpen(false); }}>◐ Mark partly harvested</button>
          <button type="button" role="menuitem" className="px-2 py-1.5 text-left text-[11px] hover:bg-[#FAF8F4] text-[#5A5751]" onClick={() => { onNa(); setOpen(false); }}>— Not in this video</button>
        </span>
      )}
    </span>
  );
}

function VideoRow({ video, canEdit, onRecord, onNa }) {
  const [open, setOpen] = useState(video.flag === 'orphan');
  const map = harvestMapFor(video.harvests);
  const fs = FLAG_STYLE[video.flag] || FLAG_STYLE.partial;
  const gaps = video.coverage.untouchedTypes;
  return (
    <div className="border border-[#E8E4DC] bg-white mb-2">
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-[#1A1815]">{video.title || 'Untitled service'}</span>
            <span className="text-[11px] text-[#5A5751]">{fmtDate(video.serviceDate)} · {serviceLabel(video.serviceType)}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 border rounded" style={{ color: fs.color, background: fs.bg, borderColor: fs.border }}>{fs.label} · {video.coverage.pct}%</span>
        </div>
        <div className="mt-2"><CoverageBar pct={video.coverage.pct} flag={video.flag} /></div>
        <div className="mt-2 flex flex-wrap items-center">
          {HARVEST_TYPES.map((t) => (
            <TypeChip
              key={t.key}
              typeKey={t.key}
              record={map[t.key]}
              canEdit={canEdit}
              onRecord={(status) => onRecord(video, t.key, status)}
              onNa={() => onNa(video, t.key)}
            />
          ))}
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-[11px] text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-expanded={open}>
          {open ? '▾ Hide detail' : `▸ ${gaps.length ? `${gaps.length} harvest${gaps.length === 1 ? '' : 's'} still owed` : 'Detail'}`}
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 border-t border-[#E8E4DC] bg-[#FAF8F4]">
          {video.youtubeUrl && (
            <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[11px] text-[#B85838] underline hover:text-[#1A1815]">▶ Source recording</a>
          )}
          {gaps.length === 0 ? (
            <p className="mt-2 text-[12px]" style={{ fontFamily: '"Fraunces", serif', color: '#166534' }}>Every applicable harvest is settled. Nothing lost from this service.</p>
          ) : (
            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Still to harvest from this recording</p>
              <ul className="space-y-1">
                {gaps.map((k) => {
                  const t = harvestType(k);
                  return (
                    <li key={k} className="text-[12px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                      <span className="font-semibold">{t.label}</span> — <span className="text-[#5A5751]">{t.description}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {!canEdit && <p className="mt-2 text-[11px] text-[#5A5751] italic">A church steward records harvests as each recording is mined.</p>}
        </div>
      )}
    </div>
  );
}

// Command status -> AA-on-light visual (inline), same palette discipline as
// STATUS_STYLE above.
const CMD_STYLE = {
  queued:  { color: '#5A5751', border: '#E8E4DC', bg: '#FAF8F4', label: 'queued' },
  running: { color: '#92400E', border: '#B8893B', bg: '#FBF6EC', label: 'running…' },
  done:    { color: '#166534', border: '#166534', bg: '#F0FAF1', label: 'done' },
  error:   { color: '#991B1B', border: '#991B1B', bg: '#FCEDEC', label: 'error' },
  skipped: { color: '#8A857C', border: '#E8E4DC', bg: '#FFFFFF', label: 'skipped' },
};

const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
};

function CommandRow({ cmd, onCancel }) {
  const [open, setOpen] = useState(false);
  const st = CMD_STYLE[cmd.status] || CMD_STYLE.queued;
  const meta = OPS_JOBS[cmd.job];
  return (
    <div className="border border-[#E8E4DC] bg-white mb-1">
      <div className="px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.625rem] px-1.5 py-0.5 border rounded" style={{ color: st.color, borderColor: st.border, background: st.bg }}>{st.label}</span>
          <span className="text-[0.75rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{meta?.label || cmd.job}</span>
          <span className="text-[0.625rem] text-[#5A5751]">{fmtTime(cmd.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {cmd.status === 'queued' && (
            <button type="button" onClick={() => onCancel(cmd.id)} className="text-[0.625rem] text-[#991B1B] underline hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
          )}
          {cmd.log && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-[0.625rem] text-[#B85838] underline hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-expanded={open}>
              {open ? 'Hide output' : 'Output'}
            </button>
          )}
        </div>
      </div>
      {open && cmd.log && (
        <pre className="px-2 pb-2 text-[0.625rem] text-[#5A5751] whitespace-pre-wrap break-words max-h-48 overflow-y-auto border-t border-[#E8E4DC] bg-[#FAF8F4]">{cmd.log.slice(-1500)}</pre>
      )}
    </div>
  );
}

// The stewards' pipeline controls (DR-0088): trigger + observe the transcript
// loader from INSIDE the app. Renders only for owner/admin (RLS 0068 is the
// real wall). A command row is picked up by the NAS ops-runner within ~1 min.
function OpsAdminCard() {
  const [commands, setCommands] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => subscribeOpsCommands(setCommands), []);

  const queue = async (job) => {
    setNote('Queuing…');
    const r = await queueCommand(job, {}, '');
    setNote(r.queued ? 'Queued — the NAS runner picks it up within a minute.' : `Could not queue (${r.skipped}).`);
  };
  const onCancel = async (id) => { await cancelCommand(id); };

  const hint = runnerHint(commands || [], Date.now());
  return (
    <div className="bg-white border border-[#E8E4DC] p-3 mb-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Transcript pipeline — steward controls</p>
        {hint === 'queued-stale' && (
          <span className="text-[0.625rem] px-1.5 py-0.5 border rounded" style={{ color: '#92400E', borderColor: '#B8893B', background: '#FBF6EC' }}>
            Still queued — is the NAS runner armed?
          </span>
        )}
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Buttons queue a command the NAS runner executes (within about a minute) and report back here live — no shell, no NAS screens.
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {Object.entries(OPS_JOBS).map(([job, meta]) => (
          <button
            key={job}
            type="button"
            onClick={() => queue(job)}
            title={meta.description}
            className="text-[0.6875rem] px-2.5 py-1.5 border border-[#1A1815] bg-[#FAF8F4] text-[#1A1815] hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            {meta.label}
          </button>
        ))}
      </div>
      {note && <p className="text-[0.6875rem] text-[#B85838] mb-2" aria-live="polite">{note}</p>}
      {commands === null ? (
        <p className="text-[0.6875rem] text-[#5A5751] italic">Loading recent commands…</p>
      ) : commands.length === 0 ? (
        <p className="text-[0.6875rem] text-[#5A5751] italic">No commands yet — the first one you queue appears here with live status.</p>
      ) : (
        <div>{commands.map((c) => <CommandRow key={c.id} cmd={c} onCancel={onCancel} />)}</div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'bad' ? '#991B1B' : tone === 'good' ? '#166534' : '#1A1815';
  return (
    <div className="bg-white border border-[#E8E4DC] p-3 text-center">
      <div className="text-2xl font-semibold" style={{ color, fontFamily: '"Fraunces", serif' }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">{label}</div>
    </div>
  );
}

export default function HarvestLedger() {
  const [access, setAccess] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let unsub = null;
    const start = async () => {
      const a = await getChoirAccess();
      setAccess(a);
      if (a.canSee) {
        unsub = subscribeLedger((l) => { setLedger(l); setLoading(false); });
      } else {
        setLoading(false);
      }
    };
    start();
    const off = onAuthChange(() => { if (unsub) unsub(); setLoading(true); start(); });
    return () => { if (unsub) unsub(); if (off) off(); };
  }, []);

  const onRecord = useCallback(async (video, typeKey, status) => {
    setBusy(`${video.videoId}:${typeKey}`);
    await recordHarvest(video.videoId, typeKey, { status }, { serviceDate: video.serviceDate, serviceType: video.serviceType, title: video.title, sourceKind: video.sourceKind }, '');
    setBusy('');
  }, []);
  const onNa = useCallback(async (video, typeKey) => {
    setBusy(`${video.videoId}:${typeKey}`);
    await markHarvestNotApplicable(video.videoId, typeKey, { serviceDate: video.serviceDate, serviceType: video.serviceType, title: video.title, sourceKind: video.sourceKind }, '');
    setBusy('');
  }, []);

  if (loading) {
    return <div className="bg-white border border-[#E8E4DC] p-5 text-sm text-[#5A5751]" aria-live="polite" style={{ fontFamily: '"Fraunces", serif' }}>Loading the harvest ledger…</div>;
  }
  if (!access?.signedIn) {
    return <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Sign in with a church account to see the harvest ledger.</div>;
  }
  if (!access?.canSee) {
    return <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The harvest ledger is for the choir / church team. Ask a steward to add you.</div>;
  }

  const l = ledger || { videos: 0, rows: [], orphans: 0, fullyHarvested: 0, partiallyHarvested: 0, avgPct: 0, fullyPct: 0, noVideoLost: true, byType: {} };

  // Corpus wholeness (DR-0135): is what the app HOLDS everything the channel
  // HAS? The 125-of-335 gap hid for weeks because nothing compared them.
  const wholeness = corpusCoverage(l.rows);

  // Sliding section tabs (Darrell 2026-07-04 / 2026-07-05): the KPI banner +
  // stat strip stay PINNED above the strip (always visible — "no more down
  // scrolling to see KPIs"); the long stacked content moves behind sections.
  // All hooks stay at this top level; the render thunks are plain closures.
  const sections = [
    {
      id: 'recordings',
      label: 'Recordings',
      icon: 'volume',
      render: () => (
        <>
          {busy && <div className="text-[11px] text-[#B85838] mb-2" aria-live="polite">Saving…</div>}

          {/* Corpus wholeness strip (DR-0135) — the channel-vs-app comparison
              the 125-of-335 gap never had. Amber until whole; never silent. */}
          <div
            className="border p-3 mb-3"
            style={{
              borderColor: wholeness.manifestReady && wholeness.missing.length === 0 ? '#5A6E3D' : '#B85838',
              backgroundColor: '#FAF8F4',
            }}
            role="status"
          >
            <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Corpus wholeness — channel vs app</p>
            <p className="text-[0.75rem] text-[#1A1815] leading-relaxed">
              {wholeness.livePresent} service videos live in the app. {wholeness.note}
            </p>
          </div>

          <RecordsLog
            items={l.rows}
            getDate={(v) => v.serviceDate}
            getText={(v) => `${v.title || ''} ${v.serviceType || ''}`}
            countNoun="recording"
            about={HARVEST_ABOUT}
            facets={[
              { key: 'flag', label: 'coverage', getValue: (v) => (v.flag === 'orphan' ? 'orphans' : v.flag === 'partial' ? 'partial' : 'covered') },
              { key: 'type', label: 'services', getValue: (v) => (v.serviceType === 'wednesday' ? 'Wednesday' : 'Sunday') },
            ]}
            renderRow={(v) => <VideoRow video={v} canEdit={!!access.canEdit} onRecord={onRecord} onNa={onNa} />}
          />
          <p className="mt-3 text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            ✦ marks a harvest verified against real app data. The <span className="font-semibold not-italic">now</span> harvests — message, Scripture cited, worship songs, and the service event — are mined in-app the moment a recording is ingested. The <span className="font-semibold not-italic">caption</span> harvests — transcript, lessons, discernment, testimony, trivia — are mined from the service transcript, sourced automatically from the video’s YouTube auto-captions (no GPU). Whisper-on-NAS is only the fallback for a video that has no captions at all.
          </p>
        </>
      ),
    },
    {
      id: 'coverage',
      label: 'Coverage by type',
      icon: 'chart',
      render: () => (
        <div className="bg-white border border-[#E8E4DC] p-3 mb-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
            <p className="text-[10px] uppercase tracking-wider text-[#5A5751]">Harvest coverage across the corpus</p>
            <p className="text-[10px] text-[#5A5751]">
              <span className="font-semibold" style={{ color: '#166534' }}>now</span> = mined the moment a recording lands ·
              <span className="font-semibold" style={{ color: '#1D4ED8' }}> caption</span> = mined automatically from the video’s YouTube transcript (no GPU)
            </p>
          </div>
          <div className="space-y-1">
            {HARVEST_TYPES.map((t) => {
              // count a partial harvest as progress too, so an auto type that
              // lights partially (scripture / songs) still shows movement.
              const bt = l.byType[t.key] || { complete: 0, partial: 0, none: 0, na: 0 };
              const done = bt.complete + bt.partial * 0.5;
              const pct = l.videos ? Math.round((done / l.videos) * 100) : 0;
              const fromTranscript = FROM_TRANSCRIPT.has(t.key);
              return (
                <div key={t.key} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#1A1815] w-28 shrink-0 flex items-center gap-1" title={t.description}>
                    <span className="truncate">{t.label}</span>
                    <span
                      className="text-[8px] px-1 rounded leading-tight shrink-0"
                      style={fromTranscript
                        ? { color: '#1D4ED8', background: '#EFF4FF', border: '1px solid #1D4ED8' }
                        : { color: '#166534', background: '#F0FAF1', border: '1px solid #166534' }}
                      title={fromTranscript ? 'Mined automatically from the video’s YouTube auto-captions (no GPU). Whisper-on-NAS is the fallback for a video with no captions.' : 'Derived in-app the moment the recording is ingested.'}
                    >{fromTranscript ? 'caption' : 'now'}</span>
                  </span>
                  <div className="flex-1 h-2 rounded" style={{ background: '#EFEBE3' }}><div className="h-2 rounded" style={{ width: `${pct}%`, background: fromTranscript ? '#1D4ED8' : '#5A6E3D' }} /></div>
                  <span className="text-[10px] text-[#5A5751] w-24 text-right shrink-0">{bt.complete}✓ {bt.partial}◐ {bt.none}·{bt.na ? ` ${bt.na}—` : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    // Gated section — steward-only pipeline controls (RLS 0068 is the real wall);
    // SectionTabs filters the falsy entry so nothing leaks to non-editors.
    access?.canEdit ? {
      id: 'pipeline',
      label: 'Pipeline controls',
      icon: 'tools',
      render: () => <OpsAdminCard />,
    } : null,
  ];

  return (
    <div>
      <SectionTitle>Harvest Ledger</SectionTitle>
      <p className="text-sm text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        “No video should be lost to that Sunday or Wednesday — we need each video to give us new content and context to something.”
        Every ingested recording is one source mined into many harvests. This ledger shows what each video has produced and surfaces, first, the ones still owed.
      </p>

      {l.videos === 0 ? (
        <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          No service recordings have been ingested yet. Import them from the <span className="font-semibold text-[#1A1815]">Choir → The Word</span> YouTube import, and each one will appear here to be fully mined.
        </div>
      ) : (
        <>
          {/* PINNED above the strip — the no-video-lost banner + the KPI strip
              stay visible whichever section is open (Darrell 2026-07-07: "no
              more down scrolling to see a surface with KPIs"). */}
          <div className="mb-3 p-3 border" style={{ borderColor: l.noVideoLost ? '#166534' : '#991B1B', background: l.noVideoLost ? '#F0FAF1' : '#FCEDEC' }}>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: l.noVideoLost ? '#166534' : '#991B1B', fontFamily: '"Fraunces", serif' }}>
                {l.noVideoLost ? '✓ No video lost — every ingested recording has been mined.' : `⚠ ${l.orphans} recording${l.orphans === 1 ? '' : 's'} not yet mined — content is being lost.`}
              </span>
              <span className="text-[11px] text-[#5A5751]">{l.fullyHarvested}/{l.videos} fully harvested · avg {l.avgPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <Stat label="Videos ingested" value={l.videos} />
            <Stat label="Fully mined" value={l.fullyHarvested} tone="good" />
            <Stat label="Partly mined" value={l.partiallyHarvested} />
            <Stat label="Not yet mined" value={l.orphans} tone={l.orphans ? 'bad' : 'good'} />
          </div>

          <SectionTabs sections={sections} ariaLabel="Harvest ledger sections" idBase="harvest" defaultId="recordings" />
        </>
      )}
    </div>
  );
}
