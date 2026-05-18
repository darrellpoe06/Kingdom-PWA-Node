# PoeTech Voice Ops · Cloudflare Worker

Phase 1 build per `docs/07-voice-ops/PHASE-1-VOICE-OPS.md`. Receives Twilio
voicemail + transcription webhooks, stores in D1 + R2, serves a REST API the
PoeTech PWA polls for the `📞 Inbound` tab.

## Scope

- **Two business lines:** Poe Properties + PoeTech
- **NOT TLC** — HIPAA boundary, Phase 3 separate architecture
- **NOT AI** — voicemail capture only, Phase 2 adds agent

## Files

| File | Purpose |
|---|---|
| `package.json` | npm scripts: deploy, dev, db:apply, tail |
| `wrangler.toml` | Cloudflare Worker config + D1 + R2 bindings |
| `schema.sql` | D1 schema (run once after creating the DB) |
| `src/worker.ts` | The Worker — Twilio webhooks + PWA REST API |
| `.gitignore` | Excludes `node_modules`, `.wrangler`, `.dev.vars` |

## Quick start

```powershell
# 0. (One time, anywhere) install Wrangler globally
npm install -g wrangler
wrangler login                                    # browser auth

# 1. (Inside this folder) install dev deps
npm install

# 2. Create the D1 database (copy the returned database_id into wrangler.toml)
wrangler d1 create poetech_voice
# -> paste database_id into wrangler.toml line 12

# 3. Apply the schema to D1
npm run db:apply:remote

# 4. Create the R2 bucket
wrangler r2 bucket create poetech-voice-audio

# 5. Set the three secrets (each opens a prompt; paste and Enter)
wrangler secret put TWILIO_AUTH_TOKEN              # from Twilio Console → Account → API keys
wrangler secret put TWILIO_ACCOUNT_SID             # from Twilio Console → Account
wrangler secret put PWA_API_TOKEN                  # generate a random 32-char string; save a copy for the PWA

# 6. Deploy
npm run deploy
# -> output prints the *.workers.dev URL. Test:
#    curl https://poetech-voice-ops.<your-subdomain>.workers.dev/inbound \
#         -H "Authorization: Bearer YOUR_PWA_API_TOKEN"
#    expect: []

# 7. (Cloudflare dashboard) Workers & Pages → poetech-voice-ops → Settings →
#    Triggers → Add Custom Domain → api.poetech.us
#    -> after ~30 sec, https://api.poetech.us/inbound works

# 8. (Twilio) buy two phone numbers, build Studio flow per spec section 7,
#    point each number at the flow, point flow at:
#    https://api.poetech.us/webhook/twilio/recording-complete
#    https://api.poetech.us/webhook/twilio/transcription-complete

# 9. Smoke test: call a number, leave a message, check:
#    curl https://api.poetech.us/inbound -H "Authorization: Bearer YOUR_PWA_API_TOKEN"
#    -> one row should appear (transcript may take ~60 sec)

# 10. Open Kingdom-PWA-Node → About → Voice Ops settings → paste URL + token, enable.
#     The 📞 Inbound tab appears in the top nav.
```

## After deploy: monitoring

- `wrangler tail` — live stream of Worker logs (run during smoke test)
- Cloudflare dashboard → Workers & Pages → poetech-voice-ops → Metrics
- Twilio Console → Monitor → Debugger (webhook delivery + responses)
- Twilio Console → Account → Billing → set Budget Alert at $30/mo

## Files map

```
voice-ops/
├── README.md          (this file)
├── package.json
├── wrangler.toml      EDIT after wrangler d1 create
├── schema.sql
├── .gitignore
└── src/
    └── worker.ts      EDIT line ~120 with your real Twilio numbers
```

## Where to extract this folder

This scaffold lives inside `Kingdom-PWA-Node/voice-ops/` for convenience.
Options for the actual Worker repo:

- **Keep here (monorepo):** simplest. PWA + Worker in one repo.
- **Extract to sibling folder** `C:\Users\dpoe\poetech-voice-ops`: cleaner
  separation if you want independent versioning. Move the folder, run
  `git init` inside it, create a new GitHub repo, push.

Recommend keeping it monorepo unless you outgrow it. Same git history,
same deployment cadence, easier to keep in sync.

## Reference

Full design + decisions: `docs/07-voice-ops/PHASE-1-VOICE-OPS.md`
