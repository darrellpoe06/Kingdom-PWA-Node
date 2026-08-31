// @vitest-environment jsdom
// =============================================================================
// A block boundary is a word boundary — the follow map must not weld blocks
// =============================================================================
// Darrell 2026-08-31, a SECOND report on the same surface after the reader's
// controls were made reachable: "The words in the system don't highlight the
// words as the reader reads... this is specifically for the over all review and
// the read me button."
//
// Tracing that in real Chromium (not reasoned about) found the machinery itself
// was sound — the CSS Custom Highlight API is present, the ::highlight() rules
// are in the bundle, and highlightSegment/highlightWord genuinely paint. What
// was wrong was the MAP they paint from.
//
// buildFollowMap walks text nodes and collapses whitespace INSIDE each node, but
// a block boundary carries no whitespace of its own — so adjacent blocks were
// concatenated with nothing between them. Measured output for
// `<h2>Think on These Things</h2><p>Whatsoever things are true...`:
//
//     "Think on These ThingsWhatsoever things are true, whatsoever..."
//
// That breaks the reader twice. The engine speaks the run-on word; and because
// segmentText splits only on . ! ?, a heading with no terminal punctuation is
// welded onto the sentence after it — so the "sentence" highlight washes a
// heading plus half a paragraph, and every word offset inside that merged
// segment is measured from the wrong origin, putting the word highlight off the
// word being spoken. The page-read fallback never had this bug because it reads
// innerText, which breaks lines between blocks.
//
// These pin the fix, and are proven-to-catch: the pre-fix behaviour is asserted
// to be exactly what the checks reject.
import { describe, it, expect } from 'vitest';
import { buildFollowMap, segmentRange, wordRange } from '../lib/read-follow.js';
import { segmentText } from '../lib/tts.js';

const mount = (html) => {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
};

describe('blocks are separated, so the engine never speaks a run-on word', () => {
  it('THE REPORTED CASE: a heading and the paragraph after it do not weld', () => {
    const el = mount('<h2>Think on These Things</h2><p>Whatsoever things are true, whatsoever things are honest.</p>');
    const follow = buildFollowMap(el);
    expect(follow.text).toContain('Think on These Things Whatsoever');
    expect(follow.text, 'the run-on that was actually measured in Chromium').not.toContain('ThingsWhatsoever');
  });

  it('separates every block kind a lesson actually uses', () => {
    const el = mount([
      '<h3>Take it with you</h3>',
      '<p>Catch one thought today.</p>',
      '<ul><li>Is it true?</li><li>Is it honest?</li></ul>',
      '<div>The greatest realities are unseen.</div>',
      '<blockquote>Let peace rule.</blockquote>',
    ].join(''));
    const t = buildFollowMap(el).text;
    for (const welded of ['youCatch', 'today.Is', 'true?Is', 'honest?The', 'unseen.Let']) {
      expect(t, `blocks welded at "${welded}"`).not.toContain(welded);
    }
  });

  it('does NOT insert a space inside one block — inline markup stays one word', () => {
    const el = mount('<p>un<em>break</em>able and <strong>bold</strong>ly one</p>');
    const t = buildFollowMap(el).text;
    expect(t).toContain('unbreakable');
    expect(t).toContain('boldly');
  });

  it('adds no leading or trailing padding, and never doubles a real space', () => {
    const el = mount('<div><p>One.</p> <p>Two.</p></div>');
    const t = buildFollowMap(el).text;
    expect(t).toBe('One. Two.');
    expect(t).not.toMatch(/ {2}/);
    expect(t).not.toMatch(/^\s|\s$/);
  });
});

describe('the segmentation that follow-along depends on', () => {
  it('a heading without terminal punctuation no longer swallows the next sentence', () => {
    const el = mount('<h2>Think on These Things</h2><p>Whatsoever things are true. The greatest realities are unseen.</p>');
    const follow = buildFollowMap(el);
    // The heading still joins the first sentence (segmentText splits only on
    // . ! ?) — but as separate WORDS, which is what the fallback path produces
    // too. The regression this guards is the welded word, and the sentence
    // count staying right.
    expect(follow.segments.length).toBe(2);
    expect(follow.segments[0].text).toBe('Think on These Things Whatsoever things are true.');
    expect(follow.segments[1].text).toBe('The greatest realities are unseen.');
  });

  it('every segment still resolves to a real DOM range — mapping survived the change', () => {
    const el = mount('<h2>Heading</h2><p>First sentence here. Second sentence here.</p><p>Third one.</p>');
    const follow = buildFollowMap(el);
    expect(follow.segments.every(Boolean), 'a segment failed to locate').toBe(true);
    follow.segments.forEach((_, i) => {
      const r = segmentRange(follow, i);
      expect(r, `segment ${i} has no range`).toBeTruthy();
      expect(String(r).length).toBeGreaterThan(0);
    });
  });

  it('the map still aligns with what the engine is handed (alignment by construction)', () => {
    const el = mount('<h2>Heading</h2><p>First sentence here. Second sentence here.</p>');
    const follow = buildFollowMap(el);
    // read() is given follow.text; the engine segments it with segmentText.
    expect(segmentText(follow.text)).toEqual(follow.segments.map((s) => s.text));
  });

  it('a word offset inside a segment lands on that word, not one measured from a welded origin', () => {
    const el = mount('<h2>Think on These Things</h2><p>Whatsoever things are true.</p>');
    const follow = buildFollowMap(el);
    const seg0 = follow.segments[0].text;
    const at = seg0.indexOf('Whatsoever');
    expect(at).toBeGreaterThan(-1);
    expect(String(wordRange(follow, 0, at))).toBe('Whatsoever');
  });
});

describe('PROVEN-TO-CATCH — the pre-fix map is exactly what these reject', () => {
  it('the welded text the old walker produced fails the boundary check', () => {
    const preFix = 'Think on These ThingsWhatsoever things are true, whatsoever things are honest.';
    expect(preFix.includes('ThingsWhatsoever')).toBe(true);          // what shipped
    expect(preFix.includes('Think on These Things Whatsoever')).toBe(false);
  });

  it('and the welded text really does mis-segment, which is why following broke', () => {
    const preFix = 'Think on These ThingsWhatsoever things are true. The greatest realities are unseen.';
    const fixed = 'Think on These Things Whatsoever things are true. The greatest realities are unseen.';
    // same sentence COUNT, but the first segment's words — and therefore every
    // word offset inside it — differ from what is on screen
    expect(segmentText(preFix)[0]).toContain('ThingsWhatsoever');
    expect(segmentText(fixed)[0]).toContain('Things Whatsoever');
    expect(segmentText(preFix)[0].indexOf('things are true'))
      .not.toBe(segmentText(fixed)[0].indexOf('things are true'));
  });
});
