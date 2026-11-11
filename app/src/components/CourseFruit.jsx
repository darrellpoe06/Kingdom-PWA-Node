// =============================================================================
// CourseFruit — where you stand across the courses, and the two nearest wins
// =============================================================================
// Darrell, 2026-11-10: "Show the percentage of the ones completed vs not
// started in locations that motivate reading... I want to start courses that I
// don't have a record for... Low hanging fruit type of information that
// provokes to good Word time." (DR-1419)
//
// Sits directly under the course picker. One line says the whole list in
// numbers a person can act on, with a bar; then at most two buttons, each one
// tap into a course: the course already begun that is closest to finished, and
// the shortest course with nothing on the record yet. Every figure is
// lib/learn-organize.js courseStanding() over the real records; with no
// courses it draws nothing. An invitation, never a streak and never a scolding.
// =============================================================================
import React, { useMemo } from 'react';
import { libraryStanding, lowHangingFruit } from '../lib/learn-organize.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const PICK = `text-left min-h-[44px] px-3 py-2 border-2 border-[#5A6E3D] bg-white text-[#1A1815] text-[0.8125rem] rounded-lg hover:bg-[#F0ECE4] ${FOCUS}`;
const KICK = 'block text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold';
const nameOf = (c) => `${c.code ? `${c.code} · ` : ''}${(c.meta && c.meta.title) || c.key}`;
const lessons = (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'}`;

export default function CourseFruit({ courses = [], ctx = {}, onOpen = () => {} }) {
  const all = useMemo(() => libraryStanding(courses, ctx), [courses, ctx]);
  const fruit = useMemo(() => lowHangingFruit(courses, ctx), [courses, ctx]);
  if (!all.courses) return null;
  return (
    <div data-testid="course-fruit" className="mt-2 space-y-2">
      <p className="text-[0.8125rem] text-[#1A1815]" data-testid="course-fruit-line">
        <strong>{all.notStarted}</strong> not started · <strong>{all.inProgress}</strong> begun · <strong>{all.completed}</strong> finished, of {all.courses}{' '}
        {all.courses === 1 ? 'course' : 'courses'}. {all.lessonsRead} of {lessons(all.lessons)} read ({all.pct}%).
      </p>
      <div
        className="h-2 rounded-full bg-[#E8E4DC] overflow-hidden"
        role="progressbar"
        aria-label="Lessons read, of every lesson in these courses"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={all.pct}
      >
        <span className="block h-full bg-[#5A6E3D]" style={{ width: `${all.pct}%` }} />
      </div>
      {(fruit.nearest || fruit.quickStart) && (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14em), 1fr))' }}>
          {fruit.nearest && (
            <button type="button" data-testid="course-fruit-nearest" className={PICK} onClick={() => onOpen(fruit.nearest.course.key)}>
              <span className={KICK}>Closest to finished</span>
              {nameOf(fruit.nearest.course)}
              <span className="block text-[0.75rem] text-[#5A5751]">
                {lessons(fruit.nearest.left)} left of {fruit.nearest.total}
              </span>
            </button>
          )}
          {fruit.quickStart && (
            <button type="button" data-testid="course-fruit-quick-start" className={PICK} onClick={() => onOpen(fruit.quickStart.course.key)}>
              <span className={KICK}>Not started, and short</span>
              {nameOf(fruit.quickStart.course)}
              <span className="block text-[0.75rem] text-[#5A5751]">{lessons(fruit.quickStart.total)}, nothing on your record yet</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
