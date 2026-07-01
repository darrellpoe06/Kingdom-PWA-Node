// =============================================================================
// rap-study — the interactive "RAP Bible Study" reflection (Darrell 2026-07-01)
// =============================================================================
// Recreates the printed Church of the Living God "Reflections and Praise (RAP)
// Bible Study" handout as a LIVE, interactive surface: the teaching outline
// (church / dates / teacher / Scriptures / the five points) is deterministic
// seed data here; each point is a FILL-IN reflection the user types (mirroring
// the blank lines under each point on the paper), saved DEVICE-LOCAL and PRIVATE
// by default, keyed to the signed-in identity — never sent to the cloud, never
// mined, never trained on (same sovereign posture as study-space.js).
//
// WIRED TO THE HARVEST (real data, DR-0076 reality-trace): the outline carries a
// harvest-match descriptor. When today's study video's transcript LANDS in the
// corpus (video_transcripts, surfaced by harvest-ledger.js), resolveStudyHarvest
// joins THIS study to that video by service date and returns the real transcript
// + the auto-harvested Scripture / lessons (deriveSignals output, already merged
// into each ledger row's `harvests`). Until the transcript lands the surface
// shows the honest 'awaiting' state — never a painted attachment.
//
// PURE by construction: the outline + the resolver + the persistence transforms
// take/return plain data (no I/O, no Date.now in the pure layer) so they unit-
// test in node. The only side-effecting calls are loadReflections/saveReflections,
// which guard a missing/throwing localStorage and fail soft.
// =============================================================================

const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.rapstudy.v1';

// --- The handout, as data ----------------------------------------------------
// Sourced from the printed RAP Bible Study handout Darrell provided (07-01-2026,
// points from 06-28-2026). Scripture text is PUBLIC-DOMAIN KJV, fetched verbatim
// (Bible Gateway) at capture time — never produced from memory (Verification
// Doctrine). The five point titles are transcribed verbatim from the paper; the
// paper's blank fill-in lines become the reflection fields below.
export const RAP_STUDY = Object.freeze({
  id: 'rap-2026-07-01-elijah',
  church: 'Church of the Living God',
  series: 'Reflections and Praise (RAP) Bible Study',
  handoutDate: '2026-07-01',   // the date printed on the handout
  pointsFrom: '2026-06-28',    // the study the points were drawn from
  theme: 'Elijah',
  teacher: 'Pastor Ken McCray',
  seniorBishop: 'Senior Bishop Lloyd E. Gwin',
  seniorBishopRole: 'RAP Bible Study Teacher',
  // The source stream this study attaches to when its transcript lands. `laneId`
  // is the external harvest-lane identifier the orchestrator writes; the in-app
  // join resolves by `serviceDate` against the harvest ledger (there is no lane
  // column in the corpus — the date is the real join key). `videoId` is filled in
  // once the specific recording is known, taking precedence over the date match.
  harvestMatch: Object.freeze({
    laneId: 'local_4d62ae64',
    serviceDate: '2026-07-01',
    videoId: null,
  }),
  scriptures: Object.freeze([
    Object.freeze({
      ref: 'Isaiah 61:7',
      translation: 'KJV',
      text: 'For your shame ye shall have double; and for confusion they shall rejoice in their portion: therefore in their land they shall possess the double: everlasting joy shall be unto them.',
    }),
    Object.freeze({
      ref: '2 Kings 2:9-10',
      translation: 'KJV',
      text: 'And it came to pass, when they were gone over, that Elijah said unto Elisha, Ask what I shall do for thee, before I be taken away from thee. And Elisha said, I pray thee, let a double portion of thy spirit be upon me. And he said, Thou hast asked a hard thing: nevertheless, if thou see me when I am taken from thee, it shall be so unto thee; but if not, it shall not be so.',
    }),
  ]),
  // The five points — each is a reflection section on the paper (blank lines =
  // fill-in). `id` is stable so a saved reflection survives copy edits to the
  // prompt text.
  points: Object.freeze([
    Object.freeze({ id: 'p1', n: 1, title: 'Elijah is standing before Ahab' }),
    Object.freeze({ id: 'p2', n: 2, title: 'God sustains Elijah' }),
    Object.freeze({ id: 'p3', n: 3, title: 'Elijah stand before Ahab again' }),
    Object.freeze({ id: 'p4', n: 4, title: 'Elijah is replaced' }),
    Object.freeze({ id: 'p5', n: 5, title: 'Elijah is taken to heaven by a whirlwind' }),
  ]),
});

// The registry of studies this surface can render. Today it is the one handout;
// new weeks append here (or, later, load from the sovereign rail) — the surface
// is written against the list, not the single entry.
export const RAP_STUDIES = Object.freeze([RAP_STUDY]);

export function studyById(id) {
  return RAP_STUDIES.find((s) => s.id === id) || null;
}

// --- Per-identity reflection persistence (device-local, private) --------------

export function reflectionsKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}

// The whole device-local store for one identity: reflections keyed by studyId.
//   { version, studies: { [studyId]: { points: { [pointId]: text }, general, visibility, updatedAt } } }
export function emptyStore() {
  return { version: STORE_VERSION, studies: {} };
}

// One study's reflection record, normalized. `visibility` defaults to 'private'
// (device-local already makes it private; the field reserves the shared-rail
// choice for when the sovereign community rail lands — no painted cloud share).
export function emptyReflection() {
  return { points: {}, general: '', visibility: 'private', updatedAt: null };
}

