// =============================================================================
// draft-autosave — words in the one input surface survive without a Save tap
// =============================================================================
// "Can you see if you can automatically save your notes like a google doc
// without hitting save. So when you stall out with time or forget and come
// back, your information is still there." (Christina, 2026-07-10, typing
// "1. Book cover" into the Thinking Space.)
//
// Every keystroke in the ONE input primitive (OneVoiceInput, DR-0131) is
// persisted as a device-local DRAFT — text, chosen destination, and name —
// keyed per surface. Coming back (a reload, a stall-out, a closed tab)
// restores the draft into the box; a successful Send/Save clears it. Drafts
// are the writer's own words on their own device (DATA-AS-EMPOWERMENT:
// localStorage, nothing egresses until they choose a destination and send).
//
// Pure + null-safe + injectable storage — unit-tested in draft-autosave.test.js.

export const DRAFT_PREFIX = 'poe-onevoice-draft:';

export function draftKey(surface) {
  return `${DRAFT_PREFIX}${surface || 'default'}`;
}

function storage(win) {
  try {
    const w = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);
    return w && w.localStorage && typeof w.localStorage.getItem === 'function' ? w.localStorage : null;
  } catch {
    return null; // private mode can throw
  }
}

// The saved draft for a surface, or null (missing, corrupt, or empty text).
export function readDraft(surface, win) {
  const ls = storage(win);
  if (!ls) return null;
  try {
    const raw = JSON.parse(ls.getItem(draftKey(surface)) || 'null');
    if (!raw || typeof raw !== 'object' || typeof raw.text !== 'string' || !raw.text.trim()) return null;
    return {
      text: raw.text,
      route: typeof raw.route === 'string' ? raw.route : null,
      name: typeof raw.name === 'string' ? raw.name : '',
      at: typeof raw.at === 'string' ? raw.at : null,
    };
  } catch {
    return null;
  }
}

// Persist the draft. Empty text CLEARS it (an emptied box is not a draft).
// Never throws; returns whether a draft is now stored.
export function writeDraft(surface, { text = '', route = null, name = '' } = {}, win, at) {
  const ls = storage(win);
  if (!ls) return false;
  try {
    if (!String(text).trim()) { ls.removeItem(draftKey(surface)); return false; }
    ls.setItem(draftKey(surface), JSON.stringify({ text: String(text), route, name: String(name || ''), at: at || new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(surface, win) {
  const ls = storage(win);
  if (!ls) return;
  try { ls.removeItem(draftKey(surface)); } catch { /* nothing to do */ }
}
