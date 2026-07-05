// =============================================================================
// resolveChurch — the ONE place the effective church-home record is derived.
// =============================================================================
// Extracted from components/ChurchHome.jsx (2026-07-05) so the Church tab AND
// the global Live Worship bar (components/LiveWorshipBar.jsx) resolve the SAME
// record from ONE source — the same single-source-of-truth reason COLG_DEFAULT_
// CHURCH was moved to lib/. Two surfaces reading two copies of this logic is
// exactly the drift Reality-Trace (P15/P16) warns against: the pinned live
// player must embed the same channel, gated by the same published schedule, as
// the in-page player it mirrors.
//
// Behavior is IDENTICAL to the inline logic it replaces (proven by
// resolve-church.test.js + the unchanged church-home-render parity test):
//   1. A user who has NOT set a real church home (null, or the anonymized
//      'Your home church' placeholder) lands on COLG_DEFAULT_CHURCH — the
//      platform's default church home (D21, COMMUNITY-FIRST-MISSION).
//   2. A COLG-identified record that predates the youtubeChannelId field
//      (saved before 2026-06-15) is backfilled with COLG's real channel + media
//      so Live Worship still resolves for COLG members. Only when the record is
//      identifiably COLG AND the id is actually missing — a genuinely different
//      church with no channel id keeps no channel (never COLG's stream on
//      someone else's page).
//   3. Any other real church home is returned untouched.
import { COLG_DEFAULT_CHURCH } from './default-church.js';

// Does this record identify as COLG / The Love Corner (by name, nickname, or
// site)? Used only to gate the channel backfill — never to overwrite a genuinely
// different church.
export function looksLikeColg(church) {
  const rec = church || {};
  return (
    /church of the living god/i.test(rec.name || '') ||
    /love corner/i.test(rec.nickname || '') ||
    (rec.site || '').includes('thechurchofthelivinggod')
  );
}

// resolveChurch(church) -> the effective church-home record to render.
export function resolveChurch(church) {
  const resolvedChurch =
    church && church.name && church.name !== 'Your home church'
      ? church
      : COLG_DEFAULT_CHURCH;

  if (looksLikeColg(resolvedChurch) && !(resolvedChurch.youtubeChannelId || '').trim()) {
    return {
      ...resolvedChurch,
      youtubeChannelId: COLG_DEFAULT_CHURCH.youtubeChannelId,
      media: { ...COLG_DEFAULT_CHURCH.media, ...(resolvedChurch.media || {}) },
    };
  }
  return resolvedChurch;
}

export default resolveChurch;
