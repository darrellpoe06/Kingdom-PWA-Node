// =============================================================================
// camera-video -- the live <video> element a camera view holds, and lets go of
// =============================================================================
export function attachStream(el, stream) {
  if (el && stream && el.srcObject !== stream) { try { el.srcObject = stream; } catch { /* a device fact */ } }
}
// ONE PLAYER, ONE STREAM (DR-1097, nineteenth read). cams-diag 39547175167 read
// 32 live views (MAX_LIVE, every slot the NAS has) close in one second when
// Darrell's tab closed at 23:59:32: five of 805_north_sd at once, four of
// 805_back_door_sd, each 90-404 s old and still carrying video (up to 54 MB).
// A reconnect swapped the keyed <video> and React's ref(null) dropped our only
// handle on the old one, so nothing ever cleared its src; a <video> taken out
// of the page keeps its live MP4 open. Every reconnect left one stream running
// unseen until the NAS had no slot left ("could not open") and the phone's
// road was full ("froze", "no picture"), which made the next reconnect. Now
// the old element gives its stream back the moment it is replaced or its view
// ends, and a ref(null) never loses the handle.
export function releaseVideo(v) {
  if (!v) return;
  try { v.pause(); } catch { /* a device fact */ }
  try { if (v.srcObject) v.srcObject = null; } catch { /* a device fact */ }
  try { if (v.hasAttribute && v.hasAttribute('src')) { v.removeAttribute('src'); v.load(); } } catch { /* a device fact */ }
}
export function holdVideo(t, el, stream) {
  if (!el) return; // React's ref(null) on a re-render or unmount: the handle is kept for release
  if (t.video && t.video !== el) releaseVideo(t.video);
  t.video = el;
  attachStream(el, stream);
}
export function dropVideo(t) {
  releaseVideo(t.video);
  t.video = null;
}
