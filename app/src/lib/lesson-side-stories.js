// =============================================================================
// lesson-side-stories — the stories a lesson was missing, kept beside it
// =============================================================================
// Darrell 2026-07-21: "Add at least 2 stories to each 25 minute lesson." And
// 2026-10-21: "None of these have two... make sure all lessons are what they
// should be." The census (lib/lesson-completeness.js) found 264 lessons in 24
// courses short of their two. Their stories are written into
// lesson-stories.json by course and lesson id, so the course files they join
// stay as they are, and they render through the same LessonStories path as
// every other lesson's stories (DR-0855).
//
// A lesson keeps every story it already carries; the side file only adds.
// =============================================================================
import STORIES from './lesson-stories.json';

/** The side stories on file for one lesson ([] when none). */
export function sideStoriesFor(courseKey, lessonId, table = STORIES) {
  const list = (table[courseKey] || {})[lessonId];
  return Array.isArray(list) ? list : [];
}

/** Every mounted course, each short lesson given the stories on file for it. */
export function withSideStories(courses, table = STORIES) {
  return (courses || []).map((c) => {
    const key = c && (c.key || (c.meta && c.meta.key));
    if (!key || !table[key] || !Array.isArray(c.schedule)) return c;
    return {
      ...c,
      schedule: c.schedule.map((m) => {
        const add = sideStoriesFor(key, m && m.id, table);
        if (!add.length) return m;
        const have = Array.isArray(m.stories) ? m.stories : [];
        const titles = new Set(have.map((s) => s && s.title));
        return { ...m, stories: [...have, ...add.filter((s) => !titles.has(s.title))] };
      }),
    };
  });
}
