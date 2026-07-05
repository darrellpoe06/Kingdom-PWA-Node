// =============================================================================
// tab-sme — who is the Subject-Matter Expert for each tab, from the feedback
// people CHOSE to give (Darrell 2026-07-05: "see who likes which tabs so their
// feedback will be prioritized... they would be considered SMEs... everyone
// will eventually have their issue so we might as well fix it fast").
// =============================================================================
// THE TRUST MODEL — this is the privacy-honoring signal (governor's choice,
// 2026-07-05 "both, usage opt-in"): an SME is ranked from the feedback a person
// VOLUNTARILY submitted about an area, never from covert behavioral tracking.
// The usage_events stream stays aggregate-only ("no per-person behavior", the
// line migration 0073 holds); per-person tab USAGE is a separate, later,
// explicitly-opt-in governor signal — NOT this file. Everything here runs over
// `feedback` rows the person already chose to share (voice), so surfacing it
// crosses no privacy line and needs no new tracking.
//
// A "note" = one feedback submission. A person is an SME for an area once they
// have repeatedly engaged it (SME_MIN_NOTES); one note is NOT expertise
// (DR-0076 — don't over-claim). Their standing on that area rides their new
// feedback as a badge so it's triaged first.
//
// Pure + node-testable (no React, no imports): callers map area keys -> labels.
// Row shapes tolerated (local AND remote-synced feedback):
//   area:   f.which_tab | f.area | f.currentView
//   person: f.userId | f.user_id | f.displayName | f.display_name
//           (own LOCAL rows carry no submitter — attributed to opts.self)
//   time:   f.createdAt | f.submittedAt | f.submitted_at | f.at
// =============================================================================

// Repeated engagement, not a single note, earns the SME mark (honest, DR-0076).
export const SME_MIN_NOTES = 2;

function areaOf(f) {
  const a = f && (f.which_tab || f.area || f.currentView);
  return (typeof a === 'string' && a.trim()) ? a.trim() : null;
}

// A stable person key + a display name. Rows written by OTHER people carry their
// own identity; a person's OWN local rows carry none (they're the signed-in
// user), so they're credited to `self`. A row we can attribute to no one is
// excluded — we never invent a person to credit (DR-0076).
function personOf(f, self) {
  const id = f && (f.userId || f.user_id);
  const name = f && (f.displayName || f.display_name);
  if (id) return { key: `id:${id}`, name: (typeof name === 'string' && name.trim()) || 'Member' };
  if (typeof name === 'string' && name.trim()) return { key: `name:${name.trim().toLowerCase()}`, name: name.trim() };
  if (self && self.id) return { key: `id:${self.id}`, name: (self.name && String(self.name).trim()) || 'You' };
  if (self && self.name) return { key: `name:${String(self.name).trim().toLowerCase()}`, name: String(self.name).trim() };
  return null;
}

