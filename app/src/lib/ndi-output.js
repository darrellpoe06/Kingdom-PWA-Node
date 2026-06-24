// =============================================================================
// ndi-output — the NDI-ready PROGRAM OUTPUT contract (sovereign, church-LAN)
// =============================================================================
// Darrell flagged "NDI low hanging fruit": get the app's program content (lyrics,
// Scripture, lower-thirds, a holding slide) onto the COLG production switcher and
// the sanctuary screens over the LAN — IP video routing, no HDMI runs from a laptop.
//
// THE HONEST ENGINEERING REALITY (Verification Doctrine, DR-0076): a browser CANNOT
// emit an NDI stream directly — NDI is a native SDK (Vizrt/NewTek), there is no
// in-browser NDI encoder. So the low-effort, high-value win is NOT writing an
// encoder in the PWA. It is the standard, FREE, proven bridge:
//
//   PWA program-output URL  ->  OBS "Browser Source"  ->  DistroAV (obs-ndi) plugin
//                                                          publishes an NDI source
//   NDI source on the LAN   ->  any NDI receiver (NDI Studio Monitor / NDI-to-HDMI
//                               decoder / the production switcher / vMix)  ->  screen
//
// This module is the PURE, testable core the output route + the runbook share:
//   • the NDI SOURCE NAMING convention the media team picks in OBS / Studio Monitor,
//   • generic, serializable PROGRAM PAYLOAD builders (hold / scripture / lyric /
//     lower-third / slide) — decoupled from any curriculum, unlike teach-present's
//     class-only slides, so The Word, the choir songbook, or a class can all drive
//     the same wall through one contract,
//   • the same-origin OUTPUT URL helper a Browser Source points at,
//   • the LAN ROUTING MAP as DATA (cameras in, PWA in, receiver out) so the surface,
//     the runbook, and any future deploy describe the SAME thing,
//   • the honest browser-can't-emit-NDI note, stated plainly, never papered over.
//
// SOVEREIGN (the Charter): every hop is church-LAN, free tooling, no cloud, NO GPU.
// The NDI/CUDA generative pipeline (live speech -> A.I. image on the wall) stays the
// DEEP roadmap — GPU-gated (DR-0014), Node 2 switcher, forbidden during church hours.
// This is the part that ships WITHOUT the GPU box.
// =============================================================================

// A NEW BroadcastChannel, separate from teach-present's 'poe-teach-v1', so a live
// class on the projector and a program feed to the wall never cross-talk. A future
// in-app "program control" panel posts payloads here; the output route renders them.
export const PROGRAM_CHANNEL = 'poetech-program-v1';

// The NDI source names the media team selects in OBS (DistroAV output) and in any
// receiver (NDI Studio Monitor). Stable, human-readable, namespaced to POETECH so
// they never collide with camera or switcher sources on the LAN.
export const NDI_SOURCES = {
  program: 'POETECH (Program)',     // the full-frame program feed (lyrics / Scripture / slide)
  lowerThird: 'POETECH (Lower-Third)', // the keyed, transparent name/role bar
};

// Fixed broadcast frame. NDI program feeds are sized to the switcher's canvas; 1080p
// is the universal safe default (the COLG wall fits within one 4K output per
// video-wall-sync.pixelMath, so 1080p program content upscales cleanly). The output
// route letterboxes its content INSIDE this frame so type never reflows per window.
export const PROGRAM_FRAME = { width: 1920, height: 1080 };

// --- Program payload builders (pure, serializable; the output route renders these) -
// Every payload carries a `kind`; the renderer switches on it. `key:true` means the
// payload wants a transparent background for downstream keying (lower-thirds).

// A holding card — shown between songs / at the door, so the wall shows something
// intentional instead of a stale frame or a desktop.
export function holdProgram(title = 'The Church of the Living God') {
  return { kind: 'hold', title: String(title || '').trim() || 'The Church of the Living God' };
}

