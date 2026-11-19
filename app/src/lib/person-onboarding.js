// =============================================================================
// person-onboarding — did they get in, and which apps have they opened?
// =============================================================================
// Darrell, 2026-11-19, on Admin > Users & usage > Signups: "How do I know who
// signed up and if and when they got in? Coreyon is supposed to be using the
// Poe Properties App... he may also want the Love Corner App... as well as the
// PoeTech App... how do I know and how do we help people when they have
// onboarding issues?!"
//
// This module reads the governor-only records and shapes them for the
// Signups rows. Every line is drawn from a real row (DR-0076): a door never
// opened reads "never", a visit from before doors were recorded is counted as
// exactly that and never given a door, and an unreadable record says it could
// not be read instead of reading as "nothing happened".
//
//   admin_person_doors()  (0339, DR-1591)  which app each visit was
// =============================================================================
import { restRpc, readSnapshotToken } from './access-metrics-sync.js';
import { relativeTime } from './access-metrics.js';
import { DOORS } from './app-doors.js';

// ── fetch ────────────────────────────────────────────────────────────────────
// The same discriminated status as fetchSignupMetrics: never throws, never paints.
async function governorRead(fn, body = {}) {
  const token = readSnapshotToken();
  if (!token) return { status: 'signed-out' };
  try {
    const { data, error } = await restRpc(fn, body, token);
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (error.code === '42501' || msg.includes('not authorized')) return { status: 'unauthorized' };
      return { status: 'unavailable', error };
    }
    if (!data || typeof data !== 'object') return { status: 'unavailable', error: { message: 'no answer' } };
    return { status: 'ready', data };
  } catch (e) {
    return { status: 'unavailable', error: { message: (e && e.message) || String(e) } };
  }
}

export function fetchPersonDoors() {
  return governorRead('admin_person_doors');
}

// ── doors ────────────────────────────────────────────────────────────────────

/** The apps every row names, opened or not: the three a person is placed in. */
export const NAMED_DOORS = ['poetech', 'lovecorner', 'properties'];

const doorByKey = new Map(DOORS.map((d) => [d.key, d]));
export function doorLabel(key) {
  const d = doorByKey.get(key);
  return d ? d.label : String(key || 'Unknown app');
}

/** A calendar date, said the way a person says it (Central, the family's clock). */
export function dayLabel(iso) {
  const t = Date.parse(iso || '');
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
}

/** user_id -> { doors: Map(key -> {firstAt,lastAt,n}), before: {n,lastAt}|null }. */
export function indexDoors(data) {
  const out = new Map();
  const people = data && Array.isArray(data.people) ? data.people : [];
  for (const p of people) {
    if (!p || !p.user_id) continue;
    const doors = new Map();
    for (const d of Array.isArray(p.doors) ? p.doors : []) {
      if (!d || !d.door) continue;
      doors.set(String(d.door), { firstAt: d.first_at || null, lastAt: d.last_at || null, n: Number(d.n) || 0 });
    }
    const b = p.before_tracking;
    out.set(String(p.user_id), { doors, before: b && Number(b.n) > 0 ? { n: Number(b.n), lastAt: b.last_at || null } : null });
  }
  return out;
}

/**
 * What one row says about the apps. `record` is indexDoors(...).get(userId)
 * (undefined when the person has no usage row at all). `since` is the
 * door_tracking_since stamp (null when no row has carried a door yet).
 *   { doors: [{ key, label, opened, firstAt, lastAt, text }], note }
 */
export function doorsView(record, since, nowMs, extraKeys = []) {
  const doors = (record && record.doors) || new Map();
  const keys = [...NAMED_DOORS];
  for (const k of [...extraKeys, ...doors.keys()]) if (k && !keys.includes(k)) keys.push(k);
  const rows = keys.map((key) => {
    const d = doors.get(key);
    const label = doorLabel(key);
    if (!d) return { key, label, opened: false, firstAt: null, lastAt: null, text: `${label}: never` };
    const first = relativeTime(d.firstAt, nowMs);
    const last = relativeTime(d.lastAt, nowMs);
    return {
      key,
      label,
      opened: true,
      firstAt: d.firstAt,
      lastAt: d.lastAt,
      text: first === last ? `${label}: ${first}` : `${label}: first ${first}, last ${last}`,
    };
  });
  const before = record && record.before;
  let note;
  if (!since) note = 'Which app a visit was in is recorded from this release on; nothing has been recorded with its app yet.';
  else note = `"Never" means not since door tracking began on ${dayLabel(since)}.`;
  if (before)
    note += ` ${before.n} earlier ${before.n === 1 ? 'visit was' : 'visits were'} recorded before door tracking began (last ${relativeTime(before.lastAt, nowMs)}), so which app ${before.n === 1 ? 'it was' : 'they were'} is not known.`;
  const beforeText = before ? `${before.n} earlier ${before.n === 1 ? 'visit' : 'visits'}, app not recorded (last ${relativeTime(before.lastAt, nowMs)})` : '';
  return { doors: rows, note, beforeText };
}

