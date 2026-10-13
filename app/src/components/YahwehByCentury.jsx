// =============================================================================
// YahwehByCentury — "The Firsts", century by century, read twice
// =============================================================================
// The visible surface for lib/yahweh-by-century.js (one source, DR-0079). Every
// verse rendered here is KJV-verbatim, materialized from the in-repo corpus by
// scripts/fetch-century-verses.mjs and re-derived in yahweh-by-century.test.js
// (DR-0076) -- nothing on this page is painted.
//
// Darrell 2026-09-05: what was NEW in each century, why it was needed, how it
// was / is / will be used, what ended, the provisions and what fails without
// them, the promises and where they were kept, the backward 100-year reference,
// and the same events read WITHOUT His perspective and WITH it -- "like a
// puzzle". The two readings sit side by side so the reader compares rather than
// being told, and the BLIND-UNTIL thread is printed above them on purpose so the
// comparison is offered and never brandished.
// =============================================================================
import React, { useState } from 'react';
import {
  CENTURIES, THREADS, CANON_FENCE, NEEDED_MEANS, DATING_TIERS, CENTURY_GRID,
  DEDUCTION_DOCTRINE, promiseLedger, openPromises, verseText,
} from '../lib/yahweh-by-century.js';

const TIER_LABEL = {
  'word-clock': 'The Word’s own clock — no BC date is given',
  synchronized: 'Synchronized — BC, fixed by external record',
  documented: 'Documented — AD, ordinary historical record',
};

const STATUS_LABEL = {
  fulfilled: 'Kept',
  'fulfilled-not-yet-final': 'Kept — final act still ahead',
  'fulfilled-not-yet-consummated': 'Kept — visible form still ahead',
  'fulfilled-still-running': 'Kept — and still running',
  'fulfilled-and-reapplied': 'Kept — and reapplied later',
  'fulfilled-then-fulfilled-again': 'Kept twice',
  'fulfilled-in-part': 'Kept in part',
  'fulfilled-in-history': 'Kept — in documented history',
  'kept-continuously': 'Being kept, continuously',
  'in-progress': 'In progress',
  outstanding: 'Still open',
};

function Verse({ refId }) {
  const text = verseText(refId);
  if (!text) return null;
  return (
    <p className="text-[0.8125rem] text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
      <span className="text-[#5A6E3D] font-semibold">{refId}</span>{' — '}
      <span className="italic">{text}</span>
    </p>
  );
}

function TwoReadings({ c }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
          The same events, without His perspective
        </div>
        <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{c.withoutHim}</p>
      </div>
      <div className="border-2 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] p-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">
          The same events, with His perspective
        </div>
        <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{c.withHim}</p>
      </div>
    </div>
  );
}

