// =============================================================================
// feedback-sync — Supabase-backed cross-device sync for the Feedback button
// =============================================================================
// Contract:
//
//   await ensureTenantMembership()
//     Call once after sign-in. Idempotent. Adds the signed-in user to
//     'poe-family' tenant if they're not already a member of any tenant.
//     Returns the instance_id they're now in. Throws if not signed in.
//
//   await uploadFeedback(item, { activeTab, appVersion })
//     Writes one feedback row to Supabase. Item shape matches what
//     addFeedback() in poe-financial-mvp-v28.jsx already produces.
//     Silently no-ops if user is not signed in (localStorage path still
//     captures the item, so nothing is lost).
//
//   subscribeFeedback(onRemote)
//     Pulls existing feedback rows + listens for new ones in realtime.
//     onRemote(items) fires with the merged array each time it changes.
//     Returns an unsubscribe function. No-op if user is not signed in.
//
// Design notes:
//   - The prototype stores feedback as a nested array inside the bulk
//     poe-financial-v28 blob. We don't change that. Instead, this module
//     mirrors feedback into Supabase alongside the local store, and
//     surfaces remote items so they can be merged into the same array.
//   - Each device sees both its own local items AND remote items written
//     by other devices. Dedup happens by id (we reuse the prototype's
//     locally-generated ids when writing remotely).
// =============================================================================

import supabase from './supabase.js';
import { postToChat, formatFeedbackMessage } from './synology-chat.js';
import { currentDoor, PERSONAL_DOOR } from './app-doors.js';
import { categorizeIntake } from './intake-outcome.js';

// THE OUTCOME RIDES BESIDE THE LIST (DR-0622, migration 0234). The category
// and its basis, what changed and when, and the note a reply answers. Asked
// for with the list and dropped honestly on a database that has not applied
// 0234 yet, so the board never goes dark over a column that is on its way.
const FEEDBACK_INTAKE_COLUMNS = ['intake_category', 'intake_basis', 'outcome_note', 'outcome_ref', 'outcome_at', 'reply_to'];
const INTAKE_INSERT_KEYS = ['intake_category', 'intake_basis', 'reply_to'];
const LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : null;

/**
 * One of the OUTCOME columns is missing (0234 not applied yet), as PostgREST
 * or Postgres says it. Named, never generic: a different missing column (the
 * screenshots degrade below) must keep its own fallback.
 */
export function isMissingColumn(error, names = FEEDBACK_INTAKE_COLUMNS) {
  if (!error) return false;
  const msg = String(error.message || '');
  if (!(error.code === '42703' || error.code === 'PGRST204' || /column .* does not exist|could not find the .* column/i.test(msg))) return false;
  return names.some((n) => msg.includes(n));
}

/** Run a list query with the outcome columns, and without them if they are not there yet. */
async function withIntakeColumns(base, build) {
  const first = await build(`${base}, ${FEEDBACK_INTAKE_COLUMNS.join(', ')}`);
  if (first && first.error && isMissingColumn(first.error)) return build(base);
  return first;
}

// The id is minted on the device, so the reference code the sender is handed
// the moment they submit is the SAME code the steward sees on the board. Until
// DR-0622 the local copy was `fb-<time>` and the database minted its own uuid:
// two codes for one note, and the sender's could never be looked up.
export function newFeedbackId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* fall through */ }
  return `fb-${Date.now()}`;
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// THE LIST NEVER CARRIES THE IMAGES.
//
// Post-incident 2026-08-14 (DR-0303). Every account across all three apps was
// signed out and locked out: Supabase answered 402 `exceed_egress_quota` on
// /auth/v1/token, /auth/v1/signup and every /rest/v1 path. The measurement
// found the spend right here — `feedback` holds 6.2 MB of base64 image data
// across 24 rows, and the fetch below used to be `.select('*')` with no limit,
// running once per SIGN-IN for every signed-in user (this is wired into the
// main app shell, not an admin surface) and AGAIN in full on every realtime
// INSERT by anyone. Multiple megabytes per app open, per person.
//
// So the columns are named explicitly rather than starred. `screenshot` and
// `screenshots` are deliberately ABSENT: the presence and the count ride along
// as the two derived scalars migration 0135 computes in the database, and the
// image itself is fetched one row at a time by `fetchFeedbackImages` when a
// person actually opens that card.
//
// Naming the columns is also what makes this hold. A `*` would silently start
// shipping the next large column somebody adds; an explicit list means a new
// blob column has to be typed in here on purpose. The test that pins this
// reads the source for `select('*')` for exactly that reason.
const FEEDBACK_LIST_COLUMNS = [
  'id', 'instance_id', 'user_id', 'display_name', 'device_label',
  'app_version', 'which_tab', 'feedback_text', 'sentiment',
  'is_confidential', 'submitted_at', 'triage_status', 'triage_notes',
  'promoted_to_project_id',
  // Derived in the DB (0135) — presence and count without the bytes.
  'has_screenshot', 'screenshot_count',
].join(', ');

