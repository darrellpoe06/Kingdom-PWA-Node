# PoeTech Presenter replaces ProPresenter — roadmap (2026-06-24)

Layer 4 working artifact + the strategic plan for turning the NDI low-hanging fruit
into a full worship-presentation system that **replaces ProPresenter** at COLG — so
ProPresenter's dedicated CUDA machine is freed and **one of the church's 2x RTX 4070
boxes** is reclaimed for live-mix A.I. / local LLM / transcription. Sovereign, free,
zero-vendor-cost.

> Recommend formalizing this direction as a Decision Record (the DR ledger INDEX is
> owned by another session — do not allocate a number here; flag for allocation).

## The real production environment (grounded in Darrell's booth photo)

Back-of-house production booth, next to the digital audio console:

- A **video switcher / streaming PC** (one monitor shows the switcher/stream program).
- **Multiple camera / production feeds** on the other monitors.
- A **laptop** at the desk.
- Sanctuary front: **two side projection screens** flanking the stage (the fine-pitch
  LED wall now installing augments/replaces these over time).

**Implication:** the church already has a switcher + camera feeds + a streaming PC +
two side screens. NDI plugs in *naturally* — it routes the camera/production feeds AND
the presenter/lyrics output over the LAN as NDI sources, into the switcher/stream and
onto the two side screens, **reducing HDMI/SDI runs**. The two side screens are the
strong target for **presenter NDI output** (lyrics / lower-thirds / Big Picture).

**Open fact to pin (does not block):** the exact **switcher + stream-software names**
(vMix? OBS? a hardware switcher? ProPresenter vs Proclaim for current presentation).
The sovereign-orchestrator architecture note currently lists *"Proclaim"* on Node 2,
while Darrell named *ProPresenter* — reconcile with Darrell or an SME-capture/close-up
photo. **Designed generically now** (OBS Browser Source + DistroAV is the universal
free bridge; vMix and most switchers ingest NDI natively), so the plan holds either way.

## Refined LHF recommendation (for THIS setup)

**Lowest-effort, highest-value: NDI OUTPUT from the Presenter → the existing switcher +
the two side screens.** The switcher is already there, so the program feed just becomes
one more NDI source it picks up — no new hardware, no GPU. This is exactly what shipped
in **#322** (`?output=1` → OBS Browser Source → DistroAV NDI source). This roadmap turns
that single output into a full worship presenter.

## What shipped in THIS increment

