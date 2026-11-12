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
import { saveLearnerRecord, subscribeLearnerRecords, requestLearnerRecordsRefresh } from './learner-records-sync.js';
import { mergeRecordsIntoState, deviceFactsMissingFromRecord } from './learner-records.js';
import { listPlaces } from './learn-resume.js';
import { accountName } from './learner-identity.js';

export function useLearnerRecords({ authSession = null, demo = false, ageBand = 'adult', setData = null, data = null } = {}) {
  // Every learner record this account may read — his own, or every learner's
  // when he is the Governor. The READ WALL decides the scope, never this code.
  const [learnerRecords, setLearnerRecords] = useState([]);
  // The newest sign-in facts, so the callbacks never close over a stale session.
  const who = useRef({ authSession, demo, ageBand });
  who.current = { authSession, demo, ageBand };

  const signedIn = !!authSession;
  // The device's own state, read by the catch-up below (DR-1449).
  const dataRef = useRef(data);
  dataRef.current = data;
  // When each lesson was last sent by the catch-up, so a failed save is tried
  // again later, never in a burst (DR-1449).
  const lastCatchUp = useRef(new Map());

  // A record that cannot be filed never breaks the read (best-effort by design).
  const keep = useCallback((lessonId, courseKey, extra) => {
    const { authSession: s, demo: d, ageBand: band } = who.current;
    if (!s || d || !lessonId) return;
    Promise.resolve(saveLearnerRecord({
      lessonId,
      // A course is named only when it is known, so a catch-up never blanks the row's own (DR-1449).
      ...(courseKey ? { courseKey } : {}),
      // The reader's own name when the account carries one, so the record is in their name (DR-1421).
      learnerLabel: accountName(s?.user) || s?.user?.email || null,
      ageBand: band || 'adult',
      ...extra,
    }))
      // This device's own save is on the record: read it back so the figures are the latest (DR-1418).
      .then((res) => { if (res && res.saved) requestLearnerRecordsRefresh(); })
      .catch(() => { /* offline, or a wall said no — the read stands */ });
  }, []);

  // A tap toggles. A READING FILES (DR-1255): called with `{ versionsRead }`
  // it marks the lesson read if it is not, never unmarks it, and sends the
  // versions read to the end — the wall keeps the union across his devices
  // (0312), so a version read on the phone is still read on the tablet.
  const toggleClassModule = useCallback((moduleId, courseKey, opts = null) => {
    if (typeof setData !== 'function') return;
    const versionsRead = opts && Array.isArray(opts.versionsRead) ? opts.versionsRead.filter(Boolean) : null;
    setData((d) => {
      const p = { ...(d.classProgress || {}) };
      if (versionsRead) {
        if (!p[moduleId]) p[moduleId] = new Date().toISOString();
        // A reading files with its evidence (0316): this road is only ever a finished reading.
        keep(moduleId, courseKey, { completedAt: p[moduleId], versionsRead, readEvidenceAt: new Date().toISOString() });
        return { ...d, classProgress: p };
      }
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
      // EVERY ATTEMPT, AND THE BEST STANDS (DR-1264). The device keeps the
      // same ledger the wall keeps (0313): this attempt joins `history`, and
      // `pct`/`passed` on the device are the BEST so far, so a lower retake
      // never lowers what the learner sees. The attempt's own score is in
      // `last` and in the ledger.
      const at = (result && result.at) || new Date().toISOString();
      // HOW IT WAS TAKEN rides the device's ledger and, since 0316, the wall's too (DR-1386, DR-1396).
      const thisTry = { at, pct: result?.pct ?? null, passed: result?.passed ?? null, ...(result && result.integrity ? { integrity: result.integrity } : {}) };
      const history = [...(Array.isArray(prior?.history) ? prior.history : []), thisTry];
      const bestPct = Math.max(Number.isFinite(prior?.pct) ? prior.pct : -1, Number.isFinite(thisTry.pct) ? thisTry.pct : -1);
      const next = {
        ...(result || {}),
        at,
        pct: bestPct < 0 ? (result?.pct ?? null) : bestPct,
        passed: !!(prior?.passed || thisTry.passed),
        last: thisTry,
        history,
        attempts,
      };
      // The row is written with THIS attempt's own score and moment; the wall
      // appends it to the ledger and keeps the best itself (0313).
      keep(moduleId, courseKey, {
        quiz: {
          pct: thisTry.pct,
          passed: thisTry.passed,
          at,
          attempts,
          // How this attempt was taken reaches the record (0316, DR-1396).
          ...(thisTry.integrity ? { taken: thisTry.integrity } : {}),
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
      // CATCH-UP (DR-1449): what this device holds and the record lacks is
      // filed again, until the record holds it -- a save lost to a stalled
      // road is not lost for good. Bounded: 25 a read, each lesson at most
      // once a minute.
      const d0 = dataRef.current;
      if (d0) {
        const placesCourse = new Map(listPlaces().map((p) => [p.lessonId, p.courseKey]));
        const missing = deviceFactsMissingFromRecord({
          records: records || [],
          userId: who.current.authSession?.user?.id || null,
          progress: d0.classProgress || {},
          quizState: d0.classQuiz || {},
          courseOf: (id) => placesCourse.get(id) || null,
        });
        const t = Date.now();
        for (const m of missing) {
          if (t - (lastCatchUp.current.get(m.lessonId) || 0) < 60000) continue;
          lastCatchUp.current.set(m.lessonId, t);
          const extra = {};
          if (m.completedAt) extra.completedAt = m.completedAt;
          if (m.quiz) extra.quiz = m.quiz;
          keep(m.lessonId, m.courseKey || undefined, extra);
        }
      }
      if (typeof setData !== 'function') return;
      setData((d) => {
        const merged = mergeRecordsIntoState(records || [], {
          progress: d.classProgress || {},
          quizState: d.classQuiz || {},
        });
        // The record is now re-read often (DR-1418); a read that changes nothing must not rewrite the device's state.
        const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
        if (same(merged.progress, d.classProgress) && same(merged.quizState, d.classQuiz)) return d;
        return { ...d, classProgress: merged.progress, classQuiz: merged.quizState };
      });
    });
    return stop;
  }, [signedIn, demo, setData, keep]);

  return { learnerRecords, toggleClassModule, recordClassQuiz };
}

export default useLearnerRecords;
