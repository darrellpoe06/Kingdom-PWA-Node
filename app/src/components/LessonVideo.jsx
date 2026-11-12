// =============================================================================
// LessonVideo — the lesson's walk-through, when one is recorded (lib/lesson-video)
// =============================================================================
// Renders a YouTube embed or the app's own <video> for a lesson that carries a
// recording; renders NOTHING when there is none (no painted player, DR-0076).
// The Governor alone sees the owed line, so the recording queue is visible
// where the lesson is, not only in a report.
// =============================================================================
import React from 'react';
import { lessonVideo } from '../lib/lesson-video.js';

export default function LessonVideo({ lesson, isGovernor = false }) {
  const v = lessonVideo(lesson);
  if (v.kind === 'none') {
    if (!isGovernor) return null;
    return (
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" data-testid="lesson-video" data-state="not-recorded">
        Walk-through video not recorded yet for this lesson (Governor).
      </p>
    );
  }
  const label = v.title ? `Walk-through: ${v.title}` : 'Walk-through video';
  return (
    <figure className="mb-3 border border-[#E8E4DC] bg-[#FAF8F4]" data-testid="lesson-video" data-state={v.kind}>
      <div className="aspect-video w-full bg-black">
        {v.kind === 'youtube' ? (
          <iframe
            className="w-full h-full"
            src={v.embedUrl}
            title={label}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video className="w-full h-full" src={v.src} controls preload="metadata" aria-label={label} />
        )}
      </div>
      <figcaption className="text-[0.6875rem] text-[#5A5751] px-2 py-1">
        {label}
        {v.seconds ? ` · ${Math.round(v.seconds / 60)} min` : ''}
      </figcaption>
    </figure>
  );
}
