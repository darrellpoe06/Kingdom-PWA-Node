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
import { SectionTitle, TabScroll } from './shared.jsx';
import { FAMILY_ARTISTS, FAMILY_PICKS, LISTENING_TAGLINE } from '../lib/family-listening.js';
import { triggerDownload, exportFilename } from '../lib/creation-workspace.js';
import { bookStats } from '../lib/book-engine.js';
import { toMarkdown, bookToReaderHtml, bookToEpubBytes } from '../lib/book-formats.js';
import { flywheel } from '../lib/book-flywheel.js';
import {
  availableRecipes, buildRecipe, loadShelf, saveShelf, upsertBook, removeBook,
} from '../lib/book-corpus.js';
import { subscribeSermons } from '../lib/choir-sync.js';
import { loadLibrary } from '../lib/eternal-algorithms.js';
import { useReadingResume, anchorProps } from '../lib/reading-position.js';
import Bookstore from './Bookstore.jsx';
import { motionBehavior } from '../lib/gentle-motion.js';

// THEMED CLASSES, NEVER INLINE HEX (2026-07-30, from a live midnight-theme
// screenshot: every title/button on this surface painted #1A1815 ink via
// inline `style` on the dark #141414 card — invisible). The theme engine
// (lib/theme-css.js) remaps CLASS tokens (`.text-[#1A1815]` etc.) with
// !important; an inline style is unreachable by every theme, not just dark.
// All color on this surface rides the tokenized classes; inline style is for
// non-color concerns (fontFamily, width%) only. Pinned by
// library-theme-classes.test.js (the gate for this miss class).

function Badge({ tone = 'ok', children }) {
  const cls = tone === 'ok'
    ? 'bg-[#F2F4EC] text-[#216E39] border-[#5A6E3D]'
    : 'bg-[#FAF1EC] text-[#B45309] border-[#B85838]';
  return (
    <span className={`inline-block text-[0.6875rem] px-2 py-0.5 rounded-sm border ${cls}`}>
      {children}
    </span>
  );
}