// =============================================================================
// DID THEY GET IN (DR-1592): admin_person_sign_ins() (0340)
// =============================================================================
export function fetchPersonSignIns() {
  return governorRead('admin_person_sign_ins');
}

const ms = (iso) => {
  const t = Date.parse(iso || '');
  return Number.isNaN(t) ? null : t;
};
const latest = (...isos) => {
  let best = null;
  for (const v of isos) {
    const t = ms(v);
    if (t != null && (best == null || t > best.t)) best = { t, iso: v };
  }
  return best ? best.iso : null;
};

/** How a person got in, said the way a person says it. */
const METHOD_LABELS = { email: 'email', phone: 'phone', google: 'Google', password: 'password or PIN' };
export function methodLabel(m) {
  const k = String(m || '').toLowerCase();
  return METHOD_LABELS[k] || (k ? k : 'unknown method');
}

/** user_id -> the cleaned sign-in record. */
export function indexSignIns(data) {
  const out = new Map();
  const people = data && Array.isArray(data.people) ? data.people : [];
  for (const p of people) {
    if (!p || !p.user_id) continue;
    const successAt = latest(p.last_sign_in_at, p.last_password_login_at, p.gotrue_login_at);
    // The method of the latest success, only where a record names it: GoTrue's
    // log names its provider; the password hook names "password or PIN".
    let method = null;
    if (successAt && successAt === p.gotrue_login_at && p.gotrue_method) method = p.gotrue_method;
    else if (successAt && successAt === p.last_password_login_at) method = 'password';
    out.set(String(p.user_id), {
      successAt,
      method,
      lastSignInAt: p.last_sign_in_at || null,
      linkSentAt: p.link_sent_at || null,
      lastFailedAt: p.last_failed_at || null,
      failedSinceSuccess: Number(p.failed_since_success) || 0,
      failed30d: Number(p.failed_30d) || 0,
      spaces: Array.isArray(p.spaces) ? p.spaces.filter(Boolean) : [],
      openInvites: Array.isArray(p.open_invites) ? p.open_invites.filter(Boolean) : [],
    });
  }
  return out;
}

/** The one line a row shows about getting in. */
export function signInLine(rec, nowMs) {
  if (!rec) return 'Sign-in record: none read for this account.';
  const parts = [];
  if (rec.successAt) parts.push(`Last got in ${relativeTime(rec.successAt, nowMs)}${rec.method ? ` by ${methodLabel(rec.method)}` : ''}`);
  else parts.push('Has never got in');
  if (rec.failedSinceSuccess > 0)
    parts.push(`${rec.failedSinceSuccess} failed ${rec.failedSinceSuccess === 1 ? 'try' : 'tries'} since (last ${relativeTime(rec.lastFailedAt, nowMs)})`);
  else if (rec.failed30d > 0) parts.push(`${rec.failed30d} failed in 30 days, none since`);
  const linkT = ms(rec.linkSentAt);
  const okT = ms(rec.successAt);
  if (linkT != null && (okT == null || linkT > okT)) parts.push(`sign-in link sent ${relativeTime(rec.linkSentAt, nowMs)}, not used`);
  return parts.join(' · ');
}

/** What is and is not recorded, said once under the list (DR-0076 rule 8). */
export function signInCoverage(data) {
  const gotrue = data && data.gotrue_audit;
  const since = data && data.password_record_since;
  const lines = [
    `Every successful sign-in, by any method, moves "last got in" (the auth server's own stamp).`,
    since
      ? `Password and phone+PIN tries, right or wrong, are recorded from ${dayLabel(since)}.`
      : 'Password and phone+PIN tries are recorded, but none has been written yet.',
    gotrue === 'read'
      ? 'The method of a Royalty Link or Google sign-in is read from the auth server’s own log (180 days).'
      : `The auth server’s own log could not be read (${gotrue || 'no answer'}), so a Royalty Link or Google sign-in shows when, not how.`,
    'Not recorded: a wrong or expired Royalty Link code.',
    'A password or PIN try with a phone or email that has no account is counted under a masked hint (the address itself is never kept).',
  ];
  return lines.join(' ');
}

