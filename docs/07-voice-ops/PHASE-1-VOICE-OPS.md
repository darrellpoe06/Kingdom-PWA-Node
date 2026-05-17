# Phase 1 · Voice Ops — Voicemail Routing for Poe Properties & PoeTech

**Owner:** Darrell Poe
**Status:** Spec drafted, awaiting build start
**Scope:** Inbound voicemail capture + auto-transcription + delivery into the PoeTech PWA
**NOT in scope:** AI voice agent (Phase 2), TLC therapy line (Phase 3 — HIPAA architecture)
**Drafted:** 2026-05-17
**Companion to:** `docs/05-financial-os/MVP-1-TIMELINE.md`, `docs/05-financial-os/MVP-1-HARDENING-PLAN.md`

---

## 1. What this phase is and isn't

**Is:** Two business phone numbers (Poe Properties + PoeTech) that capture voicemails, auto-transcribe them, and surface them in a new `📞 Inbound` tab inside the PoeTech PWA. No AI yet. Just receptionist-style "leave a message after the beep" with the transcript and audio available in the system for review and one-click conversion to an incident / inquiry / project.

**Isn't:**
- **Not an AI voice agent.** The caller talks to voicemail, not to an LLM. Phase 2 adds AI.
- **Not TLC.** TLC's line stays on Christina's current phone + Acuity until Phase 3 brings a HIPAA-clean architecture (Twilio Enterprise BAA + Synology storage). PHI never crosses Cloudflare in this design.
- **Not a real-time call deflection / IVR.** Calls go straight to voicemail. If we later want "press 1 for X, press 2 for Y" routing, that adds in Phase 1.5.

## 2. Honest cost shape

| Item | Provider | Monthly |
|---|---|---|
| Worker API endpoints | Cloudflare | **$0** (free tier covers 100k req/day) |
| Database (D1) | Cloudflare | **$0** (free tier covers 5 GB / 5M reads / 100k writes per day) |
| Voicemail audio storage | Cloudflare R2 | **$0** (free tier covers 10 GB / 1M Class A ops) |
| 2 phone numbers | Twilio | **~$2.30** ($1.15 × 2) |
| Inbound minutes (assume 60 min/mo) | Twilio @ $0.0085/min | **~$0.50** |
| Auto-transcription (60 min/mo) | Twilio @ $0.05/min | **~$3.00** |
| **Phase 1 floor** | | **~$5.80/mo at light volume** |

Heavy month (5 hr/mo of voicemail): **~$20/mo**. Hard ceiling: a smart-growing volume might hit $40/mo before you'd want to upgrade to actual AI handling (Phase 2). Cost is all-Twilio; Cloudflare contributes $0 at this scale.

## 3. Architecture (one-page)

```
+----------+         +-----------+         +-------------------+         +------------+
| Caller   | ──call→ |  Twilio   | ──POST→ | Cloudflare Worker | ──INSERT→ |  D1 DB     |
| (phone)  |         |  Number   |         |  api.poetech.us   |          |  table:    |
+----------+         |  + Studio |         |  /webhook/twilio  |          |  inbound_  |
                     |  Flow     |         |  /inbound  (GET)  |          |  calls     |
                     +-----------+         |  /inbound/:id     |          +-----+------+
                          │                |    (PATCH)        |                │
                          │                +---------+---------+                │
                          │ stores audio              │                          │
                          ▼                          │ (also writes audio       │
                     +-----------+                   │  copy to R2 for          │
                     |  Twilio   |                   │  archival, optional)     │
                     |  Recording|                   ▼                          │
                     |  + STT    |             +-----------+                    │
                     +-----------+             |    R2     |                    │
                                               | (audio    |                    │
                                               |  archive) |                    │
                                               +-----------+                    │
                                                                                │
+--------------+                                                                │
| Poe Family   | ←─── poll (every 30s when open) ──── api.poetech.us/inbound ──┘
| PoeTech PWA  |
| 📞 Inbound   |
| tab          |
+--------------+
```

**Data flow:**

