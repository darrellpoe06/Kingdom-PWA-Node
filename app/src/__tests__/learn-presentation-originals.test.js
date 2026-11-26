// =============================================================================
// Paid picture originals reach PERMANENT storage (the private originals repo)
// and are proven there before another picture is bought (owner 2026-11-25),
// and only NEW passing covers are published to the app.
// =============================================================================
// No network: the "private repository" is a local bare git repo in a temp dir.
// Proven to catch: a missing original, a file whose bytes differ, a stale or
// incomplete verdict all keep the gate CLOSED; an existing cover is never
// replaced.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  backupAndVerify,
  paidOriginals,
  verifyOriginals,
  restoreFromArtifact,
  fetchOriginalsState,
  missingSources,
} from '../../scripts/learn-presentation/lib/originals-backup.mjs';
import { originalsGate, eitherGate, storageGate, paidPictureShas, STALE_HOURS } from '../../scripts/learn-presentation/lib/storage-gate.mjs';
import { selectNewCovers, mergeRecords, writePublishTree } from '../../scripts/learn-presentation/lib/publish-covers.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (args, cwd) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();
const NOW = Date.parse('2026-11-25T12:00:00Z');

/** A pipeline working dir: state/records.json + topics.json and images/. */
function workingDir() {
  const root = mkdtempSync(join(tmpdir(), 'orig-'));
  const state = join(root, 'state');
  const images = join(root, 'images');
  mkdirSync(join(images, 'living-lessons'), { recursive: true });
  mkdirSync(join(images, 'v2', 'living-lessons'), { recursive: true });
  mkdirSync(state, { recursive: true });
  const pics = {
    a: Buffer.from('picture A bytes'),
    a1: Buffer.from('picture A version one'),
    b: Buffer.from('picture B bytes'),
    t: Buffer.from('topic cover bytes'),
  };
  writeFileSync(join(images, 'v2/living-lessons/ll1-a.jpg'), pics.a);
  writeFileSync(join(images, 'living-lessons/ll1-a.jpg'), pics.a1);
  writeFileSync(join(images, 'living-lessons/ll2-b.jpg'), pics.b);
  mkdirSync(join(images, 'v2/topics'), { recursive: true });
  writeFileSync(join(images, 'v2/topics/faith.jpg'), pics.t);
  const records = {
    'living-lessons::ll1-a': {
      courseKey: 'living-lessons',
      lessonId: 'll1-a',
      image: { path: 'v2/living-lessons/ll1-a.jpg', sha256: sha(pics.a) },
      imageV1: { path: 'living-lessons/ll1-a.jpg', sha256: sha(pics.a1) },
    },
    'living-lessons::ll2-b': { courseKey: 'living-lessons', lessonId: 'll2-b', image: { path: 'living-lessons/ll2-b.jpg', sha256: sha(pics.b) } },
    'living-lessons::ll3-c': { courseKey: 'living-lessons', lessonId: 'll3-c', status: 'review' }, // titled, no picture
  };
  writeFileSync(join(state, 'records.json'), JSON.stringify(records));
  writeFileSync(join(state, 'topics.json'), JSON.stringify({ faith: { key: 'faith', image: { path: 'v2/topics/faith.jpg', sha256: sha(pics.t) } } }));
  const bare = join(root, 'originals.git');
  git(['init', '-q', '--bare', '-b', 'main', bare], root);
  return { root, state, images, bare, pics, work: join(root, 'tmp') };
}

const run = (w, runId = '7') =>
  backupAndVerify({ stateDir: w.state, imagesDir: w.images, remote: w.bare, runId, workDir: w.work, now: () => '2026-11-25T11:00:00.000Z' });
const cloneOf = (w) => {
  const d = mkdtempSync(join(tmpdir(), 'orig-clone-'));
  git(['clone', '-q', w.bare, d], w.root);
  return d;
};

