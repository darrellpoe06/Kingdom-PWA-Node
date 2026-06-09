# N8N-WEBHOOK-AUTH-PATTERN.md

**Layer 3 (reference).** Bearer-token guard pattern for n8n webhooks that serve
sensitive user data. Authoritative for every webhook on the family n8n instance
that returns PII, financial records, clinical-adjacent data, or any other
content that must not be readable by an unauthenticated caller.

Added 2026-06-03 as the L16 ship (defense-in-depth behind the D17 client gate).

---

## The bright line: when to bearer-gate

Bearer-gate a webhook when **any** of these is true:

- It returns real user PII (names, account numbers, transaction descriptions,
  email content, contact details).
- It returns financial records tied to a real person or household.
- It returns anything the family would not paste into a public forum.
- It mutates state a stranger should not be able to mutate.

Do **not** bearer-gate:

- Pure write-only intake webhooks where the body is non-sensitive and the
  endpoint only appends (e.g. the public waitlist intake, the Suggest button).
  These are governed by rate limits and validation instead.
- The session-only data-upload pipeline (wf33/34/35), which never persists and
  returns only the caller's own just-uploaded data inline.

When in doubt, gate it. A 401 is a cheap mistake; a public PII leak is not.

**TLC firewall note.** Clinical / therapy data never flows through the family
n8n instance at all (it is firewalled to the TLC side per `COMMUNITY-FIRST-MISSION.md`
and the TLC hosting map). This pattern is for the financial + family-ops
webhooks. A clinical webhook, if one ever exists, gets a stronger per-user auth
model, never this shared-secret speed bump.

---

## The worked example: wf18 (Imported transactions API)

wf18 (`/webhook/imported-transactions`, GET) aggregates ~2,020 real Chase rows
(including Cash App / Zelle counterparty names) plus Gmail finance events. On
2026-06-02 those rows were briefly rendering on public poetech.us. D17 closed
the client side; L16 closes the server side.

### Defense in depth: two independent gates, both fail closed

| Layer | Where | What it does | Fails closed because |
|-------|-------|--------------|----------------------|
| D17 client gate | `poe-financial-mvp-v28.jsx` + `Imported.jsx` | Hides the Imported tab and SKIPS the fetch unless `importedAllowed` (`!isAnyDemoMode && !!currentProfile`) | A public / demo / profileless load never even attempts the request |
| L16 server gate | wf18 "Bearer check" node | Returns 401 unless the request carries the shared bearer | If no secret is configured, or the wrong / no token is sent, the request is denied |

Either gate alone protects the PII. Together, a regression in one is still
covered by the other.

### The n8n side

wf18's node graph becomes:

```
Webhook (GET) -> Bearer check (Code) -> Authorized? (IF)
                                          |- true  -> Aggregate finance data -> Respond 200 (JSON)
                                          |- false -> Respond 401 (JSON)
```

The "Bearer check" Code node:

1. Reads the expected secret from a mounted file FIRST:
   `/data/finance-events/_secrets/n8n-webhook-bearer.txt`
   (host: `/volume1/PoeTech/finance-events/_secrets/...`). This path is on the
   already-confirmed wf18 bind mount, and its `_` prefix means every directory
   walker in the repo skips it, so it never leaks into an aggregate response.
2. Falls back to `process.env.N8N_WEBHOOK_BEARER` / `process.env.VITE_N8N_BEARER`.
   The file is primary because **`process.env` access inside Code nodes is
   unreliable on this install** (the same sandbox limitation that forced the
   wf30/31/32 hardcoded-defaults fix, D5 / L7). Do not rely on env-only.
3. Compares the presented `Authorization: Bearer <token>` header against the
   expected value and **fails closed**: if no expected secret is configured,
   every request is denied. A misconfigured guard must deny PII, never leak it.

### The client side

`app/src/lib/n8n-base.js` exports `n8nAuthHeaders(authorized)`. It returns
`{ Authorization: 'Bearer <VITE_N8N_BEARER>' }` only when the caller is
authorized AND a bearer is configured; otherwise `{}`. Both wf18 fetch sites
spread it in:

```js
const r = await fetch(url, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) }, mode: 'cors' });
```

