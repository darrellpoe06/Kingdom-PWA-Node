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
import { loadHighlights, saveHighlights, getMark, setMark, cssForHighlight } from '../lib/scripture-highlights.js';

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
            return (
              <div key={v} id={`v-${v}`}
                className={`flex items-start gap-2 py-0.5 ${focusVerse === v ? 'bg-[#F2F4EC]' : ''}`}>
                <span className="text-[0.625rem] text-[#5A6E3D] font-semibold mt-1 w-6 shrink-0 text-right" style={mono}>{v}</span>
                <p className="text-sm text-[#1A1815] leading-relaxed flex-1" style={serif}>
                  <span style={cssForHighlight(mark)}>{text}</span>
                </p>
                <VerseHighlighter value={mark} onPick={(k) => pick(ref, k)} refLabel={ref} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
