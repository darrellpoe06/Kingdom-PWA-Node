// Learn opens on Latest (DR-1606). A case about what is INSIDE the course list
// or an open course takes the same first tap a reader now takes: the Lessons
// tab of the area strip. A no-op when the strip is absent (one course) or
// Lessons is already selected (a department, a chosen course).
import { act } from 'react';

export function openLessonsArea(scope = document) {
  const tab = scope.querySelector('#learn-area-tab-lessons');
  if (tab && tab.getAttribute('aria-selected') !== 'true') {
    act(() => {
      tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }
}