describe('originals backup: every paid picture into the private repo, proven on a fresh clone', () => {
  let w;
  beforeEach(() => {
    w = workingDir();
  });

  it('lists every paid picture once: lesson pictures, kept v1 pictures and topic covers', () => {
    const list = paidOriginals(w.state);
    expect(list.map((o) => o.path).sort()).toEqual(
      [
        `originals/living-lessons/ll1-a/${sha(w.pics.a)}.jpg`,
        `originals/living-lessons/ll1-a/${sha(w.pics.a1)}.jpg`,
        `originals/living-lessons/ll2-b/${sha(w.pics.b)}.jpg`,
        `originals/topics/faith/${sha(w.pics.t)}.jpg`,
      ].sort()
    );
    expect(list.map((o) => o.sha256).sort()).toEqual([...paidPictureShas(w.state)].sort());
  });

  it('copies, writes the manifest, verifies byte-for-byte on a fresh clone and records the verdict', () => {
    const { verdict, staged } = run(w);
    expect(staged.copied).toBe(4);
    expect(verdict).toMatchObject({ expected: 4, verified: 4, missing: [], runId: '7' });
    const d = cloneOf(w);
    const manifest = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8'));
    expect(manifest.entries).toHaveLength(4);
    const e = manifest.entries.find((x) => x.lessonId === 'll2-b');
    expect(e).toMatchObject({ courseKey: 'living-lessons', sha256: sha(w.pics.b), bytes: w.pics.b.length, runId: '7' });
    expect(readFileSync(join(d, e.path))).toEqual(w.pics.b);
    expect(JSON.parse(readFileSync(join(d, 'verdict.json'), 'utf8'))).toMatchObject({ expected: 4, verified: 4, missing: [] });
  });

  it('a second run copies nothing new and never rewrites an original or its manifest entry', () => {
    run(w, '7');
    const { verdict, staged } = run(w, '8');
    expect(staged).toMatchObject({ copied: 0, already: 4 });
    expect(verdict.verified).toBe(4);
    const d = cloneOf(w);
    const manifest = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8'));
    expect(manifest.entries.every((x) => x.runId === '7')).toBe(true);
  });

  it('new bytes for the same lesson are kept BESIDE the old ones', () => {
    run(w);
    const fresh = Buffer.from('a regenerated picture for B');
    writeFileSync(join(w.images, 'living-lessons/ll2-b.jpg'), fresh);
    const recs = JSON.parse(readFileSync(join(w.state, 'records.json'), 'utf8'));
    recs['living-lessons::ll2-b'].image.sha256 = sha(fresh);
    writeFileSync(join(w.state, 'records.json'), JSON.stringify(recs));
    expect(run(w).verdict.missing).toEqual([]);
    const d = cloneOf(w);
    expect(existsSync(join(d, `originals/living-lessons/ll2-b/${sha(w.pics.b)}.jpg`))).toBe(true);
    expect(existsSync(join(d, `originals/living-lessons/ll2-b/${sha(fresh)}.jpg`))).toBe(true);
  });

  it('PROVEN TO CATCH: a paid picture absent from this run is reported missing', () => {
    writeFileSync(join(w.images, 'living-lessons/ll2-b.jpg'), 'not the paid bytes');
    expect(missingSources(paidOriginals(w.state), w.images)).toHaveLength(1);
    const { verdict } = run(w);
    expect(verdict.verified).toBe(3);
    expect(verdict.missing).toEqual([`originals/living-lessons/ll2-b/${sha(w.pics.b)}.jpg`]);
  });

  it('PROVEN TO CATCH: a stored file whose bytes differ is never overwritten and fails verification', () => {
    const d = cloneOf(w);
    const bad = `originals/living-lessons/ll2-b/${sha(w.pics.b)}.jpg`;
    mkdirSync(join(d, 'originals/living-lessons/ll2-b'), { recursive: true });
    writeFileSync(join(d, bad), 'corrupted');
    git(['add', '-A'], d);
    git(['commit', '-qm', 'corrupt'], d);
    git(['push', '-q', 'origin', 'HEAD:refs/heads/main'], d);
    const { verdict, staged } = run(w);
    expect(staged.conflicts).toEqual([bad]);
    expect(verdict.missing).toEqual([bad]);
    expect(readFileSync(join(cloneOf(w), bad), 'utf8')).toBe('corrupted');
  });

  it('verifyOriginals refuses a file not listed in the manifest', () => {
    run(w);
    const d = cloneOf(w);
    writeFileSync(join(d, 'manifest.json'), JSON.stringify({ entries: [] }));
    expect(verifyOriginals({ cloneDir: d, list: paidOriginals(w.state) }).verified).toBe(0);
  });

  it('the artifact fallback puts back only bytes that match the ledger', async () => {
    const list = paidOriginals(w.state);
    const target = list.find((o) => o.lessonId === 'll2-b');
    const saved = readFileSync(join(w.images, target.src));
    writeFileSync(join(w.images, target.src), 'lost');
    const unzip = (zip, dir) => {
      mkdirSync(join(dir, 'outbox/living-lessons'), { recursive: true });
      writeFileSync(join(dir, 'outbox', target.src), saved);
    };
    const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
    const n = await restoreFromArtifact({
      id: 1,
      repo: 'o/r',
      token: 't',
      missing: missingSources(list, w.images),
      imagesDir: w.images,
      tmpDir: w.work,
      fetchImpl,
      unzip,
    });
    expect(n).toBe(1);
    expect(missingSources(list, w.images)).toEqual([]);
  });

  it('reads the verdict with the token and never returns it in an error', async () => {
    const seen = [];
    const ok = await fetchOriginalsState({
      token: 'SECRET',
      fetchImpl: async (url, o) => {
        seen.push([url, o.headers.Authorization]);
        return { ok: true, text: async () => (url.endsWith('manifest.json') ? '{"entries":[]}' : '{"at":"x"}') };
      },
    });
    expect(ok.manifest).toEqual({ entries: [] });
    expect(seen.every(([u, a]) => u.startsWith('https://api.github.com/repos/darrellpoe06/poetech-learn-originals/contents/') && a === 'Bearer SECRET')).toBe(
      true
    );
    const bad = await fetchOriginalsState({
      token: 'SECRET',
      fetchImpl: async () => {
        throw new Error('boom SECRET');
      },
    });
    expect(bad.verdict).toBe('');
    expect(bad.error).not.toContain('SECRET');
    expect((await fetchOriginalsState({ token: '' })).verdict).toBe('');
  });
});

