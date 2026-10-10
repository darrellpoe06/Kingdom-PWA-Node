// =============================================================================
// proof — what a job's proof requirement asks for, and whether it is met
// (DR-0914, migration 0264)
// =============================================================================
// Darrell, 2026-10-10: "1099 works notice of the need for pictures to document
// the work... may be mandatory for payment... situations that need images to
// validate the work is completely done and video when necessary".
//
// The database refuses a documented "Fixed" until the proof is on the job
// (0264). This file says the same thing in words, everywhere the worker and
// the family look: on the job, in the dispatch text, and as "ready to pay".
// =============================================================================

export const PROOF_OPTIONS = Object.freeze([
  { id: 'none', label: 'No proof required' },
  { id: 'photos', label: 'Pictures required for payment' },
  { id: 'photos-and-video', label: 'Pictures and a video required for payment' },
]);

/** The notice a worker reads before starting, or '' when none is required. */
export function proofNotice(request = {}) {
  const need = request.proof_required || 'none';
  if (need === 'none') return '';
  const what = need === 'photos-and-video' ? 'Pictures and a video' : 'Pictures';
  const of = request.proof_note ? ` of ${String(request.proof_note).trim().replace(/\.$/, '')}` : ' of the finished work';
  return `${what}${of} are required for payment. Add them on the job before marking it fixed.`;
}

/**
 * Where a job's proof stands from its documentation rows:
 * { need, photos, videos, missing: [...], complete, fixed, payable, line }.
 * payable = the proof is complete AND the work is documented fixed.
 */
export function proofState(request = {}, docs = []) {
  const need = request.proof_required || 'none';
  const mine = (docs || []).filter((d) => d.request_id === request.id);
  const photos = mine.filter((d) => d.image_data).length;
  const videos = mine.filter((d) => d.has_video || d.video_data).length;
  const fixed = mine.some((d) => d.outcome === 'fixed');
  const missing = [];
  if (need !== 'none' && photos < 1) missing.push('a picture of the finished work');
  if (need === 'photos-and-video' && videos < 1) missing.push('a video of the finished work');
  const complete = missing.length === 0;
  const payable = need !== 'none' && complete && fixed;
  let line = '';
  if (need !== 'none') {
    const counts = `${photos} picture${photos === 1 ? '' : 's'}${need === 'photos-and-video' ? `, ${videos} video${videos === 1 ? '' : 's'}` : ''}`;
    line = payable ? `Proof complete (${counts}), fixed: ready to pay`
      : complete ? `Proof complete (${counts}); waiting for "Fixed"`
        : `Proof for payment: ${counts}. Still needed: ${missing.join(' and ')}`;
  }
  return { need, photos, videos, missing, complete, fixed, payable, line };
}
