// =============================================================================
// mic-presence — does this device have a microphone at all?
// =============================================================================
// Darrell 2026-09-25, asking whether every new feature works on the Firestick
// (DR-0657). A television usually has no microphone the browser can reach.
// Silk still has getUserMedia and MediaRecorder, so "can this browser record"
// answered yes, and the app offered "Record a conversation" and "Record the
// lesson". Measured on a Fire-TV-shaped Chromium (getUserMedia refused with
// NotFoundError, enumerateDevices empty): both buttons were offered, and the
// first press ended on "No microphone was found on this device." A button that
// cannot work is not offered; the reason is said instead.
//
// enumerateDevices lists one entry per KIND of device that exists, even
// before permission is asked (labels stay empty until then), so "no
// audioinput at all" is a real answer without prompting anyone. When the list
// cannot be read the answer is null (unknown), and unknown never hides a
// Record button (DR-0076: unknown is not a verdict).
// =============================================================================
import { useEffect, useState } from 'react';

/** true / false from a device list, or null when there is no list. Pure. */
export function micPresentFrom(devices) {
  if (!Array.isArray(devices)) return null;
  return devices.some((d) => d && d.kind === 'audioinput');
}

/** Ask the browser once. Resolves true / false / null. Never throws. */
export async function probeMicPresent(nav = typeof navigator === 'undefined' ? null : navigator) {
  try {
    const md = nav && nav.mediaDevices;
    if (!md || typeof md.enumerateDevices !== 'function') return null;
    return micPresentFrom(await md.enumerateDevices());
  } catch (_) { return null; }
}

/** The same answer as a hook, kept current when a microphone is plugged in. */
export function useMicPresent(nav = typeof navigator === 'undefined' ? null : navigator) {
  const [present, setPresent] = useState(null);
  useEffect(() => {
    let live = true;
    const ask = () => { probeMicPresent(nav).then((p) => { if (live) setPresent(p); }); };
    ask();
    const md = nav && nav.mediaDevices;
    try { if (md && md.addEventListener) md.addEventListener('devicechange', ask); } catch (_) { /* old engine */ }
    return () => { live = false; try { if (md && md.removeEventListener) md.removeEventListener('devicechange', ask); } catch (_) { /* ignore */ } };
  }, [nav]);
  return present;
}

/** What a device with no microphone is told, in place of a Record button. */
export const NO_MICROPHONE_LINE = 'This device has no microphone, so nothing can be recorded here. Type it instead, or record it on a phone signed in to the same account.';
