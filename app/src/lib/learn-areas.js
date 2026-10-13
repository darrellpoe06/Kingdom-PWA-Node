// =============================================================================
// learn-areas — what each area of Training is for, and when it is complete
// =============================================================================
// Darrell 2026-09-10, on the therapist track's strip (Training map · Pathways
// · Certificates · Assigned · Hours · CE renewal · Catalog & required):
// "explain each one possible on this tab... then just show it as complete
// when they do."
//
// Two things per area, both data:
//   GUIDE — what the area is, what to do there, and what makes it complete
//           (plain words, shown under the strip for the open area);
//   DONE  — derived from the learner's OWN records (lessons read and quizzes
//           passed, courses completed, certificates earned, lessons reviewed,
//           hours logged, CE logged, required trainings current). Never
//           painted (P15): an area with nothing to complete says so and is
//           never marked done.
//
// Pure: no React, no storage. PracticeLearn hands the real state in.
// =============================================================================
import { trackCompletion, requirementProgress, requiredTrainingSummary, IL_LCSW_REQUIREMENT } from './practice-academy.js';
import { ceProgress, getRuleset } from './ceu-tracker.js';

export const LEARN_AREA_GUIDE = Object.freeze({
  lessons: { what: 'The lessons of this track, one week at a time.', doHere: 'Read each lesson and pass its quiz.', doneWhen: 'every lesson of every track is read and every quiz passed.' },
  foryou: { what: 'Lessons your therapist scheduled for you before the next session.', doHere: 'Open each one, then tap “Mark reviewed”.', doneWhen: 'every lesson scheduled for you is marked reviewed.' },
  gain: { what: 'What this track builds in you: understanding, skills, coping.', doHere: 'Read it once so you know what you are working toward.', doneWhen: null },
  courses: { what: 'The full training library across the clinical fields, each course with its pre-test, lessons and post-test.', doHere: 'Work a course to its post-test and complete it; its hours log themselves and its certificate is issued.', doneWhen: 'every course in the library is completed.' },
  map: { what: 'The library laid across the state’s own supervised-experience window, month by month.', doHere: 'Follow the month you are in; complete its courses under Course library.', doneWhen: 'every course on the map is completed.' },
  pathways: { what: 'Who this training serves and the hours each pathway carries.', doHere: 'Find your pathway and its hours; nothing to complete here.', doneWhen: null },
  certificates: { what: 'The certificates you have earned, with their credit and expiry.', doHere: 'Finish a track under Lessons or a course under Course library and its certificate is issued here.', doneWhen: 'every certificate this track offers is earned.' },
  assigned: { what: 'The lessons you scheduled for clients, and whether each was reviewed.', doHere: 'Open any lesson and tap “Assign to a client”; watch for their “Mark reviewed”.', doneWhen: 'every lesson you assigned has been reviewed.' },
  hours: { what: 'Your supervised clinical hours toward the state pathway, by activity and competency.', doHere: 'Log hours the day they are earned, with the supervisor.', doneWhen: 'the pathway’s required hours are logged.' },
  ce: { what: 'Your continuing-education hours for the current renewal cycle, against the state’s minimum and mandated topics.', doHere: 'Log each CE the day it is completed, with the sponsor and the topic it satisfies.', doneWhen: 'the cycle’s hours and every mandated topic are met.' },
  catalog: { what: 'The office’s certificate catalog and the trainings every clinician must keep current.', doHere: 'Keep each required training current; the office edits the catalog here.', doneWhen: 'every required training is current.' },
});

export function learnAreaGuide(id) {
  return LEARN_AREA_GUIDE[id] || null;
}

/** One line for the strip: what it is · what to do · when complete. */
export function learnAreaExplain(id) {
  const g = learnAreaGuide(id);
  if (!g) return '';
  return `${g.what} ${g.doHere}${g.doneWhen ? ` Complete when ${g.doneWhen}` : ''}`;
}

const reviewed = (rows) => (rows || []).filter((r) => r && r.status === 'reviewed').length;

/**
 * Is this area complete, from the learner's own records?
 * @returns {{ done: boolean|null, detail: string }} done=null: nothing to complete here.
 */
export function learnAreaDone(id, s = {}) {
  switch (id) {
    case 'lessons': {
      const tracks = s.tracks || [];
      const complete = tracks.filter((t) => trackCompletion(t, s.progress || {}, s.quizState || {}).complete).length;
      return { done: tracks.length > 0 && complete === tracks.length, detail: `${complete} of ${tracks.length} tracks complete` };
    }
    case 'foryou': {
      const rows = (s.assigned && s.assigned.forMe) || [];
      return { done: rows.length > 0 && reviewed(rows) === rows.length, detail: rows.length ? `${reviewed(rows)} of ${rows.length} reviewed` : 'nothing scheduled for you yet' };
    }
    case 'courses':
    case 'map': {
      const courses = s.libCourses || [];
      const logged = (s.libLogged || []).filter((idc) => courses.some((c) => c.id === idc)).length;
      return { done: courses.length > 0 && logged === courses.length, detail: `${logged} of ${courses.length} courses completed` };
    }
    case 'certificates': {
      const offered = s.audCatalog || [];
      const earned = offered.filter((tpl) => (s.certs || []).some((c) => c.certId === tpl.id)).length;
      return { done: offered.length > 0 && earned === offered.length, detail: offered.length ? `${earned} of ${offered.length} earned` : `${(s.certs || []).length} earned` };
    }
    case 'assigned': {
      const rows = (s.assigned && s.assigned.mine) || [];
      return { done: rows.length > 0 && reviewed(rows) === rows.length, detail: rows.length ? `${reviewed(rows)} of ${rows.length} reviewed` : 'nothing assigned yet' };
    }
    case 'hours': {
      const p = requirementProgress(s.myHours || [], IL_LCSW_REQUIREMENT);
      return { done: p.target > 0 && p.logged >= p.target, detail: `${p.logged} of ${p.target} hours` };
    }
    case 'ce': {
      const cfg = s.ceuCfg || {};
      const p = ceProgress(s.myCeus || [], getRuleset(cfg.state), { credential: cfg.credential || 'LCSW', renewalNumber: cfg.renewalNumber == null ? 2 : cfg.renewalNumber, now: s.now || null });
      return { done: !!p.complete, detail: p.exempt ? 'first renewal · exempt' : `${p.totalLogged} of ${p.totalRequired} CE hours` };
    }
    case 'catalog': {
      const t = requiredTrainingSummary(s.audReqs || [], s.reqCompletions || {}, s.now || null);
      return { done: t.total > 0 && t.current === t.total, detail: `${t.current} of ${t.total} required trainings current` };
    }
    default:
      return { done: null, detail: 'nothing to complete here' };
  }
}
