// =============================================================================
// repo-documents — the proof of the work, readable inside the app (DR-1360)
// =============================================================================
// Darrell, 2026-11-06: "Reports need to be findable inside the documentation of
// the PoeTech App also... I want all the DRs and Ways and documentation to be
// accessible by myself inside our documents for the PoeTech App build... if I
// want to go and discuss this process and what we do I want to be able to do
// that without using claude or anything, just the document location and
// documentation showcases the proof of the work."
//
// WHAT THIS IS. Every Markdown document under docs/ — the decision records,
// the foundation documents and the Ways, the session notes, the reviews, the
// governance queue and the templates — catalogued at build time by path and
// loaded on demand, one file per request, so the app ships a catalog and not
// a 40 MB bundle. The path is shown with every document, because the path IS
// the document location he asked for, and nothing here is typed by hand: the
// catalog is whatever is on disk at build (DR-0121, never a hand-kept list).
//
// NO HTML, NO SCRIPT. A document is rendered from its Markdown into plain
// blocks (headings, paragraphs, lists, quotes, code, tables as fixed text).
// Raw HTML inside a document is shown as text, never mounted; a record is
// data to read, never a page that runs (DR-0076, DR-1172).
//
// Pure except `loadDocument`, which calls the lazy loader Vite gave the path.
// =============================================================================

// The catalog: the paths of every Markdown file under docs/, listed by the
// build (vite.config.js, repoDocuments) and held once (DR-1214). The text of a
// document is a STATIC FILE at the same path, fetched when opened; a module per
// document ran the build out of memory (DR-1360).
export const REPO_DOCS = (() => {
  try {
    return Array.isArray(globalThis.__PT_REPO_DOCS) ? globalThis.__PT_REPO_DOCS : [];
  } catch {
    return [];
  }
})();
export const FETCH_TIMEOUT_MS = 15000;

export const GROUPS = Object.freeze([
  {
    key: 'decisions',
    label: 'Decision records',
    dir: 'docs/decisions/',
    blurb: 'One decision per file, append-only; INDEX.md is the source of truth for what is decided.',
  },
  {
    key: 'foundations',
    label: 'Foundations and the Ways',
    dir: 'docs/00-foundations/',
    blurb: 'The authoritative foundation documents: The Way, the Mind of Christ, the Worldview spine, the standards and the Ways we review ourselves by.',
  },
  { key: 'reviews', label: 'Reviews', dir: 'docs/reviews/', blurb: 'Comprehensive reviews and the review registry.' },
  { key: 'governance', label: 'Governance', dir: 'docs/governance/', blurb: 'The open decision queue and governance notes.' },
  { key: 'notes', label: 'Session notes', dir: 'docs/99-session-notes/', blurb: 'Dated working notes: what was built, what was measured, what was found.' },
  { key: 'templates', label: 'Templates', dir: 'docs/templates/', blurb: 'The shapes a record, a brief or a review is written in.' },
  { key: 'other', label: 'Other documents', dir: '', blurb: 'Everything else under docs/.' },
]);

/** 'docs/decisions/DR-0001-x.md' from the glob key '../../../docs/decisions/DR-0001-x.md'. */
export function repoPath(key) {
  return String(key || '')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\/+/, '');
}

export function groupOf(path) {
  const p = repoPath(path);
  for (const g of GROUPS) if (g.dir && p.startsWith(g.dir)) return g.key;
  return 'other';
}

/** A readable title from a file name: 'DR-1353-credit-where-credit-is-due.md' -> 'DR-1353 credit where credit is due'. */
export function titleFromPath(path) {
  const base = repoPath(path).split('/').pop().replace(/\.md$/i, '');
  const dr = /^(DR-\d{4})-(.+)$/.exec(base);
  if (dr) return `${dr[1]} ${dr[2].replace(/-/g, ' ')}`;
  const dated = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(base);
  if (dated) return `${dated[1]} ${dated[2].replace(/-/g, ' ')}`;
  return base.replace(/[-_]+/g, ' ');
}

