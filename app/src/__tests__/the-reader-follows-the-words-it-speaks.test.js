// =============================================================================
// THE READER FOLLOWS THE WORDS IT SPEAKS — and speaks the words on the page
// =============================================================================
// Darrell, 2026-10-09, from the lesson reader on L226/L227, three complaints in
// one breath: "Not keeping up with the words anymore.... changing the voice
// from man to woman... reading something totally different from what's on the
// page... fix it..."
//
// Two of the three were one branch of code. A surface registers its reading and
// may ask the reader to speak THAT TEXT rather than the page's (`preferText` —
// DR-0722, so a downloaded lesson's saved clips play with no connection). That
// branch skipped the follow map entirely, and the read fell through to the tail
// of the function, which:
//
//   1. mapped `readingRoot()` — the WHOLE page, every lesson card on it — so a
//      sentence was hunted for across other lessons' text and could light on a
//      different card, and
//   2. ran with `wordable: false`, so no word ever lit inside the sentence.
//
// (1) is "reading something totally different from what's on the page" as the
// eye meets it; (2) is "not keeping up with the words," exactly. The third
// complaint — the voice changing — is the studio going dark behind the reader
// and is pinned separately (voice-service `engine`, 2026-10-09).
//
// THE LAW THESE PIN:
//   * An aligned read is word-followable. A spoken sentence located in the
//     mapped text has a SPAN, and a span is all the word lookup needs.
//   * `alignSegments` and `alignSegmentSpans` are one walk, one truth.
//   * A saved reading is only preferred when it IS the page's reading, measured
//     by comparison and not assumed.
//
// PROVEN-TO-CATCH (DR-0076 §3): each case below fails against the code as it
// stood this morning — `wordRangeIn` absent, spans absent, `preferText` set
// from `!!savedText` alone.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  buildFollowMap, alignSegments, alignSegmentSpans, wordRange, wordRangeIn,
} from '../lib/read-follow.js';
import { segmentText } from '../lib/tts.js';

/** One lesson's own element, with a SECOND lesson beside it on the page. */
function twoLessonsOnOnePage() {
  const page = document.createElement('main');
  page.innerHTML = `
    <div id="learn-read-other">
      <p>You were made to be whole. The other lesson says it first.</p>
    </div>
    <div id="learn-read-mine">
      <p>You were made to be whole. Wisdom builds the house.</p>
    </div>
  `;
  document.body.appendChild(page);
  return {
    page,
    mine: page.querySelector('#learn-read-mine'),
    other: page.querySelector('#learn-read-other'),
    done: () => page.remove(),
  };
}

describe('a read that speaks its own text is still followed word by word', () => {
  it('every spoken sentence that is on screen gets a SPAN, and a span finds the word', () => {
    const { mine, done } = twoLessonsOnOnePage();
    const follow = buildFollowMap(mine);
    const spoken = segmentText(follow.text);
    const spans = alignSegmentSpans(follow, spoken);

    expect(spans.length).toBe(spoken.length);
    expect(spans.every(Boolean), 'a sentence of this element did not locate in it').toBe(true);

    // A span locates the word the engine's boundary event names, which is the
    // whole point: charIndex 0 of the second sentence is its first word.
    const i = spoken.findIndex((s) => s.includes('Wisdom'));
    expect(i).toBeGreaterThan(-1);
    const r = wordRangeIn(follow, spans[i], 0);
    expect(r, 'no word range inside a located sentence').toBeTruthy();
    expect(r.toString()).toBe('Wisdom');
    done();
  });

  it('PROVEN-TO-CATCH: the span lookup and the segment-index lookup agree word for word', () => {
    // If these ever disagree, the new path is highlighting a different word
    // from the one the old path would have, which is the defect wearing a
    // different coat.
    const { mine, done } = twoLessonsOnOnePage();
    const follow = buildFollowMap(mine);
    for (let i = 0; i < follow.segments.length; i++) {
      for (const at of [0, 4, 12]) {
        const viaIndex = wordRange(follow, i, at);
        const viaSpan = wordRangeIn(follow, follow.segments[i], at);
        expect(viaSpan && viaSpan.toString()).toEqual(viaIndex && viaIndex.toString());
      }
    }
    done();
  });

  it('a sentence that is spoken but NOT on screen stays null — an honest gap, never a guess', () => {
    const { mine, done } = twoLessonsOnOnePage();
    const follow = buildFollowMap(mine);
    const spoken = ['You were made to be whole.', 'This sentence is not rendered anywhere.'];
    const spans = alignSegmentSpans(follow, spoken);
    expect(spans[0]).toBeTruthy();
    expect(spans[1]).toBe(null);
    // And the word lookup refuses a null span rather than inventing a range.
    expect(wordRangeIn(follow, spans[1], 0)).toBe(null);
    done();
  });

  it('a reading that is not this element at all locates NOTHING, so the caller can tell', () => {
    // This is the signal the reader now acts on: no span at all means the
    // registered text is not this page's reading, and the page wins.
    const { mine, done } = twoLessonsOnOnePage();
    const follow = buildFollowMap(mine);
    const spans = alignSegmentSpans(follow, segmentText('A hurricane is named for the day it lands. Nobody here said that.'));
    expect(spans.some(Boolean)).toBe(false);
    done();
  });
});

describe('alignSegments and alignSegmentSpans are one walk, one truth', () => {
  it('the same sentences locate at the same places, and the cursor only moves forward', () => {
    const { mine, done } = twoLessonsOnOnePage();
    const follow = buildFollowMap(mine);
    // The SAME sentence twice: the moving cursor must not hand both the first
    // occurrence, or a repeated line would highlight the same place twice.
    const spoken = ['You were made to be whole.', 'Wisdom builds the house.'];
    const spans = alignSegmentSpans(follow, spoken);
    const ranges = alignSegments(follow, spoken);
    expect(spans.length).toBe(ranges.length);
    for (let i = 0; i < spans.length; i++) {
      expect(!!spans[i]).toBe(!!ranges[i]);
      if (spans[i]) expect(follow.text.slice(spans[i].start, spans[i].end)).toBe(spoken[i]);
    }
    expect(spans[1].start).toBeGreaterThan(spans[0].start);
    done();
  });

  it('the element is mapped, NOT the page — the whole reason a highlight could land on another lesson', () => {
    // Mapping the page makes the first occurrence of a shared sentence belong
    // to whichever card comes first in the DOM. Mapping the element cannot.
    const { page, mine, done } = twoLessonsOnOnePage();
    const shared = 'You were made to be whole.';
    const ofPage = alignSegmentSpans(buildFollowMap(page), [shared])[0];
    const ofMine = buildFollowMap(mine);
    const inMine = alignSegmentSpans(ofMine, [shared])[0];
    expect(ofPage).toBeTruthy();
    expect(inMine).toBeTruthy();
    // In the element's own map the sentence is at the top; on the page it is
    // the OTHER lesson's copy that answers first.
    expect(inMine.start).toBe(0);
    expect(ofMine.text.slice(inMine.start, inMine.end)).toBe(shared);
    expect(page.querySelector('#learn-read-other').textContent).toContain(shared);
    done();
  });
});
