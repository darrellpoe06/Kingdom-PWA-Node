// =============================================================================
// call-to-give — the church's Call to Give, sourced from OUR OWN services
// =============================================================================
// Declared by Darrell 2026-07-10 (with the 2026-07-10 live-service link):
// "Can you also source all of the Call-To-Give's from the same YouTube and
// document sources we have? Add the historically — and all the videos should be
// able to get the transcripts from our videos now, correct?" (DR-0134.)
//
// REALITY-TRACE (DR-0061 / P15) — the derived recipe, nothing re-fetched:
//   - The corpus is the SAME service-video spine everything else reads:
//     choir_sermons rows (335-video @TheLoveCorner backfill + the email
//     importers) — this module never re-scrapes YouTube.
//   - The detector runs over the SAME live transcript rows the sermon library
//     and the Harvest ledger read (video_transcripts, migration 0058) — one
//     transcript source, many harvests.
//   - A video without a transcript row reads AWAITING TRANSCRIPT, honestly —
//     the loader is the manual NAS trickle (three brakes; YouTube rate-limits
//     bulk pulls) with the passive Whisper GPU endpoint as the caption-less
//     fallback. Coverage is MEASURED (callToGiveCoverage), never claimed.
//   - Every detected segment ships needsReview:true — the SME (the church, not
//     the model) confirms a giving appeal before it is treated as one
//     (the choir-archive discipline, DR-0076).
//
// PURE (no React, no network). call-to-give-sync.js fetches; ChurchGiving renders.
// Proven-to-catch in call-to-give.test.js.
// =============================================================================

export const CALL_TO_GIVE_RECORDED = '2026-07-10';

// The service Darrell linked when he declared this feature. The sandbox has NO
// route to YouTube (CONNECT 403 verified 2026-07-10), so its metadata is
// honestly PENDING until the NAS-side loader/backfill sees it — never painted.
export const LINKED_SERVICE_VIDEO = {
  videoId: 'efj-t2_Z-nI',
  url: 'https://www.youtube.com/live/efj-t2_Z-nI',
  provenance: 'linked by Darrell 2026-07-10 with the Call-To-Give directive; title/date pending the NAS-side fetch (sandbox has no YouTube route — CONNECT 403, verified)',
};

// The transcript answer, stated per the three tiers (DR-0100) — rendered beside
// the coverage numbers so "can all our videos get transcripts now?" always has
// a measured, honest answer on the surface itself.
export const TRANSCRIPT_PIPELINE_NOTE = {
  asOf: CALL_TO_GIVE_RECORDED,
  answer: 'Yes — every service video CAN get a transcript: the store is live in the app (video_transcripts) and two loaders feed it. The pace is deliberate: the NAS caption loader runs as a human-armed trickle because YouTube rate-limits bulk pulls, and the sovereign Whisper endpoint covers caption-less videos on demand. Coverage below is measured from the real rows, not assumed.',
  provenance: 'infra/nas-sme-pipeline/load-transcripts.py (manual, three brakes, trickle after YouTube IP-blocks at ~50-180 fetches); infra/church-gpu-node/whisper-gpu/server.py (passive fallback); migration 0058 (the live store)',
};

// --- The cue vocabulary (deterministic, reviewable) ---------------------------
// STRONG cues are giving-appeal language on their own; SUPPORT cues only count
// alongside a strong cue. All matching is case-insensitive on normalized text.
export const STRONG_CUES = [
  'call to give',
  'tithes and offering',
  'tithe and offering',
  'offering time',
  'giving time',
  'time to give',
  'receive the offering',
  'receive our tithes',
  'bring ye all the tithes',
  'mail your tithes',
  'givelify',
  'cash app',
  'tithe.ly',
  'giving link',
  'ways to give',
];
export const SUPPORT_CUES = [
  'tithe', 'tithes', 'offering', 'firstfruits', 'first fruits',
  'give unto', 'cheerful giver', 'storehouse', 'sow a seed', 'give online',
];

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');

function findCue(text, cue) {
  const i = text.indexOf(cue);
  return i === -1 ? null : { cue, index: i };
}

// --- The detector --------------------------------------------------------------
// Returns { found, confidence: 'high'|'medium'|'none', cues, excerpt, needsReview }.
// high   = 2+ strong cues, or 1 strong + 2+ support cues
// medium = 1 strong cue
// none   = no strong cue (support cues alone never claim a giving appeal —
//          "tithe" inside a teaching is not a Call to Give)
export function extractCallToGive(transcriptText, { excerptRadius = 240 } = {}) {
  const text = norm(transcriptText);
  if (!text.trim()) return { found: false, confidence: 'none', cues: [], excerpt: '', needsReview: false };

  const strong = STRONG_CUES.map((c) => findCue(text, c)).filter(Boolean);
  const support = SUPPORT_CUES.map((c) => findCue(text, c)).filter(Boolean);

  let confidence = 'none';
  if (strong.length >= 2 || (strong.length === 1 && support.length >= 2)) confidence = 'high';
  else if (strong.length === 1) confidence = 'medium';
  if (confidence === 'none') return { found: false, confidence, cues: [], excerpt: '', needsReview: false };

  const anchor = strong[0].index;
  const start = Math.max(0, anchor - excerptRadius);
  const end = Math.min(text.length, anchor + excerptRadius);
  const excerpt = `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;

  return {
    found: true,
    confidence,
    cues: [...strong.map((s) => s.cue), ...support.map((s) => s.cue)],
    excerpt,
    // The SME confirms; the detector proposes (choir-archive discipline, DR-0076).
    needsReview: true,
  };
}

// --- The archive, derived from the SAME corpus ----------------------------------
// sermonRows: choir_sermons-shaped rows ({ videoId|video_id, youtubeUrl|youtube_url,
// serviceDate|service_date, serviceType|service_type, title, speaker }).
// transcriptsByVideo: { [videoId]: { text } } (sermon-library-sync shape).
export function buildCallToGiveArchive(sermonRows, transcriptsByVideo = {}) {
  const out = [];
  for (const raw of Array.isArray(sermonRows) ? sermonRows : []) {
    if (!raw) continue;
    const videoId = raw.videoId || raw.video_id || '';
    if (!videoId) continue; // document-only rows have no video to harvest
    const t = transcriptsByVideo[videoId];
    const segment = t && t.text ? extractCallToGive(t.text) : null;
    out.push({
      videoId,
      youtubeUrl: raw.youtubeUrl || raw.youtube_url || `https://www.youtube.com/watch?v=${videoId}`,
      serviceDate: raw.serviceDate || raw.service_date || '',
      serviceType: raw.serviceType || raw.service_type || '',
      title: raw.title || '',
      speaker: raw.speaker || '',
      hasTranscript: !!(t && t.text),
      segment: segment && segment.found ? segment : null,
      awaitingTranscript: !(t && t.text),
    });
  }
  out.sort((a, b) => String(b.serviceDate).localeCompare(String(a.serviceDate)));
  return out;
}

// --- Coverage — the measured historical readout ---------------------------------
export function callToGiveCoverage(archive) {
  const rows = Array.isArray(archive) ? archive : [];
  const withTranscript = rows.filter((r) => r.hasTranscript);
  const detected = rows.filter((r) => r.segment);
  return {
    corpus: rows.length,
    withTranscript: withTranscript.length,
    detected: detected.length,
    awaiting: rows.length - withTranscript.length,
    // Detection only ever runs where a transcript exists — the honest denominator.
    detectedOfTranscribed: withTranscript.length ? Math.round((detected.length / withTranscript.length) * 100) : 0,
  };
}
