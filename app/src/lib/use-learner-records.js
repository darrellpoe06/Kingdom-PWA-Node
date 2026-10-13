// =============================================================================
// useLearnerRecords — the class record's own wiring, outside the shell
// (DR-0754 / DR-0078)
// =============================================================================
// Darrell 2026-10-05 asked for his son's completion rates and exam competency.
// The two facts that answer him are already written as a lesson is marked read
// and as an exam is answered. This hook owns ALL of that wiring — the device
// maps, the cloud record, the hydrate-on-sign-in and the live subscription — so
// the frozen shell (app/src/poe-financial-mvp-v28.jsx, DR-0078) gains one call
// instead of a feature. The shell is bug-fixes only; a new capability ships as
// its own module (monolith-budget-guard).
//
// It returns the two callbacks the Learn screen already expected, with a course
// key added, plus the records the Class record panel reads:
//
//   const { learnerRecords, toggleClassModule, recordClassQuiz } =
//     useLearnerRecords({ authSession, demo, ageBand, setData });
//
// Device-first, cloud-second: the device maps are still the fast path and still
// what the learner sees instantly; the row is what crosses to his other devices
// and reaches the Governor. Demo mode writes nothing, ever.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveLearnerRecord, subscribeLearnerRecords } from './learner-records-sync.js';
import { mergeRecordsIntoState } from './learner-records.js';

export function useLearnerRecords({ authSession = null, demo = false, ageBand = 'adult', setData = null } = {}) {
  // Every learner record this account may read — his own, or every learner's
  // when he is the Governor. The READ WALL decides the scope, never this code.
  const [learnerRecords, setLearnerRecords] = useState([]);
  // The newest sign-in facts, so the callbacks never close over a stale session.
  const who = useRef({ authSession, demo, ageBand });
  who.current = { authSession, demo, ageBand };

  const signedIn = !!authSession;

  // A record that cannot be filed never breaks the read (best-effort by design).
  const keep = useCallback((lessonId, courseKey, extra) => {
    const { authSession: s, demo: d, ageBand: band } = who.current;
    if (!s || d || !lessonId) return;
    Promise.resolve(saveLearnerRecord({
      lessonId,
      courseKey: courseKey || null,
      learnerLabel: s?.user?.email || null,
      ageBand: band || 'adult',
      ...extra,
    })).catch(() => { /* offline, or a wall said no — the read stands */ });
  }, []);

  const toggleClassModule = useCallback((moduleId, courseKey) => {
    if (typeof setData !== 'function') return;
    setData((d) => {
      const p = { ...(d.classProgress || {}) };
      if (p[moduleId]) delete p[moduleId]; else p[moduleId] = new Date().toISOString();
      keep(moduleId, courseKey, { completedAt: p[moduleId] || null });
      return { ...d, classProgress: p };
    });
  }, [setData, keep]);

  const recordClassQuiz = useCallback((moduleId, result, courseKey) => {
    if (typeof setData !== 'function') return;
    setData((d) => {
      const prior = (d.classQuiz || {})[moduleId];
      // Attempts are counted from the real record, not guessed: each answered
      // exam adds one to whatever this device already knew.
      const attempts = Number(prior?.attempts || 0) + 1;
      const next = { ...(result || {}), attempts };
      keep(moduleId, courseKey, {
        quiz: {
          pct: next.pct ?? null,
          passed: next.passed ?? null,
          at: next.at || new Date().toISOString(),
          attempts,
        },
      });
      return { ...d, classQuiz: { ...(d.classQuiz || {}), [moduleId]: next } };
    });
  }, [setData, keep]);

  // His record comes back on whatever device he signs in on, and the
  // Governor's copy arrives the same way. The device copy WINS on a module it
  // already knows — it is what he is looking at right now.
  useEffect(() => {
    if (!signedIn || demo) { setLearnerRecords([]); return undefined; }
    const stop = subscribeLearnerRecords((records) => {
      setLearnerRecords(records || []);
      if (typeof setData !== 'function') return;
      setData((d) => {
        const merged = mergeRecordsIntoState(records || [], {
          progress: d.classProgress || {},
          quizState: d.classQuiz || {},
        });
        return { ...d, classProgress: merged.progress, classQuiz: merged.quizState };
      });
    });
    return stop;
  }, [signedIn, demo, setData]);

  return { learnerRecords, toggleClassModule, recordClassQuiz };
}

export default useLearnerRecords;
