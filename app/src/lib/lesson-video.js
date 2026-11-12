// =============================================================================
// lesson-video — the walk-through video a lesson or section carries, resolved
// =============================================================================
// Darrell 2026-11-12: the self-paced course, "without any teacher under paid
// PoeTech ... have a video of each section and walk through the sections".
// A lesson module may carry a `video` field:
//   video: { url, title?, seconds? }   — a YouTube link or a same-origin file
//                                        (/media/..., served by the NAS through
//                                        the app's own transport, DR-0083)
// Nothing here paints a player where there is no recording: a lesson without
// a video resolves to kind 'none', and a section's status is MEASURED from the
// lessons it holds. The recording plan is the list of what is still owed, so
// the Governor's queue is real work, never a painted "coming soon".
// =============================================================================
import { youtubeEmbedUrl } from './choir-sync.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

/** Only the app's own origin may serve a file: a relative path, never a scheme or protocol-relative URL. */
export function sameOriginMedia(url) {
  const s = asStr(url).trim();
  return /^\/(?!\/)/.test(s) && /\.(mp4|webm|m4v|mov)(\?.*)?$/i.test(s) ? s : null;
}

/** { kind: 'youtube', embedUrl } | { kind: 'file', src } | { kind: 'none' }, plus title and seconds. Pure. */
export function lessonVideo(lesson) {
  const v = lesson && typeof lesson.video === 'object' ? lesson.video : null;
  const url = asStr(v && v.url);
  const title = asStr(v && v.title) || asStr(lesson && lesson.title);
  const seconds = Number.isFinite(v && v.seconds) ? v.seconds : null;
  if (!url) return { kind: 'none', title, seconds: null };
  const yt = youtubeEmbedUrl(url);
  if (yt) return { kind: 'youtube', embedUrl: yt, title, seconds };
  const file = sameOriginMedia(url);
  if (file) return { kind: 'file', src: file, title, seconds };
  return { kind: 'none', title, seconds: null, rejected: url };
}

/** A section's walk-through: the first recorded video among its lessons, and how many lessons carry one. Pure. */
export function sectionVideo(section) {
  const lessons = asArr(section && section.lessons);
  const recorded = lessons.map((l) => ({ lesson: l, video: lessonVideo(l) })).filter((x) => x.video.kind !== 'none');
  return {
    key: asStr(section && section.key),
    label: asStr(section && section.label),
    lessons: lessons.length,
    recorded: recorded.length,
    video: recorded.length ? recorded[0].video : { kind: 'none', title: asStr(section && section.label), seconds: null },
    status: !lessons.length ? 'empty' : recorded.length === lessons.length ? 'complete' : recorded.length ? 'partial' : 'not-recorded',
  };
}

/** The sections (or lessons, for a short course) whose walk-through is still owed. Pure. */
export function recordingPlan(sections) {
  return asArr(sections)
    .map(sectionVideo)
    .filter((s) => s.status !== 'complete' && s.status !== 'empty')
    .map((s) => ({ key: s.key, label: s.label, owed: s.lessons - s.recorded }));
}

/** Coverage over a whole course's sections: recorded over total lessons, and a percent. Pure. */
export function videoCoverage(sections) {
  const list = asArr(sections).map(sectionVideo);
  const lessons = list.reduce((a, s) => a + s.lessons, 0);
  const recorded = list.reduce((a, s) => a + s.recorded, 0);
  return { lessons, recorded, pct: lessons ? Math.round((recorded / lessons) * 100) : 0, sections: list.length };
}
