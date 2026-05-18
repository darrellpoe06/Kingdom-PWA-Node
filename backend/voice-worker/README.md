# PoeTech Voice Ops · Phase 1 Backend

Cloudflare Worker that receives Twilio voicemail webhooks from the **Poe Properties** and **PoeTech** business lines, stores them in D1, and serves the PWA's **📞 Inbound** tab.

> **HIPAA boundary:** TLC Therapy Solutions is *not* routed here. TLC stays on Christina's separate phone + Acuity setup until the Phase 3 stack ships with a BAA-covered vendor chain (separate Twilio sub-account → Synology Docker for storage). Voicemails on the TLC line almost always contain PHI; routing them through this Worker would create a HIPAA violation since neither Twilio's standard tier nor Cloudflare's free tier has a BAA.

## What this Worker exposes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/webhook/twilio` | POST | Twilio HMAC signature | Twilio Studio posts here at end of each voicemail |
| `/inbound?status=new&line=poe-properties&limit=50` | GET | Bearer `PWA_API_TOKEN` | PWA fetches new voicemails |
| `/inbound/:id` | PATCH | Bearer `PWA_API_TOKEN` | PWA marks a row handled / archived |
| `/usage/this-month` | GET | Bearer `PWA_API_TOKEN` | PWA pulls counters for the Voice Ops cost panel |
| `/healthz` | GET | none | uptime check |

## Cost shape (real numbers)