Each call site reaches that line only past its own authorization guard
(`importedAllowed` in the main app; `isImportedViewAuthorized()` in
`Imported.jsx`), so the demo / profileless path sends no header.

### Why no vercel.json change was needed

The PWA reaches n8n through the same-origin `/n8n/* -> Funnel` rewrite (see
`project_n8n_same_origin_rewrite`). Vercel rewrites proxy ALL request headers,
including `Authorization`, with no per-rewrite allowlist, so the bearer reaches
n8n untouched. And because the request is same-origin (`poetech.us/n8n/...`),
adding a custom header triggers **no CORS preflight**, so no OPTIONS handler is
needed. The response nodes still advertise `Access-Control-Allow-Headers:
Content-Type, Authorization` as belt-and-suspenders.

---

## The honest limitation: VITE_ vars are public

`VITE_N8N_BEARER` is a **build-time** Vite variable. Vite inlines `VITE_`-prefixed
vars into the public client bundle, so a determined visitor can extract the
token from the shipped JavaScript. **This bearer is therefore a shared-secret
speed bump, not per-user cryptographic auth.**

What it buys, paired with D17: it raises the bar from "any anonymous `curl`
returns 2,020 rows of PII" to "you must (a) defeat or bypass the client gate AND
(b) extract the bearer from the bundle." That is a real, meaningful increase in
defense for the single-tenant (Poe family) state we are in today.

What it does **not** do: provide true secrecy or per-user isolation. That
arrives with the multi-user auth layer (L12 / Layer B PIN auth). At that point
the upgrade is: mint a short-lived per-session token server-side, fetch it at
runtime after the user authenticates, and stop using a build-time constant.
This doc should be revised when that lands.

---

## Generating and rotating the bearer

The apply script `scripts/nas-update-wf18-bearer-guard.sh` is idempotent: it
generates a 256-bit hex token ONCE and reuses it on re-run (it does not rotate
silently, so re-applying never breaks the live client).

**To rotate on purpose:**

1. On the NAS host, delete the secret file:
   `rm /volume1/PoeTech/finance-events/_secrets/n8n-webhook-bearer.txt`
2. Re-run the apply script (it generates a fresh token and prints it).
3. Paste the new value into the Vercel env var `VITE_N8N_BEARER` (Production +
   Preview).
4. Redeploy the PWA so the build inlines the new token.

There is a brief window during rotation where the old client build holds the
old token and the server expects the new one. The Imported tab will 401 for the
family until the redeploy completes. That is acceptable (the data simply does
not load; nothing leaks). Rotate at a low-traffic time.

---

## Rollback path

If the bearer guard ever breaks normal family access (e.g. the secret file is
missing after a volume event, or the Vercel env var was not set):

- **Fastest unblock (no PII exposure):** the D17 client gate is still in force,
  so even with wf18 returning 401 the public surface is safe. The only symptom
  is the family's own Imported tab failing to load. Re-run the apply script to
  re-create the secret file, confirm the Vercel env var matches, redeploy.
- **Full rollback (last resort):** re-import the pre-L16 wf18 JSON (git history,
  parent of the L16 commit) to drop the Bearer check node, restart n8n. The
  endpoint returns to D17-only protection. Do this only if the guard is actively
  blocking the family AND the secret cannot be restored quickly; never leave the
  endpoint un-gated longer than necessary.

Verify either direction with:

```
# No bearer -> expect 401
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.1.26:5678/webhook/imported-transactions
# Correct bearer -> expect 200
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer <token>" http://192.168.1.26:5678/webhook/imported-transactions
```

---

## Checklist for gating a NEW sensitive webhook

1. Add a "Bearer check" Code node at the start (copy wf18's; same file path +
   env fallback + fail-closed logic).
2. Add an "Authorized?" IF node and a "Respond 401" node; route false -> 401.
3. Add `Authorization` to the 200 response's `Access-Control-Allow-Headers`.
4. On the client, attach `n8nAuthHeaders(authorized)` only past the view's
   authorization guard.
5. Confirm the call is same-origin via `/n8n` (no preflight) or add an OPTIONS
   handler if it is genuinely cross-origin.
6. Reuse the SAME secret file the apply script writes; do not invent a second
   token unless the endpoint needs an independent trust boundary.
