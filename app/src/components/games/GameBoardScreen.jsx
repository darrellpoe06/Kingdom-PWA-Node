// =============================================================================
// games/GameBoardScreen.jsx — the BIG SCREEN (TV / church LED wall)
// =============================================================================
// The shared board everyone in the room watches. It is the HOST: it holds the one
// authoritative match (./match.js runs only here) and broadcasts every change to
// the phones (./realtime-room.js). Phones are the controllers.
//
// Readability is the whole job: this is seen from across a room, possibly on the
// 16:9 LED wall (project-colg-video-wall). So — dark, high-contrast ground; very
// large type (Tailwind text scale + rem only, never fixed px, per the consistency
// guard); token colors chosen for AA contrast on the dark ground (legibility
// guard). No device-font emoji; UiIcon SVGs only.
//
// Ties Universal Present mode: this is the game presented to an audience and is
// runnable on the church wall for family/community game nights.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import UiIcon from '../UiIcon.jsx';
import {
  createMatch, applyAction, setConnected, currentActor, standings, boardLength,
  getToken,
} from '../../lib/games/match.js';
import { boardFor, lastSpin } from '../../lib/games/engine.js';
import { buildJoinUrl, seedFromCode } from '../../lib/games/room-code.js';
import { hostRoom } from '../../lib/games/realtime-room.js';
import { resolveScripture } from '../../lib/games/scripture-link.js';
import { FamilyPortrait } from './GameArt.jsx';
import HeritageGallery from './HeritageGallery.jsx';
import SpinnerWheel from './SpinnerWheel.jsx';

const INK = '#12100E';
const CREAM = '#FAF8F4';
const MUTE = '#A8A29A';

// Stage -> accent, so the journey visibly moves through seasons of a life.
const STAGE_COLOR = {
  'Young Adult': '#67e8f9',
  'Building Years': '#86efac',
  'Establishing': '#fde68a',
  'Mid-Life': '#fb923c',
  'Elder': '#c4b5fd',
  'Legacy': '#f4b740',
};
const stageColor = (s) => STAGE_COLOR[s] || '#8b8680';