// A Scripture frame. text is fetched-not-from-memory upstream (SCRIPTURE-REFERENCE-
// STANDARD); this contract just carries what it was given. translation defaults blank.
export function scriptureProgram({ ref = '', text = '', translation = '' } = {}) {
  return {
    kind: 'scripture',
    ref: String(ref || '').trim(),
    text: String(text || '').trim(),
    translation: String(translation || '').trim(),
  };
}

// A lyric frame — a stanza on the wall. `lines` is an array of short lines (the
// renderer caps how many show). `ref`/`title` are optional song attribution.
export function lyricProgram({ title = '', lines = [], ref = '' } = {}) {
  const clean = (Array.isArray(lines) ? lines : [])
    .map((l) => String(l == null ? '' : l).trim())
    .filter(Boolean);
  return { kind: 'lyric', title: String(title || '').trim(), lines: clean, ref: String(ref || '').trim() };
}

// A lower-third — a keyed name/role bar (speaker, song leader). Defaults to keyed
// (transparent) so the switcher composites it over the live camera.
export function lowerThird({ name = '', role = '', key = true } = {}) {
  return {
    kind: 'lower-third',
    name: String(name || '').trim(),
    role: String(role || '').trim(),
    key: key !== false,
  };
}

// A generic slide — the catch-all envelope. A future bridge can map a teach-present
// slide or a One-Voice item onto this without this module importing those lanes.
export function slideProgram({ eyebrow = '', title = '', body = '', ref = '' } = {}) {
  return {
    kind: 'slide',
    eyebrow: String(eyebrow || '').trim(),
    title: String(title || '').trim(),
    body: String(body || '').trim(),
    ref: String(ref || '').trim(),
  };
}

// A full-bleed IMAGE — sermon graphic, worship background, announcement art. On the
// 1.9 mm sanctuary wall (NovaStar VX1000, ~1920x1440 native, see lib/display-targets)
// every pixel shows, so the renderer displays the image at native quality and the
// authoring rule is: feed a HIGH-RES source (>= the wall native res); never upscale a
// small asset. `fit` is 'contain' (whole image, letterboxed — default, no crop) or
// 'cover' (fill, may crop). `caption` is optional overlay text.
export function imageProgram({ src = '', fit = 'contain', caption = '', alt = '' } = {}) {
  const f = fit === 'cover' ? 'cover' : 'contain';
  return {
    kind: 'image',
    src: String(src || '').trim(),
    fit: f,
    caption: String(caption || '').trim(),
    alt: String(alt || caption || '').trim(),
  };
}

// Turn URL params INTO a payload, so the output route is useful STANDALONE the
// moment it ships — the media team opens a Browser Source at e.g.
//   ?output=1&kind=scripture&ref=John%203:16&text=For%20God%20so%20loved...
// and it renders, with no in-app sender built yet. Pure + testable. Unknown/empty
// kind falls back to a hold so the wall is never blank-by-accident.
export function parseOutputParams(params) {
  const get = (k) => {
    if (!params) return '';
    if (typeof params.get === 'function') return params.get(k) || '';
    return params[k] || '';
  };
  const kind = (get('kind') || '').toLowerCase();
  switch (kind) {
    case 'scripture':
      return scriptureProgram({ ref: get('ref'), text: get('text'), translation: get('translation') });
    case 'lyric':
      return lyricProgram({ title: get('title'), ref: get('ref'), lines: (get('lines') || '').split('|') });
    case 'lower-third':
    case 'lowerthird':
      return lowerThird({ name: get('name'), role: get('role'), key: get('key') !== '0' });
    case 'slide':
      return slideProgram({ eyebrow: get('eyebrow'), title: get('title'), body: get('body'), ref: get('ref') });
    case 'image':
      return imageProgram({ src: get('src'), fit: get('fit'), caption: get('caption'), alt: get('alt') });
    case 'hold':
      return holdProgram(get('title'));
    default:
      return get('title') ? holdProgram(get('title')) : null;
  }
}

