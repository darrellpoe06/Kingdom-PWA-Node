// =============================================================================
// ScriptureConnections — the Logos-style scripture connections explorer.
// (Darrell 2026-06-25.) SURFACE ONLY; the engine is ../lib/scripture-connections.js.
// =============================================================================
// Tap a verse -> the navigable web: the verbatim Word, the classic public-domain
// cross-references (Treasury of Scripture Knowledge), the curated theme links, the
// original-language word study (Strong's, public domain), and where this passage
// already shows up in the church's own sermons / lessons / songs (the harvest).
// Tap any in-library cross-reference to recenter the web on it.
//
// REUSABLE: a self-contained component any surface can drop in (the Scripture tab
// today; The Word / Study later) — pass a starting `reference` and, where the caller
// has them, real `sermons` / `lessons` / `songs` rows for the appearances. With the
// user in the Study circle (`canStudy`), one tap saves the whole web into their
// personal Study as a seed to keep studying + build on (the content flywheel).
//
// Accessibility mirrors the Scripture/Study surfaces: white / #FAF8F4 cards, #1A1815
// body, #5A5751 secondary, #5A6E3D scripture green, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { connectionsFor } from '../lib/scripture-connections.js';
import { tskKeys, TSK_LICENSE } from '../lib/scripture-tsk.js';
import { STRONGS_LICENSE } from '../lib/scripture-strongs.js';
import { readOnline } from '../lib/scriptures.js';
import { studySeedFromConnections } from '../lib/studyable.js';
import { loadStudy, saveStudy, addSeedToStudy } from '../lib/study-space.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

const SOURCE_BADGE = {
  tsk: { label: 'TSK', title: 'Treasury of Scripture Knowledge (public domain)', cls: 'bg-[#1A1815] text-white' },
  theme: { label: 'Theme', title: 'Shares a theme in this library', cls: 'bg-[#5A6E3D] text-white' },
};

// One cross-reference chip — navigable (in-library) ones recenter the web; the rest
// link out to read online (never a painted verse).
function CrossRefChip({ cref, onOpen }) {
  const badges = (cref.sources || []).map((s) => SOURCE_BADGE[s]).filter(Boolean);
  const inner = (
    <span className="inline-flex items-center gap-1.5">
      <span style={mono} className="text-[0.6875rem]">{cref.ref}</span>
      {badges.map((b) => (
        <span key={b.label} title={b.title} className={`text-[0.5rem] uppercase tracking-wider px-1 py-0.5 ${b.cls}`}>{b.label}</span>
      ))}
    </span>
  );
  if (cref.navigable) {
    return (
      <button type="button" onClick={() => onOpen(cref.ref)} title={cref.kjv || cref.ref}
        className="text-left border border-[#E8E4DC] bg-white px-2 py-1 hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
        {inner}
      </button>
    );
  }
  return (
    <a href={readOnline(cref.ref, 'ESV')} target="_blank" rel="noopener noreferrer"
      title={`Read ${cref.ref} online (not reproduced — copyright)`}
      className="border border-dashed border-[#E8E4DC] bg-[#FAF8F4] px-2 py-1 hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
      {inner}<span className="text-[0.5625rem] text-[#5A5751] ml-1">↗</span>
    </a>
  );
}

