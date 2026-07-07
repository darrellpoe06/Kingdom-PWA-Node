// =============================================================================
// GamePlayer — the controlled board-game player for "our games"
// =============================================================================
// Renders ANY game built on lib/games/engine.js. It holds no game state of its
// own: the engine `state` comes in as a prop and every action calls `onChange`
// with the next pure state, so the single source of truth stays in the shell's
// persisted save row (local-first; survives a reload). Game-agnostic — it reads
// the def's categories, paths, spaces and the legacy reducer — so a second game
// reuses it untouched.
//
// Built on the shared primitives (SectionTitle, TabScroll, UiIcon,
// TextSizeControl) and the shared theme CLASSES (never inline hex), so the
// midnight theme stays AA-legible and the global large-print control scales
// every rem. No device-font emoji.
//
// The differentiator is on every surface: a "Yahweh's perspective" LENS callout
// and the verbatim KJV verse (resolved from the verified set) accompany each
// moment, the scoreboard leads with the Kingdom axes, and the finish is a
// LEGACY measured by faithfulness and what is passed on.
// =============================================================================
import React, { useMemo } from 'react';
import { SectionTitle } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import {
  choosePath, takeTurn, resolveChoice, computeTotals, progress, boardFor,
} from '../lib/games/engine.js';
import { resolveScripture } from '../lib/games/scripture-link.js';
import { revealPolicy, displayOrder } from '../lib/games/difficulty.js';
import { FamilyPortrait, JourneyStart, PathEmblem } from './games/GameArt.jsx';

// Theme tokens — shared classes the midnight theme remaps to AA-legible values.
const T_INK = 'text-[#1A1815]';
const T_MUTE = 'text-[#5A5751]';
const T_ACCENT = 'text-[#B85838]';
const T_GREEN = 'text-[#5A6E3D]';
const BG_CARD = 'bg-white';
const BG_CREAM = 'bg-[#FAF8F4]';
const BG_INK = 'bg-[#1A1815]';
const BG_GREEN = 'bg-[#5A6E3D]';
const BORDER = 'border-[#E8E4DC]';

function Eyebrow({ children }) {
  return <div className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold ${T_ACCENT}`}>{children}</div>;
}

// "Yahweh's perspective" — the lens. The explicit differentiator, set apart so a
// player always sees the moment read through the Word.
function LensCallout({ children }) {
  if (!children) return null;
  return (
    <div className={`mt-3 border-l-2 border-[#B85838] pl-3 ${BG_CREAM} py-2 rounded-r`}>
      <div className="flex items-center gap-1.5 mb-1">
        <UiIcon name="dove" className={T_ACCENT} />
        <span className={`text-[0.625rem] uppercase tracking-[0.2em] font-semibold ${T_ACCENT}`}>Yahweh&rsquo;s perspective</span>
      </div>
      <p className={`text-sm leading-relaxed italic ${T_INK}`}>{children}</p>
    </div>
  );
}

