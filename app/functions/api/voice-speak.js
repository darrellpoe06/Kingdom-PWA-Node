// =============================================================================
// Cloudflare Pages Function — /api/voice-speak (XTTS-v2 voice-clone bridge)
// =============================================================================
// PORT OF app/api/voice-speak.js (the Vercel function) for the 2026-07-05
// Cloudflare Pages cutover. Same contract, same posture:
//
// INERT BY DEFAULT: with no REPLICATE_API_TOKEN it returns 503 and the app
// falls back to the labeled browser stand-in (never silent). His-hand to turn
// it on, CF edition: Cloudflare dashboard -> Pages -> poetech-app -> Settings
// -> Environment variables -> add REPLICATE_API_TOKEN (production, encrypted).
// (On Vercel this lived in the project env; Pages Functions read it from
// context.env instead of process.env.) VITE_VOICE_BRIDGE=1 still gates the
// client route, exactly as before.
//
// SOVEREIGNTY NOTE (unchanged, honest): the bridge sends text + the voice
// sample to Replicate (a third party) to produce the FIRST result fast. The
// destination is the local 4070 studio where nothing leaves the network.

const POLL_MS = 1500;
const MAX_POLLS = 40; // ~60s ceiling per request (bounded cost / no hang)

const json = (obj, status) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);
  const token = env.REPLICATE_API_TOKEN;
  if (!token) return json({ error: 'voice-bridge-not-configured' }, 503);

  const MODEL = env.VOICE_REPLICATE_MODEL || 'lucataco/xtts-v2';

  let payload = {};
  try { payload = await request.json(); } catch { payload = {}; }
  const text = String((payload && payload.text) || '').trim();
  const reference = payload && payload.reference_audio; // base64 data URI of the recorded sample
  const language = (payload && payload.language) || 'en';
  if (!text) return json({ error: 'text-required' }, 400);
  if (!reference) return json({ error: 'reference-required' }, 400);

  try {
    // Create a prediction by model slug (no version hash needed).
    const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { text, speaker: reference, language } }),
    });
    let pred = await create.json();
    if (!create.ok) return json({ error: 'bridge-create-failed', detail: pred && pred.detail }, 502);

    // Poll to completion, bounded.
    let polls = 0;
    while ((pred.status === 'starting' || pred.status === 'processing') && polls < MAX_POLLS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const get = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${token}` } });
      pred = await get.json();
      polls += 1;
    }
    if (pred.status !== 'succeeded') return json({ error: 'bridge-timeout-or-failed', status: pred.status }, 504);

    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (!out) return json({ error: 'bridge-no-output' }, 502);

    // Stream the generated audio back to the browser.
    const audio = await fetch(out);
    if (!audio.ok) return json({ error: 'bridge-fetch-output-failed' }, 502);
    return new Response(audio.body, {
      status: 200,
      headers: {
        'Content-Type': audio.headers.get('content-type') || 'audio/wav',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return json({ error: 'bridge-error', detail: (e && e.message) || String(e) }, 500);
  }
}
