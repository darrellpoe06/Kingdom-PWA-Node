// =============================================================================
// Games — the games hub ("our games")
// =============================================================================
// The home for the family's games. It is a CATALOG over lib/games/registry.js +
// the shared player (GamePlayer) + persisted saves, so a second and third game
// is a registry entry, not a new surface. The first game is "Generations:
// Walking in the Way" — an African American life journey measured by Yahweh.
//
// Persistence is local-first via the shell's `saves` prop (the app data store,
// already localStorage-backed and instance-scoped), so a game survives a reload
// and a not-signed-in child can still play. Each engine action persists the next
// pure state to the open save.
//
// Built on shared primitives (SectionTitle, TabScroll, TextSizeControl, UiIcon)
// and theme CLASSES (never inline hex). No device-font emoji; every size is rem.
// =============================================================================
import React, { useState, useMemo } from 'react';
import { SectionTitle, TabScroll } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import TextSizeControl from './TextSizeControl.jsx';
import GamePlayer from './GamePlayer.jsx';
import { listGames, getGame } from '../lib/games/registry.js';
import { createGame, computeTotals } from '../lib/games/engine.js';

const T_INK = 'text-[#1A1815]';
const T_MUTE = 'text-[#5A5751]';
const T_ACCENT = 'text-[#B85838]';
const BG_CARD = 'bg-white';
const BG_CREAM = 'bg-[#FAF8F4]';
const BG_INK = 'bg-[#1A1815]';
const BORDER = 'border-[#E8E4DC]';

