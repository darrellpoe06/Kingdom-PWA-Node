// =============================================================================
// originals-backup — every PAID picture original kept in permanent storage, a
// private GitHub repository, and proven there byte-for-byte (owner 2026-11-25).
// =============================================================================
// The owner, 2026-11-24: "I do not want any images we pay for to exist
// exclusively in temporary GitHub storage." The NAS verdict (storage-gate.mjs)
// never arrived, so 150 paid originals lived only in an Actions cache and an
// artifact. The owner approved a PRIVATE repository as permanent storage:
//   originals/<courseKey>/<lessonId>/<sha256>.<ext>   the provider's bytes
//   manifest.json   one entry per original, append-only
//   verdict.json    {at, runId, expected, verified, missing, shas}, written only
//                   after a FRESH clone was checked against the ledger
// Never deleted, never overwritten: a file is named by its own sha256, so the
// same bytes are skipped and different bytes for the same lesson sit beside it
// (the NAS rule). The token travels only inside the remote URL passed to git
// and is scrubbed from every error message; it is never logged.
// =============================================================================
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, normalize } from 'node:path';

export const ORIGINALS_REPO = 'darrellpoe06/poetech-learn-originals';
export const FALLBACK_ARTIFACT_ID = 14954205836; // the 150 originals' artifact (expires 2026-12-08)
const SLUG = /^[a-z0-9][a-z0-9-]*$/i;
const SHA = /^[0-9a-f]{64}$/;

export const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const readJson = (p, fallback) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
};
const safeRel = (p) => typeof p === 'string' && p && !isAbsolute(p) && !normalize(p).split(/[\\/]/).includes('..');

/**
 * Every paid picture the ledger records (lesson pictures, kept v1 pictures,
 * Explore-by-Topic covers): where it sits under images/ and where it is kept.
 */
export function paidOriginals(stateDir) {
  const out = new Map();
  const take = (courseKey, lessonId, img) => {
    if (!img || !img.path || !img.sha256) return;
    const sha = String(img.sha256).toLowerCase();
    if (!SLUG.test(courseKey) || !SLUG.test(lessonId) || !SHA.test(sha) || !safeRel(img.path)) return;
    const ext = (extname(img.path).slice(1) || 'bin').toLowerCase();
    const path = `originals/${courseKey}/${lessonId}/${sha}.${ext}`;
    out.set(path, { courseKey, lessonId, sha256: sha, src: img.path, ext, path });
  };
  const records = readJson(join(stateDir, 'records.json'), {});
  for (const r of Array.isArray(records) ? records : Object.values(records)) {
    if (!r) continue;
    take(r.courseKey, r.lessonId, r.image);
    take(r.courseKey, r.lessonId, r.imageV1);
  }
  for (const t of Object.values(readJson(join(stateDir, 'topics.json'), {}))) if (t) take('topics', t.key, t.image);
  return [...out.values()];
}

/** Which paid originals are absent from images/ or no longer the paid bytes. */
export function missingSources(list, imagesDir) {
  return list.filter((o) => {
    const p = join(imagesDir, o.src);
    return !existsSync(p) || sha256File(p) !== o.sha256;
  });
}

/**
 * Put the paid originals that are present into a working clone, and record each
 * in manifest.json. Existing files and manifest entries are never changed.
 */
