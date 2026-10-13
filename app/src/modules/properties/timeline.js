// =============================================================================
// timeline — the door's own chronology, across every tenancy it has held
// =============================================================================
// Darrell, 2026-08-27: "historical events to be chronological showing the latest
// documents and notes about each property and tenants when they leave and move
// in... pictures between each etc..."
//
// buildHistory() (model.js) reads ONE tenancy and is unchanged — it is what a
// tenant sees of their own term. This reads the DOOR, which outlives its
// tenants, and it is the management view.
//
// The shape Darrell described is chapters, not a flat list:
//
//     move-in -> the term -> move-out -> THE TURN -> the next move-in
//
// The turn is the part a flat feed loses, and it is the part that matters: the
// move-out condition photos, the work done between tenants, the move-in
// condition photos of whoever came next. Those pictures sit BETWEEN two
// tenancies and belong to neither, which is why property_photos lets a photo
// hang on the door with no tenancy at all (0153).
//
// Newest first, because Darrell asked for the latest first. Inside a chapter
// the events run newest first too, so opening a door shows where it stands now
// and reading downward walks backwards through how it got there.
// =============================================================================

/**
 * How far either side of a lease boundary a condition photo may sit and still
 * belong to the turn. Fourteen days covers the ordinary case — walk-through the
 * week before hand-back, the new tenant's walk-through the week before they
 * move — without reaching so far that it swallows a short tenancy whole.
 */
export const TURN_GRACE_DAYS = 14;
const TURN_GRACE_MS = TURN_GRACE_DAYS * 24 * 60 * 60 * 1000;

const ms = (value) => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
};

const iso = (value) => {
  const t = ms(value);
  return t === null ? null : new Date(t).toISOString();
};

/** A tenancy that has ended, by either signal — an end date or a status. */
export function hasEnded(tenancy = {}) {
  const endedStatus = ['ended', 'moved-out', 'terminated', 'evicted'].includes(
    String(tenancy.status ?? '').toLowerCase(),
  );
  const endMs = ms(tenancy.lease_end);
  return endedStatus || (endMs !== null && endMs <= Date.now());
}

/** The human label for a tenancy chapter — never blank, never invented. */
export function tenancyLabel(tenancy = {}) {
  const name = String(tenancy.tenant_name ?? '').trim();
  if (name) return name;
  // A subsidised door whose household is genuinely unnamed in the record (the
  // 1003 Koehn case) must not be labelled "Unknown" as though something were
  // lost — nothing was recorded to lose.
  return 'Household not named in the record';
}

/**
 * The move-in and move-out events for one tenancy. A tenancy with no lease_start
 * still yields a chapter — it is undated, which the reader must be able to say.
 */
export function transitionEvents(tenancy = {}) {
  const out = [];
  const who = tenancyLabel(tenancy);
  if (tenancy.lease_start) {
    out.push({
      kind: 'move-in',
      id: `move-in-${tenancy.id}`,
      at: iso(tenancy.lease_start),
      ms: ms(tenancy.lease_start),
      tenancyId: tenancy.id ?? null,
      summary: `${who} moved in`,
      who,
      raw: tenancy,
    });
  }
  if (hasEnded(tenancy) && tenancy.lease_end) {
    out.push({
      kind: 'move-out',
      id: `move-out-${tenancy.id}`,
      at: iso(tenancy.lease_end),
      ms: ms(tenancy.lease_end),
      tenancyId: tenancy.id ?? null,
      summary: `${who} moved out`,
      who,
      raw: tenancy,
    });
  }
  return out;
}

/** A photo becomes an event at the moment it was taken, or filed if unknown. */
export function photoEvents(photos = []) {
  return photos.map((p, i) => {
    const when = p.taken_at || p.uploaded_at || null;
    return {
      kind: 'photo',
      id: p.id || `photo-${i}`,
      at: iso(when),
      ms: ms(when),
      tenancyId: p.tenancy_id ?? null,
      photoKind: p.kind ?? '',
      // Unknown timing must read as unknown, never as the moment we noticed it.
      datedByUpload: !p.taken_at && Boolean(p.uploaded_at),
      summary: p.caption || p.kind || 'Photo',
      who: p.author_label || '',
      raw: p,
    };
  });
}

/** A generated or filed document becomes an event when it was issued. */
export function documentEvents(docs = []) {
  return docs.map((d, i) => {
    const when = d.issued_at || d.created_at || null;
    return {
      kind: 'document',
      id: d.id || `doc-${i}`,
      at: iso(when),
      ms: ms(when),
      tenancyId: d.tenancy_id ?? null,
      summary: d.title || d.document_id || 'Document',
      who: d.author_label || '',
      raw: d,
    };
  });
}

const newestFirstCmp = (a, b) => {
  const au = a.ms === null;
  const bu = b.ms === null;
  if (au !== bu) return au ? 1 : -1; // undated sinks, never floats to "latest"
  if (au && bu) return String(a.id).localeCompare(String(b.id));
  return (b.ms - a.ms) || String(a.id).localeCompare(String(b.id));
};

