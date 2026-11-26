// =============================================================================
// learn-link-preview -- a shared lesson link previews as THAT lesson: its picture and its title (DR-1673)
// =============================================================================
// Darrell 2026-11-26, after texting his wife a lesson link that previewed as the
// church's generic card: "can we send the image and lesson title as a marketing
// strategy and structural data collection for interest and understanding our
// stakeholders?" and "I want the photos to be able to promote and provide
// understanding of the information inside... short and sweet... the lessons
// titles do this anyway."
//
// A text app builds its preview from the page's tags WITHOUT running the app, so
// the one app page could only ever preview as the app. The house already solves
// this for a door (/moore: its own tags, then a refresh into the app). This is
// the same, per lesson: /l/<door>/?course=..&lesson=..&s=.. answers a tiny page
// whose tags are the lesson's approved cover and display title, and refreshes
// straight into the lesson with the SAME query -- so the share token still
// arrives and the open is still recorded (DR-0698). The app's own pages are not
// touched. Pure: the build, the Function and the tests all use these.
// =============================================================================

/** The doors a lesson link can open, by the key that rides in the preview path. */
export const PREVIEW_DOORS = Object.freeze({
  lovecorner: Object.freeze({ path: '/lovecorner/app/', brand: 'The Love Corner' }),
  poetech: Object.freeze({ path: '/poetech-app/', brand: 'PoeTech' }),
});

/** The compact index the build emits: lessonId -> [display title, cover path]. Only approved covers. */
export function buildPreviewIndex(records) {
  const out = {};
  for (const r of Array.isArray(records) ? records : []) {
    const src = r && r.image && typeof r.image.src === 'string' ? r.image.src : '';
    const title = r && (r.displayTitle || r.originalTitleAtApproval);
    if (!r || !r.lessonId || !src || !title || r.needsReview) continue;
    out[r.lessonId] = [String(title), src.replace(/^\/+/, '')];
  }
  return out;
}

/** The share link a person sends: the lesson's own link, through its preview page. Anything else is unchanged. */
export function lessonPreviewUrl(url) {
  const u = String(url || '');
  for (const [key, door] of Object.entries(PREVIEW_DOORS)) {
    const at = u.indexOf(`${door.path}?`);
    if (at >= 0 && /^(https?:\/\/[^/]+)?$/.test(u.slice(0, at))) return `${u.slice(0, at)}/l/${key}/${u.slice(at + door.path.length)}`;
  }
  return u;
}

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "Lesson 10" from "ll10-...", or '' (never a guess). */
export function lessonNumberLabel(lessonId) {
  const m = /^ll(\d+)-/.exec(String(lessonId || ''));
  return m ? `Lesson ${Number(m[1])}` : '';
}

/**
 * The preview page for one request. `door` is a PREVIEW_DOORS key; `search` the query as sent;
 * `entry` the index row or null. Returns { status, html, location }. Unknown door -> null.
 */
export function previewPage({ origin, door, search, entry }) {
  const d = PREVIEW_DOORS[door];
  if (!d) return null;
  const q = String(search || '');
  const target = `${d.path}${q.startsWith('?') ? q : q ? `?${q}` : ''}`;
  const lessonId = new URLSearchParams(q).get('lesson') || '';
  const title = entry ? entry[0] : d.brand;
  const line = [d.brand, entry ? lessonNumberLabel(lessonId) : ''].filter(Boolean).join(' · ');
  const image = entry ? `${origin}/${entry[1]}` : '';
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(line)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${esc(d.brand)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(line)}" />
<meta property="og:url" content="${esc(origin + target)}" />
${image ? `<meta property="og:image" content="${esc(image)}" />\n<meta property="og:image:type" content="image/webp" />\n<meta property="og:image:width" content="1280" />\n<meta property="og:image:height" content="720" />\n<meta property="og:image:alt" content="${esc(title)}" />\n<meta name="twitter:card" content="summary_large_image" />` : '<meta name="twitter:card" content="summary" />'}
<meta name="twitter:title" content="${esc(title)}" />
<meta name="robots" content="noindex" />
<meta http-equiv="refresh" content="0; url=${esc(target)}" />
<link rel="canonical" href="${esc(origin + target)}" />
</head><body style="background:#1A1815;color:#F5EFE4;font-family:Georgia,serif;padding:2rem">
<p><a style="color:#E7B23C" href="${esc(target)}">${esc(title)}</a></p>
</body></html>`;
  return { status: 200, html, location: target };
}
