// =============================================================================
// BibleReader — the whole KJV, read INSIDE PoeTech (Darrell 2026-07-04: "build a
// Logos type of Bible inside the PoeTech App so we can not need to link out to
// biblegateway"). Book -> chapter -> verses, every verse VERBATIM public-domain
// KJV served same-origin (sovereign, offline once cached). The per-verse
// highlighter (scripture-highlights) works here too — color the Word as you read.
// =============================================================================
// Accessibility mirrors the Scripture surfaces: white cards, #1A1815 body,
// #5A5751 secondary, visible #B85838 focus outline (AA). Rem sizes; no device
// emoji. The heavy book text lazy-loads (bible-kjv.loadBook); the picker uses the
// tiny bundled index, so navigation is instant and only the opened book fetches.
import React, { useState, useEffect, useMemo } from 'react';
import {
  OLD_TESTAMENT, NEW_TESTAMENT, chapterVerses, chapterCount, parseRef, parseLoose, searchBooks,
} from '../lib/bible-kjv.js';
import VerseHighlighter from './VerseHighlighter.jsx';
import {
  loadHighlights, saveHighlights, getMark, setMark, cssForHighlight,
  getSpans, addSpan, clearSpans, segmentsForVerse, HIGHLIGHT_GROUPS,
} from '../lib/scripture-highlights.js';
import { crossRefsFor, XREF_SOURCE } from '../lib/bible-xref.js';
import { THEMES, themeMarkerStyle } from '../lib/scripture-themes.js';
import { scanThemeSpans, themesPresent } from '../lib/scripture-theme-scan.js';
import { VOICES, cssForVoice, voiceSpansFor, voicesPresent } from '../lib/scripture-voices.js';
import { castScript } from '../lib/scripture-voice-cast.js';
import { useCastRead } from '../lib/use-cast-read.js';
import { momentsForChapter, personOf } from '../lib/scripture-godhead-moments.js';
import { useReadAloud } from '../lib/use-read-aloud.js';

// The character offsets [start,end) of the current text selection WITHIN a verse
// container (its textContent), or null. Uses a Range measured from the container
// start, so it is correct even when the verse is already split into highlighted
// segments (concatenated text === the verse text).
function selectionSpanIn(containerEl) {
  try {
    const sel = (typeof window !== 'undefined') && window.getSelection && window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!containerEl.contains(range.startContainer) || !containerEl.contains(range.endContainer)) return null;
    const pre = range.cloneRange();
    pre.selectNodeContents(containerEl);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const selected = range.toString();
    if (!selected.trim()) return null;
    return { start, end: start + selected.length, text: selected };
  } catch { return null; }
}

// The per-verse "study" panel — Copy the verse, and the UNIONS: its cross-
// references across both testaments (Darrell 2026-07-04: "I love how the unions
// connect the old and new testament"). Cross-refs lazy-load when opened.
function VerseUnions({ refStr, text, onOpenRef }) {
  const [xrefs, setXrefs] = useState(null); // null = loading, [] = none
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let on = true;
    crossRefsFor(refStr).then((x) => { if (on) setXrefs(x); });
    return () => { on = false; };
  }, [refStr]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`“${text}” — ${refStr} (KJV)`); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard blocked; no-op */ }
  };
  return (
    <div className="ml-8 mb-2 border-l-2 border-[#5A6E3D] pl-3 pr-1 py-1.5 bg-[#FAF8F4]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={mono}>{refStr}</span>
        <button type="button" onClick={copy}
          className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {xrefs === null ? (
        <p className="text-[0.75rem] text-[#5A5751]" style={serif}>Finding the unions…</p>
      ) : xrefs.length === 0 ? (
        <p className="text-[0.75rem] text-[#5A5751]" style={serif}>No cross-references indexed for this verse.</p>
      ) : (
        <>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">The unions — cross-references (OT ↔ NT)</div>
          <div className="flex flex-wrap gap-1.5">
            {xrefs.slice(0, 24).map((x) => (
              <button key={x.ref} type="button" onClick={() => onOpenRef(x.ref)}
                title={`Go to ${x.ref}`}
                className="text-[0.6875rem] px-1.5 py-0.5 border border-[#E8E4DC] bg-white text-[#5A6E3D] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif}>
                {x.ref}
              </button>
            ))}
          </div>
          <p className="text-[0.5625rem] text-[#5A5751] mt-1.5">{XREF_SOURCE.name} · {XREF_SOURCE.license}</p>
        </>
      )}
    </div>
  );
}

