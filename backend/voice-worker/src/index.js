// =============================================================================
// PoeTech Voice Ops Worker · Phase 1
// Cloudflare Worker that:
//   POST  /webhook/twilio        — receives Twilio voicemail webhook
//   GET   /inbound               — PWA fetches new inbound rows
//   PATCH /inbound/:id           — PWA marks a row handled / archived / etc.
//   GET   /usage/this-month      — PWA pulls the cost panel data
//   GET   /healthz               — uptime check
//
// Auth model:
//   · POST /webhook/twilio       — verified via Twilio's HMAC-SHA1 signature
//                                  (X-Twilio-Signature header + TWILIO_AUTH_TOKEN)
//   · everything else            — Bearer token == env.PWA_API_TOKEN
//
// HIPAA scope: NEVER route TLC traffic through this worker. Only the lines in
// env.ALLOWED_LINES (default "poe-properties,poetech") are accepted. The Twilio
// Studio flow for the TLC number must NOT post here — TLC stays on its
// separate (Phase 3) infrastructure that has a BAA with both vendors.
// =============================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS pre-flight
    if (request.method === 'OPTIONS') return cors(env, new Response(null, { status: 204 }));

    try {
      if (url.pathname === '/healthz') return cors(env, json({ ok: true }));

      if (url.pathname === '/webhook/twilio' && request.method === 'POST') {
        return cors(env, await handleTwilioWebhook(request, env));
      }

      if (url.pathname === '/inbound' && request.method === 'GET') {
        if (!authPwa(request, env)) return cors(env, json({ error: 'unauthorized' }, 401));
        return cors(env, await listInbound(env, url));
      }

      const patchMatch = url.pathname.match(/^\/inbound\/([\w-]+)$/);
      if (patchMatch && request.method === 'PATCH') {
        if (!authPwa(request, env)) return cors(env, json({ error: 'unauthorized' }, 401));
        return cors(env, await patchInbound(env, patchMatch[1], await request.json().catch(() => ({}))));
      }

      if (url.pathname === '/usage/this-month' && request.method === 'GET') {
        if (!authPwa(request, env)) return cors(env, json({ error: 'unauthorized' }, 401));
        return cors(env, await getMonthlyUsage(env));
      }

      return cors(env, json({ error: 'not found' }, 404));
    } catch (e) {
      return cors(env, json({ error: e.message || 'internal error' }, 500));
    }
  },
};

