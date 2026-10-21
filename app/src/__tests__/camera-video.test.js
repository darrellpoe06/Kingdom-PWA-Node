// One player, one stream (DR-1097, nineteenth read): a live <video> that is
// replaced, or whose view ends, gives its stream back; React's ref(null) never
// loses the handle that release needs.
import { describe, it, expect } from 'vitest';
import { holdVideo, dropVideo, releaseVideo } from '../lib/camera-video.js';

function fakeVideo(src = '/cams/live/x.mp4?t=1') {
  const v = { attrs: { src }, paused: false, loads: 0, srcObject: null };
  v.pause = () => { v.paused = true; };
  v.load = () => { v.loads += 1; };
  v.hasAttribute = (k) => k in v.attrs;
  v.removeAttribute = (k) => { delete v.attrs[k]; };
  return v;
}

describe('camera-video', () => {
  it('a replaced element lets go of its stream; the same element on a re-render is left alone', () => {
    const t = { video: null };
    const a = fakeVideo();
    holdVideo(t, a, null);
    holdVideo(t, null, null); // React's ref(null) on a re-render
    holdVideo(t, a, null);
    expect(a.hasAttribute('src')).toBe(true);
    expect(t.video).toBe(a);
    const b = fakeVideo('/cams/live/x.mp4?t=2');
    holdVideo(t, null, null); // the keyed element unmounts
    expect(t.video).toBe(a); // the handle is kept, so it can still be released
    holdVideo(t, b, null);
    expect(a.hasAttribute('src')).toBe(false);
    expect(a.paused).toBe(true);
    expect(a.loads).toBe(1);
    expect(b.hasAttribute('src')).toBe(true);
    expect(t.video).toBe(b);
  });

  it('dropVideo releases whatever the view holds, a live MP4 or a WebRTC stream', () => {
    const t = { video: fakeVideo() };
    const v = t.video;
    dropVideo(t);
    expect(v.hasAttribute('src')).toBe(false);
    expect(t.video).toBe(null);
    const w = fakeVideo();
    delete w.attrs.src;
    w.srcObject = { id: 'wyze-stream' };
    holdVideo(t, w, w.srcObject);
    dropVideo(t);
    expect(w.srcObject).toBe(null);
    expect(w.loads).toBe(0); // nothing to unload: no src was set
    dropVideo(t); // nothing held: no throw
    releaseVideo(null);
  });

  it('attaches a WebRTC stream once', () => {
    const t = { video: null };
    const v = fakeVideo();
    delete v.attrs.src;
    const s = { id: 's' };
    holdVideo(t, v, s);
    expect(v.srcObject).toBe(s);
  });
});
