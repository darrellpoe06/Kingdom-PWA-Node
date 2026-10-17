// =============================================================================
// home-activity — "Recent Activity" on the home, read from the records the app
// already holds (DR-1046 Phase 3; DR-0061: never a painted row)
// =============================================================================
// The reference image shows a Recent Activity card. Everything in it must be
// traceable to a record, so this module is a pure function over the world the
// shell keeps in `data`: incident and project lifecycle logs (every phase
// change is written there with a time and a note), notes (createdAt), Life
// Gallery photos (the day they were added), goals (createdAt) and the focus
// items that were checked off. Nothing is invented; when the family has done
// nothing yet the list is empty and the card says so.
//
// Each entry: { id, at (ISO or YYYY-MM-DD), kind, title, sub, view, churchView, booksView }.
// `view` is where a tap lands (the host's router ids, read out of the shell
// like lib/life-hub.js does), never a route that does not exist (DR-0330).

const MAX_DEFAULT = 6;

function iso(v) {
  if (!v) return '';
  const s = String(v);
  return s;
}
function ms(v) {
  if (!v) return 0;
  const t = Date.parse(String(v));
  return Number.isFinite(t) ? t : 0;
}
function clip(s, n = 72) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** Lifecycle log entries of incidents and projects, newest phase change per record. */
export function lifecycleEntries(items = [], { kind, view, titleOf } = {}) {
  const out = [];
  for (const it of Array.isArray(items) ? items : []) {
    const log = it && it.lifecycle && Array.isArray(it.lifecycle.log) ? it.lifecycle.log : [];
    const last = log.length ? log[log.length - 1] : null;
    const at = (last && last.at) || (it && (it.createdAt || it.date)) || null;
    if (!at) continue;
    const title = titleOf ? titleOf(it) : (it.title || it.name || it.id);
    const phase = last && last.toPhase ? String(last.toPhase) : (it.status ? String(it.status) : '');
    const note = last && last.note && last.note !== 'created' ? clip(last.note, 56) : '';
    out.push({
      id: `${kind}-${it.id}`,
      at: iso(at),
      kind,
      title: clip(title),
      sub: [phase, note].filter(Boolean).join(' · '),
      view,
    });
  }
  return out;
}

/**
 * The merged, newest-first activity over the world. Pure; `now` only decides
 * what "today" means for the focus items.
 */
export function recentActivity(world = {}, { limit = MAX_DEFAULT } = {}) {
  const w = world || {};
  const entries = [
    ...lifecycleEntries(w.incidents, { kind: 'incident', view: 'overview', titleOf: (i) => i.title || i.description || i.category || 'Incident' }),
    ...lifecycleEntries(w.projects, { kind: 'project', view: 'projects' }),
    ...(Array.isArray(w.notes) ? w.notes : []).filter((n) => n && n.createdAt).map((n) => ({
      id: `note-${n.id}`, at: iso(n.createdAt), kind: 'note', title: clip(n.text || 'Note'), sub: n.voice ? 'recorded note' : 'note', view: 'notes',
    })),
    ...(Array.isArray(w.lifePhotos) ? w.lifePhotos : []).filter((p) => p && p.date).map((p) => ({
      id: `photo-${p.id}`, at: iso(p.date), kind: 'photo', title: clip(p.caption || 'Photo added'), sub: p.category ? String(p.category) : 'Life Gallery', view: 'overview',
    })),
    ...(Array.isArray(w.goals) ? w.goals : []).filter((g) => g && g.createdAt).map((g) => ({
      id: `goal-${g.id}`, at: iso(g.createdAt), kind: 'goal', title: clip(g.title || 'Goal'), sub: `goal · ${g.status || 'open'}`, view: 'overview',
    })),
    ...(Array.isArray(w.dailyFocus) ? w.dailyFocus : []).filter((f) => f && f.done && (f.doneAt || f.day)).map((f) => ({
      id: `focus-${f.id}`, at: iso(f.doneAt || f.day), kind: 'focus', title: clip(f.label || 'Focus'), sub: 'done', view: 'overview',
    })),
  ];
  entries.sort((a, b) => ms(b.at) - ms(a.at));
  const n = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.floor(Number(limit)) : MAX_DEFAULT;
  return entries.slice(0, n);
}

/** "2h ago" / "3d ago" / the date, honest about a date-only stamp. */
export function agoLabel(at, now = new Date()) {
  const t = ms(at);
  if (!t) return '';
  const d = Math.max(0, (now.getTime ? now.getTime() : Number(now)) - t);
  const m = Math.floor(d / 60000);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(at))) {
    const days = Math.floor(d / 86400000);
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`;
  }
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}
