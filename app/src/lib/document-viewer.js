// =============================================================================
// document-viewer — every document opens INSIDE the app (DR-1076)
// =============================================================================
// Darrell, 2026-10-16, on Choir → Team Docs, after three OPENs in a row said
// "could not be opened": **"No one of the documents can be opened inside the
// PoeTech App.... why not!!!!????!!!! Fix it" / "We are supposed to be a one
// place to see all types of documents... make sense?!!!!!!!"**
//
// TWO FAULTS, and this module is the half that is the app's to fix:
//
//   1. Every OPEN left the app. DR-1062 made the tap reserve a browser tab and
//      send it to a signed url — a document was "opened" by sending the person
//      somewhere else, and an installed PWA on a phone does that badly or not at
//      all. Five shelves did it five ways (team docs, sermons, a member's own
//      papers, the household shelf, the legal shelf).
//   2. The bytes are not on the church server (DR-0317's private buckets: the
//      repoint moved the rows and not the files, and the copy is still waiting
//      on the hosted project's service key — measured again 2026-10-16 by
//      nas-storage-sync run 38957028955: "church-team-documents is PRIVATE and
//      cannot be read without HOSTED_SERVICE_ROLE_KEY - nothing copied").
//      That is not code; but the old message ("may have been removed, or your
//      account may not have access") blamed the person's account for it. The
//      storage answer is "Object not found", and now the screen says exactly
//      that: the file is listed but not on the server.
//
// SO: one viewer, opened in the app. It signs the storage path (keeping the
// reason when it cannot), fetches the bytes with a hard wait, and shows them
// by kind — a picture as a picture, a PDF as pages (pdf.js, already bundled and
// lazy-loaded the way books-intake-read loads it), a Word file as its text
// (word/document.xml through the app's own zip reader, no new dependency), a
// text file as text. Anything it cannot show inside the app (an old binary
// .doc, a link to another site) says so and offers the new-tab and save-a-copy
// ways out. Nothing is ever a silent nothing.
import { supabase } from './supabase.js';
import { unzipEntries, looksLikeZip } from './tv-time-import-zip.js';

export const VIEWER_WAIT_MS = 15000;
export const SIGNED_TTL_SECONDS = 600;

// --- what kind of document is this ------------------------------------------
const EXT_KIND = {
  pdf: 'pdf',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', heic: 'image', heif: 'image', bmp: 'image', svg: 'image',
  txt: 'text', md: 'text', csv: 'text',
  docx: 'docx',
  doc: 'word-legacy', rtf: 'word-legacy', pages: 'word-legacy',
};