function IntegrityPanel({ book }) {
  const ok = book?.integrity?.ok;
  return (
    <div className="border bg-white p-3 border-[#E8E4DC]" >
      <div className="flex items-center gap-2 mb-1">
        {ok ? <Badge tone="ok">Verified</Badge> : <Badge tone="warn">Review needed</Badge>}
        <span className="text-xs text-[#5A5751]" >
          {ok ? 'Sourced · no fabrication · Scripture verbatim (KJV)' : 'This book is honest about its gaps before it ships.'}
        </span>
      </div>
      {!ok && (
        <ul className="text-xs mt-1 list-disc pl-5 text-[#1A1815]" >
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
        <div key={l.k} className="border p-2 border-[#E8E4DC] bg-[#FAF8F4]" >
          <div className="text-[0.6875rem] uppercase tracking-wider font-semibold text-[#B85838]" >{l.k}</div>
          <div className="text-xs text-[#1A1815]" >{l.t}</div>
        </div>
      ))}
      <div className="sm:col-span-2 flex flex-wrap gap-1">
        {f.marketing.assets.map((a) => (
          <span key={a.business} className="text-[0.6875rem] px-2 py-0.5 border border-[#E8E4DC] text-[#5A5751]" >
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
      <button type="button" onClick={() => dl('epub')} className={btn} className="border-[#1A1815] text-[#1A1815]" >Download .epub</button>
      <button type="button" onClick={() => dl('html')} className={btn} className="border-[#1A1815] text-[#1A1815]" >Download .html</button>
      <button type="button" onClick={() => dl('md')} className={btn} className="border-[#1A1815] text-[#1A1815]" >Download .md</button>
    </div>
  );
}

// --- The reader (with companion deep-links) ---------------------------------

function ChapterBlock({ block }) {
  if (block.kind === 'heading') return <h4 className="font-semibold mt-3 mb-1 text-[#1A1815]" >{block.text}</h4>;
  if (block.kind === 'list') return <ul className="list-disc pl-5 my-2 text-[#1A1815]" >{block.items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
  if (block.kind === 'note') return (
    <div className="my-2 p-2 border text-sm border-[#E8E4DC] bg-[#FAF8F4] text-[#1A1815]" >
      <strong>{block.label}.</strong> {block.text}
    </div>
  );
  if (block.kind === 'scripture') return (
    <blockquote className="my-2 pl-3 border-l-2 italic text-sm border-[#B85838] text-[#1A1815]" >
      <span className="block not-italic font-semibold text-[0.6875rem] text-[#B85838]" >{block.version || 'KJV'} — {block.ref}</span>
      {block.text ? `"${block.text}"` : 'See the Scripture library.'}
    </blockquote>
  );
  return <p className="my-2 leading-relaxed text-[#1A1815]" >{block.text}</p>;
}

function Reader({ book, onNavigate, onBack, userKey }) {
  // Resume reading exactly where this reader left off in THIS book — not the top.
  // Each chapter is a stable anchor (anchorProps) so resume + the font-size
  // scroll-anchor land on the right paragraph, not a guessed offset.
  const { hasResume, resume, label } = useReadingResume({ userKey, surface: 'book', itemId: book.id });
  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="text-xs underline mb-3 text-[#B85838]" >← Back to the shelf</button>
      <h2 className="text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{book.title}</h2>
      {book.subtitle && <p className="italic mb-1 text-[#5A5751]" >{book.subtitle}</p>}
      <p className="text-xs mb-4 text-[#5A5751]" >{book.author} · {book.stats?.chapters} chapters · ~{book.stats?.estReadingMinutes} min</p>
      {hasResume && (
        <button type="button" onClick={resume} className="mb-4 text-xs px-3 py-2 border w-full text-left focus:outline focus:outline-2 focus:outline-[#B85838] border-[#B85838] bg-[#FAF8F4] text-[#1A1815]" >
          ↓ {label || 'Continue where you left off'}
        </button>
      )}
      {book.frontMatter && <p className="mb-4 text-[#1A1815]" >{book.frontMatter}</p>}
      {book.chapters.map((c) => (
        <section key={c.id} {...anchorProps(`ch-${c.id}`)} className="mb-6 pt-2">
          <h3 className="text-lg border-b-2 pb-1 mb-2 text-[#1A1815] border-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{c.number}. {c.title}</h3>
          {c.intro && <p className="my-2 text-[#1A1815]" >{c.intro}</p>}
          {c.blocks.map((b, n) => <ChapterBlock key={n} block={b} />)}
          {c.deepLinks?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {c.deepLinks.filter((l) => l.view).map((l, n) => (
                <button key={n} type="button" onClick={() => onNavigate(l)} className="text-[0.6875rem] px-2 py-1 border hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] border-[#B85838] text-[#B85838]" >
                  {l.label} →
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
      <div className="mt-6 pt-3 border-t text-xs border-[#E8E4DC] text-[#5A5751]" >
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
      <p className="text-sm text-[#5A5751]" >
        Assemble a book from what the family and community already created. Nothing is fetched anew, and nothing is written by a machine — the app only arranges existing teaching and reproduces Scripture verbatim (KJV).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recipes.map((r) => (
          <div key={r.id} className={card} className="border-[#E8E4DC]" >
            <div className="font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{r.title}</div>
            <div className="text-[0.6875rem] text-[#5A5751]" >{r.source} · {r.count} {r.count === 1 ? 'piece' : 'pieces'}</div>
            {r.available
              ? <button type="button" onClick={() => build(r.id)} className="text-xs px-3 py-1.5 border font-semibold self-start mt-1 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] border-[#1A1815] text-[#1A1815]" >Preview book</button>
              : <span className="text-[0.6875rem] mt-1 text-[#5A5751]" >{r.reason || 'Not available yet.'}</span>}
          </div>
        ))}
      </div>

      {preview && (
        <div className="border p-4 space-y-3 border-[#B85838] bg-[#FAF8F4]" >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{preview.title}</h3>
              <p className="text-xs text-[#5A5751]" >{preview.stats?.chapters} chapters · {preview.stats?.words} words · {preview.stats?.scriptures} Scripture references · ~{preview.stats?.estReadingMinutes} min</p>
            </div>
            <button type="button" onClick={() => setPreview(null)} className="text-xs underline text-[#5A5751]" >Close</button>
          </div>
          <IntegrityPanel book={preview} />
          <FlywheelStrip book={preview} />
          <DownloadRow book={preview} />
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E4DC]" >
            <button type="button" onClick={() => onSave(preview)} className="text-xs px-3 py-1.5 font-semibold text-white focus:outline focus:outline-2 focus:outline-[#B85838] bg-[#1A1815]" >Save to my Library</button>
            <span className="text-[0.6875rem] text-[#5A5751]" >
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

export default function Library({ email, isFamilyMember = false, sermons = [], setView, setChurchView, setChurchHomeSection, setBooksView }) {
  const [mode, setMode] = useState('shelf');           // 'shelf' | 'studio'
  const [shelf, setShelf] = useState([]);
  const [reading, setReading] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState('');
  // Shelf windowing — no endless scroll as the shelf grows (audit:
  // list-pagination, intuitive-ux). First pageSize books render; the rest wait
  // behind an honest "Show more".
  const pageSize = 12;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => { setShelf(loadShelf(email).books); }, [email]);

  // Live sermon corpus (real choir_sermons rows, mapped by toSermonShape — the
  // exact camelCase shape sermonToSource reads). The shell mounts this surface
  // with sermons={[]}, which starved the "Messages from the House" recipe
  // forever; same self-subscribe fix ScriptureLibrary got 2026-06-29.
  const [liveSermons, setLiveSermons] = useState([]);
  useEffect(() => {
    const offSermons = subscribeSermons((rows) => setLiveSermons(rows || []));
    return () => { if (typeof offSermons === 'function') offSermons(); };
  }, []);

  // Real corpus the studio assembles from. Algorithms come from the device-local
  // library (falls back to the seed catalog inside availableRecipes); sermons
  // come from the live stream above — live rows win, and the prop stays as the
  // DI/test fallback for callers that inject their own corpus.
  const ctx = useMemo(() => ({
    algorithms: loadLibrary(email)?.entries || [],
    sermons: liveSermons.length ? liveSermons : (Array.isArray(sermons) ? sermons : []),
  }), [email, sermons, liveSermons]);

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
    if (link.view === 'church' && link.churchView && typeof setChurchView === 'function') {
      setChurchView(link.churchView);
      // A link may name the SECTION (the Council Chamber = church home 'speak');
      // without one, home opens on its Worship default (DR-0142).
      if (link.churchView === 'home' && typeof setChurchHomeSection === 'function') setChurchHomeSection(link.churchSection || null);
    }
    if (typeof setView === 'function') setView(link.view);
    try { window.scrollTo({ top: 0, behavior: motionBehavior() }); } catch (e) { /* noop */ }
  }, [setView, setChurchView, setChurchHomeSection]);

  // Open a purchased/entitled store book in the in-app reader — assembled from
  // its recipe (real corpus), then read with resume + companion deep-links.
  const onReadProduct = useCallback((product) => {
    const book = buildRecipe(product.recipeId, ctx, { nowIso: new Date().toISOString() });
    if (book) setReading(book);
    else setToast(`"${product.title}" content is not available to read yet.`);
  }, [ctx]);

  if (reading) {
    return <Reader book={reading} onNavigate={onNavigate} onBack={() => setReading(null)} userKey={email} />;
  }

  // KEPT as component state (not folded into SectionTabs): `mode` is WRITTEN
  // from outside the strip — onSave jumps back to the shelf, and the empty
  // shelf's "Open the Studio" CTA jumps to the studio — which the uncontrolled
  // SectionTabs primitive cannot express. Harmonized instead: the strip now
  // rides the shared <TabScroll> primitive (role=tab, nowrap) so it scrolls
  // and feels identical to every other section row (tab-overflow-guard inv. 3).
  const tabBtn = (id, label) => (
    <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
      className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${mode === id ? 'font-medium border-[#B85838] text-[#1A1815]' : 'border-transparent text-[#5A5751]'}`}>
      {label}
    </button>
  );

  return (
    <div className="w-full">
      <SectionTitle eyebrow="Books">Library</SectionTitle>
      <p className="text-sm mb-3 text-[#5A5751]" >
        Books made from the house's own teaching — that read you straight back into the living app.
      </p>

      <div className="border-b mb-4 border-[#E8E4DC]" >
        <TabScroll label="Library sections">
          {tabBtn('store', 'Store')}
          {tabBtn('shelf', `My shelf${shelf.length ? ` (${shelf.length})` : ''}`)}
          {tabBtn('listening', 'Listening')}
          {isFamilyMember && tabBtn('studio', 'Studio — build a book')}
        </TabScroll>
      </div>

      {toast && <div className="mb-3 text-xs px-3 py-2 border border-[#E8E4DC] bg-[#FAF8F4] text-[#1A1815]" >{toast}</div>}

      {mode === 'store' && (
        <Bookstore email={email} isFamilyMember={isFamilyMember} onReadProduct={onReadProduct} />
      )}

      {mode === 'shelf' && (
        shelf.length === 0
          ? (
            <div className="border p-6 text-center border-[#E8E4DC] bg-white" >
              <div className="text-2xl mb-1" aria-hidden="true">📖</div>
              <p className="font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Your shelf is empty.</p>
              <p className="text-xs mt-1 text-[#5A5751]" >
                {isFamilyMember ? 'Open the Studio to assemble your first book from the corpus.' : 'Published books will appear here.'}
              </p>
              {isFamilyMember && (
                <button type="button" onClick={() => setMode('studio')} className="mt-3 text-xs px-3 py-1.5 font-semibold text-white focus:outline focus:outline-2 focus:outline-[#B85838] bg-[#1A1815]" >Open the Studio →</button>
              )}
            </div>
          )
          : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shelf.slice(0, visibleCount).map((b) => {
                  const stats = b.stats || bookStats(b);
                  return (
                    <div key={b.id} className="border bg-white p-3 flex flex-col gap-2 border-[#E8E4DC]" >
                      <div>
                        <div className="font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{b.title}</div>
                        {b.subtitle && <div className="text-[0.6875rem] italic text-[#5A5751]" >{b.subtitle}</div>}
                        <div className="text-[0.6875rem] mt-0.5 text-[#5A5751]" >{stats.chapters} chapters · ~{stats.estReadingMinutes} min</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setReading(b)} className="text-xs px-3 py-1.5 font-semibold text-white focus:outline focus:outline-2 focus:outline-[#B85838] bg-[#1A1815]" >Read</button>
                        <button type="button" onClick={() => onRemove(b.id)} className="text-xs px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-[#B85838] border-[#E8E4DC] text-[#5A5751]" >Remove</button>
                      </div>
                      <DownloadRow book={b} />
                    </div>
                  );
                })}
              </div>
              {shelf.length > visibleCount && (
                <button type="button" onClick={() => setVisibleCount((c) => c + pageSize)}
                  className="mt-3 w-full text-xs px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] border-[#E8E4DC] text-[#5A5751]"
                  >
                  Show more · {shelf.length - visibleCount} remaining
                </button>
              )}
            </>
          )
      )}

      {mode === 'studio' && isFamilyMember && (
        <Studio ctx={ctx} preview={preview} setPreview={setPreview} onSave={onSave} canPublish={isFamilyMember} />
      )}

      {/* LISTENING — the family-curated artist shelf (Darrell 2026-07-03:
          Lecrae + the 116 crew). Links are honest YouTube SEARCHES, never a
          guessed channel handle (DR-0076); swap in verified channel URLs per
          artist as the family pins them (lib/family-listening.js). */}
      {mode === 'listening' && (
        <div>
          <p className="text-sm mb-3 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{LISTENING_TAGLINE}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FAMILY_ARTISTS.map((a) => (
              <div key={a.id} className="bg-white border p-3 border-[#E8E4DC]" >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{a.name}</span>
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" >{a.tag}</span>
                </div>
                <p className="text-xs mt-0.5 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{a.note}</p>
                <a href={a.searchUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Listen on YouTube ↗
                </a>
              </div>
            ))}
          </div>
          {/* The picks — specific tracks vouched by name, with the why. */}
          {FAMILY_PICKS.length > 0 && (
            <div className="mt-4">
              <div className="text-[0.5625rem] uppercase tracking-[0.25em] font-semibold mb-1.5 text-[#5A5751]" >The picks · vouched by name</div>
              <div className="space-y-2">
                {FAMILY_PICKS.map((p) => (
                  <div key={p.id} className="bg-white border-l-2 border p-3 border-[#E8E4DC] border-l-[#B85838]" >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{p.title}</span>
                      <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" >{p.artist} · {p.album}</span>
                    </div>
                    <p className="text-xs mt-0.5 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{p.why}</p>
                    <a href={p.searchUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-2 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]">
                      Listen on YouTube ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-[0.625rem] mt-3 italic text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Curated by the family — name an artist or a track and the shelf carries them.
          </p>
        </div>
      )}
    </div>
  );
}
