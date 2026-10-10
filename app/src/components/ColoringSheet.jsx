// =============================================================================
// ColoringSheet — the lesson, where a child can reach it
// =============================================================================
// Darrell, 2026-10-10: "Coloring books with words inside... that reflect the
// same lesson..."
//
// The library that derives the sheet shipped on 2026-10-10 with NO way to open
// one from the app, and DR-0865 parked that with a date. A sheet nobody can
// reach is not delivered (DR-0065 — the app is the primary artifact), so the
// date is not waited out (DR-0236).
//
// THE SHEET IS SHOWN, NOT JUST OFFERED. It renders inline, right under "Talk
// about it together", because that is the family block and this is the part of
// the lesson a child under nine can actually receive. A grown-up reads the
// lesson aloud; the child colors the same words.
//
// SCOPE SITS WITH SCOPE (P68 / DR-0688). The per-lesson sheet lives on the
// lesson. The whole-course BOOK is a course-level control and lives with the
// course's own Print and Download, never floating above one open lesson.
//
// NOTHING GOES BLANK (P15 / DR-0381). A sheet with no verse says so, rather
// than printing an empty band and leaving a parent wondering what broke.
//
// NO innerHTML. The SVG is built from `sheetLayout` as real React elements, so
// nothing about a lesson is ever interpreted as markup here. `coloringSvg` —
// the string form — is used only for the download and the print window, where
// every run is escaped by the library itself.
// =============================================================================
import React from 'react';
import { coloringPage, coloringSvg, sheetLayout, coloringBooklet, bookletCount, SHEET } from '../lib/coloring-page.js';
import DownloadNeedsAccount from './DownloadNeedsAccount.jsx';

/** The sheet as React elements — same layout as the printable string. */
export function SheetSvg({ page, className = '', title = '' }) {
  const lay = React.useMemo(() => (page ? sheetLayout(page) : null), [page]);
  if (!lay) return null;
  return (
    <svg
      viewBox={`0 0 ${SHEET.width} ${SHEET.height}`}
      className={className}
      role="img"
      aria-label={title || `${page.title} — a coloring page`}
      data-testid="coloring-sheet-svg"
    >
      <rect x="0" y="0" width={SHEET.width} height={SHEET.height} fill="#fff" />
      {lay.runs.map((r, i) => (
        <text
          key={`${r.role}-${i}`}
          x={r.x}
          y={Math.round(r.y)}
          textAnchor={r.anchor === 'middle' ? 'middle' : undefined}
          fontFamily="Georgia, serif"
          fontSize={r.size}
          fill={r.outline ? 'none' : '#000'}
          stroke={r.outline ? '#000' : undefined}
          strokeWidth={r.outline ? r.weight : undefined}
        >
          {r.text}
        </text>
      ))}
      {lay.symbols.map((s, i) => (
        <g
          key={`${s.id}-${i}`}
          transform={`translate(${s.x},${s.y}) scale(${s.scale})`}
          fill="none"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d={s.d} />
        </g>
      ))}
      <text x={SHEET.margin} y={lay.traceY} fontFamily="Georgia, serif" fontSize="20" fill="#000">Trace the words:</text>
      {page.words.map((w, i) => (
        <text
          key={w}
          x={SHEET.margin + (i % 5) * 130}
          y={lay.traceY + 34}
          fontFamily="Georgia, serif"
          fontSize="30"
          fill="none"
          stroke="#000"
          strokeWidth="1"
        >
          {w}
        </text>
      ))}
      <text x={SHEET.width / 2} y="990" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill="#000">
        Color it in while a grown-up reads the lesson to you.
      </text>
    </svg>
  );
}

/** A filename a parent can find again, derived from the lesson's own id. */
export function sheetFileName(page, ext = 'svg') {
  const stem = String((page && (page.lessonId || page.title)) || 'lesson')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `coloring-${stem || 'lesson'}.${ext}`;
}

/**
 * Print a document in its own window. Returns false when the browser refuses
 * to open one (a blocked popup on a phone is ordinary, not an error), so the
 * caller can fall back to a download rather than leaving the tap dead.
 */
export function printDocument(html, name) {
  try {
    const w = window.open('', '_blank');
    if (!w || !w.document) return false;
    w.document.open();
    w.document.write(html);
    w.document.close();
    try { w.document.title = name || 'Coloring page'; } catch (e) { /* ignore */ }
    try { w.focus(); w.print(); } catch (e) { /* the window is open; the reader can print it */ }
    return true;
  } catch (e) {
    return false;
  }
}

/** Save a file. Returns false if the browser will not let us. */
export function downloadText(text, name, type) {
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    return false;
  }
}

const BTN = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#B85838] text-[#B85838] '
  + 'hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

const NOTE = 'mt-1 text-[0.6875rem] text-[#5A5751]';
const SERIF = { fontFamily: '"Fraunces", serif' };