1. Customer calls Poe Properties or PoeTech number
2. Twilio Studio flow plays a greeting, records voicemail (max 3 min), sends it to transcription
3. Twilio POSTs both `recording-complete` and `transcription-complete` webhooks to Cloudflare Worker
4. Worker validates Twilio signature, parses payload, INSERTs into D1
5. PWA polls `/inbound` every 30s while the `📞 Inbound` tab is open
6. Family reviews voicemails in PWA, converts to incident / inquiry / project with one tap, marks handled (PATCH `/inbound/:id`)

## 4. Pre-flight checklist

Before starting the build:

- [ ] Cloudflare account exists and email verified (the earlier deploy work proved this)
- [ ] Twilio account exists (sign-up at twilio.com; takes 5 minutes; requires identity verification for trial-to-production)
- [ ] Domain `poetech.us` already pointed at Cloudflare (DNS managed in Cloudflare)
- [ ] Local laptop has `npm`, `git`, and a code editor (already true)
- [ ] You have a credit card ready to put on Twilio for the production tier (free trial only allows calls to verified numbers — production requires ~$20 prepaid balance to start)

If Twilio account doesn't exist, create it before Step 4 below.

## 5. Step 1 · Cloudflare Workers + D1 setup (~60 min)

### 5.1 Install Wrangler (Cloudflare's CLI)

```powershell
# From any folder
npm install -g wrangler
wrangler --version   # confirm install
wrangler login        # opens browser, log in to your Cloudflare account
```

### 5.2 Create the Worker project

Create a new repo (or a sibling folder to `Kingdom-PWA-Node`):

```powershell
cd C:\Users\dpoe
mkdir poetech-voice-ops
cd poetech-voice-ops
npm init -y
npm install --save-dev wrangler typescript @cloudflare/workers-types
```

Create `wrangler.toml`:

```toml
name = "poetech-voice-ops"
main = "src/worker.ts"
compatibility_date = "2026-05-01"

# Custom subdomain (set after first deploy via Cloudflare dashboard)
# routes = [{ pattern = "api.poetech.us/*", custom_domain = true }]

# Bind the D1 database (created in next step)
[[d1_databases]]
binding = "DB"
database_name = "poetech_voice"
database_id = "REPLACE_AFTER_CREATING_DB"

# Bind R2 bucket for audio archive (created in step 5.4)
[[r2_buckets]]
binding = "AUDIO"
bucket_name = "poetech-voice-audio"

# Secrets set via `wrangler secret put NAME` (not in this file)
# - TWILIO_AUTH_TOKEN (for validating Twilio webhook signatures)
# - PWA_API_TOKEN     (for PWA → Worker auth on GET/PATCH)
```

### 5.3 Create the D1 database

```powershell
wrangler d1 create poetech_voice
```

Output gives you a `database_id` — copy it into `wrangler.toml` replacing `REPLACE_AFTER_CREATING_DB`.

Then create the schema (`schema.sql` in your project root):

```sql
CREATE TABLE IF NOT EXISTS inbound_calls (
  id                       TEXT PRIMARY KEY,
  line                     TEXT NOT NULL,                -- 'poe-properties' | 'poetech'
  caller_number            TEXT,
  caller_city              TEXT,
  caller_state             TEXT,
  recording_url            TEXT,                          -- Twilio's URL (also archived to R2)
  recording_r2_key         TEXT,                          -- our R2 key for the archived copy
  recording_duration_sec   INTEGER,
  transcript               TEXT,
  transcript_status        TEXT,                          -- 'completed' | 'failed' | 'in-progress' | NULL
  received_at              TEXT NOT NULL,                 -- ISO timestamp
  status                   TEXT NOT NULL DEFAULT 'new',   -- 'new' | 'reviewed' | 'converted' | 'archived'
  status_updated_at        TEXT,
  converted_to             TEXT,                          -- 'incident' | 'inquiry' | 'project' | NULL
  converted_record_id      TEXT,                          -- ID of the record created in the PWA
  notes                    TEXT                           -- free-form follow-up notes
);

CREATE INDEX IF NOT EXISTS idx_inbound_line     ON inbound_calls(line);
CREATE INDEX IF NOT EXISTS idx_inbound_status   ON inbound_calls(status);
CREATE INDEX IF NOT EXISTS idx_inbound_received ON inbound_calls(received_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  at           TEXT NOT NULL,
  actor        TEXT NOT NULL,             -- 'twilio' | 'pwa' | 'worker' | 'system'
  action       TEXT NOT NULL,             -- 'webhook-received' | 'call-inserted' | 'status-updated' | etc.
  call_id      TEXT,
  payload      TEXT                       -- JSON snapshot of relevant data
);

CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at DESC);
```

