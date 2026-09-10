// =============================================================================
// tlc-course-bodies — the full lessons for every library course (DR-0345
// build-out, 2026-09-10)
// =============================================================================
// Darrell: "I don't want starter lessons one paragraph... I want that paragraph
// to begin your research: 1 level comprehensive review of the known
// understanding and lessons to discuss with stakeholders... full lessons."
// The starter paragraph becomes the plain/teen level; the body becomes the
// standard level, and the engine paces it across sessions (DR-0215). Keyed by
// module id; per-field files.
import assessment from './tlc-course-bodies/assessment.js';
import planning from './tlc-course-bodies/planning.js';
import individual from './tlc-course-bodies/individual.js';
import couplesGroup from './tlc-course-bodies/couples-group.js';
import crisisEthics from './tlc-course-bodies/crisis-ethics.js';
import docCultureSuperv from './tlc-course-bodies/documentation-culture-supervision.js';

export const COURSE_BODIES = Object.freeze({ ...assessment, ...planning, ...individual, ...couplesGroup, ...crisisEthics, ...docCultureSuperv });

export function courseBody(moduleId) { return COURSE_BODIES[moduleId] || null; }

export function wordCount(text) { return String(text || '').trim().split(/\s+/).filter(Boolean).length; }

// The six parts every full lesson carries, in order.
export const LESSON_PARTS = ['What it is.', 'How it runs in session.', 'A worked example.', 'Pitfalls.', 'What is required.', 'Self-check.'];
export function hasEveryPart(text) { return LESSON_PARTS.every((p) => String(text || '').includes(p)); }
