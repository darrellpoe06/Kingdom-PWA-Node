// @vitest-environment node
// =============================================================================
// The proof of the work is readable inside the app (DR-1360)
// =============================================================================
// Darrell, 2026-11-06: "I want all the DRs and Ways and documentation to be
// accessible by myself inside our documents for the PoeTech App build... just
// the document location and documentation showcases the proof of the work."
//
// The catalog is whatever is under docs/ at build; these cases read the same
// disk the build reads, so a pass means the surface lists the real ledger and
// the real foundations, not a hand-kept list (P15). The Markdown reader is
// pinned on real documents and proven to render raw HTML as text.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  GROUPS,
  repoPath,
  groupOf,
  titleFromPath,
  buildCatalog,
  groupCounts,
  filterCatalog,
  headingOf,
  inlineText,
  renderMarkdownBlocks,
  loadDocument,
} from '../lib/repo-documents.js';

const ROOT = join(process.cwd(), '..');
const APP = join(process.cwd(), 'src');
const docsOnDisk = (sub) => readdirSync(join(ROOT, 'docs', sub)).filter((f) => f.endsWith('.md'));

// The glob keys as Vite hands them to the module.
const keysOnDisk = () => {
  const out = [];
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name), `${rel}/${e.name}`);
      else if (e.name.endsWith('.md')) out.push(`docs${rel}/${e.name}`);
    }
  };
  walk(join(ROOT, 'docs'), '');
  return out;
};

describe('the catalog is the repository, grouped by its own folders', () => {
  const catalog = buildCatalog(keysOnDisk());
  const counts = groupCounts(catalog);

  it('lists every decision record on disk, DR-1353 and DR-1360 among them, newest first', () => {
    const drs = catalog.filter((it) => it.group === 'decisions' && /\/DR-\d{4}-/.test(it.path));
    expect(drs.length).toBe(docsOnDisk('decisions').filter((f) => /^DR-\d{4}-/.test(f)).length);
    expect(drs.length).toBeGreaterThan(1000);
    expect(drs[0].path).toMatch(/^docs\/decisions\/DR-1360-/);
    expect(drs.some((it) => it.path.startsWith('docs/decisions/DR-1353-'))).toBe(true);
  });

  it('lists the foundations and the Ways, the session notes, the reviews and the governance queue', () => {
    expect(counts.foundations).toBe(keysOnDisk().filter((k) => k.startsWith('docs/00-foundations/')).length);
    expect(counts.foundations).toBeGreaterThan(100);
    expect(catalog.some((it) => it.path === 'docs/00-foundations/_root/THE-WAY.md')).toBe(true);
    expect(catalog.some((it) => it.path === 'docs/00-foundations/_root/HOLD-THE-HAND-OF-THE-PROCESS.md')).toBe(true);
    expect(catalog.some((it) => it.path === 'docs/00-foundations/_root/LESSONS-LEARNED.md')).toBe(true);
    expect(counts.notes).toBeGreaterThan(300);
    expect(counts.reviews).toBeGreaterThanOrEqual(1);
    expect(counts.governance).toBeGreaterThanOrEqual(1);
  });

  it('every group a reader can pick has a label, a blurb and a real folder, and nothing falls outside a group', () => {
    for (const g of GROUPS) {
      expect(g.label.length).toBeGreaterThan(3);
      expect(g.blurb.length).toBeGreaterThan(20);
    }
    expect(catalog.every((it) => GROUPS.some((g) => g.key === it.group))).toBe(true);
  });

  it('shows the repository path, which is the document location he asked for', () => {
    expect(repoPath('../../../docs/decisions/DR-0001-x.md')).toBe('docs/decisions/DR-0001-x.md');
    expect(repoPath('/docs/decisions/DR-0001-x.md')).toBe('docs/decisions/DR-0001-x.md');
    expect(groupOf('docs/99-session-notes/2026-11-05-x.md')).toBe('notes');
    expect(groupOf('docs/somewhere/else.md')).toBe('other');
  });

  it('makes a readable title from a file name without inventing one', () => {
    expect(titleFromPath('docs/decisions/DR-1353-credit-where-credit-is-due.md')).toBe('DR-1353 credit where credit is due');
    expect(titleFromPath('docs/99-session-notes/2026-11-05-a-status-read.md')).toBe('2026-11-05 a status read');
    expect(titleFromPath('docs/00-foundations/_root/THE-WAY.md')).toBe('THE WAY');
  });

  it('finds by title or path, case-insensitively, and an empty search is everything', () => {
    expect(filterCatalog(catalog, '').length).toBe(catalog.length);
    const hits = filterCatalog(catalog, 'credit where credit');
    expect(hits.some((it) => it.path.startsWith('docs/decisions/DR-1353-'))).toBe(true);
    expect(filterCatalog(catalog, 'DR-1360').length).toBeGreaterThanOrEqual(1);
    expect(filterCatalog(catalog, 'zzqqxx-no-such-document').length).toBe(0);
  });
});

