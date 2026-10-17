// @vitest-environment jsdom
// =============================================================================
// Every document opens INSIDE the app (DR-1078). Darrell, 2026-10-16: "No one
// of the documents can be opened inside the PoeTech App.... why not!!!!" / "We
// are supposed to be a one place to see all types of documents".
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => readFileSync(join(SRC, p), 'utf8');

const PDF = vi.hoisted(() => ({ pages: 7 }));
vi.mock('../lib/document-viewer.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    // pdf.js cannot draw in jsdom; the viewer's page loop is what is under test.
    loadPdfjs: async () => ({
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: PDF.pages,
          getPage: async () => ({
            getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale }),
            render: () => ({ promise: Promise.resolve(), cancel: () => {} }),
          }),
          destroy: () => {},
        }),
      }),
    }),
  };
});

const lib = await import('../lib/document-viewer.js');
const {
  documentKind, extensionOf, urlSource, signFailureReason, viewerFailureText,
  signStorageDocument, fetchDocument, docxXmlToBlocks, readDocx, VIEWER_WAIT_MS,
} = lib;
const { default: DocumentViewer, normalizeResolved } = await import('../components/DocumentViewer.jsx');
const { zipStore } = await import('../lib/book-formats.js');

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DOCX_XML = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}"><w:body>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Order of Service</w:t></w:r></w:p>
  <w:p><w:r><w:t>Call to Worship</w:t></w:r><w:r><w:tab/><w:t>Pastor</w:t></w:r></w:p>
  <w:p/><w:p/>
  <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Hymn</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>No. 214</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
</w:body></w:document>`;

describe('what kind of document is this', () => {
  it('reads the content type first, then the name, then a data url', () => {
    expect(documentKind({ contentType: 'application/pdf' })).toBe('pdf');
    expect(documentKind({ contentType: 'image/jpeg; charset=binary' })).toBe('image');
    expect(documentKind({ contentType: 'text/plain' })).toBe('text');
    expect(documentKind({ contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe('docx');
    expect(documentKind({ contentType: 'application/msword' })).toBe('word-legacy');
    expect(documentKind({ contentType: 'application/octet-stream', name: 'team/09-29-2024 ANNOUNCEMENTS + ORDER.docx' })).toBe('docx');
    expect(documentKind({ url: 'https://x/storage/v1/object/sign/b/a%20b.PDF?token=1' })).toBe('pdf');
    expect(documentKind({ url: 'data:image/png;base64,AAAA' })).toBe('image');
    expect(documentKind({ name: 'mystery.bin' })).toBe('unknown');
    expect(extensionOf('a/b/c.Jpeg?x=1#y')).toBe('jpeg');
  });
  it('knows where a url lives', () => {
    expect(urlSource('data:application/pdf;base64,AA')).toBe('inline');
    expect(urlSource('https://poetech.us/sb/storage/v1/object/sign/church-team-documents/a.pdf?token=x')).toBe('storage');
    expect(urlSource('https://docs.google.com/document/d/1/edit')).toBe('external');
    expect(urlSource('')).toBe('none');
  });
});

describe('signing a storage path keeps the reason', () => {
  const client = (answer) => ({ storage: { from: (bucket) => ({ createSignedUrl: async (path, ttl) => answer(bucket, path, ttl) }) } });
  it('a missing object is named as not on the server, not as the person’s access', async () => {
    const r = await signStorageDocument('church-team-documents', 'team/a.pdf', { client: client(() => ({ data: null, error: { message: 'Object not found', statusCode: '404' } })) });
    expect(r).toMatchObject({ ok: false, reason: 'not-on-server' });
    expect(viewerFailureText('not-on-server', '“09-29-2024”')).toMatch(/listed, but the file itself is not on the church server/);
    expect(viewerFailureText('not-on-server')).not.toMatch(/your account may not have access/);
  });
  it('a refusal is named as access, a silence as a timeout, and a good answer is the url', async () => {
    expect(signFailureReason({ message: 'new row violates row-level security policy' })).toBe('no-access');
    expect(signFailureReason({ status: 403 })).toBe('no-access');
    const ok = await signStorageDocument('b', 'p.pdf', { client: client((b, p, ttl) => ({ data: { signedUrl: `https://s/storage/v1/object/sign/${b}/${p}?ttl=${ttl}` }, error: null })) });
    expect(ok).toEqual({ ok: true, url: 'https://s/storage/v1/object/sign/b/p.pdf?ttl=600' });
    vi.useFakeTimers();
    try {
      const p = signStorageDocument('b', 'p.pdf', { client: client(() => new Promise(() => {})), waitMs: 1000 });
      await vi.advanceTimersByTimeAsync(1001);
      expect(await p).toMatchObject({ ok: false, reason: 'timeout' });
    } finally { vi.useRealTimers(); }
    expect(VIEWER_WAIT_MS).toBe(15000);
  });
  it('an uploaded data url or an outside link passes through unsigned, and no path says so', async () => {
    const never = { storage: { from: () => { throw new Error('must not sign'); } } };
    expect(await signStorageDocument('b', 'data:image/png;base64,AA', { client: never })).toEqual({ ok: true, url: 'data:image/png;base64,AA' });
    expect(await signStorageDocument('b', 'https://example.org/x.pdf', { client: never })).toEqual({ ok: true, url: 'https://example.org/x.pdf' });
    expect(await signStorageDocument('b', '', { client: never })).toMatchObject({ ok: false, reason: 'no-file' });
  });
});

