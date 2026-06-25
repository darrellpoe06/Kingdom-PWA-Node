// =============================================================================
// Library — the books<->app flywheel surface
// =============================================================================
// "produce books that are supported by the PoeTech app in some way or ways, to
//  keep interactions and interest, market the business, and have the learning
//  content feed the development of the app and the skills of the community and
//  the PoeTech app." (Darrell, 2026-06-25.)
//
// Three faculties, one surface:
//   SHELF   — the in-app reader + a sovereign (device-local) bookshelf.
//   STUDIO  — assemble a real book FROM the existing corpus (Learn courses, the
//             Eternal Algorithms library, the Scripture library, sermons when
//             loaded). Nothing is re-fetched; nothing is fabricated. Download as
//             a real .epub / printable .html / .md, or save it to the shelf.
//   READER  — read a book with COMPANION deep-links that jump straight into the
//             live app (the lesson, the Word, Scripture, the presenter, a
//             discussion) — the thing a static file cannot do.
//
// Integrity is shown, not claimed: every assembled book carries the engine's
// integrity report (sourced, no fabrication, Scripture verbatim KJV), and
// publishing is gated behind an explicit approval (default-deny).
//
// SOVEREIGN / dependency-free: assembly + all three export formats are pure and
// offline (see lib/book-engine, lib/book-formats, lib/book-corpus). The shelf is
// device-local like Study + the Eternal Algorithms library — never extracted.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { triggerDownload, exportFilename } from '../lib/creation-workspace.js';
import { bookStats } from '../lib/book-engine.js';
import { toMarkdown, bookToReaderHtml, bookToEpubBytes } from '../lib/book-formats.js';
import { flywheel } from '../lib/book-flywheel.js';
import {
  availableRecipes, buildRecipe, loadShelf, saveShelf, upsertBook, removeBook,
} from '../lib/book-corpus.js';
import { loadLibrary } from '../lib/eternal-algorithms.js';

const PALETTE = {
  ink: '#1A1815', muted: '#5A5751', accent: '#B85838', line: '#E0DBD0', panel: '#FAF8F4',
};

function Badge({ tone = 'ok', children }) {
  const styles = tone === 'ok'
    ? { bg: '#EAF3EC', fg: '#216E39', bd: '#B7D7BF' }
    : { bg: '#FBF0E6', fg: '#8A4B1F', bd: '#E7C9AC' };
  return (
    <span className="inline-block text-[11px] px-2 py-0.5 rounded-sm border" style={{ background: styles.bg, color: styles.fg, borderColor: styles.bd }}>
      {children}
    </span>
  );
}

function IntegrityPanel({ book }) {
  const ok = book?.integrity?.ok;
  return (
    <div className="border bg-white p-3" style={{ borderColor: PALETTE.line }}>
      <div className="flex items-center gap-2 mb-1">
        {ok ? <Badge tone="ok">Verified</Badge> : <Badge tone="warn">Review needed</Badge>}
        <span className="text-xs" style={{ color: PALETTE.muted }}>
          {ok ? 'Sourced · no fabrication · Scripture verbatim (KJV)' : 'This book is honest about its gaps before it ships.'}
        </span>
      </div>
      {!ok && (
        <ul className="text-xs mt-1 list-disc pl-5" style={{ color: PALETTE.ink }}>
          {(book.integrity.issues || []).map((i, n) => <li key={n}>{i}</li>)}
        </ul>
      )}
    </div>
  );
}

function FlywheelStrip({ book }) {
  const f = useMemo(() => flywheel(book, { nowIso: book?.createdIso }), [book]);
  const loops = [
    { k: 'Interaction', t: f.interaction.headline },
    { k: 'Marketing', t: f.marketing.headline },
    { k: 'Learning', t: f.learning.headline },
    { k: 'Community', t: f.community.headline },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {loops.map((l) => (
        <div key={l.k} className="border p-2" style={{ borderColor: PALETTE.line, background: PALETTE.panel }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: PALETTE.accent }}>{l.k}</div>
          <div className="text-xs" style={{ color: PALETTE.ink }}>{l.t}</div>
        </div>
      ))}
      <div className="sm:col-span-2 flex flex-wrap gap-1">
        {f.marketing.assets.map((a) => (
          <span key={a.business} className="text-[11px] px-2 py-0.5 border" style={{ borderColor: PALETTE.line, color: PALETTE.muted }}>
            Markets for: {a.business}
          </span>
        ))}
      </div>
    </div>
  );
}

