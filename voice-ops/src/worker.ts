/**
 * PoeTech Voice Ops · Cloudflare Worker
 * Phase 1 — see docs/07-voice-ops/PHASE-1-VOICE-OPS.md
 *
 * Endpoints:
 *   POST /webhook/twilio/recording-complete      Twilio → voicemail recorded
 *   POST /webhook/twilio/transcription-complete  Twilio → transcript ready
 *   GET  /inbound                                 PWA  → list new+reviewed calls
 *   PATCH /inbound/:id                            PWA  → update status/notes/converted_to
 *
 * Auth:
 *   Twilio webhooks: validated by X-Twilio-Signature HMAC-SHA1 over POST body
 *   PWA: validated by Authorization: Bearer <PWA_API_TOKEN>
 *
 * Scope: Poe Properties + PoeTech only. TLC routes to a separate Phase 3
 * architecture (HIPAA boundary). Do NOT add TLC numbers to LINE_MAP without
 * re-reading the HIPAA section of the spec.
 */

interface Env {
  DB: D1Database;
  AUDIO: R2Bucket;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_ACCOUNT_SID: string;
  PWA_API_TOKEN: string;
}

// ----------------------------------------------------------------------------
// LINE_MAP: map Twilio "To" number to business line.
// EDIT THIS after buying the two numbers in Twilio Console (Phone Numbers → Buy).
// Format: E.164 (e.g., '+12175550000'). Use the exact strings Twilio sends.
// ----------------------------------------------------------------------------
const LINE_MAP: Record<string, string> = {
  '+12175551111': 'poe-properties',   // EDIT after buying Poe Properties number
  '+12175552222': 'poetech',          // EDIT after buying PoeTech number
};

// Allowed origins for CORS — add your Vercel preview/production URLs.
const ALLOWED_ORIGINS = [
  'https://kingdom-pwa-node.vercel.app',
  'https://poetech.us',
  'https://www.poetech.us',
  'http://localhost:5173',            // for local dev of the PWA
];

// ============================================================================
// Worker entry point
// ============================================================================
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) });

    try {
      // Twilio webhooks (signature-validated)
      if (req.method === 'POST' && url.pathname === '/webhook/twilio/recording-complete') {
        await assertTwilioSignature(req, env.TWILIO_AUTH_TOKEN, url.toString());
        return handleRecordingComplete(req, env);
      }
      if (req.method === 'POST' && url.pathname === '/webhook/twilio/transcription-complete') {
        await assertTwilioSignature(req, env.TWILIO_AUTH_TOKEN, url.toString());
        return handleTranscriptionComplete(req, env);
      }

      // PWA endpoints (bearer-token auth)
      const auth = req.headers.get('Authorization');
      if (auth !== `Bearer ${env.PWA_API_TOKEN}`) {
        return json({ error: 'unauthorized' }, 401, req);
      }

      if (req.method === 'GET' && url.pathname === '/inbound') {
        return handleListInbound(req, env);
      }
      if (req.method === 'PATCH' && url.pathname.startsWith('/inbound/')) {
        const id = url.pathname.split('/').pop()!;
        return handleUpdateInbound(req, env, id);
      }

      return json({ error: 'not found' }, 404, req);
    } catch (e: any) {
      console.error('Worker error:', e);
      return json({ error: e?.message || String(e) }, 500, req);
    }
  },
};

// ============================================================================
// Handlers
// ============================================================================