const serif = { fontFamily: 'Georgia, "Times New Roman", serif' };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

// Resolve a rendered segment's style key to css. A key is either a highlight/theme
// key (cssForHighlight) or a voice key (cssForVoice); the namespaces don't overlap,
// so try highlight first and fall through to voice. 'none' resolves to {} (plain).
function segCss(style) {
  const hi = cssForHighlight(style);
  return Object.keys(hi).length ? hi : cssForVoice(style);
}

// Theme-chip marker css: the abbr marker always sits on a PARCHMENT PLATE when
// its palette style carries no background of its own, so it reads "as it looks
// on the page" on ANY surface. Root cause (Darrell's 2026-07-23 screenshot,
// REV: dark Church theme): ink-only styles like Box/#1A1815 (Judgment) and
// Struck/#4A4640 (Sin) are reader inks for parchment — rendered raw on the
// dark theme the Jdg chip was invisible and Sin nearly so. The plate fixes
// every ink-only marker in both themes; styles with their own background
// (Grace/Love/Spirit/…) keep it.
function markerChipCss(styleKey) {
  const css = cssForHighlight(styleKey);
  if (css.color && !css.backgroundColor) return { ...css, backgroundColor: '#FAF8F4' };
  return css;
}

// The Godhead together — where the Father, the Son (the Word / the Light), and the
// Holy Spirit are shown working as One in this chapter (Darrell 2026-07-04: "we
// should be able to see when the GodHead is working together... in the beginning
// Let there be Light... Jesus is the Light of the World, the Spirit and the Father
// right from the beginning verses"). Each Person wears the voices color (the Son in
// red — the Blood); every union reference opens verbatim in the reader. Taught, not
// debated (DR-0098); anchors verified (scripture-godhead-moments).
function GodheadTogether({ moments, onOpenRef }) {
  const [open, setOpen] = useState(true);
  if (!moments || !moments.length) return null;
  return (
    <div className="mb-3 border border-[#5A6E3D] bg-[#FAF8F4]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#F2F4EC] focus:outline focus:outline-2 focus:outline-[#B85838]">
        <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">The Godhead together — the Father, the Son &amp; the Spirit, at work</span>
        <span className="text-sm text-[#5A5751] leading-none" style={mono}>{open ? '−' : '+'}</span>
      </button>
      {open && moments.map((m) => (
        <div key={m.id} className="px-3 pb-3">
          <p className="text-[0.8125rem] text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{m.title}</p>
          <p className="text-[0.75rem] text-[#5A5751] mb-2 leading-relaxed" style={serif}>{m.lead}</p>
          <div className="space-y-2">
            {m.roles.map((r, i) => {
              const p = personOf(r.person);
              const color = cssForVoice(p ? p.voice : '').color || '#5A6E3D';
              return (
                <div key={`${m.id}-${i}`} className="pl-2 border-l-2" style={{ borderColor: color }}>
                  <p className="text-[0.75rem]" style={serif}>
                    <span style={cssForVoice(p ? p.voice : '')} className="font-semibold">{p ? p.label : r.person}</span>
                    <span className="text-[#5A5751]"> — {r.role}</span>
                  </p>
                  <p className="text-[0.75rem] text-[#1A1815] leading-relaxed" style={serif}>{r.note}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.refs.map((ref) => (
                      <button key={ref} type="button" onClick={() => onOpenRef(ref)} title={`Open ${ref}`}
                        className="text-[0.625rem] px-1.5 py-0.5 border border-[#E8E4DC] bg-white text-[#5A6E3D] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif}>{ref}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[0.5625rem] text-[#5A5751] mt-2" style={serif}>The Word explains the Word — taught, not debated. Every reference verified against the KJV.</p>
        </div>
      ))}
    </div>
  );
}

// Study by theme — the Inductive / Precept THEMATIC MARKERS (Darrell 2026-07-04,
// from his Logos "Inductive / Precept" screenshots). Each theme runs through the
// whole Word in one consistent marker color (scripture-themes); tap a theme to
// see its meaning, then a reference to open that verse VERBATIM in the reader.
// Collapsed by default so it never crowds the read. `onOpenRef` navigates.
function ThemesIndex({ onOpenRef }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const theme = active ? THEMES.find((t) => t.key === active) : null;
  return (
    <div className="mb-3 border border-[#E8E4DC]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
        <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">Study by theme — the markers that run through the whole Word</span>
        <span className="text-sm text-[#5A5751] leading-none" style={mono}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={serif}>
            Inductive marking: each theme wears one color everywhere it appears. Tap a theme for what it means, then a reference to open it here — verbatim, in the Word.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {THEMES.map((t) => {
              const on = active === t.key;
              return (
                <button key={t.key} type="button" onClick={() => setActive(on ? null : t.key)} aria-pressed={on}
                  aria-label={`${t.label} — ${t.definition}`} title={t.definition}
                  className={`inline-flex items-center gap-1 px-2 py-1 border text-[0.6875rem] focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] hover:border-[#1A1815]'}`} style={serif}>
                  <span aria-hidden="true" className="inline-flex items-center justify-center px-1 text-[0.5625rem] font-semibold" style={markerChipCss(themeMarkerStyle(t.key))}>{t.abbr}</span>
                  <span className="text-[#1A1815]">{t.label}</span>
                </button>
              );
            })}
          </div>
          {theme && (
            <div className="border-l-2 border-[#5A6E3D] pl-3 py-1">
              <p className="text-[0.8125rem] text-[#1A1815] mb-1.5" style={serif}>{theme.definition}</p>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Anchors — tap to open</div>
              <div className="flex flex-wrap gap-1.5">
                {theme.anchors.map((r) => (
                  <button key={r} type="button" onClick={() => onOpenRef(r)} title={`Open ${r}`}
                    className="text-[0.6875rem] px-1.5 py-0.5 border border-[#E8E4DC] bg-white text-[#5A6E3D] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif}>{r}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BibleReader({ email = null }) {
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [jumpError, setJumpError] = useState('');
  const [focusVerse, setFocusVerse] = useState(null);
  const [openVerse, setOpenVerse] = useState(null); // verse whose unions panel is open
  const [marks, setMarks] = useState(() => loadHighlights(email));
  // One-click "Highlighted Bible" (Darrell 2026-07-04). Two color codes the reader
  // LEARNS over time, each a VIEW computed on the fly (never touches saved marks):
  //   'themes' — every verse auto-colors by the theme key/color code (patterns).
  //   'voices' — the red-letter code: who is SPEAKING (Jesus red, the tempter cold,
  //     the Father gold…) so the eye comes to know the voice by its color.
  // 'off' reads plain. The mode stays on as you read chapter to chapter.
  const [autoMode, setAutoMode] = useState('off'); // 'off' | 'themes' | 'voices'
  // Dramatized reading: play the chapter with each speaker in their own voice
  // (Darrell 2026-07-04). Cast from the same verified attribution that colors it.
  const cast = useCastRead();
  // Plain read-aloud: hear the whole chapter in your chosen voice (Darrell 2026-07-04:
  // "No play button for the reader?"). Uses the one global voice preference.
  const reader = useReadAloud();

  const chapters = chapterCount(book);

  // A live legend of what the current view is showing on THIS chapter's real text
  // (P15). Themes are scanned from the words; voices are the verified speakers of
  // the verses on screen.
  const chapterThemes = useMemo(
    () => (autoMode === 'themes' ? themesPresent(verses.map((x) => x.text).join(' ')) : []),
    [autoMode, verses],
  );
  const chapterVoices = useMemo(
    () => (autoMode === 'voices' ? voicesPresent(verses.map((x) => `${book} ${chapter}:${x.v}`)) : []),
    [autoMode, verses, book, chapter],
  );
  // The whole chapter as one utterance for the plain read-aloud.
  const chapterText = useMemo(() => verses.map((x) => x.text).join(' '), [verses]);
  // Where the Godhead is shown working together in THIS chapter (Darrell 2026-07-04).
  const godheadMoments = useMemo(() => momentsForChapter(book, chapter), [book, chapter]);

  useEffect(() => {
    let on = true;
    setLoading(true);
    chapterVerses(book, chapter).then((vs) => {
      if (!on) return;
      setVerses(vs);
      setLoading(false);
    });
    return () => { on = false; };
  }, [book, chapter]);

  const openAt = (bk, ch, v = null) => {
    setBook(bk);
    setChapter(ch);
    setFocusVerse(v);
    setPickerOpen(false);
  };

  // Type-ahead: what's typed lists matching books (Darrell 2026-07-04: "a J
  // should list all J books"); a trailing chapter/verse is respected on select.
  const matches = useMemo(() => searchBooks(query).slice(0, 12), [query]);
  const tail = useMemo(() => {
    const m = query.trim().match(/\s+(\d+)(?::(\d+))?$/);
    return m ? { chapter: +m[1], verse: m[2] ? +m[2] : null } : null;
  }, [query]);

  const openBook = (b) => {
    const ch = tail ? Math.min(Math.max(1, tail.chapter), chapterCount(b.name)) : 1;
    setQuery('');
    setJumpError('');
    openAt(b.name, ch, tail ? tail.verse : null);
  };

  // Jump to a cross-reference (the union chip) — parse it and open there.
  const goToRef = (r) => {
    const p = parseRef(r);
    if (p) { setOpenVerse(null); openAt(p.book, p.chapter, p.v1); }
  };

  const jump = () => {
    const q = query.trim();
    const p = parseRef(q);            // full verse, e.g. "John 3:16"
    if (p) { setQuery(''); setJumpError(''); openAt(p.book, p.chapter, p.v1); return; }
    const loose = parseLoose(q);      // "John", "John 3", "1 John 2"
    if (loose) { setQuery(''); setJumpError(''); openAt(loose.book, loose.chapter, loose.verse); return; }
    const ms = searchBooks(q);        // fall back to the first matching book
    if (ms.length) { openBook(ms[0]); return; }
    setJumpError('Not a book or reference I can find — try a book name, or "John 3:16".');
  };

  const pick = (ref, key) => {
    const next = setMark(loadHighlights(email), ref, key);
    saveHighlights(email, next);
    setMarks(next);
  };

  // Word / phrase highlighting: capture a text selection within a verse, then
  // color just that span (Darrell 2026-07-04: "I can't highlight a word inside
  // of a scripture only the whole verse").
  const [pendingSel, setPendingSel] = useState(null); // { ref, start, end, text }
  const onSelect = (ref, el) => {
    const sp = selectionSpanIn(el);
    if (sp) setPendingSel({ ref, ...sp });
  };
  const applySpan = (style) => {
    if (!pendingSel) return;
    const next = addSpan(loadHighlights(email), pendingSel.ref, pendingSel.start, pendingSel.end, style);
    saveHighlights(email, next);
    setMarks(next);
    setPendingSel(null);
    try { window.getSelection().removeAllRanges(); } catch { /* noop */ }
  };
  const eraseSpan = () => {
    if (!pendingSel) return;
    const next = clearSpans(loadHighlights(email), pendingSel.ref, pendingSel.start, pendingSel.end);
    saveHighlights(email, next);
    setMarks(next);
    setPendingSel(null);
    try { window.getSelection().removeAllRanges(); } catch { /* noop */ }
  };

  const BookButton = ({ b }) => (
    <button type="button" onClick={() => openAt(b.name, 1)}
      className={`text-[0.6875rem] px-2 py-1 border text-left focus:outline focus:outline-2 focus:outline-[#B85838] ${b.name === book ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815] hover:border-[#1A1815]'}`}
      style={serif}>
      {b.name}
    </button>
  );

  return (
    <div>
      <div className="bg-[#1A1815] text-[#FAF8F4] p-3 mb-3">
        <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-[#B89838] mb-1">The Word · King James Version</p>
        <p className="text-sm leading-relaxed" style={serif}>
          The whole Bible, hosted inside PoeTech — verbatim public-domain KJV, served from here, no link-out. Read it, and mark it in your own colors; your highlights are private to your sign-in and follow you across devices.
        </p>
      </div>

      {/* Jump to a reference. */}
      <div className="flex gap-2 items-start mb-3 flex-wrap">
        <div className="flex-1 min-w-[12rem]">
          <label htmlFor="bible-jump" className="sr-only">Go to a reference</label>
          <div className="flex gap-1.5">
            <input id="bible-jump" type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); setJumpError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') jump(); }}
              placeholder="Type a book — e.g. J, John, or John 3:16"
              autoComplete="off"
              className="flex-1 text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif} />
            <button type="button" onClick={jump}
              className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Go</button>
          </div>
          {/* Type-ahead book list — filtered by what you type (the initial letter
              lists every book with that letter). */}
          {query.trim() && matches.length > 0 && (
            <ul className="mt-1 border border-[#E8E4DC] bg-white max-h-56 overflow-y-auto divide-y divide-[#F2EFE9]" aria-label="Matching books">
              {matches.map((b) => (
                <li key={b.file}>
                  <button type="button" onClick={() => openBook(b)}
                    className="w-full text-left px-2 py-1.5 text-sm text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif}>
                    {b.name}
                    {tail && <span className="text-[0.6875rem] text-[#5A6E3D] ml-1" style={mono}>{tail.chapter}{tail.verse ? `:${tail.verse}` : ''}</span>}
                    <span className="text-[0.625rem] text-[#5A5751] ml-1">· {b.chapters.length} ch</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {jumpError && <p className="text-[0.6875rem] text-[#B85838] mt-1" style={serif}>{jumpError}</p>}
        </div>
        <button type="button" onClick={() => setPickerOpen((v) => !v)} aria-expanded={pickerOpen}
          className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
          {pickerOpen ? 'Close books' : 'All 66 books'}
        </button>
      </div>

      {/* Book picker (OT / NT), from the bundled index — instant. */}
      {pickerOpen && (
        <div className="mb-3 border border-[#E8E4DC] p-2">
          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1.5">Old Testament</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-3">{OLD_TESTAMENT.map((b) => <BookButton key={b.file} b={b} />)}</div>
          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1.5">New Testament</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">{NEW_TESTAMENT.map((b) => <BookButton key={b.file} b={b} />)}</div>
        </div>
      )}

      {/* Study by theme — the inductive markers across the whole Word. */}
      <ThemesIndex onOpenRef={goToRef} />

      {/* Current book + chapter nav. */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h3 className="text-xl text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{book} {chapter}</h3>
        <div className="flex items-center gap-1.5">
          {/* Read the whole chapter aloud in your chosen voice (Darrell 2026-07-04:
              "No play button for the reader?"). */}
          <button type="button" disabled={!reader.supported || !chapterText}
            onClick={() => (reader.isReading ? reader.stop() : reader.read(chapterText))}
            title={reader.supported ? 'Read this chapter aloud in your voice' : 'This device can’t read aloud'}
            aria-label={reader.isReading ? 'Stop reading' : 'Play — read this chapter aloud'}
            className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838] ${reader.isReading ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4]'}`}>
            {reader.isReading ? 'Stop' : '▶ Play'}
          </button>
          <button type="button" disabled={chapter <= 1} onClick={() => openAt(book, chapter - 1)}
            className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] disabled:opacity-40 hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">‹ Prev</button>
          <span className="text-[0.6875rem] text-[#5A5751]" style={mono}>ch {chapter} / {chapters}</span>
          <button type="button" disabled={chapter >= chapters} onClick={() => openAt(book, chapter + 1)}
            className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] disabled:opacity-40 hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Next ›</button>
        </div>
      </div>

      {/* Chapter number grid. */}
      <div className="flex flex-wrap gap-1 mb-3">
        {Array.from({ length: chapters }, (_, i) => i + 1).map((c) => (
          <button key={c} type="button" onClick={() => openAt(book, c)} aria-current={c === chapter}
            className={`text-[0.625rem] w-7 h-7 border focus:outline focus:outline-2 focus:outline-[#B85838] ${c === chapter ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815] hover:border-[#1A1815]'}`} style={mono}>
            {c}
          </button>
        ))}
      </div>

      {/* Selection palette — color the highlighted word/phrase. */}
      {pendingSel && (
        <div className="sticky top-0 z-20 bg-white border border-[#B85838] p-2 mb-2 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[0.6875rem] text-[#5A5751] truncate" style={serif}>
              Color “{pendingSel.text.length > 34 ? `${pendingSel.text.slice(0, 34)}…` : pendingSel.text}” in {pendingSel.ref}
            </span>
            <button type="button" onClick={() => setPendingSel(null)}
              className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
          </div>
          {/* Grouped like Logos: colored text · highlighter · emphasis. Each
              chip previews its own look on a sample so the pick is obvious. */}
          <div className="space-y-1.5">
            {HIGHLIGHT_GROUPS.map((g) => (
              <div key={g.kind} className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] w-[4.5rem] shrink-0" title={g.hint}>{g.label}</span>
                {g.styles.map((s) => (
                  <button key={s.key} type="button" onClick={() => applySpan(s.key)}
                    title={`${s.label} — ${s.meaning}`} aria-label={`Highlight selection: ${s.label} (${s.meaning})`}
                    className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded border border-[#E8E4DC] bg-white hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
                    <span aria-hidden="true" className="text-[0.8125rem] leading-none" style={{ ...cssForHighlight(s.key), ...serif }}>Aa</span>
                  </button>
                ))}
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] w-[4.5rem] shrink-0">Erase</span>
              <button type="button" onClick={eraseSpan} aria-label="Clear highlight on the selection"
                className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded border border-[#C9BFA8] text-[#5A5751] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" style={mono}>&times;</button>
            </div>
          </div>
        </div>
      )}

      {/* One-click "Highlighted Bible" — two color codes the reader learns over
          time: PATTERNS (by theme) and VOICES (red-letter, who is speaking). */}
      <div className="mb-2">
        <div className="inline-flex items-center gap-0 border border-[#5A6E3D]" role="group" aria-label="Highlighted Bible mode">
          {[
            { id: 'off', label: 'Plain' },
            { id: 'themes', label: 'Yahweh’s patterns' },
            { id: 'voices', label: 'The voices (red-letter)' },
          ].map((m) => (
            <button key={m.id} type="button" onClick={() => setAutoMode(m.id)} aria-pressed={autoMode === m.id}
              className={`text-[0.625rem] uppercase tracking-wider px-3 py-1.5 focus:outline focus:outline-2 focus:outline-[#B85838] ${autoMode === m.id ? 'bg-[#5A6E3D] text-white' : 'bg-white text-[#5A6E3D] hover:bg-[#FAF8F4]'}`}>
              {m.label}
            </button>
          ))}
        </div>
        {autoMode === 'themes' && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">In this chapter:</span>
            {chapterThemes.length === 0 ? (
              <span className="text-[0.6875rem] text-[#5A5751]" style={serif}>no theme words here — the pattern is the quiet.</span>
            ) : chapterThemes.map((k) => {
              const t = THEMES.find((x) => x.key === k);
              return (
                <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-[#E8E4DC]" title={t.definition}>
                  <span aria-hidden="true" className="inline-flex items-center justify-center px-1 text-[0.5625rem] font-semibold" style={markerChipCss(themeMarkerStyle(k))}>{t.abbr}</span>
                  <span className="text-[0.625rem] text-[#1A1815]" style={serif}>{t.label}</span>
                </span>
              );
            })}
          </div>
        )}
        {autoMode === 'voices' && (
          <div className="mt-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Voices here:</span>
              {chapterVoices.length === 0 ? (
                <span className="text-[0.6875rem] text-[#5A5751]" style={serif}>no voices verified in this chapter yet — only the narration.</span>
              ) : chapterVoices.map((k) => {
                const vc = VOICES.find((x) => x.key === k);
                return (
                  <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-[#E8E4DC]" title={vc.meaning}>
                    <span aria-hidden="true" className="text-[0.6875rem] leading-none" style={cssForVoice(k)}>Aa</span>
                    <span className="text-[0.625rem] text-[#1A1815]" style={serif}>{vc.label}</span>
                  </span>
                );
              })}
            </div>
            <p className="text-[0.5625rem] text-[#5A5751] mt-1" style={serif}>Red-letter: Jesus in red (the Blood), the tempter cold. Only verified speakers are colored — the set grows verse by verse; the rest reads plain.</p>
            {/* Dramatized read — hear each speaker in their own voice. */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <button type="button" disabled={!cast.supported}
                onClick={() => (cast.playing ? cast.stop() : cast.play(castScript(verses, (vv) => `${book} ${chapter}:${vv}`)))}
                className={`text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40 ${cast.playing ? 'bg-[#B85838] text-white border-[#B85838]' : 'bg-white text-[#B85838] border-[#B85838] hover:bg-[#FAF8F4]'}`}>
                {cast.playing ? 'Stop the reading' : 'Play the voices — dramatized read'}
              </button>
              {!cast.supported && <span className="text-[0.5625rem] text-[#5A5751]" style={serif}>This device can’t read aloud.</span>}
            </div>
          </div>
        )}
      </div>

      {/* The Godhead together — the Trinity at work in this chapter. */}
      <GodheadTogether moments={godheadMoments} onOpenRef={goToRef} />

      {/* The verses. */}
      {loading ? (
        <p className="text-sm text-[#5A5751]" style={serif}>Opening {book} {chapter}…</p>
      ) : verses.length === 0 ? (
        <p className="text-sm text-[#5A5751]" style={serif}>Could not load {book} {chapter}. Check your connection and try again.</p>
      ) : (
        <div className="space-y-1">
          {verses.map(({ v, text }) => {
            const ref = `${book} ${chapter}:${v}`;
            const mark = getMark(marks, ref);
            const open = openVerse === v;
            // The auto color code for this view: theme words, or the verified
            // speaker (voices), UNDER the reader's own spans (which win on overlap).
            const autoSpans = autoMode === 'themes' ? scanThemeSpans(text)
              : autoMode === 'voices' ? voiceSpansFor(ref, text) : [];
            const spans = autoSpans.length ? [...autoSpans, ...getSpans(marks, ref)] : getSpans(marks, ref);
            return (
              <React.Fragment key={v}>
                <div id={`v-${v}`}
                  className={`flex items-start gap-2 py-0.5 ${focusVerse === v ? 'bg-[#F2F4EC]' : ''}`}>
                  {/* Tap the verse number for its study panel: Copy + the unions. */}
                  <button type="button" onClick={() => setOpenVerse(open ? null : v)} aria-expanded={open}
                    title={`${ref} — cross-references & copy`}
                    className="text-[0.625rem] text-[#5A6E3D] font-semibold mt-1 w-6 shrink-0 text-right hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]" style={mono}>{v}</button>
                  <p className="text-sm text-[#1A1815] leading-relaxed flex-1" style={serif}
                    onMouseUp={(e) => onSelect(ref, e.currentTarget)} onTouchEnd={(e) => onSelect(ref, e.currentTarget)}>
                    {/* Auto spans (theme or voice) render UNDER the reader's own
                        spans — a personal highlight always wins on overlap. */}
                    <span style={cssForHighlight(mark)}>
                      {segmentsForVerse(text, spans).map((seg, i) => (
                        seg.style === 'none'
                          ? <React.Fragment key={i}>{seg.text}</React.Fragment>
                          : <span key={i} style={segCss(seg.style)}>{seg.text}</span>
                      ))}
                    </span>
                  </p>
                  <VerseHighlighter value={mark} onPick={(k) => pick(ref, k)} refLabel={ref} />
                </div>
                {open && <VerseUnions refStr={ref} text={text} onOpenRef={goToRef} />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