/**
 * The per-lesson control. Closed it is one line; opened it shows the real
 * sheet and offers to print or save it.
 */
export default function ColoringSheet({ module: mod, signedIn = true }) {
  const page = React.useMemo(() => coloringPage(mod), [mod]);
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState('');

  // A lesson with no title yields no sheet. Say so where the block would have
  // been, rather than leaving a silent hole a parent cannot ask about.
  if (!page) {
    return (
      <div className="mt-2 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2" data-testid="lesson-coloring-sheet" data-empty="true">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">For the littlest</div>
        <p className={NOTE} style={SERIF}>
          This lesson has no coloring page yet, because it carries no title to put on one.
        </p>
      </div>
    );
  }

  const onPrint = () => {
    const html = coloringBooklet([mod], { title: page.title });
    if (printDocument(html, page.title)) { setNote(''); return; }
    const saved = downloadText(coloringSvg(page), sheetFileName(page), 'image/svg+xml;charset=utf-8');
    setNote(saved
      ? `Your browser blocked the print window, so it saved ${sheetFileName(page)} instead.`
      : 'This browser would not print or save the sheet. Try Save it, or open the lesson on another device.');
  };

  const onSave = () => {
    const ok = downloadText(coloringSvg(page), sheetFileName(page), 'image/svg+xml;charset=utf-8');
    setNote(ok ? `Saved ${sheetFileName(page)}.` : 'This browser would not save the sheet. Try Print it instead.');
  };

  return (
    <div
      className="mt-2 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2"
      data-testid="lesson-coloring-sheet"
      data-lesson={page.lessonId}
      data-has-verse={page.verse ? 'true' : 'false'}
    >
      <div className="ts-chrome-region flex items-center justify-between gap-2">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">For the littlest</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={BTN}
          aria-expanded={open}
          data-testid="coloring-sheet-toggle"
        >
          {open ? 'Hide the coloring page' : 'Color this lesson'}
        </button>
      </div>
      <p className={NOTE} style={SERIF}>
        The same lesson, for a child too young to read it — this lesson’s own words to color and trace while a
        grown-up reads it aloud.
      </p>
      {page.verse ? null : (
        <p className={NOTE} style={SERIF} data-testid="coloring-sheet-no-verse">
          This lesson does not quote a verse, so its page carries the words and the shapes without one. Nothing is
          invented to fill the space.
        </p>
      )}
      {open ? (
        <div className="mt-2" data-testid="coloring-sheet-open">
          <SheetSvg page={page} className="w-full max-w-[420px] border border-[#1A1815]/20 bg-white" />
          {/* Looking at the sheet is READING and stays open to everyone;
              taking it away is a download and asks for a free account, the
              same line the rest of the app draws (DR-0698). */}
          {signedIn ? (
            <div className="ts-chrome-region mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={onPrint} className={BTN} data-testid="coloring-sheet-print">Print it</button>
              <button type="button" onClick={onSave} className={BTN} data-testid="coloring-sheet-save">Save it</button>
            </div>
          ) : (
            <div className="ts-chrome-region mt-2"><DownloadNeedsAccount label="Print or save the coloring page" /></div>
          )}
          {note ? <p className={NOTE} role="status" data-testid="coloring-sheet-note" style={SERIF}>{note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The whole book — every lesson in the COURSE, one sheet a page.
 *
 * "Coloring BOOKS", he said, not pages. This is the other half, and it is a
 * course-scope control: it belongs beside the course's own Print and Download,
 * not above whichever lesson happens to be open (P68 / DR-0688).
 */
export function ColoringBookButton({ modules, title = 'Coloring Book', className = '' }) {
  const count = React.useMemo(() => bookletCount(modules), [modules]);
  const [note, setNote] = React.useState('');

  const onPrint = () => {
    const html = coloringBooklet(modules, { title });
    if (printDocument(html, title)) { setNote(''); return; }
    const name = `coloring-book-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.html`;
    const saved = downloadText(html, name, 'text/html;charset=utf-8');
    setNote(saved
      ? `Your browser blocked the print window, so it saved ${name} instead.`
      : 'This browser would not print or save the book.');
  };

  // Never a dead control and never a silent gap: when there is nothing to
  // print, the surface says why instead of disappearing (P15 / DR-0381).
  if (!count) {
    return (
      <span className={className} data-testid="coloring-book-none">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">No coloring pages here yet</span>
      </span>
    );
  }

  return (
    <span className={className}>
      <button type="button" onClick={onPrint} className={BTN} data-testid="coloring-book-print" data-sheets={count}>
        {`Coloring book (${count})`}
      </button>
      {note ? <span className="ml-2 text-[0.6875rem] text-[#5A5751]" role="status" data-testid="coloring-book-note">{note}</span> : null}
    </span>
  );
}