function Possibilities({ p }) {
  return (
    <div className="mt-3 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">
        Where believers differ — {p.question}
      </div>
      <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong>What is settled:</strong> {p.plumbLine}
      </p>
      <ul className="list-disc pl-4 mt-1.5 space-y-1">
        {p.views.map((v, i) => (
          <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>{v.view}</strong> — {v.ties}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong className="text-[#1A1815]">Held open:</strong> {p.open}
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.confidence}</p>
    </div>
  );
}

function Field({ label, children, tone = 'plain' }) {
  const bar = tone === 'end' ? 'border-[#B85838]' : tone === 'gift' ? 'border-[#5A6E3D]' : 'border-[#E8E4DC]';
  return (
    <div className={`mt-2 border-l-4 ${bar} pl-3`}>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{label}</div>
      <p className="text-xs text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{children}</p>
    </div>
  );
}

export default function YahwehByCentury() {
  const [openId, setOpenId] = useState(CENTURIES[0] ? CENTURIES[0].id : null);
  const [showGrid, setShowGrid] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const blindUntil = THREADS.find((t) => t.id === 'blind-until');
  const theNormal = THREADS.find((t) => t.id === 'the-normal');
  const ledger = promiseLedger();
  const stillOpen = openPromises();

  return (
    <div className="px-1">
      <p className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Church · The Word</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        The Firsts
      </h1>
      <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        What Yahweh did in each century that had never been done before — why it was needed,
        how it was used then, how it is used now, what will still be done with it, and what
        ended there and did not come back. Every century is read twice: the same events without
        His perspective, and with it.
      </p>

      {/* THE NORMAL — the thesis, printed before the list so the list is read under it. */}
      {theNormal && (
        <div className="mt-3 border-2 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] p-3">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">{theNormal.title}</div>
          <p className="text-sm text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{theNormal.teaching}</p>
          <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{theNormal.whyItMatters}</p>
        </div>
      )}

      {/* BLIND UNTIL — the fence on the comparison, before the first comparison. */}
      {blindUntil && (
        <div className="mt-2 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">{blindUntil.title}</div>
          <p className="text-xs text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{blindUntil.whyItMatters}</p>
        </div>
      )}

      {/* The two fences that govern how the list may be read. */}
      <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Before the list — two things it will not do</div>
        <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{NEEDED_MEANS.rule}</p>
        <p className="text-xs text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{CANON_FENCE.rule}</p>
      </div>

      {/* The dating tiers + the backward 100-year grid, on demand. */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowGrid(!showGrid)}
          aria-expanded={showGrid}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {showGrid ? 'Hide' : 'How the centuries are dated — and how far back the count reaches'}
        </button>
        {showGrid && (
          <div className="mt-2 border border-[#E8E4DC] bg-white p-3">
            {Object.entries(DATING_TIERS).map(([k, t]) => (
              <div key={k} className="mb-2">
                <div className="text-[0.6875rem] font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t.label}</div>
                <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{t.basis}</p>
                <p className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>Where it stops: {t.stops}</p>
              </div>
            ))}
            <div className="border-t border-[#E8E4DC] pt-2 mt-2">
              <div className="text-[0.6875rem] font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Counting back in hundred-year blocks</div>
              <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{CENTURY_GRID.method}</p>
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                {CENTURY_GRID.worked.map((w) => (
                  <li key={w.stated} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <strong>{w.interval}</strong> ({w.stated}, stated) → {w.computed} <em className="text-[#B85838]">Fork: {w.fork}</em>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#B85838] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{CENTURY_GRID.honestLimit}</p>
              <p className="text-xs text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong className="text-[#1A1815]">And the gap is real, and deduction is still valid:</strong> {DEDUCTION_DOCTRINE.refusalIsAlsoError} {DEDUCTION_DOCTRINE.precedent}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* The centuries. */}
      <ol className="mt-4 space-y-2">
        {CENTURIES.map((c) => {
          const isOpen = openId === c.id;
          return (
            <li key={c.id} className={`border p-3 ${c.afterCanon ? 'border-[#E8E4DC] bg-[#FAF8F4]' : 'border-[#E8E4DC] bg-white'}`}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : c.id)}
                aria-expanded={isOpen}
                className="w-full text-left focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{c.era}</span>
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {TIER_LABEL[c.tier]}
                  </span>
                </div>
                <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.when}</div>
              </button>

              {isOpen && (
                <div className="mt-2 border-t border-[#E8E4DC] pt-2">
                  {c.afterCanon && (
                    <p className="text-[0.6875rem] text-[#B85838] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      After the canon — documented history under promises already given, never new revelation.
                    </p>
                  )}

                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mt-2">What was new here</div>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {c.firsts.map((f, i) => (
                      <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{f}</li>
                    ))}
                  </ul>

                  <Field label="Why it was needed">{c.whyNeeded}</Field>
                  <Field label="How it was used then">{c.usedThen}</Field>
                  <Field label="How it is used now">{c.usedNow}</Field>
                  <Field label="How it will be used">{c.willBeUsed}</Field>
                  <Field label="What ended here" tone="end">{c.ended}</Field>
                  <Field label="The provision" tone="gift">{c.provision}</Field>
                  <Field label="Without the provision" tone="end">{c.withoutProvision}</Field>
                  <Field label="If it had not come in this century">{c.ifNotThisCentury || c.ifNotThisEra}</Field>

                  <TwoReadings c={c} />

                  <div className="mt-2 border-l-4 border-[#B85838] pl-3">
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">The piece that only fits with Him</div>
                    <p className="text-xs text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{c.piece}</p>
                  </div>

                  {c.promises.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Promises made here</div>
                      <ul className="mt-1 space-y-1.5">
                        {c.promises.map((p) => (
                          <li key={p.made} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                            <strong>{p.promise}</strong> <span className="text-[#5A5751]">({p.made})</span>
                            {' — '}
                            <span className="text-[#B85838] font-semibold">{STATUS_LABEL[p.status] || p.status}</span>
                            {p.fulfilled ? <span className="text-[#5A5751]"> · {p.fulfilled}</span> : null}
                            {p.note ? <span className="text-[#5A5751]"> {p.note}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.anchors.length > 0 && (
                    <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-2">
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">The Word on this century</div>
                      {c.anchors.map((r) => <Verse key={r} refId={r} />)}
                    </div>
                  )}

                  {c.history.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Documented history — checkable by anyone</div>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {c.history.map((h, i) => (
                          <li key={i} className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                            <strong className="text-[#1A1815]">{h.date}</strong> — {h.event} <em>{h.source}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.possibilities && <Possibilities p={c.possibilities} />}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* The promise ledger — made here, kept there, or still open. */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowLedger(!showLedger)}
          aria-expanded={showLedger}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {showLedger ? 'Hide the promise ledger' : `The promise ledger — ${ledger.length} promises, ${stillOpen.length} still open`}
        </button>
        {showLedger && (
          <div className="mt-2 border border-[#E8E4DC] bg-white p-3 overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
              <caption className="text-left text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold pb-2">
                Every promise this study names — where it was made, and the century that kept it
              </caption>
              <thead>
                <tr className="text-left text-[0.625rem] uppercase tracking-wider text-[#5A5751] border-b border-[#E8E4DC]">
                  <th scope="col" className="py-1 pr-2">Promise</th>
                  <th scope="col" className="py-1 pr-2">Made</th>
                  <th scope="col" className="py-1 pr-2">Kept</th>
                  <th scope="col" className="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((p) => (
                  <tr key={`${p.madeIn}-${p.made}`} className="border-b border-[#F1EEE8] align-top">
                    <td className="py-1 pr-2 text-[#1A1815]">{p.promise}</td>
                    <td className="py-1 pr-2 text-[#5A5751]">{p.made}<br /><span className="text-[0.625rem]">{p.madeInEra}</span></td>
                    <td className="py-1 pr-2 text-[#5A5751]">{p.fulfilled || '—'}<br /><span className="text-[0.625rem]">{p.fulfilledInEra || 'not yet'}</span></td>
                    <td className={`py-1 font-semibold ${p.open ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`}>{STATUS_LABEL[p.status] || p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* The remaining threads, after the list. */}
      {THREADS.filter((t) => t.id !== 'the-normal' && t.id !== 'blind-until').map((t) => (
        <div key={t.id} className="mt-4 border border-[#E8E4DC] bg-white p-3">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">{t.title}</div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1 italic" style={{ fontFamily: '"Fraunces", serif' }}>Spoken 2026-09-05: “{t.spoken}”</p>
          <p className="text-sm text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.teaching}</p>
          {t.whyItMatters && <p className="text-sm text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.whyItMatters}</p>}
          {t.heSaidItWouldCost && <p className="text-sm text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.heSaidItWouldCost}</p>}
          {t.andWeStillLove && <p className="text-sm text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.andWeStillLove}</p>}
          {t.andTheGoodNews && <p className="text-sm text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.andTheGoodNews}</p>}
          {t.honestNote && <p className="text-xs text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.honestNote}</p>}
        </div>
      ))}
    </div>
  );
}
