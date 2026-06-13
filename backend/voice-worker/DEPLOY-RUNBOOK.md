# Tenant voicemail — deploy runbook (turnkey)

Tenants call your existing Poe Properties / PoeTech numbers; missed calls roll to
a voicemail that lands transcribed in the app's **Inbound** tab as a dispatchable
item. The worker code is built + CORS-fixed (PR #37). This is the click-path.
Cost ~$6-13/mo. **[YOU]** = your account/payment; the rest is paste.

## Step 1 — API token (save the output)
```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
[Convert]::ToBase64String((1..32 | %{ [byte](Get-Random -Minimum 0 -Maximum 256) }))
```
Copy that string. It's used twice (steps 3 + 5).

## Step 2 — Cloudflare
```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node\backend\voice-worker
npm install
npx wrangler login
npx wrangler d1 create poetech_voice_ops
```
**[YOU]** sign in during `wrangler login`. The `d1 create` prints a
`database_id` — paste it in:
```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node\backend\voice-worker
(Get-Content wrangler.toml) -replace 'REPLACE_WITH_ID_FROM_WRANGLER_D1_CREATE', 'PASTE-ID-HERE' | Set-Content wrangler.toml
```

## Step 3 — DB + secret + deploy
```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node\backend\voice-worker
npx wrangler d1 execute poetech_voice_ops --remote --file=migrations/0001_init.sql
npx wrangler secret put PWA_API_TOKEN
npx wrangler deploy
```
At `secret put`, paste the token from step 1. `deploy` prints your worker URL
(`https://poetech-voice-ops.<sub>.workers.dev`) — copy it. Sanity check: open
`<that URL>/healthz` -> `{"ok":true}`.

## Step 4 — Twilio  **[YOU: account + payment]**
1. twilio.com -> create account, verify, add ~$20 (trial can't take stranger calls).
2. Buy two local 217 numbers (~$1.15/mo each).
3. Console -> Account -> Auth Token -> copy, then:
   ```powershell
   cd C:\Users\dpoe\Kingdom-PWA-Node\backend\voice-worker
   npx wrangler secret put TWILIO_AUTH_TOKEN
   ```
4. **Keep your existing numbers** (recommended): set conditional call-forwarding
   (busy / no-answer) on each current number -> its Twilio number. Tenants keep
   the number they know; missed calls roll to voicemail. (Carrier code, usually
   `*004*<twilio-number>#` — tell me your carrier for the exact code.)
   *Or* point the Twilio numbers' Voice config -> Studio Flow directly if these
   are fresh business lines.
5. Build the Studio flow per `README.md` ("Studio flow"): Trigger -> Say greeting
   -> Record Voicemail (Transcribe ON, max 120s) -> HTTP Request POST to
   `<worker-url>/webhook/twilio` with the fields + **`Line=poe-properties`**
   (second flow: `Line=poetech`) -> also set the Record widget's transcription
   callback to the same URL (backfills late transcripts).
6. Billing -> usage alert at $30/mo.

## Step 5 — Wire the app (2 min, any device)
Open the **Inbound** tab -> first-run config -> paste the worker URL + the token
from step 1 -> Save. (localStorage-only; no deploy.)

## Step 6 — Smoke test
Call each number, leave a message. The row appears in Inbound -- caller,
transcript, playable audio, Mark-handled. TLC is deliberately NOT on this stack
(no BAA); the worker 403s any line it doesn't know.
