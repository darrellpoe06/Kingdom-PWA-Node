// =============================================================================
// avatar-service — client for the SOVEREIGN likeness studio (infra/avatar-studio)
// =============================================================================
// The seam where a still portrait becomes a talking one. Sovereign only —
// there is deliberately NO vendor bridge for a person's likeness (DR-0430): a
// face is not sent to a vendor to be animated, ever. Until the studio is
// armed (VITE_AVATAR_SERVICE_URL), every call returns a tagged error and the
// Teacher panel shows the still portrait with an honest label.
//
// Contract (server.py): POST {base}/render { audio, portrait, person_key } -> video/mp4
//                        GET  {base}/health -> { ok, model, ready, why }
// Every call is null-safe and returns { error } instead of throwing.

function env(name) {
  try { const v = import.meta && import.meta.env && import.meta.env[name]; return typeof v === 'string' ? v.trim() : ''; }
  catch (_) { return ''; }
}

/** The sovereign likeness studio base URL, or ''. */
export function avatarServiceUrl() {
  return env('VITE_AVATAR_SERVICE_URL').replace(/\/+$/, '');
}

export function activeAvatarEndpoint() {
  const base = avatarServiceUrl();
  return base ? { url: `${base}/render`, health: `${base}/health`, kind: 'sovereign' } : null;
}

export function isAvatarServiceReady() { return !!activeAvatarEndpoint(); }

/** Ask the studio whether its model can serve now. Never throws. */
export async function probeAvatarHealth({ fetchImpl = (typeof fetch === 'function' ? fetch : null) } = {}) {
  const ep = activeAvatarEndpoint();
  if (!ep) return { ok: false, ready: false, why: 'avatar-service-not-configured' };
  if (!fetchImpl) return { ok: false, ready: false, why: 'no-fetch' };
  try {
    const res = await fetchImpl(ep.health);
    if (!res || !res.ok) return { ok: false, ready: false, why: `avatar-service-${res ? res.status : 'no-response'}` };
    const j = await res.json();
    return { ok: !!j.ok, ready: !!j.ready, model: j.model || null, why: j.why || '' };
  } catch (e) { return { ok: false, ready: false, why: (e && e.message) || 'avatar-service-error' }; }
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    try { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = () => reject(new Error('read-failed')); r.readAsDataURL(blob); }
    catch (e) { reject(e); }
  });
}

/**
 * Render a talking portrait. Returns { url } (an object URL for a <video>) or { error }.
 * @param {{ audioBlob: Blob, portraitBlob: Blob, personKey: string, signal?: AbortSignal, fetchImpl?: Function }} o
 */
export async function renderTalkingPortrait({ audioBlob, portraitBlob, personKey, signal, fetchImpl = (typeof fetch === 'function' ? fetch : null) } = {}) {
  const ep = activeAvatarEndpoint();
  if (!ep) return { error: 'avatar-service-not-configured' };
  if (!personKey) return { error: 'person-key-required' };
  if (!audioBlob || !audioBlob.size) return { error: 'no-audio' };
  if (!portraitBlob || !portraitBlob.size) return { error: 'no-portrait' };
  if (!fetchImpl) return { error: 'no-fetch' };
  try {
    const [audio, portrait] = await Promise.all([blobToDataUri(audioBlob), blobToDataUri(portraitBlob)]);
    const res = await fetchImpl(ep.url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio, portrait, person_key: personKey }), signal,
    });
    if (!res || !res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = j && j.error ? `:${j.error}` : ''; } catch (_) { /* not json */ }
      return { error: `avatar-service-${res ? res.status : 'no-response'}${detail}` };
    }
    const blob = await res.blob();
    if (!blob || !blob.size) return { error: 'avatar-service-empty' };
    return { url: URL.createObjectURL(blob), aiGenerated: (res.headers && res.headers.get && res.headers.get('X-AI-Generated')) || 'likeness' };
  } catch (e) { return { error: (e && e.message) || 'avatar-service-error' }; }
}
