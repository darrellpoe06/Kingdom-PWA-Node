import { describe, it, expect } from 'vitest';
import {
  assembleBook, bookIntegrityReport, bookStats, deepLinksFor,
  companionManifest, normalizeSource,
} from '../lib/book-engine.js';

// A controlled resolver so the test owns what "verbatim" means.
const resolver = (ref) => (ref === 'John 3:16'
  ? { text: 'For God so loved the world...', version: 'KJV', ref }
  : null);

const sources = [
  {
    id: 's1', kind: 'lesson', title: 'Made Whole', author: 'BG', intro: 'Big idea.',
    blocks: [
      { kind: 'text', text: 'The teaching body, faithfully arranged.' },
      { kind: 'scripture', ref: 'John 3:16' },
      { kind: 'list', items: ['benefit one', 'benefit two'] },
      { kind: 'note', label: 'Try it', text: 'Do the thing.' },
    ],
  },
  {
    id: 's2', kind: 'algorithm', title: 'Response over Circumstance',
    blocks: [{ kind: 'text', text: 'A pattern.' }, { kind: 'scripture', ref: 'Romans 8:28' }],
  },
];

describe('assembleBook', () => {
  const book = assembleBook({ title: 'A Book', sources, scriptureResolver: resolver, nowIso: '2026-06-25T00:00:00Z' });

  it('builds one chapter per source, numbered', () => {
    expect(book.chapters).toHaveLength(2);
    expect(book.chapters[0].number).toBe(1);
    expect(book.chapters[1].number).toBe(2);
  });

  it('resolves Scripture verbatim and flags the unresolved', () => {
    const ch1 = book.chapters[0].blocks.find((b) => b.kind === 'scripture');
    expect(ch1.resolved).toBe(true);
    expect(ch1.text).toContain('For God so loved');
    const ch2 = book.chapters[1].blocks.find((b) => b.kind === 'scripture');
    expect(ch2.resolved).toBe(false);
    expect(ch2.text).toBe('');
  });

  it('indexes Scripture across the whole book', () => {
    const refs = book.scriptureIndex.map((s) => s.ref);
    expect(refs).toContain('John 3:16');
    expect(refs).toContain('Romans 8:28');
  });

  it('keeps a source manifest for attribution', () => {
    expect(book.sourceManifest).toHaveLength(2);
    expect(book.sourceManifest[0].kind).toBe('lesson');
  });

  it('every chapter is traceable to a source (no orphan prose)', () => {
    book.chapters.forEach((c) => expect(c.sourceRef.id).toBeTruthy());
  });
});

describe('bookIntegrityReport', () => {
  it('passes when sourced + Scripture resolves', () => {
    const book = assembleBook({ title: 'OK', sources: [sources[0]], scriptureResolver: resolver });
    expect(book.integrity.ok).toBe(true);
    expect(book.integrity.fabricationFree).toBe(true);
  });

  it('fails (and lists) unresolved Scripture — never fakes it', () => {
    const book = assembleBook({ title: 'Bad', sources: [sources[1]], scriptureResolver: resolver });
    expect(book.integrity.ok).toBe(false);
    expect(book.integrity.unresolvedScripture).toContain('Romans 8:28');
  });

  it('fails an empty book', () => {
    const r = bookIntegrityReport({ title: 'x', chapters: [], scriptureIndex: [] });
    expect(r.ok).toBe(false);
  });
});

describe('stats + companion', () => {
  const book = assembleBook({ title: 'A', sources, scriptureResolver: resolver });

  it('counts words, chapters, scriptures', () => {
    const s = bookStats(book);
    expect(s.chapters).toBe(2);
    expect(s.words).toBeGreaterThan(0);
    expect(s.estReadingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('every chapter carries live deep-links into the app', () => {
    const links = deepLinksFor(sources[0]);
    expect(links.length).toBeGreaterThan(0);
    expect(links.some((l) => l.view)).toBe(true);
  });

  it('companion manifest points back to the in-app reader', () => {
    const m = companionManifest(book);
    expect(m.readerRoute.view).toBe('library');
    expect(m.chapters).toHaveLength(2);
  });
});

describe('normalizeSource', () => {
  it('drops empty blocks and de-dupes Scripture refs', () => {
    const s = normalizeSource({
      kind: 'lesson', title: 'T',
      blocks: [{ kind: 'text', text: '' }, { kind: 'scripture', ref: 'John 3:16' }],
      scriptureRefs: ['John 3:16'],
    });
    expect(s.blocks).toHaveLength(1);
    expect(s.scriptureRefs).toEqual(['John 3:16']);
  });
});