| Item | Provider | Phase 1 monthly |
|---|---|---|
| Worker requests + CPU | Cloudflare | **$0** (free tier covers ~3000× your expected volume) |
| D1 database | Cloudflare | **$0** (5 GB free; you'll use ~50 MB in years) |
| 2 phone numbers (Poe Properties + PoeTech) | Twilio | $2.30 |
| Inbound minutes | Twilio @ $0.0085/min | $1–3 at light volume |
| Auto-transcription | Twilio @ $0.05/min | $3–8 at light volume |
| **Floor** | | **~$6–13/mo** |

No surprise costs. Both free tiers are well above what a family + 3-small-business setup hits.

---

## Deploy runbook (one-time, ~1 hour)

### 1. Install Wrangler + log in

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node\backend\voice-worker
npm install
npx wrangler login
```

A browser opens — sign in with your Cloudflare account (free signup at cloudflare.com if you don't have one).

### 2. Create the D1 database

```powershell
npx wrangler d1 create poetech_voice_ops
```

Output will include a line like:

```
[[d1_databases]]
binding = "DB"
database_name = "poetech_voice_ops"
database_id = "abc12345-..."
```

Open `wrangler.toml` and replace `REPLACE_WITH_ID_FROM_WRANGLER_D1_CREATE` with that `database_id`.

### 3. Apply the schema

```powershell
npx wrangler d1 execute poetech_voice_ops --remote --file=migrations/0001_init.sql
```

### 4. Set secrets (never committed)

```powershell
# 4a. Your Twilio Account Auth Token (Twilio console → Account → API keys & tokens)
npx wrangler secret put TWILIO_AUTH_TOKEN

# 4b. Generate a strong random token the PWA will use to authenticate.
# In PowerShell:
[Convert]::ToBase64String((1..32 | %{[byte](Get-Random -Min 0 -Max 256)}))
# Copy the output, then:
npx wrangler secret put PWA_API_TOKEN
# Paste the same string. SAVE this string — you'll paste it into the PWA Inbound tab config.
```

### 5. Deploy

```powershell
npx wrangler deploy
```

Wrangler prints the live URL, something like `https://poetech-voice-ops.YOUR-SUBDOMAIN.workers.dev`. Test it:

```powershell
curl https://poetech-voice-ops.YOUR-SUBDOMAIN.workers.dev/healthz
# Expect: {"ok":true}
```

### 6. (Optional but recommended) Custom domain

In the Cloudflare dashboard → Workers → poetech-voice-ops → Settings → Triggers → Add Custom Domain → enter `api.poetech.us` (or whatever subdomain you own). Cloudflare handles SSL automatically. Update `PWA_ORIGIN` in `wrangler.toml` if your PWA domain differs.

### 7. Watch logs while testing

```powershell
npx wrangler tail
```

Leave this open in one PowerShell window while you make test calls — you'll see every webhook hit.

---

## Twilio Studio flow setup (per line)

You'll repeat this for **two** lines:

1. **Buy two phone numbers** in Twilio Console → Phone Numbers → Buy a Number. Pick local numbers near Champaign IL for credibility. $1.15/mo each.
2. **Create a Studio flow** for each number:
   - Console → Studio → Create new Flow → "Start from scratch"
   - Name it `poe-properties-intake` (then `poetech-intake` for the second)
3. **Build the flow** (drag-and-drop):
   - **Trigger:** Incoming Call
   - **Say/Play widget:** "Thanks for calling Poe Properties. Please leave a message after the tone — your name, the property address, and the issue. We'll call you back today." (Adjust copy per line.)
   - **Record Voicemail widget:**
     - Transcribe = **enabled**
     - Max length = 120 seconds
     - Finish on key = `#`
   - **HTTP Request widget:**
     - URL: `https://api.poetech.us/webhook/twilio` (or your `*.workers.dev` URL)
     - Method: POST
     - Content type: Application/x-www-form-urlencoded
     - Parameters:
       - `CallSid` = `{{trigger.call.CallSid}}`
       - `From` = `{{trigger.call.From}}`
       - `To` = `{{trigger.call.To}}`
       - `RecordingSid` = `{{widgets.record_voicemail_1.RecordingSid}}`
       - `RecordingUrl` = `{{widgets.record_voicemail_1.RecordingUrl}}`
       - `RecordingDuration` = `{{widgets.record_voicemail_1.RecordingDuration}}`
       - `TranscriptionText` = `{{widgets.record_voicemail_1.TranscriptionText}}`
       - **`Line` = `poe-properties`** (or `poetech` for the second flow) ← critical
   - **Say/Play widget:** "Got it. Talk to you soon. Goodbye." → **Hang Up**
4. **Wire the number to the flow:** Phone Numbers → click the number → Voice Configuration → A call comes in → Studio Flow → select the matching flow → Save.
5. **(Optional) Add SMS alert to your cell** between the HTTP Request and the closing Say widget: SMS widget posting "📞 New voicemail on Poe Properties from {{trigger.call.From}}" to your number. Twilio charges ~$0.0079 per SMS, negligible.

---

## Hooking up the PWA

Open the PWA, go to the new **📞 Inbound** tab. The first time, it'll show a config form:

- **API endpoint URL:** `https://api.poetech.us` (or your workers.dev URL)
- **API token:** the `PWA_API_TOKEN` value you generated in step 4b above

Save. The Inbound tab will start showing voicemails as Twilio Studio posts them.

---

## Monthly cost monitoring

- **Twilio:** Console → Billing → set a usage alert at $30/mo to email you if call volume spikes.
- **Cloudflare:** Dashboard → Workers & Pages → Analytics. You'll stay deep inside free tier.
- **In the PWA:** the Voice Ops cost panel on Big Picture pulls from `/usage/this-month` and shows the running cost so you don't have to log into Twilio to know.

---

## What's NOT in Phase 1 (queued for later)

- **AI conversational answering** — Phase 2 (Vapi or Retell on the Poe Properties line first, ~$15–30/mo extra at typical volume)
- **TLC line w/ BAA chain** — Phase 3 (separate Twilio sub-account + Synology Docker storage)
- **PoeTech consulting auto-triage with calendar booking** — Phase 4
- **Tier 2 cross-device PWA sync** — same backend, separate data tables, same Cloudflare D1 free tier covers it

When you're ready for any of those, the foundation is here.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npx wrangler login` opens browser, fails | Pop-up blocker | Allow pop-ups for cloudflare.com, retry |
| `wrangler deploy` errors with "database not found" | wrangler.toml database_id still has placeholder | Run step 2 again, paste real id |
| Twilio webhook returns 401 | Wrong TWILIO_AUTH_TOKEN secret | Copy fresh from Twilio Console → Account → API keys |
| PWA Inbound shows nothing | Wrong endpoint URL or wrong token | Check both in the Inbound config; try `curl /healthz` first |
| Calls don't trigger webhook | Studio flow URL wrong, or number not bound to flow | Check Phone Numbers config + Studio HTTP Request widget URL |
| CORS error in browser console | `PWA_ORIGIN` in wrangler.toml doesn't include your PWA URL | Edit `[vars] PWA_ORIGIN`, redeploy |

Logs are your friend — `npx wrangler tail` shows every request live.

---

## Roadmap notes — from archived TypeScript v0

An earlier TypeScript implementation of this worker lived at `/voice-ops/` and was consolidated into `/_archive/voice-ops-typescript-v0/` on 2026-05-18 (full rationale: `_archive/voice-ops-typescript-v0/ARCHIVED.md`). Three pieces in that archive are worth porting **into this canonical worker** when the trigger arrives:

1. **`audit_log` table** — every webhook hit, status change, and worker action recorded with `at`, `actor`, `action`, `call_id`, `payload`. Port when the first paying customer ships and audit trail becomes a sales requirement, or when debugging Twilio Studio flow misconfigurations gets painful enough.

2. **R2 bucket binding** for long-term voicemail audio archival. Twilio purges recordings after their default retention window; mirroring to R2 ($0.015/GB-month) gives indefinite retention. Port when voicemail volume justifies it or when a customer asks for it.

3. **Dual-webhook pattern** (`recording-complete` + `transcription-complete` as separate endpoints) — slightly more robust if Twilio's transcription is slow or fails, because the row is created on `recording-complete` and only enriched later by `transcription-complete`. Current single-endpoint pattern is simpler; port the dual pattern if "transcript: null" rows start appearing in production.

These are documented here so a future contributor touching this worker sees the wishlist without needing to dig into the archive.