async function handleRecordingComplete(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const callSid       = form.get('CallSid') as string;
  const recordingUrl  = form.get('RecordingUrl') as string;
  const duration      = parseInt((form.get('RecordingDuration') as string) || '0');
  const caller        = form.get('From') as string;
  const callerCity    = form.get('FromCity') as string;
  const callerState   = form.get('FromState') as string;
  const to            = form.get('To') as string;

  const line = LINE_MAP[to] || 'unknown';
  const receivedAt = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO inbound_calls (id, line, caller_number, caller_city, caller_state,
                                recording_url, recording_duration_sec, received_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    ON CONFLICT(id) DO UPDATE SET
      recording_url = excluded.recording_url,
      recording_duration_sec = excluded.recording_duration_sec
  `).bind(callSid, line, caller, callerCity, callerState, recordingUrl, duration, receivedAt).run();

  // Archive audio to R2 (best-effort; non-fatal if it fails)
  try {
    const audioUrl = `${recordingUrl}.mp3`;
    const basic = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const audioResp = await fetch(audioUrl, { headers: { Authorization: `Basic ${basic}` } });
    if (audioResp.ok && audioResp.body) {
      const key = `${line}/${callSid}.mp3`;
      await env.AUDIO.put(key, audioResp.body, {
        httpMetadata: { contentType: 'audio/mpeg' },
      });
      await env.DB.prepare(`UPDATE inbound_calls SET recording_r2_key = ? WHERE id = ?`)
        .bind(key, callSid).run();
    } else {
      console.warn(`R2 archive: Twilio audio fetch returned ${audioResp.status}`);
    }
  } catch (e) {
    console.warn('R2 archive failed (non-fatal):', e);
  }

  await audit(env, 'twilio', 'recording-complete', callSid, { line, duration });
  return twimlOk();
}

async function handleTranscriptionComplete(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const callSid          = form.get('CallSid') as string;
  const transcript       = form.get('TranscriptionText') as string;
  const transcriptStatus = form.get('TranscriptionStatus') as string;

  await env.DB.prepare(`
    UPDATE inbound_calls SET transcript = ?, transcript_status = ? WHERE id = ?
  `).bind(transcript, transcriptStatus, callSid).run();

  await audit(env, 'twilio', 'transcription-complete', callSid, { transcriptStatus });
  return twimlOk();
}

async function handleListInbound(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status') || 'new,reviewed';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

  // Build IN clause safely — only allow alphanum + dash
  const allowed = new Set(['new', 'reviewed', 'converted', 'archived']);
  const statuses = statusParam.split(',').filter(s => allowed.has(s));
  if (statuses.length === 0) statuses.push('new');
  const placeholders = statuses.map(() => '?').join(',');

  const rows = await env.DB.prepare(
    `SELECT * FROM inbound_calls WHERE status IN (${placeholders}) ORDER BY received_at DESC LIMIT ?`
  ).bind(...statuses, limit).all();

  return json(rows.results, 200, req);
}

async function handleUpdateInbound(req: Request, env: Env, id: string): Promise<Response> {
  const body = await req.json() as Record<string, any>;
  const allowed = ['status', 'converted_to', 'converted_record_id', 'notes'];
  const updates: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (updates.length === 0) return json({ error: 'no updates provided' }, 400, req);

  updates.push('status_updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const result = await env.DB.prepare(
    `UPDATE inbound_calls SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  await audit(env, 'pwa', 'status-updated', id, body);
  return json({ ok: true, changes: result.meta?.changes ?? 0 }, 200, req);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate Twilio's X-Twilio-Signature header.
 * Algorithm: HMAC-SHA1(authToken, fullUrl + sortedParams)
 * docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
async function assertTwilioSignature(req: Request, authToken: string, url: string): Promise<void> {
  const signature = req.headers.get('X-Twilio-Signature');
  if (!signature) throw new Error('missing X-Twilio-Signature');

  const body = await req.clone().text();
  const params = new URLSearchParams(body);
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const data = url + sorted.map(([k, v]) => k + v).join('');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  if (expected !== signature) {
    console.warn(`Twilio sig mismatch. expected=${expected} got=${signature}`);
    throw new Error('invalid Twilio signature');
  }
}

async function audit(env: Env, actor: string, action: string, callId: string | null, payload: any) {
  try {
    await env.DB.prepare(
      `INSERT INTO audit_log (at, actor, action, call_id, payload) VALUES (?, ?, ?, ?, ?)`
    ).bind(new Date().toISOString(), actor, action, callId, JSON.stringify(payload)).run();
  } catch (e) {
    console.warn('audit log write failed (non-fatal):', e);
  }
}

function twimlOk(): Response {
  // Twilio expects a TwiML response from webhook calls; empty response is fine.
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data: any, status: number, req: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}
