// tv-time-sync — the PURE merge that lets a TV Time list follow its owner across
// devices (Darrell 2026-07-04). The I/O (fetch/push/subscribe) is fail-soft and
// mirrors the deployed study-sync rail; here the merge — the part that decides
// what a device shows and whether it writes up — is pinned. Owner-only; no
// network. (Live-DB isolation is smoke-tested on the NAS at deploy; the
// cross-member "circle" layer is separate — see migration 0072 header.)
import { describe, it, expect } from 'vitest';
import { mergeTvCloud, unionStates } from '../lib/tv-time-sync.js';
import {
  emptyTv, addShowFromCatalog, addMovieFromCatalog, toggleEpisode, touchTv, tvUpdatedAt, showProgress, customCatalog,
} from '../lib/tv-time.js';

const GOT = { id: 82, title: 'Game of Thrones', seasons: [{ season: 1, episodes: [{ number: 1, name: 'a' }, { number: 2, name: 'b' }] }] };
const MOVIE = { id: 'mv-1', kind: 'movie', title: 'Black Panther', poster: 'bp.jpg' };
const cloudOf = (state, at) => ({ doc: touchTv(state, at), updated_at: at });

describe('mergeTvCloud — newest-wins across the owner\'s devices', () => {
  it('seeds an empty cloud from local (push up)', () => {
    const local = addShowFromCatalog(emptyTv(), GOT);
    const { state, push } = mergeTvCloud(local, { doc: null, updated_at: '' });
    expect(push).toBe(true);
    expect(customCatalog(state).some((x) => x.id === '82')).toBe(true);
  });
  it('adopts the cloud onto an empty device (no push)', () => {
    const cloud = cloudOf(addShowFromCatalog(emptyTv(), GOT), '2026-07-04T10:00:00Z');
    const { state, push } = mergeTvCloud(emptyTv(), cloud);
    expect(push).toBe(false);
    expect(customCatalog(state).some((x) => x.id === '82')).toBe(true);
  });
  it('newer local wins and re-pushes; older local yields to the cloud', () => {
    const older = touchTv(addShowFromCatalog(emptyTv(), GOT), '2026-07-04T10:00:00Z');
    const cloudNewer = cloudOf(addMovieFromCatalog(emptyTv(), MOVIE), '2026-07-04T12:00:00Z');
    // local older than cloud → cloud wins, no push
    let r = mergeTvCloud(older, cloudNewer);
    expect(r.push).toBe(false);
    expect(customCatalog(r.state).some((x) => x.id === 'mv-1')).toBe(true);
    // local newer than cloud → local wins, push
    const localNewer = touchTv(addShowFromCatalog(emptyTv(), GOT), '2026-07-04T13:00:00Z');
    r = mergeTvCloud(localNewer, cloudNewer);
    expect(r.push).toBe(true);
    expect(customCatalog(r.state).some((x) => x.id === '82')).toBe(true);
  });
  it('equal stamps adopt the cloud and DO NOT re-push (breaks the realtime echo loop)', () => {
    const at = '2026-07-04T11:00:00Z';
    const local = touchTv(addShowFromCatalog(emptyTv(), GOT), at);
    const cloud = cloudOf(addShowFromCatalog(emptyTv(), GOT), at);
    const { push } = mergeTvCloud(local, cloud);
    expect(push).toBe(false);
  });
  it('a never-stamped local list (pre-sign-in) UNIONS with the cloud — nothing dropped', () => {
    const local = addShowFromCatalog(emptyTv(), GOT);          // no stamp
    expect(tvUpdatedAt(local)).toBe('');
    const cloud = cloudOf(addMovieFromCatalog(emptyTv(), MOVIE), '2026-07-04T09:00:00Z');
    const { state, push } = mergeTvCloud(local, cloud);
    expect(push).toBe(true);
    const ids = customCatalog(state).map((x) => x.id);
    expect(ids).toContain('82');       // the local show survived
    expect(ids).toContain('mv-1');     // the cloud movie came in
  });
  it('unreachable cloud (null) keeps local and pushes if there is anything', () => {
    expect(mergeTvCloud(addShowFromCatalog(emptyTv(), GOT), null)).toMatchObject({ push: true });
    expect(mergeTvCloud(emptyTv(), null)).toMatchObject({ push: false });
  });
});

describe('unionStates — no data loss on first sign-in', () => {
  it('keeps the more-active tracking entry when an id exists on both sides', () => {
    const watched = toggleEpisode(addShowFromCatalog(emptyTv(), GOT), '82', 1, 1); // 1 episode in
    const fresh = addShowFromCatalog(emptyTv(), GOT);                              // 0 episodes
    // union in either order keeps the watched progress
    expect(showProgress(unionStates(watched, fresh), '82').watched).toBe(1);
    expect(showProgress(unionStates(fresh, watched), '82').watched).toBe(1);
  });
});
