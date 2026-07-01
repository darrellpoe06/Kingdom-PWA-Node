// =============================================================================
// RapStudy — the interactive RAP Bible Study reflection (Darrell 2026-07-01)
// =============================================================================
// The printed Church of the Living God "Reflections and Praise (RAP) Bible Study"
// handout, made live: the teaching outline (church / dates / teacher / Scriptures
// / the five Elijah points) renders from deterministic seed data (rap-study.js),
// and each point is a FILL-IN reflection the user types — mirroring the blank
// lines under each point on the paper. Reflections save DEVICE-LOCAL and PRIVATE
// by default, keyed to the signed-in identity (never cloud, never mined).
//
// Wired to the harvest: when today's study video's transcript lands in the corpus
// (video_transcripts, surfaced by harvest-ledger.js), the outline and the ACTUAL
// teaching live together — the real transcript + the auto-harvested Scripture and
// lessons attach beneath the outline. Until it lands the panel shows the honest
// 'awaiting' state (real system state, never a painted attachment; DR-0076).
//
// Accessibility mirrors the Study/Pulpit surfaces: white / #FAF8F4 cards, #1A1815
// body, #5A5751 secondary, labelled inputs, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import supabase from '../lib/supabase.js';
import { fetchLedger, subscribeLedger } from '../lib/harvest-ledger.js';
import {
  RAP_STUDY, loadStore, saveStore, reflectionFor,
  setPointText, setGeneralText, reflectionProgress, resolveStudyHarvest,
} from '../lib/rap-study.js';

const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
const nowIso = () => new Date().toISOString();
const fmtDate = (iso) => { try { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); } catch { return iso; } };

// The shared voice primitive — appends dictation into a field. Renders nothing
// where the browser has no speech recognition.
function MicButton({ onText, label }) {
  const mic = useVoiceDictation({ onTranscript: (t) => onText(t) });
  if (!mic.supported) return null;
  return (
    <button
      type="button" onClick={mic.toggle} aria-pressed={mic.listening}
      aria-label={mic.listening ? `Stop voice input for ${label}` : `Speak your reflection on ${label}`}
      className={`${BTN} border ${mic.listening ? 'bg-[#B85838] text-white border-[#B85838]' : 'text-[#B85838] border-[#B85838] hover:bg-[#FAF8F4]'}`}
    >{mic.listening ? '⏹ Stop' : '🎤 Speak'}</button>
  );
}

// A linked Scripture: the reference is a button that reveals the verbatim text
// (public-domain KJV, fetched at capture — never produced from memory).
function ScriptureCard({ scripture }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-[#E8E4DC]">
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <span className="text-[11px] uppercase tracking-wider text-[#5A6E3D]" style={mono}>{scripture.ref} <span className="text-[#5A5751]">({scripture.translation})</span></span>
        <span className="text-[10px] uppercase tracking-wider text-[#B85838]">{open ? 'Hide' : 'Read'}</span>
      </button>
      {open && (
        <p className="text-sm text-[#1A1815] px-3 pb-3 -mt-0.5" style={serif}>&ldquo;{scripture.text}&rdquo;</p>
      )}
    </div>
  );
}

