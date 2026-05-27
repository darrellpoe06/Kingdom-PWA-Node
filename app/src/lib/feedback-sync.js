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

  const { error } = await supabase.from('feedback').insert(row);
  if (error) {
    console.warn('[feedback-sync] upload failed:', error);
    return { skipped: 'insert-error', error };
  }

  // Best-effort native Synology Chat post — fire-and-forget. Never blocks
  // or fails the upload. POE-bound message composed in formatFeedbackMessage.
  postToChat(
    formatFeedbackMessage({
      displayName: row.display_name,
      text: row.feedback_text,
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
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .neq('user_id', myUserId)
        .order('submitted_at', { ascending: true });
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
    channel = supabase
      .channel('feedback-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        () => {
          fetchOthers().then((refreshed) => {
            if (refreshed) onRemote(refreshed.map(toPrototypeShape));
          });
        }
      )
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
    displayName: row.display_name,
    deviceLabel: row.device_label,
    triageStatus: row.triage_status,
    // 'remote: true' lets the UI render a small badge so users can see
    // which feedback came from another device.
    remote: true,
  };
}