/**
 * Every event at a door, newest first, across all its tenancies.
 * `events` is whatever buildHistory produced per tenancy, already carrying
 * `tenancyId`; the rest are read here.
 */
export function doorEvents({ tenancies = [], events = [], photos = [], docs = [] } = {}) {
  const all = [
    ...tenancies.flatMap(transitionEvents),
    ...events.map((e) => ({ ...e, ms: Number.isFinite(e.ms) ? e.ms : ms(e.at) })),
    ...photoEvents(photos),
    ...documentEvents(docs),
  ];
  return all.sort(newestFirstCmp);
}

/**
 * The door's history as chapters: each tenancy newest-first, with the TURN
 * between one tenancy ending and the next beginning carrying whatever belongs
 * to neither — the condition photos, the work done in the gap.
 */
export function buildPropertyTimeline({ tenancies = [], events = [], photos = [], docs = [] } = {}) {
  const stream = doorEvents({ tenancies, events, photos, docs });

  // Tenancies newest-first by start, so chapter order matches the stream.
  const chapters = [...tenancies].sort((a, b) => {
    const am = ms(a.lease_start);
    const bm = ms(b.lease_start);
    if (am === null && bm === null) return String(a.id).localeCompare(String(b.id));
    if (am === null) return 1;
    if (bm === null) return -1;
    return bm - am;
  });

  const byTenancy = new Map(chapters.map((t) => [t.id, []]));
  const unanchored = [];
  for (const e of stream) {
    if (e.tenancyId && byTenancy.has(e.tenancyId)) byTenancy.get(e.tenancyId).push(e);
    else unanchored.push(e);
  }

  const out = [];
  for (let i = 0; i < chapters.length; i += 1) {
    const t = chapters[i];
    const next = chapters[i + 1]; // the PREVIOUS tenancy in time (newest-first)

    // The turn sits between this tenancy's start and the previous one's end.
    // An event with no tenancy of its own falls in the gap it happened in.
    const startMs = ms(t.lease_start);
    const priorEndMs = next ? ms(next.lease_end) : null;
    // The window is the gap, WIDENED BY A GRACE PERIOD at both ends. A move-out
    // condition set is shot in the days BEFORE the lease ends and a move-in set
    // in the days before the new one starts — an exact-boundary window would
    // exclude precisely the photographs the turn exists to hold. Only events no
    // tenancy claimed are placed this way, so widening can never take an event
    // out of a household's own chapter.
    const lo = priorEndMs === null ? null : priorEndMs - TURN_GRACE_MS;
    const hi = startMs === null ? null : startMs + TURN_GRACE_MS;
    const inTurn = unanchored.filter((e) => {
      if (e.ms === null) return false;
      if (hi !== null && e.ms > hi) return false;
      if (lo !== null && e.ms < lo) return false;
      return true;
    });

    out.push({
      type: 'tenancy',
      tenancyId: t.id,
      label: tenancyLabel(t),
      movedIn: iso(t.lease_start),
      movedOut: hasEnded(t) ? iso(t.lease_end) : null,
      current: !hasEnded(t),
      undated: startMs === null,
      events: byTenancy.get(t.id) ?? [],
    });

    if (inTurn.length > 0) {
      out.push({
        type: 'turn',
        after: next ? tenancyLabel(next) : null,
        before: tenancyLabel(t),
        from: priorEndMs === null ? null : iso(next.lease_end),
        to: startMs === null ? null : iso(t.lease_start),
        events: inTurn.sort(newestFirstCmp),
        photos: inTurn.filter((e) => e.kind === 'photo').length,
      });
    }
  }

  // Anything that landed in no chapter and no turn is still shown — dropping an
  // event silently would make the timeline lie about being complete.
  const placed = new Set(out.flatMap((c) => c.events.map((e) => e.id)));
  const orphans = stream.filter((e) => !placed.has(e.id));
  if (orphans.length > 0) {
    out.push({
      type: 'unplaced',
      reason: 'these belong to the door but fall outside every tenancy and turn',
      events: orphans,
    });
  }
  return out;
}

/**
 * The pictures that bracket a turn, which is the pair a deposit argument turns
 * on: what the leaving household left, and what the arriving one walked into.
 */
export function turnPhotos(chapter = {}) {
  const photos = (chapter.events ?? []).filter((e) => e.kind === 'photo');
  return {
    movedOut: photos.filter((p) => p.photoKind === 'move-out-condition'),
    turn: photos.filter((p) => p.photoKind === 'turn'),
    movedIn: photos.filter((p) => p.photoKind === 'move-in-condition'),
    complete:
      photos.some((p) => p.photoKind === 'move-out-condition') &&
      photos.some((p) => p.photoKind === 'move-in-condition'),
  };
}

/** The latest documents and notes at a door — what Darrell opens the page to see. */
export function latestAtDoor(stream = [], { limit = 5 } = {}) {
  const pick = (kinds) => stream.filter((e) => kinds.includes(e.kind)).slice(0, limit);
  return {
    documents: pick(['document', 'job-doc', 'notice']),
    notes: pick(['note', 'property-note', 'message']),
    photos: pick(['photo']),
    transitions: pick(['move-in', 'move-out']),
  };
}
