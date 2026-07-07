# n8n EXIT PLAN — make the app not break when the NAS is down (2026-07-06)

**Goal (Darrell, 2026-07-06):** *"I've asked to not be on n8n exactly because it breaks. I just want a good app."*
A good app = **no family-facing surface goes dead because a NAS box behind a Tailscale Funnel is unreachable.** This plan removes n8n from the app's request-time critical path.

**Read-only planning doc.** No code changed. Every call site below is CONFIRMED by grep against `app/src` (non-test), `file:line` cited.

---

## The real problem (CONFIRMED)
- Every n8n call resolves through `app/src/lib/n8n-base.js`, which — per its own **2026-06-17 supersession note** — now points the browser **DIRECTLY at the Tailscale Funnel** (`https://poetech.tail5a2f35.ts.net`). When that Funnel/NAS is unreachable, calls fail (today: `/n8n/healthz` → **HTTP 530**). *(CONFIRMED `n8n-base.js`.)*
- **Routing is inconsistent** — two patterns coexist:
  - some calls use `N8N_BASE` → **direct Funnel** (e.g. `mark-noise`, `llm-health`);
  - some use same-origin **`/n8n/*`** → the Cloudflare Pages Function `app/functions/n8n/[[path]].js` → Funnel (e.g. `property-history`, `book-checkout`).
  Either way the **Funnel is the single point of failure.** Cleaning this up is part of the win.

## The true scope — ~30 call sites, NOT 7 (CONFIRMED)
The earlier "7 webhooks" was an undercount. Authoritative list (grouped by off-ramp):

### Bucket A — DB-shaped → **direct Supabase** (RLS-gated; no server, no Funnel)
These are plain reads/writes that never needed a workflow engine. Highest value, lowest risk.
- `BooksTransactions.jsx:225` — `mark-noise` (flag a txn as noise)
- `ConferenceModule.jsx:110` — `family-feedback`
- `Rentals.jsx:1159` + `lib/chat-import.js:7` — `property-history` (Rentals.jsx itself says it "isn't live yet")
- `ReviewFeed.jsx:110,134` — `review-feed`, `review-action` (governance queue)
- `WorkflowStatus.jsx:56` — `workflow-status`
- `poe-financial-mvp-v28.jsx:2309,2333` — `skill-analytics`, `matched-services`
- `poe-financial-mvp-v28.jsx:4204` — `thought` + `lib/thought-finalizer.js:59` — `thought-finalize`
- `lib/client-acquisition.js:623` — `practice-growth`
- `lib/checkout-seam.js:30` — `subscribe` (if it just records an email → DB)

### Bucket B — must-be-server-side → **Cloudflare Pages Function** (same deploy, no always-on box)
Needs a secret, a server-side fetch (CORS), or the NAS's own files.
- `lib/checkout-seam.js:29` — `book-checkout` (commerce; needs a payment secret)
- `poe-financial-mvp-v28.jsx:4155` — `link-title` (server-side page fetch)
- `poe-financial-mvp-v28.jsx:2285,6095` — `data-upload`, `imported-transactions` (bank data — note `Imported.jsx` already says the live import is "a deterministic Python job on the NAS. **No n8n**" — these call sites may be legacy; verify before touching)
- **Photo bridge** (`lib/nas-photos.js`): `property-photos:15,35`, `family-photos:27,114`, `album-photos:139,195`, `photo-upload:24,217` — these genuinely read NAS-stored photos, so they stay NAS-backed, BUT there is **no Cloudflare `/nas-photos` route today** (the gap from the main review). They need a Pages Function **and** graceful "photos offline" degrade.

### Bucket C — genuinely private GPU / infra → **keep NAS/tower, but DEGRADE GRACEFULLY**
Private LLM work legitimately waits on the GPU (mesh rule: private jobs never fall back to a cloud vendor). The fix here is **error-handling, not relocation**: show "offline," never crash the surface.
- `lib/class-tutor.js:46` — `class-tutor` (per-week local-LLM tutor; used by ChurchLearn + all Learn courses)
- `LlmHealth.jsx:79`, `LlmReview.jsx:33` + `lib/llm-review.js:9` — `llm-health`, `llm-review`
- `lib/talk-about.js:52` — `talk-about` (voice/LLM)
- `WakeOrchestrator.jsx:33,34` — `wake-orchestrator`, `wake-orchestrator-control`; `lib/admin-console.js:118` — `dispatch-status-page` (admin/infra cockpit — fine to degrade)

---

## Honest assessment
This is a **substantial, staged migration**, not a weekend fix — ~30 sites across finance, church, rentals, photos, governance, learn, and the orchestrator. But it's **incremental and low-risk**: each call site is independent, and the buckets tell you the pattern to apply. You get most of the reliability from a small first slice.

**One caveat per site:** the app-side call is visible here, but each n8n *workflow body* lives on the NAS, not fully in the repo. Before cutting a specific webhook, read its workflow to confirm it isn't doing a hidden side-effect (auth, a second write, a notification). ~10 min per webhook.

---

## Phased plan (ruthless — reliability the family feels, first)

**Phase 1 — kill the daily-driver breakage (Bucket A, top slice).** Cut these to direct Supabase first, because they're on paths the family touches often:
`mark-noise`, `family-feedback`, `review-feed`/`review-action`, `thought`/`thought-finalize`. Each = one small PR, verified in-app. *Effort: ~0.5–1 day for the slice.*

**Phase 2 — stop the ugly failures (Bucket C degrade).** Wrap `class-tutor`, `llm-health`, `llm-review`, `talk-about`, and the orchestrator calls so a down GPU/NAS shows a clean "offline" state instead of a broken page. No backend change. *Effort: ~0.5 day.*

**Phase 3 — restore + route the photo bridge (Bucket B photos).** Add the Cloudflare `/nas-photos` Pages Function + graceful degrade; bring the NAS Funnel back up so photos load. *Effort: ~1 day incl. NAS side.*

**Phase 4 — finish Bucket A + B.** Remaining DB webhooks to Supabase; `book-checkout`/`subscribe`/`link-title`/finance to Pages Functions (only the ones actually in use — verify `data-upload`/`imported-transactions` aren't already dead legacy). *Effort: staged, 1–2 days.*

**Endpoint:** once nothing in the app calls the Funnel at request time, n8n is **optional background tooling** — the app stays up whether or not the NAS is reachable. Then separately restore the Funnel for background/photo flows, but nothing family-facing depends on it.

## Start here (if someone picks this up tomorrow)
1. `mark-noise` → direct Supabase (smallest, proves the pattern).
2. `family-feedback` → direct Supabase.
3. Add graceful-degrade to `class-tutor` + `llm-health` (biggest visible "it broke" offenders in Learn).

Do those three and the app already stops breaking on the paths people hit most.

*Grounded per DR-0076: every call site CONFIRMED by grep; workflow bodies + "already legacy?" questions flagged as verify-before-cutover, not assumed.*
