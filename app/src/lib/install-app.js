// =============================================================================
// install-app — shared capture of the browser's PWA install prompt
// =============================================================================
// Darrell 2026-07-07, on "Download the latest": "it checks instead of
// downloading the actual app — why can't it do both, or prompt and say you're
// on the latest, you sure you want the download, with a yes?" The build check
// and the DEVICE install are two different "downloads," and the button must be
// able to offer both. Chrome hands the install ability out exactly once, as a
// beforeinstallprompt event — whoever catches it can fire the native install
// dialog later. PwaPrompts catches it for its own banner, but that copy is
// locked inside the component (and skipped entirely for 30 days after a
// dismissal). This module is the SHARED catch: one window-level listener that
// stores the event so ANY surface (DownloadLatest's install offer, future
// counters) can fire the native install on tap.
//
// One-shot semantics: evt.prompt() may only be called once and throws after —
// promptInstall() clears the stored event before firing so a throw can never
// wedge a surface, and a fresh event (Chrome re-fires on later visits) simply
// re-arms the capture.

// Attach the window-level capture. Idempotent; call once at boot.
export function captureInstallPrompt(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  if (!w || !w.addEventListener || w.__pwaInstallCaptureArmed) return;
  w.__pwaInstallCaptureArmed = true;
  w.addEventListener('beforeinstallprompt', (e) => {
    // preventDefault so Chrome defers to our surfaces; PwaPrompts' own
    // listener (when armed) receives the same event independently.
    try { e.preventDefault(); } catch (_) { /* noop */ }
    w.__pwaInstallEvt = e;
  });
  w.addEventListener('appinstalled', () => { w.__pwaInstallEvt = null; });
}

// True when a captured event is ready — the one-tap native install is possible.
export function canPromptInstall(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  return Boolean(w && w.__pwaInstallEvt);
}

// Fire the native install dialog from the captured event.
// Returns 'accepted' | 'dismissed' | 'unavailable' — never throws.
export async function promptInstall(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  const evt = w && w.__pwaInstallEvt;
  if (!evt) return 'unavailable';
  w.__pwaInstallEvt = null; // spend it before firing — prompt() is one-shot
  try {
    evt.prompt();
    const choice = await evt.userChoice;
    return choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch (_) {
    return 'unavailable';
  }
}
