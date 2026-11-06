// =============================================================================
// RepoDocuments — the proof of the work, readable inside the app (DR-1354)
// =============================================================================
// Darrell, 2026-11-06: "I want all the DRs and Ways and documentation to be
// accessible by myself inside our documents for the PoeTech App build... if I
// want to go and discuss this process and what we do I want to be able to do
// that without using claude or anything, just the document location and
// documentation showcases the proof of the work."
//
// REVIEWED FIRST (DR-0219 SHOULD/ARE): the app already compiles in the
// decision ledger (Governor Review), the principles registry, the governance
// queue and the reviews registry. None of those shows a record's full text,
// the foundation documents, the Ways or the session notes. This surface does,
// and it reads the same files from the same repository, catalogued at build
// and fetched one static file at a time when opened (lib/repo-documents.js;
// a module per document ran the build out of memory, DR-1354).
//
// THE STANDARD IT INHERITS (EXCELLENCE-STANDARD, UX-PATTERNS 2e/2g, P15):
// the counts are what was on disk at build, never typed; a document opens IN
// PLACE under the list it was tapped from, the screen does not fly; every row
// is a 44 px target with a text label; a document that cannot load says so
// with its path (never a blank, DR-0381); content text scales with the reader's
// text size, the chrome does not. No document is mounted as HTML (DR-0076).
import React, { useEffect, useMemo, useState } from 'react';
import {
  GROUPS, buildCatalog, groupCounts, filterCatalog, loadDocument, headingOf, renderMarkdownBlocks,
} from '../lib/repo-documents.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';
const serif = { fontFamily: '"Fraunces", serif' };
const PAGE = 300;

function Block({ b }) {
  if (b.kind === 'heading') {
    const size = b.level <= 1 ? 'text-base' : b.level === 2 ? 'text-sm' : 'text-xs';
    return <p className={`${size} font-semibold text-[#1A1815] mt-3`} style={serif}>{b.text}</p>;
  }
  if (b.kind === 'list') {
    return (
      <ul className="list-disc pl-5 space-y-0.5">
        {b.items.map((t, i) => <li key={i} className="text-xs text-[#1A1815]" style={serif}>{b.ordered ? `${i + 1}. ` : ''}{t}</li>)}
      </ul>
    );
  }
  if (b.kind === 'quote') return <p className="text-xs text-[#5A5751] italic border-l-2 border-[#B85838] pl-2" style={serif}>{b.text}</p>;
  if (b.kind === 'code' || b.kind === 'table') return <pre className="text-[0.6875rem] text-[#1A1815] bg-[#F3F1EC] p-2 overflow-x-auto whitespace-pre-wrap">{b.text}</pre>;
  if (b.kind === 'rule') return <hr className="border-[#D9D5CC]" />;
  return <p className="text-xs text-[#1A1815] leading-relaxed" style={serif}>{b.text}</p>;
}

export default function RepoDocuments() {
  const catalog = useMemo(() => buildCatalog(), []);
  const counts = useMemo(() => groupCounts(catalog), [catalog]);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('decisions');
  const [openKey, setOpenKey] = useState(null);
  const [doc, setDoc] = useState({ state: 'idle', raw: '', error: '' });

  const inGroup = useMemo(() => filterCatalog(catalog.filter((it) => it.group === group), query), [catalog, group, query]);
  const shown = inGroup.slice(0, PAGE);
  const open = catalog.find((it) => it.key === openKey) || null;

  useEffect(() => {
    if (!openKey) return undefined;
    let alive = true;
    setDoc({ state: 'loading', raw: '', error: '' });
    loadDocument(openKey)
      .then((raw) => { if (alive) setDoc({ state: 'ready', raw, error: '' }); })
      .catch((e) => { if (alive) setDoc({ state: 'failed', raw: '', error: String(e && e.message ? e.message : e) }); });
    return () => { alive = false; };
  }, [openKey]);

  const blocks = useMemo(() => (doc.state === 'ready' ? renderMarkdownBlocks(doc.raw) : []), [doc]);

  return (
    <div className="space-y-4" data-testid="repo-documents">
      <section className={card}>
        <div className={sectionH}>Documents — the proof of the work, read where the work is</div>
        <p className={`${note} mt-1`}>
          Every decision record, foundation document, Way, review and session note in this build, under its own file path. The path is the document location; the text loads when you open it. Nothing here is typed by hand: the list is whatever was on disk when this build was made, {catalog.length} documents.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3" role="tablist" aria-label="Document groups">
          {GROUPS.filter((g) => counts[g.key] > 0).map((g) => (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={group === g.key}
              onClick={() => { setGroup(g.key); setOpenKey(null); }}
              className={`min-h-[44px] text-xs px-3 py-2 border ${group === g.key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#1A1815]'}`}
            >
              {g.label} · {counts[g.key]}
            </button>
          ))}
        </div>
        <p className={`${note} mt-2`}>{(GROUPS.find((g) => g.key === group) || {}).blurb}</p>
        <label className="block mt-3">
          <span className={sectionH}>Find by title or path</span>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpenKey(null); }}
            placeholder="DR-1353, the way, credit, 2026-11-05…"
            className="mt-1 w-full min-h-[44px] border border-[#1A1815] px-3 py-2 text-sm bg-white text-[#1A1815]"
            aria-label="Find a document by title or path"
          />
        </label>
        <p className={`${note} mt-1`} data-testid="repo-documents-count">
          {inGroup.length} in this group match{inGroup.length > PAGE ? `; the first ${PAGE} are listed, narrow the search for the rest` : ''}.
        </p>
      </section>

      <section className={card}>
        {open ? (
          <div data-testid="repo-document-open">
            <button type="button" onClick={() => setOpenKey(null)} className="min-h-[44px] text-xs underline text-[#B85838] px-1">Back to the list</button>
            <p className={`${sectionH} mt-2`} data-testid="repo-document-path">{open.path}</p>
            <p className="text-base font-semibold text-[#1A1815] mt-1" style={serif}>{doc.state === 'ready' ? (headingOf(doc.raw) || open.title) : open.title}</p>
            {doc.state === 'loading' && <p className={`${note} mt-2`}>Loading {open.path}…</p>}
            {doc.state === 'failed' && (
              <p className="text-xs text-[#B85838] mt-2" data-testid="repo-document-unreadable">
                This document could not be loaded in this build ({doc.error}). Its location in the repository is {open.path}; open it there, and tell the stewards this line appeared.
              </p>
            )}
            {doc.state === 'ready' && (
              <div className="mt-3 space-y-2">
                {blocks.map((b, i) => <Block key={i} b={b} />)}
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#E6E2DA]">
            {shown.map((it) => (
              <li key={it.key}>
                <button type="button" onClick={() => setOpenKey(it.key)} className="w-full min-h-[44px] text-left py-2 px-1">
                  <span className="block text-sm text-[#1A1815]" style={serif}>{it.title}</span>
                  <span className="block text-[0.625rem] text-[#5A5751]">{it.path}</span>
                </button>
              </li>
            ))}
            {shown.length === 0 && (
              <li className={`${note} py-3`}>No document in this group matches that search. Clear the search, or pick another group above; every group lists what is on disk.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
