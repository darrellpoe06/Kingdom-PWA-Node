// =============================================================================
// FeedbackScreenshots — the pictures a person attached to their note, shown
// to the steward inside the app (DR-0742)
// =============================================================================
// Darrell 2026-10-01, on the Feedback queue, a focused note reading
// "5 SCREENSHOTS ATTACHED (OPEN ON THE SUBMITTER'S DEVICE OR IN SUPABASE)":
// "Can't see the information submitted?!!! Make it work so we can see inside
// the app!!!" / "How can we fix things when we don't get the feedback we
// needed for the fix?!" / "How can we open the submitted persons phone?!"
//
// The bytes were always in the database (the `screenshots` column, compressed
// JPEG data URLs; migration 0026). The board's list leaves them out on purpose
// so a hundred notes do not pull a hundred pictures (feedback-sync
// FEEDBACK_LIST_COLUMNS), and `fetchFeedbackImages` was written to bring them
// in for ONE note when a person looks at it. Nothing called it. This does:
// when a note with pictures is focused, its pictures are fetched and shown,
// each a tap away from full size, inside the app. A failed fetch says so and
// offers to try again; it never pretends there were none.
import React, { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { fetchFeedbackImages } from '../lib/feedback-sync.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

/** The heading over the pictures: "Screenshot" or "N screenshots". */
export function shotsHeading(n) {
  const k = Math.max(0, Number(n) || 0);
  return k > 1 ? `${k} screenshots` : 'Screenshot';
}

export default function FeedbackScreenshots({ id, count = 0, initial = [], fetchImages = fetchFeedbackImages }) {
  const have = Array.isArray(initial) ? initial.filter(Boolean) : [];
  const [images, setImages] = useState(have);
  const [state, setState] = useState(have.length > 0 ? 'ready' : 'idle');
  const [attempt, setAttempt] = useState(0);
  const [openAt, setOpenAt] = useState(-1);
  const expected = Math.max(have.length, Number(count) || 0);

  // Fetch when the note is on the screen with pictures the list did not carry.
  useEffect(() => {
    if (have.length > 0 || expected === 0 || !id) return undefined;
    let live = true;
    setState('loading');
    Promise.resolve(fetchImages(id)).then((r) => {
      if (!live) return;
      const got = (r && Array.isArray(r.screenshots) ? r.screenshots : []).filter(Boolean);
      if (got.length > 0) { setImages(got); setState('ready'); } else { setState('failed'); }
    }, () => { if (live) setState('failed'); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- have is derived from initial; attempt re-runs the fetch
  }, [id, expected, attempt, fetchImages]);

  if (expected === 0 && images.length === 0) return null;

  return (
    <div className="mb-2" data-testid="feedback-shots" data-state={state}>
      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{shotsHeading(expected || images.length)}</div>
      {state === 'loading' && (
        <p className="text-xs text-[#5A5751] mt-1" style={SERIF} role="status" data-testid="feedback-shots-loading">Loading {expected === 1 ? 'the picture' : `${expected} pictures`}…</p>
      )}
      {state === 'failed' && (
        <p className="text-xs text-[#B85838] mt-1" style={SERIF} role="alert" data-testid="feedback-shots-failed">
          The {expected === 1 ? 'picture' : 'pictures'} could not be loaded from the database just now.
          <button type="button" data-testid="feedback-shots-retry" onClick={() => setAttempt((a) => a + 1)}
            className={`ml-2 min-h-[44px] px-3 text-xs uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] ${FOCUS}`}>
            Try again
          </button>
        </p>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => setOpenAt(i)} data-testid="feedback-shot"
              aria-label={`Open screenshot ${i + 1} of ${images.length} full size`} title="Open full size"
              className={`min-h-[44px] min-w-[44px] border border-[#1A1815] bg-white p-0 ${FOCUS}`}>
              <img src={src} alt={`Feedback screenshot ${i + 1}`} className="max-h-48 block" />
            </button>
          ))}
        </div>
      )}
      <Modal open={openAt >= 0} onClose={() => setOpenAt(-1)} label={`Screenshot ${openAt + 1} of ${images.length}`}>
        {openAt >= 0 && images[openAt] && (
          <div data-testid="feedback-shot-open">
            <div className="flex items-center justify-between gap-2 pr-8 mb-2">
              <span className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Screenshot {openAt + 1} of {images.length}</span>
              {images.length > 1 && (
                <span className="flex gap-1">
                  <button type="button" onClick={() => setOpenAt((i) => (i - 1 + images.length) % images.length)} aria-label="Previous screenshot"
                    className={`min-h-[44px] px-3 text-xs uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] ${FOCUS}`}>Prev</button>
                  <button type="button" onClick={() => setOpenAt((i) => (i + 1) % images.length)} aria-label="Next screenshot"
                    className={`min-h-[44px] px-3 text-xs uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] ${FOCUS}`}>Next</button>
                </span>
              )}
            </div>
            <img src={images[openAt]} alt={`Feedback screenshot ${openAt + 1}, full size`} className="w-full h-auto border border-[#1A1815]" />
            <a href={images[openAt]} download={`feedback-${String(id || 'note').slice(0, 8)}-${openAt + 1}.jpg`} data-testid="feedback-shot-save"
              className={`inline-block mt-2 min-h-[44px] leading-[44px] px-3 text-xs uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] ${FOCUS}`}>
              Save this picture
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
