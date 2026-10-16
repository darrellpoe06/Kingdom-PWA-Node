// =============================================================================
// church-profile — a church's own face and published giving channels, as data
// =============================================================================
// Darrell 2026-10-16, after the Pushpay research-review (docs/99-session-notes/
// 2026-10-16-research-review-pushpay-*.md §4 gap 3): a Bishop in Los Angeles
// wants what the Love Corner has, and a second church could not be onboarded
// without an engineer writing a migration. Migration 0297 made the three
// hardcoded facts rows — who leads a church (church_leaders), what the church
// says about itself and where it receives gifts (church_profiles) — and gave
// the platform steward one call (provision_church_instance). This module is
// the PURE half of that work on the app side: the same validation the
// database trigger enforces, run first on the phone so the office is told in
// plain words before the wire; the merge of a profile row over the church
// record the shell already carries; and the one decision the Give panel has
// to make — WHOSE channels to show.
//
// THE RULE THAT DOES NOT BEND (lib/giving.js, carried here): the app never
// invents a giving URL and never shows one church's channels on another
// church's page. COLG's channels are code constants decoded from its own
// slide (DR-0136); a second church's channels are the rows ITS office typed;
// a church with neither gets an honest line, not a borrowed list.
//
// PURE (no React, no network). church-profile-sync.js does the Supabase I/O;
// ChurchGiving.jsx and ChurchMembers.jsx render. Proven in church-profile.test.js.
// =============================================================================
import { GIVING_CHANNELS } from './giving.js';
import { looksLikeColg } from './resolve-church.js';

export const CHURCH_PROFILE_RECORDED = '2026-10-16';

// The same shape the database checks (0297 church_giving_channels_problem),
// so a refusal reads identically on the phone and from the wall.
export const MAX_GIVING_CHANNELS = 8;
const HTTPS_LINK = /^https:\/\/[a-z0-9][a-z0-9.-]*[a-z0-9](:[0-9]{2,5})?(\/[^\s]*)?$/i;
const CHANNEL_ID = /^[a-z0-9][a-z0-9-]{0,31}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;
export const RESERVED_SLUGS = ['poe-family', 'poetech', 'app', 'api', 'admin'];

/** The suggested channel kinds an office picks from. `how` is the default
 *  sentence under the button; the office may rewrite it. Never a URL. */
export const CHANNEL_KINDS = [
  { id: 'zelle',    label: 'Zelle',    how: 'In your bank app, send with Zelle to the church — or tap to open Zelle.' },
  { id: 'cashapp',  label: 'Cash App', how: 'Opens the church’s Cash App.' },
  { id: 'givelify', label: 'Givelify', how: 'Opens the church’s Givelify page — built for church giving, keeps a record for you.' },
  { id: 'paypal',   label: 'PayPal',   how: 'Opens the church’s PayPal donation page.' },
  { id: 'stripe',   label: 'Give online', how: 'Opens the church’s own secure giving page.' },
  { id: 'website',  label: 'Church website', how: 'Opens the church’s website, where giving is published.' },
];

export function isHttpsLink(url) {
  return typeof url === 'string' && url.length <= 2048 && HTTPS_LINK.test(url.trim());
}

/** Why a slug is refused, or null. Mirrors provision_church_instance. */
export function slugProblem(slug) {
  const s = String(slug || '').trim().toLowerCase();
  if (!SLUG.test(s)) return 'The short name must be 2 to 40 lowercase letters, digits or dashes, starting and ending with a letter or digit.';
  if (RESERVED_SLUGS.includes(s) || s.startsWith('u-')) return 'That short name is reserved.';
  return null;
}

