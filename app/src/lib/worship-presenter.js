// =============================================================================
// worship-presenter — the worship-presentation model (the "ProPresenter brain")
// =============================================================================
// STRATEGIC GOAL (Darrell 2026-06-24): PoeTech's own Presenter should REPLACE
// ProPresenter as the church's worship-presentation system, so ProPresenter no longer
// needs its dedicated CUDA machine — FREEING one of the church's 2x RTX 4070 boxes for
// live-mix A.I. / local LLM / transcription. This module is the pure, testable core
// that makes that possible: a SET LIST (run-of-show) of worship items the operator
// advances through with a clicker, where every step drives the live output.
//
// IT REUSES, IT DOES NOT REINVENT:
//   • OUTPUT to the two side screens + the switcher rides the NDI program output
//     shipped in #322 (lib/ndi-output.js): each cue maps to a program payload an OBS
//     Browser Source picks up and DistroAV republishes as an NDI source. Lyrics render
//     BIG (the lyric payload), Scripture renders as Scripture — parity-correct.
//   • The in-app two-screen PREVIEW + the time-budget planning reuse the universal
//     `presentable` contract (#306, lib/presentable.js): setListToPresentable() emits
//     scenes the existing <Presenter>/<AudienceWindow> + fitToBudget already render.
//   • The run-of-show is DRIVEN by the master Sunday program (the order-of-service
//     lane) through a generic adapter — masterProgramToSetList() — so one source of
//     truth (the Sunday program) becomes the worship presentation, no re-entry.
//
// SO: one operator advance -> the NDI output to the screens AND the in-app preview,
// from the Sunday program already entered. Pure here; the operator console + the
// reliability hardening are the next, separately-shipped increments (see the roadmap
// note 2026-06-24-presenter-replaces-propresenter-roadmap.md).
//
// DESIGN INVARIANT (DR-0076, carried from presentable.js): the audience/output payload
// carries ONLY what the room should see. Operator cues (next-up, CCLI, prep) never
// reach the screen.
// =============================================================================
import {
  holdProgram, scriptureProgram, lyricProgram, lowerThird, slideProgram,
} from './ndi-output.js';

// How many lyric lines a single screen-cue shows before it becomes the next cue.
// A worship screen holds ~2-4 lines comfortably at the large size; sections longer
// than this split into multiple advanceable cues (verse 1a / verse 1b), like
// ProPresenter's auto-slicing. Tunable per song via section.linesPerSlide.
export const DEFAULT_LINES_PER_SLIDE = 4;

// --- Item builders (a SET LIST is an ordered array of these) ----------------------

// A song: named sections + an ARRANGEMENT (the order to advance through, so a chorus
// can repeat without duplicating its lines). sections is a map id -> { label, lines }.
export function buildSong({ id = '', title = '', author = '', ccli = '', sections = {}, arrangement = [], linesPerSlide } = {}) {
  return {
    kind: 'song',
    id: String(id || title || 'song'),
    title: String(title || '').trim(),
    author: String(author || '').trim(),
    ccli: String(ccli || '').trim(),
    linesPerSlide: Number(linesPerSlide) > 0 ? Number(linesPerSlide) : null,
    sections: sections && typeof sections === 'object' ? sections : {},
    // Default arrangement = the section keys in declared order, if none given.
    arrangement: Array.isArray(arrangement) && arrangement.length ? arrangement.slice() : Object.keys(sections || {}),
  };
}

