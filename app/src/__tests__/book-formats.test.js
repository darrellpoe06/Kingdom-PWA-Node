import { describe, it, expect } from 'vitest';
import { assembleBook } from '../lib/book-engine.js';
import {
  toMarkdown, bookToReaderHtml, bookToEpubBytes, epubFiles, zipStore, crc32,
} from '../lib/book-formats.js';

const resolver = (ref) => (ref === 'John 3:16'
  ? { text: 'For God so loved the world', version: 'KJV', ref } : null);

const book = assembleBook({
  title: 'Made Whole',
  subtitle: 'A reader',
  sources: [{
    id: 's1', kind: 'lesson', title: 'Chapter One', author: 'BG', intro: 'Intro line.',
    blocks: [
      { kind: 'text', text: 'Body paragraph one.' },
      { kind: 'scripture', ref: 'John 3:16' },
      { kind: 'note', label: 'Try it', text: 'Do it.' },
      { kind: 'list', items: ['a', 'b'] },
    ],
  }],
  scriptureResolver: resolver,
  nowIso: '2026-06-25T12:00:00Z',
});

describe('toMarkdown', () => {
  const md = toMarkdown(book);
  it('renders title, chapter, Scripture, attribution', () => {
    expect(md).toContain('# Made Whole');
    expect(md).toContain('## 1. Chapter One');
    expect(md).toContain('KJV — John 3:16');
    expect(md).toContain('Sources & attribution');
  });
});

describe('bookToReaderHtml', () => {
  const html = bookToReaderHtml(book);
  it('is a self-contained, well-formed HTML document', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');                 // styles embedded, no external dep
    expect(html).toContain('Made Whole');
    expect(html).toContain('class="scripture"');
    expect(html).toContain('For God so loved the world');
  });
  it('escapes content (no injection)', () => {
    const evil = assembleBook({
      title: 'X', sources: [{ id: 'e', kind: 'lesson', title: '<script>alert(1)</script>', blocks: [{ kind: 'text', text: 'ok' }] }],
      scriptureResolver: resolver,
    });
    const h = bookToReaderHtml(evil);
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).toContain('&lt;script&gt;');
  });
});

describe('crc32', () => {
  it('matches the standard check vector', () => {
    const bytes = new TextEncoder().encode('123456789');
    expect(crc32(bytes)).toBe(0xCBF43926);
  });
});

describe('zipStore + EPUB', () => {
  it('produces a valid ZIP (PK local-file signature first)', () => {
    const bytes = zipStore([{ name: 'a.txt', data: 'hello' }], { nowIso: '2026-06-25T00:00:00Z' });
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
    // ends with End Of Central Directory signature 0x06054b50 (little-endian)
    const tail = bytes.slice(bytes.length - 22, bytes.length - 18);
    expect(Array.from(tail)).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it('orders the EPUB files with mimetype first', () => {
    const files = epubFiles(book);
    expect(files[0].name).toBe('mimetype');
    expect(files[0].data).toBe('application/epub+zip');
    const names = files.map((f) => f.name);
    expect(names).toContain('META-INF/container.xml');
    expect(names).toContain('OEBPS/content.opf');
    expect(names).toContain('OEBPS/nav.xhtml');
    expect(names).toContain('OEBPS/chapter-1.xhtml');
  });

  it('emits real epub bytes containing the required parts', () => {
    const bytes = bookToEpubBytes(book);
    expect(bytes.length).toBeGreaterThan(100);
    const str = Buffer.from(bytes).toString('latin1');
    expect(str).toContain('application/epub+zip');
    expect(str).toContain('container.xml');
    expect(str).toContain('content.opf');
    expect(str).toContain('Made Whole');
  });
});