- `app/src/lib/worship-presenter.js` — the pure "ProPresenter brain": a **set list**
  (run-of-show) of worship items → **cues** the operator advances with a clicker, where
  songs follow an **arrangement** (verse/chorus, choruses repeat, long sections
  auto-slice), and **each cue maps to an NDI program payload** (#322) — lyrics render
  big, Scripture as Scripture, keyed lower-thirds for the switcher. Plus:
  - `setListToPresentable()` — reuses the universal **`presentable`** contract (#306)
    for an in-app two-screen preview + `fitToBudget()` time planning, with the same
    no-leak invariant (operator cues never reach the screen).
  - `masterProgramToSetList()` — the **generic seam** that lets the master Sunday
    program (order-of-service lane) drive the presentation with no re-entry.
  - `PROPRESENTER_PARITY` — the honest have/partial/gap map (single source for the doc
    + any in-app parity surface; DR-0076).
- `app/src/__tests__/worship-presenter.test.js` — 15 tests; one **caught a real
  null-row crash** in the program adapter (fixed) — the reliability bar in action.

**Non-colliding:** new files only; reuses `ndi-output.js` (#322, on main) + reads the
`presentable` contract; touches **no** multi-screen / church-live / master-program /
live-board lane files. Output rides the existing `?output=1` route (already
live-verified). The operator console is the next, separately-shipped surface.

## Parity gap vs ProPresenter (what the Presenter still needs)

From `PROPRESENTER_PARITY` (honest status):

**HAVE (shipped):** song lyrics with verse/chorus advance · Scripture display · slides /
announcements · keyed lower-thirds · live NDI output to the switcher + screens · two
side-screen outputs.

**PARTIAL (foundation done, surface pending):**
- **Operator / clicker workflow** — `advanceCue()` + `cueOperatorLabel()` are done
  (pure); the operator **console UI** (live vs preview, hotkeys/clicker, set-list panel)
  is the next increment.
- **Run-of-show from the master Sunday program** — adapter ready; the order-of-service
  lane lands separately, then points at `masterProgramToSetList()`.
- **Stage display** (presenter monitor: current + next + clock) — reuses the
  `<Presenter>` notes panel + scenes; a dedicated next-up/clock layout is a small add.
- **Themes / looks** — one verified high-contrast theme today; a look-picker later,
  behind the contrast gate.

**GAP (must build before reliance):**
- **Song / slide LIBRARY** — a persisted, searchable store so songs are entered once and
  reused (needs a DB table; today set lists come from code / the program). This is the
  single biggest remaining build for true ProPresenter parity.
- **Smooth transitions** — a CSS crossfade between cues on the output route (cosmetic,
  low-effort, after the console).
- **Reliability** — see the binding plan below.

## Reliability plan (binding — it runs LIVE worship)

ProPresenter's real value is that it **does not fail mid-service**. The Presenter must be
**at least as dependable** before the church relies on it. Per the unbreakable /
error-boundary standard (`break-it-ship-gate`, `LESSONS-LEARNED` P-series, DR-0076):

1. **No white-screen, ever.** Each surface wrapped in a `SectionErrorBoundary`; the
   output route falls back to the **holding slide**, never a blank or a stack trace, on
   any render error. (The output route already holds its last good cue.)
2. **Crash recovery is instant.** Output state (current set list + cue index) persists
   locally so a reload / crash returns to the **same cue** in seconds — the operator
   never loses their place mid-song.
3. **Graceful degradation.** If the BroadcastChannel / sender dies, the output route
   keeps showing the last cue and accepts URL-param control as a fallback (already true).
   If a song/section is malformed, that cue degrades to a hold — the **service continues**
   (the null-row fix above is the first instance of this rule enforced by a test).
4. **Proven-to-catch.** Every reliability rule gets a test that fails if it regresses
   (white-screen boundary, persist/restore, malformed-input fallback) — green means it
   actually holds, not that it looks fine.
5. **Offline-first.** The presenter must run with **no internet** (LAN only) — it is a
   PWA with a service worker; the worship surfaces must work fully offline.

## Staged cutover plan (do NOT drop ProPresenter prematurely)

1. **Build to parity** — operator console + song library + reliability hardening, each
   shipped and gate-green.
2. **Run ALONGSIDE** — for several real services, run PoeTech Presenter **next to**
   ProPresenter (its NDI output available to the switcher but not the only source).
   Operator drives both; compare. ProPresenter stays the safety net.
3. **Prove it on live services** — parity confirmed by USE (operator + media team), and
   reliability proven over real Sundays (no white-screen, no mid-service failure,
   instant recovery observed). This is a **Tier C** surface (COLG-facing, live worship)
   with family + media-team review the merge gate.
4. **Retire ProPresenter** — only after (3) holds. Then reclaim its CUDA machine.

## Freed-box reallocation (the resource win)

The church runs **2x single-RTX-4070 machines** (sovereign-orchestrator architecture,
2026-06-09): **Node 1** (Legion PC — Ollama + n8n + Uptime Kuma, off-hours) and
**Node 2** (Church Production Switcher — NDI router / studio monitor / the presentation
app, *forbidden for AI during church hours*). ProPresenter is GPU-heavy presentation
software pinned to one of these boxes.

PoeTech Presenter is a **browser-based** presenter that outputs NDI through OBS — it
needs **no dedicated CUDA box** (it renders on any machine, even integrated graphics;
the NDI bridge is OBS, already running). So **replacing ProPresenter removes a
CUDA-pinned workload**, freeing that 4070 for:

- **Live-mix A.I.** for the audio board (the live-board lane) — real-time assist on the
  digital console next to the booth.
- **Local LLM** (a 14B-class reasoner per DR-0012's conservative single-4070 envelope).
- **Transcription** (Whisper-class) for the SME pipeline + near-live captions, today
  CPU-bound on the NAS — a 4070 makes it fast.

All three are **sovereign + zero-vendor-cost**, aligned with the AI-Foundation internal-
operations posture. **Honest caveat:** Node 2 still does NDI routing + switching during
service, so the reclaimed GPU headroom is largest **outside** live-production windows
(and during service for anything that does not contend with the switcher) — the win is
removing the *dedicated presentation CUDA load*, not making Node 2 idle. Confirm the
exact current presentation-host topology with Darrell when pinning the switcher names.

## Next increments (separately shipped, coordinated)

1. **Operator console** (own module, not the monolith) — set-list panel, live/preview,
   clicker hotkeys, broadcasts cues to `poetech-program-v1`; wrapped in an error
   boundary + state persistence (reliability rules 1–2).
2. **Song/slide library** (DB) — persisted, searchable; closes the biggest gap.
3. **Master-program wiring** — point the order-of-service lane at
   `masterProgramToSetList()` when it lands on main.
4. **Second side-screen + transitions** — second NDI source + CSS crossfade.
5. **Alongside soak → cutover → reclaim the 4070** (staged plan above).
