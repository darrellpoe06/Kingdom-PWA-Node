// =============================================================================
// games/AssetAllocator.jsx — "The Steward's Challenge" (the money mini-game)
// =============================================================================
// The tactile face of lib/games/asset-allocation.js: Christiana has $30,000 and
// a block to shop. Put a down payment (min 5% — leverage) on the houses you want,
// keep an eye on your CONTINGENCY reserve, watch each door's monthly cash flow,
// then see how you stewarded it — measured the way Yahweh measures. Pure state in,
// pure reducer out (the rules live in the lib module); this only renders + wires
// buttons to real actions (no copy-paste, preview-then-buy). Self-contained SVG
// house art with a window that lights up when you own it (baked-light motif).
// =============================================================================
import React, { useMemo, useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import { resolveScripture } from '../../lib/games/scripture-link.js';
import {
  PROPERTIES, START_CASH, CONTINGENCY_TARGET,
  createAllocation, analyze, summary, canBuy, buy, sell, grade,
} from '../../lib/games/asset-allocation.js';

const T_INK = 'text-[#1A1815]';
const T_MUTE = 'text-[#5A5751]';
const T_ACCENT = 'text-[#B85838]';
const T_GREEN = 'text-[#5A6E3D]';
const BG_CARD = 'bg-white';
const BG_CREAM = 'bg-[#FAF8F4]';
const BG_INK = 'bg-[#1A1815]';
const BORDER = 'border-[#E8E4DC]';

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const DOWN_OPTIONS = [5, 10, 20, 50];

// A little house that lights up (a lit window) once it's yours — the baked-light
// motif, and a warm cue that this door is now producing.
function House({ owned, size = 46 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className="block shrink-0" aria-hidden="true">
      <path d="M6 22 L24 8 L42 22 Z" fill={owned ? '#B85838' : '#C9C2B6'} />
      <rect x="10" y="22" width="28" height="18" fill={owned ? '#E0C9A6' : '#DED8CD'} />
      <rect x="20" y="30" width="8" height="10" fill={owned ? '#8A5A3C' : '#B7AE9F'} />
      <rect x="13" y="25" width="6" height="6" fill={owned ? '#FFE9A8' : '#EFEAE0'} />
      <rect x="29" y="25" width="6" height="6" fill={owned ? '#FFE9A8' : '#EFEAE0'} />
      {owned && <circle cx="24" cy="34" r="1.1" fill="#5A3A22" />}
    </svg>
  );
}

function Stat({ label, value, tone = 'ink', hint }) {
  const color = tone === 'green' ? T_GREEN : tone === 'accent' ? T_ACCENT : T_INK;
  return (
    <div className={`${BG_CARD} border ${BORDER} rounded-xl px-3 py-2 text-center`}>
      <div className={`text-[0.625rem] uppercase tracking-[0.15em] ${T_MUTE}`}>{label}</div>
      <div className={`text-lg font-bold ${color} tabular-nums`}>{value}</div>
      {hint ? <div className={`text-[0.625rem] ${T_MUTE}`}>{hint}</div> : null}
    </div>
  );
}

export default function AssetAllocator({ onFinish, onExit }) {
  const [state, setState] = useState(createAllocation);
  const [downByProp, setDownByProp] = useState({});
  const [showGrade, setShowGrade] = useState(false);

  const s = useMemo(() => summary(state), [state]);
  const g = useMemo(() => grade(state), [state]);
  const reservePct = Math.max(0, Math.min(100, Math.round((s.reserve / START_CASH) * 100)));
  const targetPct = Math.round((CONTINGENCY_TARGET / START_CASH) * 100);

  const downFor = (id) => downByProp[id] || 5;
  const setDown = (id, pct) => setDownByProp((m) => ({ ...m, [id]: pct }));

  if (showGrade) {
    return <GradeView g={g} onAgain={() => { setState(createAllocation()); setShowGrade(false); }} onExit={onExit} onFinish={onFinish} />;
  }

  return (
    <div>
      {/* the money at a glance */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Cash left" value={money(s.cashLeft)} tone="accent" />
        <Stat label="Reserve" value={money(s.reserve)} tone={s.reserveHealthy ? 'green' : 'accent'} hint={s.reserveHealthy ? 'healthy' : `keep ${money(CONTINGENCY_TARGET)}`} />
        <Stat label="Income / mo" value={money(s.monthlyIncome)} tone={s.monthlyIncome >= 0 ? 'green' : 'accent'} hint={`${s.owned} owned · ${s.doors} doors`} />
      </div>

      {/* the contingency meter — the buffer you shouldn't spend to zero */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[0.6875rem] ${T_MUTE}`}>Your contingency reserve</span>
          <span className={`text-[0.6875rem] ${s.reserveHealthy ? T_GREEN : T_ACCENT}`}>{s.reserveHealthy ? 'A wise buffer' : 'Getting thin — keep a cushion'}</span>
        </div>
        <div className={`relative h-2.5 rounded-full ${BG_CREAM} overflow-hidden`}>
          <div className={`h-full rounded-full ${s.reserveHealthy ? 'bg-[#5A6E3D]' : 'bg-[#B85838]'}`} style={{ width: `${reservePct}%` }} />
          <div className="absolute top-0 bottom-0" style={{ left: `${targetPct}%`, width: '2px', background: '#1A1815' }} title="the reserve to keep" />
        </div>
        <div className={`text-[0.625rem] ${T_MUTE} mt-1`}>The line marks the {money(CONTINGENCY_TARGET)} a wise steward keeps back (Proverbs 21:20).</div>
      </div>

      {/* the block */}
      <div className="mt-4 space-y-2.5">
        {PROPERTIES.map((p) => {
          const owned = s.holdings.find((h) => h.propertyId === p.id);
          const dp = owned ? owned.downPct : downFor(p.id);
          const a = analyze(p.id, dp);
          const affordable = canBuy(state, p.id, dp);
          return (
            <div key={p.id} className={`${BG_CARD} border ${owned ? 'border-[#B85838]' : BORDER} rounded-xl p-3`}>
              <div className="flex items-start gap-3">
                <House owned={!!owned} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-semibold ${T_INK}`}>{p.name}</span>
                    {owned && <span className={`text-[0.6rem] uppercase tracking-wide ${T_ACCENT} ${BG_CREAM} px-1.5 py-0.5 rounded`}>Owned</span>}
                  </div>
                  <div className={`text-[0.75rem] ${T_MUTE}`}>{money(p.price)} · rent {money(p.rent)}/mo</div>
                  <p className={`text-[0.75rem] ${T_MUTE} mt-0.5`}>{p.note}</p>

                  {!owned && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`text-[0.6875rem] ${T_MUTE} mr-1`}>Down:</span>
                      {DOWN_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setDown(p.id, opt)}
                          className={`text-[0.75rem] rounded-full px-2.5 py-1 border ${dp === opt ? 'bg-[#1A1815] text-[#FAF8F4] border-[#1A1815]' : `${BG_CREAM} ${T_INK} ${BORDER}`}`}
                        >{opt}%</button>
                      ))}
                    </div>
                  )}

                  <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.75rem] ${T_MUTE}`}>
                    <span>Down + closing: <span className={T_INK}>{money(a.cashNeeded)}</span></span>
                    <span>Cash flow: <span className={a.cashFlow >= 0 ? T_GREEN : T_ACCENT}>{a.cashFlow >= 0 ? '+' : ''}{money(a.cashFlow)}/mo</span></span>
                  </div>
                </div>
                <div className="shrink-0">
                  {owned ? (
                    <button onClick={() => setState(sell(state, p.id))} className={`text-[0.75rem] ${T_MUTE} underline`}>Sell</button>
                  ) : (
                    <button
                      onClick={() => setState(buy(state, p.id, dp))}
                      disabled={!affordable}
                      className={`text-sm font-semibold rounded-lg px-3 py-2 ${affordable ? 'bg-[#B85838] text-white' : `${BG_CREAM} ${T_MUTE}`}`}
                    >Buy</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setShowGrade(true)} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2`}>
          <UiIcon name="chart" /> See how you stewarded it
        </button>
        <button onClick={() => setState(createAllocation())} className={`${BG_CARD} border ${BORDER} ${T_INK} rounded-lg px-4 py-2.5 text-sm font-medium`}>Start over</button>
        {onExit && <button onClick={onExit} className={`text-sm ${T_MUTE} underline px-2`}>Back to games</button>}
      </div>
    </div>
  );
}