export function stageOriginals({ list, imagesDir, repoDir, runId, at }) {
  const manifestPath = join(repoDir, 'manifest.json');
  const manifest = readJson(manifestPath, null) || { schema: 'learn-originals/v1', entries: [] };
  const known = new Map((manifest.entries || []).map((e) => [e.path, e]));
  const res = { copied: 0, already: 0, missingSource: [], conflicts: [] };
  for (const o of list) {
    const src = join(imagesDir, o.src);
    if (!existsSync(src) || sha256File(src) !== o.sha256) {
      res.missingSource.push(o.path);
      continue;
    }
    const dest = join(repoDir, o.path);
    if (existsSync(dest)) {
      if (sha256File(dest) === o.sha256) res.already += 1;
      else res.conflicts.push(o.path); // never overwritten; the verify below fails it
    } else {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      res.copied += 1;
    }
    if (!known.has(o.path)) {
      const entry = {
        lessonId: o.lessonId,
        courseKey: o.courseKey,
        sha256: o.sha256,
        bytes: readFileSync(src).length,
        path: o.path,
        runId: String(runId || ''),
        at,
      };
      known.set(o.path, entry);
      manifest.entries.push(entry);
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
  return res;
}

/** Byte-for-byte: every expected original is in the clone, listed, and hashes to its sha. */
export function verifyOriginals({ cloneDir, list }) {
  const listed = new Map(((readJson(join(cloneDir, 'manifest.json'), {}) || {}).entries || []).map((e) => [e.path, e]));
  const missing = [];
  const shas = new Set();
  for (const o of list) {
    const p = join(cloneDir, o.path);
    const m = listed.get(o.path);
    if (!existsSync(p) || sha256File(p) !== o.sha256 || !m || m.sha256 !== o.sha256) missing.push(o.path);
    else shas.add(o.sha256);
  }
  return { expected: list.length, verified: list.length - missing.length, missing, shas: [...shas].sort() };
}

export const remoteUrl = (repo, token) => `https://x-access-token:${token}@github.com/${repo}.git`;

function makeGit(secret) {
  const scrub = (s) => (secret ? String(s).split(secret).join('***') : String(s));
  return (args, cwd) => {
    try {
      return execFileSync(
        'git',
        ['-c', 'user.name=learn-originals', '-c', 'user.email=actions@users.noreply.github.com', '-c', 'commit.gpgsign=false', ...args],
        {
          cwd,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        }
      )
        .toString()
        .trim();
    } catch (e) {
      // The cause is withheld on purpose: its message carries the command line, and the remote URL holds the token.
      // eslint-disable-next-line preserve-caught-error
      throw new Error(scrub(`git ${args[0]} failed: ${(e.stderr && e.stderr.toString()) || e.message}`));
    }
  };
}

/** Clone, and make an empty repository's first branch main. Returns the branch. */
function cloneInto(git, remote, dir) {
  rmSync(dir, { recursive: true, force: true });
  git(['clone', '--quiet', ...(remote.startsWith('https:') ? ['--depth', '1'] : []), remote, dir]);
  git(['remote', 'set-url', 'origin', 'https://invalid.example/no-credentials-kept'], dir);
  try {
    git(['rev-parse', '--verify', '-q', 'HEAD'], dir);
  } catch {
    git(['symbolic-ref', 'HEAD', 'refs/heads/main'], dir);
  }
  return git(['symbolic-ref', '--short', 'HEAD'], dir);
}

function commitAndPush(git, dir, remote, branch, paths, message) {
  git(['add', '--', ...paths], dir);
  try {
    git(['diff', '--cached', '--quiet'], dir);
    return false; // nothing new
  } catch {
    git(['commit', '-q', '-m', message], dir);
    git(['push', '-q', remote, `HEAD:refs/heads/${branch}`], dir);
    return true;
  }
}

/**
 * Back up every paid original under root (state/ + images/) into the private
 * repository, prove it on a FRESH clone, and record the verdict there.
 */
export function backupAndVerify({ stateDir, imagesDir, remote, secret, runId, workDir, now = () => new Date().toISOString() }) {
  const git = makeGit(secret);
  const list = paidOriginals(stateDir);
  const at = now();
  const work = join(workDir, 'originals-work');
  const branch = cloneInto(git, remote, work);
  const staged = stageOriginals({ list, imagesDir, repoDir: work, runId, at });
  commitAndPush(git, work, remote, branch, ['originals', 'manifest.json'], `Originals: ${staged.copied} new paid picture(s) from run ${runId || 'local'}`);
  const fresh = join(workDir, 'originals-verify');
  cloneInto(git, remote, fresh);
  const v = verifyOriginals({ cloneDir: fresh, list });
  rmSync(fresh, { recursive: true, force: true });
  const verdict = {
    schema: 'learn-originals/verdict-v1',
    at: now(),
    runId: String(runId || ''),
    expected: v.expected,
    verified: v.verified,
    missing: v.missing,
    shas: v.shas,
  };
  writeFileSync(join(work, 'verdict.json'), `${JSON.stringify(verdict, null, 1)}\n`);
  commitAndPush(git, work, remote, branch, ['verdict.json'], `Originals verdict: ${v.verified} of ${v.expected} verified (run ${runId || 'local'})`);
  rmSync(work, { recursive: true, force: true });
  return { verdict, staged };
}

/** Read verdict.json and manifest.json from the private repository (GitHub contents API, raw). */
export async function fetchOriginalsState({ token, repo = ORIGINALS_REPO, fetchImpl = globalThis.fetch }) {
  if (!token) return { verdict: '', manifest: null, error: 'LEARN_ORIGINALS_TOKEN is not set' };
  const get = async (name) => {
    const r = await fetchImpl(`https://api.github.com/repos/${repo}/contents/${name}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Cache-Control': 'no-cache',
      },
    });
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return r.text();
  };
  try {
    const [verdict, manifest] = await Promise.all([get('verdict.json'), get('manifest.json')]);
    return { verdict, manifest: JSON.parse(manifest) };
  } catch (e) {
    return { verdict: '', manifest: null, error: String(e.message).split(token).join('***') };
  }
}

/**
 * The fallback when the ledger cache holds the ledger but not the pictures:
 * the run artifact that carries them (FALLBACK_ARTIFACT_ID). Only the exact
 * expected paths are read from the unzipped tree, and only bytes that hash to
 * the ledger's sha are put back in images/.
 */
export async function restoreFromArtifact({ id, repo, token, missing, imagesDir, tmpDir, fetchImpl = globalThis.fetch, unzip = defaultUnzip }) {
  if (!missing.length) return 0;
  const zip = join(tmpDir, `artifact-${id}.zip`);
  const dir = join(tmpDir, `artifact-${id}`);
  mkdirSync(tmpDir, { recursive: true });
  const r = await fetchImpl(`https://api.github.com/repos/${repo}/actions/artifacts/${id}/zip`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`artifact ${id}: HTTP ${r.status}`);
  writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  rmSync(dir, { recursive: true, force: true });
  unzip(zip, dir);
  let n = 0;
  for (const o of missing) {
    const hit = [join(dir, 'outbox', o.src), join(dir, 'images', o.src), join(dir, o.src)].find((p) => existsSync(p) && sha256File(p) === o.sha256);
    if (!hit) continue;
    mkdirSync(dirname(join(imagesDir, o.src)), { recursive: true });
    copyFileSync(hit, join(imagesDir, o.src));
    n += 1;
  }
  rmSync(dir, { recursive: true, force: true });
  rmSync(zip, { force: true });
  return n;
}

function defaultUnzip(zip, dir) {
  execFileSync('unzip', ['-q', '-o', zip, '-d', dir], { stdio: ['ignore', 'pipe', 'pipe'] });
}
