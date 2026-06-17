// =============================================================================
// creation-workspace — the in-app document / image creation space
// =============================================================================
// "Can we create a document view/creation space — like a Word document -> an
// image file — a big area for working, with a click drop-down for workspace
// type." (Darrell, 2026-06-17.) This module holds the SOVEREIGN, dependency-free
// core of that surface:
//
//   1. WORKSPACE_TYPES — the extensible type config the dropdown reads. Adding a
//      new working mode later is a config entry here, NOT a component rewrite or
//      a schema migration (the DB `type` column is open text; see migration 0037).
//
//   2. Document -> image export, built on NATIVE browser APIs only — no html2canvas,
//      no html-to-image, no external service. We serialize the composed canvas into
//      an SVG <foreignObject>, rasterize it through a <canvas>, and hand back a
//      PNG/JPG blob. That is exactly the mechanism the popular libraries use under
//      the hood; doing it ourselves keeps us dependency-skeptical, self-hostable,
//      and fully OFFLINE (no font/asset fetch, no taint) — matching Darrell's
//      "open-source, just better ways" frame. The document font stack is
//      self-contained (system serif/sans) on purpose so export is pixel-stable
//      with nothing to download.
//
// The PURE pieces (type lookup, validation, filename, SVG string builder) are
// exported and unit-tested on their own; the browser-only rasterize/download glue
// is thin and guarded so it never throws in a non-DOM (test) environment.
// =============================================================================

// -----------------------------------------------------------------------------
// Workspace types — the dropdown's options. Extensible by config:
//   - key:         stable id stored in the DB `type` column
//   - label:       what the dropdown shows
//   - blurb:       one-line description under the option
//   - exportFormats: which image formats the export menu offers, in order
//   - page:        { width, height } CSS px of the working canvas (the artifact's
//                  natural size; also the export raster size before scale)
//   - fontStack:   the document's self-contained font (no external fetch)
//   - placeholder: empty-canvas hint text
// To add a type later (e.g. 'flyer', 'card'), append an entry here. Nothing else
// in the component or the database needs to change.
// -----------------------------------------------------------------------------
export const WORKSPACE_TYPES = [
  {
    key: 'document',
    label: 'Document',
    blurb: 'A rich-text page — like a Word document. Write, format, save, and export.',
    exportFormats: ['png'],
    page: { width: 816, height: 1056 }, // US Letter @ 96dpi (8.5in x 11in)
    fontStack: 'Georgia, "Times New Roman", serif',
    background: '#FFFFFF',
    placeholder: 'Start writing your document…',
  },
  {
    key: 'image',
    label: 'Image',
    blurb: 'Compose freely, then export the whole canvas as a PNG or JPG image file.',
    exportFormats: ['png', 'jpg'],
    page: { width: 1080, height: 1080 }, // square social/share tile
    fontStack: 'Georgia, "Times New Roman", serif',
    background: '#FAF8F4',
    placeholder: 'Compose your image — text, headings, lists. Then Export.',
  },
];

export const DEFAULT_WORKSPACE_TYPE = 'document';

/** Resolve a type record by key, falling back to the default for anything unknown. */
export function typeFor(key) {
  return WORKSPACE_TYPES.find((t) => t.key === key) || WORKSPACE_TYPES[0];
}

/** True when key names a real, configured workspace type. */
export function isValidWorkspaceType(key) {
  return WORKSPACE_TYPES.some((t) => t.key === key);
}

/** Image formats offered for a given type (defensive: always returns at least PNG). */
export function exportFormatsFor(key) {
  const t = typeFor(key);
  return Array.isArray(t.exportFormats) && t.exportFormats.length ? t.exportFormats : ['png'];
}

// -----------------------------------------------------------------------------
// Validation — keep persisted records well-formed. Title is required (a blank
// title makes the saved-document list unusable); type must be known.
// -----------------------------------------------------------------------------
export function validateWorkspace(ws) {
  const errs = [];
  if (!ws || typeof ws !== 'object') return ['Nothing to save.'];
  if (!ws.title || !String(ws.title).trim()) errs.push('A title is required.');
  if (!isValidWorkspaceType(ws.type)) errs.push('Pick a workspace type.');
  return errs;
}

