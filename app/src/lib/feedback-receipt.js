// =============================================================================
// feedback-receipt — what the person who SENT the feedback gets back.
// =============================================================================
// Darrell, 2026-09-11, demonstrating the app to the COLG leadership, after
// submitting a note with his own email typed into it:
//
//   "I put my email in there as close to get a link back. I'm not getting the
//    link in my email. Send this. Can you screenshot and send it to text it to
//    me?"
//
// Two true things collided there. He expected a reference back. And this app has
// NO mail transport — the form never asked for an email and nothing ever sent
// one, so his address went into a free-text box and sat there. The honest fix is
// not to pretend a mail path exists; it is to give the sender something real and
// immediate that they can keep, and a place in the app where its status is
// visible. A reference code you can read aloud or screenshot beats an email that
// never comes (DR-0076 — never claim what we do not do).
//
// The other half is the answer he described giving people once an issue is
// known:
//
//   "Once it's a known issue, then you can tell them: hey, this is a known
//    issue. We know about it. We are in the process of working on it. Please be
//    patient with us."
//
// That sentence is now something the app SAYS, not something fifty people have
// to be told one at a time — and it says it truthfully, because the "N people
// reported this" it quotes comes from the real clustering of real rows
// (lib/feedback-clusters), never a comforting guess.
//
// Pure + deterministic (no Supabase, no React, no clock): the same row always
// yields the same code, offline, on every device.
// =============================================================================

import { clusterFeedback } from './feedback-clusters.js';

// Unambiguous when read out loud or copied off a photo: no 0/O, no 1/I/L, no
// vowels (so a code can never spell a word at anyone).
const ALPHABET = '23456789CFGHJKMNPQRTVWXY';

// receiptCode — a short, stable reference for one feedback row.
// Derived from the row's OWN id, so it needs no server, no counter, and no
// round-trip: the sender can be handed it the instant they tap Submit, and the
// same row shows the same code to a triager a week later.
export function receiptCode(id) {
  const s = String(id ?? '');
  if (!s) return '';
  // FNV-1a, 32-bit — small, dependency-free, and well-spread for short strings.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length) || (h ^ 0x9e3779b9) >>> 0;
  }
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

// The four honest states a sender's note can be in. `detail` is written to be
// read by the person who sent it — plain, specific, and never a promise.
export const RECEIPT_STATES = {
  received: {
    key: 'received', label: 'We have it',
    detail: 'It is on the board. Nobody has worked it yet — that is the honest status, not a brush-off.',
  },
  known: {
    key: 'known', label: 'Known issue',
    detail: 'Other people have reported this too. We know about it and it is in the queue to be fixed.',
  },
  working: {
    key: 'working', label: 'Being worked on',
    detail: 'Someone has picked this up. It is in progress.',
  },
  fixed: {
    key: 'fixed', label: 'Fixed',
    detail: 'This one is done. If it is still happening for you, send another note and say so — that matters more than the status.',
  },
};

const isResolved = (item) => {
  const t = item.triageStatus || item.triage_status || '';
  return t === 'resolved' || t === 'done' || t === 'fixed';
};
const isWorking = (item) => {
  const t = item.triageStatus || item.triage_status || '';
  return t === 'in-progress' || t === 'working' || t === 'reviewing';
};

// receiptStatus — where THIS note stands, told to the person who sent it.
// `allFeedback` is the whole board: without it the status is still correct, it
// just cannot say "and N other people said the same thing."
export function receiptStatus(item, allFeedback = null) {
  if (!item) return { ...RECEIPT_STATES.received, othersCount: 0 };
  if (isResolved(item)) return { ...RECEIPT_STATES.fixed, othersCount: 0 };

  // How many OTHER people said the same thing — the number that turns "we got
  // your note" into "this is a known issue." Measured, never estimated.
  let others = 0;
  if (Array.isArray(allFeedback) && allFeedback.length > 1) {
    const mine = clusterFeedback(allFeedback).find((c) => c.items.some((i) => i && i.id === item.id));
    if (mine) others = Math.max(0, mine.count - 1);
  }

  if (isWorking(item)) return { ...RECEIPT_STATES.working, othersCount: others };
  if (others > 0) {
    return {
      ...RECEIPT_STATES.known,
      othersCount: others,
      detail: `${others} other ${others === 1 ? 'person has' : 'people have'} reported this too. We know about it and it is in the queue — the ones the most people hit get fixed first.`,
    };
  }
  return { ...RECEIPT_STATES.received, othersCount: 0 };
}

// What the sender is told the moment they submit. Deliberately says what does
// NOT happen (no email) as clearly as what does, because the gap between those
// two is what cost Darrell a demo minute in front of the church leadership.
export function receiptMessage(id) {
  const code = receiptCode(id);
  return {
    code,
    headline: 'Got it — your note is in.',
    body: `Your reference is ${code}. We do not send email about feedback, so keep this code (a screenshot works) — it is how you or anyone here can find this exact note. Its status shows under "Your feedback" whenever you want to check.`,
  };
}

// mineOnly — the sender's own notes, newest first. The board is everyone's; this
// is the one slice a person is entitled to see as THEIRS.
export function mineOnly(allFeedback = [], userId = null) {
  return (allFeedback || [])
    .filter((f) => f && (f.mine === true || (userId && (f.userId === userId || f.user_id === userId))))
    .slice()
    .sort((a, b) => String(b.createdAt || b.submittedAt || b.submitted_at || '')
      .localeCompare(String(a.createdAt || a.submittedAt || a.submitted_at || '')));
}
