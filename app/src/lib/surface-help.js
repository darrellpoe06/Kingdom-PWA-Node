// =============================================================================
// surface-help — the two-tier self-explaining registry + Help freshness key
// =============================================================================
// Darrell 2026-07-01: "keeping up with the help tab keeps the PoeTech App clean
// and clear of clutter." The DEEP explanation lives in Help so surfaces stay
// LIGHT — but only if Help is kept CURRENT. A stale Help entry is clutter
// creeping back onto the surface.
//
// So every data-driven surface declares its LIGHT inline about HERE (keyed by its
// Help topic), instead of a local const scattered in the component. Centralizing
// it makes "surface has a CURRENT Help entry" a checkable, build-failing
// condition: aboutFingerprint() turns each about into a stable key, and
// scripts/help-freshness.mjs fails when a surface's about drifts from the Help
// entry it was last reconciled to (app/src/lib/help-freshness.json). When a
// surface is added/changed, its Help entry is auto-reconciled (`--sync`) or, if
// no deep entry exists yet, FLAGGED for a human to author — least-human upkeep.
//
// This registry is also the raw material for the Help -> lessons -> courses
// flywheel: the maintained what/where/how is the seed for teaching content.
//
// Pure + deterministic (no window, no crypto) so the gate runs headless in CI and
// on the NAS proactive-audit loop.
// =============================================================================

// Each surface's LIGHT inline about. `helpTopic` is a key into help-content.js's
// HELP registry (the DEEP tier). Keep what/where/how plain-language (the
// anxiety-clarity what/where/how standard) — one or two sentences each.
export const SURFACE_HELP = {
  'church:pulpit': {
    what: 'Every past message — Sundays and Wednesday Bible Study — as one searchable archive, newest first.',
    where: 'Your church database (the choir_sermons ledger), streamed live; the public view shows only published messages, never in-progress drafts.',
    how: 'Each message is filed under the month it was preached; jump to any month or date, search by title, scripture, or speaker, and watch the service inline.',
    helpTopic: 'church:pulpit',
  },
  'church:harvest': {
    what: 'The coverage ledger — every ingested service recording and what it has (and has not yet) been mined into, so no Sunday or Wednesday is wasted.',
    where: 'The video_harvests ledger joined over your real corpus (choir_sermons + choir_songs); every ✦ is a harvest verified against actual app data, never painted.',
    how: 'Recordings are filed by service date, newest first; orphans (nothing pulled yet) surface so you can confirm coverage. Jump to any month to audit a period.',
    helpTopic: 'church:harvest',
  },
};

// Get a surface's about by topic (what the component passes to RecordsLog).
export function aboutFor(topic) {
  return SURFACE_HELP[topic] || null;
}

// Stable, order-independent fingerprint of an about's human-facing copy. It
// changes when — and only when — the surface's own summary changes, which is the
// signal that its Help entry is due for review. FNV-1a over the normalized copy;
// pure, no dependencies.
export function aboutFingerprint(about) {
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const payload = JSON.stringify([norm(about && about.what), norm(about && about.where), norm(about && about.how)]);
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// Seed a Help entry (help-content.js shape) from a surface's about — the starter
// a human/AI completes when a NEW surface needs its DEEP entry. Keeps the deep
// tier anchored to the same what/where/how the surface shows.
export function deriveHelpFromAbout(about, meta = {}) {
  return {
    title: meta.title || 'This surface',
    tag: meta.tag || (about.what || '').slice(0, 80),
    what: about.what || '',
    how: [
      about.how || 'Use the controls to find what you need.',
      `Where the data comes from: ${about.where || 'the app database'}.`,
    ],
    why: meta.why || 'Knowing what a surface is, where its data comes from, and how it is built lets you trust and use it.',
    section: meta.section || 'start',
    _seededFromSurface: true,
  };
}