// A bound, so this query's cost cannot grow without limit as feedback
// accumulates.
//
// THE COMMENT THAT USED TO BE HERE WAS WRONG ABOUT ITS OWN QUERY, and the cost
// of that was every piece of feedback sent after the table passed the cap.
//
// It said: "The board reads newest-first, so the cap drops the oldest items
// rather than the ones anyone is working. 500 is far above the 119 rows that
// exist today." Two things were untrue at once. The query below ordered
// `submitted_at` ASCENDING and then applied the limit, so Postgres returned the
// OLDEST 500 rows and dropped the newest — the exact opposite of what the
// comment promised. And the table is not at 119. Measured on the sovereign
// database 2026-09-22 via sovereign-read: total = 963, newest 2026-09-22
// 21:41. So roughly 460 of the most recent submissions could not reach the
// board AT ALL, silently, and the newer a message was the less likely anyone
// was to see it.
//
// Darrell, 2026-09-22: "how is the feedback process going?!!!!!! We had a lot
// I've never seen them...!!!!!!" He had not seen them because they were not
// being fetched.
//
// The order is now DESCENDING, which is what makes a cap safe: a ceiling may
// drop the oldest history, never the newest word. The limit is raised to 2000
// against a table at 963 so there is real headroom, and it is a CEILING on
// cost, not a page size.
const FEEDBACK_LIST_LIMIT = 2000;

/** Get the current Supabase session, or null. */
async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Ensures the signed-in user is a member of at least one tenant. Calls
 * the join_default_tenant() RPC which adds them to 'poe-family' if not.
 * Returns the instance_id they belong to. Throws if not signed in.
 */
export async function ensureTenantMembership(displayName) {
  const session = await currentSession();
  if (!session) throw new Error('ensureTenantMembership: not signed in');

  const { data, error } = await supabase.rpc('join_default_instance', {
    display_name_in: displayName ?? null,
  });
  if (error) throw error;
  return data; // instance_id
}

/**
 * THE DOOR THE FEEDBACK WAS ACTUALLY GIVEN IN (2026-09-16, DR-0444).
 *
 * Darrell, on reading the notification fix: "Feedback should work the same
 * way..." He is right, and it was the same defect wearing different clothes.
 * uploadFeedback() below stamped every row with whatever
 * `join_default_instance()` returned -- 'poe-family' -- so a member who tapped
 * FEEDBACK inside the Love Corner app filed it to the FAMILY space, and the
 * door it came from was not recorded anywhere. Same class as a church message
 * notified into the family door: the record lost which house it belonged to.
 *
 * The membership check is the READ ITSELF, which is why this needs no extra
 * query and no new grant: `instances_member_read` (migration 0056) only lets a
 * member SELECT their own instances, so a non-member's read comes back empty
 * and the caller falls back to the default space. A person standing in a door
 * they do not belong to therefore cannot file into it -- RLS decides, not this
 * function (DR-0060: the gate is the guard).
 *
 * Returns null for the personal door (its instance IS the default), for a
 * signed-out reader, and for any failure -- never a throw, because feedback
 * that fails to file is feedback nobody reads.
 */
export async function doorInstanceId(client = supabase, loc = null) {
  const where = loc || (typeof window !== 'undefined' ? window.location : null);
  const door = currentDoor(where && where.pathname, where && where.search);
  if (!door || door.path === PERSONAL_DOOR) return null;
  for (const slug of door.instances) {
    try {
      const { data, error } = await client
        .from('instances').select('id').eq('slug', slug).maybeSingle();
      if (!error && data && data.id) return data.id;
    } catch { /* try the next slug this door answers to */ }
  }
  return null;
}

/**
 * Uploads one feedback item to Supabase. Best-effort: returns silently
 * if user is signed out, or if the upload fails (we log but don't throw
 * — the local localStorage write already happened, so nothing is lost).
 *
 * @param item       Object from addFeedback() — see prototype line ~1039
 * @param meta       { activeTab?: string, appVersion?: string, deviceLabel?: string }
 */