function timeOf(f) {
  const t = f && (f.createdAt || f.submittedAt || f.submitted_at || f.at);
  const ms = t ? Date.parse(t) : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function preferName(current, candidate) {
  // Prefer a real name over the generic placeholders.
  if (!candidate || candidate === 'Member' || candidate === 'You') return current;
  return candidate;
}

// The core aggregation: for each area, the people who've given feedback on it,
// ranked by how many notes they've contributed (most-engaged first). `smes` is
// the subset that has cleared SME_MIN_NOTES. Areas ordered by total voice.
export function tabSme(feedback, opts = {}) {
  const self = opts.self || null;
  const rows = Array.isArray(feedback) ? feedback : [];
  const byArea = new Map(); // area -> (personKey -> rec)

  for (const f of rows) {
    const area = areaOf(f);
    if (!area) continue;
    const person = personOf(f, self);
    if (!person) continue;
    let people = byArea.get(area);
    if (!people) { people = new Map(); byArea.set(area, people); }
    let rec = people.get(person.key);
    if (!rec) { rec = { key: person.key, name: person.name, notes: 0, lastAt: 0 }; people.set(person.key, rec); }
    rec.notes += 1;
    const t = timeOf(f);
    if (t > rec.lastAt) rec.lastAt = t;
    rec.name = preferName(rec.name, person.name);
  }

  const areas = [];
  for (const [area, people] of byArea) {
    const contributors = [...people.values()].sort(
      (a, b) => (b.notes - a.notes) || (b.lastAt - a.lastAt) || a.name.localeCompare(b.name)
    );
    const totalNotes = contributors.reduce((s, c) => s + c.notes, 0);
    areas.push({
      area,
      contributors,
      totalNotes,
      smes: contributors.filter((c) => c.notes >= SME_MIN_NOTES),
    });
  }
  areas.sort((a, b) => (b.totalNotes - a.totalNotes) || a.area.localeCompare(b.area));
  return areas;
}

// "Who likes which tabs" from the person's side: each person and the areas they
// weigh in on, their most-engaged area first. This is the roster the governor
// scans to know whose voice to weight where.
export function personTabs(feedback, opts = {}) {
  const areas = tabSme(feedback, opts);
  const byPerson = new Map();
  for (const a of areas) {
    for (const c of a.contributors) {
      let p = byPerson.get(c.key);
      if (!p) { p = { key: c.key, name: c.name, totalNotes: 0, areas: [] }; byPerson.set(c.key, p); }
      p.areas.push({ area: a.area, notes: c.notes, lastAt: c.lastAt, isSme: c.notes >= SME_MIN_NOTES });
      p.totalNotes += c.notes;
      p.name = preferName(p.name, c.name);
    }
  }
  const people = [...byPerson.values()];
  for (const p of people) p.areas.sort((x, y) => (y.notes - x.notes) || (y.lastAt - x.lastAt));
  people.sort((a, b) => (b.totalNotes - a.totalNotes) || a.name.localeCompare(b.name));
  return people;
}

// The submitter's standing in the area a single feedback item is about — the
// data the badge renders. null when the item has no resolvable area/person.
function standingIn(area, person, areaMap) {
  const a = areaMap.get(area);
  if (!a) return null;
  const idx = a.contributors.findIndex((c) => c.key === person.key);
  if (idx < 0) return null;
  const rec = a.contributors[idx];
  return {
    area,
    name: rec.name,
    notesOnArea: rec.notes,
    rank: idx + 1,
    contributors: a.contributors.length,
    isSme: rec.notes >= SME_MIN_NOTES,
    isTopVoice: idx === 0 && rec.notes >= SME_MIN_NOTES,
  };
}

// One-pass map: feedback item id -> its submitter's SME standing on its area.
// Built from a SINGLE aggregation so the promote queue can badge/sort every row
// without re-aggregating per item.
export function standingsById(feedback, opts = {}) {
  const areas = tabSme(feedback, opts);
  const areaMap = new Map(areas.map((a) => [a.area, a]));
  const out = new Map();
  const rows = Array.isArray(feedback) ? feedback : [];
  for (const f of rows) {
    const id = f && f.id;
    if (id == null) continue;
    const area = areaOf(f);
    const person = personOf(f, opts.self);
    if (!area || !person) continue;
    const s = standingIn(area, person, areaMap);
    if (s) out.set(id, s);
  }
  return out;
}

// Standing for one item on demand (thin wrapper; use standingsById for lists).
export function smeStanding(feedback, item, opts = {}) {
  const area = areaOf(item);
  const person = personOf(item, opts.self);
  if (!area || !person) return null;
  const areas = tabSme(feedback, opts);
  return standingIn(area, person, new Map(areas.map((a) => [a.area, a])));
}

// Order a feedback list SME-first (prioritized), then most-recent — the concrete
// "their feedback will be prioritized". Ties and non-SME rows keep recency order.
// Non-mutating.
export function prioritizeBySme(feedback, opts = {}) {
  const rows = Array.isArray(feedback) ? feedback.slice() : [];
  const standings = standingsById(feedback, opts);
  const weight = (f) => {
    const s = f && f.id != null ? standings.get(f.id) : null;
    return s && s.isSme ? s.notesOnArea : 0;
  };
  return rows.sort((a, b) => {
    const w = weight(b) - weight(a);
    if (w) return w;
    return timeOf(b) - timeOf(a);
  });
}