Apply the schema to your D1 database:

```powershell
wrangler d1 execute poetech_voice --file=./schema.sql
```

### 5.4 Create the R2 bucket

```powershell
wrangler r2 bucket create poetech-voice-audio
```

### 5.5 Set Worker secrets

```powershell
# Twilio Auth Token (get from Twilio Console > Account > API keys & tokens)
wrangler secret put TWILIO_AUTH_TOKEN
# Paste your Twilio Auth Token when prompted, hit enter.

# A long random token the PWA will use to authenticate to the Worker
# Generate one: run `[guid]::NewGuid().ToString("N")` in PowerShell, twice, concatenate.
wrangler secret put PWA_API_TOKEN
# Paste the random string, hit enter.
```

Save the `PWA_API_TOKEN` value — you'll paste it into the PWA settings later.

## 6. Step 2 · The Worker code (`src/worker.ts`)

```typescript
/**
 * PoeTech Voice Ops Worker
 *
 * Three endpoints:
 *   POST /webhook/twilio/recording-complete      — Twilio sends after voicemail recorded
 *   POST /webhook/twilio/transcription-complete  — Twilio sends after transcript ready
 *   GET  /inbound                                 — PWA fetches the new+reviewed queue
 *   PATCH /inbound/:id                            — PWA updates status / notes / converted_to
 *
 * Auth:
 *   Twilio webhooks: validated by X-Twilio-Signature HMAC-SHA1 over POST body
 *   PWA: validated by Authorization: Bearer <PWA_API_TOKEN>
 */

interface Env {
  DB: D1Database;
  AUDIO: R2Bucket;
  TWILIO_AUTH_TOKEN: string;
  PWA_API_TOKEN: string;
}

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': 'https://kingdom-pwa-node.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    try {
      // ============ Twilio webhooks =============================================
      if (req.method === 'POST' && url.pathname === '/webhook/twilio/recording-complete') {
        await assertTwilioSignature(req, env.TWILIO_AUTH_TOKEN, url.toString());
        return handleRecordingComplete(req, env);
      }
      if (req.method === 'POST' && url.pathname === '/webhook/twilio/transcription-complete') {
        await assertTwilioSignature(req, env.TWILIO_AUTH_TOKEN, url.toString());
        return handleTranscriptionComplete(req, env);
      }

      // ============ PWA endpoints ===============================================
      const auth = req.headers.get('Authorization');
      if (auth !== `Bearer ${env.PWA_API_TOKEN}`) {
        return json({ error: 'unauthorized' }, 401);
      }

      if (req.method === 'GET' && url.pathname === '/inbound') {
        return handleListInbound(req, env);
      }
      if (req.method === 'PATCH' && url.pathname.startsWith('/inbound/')) {
        const id = url.pathname.split('/').pop()!;
        return handleUpdateInbound(req, env, id);
      }

      return json({ error: 'not found' }, 404);
    } catch (e: any) {
      console.error(e);
      return json({ error: e?.message || String(e) }, 500);
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

  const line = lineFromToNumber(to);
  const id = callSid; // use Twilio's CallSid as our primary key
  const receivedAt = new Date().toISOString();

  // Insert (or update if recording-complete fires twice)
  await env.DB.prepare(`
    INSERT INTO inbound_calls (id, line, caller_number, caller_city, caller_state,
                                recording_url, recording_duration_sec, received_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    ON CONFLICT(id) DO UPDATE SET
      recording_url = excluded.recording_url,
      recording_duration_sec = excluded.recording_duration_sec
  `).bind(id, line, caller, callerCity, callerState, recordingUrl, duration, receivedAt).run();

  // Archive the audio to R2 (best-effort - if it fails, the row still exists)
  try {
    const audioResp = await fetch(`${recordingUrl}.mp3`, {
      headers: { Authorization: 'Basic ' + btoa(`ACCOUNT_SID:${env.TWILIO_AUTH_TOKEN}`) },
      // NOTE: ACCOUNT_SID also needs to be a secret. Add via:
      //   wrangler secret put TWILIO_ACCOUNT_SID
      // And read it as env.TWILIO_ACCOUNT_SID here. Adjust binding accordingly.
    });
    if (audioResp.ok) {
      const key = `${line}/${id}.mp3`;
      await env.AUDIO.put(key, audioResp.body!, {
        httpMetadata: { contentType: 'audio/mpeg' },
      });
      await env.DB.prepare(`UPDATE inbound_calls SET recording_r2_key = ? WHERE id = ?`)
        .bind(key, id).run();
    }
  } catch (e) {
    console.warn('R2 archive failed (non-fatal):', e);
  }

  await audit(env, 'twilio', 'recording-complete', id, { duration, line });
  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' }, // Twilio expects TwiML response
  });
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
  return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
}

async function handleListInbound(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'new,reviewed';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const statuses = status.split(',').map(s => `'${s.replace(/'/g, '')}'`).join(',');

  const rows = await env.DB.prepare(`
    SELECT * FROM inbound_calls
    WHERE status IN (${statuses})
    ORDER BY received_at DESC
    LIMIT ?
  `).bind(limit).all();

  return json(rows.results, 200);
}