function initials(name) {
  return (name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function GameBoardScreen({ def, code }) {
  const matchRef = useRef(null);
  const hostRef = useRef(null);
  const [match, setMatch] = useState(null);

  const commit = useCallback((next) => {
    if (!next || next === matchRef.current || next.error) return;
    matchRef.current = next;
    setMatch(next);
    hostRef.current?.broadcastState(next);
  }, []);

  const dispatch = useCallback((action) => {
    const cur = matchRef.current;
    if (!cur) return;
    const next = applyAction(def, cur, action);
    if (next === cur || next.error) {
      // No-op or rejected: re-broadcast the truth so a confused phone re-syncs.
      hostRef.current?.broadcastState(cur);
      return;
    }
    commit(next);
  }, [def, commit]);

  const reconcilePresence = useCallback((ids) => {
    const cur = matchRef.current;
    if (!cur) return;
    let next = cur;
    for (const p of cur.players) {
      const shouldBe = ids.includes(p.id);
      if (p.connected !== shouldBe) next = setConnected(next, p.id, shouldBe);
    }
    if (next !== cur) commit(next);
  }, [commit]);

  useEffect(() => {
    const initial = createMatch(def, { code, seed: seedFromCode(code), now: Date.now() });
    matchRef.current = initial;
    setMatch(initial);
    const host = hostRoom(code, {
      onAction: (action) => dispatch(action),
      onPresence: (ids) => reconcilePresence(ids),
    });
    host.onSnapshotRequested = () => host.broadcastState(matchRef.current);
    hostRef.current = host;
    host.broadcastState(initial);
    return () => { host.close(); hostRef.current = null; };
  }, [def, code, dispatch, reconcilePresence]);

  const joinUrl = useMemo(() => buildJoinUrl(code), [code]);
  const track = useMemo(() => {
    const opening = def.paths[0]?.opening || [];
    const total = boardLength(def);
    return Array.from({ length: total }, (_, i) => {
      if (i < opening.length) return { stage: opening[i].stage, opening: true };
      const sp = boardFor(def, def.paths[0].id)[i];
      return { stage: sp?.stage, title: sp?.title, type: sp?.type };
    });
  }, [def]);

  if (!match) return <Shell><p style={{ color: MUTE }}>Setting up the room…</p></Shell>;

  if (match.phase === 'lobby') return <Lobby def={def} match={match} code={code} joinUrl={joinUrl} onStart={() => dispatch({ type: 'start' })} />;
  if (match.phase === 'finished') return <Finish def={def} match={match} onAgain={() => dispatch({ type: 'play-again' })} />;
  return <Playing def={def} match={match} code={code} joinUrl={joinUrl} track={track} />;
}

// ---- shells & shared bits ---------------------------------------------------
function Shell({ children }) {
  return (
    <div className="min-h-screen w-full px-6 py-6 sm:px-10 sm:py-8" style={{ background: INK, color: CREAM, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {children}
    </div>
  );
}

function TokenDot({ tokenId, name, size = 'h-10 w-10', ring = false }) {
  const t = getToken(tokenId);
  const c = t ? t.color : '#8b8680';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${size}`}
      style={{ background: c, color: INK, boxShadow: ring ? `0 0 0 0.25rem ${c}55` : 'none' }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

function Title({ children, className = '' }) {
  return <h1 className={`font-semibold ${className}`} style={{ fontFamily: 'Fraunces, serif' }}>{children}</h1>;
}

// ---- LOBBY ------------------------------------------------------------------
function Lobby({ def, match, code, joinUrl, onStart }) {
  return (
    <Shell>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-6">
          <div className="text-sm uppercase tracking-[0.35em]" style={{ color: '#f4b740' }}>Game Night</div>
          <Title className="text-4xl sm:text-6xl mt-2">{def.title}</Title>
          <p className="text-lg sm:text-2xl mt-3" style={{ color: MUTE }}>{def.subtitle}</p>
          <FamilyPortrait className="mt-5 mx-auto max-w-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Join panel */}
          <div className="rounded-3xl p-8 text-center" style={{ background: '#1d1a16' }}>
            <div className="bg-white inline-block rounded-2xl p-4">
              <QRCodeSVG value={joinUrl} size={260} level="M" includeMargin={false} />
            </div>
            <p className="mt-5 text-xl sm:text-2xl" style={{ color: CREAM }}>Scan with your phone to join</p>
            <p className="mt-1 text-base" style={{ color: MUTE }}>or open the app and enter this code:</p>
            <div className="mt-3 inline-flex items-center gap-3 rounded-2xl px-6 py-3" style={{ background: '#12100E' }}>
              <span className="font-mono tracking-[0.3em] text-5xl sm:text-7xl font-bold" style={{ color: '#f4b740' }}>{code}</span>
            </div>
          </div>

          {/* Players + start */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UiIcon name="users" className="" />
              <h2 className="text-2xl font-semibold">Players in the room ({match.players.length})</h2>
            </div>
            {match.players.length === 0 ? (
              <p className="text-lg" style={{ color: MUTE }}>Waiting for the first phone to join…</p>
            ) : (
              <ul className="space-y-3">
                {match.players.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 rounded-2xl px-4 py-3" style={{ background: '#1d1a16' }}>
                    <TokenDot tokenId={p.token} name={p.name} />
                    <span className="text-2xl font-medium">{p.name}</span>
                    {!p.connected && <span className="ml-auto text-sm" style={{ color: MUTE }}>reconnecting…</span>}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={onStart}
              disabled={match.players.length === 0}
              className="mt-6 w-full rounded-2xl px-6 py-5 text-2xl font-semibold disabled:opacity-40"
              style={{ backgroundColor: '#f4b740', color: INK }}
            >
              Start the journey
            </button>
            <p className="mt-3 text-center text-sm" style={{ color: MUTE }}>
              The first player can also start from their phone. Everyone walks the same board, measured the way Yahweh measures.
            </p>
          </div>
        </div>

        {/* the real foundation under the game — the family photos Darrell declared (lib/games/heritage.js) */}
        <HeritageGallery on="dark" className="mt-8" />
      </div>
    </Shell>
  );
}

// ---- PLAYING ----------------------------------------------------------------
function Playing({ def, match, code, joinUrl, track }) {
  const actor = currentActor(match);
  const ranks = standings(def, match);
  const acting = actor ? match.players.find((p) => p.id === actor.playerId) : null;
  const token = acting ? getToken(acting.token) : null;
  const accent = token ? token.color : '#f4b740';

  // The ACTUAL spinner the whole room watches (Christyn, 2026-07-07): diff each
  // snapshot for a NEW spin log entry and let the wheel decelerate onto the
  // engine's real number. The first snapshot only primes the ledger — a board
  // that reloads mid-game never replays a historical spin.
  const spinSeenRef = useRef(null); // Map playerId -> last seen spin log index
  const [spin, setSpin] = useState(null); // { name, token, value, seq }
  const [restedSeq, setRestedSeq] = useState(null);
  useEffect(() => {
    const first = spinSeenRef.current == null;
    const map = first ? new Map() : spinSeenRef.current;
    let latest = null;
    for (const p of match.players) {
      const s = lastSpin(p.game);
      const idx = s ? s.index : -1;
      const prev = map.has(p.id) ? map.get(p.id) : -1;
      if (!first && idx > prev && s && s.value != null) latest = { player: p, spin: s };
      map.set(p.id, idx);
    }
    spinSeenRef.current = map;
    if (latest) {
      setSpin({
        name: latest.player.name,
        token: latest.player.token,
        value: latest.spin.value,
        seq: `${latest.player.id}:${latest.spin.index}`,
      });
    }
  }, [match]);

  // The moment on the floor: a pending decision, else the space the actor is on.
  const game = acting ? acting.game : null;
  const space = game && game.pathId != null && game.position >= 0
    ? boardFor(def, game.pathId)[game.position] : null;
  const pending = game?.pending || null;
  const moment = pending
    ? { title: pending.title, body: pending.body, scripture: pending.scripture, choices: pending.choices, kind: pending.kind }
    : space
      ? { title: space.title, body: space.body, scripture: space.scripture, lens: space.lens }
      : null;
  const verse = moment?.scripture ? resolveScripture(moment.scripture) : null;

  return (
    <Shell>
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <Title className="text-2xl sm:text-3xl">{def.title}</Title>
          <div className="flex items-center gap-3 text-sm" style={{ color: MUTE }}>
            <span>Round {match.round}</span>
            <span className="rounded-lg px-3 py-1 font-mono tracking-widest" style={{ background: '#1d1a16', color: '#f4b740' }}>Join: {code}</span>
            <span className="bg-white rounded p-1"><QRCodeSVG value={joinUrl} size={44} level="L" /></span>
          </div>
        </div>

        {/* the track */}
        <Track def={def} track={track} ranks={ranks} />

        {/* the current moment */}
        <div className="mt-5 rounded-3xl p-6 sm:p-7" style={{ background: '#1d1a16', borderLeft: `0.5rem solid ${accent}` }}>
          <div className="flex flex-wrap items-start gap-6">
          <div className="flex-1" style={{ minWidth: '18rem' }}>
          {actor ? (
            <>
              <div className="flex items-center gap-3">
                <TokenDot tokenId={acting.token} name={acting.name} ring />
                <div>
                  <div className="text-2xl sm:text-3xl font-semibold">{acting.name}&rsquo;s turn</div>
                  <div className="text-base" style={{ color: MUTE }}>
                    {actor.need === 'choose-path' && 'Choosing a road on their phone…'}
                    {actor.need === 'spin' && 'Tap SPIN on your phone'}
                    {actor.need === 'decide' && 'A crossroads — choose on your phone'}
                  </div>
                </div>
              </div>
              {moment && (
                <div className="mt-4">
                  <div className="text-xl sm:text-2xl font-semibold" style={{ color: CREAM }}>{moment.title}</div>
                  {moment.body && <p className="mt-1 text-lg" style={{ color: '#d6d1c8' }}>{moment.body}</p>}
                  {moment.lens && (
                    <p className="mt-3 flex items-start gap-2 text-lg italic" style={{ color: '#c4b5fd' }}>
                      <UiIcon name="dove" className="mt-1 shrink-0" /> {moment.lens}
                    </p>
                  )}
                  {verse?.text && (
                    <p className="mt-3 text-lg" style={{ color: '#86efac' }}>
                      <span className="font-semibold">{verse.ref}</span> <span style={{ color: MUTE }}>({verse.translation})</span> — &ldquo;{verse.text}&rdquo;
                    </p>
                  )}
                  {moment.choices && (
                    <ol className="mt-4 grid gap-2">
                      {moment.choices.map((c, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 text-lg" style={{ background: '#12100E' }}>
                          <span className="font-bold" style={{ color: accent }}>{i + 1}</span>
                          <span>{c.label}{c.redemption && <span className="ml-2 text-sm" style={{ color: '#f4b740' }}>· a second chance</span>}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-xl" style={{ color: MUTE }}>Waiting for a player to reconnect…</div>
          )}
          </div>

          {/* the wheel — every spin turns HERE, where the whole room sees it */}
          <div className="flex flex-col items-center shrink-0 mx-auto">
            <SpinnerWheel
              value={spin ? spin.value : null}
              spinSeq={spin ? spin.seq : null}
              animateFirst
              size="11rem"
              onRest={() => setRestedSeq(spin ? spin.seq : null)}
            />
            <div className="mt-3 text-center">
              {spin ? (
                restedSeq === spin.seq ? (
                  <div className="text-xl font-semibold" style={{ color: CREAM }}>
                    {spin.name} spun <span style={{ color: getToken(spin.token)?.color || '#f4b740' }}>{spin.value}</span>
                  </div>
                ) : (
                  <div className="text-xl" style={{ color: MUTE }}>Spinning&hellip;</div>
                )
              ) : (
                <div className="text-base" style={{ color: MUTE }}>The wheel awaits the first spin</div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* scoreboard */}
        <Scoreboard def={def} ranks={ranks} activeId={actor?.playerId} />
      </div>
    </Shell>
  );
}

function Track({ def, track, ranks }) {
  // Pieces by board index, so several players on the same square fan out.
  const byIndex = {};
  for (const r of ranks) {
    if (r.position < 0) continue;
    (byIndex[r.position] = byIndex[r.position] || []).push(r);
  }
  return (
    <div className="rounded-3xl p-4 overflow-x-auto" style={{ background: '#17140f' }}>
      <div className="flex gap-1.5 min-w-max">
        {track.map((sq, i) => {
          const c = stageColor(sq.stage);
          const decision = sq.type === 'crossroads' || sq.type === 'invest' || sq.type === 'obstacle';
          const finish = sq.type === 'finish';
          const here = byIndex[i] || [];
          return (
            <div key={i} className="flex flex-col items-center" style={{ width: '2.5rem' }}>
              <div className="h-12 w-full flex items-end justify-center gap-0.5 pb-1">
                {here.map((r) => (
                  <span key={r.id} className="inline-flex items-center justify-center rounded-full font-bold"
                    style={{ backgroundColor: getToken(r.token)?.color || '#ffffff', color: getToken(r.token)?.ink, height: '1.4rem', width: '1.4rem', fontSize: '0.65rem' }}
                    title={r.name}>{initials(r.name)}</span>
                ))}
              </div>
              <div className="w-full rounded-md" style={{ height: '0.9rem', background: c, opacity: here.length ? 1 : 0.55, outline: decision ? '0.15rem solid #f4b740' : finish ? '0.15rem solid #fff' : 'none' }} />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: MUTE }}>
        {Object.entries(STAGE_COLOR).map(([s, c]) => (
          <span key={s} className="inline-flex items-center gap-1.5"><span className="rounded-sm" style={{ height: '0.6rem', width: '0.6rem', background: c }} />{s}</span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="rounded-sm" style={{ height: '0.6rem', width: '0.6rem', outline: '0.12rem solid #f4b740' }} />crossroads</span>
      </div>
    </div>
  );
}

function Scoreboard({ def, ranks, activeId }) {
  const max = Math.max(6, ...ranks.flatMap((r) => def.categories.map((c) => r.scores[c.key] || 0)));
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ranks.map((r, idx) => {
        const c = getToken(r.token)?.color || '#fff';
        const active = r.id === activeId;
        return (
          <div key={r.id} className="rounded-2xl p-4" style={{ background: active ? '#241f18' : '#1d1a16', outline: active ? `0.2rem solid ${c}` : 'none' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold w-6 text-center" style={{ color: MUTE }}>{idx + 1}</span>
              <TokenDot tokenId={r.token} name={r.name} size="h-9 w-9" />
              <span className="text-xl font-semibold truncate">{r.name}</span>
              {r.done && <span className="text-xs ml-1" style={{ color: '#86efac' }}>finished</span>}
              {!r.connected && <span className="text-xs ml-1" style={{ color: MUTE }}>away</span>}
              <span className="ml-auto text-2xl font-bold" style={{ color: c }}>{r.weighted}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {def.categories.map((cat) => {
                const v = r.scores[cat.key] || 0;
                return (
                  <div key={cat.key} className="flex items-center gap-2">
                    <span className="text-xs w-16 shrink-0" style={{ color: MUTE }}>{cat.label}</span>
                    <span className="flex-1 rounded-full overflow-hidden" style={{ height: '0.5rem', background: '#12100E' }}>
                      <span className="block h-full rounded-full" style={{ width: `${Math.round((v / max) * 100)}%`, background: c }} />
                    </span>
                    <span className="text-xs w-5 text-right tabular-nums" style={{ color: CREAM }}>{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- FINISH -----------------------------------------------------------------
function Finish({ def, match, onAgain }) {
  const ranks = standings(def, match);
  return (
    <Shell>
      <div className="mx-auto max-w-5xl text-center">
        <div className="text-sm uppercase tracking-[0.35em]" style={{ color: '#f4b740' }}>The journeys are finished</div>
        <Title className="text-4xl sm:text-6xl mt-2">A Legacy, measured by Yahweh</Title>
        <p className="text-lg mt-3" style={{ color: MUTE }}>Not by what was kept — by what was walked in and passed on (Matthew 25:21).</p>
        <FamilyPortrait className="mt-5 mx-auto max-w-xl" />

        <ol className="mt-8 space-y-4 text-left">
          {ranks.map((r, idx) => {
            const c = getToken(r.token)?.color || '#fff';
            const lg = r.legacy;
            return (
              <li key={r.id} className="rounded-3xl p-6" style={{ background: '#1d1a16', borderLeft: `0.5rem solid ${c}` }}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold w-10 text-center" style={{ color: idx === 0 ? '#f4b740' : MUTE }}>{idx + 1}</span>
                  <TokenDot tokenId={r.token} name={r.name} />
                  <span className="text-2xl sm:text-3xl font-semibold">{r.name}</span>
                  <span className="ml-auto text-3xl font-bold" style={{ color: c }}>{r.weighted}</span>
                </div>
                {lg && (
                  <div className="mt-3 pl-14">
                    <div className="text-xl font-semibold" style={{ color: CREAM, fontFamily: 'Fraunces, serif' }}>{lg.tier}</div>
                    {lg.headline && <p className="mt-1 text-lg" style={{ color: '#d6d1c8' }}>{lg.headline}</p>}
                    {Array.isArray(lg.passedOn) && lg.passedOn.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {lg.passedOn.map((p, i) => <li key={i} className="text-sm rounded-full px-3 py-1" style={{ background: '#12100E', color: '#86efac' }}>{p}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <button onClick={onAgain} className="mt-8 rounded-2xl px-8 py-5 text-2xl font-semibold inline-flex items-center gap-3" style={{ backgroundColor: '#f4b740', color: INK }}>
          <UiIcon name="dice" /> Walk it again
        </button>
      </div>
    </Shell>
  );
}
