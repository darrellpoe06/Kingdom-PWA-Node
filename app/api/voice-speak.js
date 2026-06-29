// =============================================================================
// /api/voice-speak — the BRIDGE: XTTS-v2 few-shot voice clone via a GPU endpoint
// =============================================================================
// Same-origin Vercel function so the browser never sees the API token (token is
// server-side env). It runs XTTS-v2 on Replicate (a hosted GPU), conditioned on
// the person's RECORDED sample, and streams back audio in their own voice. This is
// the fastest path to "Darrell hears Darrell" — no waiting on the church studio.
//
// INERT BY DEFAULT: with no REPLICATE_API_TOKEN it returns 503, and the app falls
// back to the labeled browser stand-in (never silent). His-hand to turn it on:
//   1. Create a Replicate account, get an API token.
//   2. Set REPLICATE_API_TOKEN (Vercel project env, server-side).
//   3. Set VITE_VOICE_BRIDGE=1 (client env) so the Voice tab routes here.
// Optional: VOICE_REPLICATE_MODEL (default 'lucataco/xtts-v2') to pin a model.
//
// COST DISCIPLINE: pay-per-second on Replicate only when a clip is generated; a
// hard poll cap bounds any single request. Migrate to the sovereign 4070 studio
// (infra/voice-studio) to drop the per-call cost to zero — same app contract.
//
// SOVEREIGNTY NOTE (honest): the bridge sends text + the voice sample to Replicate
// (a third party) to produce the FIRST result fast. The destination is the local
// 4070 studio where nothing leaves the network. The bridge is the MVP rung, not
// the home (DATA-AS-EMPOWERMENT; sovereign-mesh dual-track).

const MODEL = process.env.VOICE_REPLICATE_MODEL || 'lucataco/xtts-v2';
const POLL_MS = 1500;
const MAX_POLLS = 40; // ~60s ceiling per request (bounded cost / no hang)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(503).json({ error: 'voice-bridge-not-configured' });

  let payload = req.body;
  if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch (_) { payload = {}; } }
  const text = (payload && String(payload.text || '').trim()) || '';
  const reference = payload && payload.reference_audio; // base64 data URI of the recorded sample
  const language = (payload && payload.language) || 'en';
  if (!text) return res.status(400).json({ error: 'text-required' });
  if (!reference) return res.status(400).json({ error: 'reference-required' });

  try {
    // Create a prediction by model slug (no version hash needed).
    const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { text, speaker: reference, language } }),
    });
    let pred = await create.json();
    if (!create.ok) return res.status(502).json({ error: 'bridge-create-failed', detail: pred && pred.detail });

    // Poll to completion, bounded.
    let polls = 0;
    while ((pred.status === 'starting' || pred.status === 'processing') && polls < MAX_POLLS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const get = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${token}` } });
      pred = await get.json();
      polls += 1;
    }
    if (pred.status !== 'succeeded') return res.status(504).json({ error: 'bridge-timeout-or-failed', status: pred.status });

    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (!out) return res.status(502).json({ error: 'bridge-no-output' });

    // Stream the generated audio back to the browser.
    const audio = await fetch(out);
    if (!audio.ok) return res.status(502).json({ error: 'bridge-fetch-output-failed' });
    const buf = Buffer.from(await audio.arrayBuffer());
    res.setHeader('Content-Type', audio.headers.get('content-type') || 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).json({ error: 'bridge-error', detail: (e && e.message) || String(e) });
  }
}