describe('the reader renders a record as blocks, never as HTML', () => {
  const raw = readFileSync(join(ROOT, 'docs/decisions/DR-1353-credit-where-credit-is-due-names-stay-in-and-the-link-road-runs-on-the-nas-ll284.md'), 'utf8');

  it('reads the real record: its H1, its sections and its table', () => {
    expect(headingOf(raw)).toMatch(/^DR-1353: Credit where credit is due/);
    const blocks = renderMarkdownBlocks(raw);
    const headings = blocks.filter((b) => b.kind === 'heading').map((b) => b.text);
    expect(headings).toContain('Context');
    expect(headings).toContain('Decision');
    expect(headings).toContain('Verification');
    expect(blocks.some((b) => b.kind === 'table' && b.text.includes('corpus faults'))).toBe(true);
    expect(blocks.some((b) => b.kind === 'list')).toBe(true);
  });

  it('PROVEN TO CATCH: raw HTML and a script tag inside a document stay text', () => {
    const blocks = renderMarkdownBlocks('# T\n\n<script>alert(1)</script> and <b>bold</b>\n');
    const para = blocks.find((b) => b.kind === 'paragraph');
    expect(para.text).toContain('<script>alert(1)</script>');
    expect(para.text).toContain('<b>bold</b>');
  });

  it('keeps inline marks as their text and shows a link with its target in brackets', () => {
    expect(inlineText('**bold** and *em* and `code` and [DR-0719](DR-0719-x.md)')).toBe('bold and em and code and DR-0719 [DR-0719-x.md]');
  });

  it('handles code fences, quotes, rules and numbered lists', () => {
    const blocks = renderMarkdownBlocks('> a quote\n\n---\n\n1. one\n2. two\n\n```\ncd C:\\x\n```\n');
    expect(blocks.map((b) => b.kind)).toEqual(['quote', 'rule', 'list', 'code']);
    expect(blocks[2].ordered).toBe(true);
    expect(blocks[3].text).toBe('cd C:\\x');
  });
});

describe('the surface is registered where the stewards work, and says what it is', () => {
  it('the admin console carries a Documents panel that renders RepoDocuments', () => {
    const jsx = readFileSync(join(APP, 'components', 'AdminConsole.jsx'), 'utf8');
    expect(jsx).toContain("id: 'documents'");
    expect(jsx).toContain('<RepoDocuments />');
  });

  it('the surface never goes blank: a failed load names the path, and an empty search says what to do', () => {
    const jsx = readFileSync(join(APP, 'components', 'RepoDocuments.jsx'), 'utf8');
    expect(jsx).toContain('data-testid="repo-document-unreadable"');
    expect(jsx).toContain('Its location in the repository is');
    expect(jsx).toContain('No document in this group matches that search');
    expect(jsx).toContain('data-testid="repo-document-path"');
    expect(jsx).not.toContain('dangerouslySetInnerHTML');
  });
});

describe('a document is a static file fetched by its own path, never a module', () => {
  it('fetches /docs/<path>, refuses a path outside docs/, and reports a non-OK response plainly', async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      return { ok: true, status: 200, text: async () => '# Hello\r\n\r\nworld' };
    };
    const raw = await loadDocument('docs/decisions/DR-0001-x.md', { fetchImpl });
    expect(calls).toEqual(['/docs/decisions/DR-0001-x.md']);
    expect(raw).toBe('# Hello\n\nworld');
    await expect(loadDocument('../etc/passwd', { fetchImpl })).rejects.toThrow(/not a repository document/);
    await expect(loadDocument('docs/decisions/../../x.md', { fetchImpl })).rejects.toThrow(/not a repository document/);
    const missing = async () => ({ ok: false, status: 404, text: async () => '' });
    await expect(loadDocument('docs/decisions/DR-9999-x.md', { fetchImpl: missing })).rejects.toThrow(/HTTP 404/);
  });

  it('the build emits every document as a static file and holds the catalog once (vite.config + build-manifests)', () => {
    const vite = readFileSync(join(ROOT, 'app', 'vite.config.js'), 'utf8');
    expect(vite).toContain("name: 'poetech-repo-documents'");
    expect(vite).toContain("this.emitFile({ type: 'asset', fileName: rel, source });");
    expect(vite).toContain('__REPO_DOCS_DATA__: JSON.stringify(repoDocs)');
    const manifests = readFileSync(join(APP, 'lib', 'build-manifests.js'), 'utf8');
    expect(manifests).toContain('globalThis.__PT_REPO_DOCS = __REPO_DOCS_DATA__');
    const lib = readFileSync(join(APP, 'lib', 'repo-documents.js'), 'utf8');
    expect(lib).not.toContain('import.meta.glob');
  });
});
