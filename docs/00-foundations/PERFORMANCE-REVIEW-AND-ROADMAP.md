# Performance Review & Roadmap — As Fast As Possible Now, Faster Next

**Date:** 2026-06-23
**Scope:** READ-ONLY review. No behavior was changed to produce this doc. Every number
below is measured from a real production build, not estimated, per the Verification
Doctrine (DR-0076) — "measure, don't claim." Estimates are explicitly marked.
**Measured against:** `origin/main` @ `137ce53` (the shipped state), built with
`vite build` (vite 5.4.21). Note: the active working branch
`docs/feature-workflow-register` is 22 commits behind main and predates the
lazy-load work (PR #282), so it builds the *old* pre-lazy bundle — this review
reports **main**, which is what users actually run.

---

## 1. The headline

The single biggest app-load win — code-splitting the tab modules behind
`React.lazy` — **is already shipped on main** (PR #282). It cut the monolith from
**1.81 MB → 1.08 MB raw** (480 KB → 302 KB gzip) and split Supabase into its own
cacheable chunk. The "~1.7 MB monolith" figure in the brief was the *pre-lazy*
state; that is now history on main.

What remains are three smaller, lower-risk wins (defer Leaflet, vendor chunk
split, finish trimming the eager monolith) and the longer arc (modular rebuild →
GPU box → NAS-as-workhorse). The local-LLM speed is the place where current
hardware is genuinely the wall: **2–4 tok/s** on the daily-driver model, CPU-only.

---

## 2. Measured — front-end bundle (main, production build)

### What loads UP FRONT (before first interaction, signed-in full app)

| Asset | raw | gzip |
|---|---:|---:|
| `index.html` | 1.64 KB | 0.74 KB |
| `index-*.css` | 44.36 KB | 8.37 KB |
| `index-*.js` (entry: React + ReactDOM + boot) | 154.27 KB | 49.87 KB |
| `supabase-*.js` | 212.99 KB | 55.30 KB |
| `poe-financial-mvp-v28-*.js` (monolith) | **1,084.27 KB** | **302.48 KB** |
| **Subtotal (app assets)** | **~1,497 KB** | **~417 KB** |
| Leaflet from `unpkg.com` (js + css) | ~46 KB | ~15 KB *(est.)* |
| **Total cold load** | **~1,543 KB** | **~432 KB** |

Then, **on demand**, the visible tab's lazy chunk loads — e.g. Rentals +28.7 KB
gz, About +18.9 KB gz, CommandServeCenter +16.4 KB gz, Study +16.3 KB gz.

### What is lazy (loads only when its tab is opened)

The build emits ~40 separate chunks. Largest lazy tab chunks (gzip): Rentals 28.7,
About 18.9, CommandServeCenter 16.4, Study 16.3, DevOps 14.4, Choir 13.3,
ChurchLearn 13.2, church-classes 9.6, EventCenter 8.9, Practice 8.4. This is the
PR #282 win working as intended — a user who never opens Rentals never downloads
its 121 KB.

### The weight, located

- **Monolith (302 KB gz) is still the largest up-front chunk.** It is the app
  shell plus ~25 components that are *still statically imported* (eager), not
  lazy. The biggest eager one is `Projects.jsx` (128 KB raw) — it stayed eager
  because it is coupled to the shared `DateField` export
  (`poe-financial-mvp-v28.jsx:22`). Others: BooksEntities, Debts, Inbound,
  Imported, DispatchPanel, LifeGallery, VerifyBalances.
- **Supabase (55 KB gz)** initializes auth on boot — correctly its own chunk,
  but it is on the cold path because the app gates on session at startup.
- **Leaflet loads on EVERY page from a third-party origin.**
  `app/index.html:21-22` hard-codes:
  ```html
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin="" defer></script>
  ```
  The map is used on **one surface only** — Rentals (`Rentals.jsx:869-884`, via
  the `window.L` global, already null-guarded). Yet every cold load pays: a
  render-blocking CSS `<link>` (no `defer`/`media`), the JS, and a whole extra
  origin's DNS + TCP + TLS handshake.
- **`recharts` is a dead dependency.** It is in `app/package.json` but imported
  **zero** times anywhere in `src/`. It is tree-shaken out of the bundle (no
  weight cost today) but should be removed to keep installs honest.

---

## 3. Measured — initial load path / first-paint blockers

This is a client-rendered SPA: the screen is blank until JS executes, so first
*meaningful* paint is gated on downloading + parsing + executing the up-front JS
(**~417 KB gz**: entry + supabase + monolith). Specific blockers:

1. **Render-blocking third-party CSS.** The `unpkg` `leaflet.css` `<link>` in
   `<head>` has no `media`/`defer` — the browser blocks first paint on a request
   to an external origin, for a stylesheet only one tab needs.
2. **Extra-origin handshake.** `unpkg.com` is a separate origin from the app, so
   every cold load adds a DNS + TCP + TLS round-trip before Leaflet can arrive.
3. **The monolith is a download waterfall.** The entry chunk imports the monolith,
   so the browser must finish the entry chunk before it discovers and starts the
   302 KB-gz monolith — a serial dependency, not parallel.
4. **Auth-on-boot.** Supabase (55 KB gz) loads and the app gates on session at
   startup before the main UI commits.

Service-worker caching is healthy: assets are content-hashed and the SW is
re-versioned per deploy (`vite.config.js:251-262`), so repeat visits are warm.
The cost above is the **cold / post-update** path.

---

## 4. Measured — local LLM speed (the NAS)

**Hardware (the wall):** Synology **DS1621xs+** — Xeon **D-1527** (quad-core,
2.2 GHz), 32 GB DDR4 ECC, **CPU-only, no GPU, no CUDA.**

**Current model speeds** (from `infra/n8n/INSTALL.md:19-21` and the
2026-06-01/06-02 research-review notes):

| Model | Role | tok/s (CPU-only) |
|---|---|---:|
| `qwen2.5:3b-instruct-q4` | router / classifier | 12–18 |
| `deepseek-r1:8b-q4` | reasoning | 3–5 |
| `qwen2.5:14b-instruct-q4` | **daily driver** / counseling depth | **2–4** |

> **Provenance / honesty flag:** the brief refers to "Hermes" tok/s. No "Hermes"
> model appears anywhere in the repo notes — the documented daily driver is
> `qwen2.5:14b` at 2–4 tok/s. Reporting that rather than a name I can't verify.

**What's gating it:** CPU-only inference is core- and memory-bandwidth-bound; with
no GPU there is no parallel matmul, so tok/s falls off steeply as the model grows.
A 14B model at 2–4 tok/s means a multi-paragraph answer takes tens of seconds —
fine for batch/background jobs, slow for anything interactive. This is the one
area where current hardware, not code, is the binding constraint.

---

## 5. Fast wins — do-now, ranked by impact ÷ effort

All shippable on current hardware. Risk tiers per `RELEASE-TIERS.md`.

### #1 — Defer Leaflet off unpkg  ·  impact HIGH · effort LOW · Tier B
Remove the two `unpkg` tags from `index.html`; inject `leaflet.css` + `leaflet.js`
dynamically only when the Rentals map mounts. The consuming code already guards on
`window.L` (`Rentals.jsx:869`), so this is mechanically safe.
- **Saves on every cold load:** ~15 KB gz, a render-blocking external CSS request,
  and a full third-party DNS+TCP+TLS handshake.
- **Risk:** low — one surface; verify the map still renders after load. Touches
  `index.html`, so a short Tier B preview soak is prudent rather than Tier A.

### #2 — Vendor chunk split (manualChunks)  ·  impact MED-HIGH · effort LOW · Tier B
There is **no `manualChunks` config** today (`vite.config.js` confirmed). React +
ReactDOM ride inside the entry chunk, which is rebuilt on every deploy — so the
~50 KB gz of React cache-busts on each app update even though React never changed.
Pin `react`/`react-dom` (and optionally supabase) into a stable vendor chunk via
`build.rollupOptions.output.manualChunks`.
- **Saves on repeat / post-update loads:** ~50 KB gz stays cache-warm across
  deploys. A handful of lines of config.
- **Risk:** low.

### #3 — Finish trimming the eager monolith  ·  impact HIGH · effort MED · Tier B/C
The monolith (302 KB gz) is the biggest up-front chunk and still statically imports
~25 components. Continue the PR #282 lane: lazy-load the heavy eager ones —
**Projects (128 KB raw)** is the prize, blocked only by the shared `DateField`
export (extract `DateField` to its own tiny module, then lazy Projects). Then
BooksEntities, Imported, LifeGallery.
- **Saves up-front:** potentially 60–100 KB gz off the cold path.
- **Risk:** moderate — Suspense boundaries + the DateField coupling that blocked
  this before. Do it incrementally, one component per PR, each behind the
  break-it ship gate (SectionErrorBoundary).

### #4 — Drop dead weight + caching polish  ·  impact LOW-MED · effort LOW · Tier A
- Remove the unused `recharts` dependency from `app/package.json` (0 imports).
- Add `<link rel="modulepreload">` for the monolith chunk so it downloads in
  parallel with the entry chunk instead of waiting behind it (kills one waterfall
  RTT on the cold path).
- Optionally have the SW precache the entry + supabase + monolith trio so the
  first post-install navigation is instant.
- **Risk:** low; the recharts removal + modulepreload pass the six low-risk tests
  (Tier A carve-out).

**Do-now order:** #1 → #2 → #4 (all quick, low-risk) → then #3 incrementally.

---

## 6. Get-faster roadmap

The sequence is **quick wins now → modular rebuild → hardware.**

### Phase 0 — Quick wins (days, current hardware)
The four fast wins in §5. Front-end only, no procurement.

### Phase 1 — Modular rebuild (weeks, current hardware) — biggest *sustained* app win
Finish decomposing `poe-financial-mvp-v28.jsx` so every module loads only its own
code (per-module loading), not a shared shell that drags eager components. This is
the durable version of #3: the monolith stops being a monolith. Ties directly to
the standing rule **"new surface = new module"** and the lazy lane already proven
by PR #282. Target: shrink the always-loaded core to shell + router + the one
visible module, with everything else on demand.

### Phase 2 — GPU box (procurement) — the LLM tok/s leap
Dual **RTX 3090** inference box (~$3,400 all-in, ratified direction in **DR-0014**;
spec in `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`).
Measured community throughput: **~70 tok/s on Qwen-14B Q4** with 4-team concurrent
capacity — roughly a **20–30× jump** over the NAS's 2–4 tok/s on the same model,
and it unblocks the larger models the CPU box can't run interactively at all. This
is the single change that moves local AI from "background batch" to "interactive."

### Phase 3 — NAS always-on as the workhorse (ops)
Make the NAS the standing home for heavy/batch work — builds, embeddings, media
transcode, scheduled jobs — so it runs off the laptop that has been crashing under
load. The NAS is already the sovereign deploy target (per the NAS PWA deployment +
AI-FOUNDATION-INTERNAL-OPERATIONS); this formalizes "heavy work lives on the
always-on box, not the principal's laptop." Any timer-driven automation added here
ships with the three brakes (budget + concurrency lock + kill-switch) per the
autonomous-automation rule.

---

## 7. What was NOT verified (honesty ledger)

- **Leaflet's gzip-over-the-wire size (~15 KB)** is an estimate from known Leaflet
  1.9.4 sizes, not a measurement of unpkg's actual response — it serves
  third-party, so I did not fetch it. The *fact* that it loads on every page and
  is render-blocking is verified from `index.html`.
- **GPU tok/s (~70)** is a community benchmark cited in the 2026-06-01 research
  note, not a measurement on hardware the family owns (the box isn't built yet).
- **"Hermes" model** — not found in the repo; reported the verified `qwen2.5:14b`
  daily driver instead (see §4 flag).
- Numbers in §2–§3 are measured from a real `vite build` of `origin/main` @
  `137ce53` and are reproducible with `cd app && npx vite build`.
