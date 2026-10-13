// =============================================================================
// paste-input — clipboard paste as a first-class input beside file upload
// =============================================================================
// MANDATE (Darrell, 2026-07-24): "make the inputs inside the PoeTech App take
// copy paste directly as well as through a file upload process… copy a screen
// shot and paste into a cell that expects that." The friction this removes is
// real and measured: tonight's incident review ran on screenshots that had to
// be saved-then-picked; Ctrl+V is the path a working adult reaches for first,
// and it is one gesture instead of four for the elderly, tech-novice member
// (COMMUNITY-FIRST). Surfaces keep their existing file pickers — paste is an
// ADDITIONAL door into the SAME pipeline (compressImageFile etc.), never a
// replacement (ANXIETY-CLARITY: both paths visible, either works).
//
// Pure extraction over a ClipboardEvent-shaped object — no DOM, no globals —
// so the logic is unit-testable and every surface wires it in one line:
//
//   <div onPaste={(e) => { const fs = filesFromClipboardEvent(e);
//     if (fs.length) { e.preventDefault(); onPickImage(fs); } }}>
//
// SECURITY/TRUST: paste hands us exactly what the OS clipboard holds — same
// trust level as a file picked from disk. It rides the same isLikelyImageFile
// gate and compression the picker path already applies (image.js); nothing
// pasted bypasses validation, and non-file paste (plain text) is left to the
// browser's default text handling untouched.

/**
 * Collect File objects from a ClipboardEvent (or any object shaped like one).
 * Reads BOTH clipboardData.files (the simple case — a screenshot copied from
 * the OS lands here) and clipboardData.items with kind === 'file' (Chrome
 * puts image/png paste here; getAsFile() may return null — filtered). Pure;
 * returns [] for anything malformed. Never throws.
 */
export function filesFromClipboardEvent(event) {
  const cd = event && event.clipboardData;
  if (!cd) return [];
  const out = [];
  try {
    const files = cd.files;
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) if (files[i]) out.push(files[i]);
    }
    // items covers browsers that expose the pasted image only as an item.
    if (out.length === 0 && cd.items && cd.items.length) {
      for (let i = 0; i < cd.items.length; i++) {
        const it = cd.items[i];
        if (it && it.kind === 'file' && typeof it.getAsFile === 'function') {
          const f = it.getAsFile();
          if (f) out.push(f);
        }
      }
    }
  } catch (_) { /* malformed clipboard payload → treat as empty */ }
  return out;
}

/** True when the event carries at least one pasted file (image or otherwise). */
export function clipboardHasFiles(event) {
  return filesFromClipboardEvent(event).length > 0;
}
