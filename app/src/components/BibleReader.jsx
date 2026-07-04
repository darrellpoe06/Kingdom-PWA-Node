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
  getSpans, addSpan, clearSpans, segmentsForVerse, HIGHLIGHT_STYLES,
} from '../lib/scripture-highlights.js';
import { crossRefsFor, XREF_SOURCE } from '../lib/bible-xref.js';

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

  const chapters = chapterCount(book);

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

      {/* Current book + chapter nav. */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h3 className="text-xl text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{book} {chapter}</h3>
        <div className="flex items-center gap-1.5">
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
          <div className="flex flex-wrap items-center gap-1.5">
            {HIGHLIGHT_STYLES.map((s) => (
              <button key={s.key} type="button" onClick={() => applySpan(s.key)} title={`${s.label} — ${s.meaning}`} aria-label={`Highlight selection ${s.label}`}
                className="w-6 h-6 rounded-full border-2 focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ backgroundColor: s.swatch, borderColor: s.swatch }} />
            ))}
            <button type="button" onClick={eraseSpan} aria-label="Clear highlight on the selection"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#C9BFA8] text-[#5A5751] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" style={mono}>&times;</button>
          </div>
        </div>
      )}

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
                    <span style={cssForHighlight(mark)}>
                      {segmentsForVerse(text, getSpans(marks, ref)).map((seg, i) => (
                        seg.style === 'none'
                          ? <React.Fragment key={i}>{seg.text}</React.Fragment>
                          : <span key={i} style={cssForHighlight(seg.style)}>{seg.text}</span>
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
