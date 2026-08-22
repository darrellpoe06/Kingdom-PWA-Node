// =============================================================================
// direct-messages — pure logic for 1:1 messaging + "report to security".
// =============================================================================
// Declared by Darrell 2026-07-12, expanding the bus-ministry work: users need to
// speak to each other INDIVIDUALLY — inside a ministry (choir, bus) and across
// the app — not only in the group thread. And a specific coordination lane: a
// roster can message another roster (an usher tells security "come here"), and
// ANYONE can report to security. Security is the group with Observation-tab
// access to the building camera feeds + broadcast.
//
// The privacy MODEL (who may DM whom) is enforced server-side in
// infra/supabase/migrations-auto/0096-direct-messages-security.sql via
// users_can_dm(); only the two participants ever read a DM either way. This file
// is PURE (threading, unread counts, shapes) so the surface's rendering is
// unit-tested (DR-0076). It never decides access — RLS does.
//
// Word-first grounding (SCRIPTURE-REFERENCE-STANDARD): 1:1 is the pattern the
// Word gives for going to a brother — "go and tell him his fault between thee and
// him alone" (Matthew 18:15) — and every message is held to "Let no corrupt
// communication proceed out of your mouth, but that which is good to the use of
// edifying" (Ephesians 4:29).
// =============================================================================

// -----------------------------------------------------------------------------
// Direct-message shape. `otherUserId` is the correspondent from MY point of view
// (whichever of sender/recipient is not me) — the thread key.
// -----------------------------------------------------------------------------
export function toDmShape(row, myUserId) {
  const sender = row.sender_user_id ?? null;
  const recipient = row.recipient_user_id ?? null;
  const mine = !!myUserId && sender === myUserId;
  const otherUserId = mine ? recipient : sender;
  return {
    id: row.id,
    senderUserId: sender,
    recipientUserId: recipient,
    senderName: row.sender_name ?? '',
    otherUserId,
    body: row.body ?? '',
    createdAt: row.created_at ?? null,
    readAt: row.read_at ?? null,
    mine,
  };
}

// Flat DM rows -> threads (one per correspondent), newest-activity first. The
// inbox renders this; every count is a real tally, never stored.
export function groupDmThreads(rows = [], myUserId) {
  const by = new Map();
  for (const m of rows || []) {
    if (!m || !m.otherUserId) continue;
    const t = by.get(m.otherUserId) || {
      otherUserId: m.otherUserId,
      otherName: '',
      messages: [],
      lastAt: null,
      unread: 0,
    };
    t.messages.push(m);
    if (!t.lastAt || String(m.createdAt) > String(t.lastAt)) t.lastAt = m.createdAt;
    // The other party's most recent name we've seen (their outgoing messages).
    if (!m.mine && m.senderName) t.otherName = m.senderName;
    if (!m.mine && !m.readAt) t.unread += 1;
    by.set(m.otherUserId, t);
  }
  const threads = [...by.values()];
  for (const t of threads) {
    t.messages.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    t.last = t.messages[t.messages.length - 1] || null;
  }
  threads.sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)));
  return threads;
}

// Total unread DMs addressed to me (incoming + unread). Powers the nav badge.
export function unreadDmCount(rows = []) {
  return (rows || []).filter((m) => m && !m.mine && !m.readAt).length;
}

// Messages within a single 1:1 thread, oldest-first (the conversation view).
export function threadMessages(rows = [], otherUserId) {
  return (rows || [])
    .filter((m) => m && m.otherUserId === otherUserId)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

// Mark a thread's incoming messages read LOCALLY — the optimistic twin of the
// server-side markThreadRead, so the badge clears the instant the reader looks
// (Darrell 2026-08-22: "once I view the message I should not have it look like
// I didn't view it yet"). Pure: returns a new array; only the given thread's
// unread incoming rows change; everything else passes through by reference.
export function markThreadReadLocal(rows = [], otherUserId, atIso) {
  const at = atIso || new Date().toISOString();
  return (rows || []).map((m) => (
    m && m.otherUserId === otherUserId && !m.mine && !m.readAt ? { ...m, readAt: at } : m
  ));
}

// -----------------------------------------------------------------------------
// Security reports — "anyone can report to security." A report is an instance-
// scoped alert readable by the security team (Observation-tab holders). Status
// walks new -> acknowledged -> resolved.
// -----------------------------------------------------------------------------
export const SECURITY_STATUS = [
  ['new', 'New'],
  ['acknowledged', 'Acknowledged'],
  ['resolved', 'Resolved'],
];
export const securityStatusLabel = (s) => (SECURITY_STATUS.find(([k]) => k === s)?.[1]) || s;

export function toSecurityReportShape(row, myUserId) {
  return {
    id: row.id,
    reporterUserId: row.reporter_user_id ?? null,
    reporterName: row.reporter_name ?? 'Someone',
    body: row.body ?? '',
    location: row.location ?? null,
    status: row.status ?? 'new',
    createdAt: row.created_at ?? null,
    acknowledgedBy: row.acknowledged_by ?? null,
    acknowledgedAt: row.acknowledged_at ?? null,
    mine: !!myUserId && row.reporter_user_id === myUserId,
  };
}

// Open reports (not yet resolved), newest first — what security triages.
export function openSecurityReports(reports = []) {
  return (reports || [])
    .filter((r) => r && r.status !== 'resolved')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
export function openSecurityCount(reports = []) {
  return (reports || []).filter((r) => r && r.status !== 'resolved').length;
}

// A body must carry real content before it sends — no empty pings (Colossians
// 4:6, "let your speech be alway with grace"). Trim + minimum length.
export function isSendableBody(body) {
  return typeof body === 'string' && body.trim().length > 0;
}