function Eyebrow({ children }) {
  return <div className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold ${T_ACCENT}`}>{children}</div>;
}

// A monotonically-varied seed without Math.random brittleness in tests: the
// clock plus a salt. (Component land — Date.now() is allowed here, unlike the
// pure engine which takes the seed as an argument.)
function freshSeed() {
  return (Date.now() ^ (Date.now() << 7)) >>> 0;
}

const TABS = [
  ['play', 'Play'],
  ['how', 'How to play'],
  ['journeys', 'Past journeys'],
];

export default function Games({ saves = [], addSave, updateSave, deleteSave }) {
  const [tab, setTab] = useState('play');
  const [activeSaveId, setActiveSaveId] = useState(null);

  const games = listGames();
  const activeSave = useMemo(() => saves.find((s) => s.id === activeSaveId) || null, [saves, activeSaveId]);

  // The most recent in-progress (not finished) save per game, for "Resume".
  const inProgressByGame = useMemo(() => {
    const m = {};
    for (const s of saves) {
      if (s.state?.status && s.state.status !== 'finished') {
        const prev = m[s.gameId];
        if (!prev || (s.updatedAt || '') > (prev.updatedAt || '')) m[s.gameId] = s;
      }
    }
    return m;
  }, [saves]);

  const finishedSaves = useMemo(
    () => saves.filter((s) => s.state?.status === 'finished').sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [saves],
  );

  function startGame(gameId) {
    const def = getGame(gameId);
    if (!def || !addSave) return;
    const now = new Date().toISOString();
    const id = addSave({ gameId, state: createGame(def, { seed: freshSeed() }), createdAt: now, updatedAt: now });
    if (id) { setActiveSaveId(id); setTab('play'); }
  }

  function resumeGame(saveId) { setActiveSaveId(saveId); setTab('play'); }

  function handleChange(newState) {
    if (!activeSave || !updateSave) return;
    updateSave(activeSave.id, { state: newState, updatedAt: new Date().toISOString() });
  }

  // ---- the open game takes over the Play tab --------------------------------
  if (tab === 'play' && activeSave) {
    const def = getGame(activeSave.gameId);
    return (
      <div className="mx-auto max-w-2xl px-1 sm:px-0 py-2">
        <div className="flex justify-end mb-2"><TextSizeControl /></div>
        <GamePlayer
          def={def}
          state={activeSave.state}
          onChange={handleChange}
          onExit={() => setActiveSaveId(null)}
          onPlayAgain={() => startGame(activeSave.gameId)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-1 sm:px-0 py-2">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle eyebrow="Our games">Games</SectionTitle>
        <TextSizeControl />
      </div>
      <p className={`text-sm leading-relaxed ${T_MUTE} mb-3`}>
        Games that form as they entertain &mdash; built for the whole family, the children most of all
        (train up a child in the way they should go). The first walks an African American life&rsquo;s real
        roads, measured the way Yahweh measures.
      </p>

      <TabScroll className="mb-4">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
            className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${tab === id ? 'border-[#B85838] text-[#1A1815] font-medium' : `border-transparent ${T_MUTE} hover:text-[#1A1815]`}`}
          >
            {label}
          </button>
        ))}
      </TabScroll>

      {tab === 'play' && (
        <div className="space-y-3">
          {games.map((g) => {
            const resume = inProgressByGame[g.id];
            return (
              <div key={g.id} className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
                <div className="flex items-center gap-2">
                  <UiIcon name="dice" className={T_ACCENT} />
                  <h3 className={`text-lg font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{g.title}</h3>
                  <span className={`text-[0.6875rem] ${T_MUTE}`}>&middot; {g.subtitle}</span>
                  {g.status && g.status !== 'live' ? <span className={`text-[0.625rem] uppercase tracking-wide ${T_ACCENT} ${BG_CREAM} px-1.5 py-0.5 rounded`}>{g.status}</span> : null}
                </div>
                {g.tagline ? <p className={`text-sm ${T_ACCENT} mt-1`}>{g.tagline}</p> : null}
                {g.about ? <p className={`text-sm leading-relaxed ${T_MUTE} mt-2`}>{g.about}</p> : null}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {g.categories.map((c) => (
                    <span key={c.key} className={`text-[0.6875rem] px-2 py-0.5 rounded-full border ${BORDER} ${T_INK}`}>{c.label}</span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {resume ? (
                    <>
                      <button onClick={() => resumeGame(resume.id)} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium`}>Resume journey</button>
                      <button onClick={() => startGame(g.id)} className={`${BG_CARD} border ${BORDER} ${T_INK} rounded-lg px-4 py-2.5 text-sm font-medium`}>Start a new one</button>
                    </>
                  ) : (
                    <button onClick={() => startGame(g.id)} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2`}>
                      <UiIcon name="dice" /> Begin the journey
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'how' && <HowToPlay games={games} />}

      {tab === 'journeys' && (
        <PastJourneys
          finishedSaves={finishedSaves}
          onOpen={(id) => resumeGame(id)}
          onDelete={(id) => deleteSave && deleteSave(id)}
        />
      )}
    </div>
  );
}

// ---- How to play ------------------------------------------------------------
function HowToPlay({ games }) {
  const def = games[0];
  return (
    <div className="space-y-4">
      <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-4`}>
        <Eyebrow>The point of the game</Eyebrow>
        <p className={`text-sm leading-relaxed ${T_INK} mt-1`}>
          The Game of Life scores Wealth, Happiness and Knowledge. This one keeps score the way Yahweh does.
          You don&rsquo;t win by ending with the most money &mdash; you finish by what you walked in and what you pass on.
        </p>
      </div>

      <div className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
        <div className="flex items-center gap-1.5 mb-2"><UiIcon name="chart" className={T_MUTE} /><Eyebrow>What you&rsquo;re building</Eyebrow></div>
        <ul className="space-y-2">
          {def.categories.map((c) => (
            <li key={c.key} className="flex gap-2">
              <span className={`text-sm font-semibold ${T_INK} min-w-[7.5rem]`}>{c.label}</span>
              <span className={`text-sm ${T_MUTE}`}>{c.short}</span>
            </li>
          ))}
        </ul>
        <p className={`text-[0.6875rem] ${T_MUTE} mt-2`}>Faith, Family and Souls weigh most; Provision weighs least &mdash; held rightly, it serves the others (Matthew 6:33).</p>
      </div>

      <div className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
        <div className="flex items-center gap-1.5 mb-2"><UiIcon name="pin" className={T_MUTE} /><Eyebrow>How a turn goes</Eyebrow></div>
        <ol className="space-y-1.5">
          {[
            'Choose your road &mdash; college, a trade, a business, or service. No wrong door.',
            'Spin the wheel and move along the journey, stage by stage.',
            'Each space speaks: a moment of life, the Word, and Yahweh’s perspective on it.',
            'At a crossroads you choose. Some choices cost now and pay forever; some do the reverse.',
            'A crossroads is also a second chance: the road home is always open (this is grace).',
            'At the end, your legacy is read — not your bank balance, but your faithfulness and what you hand on.',
          ].map((s, i) => (
            <li key={i} className={`text-sm leading-relaxed ${T_INK} flex gap-2`}>
              <span className={`${T_ACCENT} font-semibold`}>{i + 1}.</span><span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={`border-l-2 border-[#B85838] pl-3 ${BG_CREAM} py-2 rounded-r`}>
        <div className="flex items-center gap-1.5 mb-1"><UiIcon name="dove" className={T_ACCENT} /><span className={`text-[0.625rem] uppercase tracking-[0.2em] font-semibold ${T_ACCENT}`}>The heart of it</span></div>
        <p className={`text-sm leading-relaxed italic ${T_INK}`}>
          The obstacles are real &mdash; and faced with dignity. The triumphs are real too. Through all of it,
          the game points to the One who measures a life by love, faithfulness, and the generations it blesses.
        </p>
      </div>
    </div>
  );
}

// ---- Past journeys (finished games + their legacy) --------------------------
function PastJourneys({ finishedSaves, onOpen, onDelete }) {
  if (!finishedSaves.length) {
    return (
      <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-6 text-center`}>
        <p className={`text-sm ${T_MUTE}`}>No journeys finished yet. Begin one, and your legacy will be recorded here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {finishedSaves.map((s) => {
        const def = getGame(s.gameId);
        const legacy = s.state?.legacy;
        const totals = def ? computeTotals(def, s.state) : { weighted: 0 };
        return (
          <div key={s.id} className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <Eyebrow>{def?.title || s.gameId} &middot; legacy</Eyebrow>
                <h3 className={`text-base font-semibold ${T_INK} mt-0.5`} style={{ fontFamily: 'Fraunces, serif' }}>{legacy?.tier || 'A journey'}</h3>
              </div>
              <span className={`text-[0.6875rem] ${T_MUTE} whitespace-nowrap`}>{(s.updatedAt || '').slice(0, 10)}</span>
            </div>
            {legacy?.headline ? <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>{legacy.headline}</p> : null}
            <p className={`text-[0.6875rem] ${T_MUTE} mt-2`}>Kingdom-weighted total: <span className={T_INK}>{totals.weighted}</span></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onOpen(s.id)} className={`${BG_CARD} border ${BORDER} ${T_INK} rounded-lg px-3 py-2 text-sm font-medium`}>Open</button>
              <button onClick={() => onDelete(s.id)} className={`text-sm ${T_MUTE} underline px-2`}>Remove</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