/** The catalog, sorted newest-looking first inside each group (DR numbers and dates descend). */
export function buildCatalog(keys = REPO_DOCS) {
  const items = keys.map((k) => ({ key: k, path: repoPath(k), group: groupOf(k), title: titleFromPath(k) }));
  const rank = (it) => {
    const base = it.path.split('/').pop();
    const dr = /^DR-(\d{4})/.exec(base);
    if (dr) return Number(dr[1]);
    const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(base);
    if (d) return Number(d[1] + d[2] + d[3]);
    return -1;
  };
  items.sort((a, b) => rank(b) - rank(a) || a.path.localeCompare(b.path));
  return items;
}

export function groupCounts(catalog) {
  const out = {};
  for (const g of GROUPS) out[g.key] = 0;
  for (const it of catalog) out[it.group] = (out[it.group] || 0) + 1;
  return out;
}

/** Case-insensitive match on title or path; an empty query returns everything. */
export function filterCatalog(catalog, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return catalog;
  return catalog.filter((it) => it.title.toLowerCase().includes(q) || it.path.toLowerCase().includes(q));
}

/** Fetch a document's text from its static path, with a hard wait (DR-1078: never hang). */
export async function loadDocument(key, { fetchImpl = globalThis.fetch, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const path = repoPath(key);
  if (!/^docs\/[^?#]+\.md$/.test(path) || path.includes('..')) throw new Error(`not a repository document: ${path}`);
  if (typeof fetchImpl !== 'function') throw new Error('no fetch in this runtime');
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(`/${path}`, { signal: ctl ? ctl.signal : undefined, cache: 'no-cache' });
    if (!res || !res.ok) throw new Error(`HTTP ${res ? res.status : 'no response'}`);
    const raw = await res.text();
    return String(raw || '').replace(/\r\n/g, '\n');
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** The first H1 of a document, or null. */
export function headingOf(raw) {
  const m = /^#\s+(.+)$/m.exec(String(raw || ''));
  return m ? m[1].trim() : null;
}

// --- Markdown to plain blocks ------------------------------------------------
// Deliberately small: enough to read a record. Inline marks (**bold**, *em*,
// `code`) are kept as their text; links show their text and their target in
// brackets, so nothing a document says can become a control.

export function inlineText(s) {
  return String(s || '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[image: $1]')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 [$2]')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1');
}

/**
 * @returns {Array<{kind:'heading',level:number,text:string}|{kind:'paragraph',text:string}|
 *   {kind:'list',ordered:boolean,items:string[]}|{kind:'quote',text:string}|
 *   {kind:'code',text:string}|{kind:'table',text:string}|{kind:'rule'}>}
 */
export function renderMarkdownBlocks(raw) {
  const lines = String(raw || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const blocks = [];
  let i = 0;
  const flushPara = (buf) => {
    if (buf.length) blocks.push({ kind: 'paragraph', text: inlineText(buf.join(' ')) });
  };
  let para = [];
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      flushPara(para);
      para = [];
      const code = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }
    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      flushPara(para);
      para = [];
      blocks.push({ kind: 'heading', level: h[1].length, text: inlineText(h[2]) });
      i += 1;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushPara(para);
      para = [];
      blocks.push({ kind: 'rule' });
      i += 1;
      continue;
    }
    if (/^\s*\|/.test(line)) {
      flushPara(para);
      para = [];
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      blocks.push({
        kind: 'table',
        text: rows
          .filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r))
          .map((r) =>
            inlineText(
              r
                .replace(/^\s*\||\|\s*$/g, '')
                .split('|')
                .map((c) => c.trim())
                .join('  ·  ')
            )
          )
          .join('\n'),
      });
      continue;
    }
    if (/^\s*>/.test(line)) {
      flushPara(para);
      para = [];
      const q = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        q.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push({ kind: 'quote', text: inlineText(q.join(' ')) });
      continue;
    }
    const li = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (li) {
      flushPara(para);
      para = [];
      const ordered = /^\s*\d/.test(line);
      const items = [];
      while (i < lines.length) {
        const m = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(lines[i]);
        if (m) {
          items.push(inlineText(m[1]));
          i += 1;
          continue;
        }
        if (/^\s{2,}\S/.test(lines[i]) && items.length) {
          items[items.length - 1] += ` ${inlineText(lines[i].trim())}`;
          i += 1;
          continue;
        }
        break;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    if (!line.trim()) {
      flushPara(para);
      para = [];
      i += 1;
      continue;
    }
    para.push(line.trim());
    i += 1;
  }
  flushPara(para);
  return blocks;
}