async function handleUpdateInbound(req: Request, env: Env, id: string): Promise<Response> {
  const body = await req.json() as any;
  const allowed = ['status', 'converted_to', 'converted_record_id', 'notes'];
  const updates: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (updates.length === 0) return json({ error: 'no updates provided' }, 400);

  updates.push('status_updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await env.DB.prepare(`UPDATE inbound_calls SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values).run();

  await audit(env, 'pwa', 'status-updated', id, body);
  return json({ ok: true }, 200);
}

// ============================================================================
// Helpers
// ============================================================================

function lineFromToNumber(to: string): string {
  // Map Twilio number → business line. UPDATE THESE after buying numbers.
  const map: Record<string, string> = {
    '+12175551111': 'poe-properties',
    '+12175552222': 'poetech',
  };
  return map[to] || 'unknown';
}

async function assertTwilioSignature(req: Request, authToken: string, url: string): Promise<void> {
  const signature = req.headers.get('X-Twilio-Signature');
  if (!signature) throw new Error('missing Twilio signature');

  const body = await req.clone().text();
  const params = new URLSearchParams(body);
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const data = url + sorted.map(([k, v]) => k + v).join('');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  if (expected !== signature) throw new Error('invalid Twilio signature');
}

async function audit(env: Env, actor: string, action: string, callId: string | null, payload: any) {
  await env.DB.prepare(
    `INSERT INTO audit_log (at, actor, action, call_id, payload) VALUES (?, ?, ?, ?, ?)`
  ).bind(new Date().toISOString(), actor, action, callId, JSON.stringify(payload)).run();
}

function json(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
```

Deploy:

```powershell
wrangler deploy
```

Output gives you a URL like `https://poetech-voice-ops.darrellpoe06.workers.dev`. Test:

```powershell
curl https://poetech-voice-ops.darrellpoe06.workers.dev/inbound -H "Authorization: Bearer YOUR_PWA_API_TOKEN"
# expect: []
```

### 6.1 Custom subdomain (optional, recommended)

In Cloudflare dashboard → Workers & Pages → poetech-voice-ops → Settings → Triggers → Custom Domains → Add Custom Domain → `api.poetech.us`. Cloudflare auto-creates the DNS record. Wait ~30 seconds. Now reachable at `https://api.poetech.us/...`.

## 7. Step 3 · Twilio setup (~30 min)

### 7.1 Buy two phone numbers

Twilio Console → Phone Numbers → Buy a Number → search Champaign IL area codes (217) → pick two. ~$1.15/mo each. Friendly-name them:

- Number 1: `PoeProperties-Main` (e.g., +1 217 555 1111)
- Number 2: `PoeTech-Main` (e.g., +1 217 555 2222)

**Update the Worker code** `lineFromToNumber()` map (line ~120 above) with the actual numbers you bought, then `wrangler deploy` again.

### 7.2 Build the Twilio Studio flow

Twilio Console → Studio → Create new Flow → "Start from scratch" → name `Voicemail-Capture-V1`. Drag-and-drop:

```
[Trigger: Incoming Call]
       │
       ▼
[Say/Play: "Thanks for calling Poe Properties. Please leave a brief message
            after the tone. We'll get back to you as soon as possible.
            Press any key when finished."]
       │
       ▼
[Record Voicemail]
   - max_length: 180 (3 min)
   - finish_on_key: any
   - transcribe: true
   - transcription_callback_url: https://api.poetech.us/webhook/twilio/transcription-complete
   - recording_status_callback_url: https://api.poetech.us/webhook/twilio/recording-complete
       │
       ▼
[Say: "Thanks. We've got your message. Goodbye."]
       │
       ▼
[Hangup]
```

Publish the flow. Then on each phone number (Phone Numbers → Manage → Active numbers → click each number):

- A Call Comes In: **Studio Flow** → `Voicemail-Capture-V1`
- Save.

**Critical: Make a second copy of the Studio flow for the PoeTech number** with the greeting changed to *"Thanks for calling PoeTech."* — same webhooks, same logic, different name. (Or use Twilio Flow variables; Studio supports that. Simpler to clone.)

### 7.3 Smoke test

Call one of your new numbers from your cell phone. Leave a short test message. Then in a separate browser:

```powershell
curl https://api.poetech.us/inbound -H "Authorization: Bearer YOUR_PWA_API_TOKEN"
```

You should see one row in the response. The `transcript` field may take 30-60 seconds to populate after the call ends; refetch.

If smoke test fails, check:

- Wrangler logs: `wrangler tail` (streams real-time Worker logs)
- Twilio debugger: Console → Monitor → Debugger (shows webhook delivery attempts + responses)
- D1 directly: `wrangler d1 execute poetech_voice --command="SELECT * FROM inbound_calls ORDER BY received_at DESC LIMIT 5"`

## 8. Step 4 · PWA `📞 Inbound` tab (~3 hr)

Build this in the existing `Kingdom-PWA-Node` repo on a new feature branch, then merge to main when ready.

### 8.1 Data shape (in the PWA)

Add to `SEED_DATA.meta`:

```javascript
voiceOps: {
  apiUrl: 'https://api.poetech.us',  // can override per-deploy
  apiToken: '',                        // user pastes the PWA_API_TOKEN here in Settings
  pollIntervalMs: 30000,
  enabled: false,                      // start disabled; user opts in
}
```

A new state slice in `PoeFinancialSystem`:

```javascript
const [inboundCalls, setInboundCalls] = useState([]);
const [inboundLastFetch, setInboundLastFetch] = useState(null);
const [inboundError, setInboundError] = useState('');
```

Fetcher (called every `pollIntervalMs` while `view === 'inbound'`):

```javascript
const fetchInbound = useCallback(async () => {
  const vo = data.meta?.voiceOps;
  if (!vo?.enabled || !vo?.apiUrl || !vo?.apiToken) return;
  try {
    const resp = await fetch(vo.apiUrl + '/inbound?status=new,reviewed', {
      headers: { Authorization: `Bearer ${vo.apiToken}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    setInboundCalls(await resp.json());
    setInboundLastFetch(new Date().toISOString());
    setInboundError('');
  } catch (e) {
    setInboundError(e.message);
  }
}, [data.meta?.voiceOps]);

