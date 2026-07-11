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
import AssetAllocator from './games/AssetAllocator.jsx';
import StoryExplorer from './games/StoryExplorer.jsx';
import { START_CASH } from '../lib/games/asset-allocation.js';
import { FamilyPortrait } from './games/GameArt.jsx';
import { GAME_LEVELS, levelMeta } from '../lib/games/difficulty.js';
import { listGames, getGame } from '../lib/games/registry.js';
import { createGame, computeTotals } from '../lib/games/engine.js';
import { codeFromSeed, buildBoardUrl } from '../lib/games/room-code.js';

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
  const [mini, setMini] = useState(null); // an open mini-experience ('steward' | 'story' | null)
  const [level, setLevel] = useState('child'); // age/difficulty, young -> old

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
    const id = addSave({ gameId, state: createGame(def, { seed: freshSeed(), level }), createdAt: now, updatedAt: now });
    if (id) { setActiveSaveId(id); setTab('play'); }
  }

  function resumeGame(saveId) { setActiveSaveId(saveId); setTab('play'); }

  // Open a "Game Night" room on THIS screen (a TV / the church LED wall): mint a
  // code, hand it to the board route, which shows the QR phones scan to join. A
  // standalone boot (main.jsx ?room=), so nothing loads the monolith.
  function startGameNight() {
    const code = codeFromSeed(freshSeed());
    window.location.href = buildBoardUrl(code);
  }

  function handleChange(newState) {
    if (!activeSave || !updateSave) return;
    updateSave(activeSave.id, { state: newState, updatedAt: new Date().toISOString() });
  }

  // ---- an open mini-game takes over the Play tab ----------------------------
  if (tab === 'play' && mini === 'steward') {
    return (
      <div className="mx-auto max-w-2xl px-1 sm:px-0 py-2">
        <div className="flex items-center justify-between gap-3 mb-3">
          <SectionTitle eyebrow="A money mini-game">The Steward&rsquo;s Challenge</SectionTitle>
          <TextSizeControl />
        </div>
        <p className={`text-sm leading-relaxed ${T_MUTE} mb-4`}>
          Christiana has <span className={T_INK}>{'$' + START_CASH.toLocaleString('en-US')}</span>. Buy wisely &mdash; put a little down on the houses you
          want (as low as 5%), spread it across a few, and keep a reserve for when a furnace breaks. It isn&rsquo;t
          about the most doors; it&rsquo;s about stewarding what you were given.
        </p>
        <AssetAllocator onExit={() => setMini(null)} />
      </div>
    );
  }

  // ---- the "Explore Your Story" reflection takes over the Play tab ----------
  if (tab === 'play' && mini === 'story') {
    return (
      <div className="mx-auto max-w-2xl px-1 sm:px-0 py-2">
        <div className="flex items-center justify-end gap-3 mb-3">
          <TextSizeControl />
        </div>
        <StoryExplorer level={level} onExit={() => setMini(null)} />
      </div>
    );
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
      <FamilyPortrait className="mb-3 border border-[#E8E4DC]" />
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
          {/* Age / difficulty — young to old, like the Learn tab's levels. Higher
              levels reveal less, so the choices are a real decision, not obvious. */}
          <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-3`}>
            <div className="flex items-center gap-1.5 mb-2"><UiIcon name="chart" className={T_MUTE} /><Eyebrow>Choose a level</Eyebrow></div>
            <div className="flex flex-wrap gap-1.5">
              {GAME_LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`text-sm rounded-full px-3 py-1.5 border ${level === l.id ? `${BG_INK} text-[#FAF8F4] border-[#1A1815]` : `${BG_CARD} ${T_INK} ${BORDER}`}`}
                >
                  {l.label} <span className={level === l.id ? 'text-[#D8D2C6]' : T_MUTE}>· {l.age}</span>
                </button>
              ))}
            </div>
            <p className={`text-sm leading-relaxed ${T_MUTE} mt-2`}>{levelMeta(level).hint}</p>
          </div>

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

                {/* Game Night: shared big screen + phones as controllers */}
                <div className={`mt-4 pt-4 border-t ${BORDER}`}>
                  <div className="flex items-center gap-2">
                    <UiIcon name="monitor" className={T_ACCENT} />
                    <h4 className={`text-sm font-semibold ${T_INK}`}>Game Night &mdash; play together on the big screen</h4>
                  </div>
                  <p className={`text-sm ${T_MUTE} mt-1`}>
                    Put this on a TV or the church wall. Everyone joins from their phone by scanning a QR code &mdash;
                    the screen is the board; your phone is your seat. Built for family and community game nights.
                  </p>
                  <button onClick={startGameNight} className={`mt-3 ${BG_CARD} border ${BORDER} ${T_INK} rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2`}>
                    <UiIcon name="users" /> Start a Game Night on this screen
                  </button>
                </div>
              </div>
            );
          })}

          {/* Mini-game: the money / asset-stewarding challenge */}
          <div className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
            <div className="flex items-center gap-2">
              <UiIcon name="chart" className={T_ACCENT} />
              <h3 className={`text-lg font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>The Steward&rsquo;s Challenge</h3>
              <span className={`text-[0.625rem] uppercase tracking-wide ${T_ACCENT} ${BG_CREAM} px-1.5 py-0.5 rounded`}>money</span>
            </div>
            <p className={`text-sm ${T_ACCENT} mt-1`}>Real dollars, real houses &mdash; steward $30,000.</p>
            <p className={`text-sm leading-relaxed ${T_MUTE} mt-2`}>
              Christiana has {'$' + START_CASH.toLocaleString('en-US')}. Buy houses with as little as 5% down, split it across a few, watch each
              door&rsquo;s cash flow, and keep a contingency reserve. See how you stewarded it &mdash; measured the way
              Yahweh measures.
            </p>
            <div className="mt-4">
              <button onClick={() => setMini('steward')} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2`}>
                <UiIcon name="chart" /> Take the challenge
              </button>
            </div>
          </div>

          {/* Explore Your Story — read your life by His Word (the L27 question,
              made interactive). Not a competition: a gentle guided reflection. */}
          <div className={`${BG_CARD} border ${BORDER} rounded-lg p-4`}>
            <div className="flex items-center gap-2">
              <UiIcon name="dove" className={T_ACCENT} />
              <h3 className={`text-lg font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>Explore Your Story</h3>
              <span className={`text-[0.625rem] uppercase tracking-wide ${T_ACCENT} ${BG_CREAM} px-1.5 py-0.5 rounded`}>reflect</span>
            </div>
            <p className={`text-sm ${T_ACCENT} mt-1`}>Read your life by His Word &mdash; the Joseph way.</p>
            <p className={`text-sm leading-relaxed ${T_MUTE} mt-2`}>
              The God who documented His own grief keeps a record of your tears too (Psalm 56:8). Bring one real
              memory &mdash; a garden one or a hard one &mdash; and let the Word read your life: where was God, what was
              He preserving, and what comfort can you now give? (Genesis 50:20). Private to your device.
            </p>
            <div className="mt-4">
              <button onClick={() => setMini('story')} className={`${BG_INK} text-[#FAF8F4] rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2`}>
                <UiIcon name="dove" /> Explore your story
              </button>
            </div>
          </div>
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