export function normalizeReflection(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const points = {};
  if (r.points && typeof r.points === 'object') {
    for (const k of Object.keys(r.points)) {
      const v = r.points[k];
      if (typeof v === 'string' && v.length) points[k] = v;
    }
  }
  return {
    points,
    general: typeof r.general === 'string' ? r.general : '',
    visibility: r.visibility === 'community' ? 'community' : 'private',
    updatedAt: r.updatedAt || null,
  };
}

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}

export function loadStore(email) {
  const ls = safeStorage();
  if (!ls) return emptyStore();
  try {
    const raw = ls.getItem(reflectionsKey(email));
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    const studies = {};
    if (parsed && parsed.studies && typeof parsed.studies === 'object') {
      for (const sid of Object.keys(parsed.studies)) studies[sid] = normalizeReflection(parsed.studies[sid]);
    }
    return { version: STORE_VERSION, studies };
  } catch {
    return emptyStore();
  }
}

export function saveStore(email, store) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    const payload = { version: STORE_VERSION, studies: (store && store.studies) || {} };
    ls.setItem(reflectionsKey(email), JSON.stringify(payload));
    return { saved: true };
  } catch (e) {
    return { skipped: 'write-error', error: e };
  }
}

// Read one study's reflection out of a loaded store (always a normalized record).
export function reflectionFor(store, studyId) {
  return normalizeReflection(store && store.studies ? store.studies[studyId] : null);
}

// Pure update: return a NEW store with one point's text set for a study, stamping
// updatedAt from the caller's clock (Date.now stays out of the pure layer).
export function setPointText(store, studyId, pointId, text, nowIso) {
  const base = store && store.studies ? store : emptyStore();
  const current = reflectionFor(base, studyId);
  const points = { ...current.points };
  if (typeof text === 'string' && text.length) points[pointId] = text; else delete points[pointId];
  const next = { ...current, points, updatedAt: nowIso || current.updatedAt };
  return { version: STORE_VERSION, studies: { ...base.studies, [studyId]: next } };
}

export function setGeneralText(store, studyId, text, nowIso) {
  const base = store && store.studies ? store : emptyStore();
  const current = reflectionFor(base, studyId);
  const next = { ...current, general: typeof text === 'string' ? text : '', updatedAt: nowIso || current.updatedAt };
  return { version: STORE_VERSION, studies: { ...base.studies, [studyId]: next } };
}

// How many of a study's points the user has written something in (progress the
// surface shows honestly — real typed state, not a painted number).
export function reflectionProgress(reflection, study) {
  const r = normalizeReflection(reflection);
  const total = (study && study.points ? study.points : []).length;
  const filled = (study && study.points ? study.points : [])
    .filter((p) => (r.points[p.id] || '').trim().length > 0).length;
  return { filled, total, pct: total ? Math.round((filled / total) * 100) : 0 };
}

// --- Harvest join (pure; real-state, DR-0076) --------------------------------

// Resolve a study to its harvested video and the teaching mined from it.
//   rows        : harvest-ledger rows (harvestLedgerSummary().rows) — each carries
//                 videoId / serviceDate / serviceType / title and the merged
//                 `harvests` map (deriveSignals output: scripture.refs, lessons.refs…).
//   transcripts : optional { [videoId]: { text } } for the transcript excerpt.
// Returns an honest status:
//   'awaiting' — no matching video yet (nothing ingested for this study's date).
//   'ingested' — the video exists but has no transcript yet (partial harvest).
//   'attached' — a real transcript is present; Scripture + lessons are mined.
export function resolveStudyHarvest(study, { rows = [], transcripts = {} } = {}) {
  const match = (study && study.harvestMatch) || {};
  const wantVideo = match.videoId || null;
  const wantDate = match.serviceDate || (study && study.handoutDate) || null;

  const candidates = (rows || []).filter((r) => {
    if (!r) return false;
    if (wantVideo) return r.videoId === wantVideo;
    return wantDate && r.serviceDate === wantDate;
  });
  // Prefer a Bible-study/Wednesday recording, then a stable videoId tie-break, so
  // the join is deterministic when a date has more than one recording.
  candidates.sort((a, b) => {
    const score = (r) => (/(wednesday|bible|study|lesson)/i.test(`${r.serviceType || ''} ${r.sourceKind || ''} ${r.title || ''}`) ? 0 : 1);
    return score(a) - score(b) || String(a.videoId).localeCompare(String(b.videoId));
  });
  const video = candidates[0] || null;

  if (!video) {
    return { status: 'awaiting', video: null, transcriptText: '', scriptures: [], lessons: [], laneId: match.laneId || null };
  }

  const h = video.harvests || {};
  const scr = h.scripture && Array.isArray(h.scripture.refs) ? h.scripture.refs : [];
  const les = h.lessons && Array.isArray(h.lessons.refs) ? h.lessons.refs : [];
  const dis = h.discernment && Array.isArray(h.discernment.refs) ? h.discernment.refs : [];
  const tes = h.testimony && Array.isArray(h.testimony.refs) ? h.testimony.refs : [];
  const t = transcripts && transcripts[video.videoId];
  const transcriptText = t && typeof t.text === 'string' ? t.text : '';
  const hasTranscript = !!(transcriptText && transcriptText.trim().length) || (h.transcript && h.transcript.status === 'complete');

  return {
    status: hasTranscript ? 'attached' : 'ingested',
    video: { videoId: video.videoId, title: video.title || null, serviceDate: video.serviceDate || null, serviceType: video.serviceType || null, youtubeUrl: video.youtubeUrl || null },
    transcriptText,
    scriptures: scr,
    lessons: les,
    discernment: dis,
    testimony: tes,
    laneId: match.laneId || null,
  };
}
