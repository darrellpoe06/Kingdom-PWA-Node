// =============================================================================
// CohortPrograms — the PoeTech Academy cohort-operations surface
// =============================================================================
// Darrell 2026-07-12 (spoken build input): a repeatable business for running
// students through a multi-track "learn and improve" development operation —
// ~500 students/month, $1,000 tuition, ~10 leaders + volunteers, five weekday
// industries, the same lesson three weeks deep, a week-4 retrospective, then
// rotate monthly. Configurable for DIFFERENT INDUSTRIES, for ANY age group.
//
// The three-level access ladder (Darrell 2026-07-12):
//   • Yahweh knowledge — ALWAYS FREE.
//   • Cutting-edge digital curriculum — the entry tier ($39.99+/mo).
//   • The hands-on cohort — $1,000: see the local LLMs, build real things, gain
//     understanding — not theory like traditional education.
//
// REAL DATA, NOTHING PAINTED (DR-0061 / DR-0076): every enrolled count, dollar
// collected, and balance owed is DERIVED from real enrollment + payment records
// in the store (lib/use-cohort-programs.js) via the pure model
// (lib/cohort-programs.js). The only capacity-scale figure shown is explicitly
// labeled "potential at full capacity" — a projection, never reported as money
// in hand. The salary figures in the value section are real, sourced BLS medians.
//
// UNBREAKABLE basics: mounted in a <SectionBoundary> by the shell; sliding
// SectionTabs; rem-based chrome so the global text-size control scales it;
// keyboard-operable real <button>/<select>/<input>; clear empty states.
import React, { useMemo, useState } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import SectionTabs from './SectionTabs.jsx';
import {
  useCohortPrograms, addEnrollment, recordPayment, setEnrollmentStatus,
  addTeamMember, removeTeamMember, addRetroNote, addProgram,
} from '../lib/use-cohort-programs.js';
import {
  INDUSTRY_TRACKS, AGE_BANDS, TEAM_ROLES, WEEKDAYS, RETRO_CATEGORIES,
  ACADEMY_TIERS, HOMESCHOOL_POSITIONING, EARNINGS_SOURCE, EARNINGS_VERIFY_NOTE,
  ALL_OCCUPATIONS_MEDIAN_CENTS, DEFAULT_TRACK_IDS,
  trackCatalog, ageBand, teamRole, planById, isSeedId,
  programStats, teamStats, programSchedule, cycleProgress, breakEvenStudents,
  enrollmentPaymentState, trackROI, trackAccessTier, installmentSchedule,
} from '../lib/cohort-programs.js';