/** A fresh, empty workspace draft for a given type. */
export function blankWorkspace(type = DEFAULT_WORKSPACE_TYPE) {
  const t = typeFor(type);
  return {
    type: t.key,
    title: 'Untitled',
    content: '',
    meta: { page: { ...t.page }, format: exportFormatsFor(t.key)[0] },
  };
}

// -----------------------------------------------------------------------------
// sanitizeHtml — defensive clean of the editor's HTML before it is persisted,
// re-rendered, or rasterized. The content comes from our own contenteditable
// (benign markup), and the table is family-internal behind RLS with no anon
// path — but unbreakable basics + the verification doctrine say strip the
// dangerous bits anyway, so a pasted <script>/onerror can never fire when the
// saved document is re-opened. Allowlist-free, focused removals; lightweight,
// no dependency. DOM path when available (correct), regex fallback otherwise.
// -----------------------------------------------------------------------------
const DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];

export function sanitizeHtml(html) {
  const src = typeof html === 'string' ? html : '';
  if (!src) return '';
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const host = document.createElement('div');
    host.innerHTML = src;
    host.querySelectorAll(DANGEROUS_TAGS.join(',')).forEach((el) => el.remove());
    // Strip event handlers and javascript: URLs from every remaining element.
    host.querySelectorAll('*').forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const val = String(attr.value || '');
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        else if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^\s*javascript:/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      }
    });
    return host.innerHTML;
  }
  // Non-DOM fallback (tests / SSR): regex strip the same dangerous surface.
  let out = src;
  for (const tag of DANGEROUS_TAGS) {
    out = out.replace(new RegExp(`<${tag}[\\s\\S]*?>[\\s\\S]*?</${tag}>`, 'gi'), '');
    out = out.replace(new RegExp(`<${tag}[^>]*/?>`, 'gi'), '');
  }
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/(href|src|xlink:href)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
  return out;
}

// -----------------------------------------------------------------------------
// exportFilename — a safe, descriptive download name. Slugs the title, suffixes
// the format. Never empty, never path-traversal, ASCII-safe.
// -----------------------------------------------------------------------------
export function exportFilename(title, format = 'png') {
  const ext = format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png';
  const base = String(title || 'workspace')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'workspace'}.${ext}`;
}

// -----------------------------------------------------------------------------
// XML escaping for the SVG wrapper attributes/text we control (NOT the document
// HTML — that is round-tripped through the XML serializer below).
// -----------------------------------------------------------------------------
export function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// -----------------------------------------------------------------------------
// buildExportSvg — PURE: assemble the SVG string that wraps the composed document
// HTML in a <foreignObject> so a <canvas> can rasterize it. `innerXhtml` must be
// well-formed XHTML (the rasterizer round-trips the live node through
// XMLSerializer to guarantee that); the rest is values we control and escape.
// Exported for unit testing of the exact markup the browser will rasterize.
// -----------------------------------------------------------------------------
export function buildExportSvg({ innerXhtml = '', width = 816, height = 1056, css = '', background = '#FFFFFF', padding = 48, fontStack = 'Georgia, serif' } = {}) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect x="0" y="0" width="${w}" height="${h}" fill="${escapeXml(background)}"/>` +
      `<foreignObject x="0" y="0" width="${w}" height="${h}">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;width:${w}px;min-height:${h}px;padding:${padding}px;font-family:${escapeXml(fontStack)};color:#1A1815;font-size:16px;line-height:1.5;overflow-wrap:break-word;word-wrap:break-word;">` +
          (css ? `<style>${css}</style>` : '') +
          innerXhtml +
        `</div>` +
      `</foreignObject>` +
    `</svg>`
  );
}