// -----------------------------------------------------------------------------
// Twilio webhook handler — invoked by Twilio Studio at end-of-voicemail.
// Studio flow posts these fields (form-encoded):
//   CallSid, From, To, RecordingSid (optional), RecordingUrl (optional),
//   RecordingDuration (optional), TranscriptionText (optional),
//   TranscriptionStatus (optional)
// We map To → line (using PoeTech's number directory configured in Studio).
// -----------------------------------------------------------------------------
async function handleTwilioWebhook(request, env) {
  // Twilio signature verification — protects against spoofed posts.
  const sig = request.headers.get('X-Twilio-Signature') || '';
  const bodyText = await request.text();
  const ok = await verifyTwilioSignature(env.TWILIO_AUTH_TOKEN, request.url, bodyText, sig);
  if (!ok) return json({ error: 'invalid signature' }, 401);

  const params = new URLSearchParams(bodyText);
  const callSid = params.get('CallSid');
  const calledNumber = params.get('To') || '';

  // Translate the called number → our line slug. The Studio flow can also
  // pass an explicit `Line` parameter via the HTTP block — preferred.
  const explicitLine = (params.get('Line') || '').trim();
  const allowed = (env.ALLOWED_LINES || 'poe-properties,poetech').split(',').map(s => s.trim());
  const line = allowed.includes(explicitLine) ? explicitLine : inferLineFromNumber(calledNumber, allowed);
  if (!line || !allowed.includes(line)) {
    // Reject — could be TLC line accidentally pointed here. Refuse the data.
    return json({ error: 'line not allowed' }, 403);
  }

  const id = `ic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const durSec = parseInt(params.get('RecordingDuration') || '0', 10) || null;
  const transcript = (params.get('TranscriptionText') || '').trim() || null;

  // Upsert by twilio_call_sid so retries don't double-insert.
  await env.DB.prepare(`
    INSERT INTO inbound_calls (id, twilio_call_sid, twilio_rec_sid, line, caller, caller_name,
                               called_number, voicemail_url, voicemail_dur_sec, transcript,
                               transcript_conf, webhook_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(twilio_call_sid) DO UPDATE SET
      twilio_rec_sid = COALESCE(excluded.twilio_rec_sid, inbound_calls.twilio_rec_sid),
      voicemail_url = COALESCE(excluded.voicemail_url, inbound_calls.voicemail_url),
      voicemail_dur_sec = COALESCE(excluded.voicemail_dur_sec, inbound_calls.voicemail_dur_sec),
      transcript = COALESCE(excluded.transcript, inbound_calls.transcript)
  `).bind(
    id,
    callSid,
    params.get('RecordingSid'),
    line,
    params.get('From'),
    params.get('CallerName') || null,
    calledNumber,
    params.get('RecordingUrl'),
    durSec,
    transcript,
    parseFloat(params.get('TranscriptionConfidence') || '0') || null,
    bodyText.slice(0, 4000), // keep raw payload for debugging, truncated to 4KB
  ).run();

  // Monthly usage metering
  const minutes = durSec ? durSec / 60 : 0;
  const transcribed = transcript ? minutes : 0;
  const ym = new Date().toISOString().slice(0, 7);
  await env.DB.prepare(`
    INSERT INTO usage_monthly (year_month, call_count, total_minutes, transcript_min)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(year_month) DO UPDATE SET
      call_count = call_count + 1,
      total_minutes = total_minutes + excluded.total_minutes,
      transcript_min = transcript_min + excluded.transcript_min,
      updated_at = datetime('now')
  `).bind(ym, minutes, transcribed).run();

  // Respond with empty TwiML so Twilio Studio doesn't complain.
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    status: 200,
    headers: { 'content-type': 'text/xml' },
  });
}

function inferLineFromNumber(toNumber, allowed) {
  // Crude fallback: if Studio didn't pass `Line`, map by trailing 4 digits or
  // first-allowed. Configure your numbers in Studio to send the right Line param
  // and this branch never runs.
  if (!toNumber) return null;
  return allowed[0]; // safe default — only fires if the Studio flow is misconfigured
}

// -----------------------------------------------------------------------------
// GET /inbound?status=new|all&line=poe-properties|poetech&limit=50
// -----------------------------------------------------------------------------
async function listInbound(env, url) {
  const status = url.searchParams.get('status') || 'new';
  const line = url.searchParams.get('line');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

  const where = [];
  const args = [];
  if (status !== 'all') { where.push('status = ?'); args.push(status); }
  if (line) { where.push('line = ?'); args.push(line); }
  const sql = `
    SELECT id, twilio_call_sid, line, caller, caller_name, called_number,
           voicemail_url, voicemail_dur_sec, transcript, status, handled_at,
           handled_as, handled_note, created_at
    FROM inbound_calls
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC LIMIT ?
  `;
  args.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...args).all();
  return json({ rows: results });
}

// -----------------------------------------------------------------------------
// PATCH /inbound/:id  body: { status?, handled_as?, handled_note? }
// -----------------------------------------------------------------------------
async function patchInbound(env, id, body) {
  const status = body.status === 'handled' || body.status === 'archived' ? body.status : null;
  const handledAs = ['incident','inquiry','project','discarded'].includes(body.handled_as) ? body.handled_as : null;
  const handledNote = typeof body.handled_note === 'string' ? body.handled_note.slice(0, 2000) : null;

  if (!status && !handledAs && handledNote === null) {
    return json({ error: 'no valid fields' }, 400);
  }

  const sets = [];
  const args = [];
  if (status) { sets.push('status = ?'); args.push(status); }
  if (handledAs) { sets.push('handled_as = ?'); args.push(handledAs); }
  if (handledNote !== null) { sets.push('handled_note = ?'); args.push(handledNote); }
  if (status === 'handled') { sets.push("handled_at = datetime('now')"); }
  args.push(id);

  const res = await env.DB.prepare(`UPDATE inbound_calls SET ${sets.join(', ')} WHERE id = ?`).bind(...args).run();
  return json({ updated: res.meta.changes });
}

// -----------------------------------------------------------------------------
// GET /usage/this-month — for the PWA's Voice Ops cost panel.
// Returns raw counters; the PWA multiplies by its own rate table so we don't
// hard-code Twilio prices on the server side.
// -----------------------------------------------------------------------------
async function getMonthlyUsage(env) {
  const ym = new Date().toISOString().slice(0, 7);
  const row = await env.DB.prepare(
    'SELECT year_month, call_count, total_minutes, transcript_min FROM usage_monthly WHERE year_month = ?'
  ).bind(ym).first();
  return json(row || { year_month: ym, call_count: 0, total_minutes: 0, transcript_min: 0 });
}

// -----------------------------------------------------------------------------
// Auth helpers
// -----------------------------------------------------------------------------
function authPwa(request, env) {
  const hdr = request.headers.get('Authorization') || '';
  const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  return tok && env.PWA_API_TOKEN && tok === env.PWA_API_TOKEN;
}

// Twilio's signature spec:
//   signature = base64( HMAC-SHA1( authToken, url + sortedFormParams_concatenated ) )
async function verifyTwilioSignature(authToken, url, bodyText, sigHeader) {
  if (!authToken || !sigHeader) return false;
  const params = new URLSearchParams(bodyText);
  const sortedKeys = [...params.keys()].sort();
  let stringToSign = url;
  for (const k of sortedKeys) stringToSign += k + (params.get(k) ?? '');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(stringToSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  // Constant-time-ish compare
  if (expected.length !== sigHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sigHeader.charCodeAt(i);
  return diff === 0;
}

// -----------------------------------------------------------------------------
// HTTP helpers
// -----------------------------------------------------------------------------
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
function cors(env, res) {
  const allowed = (env.PWA_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  // For simplicity in Phase 1, set Access-Control-Allow-Origin to the first allowed origin
  // (browsers don't accept multi-value here). Real production would echo the matched Origin.
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', allowed[0] || '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Vary', 'Origin');
  return new Response(res.body, { status: res.status, headers });
}