/** A readable name becomes a slug suggestion: "First Baptist of Compton" -> "first-baptist-of-compton". */
export function suggestSlug(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function emailProblem(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'A real email address is needed — it is how the leader gets in.';
  return null;
}

/** Why a channel list is refused, or null. Same rules, same order, as 0297. */
export function channelsProblem(channels) {
  if (!Array.isArray(channels)) return 'giving channels must be a list';
  if (channels.length > MAX_GIVING_CHANNELS) return `at most ${MAX_GIVING_CHANNELS} giving channels`;
  const ids = new Set();
  for (const ch of channels) {
    if (!ch || typeof ch !== 'object') return 'each giving channel must be an object';
    const id = String(ch.id || '');
    const label = ch.label == null ? '' : String(ch.label);
    const url = ch.url == null ? '' : String(ch.url);
    if (!CHANNEL_ID.test(id)) return 'each channel needs an id of letters, digits and dashes';
    if (ids.has(id)) return `channel ids must be unique: ${id}`;
    ids.add(id);
    if (label.trim().length < 1 || label.length > 40) return 'each channel needs a label of 1 to 40 characters';
    if (!isHttpsLink(url)) return `each channel url must be a complete https link (${label || id})`;
    if (String(ch.display || '').length > 120) return `a channel display is too long (${label || id})`;
    if (String(ch.how || '').length > 200) return `a channel note is too long (${label || id})`;
  }
  return null;
}

/** Why a profile is refused, or null. Mirrors 0297 church_profile_problem. */
export function profileProblem(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return 'the profile must be an object';
  if (JSON.stringify(profile).length > 12000) return 'the profile is too large';
  if (String(profile.name || '').length > 120) return 'the name is too long';
  if (profile.site && !isHttpsLink(profile.site)) return 'the site link must be a complete https link';
  if (profile.media && profile.media.youtube && !isHttpsLink(profile.media.youtube)) return 'the youtube link must be a complete https link';
  if (profile.links != null) {
    if (typeof profile.links !== 'object' || Array.isArray(profile.links)) return 'links must be an object';
    for (const [k, v] of Object.entries(profile.links)) {
      if (v && !isHttpsLink(v)) return `the ${k} link must be a complete https link`;
    }
  }
  if (profile.services != null && !Array.isArray(profile.services)) return 'services must be a list';
  return null;
}

/** Form rows -> the channel objects the wall accepts. Blank rows are dropped;
 *  an id is derived from the kind, then the label, and made unique. */
export function normalizeChannels(rows = []) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    if (!r) continue;
    const label = String(r.label || '').trim();
    const url = String(r.url || '').trim();
    if (!label && !url) continue;
    let base = String(r.id || r.kind || suggestSlug(label) || 'channel').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'channel';
    let id = base;
    let n = 2;
    while (seen.has(id)) { id = `${base.slice(0, 29)}-${n}`; n += 1; }
    seen.add(id);
    const kind = CHANNEL_KINDS.find((k) => k.id === (r.kind || r.id));
    out.push({
      id,
      label: label || (kind ? kind.label : 'Give'),
      url,
      display: String(r.display || '').trim(),
      how: String(r.how || (kind ? kind.how : '')).trim(),
    });
  }
  return out;
}

/** The profile fields the form edits, in the order the office reads them. */
export const PROFILE_FIELDS = [
  { key: 'name',         label: 'Church name',        kind: 'text',  required: true },
  { key: 'nickname',     label: 'Also known as',      kind: 'text' },
  { key: 'pastor',       label: 'Pastor',             kind: 'text' },
  { key: 'address',      label: 'Address',            kind: 'text' },
  { key: 'phone',        label: 'Phone',              kind: 'text' },
  { key: 'officeHours',  label: 'Office hours',       kind: 'text' },
  { key: 'contactEmail', label: 'Office email',       kind: 'email' },
  { key: 'site',         label: 'Website (https)',    kind: 'url' },
  { key: 'givePage',     label: 'Giving page (https)', kind: 'url', path: ['links', 'give'] },
  { key: 'youtube',      label: 'YouTube (https)',    kind: 'url', path: ['media', 'youtube'] },
  { key: 'youtubeChannelId', label: 'YouTube channel id', kind: 'text' },
];

/** Flat form values -> the nested profile object the row stores. */
export function profileFromForm(values = {}) {
  const p = {};
  for (const f of PROFILE_FIELDS) {
    const v = values[f.key] == null ? '' : String(values[f.key]).trim();
    if (!v) continue;
    if (f.path) {
      const [a, b] = f.path;
      p[a] = { ...(p[a] || {}), [b]: v };
    } else {
      p[f.key] = v;
    }
  }
  return p;
}