describe('storage gate: the private originals repo as permanent storage', () => {
  const paid = new Set(['aa', 'bb']);
  const manifest = { entries: [{ sha256: 'aa' }, { sha256: 'bb' }] };
  const verdict = (o = {}) => JSON.stringify({ at: '2026-11-25T11:00:00Z', expected: 2, verified: 2, missing: [], shas: ['aa', 'bb'], ...o });
  const gate = (o = {}) => originalsGate({ paidShas: paid, verdict: verdict(), manifest, nowMs: NOW, ...o });

  it('opens when every paid picture is verified and listed', () => {
    expect(gate().open).toBe(true);
  });

  it('PROVEN TO CATCH: a missing original keeps it closed', () => {
    expect(gate({ verdict: verdict({ missing: ['originals/x/y/bb.jpg'], verified: 1, shas: ['aa'] }) }).open).toBe(false);
    expect(gate({ verdict: verdict({ shas: ['aa'] }) }).open).toBe(false); // bought since the last backup
    expect(gate({ manifest: { entries: [{ sha256: 'aa' }] } }).open).toBe(false);
  });

  it('closed with no verdict, an unreadable one, a stale one, or no lists', () => {
    expect(gate({ verdict: '' }).open).toBe(false);
    expect(gate({ verdict: '{nope' }).open).toBe(false);
    expect(gate({ verdict: verdict({ at: new Date(NOW - (STALE_HOURS + 1) * 3600000).toISOString() }) }).open).toBe(false);
    expect(gate({ verdict: verdict({ shas: undefined }) }).open).toBe(false);
    expect(gate({ verdict: verdict({ missing: 0 }) }).open).toBe(false);
  });

  it('either verified source opens; neither keeps it paused', () => {
    const nasClosed = storageGate({ paid: 2, verdict: '', nowMs: NOW });
    expect(eitherGate(nasClosed, gate()).open).toBe(true);
    expect(eitherGate(nasClosed, gate({ verdict: '' })).open).toBe(false);
    const nasOpen = storageGate({ paid: 2, verdict: JSON.stringify({ at: '2026-11-25T11:00:00Z', present_of_expected: 2, missing: 0 }), nowMs: NOW });
    expect(eitherGate(nasOpen, gate({ verdict: '' })).open).toBe(true);
  });

  it('a real backup verdict opens the gate for that ledger, and a new unbacked picture closes it', () => {
    const w = workingDir();
    const { verdict: v } = run(w);
    const d = cloneOf(w);
    const m = JSON.parse(readFileSync(join(d, 'manifest.json'), 'utf8'));
    const shas = paidPictureShas(w.state);
    expect(originalsGate({ paidShas: shas, verdict: JSON.stringify(v), manifest: m, nowMs: NOW }).open).toBe(true);
    expect(originalsGate({ paidShas: new Set([...shas, 'f'.repeat(64)]), verdict: JSON.stringify(v), manifest: m, nowMs: NOW }).open).toBe(false);
  });
});

