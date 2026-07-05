// =============================================================================
// TabSmePanel — who likes which tabs, so their feedback is prioritized as SMEs
// =============================================================================
// Darrell 2026-07-05: "I would like to see who likes which tabs so their feedback
// will be prioritized because they would be considered SMEs... everyone will
// eventually have their issue so we might as well fix it fast."
//
// SIGNAL = VOLUNTARY FEEDBACK, not covert usage (governor's 2026-07-05 choice
// "both, usage opt-in"). Ranks each area's people by how many notes they CHOSE
// to give it; an SME has cleared repeat engagement (tab-sme.SME_MIN_NOTES). This
// crosses no privacy line — usage_events stays aggregate-only ("no per-person
// behavior"); per-person tab USAGE is a later, explicitly-opt-in governor signal.
//
// Presentational + real-data-only (DR-0061/0076): every row traces to a real
// feedback submission. Honest empty state until notes accumulate. rem sizes,
// UiIcon glyphs, no width-caps — carries no consistency-guard debt.
import React, { useMemo } from 'react';
import UiIcon from './UiIcon.jsx';
import { tabSme, personTabs, SME_MIN_NOTES } from '../lib/tab-sme.js';

const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';

// A person chip: name · note-count, SME ones accented with the sparkle glyph.
function PersonChip({ name, notes, isSme, top }) {
  const base = 'inline-flex items-center gap-1 text-[0.625rem] px-1.5 py-0.5 border';
  const cls = isSme
    ? `${base} border-[#5A6E3D] text-[#5A6E3D] bg-[#FAF8F4] font-semibold`
    : `${base} border-[#E3DDD2] text-[#5A5751] bg-[#FAF8F4]`;
  return (
    <span className={cls}>
      {isSme ? <UiIcon name="sparkle" /> : null}
      <span className="truncate" style={{ maxWidth: '9rem' }}>{name}</span>
      <span className="tabular-nums opacity-80">· {notes}</span>
      {top ? <span className="uppercase tracking-wider text-[0.5rem] opacity-90">top</span> : null}
    </span>
  );
}

export default function TabSmePanel({
  feedback = [],
  currentUser = null,
  areaLabel = (k) => k,
  title = 'SMEs by tab — whose feedback to prioritize',
  max = 20,
}) {
  const areas = useMemo(
    () => tabSme(feedback, { self: currentUser }),
    [feedback, currentUser]
  );
  const people = useMemo(
    () => personTabs(feedback, { self: currentUser }),
    [feedback, currentUser]
  );

  const shown = areas.slice(0, max);
  const smeCount = areas.reduce((s, a) => s + a.smes.length, 0);

  return (
    <div className="border border-[#E8E4DC] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="text-sm font-semibold text-[#1A1815] inline-flex items-center gap-1.5">
          <UiIcon name="users" /> {title}
        </h3>
        {areas.length > 0 ? (
          <span className={sectionH}>{smeCount} {smeCount === 1 ? 'SME' : 'SMEs'} · {areas.length} {areas.length === 1 ? 'area' : 'areas'}</span>
        ) : null}
      </div>
      <p className={note + ' mb-3'}>
        Ranked from the feedback people chose to give — a repeat voice on a tab ({SME_MIN_NOTES}+ notes)
        is its subject-matter expert. Prioritize their feedback: they hit the issue first, and everyone
        else eventually will. Voice only; never per-person usage.
      </p>

      {shown.length === 0 ? (
        <p className={note + ' italic'}>
          No feedback yet — as people weigh in on tabs, the expert per area shows here and their
          feedback is surfaced first for a fast fix.
        </p>
      ) : (
        <>
          <div className={sectionH + ' mb-1.5'}>By tab</div>
          <div className="border border-[#E8E4DC] divide-y divide-[#F2EEE6] mb-4">
            {shown.map((a) => (
              <div key={a.area} className="px-2.5 py-2">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[0.8125rem] text-[#1A1815] truncate" title={areaLabel(a.area)}>
                    {areaLabel(a.area)}
                  </span>
                  <span className="text-[0.625rem] text-[#5A5751] shrink-0 tabular-nums">
                    {a.totalNotes} {a.totalNotes === 1 ? 'note' : 'notes'} · {a.contributors.length} {a.contributors.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.contributors.slice(0, 5).map((c, i) => (
                    <PersonChip key={c.key} name={c.name} notes={c.notes} isSme={c.notes >= SME_MIN_NOTES} top={i === 0 && c.notes >= SME_MIN_NOTES} />
                  ))}
                  {a.contributors.length > 5 ? (
                    <span className="text-[0.625rem] text-[#5A5751] self-center">+{a.contributors.length - 5} more</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className={sectionH + ' mb-1.5'}>By person — who likes which tabs</div>
          <div className="border border-[#E8E4DC] divide-y divide-[#F2EEE6]">
            {people.slice(0, max).map((p) => (
              <div key={p.key} className="px-2.5 py-2">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[0.8125rem] text-[#1A1815] truncate">{p.name}</span>
                  <span className="text-[0.625rem] text-[#5A5751] shrink-0 tabular-nums">{p.totalNotes} {p.totalNotes === 1 ? 'note' : 'notes'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.areas.slice(0, 6).map((ar) => (
                    <span
                      key={ar.area}
                      className={'inline-flex items-center gap-1 text-[0.625rem] px-1.5 py-0.5 border ' + (ar.isSme ? 'border-[#5A6E3D] text-[#5A6E3D] bg-[#FAF8F4] font-semibold' : 'border-[#E3DDD2] text-[#5A5751] bg-[#FAF8F4]')}
                      title={areaLabel(ar.area)}
                    >
                      {ar.isSme ? <UiIcon name="sparkle" /> : null}
                      <span className="truncate" style={{ maxWidth: '10rem' }}>{areaLabel(ar.area)}</span>
                      <span className="tabular-nums opacity-80">· {ar.notes}</span>
                    </span>
                  ))}
                  {p.areas.length > 6 ? (
                    <span className="text-[0.625rem] text-[#5A5751] self-center">+{p.areas.length - 6} more</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[0.5625rem] text-[#5A5751] italic mt-3 leading-relaxed">
        SME rank comes from feedback people chose to share, not from watching what they open. Per-person
        tab usage stays off by design; it can be added later only as an explicit, opt-in governor signal.
      </p>
    </div>
  );
}