export function scriptureItem({ id = '', ref = '', text = '', translation = '' } = {}) {
  return { kind: 'scripture', id: String(id || ref || 'scripture'), ref: String(ref || '').trim(), text: String(text || '').trim(), translation: String(translation || '').trim() };
}
export function slideItem({ id = '', eyebrow = '', title = '', body = '', ref = '' } = {}) {
  return { kind: 'slide', id: String(id || title || 'slide'), eyebrow: String(eyebrow || '').trim(), title: String(title || '').trim(), body: String(body || '').trim(), ref: String(ref || '').trim() };
}
export function announcementItem({ id = '', title = '', body = '' } = {}) {
  // An announcement is a slide with a fixed eyebrow — kept as its own builder so the
  // master-program adapter can map its announcement rows cleanly.
  return slideItem({ id: id || 'announcement', eyebrow: 'Announcement', title, body });
}
export function lowerThirdItem({ id = '', name = '', role = '' } = {}) {
  return { kind: 'lower-third', id: String(id || name || 'lower-third'), name: String(name || '').trim(), role: String(role || '').trim() };
}
export function holdItem({ id = '', title = '' } = {}) {
  return { kind: 'hold', id: String(id || 'hold'), title: String(title || '').trim() };
}

// --- Song -> cues (the auto-slicing that gives verse/chorus advance) ---------------

