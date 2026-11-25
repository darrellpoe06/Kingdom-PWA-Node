// =============================================================================
// publish-covers — finished covers that pass their checks reach the app by the
// lane, never by hand (owner 2026-11-25: "Automatically enable the new
// four-mode experience for additional lessons as their custom artwork is
// completed and approved").
// =============================================================================
// A cover is PASSING when its exported record has its own composed image
// (srcSet from compose) and no needsReview. Only NEW passing covers are taken:
//   - a lesson whose committed record already has an image is never touched,
//     and no file already under public/learn-thumbs/ is ever replaced (the
//     150 launched covers stay exactly as they are);
//   - a committed record with NO image (titled, waiting for its picture) is
//     completed in place; every other committed record is left byte-identical;
//   - a lesson whose title changed since its copy was written is skipped.
// The result is a tree that mirrors the repository (app/public/learn-thumbs/...
// and app/src/lib/learn-presentation/presentation-records.json); the workflow
// commits it to claude/learn-covers-<runId> and the auto-merge lane lands it.
// =============================================================================
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const COVER_FILES = Object.freeze(['w640.webp', 'w1280.webp']);
const RECORDS_REL = 'app/src/lib/learn-presentation/presentation-records.json';
const relThumbs = (s) => (typeof s === 'string' ? s.replace(/(^|, )\/?learn-thumbs\//g, '$1learn-thumbs/') : s);

/**
 * Choose the new passing covers.
 * @param {object} o
 * @param {object[]} o.exported      exportRecords(ledger).records
 * @param {object[]} o.committed     the committed presentation records
 * @param {string}   o.publicThumbs  app/public/learn-thumbs
 * @param {string}   o.composedDir   compose output (<courseKey>/<lessonId>/w640.webp ...)
 * @param {Map<string,string>} [o.currentTitles] lessonId -> the lesson's title today
 */
export function selectNewCovers({ exported, committed, publicThumbs, composedDir, currentTitles = null }) {
  const byId = new Map(committed.map((r) => [r.lessonId, r]));
  const add = [];
  const skipped = { review: 0, notComposed: 0, alreadyLive: 0, fileExists: 0, stale: 0 };
  for (const r of exported) {
    const im = r.image;
    if (!im || !im.srcSet || !im.srcSet.webp || r.needsReview) {
      skipped.review += 1;
      continue;
    }
    const prior = byId.get(r.lessonId);
    if (prior && prior.image) {
      skipped.alreadyLive += 1;
      continue;
    }
    if (currentTitles && currentTitles.get(r.lessonId) !== r.originalTitleAtApproval) {
      skipped.stale += 1;
      continue;
    }
    const files = COVER_FILES.map((f) => ({
      from: join(composedDir, r.courseKey, r.lessonId, f),
      to: join(publicThumbs, r.courseKey, r.lessonId, f),
      name: f,
    }));
    if (!files.every((f) => existsSync(f.from))) {
      skipped.notComposed += 1;
      continue;
    }
    if (files.some((f) => existsSync(f.to))) {
      skipped.fileExists += 1;
      continue;
    }
    const prefix = `learn-thumbs/${r.courseKey}/${r.lessonId}/`;
    const src = relThumbs(im.src);
    const webp = relThumbs(im.srcSet.webp);
    if (!String(src).startsWith(prefix) || !String(webp).includes(prefix)) {
      skipped.notComposed += 1;
      continue;
    }
    add.push({
      files,
      replaces: !!prior,
      record: {
        lessonId: r.lessonId,
        courseKey: r.courseKey,
        originalTitleAtApproval: r.originalTitleAtApproval,
        displayTitle: r.displayTitle,
        thumbHeadline: r.thumbHeadline,
        promoDescription: r.promoDescription,
        visual: r.visual,
        image: { src, srcSet: { webp }, lqip: im.lqip },
        status: 'review',
        featured: false,
      },
    });
  }
  return { add, skipped };
}

/** Merge the chosen records into the committed document; untouched records keep their place and bytes. */
export function mergeRecords(doc, add) {
  const records = [...doc.records];
  for (const a of add) {
    const i = records.findIndex((r) => r.lessonId === a.record.lessonId);
    if (i >= 0 && !records[i].image) records[i] = a.record;
    else if (i < 0) records.push(a.record);
  }
  return { ...doc, records };
}

/**
 * Write the publish tree under outRoot (mirrors the repository). Returns the
 * selection; writes nothing when there is nothing new.
 */
export function writePublishTree({ exported, repoRoot, composedDir, outRoot, currentTitles }) {
  const doc = JSON.parse(readFileSync(join(repoRoot, RECORDS_REL), 'utf8'));
  const sel = selectNewCovers({ exported, committed: doc.records, publicThumbs: join(repoRoot, 'app/public/learn-thumbs'), composedDir, currentTitles });
  if (!sel.add.length) return sel;
  for (const a of sel.add) {
    for (const f of a.files) {
      const dest = join(outRoot, 'app/public/learn-thumbs', a.record.courseKey, a.record.lessonId, f.name);
      mkdirSync(join(dest, '..'), { recursive: true });
      copyFileSync(f.from, dest);
    }
  }
  const out = join(outRoot, RECORDS_REL);
  mkdirSync(join(out, '..'), { recursive: true });
  writeFileSync(out, `${JSON.stringify(mergeRecords(doc, sel.add), null, 1)}\n`);
  return sel;
}
