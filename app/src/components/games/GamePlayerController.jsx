// =============================================================================
// games/GamePlayerController.jsx — a PHONE becomes a player's seat
// =============================================================================
// Opened by scanning the QR on the big screen (…/?room=CODE). This is a GUEST: it
// never runs the rules — it renders the latest authoritative snapshot the board
// broadcasts and sends ACTION REQUESTS ("I'm joining", "I spun", "I chose road 2").
// The board (host) validates and applies every action; this screen just asks.
//
// Identity is persisted per-room in localStorage so a dropped phone re-joins as
// the SAME seat (its journey is preserved on the host) — drop/rejoin is graceful
// (feedback-unbreakable-by-any-human-hardening). Consequential moves (your road,
// a crossroads) are preview-then-execute: tap to weigh it, then confirm
// (feedback-wired-buttons-preview-then-execute). No copy-paste; every button is
// wired to a real action.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import { currentActor, standings, TOKENS, getToken } from '../../lib/games/match.js';
import { boardFor, computeTotals, lastSpin } from '../../lib/games/engine.js';
import { joinRoom } from '../../lib/games/realtime-room.js';
import { resolveScripture } from '../../lib/games/scripture-link.js';
import SpinnerWheel from './SpinnerWheel.jsx';

const INK = '#12100E';
const CREAM = '#FAF8F4';
const MUTE = '#8A857C';

const storeKey = (code) => `poetech_gameplayer_${code}`;