export default function RapStudy({ email }) {
  const study = RAP_STUDY;
  const [store, setStore] = useState(() => loadStore(email));
  const [harvest, setHarvest] = useState({ status: 'loading' });
  const loadedFor = useRef(null);

  // Load this identity's private reflections (and re-load if the signed-in email
  // changes, so one device never shows another profile's notes).
  useEffect(() => {
    setStore(loadStore(email));
    loadedFor.current = email || null;
  }, [email]);

  // Persist on every change, after the initial load for this identity.
  useEffect(() => {
    if (loadedFor.current !== (email || null)) return;
    saveStore(email, store);
  }, [store, email]);

  // Resolve the harvest join: find this study's video in the corpus and, if its
  // transcript has landed, attach the real transcript + mined Scripture/lessons.
  // Re-runs live whenever any harvest table changes (subscribeLedger). Honest
  // states only: awaiting -> ingested -> attached.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const ledger = await fetchLedger();
        const pre = resolveStudyHarvest(study, { rows: ledger.rows });
        let transcripts = {};
        if (pre.video && pre.video.videoId) {
          const { data } = await supabase.from('video_transcripts').select('text').eq('video_id', pre.video.videoId).maybeSingle();
          if (data && data.text) transcripts[pre.video.videoId] = { text: data.text };
        }
        const resolved = resolveStudyHarvest(study, { rows: ledger.rows, transcripts });
        if (!cancelled) setHarvest(resolved);
      } catch {
        if (!cancelled) setHarvest({ status: 'awaiting', video: null, transcriptText: '', scriptures: [], lessons: [], laneId: study.harvestMatch.laneId });
      }
    }
    load();
    const unsub = subscribeLedger(() => { if (!cancelled) load(); });
    return () => { cancelled = true; try { unsub && unsub(); } catch {} };
  }, [study]);

  const reflection = useMemo(() => reflectionFor(store, study.id), [store, study.id]);
  const progress = useMemo(() => reflectionProgress(reflection, study), [reflection, study]);

  const onPoint = (pointId) => (e) => setStore((s) => setPointText(s, study.id, pointId, e.target.value, nowIso()));
  const appendPoint = (pointId) => (t) => setStore((s) => {
    const cur = reflectionFor(s, study.id).points[pointId] || '';
    return setPointText(s, study.id, pointId, (cur ? cur + ' ' : '') + t, nowIso());
  });
  const onGeneral = (e) => setStore((s) => setGeneralText(s, study.id, e.target.value, nowIso()));

  return (
    <div className="max-w-3xl">
      <SectionTitle eyebrow={`${study.church} · Private to you on this device`}>{study.series}</SectionTitle>

      {/* Handout metadata — the header of the paper, as data. */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 mb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Theme</span>
          <span className="text-xl text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{study.theme}</span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
          <div><dt className="inline text-[#5A5751]">Handout dated: </dt><dd className="inline text-[#1A1815]">{fmtDate(study.handoutDate)}</dd></div>
          <div><dt className="inline text-[#5A5751]">Points from: </dt><dd className="inline text-[#1A1815]">{fmtDate(study.pointsFrom)}</dd></div>
          <div><dt className="inline text-[#5A5751]">Teacher: </dt><dd className="inline text-[#1A1815]">{study.teacher}</dd></div>
          <div><dt className="inline text-[#5A5751]">{study.seniorBishopRole}: </dt><dd className="inline text-[#1A1815]">{study.seniorBishop}</dd></div>
        </dl>
      </div>

      {/* Linked Scriptures — tap a reference to read the verbatim KJV text. */}
      <div className="mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1.5">Scriptures</h3>
        <div className="space-y-1.5">
          {study.scriptures.map((sc) => <ScriptureCard key={sc.ref} scripture={sc} />)}
        </div>
      </div>

      {/* The five points — each a fill-in reflection (the paper's blank lines). */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your reflections</h3>
        <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]" style={mono}>{progress.filled}/{progress.total} written{reflection.updatedAt ? ' · saved' : ''}</span>
      </div>
      <ol className="space-y-3">
        {study.points.map((p) => (
          <li key={p.id} className="bg-white border border-[#E8E4DC] p-3">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label htmlFor={`rap-${p.id}`} className="text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>
                <span className="text-[#B85838]">{p.n}.</span> {p.title}
              </label>
              <MicButton onText={appendPoint(p.id)} label={`point ${p.n}, ${p.title}`} />
            </div>
            <textarea
              id={`rap-${p.id}`} className={AREA} rows="3"
              value={reflection.points[p.id] || ''} onChange={onPoint(p.id)}
              placeholder="Your reflection on this point…"
            />
          </li>
        ))}
      </ol>

      {/* A general reflection field — the whole study, not one point. */}
      <div className="mt-3 bg-white border border-[#E8E4DC] p-3">
        <label htmlFor="rap-general" className="text-[#1A1815] block mb-1.5" style={{ ...serif, fontWeight: 600 }}>What is this study saying to you overall?</label>
        <textarea id="rap-general" className={AREA} rows="3" value={reflection.general} onChange={onGeneral} placeholder="Sit with it through the week…" />
      </div>

      {/* The harvest join — the outline and the ACTUAL teaching, together. */}
      <div className="mt-6">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1.5">This week&rsquo;s recorded study</h3>
        <HarvestPanel harvest={harvest} laneId={study.harvestMatch.laneId} serviceDate={study.harvestMatch.serviceDate} />
      </div>

      <p className="text-[10px] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif}>
        Sourced from the printed Church of the Living God RAP Bible Study handout. Your reflections stay on this device only — private to you, never sent to the cloud, never mined, never used to train anything. A shared sovereign rail (community-default option) is the next step; for now these are yours.
      </p>
    </div>
  );
}