describe('publish-covers: only NEW passing covers reach the app', () => {
  function tree() {
    const root = mkdtempSync(join(tmpdir(), 'pub-'));
    const composed = join(root, 'composed');
    const pub = join(root, 'app/public/learn-thumbs');
    const lib = join(root, 'app/src/lib/learn-presentation');
    mkdirSync(lib, { recursive: true });
    for (const id of ['ll1-live', 'll2-new', 'll3-flagged', 'll4-titled', 'll6-file']) {
      mkdirSync(join(composed, 'living-lessons', id), { recursive: true });
      for (const f of ['w640.webp', 'w1280.webp']) writeFileSync(join(composed, 'living-lessons', id, f), `${id} ${f}`);
    }
    mkdirSync(join(pub, 'living-lessons/ll1-live'), { recursive: true });
    writeFileSync(join(pub, 'living-lessons/ll1-live/w1280.webp'), 'THE LAUNCHED COVER');
    mkdirSync(join(pub, 'living-lessons/ll6-file'), { recursive: true });
    writeFileSync(join(pub, 'living-lessons/ll6-file/w640.webp'), 'an existing file');
    const live = {
      lessonId: 'll1-live',
      courseKey: 'living-lessons',
      displayTitle: 'Live',
      image: { src: 'learn-thumbs/living-lessons/ll1-live/w1280.webp' },
      status: 'review',
    };
    const titled = { lessonId: 'll4-titled', courseKey: 'living-lessons', displayTitle: 'Titled', image: null, status: 'review' };
    const other = { lessonId: 'll9-other', courseKey: 'living-lessons', displayTitle: 'Other', status: 'review' };
    const doc = { schema: 'learn-presentation/v1', records: [live, titled, other] };
    writeFileSync(join(lib, 'presentation-records.json'), `${JSON.stringify(doc, null, 1)}\n`);
    return { root, composed, pub, doc };
  }
  const exp = (id, o = {}) => ({
    lessonId: id,
    courseKey: 'living-lessons',
    originalTitleAtApproval: `T ${id}`,
    displayTitle: `D ${id}`,
    thumbHeadline: 'H',
    promoDescription: 'P',
    visual: { prompt: 'p', alt: 'a' },
    image: {
      src: `/learn-thumbs/living-lessons/${id}/w1280.webp`,
      srcSet: { webp: `/learn-thumbs/living-lessons/${id}/w640.webp 640w, /learn-thumbs/living-lessons/${id}/w1280.webp 1280w`, avif: 'x' },
      lqip: 'data:x',
      og: 'og',
      sha256: 's',
    },
    status: 'review',
    featured: false,
    ...o,
  });
  const exported = [
    exp('ll1-live'),
    exp('ll2-new'),
    exp('ll3-flagged', { needsReview: ['similar-image'] }),
    exp('ll4-titled'),
    exp('ll5-uncomposed', { image: { src: 'learn-thumbs/living-lessons/ll5-uncomposed.jpg' } }),
    exp('ll6-file'),
    exp('ll7-stale'),
  ];
  const titles = new Map(exported.map((r) => [r.lessonId, r.originalTitleAtApproval]));
  titles.set('ll7-stale', 'the lesson was renamed');

  it('takes only passing covers that are new, and never an existing cover or file', () => {
    const t = tree();
    const sel = selectNewCovers({ exported, committed: t.doc.records, publicThumbs: t.pub, composedDir: t.composed, currentTitles: titles });
    expect(sel.add.map((a) => a.record.lessonId)).toEqual(['ll2-new', 'll4-titled']);
    expect(sel.skipped).toMatchObject({ alreadyLive: 1, review: 2, fileExists: 1, stale: 1 });
    expect(sel.add[0].record.image).toEqual({
      src: 'learn-thumbs/living-lessons/ll2-new/w1280.webp',
      srcSet: { webp: 'learn-thumbs/living-lessons/ll2-new/w640.webp 640w, learn-thumbs/living-lessons/ll2-new/w1280.webp 1280w' },
      lqip: 'data:x',
    });
  });

  it('merges without touching any record that has a cover, and completes a titled one in place', () => {
    const t = tree();
    const sel = selectNewCovers({ exported, committed: t.doc.records, publicThumbs: t.pub, composedDir: t.composed, currentTitles: titles });
    const merged = mergeRecords(t.doc, sel.add);
    expect(merged.records[0]).toBe(t.doc.records[0]);
    expect(merged.records[2]).toBe(t.doc.records[2]);
    expect(merged.records[1].lessonId).toBe('ll4-titled');
    expect(merged.records[1].image.src).toContain('ll4-titled/w1280.webp');
    expect(merged.records.map((r) => r.lessonId)).toEqual(['ll1-live', 'll4-titled', 'll9-other', 'll2-new']);
  });

  it('writes a tree that mirrors the repository, and nothing when there is nothing new', () => {
    const t = tree();
    const out = join(t.root, 'publish');
    writePublishTree({ exported, repoRoot: t.root, composedDir: t.composed, outRoot: out, currentTitles: titles });
    expect(readFileSync(join(out, 'app/public/learn-thumbs/living-lessons/ll2-new/w640.webp'), 'utf8')).toBe('ll2-new w640.webp');
    expect(existsSync(join(out, 'app/public/learn-thumbs/living-lessons/ll1-live'))).toBe(false);
    const merged = JSON.parse(readFileSync(join(out, 'app/src/lib/learn-presentation/presentation-records.json'), 'utf8'));
    expect(merged.records[0]).toEqual(t.doc.records[0]);
    const none = join(t.root, 'publish-none');
    const sel = writePublishTree({ exported: [exp('ll1-live')], repoRoot: t.root, composedDir: t.composed, outRoot: none });
    expect(sel.add).toHaveLength(0);
    expect(existsSync(none)).toBe(false);
  });
});
