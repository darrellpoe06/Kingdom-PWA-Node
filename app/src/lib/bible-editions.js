// =============================================================================
// bible-editions — the sovereign BASE-TEXT registry: which Scripture editions we
// may reproduce in full, and on what license. (Darrell 2026-06-25.)
// =============================================================================
// Driver: full freedom to use, display, annotate, and build on our Scripture text
// with NO licensing limits, within the context of Yahweh. That freedom is only
// real if the base text is genuinely free. So the license is not a footnote here —
// it is enforced DATA. Every edition we reproduce verbatim must be public-domain
// (or an explicit free/open license that permits modify + redistribute +
// commercial). A test asserts that invariant; an edition that fails it cannot be
// marked `reproduce: true`.
//
// Provenance: licenses verified 2026-06-25 against primary/authoritative sources
// (research-review: docs/99-session-notes/2026-06-25-poetech-study-edition-
// base-text-license-research-review.md). Re-confirm before any print/legal page.
//
// THE TWO LAYERS (binding — see study-edition.js):
//   SCRIPTURE TEXT  — the editions below, reproduced VERBATIM, version-labeled,
//                     never reworded. This is the Word; it is not ours to alter.
//   CLARIFICATION   — plain-language + 4D + Yahweh-context + word study, held in a
//                     structurally separate layer and clearly labeled commentary.
// This file owns ONLY the text layer's provenance + license.
// =============================================================================

// License kinds we accept for FULL reproduction. Each says, in one line, what it
// lets us do — so the freedom claim is checkable, not assumed.
export const LICENSE = {
  PUBLIC_DOMAIN: {
    id: 'public-domain',
    label: 'Public Domain',
    free: true, // may reproduce in full
    modify: true, // may alter / build derivatives
    redistribute: true,
    commercial: true,
    attribution: false,
    summary: 'No rights reserved. Reproduce, modify, redistribute, and build on it without limit.',
  },
  CC_BY_4: {
    id: 'cc-by-4.0',
    label: 'CC BY 4.0',
    free: true,
    modify: true,
    redistribute: true,
    commercial: true,
    attribution: true, // must credit the source
    summary: 'Free to reproduce, modify, and use commercially WITH attribution to the source.',
  },
};

// Editions. `reproduce: true` means we ship the FULL verbatim text in-app (only
// public-domain texts qualify today). `wordLayer: true` marks original-language /
// tagged datasets used for WORD STUDY rather than as a reading column.
export const EDITIONS = [
  {
    id: 'WEB',
    label: 'World English Bible',
    short: 'WEB',
    year: 1997,
    language: 'en',
    modernEnglish: true,
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: true,
    source: 'eBible.org / Michael Paul Johnson (worldenglish.bible)',
    note: 'Modern-English public-domain base. The TEXT is PD and modifiable; the NAME '
      + '"World English Bible" is trademarked, so a MODIFIED text must be renamed. We '
      + 'reproduce it VERBATIM and label it as WEB, so the trademark is honored.',
    textModule: 'scripture-web.js',
  },
  {
    id: 'KJV',
    label: 'King James Version (1611)',
    short: 'KJV',
    year: 1611,
    language: 'en',
    modernEnglish: false,
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: true,
    source: 'Authorized Version, 1611 (public domain in the United States)',
    note: 'The traditional English pillar. Public domain in the US. UK distribution '
      + 'touches the Crown’s perpetual letters-patent (Cambridge/Oxford) — a separate '
      + 'legal question for any UK shipment, flagged, not assumed.',
    textModule: 'scripture-kjv.js',
  },
  // --- Public-domain editions cleared for future reproduction (not yet ingested) -
  {
    id: 'ASV',
    label: 'American Standard Version (1901)',
    short: 'ASV',
    year: 1901,
    language: 'en',
    modernEnglish: false,
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: false,
    source: 'American Standard Version, 1901 (copyright expired)',
    note: 'Public domain. The WEB is itself a PD revision of the ASV. Cleared; not yet ingested.',
  },
  {
    id: 'YLT',
    label: 'Young’s Literal Translation',
    short: 'YLT',
    year: 1898,
    language: 'en',
    modernEnglish: false,
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: false,
    source: 'Robert Young, 1862 / rev. 1898 (public domain)',
    note: 'Public domain. Hyper-literal — useful as a study cross-check. Cleared; not yet ingested.',
  },
  {
    id: 'DARBY',
    label: 'Darby Bible',
    short: 'Darby',
    year: 1890,
    language: 'en',
    modernEnglish: false,
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: false,
    source: 'J. N. Darby, 1890 (public domain)',
    note: 'Public domain. Cleared; not yet ingested.',
  },
  // --- Original-language WORD-STUDY layer (tagged datasets; not reading columns) --
  {
    id: 'OSHB',
    label: 'Open Scriptures Hebrew Bible (WLC)',
    short: 'WLC',
    language: 'he',
    license: LICENSE.CC_BY_4,
    reproduce: false,
    wordLayer: true,
    source: 'openscriptures/morphhb — PD Westminster Leningrad Codex text + CC BY 4.0 morphology',
    note: 'Hebrew word study. Source from morphhb (PD text + CC-BY tags) — NOT from any '
      + 'CC-BY-NC-ND distribution, which would forbid our use. Attribution required on the tags.',
  },
  {
    id: 'RP',
    label: 'Byzantine Majority Text (Robinson–Pierpont 2018)',
    short: 'RP2018',
    language: 'grc',
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: false,
    wordLayer: true,
    source: 'byztxt/byzantine-majority-text — RP2018 (public domain)',
    note: 'Primary Greek for word study — public domain, freely modifiable. Chosen OVER the '
      + 'SBLGNT, whose EULA bars standalone sale and requires a license for any Greek-English '
      + 'diglot (which a study edition essentially is). Avoid SBLGNT.',
  },
  {
    id: 'STRONGS',
    label: 'Strong’s Concordance (1890)',
    short: "Strong's",
    language: 'mul',
    license: LICENSE.PUBLIC_DOMAIN,
    reproduce: false,
    wordLayer: true,
    source: 'James Strong, 1890 Hebrew & Greek dictionaries + numbering (public domain)',
    note: 'Public-domain word-level lexicon + numbering. Use the plain 1890 text (some modern '
      + '“enhanced” Strong’s adds copyrighted edits). STEPBible TAGNT/TAHOT (CC BY 4.0) supply '
      + 'the Strong’s-tagged morphology for the fuller word layer.',
  },
];