// The harvest attachment, honest about state. Awaiting -> the transcript hasn't
// landed; ingested -> the video is in the corpus but has no transcript yet;
// attached -> the real transcript + mined Scripture/lessons are shown.
function HarvestPanel({ harvest, laneId, serviceDate }) {
  if (!harvest || harvest.status === 'loading') {
    return <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-4 text-sm text-[#5A5751]" style={serif}>Checking for this week&rsquo;s recording&hellip;</div>;
  }
  if (harvest.status === 'awaiting') {
    return (
      <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-4">
        <p className="text-sm text-[#1A1815]" style={serif}>Waiting for today&rsquo;s study recording. When its transcript lands, the actual teaching &mdash; the transcript and the Scripture &amp; lessons harvested from it &mdash; attaches here beside your outline.</p>
        <p className="text-[10px] text-[#5A5751] mt-1.5" style={mono}>harvest lane {laneId || 'n/a'} · service {serviceDate || 'n/a'}</p>
      </div>
    );
  }
  if (harvest.status === 'ingested') {
    return (
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
        <p className="text-sm text-[#1A1815]" style={serif}>The recording is in the library{harvest.video && harvest.video.title ? ` — “${harvest.video.title}”` : ''}. Its transcript hasn&rsquo;t been harvested yet; the Scripture &amp; lessons will attach here the moment it lands.</p>
        <p className="text-[10px] text-[#5A5751] mt-1.5" style={mono}>video {harvest.video ? harvest.video.videoId : 'n/a'} · awaiting transcript</p>
      </div>
    );
  }
  // attached
  const excerpt = (harvest.transcriptText || '').trim().slice(0, 600);
  return (
    <div className="bg-white border border-[#5A6E3D] p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">Teaching attached</span>
        {harvest.video && harvest.video.title && <span className="text-sm text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{harvest.video.title}</span>}
      </div>
      {harvest.scriptures && harvest.scriptures.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Scripture harvested from the teaching</div>
          <div className="flex flex-wrap gap-1.5">
            {harvest.scriptures.map((r) => <span key={r} className="text-[11px] bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A6E3D] px-1.5 py-0.5" style={mono}>{r}</span>)}
          </div>
        </div>
      )}
      {harvest.lessons && harvest.lessons.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Lessons</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {harvest.lessons.slice(0, 8).map((l, i) => <li key={i} className="text-sm text-[#1A1815]" style={serif}>{l}</li>)}
          </ul>
        </div>
      )}
      {excerpt && (
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Transcript (excerpt)</div>
          <p className="text-sm text-[#1A1815] whitespace-pre-wrap" style={serif}>{excerpt}{harvest.transcriptText.length > 600 ? '…' : ''}</p>
        </div>
      )}
      {harvest.video && harvest.video.youtubeUrl && (
        <a href={harvest.video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] inline-block">Watch the recording ↗</a>
      )}
    </div>
  );
}

export { RapStudy };
