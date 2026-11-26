// =============================================================================
// StudyQuiz — "Check Your Understanding" in the lesson screen, on the record
// =============================================================================
// Darrell 2026-11-26, from the Study tab on his phone: "Where are my records?"
// MEASURED: this quiz kept its answers in screen memory only. Nothing was
// graded, nothing was filed, and a grade already on the account was not shown.
// The lesson page has always filed quiz grades; this screen now files the SAME
// attempt through the SAME function (ChurchLearn recordQuizWithIntegrity), so a
// grade taken here and a grade taken there are one record.
//
// What is shown is only what is true:
//   • a grade already on the record (tools.quizSaved) is shown before any tap;
//   • a new attempt is graded when the last question is answered (the app's own
//     gradeQuiz and pass mark), then handed to tools.onRecordQuiz;
//   • "saved to your record" is said only when the account is signed in
//     (tools.quizSaves); otherwise the screen says plainly it was not saved.
// Without a record to file to (signed out), it grades and says so.
import React, { useRef, useState } from 'react';
import { gradeQuiz } from '../../lib/learn-framework.js';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFA63C]';

const day = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;
};

export default function StudyQuiz({ lesson, tools = null }) {
  const [picked, setPicked] = useState({});
  const [result, setResult] = useState(null);
  const firstAt = useRef(null);
  const quiz = lesson.quiz;
  const questions = (quiz && quiz.questions) || [];
  if (questions.length === 0) return null;
  const saved = tools && tools.quizSaved ? tools.quizSaved : null;
  const saves = !!(tools && tools.quizSaves && typeof tools.onRecordQuiz === 'function');

  const pick = (qi, oi) => {
    if (picked[qi] != null) return;
    if (!firstAt.current) firstAt.current = Date.now();
    const next = { ...picked, [qi]: oi };
    setPicked(next);
    if (Object.keys(next).length < questions.length) return;
    const graded = gradeQuiz(quiz, next);
    setResult(graded);
    const ms = firstAt.current ? Date.now() - firstAt.current : null;
    firstAt.current = null;
    if (tools && typeof tools.onRecordQuiz === 'function') {
      try {
        tools.onRecordQuiz(lesson.id, { passed: graded.passed, pct: graded.pct, at: new Date().toISOString(), ms, questions: questions.length });
      } catch {
        /* the grade on screen stands; the record line below never claims a save that did not run */
      }
    }
  };
  const again = () => {
    setPicked({});
    setResult(null);
    firstAt.current = null;
  };

  return (
    <div data-testid="le-quiz">
      {saved && !result && (
        <p className="le-quiz-record" data-testid="le-quiz-saved">
          On your record: {saved.passed ? 'passed' : 'not passed yet'} ({saved.pct}%){day(saved.at) ? `, ${day(saved.at)}` : ''}.
        </p>
      )}
      {!saved && !result && saves && (
        <p className="le-quiz-record" data-testid="le-quiz-none">
          No grade on your record for this lesson yet. Answer every question and it is saved.
        </p>
      )}
      <ol className="le-quiz">
        {questions.map((q, qi) => (
          <li key={qi} className="le-quiz-q">
            <p className="le-quiz-prompt">{q.q}</p>
            <div className="le-quiz-opts" data-read-skip>
              {q.options.map((opt, oi) => {
                const show = picked[qi] != null;
                const correct = oi === q.answer;
                return (
                  <button
                    key={oi}
                    type="button"
                    className={`le-quiz-opt ${show && correct ? 'correct' : ''} ${show && picked[qi] === oi && !correct ? 'wrong' : ''} ${RING}`}
                    onClick={() => pick(qi, oi)}
                    aria-disabled={show || undefined}
                    aria-pressed={picked[qi] === oi}
                    data-testid={`le-quiz-${qi}-${oi}`}
                  >
                    {opt}
                    {show && correct && <span className="le-quiz-mark"> ✓ correct answer</span>}
                    {show && picked[qi] === oi && !correct && <span className="le-quiz-mark"> (your answer)</span>}
                  </button>
                );
              })}
            </div>
            {picked[qi] != null && <p className="le-quiz-explain">{q.explain}</p>}
          </li>
        ))}
      </ol>
      {result && (
        <div className="le-quiz-result" role="status" data-testid="le-quiz-result">
          <p>
            <b>
              {result.correct} of {result.total} correct ({result.pct}%): {result.passed ? 'passed' : 'not passed yet'}.
            </b>{' '}
            {saves ? 'Saved to your record.' : 'Not saved: sign in to keep quiz grades on your record.'}
          </p>
          <button type="button" className={`le-quiz-again ${RING}`} onClick={again} data-testid="le-quiz-again">
            Take it again
          </button>
        </div>
      )}
    </div>
  );
}
