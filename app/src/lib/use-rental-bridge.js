// =============================================================================
// useRentalBridge — the Real Estate list hears the Properties tab
// =============================================================================
// The React half of rental-write.js, kept in its own module for two reasons,
// both of which the repo asserts rather than trusts:
//
//   1. DR-0078: interdependence flows through CORE and the Events spine, never
//      by one module importing another's files. The properties module announces
//      into core; the monolith listens from core; neither imports the other.
//
//   2. The monolith is BUDGET-FROZEN, and its guard caught the first draft of
//      this at +22 lines over. That guard is right: the fix for "the monolith
//      needs a new behaviour" is a module the monolith calls in one line, not
//      twenty-two more lines inside it. Writing the effect here obeys the
//      freeze instead of asking for an exemption.
//
// The listener does NOT upload. The cloud row is already written by the tab
// that announced the change; re-uploading it from here would race that write
// with an older copy of the same door.
// =============================================================================
import { useEffect } from 'react';
import { onRentalChange, applyRentalChange } from './rental-write.js';

/**
 * Keep the device's rentals list in step with a door edited in another tab.
 *
 * `setData` is the monolith's own setter, so the list stays behind the state
 * and persistence rules that already own it (including the merge that refuses
 * to let an empty remote erase local detail). This only carries the patch in.
 */
export function useRentalBridge(setData) {
  useEffect(() => onRentalChange(({ slug, uuid, patch }) => {
    setData((d) => {
      const list = (d && d.inflows && d.inflows.rentals) || [];
      const next = applyRentalChange(list, { slug, uuid, patch });
      // Same reference back when nothing matched — no needless re-render of a
      // list every other surface here reads (Big Picture, Books, the maths).
      return next === list ? d : { ...d, inflows: { ...d.inflows, rentals: next } };
    });
  }), [setData]);
}
