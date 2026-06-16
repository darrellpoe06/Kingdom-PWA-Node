// =============================================================================
// venue-cast — multi-screen venue delivery + the (build-target) generative visuals
// =============================================================================
// Darrell 2026-06-16, deepening the age-adaptive Learn framework:
//
//  (3) MULTI-SCREEN VENUE DELIVERY — the SAME lesson plays across every venue
//      screen (the Sanctuary LED video wall + the monitors) at the RIGHT level for
//      that screen, simultaneously. This is the data seam the two-screen Teach-mode
//      presenter (BroadcastChannel-synced) consumes: buildVenueCast() produces, per
//      screen, the age-banded lesson plan from the shared framework. One source of
//      truth (the authored module), many screens, each at its own age depth.
//
//  (4) REAL-TIME GENERATIVE VISUALS — the big screen showing an A.I.-generated image
//      created LIVE from the words being spoken (the concept appears as it is said),
//      a teaching aid that especially holds young minds. This is a BUILD TARGET, not
//      a today-capability, and this module is deliberately HONEST about that
//      (DR-0076): the pipeline is specced as data, marked status:'build-target', and
//      gated on the GPU hardware from the perpetual-local-LLM hardware review
//      (DR-0014). generativeVisualAvailable() is false unless a caller passes a REAL
//      hardware-ready signal (from the live infra inventory, infra-inventory.js
//      compute.cudaOnline). Nothing renders a fake generated image; the course
//      simply ACCEPTS 'generative' as a visual MODE that lights up when the iron lands.
//
// SOVEREIGN (the Charter): when the generative pipeline does land, it runs on OUR
// GPU — local speech-to-text (Whisper) and a local image model — never a vendor
// cloud for the congregation's words or the church's content.
// =============================================================================
import { lessonPlanForAge, normalizeAgeBand, ageBandProfile } from './learn-framework.js';

// The visual modes a venue can run. 'static' (authored diagrams + slides) is always
// available. 'generative' (live speech → image on the wall) is a build target.
export const VISUAL_MODES = [
  { id: 'static', label: 'Diagrams & slides', available: true, requires: null },
  { id: 'generative', label: 'Live A.I. visuals (build target)', available: false, requires: 'gpu' },
];

export function normalizeVisualMode(id) {
  return VISUAL_MODES.some((m) => m.id === id) ? id : 'static';
}

// The honest spec for the speech → generative-image pipeline. Kept as DATA so the
// surface and any future deploy describe the SAME thing, and so the (real) device
// numbers can be filled in as the hardware lands without touching render code.
// status:'build-target' — it does NOT run today.
export const GENERATIVE_VISUAL_PIPELINE = {
  status: 'build-target', // NOT live today; gated on the GPU hardware (DR-0014)
  summary: 'The big screen shows an A.I.-generated picture created live from the words being spoken — the concept appears on the wall as it is said. A teaching aid that especially holds young minds.',
  // Each stage runs on OUR hardware (sovereign), never a vendor cloud for the
  // congregation's words or the church's content.
  stages: [
    'Listen — capture the speaker’s audio at the lectern.',
    'Transcribe — local speech-to-text (Whisper-class) turns words into text, near-live.',
    'Extract the concept — pull the teachable noun/idea from the phrase just spoken.',
    'Generate — a LOCAL image model (on the GPU) renders a picture of that concept.',
    'Cast — push the image to the Sanctuary video wall, swapping as the next concept lands.',
  ],
  // The honest hardware gate: this needs real, online GPU/VRAM that the mesh does
  // not have today (the home NAS is CPU-only; the church RTX 4070 wall machines are
  // busy driving the wall; the dedicated GPU farm in DR-0014 is planned/unbought).
  requires: 'An online GPU with enough VRAM for a real-time local image model — the GPU farm from the hardware review (DR-0014), or the church’s RTX 4070 wall machines when free.',
  sovereign: true,
  hardwareReady: false, // flipped only by a REAL live signal (infra-inventory compute.cudaOnline)
  blockedReason: 'No online GPU for live local image generation yet — pending the GPU hardware (DR-0014). The lesson runs in static (diagram/slide) mode until then.',
};

// Is the generative visual mode actually runnable right now? FALSE by default; only
// true when a caller passes a real hardware-ready signal (e.g. the live infra
// inventory reporting an online CUDA node with enough VRAM). Never guesses true.
export function generativeVisualAvailable(hwReady = false) {
  return hwReady === true;
}

// Resolve the visual mode honestly: a request for 'generative' only succeeds when
// the hardware is actually ready; otherwise it degrades to 'static' and says why.
export function resolveVisualMode(requested, hwReady = false) {
  const want = normalizeVisualMode(requested);
  if (want === 'generative' && !generativeVisualAvailable(hwReady)) {
    return { mode: 'static', requested: 'generative', degraded: true, reason: GENERATIVE_VISUAL_PIPELINE.blockedReason };
  }
  return { mode: want, requested: want, degraded: false, reason: null };
}

// The default screens in the COLG sanctuary venue. Each screen carries the age band
// it renders at, so the SAME lesson shows child/visual on the big wall while an
// adult monitor shows the fuller text — all from one source. Tunable per venue.
export const DEFAULT_VENUE_SCREENS = [
  { id: 'video-wall', role: 'video-wall', label: 'Sanctuary video wall', ageBand: 'youth', visualForward: true },
  { id: 'monitor-adult', role: 'monitor', label: 'Side monitor (adults)', ageBand: 'adult', visualForward: false },
];

// Build the multi-screen cast for one module: one source lesson, rendered per screen
// at that screen's age level, simultaneously. This is what a Teach-mode presenter
// broadcasts to the venue. `baseAge` (the presenter's chosen band) seeds any screen
// that doesn't declare its own. Returns a plain, serializable payload.
export function buildVenueCast(module, { screens = DEFAULT_VENUE_SCREENS, baseAge = 'adult', visualMode = 'static', hwReady = false } = {}) {
  const vmode = resolveVisualMode(visualMode, hwReady);
  const list = Array.isArray(screens) && screens.length ? screens : DEFAULT_VENUE_SCREENS;
  return {
    moduleId: module?.id || null,
    title: module?.title || '',
    bigIdea: module?.bigIdea || '',
    visualMode: vmode.mode,
    visualModeRequested: vmode.requested,
    visualModeDegraded: vmode.degraded,
    visualModeReason: vmode.reason,
    screens: list.map((s) => {
      const band = normalizeAgeBand(s.ageBand || baseAge);
      return {
        id: s.id,
        role: s.role || 'monitor',
        label: s.label || s.id,
        ageBand: band,
        ageLabel: ageBandProfile(band).label,
        visualForward: !!s.visualForward,
        plan: lessonPlanForAge(module, band),
      };
    }),
  };
}
