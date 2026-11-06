#!/usr/bin/env node
// gmail-thread-label.mjs -- the pure half of the lesson lock's road (DR-1354).
// =============================================================================
// WHY. The Gmail-lesson-intake Way (DR-0312) says a thread is labelled
// Lesson-Captured only after its lesson ships. Measured 2026-11-06: that label
// had NEVER been set on a single built thread. Not an oversight -- the only road
// to it was a connector write that stops for a human approval every time, so an
// unattended session cannot take it, and the lock is exactly what an unattended
// session needs. 7 of the 28 threads the intake query returns are already-
// shipped lessons wearing no lock; the ledger sweep has been doing the whole job
// of preventing duplicates by itself.
//
// `lesson-mail-watch.yml` is written to reach the mailbox over IMAP with
// GMAIL_WATCH_APP_PASSWORD and declares itself peek-only. In Gmail's IMAP a
// LABEL IS A FOLDER and `UID STORE ... +X-GM-LABELS` adds one, so the credential
// that reads can also set the lock -- from a runner, with no approval prompt.
//
// CORRECTED 2026-11-06 (DR-1355): that credential has NEVER BEEN SET. The
// watcher is dormant too and always has been, so the mechanism here is right
// and the key is missing. Measured on the first live dispatch.
// That is the road DR-0108 asks for: a GitHub runner first, a hand last.
//
// This file holds the parts worth pinning offline: the id conversion and the
// exact IMAP commands. The workflow does the network.
//
// THE CONVERSION IS THE SUBTLE PART. A Gmail API thread id is HEX
// ("1a163d58a4d068b6"); IMAP's X-GM-THRID is the same number in DECIMAL
// (1879757345405298870). Searching X-GM-THRID with the hex string matches
// nothing and reports no error, which would read as "already labelled".

/** Only these two labels may ever be written. A tool that can set any label is
 *  a tool that can mislabel the whole mailbox. */
export const ALLOWED_LABELS = ['Lesson-Captured', 'Lesson-Published'];

/** A Gmail thread id as the API gives it: lowercase hex, 16 digits in practice. */
export const THREAD_ID = /^[0-9a-f]{8,20}$/;

export function threadIdToThrid(hex) {
  const t = String(hex).trim().toLowerCase();
  if (!THREAD_ID.test(t)) {
    throw new Error(`gmail-thread-label: "${hex}" is not a Gmail thread id (lowercase hex, 8-20 chars)`);
  }
  // BigInt, not Number: 1879757345405298870 is past Number.MAX_SAFE_INTEGER, so
  // parseInt would round it and the search would silently match nothing.
  return BigInt(`0x${t}`).toString(10);
}

export function assertLabel(label) {
  if (!ALLOWED_LABELS.includes(label)) {
    throw new Error(`gmail-thread-label: refusing label "${label}"; allowed: ${ALLOWED_LABELS.join(', ')}`);
  }
  return label;
}

/** The IMAP exchange, as data, so a test can pin it without a mailbox. */
export function imapPlan(threadIds, label) {
  assertLabel(label);
  const ids = [...new Set(threadIds.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
  if (!ids.length) throw new Error('gmail-thread-label: no thread ids given');
  if (ids.length > 10) throw new Error(`gmail-thread-label: ${ids.length} threads is over the per-run budget of 10`);
  return {
    // All Mail, NOT Inbox: a forwarded thread may already be archived, and
    // selecting Inbox would find nothing and report success.
    select: '"[Gmail]/All Mail"',
    readonly: false,
    steps: ids.map((id) => ({
      threadId: id,
      search: ['UID', 'SEARCH', 'X-GM-THRID', threadIdToThrid(id)],
      store: (uids) => ['UID', 'STORE', uids.join(','), '+X-GM-LABELS', `(${label})`],
    })),
  };
}

/** Parse the comma/space separated input the workflow takes. */
export function parseThreadIds(raw) {
  return String(raw || '')
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