/** Nested profile -> flat form values (the inverse of profileFromForm). */
export function formFromProfile(profile = {}) {
  const v = {};
  for (const f of PROFILE_FIELDS) {
    let val = f.path ? (profile[f.path[0]] || {})[f.path[1]] : profile[f.key];
    v[f.key] = val == null ? '' : String(val);
  }
  return v;
}

/**
 * The church record a surface renders: the profile row's facts over the
 * record the shell already carries. A row never erases a field it does not
 * set — an empty profile leaves COLG's verified facts exactly as they were.
 */
export function mergeChurchRecord(base = {}, profile = null) {
  if (!profile || typeof profile !== 'object') return base;
  const out = { ...base };
  for (const k of ['name', 'nickname', 'site', 'address', 'pastor', 'phone', 'officeHours', 'contactEmail', 'founded', 'youtubeChannelId', 'givingPageHint']) {
    if (profile[k] != null && profile[k] !== '') out[k] = profile[k];
  }
  if (Array.isArray(profile.services) && profile.services.length) out.services = profile.services;
  if (profile.media && typeof profile.media === 'object') out.media = { ...(base.media || {}), ...profile.media };
  if (profile.links && typeof profile.links === 'object') out.links = { ...(base.links || {}), ...profile.links };
  return out;
}

/**
 * WHOSE channels the Give panel shows — the one decision that could go
 * quietly wrong. Returns { channels, source, line }:
 *   'profile'  the office's own rows (any church, COLG included once it edits)
 *   'colg'     COLG's constants, ONLY for COLG (slug 'colg' or the record
 *              identifies as COLG) and only while it has no rows of its own
 *   'none'     an honest empty state — never another church's list
 */
export function resolveChurchGiving({ church = null, profile = null, slug = null } = {}) {
  const rows = profile && Array.isArray(profile.giving_channels) ? profile.giving_channels : [];
  if (rows.length && channelsProblem(rows) == null) {
    return {
      channels: rows,
      source: 'profile',
      line: 'These are the church’s own published channels, entered by its office. The app only opens them — no payment information is collected here.',
    };
  }
  const isColg = slug === 'colg' || (slug == null && looksLikeColg(church));
  if (isColg) {
    return {
      channels: GIVING_CHANNELS,
      source: 'colg',
      line: 'These are the church’s own published channels, taken exactly from its GIVE ONLINE slide. The app only opens them — no payment information is collected here.',
    };
  }
  return {
    channels: [],
    source: 'none',
    line: 'This church has not published its giving channels in the app yet. Its office adds them under Church → Members → This church’s door; until then, give the way the church already publishes.',
  };
}

/** The steward's request, checked before the wire. */
export function provisionRequest({ slug, name, leaderEmail, leaderRole = 'owner', site = '' } = {}) {
  const s = String(slug || '').trim().toLowerCase();
  const n = String(name || '').trim();
  const e = String(leaderEmail || '').trim().toLowerCase();
  const r = leaderRole === 'admin' ? 'admin' : 'owner';
  const why = slugProblem(s)
    || (n.length < 2 || n.length > 120 ? 'A church name of 2 to 120 characters is needed.' : null)
    || emailProblem(e)
    || (site && !isHttpsLink(site) ? 'The website must be a complete https link.' : null);
  if (why) return { ok: false, problem: why };
  const profile = site ? { site: String(site).trim() } : {};
  return {
    ok: true,
    args: { slug_in: s, display_name_in: n, leader_email_in: e, leader_role_in: r, profile_in: profile },
  };
}

/** The remaining constraint, stated where the steward reads it rather than
 *  discovered after a sale. */
export const DOOR_CONSTRAINT =
  'A new church is met through the PoeTech app’s Church tab. Its own installable door (its own icon and home-screen name, like /lovecorner/app/) is a build step PoeTech runs for it — not yet a form.';