// ---------------------------------------------------------------------------
// formatters (house style)
// ---------------------------------------------------------------------------
const usd = (cents) => `$${(Math.round(Number(cents) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const usd2 = (cents) => `$${(Math.round(Number(cents) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n) => (Number(n) || 0).toLocaleString();
const pct = (n) => `${Math.round(Number(n) || 0)}%`;

const STATUS_BADGE = {
  enrolled: { label: 'Enrolled', cls: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' },
  waitlist: { label: 'Waitlist', cls: 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]' },
  invited: { label: 'Invited', cls: 'bg-[#FAF8F4] text-[#5A5751] border-[#C9C2B4]' },
  withdrawn: { label: 'Withdrawn', cls: 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]' },
};
const CAT_BADGE = {
  keep: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]',
  improve: 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]',
  try: 'bg-[#FAF8F4] text-[#5A5751] border-[#C9C2B4]',
};

function Badge({ children, cls }) {
  return <span className={`inline-block px-1.5 py-0.5 border text-[0.625rem] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

// ---------------------------------------------------------------------------
// The surface
// ---------------------------------------------------------------------------
export default function CohortPrograms({ isGovernor = false } = {}) {
  const store = useCohortPrograms();
  const programs = useMemo(() => store.programs || [], [store.programs]);
  const [programId, setProgramId] = useState(programs[0] ? programs[0].id : null);

  const program = useMemo(
    () => programs.find((p) => p.id === programId) || programs[0] || null,
    [programs, programId],
  );

  const stats = useMemo(() => (program ? programStats(program, store.enrollments) : null), [program, store.enrollments]);
  const tStats = useMemo(() => (program ? teamStats(program, store.team, stats ? stats.enrolledCount : 0) : null), [program, store.team, stats]);
  const schedule = useMemo(() => (program ? programSchedule(program) : []), [program]);
  const roster = useMemo(
    () => store.enrollments.filter((e) => program && e.programId === program.id),
    [store.enrollments, program],
  );
  const teamRoster = useMemo(
    () => store.team.filter((m) => program && m.programId === program.id),
    [store.team, program],
  );
  const retros = useMemo(
    () => store.retros.filter((r) => program && r.programId === program.id),
    [store.retros, program],
  );

  if (!program || !stats) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="PoeTech Academy">Cohort Programs</SectionTitle>
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-sm text-[#5A5751]">
          No program is set up yet.
        </div>
      </div>
    );
  }

  const cycle = cycleProgress(program, new Date().toISOString());
  const breakEven = breakEvenStudents(program);

  const sections = [
    { id: 'overview', label: 'Overview', icon: 'home', render: () => (
      <OverviewSection program={program} stats={stats} cycle={cycle} breakEven={breakEven} isGovernor={isGovernor} />
    ) },
    { id: 'value', label: 'Why it’s worth it', icon: 'sparkle', render: () => (
      <ValueSection program={program} />
    ) },
    { id: 'rhythm', label: 'Weekly rhythm', icon: 'calendar', render: () => (
      <RhythmSection program={program} schedule={schedule} cycle={cycle} />
    ) },
    { id: 'enroll', label: `Enrollment (${stats.enrolledCount})`, icon: 'users', render: () => (
      <EnrollmentSection program={program} stats={stats} roster={roster} isGovernor={isGovernor} />
    ) },
    { id: 'team', label: `Team (${tStats.total})`, icon: 'heart', render: () => (
      <TeamSection program={program} tStats={tStats} teamRoster={teamRoster} isGovernor={isGovernor} />
    ) },
    { id: 'improve', label: 'Improve (week 4)', icon: 'pencil', render: () => (
      <ImproveSection program={program} retros={retros} isGovernor={isGovernor} />
    ) },
  ];

  return (
    <div className="max-w-5xl">
      <SectionTitle eyebrow="PoeTech Academy · cohort operations">Cohort Programs</SectionTitle>

      {/* program selector + the three-tier access ladder */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-[0.625rem] uppercase tracking-wide text-[#5A5751]">Program</label>
        <select
          value={program.id}
          onChange={(e) => setProgramId(e.target.value)}
          className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm"
        >
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {isSeedId(program.id) && <Badge cls="bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]">Sample</Badge>}
      </div>

      <TierLadder />

      <div className="mt-4">
        <SectionTabs sections={sections} ariaLabel="Cohort program sections" idBase="cohort" defaultId="overview" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The three-tier access ladder — shown above every section
// ---------------------------------------------------------------------------
function TierLadder() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
      {ACADEMY_TIERS.map((t) => (
        <div key={t.id} className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <div className="flex items-center gap-1.5 text-[#1A1815]">
            <UiIcon name={t.icon} />
            <span className="text-sm font-semibold">{t.priceLabel}</span>
          </div>
          <div className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#5A5751]">{t.label}</div>
          <div className="mt-1 text-xs text-[#5A5751] leading-relaxed">{t.summary}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function OverviewSection({ program, stats, cycle, breakEven, isGovernor }) {
  return (
    <div>
      <div className="mb-2 text-sm text-[#1A1815] font-semibold">{program.name}</div>
      <div className="mb-3 text-xs text-[#5A5751] leading-relaxed">{program.tagline}</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4">
        <MetricCell label="Enrolled (real)" value={num(stats.enrolledCount)} sub={`of ${num(stats.capacity)} seats`} />
        <MetricCell label="Seats left" value={num(stats.seatsLeft)} sub={pct(stats.fillPct) + ' full'} />
        <MetricCell label="Collected" value={usd(stats.collectedCents)} sub="real payments in" accent />
        <MetricCell label="Outstanding" value={usd(stats.outstandingCents)} sub="committed, not yet paid" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4">
        <MetricCell label="Committed revenue" value={usd(stats.committedCents)} sub="enrolled × their plan" />
        <MetricCell label="Potential at capacity" value={usd(stats.potentialCents)} sub={`${num(stats.capacity)} × ${usd(program.tuitionCents)} — projection`} />
        <MetricCell label="Tuition" value={usd(program.tuitionCents)} sub="hands-on cohort" />
        <MetricCell label="Waitlist / invited" value={`${num(stats.waitlistCount)} / ${num(stats.invitedCount)}`} sub="not holding a seat" />
      </div>

      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="flex items-center gap-1.5 text-[#1A1815] mb-1">
          <UiIcon name="calendar" />
          <span className="text-sm font-semibold">This month’s cycle</span>
        </div>
        <div className="text-xs text-[#5A5751] leading-relaxed">
          {cycle.message} Three weeks of class (deeper each week), then week {program.retroWeek} is the retrospective — review, improve, and rotate to next month.
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: program.weeksPerCycle }, (_, i) => i + 1).map((w) => (
            <Badge key={w} cls={cycle.week === w ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>Week {w}</Badge>
          ))}
          <Badge cls={cycle.phase === 'retro' ? 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>Week {program.retroWeek} · retro</Badge>
        </div>
      </div>

      {breakEven != null && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3 text-xs text-[#5A5751]">
          <span className="font-semibold text-[#1A1815]">Break-even:</span> at {usd(program.monthlyCostCents)}/mo run cost and {usd(program.tuitionCents)} tuition, <span className="font-semibold text-[#1A1815]">{num(breakEven)} paid students</span> cover the month. Every student past that funds the mission. The model runs whether {num(stats.enrolledCount)} show up or {num(stats.capacity)}.
        </div>
      )}

      {isGovernor && <NewProgramForm />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value & ROI — the parent-facing "why $1,000 is worth it" section
// ---------------------------------------------------------------------------
function ValueSection({ program }) {
  const tracks = useMemo(() => programSchedule(program), [program]);
  return (
    <div>
      <p className="mb-3 text-sm text-[#1A1815] leading-relaxed">
        Parents invest when they can see the future in it. Here is exactly what each day is worth — the real skills, and what those fields pay today.
      </p>

      {/* the ladder, restated for the parent's decision */}
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">Three ways in</div>
        <ul className="text-xs text-[#5A5751] leading-relaxed space-y-1">
          {ACADEMY_TIERS.map((t) => (
            <li key={t.id}><span className="font-semibold text-[#1A1815]">{t.priceLabel} — {t.label}:</span> {t.summary}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-4">
        {tracks.map((t) => <TrackValueCard key={t.day} track={t} tuitionCents={program.tuitionCents} />)}
      </div>

      {/* homeschool positioning + evidence */}
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-2">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">How this compares to homeschool</div>
        <div className="text-xs text-[#5A5751] leading-relaxed mb-2">{HOMESCHOOL_POSITIONING.marketNote}</div>
        <div className="space-y-1">
          {HOMESCHOOL_POSITIONING.ladderFit.map((f) => (
            <div key={f.tier} className="text-xs text-[#5A5751] leading-relaxed">
              <span className="font-semibold text-[#1A1815]">vs {f.vs}:</span> {f.edge}
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#E8E4DC] bg-white p-3 mb-2">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">Hands-on beats theory — and it’s measured</div>
        <div className="text-xs text-[#5A5751] leading-relaxed">{HOMESCHOOL_POSITIONING.evidenceNote}</div>
        <div className="mt-1 text-[0.625rem] text-[#8A857C]">Source: {HOMESCHOOL_POSITIONING.evidenceSource}</div>
      </div>

      <div className="text-[0.625rem] text-[#8A857C] leading-relaxed">
        {EARNINGS_VERIFY_NOTE} Salary figures: {EARNINGS_SOURCE}.
      </div>
    </div>
  );
}

function TrackValueCard({ track, tuitionCents }) {
  const cat = trackCatalog(track.industryId);
  const roi = trackROI(cat, tuitionCents);
  const access = trackAccessTier(track.industryId);
  return (
    <div className="border border-[#E8E4DC] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#1A1815]">
          <UiIcon name={track.icon} />
          <span className="text-sm font-semibold">{track.day} — {track.label}</span>
        </div>
        {access && <Badge cls="bg-[#FAF8F4] text-[#5A5751] border-[#C9C2B4]">{access.priceLabel}</Badge>}
      </div>
      <div className="mt-1 text-[0.6875rem] uppercase tracking-wide text-[#8A857C]">{track.short}</div>
      <div className="mt-1.5 text-xs text-[#5A5751] leading-relaxed">{cat.parentBlurb}</div>
      {cat.outcome && <div className="mt-1.5 text-xs text-[#3F5226] leading-relaxed"><span className="font-semibold">By the end:</span> {cat.outcome}</div>}

      {cat.foundation && cat.anchor && (
        <div className="mt-2 border-l-2 border-[#B85838] pl-2 text-xs text-[#5A5751] leading-relaxed">
          <span className="italic">“{cat.anchor.text}”</span>
          <div className="mt-0.5 text-[0.625rem] text-[#8A857C]">{cat.anchor.ref}</div>
        </div>
      )}

      {roi && (
        <div className="mt-2 border-t border-[#F0EDE6] pt-2">
          <div className="text-sm font-semibold text-[#1A1815]">{usd(roi.medianCents)}<span className="text-xs font-normal text-[#5A5751]">/yr median</span></div>
          <div className="text-[0.6875rem] text-[#5A5751]">{roi.role} · range {usd(roi.lowCents)}–{usd(roi.highCents)}{roi.growthPct != null ? ` · +${roi.growthPct}% by 2034` : ''}</div>
          <div className="mt-1 text-[0.6875rem] text-[#3F5226] leading-relaxed">
            One year in this field ≈ <span className="font-semibold">{num(roi.yearsOfTuition)}×</span> the tuition, and {usd(roi.premiumOverAllJobsCents)}/yr above the median for all U.S. jobs ({usd(ALL_OCCUPATIONS_MEDIAN_CENTS)}).
          </div>
          {roi.related && <div className="mt-0.5 text-[0.625rem] text-[#8A857C]">Related: {roi.related}.</div>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly rhythm — the 5-day x 3-week deepening grid + week-4 retro
// ---------------------------------------------------------------------------
function RhythmSection({ program, schedule, cycle }) {
  const weeks = Array.from({ length: program.weeksPerCycle }, (_, i) => i + 1);
  return (
    <div>
      <p className="mb-3 text-sm text-[#5A5751] leading-relaxed">
        One industry a day, Monday through Friday. The same track theme runs three weeks straight — deeper each week, tuned to the child’s age. Week {program.retroWeek} is the retrospective.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 text-left text-[0.625rem] uppercase tracking-wide text-[#5A5751]">Day</th>
              {weeks.map((w) => (
                <th key={w} className={`border border-[#E8E4DC] p-2 text-left text-[0.625rem] uppercase tracking-wide ${cycle.week === w ? 'bg-[#F0F4EA] text-[#3F5226]' : 'bg-[#FAF8F4] text-[#5A5751]'}`}>Week {w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.day}>
                <th className="border border-[#E8E4DC] bg-white p-2 text-left align-top">
                  <div className="flex items-center gap-1.5 text-[#1A1815]"><UiIcon name={row.icon} /><span className="font-semibold">{row.day}</span></div>
                  <div className="mt-0.5 text-[0.625rem] text-[#8A857C]">{row.label}</div>
                </th>
                {row.weekFocuses.map((focus, i) => (
                  <td key={i} className="border border-[#E8E4DC] bg-white p-2 align-top text-[#5A5751] leading-relaxed">{focus}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 border border-[#E8E4DC] bg-[#FBF7EC] p-3 text-xs text-[#5A5751] leading-relaxed">
        <span className="font-semibold text-[#B45309]">Week {program.retroWeek} — retrospective:</span> the team meets to review the cycle (what to keep, improve, try), then the whole rhythm rotates to the next month. Notes are captured under “Improve.”
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enrollment — capacity/revenue readout, roster, add student, record payment
// ---------------------------------------------------------------------------
function EnrollmentSection({ program, stats, roster, isGovernor }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Enrolled" value={num(stats.enrolledCount)} sub={`${pct(stats.fillPct)} of ${num(stats.capacity)}`} />
        <MetricCell label="Collected" value={usd(stats.collectedCents)} accent />
        <MetricCell label="Outstanding" value={usd(stats.outstandingCents)} />
        <MetricCell label="By age band" value={Object.keys(stats.byAge).length ? '✓' : '—'} sub={ageSummary(stats.byAge)} small />
      </div>

      {isGovernor && <AddStudentForm program={program} />}

      <div className="mt-3 space-y-1">
        {roster.length === 0 && (
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No students yet. Add the first one above.</div>
        )}
        {roster.map((e) => <EnrollmentRow key={e.id} enrollment={e} program={program} isGovernor={isGovernor} />)}
      </div>
    </div>
  );
}

function ageSummary(byAge) {
  const parts = Object.entries(byAge).map(([id, n]) => `${(ageBand(id) || {}).label || id}: ${n}`);
  return parts.length ? parts.join(' · ') : 'none yet';
}

function EnrollmentRow({ enrollment, program, isGovernor }) {
  const pay = enrollmentPaymentState(enrollment, program);
  const band = ageBand(enrollment.ageBandId);
  const plan = planById(program, enrollment.planId);
  const badge = STATUS_BADGE[enrollment.status] || STATUS_BADGE.invited;
  const [amount, setAmount] = useState('');

  const onPay = () => {
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) return;
    recordPayment(enrollment.id, Math.round(dollars * 100), 'Manual payment');
    setAmount('');
  };

  return (
    <div className="border border-[#E8E4DC] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]">{enrollment.studentName}</div>
          <div className="text-[0.6875rem] text-[#8A857C]">{(band || {}).label || enrollment.ageBandId}{enrollment.guardianName ? ` · ${enrollment.guardianName}` : ''} · {(plan || {}).label || enrollment.planId}</div>
        </div>
        <Badge cls={badge.cls}>{badge.label}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6875rem] text-[#5A5751]">
        <span>Plan total: <span className="font-semibold text-[#1A1815]">{usd2(pay.totalCents)}</span></span>
        <span>Paid: <span className="font-semibold text-[#3F5226]">{usd2(pay.paidCents)}</span></span>
        <span>Balance: <span className="font-semibold text-[#B45309]">{usd2(pay.balanceCents)}</span></span>
        {pay.installmentsTotal > 1 && <span>{pay.installmentsPaid}/{pay.installmentsTotal} payments</span>}
        {pay.paidInFull && <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">Paid in full</Badge>}
      </div>

      {isGovernor && !pay.paidInFull && enrollment.status !== 'withdrawn' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number" min="0" step="1" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="Amount $"
            className="w-28 border border-[#C9C2B4] bg-white px-2 py-1 text-sm"
            aria-label={`Payment amount for ${enrollment.studentName}`}
          />
          <button type="button" onClick={onPay} className="border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-2.5 py-1 text-xs font-semibold">Record payment</button>
          {enrollment.status !== 'enrolled' && (
            <button type="button" onClick={() => setEnrollmentStatus(enrollment.id, 'enrolled')} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2.5 py-1 text-xs">Move to enrolled</button>
          )}
        </div>
      )}
    </div>
  );
}

function AddStudentForm({ program }) {
  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [ageBandId, setAgeBandId] = useState(AGE_BANDS[0].id);
  const [planId, setPlanId] = useState((program.paymentPlans[0] || {}).id || 'full');
  const [status, setStatus] = useState('enrolled');

  const plan = planById(program, planId);
  const sched = plan ? installmentSchedule(plan) : [];

  const onAdd = () => {
    if (!studentName.trim()) return;
    addEnrollment({ programId: program.id, studentName: studentName.trim(), guardianName: guardianName.trim(), ageBandId, planId, status });
    setStudentName(''); setGuardianName('');
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">Enroll a student</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student name" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Student name" />
        <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Parent / guardian (optional)" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Guardian name" />
        <select value={ageBandId} onChange={(e) => setAgeBandId(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Age band">
          {AGE_BANDS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Payment plan">
          {program.paymentPlans.map((p) => <option key={p.id} value={p.id}>{p.label} — {usd(p.totalCents)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Status">
          <option value="enrolled">Enrolled (holds a seat)</option>
          <option value="waitlist">Waitlist</option>
          <option value="invited">Invited</option>
        </select>
      </div>
      {plan && plan.installments > 1 && (
        <div className="mt-1.5 text-[0.625rem] text-[#8A857C]">{plan.installments} payments of {sched.map((c) => usd2(c)).join(', ')} — total {usd2(plan.totalCents)}.</div>
      )}
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add student</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team — roster, per-day coverage, students-per-staff ratio, add member
// ---------------------------------------------------------------------------
function TeamSection({ program, tStats, teamRoster, isGovernor }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="On the team" value={num(tStats.total)} sub={`${num(tStats.staffCount)} staff · ${num(tStats.volunteerCount)} volunteers`} />
        <MetricCell label="Staff target" value={num(program.staffTarget)} sub="~10 running it" />
        <MetricCell label="Students / staff" value={tStats.studentsPerStaff == null ? '—' : num(tStats.studentsPerStaff)} sub="load per staffer" />
        <MetricCell label="Days covered" value={`${num(tStats.daysCovered)}/${WEEKDAYS.length}`} sub="weekday leads" />
      </div>

      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">Weekday coverage</div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1">
          {tStats.coverage.map((c) => (
            <div key={c.day} className={`border p-2 text-xs ${c.covered ? 'border-[#5A6E3D] bg-[#F0F4EA]' : 'border-[#C9C2B4] bg-[#FBF7EC]'}`}>
              <div className="font-semibold text-[#1A1815]">{c.day}</div>
              <div className={`mt-0.5 text-[0.625rem] ${c.covered ? 'text-[#3F5226]' : 'text-[#B45309]'}`}>{c.covered ? c.who.join(', ') : 'No lead yet'}</div>
            </div>
          ))}
        </div>
      </div>

      {isGovernor && <AddTeamForm program={program} />}

      <div className="mt-3 space-y-1">
        {teamRoster.map((m) => {
          const role = teamRole(m.roleId);
          return (
            <div key={m.id} className="border border-[#E8E4DC] bg-white p-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-[#1A1815]">{m.name}</span>
                <span className="ml-2 text-[0.6875rem] text-[#8A857C]">{(role || {}).label || m.roleId}{m.trackDay ? ` · ${m.trackDay}` : ''}</span>
              </div>
              {isGovernor && !isSeedId(m.id) && (
                <button type="button" onClick={() => removeTeamMember(m.id)} className="text-[0.625rem] text-[#8A857C] underline">remove</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddTeamForm({ program }) {
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('facilitator');
  const [trackDay, setTrackDay] = useState('');

  const onAdd = () => {
    if (!name.trim()) return;
    addTeamMember({ programId: program.id, name: name.trim(), roleId, trackDay: trackDay || null });
    setName(''); setTrackDay('');
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">Add a team member</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name / role title" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Team member name" />
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Role">
          {TEAM_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select value={trackDay} onChange={(e) => setTrackDay(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Weekday">
          <option value="">No specific day</option>
          {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add member</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Improve — the week-4 retrospective notes
// ---------------------------------------------------------------------------
function ImproveSection({ program, retros, isGovernor }) {
  const [category, setCategory] = useState('improve');
  const [note, setNote] = useState('');

  const onAdd = () => {
    if (!note.trim()) return;
    addRetroNote({ programId: program.id, cycleMonth: program.cycleMonth, category, note: note.trim() });
    setNote('');
  };

  return (
    <div>
      <p className="mb-3 text-sm text-[#5A5751] leading-relaxed">
        Week {program.retroWeek} of every month: what do we keep, what do we improve, what do we try next cycle. This is the “improve” in learn-and-improve.
      </p>

      {isGovernor && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Category">
              {RETRO_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did we learn?" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Retrospective note" />
          </div>
          <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add note</button>
        </div>
      )}

      <div className="space-y-1">
        {retros.length === 0 && <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No retrospective notes yet.</div>}
        {retros.map((r) => {
          const cat = RETRO_CATEGORIES.find((c) => c.id === r.category) || RETRO_CATEGORIES[1];
          return (
            <div key={r.id} className="border border-[#E8E4DC] bg-white p-2.5 flex items-start gap-2">
              <Badge cls={CAT_BADGE[r.category] || CAT_BADGE.improve}>{cat.label}</Badge>
              <div className="text-sm text-[#1A1815] leading-relaxed">{r.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New program — configure a cohort for ANY industry (governor only)
// ---------------------------------------------------------------------------
function NewProgramForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [tuition, setTuition] = useState('1000');
  const [capacity, setCapacity] = useState('500');
  const [trackIds, setTrackIds] = useState(DEFAULT_TRACK_IDS.slice());

  const setTrack = (i, id) => setTrackIds((cur) => cur.map((t, idx) => (idx === i ? id : t)));

  const onCreate = () => {
    if (!name.trim()) return;
    addProgram({
      name: name.trim(),
      tuitionCents: Math.round((Number(tuition) || 0) * 100),
      capacity: Math.max(1, Math.round(Number(capacity) || 0)),
      trackIds,
    });
    setName(''); setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="border border-[#C9C2B4] bg-white text-[#1A1815] px-3 py-1.5 text-sm font-semibold">
        + New program (any industry)
      </button>
    );
  }

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">Configure a new cohort program</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Program name" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-3" aria-label="Program name" />
        <label className="text-xs text-[#5A5751]">Tuition $<input value={tuition} onChange={(e) => setTuition(e.target.value)} type="number" min="0" className="ml-1 w-24 border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Tuition dollars" /></label>
        <label className="text-xs text-[#5A5751]">Capacity <input value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" min="1" className="ml-1 w-24 border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Capacity" /></label>
      </div>
      <div className="text-[0.6875rem] uppercase tracking-wide text-[#5A5751] mb-1">Five weekday tracks</div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-1 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={day}>
            <div className="text-[0.625rem] text-[#8A857C] mb-0.5">{day}</div>
            <select value={trackIds[i]} onChange={(e) => setTrack(i, e.target.value)} className="w-full border border-[#C9C2B4] bg-white px-1.5 py-1 text-xs" aria-label={`${day} track`}>
              {INDUSTRY_TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCreate} className="border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Create program</button>
        <button type="button" onClick={() => setOpen(false)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-3 py-1.5 text-sm">Cancel</button>
      </div>
    </div>
  );
}
