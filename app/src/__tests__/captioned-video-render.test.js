// Render smoke test for CaptionedVideo — proves the sovereign-captions affordance
// appears ONLY when a real timestamped track is present, and that with no track
// the component degrades to exactly the bare iframe it replaced (the unbreakable
// requirement). renderToStaticMarkup verifies STRUCTURE deterministically (the
// repo's established render-test tool); the parse/sync/search behavior is proven
// in captions.test.js and the YT-player wiring degrades gracefully. DR-0076.
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CaptionedVideo from '../components/CaptionedVideo.jsx';
import { buildVtt } from '../lib/captions.js';

const embed = 'https://www.youtube.com/embed/efj-t2_Z-nI';
const render = (props) => renderToStaticMarkup(createElement(CaptionedVideo, {
  embed, title: 'Celebration — service video', videoId: 'efj-t2_Z-nI', ...props,
}));

const track = {
  vtt: buildVtt([
    { start: 2, end: 5, text: 'Jesus Master have mercy on us' },
    { start: 5, end: 9, text: 'thy faith hath made thee whole' },
  ]),
  cueCount: 2,
  source: 'youtube-asr',
  lang: 'en',
};

describe('CaptionedVideo — render', () => {
  it('with no caption track, renders just the video iframe (no captions affordance)', () => {
    const html = render({ captionTrack: null });
    expect(html).toContain('<iframe');
    expect(html).toContain(embed);
    expect(html).not.toContain('Captions &amp; transcript');
  });

  it('with a real track, offers the CC toggle, the line count, and the provenance', () => {
    const html = render({ captionTrack: track });
    expect(html).toContain('Captions &amp; transcript');
    expect(html).toContain('2 lines');
    expect(html).toContain('YouTube auto-captions'); // provenance label from the source enum
  });

  it('labels a sovereign Whisper track distinctly', () => {
    const html = render({ captionTrack: { ...track, source: 'whisper-nas' } });
    expect(html).toContain('Whisper (sovereign, church GPU)');
  });

  it('treats an untimed (cue-less) track as no captions', () => {
    const html = render({ captionTrack: { vtt: 'WEBVTT\n\n', cueCount: 0, source: 'youtube-asr' } });
    expect(html).not.toContain('Captions &amp; transcript');
  });
});