// AVOID — recorded so a future contributor does not reach for these by habit. The
// registry is as much about what we must NOT reproduce as what we may.
export const AVOID = [
  {
    id: 'SBLGNT',
    label: 'SBL Greek New Testament',
    why: 'Marketed as CC-BY but the binding EULA bars standalone sale, requires a license for any '
      + 'Greek-English diglot (a study edition is one), and is silent on modification. Ambiguous, '
      + 'not free — route to legal/SME. Use Robinson–Pierpont RP2018 instead.',
  },
  {
    id: 'ESV', label: 'English Standard Version', why: 'Copyrighted (Crossway). Quote within limits, never reproduce or base our text on it.',
  },
  {
    id: 'NIV', label: 'New International Version', why: 'Copyrighted (Biblica). Never reproduce.',
  },
  {
    id: 'NLT', label: 'New Living Translation', why: 'Copyrighted (Tyndale). Never reproduce.',
  },
  {
    id: 'NET-NOTES', label: 'NET Bible translators’ notes', why: 'The NOTES are fully copyrighted — do not bundle or reformat them.',
  },
];

// --- Helpers -----------------------------------------------------------------

export function editionById(id) {
  return EDITIONS.find((e) => e.id === id) || null;
}

// The editions we reproduce in full, in reading order (modern English first).
export function reproducibleEditions() {
  return EDITIONS.filter((e) => e.reproduce);
}

// The original-language / tagged datasets used for word study.
export function wordLayerEditions() {
  return EDITIONS.filter((e) => e.wordLayer);
}

// THE INVARIANT, as a function (so a test can assert it and the UI can show it):
// nothing is reproduced in full unless its license permits reproduce + redistribute.
// Returns { ok, violations: [{ id, reason }] }.
export function verifyLicenses() {
  const violations = [];
  for (const e of EDITIONS) {
    if (e.reproduce) {
      const lic = e.license || {};
      if (!lic.free) violations.push({ id: e.id, reason: 'reproduced in full but license is not free' });
      if (!lic.redistribute) violations.push({ id: e.id, reason: 'reproduced in full but license forbids redistribution' });
    }
  }
  return { ok: violations.length === 0, violations };
}

// A short, honest provenance line for a reproduced edition — shown under the text.
export function provenanceLine(id) {
  const e = editionById(id);
  if (!e) return '';
  return `${e.label} — ${e.license.label}. ${e.source}.`;
}