function DownloadRow({ book }) {
  const dl = useCallback((kind) => {
    try {
      if (kind === 'html') triggerDownload(new Blob([bookToReaderHtml(book)], { type: 'text/html' }), exportFilename(book.title, 'html'));
      else if (kind === 'md') triggerDownload(new Blob([toMarkdown(book)], { type: 'text/markdown' }), exportFilename(book.title, 'md'));
      else if (kind === 'epub') triggerDownload(new Blob([bookToEpubBytes(book)], { type: 'application/epub+zip' }), exportFilename(book.title, 'epub'));
    } catch (e) { /* fail soft — no white screen */ }
  }, [book]);
  const btn = 'text-xs px-3 py-1.5 border font-semibold hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => dl('epub')} className={btn} style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}>Download .epub</button>
      <button type="button" onClick={() => dl('html')} className={btn} style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}>Download .html</button>
      <button type="button" onClick={() => dl('md')} className={btn} style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}>Download .md</button>
    </div>
  );
}

// --- The reader (with companion deep-links) ---------------------------------

function ChapterBlock({ block }) {
  if (block.kind === 'heading') return <h4 className="font-semibold mt-3 mb-1" style={{ color: PALETTE.ink }}>{block.text}</h4>;
  if (block.kind === 'list') return <ul className="list-disc pl-5 my-2" style={{ color: PALETTE.ink }}>{block.items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
  if (block.kind === 'note') return (
    <div className="my-2 p-2 border text-sm" style={{ borderColor: PALETTE.line, background: PALETTE.panel, color: PALETTE.ink }}>
      <strong>{block.label}.</strong> {block.text}
    </div>
  );
  if (block.kind === 'scripture') return (
    <blockquote className="my-2 pl-3 border-l-2 italic text-sm" style={{ borderColor: PALETTE.accent, color: PALETTE.ink }}>
      <span className="block not-italic font-semibold text-[11px]" style={{ color: PALETTE.accent }}>{block.version || 'KJV'} — {block.ref}</span>
      {block.text ? `"${block.text}"` : 'See the Scripture library.'}
    </blockquote>
  );
  return <p className="my-2 leading-relaxed" style={{ color: PALETTE.ink }}>{block.text}</p>;
}

function Reader({ book, onNavigate, onBack }) {
  return (
    <div className="max-w-2xl">
      <button type="button" onClick={onBack} className="text-xs underline mb-3" style={{ color: PALETTE.accent }}>← Back to the shelf</button>
      <h2 className="text-2xl" style={{ color: PALETTE.ink, fontFamily: '"Fraunces", serif' }}>{book.title}</h2>
      {book.subtitle && <p className="italic mb-1" style={{ color: PALETTE.muted }}>{book.subtitle}</p>}
      <p className="text-xs mb-4" style={{ color: PALETTE.muted }}>{book.author} · {book.stats?.chapters} chapters · ~{book.stats?.estReadingMinutes} min</p>
      {book.frontMatter && <p className="mb-4" style={{ color: PALETTE.ink }}>{book.frontMatter}</p>}
      {book.chapters.map((c) => (
        <section key={c.id} className="mb-6 pt-2">
          <h3 className="text-lg border-b-2 pb-1 mb-2" style={{ color: PALETTE.ink, borderColor: PALETTE.accent, fontFamily: '"Fraunces", serif' }}>{c.number}. {c.title}</h3>
          {c.intro && <p className="my-2" style={{ color: PALETTE.ink }}>{c.intro}</p>}
          {c.blocks.map((b, n) => <ChapterBlock key={n} block={b} />)}
          {c.deepLinks?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {c.deepLinks.filter((l) => l.view).map((l, n) => (
                <button key={n} type="button" onClick={() => onNavigate(l)} className="text-[11px] px-2 py-1 border hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ borderColor: PALETTE.accent, color: PALETTE.accent }}>
                  {l.label} →
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
      <div className="mt-6 pt-3 border-t text-xs" style={{ borderColor: PALETTE.line, color: PALETTE.muted }}>
        <p>{book.attribution?.note}</p>
        <p className="mt-1">{book.attribution?.scripture}</p>
      </div>
    </div>
  );
}

// --- The studio (build from corpus) -----------------------------------------

function Studio({ ctx, preview, setPreview, onSave, canPublish }) {
  const recipes = useMemo(() => availableRecipes(ctx), [ctx]);
  const build = useCallback((id) => {
    const book = buildRecipe(id, ctx, { nowIso: new Date().toISOString() });
    if (book) setPreview(book);
  }, [ctx, setPreview]);

  const card = 'border bg-white p-3 flex flex-col gap-1';
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: PALETTE.muted }}>
        Assemble a book from what the family and community already created. Nothing is fetched anew, and nothing is written by a machine — the app only arranges existing teaching and reproduces Scripture verbatim (KJV).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recipes.map((r) => (
          <div key={r.id} className={card} style={{ borderColor: PALETTE.line }}>
            <div className="font-semibold" style={{ color: PALETTE.ink, fontFamily: '"Fraunces", serif' }}>{r.title}</div>
            <div className="text-[11px]" style={{ color: PALETTE.muted }}>{r.source} · {r.count} {r.count === 1 ? 'piece' : 'pieces'}</div>
            {r.available
              ? <button type="button" onClick={() => build(r.id)} className="text-xs px-3 py-1.5 border font-semibold self-start mt-1 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}>Preview book</button>
              : <span className="text-[11px] mt-1" style={{ color: PALETTE.muted }}>{r.reason || 'Not available yet.'}</span>}
          </div>
        ))}
      </div>

      {preview && (
        <div className="border p-4 space-y-3" style={{ borderColor: PALETTE.accent, background: PALETTE.panel }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl" style={{ color: PALETTE.ink, fontFamily: '"Fraunces", serif' }}>{preview.title}</h3>
              <p className="text-xs" style={{ color: PALETTE.muted }}>{preview.stats?.chapters} chapters · {preview.stats?.words} words · {preview.stats?.scriptures} Scripture references · ~{preview.stats?.estReadingMinutes} min</p>
            </div>
            <button type="button" onClick={() => setPreview(null)} className="text-xs underline" style={{ color: PALETTE.muted }}>Close</button>
          </div>
          <IntegrityPanel book={preview} />
          <FlywheelStrip book={preview} />
          <DownloadRow book={preview} />
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: PALETTE.line }}>
            <button type="button" onClick={() => onSave(preview)} className="text-xs px-3 py-1.5 font-semibold text-white focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ background: PALETTE.ink }}>Save to my Library</button>
            <span className="text-[11px]" style={{ color: PALETTE.muted }}>
              {canPublish
                ? 'Publishing beyond the app is gated — it stages an approve-to-publish hand-off, never auto-sends.'
                : 'Reading + downloading is yours. Publishing to the community is a Governor decision.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- The surface -------------------------------------------------------------

export default function Library({ email, isFamilyMember = false, sermons = [], setView, setChurchView, setBooksView }) {
  const [mode, setMode] = useState('shelf');           // 'shelf' | 'studio'
  const [shelf, setShelf] = useState([]);
  const [reading, setReading] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => { setShelf(loadShelf(email).books); }, [email]);

  // Real corpus the studio assembles from. Algorithms come from the device-local
  // library (falls back to the seed catalog inside availableRecipes); sermons are
  // passed in only when the Church > The Word tab has loaded them.
  const ctx = useMemo(() => ({
    algorithms: loadLibrary(email)?.entries || [],
    sermons: Array.isArray(sermons) ? sermons : [],
  }), [email, sermons]);

  const persist = useCallback((books) => { setShelf(books); saveShelf(email, books); }, [email]);

  const onSave = useCallback((book) => {
    persist(upsertBook(shelf, book));
    setToast(`Saved "${book.title}" to your Library.`);
    setMode('shelf');
  }, [shelf, persist]);

  const onRemove = useCallback((id) => persist(removeBook(shelf, id)), [shelf, persist]);

  // Companion routing — the heart of "supported by the app": jump from a chapter
  // into the live surface it describes.
  const onNavigate = useCallback((link) => {
    if (!link?.view) return;
    if (link.view === 'church' && link.churchView && typeof setChurchView === 'function') setChurchView(link.churchView);
    if (typeof setView === 'function') setView(link.view);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* noop */ }
  }, [setView, setChurchView]);

  if (reading) {
    return <Reader book={reading} onNavigate={onNavigate} onBack={() => setReading(null)} />;
  }

  const tabBtn = (id, label) => (
    <button key={id} type="button" onClick={() => setMode(id)}
      className={`px-3 py-2 text-sm border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${mode === id ? 'font-medium' : ''}`}
      style={{ borderColor: mode === id ? PALETTE.accent : 'transparent', color: mode === id ? PALETTE.ink : PALETTE.muted }}>
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl">
      <SectionTitle eyebrow="Books">Library</SectionTitle>
      <p className="text-sm mb-3" style={{ color: PALETTE.muted }}>
        Books made from the house's own teaching — that read you straight back into the living app.
      </p>

      <div className="flex gap-1 border-b mb-4" style={{ borderColor: PALETTE.line }}>
        {tabBtn('shelf', `My shelf${shelf.length ? ` (${shelf.length})` : ''}`)}
        {isFamilyMember && tabBtn('studio', 'Studio — build a book')}
      </div>

      {toast && <div className="mb-3 text-xs px-3 py-2 border" style={{ borderColor: PALETTE.line, background: PALETTE.panel, color: PALETTE.ink }}>{toast}</div>}

      {mode === 'shelf' && (
        shelf.length === 0
          ? (
            <div className="border p-6 text-center" style={{ borderColor: PALETTE.line, background: 'white' }}>
              <div className="text-2xl mb-1" aria-hidden="true">📖</div>
              <p className="font-semibold" style={{ color: PALETTE.ink, fontFamily: '"Fraunces", serif' }}>Your shelf is empty.</p>
              <p className="text-xs mt-1" style={{ color: PALETTE.muted }}>
                {isFamilyMember ? 'Open the Studio to assemble your first book from the corpus.' : 'Published books will appear here.'}
              </p>
              {isFamilyMember && (
                <button type="button" onClick={() => setMode('studio')} className="mt-3 text-xs px-3 py-1.5 font-semibold text-white focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ background: PALETTE.ink }}>Open the Studio →</button>
              )}
            </div>
          )
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shelf.map((b) => {
                const stats = b.stats || bookStats(b);
                return (
                  <div key={b.id} className="border bg-white p-3 flex flex-col gap-2" style={{ borderColor: PALETTE.line }}>
                    <div>
                      <div className="font-semibold" style={{ color: PALETTE.ink, fontFamily: '"Fraunces", serif' }}>{b.title}</div>
                      {b.subtitle && <div className="text-[11px] italic" style={{ color: PALETTE.muted }}>{b.subtitle}</div>}
                      <div className="text-[11px] mt-0.5" style={{ color: PALETTE.muted }}>{stats.chapters} chapters · ~{stats.estReadingMinutes} min</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setReading(b)} className="text-xs px-3 py-1.5 font-semibold text-white focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ background: PALETTE.ink }}>Read</button>
                      <button type="button" onClick={() => onRemove(b.id)} className="text-xs px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ borderColor: PALETTE.line, color: PALETTE.muted }}>Remove</button>
                    </div>
                    <DownloadRow book={b} />
                  </div>
                );
              })}
            </div>
          )
      )}

      {mode === 'studio' && isFamilyMember && (
        <Studio ctx={ctx} preview={preview} setPreview={setPreview} onSave={onSave} canPublish={isFamilyMember} />
      )}
    </div>
  );
}