// Split a section's lines into screen-sized chunks. One section can become several
// advanceable cues when it is long, so the operator never shows an unreadable wall.
function chunkLines(lines, per) {
  const list = (Array.isArray(lines) ? lines : []).map((l) => String(l == null ? '' : l).trim()).filter(Boolean);
  const size = Number(per) > 0 ? Number(per) : DEFAULT_LINES_PER_SLIDE;
  if (!list.length) return [[]];
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Expand a song into its ordered list of lyric cues, following the arrangement.
export function songCues(song) {
  if (!song || song.kind !== 'song') return [];
  const per = song.linesPerSlide || DEFAULT_LINES_PER_SLIDE;
  const cues = [];
  song.arrangement.forEach((sectionId) => {
    const section = song.sections[sectionId];
    if (!section) return;
    const chunks = chunkLines(section.lines, per);
    chunks.forEach((chunk, ci) => {
      cues.push({
        itemId: song.id,
        itemKind: 'song',
        sectionId,
        sectionLabel: section.label || sectionId,
        partLabel: chunks.length > 1 ? `${section.label || sectionId} (${ci + 1}/${chunks.length})` : (section.label || sectionId),
        songTitle: song.title,
        ref: song.ccli ? `CCLI ${song.ccli}` : '',
        lines: chunk,
      });
    });
  });
  return cues;
}

// --- Set list -> the flat, ordered CUE LIST the operator advances through ----------

// Every advanceable step across the whole service, in order. Songs expand to their
// section cues; everything else is one cue. Each cue is self-describing + position-aware.
export function buildCues(setList) {
  const items = Array.isArray(setList) ? setList : [];
  const cues = [];
  items.forEach((item, itemIndex) => {
    if (!item || !item.kind) return;
    if (item.kind === 'song') {
      songCues(item).forEach((c) => cues.push({ ...c, itemIndex }));
    } else {
      cues.push({ itemId: item.id, itemKind: item.kind, itemIndex, ...item });
    }
  });
  return cues.map((c, i) => ({ ...c, key: `${c.itemId}:${c.sectionId || c.itemKind}:${i}`, cueIndex: i, cueTotal: cues.length }));
}

// Clamp an advance (clicker next/prev or a direct jump). Never throws, never escapes
// the list — a presenter pressing past the end simply holds the last cue.
export function advanceCue(cues, index, dir = 1) {
  const total = (Array.isArray(cues) ? cues : []).length;
  if (!total) return 0;
  const next = (Number(index) || 0) + (Number(dir) || 0);
  return Math.max(0, Math.min(total - 1, next));
}

// --- Cue -> NDI program payload (the OUTPUT to the side screens + switcher) ---------

// Map one cue to a lib/ndi-output payload. This is what gets broadcast on
// PROGRAM_CHANNEL so the NdiProgramOutput route (OBS Browser Source -> NDI) renders it
// on the screens. Lyrics render BIG (lyricProgram), Scripture as Scripture, etc.
export function cueToProgram(cue) {
  if (!cue) return holdProgram();
  switch (cue.itemKind) {
    case 'song':
      return lyricProgram({ title: cue.songTitle || cue.sectionLabel, lines: cue.lines, ref: cue.ref });
    case 'scripture':
      return scriptureProgram({ ref: cue.ref, text: cue.text, translation: cue.translation });
    case 'slide':
      return slideProgram({ eyebrow: cue.eyebrow, title: cue.title, body: cue.body, ref: cue.ref });
    case 'lower-third':
      return lowerThird({ name: cue.name, role: cue.role });
    case 'hold':
    default:
      return holdProgram(cue.title);
  }
}

// A short, operator-only "what's on screen / what's next" label (the stage-display
// line). NEVER broadcast — it's the operator's confidence readout.
export function cueOperatorLabel(cue) {
  if (!cue) return '';
  if (cue.itemKind === 'song') return `${cue.songTitle || 'Song'} — ${cue.partLabel || cue.sectionLabel}`;
  if (cue.itemKind === 'scripture') return `Scripture — ${cue.ref || ''}`.trim();
  if (cue.itemKind === 'slide') return `Slide — ${cue.title || cue.eyebrow || ''}`.trim();
  if (cue.itemKind === 'lower-third') return `Lower-third — ${cue.name || ''}`.trim();
  return `Hold — ${cue.title || ''}`.trim();
}

// --- Set list -> presentable (in-app preview + time-budget planning reuse) ---------

// Flatten a set list into the universal `presentable` contract so the existing
// <Presenter>/<AudienceWindow> primitive (#306) renders an in-app two-screen preview
// and fitToBudget() can reflow the service into the minutes actually available. The
// audience scene carries ONLY room-facing copy (invariant).
export function setListToPresentable(setList, { id = 'worship-set', title = 'Worship', kicker, targetMin = 0 } = {}) {
  const cues = buildCues(setList);
  const scenes = cues.map((c) => {
    const program = cueToProgram(c);
    let sceneTitle;
    let lead;
    if (c.itemKind === 'song') { sceneTitle = c.songTitle || c.sectionLabel; lead = (c.lines || []).join('\n'); }
    else if (c.itemKind === 'scripture') { sceneTitle = c.ref || 'Scripture'; lead = c.text || ''; }
    else if (c.itemKind === 'slide') { sceneTitle = c.title || c.eyebrow || ''; lead = c.body || ''; }
    else if (c.itemKind === 'lower-third') { sceneTitle = c.name || ''; lead = c.role || ''; }
    else { sceneTitle = c.title || 'Hold'; lead = ''; }
    return {
      id: c.key,
      indexLabel: `${c.cueIndex + 1} of ${c.cueTotal}`,
      dateLabel: null,
      audience: { title: sceneTitle, lead, detail: c.itemKind === 'song' ? c.partLabel : null, detailLabel: 'Section', anchorRef: c.ref || null, anchorTheme: null },
      // operator-only; never broadcast
      notes: [{ kind: 'callout', heading: 'Operator', body: cueOperatorLabel(c) }],
      // carry the program payload so an operator console can broadcast it directly
      _program: program,
    };
  });
  return { id, title, kicker, targetMin, scenes };
}

// --- The master Sunday program seam (the order-of-service lane drives this) --------

// Generic adapter: the master Sunday program (the order-of-service lane, not yet on
// main) is a list of run-of-show rows. We consume a SMALL, documented shape so the two
// lanes stay decoupled — when the program lane lands, point it here, no rewrite.
//
// Expected row shape (any extra fields ignored):
//   { type:'song'|'scripture'|'slide'|'announcement'|'lower-third'|'hold',
//     title?, author?, ccli?, sections?, arrangement?,   // song
//     ref?, text?, translation?,                          // scripture
//     eyebrow?, body?,                                    // slide / announcement
//     name?, role? }                                      // lower-third
export function masterProgramToSetList(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map((rawRow, i) => {
    const r = rawRow && typeof rawRow === 'object' ? rawRow : {};
    const t = String(r.type || '').toLowerCase();
    const id = r.id || `${t || 'item'}-${i}`;
    switch (t) {
      case 'song': return buildSong({ id, title: r.title, author: r.author, ccli: r.ccli, sections: r.sections, arrangement: r.arrangement, linesPerSlide: r.linesPerSlide });
      case 'scripture': return scriptureItem({ id, ref: r.ref, text: r.text, translation: r.translation });
      case 'announcement': return announcementItem({ id, title: r.title, body: r.body });
      case 'slide': return slideItem({ id, eyebrow: r.eyebrow, title: r.title, body: r.body, ref: r.ref });
      case 'lower-third': return lowerThirdItem({ id, name: r.name, role: r.role });
      case 'hold': default: return holdItem({ id, title: r.title });
    }
  });
}

// --- ProPresenter parity map, as DATA (honest have/partial/gap) --------------------
// The single source the roadmap doc + any in-app "parity" surface share, so the claim
// never drifts from reality (Verification Doctrine, DR-0076). NOT a marketing list —
// it states plainly what still has to be built before the church relies on it.
export const PARITY = { HAVE: 'have', PARTIAL: 'partial', GAP: 'gap' };

export const PROPRESENTER_PARITY = [
  { feature: 'Song lyrics (verse/chorus advance)', status: PARITY.HAVE, note: 'songCues() follows the arrangement + auto-slices long sections; lyrics render big via lyricProgram.' },
  { feature: 'Scripture display', status: PARITY.HAVE, note: 'scriptureItem -> scriptureProgram; text fetched-not-from-memory upstream (SCRIPTURE-REFERENCE-STANDARD).' },
  { feature: 'Slides / announcements', status: PARITY.HAVE, note: 'slideItem / announcementItem -> slideProgram.' },
  { feature: 'Lower-thirds (keyed overlay)', status: PARITY.HAVE, note: 'lowerThirdItem -> keyed, transparent NDI bar for the switcher to composite.' },
  { feature: 'Live NDI output to switcher + screens', status: PARITY.HAVE, note: 'OBS Browser Source + DistroAV (#322); each cue is a program payload.' },
  { feature: 'Two side-screen outputs', status: PARITY.HAVE, note: 'two NdiProgramOutput sources (program + keyed lower-third); both are NDI sources on the LAN.' },
  { feature: 'Operator / clicker advance workflow', status: PARITY.PARTIAL, note: 'advanceCue() + cueOperatorLabel() are done (pure); the operator CONSOLE UI (live/preview, hotkeys) is the next increment.' },
  { feature: 'Run-of-show from the master Sunday program', status: PARITY.PARTIAL, note: 'masterProgramToSetList() adapter is ready; the order-of-service lane lands separately, then points here.' },
  { feature: 'Song / slide LIBRARY (stored, searchable, reusable)', status: PARITY.GAP, note: 'needs a persisted, searchable library (DB) so songs are entered once and reused; today set lists are built in code/from the program.' },
  { feature: 'Smooth transitions (crossfade)', status: PARITY.GAP, note: 'a CSS crossfade between cues on the output route; cosmetic, low-effort, after the console.' },
  { feature: 'Stage display (presenter monitor: current + next + clock)', status: PARITY.PARTIAL, note: 'reuses the <Presenter> notes panel + setListToPresentable scenes; a dedicated next-up/clock layout is a small add.' },
  { feature: 'Themes / looks (multiple backgrounds, fonts)', status: PARITY.PARTIAL, note: 'one verified high-contrast theme today; a look-picker is later, behind the contrast gate.' },
  { feature: 'Reliability: no white-screen, crash recovery, graceful fallback', status: PARITY.GAP, note: 'BINDING before live reliance — error boundary per surface, output-state persistence + instant recovery, holding-slide fallback. See the roadmap reliability plan.' },
];

// A tiny rollup so a surface/test can assert progress honestly.
export function parityRollup(rows = PROPRESENTER_PARITY) {
  const count = (s) => rows.filter((r) => r.status === s).length;
  return { total: rows.length, have: count(PARITY.HAVE), partial: count(PARITY.PARTIAL), gap: count(PARITY.GAP) };
}