export async function uploadFeedback(item, meta = {}) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };

  // The user must be a tenant member for the INSERT to pass RLS.
  let tenantId;
  try {
    tenantId = await ensureTenantMembership();
  } catch (e) {
    console.warn('[feedback-sync] tenant membership setup failed:', e);
    return { skipped: 'no-tenant', error: e };
  }

  // File it to the space the person was standing in, when they belong to it
  // (DR-0444). The default space stays the fallback, so nothing is ever lost
  // to a door that could not be resolved.
  const doorId = await doorInstanceId().catch(() => null);
  if (doorId) tenantId = doorId;

  // The FeedbackModal currently submits structured fields (rating + area +
  // categories + whatsWorking/whatsNot/whatsMissing). Compose a single
  // human-readable body from whichever fields are populated so the chat
  // message and the DB row both carry the substance, not just a label.
  const composedBody = (() => {
    if (item.text) return item.text;
    if (item.feedback_text) return item.feedback_text;
    const parts = [];
    if (item.whatsWorking) parts.push('Working: ' + item.whatsWorking);
    if (item.whatsNot) parts.push('Not working: ' + item.whatsNot);
    if (item.whatsMissing) parts.push('Missing: ' + item.whatsMissing);
    if (Array.isArray(item.categories) && item.categories.length > 0) {
      parts.push('[' + item.categories.join(', ') + ']');
    }
    if (parts.length === 0 && item.rating) {
      parts.push('Rated: ' + item.rating);
    }
    return parts.join(' | ');
  })();

  // Map FeedbackModal ratings to sentiment if not already provided.
  const sentimentFromRating = (() => {
    if (item.sentiment) return item.sentiment;
    if (item.category) return item.category;
    if (item.rating === 'love' || item.rating === 'good') return 'positive';
    if (item.rating === 'rough' || item.rating === 'broken') return 'negative';
    return 'neutral';
  })();

  const row = {
    // Let Postgres generate the UUID — the prototype's `fb-${Date.now()}`
    // local id is kept on the local copy only and isn't a valid uuid.
    instance_id: tenantId,
    user_id: session.user.id,
    display_name: session.user.email?.split('@')[0] || 'Member',
    device_label: meta.deviceLabel || detectDeviceLabel(),
    app_version: meta.appVersion || null,
    which_tab: meta.activeTab || item.currentView || item.area || null,
    feedback_text: composedBody,
    sentiment: normalizeSentiment(sentimentFromRating),
    is_confidential: !!item.isConfidential,
    triage_status: 'new',
  };
  // DR-0622: the device's own id (one reference code for one note), the note a
  // reply answers, and the category with its basis, decided at birth by the
  // same rules the board and the runner use.
  if (UUID_RE.test(String(item.id || ''))) row.id = item.id;
  if (UUID_RE.test(String(item.replyTo || ''))) row.reply_to = item.replyTo;
  try {
    const cat = categorizeIntake({ ...item, text: composedBody, replyTo: row.reply_to || null, screenshotCount: 0 }, { ledger: LEDGER });
    row.intake_category = cat.category;
    row.intake_basis = cat.basis;
  } catch { /* the runner categorizes it on its next pass */ }

  // Optional screenshots (compressed JPEG data URLs). The legacy single-image
  // `screenshot` text column (migration 0003) keeps the FIRST image for back-
  // compat; the full set rides the `screenshots` jsonb column (migration 0026).
  // Accept the multi-image `meta.screenshots` array and the legacy single
  // `meta.screenshot`.
  const shots = Array.isArray(meta.screenshots)
    ? meta.screenshots.filter(s => typeof s === 'string' && s)
    : ((typeof meta.screenshot === 'string' && meta.screenshot) ? [meta.screenshot] : []);
  const firstShot = shots[0] || null;

  // Insert with the richest payload the live schema supports, degrading on each
  // schema-cache miss so the text feedback always lands. Worst case (a column
  // not live yet at deploy): images 2..N, then all images, are dropped — only
  // in that brief window, and never the feedback itself.
  // One more degrade, for the outcome columns (0234) not being live yet: the
  // note still lands, and the runner categorizes it on its next pass.
  const insertRow = async (payload) => {
    let res = await supabase.from('feedback').insert(payload);
    if (res && res.error && isMissingColumn(res.error)) {
      const lean = { ...payload };
      for (const k of INTAKE_INSERT_KEYS) delete lean[k];
      res = await supabase.from('feedback').insert(lean);
    }
    return res || {};
  };
  let error;
  if (shots.length > 0) {
    ({ error } = await insertRow({ ...row, screenshot: firstShot, screenshots: shots }));
    if (error) {
      console.warn('[feedback-sync] insert with screenshots[] failed, retrying with single screenshot:', error);
      ({ error } = await insertRow({ ...row, screenshot: firstShot }));
    }
    if (error) {
      console.warn('[feedback-sync] insert with screenshot failed, retrying without image:', error);
      ({ error } = await insertRow(row));
    }
  } else {
    ({ error } = await insertRow(row));
  }
  if (error) {
    console.warn('[feedback-sync] upload failed:', error);
    return { skipped: 'insert-error', error };
  }

  // Best-effort native Synology Chat post — fire-and-forget. Never blocks
  // or fails the upload. POE-bound message composed in formatFeedbackMessage.
  postToChat(
    formatFeedbackMessage({
      displayName: row.display_name,
      text: row.feedback_text + (shots.length ? `\n[+${shots.length} screenshot${shots.length > 1 ? 's' : ''} attached]` : ''),
      sentiment: row.sentiment,
      activeTab: row.which_tab,
    })
  );

  return { uploaded: true };
}