export default function ScriptureConnections({
  reference = 'John 3:16',
  email = null,
  canStudy = false,
  sermons = [],
  lessons = [],
  songs = [],
}) {
  const [active, setActive] = useState(reference);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(null); // {added:boolean} after a save

  const conn = useMemo(
    () => connectionsFor(active, { sermons, lessons, songs }),
    [active, sermons, lessons, songs],
  );
  const anchors = useMemo(() => tskKeys(), []);

  const open = (ref) => { setActive(ref); setSaved(null); };
  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) { setActive(q); setSaved(null); }
  };

  const addToStudy = () => {
    const seed = studySeedFromConnections(conn);
    const study = loadStudy(email);
    const { study: next, added } = addSeedToStudy(study, seed, Date.now(), study.entries.length);
    saveStudy(email, next);
    setSaved({ added });
  };

  const a = conn.appearances;
  const hasAppearances = a && a.total > 0;

  return (
    <div className="border border-[#5A6E3D] bg-white">
      <div className="text-[0.625rem] uppercase tracking-[0.2em] text-white bg-[#5A6E3D] px-3 py-1.5 font-semibold">
        Scripture connections — the web of the Word (public domain)
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[0.6875rem] text-[#5A5751] leading-relaxed" style={serif}>
          Tap a verse to see how it connects — classic cross-references, its themes, the
          original-language word study, and where it shows up in the church’s own work.
          Tap any underlined reference to follow the thread.
        </p>

        {/* Reference picker — search + the seeded anchors */}
        <form onSubmit={onSearch} className="flex gap-2 flex-wrap items-center">
          <label className="sr-only" htmlFor="conn-ref">Go to a reference</label>
          <input id="conn-ref" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Go to a reference (e.g. John 3:16)…"
            className="flex-1 min-w-[12rem] p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            style={mono} />
          <button type="submit" className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Go</button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] py-1">Anchors:</span>
          {anchors.map((r) => (
            <button key={r} type="button" onClick={() => open(r)} aria-pressed={conn.ref === r}
              className={`text-[0.625rem] px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${conn.ref === r ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}
              style={mono}>{r}</button>
          ))}
        </div>

        {/* The centered verse */}
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[0.75rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={mono}>{conn.ref}</span>
            {canStudy && (
              <button type="button" onClick={addToStudy}
                title="Save this into your personal Study to keep studying and build on it"
                className="text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                + Add to my Study
              </button>
            )}
          </div>
          {conn.text.hasText ? (
            <p className="text-sm text-[#1A1815] mt-1 leading-relaxed" style={serif}>
              <span className="sr-only">King James Version. </span>“{conn.text.kjv}”
              <span className="text-[0.625rem] text-[#5A5751] ml-1 align-baseline" style={mono}>KJV</span>
            </p>
          ) : (
            <p className="text-xs text-[#5A5751] mt-1 italic" style={serif}>
              This reference isn’t in the in-app library yet —{' '}
              <a href={readOnline(conn.ref, 'ESV')} target="_blank" rel="noopener noreferrer" className="text-[#B85838] hover:text-[#1A1815] underline">read it online ↗</a>.
            </p>
          )}
          {saved && (
            <p className="text-[0.6875rem] text-[#5A6E3D] mt-1.5" style={serif}>
              {saved.added ? '✓ Saved into your Study (Cultural research room) — open Study to keep studying and create from it.' : '✓ Already in your Study — refreshed.'}
            </p>
          )}
        </div>

        {/* Themes it sits in */}
        {conn.themes.length > 0 && (
          <div>
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Themes</div>
            <div className="flex flex-wrap gap-1.5">
              {conn.themes.map((t, i) => (
                <span key={`${t.themeId}-${i}`} className="text-[0.625rem] bg-[#5A6E3D] text-white px-1.5 py-0.5">{t.themeTitle}</span>
              ))}
            </div>
          </div>
        )}

        {/* Cross-references — the navigable web */}
        <div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">
            Cross-references · {conn.counts.navigableCrossRefs} navigable of {conn.counts.crossRefs}
          </div>
          {conn.crossRefs.length ? (
            <div className="flex flex-wrap gap-1.5">
              {conn.crossRefs.map((c) => <CrossRefChip key={c.ref} cref={c} onOpen={open} />)}
            </div>
          ) : (
            <p className="text-xs text-[#5A5751] italic" style={serif}>No cross-references seeded for this reference yet.</p>
          )}
        </div>

        {/* Word study — Strong's (public domain) */}
        {conn.wordStudy.length > 0 && (
          <div>
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Word study — Strong’s (public domain)</div>
            <div className="space-y-1">
              {conn.wordStudy.map((w) => (
                <div key={w.strongs} className="bg-white border border-[#E8E4DC] p-2">
                  <p className="text-xs text-[#1A1815]">
                    <span className="font-semibold">{w.word}</span>
                    <span className="text-[#5A5751]"> — {w.original} </span>
                    <span style={mono} className="text-[0.625rem] text-[#5A6E3D]">{w.translit} · {w.strongs}</span>
                  </p>
                  <p className="text-xs text-[#5A5751]">{w.gloss}{w.note ? ` — ${w.note}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appearances — where this passage shows up in the church's real work */}
        {hasAppearances && (
          <div>
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">In the church’s work · {a.total}</div>
            <div className="space-y-1" style={serif}>
              {a.sermons.map((s) => (
                <p key={`s-${s.id}`} className="text-xs text-[#1A1815]"><span className="text-[#B85838] uppercase tracking-wider text-[0.5625rem]">The Word · </span>{s.title}{s.date ? ` (${s.date})` : ''}</p>
              ))}
              {a.lessons.map((l) => (
                <p key={`l-${l.id}`} className="text-xs text-[#1A1815]"><span className="text-[#B85838] uppercase tracking-wider text-[0.5625rem]">Lesson · </span>{l.title}</p>
              ))}
              {a.songs.map((g) => (
                <p key={`g-${g.id}`} className="text-xs text-[#1A1815]"><span className="text-[#B85838] uppercase tracking-wider text-[0.5625rem]">Song · </span>{g.title}</p>
              ))}
            </div>
          </div>
        )}

        {/* Provenance — sovereign, public-domain only */}
        <p className="text-[0.5625rem] text-[#5A5751] pt-2 border-t border-[#E8E4DC] leading-relaxed" style={mono}>
          {TSK_LICENSE.attribution} {STRONGS_LICENSE.work} — {STRONGS_LICENSE.license}.
        </p>
      </div>
    </div>
  );
}

export { ScriptureConnections };