// The verbatim KJV verse (resolved from the verified set). Reference-only when
// the verified set lacks it — an honest "look it up", never a fabricated quote.
function ScriptureCallout({ scripture }) {
  const r = resolveScripture(scripture);
  if (!r) return null;
  return (
    <div className={`mt-3 ${BG_CARD} border ${BORDER} rounded p-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        <UiIcon name="bookOpen" className={T_MUTE} />
        <span className={`text-[0.6875rem] font-semibold ${T_INK}`}>{r.ref}</span>
        <span className={`text-[0.625rem] uppercase tracking-wide ${T_MUTE} ${BG_CREAM} px-1.5 py-0.5 rounded`}>{r.translation}</span>
      </div>
      {r.text
        ? <p className={`text-sm leading-relaxed ${T_MUTE}`}>&ldquo;{r.text}&rdquo;</p>
        : <p className={`text-sm ${T_MUTE}`}>Open the Word to {r.ref}.</p>}
    </div>
  );
}

// Small +/- chips naming what a moment changed, keyed by category label.
function EffectChips({ def, effects }) {
  if (!effects) return null;
  const items = def.categories
    .filter((c) => typeof effects[c.key] === 'number' && effects[c.key] !== 0)
    .map((c) => ({ label: c.label, d: effects[c.key] }));
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span key={it.label} className={`text-[0.6875rem] px-2 py-0.5 rounded-full border ${BORDER} ${it.d > 0 ? T_GREEN : T_ACCENT}`}>
          {it.d > 0 ? '+' : ''}{it.d} {it.label}
        </span>
      ))}
    </div>
  );
}

// The scoreboard — leads with the Kingdom axes (the def orders them so). Bars are
// relative to the current high score so progress reads at a glance.
function Scoreboard({ def, state }) {
  const totals = computeTotals(def, state);
  const max = Math.max(1, ...Object.values(totals.byCategory));
  return (
    <div className={`${BG_CARD} border ${BORDER} rounded-lg p-3`}>
      <div className="flex items-center gap-1.5 mb-2">
        <UiIcon name="chart" className={T_MUTE} />
        <Eyebrow>Your walk so far</Eyebrow>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {def.categories.map((c) => {
          const v = totals.byCategory[c.key] || 0;
          const pct = Math.round((v / max) * 100);
          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between">
                <span className={`text-sm ${T_INK}`}>{c.label}</span>
                <span className={`text-sm font-semibold ${T_INK}`}>{v}</span>
              </div>
              <div className={`mt-1 h-1.5 rounded-full ${BG_CREAM} overflow-hidden`}>
                <div className={`h-1.5 rounded-full ${BG_GREEN}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- path picker (the opening crossroads) -----------------------------------
function PathPicker({ def, state, onChange }) {
  return (
    <div>
      <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-4 mb-4`}>
        <JourneyStart className="mb-3 border border-[#E8E4DC]" />
        <Eyebrow>Where the journey begins</Eyebrow>
        <p className={`text-sm leading-relaxed ${T_INK} mt-1`}>
          Every life starts at a crossroads. Choose the road you&rsquo;ll set out on. There is no wrong door &mdash;
          each one is walked with Yahweh, and the road home is always open along the way.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {def.paths.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(choosePath(def, state, p.id))}
            className={`text-left ${BG_CARD} border ${BORDER} rounded-lg p-4 hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors`}
          >
            <div className="flex items-start gap-3">
              <PathEmblem pathId={p.id} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-base font-semibold ${T_INK}`}>{p.label}</span>
                  <UiIcon name="pin" className={T_ACCENT} />
                </div>
                <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>{p.blurb}</p>
              </div>
            </div>
            <LensCallout>{p.lens}</LensCallout>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- the active moment (auto event or a decision) ---------------------------
function pendingScripture(pending) {
  return pending?.scripture || null;
}

function MomentCard({ def, state, onChange }) {
  // The current moment is either a pending decision or the last applied event.
  const pending = state.pending;
  const lastEvent = useMemo(() => {
    for (let i = state.log.length - 1; i >= 0; i--) {
      const e = state.log[i];
      if (e.type !== 'spin' && e.type !== 'path') return e;
    }
    return null;
  }, [state.log]);

  const policy = revealPolicy(state.level);

  if (pending) {
    // Reveal per level: higher levels hide the "second chance" tell, withhold
    // Yahweh's perspective until AFTER the choice, and shuffle the choice order so
    // the Kingdom option isn't simply "the last one". Scoring is unchanged — the
    // display order maps back to the REAL choice index.
    const order = displayOrder(pending.spaceId, state.seed, state.level, pending.choices.length);
    return (
      <div className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
        <Eyebrow>{pending.kind === 'card' ? 'A card from the community' : 'A crossroads'}</Eyebrow>
        <h3 className={`text-lg font-semibold ${T_INK} mt-1`} style={{ fontFamily: 'Fraunces, serif' }}>{pending.title}</h3>
        {pending.body ? <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>{pending.body}</p> : null}
        {policy.showLensBeforeChoice ? <LensCallout>{pending.lens}</LensCallout> : null}
        {policy.showLensBeforeChoice ? <ScriptureCallout scripture={pendingScripture(pending)} /> : null}
        <div className="mt-4 grid grid-cols-1 gap-2">
          {order.map((realIdx) => {
            const c = pending.choices[realIdx];
            const flagRedemption = policy.showRedemptionHint && c.redemption;
            return (
              <button
                key={realIdx}
                onClick={() => onChange(resolveChoice(def, state, realIdx))}
                className={`text-left ${BG_CREAM} border ${BORDER} rounded-lg p-3 hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5"><UiIcon name={flagRedemption ? 'dove' : 'check'} className={flagRedemption ? T_ACCENT : T_GREEN} /></span>
                  <span>
                    <span className={`text-sm font-semibold ${T_INK}`}>{c.label}</span>
                    {c.body ? <span className={`block text-sm ${T_MUTE} mt-0.5`}>{c.body}</span> : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!lastEvent) return null;
  return (
    <div className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
      <Eyebrow>{lastEvent.stage || 'On the road'}</Eyebrow>
      <h3 className={`text-lg font-semibold ${T_INK} mt-1`} style={{ fontFamily: 'Fraunces, serif' }}>{lastEvent.title}</h3>
      {lastEvent.drewCard ? <p className={`text-[0.6875rem] uppercase tracking-wide ${T_ACCENT} mt-0.5`}>{lastEvent.drewCard}</p> : null}
      {lastEvent.body ? <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>{lastEvent.body}</p> : null}
      <LensCallout>{lastEvent.lens}</LensCallout>
      <ScriptureCallout scripture={lastEvent.scripture} />
      {policy.showEffects ? <EffectChips def={def} effects={lastEvent.effects} /> : null}
    </div>
  );
}

// ---- the journey log --------------------------------------------------------
function JourneyLog({ state }) {
  const entries = state.log.filter((e) => e.type !== 'spin').slice(-7).reverse();
  if (!entries.length) return null;
  return (
    <details className={`${BG_CARD} border ${BORDER} rounded-lg p-3`}>
      <summary className={`text-sm font-medium ${T_INK} cursor-pointer`}>Your journey</summary>
      <ul className="mt-2 space-y-1.5">
        {entries.map((e, i) => (
          <li key={i} className={`text-sm ${T_MUTE} flex gap-2`}>
            <span className={T_ACCENT}>&middot;</span>
            <span>
              <span className={T_INK}>{e.title}</span>
              {e.chose ? <span className={T_MUTE}> &mdash; {e.chose}{e.redemption ? ' (a turning back)' : ''}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

// ---- the legacy finish ------------------------------------------------------
function LegacyFinish({ def, state, onPlayAgain, onExit }) {
  const legacy = state.legacy || def.legacy(def, state);
  const totals = computeTotals(def, state);
  return (
    <div>
      <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-5 text-center`}>
        <Eyebrow>Legacy</Eyebrow>
        <h2 className={`text-2xl font-semibold ${T_INK} mt-1`} style={{ fontFamily: 'Fraunces, serif' }}>{legacy.tier}</h2>
        <p className={`text-sm leading-relaxed ${T_INK} mt-2 max-w-prose mx-auto`}>{legacy.headline}</p>
        <FamilyPortrait className="mt-4 border border-[#E8E4DC] max-w-sm mx-auto" />
        <p className={`text-[0.625rem] ${T_MUTE} mt-2`}>The generation you walked for &mdash; and the one you hand it to.</p>
      </div>

      <div className="mt-4">
        <ScriptureCallout scripture={legacy.verse} />
      </div>

      {legacy.passedOn?.length ? (
        <div className={`mt-4 ${BG_CARD} border ${BORDER} rounded-lg p-4`}>
          <div className="flex items-center gap-1.5 mb-2">
            <UiIcon name="users" className={T_MUTE} />
            <Eyebrow>What you pass on</Eyebrow>
          </div>
          <ul className="space-y-1.5">
            {legacy.passedOn.map((s, i) => (
              <li key={i} className={`text-sm leading-relaxed ${T_INK} flex gap-2`}>
                <span className={T_GREEN}><UiIcon name="check" /></span><span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {legacy.note ? (
        <div className={`mt-4 border-l-2 border-[#B85838] pl-3 ${BG_CREAM} py-2 rounded-r`}>
          <p className={`text-sm leading-relaxed italic ${T_INK}`}>{legacy.note}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <Scoreboard def={def} state={state} />
        <p className={`text-[0.6875rem] ${T_MUTE} mt-1 text-center`}>Legacy is weighted toward the things that last &mdash; faith, family and souls above provision (Matthew 6:33). Kingdom-weighted total: {totals.weighted}.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        <button onClick={onPlayAgain} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium`}>Walk it again</button>
        <button onClick={onExit} className={`${BG_CARD} border ${BORDER} ${T_INK} rounded-lg px-4 py-2.5 text-sm font-medium`}>Back to games</button>
      </div>
    </div>
  );
}

// ---- the player -------------------------------------------------------------
export default function GamePlayer({ def, state, onChange, onExit, onPlayAgain }) {
  if (!def || !state) return null;

  if (state.status === 'choosing-path') {
    return (
      <div className="space-y-4">
        <SectionTitle eyebrow={`${def.title} &middot; ${def.subtitle}`}>{def.title}</SectionTitle>
        <PathPicker def={def} state={state} onChange={onChange} />
        <div className="flex">
          <button onClick={onExit} className={`text-sm ${T_MUTE} hover:${T_INK} underline`}>Back to games</button>
        </div>
      </div>
    );
  }

  if (state.status === 'finished') {
    return <LegacyFinish def={def} state={state} onPlayAgain={onPlayAgain} onExit={onExit} />;
  }

  // playing
  const prog = progress(def, state);
  const lastSpin = [...state.log].reverse().find((e) => e.type === 'spin');
  const board = boardFor(def, state.pathId);
  const stage = board[state.position]?.stage || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>{stage || 'On the road'}</Eyebrow>
          <h2 className={`text-lg font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{def.title}</h2>
        </div>
        <button onClick={onExit} className={`text-sm ${T_MUTE} underline whitespace-nowrap`}>Save &amp; exit</button>
      </div>

      {/* progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[0.6875rem] ${T_MUTE}`}>Turn {state.turn}</span>
          <span className={`text-[0.6875rem] ${T_MUTE}`}>{prog.index} / {prog.total}</span>
        </div>
        <div className={`h-1.5 rounded-full ${BG_CREAM} overflow-hidden`}>
          <div className={`h-1.5 rounded-full ${BG_GREEN}`} style={{ width: `${prog.pct}%` }} />
        </div>
      </div>

      <MomentCard def={def} state={state} onChange={onChange} />

      {/* turn control */}
      {!state.pending && (
        <div className="text-center">
          {lastSpin ? <p className={`text-sm ${T_MUTE} mb-2`}>You spun a <span className={`font-semibold ${T_INK}`}>{(lastSpin.title || '').replace('Spin: ', '')}</span>.</p> : null}
          <button
            onClick={() => onChange(takeTurn(def, state))}
            className={`${BG_INK} text-[#FAF8F4] rounded-lg px-6 py-3 text-base font-medium inline-flex items-center gap-2`}
          >
            <UiIcon name="dice" /> Spin the wheel
          </button>
        </div>
      )}

      <Scoreboard def={def} state={state} />
      <JourneyLog state={state} />
    </div>
  );
}