/**
 * Pulls existing feedback rows from the user's tenant and subscribes to
 * new ones in realtime. onRemote(items) fires once initially with the
 * fetched list, and again each time a new row is inserted.
 *
 * Items are returned in the prototype's shape so callers can merge them
 * straight into the existing data.feedback array.
 *
 * Returns an unsubscribe function.
 */
/**
 * Fetches the image bytes for ONE feedback row, on demand.
 *
 * This is the other half of the blob-free list. The board shows an accurate
 * "3 screenshots" from the derived count and calls this only when a person
 * actually opens that card — so the bytes move when someone is looking at
 * them, which is the only time they were ever worth moving.
 *
 * Best-effort by design: a failure here must never break the board. The card
 * keeps its truthful count and simply has no picture, which is a strictly
 * better outcome than the whole list failing to load.
 *
 * @param id  The feedback row id.
 * @returns   { screenshots: string[] } — empty array on any failure or miss.
 */
export async function fetchFeedbackImages(id) {
  if (!id) return { screenshots: [] };
  const { data, error } = await supabase
    .from('feedback')
    .select('id, screenshot, screenshots')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn('[feedback-sync] image fetch failed:', error);
    return { screenshots: [] };
  }
  const many = Array.isArray(data.screenshots) ? data.screenshots.filter(Boolean) : [];
  if (many.length > 0) return { screenshots: many };
  return { screenshots: data.screenshot ? [data.screenshot] : [] };
}

/**
 * The signed-in person's OWN notes, newest first, with their outcomes
 * (DR-0622). The board's list leaves these out on purpose (they are already in
 * the local store), which also meant the SENDER never read a steward's triage
 * or a fix's outcome: the local copy never changes after it is written. This is
 * the read the sender's receipt uses. { ok, items, reason }; signed out or
 * unreadable is said, never an empty list pretending to be an answer.
 */
export const MY_FEEDBACK_LIMIT = 50;
export async function fetchMyFeedback(client = supabase) {
  try {
    const { data: s } = await client.auth.getSession();
    const uid = s && s.session && s.session.user && s.session.user.id;
    if (!uid) return { ok: false, items: [], reason: 'signed-out' };
    const { data, error } = await withIntakeColumns(FEEDBACK_LIST_COLUMNS, (cols) => client
      .from('feedback')
      .select(cols)
      .eq('user_id', uid)
      .order('submitted_at', { ascending: false })
      .limit(MY_FEEDBACK_LIMIT));
    if (error) return { ok: false, items: [], reason: error.message || 'unreadable' };
    return { ok: true, items: (data || []).map((r) => ({ ...toPrototypeShape(r), mine: true })), reason: '' };
  } catch (e) {
    return { ok: false, items: [], reason: e?.message || 'unreadable' };
  }
}