// Default document CSS embedded in the export so headings/lists render the same
// in the rasterized image as in the editor. Self-contained — no external fonts.
export const EXPORT_DOC_CSS =
  'h1{font-size:28px;font-weight:700;margin:0 0 12px;}' +
  'h2{font-size:22px;font-weight:700;margin:18px 0 8px;}' +
  'h3{font-size:18px;font-weight:700;margin:14px 0 6px;}' +
  'p{margin:0 0 10px;}' +
  'ul,ol{margin:0 0 10px 24px;padding:0;}' +
  'li{margin:0 0 4px;}' +
  'b,strong{font-weight:700;}i,em{font-style:italic;}' +
  'u{text-decoration:underline;}' +
  'a{color:#B85838;}' +
  'img{max-width:100%;height:auto;}';

/** SVG string -> data URL (UTF-8, base64-free so it stays human-debuggable). */
export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// -----------------------------------------------------------------------------
// serializeNodeToXhtml — BROWSER glue: take a live editor node and produce the
// well-formed XHTML string the foreignObject needs (self-closing <br>/<img>,
// quoted attrs). XMLSerializer on a cloned node is the correct, dependency-free
// way to get that. Returns '' if serialization isn't available.
// -----------------------------------------------------------------------------
export function serializeNodeToXhtml(node) {
  if (!node || typeof XMLSerializer === 'undefined') return '';
  try {
    const out = [];
    const serializer = new XMLSerializer();
    for (const child of Array.from(node.childNodes)) out.push(serializer.serializeToString(child));
    return out.join('');
  } catch (_) {
    return '';
  }
}

// -----------------------------------------------------------------------------
// rasterizeSvg — BROWSER glue: load an SVG data URL into an Image and draw it
// onto a canvas at `scale`, returning { blob, dataUrl }. Rejects on load error
// or an unavailable canvas so the caller can show a friendly failure.
// -----------------------------------------------------------------------------
export function rasterizeSvg(svg, { width, height, scale = 2, format = 'png', quality = 0.92 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      reject(new Error('Export needs a browser environment.'));
      return;
    }
    const mime = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        // JPEG has no alpha — paint white so transparent areas aren't black.
        if (mime === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL(mime, quality);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, dataUrl });
            else resolve({ blob: null, dataUrl }); // toBlob unsupported — dataUrl still downloads
          },
          mime,
          quality
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Could not render the document to an image.'));
    img.src = svgToDataUrl(svg);
  });
}

// -----------------------------------------------------------------------------
// exportNodeToImage — the one call the component makes: live editor node ->
// downloadable image. Composes the pure builders + browser glue above. Returns
// { blob, dataUrl, filename }.
// -----------------------------------------------------------------------------
export async function exportNodeToImage(node, { type = DEFAULT_WORKSPACE_TYPE, title = 'workspace', format, scale = 2 } = {}) {
  const t = typeFor(type);
  const fmt = format || exportFormatsFor(type)[0];
  const width = t.page.width;
  const height = t.page.height;
  const innerXhtml = sanitizeHtml(serializeNodeToXhtml(node));
  const svg = buildExportSvg({
    innerXhtml,
    width,
    height,
    css: EXPORT_DOC_CSS,
    background: t.background,
    fontStack: t.fontStack,
  });
  const { blob, dataUrl } = await rasterizeSvg(svg, { width, height, scale, format: fmt });
  return { blob, dataUrl, filename: exportFilename(title, fmt) };
}

// -----------------------------------------------------------------------------
// triggerDownload — BROWSER glue: save a blob (or data URL) under `filename`.
// Guarded for non-DOM. Uses an object URL when a blob is present (cheaper for
// large images), falling back to the data URL.
// -----------------------------------------------------------------------------
export function triggerDownload(blobOrDataUrl, filename) {
  if (typeof document === 'undefined') return false;
  const a = document.createElement('a');
  let url;
  let revoke = null;
  if (blobOrDataUrl && typeof blobOrDataUrl !== 'string' && typeof URL !== 'undefined' && URL.createObjectURL) {
    url = URL.createObjectURL(blobOrDataUrl);
    revoke = () => URL.revokeObjectURL(url);
  } else {
    url = blobOrDataUrl;
  }
  a.href = url;
  a.download = filename || 'workspace.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (revoke) setTimeout(revoke, 1000);
  return true;
}