function loadSaved(code) {
  try {
    const raw = localStorage.getItem(storeKey(code));
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  // A fresh per-room device id (no Math.random reliance for correctness — this is
  // just a local seat id, not game state).
  const id = `p_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  return { id, name: '', token: '', joined: false };
}
function persist(code, me) {
  try { localStorage.setItem(storeKey(code), JSON.stringify(me)); } catch { /* ignore */ }
}

export default function GamePlayerController({ def, code }) {
  const [me, setMe] = useState(() => loadSaved(code));
  const meRef = useRef(me);
  meRef.current = me;
  const roomRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [sel, setSel] = useState(null); // preview selection {kind, value}

  useEffect(() => {
    const room = joinRoom(code, {
      playerId: me.id,
      name: meRef.current.name,
      onState: setMatch,
      onStatus: (s) => {
        setStatus(s === 'SUBSCRIBED' ? 'live' : s === 'CLOSED' ? 'closed' : 'connecting');
        // On (re)connect, re-announce our join so the host re-seats us (idempotent).
        if (s === 'SUBSCRIBED') {
          const m = meRef.current;
          if (m.joined && m.name && m.token) {
            room.sendAction({ type: 'join', id: m.id, name: m.name, token: m.token });
          }
        }
      },
    });
    roomRef.current = room;
    return () => { room.close(); roomRef.current = null; };
  }, [code, me.id]);

  const send = useCallback((action) => { roomRef.current?.sendAction(action); }, []);

  const myPlayer = match?.players.find((p) => p.id === me.id) || null;
  const actor = match ? currentActor(match) : null;
  const myTurn = actor && actor.playerId === me.id;

  // Clear any stale preview when the turn/pending changes.
  useEffect(() => { setSel(null); }, [actor?.playerId, actor?.need, myPlayer?.game?.pending]);

  // ---- the actual spinner (Christyn, 2026-07-07) ----------------------------
  // Tap SPIN -> the wheel turns (indeterminate) while the HOST resolves the
  // authoritative spin; when the snapshot lands, the wheel decelerates onto the
  // REAL number. Presentation over real state — never a second random.
  const [spinFx, setSpinFx] = useState(null); // {phase:'waiting'} | {phase:'landing', value, seq}
  const spinSeenRef = useRef(null);           // my last seen spin log index
  useEffect(() => {
    const g = myPlayer?.game;
    if (!g) { spinSeenRef.current = null; return; }
    const s = lastSpin(g);
    const idx = s ? s.index : -1;
    if (spinSeenRef.current == null) { spinSeenRef.current = idx; return; } // first snapshot: never replay history
    if (idx > spinSeenRef.current) {
      spinSeenRef.current = idx;
      if (s && s.value != null) setSpinFx({ phase: 'landing', value: s.value, seq: idx });
    } else if (idx < spinSeenRef.current) {
      spinSeenRef.current = idx; // play-again started a fresh journey log
    }
  }, [match, myPlayer]);
  const startSpin = useCallback(() => {
    setSpinFx({ phase: 'waiting' });
    roomRef.current?.sendAction({ type: 'spin', playerId: meRef.current.id });
  }, []);

  function doJoin(name, token) {
    const next = { id: me.id, name, token, joined: true };
    setMe(next); persist(code, next);
    send({ type: 'join', id: me.id, name, token });
  }

  // ---- not joined yet: the seat form ----
  if (!myPlayer || !me.joined) {
    return <JoinForm def={def} match={match} status={status} initialName={me.name} onJoin={doJoin} />;
  }

  const isHost = match.order[0] === me.id; // first to join holds table controls

  return (
    <Frame status={status}>
      <Header def={def} me={me} token={myPlayer.token} />

      {match.phase === 'lobby' && (
        <Lobby match={match} isHost={isHost} onStart={() => send({ type: 'start' })} />
      )}

      {match.phase === 'playing' && (
        myTurn
          ? <MyTurn def={def} actor={actor} myPlayer={myPlayer} sel={sel} setSel={setSel} send={send} onSpin={startSpin} />
          : <WaitingTurn def={def} match={match} actor={actor} myPlayer={myPlayer} />
      )}

      {spinFx && <SpinOverlay fx={spinFx} onDone={() => setSpinFx(null)} />}

      {match.phase === 'finished' && (
        <FinishedSelf def={def} match={match} myId={me.id} isHost={isHost} onAgain={() => send({ type: 'play-again' })} />
      )}

      {isHost && match.phase === 'playing' && actor && actor.playerId !== me.id && (
        <button onClick={() => send({ type: 'skip' })} className="mt-6 w-full text-sm underline" style={{ color: MUTE }}>
          Skip {match.players.find((p) => p.id === actor.playerId)?.name} (they stepped away)
        </button>
      )}
    </Frame>
  );
}

// ---- chrome -----------------------------------------------------------------
function Frame({ status, children }) {
  return (
    <div className="min-h-screen px-4 py-5" style={{ background: INK, color: CREAM, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-end mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: status === 'live' ? '#86efac' : '#f4b740' }}>
            <span className="rounded-full" style={{ height: '0.5rem', width: '0.5rem', background: status === 'live' ? '#86efac' : '#f4b740' }} />
            {status === 'live' ? 'Connected' : status === 'closed' ? 'Disconnected' : 'Connecting…'}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Header({ def, me, token }) {
  const t = getToken(token);
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="inline-flex items-center justify-center rounded-full h-11 w-11 font-bold" style={{ backgroundColor: t?.color || '#ffffff', color: t?.ink }}>
        {(me.name || '?').slice(0, 2).toUpperCase()}
      </span>
      <div>
        <div className="text-lg font-semibold">{me.name}</div>
        <div className="text-xs" style={{ color: MUTE }}>{def.title}</div>
      </div>
    </div>
  );
}

// ---- join form --------------------------------------------------------------
function JoinForm({ def, match, status, initialName, onJoin }) {
  const [name, setName] = useState(initialName || '');
  const [token, setToken] = useState('');
  // Tokens held by CONNECTED players are taken; a disconnected seat's token stays
  // pickable so a returning player can reclaim their piece (and their points).
  const taken = useMemo(() => new Set((match?.players || []).filter((p) => p.connected).map((p) => p.token)), [match]);
  const full = match && match.players.length >= match.maxPlayers;
  const finished = match && match.phase === 'finished';
  const inProgress = match && match.phase === 'playing';
  // Late joiners are welcome mid-game; only a finished or full table turns you away.
  const canJoin = name.trim().length > 0 && token && !taken.has(token) && !full && !finished;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: INK, color: CREAM, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-md">
        <div className="text-xs uppercase tracking-[0.3em] mb-1" style={{ color: '#f4b740' }}>Game Night</div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: 'Fraunces, serif' }}>{def.title}</h1>
        <p className="text-sm mt-2" style={{ color: MUTE }}>Take a seat. Pick your name and a token — your piece on the big screen.</p>

        {inProgress && !full && <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: '#16221a', color: '#86efac' }}>This game is already underway — jump in! Pick your name and token and you&rsquo;ll join on the next round. Coming back after your phone went off? Pick the same token to get your seat and points back.</p>}
        {finished && <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: '#2a1c16', color: '#fda4af' }}>These journeys have finished. Ask the host to start a new one.</p>}
        {full && !finished && <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: '#2a1c16', color: '#fda4af' }}>The table is full ({match.maxPlayers} players).</p>}

        <label className="block mt-5 text-sm" style={{ color: MUTE }}>Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          placeholder="e.g. Darrell"
          className="mt-1 w-full rounded-xl px-4 py-3 text-lg"
          style={{ background: '#1d1a16', color: CREAM, border: '1px solid #34302a' }}
        />

        <div className="mt-5 text-sm" style={{ color: MUTE }}>Pick your token</div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TOKENS.map((t) => {
            const isTaken = taken.has(t.id);
            const active = token === t.id;
            return (
              <button
                key={t.id}
                disabled={isTaken}
                onClick={() => setToken(t.id)}
                className="rounded-xl py-3 flex flex-col items-center gap-1 disabled:opacity-30"
                style={{ background: active ? '#2a251d' : '#1d1a16', outline: active ? `0.18rem solid ${t.color}` : 'none' }}
              >
                <span className="rounded-full h-7 w-7" style={{ background: t.color }} />
                <span className="text-[0.7rem]" style={{ color: isTaken ? MUTE : CREAM }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onJoin(name.trim(), token)}
          disabled={!canJoin}
          className="mt-6 w-full rounded-xl py-4 text-lg font-semibold disabled:opacity-40"
          style={{ backgroundColor: '#f4b740', color: INK }}
        >
          Join the game
        </button>
        <p className="mt-3 text-center text-xs" style={{ color: MUTE }}>{status === 'live' ? 'Connected to the room.' : 'Connecting to the room…'}</p>
      </div>
    </div>
  );
}

// ---- lobby (joined) ---------------------------------------------------------
function Lobby({ match, isHost, onStart }) {
  return (
    <div>
      <div className="rounded-2xl p-4" style={{ background: '#1d1a16' }}>
        <div className="text-sm font-semibold mb-2">In the room ({match.players.length})</div>
        <ul className="space-y-2">
          {match.players.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="rounded-full h-5 w-5" style={{ background: getToken(p.token)?.color || '#fff' }} />
              <span>{p.name}</span>
              {!p.connected && <span className="text-xs ml-auto" style={{ color: MUTE }}>away</span>}
            </li>
          ))}
        </ul>
      </div>
      {isHost ? (
        <button onClick={onStart} disabled={match.players.length === 0} className="mt-5 w-full rounded-xl py-4 text-lg font-semibold disabled:opacity-40" style={{ backgroundColor: '#f4b740', color: INK }}>
          Start the journey
        </button>
      ) : (
        <p className="mt-5 text-center text-sm" style={{ color: MUTE }}>Waiting for the host to start…</p>
      )}
    </div>
  );
}

// ---- effect chips (preview) -------------------------------------------------
function EffectChips({ def, effects }) {
  if (!effects) return null;
  const entries = def.categories.filter((c) => typeof effects[c.key] === 'number' && effects[c.key] !== 0);
  if (!entries.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map((c) => {
        const d = effects[c.key];
        const up = d > 0;
        return (
          <span key={c.key} className="text-xs rounded-full px-2 py-0.5" style={{ background: '#12100E', color: up ? '#86efac' : '#fda4af' }}>
            {up ? '+' : ''}{d} {c.label}
          </span>
        );
      })}
    </div>
  );
}

// ---- the spin overlay ---------------------------------------------------------
// Fills the phone while the wheel turns: indeterminate while the host resolves,
// then the wheel lands on the real number and the overlay steps aside.
function SpinOverlay({ fx, onDone }) {
  const [rested, setRested] = useState(false);
  // Watchdog: if the host never answers (dropped action / not our turn after
  // all), the overlay must never trap the phone.
  useEffect(() => {
    if (fx.phase !== 'waiting') return undefined;
    const t = setTimeout(onDone, 8000);
    return () => clearTimeout(t);
  }, [fx.phase, onDone]);
  useEffect(() => {
    if (!rested) return undefined;
    const t = setTimeout(onDone, 1300);
    return () => clearTimeout(t);
  }, [rested, onDone]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: 'rgba(18, 16, 14, 0.95)' }}>
      <SpinnerWheel
        value={fx.phase === 'landing' ? fx.value : null}
        spinSeq={fx.phase === 'landing' ? fx.seq : null}
        spinning={fx.phase === 'waiting'}
        animateFirst
        size="13rem"
        onRest={() => setRested(true)}
      />
      <p className="mt-6 text-2xl font-semibold" style={{ color: CREAM }} aria-live="polite">
        {rested ? `You spun a ${fx.value}` : 'Spinning…'}
      </p>
      {rested && <p className="text-sm mt-1" style={{ color: '#A8A29A' }}>Watch the big screen.</p>}
    </div>
  );
}

// ---- my turn ----------------------------------------------------------------
function MyTurn({ def, actor, myPlayer, sel, setSel, send, onSpin }) {
  const game = myPlayer.game;

  if (actor.need === 'choose-path') {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-1">Choose your road</h2>
        <p className="text-sm mb-3" style={{ color: MUTE }}>Where your journey begins. Tap one to weigh it, then confirm.</p>
        <div className="space-y-2">
          {def.paths.map((p) => {
            const open = sel?.kind === 'path' && sel.value === p.id;
            const verse = p.scripture ? resolveScripture(p.scripture) : null;
            return (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: open ? '#241f18' : '#1d1a16', outline: open ? '0.18rem solid #f4b740' : 'none' }}>
                <button onClick={() => setSel(open ? null : { kind: 'path', value: p.id })} className="w-full text-left">
                  <div className="text-lg font-semibold">{p.label}</div>
                  <p className="text-sm mt-1" style={{ color: '#d6d1c8' }}>{p.blurb}</p>
                </button>
                {open && (
                  <div className="mt-3">
                    {p.lens && <p className="text-sm italic flex gap-2" style={{ color: '#c4b5fd' }}><UiIcon name="dove" className="shrink-0" /> {p.lens}</p>}
                    {verse?.text && <p className="text-sm mt-2" style={{ color: '#86efac' }}><span className="font-semibold">{verse.ref}</span> — &ldquo;{verse.text}&rdquo;</p>}
                    <button onClick={() => send({ type: 'choose-path', playerId: myPlayer.id, pathId: p.id })} className="mt-3 w-full rounded-xl py-3 font-semibold" style={{ backgroundColor: '#f4b740', color: INK }}>
                      Walk the {p.label}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (actor.need === 'decide' && game.pending) {
    const pending = game.pending;
    const verse = pending.scripture ? resolveScripture(pending.scripture) : null;
    return (
      <div>
        <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#f4b740' }}>{pending.kind === 'card' ? 'A card from the community' : 'A crossroads'}</div>
        <h2 className="text-xl font-semibold mt-1">{pending.title}</h2>
        {pending.body && <p className="text-sm mt-1" style={{ color: '#d6d1c8' }}>{pending.body}</p>}
        {verse?.text && <p className="text-sm mt-2" style={{ color: '#86efac' }}><span className="font-semibold">{verse.ref}</span> — &ldquo;{verse.text}&rdquo;</p>}
        <div className="mt-4 space-y-2">
          {pending.choices.map((c, i) => {
            const open = sel?.kind === 'choice' && sel.value === i;
            return (
              <div key={i} className="rounded-2xl p-4" style={{ background: open ? '#241f18' : '#1d1a16', outline: open ? '0.18rem solid #f4b740' : 'none' }}>
                <button onClick={() => setSel(open ? null : { kind: 'choice', value: i })} className="w-full text-left">
                  <div className="font-semibold flex items-center gap-2">
                    {c.label}
                    {c.redemption && <span className="text-xs" style={{ color: '#f4b740' }}>· a second chance</span>}
                  </div>
                  {c.body && <p className="text-sm mt-1" style={{ color: '#d6d1c8' }}>{c.body}</p>}
                </button>
                {open && (
                  <div className="mt-2">
                    <EffectChips def={def} effects={c.effects} />
                    <button onClick={() => send({ type: 'decide', playerId: myPlayer.id, choiceIndex: i })} className="mt-3 w-full rounded-xl py-3 font-semibold" style={{ backgroundColor: '#f4b740', color: INK }}>
                      Choose this
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // need === 'spin'
  const totals = computeTotals(def, game);
  const space = game.pathId != null && game.position >= 0 ? boardFor(def, game.pathId)[game.position] : null;
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold">Your turn</h2>
      {space && <p className="text-sm mt-1" style={{ color: MUTE }}>You&rsquo;re at: <span style={{ color: CREAM }}>{space.title}</span></p>}
      <button onClick={onSpin} className="mt-6 mx-auto rounded-full h-44 w-44 flex flex-col items-center justify-center text-2xl font-bold" style={{ backgroundColor: '#f4b740', color: INK }}>
        <UiIcon name="dice" className="mb-1" />
        SPIN
      </button>
      <p className="mt-6 text-sm" style={{ color: MUTE }}>Your legacy so far</p>
      <div className="text-4xl font-bold" style={{ color: '#f4b740' }}>{totals.weighted}</div>
    </div>
  );
}

// ---- not my turn ------------------------------------------------------------
function WaitingTurn({ def, match, actor, myPlayer }) {
  const activeName = actor ? match.players.find((p) => p.id === actor.playerId)?.name : null;
  const totals = computeTotals(def, myPlayer.game);
  const rank = standings(def, match).findIndex((r) => r.id === myPlayer.id) + 1;
  return (
    <div className="text-center">
      <div className="rounded-2xl p-6" style={{ background: '#1d1a16' }}>
        {activeName ? (
          <>
            <div className="text-sm" style={{ color: MUTE }}>Now playing</div>
            <div className="text-2xl font-semibold mt-1">{activeName}</div>
            <p className="text-sm mt-2" style={{ color: MUTE }}>Watch the big screen — you&rsquo;re up soon.</p>
          </>
        ) : (
          <div className="text-lg" style={{ color: MUTE }}>Waiting for the next player…</div>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: '#1d1a16' }}>
          <div className="text-xs" style={{ color: MUTE }}>Your legacy</div>
          <div className="text-3xl font-bold" style={{ color: '#f4b740' }}>{totals.weighted}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1d1a16' }}>
          <div className="text-xs" style={{ color: MUTE }}>Your place</div>
          <div className="text-3xl font-bold">{rank > 0 ? `#${rank}` : '—'}</div>
        </div>
      </div>
      {myPlayer.done && <p className="mt-4 text-sm" style={{ color: '#86efac' }}>You&rsquo;ve finished your journey. Cheer the others home.</p>}
    </div>
  );
}

// ---- finished (self) --------------------------------------------------------
function FinishedSelf({ def, match, myId, isHost, onAgain }) {
  const ranks = standings(def, match);
  const mine = ranks.find((r) => r.id === myId);
  const myRank = ranks.findIndex((r) => r.id === myId) + 1;
  const lg = mine?.legacy;
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-[0.3em]" style={{ color: '#f4b740' }}>Your legacy</div>
      {lg && <h2 className="text-2xl font-semibold mt-1" style={{ fontFamily: 'Fraunces, serif' }}>{lg.tier}</h2>}
      {lg?.headline && <p className="text-sm mt-2" style={{ color: '#d6d1c8' }}>{lg.headline}</p>}
      <div className="mt-4 text-5xl font-bold" style={{ color: '#f4b740' }}>{mine?.weighted ?? 0}</div>
      <p className="text-sm mt-1" style={{ color: MUTE }}>Place #{myRank} of {ranks.length} — the full legacies are on the big screen.</p>
      {isHost && (
        <button onClick={onAgain} className="mt-6 w-full rounded-xl py-4 text-lg font-semibold" style={{ backgroundColor: '#f4b740', color: INK }}>
          Walk it again (same table)
        </button>
      )}
    </div>
  );
}