/** The file extension of a url or name, lower-cased, without query or hash. */
export function extensionOf(s) {
  const clean = String(s || '').split(/[?#]/)[0];
  const last = decodeURIComponentSafe(clean.split('/').pop() || '');
  const m = /\.([a-z0-9]{1,5})$/i.exec(last);
  return m ? m[1].toLowerCase() : '';
}
function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch { return s; } }

/** Pure. The kind the viewer shows, from a content type first, then the name. */
export function documentKind({ contentType = '', name = '', url = '' } = {}) {
  const t = String(contentType || '').toLowerCase().split(';')[0].trim();
  if (t === 'application/pdf') return 'pdf';
  if (t.startsWith('image/')) return 'image';
  if (t === 'text/plain' || t === 'text/markdown' || t === 'text/csv') return 'text';
  if (t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (t === 'application/msword' || t === 'application/rtf' || t === 'text/rtf') return 'word-legacy';
  const fromName = EXT_KIND[extensionOf(name)] || EXT_KIND[extensionOf(url)];
  if (fromName) return fromName;
  if (/^data:/i.test(String(url))) {
    const m = /^data:([^;,]+)/i.exec(String(url));
    if (m) return documentKind({ contentType: m[1] });
  }
  return 'unknown';
}

/** Pure. Where a resolved url lives, which decides whether the app can read it. */
export function urlSource(url) {
  const u = String(url || '').trim();
  if (!u) return 'none';
  if (/^data:/i.test(u)) return 'inline';
  if (/^blob:/i.test(u)) return 'inline';
  if (/\/storage\/v1\/object\//.test(u)) return 'storage';
  if (/^https?:\/\//i.test(u)) return 'external';
  return 'none';
}

// --- signing a storage path, keeping the reason ------------------------------
/** Pure. Turn a storage error into the reason the screen states. */
export function signFailureReason(error) {
  if (!error) return 'unknown';
  const msg = String(error.message || error.error || error || '');
  const status = Number(error.statusCode || error.status || 0);
  if (/not.?found/i.test(msg) || status === 404) return 'not-on-server';
  if (/bucket/i.test(msg) && /not.?exist|not.?found/i.test(msg)) return 'not-on-server';
  if (/jwt|unauthori[sz]ed|permission|policy|row-level|denied/i.test(msg) || status === 401 || status === 403) return 'no-access';
  if (/timed? ?out/i.test(msg)) return 'timeout';
  return 'unknown';
}

function timed(promise, ms, what) {
  let t;
  const wait = new Promise((resolve) => { t = setTimeout(() => resolve({ timedOut: true, what }), ms); });
  return Promise.race([Promise.resolve(promise).finally(() => clearTimeout(t)), wait]);
}

/**
 * Sign a private storage object for the viewer. Returns { ok:true, url } or
 * { ok:false, reason, message } — never null, never a throw, never a hang.
 */
export async function signStorageDocument(bucket, path, { client = supabase, waitMs = VIEWER_WAIT_MS, ttl = SIGNED_TTL_SECONDS } = {}) {
  const p = String(path || '').trim();
  if (!p) return { ok: false, reason: 'no-file', message: 'No file is attached to this entry.' };
  if (urlSource(p) === 'inline' || urlSource(p) === 'external') return { ok: true, url: p };
  let res;
  try {
    res = await timed(client.storage.from(bucket).createSignedUrl(p, ttl), waitMs, 'signing');
  } catch (e) {
    return { ok: false, reason: 'unknown', message: String((e && e.message) || e) };
  }
  if (res && res.timedOut) return { ok: false, reason: 'timeout', message: `The church server did not answer within ${Math.round(waitMs / 1000)} seconds.` };
  const { data, error } = res || {};
  if (error || !data || !data.signedUrl) {
    return { ok: false, reason: signFailureReason(error), message: String((error && error.message) || 'no link came back') };
  }
  return { ok: true, url: data.signedUrl };
}

/** Pure. What the viewer says, in words, for each reason it could not show a file. */
export function viewerFailureText(reason, what = 'This document') {
  const W = `${what}`;
  switch (reason) {
    case 'not-on-server':
      return `${W} is listed, but the file itself is not on the church server. Files saved before the app moved to the church server have not all been copied over yet; until this one is, it cannot be opened here or anywhere. Nothing was changed.`;
    case 'no-access':
      return `${W} is on the server, but your sign-in was not allowed to read it. Sign out and back in; if it still will not open, the shelf's owner can check who may see it.`;
    case 'timeout':
      return `The church server did not answer within ${VIEWER_WAIT_MS / 1000} seconds. Nothing was changed. Try again in a moment.`;
    case 'network':
      return `${W} could not be fetched: the connection dropped. Nothing was changed. Try again in a moment.`;
    case 'no-file':
      return 'No file is attached to this entry.';
    default:
      return `${W} could not be opened. Nothing was changed.`;
  }
}

// --- fetching the bytes --------------------------------------------------------
/** Fetch a resolved url's bytes with a hard wait. Never throws. */
export async function fetchDocument(url, { fetchImpl = (typeof fetch === 'function' ? fetch : null), waitMs = VIEWER_WAIT_MS } = {}) {
  if (!fetchImpl) return { ok: false, reason: 'network' };
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = setTimeout(() => { if (ctrl) ctrl.abort(); }, waitMs);
  try {
    const res = await fetchImpl(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!res || !res.ok) {
      const status = res ? res.status : 0;
      return { ok: false, reason: status === 404 || status === 400 ? 'not-on-server' : status === 401 || status === 403 ? 'no-access' : 'unknown', status };
    }
    const blob = await res.blob();
    const contentType = (res.headers && res.headers.get && res.headers.get('content-type')) || blob.type || '';
    return { ok: true, blob, contentType };
  } catch (e) {
    return { ok: false, reason: e && e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(t);
  }
}

// --- Word (.docx) to readable blocks -----------------------------------------
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/** Pure (given a DOMParser). document.xml -> [{ kind: 'h'|'p'|'row', text }]. */
export function docxXmlToBlocks(xml, Parser = (typeof DOMParser === 'function' ? DOMParser : null)) {
  if (!xml || !Parser) return [];
  let doc;
  try { doc = new Parser().parseFromString(xml, 'application/xml'); } catch { return []; }
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0];
  if (!body) return [];
  const textOf = (el) => {
    let s = '';
    const walk = (n) => {
      for (const c of Array.from(n.childNodes || [])) {
        if (c.namespaceURI === W_NS && c.localName === 't') s += c.textContent || '';
        else if (c.namespaceURI === W_NS && c.localName === 'tab') s += '\t';
        else if (c.namespaceURI === W_NS && (c.localName === 'br' || c.localName === 'cr')) s += '\n';
        else walk(c);
      }
    };
    walk(el);
    return s;
  };
  const blocks = [];
  for (const node of Array.from(body.childNodes)) {
    if (node.namespaceURI !== W_NS) continue;
    if (node.localName === 'p') {
      const style = node.getElementsByTagNameNS(W_NS, 'pStyle')[0];
      const val = style ? (style.getAttributeNS(W_NS, 'val') || style.getAttribute('w:val') || '') : '';
      const text = textOf(node);
      blocks.push({ kind: /^(heading|title)/i.test(val) ? 'h' : 'p', text });
    } else if (node.localName === 'tbl') {
      for (const tr of Array.from(node.getElementsByTagNameNS(W_NS, 'tr'))) {
        const cells = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc')).map((tc) => textOf(tc).trim());
        blocks.push({ kind: 'row', text: cells.join('  |  ') });
      }
    }
  }
  // Keep paragraph breaks, but never a run of more than one empty paragraph.
  return blocks.filter((b, i, a) => b.text.trim() || (i > 0 && a[i - 1].text.trim()));
}

/** A .docx ArrayBuffer -> blocks, or [] when it is not a readable Word file. */
export async function readDocx(arrayBuffer) {
  if (!looksLikeZip(arrayBuffer)) return [];
  const files = await unzipEntries(arrayBuffer, new Set(['word/document.xml']));
  return docxXmlToBlocks(files['word/document.xml'] || '');
}

// --- pdf.js, lazy, the same way books-intake-read loads it --------------------
let pdfjsPromise = null;
export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/build/pdf.min.mjs'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    }).catch((e) => { pdfjsPromise = null; throw e; });
  }
  return pdfjsPromise;
}