// Is this payload requesting a transparent (keyable) background? Lower-thirds default
// keyed; everything else is solid. The route also honors an explicit ?key=1 override.
export function wantsKey(payload, override = false) {
  if (override === true) return true;
  return !!(payload && payload.kind === 'lower-third' && payload.key !== false);
}

// Build the same-origin OUTPUT URL an OBS Browser Source points at. `base` is the
// app origin+path (e.g. https://poetech.tail5a2f35.ts.net:8443/poetech-app/). Keeps
// same-origin so it rides the existing Caddy/Funnel host — no new exposure.
export function programOutputUrl(base = '', { key = false, kind = '', extra = {} } = {}) {
  const root = String(base || '').replace(/\?.*$/, '').replace(/\/+$/, '');
  const qs = new URLSearchParams({ output: '1' });
  if (key) qs.set('key', '1');
  if (kind) qs.set('kind', kind);
  for (const [k, v] of Object.entries(extra || {})) if (v != null && v !== '') qs.set(k, String(v));
  return `${root}/?${qs.toString()}`;
}

// --- The LAN routing map, as DATA -------------------------------------------------
// Cameras IN, the PWA program IN, the receiver OUT — every hop named with the FREE
// tool that carries it, all church-LAN, all sovereign, NONE requiring the GPU box.
// The runbook renders from this so the doc and the contract never drift.
export const NDI_ROUTING = {
  sovereign: true,
  lan: true,
  gpu: false, // explicitly: this LHF needs NO GPU. CUDA is the deeper roadmap only.
  // Browsers can't speak NDI; this is the free bridge that makes the PWA an NDI source.
  bridge: 'OBS Studio + DistroAV (obs-ndi) — both free, run on any church-LAN PC.',
  hops: [
    {
      id: 'camera-in',
      label: 'Cameras / production -> NDI',
      how: 'An NDI-native camera, or any camera through an NDI encoder / OBS, publishes a source on the LAN.',
      tool: 'OBS Studio + DistroAV (free), or an NDI-capable camera/encoder',
      cost: 'free (software) / existing hardware',
    },
    {
      id: 'pwa-in',
      label: 'PWA program -> NDI source',
      how: 'Add the app output URL ( ?output=1 ) as a Browser Source in OBS; DistroAV publishes it as the named NDI source.',
      tool: 'OBS Browser Source + DistroAV output named "' + NDI_SOURCES.program + '"',
      cost: 'free',
    },
    {
      id: 'receiver-out',
      label: 'NDI source -> sanctuary screen',
      how: 'Any NDI receiver subscribes to the named source and drives a display — no SDI/HDMI run from the booth.',
      tool: 'NDI Studio Monitor (free), an NDI-to-HDMI decoder, the switcher, or vMix',
      cost: 'free (Studio Monitor) / low (hardware decoder)',
    },
  ],
  tools: [
    { name: 'NDI Tools', vendor: 'Vizrt/NDI', cost: 'free', url: 'https://ndi.video/tools/', use: 'Studio Monitor (view/drive a screen), Screen Capture, Test Patterns.' },
    { name: 'DistroAV (obs-ndi)', vendor: 'open source', cost: 'free', url: 'https://github.com/DistroAV/DistroAV', use: 'OBS plugin: NDI output (publish a source) + NDI source (ingest).' },
    { name: 'OBS Studio', vendor: 'open source', cost: 'free', url: 'https://obsproject.com/', use: 'Browser Source ingests the PWA output; scenes/switching; already in the Node 1/2 architecture.' },
  ],
};

// The plain-language honest note the surface and runbook must show — NEVER imply the
// browser emits NDI on its own. The bridge IS the design, not a workaround.
export const NDI_BROWSER_NOTE =
  'A web browser cannot send NDI by itself — NDI is a native protocol. The free, ' +
  'proven bridge is OBS Studio with the DistroAV (obs-ndi) plugin: it ingests this ' +
  'page as a Browser Source and publishes it as an NDI source on the church LAN. ' +
  'No GPU box is required for this — the CUDA media pipeline is a separate, deeper roadmap.';