useEffect(() => {
  if (view !== 'inbound') return;
  fetchInbound();
  const i = setInterval(fetchInbound, data.meta?.voiceOps?.pollIntervalMs || 30000);
  return () => clearInterval(i);
}, [view, fetchInbound]);
```

PATCH helper:

```javascript
const updateInbound = async (id, updates) => {
  const vo = data.meta?.voiceOps;
  await fetch(`${vo.apiUrl}/inbound/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vo.apiToken}` },
    body: JSON.stringify(updates),
  });
  fetchInbound();
};
```

### 8.2 Top-nav addition

Insert `['inbound', '📞 Inbound']` into the top nav between `'books'` and `'debts'`.

### 8.3 Inbound component

```jsx
function Inbound({ inboundCalls, inboundError, inboundLastFetch, updateInbound, addIncident, addInquiry, addProject, data }) {
  if (!data.meta?.voiceOps?.enabled) {
    return (
      <div className="bg-white border border-[#1A1815] p-5">
        <h2 className="text-xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>📞 Inbound voice ops</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Voice ops is disabled. To enable: open About → Settings, paste your Cloudflare Worker URL and API token, toggle on.
        </p>
      </div>
    );
  }

  const convertTo = (call, target) => {
    if (target === 'incident') {
      addIncident({ date: call.received_at.slice(0, 10), description: call.transcript || 'Voicemail (no transcript)', amount: 0, category: 'other', entityId: 'e-poeprops' });
    } else if (target === 'inquiry') {
      addInquiry({ firstName: 'From ' + (call.caller_number || 'unknown'), contactMethod: 'phone', phone: call.caller_number, notes: call.transcript || '', source: 'phone', interestArea: 'unsure', hasInsurance: 'unsure', preferredProvider: 'any', bestTimeToCall: 'anytime' });
    } else if (target === 'project') {
      addProject({ title: 'Inbound call · ' + (call.caller_number || ''), startDate: call.received_at.slice(0, 10), endDate: '', status: 'planning', domain: call.line === 'poe-properties' ? 'business-poeprops' : 'business-poetech', description: call.transcript || '', hoursPerWeek: 1, entityId: call.line === 'poe-properties' ? 'e-poeprops' : 'e-poetech', contractorIds: [], conversationLog: [] });
    }
    updateInbound(call.id, { status: 'converted', converted_to: target });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Voice Operations · Phase 1</div>
        <h2 className="text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Inbound voicemails · {inboundCalls.length}</h2>
        <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
          Voicemails from Poe Properties + PoeTech numbers. Auto-transcribed. Convert each one to an incident, an inquiry, or a project with one tap.
        </p>
        {inboundError && <div className="text-xs text-[#B85838] mt-2">⚠ {inboundError}</div>}
        {inboundLastFetch && <div className="text-[10px] text-[#5A5751] mt-1">Last fetch: {new Date(inboundLastFetch).toLocaleTimeString()}</div>}
      </section>

      {inboundCalls.length === 0 ? (
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <p className="text-sm text-[#5A5751] italic">No new voicemails.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inboundCalls.map(c => (
            <div key={c.id} className="bg-white border border-[#1A1815] p-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
                <div>
                  <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.line}</span>
                  <span className="text-xs text-[#5A5751] ml-2">from {c.caller_number || 'unknown'}</span>
                </div>
                <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {new Date(c.received_at).toLocaleString()} · {c.recording_duration_sec}s
                </div>
              </div>

              {c.recording_url && (
                <audio controls src={c.recording_url + '.mp3'} className="w-full mb-2" />
              )}

              <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-2">
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Transcript</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
                  {c.transcript || <em className="text-[#5A5751]">(transcript pending or unavailable)</em>}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => convertTo(c, 'incident')} className="text-[10px] uppercase tracking-wider px-3 py-1.5 bg-[#1A1815] text-white hover:bg-[#B85838]">→ Incident</button>
                <button onClick={() => convertTo(c, 'inquiry')} className="text-[10px] uppercase tracking-wider px-3 py-1.5 bg-[#1A1815] text-white hover:bg-[#B85838]">→ Inquiry</button>
                <button onClick={() => convertTo(c, 'project')} className="text-[10px] uppercase tracking-wider px-3 py-1.5 bg-[#1A1815] text-white hover:bg-[#B85838]">→ Project</button>
                <button onClick={() => updateInbound(c.id, { status: 'reviewed' })} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815]">Mark reviewed</button>
                <button onClick={() => { if (confirm('Archive this voicemail?')) updateInbound(c.id, { status: 'archived' }); }} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:text-[#B85838]">Archive</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8.4 Settings UI (on About tab)

Add a small *Voice Ops* config section to the existing About tab:

```jsx
<section className="bg-white border border-[#1A1815] p-5">
  <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">📞 Voice Ops · Settings</div>
  <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mt-2">Cloudflare Worker URL</label>
  <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="https://api.poetech.us" value={data.meta?.voiceOps?.apiUrl || ''} onChange={e => updateVoiceOps({ apiUrl: e.target.value })} />
  <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mt-2">API Token (from `wrangler secret put PWA_API_TOKEN`)</label>
  <input type="password" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="paste the token" value={data.meta?.voiceOps?.apiToken || ''} onChange={e => updateVoiceOps({ apiToken: e.target.value })} />
  <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer">
    <input type="checkbox" checked={!!data.meta?.voiceOps?.enabled} onChange={e => updateVoiceOps({ enabled: e.target.checked })} className="accent-[#B85838]" />
    <span>Enable inbound voice ops · 📞 Inbound tab appears in top nav</span>
  </label>
</section>
```

Wire `updateVoiceOps` as a callback that merges into `data.meta.voiceOps`. Disable the `📞 Inbound` tab entirely when `enabled` is false (the tab button doesn't render).

## 9. Step 5 · Cost monitoring (~30 min)

### 9.1 Twilio budget alert

Twilio Console → Account → Billing → Set Budget Alert at, say, $30/mo. You get an email when usage approaches that. Calls don't get cut off automatically, but you know to investigate.

### 9.2 Cost visibility in PWA

Add a small section on the Big Picture tab (only when voice ops enabled):

```jsx
{data.meta?.voiceOps?.enabled && (
  <div className="bg-white border border-[#E8E4DC] p-3 mb-3">
    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">📞 Voice ops this month</div>
    <div className="text-base" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
      {inboundCalls.length} voicemails · est. ~${Math.max(3, inboundCalls.length * 0.10).toFixed(2)}
    </div>
  </div>
)}
```

This is a rough client-side estimate (Twilio doesn't expose live billing easily). For accurate monthly numbers, the Twilio Usage dashboard is the source of truth.

## 10. HIPAA boundary (binding)

**TLC therapy line is NOT in Phase 1 scope.** Phase 1 routes Poe Properties and PoeTech voicemails through Cloudflare D1 + R2 — Cloudflare's free tier does not include a Business Associate Agreement (BAA), so PHI is forbidden on this infrastructure.

If someone leaves a voicemail on the Poe Properties or PoeTech numbers that contains incidental PHI (e.g., a tenant says *"I have a doctor's appointment, can you call me after 2pm"*), that's not Title-II-protected PHI under HIPAA because Poe Properties and PoeTech are not covered entities. No BAA needed for these lines.

The TLC line stays on Christina's current phone + Acuity intake. When we reach **Phase 3 · TLC Voice Ops**, the architecture will be:

- Separate Twilio sub-account with BAA in place
- Voicemail audio and transcripts written to **Synology Docker storage** (your hardware, you control the BAA conversation entirely — no third-party processor in the chain)
- Separate PWA route + auth scope so TLC data is never co-located with non-PHI in localStorage or D1
- Audit log of every access

That's a meaningful redesign and gets its own spec document when ready.

## 11. Verification checklist (after build)

- [ ] `wrangler tail` shows no errors during deploy
- [ ] D1 schema applied — `wrangler d1 execute poetech_voice --command="SELECT name FROM sqlite_master WHERE type='table'"` returns `inbound_calls`, `audit_log`
- [ ] R2 bucket exists — visible in Cloudflare dashboard → R2
- [ ] Custom domain `api.poetech.us` resolves and returns Worker response
- [ ] Twilio numbers configured to point at Studio flow
- [ ] Studio flow points at correct webhook URLs (recording-complete + transcription-complete)
- [ ] Smoke test call → message appears in `/inbound` GET within 60 seconds
- [ ] Transcript populates within additional 60 seconds
- [ ] R2 archive contains the `.mp3` file at the expected key
- [ ] Twilio signature validation works (try POSTing without signature → 500 error)
- [ ] PWA API token auth works (try GET without bearer → 401)
- [ ] PWA `📞 Inbound` tab shows the voicemail
- [ ] Audio playback works in PWA
- [ ] Convert-to-incident creates a real incident row in PWA
- [ ] Convert-to-inquiry creates a real inquiry on the Practice tab
- [ ] Convert-to-project creates a real project on the Projects tab
- [ ] Mark reviewed / archive updates the D1 row + removes from active list

## 12. Rollback procedure

If anything goes wrong and you need to shut Phase 1 down cleanly:

1. **Disable in PWA** (5 sec) — About → Voice Ops → uncheck "Enabled". The `📞 Inbound` tab disappears. No data loss, just pauses the polling.
2. **Pause Twilio numbers** (1 min) — Twilio Console → each number → set "A Call Comes In" to a TwiML Bin returning `<Response><Say>This line is temporarily out of service.</Say><Hangup/></Response>`. Callers get a polite message; no webhook fires.
3. **Stop Worker** (30 sec) — Cloudflare dashboard → Workers & Pages → poetech-voice-ops → Settings → toggle off, or just leave it running (it's free, no harm in idle Worker).
4. **Optional: release Twilio numbers** to stop the $2.30/mo charge — Twilio Console → Phone Numbers → Manage → Active → Release. Recovery means buying new numbers later, possibly different digits.

D1 data stays intact through any of the above — if you turn it back on, your voicemail history is still there.

## 13. Phase 1 → Phase 2 transition

Phase 2 (AI voice agent) reuses everything Phase 1 builds:

- Same Cloudflare D1 schema (just add an `ai_handled` boolean + `ai_intent` text column)
- Same R2 audio storage
- Same PWA `📞 Inbound` tab (with an "AI handled it" marker badge per row)
- Same Twilio numbers — just swap the Studio flow from "record voicemail" to "connect to Vapi/Retell agent webhook"

Phase 2 add-ons:
- Vapi or Retell account + per-minute billing setup (~$0.10-0.15/min)
- Agent prompts per line (Poe Properties intake, PoeTech consulting intake)
- Function-calling spec: the agent calls back to `/inbound/create-direct` to insert a structured inquiry directly (skipping the convert-to step)
- Phone-tree fallback to voicemail if AI doesn't understand

Phase 3 (TLC) is the bigger architectural shift — separate infrastructure entirely, lives in its own spec.

---

## 14. Decision points before build start

A few small decisions you'll want to lock in before opening Wrangler:

1. **Custom domain or default `*.workers.dev`?** Recommend custom `api.poetech.us` for cleaner Twilio webhook URLs and brand consistency.
2. **R2 audio archive on or off?** Default is on. Off saves ~$0/mo (Twilio holds the audio anyway) but loses long-term archive if Twilio rotates URLs. Recommend on.
3. **PWA polling interval?** Default 30 sec. Lower (10 sec) feels snappier but uses more requests; higher (60-120 sec) is cheaper. 30 sec is well under any limit.
4. **Voicemail max length?** Default 3 min. Long enough for a real message, short enough to avoid runaway transcription costs.
5. **Greeting copy per line — what should callers hear?** Drafted above; revise per your voice.

Make these choices, then start at Section 5.1. The whole Phase 1 build should land in 6-8 hours of focused work split across 1-2 sessions.

---

*End of Phase 1 spec. Phase 2 (AI voice agent) and Phase 3 (TLC HIPAA architecture) get their own documents when their respective decision moments arrive.*