describe('fetching the bytes', () => {
  it('a 400 or 404 from storage is the missing file; 403 is access; a throw is the network', async () => {
    expect(await fetchDocument('u', { fetchImpl: async () => ({ ok: false, status: 400 }) })).toMatchObject({ ok: false, reason: 'not-on-server' });
    expect(await fetchDocument('u', { fetchImpl: async () => ({ ok: false, status: 403 }) })).toMatchObject({ ok: false, reason: 'no-access' });
    expect(await fetchDocument('u', { fetchImpl: async () => { throw new TypeError('offline'); } })).toMatchObject({ ok: false, reason: 'network' });
    const got = await fetchDocument('u', { fetchImpl: async () => new Response(new Blob(['hi'], { type: 'text/plain' }), { headers: { 'content-type': 'text/plain' } }) });
    expect(got.ok).toBe(true);
    expect(got.contentType).toBe('text/plain');
  });
});

describe('a Word file is read inside the app, with no new dependency', () => {
  it('turns document.xml into headings, paragraphs and table rows', () => {
    const blocks = docxXmlToBlocks(DOCX_XML);
    expect(blocks[0]).toEqual({ kind: 'h', text: 'Order of Service' });
    expect(blocks[1]).toEqual({ kind: 'p', text: 'Call to Worship\tPastor' });
    expect(blocks.filter((b) => !b.text.trim())).toHaveLength(1); // two empty paragraphs fold to one
    expect(blocks.at(-1)).toEqual({ kind: 'row', text: 'Hymn  |  No. 214' });
  });
  it('reads a real .docx archive through the app’s own zip reader', async () => {
    const bytes = zipStore([{ name: '[Content_Types].xml', data: '<Types/>' }, { name: 'word/document.xml', data: DOCX_XML }]);
    const blocks = await readDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    expect(blocks.map((b) => b.text)).toContain('Order of Service');
    expect(await readDocx(new TextEncoder().encode('not a zip').buffer)).toEqual([]);
  });
});

// --- the viewer on screen ----------------------------------------------------
let container; let root;
const realFetch = globalThis.fetch;
afterEach(() => {
  try { act(() => root.unmount()); } catch { /* noop */ }
  container?.remove();
  globalThis.fetch = realFetch;
});
async function show(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(DocumentViewer, { title: 'Order of Service', onClose: () => {}, ...props })); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
// The viewer is portalled to the page body by the shared Modal.
const q = (id) => document.body.querySelector(`[data-testid="${id}"]`);
// Serve bytes, not a jsdom Blob: Node's Response does not recognise jsdom's
// Blob class and would send the string "[object Blob]".
const serve = (body, type) => { globalThis.fetch = async () => new Response(body, { headers: { 'content-type': type } }); };
// jsdom has no canvas; pdf.js drawing is mocked, the element is what is counted.
HTMLCanvasElement.prototype.getContext = () => null;
if (typeof URL.createObjectURL !== 'function') URL.createObjectURL = () => 'blob:test';
if (typeof URL.revokeObjectURL !== 'function') URL.revokeObjectURL = () => {};