// ── NEEDS HELP ───────────────────────────────────────────────────────────────
// Each rule reads real rows only, and each reason carries its time. A rule
// whose record could not be read says nothing rather than guessing.
export const QUIET_DAYS = 14; // was active, then nothing for this long
export const DOOR_GRACE_DAYS = 3; // added to a space; give them this long to open its app
const DAY = 86400000;

const MEMBER_DOOR_FOR_SLUG = new Map();
for (const d of DOORS) for (const s of d.instances) MEMBER_DOOR_FOR_SLUG.set(s, d);

/**
 * people: [{ userId, created_at, lastActiveAt, category }] (from the signups rows)
 * signIns: indexSignIns(...) or null when unreadable
 * doors: { index: indexDoors(...), since } or null when unreadable
 * Returns [{ userId, reasons: [{ code, text, at }] }], most recent reason first.
 */
export function needsHelp(people, signIns, doors, nowMs) {
  const out = [];
  for (const p of people || []) {
    if (!p || !p.userId || p.category === 'our-probe') continue;
    const rec = signIns ? signIns.get(p.userId) : null;
    const reasons = [];
    const created = ms(p.created_at);
    const active = ms(latest(p.lastActiveAt, rec && rec.successAt));
    const okT = rec ? ms(rec.successAt) : null;

    // 1. Created an account and never came back after.
    if (created != null && nowMs - created > DAY && (active == null || active - created <= 5 * 60000)) {
      reasons.push({ code: 'never-back', at: p.created_at, text: `Created an account ${relativeTime(p.created_at, nowMs)} and has not been back since.` });
    }
    if (rec) {
      // 2. Failed sign-ins with no success since.
      if (rec.failedSinceSuccess > 0 && rec.lastFailedAt && nowMs - ms(rec.lastFailedAt) <= 30 * DAY) {
        reasons.push({
          code: 'failing',
          at: rec.lastFailedAt,
          text: `${rec.failedSinceSuccess} failed sign-in ${rec.failedSinceSuccess === 1 ? 'try' : 'tries'} with no success since (last ${relativeTime(rec.lastFailedAt, nowMs)}).`,
        });
      }
      // 3. A sign-in link went out and nobody used it.
      const linkT = ms(rec.linkSentAt);
      if (linkT != null && (okT == null || linkT > okT) && nowMs - linkT > 3600000 && nowMs - linkT <= 30 * DAY) {
        reasons.push({
          code: 'link-unused',
          at: rec.linkSentAt,
          text: `A sign-in link was emailed ${relativeTime(rec.linkSentAt, nowMs)} and no sign-in followed.`,
        });
      }
      // 4. Got in, but has no space to be in.
      if (okT != null && rec.spaces.length === 0) {
        reasons.push({
          code: 'no-space',
          at: rec.successAt,
          text: `Got in ${relativeTime(rec.successAt, nowMs)} but has no space yet, so there is nothing for them inside.`,
        });
      }
      // 5a. Invited to Poe Properties and the invitation is not claimed.
      for (const inv of rec.openInvites) {
        reasons.push({
          code: 'invite-open',
          at: inv.created_at,
          text: `Invited to ${doorLabel(inv.door || 'properties')}${inv.role_label ? ` as ${String(inv.role_label).replace('_', ' ')}` : ''} ${relativeTime(inv.created_at, nowMs)}; the invitation is not claimed yet.`,
        });
      }
      // 5b. Added to a space whose app they have never opened.
      if (doors && doors.since) {
        const sinceT = ms(doors.since);
        const opened = (doors.index && doors.index.get(p.userId)) || null;
        const seenDoors = new Set();
        for (const sp of rec.spaces) {
          const d = MEMBER_DOOR_FOR_SLUG.get(String(sp.slug || '').toLowerCase());
          if (!d || d.key === 'poetech' || seenDoors.has(d.key)) continue;
          seenDoors.add(d.key);
          const fromT = Math.max(sinceT, ms(sp.joined_at) || 0);
          if (nowMs - fromT < DOOR_GRACE_DAYS * DAY) continue;
          const o = opened && opened.doors.get(d.key);
          if (o && ms(o.lastAt) >= fromT) continue;
          const joinedAfter = (ms(sp.joined_at) || 0) > sinceT;
          reasons.push({
            code: 'door-unopened',
            at: sp.joined_at || doors.since,
            text: `In ${d.label}${sp.joined_at ? ` since ${relativeTime(sp.joined_at, nowMs)}` : ''}, but has not opened the ${d.label} app ${joinedAfter ? 'since being added' : `since door tracking began on ${dayLabel(doors.since)}`}.`,
          });
        }
      }
    }
    // 6. Was active, then went quiet.
    if (active != null && created != null && active - created > 5 * 60000 && nowMs - active > QUIET_DAYS * DAY) {
      reasons.push({
        code: 'quiet',
        at: new Date(active).toISOString(),
        text: `Was active, last seen ${relativeTime(new Date(active).toISOString(), nowMs)}.`,
      });
    }
    if (reasons.length) {
      reasons.sort((a, b) => (ms(b.at) || 0) - (ms(a.at) || 0));
      out.push({ userId: p.userId, reasons });
    }
  }
  return out.sort((a, b) => (ms(b.reasons[0].at) || 0) - (ms(a.reasons[0].at) || 0));
}