export function subscribeFeedback(onRemote) {
  let channel = null;
  let cancelled = false;

  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;

    // Filter to feedback from OTHER users only. Our own submissions are
    // already in local data.feedback via addFeedback — surfacing them
    // again from the remote stream would create visual duplicates.
    const fetchOthers = async () => {
      const { data, error } = await withIntakeColumns(FEEDBACK_LIST_COLUMNS, (cols) => supabase
        .from('feedback')
        .select(cols)
        .neq('user_id', myUserId)
        // DESCENDING, so the cap drops the oldest rows and never the newest.
        // Ascending + limit is what made every recent submission invisible.
        .order('submitted_at', { ascending: false })
        .limit(FEEDBACK_LIST_LIMIT));
      if (error) {
        console.warn('[feedback-sync] fetch failed:', error);
        return null;
      }
      return data || [];
    };

    const initial = await fetchOthers();
    if (initial) onRemote(initial.map(toPrototypeShape));

    // Realtime subscription on inserts. Re-fetch (with the same
    // user-id filter) so the merge logic stays simple. Family-scale
    // traffic is single-digit inserts/day.
    // INSERT and UPDATE: a steward's triage and the fix lane's outcome are
    // UPDATEs, and until DR-0622 the board never heard them without a reload.
    const refresh = () => {
      fetchOthers().then((refreshed) => {
        if (refreshed) onRemote(refreshed.map(toPrototypeShape));
      });
    };
    channel = supabase
      .channel('feedback-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feedback' }, refresh)
      .subscribe();
  })();

  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function detectDeviceLabel() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'Other';
}

/** Map a freeform sentiment/category string to the schema's enum. */
function normalizeSentiment(s) {
  if (!s) return null;
  const v = String(s).toLowerCase();
  if (['love', 'frustrated', 'confused', 'feature-request', 'bug'].includes(v)) return v;
  // Common synonyms from the prototype's FEEDBACK_CATEGORIES.
  if (['like', 'liked', 'positive'].includes(v)) return 'love';
  if (['bug', 'broken', 'error'].includes(v)) return 'bug';
  if (['feature', 'request', 'wish'].includes(v)) return 'feature-request';
  if (['confusing', 'unclear'].includes(v)) return 'confused';
  if (['frustration', 'annoyed'].includes(v)) return 'frustrated';
  return null;
}

/** Convert a Supabase feedback row into the prototype's local shape. */
function toPrototypeShape(row) {
  return {
    id: row.id,
    text: row.feedback_text,
    currentView: row.which_tab,
    sentiment: row.sentiment,
    category: row.sentiment, // prototype uses 'category'; we mirror
    isConfidential: row.is_confidential,
    submittedAt: row.submitted_at,
    createdAt: row.submitted_at, // the board renders f.createdAt
    displayName: row.display_name,
    deviceLabel: row.device_label,
    triageStatus: row.triage_status,
    triageNotes: row.triage_notes || '',
    userId: row.user_id || null,
    // DR-0622: the outcome the sender reads, and its basis.
    intakeCategory: row.intake_category || null,
    intakeBasis: row.intake_basis || null,
    outcomeNote: row.outcome_note || '',
    outcomeRef: row.outcome_ref || '',
    outcomeAt: row.outcome_at || null,
    replyTo: row.reply_to || null,
    screenshot: row.screenshot || null,
    // Full image set when the `screenshots` jsonb column is live; otherwise the
    // single legacy `screenshot` stands in so older rows still render.
    //
    // These are EMPTY for a row that came from the list fetch, which no longer
    // carries image bytes (see FEEDBACK_LIST_COLUMNS). They fill in when the
    // same row is re-read through `fetchFeedbackImages`, so this mapper serves
    // both shapes without the caller having to know which one it holds.
    screenshots: Array.isArray(row.screenshots) && row.screenshots.length > 0
      ? row.screenshots
      : (row.screenshot ? [row.screenshot] : []),
    // Presence and count come from the DERIVED columns (migration 0135) when
    // they are there, because those are true even when the bytes are absent.
    // Computing them from the blob columns instead — the old behaviour, kept
    // here as the fallback — would report "no screenshot" for every row in a
    // blob-free list, which is a painted answer, not a missing one (DR-0076).
    hasScreenshot: typeof row.has_screenshot === 'boolean'
      ? row.has_screenshot
      : !!(row.screenshot || (Array.isArray(row.screenshots) && row.screenshots.length > 0)),
    screenshotCount: Number.isFinite(row.screenshot_count)
      ? row.screenshot_count
      : (Array.isArray(row.screenshots) ? row.screenshots.length : (row.screenshot ? 1 : 0)),
    // 'remote: true' lets the UI render a small badge so users can see
    // which feedback came from another device.
    remote: true,
  };
}