function GradeView({ g, onAgain, onExit, onFinish }) {
  const verse = resolveScripture(g.verse);
  return (
    <div>
      <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-5 text-center`}>
        <div className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold ${T_ACCENT}`}>The Steward&rsquo;s Challenge</div>
        <h2 className={`text-2xl font-semibold ${T_INK} mt-1`} style={{ fontFamily: 'Fraunces, serif' }}>{g.tier}</h2>
        <p className={`text-sm leading-relaxed ${T_INK} mt-2 max-w-prose mx-auto`}>{g.headline}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="Owned" value={`${g.owned}`} hint={`${g.doors} doors`} />
        <Stat label="Income / mo" value={money(g.monthlyIncome)} tone={g.monthlyIncome >= 0 ? 'green' : 'accent'} />
        <Stat label="Reserve" value={money(g.reserve)} tone={g.reserveHealthy ? 'green' : 'accent'} />
      </div>

      <div className={`mt-4 border-l-2 border-[#B85838] pl-3 ${BG_CREAM} py-2 rounded-r`}>
        <div className="flex items-center gap-1.5 mb-1">
          <UiIcon name="dove" className={T_ACCENT} />
          <span className={`text-[0.625rem] uppercase tracking-[0.2em] font-semibold ${T_ACCENT}`}>Yahweh&rsquo;s perspective</span>
        </div>
        <p className={`text-sm leading-relaxed italic ${T_INK}`}>{g.lens}</p>
      </div>

      {verse?.text && (
        <div className={`mt-3 ${BG_CARD} border ${BORDER} rounded p-3`}>
          <div className="flex items-center gap-1.5 mb-1">
            <UiIcon name="bookOpen" className={T_MUTE} />
            <span className={`text-[0.6875rem] font-semibold ${T_INK}`}>{verse.ref}</span>
            <span className={`text-[0.625rem] uppercase tracking-wide ${T_MUTE} ${BG_CREAM} px-1.5 py-0.5 rounded`}>{verse.translation}</span>
          </div>
          <p className={`text-sm leading-relaxed ${T_MUTE}`}>&ldquo;{verse.text}&rdquo;</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        {onFinish && <button onClick={() => onFinish(g)} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium`}>Carry it into the journey</button>}
        <button onClick={onAgain} className={`${BG_CARD} border ${BORDER} ${T_INK} rounded-lg px-4 py-2.5 text-sm font-medium`}>Try a different split</button>
        {onExit && <button onClick={onExit} className={`text-sm ${T_MUTE} underline px-2`}>Back to games</button>}
      </div>
    </div>
  );
}
