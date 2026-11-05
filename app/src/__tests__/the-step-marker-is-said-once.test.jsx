// =============================================================================
// THE STEP MARKER IS SEEN WHOLE AND HEARD SHORT (2026-11-05, DR-1328)
// =============================================================================
// Darrell, 2026-11-05, on the reader, looking at a 52-step CHILD-pace lesson:
//
//   "After finding the reader the voice is overreacting..."
//
// DR-1327 found and fixed the stall. This is the other half of the same
// sentence. Measured on the real read-along render: every step is in the DOM,
// so the reader spoke the WHOLE step marker once per step —
//
//   "Step 1 of 52 · ~5 min · Child pace"
//   "Step 2 of 52 · ~5 min · Child pace"   … fifty-two times
//
// The step NUMBER is the part a listener who is not looking at the screen
// actually needs. The minutes and the pace are identical on every step, so
// saying them again is drone laid over the teaching.
//
// The tail now carries `data-read-skip` — the app's own mechanism, already in
// read-follow.js's SKIP_SELECTOR — so the EYE still gets the whole marker and
// the EAR gets "Step 46 of 52". It is deliberately NOT aria-hidden: that would
// take the pace away from someone on a screen reader, which is a real loss and
// a different question from one repetition in our own read-aloud.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFollowMap } from '../lib/read-follow.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', 'components', 'ChurchLearn.jsx'), 'utf8');

/**
 * The read-along marker as the component renders it, for `steps` steps. Built
 * from the same shape as the JSX rather than imported, because rendering the
 * whole course view needs a signed-in host; what is under test is which part
 * of the marker reaches the reader, and that is decided by the attribute.
 */
function markerDom(steps, { skip = true } = {}) {
  const el = document.createElement('div');
  el.innerHTML = Array.from({ length: steps }, (_, i) => `
    <div data-step-index="${i}">
      <span class="text-[0.625rem]">Step ${i + 1} of ${steps}${skip
    ? '<span data-read-skip data-testid="step-marker-tail"> · ~5 min · Child pace</span>'
    : ' · ~5 min · Child pace'}</span>
      <div class="mt-1" data-reading-words><p>The teaching of step ${i + 1} is here, and it is what a listener came for.</p></div>
    </div>`).join('');
  document.body.appendChild(el);
  return el;
}

const spoken = (el) => {
  const f = buildFollowMap(el);
  return (f && f.text) || '';
};

describe('the step marker is said once (DR-1328)', () => {
  it('the eye still gets the whole marker — nothing is removed from the page', () => {
    const el = markerDom(3);
    expect(el.textContent).toContain('Step 1 of 3 · ~5 min · Child pace');
    expect(el.textContent).toContain('Step 3 of 3 · ~5 min · Child pace');
    el.remove();
  });

  it('the ear gets the step NUMBER on every step, and the pace on none of them', () => {
    const el = markerDom(52);
    const text = spoken(el);
    expect(text, 'the scan found nothing — re-anchor this gate').toContain('The teaching of step 1');
    expect((text.match(/Step \d+ of 52/g) || []).length, 'every step still says where it is').toBe(52);
    expect(text).not.toContain('Child pace');
    expect(text).not.toContain('~5 min');
    el.remove();
  });

  it('PROVEN TO CATCH: without the skip, the pace is spoken once per step', () => {
    // The behaviour on `main` before this change, measured rather than recalled.
    const el = markerDom(52, { skip: false });
    const text = spoken(el);
    expect((text.match(/Child pace/g) || []).length, 'if this is 0 the gate is decorative').toBe(52);
    expect((text.match(/~5 min/g) || []).length).toBe(52);
    el.remove();
  });

  it('the component really carries the attribute, on the read-along branch only', () => {
    // The read-along branch (showAll) is the one that renders every step.
    expect(SRC).toMatch(/<span data-read-skip data-testid="step-marker-tail">/);
    // The single-step stepper is untouched: a listener meets that marker once,
    // so there is nothing to thin, and shortening it there would be a loss.
    const stepper = SRC.slice(SRC.indexOf('data-testid="step-marker-tail"'));
    expect(stepper, 'the one-step marker keeps its whole text')
      .toMatch(/Step \{cur \+ 1\} of \{totalSegments\} · ~\{segmentMinutes\} min · \{band\.label\} pace/);
  });

  it('it is NOT aria-hidden: a screen reader keeps the pace', () => {
    // Skipping our own read-aloud is not the same as hiding the words from
    // assistive technology, and the second would be a real loss.
    const line = (SRC.match(/.*data-testid="step-marker-tail".*/) || [''])[0];
    expect(line).not.toMatch(/aria-hidden/);
  });
});