describe('the viewer shows each kind inside the app', () => {
  it('a missing file says it is not on the church server, and offers no dead buttons', async () => {
    await show({ resolve: async () => ({ ok: false, reason: 'not-on-server' }) });
    expect(q('document-viewer')).not.toBeNull();
    expect(q('viewer-failed').dataset.reason).toBe('not-on-server');
    expect(q('viewer-failed').textContent).toMatch(/not on the church server/);
    expect(q('viewer-ways')).toBeNull();
  });
  it('a picture is a picture', async () => {
    serve('x', 'image/png');
    await show({ resolve: async () => ({ ok: true, url: 'https://s/storage/v1/object/sign/b/a.png?t=1' }) });
    expect(q('viewer-image')).not.toBeNull();
    expect(q('viewer-save')).not.toBeNull();
    expect(q('viewer-new-tab').getAttribute('href')).toContain('/storage/v1/object/sign/b/a.png');
  });
  it('a text file is its text', async () => {
    serve('Rehearsal at 6.', 'text/plain');
    await show({ resolve: async () => 'https://s/storage/v1/object/sign/b/a.txt' });
    expect(q('viewer-text').textContent).toBe('Rehearsal at 6.');
  });
  it('a Word file is its paragraphs', async () => {
    const bytes = zipStore([{ name: 'word/document.xml', data: DOCX_XML }]);
    serve(bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    await show({ resolve: async () => ({ ok: true, url: 'https://s/storage/v1/object/sign/b/a.docx' }), name: 'a.docx' });
    expect(q('viewer-docx').textContent).toContain('Order of Service');
    expect(q('viewer-docx').querySelector('h3').textContent).toBe('Order of Service');
  });
  it('a PDF is pages, five at a time', async () => {
    PDF.pages = 7;
    serve('%PDF-1.4', 'application/pdf');
    await show({ resolve: async () => ({ ok: true, url: 'https://s/storage/v1/object/sign/b/a.pdf' }) });
    expect(q('viewer-pdf').dataset.pages).toBe('7');
    expect(q('viewer-pdf').querySelectorAll('canvas')).toHaveLength(5);
    await act(async () => { q('viewer-pdf-more').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(q('viewer-pdf').querySelectorAll('canvas')).toHaveLength(7);
    expect(q('viewer-pdf-more')).toBeNull();
  });
  it('an old .doc and a link to another site say so, with the ways out', async () => {
    serve('x', 'application/msword');
    await show({ resolve: async () => ({ ok: true, url: 'https://s/storage/v1/object/sign/b/a.doc' }) });
    expect(q('viewer-legacy')).not.toBeNull();
    expect(q('viewer-save')).not.toBeNull();
    act(() => root.unmount()); container.remove();
    globalThis.fetch = async () => { throw new Error('a link is never fetched'); };
    await show({ resolve: async () => ({ ok: true, url: 'https://docs.google.com/document/d/1/edit' }) });
    expect(q('viewer-link')).not.toBeNull();
    expect(q('viewer-new-tab').getAttribute('href')).toBe('https://docs.google.com/document/d/1/edit');
  });
  it('Close and Escape both close it', async () => {
    const onClose = vi.fn();
    await show({ resolve: async () => ({ ok: false, reason: 'timeout' }), onClose });
    const closeBtn = document.body.querySelector('[role="dialog"] button[aria-label="Close"]');
    expect(closeBtn).not.toBeNull();
    await act(async () => { closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it('normalizes every shape a shelf resolver returns', () => {
    expect(normalizeResolved('https://x')).toEqual({ ok: true, url: 'https://x' });
    expect(normalizeResolved(null)).toMatchObject({ ok: false });
    expect(normalizeResolved({ ok: false, reason: 'no-access' })).toEqual({ ok: false, reason: 'no-access' });
  });
});

describe('all five shelves open their documents inside the app', () => {
  const SHELVES = [
    ['components/Choir.jsx', 'TEAM_DOCS_BUCKET'],
    ['components/Pulpit.jsx', 'SERMON_DOCS_BUCKET'],
    ['components/ChurchMemberSpace.jsx', 'CHURCH_DOCS_BUCKET'],
    ['components/HouseholdSpace.jsx', 'FAMILY_DOCS_BUCKET'],
    ['components/Legal.jsx', 'LEGAL_DOCS_BUCKET'],
  ];
  it.each(SHELVES)('%s uses the in-app viewer and its own bucket', (file, bucket) => {
    const text = src(file);
    expect(text).toContain("import { useDocumentViewer } from './DocumentViewer.jsx'");
    expect(text).toContain(`signStorageDocument(${bucket}`);
    expect(text).toContain('{viewer.element}');
    expect(text).not.toContain('reserveTab(');
    expect(text).not.toMatch(/window\.open\(url/);
  });
  it('the viewer rides the shared dialog shell, portalled over the whole app', () => {
    const text = src('components/DocumentViewer.jsx');
    expect(text).toContain("import Modal from './Modal.jsx'");
    expect(text).toMatch(/<Modal open onClose=\{onClose\} label=\{title\} maxWidthClass="max-w-4xl">/);
    expect(src('components/Modal.jsx')).toMatch(/createPortal\(/);
    expect(src('components/Modal.jsx')).toMatch(/fixed inset-0 z-\[120\]/);
    expect(text).not.toMatch(/window\.(confirm|alert|prompt)/);
  });
});