/** Unclaimed invitations to an address with no account: asked in, never arrived. */
export function invitesWithoutAccount(data, nowMs) {
  const rows = data && Array.isArray(data.invites_without_account) ? data.invites_without_account : [];
  return rows
    .filter((r) => r && r.address)
    .map((r) => ({
      id: r.id || r.address,
      address: String(r.address),
      name: r.display_name || null,
      at: r.created_at || null,
      text: `Invited to ${doorLabel(r.door || 'properties')}${r.role_label ? ` as ${String(r.role_label).replace('_', ' ')}` : ''} ${relativeTime(r.created_at, nowMs)}; no account with this address yet.`,
    }));
}

// ── FIND A PERSON FAST ───────────────────────────────────────────────────────
const digitsOf = (s) => String(s || '').replace(/\D+/g, '');
/**
 * Does a row match what was typed? Over the name shown, the address, and the
 * phone digits (typed with or without punctuation, with or without the 1).
 * Every word typed must match somewhere. Empty matches all.
 */
export function matchesSearch(fields, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const hay = (fields || []).filter(Boolean).map((f) => String(f).toLowerCase());
  const hayDigits = (fields || []).map(digitsOf).filter(Boolean);
  return q.split(/\s+/).every((w) => {
    if (hay.some((h) => h.includes(w))) return true;
    const d = digitsOf(w);
    return d.length >= 3 && d.length === w.replace(/[\s().+-]/g, '').length && hayDigits.some((h) => h.includes(d));
  });
}

// =============================================================================
// A TRY WITH NO ACCOUNT (DR-1593): admin_sign_in_misses() (0341)
// =============================================================================
export function fetchSignInMisses() {
  return governorRead('admin_sign_in_misses');
}

/**
 * The tries with an address that has no account, as Needs help entries, and a
 * status line that says when the counter is off or its cap dropped tries.
 */
export function missesView(data, nowMs) {
  const rows = data && Array.isArray(data.misses) ? data.misses : [];
  const entries = rows
    .filter((m) => m && m.hint && Number(m.tries) > 0)
    .map((m) => {
      const tries = Number(m.tries);
      const days = Number(m.days) || 1;
      let text = `${tries} sign-in ${tries === 1 ? 'try' : 'tries'} with an address that has no account (last ${relativeTime(m.last_at, nowMs)}${days > 1 ? `, on ${days} days` : ''}).`;
      if (m.invite) {
        const who = m.invite.display_name || 'someone';
        const as = m.invite.role_label ? ` as ${String(m.invite.role_label).replace('_', ' ')}` : '';
        text += ` It is the address ${who} was invited to Poe Properties with${as}: they are trying to sign in before making an account.`;
      }
      return { hint: String(m.hint), at: m.last_at || null, text, invited: !!m.invite };
    });
  let status = '';
  if (data && data.enabled === false) status = 'Counting tries with no account is switched off.';
  else if (data && data.meter && Number(data.meter.dropped_24h) > 0)
    status = `The hourly limit was reached in the last 24 hours; ${Number(data.meter.dropped_24h)} ${Number(data.meter.dropped_24h) === 1 ? 'try was' : 'tries were'} not counted.`;
  return { entries, status };
}
